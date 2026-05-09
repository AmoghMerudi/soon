export interface SkillMeta {
  name: string;
  description: string;
}

export const CEO_SKILLS: SkillMeta[] = [
  {
    name: "business-idea-intake",
    description:
      "Structured deep-dive for understanding a new business idea before planning. Use when the user first describes what they want to build.",
  },
];

const SKILL_CONTENT: Record<string, string> = {
  "business-idea-intake": `# Business Idea Intake

## When to use
Activate this skill when:
- The user describes a new business idea or product concept
- The user says they want to "start", "build", or "launch" something
- A conversation begins with a business concept that needs exploration

## Process

### Phase 1: Assess Completeness
Before asking questions, silently score the idea on these dimensions (1-5 each):

| Dimension | 1 (Missing) | 5 (Clear) |
|-----------|-------------|-----------|
| Problem clarity | No problem stated | Specific pain point with evidence |
| Target audience | "Everyone" | Named segment with characteristics |
| Revenue model | No mention | Clear pricing and willingness-to-pay signal |
| Differentiation | Generic | Specific unfair advantage |
| Scope | Unbounded | Defined MVP boundary |

If total < 15 → proceed to Phase 2 (deep discovery).
If total >= 15 → skip to Phase 3 (synthesize).

### Phase 2: Deep Discovery
Use the askQuestion tool to present structured choices. Never ask more than 3 questions in a row without synthesizing what you've learned.

**Round 1 — Problem & Audience (must-know):**
Ask about:
- Who is the target customer? What specific pain point?
- What do people use today instead? What's broken about it?

**Round 2 — Business Model (must-know):**
Ask about:
- How will this make money? (subscription, usage, marketplace, etc.)
- What price range feels right? What comparable products charge?
- What's the smallest version that proves the concept?

**Round 3 — Context (should-know):**
Ask about:
- Timeline and urgency — how fast do you need this?
- Technical constraints or preferences?
- Existing audience, waitlist, or distribution channel?

Use askQuestion with concrete options whenever possible. Instead of "Who is your target customer?", present options like:
1. Developers / technical teams
2. Small business owners
3. Enterprise / B2B
4. Consumers / B2C
5. Something else

### Phase 3: Synthesize
Create a structured brief:

1. **One-liner** — What is this in one sentence?
2. **Problem** — What specific problem does this solve?
3. **Audience** — Who are the target users? Be specific.
4. **Solution** — How does this solve the problem?
5. **Revenue model** — How does this make money?
6. **Competition** — What alternatives exist? How is this different?
7. **MVP scope** — Minimum feature set for launch
8. **Tech stack recommendation** — Based on requirements
9. **Key risks** — Top 3 risks with mitigations
10. **Market sizing** — Rough TAM/SAM/SOM

### Phase 4: Present Execution Plan
Draft a 3-5 phase plan:
- **Phase 1: Foundation** — Core MVP features, infrastructure
- **Phase 2: Launch** — Go-to-market, first users, feedback loops
- **Phase 3: Growth** — Iterate on feedback, expand features
- **Phase 4+: Scale** — If warranted by traction

Each phase needs: deliverables, estimated duration, success criteria.

### Phase 5: Get Approval
Present the brief and plan. Ask explicitly: "Should I proceed and create tickets for this plan?"

NEVER create tickets until the user explicitly approves. This step is mandatory.`,
};

export function getSkillContent(name: string): string | null {
  return SKILL_CONTENT[name] ?? null;
}

export function buildSkillsPrompt(): string {
  if (CEO_SKILLS.length === 0) return "";
  const list = CEO_SKILLS.map(
    (s) => `- **${s.name}**: ${s.description}`
  ).join("\n");
  return `

## Available Skills
You have specialized skills for complex workflows. Use the loadSkill tool to load a skill's full instructions when the task matches.
${list}`;
}
