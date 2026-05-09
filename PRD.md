# PRD: 0to1 — AI Company Operating System

**Date:** 2026-05-09 | **Team:** 2 people | **Timeline:** 10h build, 26h operate

---

## 1. Vision

**0to1** is a general-purpose AI company operating system. You give it a business idea, and autonomous AI agents (CEO, Developer, Designer, Marketing) plan, build, and operate the entire company — from strategy to code to deployment to marketing.

The system is **business-agnostic**. At the hackathon, we demo it by having it build and run a children's picture book company, but it could run any business.

---

## 2. Sponsor Track Coverage

| Track | How |
|-------|-----|
| **Composio** ($25K) | ALL agent tool integrations through Composio |
| **Cloudinary** ($100/member) | Available as a tool for agents when media work is needed |
| **Polarity** (credits) | Clean, well-tested production code |
| **All For One** | Use all sponsored products |

---

## 3. Core Concepts

### 3.1 Agents

An agent is an autonomous AI worker with:
- **Role** — what it's responsible for (engineering, design, marketing, strategy)
- **System Prompt** — personality, expertise, decision-making style
- **Tools** — what it can do (via Composio + custom tools)
- **Activation Trigger** — what causes it to wake up and work

Agents communicate **only through the ticketing system**. No direct agent-to-agent calls. This gives us a full audit trail and makes the system observable.

### 3.2 Tickets

A ticket is the unit of work. Every action in the system flows through tickets:
- CEO creates tickets to delegate work
- Agents pick up tickets, do the work, resolve them
- Resolution notifies tagged agents (usually the CEO)
- CEO reviews and creates follow-up tickets

### 3.3 The Loop

```
Business Idea (human input)
  → CEO Agent plans the business
  → CEO creates tickets for each workstream
  → Agents pick up tickets autonomously
  → Agents do work using their tools
  → Agents resolve tickets, attach artifacts
  → CEO reviews, creates next batch of tickets
  → Repeat until business is live and operating
```

Once the product is live, the loop continues for operations: handling orders, creating marketing content, fixing bugs, iterating on the product.

---

## 4. Agents

### CEO Agent
- **Role:** Fully autonomous orchestrator. Plans the business, decomposes into tickets, delegates, reviews, iterates.
- **Tools:** Convex (ticket CRUD), revenue/analytics reads
- **Activation:** On startup (given a business idea), on ticket resolution (review completed work), on cron (periodic strategy review)
- **Key behavior:** Thinks in milestones and workstreams. Creates tickets with clear descriptions, acceptance criteria, priority, and tags. Never does implementation — only plans and reviews.

### Developer Agent
- **Role:** Builds everything technical. Code, infrastructure, deployments.
- **Tools:**
  - E2B Sandbox — run/test code in the cloud
  - GitHub (via Composio) — push, PRs, code review
  - Vercel (via Composio) — deployments
- **Activation:** Ticket assigned with `engineering` tag
- **Key behavior:** Picks up ticket → writes code in E2B → pushes to GitHub → deploys → resolves ticket with artifacts (PR URL, deployment URL)

### Designer Agent
- **Role:** Visual design, brand identity, image/media generation, UI direction.
- **Tools:**
  - Google AI Studio — image generation
  - Cloudinary (via Composio) — image processing, optimization, transformations
- **Activation:** Ticket assigned with `design` tag
- **V2:** Claude Design MCP for full design iteration

### Marketing Agent
- **Role:** Growth, content, social media, copywriting, SEO.
- **Tools (via Composio):**
  - Twitter/X — social posts
  - LinkedIn — professional content
  - Email — outreach and customer comms
- **Activation:** Ticket assigned with `marketing` tag

---

## 5. Ticketing System (Convex)

### Schema

