# Agent System Specification

> Complete spec for the 6-agent AI company operating system.
> Covers each agent's role, tools, memory, permissions, and the orchestration layer connecting them.

---

## Architecture Overview

```
                        ┌─────────────────────────────────┐
                        │          USER / DASHBOARD        │
                        │   (Next.js App Router + Convex)  │
                        └──────────────┬──────────────────┘
                                       │
                                ┌──────▼──────┐
                                │  CEO Agent  │
                                │  (Strategy) │
                                └──────┬──────┘
                                       │
                          ┌────────────┼────────────┐
                          │                         │
                   ┌──────▼───────┐          ┌──────▼──────┐
                   │  CTO Agent   │          │  CMO Agent  │
                   │  (Strategy)  │          │  (Strategy) │
                   └──────┬───────┘          └──────┬──────┘
                          │                         │
                   ┌──────▼──────┐          ┌───────┼───────┐
                   │  Developer  │          │               │
                   │   Agent     │   ┌──────▼──────┐ ┌──────▼──────┐
                   │ (Execution) │   │   Designer  │ │  Marketing  │
                   └─────────────┘   │    Agent    │ │   Agent     │
                                     │ (Execution) │ │ (Execution) │
                                     └─────────────┘ └─────────────┘
                          │                 │                  │
                   ┌──────▼─────────────────▼──────────────────▼──────┐
                   │                   SHARED LAYER                    │
                   │  Convex (state) + Mem0 (memory) + Composio (tools)│
                   └──────────────────────────────────────────────────┘
```

### Two-Tier Hierarchy

- **CEO** delegates to CTO and CMO. CEO does not directly assign to execution agents.
- **CTO** (reports to CEO) delegates engineering work to the Developer agent.
- **CMO** (reports to CEO) delegates to the Designer and Marketing agents.
- **Execution Agents** (Developer, Designer, Marketing) pick up tickets from their respective strategic agent, execute work, and report back.

### Technology Stack


| Component      | Technology                                               | Purpose                               |
| -------------- | -------------------------------------------------------- | ------------------------------------- |
| Agent Runtime  | `DurableAgent` from `@workflow/ai`                       | Crash-safe, retryable agent execution |
| Orchestration  | Vercel Workflow SDK (`"use workflow"` / `"use step"`)    | Durable step-based workflows          |
| Shared State   | Convex (`tickets`, `comments`, `artifacts`, `agentLogs`) | Real-time source of truth             |
| Task Queue     | Convex scheduled functions → Workflow `start()`          | Ticket-driven agent dispatch          |
| Memory         | Mem0 Cloud (semantic) + Convex (structured)              | Persistent cross-agent memory         |
| External Tools | Composio MCP                                             | 982+ platform integrations            |
| LLM Provider   | OpenAI GPT models via `@ai-sdk/openai`                   | All agent reasoning                   |
| UI Reactivity  | Convex reactive queries                                  | Real-time dashboard updates           |


---

## Memory Architecture

### Why Dual-Layer Memory

**Mem0 Cloud** handles semantic, conversational, and decision memory — the "soft" context that agents need to reason about past interactions, preferences, and learned knowledge.

**Convex** remains the structured source of truth — tickets, artifacts, logs, and skills.

### Mem0 Scoping Model

Mem0 supports four scoping dimensions that map directly to our multi-agent system:


| Dimension  | Value                                                                      | Purpose                   |
| ---------- | -------------------------------------------------------------------------- | ------------------------- |
| `app_id`   | `"0to1"`                                                                   | System-wide shared memory |
| `agent_id` | `"ceo"` / `"cto"` / `"cmo"` / `"developer"` / `"designer"` / `"marketing"` | Role-private memory       |
| `user_id`  | org/company identifier                                                     | Per-organization memory   |
| `run_id`   | workflow execution ID                                                      | Per-execution context     |


**Access patterns:**

- `agent_id` only → role-private memory (developer's codebase patterns, CMO's brand voice)
- `app_id` only → all shared memory (cross-agent visibility for CEO)
- `agent_id` + `app_id` + query → semantic search within role, shared context

### Memory Integration

