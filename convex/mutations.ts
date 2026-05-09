import { ConvexError, v } from "convex/values";
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

export const createTicket = mutation({
  args: {
    projectId: v.id("projects"),
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
    let depth = 0;
    if (args.parentTicket) {
      const parent = await ctx.db.get(args.parentTicket);
      if (!parent) throw new ConvexError("parent ticket not found");
      if (parent.projectId && parent.projectId !== args.projectId) {
        throw new ConvexError("sub-ticket project must match parent");
      }
      depth = (parent.depth ?? 0) + 1;
      if (depth > MAX_DEPTH) {
        throw new ConvexError(`sub-ticket depth ${depth} exceeds max ${MAX_DEPTH}`);
      }
    }

    return await ctx.db.insert("tickets", {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      assignee: args.assignee,
      tags: args.tags,
      createdBy: args.createdBy,
      taggedAgents: args.taggedAgents,
      parentTicket: args.parentTicket,
      depth,
    });
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
    const parent = await ctx.db.get(args.parentTicket);
    if (!parent) throw new ConvexError("parent ticket not found");
    const depth = (parent.depth ?? 0) + 1;
    if (depth > MAX_DEPTH) {
      throw new ConvexError(`sub-ticket depth ${depth} exceeds max ${MAX_DEPTH}`);
    }

    return await ctx.db.insert("tickets", {
      projectId: parent.projectId,
      title: args.title,
      description: args.description,
      status: "backlog",
      priority: args.priority,
      assignee: args.assignee,
      tags: args.tags ?? parent.tags,
      createdBy: args.createdBy,
      taggedAgents: args.taggedAgents ?? parent.taggedAgents,
      parentTicket: args.parentTicket,
      depth,
    });
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

    if (ticket.assignee && ticket.assignee !== args.assignee) {
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

    if (args.assignee) {
      const next = await ctx.db
        .query("agentConfig")
        .withIndex("by_agentId", (q) => q.eq("agentId", args.assignee as string))
        .first();
      if (next) {
        if (
          !next.currentTicketIds.includes(args.ticketId) &&
          next.currentTicketIds.length >= next.maxActiveTickets
        ) {
          throw new ConvexError(
            `agent ${args.assignee} at active ticket cap (${next.maxActiveTickets})`
          );
        }
        if (!next.currentTicketIds.includes(args.ticketId)) {
          await ctx.db.patch(next._id, {
            currentTicketIds: [...next.currentTicketIds, args.ticketId],
          });
        }
      }

      await ctx.scheduler.runAfter(0, internal.dispatch.dispatchAgent, {
        ticketId: args.ticketId,
        agentRole: args.assignee,
        projectId: ticket.projectId,
      });
    }

    await ctx.db.patch(args.ticketId, { assignee: args.assignee });
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
      .withIndex("by_agentId", (q) => q.eq("agentId", args.assignee))
      .first();
    if (next && !next.currentTicketIds.includes(args.ticketId)) {
      await ctx.db.patch(next._id, {
        currentTicketIds: [...next.currentTicketIds, args.ticketId],
      });
    }

    await ctx.db.patch(args.ticketId, {
      assignee: args.assignee,
      escalatedTo: args.escalatedTo,
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