```typescript
// Tickets — the unit of work
tickets: {
  title: string
  description: string                    // includes acceptance criteria
  status: "backlog" | "in_progress" | "in_review" | "resolved" | "blocked"
  priority: "critical" | "high" | "medium" | "low"
  assignee: string | null                // agent role name
  tags: string[]                         // "engineering", "design", "marketing"
  createdBy: string                      // agent name
  taggedAgents: string[]                 // notified on status change
  parentTicket: id | null                // sub-task hierarchy
}

// Comments — agent-to-agent communication
comments: {
  ticketId: id
  author: string
  content: string
}

// Artifacts — work output attached to tickets
artifacts: {
  ticketId: id
  type: "pr" | "design" | "deployment" | "document" | "image" | "other"
  url: string
  description: string
}

// Agent activity log — for dashboard
agentLogs: {
  agent: string
  action: string
  details: string
  ticketId: id | null
}
```

### Communication Protocol

1. **Create:** CEO creates ticket with tags, assignee, priority
2. **Pickup:** Agent subscribes to tickets matching its role → sets `in_progress`
3. **Work:** Agent does work, posts progress as comments
4. **Complete:** Agent sets `resolved`, attaches artifacts
5. **Notify:** All `taggedAgents` get notified via Convex real-time subscription
6. **Review:** CEO reviews artifacts → accepts OR reopens with feedback
7. **Blocked:** If stuck, agent sets `blocked` with comment, tags CEO

### Safety Rails
- Max ticket depth: 3 levels (prevent infinite sub-tasking)
- Max active tickets per agent: 5
- Circuit breaker: if an agent creates >20 tickets in 10 minutes, pause and alert
- Blocked tickets auto-escalate to CEO after 5 minutes

---

## 6. Agent Runtime

### Execution Model

Each agent is a **Vercel Function** (API route) that runs an AI SDK `generateText` tool-calling loop:

```
POST /api/agents/[role]
  → Load agent system prompt + tools
  → Fetch assigned tickets from Convex
  → AI SDK generateText with maxSteps (tool loop)
  → Agent reasons about ticket, calls tools, does work
  → Posts results to Convex (comments, artifacts, status changes)
  → Returns
```

### Trigger Mechanisms

| Trigger | How | When |
|---------|-----|------|
| **Convex action** | Convex mutation triggers HTTP call to agent endpoint | Ticket assigned or status changed |
| **Cron** | Vercel Cron Job hits agent endpoint | CEO periodic review (every 5 min) |
| **Direct** | One agent's tool calls another agent's endpoint | Escalation, hand-off |

### Tool Integration (Composio)

All external tools wired through Composio SDK:
```
Agent → AI SDK tool call → Composio execute → External service → Result back to agent
```

Composio handles auth, rate limits, and API translation. Each agent gets the tools relevant to its role.

---

## 7. Dashboard (Human Monitoring)

Real-time UI powered by Convex subscriptions. This is the **judge demo view**.

### Views
- **Agent Status Board** — which agents are active/idle/blocked, what they're working on
- **Ticket Kanban** — drag-and-drop board: backlog → in progress → review → done
- **Activity Feed** — chronological stream of all agent actions
- **Revenue Tracker** — live Stripe revenue (when a business is running)
- **System Controls** — start the system with a business idea, pause/resume agents, inject manual tickets

### Key Interactions
- **"New Company" button** — enter a business idea, CEO agent takes over
- **Manual ticket injection** — human can create tickets to steer agents
- **Agent override** — pause an agent, reassign its tickets
- **Kill switch** — stop all agents immediately

---

## 8. Routes

```
/                          Landing page (explain 0to1, CTA to dashboard)
/dashboard                 Main dashboard view
/dashboard/tickets         Ticket kanban
/dashboard/agents          Agent status + logs
/dashboard/activity        Activity feed
/dashboard/revenue         Revenue tracker (when business is live)

/api/agents/ceo            CEO agent endpoint
/api/agents/developer      Developer agent endpoint
/api/agents/designer       Designer agent endpoint
/api/agents/marketing      Marketing agent endpoint
/api/webhooks/convex       Convex event handler (ticket changes → agent triggers)
```

