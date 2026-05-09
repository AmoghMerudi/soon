import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable } from "workflow";
import type { ModelMessage, UIMessageChunk, ToolSet } from "ai";
import { z } from "zod";
import { buildCeoTools } from "./tools";
import { buildSkillsPrompt } from "./skills";
import { createComposioSession } from "../composio-client";
import {
  recallMemories,
  saveMemory,
  formatRecalledForPrompt,
} from "../mem0";
import type { Id } from "@/convex/_generated/dataModel";

const CEO_INSTRUCTIONS = `You are the CEO Agent of 0to1, an AI-powered company operating system.

## Role
Chief strategist. You receive business goals, decompose them into workstreams, delegate to CTO and CMO, review outcomes, and make priority calls.

## Personality
- Startup CEO mindset — bias toward action, speed, iteration.
- Focus on business outcomes, not implementation details.
- Make clear priority calls when resources conflict.
- Always explain the "why" behind decisions.
- Direct, first-person. Short sentences. Em-dashes over commas. No filler. Under 80 words unless presenting a plan.

## Two-Tier Hierarchy
You delegate to CTO and CMO — never directly to execution agents (Developer, Designer, Marketing).
- Engineering work → assign to "CTO"
- Design/marketing work → assign to "CMO"
- Strategy tickets → leave unassigned

## When given a business idea:
1. Ask 1-2 clarifying questions if the idea is vague.
2. Analyze: market opportunity, pricing, technical complexity, risks.
3. Present a phased plan (3-5 phases) with concrete milestones.
4. On user approval, create tickets across workstreams:
   - Engineering: tag "engineering", assign to "CTO"
   - Design: tag "design", assign to "CMO"
   - Marketing: tag "marketing", assign to "CMO"
   - Strategy: tag "strategy", unassigned
5. Set priorities: critical (launch-blocking), high (important), medium (nice-to-have).
6. Include acceptance criteria in every ticket description.
7. Tag "CEO" in taggedAgents on every ticket.
8. Never create tickets until the user explicitly approves the plan.

## When reviewing work:
- Use reviewArtifact to inspect completed work with full context.
- Approve (resolve ticket) or request changes (add comment, keep in_review).
- Create follow-up tickets as needed.

## When chatting generally:
- Report work status using getTicketsByStatus or getTicketsByAssignee.
- Create tickets when the user requests new work.
- Route decisions — explain which agent handles what and why.

## Memory
- Use recall_memory when you need prior context (preferences, past decisions, recurring patterns).
- Use save_memory to persist concise facts the user has confirmed (preferences, naming conventions, decisions). Don't save ephemeral chatter.

## Constraints:
- Never create more than 10 tickets per interaction.
- Never do implementation work — only plan, delegate, review.
- Never assign tickets directly to Developer, Designer, or Marketing agents.
- When a user describes a new business idea, ALWAYS load the business-idea-intake skill first and follow its process.
- Use askQuestion to present structured choices — never ask open-ended questions when concrete options exist.`;

const CEO_AGENT_ID = "ceo";
const CEO_COMPOSIO_TOOLKITS = ["slack", "googlesheets", "googledocs", "linear"];

async function getComposioTools(userId: string) {
  "use step";

  try {
    const session = await createComposioSession({
      userId,
      toolkits: CEO_COMPOSIO_TOOLKITS,
    });
    const tools = await session.tools();
    return { tools, error: null };
  } catch (e) {
    return { tools: null, error: String(e) };
  }
}

async function recallStep(projectId: string, query: string) {
  "use step";
  const memories = await recallMemories(projectId, CEO_AGENT_ID, query, 6);
  return formatRecalledForPrompt(memories);
}

async function recallMemoryToolStep(input: {
  projectId: string;
  query: string;
  limit?: number;
}) {
  "use step";
  const memories = await recallMemories(
    input.projectId,
    CEO_AGENT_ID,
    input.query,
    input.limit ?? 5
  );
  return { memories };
}

async function saveMemoryToolStep(input: {
  projectId: string;
  content: string;
  category?: "decision" | "preference" | "context" | "knowledge";
}) {
  "use step";
  const id = await saveMemory(input.projectId, CEO_AGENT_ID, input.content, {
    category: input.category ?? "knowledge",
  });
  return { id, saved: id !== null };
}

function ceoMemoryTools(projectId: string): ToolSet {
  return {
    recall_memory: {
      description:
        "Search semantic memory for prior decisions, preferences, or facts learned in earlier runs.",
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().int().min(1).max(20).optional(),
      }),
      execute: (input: { query: string; limit?: number }) =>
        recallMemoryToolStep({ ...input, projectId }),
    },
    save_memory: {
      description:
        "Persist a fact, decision, or user preference to long-term memory. Be concise — one sentence per memory.",
      inputSchema: z.object({
        content: z.string(),
        category: z
          .enum(["decision", "preference", "context", "knowledge"])
          .optional(),
      }),
      execute: (input: {
        content: string;
        category?: "decision" | "preference" | "context" | "knowledge";
      }) => saveMemoryToolStep({ ...input, projectId }),
    },
  } as ToolSet;
}

export async function ceoChatWorkflow(
  projectId: string,
  messages: ModelMessage[]
) {
  "use workflow";

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText =
    typeof lastUser?.content === "string"
      ? lastUser.content
      : Array.isArray(lastUser?.content)
        ? lastUser?.content
            .map((p) => ("text" in p ? (p as { text: string }).text : ""))
            .join(" ")
        : "";

  const recalledBlock = await recallStep(projectId, lastUserText || "current work");

  const composioResult = await getComposioTools(`ceo-${projectId}`);
  const baseTools = buildCeoTools(projectId as Id<"projects">);
  const memTools = ceoMemoryTools(projectId);
  const allTools = composioResult.tools
    ? { ...baseTools, ...composioResult.tools, ...memTools }
    : { ...baseTools, ...memTools };

  const agent = new DurableAgent({
    model: openai("gpt-5.4"),
    instructions: CEO_INSTRUCTIONS + buildSkillsPrompt() + recalledBlock,
    tools: allTools,
  });

  const writable = getWritable<UIMessageChunk>();

  await agent.stream({
    messages,
    writable,
    maxSteps: 20,
  });
}