```typescript
// Before each agent step: retrieve relevant memory
const memories = await mem0.search(currentTaskContext, {
  agent_id: "developer",
  app_id: "0to1",
  limit: 10,
});

// After significant actions: store new memory
await mem0.add(
  [{ role: "assistant", content: "Decided to use edge functions for the payment webhook because..." }],
  { agent_id: "developer", app_id: "0to1", metadata: { ticket_id: "..." } }
);
```

### Memory Types by Agent


| Agent     | Private Memory Examples                                                      | Shared Memory Examples                                        |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| CEO       | Strategic priorities, stakeholder preferences, resource allocation rationale | Business goals, product direction, cross-team decisions       |
| CTO       | Architecture decisions, tech debt tracking, performance baselines            | Technical constraints, stack decisions, infrastructure status |
| CMO       | Brand voice guidelines, audience personas, campaign history                  | Positioning, messaging frameworks, market insights            |
| Developer | Codebase patterns, past bug fixes, dependency decisions                      | Implementation approaches, API contracts                      |
| Designer  | Design system choices, color/typography, user research                       | Brand assets, component patterns                              |
| Marketing | Content performance data, engagement patterns                                | Published content, campaign results                           |


### Mem0 Pricing Path


| Tier    | Cost    | Capacity                  | When to Use                         |
| ------- | ------- | ------------------------- | ----------------------------------- |
| Free    | $0      | 10K adds, 1K retrievals   | Development                         |
| Starter | $19/mo  | 50K adds, 5K retrievals   | Early testing                       |
| Growth  | $79/mo  | 200K adds, 20K retrievals | Production                          |
| Pro     | $249/mo | 500K adds, graph memory   | Scale (agent relationship modeling) |


Startup program: 3 months free Pro for companies under $5M funding.

### Package

```
@mem0/vercel-ai-provider  — native Vercel AI SDK integration
```

---

## Agent Specifications

---

### CEO Agent



**Role**: Chief strategist. Receives business goals, decomposes into workstreams, delegates to all agents, reviews outcomes, makes priority calls.

**Model**: `openai/gpt-4o` (via Workflow)

**Runtime**: `DurableAgent` from `@workflow/ai`

**Personality**:

- Think like a startup CEO — bias toward action, speed, and iteration
- Focus on business outcomes, not implementation details
- Make clear priority calls when resources conflict
- Always explain the "why" behind decisions

**Native Tools (Convex):**


| Tool                   | Action                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| `createTicket`         | Create work items with title, description, priority, tags, assignment |
| `assignTicket`         | Assign/reassign tickets to agents                                     |
| `updateTicketStatus`   | Move tickets through workflow states                                  |
| `addComment`           | Add strategic context or feedback to tickets                          |
| `getTicketsByStatus`   | Query tickets by status for pipeline visibility                       |
| `getTicketsByAssignee` | See what each agent is working on                                     |
| `reviewArtifact`       | Review completed work and approve/request changes                     |
| `createSubTicket`      | Break tickets into sub-tasks (max depth: 3)                           |


**Composio Tools:**


| Tool                     | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| Slack                    | Send announcements, read team updates    |
| Google Calendar          | Schedule reviews, check availability     |
| Google Docs / Notion     | Read/write strategic documents, PRDs     |
| Google Sheets / Airtable | Access business metrics, OKRs            |
| Gmail / Outlook          | Draft external communications            |
| Stripe                   | Check revenue metrics, subscription data |
| Linear / Jira            | Sync with external project management    |


**Mem0 Scoping:**

- Reads: `app_id="0to1"` (sees all shared memory)
- Writes: `agent_id="ceo"` + `app_id="0to1"`

**Trigger**: User input (business idea, directive) or scheduled review cycle (cron)

**Safety Rails:**

- Max 20 steps per workflow execution
- Max 10 tickets created per single execution
- Cannot directly execute code, create designs, or post to social media

---

### CTO Agent

**Role**: Technical strategist. Reviews engineering tickets, defines architecture, sets technical standards, guides the developer agent.

**Model**: `openai/gpt-4o` (via Workflow)

**Runtime**: `DurableAgent` from `@workflow/ai`

**Personality**:

