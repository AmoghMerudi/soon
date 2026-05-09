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

    return { ticket, parent, subtickets, comments, artifacts, logs };
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

export const getAgentConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agentConfig").collect();
  },
});
