export interface SkillMeta {
  name: string;
  description: string;
}

export const CMO_SKILLS: SkillMeta[] = [
  {
    name: "go-to-market-planning",
    description:
      "Used when CMO receives a marketing strategy ticket. Analyzes the product/feature, defines target audience, identifies channels, drafts campaign strategy, creates sub-tickets for Designer (visual assets) and Marketing (content/distribution).",
  },
  {
    name: "content-strategy",
    description:
      "Used when CMO needs to plan content around a theme or launch. Defines content pillars, plans formats (blog, social, email), sets KPIs, creates sub-tickets.",
  },
  {
    name: "campaign-design",
    description:
      "Used when designing a specific marketing campaign — defines goal, audience, channels, messaging hierarchy, KPIs, and creates briefs for Designer and Marketing agents.",
  },
];

const SKILL_CONTENT: Record<string, string> = {
  "go-to-market-planning": `# Go-to-Market Planning

## When to use
Activate this skill when:
- A ticket involves launching a new product, feature, or major update
- The ticket asks for marketing strategy, positioning, or launch planning
- A new audience segment or market needs to be addressed
- Competitive positioning needs to be defined

## Process

### Phase 1: Read the Ticket
Call getTicketDetails to load the full context. Identify: what is being launched, when, for whom, and why.

### Phase 2: Analyze the Product/Feature
Assess:
- **What problem does it solve?** — the core value proposition
- **Who is it for?** — primary and secondary audience segments
- **What makes it different?** — key differentiators vs. alternatives
- **What stage is this?** — beta, GA, expansion into new market

### Phase 3: Define Target Audience
For each audience segment, define:
- Demographics and psychographics
- Pain points this solves
- Where they spend time online (channels)
- Messaging angle that resonates with them
- Objections to overcome

### Phase 4: Identify Channels
Prioritize channels based on audience and stage:
- **Owned**: blog, email list, social profiles, product in-app
- **Earned**: PR, partnerships, community, word-of-mouth
- **Paid**: search, social ads, sponsorships (flag if budget needed)

### Phase 5: Draft Campaign Strategy
Structure the GTM campaign:
1. **Positioning statement** — one sentence: "For [audience] who [need], [product] is [category] that [benefit]. Unlike [alternative], [key differentiator]."
2. **Core messaging** — 3 key messages, each with supporting proof point
3. **Launch phases** — pre-launch (build anticipation), launch day, post-launch (nurture)
4. **Success metrics** — define KPIs: signups, MQLs, conversions, coverage, etc.

### Phase 6: Create Sub-Tickets
Use createSubTicket for:
- **Designer**: visual assets (hero image, social graphics, email header, landing page visuals)
  - assignee: "Designer"
  - Include dimensions, brand guidelines references, and deadline in description
- **Marketing**: content and distribution (blog post, email campaign, social copy, press outreach)
  - assignee: "Marketing"
  - Include key messages, target channels, and KPIs in description

### Phase 7: Add Strategy Comment
Post the full GTM strategy as a comment on the parent ticket for team visibility.
Update parent ticket status to in_progress.`,

  "content-strategy": `# Content Strategy

## When to use
Activate this skill when:
- A ticket asks for a content calendar, content plan, or editorial strategy
- A product launch or campaign needs supporting content
- CMO needs to establish brand voice or content themes
- Organic growth through content is a goal

## Process

### Phase 1: Read the Ticket
Call getTicketDetails to understand the context: what theme, launch, or goal this content strategy supports.

### Phase 2: Define Content Pillars
Identify 3-5 content pillars — recurring themes that:
- Align with the product's value proposition
- Address audience pain points
- Demonstrate authority and expertise
- Are sustainable to produce consistently

For each pillar: name, description, and 3 example topics.

### Phase 3: Plan Formats
Map content types to pillars and channels:

| Format | Best for | Frequency | Channel |
|--------|----------|-----------|---------|
| Long-form blog | SEO, thought leadership | 2x/month | Blog, LinkedIn |
| Short-form social | Engagement, reach | 3-5x/week | Twitter/X, LinkedIn |
| Email newsletter | Retention, nurture | Weekly | Email list |
| Video/demo | Product education | 1x/month | YouTube, social |
| Case study | Social proof | 1x/quarter | Blog, sales |

Select the formats appropriate for this strategy based on audience and resources.

### Phase 4: Set KPIs
Define measurable outcomes for 30/60/90 days:
- **Traffic**: organic visits, referral traffic
- **Engagement**: time on page, shares, comments
- **Conversion**: email signups, demo requests, trial starts
- **SEO**: keyword rankings, backlinks

### Phase 5: Create Sub-Tickets
Use createSubTicket for concrete deliverables:
- **Designer**: visual templates, brand assets, thumbnail designs
  - assignee: "Designer"
  - Specify formats, dimensions, and style direction
- **Marketing**: content production and distribution execution
  - assignee: "Marketing"
  - Include content brief, pillar mapping, KPIs, and publishing schedule

### Phase 6: Add Strategy Comment
Post the complete content strategy (pillars, formats, KPIs, calendar) as a comment on the parent ticket.
Update parent ticket status to in_progress.`,

  "campaign-design": `# Campaign Design

## When to use
Activate when:
- A ticket asks for a specific campaign (product launch, seasonal, event, outbound)
- Paid advertising needs to be planned
- An email campaign or outbound sequence is required
- A multi-channel campaign needs a unified brief

## Process

### Phase 1: Campaign Brief
Use getTicketDetails to load full context, then define:

**Goal** (pick one primary):
- Awareness: reach new audiences
- Acquisition: drive signups or purchases
- Retention: re-engage existing users
- Revenue: convert pipeline to paying customers

**Target Audience**
- Who specifically? (role, company size, pain point)
- Where do they spend time? (channels they use)
- What do they already believe? (meet them there, don't fight their worldview)

**Offer**
- What are we asking them to do?
- What's in it for them? (discount, resource, access, social proof)
- What creates urgency or scarcity?

### Phase 2: Competitor Research
Use exaSearch to:
- Find how competitors position similar campaigns
- Identify messaging patterns to differentiate from
- Look for "[product category] marketing campaign examples" or "[industry] ad copy"

### Phase 3: Messaging Architecture

**Hook** (captures attention — specific, surprising, or provocative):
Write 3 variants, select the strongest.

**Message Hierarchy:**
1. Hook — pattern interrupt
2. Problem agitation — make the pain vivid
3. Solution reveal — introduce product/offer
4. Proof — social proof, data, testimonial
5. CTA — single, clear, low-friction action

**Channel-Specific Copy:**
- Paid social: headline (5 words), body (30 words), CTA
- Email subject: 3 variants (direct, curiosity, benefit)
- Landing page headline + sub-headline

### Phase 4: Campaign Structure

| Channel | Format | Budget % | Duration |
|---------|--------|----------|----------|
| Paid Social | [ad format] | [%] | [weeks] |
| Email | [sequence length] | - | [weeks] |
| Content | [posts] | - | [ongoing] |
| Retargeting | [format] | [%] | [weeks] |

**KPIs by funnel stage:**
- Top: Impressions, CPM, reach
- Mid: CTR, landing page CVR
- Bottom: CAC, ROAS, trial starts, revenue

### Phase 5: Create Sub-Tickets

**Designer ticket:**
- Title: "Campaign Assets: [Campaign Name]"
- Include: ad dimensions needed, color palette, tone, 3 headline copy variants
- Tag: "design", "campaign"
- Assignee: Designer

**Marketing ticket:**
- Title: "Campaign Execution: [Campaign Name]"
- Include: full messaging hierarchy, channel plan, A/B test variants, UTM conventions, KPIs
- Tag: "marketing", "campaign"
- Assignee: Marketing

Post the full campaign brief as a comment on the parent ticket.
Update parent ticket to in_progress once briefs are created.`,
};

export function getSkillContent(name: string): string | null {
  return SKILL_CONTENT[name] ?? null;
}

export function buildSkillsPrompt(): string {
  if (CMO_SKILLS.length === 0) return "";
  const list = CMO_SKILLS.map(
    (s) => `- **${s.name}**: ${s.description}`
  ).join("\n");
  return `

## Available Skills
You have specialized skills for complex workflows. Use the loadSkill tool to load a skill's full instructions when the task matches.
${list}`;
}
