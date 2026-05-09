# Conductor

**An AI company operating system.** Give it a business idea, and autonomous AI agents — CEO, Developer, Designer, Marketing — plan, build, deploy, and operate the entire company end-to-end.

The system is business-agnostic. Demo: hand it a children's picture book company and watch it ship a working product to production with real Stripe revenue. Same loop works for any business.

## How It Works

1. You enter a business idea on the dashboard.
2. The **CEO agent** decomposes it into a backlog of tickets with tags, priorities, and acceptance criteria.
3. Role-specialized agents pick up tickets matching their tags, do the work using their tools, attach artifacts (PR URLs, deployments, designs, posts), and resolve.
4. CEO reviews resolved work, opens follow-ups, and iterates until the business is live and operating.

Agents communicate **only through tickets** — no direct agent-to-agent calls. Full audit trail, fully observable.

## Agents

| Agent | Tools |
|-------|-------|
| **CEO** | Convex (ticket CRUD), revenue/analytics |
| **Developer** | E2B Sandbox, GitHub, Vercel |
| **Designer** | Google AI Studio, Cloudinary |
| **Marketing** | Twitter/X, LinkedIn, Email |

All external tools are wired through **Composio**.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Hosting:** Vercel
- **Database / Real-time:** Convex
- **AI:** Claude via AI SDK + Vercel AI Gateway
- **Agent Tools:** Composio
- **Code Execution:** E2B Sandbox
- **Image Generation:** Google AI Studio
- **Image Processing:** Cloudinary
- **Payments:** Stripe (via Composio)
- **Styling:** Tailwind CSS v4

## Getting Started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and click **New Company** to kick off a run.

## Dashboard

- **Agent Status Board** — who's active, idle, or blocked
- **Ticket Kanban** — backlog → in progress → review → done, real-time
- **Activity Feed** — chronological stream of every agent action
- **Revenue Tracker** — live Stripe revenue from the operated business
- **System Controls** — start a company, inject manual tickets, pause/resume agents, kill switch

## Safety Rails

- Max ticket depth: 3 levels
- Max active tickets per agent: 5
- Circuit breaker on runaway ticket creation (>20 in 10 min)
- Blocked tickets auto-escalate to CEO after 5 minutes

See [PRD.md](./PRD.md) for the full product spec.
