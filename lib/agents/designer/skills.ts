export const DESIGNER_SKILLS = [
  {
    name: "design-workflow",
    description: "Used when Designer picks up a design ticket. Guides the full design process from ticket intake to review-ready artifacts.",
    content: `# design-workflow

## When to use
Use this skill when you have been assigned a design ticket and need to execute the full design workflow.

## Process

### Step 1: Read the ticket
Call \`getTicketDetails\` with the ticket ID to understand the full context: requirements, parent tickets, existing comments, and any prior artifacts.

### Step 2: Move to in_progress
Call \`updateTicketStatus\` with status \`in_progress\` to signal you have started work.

### Step 3: Create design assets
Based on the ticket requirements, describe and create the design assets. Add a comment via \`addComment\` describing:
- What you are designing (components, screens, flows)
- Design decisions made (layout, typography, color, spacing)
- Accessibility considerations (contrast ratios, keyboard navigation, ARIA labels)
- Responsive behavior (mobile, tablet, desktop breakpoints)
- How it fits within the existing design system

### Step 4: Add the design artifact
Call \`addArtifact\` with:
- type: \`design\`
- url: The Figma or Cloudinary URL of the design file
- description: A clear description of what the artifact contains

### Step 5: Move to in_review
Call \`updateTicketStatus\` with status \`in_review\` to hand off for review.

## If blocked
If the ticket is missing critical context (requirements unclear, no design system reference, conflicting specs), call \`markBlocked\` with a specific reason explaining exactly what information is needed before work can proceed.
`,
  },
];

export function getSkillContent(skillName: string): string | undefined {
  const skill = DESIGNER_SKILLS.find((s) => s.name === skillName);
  return skill?.content;
}

export function buildSkillsPrompt(): string {
  return DESIGNER_SKILLS.map(
    (skill) => `## Skill: ${skill.name}\n${skill.description}\n\nTo load full instructions, request skill: ${skill.name}`
  ).join("\n\n");
}
