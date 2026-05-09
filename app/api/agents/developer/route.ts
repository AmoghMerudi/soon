import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { developerTools } from "@/lib/agents/developer-tools";
import { getConvexClient } from "@/lib/agent/convex-client";
import { api } from "@/convex/_generated/api";

export const maxDuration = 300;

const DEVELOPER_SYSTEM_PROMPT = `You are the Developer Agent — a senior full-stack engineer at 0to1.

Personality:
- Clean, tested, production-ready code. Follow existing patterns before introducing new ones.
- Write tests alongside implementation.
- Communicate blockers early. Don't spin on problems — call markBlocked with a clear reason after one real attempt to unblock yourself.

Your workflow on a ticket:
1. Call getTicketDetails to read the full ticket, parent context, and any prior comments/artifacts.
2. Move the ticket to "in_progress" via updateTicketStatus.
3. Do the work (in later batches you'll have GitHub/Vercel/E2B tools — for now, summarize what you'd do as a comment).
4. Add a comment describing what you did and any decisions worth remembering.
5. Attach any artifacts (PR url, preview deploy, documents) via addArtifact.
6. Move the ticket to "in_review" via updateTicketStatus when handing off to the CTO for review.

Constraints:
- You are NEVER allowed to push directly to the main branch — all code changes go through pull requests.
- Stay within 30 steps per ticket. If you need more, mark the ticket blocked and ask the CTO for guidance.

Do exactly one ticket per invocation. Do not create new tickets.`;

export async function POST(request: Request) {
  const { ticketId } = await request.json();

  if (!ticketId || typeof ticketId !== "string") {
    return Response.json({ error: "Missing 'ticketId' field" }, { status: 400 });
  }

  // Fire-and-forget: respond to the dispatcher immediately, run the agent in the background.
  void runDeveloperAgent(ticketId).catch(async (err) => {
    console.error("[developer-agent] failed:", err);
    try {
      const convex = getConvexClient();
      await convex.mutation(api.mutations.logAgentAction, {
        agent: "Developer",
        action: "agent_error",
        details: err instanceof Error ? err.message : String(err),
        ticketId: ticketId as never,
      });
    } catch {}
  });

  return Response.json({ ok: true, ticketId });
}

async function runDeveloperAgent(ticketId: string) {
  const convex = getConvexClient();
  await convex.mutation(api.mutations.logAgentAction, {
    agent: "Developer",
    action: "agent_started",
    details: `Picked up ticket ${ticketId}`,
    ticketId: ticketId as never,
  });

  const result = await generateText({
    model: openai("gpt-4o"),
    system: DEVELOPER_SYSTEM_PROMPT,
    tools: developerTools,
    stopWhen: stepCountIs(30),
    prompt: `You have been assigned ticket ${ticketId}. Read it with getTicketDetails, do the work, and hand it off for review. Move the ticket to in_review when done.`,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "Developer",
    action: "agent_finished",
    details: `Steps: ${result.steps.length}, finishReason: ${result.finishReason}`,
    ticketId: ticketId as never,
  });
}
