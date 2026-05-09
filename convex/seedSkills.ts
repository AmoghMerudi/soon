import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("skills").collect();
    if (existing.length > 0) return { status: "already seeded", count: existing.length };

    const skills = [
      {
        name: "code-review",
        description:
          "Review code for bugs, security issues, and best practices. Use when asked to review PRs or code snippets.",
        content: `# Code Review\n\n## When to use\nUse this skill when reviewing pull requests, code snippets, or entire files for quality.\n\n## Checklist\n1. **Security**: Check for injection, XSS, auth bypass, secrets in code\n2. **Correctness**: Verify logic, edge cases, null handling, error paths\n3. **Performance**: Look for N+1 queries, unnecessary re-renders, large payloads\n4. **Readability**: Clear naming, small functions, minimal nesting\n5. **Testing**: Verify test coverage for critical paths`,
        agent: "developer",
        tags: ["coding", "review", "quality"],
      },
      {
        name: "ticket-triage",
        description:
          "Triage and prioritize tickets. Use when new tickets need classification or when planning sprints.",
        content: `# Ticket Triage\n\n## When to use\nUse this skill when tickets need to be prioritized, categorized, or assigned.\n\n## Priority matrix\n- **Critical**: System down, data loss, security breach\n- **High**: Feature broken for many users, blocking deployment\n- **Medium**: Feature degraded, workaround exists\n- **Low**: Cosmetic issues, nice-to-have improvements`,
        agent: "ceo",
        tags: ["management", "planning", "triage"],
      },
      {
        name: "deploy-checklist",
        description:
          "Pre-deployment checklist for shipping to production. Use before any deployment.",
        content: `# Deploy Checklist\n\n## Pre-deploy\n- All tests pass locally and in CI\n- No TypeScript errors\n- Environment variables are set in production\n- Database migrations are applied\n\n## Deploy\n- Deploy to preview/staging first\n- Verify staging works end-to-end\n- Deploy to production\n- Monitor error rates for 15 minutes`,
        agent: "developer",
        tags: ["deployment", "ops", "checklist"],
      },
      {
        name: "content-writing",
        description:
          "Write marketing copy, blog posts, and social media content. Use for any content creation tasks.",
        content: `# Content Writing\n\n## Brand voice\n- Professional but approachable\n- Technical accuracy without jargon\n- Concise and action-oriented\n\n## Content types\n- Blog posts: Start with a compelling hook, structure with clear headers\n- Social media: Keep concise, use 1-2 relevant hashtags\n- Product copy: Lead with the benefit, not the feature`,
        agent: "marketing",
        tags: ["writing", "marketing", "content"],
      },
      {
        name: "design-system",
        description:
          "Design system guidelines including colors, typography, spacing, and component patterns.",
        content: `# Design System\n\n## Spacing scale\nUse a consistent 4px base: 4, 8, 12, 16, 24, 32, 48, 64\n\n## Component patterns\n- Cards: Rounded corners, subtle shadow, consistent padding\n- Buttons: Clear hierarchy (primary, secondary, ghost)\n- Forms: Labels above inputs, clear error states`,
        agent: "designer",
        tags: ["design", "ui", "components"],
      },
    ];

    const ids = [];
    for (const skill of skills) {
      const id = await ctx.db.insert("skills", {
        ...skill,
        version: 1,
        isActive: true,
      });
      ids.push(id);
    }

    return { status: "seeded", count: ids.length };
  },
});