- Think like a pragmatic CTO — balance technical excellence with shipping speed
- Make architecture decisions with clear tradeoff analysis
- Push back on scope creep with technical reasoning
- Advocate for code quality, testing, and observability

**Native Tools (Convex):**


| Tool                 | Action                                                      |
| -------------------- | ----------------------------------------------------------- |
| `createTicket`       | Create technical tickets with architecture context          |
| `assignTicket`       | Assign engineering work to developer agent                  |
| `addComment`         | Add technical guidance, architecture decisions              |
| `reviewArtifact`     | Review PRs, deployments, technical artifacts                |
| `updateTicketStatus` | Approve/reject technical work                               |
| `getTicketsByTag`    | Filter for `engineering`, `infrastructure`, `security` tags |
| `createSubTicket`    | Break technical stories into implementation tasks           |


**Composio Tools:**


| Tool               | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| GitHub             | Review PRs, check CI status, read code, manage repos |
| Linear / Jira      | Technical sprint management                          |
| Sentry             | Monitor error rates, review exceptions               |
| New Relic          | Infrastructure monitoring, APM                       |
| Notion             | Technical documentation, ADRs                        |
| Slack              | Technical discussions, incident channels             |
| PostHog / Mixpanel | Product analytics for technical decisions            |
| Vercel             | Deployment status, environment management            |


**Mem0 Scoping:**

- Reads: `app_id="0to1"` (shared) + `agent_id="cto"` (private)
- Writes: `agent_id="cto"` + `app_id="0to1"`

**Trigger**: New tickets tagged `engineering` / `infrastructure` / `security`, or CEO delegation

**Safety Rails:**

- Max 15 steps per workflow execution
- Cannot directly write code, push to repos, or deploy
- Can only delegate implementation to developer agent

---

### CMO Agent

**Role**: Marketing strategist. Plans go-to-market, defines brand voice, sets content calendar, guides the marketing and designer agents.

**Model**: `openai/gpt-4o` (via Workflow)

**Runtime**: `DurableAgent` from `@workflow/ai`

**Personality**:

- Think like a growth-minded CMO — data-driven decisions with creative instinct
- Focus on positioning, messaging, and audience understanding
- Plan campaigns with clear KPIs and measurement criteria
- Balance brand consistency with experimentation

**Native Tools (Convex):**


| Tool                 | Action                                                    |
| -------------------- | --------------------------------------------------------- |
| `createTicket`       | Create marketing campaigns, content briefs                |
| `assignTicket`       | Assign content/campaign work to marketing agent           |
| `addComment`         | Add brand guidelines, messaging feedback                  |
| `reviewArtifact`     | Review content drafts, campaign assets                    |
| `updateTicketStatus` | Approve/reject marketing deliverables                     |
| `getTicketsByTag`    | Filter for `marketing`, `content`, `social`, `email` tags |
| `createSubTicket`    | Break campaigns into individual deliverables              |


**Composio Tools:**


| Tool                  | Purpose                               |
| --------------------- | ------------------------------------- |
| Google Analytics      | Traffic analysis, conversion tracking |
| Google Search Console | SEO performance, keyword rankings     |
| Google Ads / Meta Ads | Ad spend and performance review       |
| Twitter Analytics     | Social engagement metrics             |
| LinkedIn              | Professional network analytics        |
| Slack                 | Marketing team communication          |


**Mem0 Scoping:**

- Reads: `app_id="0to1"` (shared) + `agent_id="cmo"` (private)
- Writes: `agent_id="cmo"` + `app_id="0to1"`

**Trigger**: New tickets tagged `marketing` / `content` / `growth`, or CEO delegation

**Safety Rails:**

- Max 15 steps per workflow execution
- Cannot directly post to social media, send emails, or run ads
- Can only delegate execution to marketing agent

---

### Developer Agent

**Role**: Executes engineering work. Writes code, creates PRs, runs tests, deploys, manages infrastructure.

**Model**: `openai/gpt-4o` (via Workflow)

**Runtime**: `DurableAgent` from `@workflow/ai`

**Personality**:

- Think like a senior full-stack engineer — clean, tested, production-ready code
- Follow existing patterns in the codebase before introducing new ones
- Write tests alongside implementation
- Communicate blockers early, don't spin on problems

