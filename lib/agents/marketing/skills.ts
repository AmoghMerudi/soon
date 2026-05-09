export const MARKETING_SKILLS = [
  {
    name: "content-workflow",
    description:
      "Used when Marketing picks up a content ticket. Covers blog posts, social copy, and email campaigns from intake to review.",
    content: `# content-workflow

## When to use
Use this skill when the ticket involves creating content: a blog post, social media copy, email newsletter, or similar written asset.

## Process

### Step 1: Read the ticket
Call \`getTicketDetails\` to understand the full brief: topic, target audience, tone, channel (blog/social/email), deadlines, and any reference materials.

### Step 2: Move to in_progress
Call \`updateTicketStatus\` with status \`in_progress\`.

### Step 3: Create the content
Based on the ticket type, produce the appropriate content:

**Blog post**: Title, intro hook, 3-5 body sections with headers, conclusion, and CTA.
**Social copy**: Platform-native post (Twitter/X: ≤280 chars; LinkedIn: professional long-form; Instagram: caption + hashtags).
**Email**: Subject line, preview text, headline, body copy (3 paragraphs max), CTA button text, unsubscribe footer note.

Write in brand voice: clear, direct, benefit-led. Optimize for engagement and conversion.

### Step 4: Add a comment with the draft
Call \`addComment\` with the full draft content so it's visible in the ticket for review.

### Step 5: Add artifact (if applicable)
If the content has been published or has a staging URL, call \`addArtifact\` with:
- type: \`document\` for drafts, \`deployment\` for live published URLs
- url: The document or published URL
- description: What the artifact is

### Step 6: Move to in_review
Call \`updateTicketStatus\` with status \`in_review\`.
`,
  },
  {
    name: "seo-workflow",
    description:
      "Used for SEO-focused content tickets. Covers keyword research, SEO-optimized writing, and meta data.",
    content: `# seo-workflow

## When to use
Use this skill when the ticket has SEO tags or the goal is to rank for specific search terms.

## Process

### Step 1: Read the ticket
Call \`getTicketDetails\` to identify the target keywords, target audience, content type (landing page, blog post, guide), and any existing content to improve.

### Step 2: Move to in_progress
Call \`updateTicketStatus\` with status \`in_progress\`.

### Step 3: Identify target keywords
From the ticket description and tags, extract:
- Primary keyword (the main search intent)
- 2-4 secondary/LSI keywords
- Long-tail keyword variations

Add a comment via \`addComment\` listing the keyword strategy.

### Step 4: Write SEO-optimized content
Produce content following these rules:
- Include primary keyword in: H1 title, first 100 words, at least one H2, meta description
- Use secondary keywords naturally throughout the body
- Target 1,200–2,000 words for blog posts (longer = more ranking signals)
- Structure with clear H2/H3 hierarchy
- Include internal link suggestions (mark as [INTERNAL LINK: topic])
- End with a strong CTA

### Step 5: Write the meta description
Compose a meta description of 150–160 characters that:
- Includes the primary keyword
- Summarizes the page value
- Has a subtle CTA

Add the meta description in a comment.

### Step 6: Add the content draft as an artifact
Call \`addArtifact\` with type \`document\` and the draft URL or document link.

### Step 7: Move to in_review
Call \`updateTicketStatus\` with status \`in_review\`.
`,
  },
];

export function getSkillContent(skillName: string): string | undefined {
  const skill = MARKETING_SKILLS.find((s) => s.name === skillName);
  return skill?.content;
}

export function buildSkillsPrompt(): string {
  return MARKETING_SKILLS.map(
    (skill) =>
      `## Skill: ${skill.name}\n${skill.description}\n\nTo load full instructions, request skill: ${skill.name}`
  ).join("\n\n");
}
