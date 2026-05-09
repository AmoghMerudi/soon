import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createThread = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("ceoChatThreads", {
      title: args.title,
      preview: "",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("ceoChatThreads") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("ceoChatMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.threadId);
  },
});

export const saveMessage = mutation({
  args: {
    threadId: v.id("ceoChatThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("ceoChatMessages", {
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      createdAt: now,
    });
    const preview =
      args.content.length > 100
        ? args.content.slice(0, 100) + "..."
        : args.content;
    await ctx.db.patch(args.threadId, {
      preview,
      updatedAt: now,
    });
  },
});

export const updateThreadTitle = mutation({
  args: {
    threadId: v.id("ceoChatThreads"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, { title: args.title });
  },
});
