import { query } from "./_generated/server";
import { v } from "convex/values";

const statusValidator = v.union(
  v.literal("backlog"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("resolved"),
  v.literal("blocked")
);

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

export const getTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticketId);
  },
});

export const getTicketsByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", args.status)
      )
      .order("asc")
      .collect();
  },
});

export const getTicketsByAssignee = query({
  args: {
    projectId: v.optional(v.id("projects")),
    assignee: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.projectId) {
      return await ctx.db
        .query("tickets")
        .withIndex("by_project_assignee", (q) =>
          q.eq("projectId", args.projectId!).eq("assignee", args.assignee)
        )
        .order("asc")
        .collect();
    }
    return await ctx.db
      .query("tickets")
      .withIndex("by_assignee", (q) => q.eq("assignee", args.assignee))
      .order("asc")
      .collect();
  },
});

export const getTicketsByTag = query({
  args: {
    projectId: v.optional(v.id("projects")),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const all = args.projectId
      ? await ctx.db
          .query("tickets")
          .withIndex("by_project_status", (q) => q.eq("projectId", args.projectId!))
          .collect()
      : await ctx.db.query("tickets").collect();
    return all.filter((t) => t.tags.includes(args.tag));
  },
});

export const getTicketComments = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();
  },
});

export const getTicketArtifacts = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artifacts")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();
  },
});

export const getTicketDetails = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;

    const [parent, subtickets, comments, artifacts, logs] = await Promise.all([
      ticket.parentTicket ? ctx.db.get(ticket.parentTicket) : Promise.resolve(null),
      ctx.db
        .query("tickets")
        .withIndex("by_parent", (q) => q.eq("parentTicket", args.ticketId))
        .collect(),
      ctx.db
        .query("comments")
        .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
        .order("asc")
        .collect(),
      ctx.db
        .query("artifacts")
        .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
        .collect(),
      ctx.db
        .query("agentLogs")
        .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
        .order("desc")
        .collect(),
    ]);

    const dependencyTickets = ticket.dependsOn
      ? await Promise.all(
          ticket.dependsOn.map(async (depId) => {
            const dep = await ctx.db.get(depId);
            return dep ? { _id: dep._id, title: dep.title, status: dep.status } : null;
          })
        )
      : [];

    // Find tickets that depend on THIS ticket
    const allProjectTickets = ticket.projectId
      ? await ctx.db
          .query("tickets")
          .withIndex("by_project_status", (q) => q.eq("projectId", ticket.projectId!))
          .collect()
      : [];
    const dependentTickets = allProjectTickets
      .filter((t) => t.dependsOn?.includes(args.ticketId))
      .map((t) => ({ _id: t._id, title: t.title, status: t.status }));

    return { ticket, parent, subtickets, comments, artifacts, logs, dependencyTickets, dependentTickets };
  },
});

export const getTicketDependencies = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return { dependsOn: [], dependedOnBy: [] };

    const dependsOn = ticket.dependsOn
      ? (await Promise.all(
          ticket.dependsOn.map(async (depId) => {
            const dep = await ctx.db.get(depId);
            return dep ? { _id: dep._id, title: dep.title, status: dep.status } : null;
          })
        )).filter(Boolean)
      : [];

    const allProjectTickets = ticket.projectId
      ? await ctx.db
          .query("tickets")
          .withIndex("by_project_status", (q) => q.eq("projectId", ticket.projectId!))
          .collect()
      : [];
    const dependedOnBy = allProjectTickets
      .filter((t) => t.dependsOn?.includes(args.ticketId))
      .map((t) => ({ _id: t._id, title: t.title, status: t.status }));

    return { dependsOn, dependedOnBy };
  },
});

export const getAgentLogs = query({
  args: { projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => {
    if (args.projectId) {
      return await ctx.db
        .query("agentLogs")
        .withIndex("by_project_ticket", (q) =>
          q.eq("projectId", args.projectId)
        )
        .order("desc")
        .take(50);
    }
    return await ctx.db.query("agentLogs").order("desc").take(50);
  },
});

export const getAgentLogsByTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentLogs")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();
  },
});

export const getDeliverables = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deliverables")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const getDeliverable = query({
  args: { deliverableId: v.id("deliverables") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deliverableId);
  },
});

export const getDeliverablesByTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deliverables")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();
  },
});

export const getAgentConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agentConfig").collect();
  },
});

export const getRecentMentionsByProject = query({
  args: {
    projectId: v.id("projects"),
    sinceTs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 40, 200));
    const sinceTs = args.sinceTs ?? 0;

    // Pull recent comments scoped to the project, filter to those with mentions
    // and authored after `sinceTs`. Returns newest-first.
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_project_ticket", (q) => q.eq("projectId", args.projectId))
      .collect();

    return comments
      .filter(
        (c) =>
          c._creationTime > sinceTs &&
          c.mentions !== undefined &&
          c.mentions.length > 0,
      )
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, limit)
      .map((c) => ({
        _id: c._id,
        ticketId: c.ticketId,
        author: c.author,
        mentions: c.mentions ?? [],
        createdAt: c._creationTime,
      }));
  },
});
