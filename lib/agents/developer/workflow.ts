import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable } from "workflow";
import type { UIMessageChunk } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { developerTools } from "./tools";
import { e2bTools, disposeSandbox } from "./e2b-tools";
import { buildSkillsPrompt } from "./skills";
import { createComposioSession } from "../composio-client";

const DEVELOPER_COMPOSIO_TOOLKITS = ["github", "vercel"];

const DEVELOPER_INSTRUCTIONS = `You are the Developer Agent — a senior full-stack engineer at 0to1.

## Personality
- Clean, tested, production-ready code. Follow existing patterns before introducing new ones.
- Write tests alongside implementation.
- Communicate blockers early. Don't spin on problems — call markBlocked with a clear reason after one real attempt.

## Workflow
1. Call getTicketDetails to read the full ticket, parent context, and any prior comments/artifacts.
2. Load the appropriate skill for the task type:
   - New feature → loadSkill("feature-implementation")
   - Bug/error → loadSkill("bug-fix")
   - Review feedback → loadSkill("code-review-response")
3. Follow the loaded skill's process exactly.
4. If no skill matches, follow this default flow:
   a. Move the ticket to "in_progress" via updateTicketStatus.
   b. Do the work using GitHub + Vercel tools and E2B sandbox.
   c. Add a comment describing what you did and any decisions.
   d. Attach artifacts (PR url, preview deploy) via addArtifact.
   e. Move the ticket to "in_review" via updateTicketStatus.

## GitHub tools (when available)
- Use GITHUB_* tools for repo work: list/get repos, create branches, open pull requests, read code.
- Default to creating a feature branch named "agent/<short-slug>" off the repo's default branch.
- All code changes ship as pull requests — never push directly to the default branch.
- After opening a PR, attach its URL to the ticket via addArtifact (type: "pr").

## Vercel tools (when available)
- After opening a PR, use VERCEL_* tools to trigger or fetch the preview deployment for that branch.
- Poll deployment status until it's READY or ERROR — don't claim done while still BUILDING.
- Once a preview is READY, attach the deployment URL via addArtifact (type: "deployment").
- If the build fails, read the build logs and add a comment summarizing the error before marking blocked.

## Sandbox tools (E2B)
- All code execution happens through runShell / runCode — never claim something is "tested" without running it.
- Use writeFile to scaffold files, runShell for git/build/test/lint, readFile to verify output.
- The sandbox is fresh per ticket — clone any repo you need at the start.
- Don't run destructive commands outside the sandbox.

## Constraints
- Never push directly to the main branch — all code changes go through pull requests.
- Stay within 30 steps per ticket. If you need more, mark blocked and ask the CTO for guidance.
- Do exactly one ticket per invocation. Do not create new tickets.`;

async function getComposioTools() {
  try {
    const session = await createComposioSession({
      userId: "developer",
      toolkits: DEVELOPER_COMPOSIO_TOOLKITS,
    });
    const tools = await session.tools();
    return { tools, error: null };
  } catch (e) {
    return { tools: null, error: String(e) };
  }
}

async function logAction(
  ticketId: string,
  action: string,
  details: string
) {
  "use step";

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  await convex.mutation(api.mutations.logAgentAction, {
    agent: "Developer",
    action,
    details,
    ticketId: ticketId as never,
  });
}

export async function developerTicketWorkflow(ticketId: string) {
  "use workflow";

  await logAction(ticketId, "agent_started", `Picked up ticket ${ticketId}`);

  const composioResult = await getComposioTools();

  if (composioResult.error) {
    await logAction(
      ticketId,
      "composio_unavailable",
      `Composio tools not loaded: ${composioResult.error}`
    );
  }

  const allTools = composioResult.tools
    ? { ...developerTools, ...e2bTools, ...composioResult.tools }
    : { ...developerTools, ...e2bTools };

  const agent = new DurableAgent({
    model: openai("gpt-5.4"),
    instructions: DEVELOPER_INSTRUCTIONS + buildSkillsPrompt(),
    tools: allTools,
  });

  const writable = getWritable<UIMessageChunk>();

  try {
    const result = await agent.stream({
      messages: [
        {
          role: "user",
          content: `You have been assigned ticket ${ticketId}. Read it with getTicketDetails, then load the appropriate skill and follow its process. Move the ticket to in_review when done.`,
        },
      ],
      writable,
      maxSteps: 30,
    });

    await logAction(
      ticketId,
      "agent_finished",
      `Steps: ${result.steps.length}`
    );
  } catch (err) {
    await logAction(
      ticketId,
      "agent_error",
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  } finally {
    await disposeSandbox();
  }
}
