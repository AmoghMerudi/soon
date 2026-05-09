import { ConvexError, v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const MAX_DEPTH = 3;

const statusValidator = v.union(
  v.literal("backlog"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("resolved"),
  v.literal("blocked")
);

const priorityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

const dispatchStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed")
);

function normalizeAssignee(assignee: string | null): string | null {
  return assignee?.toLowerCase() ?? null;
}

async function syncAssigneeState(
  ctx: MutationCtx,
  ticketId: any,
  previousAssignee: string | null,
  nextAssignee: string | null
) {
  if (previousAssignee && previousAssignee !== nextAssignee) {
    const prev = await ctx.db
      .query("agentConfig")
      .withIndex("by_agentId", (q) => q.eq("agentId", previousAssignee))
      .first();
    if (prev) {
      await ctx.db.patch(prev._id, {
        currentTicketIds: prev.currentTicketIds.filter((id) => id !== ticketId),
      });
    }
  }

  if (!nextAssignee) return;

  const next = await ctx.db
    .query("agentConfig")
    .withIndex("by_agentId", (q) => q.eq("agentId", nextAssignee))
    .first();
  if (next) {
    if (
      !next.currentTicketIds.includes(ticketId) &&
      next.currentTicketIds.length >= next.maxActiveTickets
    ) {
      throw new ConvexError(
        `agent ${nextAssignee} at active ticket cap (${next.maxActiveTickets})`
      );
    }
    if (!next.currentTicketIds.includes(ticketId)) {
      await ctx.db.patch(next._id, {
        currentTicketIds: [...next.currentTicketIds, ticketId],
      });
    }
  }

  if (nextAssignee === "ceo") {
    await ctx.db.insert("agentLogs", {
      agent: "CEO",
      action: "dispatch_pending",
      details: "CEO assignment — trigger via chat at /dashboard/ceo-chat",
      ticketId,
    });
    return;
  }

  await ctx.scheduler.runAfter(0, internal.dispatch.dispatchAgent, {
    ticketId,
    agentRole: nextAssignee,
    attempt: 0,
  });
}

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    githubRepo: v.optional(v.string()),
    githubOwner: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    if (fields.githubRepo !== undefined) patch.githubRepo = fields.githubRepo;
    if (fields.githubOwner !== undefined) patch.githubOwner = fields.githubOwner;
    if (fields.description !== undefined) patch.description = fields.description;
    await ctx.db.patch(projectId, patch);
  },
});

export const createTicket = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    description: v.string(),
    status: statusValidator,
    priority: priorityValidator,
    assignee: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
    createdBy: v.string(),
    taggedAgents: v.array(v.string()),
    parentTicket: v.optional(v.id("tickets")),
  },
  handler: async (ctx, args) => {
    const assignee = normalizeAssignee(args.assignee);
    let depth = 0;
    let projectId = args.projectId;
    if (args.parentTicket) {
      const parent = await ctx.db.get(args.parentTicket);
      if (!parent) throw new ConvexError("parent ticket not found");
      // Inherit projectId from parent if not explicitly provided
      if (!projectId && parent.projectId) projectId = parent.projectId;
      depth = (parent.depth ?? 0) + 1;
      if (depth > MAX_DEPTH) {
        throw new ConvexError(`sub-ticket depth ${depth} exceeds max ${MAX_DEPTH}`);
      }
    }

    const ticketId = await ctx.db.insert("tickets", {
      projectId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      assignee,
      tags: args.tags,
      createdBy: args.createdBy,
      taggedAgents: args.taggedAgents,
      parentTicket: args.parentTicket,
      depth,
      dispatchStatus: assignee ? "pending" : undefined,
    });

    await syncAssigneeState(ctx, ticketId, null, assignee);

    return ticketId;
  },
});

