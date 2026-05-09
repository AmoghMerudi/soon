import { ToolLoopAgent } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { skillsTools } from "./skills-tools";
import { getConvexClient } from "./convex-client";
import { api } from "../../convex/_generated/api";

async function buildSkillsPrompt(): Promise<string> {
  const convex = getConvexClient();
  const skills = await convex.query(api.skills.list, { activeOnly: true });

  if (skills.length === 0) {
    return `## Skills

No skills are available yet. You can create new skills using the createSkill tool.
Skills are specialized knowledge and workflows that agents can discover and load at runtime.`;
  }

  const skillsList = skills
    .map((s) => `- **${s.name}**: ${s.description}${s.agent ? ` (agent: ${s.agent})` : ""}`)
    .join("\n");

  return `## Skills

Use the \`loadSkill\` tool to load a skill when the task would benefit from specialized instructions.
Use \`listSkills\` to refresh the list or filter by agent.

Available skills:
${skillsList}`;
}

export async function createSkillsAgent() {
  const skillsPrompt = await buildSkillsPrompt();

  return new ToolLoopAgent({
    model: anthropic("claude-sonnet-4-20250514"),
    instructions: `You are an AI agent operating within the "Soon" platform — an AI company operating system.

You have access to a skills sandbox powered by Convex. Skills are specialized knowledge
and workflows stored in the database that you can discover, load, create, and update.

When a user asks you to do something:
1. Check if a relevant skill exists using listSkills
2. Load it with loadSkill to get detailed instructions
3. Follow those instructions to complete the task
4. If no skill exists for a common task, offer to create one

${skillsPrompt}`,
    tools: skillsTools,
  });
}