**Native Tools (Convex):**


| Tool                 | Action                                                       |
| -------------------- | ------------------------------------------------------------ |
| `updateTicketStatus` | Move ticket through `in_progress` → `in_review` → `resolved` |
| `addComment`         | Add implementation notes, technical decisions                |
| `addArtifact`        | Attach PRs, deployment URLs, documentation links             |
| `getTicketDetails`   | Read full ticket context including parent tickets            |
| `markBlocked`        | Flag blockers with reason (auto-escalates after 5 min)       |


**Composio Tools:**


| Tool                     | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| GitHub                   | Create branches, commit code, open PRs, manage issues |
| Vercel                   | Deploy previews, check build status, manage env vars  |
| Sentry                   | Check for errors after deployment                     |
| Convex                   | Database operations, schema changes, mutations        |
| npm / Package registries | Dependency management                                 |
| Postman                  | API testing and validation                            |


**Dedicated Execution Tools:**


| Tool                    | Purpose                             |
| ----------------------- | ----------------------------------- |
| E2B Sandbox             | Isolated code execution environment |
| Code Interpreter        | Run and test code snippets          |
| File System (sandboxed) | Read/write project files            |
| Shell (sandboxed)       | Run build, test, lint commands      |
| Firecrawl               | Scrape documentation for reference  |


**Mem0 Scoping:**

- Reads: `agent_id="developer"` (own context) + `agent_id="cto"` (technical guidance)
- Writes: `agent_id="developer"` + `app_id="0to1"`

**Trigger**: Ticket assigned with tags `engineering` / `infrastructure` / `bug`

**Safety Rails:**

- Max 30 steps per workflow (engineering tasks are more complex)
- All code execution in sandboxed environment (E2B)
- PR required for all code changes (no direct pushes to main)
- Max 5 active tickets at a time
- Auto-escalate to CTO if blocked for >5 minutes

---

### Designer Agent

**Role**: Executes design work. Creates mockups, UI components, visual assets, design system updates.

**Model**: `openai/gpt-4o` (via Workflow)

**Runtime**: `DurableAgent` from `@workflow/ai`

**Personality**:

- Think like a product designer — user-centered, detail-oriented, systematic
- Follow the existing design system before introducing new patterns
- Consider accessibility, responsiveness, and performance
- Provide visual rationale for design decisions

**Native Tools (Convex):**


| Tool                 | Action                                                     |
| -------------------- | ---------------------------------------------------------- |
| `updateTicketStatus` | Move ticket through design workflow states                 |
| `addComment`         | Add design rationale, alternatives considered              |
| `addArtifact`        | Attach Figma links, mockup images, design tokens           |
| `getTicketDetails`   | Read full context including brand guidelines               |
| `markBlocked`        | Flag blockers (missing brand assets, unclear requirements) |


**Composio Tools:**


| Tool         | Purpose                                       |
| ------------ | --------------------------------------------- |
| Figma        | Create/update designs, components, prototypes |
| Miro / Mural | Wireframing, user flow mapping                |
| Canva        | Quick visual assets, social graphics          |
| Cloudinary   | Image optimization, asset management          |
| ImageKit     | Image transformation, CDN delivery            |
| Remove.bg    | Background removal for product images         |
| Brandfetch   | Brand asset retrieval                         |
| Google Drive | Asset storage and sharing                     |


**Dedicated Execution Tools:**


| Tool                         | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| GPT Image Gen 2 (via OpenAI) | Generate concept art, illustrations, icons       |
| Code Interpreter             | Generate CSS/Tailwind design tokens              |
| File System (sandboxed)      | Write component code (React/Tailwind)            |
| Firecrawl                    | Research design inspiration, competitor analysis |


**Mem0 Scoping:**

- Reads: `agent_id="designer"` (own context) + `agent_id="cmo"` (brand guidance)
- Writes: `agent_id="designer"` + `app_id="0to1"`

**Trigger**: Ticket assigned with tags `design` / `ui` / `brand`

**Safety Rails:**

- Max 20 steps per workflow
- Max 5 active tickets at a time
- Design artifacts must be reviewed by CTO (system design) or CMO (brand) before implementation
- Auto-escalate if blocked for >5 minutes

