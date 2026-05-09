import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    agent: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const skills = args.agent
      ? await ctx.db
          .query("skills")
          .withIndex("by_agent", (idx) => idx.eq("agent", args.agent))
          .collect()
      : args.activeOnly !== false
        ? await ctx.db
            .query("skills")
            .withIndex("by_active", (idx) => idx.eq("isActive", true))
            .collect()
        : await ctx.db.query("skills").collect();

    return skills.map((s) => ({
      _id: s._id,
      name: s.name,
      description: s.description,
      agent: s.agent,
      tags: s.tags,
      version: s.version,
      isActive: s.isActive,
    }));
  },
});

export const get = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.skillId);
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skills")
      .withIndex("by_name", (idx) => idx.eq("name", args.name))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    content: v.string(),
    agent: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_name", (idx) => idx.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Skill "${args.name}" already exists`);
    }

    return await ctx.db.insert("skills", {
      name: args.name,
      description: args.description,
      content: args.content,
      agent: args.agent,
      tags: args.tags,
      version: 1,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    skillId: v.id("skills"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    agent: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { skillId, ...updates } = args;
    const existing = await ctx.db.get(skillId);
    if (!existing) throw new Error("Skill not found");

    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined)
      patch.description = updates.description;
    if (updates.content !== undefined) {
      patch.content = updates.content;
      patch.version = existing.version + 1;
    }
    if (updates.agent !== undefined) patch.agent = updates.agent;
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.isActive !== undefined) patch.isActive = updates.isActive;

    await ctx.db.patch(skillId, patch);
    return { ...existing, ...patch };
  },
});

export const remove = mutation({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.skillId);
  },
});
