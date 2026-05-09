import { tool } from "ai";
import { z } from "zod";
import { api } from "../../convex/_generated/api";
import { getConvexClient } from "./convex-client";

export const listSkillsTool = tool({
  description:
    "List available skills. Returns name, description, and tags for each skill. " +
    "Use this to discover what skills are available before loading one.",
  inputSchema: z.object({
    agent: z
      .string()
      .optional()
      .describe("Filter skills by agent name (e.g. 'developer', 'designer')"),
  }),
  execute: async ({ agent }) => {
    const convex = getConvexClient();
    const skills = await convex.query(api.skills.list, {
      agent,
      activeOnly: true,
    });
    return skills.map((s) => ({
      id: s._id,
      name: s.name,
      description: s.description,
      tags: s.tags,
      agent: s.agent,
    }));
  },
});

export const loadSkillTool = tool({
  description:
    "Load a skill's full content by name. Returns the detailed instructions " +
    "and knowledge that the skill provides. Use after discovering skills with listSkills.",
  inputSchema: z.object({
    name: z.string().describe("The skill name to load"),
  }),
  execute: async ({ name }) => {
    const convex = getConvexClient();
    const skill = await convex.query(api.skills.getByName, { name });
    if (!skill) {
      return { error: `Skill "${name}" not found` };
    }
    return {
      name: skill.name,
      description: skill.description,
      content: skill.content,
      version: skill.version,
      tags: skill.tags,
    };
  },
});

export const createSkillTool = tool({
  description:
    "Create a new skill. A skill defines specialized knowledge or a workflow " +
    "that agents can discover and load at runtime. The content should be " +
    "markdown with clear instructions.",
  inputSchema: z.object({
    name: z.string().describe("Short identifier for the skill"),
    description: z
      .string()
      .describe("When to use this skill — shown during discovery"),
    content: z
      .string()
      .describe("Full markdown instructions for the skill"),
    agent: z
      .string()
      .optional()
      .describe("Agent this skill belongs to (e.g. 'developer', 'ceo')"),
    tags: z
      .array(z.string())
      .describe("Tags for categorization (e.g. ['coding', 'review'])"),
  }),
  execute: async ({ name, description, content, agent, tags }) => {
    const convex = getConvexClient();
    const id = await convex.mutation(api.skills.create, {
      name,
      description,
      content,
      agent,
      tags,
    });
    return { id, name, status: "created" };
  },
});

export const updateSkillTool = tool({
  description:
    "Update an existing skill's content, description, or metadata. " +
    "Automatically increments the version when content changes.",
  inputSchema: z.object({
    name: z.string().describe("Name of the skill to update"),
    description: z.string().optional().describe("New description"),
    content: z.string().optional().describe("New markdown content"),
    tags: z.array(z.string()).optional().describe("New tags"),
    isActive: z.boolean().optional().describe("Enable or disable the skill"),
  }),
  execute: async ({ name, description, content, tags, isActive }) => {
    const convex = getConvexClient();
    const skill = await convex.query(api.skills.getByName, { name });
    if (!skill) {
      return { error: `Skill "${name}" not found` };
    }

    const updates: Record<string, unknown> = { skillId: skill._id };
    if (description !== undefined) updates.description = description;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    if (isActive !== undefined) updates.isActive = isActive;

    const result = await convex.mutation(api.skills.update, updates as any);
    return { name, status: "updated", version: result.version };
  },
});

export const skillsTools = {
  listSkills: listSkillsTool,
  loadSkill: loadSkillTool,
  createSkill: createSkillTool,
  updateSkill: updateSkillTool,
};