---

### Marketing Agent

**Role**: Executes marketing work. Writes content, manages social media, runs email campaigns, optimizes SEO.

**Model**: `openai/gpt-4o` (via Workflow)

**Runtime**: `DurableAgent` from `@workflow/ai`

**Personality**:

- Think like a growth marketer — test-driven, data-informed, creative
- Write in the brand voice established by CMO
- Optimize for engagement and conversion
- A/B test whenever possible, measure everything

**Native Tools (Convex):**


| Tool                 | Action                                                         |
| -------------------- | -------------------------------------------------------------- |
| `updateTicketStatus` | Move ticket through content workflow states                    |
| `addComment`         | Add content drafts, performance metrics                        |
| `addArtifact`        | Attach published URLs, campaign reports, analytics screenshots |
| `getTicketDetails`   | Read full context including campaign briefs                    |
| `markBlocked`        | Flag blockers (missing assets, pending approvals)              |


**Composio Tools:**


| Tool                           | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| Twitter / X                    | Post tweets, threads, engage with audience |
| LinkedIn                       | Publish articles, company updates          |
| Instagram / TikTok             | Visual content posting                     |
| Reddit                         | Community engagement, product launches     |
| YouTube                        | Video descriptions, metadata               |
| Typefully                      | Draft and schedule Twitter threads         |
| Mailchimp / Klaviyo / SendGrid | Create and send email campaigns            |
| Brevo / Customer.io            | Marketing automation sequences             |
| Google Ads / Meta Ads          | Create and manage ad campaigns             |
| Google Search Console          | Submit sitemaps, monitor indexing          |
| Ahrefs / Semrush               | Keyword research for content               |
| WordPress / Webflow            | Publish blog posts, landing pages          |
| Hashnode / DEV Community       | Developer community content                |
| Canva                          | Create visual assets for posts             |
| Buffer / Ayrshare              | Cross-platform social scheduling           |
| Apollo / Hunter                | Lead enrichment for outbound campaigns     |
| Lemlist / Instantly            | Outbound email sequences                   |
| Google Analytics               | Campaign performance tracking              |


**Dedicated Execution Tools:**


| Tool             | Purpose                                      |
| ---------------- | -------------------------------------------- |
| Code Interpreter | Generate analytics reports, data processing  |
| Firecrawl        | Competitive content research, trend analysis |
| Web Search       | Research topics, find trending content       |


**Mem0 Scoping:**

- Reads: `agent_id="marketing"` (own context) + `agent_id="cmo"` (strategy, brand voice)
- Writes: `agent_id="marketing"` + `app_id="0to1"`

**Trigger**: Ticket assigned with tags `content` / `social` / `email` / `seo` / `ads`

**Safety Rails:**

- Max 20 steps per workflow
- Max 5 active tickets at a time
- All external-facing content must be reviewed by CMO before publishing
- Requires CMO approval for ad spend above threshold
- Auto-escalate if blocked for >5 minutes

---

## Composio Integration Strategy

### What Composio Provides

Composio exposes 982+ platform integrations as tools consumable by AI agents. It handles:

- **Authentication**: OAuth, API keys, custom auth — all managed per entity
- **MCP exposure**: Tools exposed as Model Context Protocol servers, directly consumable by the AI SDK
- **Connection management**: Token storage and refresh across all integrations

### Entity Model

Each agent gets its own Composio entity (maps to `agent_id`):

```typescript
import { getComposioTools } from "composio-core";

const developerTools = await getComposioTools({
  entity_id: "developer",
  apps: ["github", "vercel"],
  actions: ["GITHUB_CREATE_PR", "GITHUB_PUSH_CODE", "VERCEL_DEPLOY"],
});
```

### Integration Phases

**Phase 1 — MVP (launch with these):**


| Agent     | Composio Tools                                   |
| --------- | ------------------------------------------------ |
| CEO       | Slack, Google Docs, Google Sheets, Linear        |
| CTO       | GitHub, Sentry, Slack, Linear                    |
| CMO       | Google Analytics, Slack, Google Ads              |
| Developer | GitHub, Vercel, Convex                           |
| Designer  | Figma, Cloudinary                                |
| Marketing | Twitter/X, LinkedIn, Mailchimp, Google Analytics |


