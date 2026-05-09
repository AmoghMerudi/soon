import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db.get(projectId);
  },
});

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim()) throw new ConvexError("project name required");
    return await ctx.db.insert("projects", {
      name: args.name.trim(),
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

export const setStripeApiKey = mutation({
  args: {
    projectId: v.id("projects"),
    apiKey: v.string(),
  },
  handler: async (ctx, { projectId, apiKey }) => {
    const trimmed = apiKey.trim();
    if (!trimmed) throw new ConvexError("Stripe API key required");
    const project = await ctx.db.get(projectId);
    if (!project) throw new ConvexError("project not found");
    await ctx.db.patch(projectId, { stripeApiKey: trimmed });
    return { ok: true };
  },
});

export const clearStripeApiKey = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new ConvexError("project not found");
    await ctx.db.patch(projectId, { stripeApiKey: undefined });
    return { ok: true };
  },
});
