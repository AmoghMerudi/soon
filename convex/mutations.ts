import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createTicket = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("resolved"),
      v.literal("blocked")
    ),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    assignee: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
    createdBy: v.string(),
    taggedAgents: v.array(v.string()),
    parentTicket: v.optional(v.id("tickets")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tickets", {
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      assignee: args.assignee,
      tags: args.tags,
      createdBy: args.createdBy,
      taggedAgents: args.taggedAgents,
      parentTicket: args.parentTicket,
    });
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("resolved"),
      v.literal("blocked")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, { status: args.status });
  },
});

export const assignTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    assignee: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, { assignee: args.assignee });
  },
});

export const addComment = mutation({
  args: {
    ticketId: v.id("tickets"),
    author: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("comments", {
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
    return await ctx.db.insert("artifacts", {
      ticketId: args.ticketId,
      type: args.type,
      url: args.url,
      description: args.description,
    });
  },
});

export const logAgentAction = mutation({
  args: {
    agent: v.string(),
    action: v.string(),
    details: v.string(),
    ticketId: v.optional(v.id("tickets")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentLogs", {
      agent: args.agent,
      action: args.action,
      details: args.details,
      ticketId: args.ticketId,
    });
  },
});