**Phase 2 — Growth (add as needed):**


| Agent     | Composio Tools                                |
| --------- | --------------------------------------------- |
| CEO       | Stripe, Google Calendar, Gmail                |
| CTO       | New Relic, Vercel, Notion                     |
| CMO       | Meta Ads, Twitter Analytics, LinkedIn         |
| Developer | E2B Sandbox, Sentry, Postman                  |
| Designer  | Miro, Canva, ImageKit, Remove.bg              |
| Marketing | SendGrid, Ayrshare, Reddit, WordPress, Apollo |


### Full Composio Catalog by Agent

**CEO**: Slack, Microsoft Teams, Discord, Gmail, Outlook, Google Chat, Zoom, Webex, Telegram, WhatsApp, Missive, Google Docs, Google Sheets, Google Slides, Google Drive, Notion, Airtable, Coda, Dropbox, OneDrive, Box, SharePoint, Confluence, Excel, Google Calendar, Calendly, Cal.com, Schedulonce, Google Tasks, Todoist, TickTick, Asana, Trello, Monday, ClickUp, Linear, Pipedrive, Attio, Stripe, QuickBooks, Xero, FreshBooks, Zoho Books, Razorpay, PayPal, Brex, Ramp, Mercury, BambooHR, Ashby, Breezy HR, Recruitee, Lever, Gusto, DocuSign, PandaDoc, Dropbox Sign, BoldSign, Google Analytics, Metabase, Klipfolio, Databox, NewsAPI, Hacker News, Alpha Vantage, CoinMarketCap

**CTO**: Jira, Linear, Asana, ClickUp, Monday, Shortcut, Trello, Wrike, Basecamp, Productboard, GitHub, Gitea, Sourcegraph, Sentry, New Relic, Rollbar, Bugsnag, Better Stack, UptimeRobot, DigitalOcean, Render, Fly, Buildkite, CircleCI, Supabase, Neon, ClickHouse, InfluxDB, Elasticsearch, Turso, Convex, BigQuery, Databricks, Prisma, PostHog, Mixpanel, Amplitude, Metabase, Plausible, Microsoft Clarity, Notion, Coda, Outline, Slite, Slack, Microsoft Teams, Discord, Zoom, Bitwarden, 1Password, JumpCloud, Doppler

**CMO**: Twitter, LinkedIn, Facebook, Instagram, TikTok, Reddit, YouTube, Typefully, Ayrshare, Google Ads, LinkedIn Ads, Meta Ads, Reddit Ads, Google Search Console, Google Analytics, Slack

**Developer**: GitHub, Gitea, CircleCI, Buildkite, Codemagic, DeployHQ, Codacy, Convex, Neon, ClickHouse, NocoDB, Turso, Prisma, DigitalOcean, Render, Fly, Postman, SwaggerHub, Ngrok, Firecrawl, Apify, Browserbase, ScrapingBee, OpenAI, Replicate, Hugging Face, Fal.ai, ElevenLabs, Sentry, Rollbar, Bugsnag, Honeybadger, E2B, Code Interpreter, Exa, Tavily, Algolia

**Designer**: Figma, Miro, Mural, Canva, Penpot, Plasmic, Cloudinary, ImageKit, Remove.bg, TinyPNG, Kraken.io, DreamStudio, Replicate, Fal.ai, Shotstack, HeyGen, Loom, Dropbox, Google Drive, OneDrive, Box, Webflow, Contentful, Storyblok, Sanity, PDF.co, CraftMyPDF, DocuGenerate, Brandfetch, Logo.dev, Dovetail, Mobbin MCP

**Marketing**: Twitter, LinkedIn, Facebook, Instagram, TikTok, Reddit, YouTube, Typefully, Ayrshare, Postiz, Buffer, Mailchimp, Klaviyo, ActiveCampaign, SendGrid, Brevo, Customer.io, MailerLite, Loops.so, Moosend, Lemlist, Instantly, Reply.io, Google Ads, Meta Ads, LinkedIn Ads, Reddit Ads, Ahrefs, Semrush, Google Search Console, DataForSEO, Moz, SerpApi, Webflow, WordPress, Hashnode, DEV Community, Apollo, Hunter, LeadIQ, PhantomBuster, People Data Labs, Tapfiliate, Gumroad, Lemon Squeezy, Google Analytics, PostHog, Mixpanel, Amplitude, Segment, Eventbrite, Demio, Clickmeeting, Canva

