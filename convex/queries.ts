import { query } from "./_generated/server";
import { v } from "convex/values";

export const getTicket = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticketId);
  },
});

export const getTicketsByStatus = query({
  args: {
    status: v.union(
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("resolved"),
      v.literal("blocked")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("asc")
      .collect();
  },
});

export const getTicketsByAssignee = query({
  args: {
    assignee: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_assignee", (q) => q.eq("assignee", args.assignee))
      .order("asc")
      .collect();
  },
});

export const getTicketComments = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();
  },
});

export const getTicketArtifacts = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artifacts")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();
  },
});

export const getAgentLogs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("agentLogs")
      .order("desc")
      .take(50);
  },
});
