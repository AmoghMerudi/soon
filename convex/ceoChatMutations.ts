import { mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const createThread = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("ceoChatThreads", {
      projectId: args.projectId,
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
    messageId: v.string(),
    role: v.string(),
    serialized: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new ConvexError("thread not found");
    const now = Date.now();
    await ctx.db.insert("ceoChatMessages", {
      projectId: thread.projectId,
      threadId: args.threadId,
      messageId: args.messageId,
      role: args.role,
      serialized: args.serialized,
      createdAt: now,
    });

    let preview = "";
    try {
      const msg = JSON.parse(args.serialized);
      preview = (msg.parts ?? [])
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { text: string }) => p.text)
        .join(" ");
    } catch {
      // ignore parse errors
    }
    if (preview.length > 100) preview = preview.slice(0, 100) + "...";

    await ctx.db.patch(args.threadId, {
      preview: preview || "…",
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
