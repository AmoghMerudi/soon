export interface SkillMeta {
  name: string;
  description: string;
}

export const DEVELOPER_SKILLS: SkillMeta[] = [
  {
    name: "feature-implementation",
    description:
      "End-to-end process for implementing a new feature from a ticket. Use when assigned a ticket that requires building something new.",
  },
  {
    name: "bug-fix",
    description:
      "Systematic process for diagnosing and fixing bugs. Use when assigned a ticket that describes broken behavior or an error.",
  },
  {
    name: "code-review-response",
    description:
      "Process for addressing code review feedback on a PR. Use when a ticket's comments contain review feedback that needs to be resolved.",
  },
];

const SKILL_CONTENT: Record<string, string> = {
  "feature-implementation": `# Feature Implementation

## When to use
Activate this skill when:
- The ticket describes a new feature, endpoint, component, or integration
- The ticket has acceptance criteria for new functionality
- The CTO has broken down a larger feature into an implementable chunk

## Process

### Phase 1: Understand the Ticket
1. Read the full ticket with getTicketDetails — including parent ticket, sub-tickets, and all comments.
2. Identify:
   - What needs to be built (acceptance criteria)
   - Which repo and area of the codebase is affected
   - Any constraints or technical decisions from CTO comments
3. Move the ticket to "in_progress" immediately.

### Phase 2: Set Up the Workspace
1. Verify auth: \`runShell("gh auth status")\`. If this fails, mark blocked — the bot PAT isn't configured.
2. If NO repo is provided in your prompt, call markBlocked immediately — the CTO must create the repo first. Do NOT create a repo yourself.
3. Clone the target repo (provided in your initial prompt): \`runShell("gh repo clone <owner>/<repo>")\`.
4. Create a feature branch off main: \`runShell("git checkout -B agent/<ticket-slug>", { cwd: "<repo>" })\`. NEVER work on main.
4. Install dependencies (\`bun install\` preferred, fall back to \`pnpm install\` or \`npm install\`) and verify the project builds cleanly.
5. If the build fails before any changes, mark the ticket blocked with the build error.

### Phase 3: Implement
1. Read existing code in the area you're modifying to understand patterns.
2. Write the implementation following existing conventions — don't introduce new patterns.
3. **Commit and push frequently** — after each major piece of work, commit and push to protect against sandbox replacement. Don't wait until everything is done.
4. Write tests alongside the implementation:
   - Unit tests for business logic
   - Integration tests for API endpoints
   - At minimum, one happy-path test per acceptance criterion
5. Run the test suite after implementation. Fix any failures before proceeding.

### Phase 4: Quality Checks
1. Run linting: \`bun lint\` or \`npm run lint\`. Fix all errors.
2. Run type checking: \`bun tsc --noEmit\` or \`npx tsc --noEmit\`. Fix all errors.
3. Run the full test suite one final time. All tests must pass.

### Phase 5: Open Pull Request (MANDATORY)
1. Stage and commit with a conventional commit message: \`runShell("git add -A && git commit -m 'feat: <description>'", { cwd: "<repo>" })\`.
2. Push the branch: \`runShell("git push -u origin agent/<ticket-slug>", { cwd: "<repo>" })\`.
3. Open the PR: \`runShell("gh pr create --base main --head agent/<ticket-slug> --title 'feat: ...' --body '## Summary\\n...\\n## Test Plan\\n...\\n## Ticket\\n<ticket-id>'", { cwd: "<repo>" })\`. Capture the PR URL from stdout.
4. Attach the PR URL to the ticket via addArtifact (type: "pr"). This is REQUIRED before moving to in_review.

### Phase 6: Deploy to Vercel
1. If a Vercel project already exists (provided in your prompt), write \`.vercel/project.json\` with the project/org IDs before deploying.
2. Deploy: \`runShell("vercel deploy --token $VERCEL_TOKEN --yes", { cwd: "<repo>" })\`.
3. Capture the preview URL from the output.
4. If this is the first deploy (no Vercel project existed), read \`.vercel/project.json\` and call storeVercelProject.
5. Attach the preview URL via addArtifact (type: "deployment").
6. If the Vercel build fails, read the logs, try to fix the issue, and re-deploy. If you can't fix after one attempt, add a comment with the error and mark blocked.

### Phase 7: Complete
1. Add a comment summarizing what was built, any design decisions, and how to test it.
2. Move the ticket to "in_review". This will fail if you haven't attached a PR artifact.

### If Sandbox Replaced
If any command returns "directory does not exist — sandbox was likely replaced", this is RECOVERABLE:
1. Re-clone: \`runShell("gh repo clone <owner>/<repo> /tmp/<repo>")\`
2. Check out your branch: \`runShell("git checkout agent/<ticket-slug>", { cwd: "/tmp/<repo>" })\` — your pushed commits are still on the remote.
3. Re-install deps and continue from where you left off.
Do NOT mark blocked for sandbox replacement.

### If Blocked
- If you can't resolve an issue after one genuine attempt AND re-cloning also fails, call markBlocked.
- Include: what you tried, what failed, and what you think the fix might be.
- NEVER mark blocked for "sandbox replaced" or "cwd does not exist" — always re-clone first.`,

  "bug-fix": `# Bug Fix

## When to use
Activate this skill when:
- The ticket describes unexpected behavior, errors, or regressions
- The ticket includes error logs, stack traces, or steps to reproduce
- The CTO has identified a bug that needs fixing

## Process

### Phase 1: Understand the Bug
1. Read the full ticket with getTicketDetails — look for reproduction steps, error messages, expected vs actual behavior.
2. Read any linked parent tickets or related sub-tickets for broader context.
3. Move the ticket to "in_progress".

### Phase 2: Reproduce
1. Clone the repo (provided in your prompt) and set up the environment in the sandbox.
2. Create a feature branch: \`git checkout -B agent/<ticket-slug>\`. NEVER work on main.
3. Follow the reproduction steps to confirm the bug exists.
4. If you cannot reproduce, add a comment explaining what you tried and ask for more details. Mark blocked if needed.

### Phase 3: Diagnose
1. Read the relevant source code to understand the expected behavior.
2. Identify the root cause — don't just fix the symptom.
3. Check if the bug exists in other similar code paths (same pattern, same module).

### Phase 4: Fix
1. Write a failing test that demonstrates the bug BEFORE fixing it.
2. Implement the fix — minimal, targeted change. Don't refactor unrelated code.
3. Verify the failing test now passes.
4. Run the full test suite to check for regressions.
5. Check if related code paths need the same fix.

### Phase 5: Quality Checks
1. Run linting and type checking. Fix all errors.
2. Run the full test suite. All tests must pass.

### Phase 6: Open Pull Request (MANDATORY)
1. Commit: \`runShell("git add -A && git commit -m 'fix: <root cause summary>'", { cwd: "<repo>" })\`.
2. Push: \`runShell("git push -u origin agent/<ticket-slug>", { cwd: "<repo>" })\`.
3. Open PR: \`runShell("gh pr create --base main --head agent/<ticket-slug> --title 'fix: ...' --body '## Root Cause\\n...\\n## Fix\\n...\\n## Test Plan\\n...'", { cwd: "<repo>" })\`. Capture the URL.
4. Attach the PR URL to the ticket via addArtifact (type: "pr"). REQUIRED before moving to in_review.

### Phase 7: Deploy to Vercel
1. Deploy a preview: \`vercel deploy --token $VERCEL_TOKEN --yes\`.
2. Attach the preview URL via addArtifact (type: "deployment").
3. If this is the first deploy, call storeVercelProject after reading \`.vercel/project.json\`.

### Phase 8: Complete
1. Add a comment with: root cause analysis, what was fixed, and how to verify.
2. Move the ticket to "in_review". This will fail if you haven't attached a PR artifact.

### If Blocked
- Can't reproduce → add comment with exact steps tried, mark blocked.
- Root cause is in a dependency or external system → add comment, mark blocked.
- Fix requires architectural changes → add comment explaining scope, mark blocked for CTO guidance.`,

  "code-review-response": `# Code Review Response

## When to use
Activate this skill when:
- A ticket in "in_review" has new comments with review feedback
- The CTO has requested changes on a PR
- A ticket was moved back from "in_review" to "in_progress" with comments

## Process

### Phase 1: Read Feedback
1. Read the full ticket with getTicketDetails to see all comments.
2. Identify each piece of actionable feedback.
3. Categorize: must-fix (blocking), should-fix (quality), nice-to-have (style).

### Phase 2: Address Feedback
1. Clone the repo (provided in your prompt) and check out the existing PR branch:
   - \`runShell("gh repo clone <owner>/<repo>")\`
   - \`runShell("gh pr checkout <pr-number>", { cwd: "<repo>" })\` — pulls the PR branch automatically.
2. Address each must-fix item first, then should-fix items.
3. For each change:
   - Make the code change
   - Update or add tests if the review requested it
   - Run the test suite to verify nothing broke
4. For nice-to-have items: implement if quick, otherwise add a comment explaining the tradeoff.

### Phase 3: Quality Checks
1. Run linting and type checking. Fix all errors.
2. Run the full test suite. All tests must pass.

### Phase 4: Push and Re-deploy
1. Commit all changes: \`runShell("git add -A && git commit -m 'review: address feedback'", { cwd: "<repo>" })\`.
2. Push to the existing PR branch: \`runShell("git push", { cwd: "<repo>" })\`. Use \`--force-with-lease\` only if you needed to amend or rebase.
3. Re-deploy to Vercel: \`vercel deploy --token $VERCEL_TOKEN --yes\`. Attach the new preview URL via addArtifact (type: "deployment").
4. Add a comment to the ticket listing each feedback item and how it was addressed.
5. Move the ticket back to "in_review".

### If You Disagree
- If a review comment is technically incorrect or would introduce a regression, add a comment explaining your reasoning with evidence (test results, docs references).
- Never silently ignore feedback — always respond to every item.`,
};

export function getSkillContent(name: string): string | null {
  return SKILL_CONTENT[name] ?? null;
}

export function buildSkillsPrompt(): string {
  if (DEVELOPER_SKILLS.length === 0) return "";
  const list = DEVELOPER_SKILLS.map(
    (s) => `- **${s.name}**: ${s.description}`
  ).join("\n");
  return `

## Available Skills
You have specialized skills for structured workflows. Use the loadSkill tool to load a skill's full instructions when the task matches.
${list}`;
}