---

## Communication & Task Flow

### Primary Flow

```
1. USER submits business idea
       │
2. CEO AGENT receives idea
       │ Decomposes into workstreams
       │ Creates tickets tagged by domain
       │ Delegates to CTO and CMO
       │
       ├──→ CTO AGENT receives engineering tickets (from CEO)
       │         │ Reviews technical feasibility
       │         │ Adds architecture guidance
       │         │ Creates sub-tickets for developer
       │         │ Assigns to developer agent
       │         │
       │         └──→ DEVELOPER AGENT picks up ticket (from CTO)
       │                   │ Reads ticket + CTO guidance + memory
       │                   │ Writes code in E2B sandbox
       │                   │ Creates PR via GitHub
       │                   │ Deploys preview via Vercel
       │                   │ Updates ticket → "in_review"
       │                   │
       │              CTO AGENT reviews → approves or requests changes
       │
       ├──→ CMO AGENT receives marketing/design tickets (from CEO)
       │         │ Defines campaign strategy
       │         │ Creates content briefs
       │         │ Assigns to marketing + designer
       │         │
       │         ├──→ DESIGNER AGENT creates visuals (from CMO)
       │         │         │ Figma mockups, social graphics
       │         │         │ GPT Image Gen 2 for illustrations
       │         │         │ Updates ticket with artifacts
       │         │
       │         └──→ MARKETING AGENT creates content (from CMO)
       │                   │ Writes copy, schedules posts
       │                   │ Creates email campaigns
       │                   │ Updates ticket with published URLs
       │                   │
       │              CMO AGENT reviews all marketing/design output
       │
3. CEO AGENT monitors all workstreams via CTO and CMO
       │ Reviews completed work reported by CTO and CMO
       │ Creates follow-up tickets delegated to CTO or CMO
       │ Reports back to user
```

### Convex as Message Bus

Agents communicate indirectly through Convex tables:

```
Agent A writes → Convex mutation → Convex scheduled function → triggers Agent B workflow
Agent B writes → Convex mutation → reactive query → Dashboard updates in real-time
```

### Ticket State Machine

```
  backlog ──→ in_progress ──→ in_review ──→ resolved
     │              │              │
     └──────────────┴──── blocked ─┘
                          (auto-escalates after 5 min)
```

### Agent Dispatch Pattern

```typescript
// In Convex mutation — when a ticket is assigned, schedule the agent workflow
export const assignTicket = mutation({
  handler: async (ctx, { ticketId, assignee }) => {
    await ctx.db.patch(ticketId, { assignee, status: "backlog" });

    // Schedule the appropriate agent workflow
    await ctx.scheduler.runAfter(0, api.agents.dispatch, {
      ticketId,
      agentRole: assignee,
    });
  },
});

// In Convex action — dispatch to the correct Workflow agent
export const dispatch = action({
  handler: async (ctx, { ticketId, agentRole }) => {
    const ticket = await ctx.runQuery(api.queries.getTicket, { ticketId });

    const { start } = await import("workflow/api");
    await start({
      url: `${process.env.VERCEL_URL}/api/agents/${agentRole}`,
      body: { ticketId, ticket },
    });
  },
});
```

---

## Permission Model

### Tool-Set Isolation

Each agent can ONLY access tools defined in its specification. Enforced at three levels:

1. **Agent definition**: Tools explicitly listed per `DurableAgent` instance
2. **Composio entity**: Each agent authenticates independently via its own entity
3. **Convex mutations**: Validate `createdBy` field against allowed actions per role

### Permission Matrix


