import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable, getWorkflowMetadata } from "workflow";
import { stepCountIs } from "ai";
import type { UIMessageChunk } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { developerTools } from "./tools";
import { buildE2bTools, disposeSandbox } from "./e2b-tools";
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
   b. Do the work in the E2B sandbox using gh/git CLI.
   c. Add a comment describing what you did and any decisions.
   d. Open a PR and attach it via addArtifact (type: "pr").
   e. Deploy to Vercel and attach the preview URL via addArtifact (type: "deployment").
   f. Move the ticket to "in_review" via updateTicketStatus.

## MANDATORY: Pull Request Workflow
Every code change MUST go through a pull request. This is non-negotiable.
- You CANNOT move a ticket to "in_review" without first attaching a PR artifact. The system enforces this.
- Each ticket gets its own feature branch: \`agent/<ticket-slug>\`.
- Multiple tickets on the same repo produce multiple PRs — each on its own branch.
- NEVER push directly to \`main\` or \`master\`. The sandbox blocks these commands.
- NEVER force-push (\`git push --force\` or \`git push -f\`). Use \`--force-with-lease\` only on your own agent branch when amending review fixes.

## GitHub — via gh/git CLI inside the sandbox
All GitHub work happens through the \`gh\` and \`git\` CLIs inside the E2B sandbox via runShell. The sandbox is pre-configured with a bot-account PAT (\`GH_TOKEN\`) and a git credential helper.

### Standard flow:
1. \`gh auth status\` — verify auth.
2. \`gh repo clone <owner>/<repo>\` — clone the repo (provided in your prompt).
3. \`git checkout -B agent/<ticket-slug>\` — create a feature branch off main.
4. Implement, test, commit, push.
5. \`gh pr create --base main --head agent/<ticket-slug> --title "..." --body "..."\` — open PR.
6. Attach PR URL via addArtifact (type: "pr").

### If NO repo exists:
Do NOT create one. Call markBlocked immediately. The CTO is responsible for creating the repo before assigning developer tickets.

## Vercel Deployment
The Vercel CLI is pre-installed in the sandbox. \`VERCEL_TOKEN\` is pre-configured.

### For projects WITH an existing Vercel project (follow-up tickets):
The Vercel project ID and team ID are provided in your prompt. Write \`.vercel/project.json\` with these IDs before deploying.
1. After pushing your PR branch, deploy a preview:
   \`vercel deploy --token $VERCEL_TOKEN --yes\`
2. Capture the preview URL from the output.
3. Attach the preview URL via addArtifact (type: "deployment").

### For projects WITHOUT a Vercel project (first deploy):
1. After pushing your PR branch, deploy:
   \`vercel deploy --token $VERCEL_TOKEN --yes\`
   This will create a new Vercel project automatically.
2. Read the project ID from \`.vercel/project.json\`:
   \`cat .vercel/project.json\`
3. Call storeVercelProject to persist the Vercel project info for future tickets.
4. Attach the preview URL via addArtifact (type: "deployment").

### Deployment failures:
- If the build fails, read the build logs and add a comment summarizing the error.
- Try to fix the build error and re-deploy. If you can't fix it after one attempt, mark blocked.

## Code Quality Requirements
- Follow existing code patterns and conventions in the repo. Read existing files before writing new ones.
- Use conventional commit messages: \`feat:\`, \`fix:\`, \`refactor:\`, \`test:\`, \`docs:\`, \`chore:\`.
- Run linting (\`bun lint\` or \`npm run lint\`) and type checking (\`bun tsc --noEmit\` or \`npx tsc --noEmit\`) before committing.
- Run the test suite (\`bun test\` or \`npm test\`) before committing. Fix any failures.
- Write meaningful PR descriptions: what changed, why, and how to test.
- Keep PRs focused — one ticket = one PR = one concern. Don't bundle unrelated changes.

## Sandbox tools (E2B)
- All code execution happens through runShell / runCode — never claim something is "tested" without running it.
- Use writeFile to scaffold files, runShell for git/build/test/lint, readFile to verify output.
- The sandbox is fresh per ticket — clone any repo you need at the start.
- For Next.js local preview: \`bun next dev --port 3000 &\` then getSandboxPreview({ port: 3000 }).
- Don't run destructive commands outside the sandbox.

### Available in sandbox:
- node, npm, npx (Node.js 20+)
- python3, pip
- git, gh (GitHub CLI, pre-authenticated)
- vercel (Vercel CLI)
- Standard Unix: cp, mv, rm, find, grep, sed, awk, tar, curl, wget, cat, ls
- NOT available: rsync, docker, apt/yum (no root package installs)

### File copy pattern (no rsync):
When copying files between directories, use: \`cp -a source/. dest/\` or \`find source -not -path '*/\\.git/*' -not -path '*/node_modules/*' | cpio -pdm dest/\`
NEVER delete \`.git\` from a cloned repo directory — you'll lose git history. Instead, copy source files INTO the repo.

## CRITICAL: Sandbox Recovery
The sandbox may be replaced between commands (timeout, infrastructure reset). When this happens, runShell returns: "Directory ... does not exist — the sandbox was likely replaced."
**This is RECOVERABLE — do NOT mark blocked.** Instead:
1. Re-clone the repo: \`gh repo clone <owner>/<repo> /tmp/<repo>\`
2. Check out your feature branch: \`git checkout agent/<ticket-slug>\` (your commits are on the remote if you pushed)
3. Re-install dependencies and continue where you left off.
Only mark blocked for sandbox errors if re-cloning ALSO fails.

## Constraints
- NEVER push directly to main — all code goes through PRs. The sandbox enforces this.
- Stay within 30 steps per ticket. If you need more, mark blocked and ask the CTO for guidance.
- Do exactly one ticket per invocation. Do not create new tickets.
- Do NOT create a new repo if the project already has one. Use the existing repo.
- NEVER mark blocked for "sandbox replaced" or "directory does not exist" errors — re-clone and continue.`;

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

