import { query } from "./_generated/server";
import { v } from "convex/values";

export const listThreads = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("ceoChatThreads")
      .withIndex("by_project_updated", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const getMessages = query({
  args: { threadId: v.id("ceoChatThreads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ceoChatMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();
  },
});
