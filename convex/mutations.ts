import { ConvexError, v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
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

  const ticketDoc = await ctx.db.get(ticketId as Id<"tickets">);
  if (ticketDoc?.dependsOn && ticketDoc.dependsOn.length > 0) {
    const deps = await Promise.all(ticketDoc.dependsOn.map((depId: Id<"tickets">) => ctx.db.get(depId)));
    const unresolved = deps.filter((d) => d && d.status !== "resolved");
    if (unresolved.length > 0) {
      await ctx.db.insert("agentLogs", {
        agent: nextAssignee,
        action: "dispatch_waiting",
        details: `Waiting on ${unresolved.length} dependency ticket(s) to resolve before dispatch`,
        ticketId,
        projectId: ticketDoc.projectId,
      });
      return;
    }
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
    vercelProjectId: v.optional(v.string()),
    vercelTeamId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    if (fields.githubRepo !== undefined) patch.githubRepo = fields.githubRepo;
    if (fields.githubOwner !== undefined) patch.githubOwner = fields.githubOwner;
    if (fields.description !== undefined) patch.description = fields.description;
    if (fields.vercelProjectId !== undefined) patch.vercelProjectId = fields.vercelProjectId;
    if (fields.vercelTeamId !== undefined) patch.vercelTeamId = fields.vercelTeamId;
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
    assignee: v.string(),
    tags: v.array(v.string()),
    createdBy: v.string(),
    taggedAgents: v.array(v.string()),
    parentTicket: v.optional(v.id("tickets")),
    dependsOn: v.optional(v.array(v.id("tickets"))),
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
      dependsOn: args.dependsOn,
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
    assignee: v.string(),
    createdBy: v.string(),
    tags: v.optional(v.array(v.string())),
    taggedAgents: v.optional(v.array(v.string())),
    dependsOn: v.optional(v.array(v.id("tickets"))),
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
      dependsOn: args.dependsOn,
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

    // When a ticket is resolved, check if any dependent tickets are now unblocked
    if (args.status === "resolved") {
      const allTickets = ticket.projectId
        ? await ctx.db
            .query("tickets")
            .withIndex("by_project_status", (q) => q.eq("projectId", ticket.projectId!))
            .collect()
        : await ctx.db.query("tickets").collect();

      for (const dependent of allTickets) {
        if (!dependent.dependsOn || !dependent.dependsOn.includes(args.ticketId)) continue;
        if (!dependent.assignee) continue;
        if (dependent.dispatchStatus === "running" || dependent.dispatchStatus === "completed") continue;

        const deps = await Promise.all(dependent.dependsOn.map((depId) => ctx.db.get(depId)));
        const unresolved = deps.filter((d) => d && d._id !== args.ticketId && d.status !== "resolved");
        if (unresolved.length > 0) continue;

        await ctx.db.insert("agentLogs", {
          agent: dependent.assignee,
          action: "dependency_unblocked",
          details: `All dependencies resolved — dispatching`,
          ticketId: dependent._id,
          projectId: dependent.projectId,
        });

        if (dependent.assignee === "ceo") continue;

        await ctx.db.patch(dependent._id, {
          dispatchStatus: "pending",
        });

        await ctx.scheduler.runAfter(0, internal.dispatch.dispatchAgent, {
          ticketId: dependent._id,
          agentRole: dependent.assignee,
          attempt: 0,
        });
      }
    }
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

export const storeSandboxId = mutation({
  args: {
    ticketId: v.id("tickets"),
    sandboxId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return;
    await ctx.db.patch(args.ticketId, {
      sandboxId: args.sandboxId ?? undefined,
    });
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

export const addDependency = mutation({
  args: {
    ticketId: v.id("tickets"),
    dependsOnTicketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    if (args.ticketId === args.dependsOnTicketId) {
      throw new ConvexError("a ticket cannot depend on itself");
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");

    const dep = await ctx.db.get(args.dependsOnTicketId);
    if (!dep) throw new ConvexError("dependency ticket not found");

    const current = ticket.dependsOn ?? [];
    if (current.includes(args.dependsOnTicketId)) {
      return { ok: true, alreadyExists: true };
    }

    // Prevent circular dependencies (simple check: dep can't already depend on this ticket)
    const depDeps = dep.dependsOn ?? [];
    if (depDeps.includes(args.ticketId)) {
      throw new ConvexError("circular dependency detected");
    }

    await ctx.db.patch(args.ticketId, {
      dependsOn: [...current, args.dependsOnTicketId],
    });

    await ctx.db.insert("agentLogs", {
      agent: "system",
      action: "dependency_added",
      details: `Now depends on ticket ${args.dependsOnTicketId}`,
      ticketId: args.ticketId,
      projectId: ticket.projectId,
    });

    return { ok: true };
  },
});

export const removeDependency = mutation({
  args: {
    ticketId: v.id("tickets"),
    dependsOnTicketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");

    const current = ticket.dependsOn ?? [];
    await ctx.db.patch(args.ticketId, {
      dependsOn: current.filter((id) => id !== args.dependsOnTicketId),
    });

    return { ok: true };
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

const MENTION_REGEX = /(?:^|[^\w])@([\w-]+)/g;
const WIRED_MENTION_AGENTS = new Set([
  "cto",
  "cmo",
  "developer",
  "designer",
  "marketing",
]);

function parseMentions(content: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(content)) !== null) {
    found.add(match[1].toLowerCase());
  }
  return Array.from(found);
}

export const addComment = mutation({
  args: {
    ticketId: v.id("tickets"),
    author: v.string(),
    content: v.string(),
    mentions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new ConvexError("ticket not found");

    const candidates = new Set<string>([
      ...(args.mentions ?? []).map((m) => m.toLowerCase()),
      ...parseMentions(args.content),
    ]);

    const validMentions: string[] = [];
    for (const candidate of candidates) {
      const config = await ctx.db
        .query("agentConfig")
        .withIndex("by_agentId", (q) => q.eq("agentId", candidate))
        .first();
      if (config) validMentions.push(candidate);
    }

    const commentId = await ctx.db.insert("comments", {
      projectId: ticket.projectId,
      ticketId: args.ticketId,
      author: args.author,
      content: args.content,
      mentions: validMentions.length > 0 ? validMentions : undefined,
    });

    for (const agentId of validMentions) {
      await ctx.db.insert("agentLogs", {
        projectId: ticket.projectId,
        agent: agentId,
        action: "mentioned",
        details: `Mentioned by ${args.author} in a comment`,
        ticketId: args.ticketId,
      });

      if (agentId === "ceo") continue;
      if (!WIRED_MENTION_AGENTS.has(agentId)) continue;

      await ctx.db.patch(args.ticketId, {
        workflowRunId: undefined,
        dispatchStatus: "pending",
        dispatchErrorDetail: undefined,
      });

      await ctx.scheduler.runAfter(0, internal.dispatch.dispatchAgent, {
        ticketId: args.ticketId,
        agentRole: agentId,
        attempt: 0,
        triggerComment: args.content,
      });
    }

    return commentId;
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

export const createDeliverable = mutation({
  args: {
    projectId: v.id("projects"),
    ticketId: v.optional(v.id("tickets")),
    title: v.string(),
    body: v.string(),
    category: v.union(
      v.literal("plan"),
      v.literal("analysis"),
      v.literal("report"),
      v.literal("strategy"),
      v.literal("brief"),
      v.literal("spec"),
      v.literal("other")
    ),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("deliverables", {
      projectId: args.projectId,
      ticketId: args.ticketId,
      title: args.title,
      body: args.body,
      category: args.category,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("agentLogs", {
      projectId: args.projectId,
      agent: args.createdBy,
      action: "create_deliverable",
      details: `Saved deliverable: ${args.title} [${args.category}]`,
      ticketId: args.ticketId,
    });

    return id;
  },
});

export const updateDeliverable = mutation({
  args: {
    deliverableId: v.id("deliverables"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("plan"),
        v.literal("analysis"),
        v.literal("report"),
        v.literal("strategy"),
        v.literal("brief"),
        v.literal("spec"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { deliverableId, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (fields.title !== undefined) patch.title = fields.title;
    if (fields.body !== undefined) patch.body = fields.body;
    if (fields.category !== undefined) patch.category = fields.category;
    await ctx.db.patch(deliverableId, patch);
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