export const createSubTicket = mutation({
  args: {
    parentTicket: v.id("tickets"),
    title: v.string(),
    description: v.string(),
    priority: priorityValidator,
    assignee: v.union(v.string(), v.null()),
    createdBy: v.string(),
    tags: v.optional(v.array(v.string())),
    taggedAgents: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const assignee = normalizeAssignee(args.assignee);
    const parent = await ctx.db.get(args.parentTicket);
    if (!parent) throw new ConvexError("parent ticket not found");
    const depth = (parent.depth ?? 0) + 1;
    if (depth > MAX_DEPTH) {
      throw new ConvexError(`sub-ticket depth ${depth} exceeds max ${MAX_DEPTH}`);
    }

    const ticketId = await ctx.db.insert("tickets", {
      projectId: parent.projectId,
      title: args.title,
      description: args.description,
      status: "backlog",
      priority: args.priority,
      assignee,
      tags: args.tags ?? parent.tags,
      createdBy: args.createdBy,
      taggedAgents: args.taggedAgents ?? parent.taggedAgents,
      parentTicket: args.parentTicket,
      depth,
      dispatchStatus: assignee ? "pending" : undefined,
    });

    await syncAssigneeState(ctx, ticketId, null, assignee);

    return ticketId;
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: statusValidator,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");

    const patch: Record<string, unknown> = { status: args.status };

    if (args.status === "blocked") {
      patch.blockedAt = Date.now();
      if (args.reason) patch.blockedReason = args.reason;
    } else if (ticket.status === "blocked") {
      patch.blockedAt = undefined;
      patch.blockedReason = undefined;
    }

    if (args.status === "resolved" && ticket.assignee) {
      const config = await ctx.db
        .query("agentConfig")
        .withIndex("by_agentId", (q) => q.eq("agentId", ticket.assignee as string))
        .first();
      if (config) {
        await ctx.db.patch(config._id, {
          currentTicketIds: config.currentTicketIds.filter(
            (id) => id !== args.ticketId
          ),
        });
      }
    }

    await ctx.db.patch(args.ticketId, patch);
  },
});

export const markBlocked = mutation({
  args: {
    ticketId: v.id("tickets"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      status: "blocked",
      blockedAt: Date.now(),
      blockedReason: args.reason,
    });
  },
});

export const assignTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    assignee: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");

    const assignee = normalizeAssignee(args.assignee);

    await syncAssigneeState(ctx, args.ticketId, ticket.assignee ?? null, assignee);

    await ctx.db.patch(args.ticketId, {
      assignee,
      workflowRunId: undefined,
      dispatchStatus: assignee ? "pending" : undefined,
      dispatchErrorDetail: undefined,
    });
  },
});

export const storeWorkflowRun = mutation({
  args: {
    ticketId: v.id("tickets"),
    runId: v.optional(v.string()),
    dispatchStatus: v.optional(dispatchStatusValidator),
    errorDetail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");

    const nextStatus = args.dispatchStatus ?? (args.runId ? "running" : undefined);
    const patch: Record<string, unknown> = {};

    if (args.runId !== undefined) {
      patch.workflowRunId = args.runId;
    }

    if (nextStatus !== undefined) {
      patch.dispatchStatus = nextStatus;
      if (nextStatus !== "failed" && args.errorDetail === undefined) {
        patch.dispatchErrorDetail = undefined;
      }
    }

    if (args.errorDetail !== undefined) {
      patch.dispatchErrorDetail = args.errorDetail.slice(0, 500);
    }

    await ctx.db.patch(args.ticketId, patch);
  },
});

export const _storeWorkflowRunInternal = internalMutation({
  args: {
    ticketId: v.id("tickets"),
    runId: v.optional(v.string()),
    dispatchStatus: v.optional(dispatchStatusValidator),
    errorDetail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");

    const nextStatus = args.dispatchStatus ?? (args.runId ? "running" : undefined);
    const patch: Record<string, unknown> = {};

    if (args.runId !== undefined) {
      patch.workflowRunId = args.runId;
    }

    if (nextStatus !== undefined) {
      patch.dispatchStatus = nextStatus;
      if (nextStatus !== "failed" && args.errorDetail === undefined) {
        patch.dispatchErrorDetail = undefined;
      }
    }

    if (args.errorDetail !== undefined) {
      patch.dispatchErrorDetail = args.errorDetail.slice(0, 500);
    }

    await ctx.db.patch(args.ticketId, patch);
  },
});

