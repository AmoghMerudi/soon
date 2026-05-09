import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable, getWorkflowMetadata } from "workflow";
import { stepCountIs } from "ai";
import type { UIMessageChunk } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { developerTools } from "./tools";
import { e2bTools, disposeSandbox } from "./e2b-tools";
import { buildSkillsPrompt } from "./skills";
import {
  markDispatchCompleted,
  markDispatchFailed,
} from "../shared/dispatch-steps";
import {
  attachObservabilityContext,
  createObservedTools,
} from "../shared/observability";

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
   b. Do the work in the E2B sandbox using gh/git CLI and (optionally) Vercel tools.
   c. Add a comment describing what you did and any decisions.
   d. Attach artifacts (PR url, preview deploy) via addArtifact.
   e. Move the ticket to "in_review" via updateTicketStatus.

## GitHub — via gh/git CLI inside the sandbox
You DO NOT have direct GitHub tools. All GitHub work happens through the \`gh\` and \`git\` CLIs inside the E2B sandbox via runShell. The sandbox is pre-configured with a bot-account PAT (\`GH_TOKEN\`) and a git credential helper, so authentication is automatic.

Standard flow (run via runShell):
- \`gh auth status\` — verify auth at the start.
- \`gh repo clone <owner>/<repo>\` — or \`gh repo create <name> --private --clone\` for new projects.
- \`git checkout -B agent/<ticket-slug>\` — always work on a feature branch, never on main.
- After commits: \`git push -u origin agent/<ticket-slug>\`.
- \`gh pr create --base main --head agent/<ticket-slug> --title "..." --body "..."\` — open the PR.
- Capture the PR URL from gh's output and attach via addArtifact (type: "pr").
- Never push to \`main\`. Branch protection will reject it anyway, but don't try.
- Never run \`git push --force\` against a shared branch. Use \`--force-with-lease\` only on your own agent branch when amending review fixes.

## Vercel tools (when available)
- After opening a PR, use VERCEL_* tools to trigger or fetch the preview deployment for that branch.
- Poll deployment status until it's READY or ERROR — don't claim done while still BUILDING.
- Once a preview is READY, attach the deployment URL via addArtifact (type: "deployment").
- If the build fails, read the build logs and add a comment summarizing the error before marking blocked.

## Sandbox tools (E2B)
- All code execution happens through runShell / runCode — never claim something is "tested" without running it.
- Use writeFile to scaffold files, runShell for git/build/test/lint, readFile to verify output.
- The sandbox is fresh per ticket — clone any repo you need at the start.
- For Next.js work: after \`bun install\`, you can run \`bun next dev --port 3000 &\` and then call getSandboxPreview({ port: 3000 }) to get a public URL the user can view live. Attach it via addArtifact (type: "deployment").
- Don't run destructive commands outside the sandbox.

## Constraints
- Never push directly to the main branch — all code changes go through pull requests.
- Stay within 30 steps per ticket. If you need more, mark blocked and ask the CTO for guidance.
- Do exactly one ticket per invocation. Do not create new tickets.`;

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

async function getProjectGithubRepo(ticketId: string): Promise<string | null> {
  "use step";

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const ticket = await convex.query(api.queries.getTicket, {
    ticketId: ticketId as never,
  });
  if (!ticket?.projectId) return null;
  const project = await convex.query(api.queries.getProject, {
    projectId: ticket.projectId,
  });
  return project?.githubRepo ?? null;
}

export async function developerTicketWorkflow(ticketId: string) {
  "use workflow";

  try {
    const { workflowRunId } = getWorkflowMetadata();
    await logAction(ticketId, "agent_started", `Picked up ticket ${ticketId}`);

    const githubRepo = await getProjectGithubRepo(ticketId);

    // Composio is intentionally disabled for the developer agent: GitHub goes through
    // the bot PAT in the E2B sandbox, and Vercel previews aren't wired in yet. The
    // composio SDK also fails inside the Workflow VM context with
    // ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING.
    const allTools = { ...developerTools, ...e2bTools };
    const observedTools = createObservedTools(allTools, {
      ticketId,
      workflowRunId,
      agentId: "developer",
    });

    const agent = new DurableAgent({
      model: openai("gpt-5.4"),
      instructions: DEVELOPER_INSTRUCTIONS + buildSkillsPrompt(),
      tools: observedTools,
    });

    const writable = getWritable<UIMessageChunk>();

    const result = await agent.stream({
      messages: [
        {
          role: "user",
          content: [
        `You have been assigned ticket ${ticketId}. Read it with getTicketDetails, then load the appropriate skill and follow its process. Move the ticket to in_review when done.`,
        githubRepo
          ? `Project GitHub repo: ${githubRepo} — clone with \`gh repo clone ${githubRepo}\` in the sandbox before any code work. The bot PAT is preconfigured as GH_TOKEN.`
          : `No GitHub repo is configured for this project yet. The bot account can create one — use \`gh repo create <slug> --private --clone\` inside the sandbox, then update the project record. The bot PAT is preconfigured as GH_TOKEN.`,
      ].join("\n\n"),
        },
      ],
      writable,
      stopWhen: stepCountIs(30),
      prepareStep: ({ stepNumber }) => ({
        experimental_context: attachObservabilityContext(stepNumber),
      }),
    });

    await logAction(
      ticketId,
      "agent_finished",
      `Steps: ${result.steps.length}`
    );
    await markDispatchCompleted(ticketId);
  } catch (err) {
    await markDispatchFailed(
      ticketId,
      err instanceof Error ? err.message : String(err)
    );
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