| Capability               | CEO | CTO | CMO | Dev | Design | Mkt |
| ------------------------ | --- | --- | --- | --- | ------ | --- |
| Create tickets           | Y   | Y   | Y   | -   | -      | -   |
| Assign tickets           | Y   | Y   | Y   | -   | -      | -   |
| Update own ticket status | Y   | Y   | Y   | Y   | Y      | Y   |
| Review/approve work      | Y   | Y   | Y   | -   | -      | -   |
| Create sub-tickets       | Y   | Y   | Y   | -   | -      | -   |
| Write code               | -   | -   | -   | Y   | -      | -   |
| Push to GitHub           | -   | -   | -   | Y   | -      | -   |
| Deploy to Vercel         | -   | -   | -   | Y   | -      | -   |
| Edit Figma               | -   | -   | -   | -   | Y      | -   |
| Post to social media     | -   | -   | -   | -   | -      | Y   |
| Send email campaigns     | -   | -   | -   | -   | -      | Y   |
| Run ad campaigns         | -   | -   | -   | -   | -      | Y   |
| Access CRM               | Y   | -   | Y   | -   | -      | Y   |
| View all agent memory    | Y   | -   | -   | -   | -      | -   |
| View technical memory    | -   | Y   | -   | Y   | -      | -   |
| View brand memory        | -   | -   | Y   | -   | Y      | Y   |


### Dynamic Tool Gating

Use `prepareStep` to restrict tools by execution phase:

```typescript
const developerAgent = new DurableAgent({
  model: "openai/gpt-4o",
  tools: { ...readOnlyTools, ...writeTools, ...deployTools },
  prepareStep: ({ stepNumber }) => {
    if (stepNumber <= 3) return { activeTools: Object.keys(readOnlyTools) };
    if (stepNumber <= 20) return { activeTools: [...Object.keys(readOnlyTools), ...Object.keys(writeTools)] };
    return { activeTools: undefined }; // all tools for deployment phase
  },
});
```

---

## Infrastructure

### API Routes

```
app/api/agents/
├── ceo/route.ts          # CEO DurableAgent workflow     (exists)
├── cto/route.ts          # CTO DurableAgent workflow     (new)
├── cmo/route.ts          # CMO DurableAgent workflow     (new)
├── developer/route.ts    # Developer DurableAgent workflow (new)
├── designer/route.ts     # Designer DurableAgent workflow  (new)
├── marketing/route.ts    # Marketing DurableAgent workflow (new)
└── dispatch/route.ts     # Agent dispatch coordinator      (new)
```

### New Dependencies

```bash
bun add @ai-sdk/openai             # OpenAI GPT provider for AI SDK
bun add @mem0/vercel-ai-provider   # Memory layer
bun add composio-core              # External tool integrations
bun add @e2b/code-interpreter      # Sandbox for developer agent
```

### Environment Variables

```env
# LLM
OPENAI_API_KEY=...

# Convex
NEXT_PUBLIC_CONVEX_URL=...
CONVEX_DEPLOY_KEY=...

# Memory
MEM0_API_KEY=...

# Composio
COMPOSIO_API_KEY=...

# Sandbox
E2B_API_KEY=...

# External services: OAuth managed by Composio — no individual keys needed
```

### New Convex Tables

```typescript
// Agent memory metadata (Convex-side tracking of Mem0 references)
agentMemory: defineTable({
  agentId: v.string(),
  memoryType: v.union(
    v.literal("decision"),
    v.literal("preference"),
    v.literal("context"),
    v.literal("knowledge")
  ),
  summary: v.string(),
  mem0RefId: v.optional(v.string()),
  ticketId: v.optional(v.id("tickets")),
  createdAt: v.number(),
}).index("by_agent", ["agentId"])
  .index("by_type", ["memoryType"])
  .index("by_ticket", ["ticketId"]),

// Agent runtime configuration
agentConfig: defineTable({
  agentId: v.string(),
  displayName: v.string(),
  role: v.union(v.literal("strategic"), v.literal("execution")),
  status: v.union(
    v.literal("active"),
    v.literal("idle"),
    v.literal("busy"),
    v.literal("paused")
  ),
  maxActiveTickets: v.number(),
  maxStepsPerExecution: v.number(),
  composioEntityId: v.optional(v.string()),
  enabledTools: v.array(v.string()),
  currentTicketIds: v.array(v.id("tickets")),
}).index("by_agentId", ["agentId"])
  .index("by_status", ["status"]),
```