export const retryDispatch = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");
    if (!ticket.assignee) throw new ConvexError("ticket is not assigned");

    const assignee = ticket.assignee.toLowerCase();

    await ctx.db.patch(args.ticketId, {
      workflowRunId: undefined,
      dispatchStatus: "pending",
      dispatchErrorDetail: undefined,
    });

    if (assignee === "ceo") {
      await ctx.db.insert("agentLogs", {
        agent: "CEO",
        action: "dispatch_pending",
        details: "CEO assignment — trigger via chat at /dashboard/ceo-chat",
        ticketId: args.ticketId,
        projectId: ticket.projectId,
      });
      return { status: "pending", via: "ceo_chat" as const };
    }

    await ctx.scheduler.runAfter(0, internal.dispatch.dispatchAgent, {
      ticketId: args.ticketId,
      agentRole: assignee,
      attempt: 0,
    });

    return { status: "pending", via: "dispatch" as const };
  },
});

export const reassignTicketInternal = internalMutation({
  args: {
    ticketId: v.id("tickets"),
    assignee: v.string(),
    escalatedTo: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return;

    const assignee = args.assignee.toLowerCase();

    if (ticket.assignee) {
      const prev = await ctx.db
        .query("agentConfig")
        .withIndex("by_agentId", (q) => q.eq("agentId", ticket.assignee as string))
        .first();
      if (prev) {
        await ctx.db.patch(prev._id, {
          currentTicketIds: prev.currentTicketIds.filter(
            (id) => id !== args.ticketId
          ),
        });
      }
    }

    const next = await ctx.db
      .query("agentConfig")
      .withIndex("by_agentId", (q) => q.eq("agentId", assignee))
      .first();
    if (next && !next.currentTicketIds.includes(args.ticketId)) {
      await ctx.db.patch(next._id, {
        currentTicketIds: [...next.currentTicketIds, args.ticketId],
      });
    }

    await ctx.db.patch(args.ticketId, {
      assignee,
      escalatedTo: args.escalatedTo,
      workflowRunId: undefined,
      dispatchStatus: assignee === "ceo" ? "pending" : undefined,
      dispatchErrorDetail: undefined,
    });
  },
});

export const addComment = mutation({
  args: {
    ticketId: v.id("tickets"),
    author: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");
    return await ctx.db.insert("comments", {
      projectId: ticket.projectId,
      ticketId: args.ticketId,
      author: args.author,
      content: args.content,
    });
  },
});

export const addArtifact = mutation({
  args: {
    ticketId: v.id("tickets"),
    type: v.union(
      v.literal("pr"),
      v.literal("design"),
      v.literal("deployment"),
      v.literal("document"),
      v.literal("image"),
      v.literal("other")
    ),
    url: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");
    return await ctx.db.insert("artifacts", {
      projectId: ticket.projectId,
      ticketId: args.ticketId,
      type: args.type,
      url: args.url,
      description: args.description,
    });
  },
});

export const reviewArtifact = mutation({
  args: {
    artifactId: v.id("artifacts"),
    reviewer: v.string(),
    decision: v.union(v.literal("approve"), v.literal("request_changes")),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const artifact = await ctx.db.get(args.artifactId);
    if (!artifact) throw new ConvexError("artifact not found");

    if (args.comment) {
      await ctx.db.insert("comments", {
        projectId: artifact.projectId,
        ticketId: artifact.ticketId,
        author: args.reviewer,
        content: `[${args.decision}] ${args.comment}`,
      });
    }

    if (args.decision === "approve") {
      await ctx.db.patch(artifact.ticketId, { status: "resolved" });
    } else {
      await ctx.db.patch(artifact.ticketId, { status: "in_progress" });
    }
  },
});

export const logAgentAction = mutation({
  args: {
    agent: v.string(),
    action: v.string(),
    details: v.string(),
    ticketId: v.optional(v.id("tickets")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    let projectId = args.projectId;
    if (!projectId && args.ticketId) {
      const ticket = await ctx.db.get(args.ticketId);
      projectId = ticket?.projectId;
    }
    return await ctx.db.insert("agentLogs", {
      projectId,
      agent: args.agent,
      action: args.action,
      details: args.details,
      ticketId: args.ticketId,
    });
  },
});

export const _logAgentActionInternal = internalMutation({
  args: {
    agent: v.string(),
    action: v.string(),
    details: v.string(),
    ticketId: v.optional(v.id("tickets")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    let projectId = args.projectId;
    if (!projectId && args.ticketId) {
      const ticket = await ctx.db.get(args.ticketId);
      projectId = ticket?.projectId;
    }
    return await ctx.db.insert("agentLogs", {
      projectId,
      agent: args.agent,
      action: args.action,
      details: args.details,
      ticketId: args.ticketId,
    });
  },
});
