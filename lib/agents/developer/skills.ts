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
1. Clone the target repo into the sandbox using runShell.
2. Create a feature branch: \`agent/<ticket-slug>\`.
3. Install dependencies and verify the project builds cleanly.
4. If the build fails before any changes, mark the ticket blocked with the build error.

### Phase 3: Implement
1. Read existing code in the area you're modifying to understand patterns.
2. Write the implementation following existing conventions — don't introduce new patterns.
3. Write tests alongside the implementation:
   - Unit tests for business logic
   - Integration tests for API endpoints
   - At minimum, one happy-path test per acceptance criterion
4. Run the test suite after implementation. Fix any failures before proceeding.

### Phase 4: Verify and Ship
1. Run linting and type checks. Fix all errors.
2. Run the full test suite one final time.
3. Commit with a clear message referencing the ticket.
4. Push the branch and open a pull request via GitHub tools.
5. Attach the PR URL to the ticket via addArtifact (type: "pr").
6. If a Vercel preview deployment is available, attach it via addArtifact (type: "deployment").
7. Add a comment summarizing what was built, any design decisions, and how to test it.
8. Move the ticket to "in_review".

### If Blocked
- If you can't resolve an issue after one genuine attempt, call markBlocked immediately.
- Include: what you tried, what failed, and what you think the fix might be.
- Don't spin — early escalation is better than wasted cycles.`,

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
1. Clone the repo and set up the environment in the sandbox.
2. Follow the reproduction steps to confirm the bug exists.
3. If you cannot reproduce, add a comment explaining what you tried and ask for more details. Mark blocked if needed.

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

### Phase 5: Ship
1. Commit with a clear message: what was broken, why, and how it's fixed.
2. Push and open a PR via GitHub tools.
3. Attach the PR URL to the ticket via addArtifact (type: "pr").
4. Add a comment with: root cause analysis, what was fixed, and how to verify.
5. Move the ticket to "in_review".

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
1. Clone the repo and check out the existing PR branch.
2. Address each must-fix item first, then should-fix items.
3. For each change:
   - Make the code change
   - Update or add tests if the review requested it
   - Run the test suite to verify nothing broke
4. For nice-to-have items: implement if quick, otherwise add a comment explaining the tradeoff.

### Phase 3: Respond
1. Commit all changes with a clear message referencing the review.
2. Push to the existing PR branch.
3. Add a comment to the ticket listing each feedback item and how it was addressed.
4. Move the ticket back to "in_review".

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