interface ProjectContext {
  githubRepo: string | null;
  vercelProjectId: string | null;
  vercelTeamId: string | null;
}

async function getProjectContext(ticketId: string): Promise<ProjectContext> {
  "use step";

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const ticket = await convex.query(api.queries.getTicket, {
    ticketId: ticketId as never,
  });
  if (!ticket?.projectId) {
    return { githubRepo: null, vercelProjectId: null, vercelTeamId: null };
  }
  const project = await convex.query(api.queries.getProject, {
    projectId: ticket.projectId,
  });
  return {
    githubRepo: project?.githubRepo ?? null,
    vercelProjectId: project?.vercelProjectId ?? null,
    vercelTeamId: project?.vercelTeamId ?? null,
  };
}

export async function developerTicketWorkflow(
  ticketId: string,
  triggerComment: string | null = null,
) {
  "use workflow";

  try {
    const { workflowRunId } = getWorkflowMetadata();
    await logAction(ticketId, "agent_started", `Picked up ticket ${ticketId}`);

    const projectCtx = await getProjectContext(ticketId);

    const e2bTools = buildE2bTools(ticketId);
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

    const promptParts = [
      `You have been assigned ticket ${ticketId}. Read it with getTicketDetails, then load the appropriate skill and follow its process. Open a PR and deploy to Vercel before moving the ticket to in_review.`,
      `**IMPORTANT — Retry handling:** This may be a retry after a previous run failed (e.g. sandbox errors). When you read the ticket details, check existing comments and artifacts for prior progress. If the ticket is "blocked", move it to "in_progress" and start fresh — you have a new sandbox. Re-clone the repo, re-install dependencies, and continue the work. Do NOT give up just because a previous run failed.`,
    ];

    if (projectCtx.githubRepo) {
      promptParts.push(
        `**GitHub repo:** ${projectCtx.githubRepo} — clone with \`gh repo clone ${projectCtx.githubRepo}\`. Create a feature branch and open a PR against main.`
      );
    } else {
      promptParts.push(
        `**ERROR: No GitHub repo is configured for this project.** You cannot create repos — the CTO must do that before assigning you work. Call markBlocked with reason "No GitHub repo configured for this project. CTO must call createGithubRepo before assigning developer tickets." and stop immediately.`
      );
    }

    if (projectCtx.vercelProjectId) {
      const vercelJson = JSON.stringify({
        projectId: projectCtx.vercelProjectId,
        orgId: projectCtx.vercelTeamId ?? "",
      });
      promptParts.push(
        `**Existing Vercel project:** Write \`.vercel/project.json\` with \`${vercelJson}\` before deploying. Run \`vercel deploy --token $VERCEL_TOKEN --yes\` after pushing your branch.`
      );
    } else {
      promptParts.push(
        `**No Vercel project** exists yet. After pushing your branch, run \`vercel deploy --token $VERCEL_TOKEN --yes\` to create one. Then read \`.vercel/project.json\` and call storeVercelProject to persist the project info.`
      );
    }

    promptParts.push(
      `The bot PAT is preconfigured as GH_TOKEN. VERCEL_TOKEN is also preconfigured.`
    );

    const messages: { role: "user"; content: string }[] = [
      {
        role: "user",
        content: promptParts.join("\n\n"),
      },
    ];

    if (triggerComment) {
      messages.push({
        role: "user",
        content: `The user tagged you with this message: "${triggerComment}"\n\nRespond to what they asked. If they said "continue", "go", or "retry", pick up where the previous run left off — read comments/artifacts to see what was already done and continue from there.`,
      });
    }

    const result = await agent.stream({
      messages,
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
