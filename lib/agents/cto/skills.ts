export interface SkillMeta {
  name: string;
  description: string;
}

export const CTO_SKILLS: SkillMeta[] = [
  {
    name: "architecture-review",
    description:
      "Used when CTO needs to review technical feasibility of a ticket. Reviews ticket, assesses complexity, identifies risks, defines architecture approach, adds comment with guidance, creates sub-tickets for Developer.",
  },
  {
    name: "ticket-decomposition",
    description:
      "Used when breaking a large engineering ticket into implementation tasks. Analyzes scope, identifies subtasks (max 5), assigns each to Developer with clear acceptance criteria.",
  },
];

const SKILL_CONTENT: Record<string, string> = {
  "architecture-review": `# Architecture Review

## When to use
Activate this skill when:
- A ticket involves significant technical complexity or architectural decisions
- The ticket description is vague on implementation approach
- There are potential risks (scalability, security, integration) that need assessment
- The ticket spans multiple systems or services

## Process

### Phase 1: Read the Ticket
Call getTicketDetails to load the full ticket context including description, parent ticket, sub-tickets, comments, and artifacts.

### Phase 2: Assess Complexity
Silently score the ticket on these dimensions (1-5 each):

| Dimension | 1 (Simple) | 5 (Complex) |
|-----------|-----------|-------------|
| Technical scope | Single component change | Cross-system architecture |
| Risk | Low-risk, well-understood | New patterns or high-stakes |
| Dependencies | Self-contained | Many external dependencies |
| Reversibility | Easily reverted | Hard to undo |

### Phase 3: Identify Risks
For each risk area, document:
- **What could go wrong**
- **Likelihood** (low/medium/high)
- **Impact** (low/medium/high)
- **Mitigation strategy**

Common risk areas: data migration, performance regression, security surface, API contract changes, third-party reliability.

### Phase 4: Define Architecture Approach
Write a concise architecture decision covering:
1. **Chosen approach** — the recommended implementation strategy
2. **Alternatives considered** — 1-2 alternatives and why they were rejected
3. **Key tradeoffs** — what is being optimized for vs. deprioritized
4. **Success criteria** — how to know the implementation is correct

### Phase 5: Add Comment with Guidance
Use addComment to post the architecture review to the ticket. Include:
- Summary of complexity assessment
- Risk register
- Recommended approach with tradeoff analysis
- Clear acceptance criteria for the Developer

### Phase 6: Create Sub-Tickets for Developer
Use createSubTicket to break down implementation tasks. Assign each to "Developer". Each sub-ticket must include:
- Specific, actionable title
- Detailed description referencing the architecture decision
- Concrete acceptance criteria
- Dependencies on other sub-tickets (if any)`,

  "ticket-decomposition": `# Ticket Decomposition

## When to use
Activate this skill when:
- A ticket is too large for a single implementation cycle
- The ticket description covers multiple distinct features or components
- Parallel work by multiple developers would be beneficial
- The ticket has been in backlog too long due to its size

## Process

### Phase 1: Analyze Scope
Call getTicketDetails to read the full ticket. Identify:
- All distinct functional areas
- External dependencies
- What must be sequential vs. what can be parallel
- Estimated complexity of each area

### Phase 2: Identify Subtasks (max 5)
Group work into cohesive subtasks. Rules:
- Each subtask must be independently deployable
- Each subtask must have clear "done" criteria
- No subtask should take more than 2-3 days to implement
- Subtasks that are dependencies must be listed first

For each subtask define:
1. **Title** — action-oriented, specific (e.g., "Implement user authentication API endpoint")
2. **Description** — what to build, not how (leave implementation to Developer)
3. **Acceptance criteria** — testable conditions for completion
4. **Dependencies** — which other subtasks must complete first

### Phase 3: Assign to Developer
Use createSubTicket for each task:
- assignee: "Developer"
- tags: inherit from parent, add specific domain tags
- taggedAgents: always include "CTO"
- priority: match parent or downgrade non-blocking tasks

### Phase 4: Update Parent Ticket
Add a comment on the parent ticket summarizing:
- How the work was decomposed and why
- Order of execution
- Any integration points the Developer must be aware of

Update parent status to "in_progress" once sub-tickets are created.`,
};

export function getSkillContent(name: string): string | null {
  return SKILL_CONTENT[name] ?? null;
}

export function buildSkillsPrompt(): string {
  if (CTO_SKILLS.length === 0) return "";
  const list = CTO_SKILLS.map(
    (s) => `- **${s.name}**: ${s.description}`
  ).join("\n");
  return `

## Available Skills
You have specialized skills for complex workflows. Use the loadSkill tool to load a skill's full instructions when the task matches.
${list}`;
}
