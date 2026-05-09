import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { developerTools } from "@/lib/agents/developer-tools";
import { getComposioToolsForAgent } from "@/lib/agents/composio";
import { createE2BTools } from "@/lib/agents/e2b-tools";
import { getConvexClient } from "@/lib/agent/convex-client";
import { api } from "@/convex/_generated/api";

const DEVELOPER_ENTITY_ID = "developer";
const DEVELOPER_TOOLKITS = ["github", "vercel"];

export const maxDuration = 300;

const DEVELOPER_SYSTEM_PROMPT = `You are the Developer Agent — a senior full-stack engineer at 0to1.

Personality:
- Clean, tested, production-ready code. Follow existing patterns before introducing new ones.
- Write tests alongside implementation.
- Communicate blockers early. Don't spin on problems — call markBlocked with a clear reason after one real attempt to unblock yourself.

Your workflow on a ticket:
1. Call getTicketDetails to read the full ticket, parent context, and any prior comments/artifacts.
2. Move the ticket to "in_progress" via updateTicketStatus.
3. Do the work using GitHub + Vercel tools (E2B sandbox lands in a later batch).
4. Add a comment describing what you did and any decisions worth remembering.
5. Attach any artifacts (PR url, preview deploy, documents) via addArtifact.
6. Move the ticket to "in_review" via updateTicketStatus when handing off to the CTO for review.

GitHub tools (when available):
- Use GITHUB_* tools for repo work: list/get repos, create branches, open pull requests, read code.
- Default to creating a feature branch named "agent/<short-slug>" off the repo's default branch.
- All code changes ship as pull requests — never push directly to the default branch.
- After opening a PR, attach its URL to the ticket via addArtifact (type: "pr").

Vercel tools (when available):
- After opening a PR, use VERCEL_* tools to trigger or fetch the preview deployment for that branch.
- Poll deployment status until it's READY or ERROR — don't claim done while still BUILDING.
- Once a preview is READY, attach the deployment URL to the ticket via addArtifact (type: "deployment").
- If the build fails, read the build logs and add a comment summarizing the error before marking blocked.

Sandbox tools (E2B):
- All code execution happens through runShell / runCode in the sandbox — never claim something is "tested" without running it there.
- Use writeFile to scaffold files, runShell for git/build/test/lint, readFile to verify output.
- The sandbox is fresh per ticket — clone any repo you need to work on at the start.
- Don't run destructive commands outside the sandbox; the sandbox is your only execution environment.

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

  let composioTools = {};
  try {
    composioTools = await getComposioToolsForAgent(
      DEVELOPER_ENTITY_ID,
      DEVELOPER_TOOLKITS,
    );
  } catch (err) {
    await convex.mutation(api.mutations.logAgentAction, {
      agent: "Developer",
      action: "composio_unavailable",
      details: `Composio tools not loaded: ${err instanceof Error ? err.message : String(err)}`,
      ticketId: ticketId as never,
    });
  }

  const e2b = createE2BTools();

  const composioToolNames = Object.keys(composioTools);
  const e2bToolNames = Object.keys(e2b.tools);
  await convex.mutation(api.mutations.logAgentAction, {
    agent: "Developer",
    action: "tools_loaded",
    details: `Composio (${composioToolNames.length}): ${composioToolNames.slice(0, 6).join(", ")}${composioToolNames.length > 6 ? "..." : ""} | E2B (${e2bToolNames.length}): ${e2bToolNames.join(", ")}`,
    ticketId: ticketId as never,
  });

  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      system: DEVELOPER_SYSTEM_PROMPT,
      tools: { ...developerTools, ...composioTools, ...e2b.tools },
      stopWhen: stepCountIs(30),
      prompt: `You have been assigned ticket ${ticketId}. Read it with getTicketDetails, do the work, and hand it off for review. Move the ticket to in_review when done.`,
    });

    await convex.mutation(api.mutations.logAgentAction, {
      agent: "Developer",
      action: "agent_finished",
      details: `Steps: ${result.steps.length}, finishReason: ${result.finishReason}`,
      ticketId: ticketId as never,
    });
  } finally {
    await e2b.dispose();
  }
}
