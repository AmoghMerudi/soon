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