---

## 9. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Hosting | Vercel |
| Database / Real-time | Convex |
| AI Models | Claude via AI SDK + Vercel AI Gateway |
| Agent Tools | Composio |
| Code Execution | E2B Sandbox |
| Image Generation | Google AI Studio |
| Image Processing | Cloudinary (via Composio) |
| Payments (for run businesses) | Stripe (via Composio) |
| Styling | Tailwind CSS v4 |

---

## 10. Build Phases

Each phase has a detailed plan in `docs/`. Do not proceed to the next phase until the current phase's gate passes.

| Phase | Hours | Goal | Details |
|-------|-------|------|---------|
| [Phase 1: Foundation](docs/phase1-foundation.md) | 0-3 | One agent talks to Convex | Convex schema, agent framework, dashboard shell |
| [Phase 2: CEO + Dev Loop](docs/phase2-ceo-developer-loop.md) | 3-6 | Two agents collaborate | CEO ↔ Developer feedback loop, triggers, dashboard interactivity |
| [Phase 3: All Agents](docs/phase3-all-agents.md) | 6-8 | The full company | Designer + Marketing agents, system controls, revenue tracker |
| [Phase 4: Polish + Deploy](docs/phase4-polish-deploy.md) | 8-10 | Demo-ready | Safety rails, cron, landing page, deploy to production |
| [Phase 5: Operate](docs/phase5-operate.md) | 10-36 | Run the business | Agents operate autonomously, generate real Stripe revenue |

---

## 11. Testing & Acceptance Criteria

### Tests
- [ ] Convex schema: ticket state machine (valid transitions only)
- [ ] Agent framework: tool loop executes, returns structured results
- [ ] CEO creates tickets from business idea with correct tags/assignees
- [ ] Agent picks up ticket → does work → resolves → CEO notified
- [ ] Dashboard real-time: ticket changes reflect instantly
- [ ] Safety rails: circuit breaker triggers on runaway ticket creation
- [ ] Composio tools: GitHub push, Stripe read, social media post all work

### Acceptance Criteria
- [ ] Enter a business idea → CEO autonomously creates full ticket backlog
- [ ] All 4 agents demonstrate autonomous work completion via tickets
- [ ] Agent-to-agent communication works through ticket lifecycle
- [ ] Dashboard shows real-time agent activity, ticket flow
- [ ] At least one business fully planned, built, and operating through the system
- [ ] Real Stripe revenue generated by the operated business
- [ ] All external integrations go through Composio
- [ ] Cloudinary used for media processing

---

## 12. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| 10h too ambitious | MVP: CEO + 1 agent (Developer) working end-to-end first. Add Designer + Marketing after. |
| Agent infinite loops | Circuit breaker, max depth, max active tickets |
| E2B timeouts | 60s hard timeout, retry once, then `blocked` |
| Composio tool failures | Retry with backoff, log to agent activity, mark ticket blocked |
| AI Gateway rate limits | Queue agent activations, don't run all 4 simultaneously |

---

## 13. Demo Script

1. Open dashboard — 4 agents idle
2. Click "New Company" → type "A personalized children's picture book company that generates custom illustrated stories for kids. Charge $4.99 per book via Stripe."
3. Watch CEO Agent plan: creates 15+ tickets across engineering, design, marketing
4. Kanban board fills up in real-time
5. Agents pick up tickets — activity feed explodes
6. Developer builds the product, Designer creates assets, Marketing writes launch content
7. Product goes live — show the deployed URL
8. Buy a book through the live product
9. Show revenue on dashboard
10. **"This entire company — from business plan to working product to first sale — was built and operated by AI agents. Zero human code written."**

---

## 14. V2 (Post-Hackathon)
- Claude Design MCP for full design iteration
- Customer Support Agent (handle inbound)
- Finance Agent (bookkeeping, invoicing)
- Multi-business: run multiple companies simultaneously
- Agent marketplace: plug in custom agents with custom tools
