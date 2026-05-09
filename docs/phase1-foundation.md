# Phase 1: Foundation (Hours 0-3) — "One agent talks to Convex"

## Goal
A single working loop: CEO Agent receives a business idea, creates tickets in Convex, and those tickets appear on a dashboard in real-time.

---

## Person A: Convex + Agent Framework

### Hour 0-1: Convex Project Setup
- Initialize Convex project (`npx convex dev`)
- Define schema in `convex/schema.ts`:
  - `tickets` — title, description, status, priority, assignee, tags, createdBy, taggedAgents, parentTicket
  - `comments` — ticketId, author, content
  - `artifacts` — ticketId, type, url, description
  - `agentLogs` — agent, action, details, ticketId
- Write CRUD mutations: `createTicket`, `updateTicketStatus`, `assignTicket`, `addComment`, `addArtifact`, `logAgentAction`
- Write queries: `getTicketsByStatus`, `getTicketsByAssignee`, `getTicketComments`, `getTicketArtifacts`, `getAgentLogs`
- All queries should use real-time subscriptions

### Hour 1-2: Base Agent Framework
- Install AI SDK (`ai` package) + configure AI Gateway provider
- Create `lib/agents/run-agent.ts`:
  ```
  runAgent(role, systemPrompt, tools, context) → result
  ```
  - Uses AI SDK `generateText` with `maxSteps` for tool-calling loop
  - Each tool call is logged to `agentLogs` via Convex
  - Returns structured result with actions taken
- Create `lib/agents/tools/convex-tools.ts`:
  - `createTicket` tool — agent can create tickets
  - `updateTicket` tool — agent can update ticket status
  - `addComment` tool — agent can comment on tickets
  - `addArtifact` tool — agent can attach artifacts
  - `getMyTickets` tool — agent can fetch its assigned tickets
- Create `/api/agents/ceo/route.ts` — POST endpoint that runs CEO agent

### Hour 2-3: Composio Integration
- Install Composio SDK
- Create `lib/agents/tools/composio-tools.ts`:
  - Initialize Composio client with API key
  - Function to get tools for a specific agent role
  - Wrapper to convert Composio tools to AI SDK tool format
- Wire Composio tools into the `runAgent` function alongside Convex tools
- Test: CEO agent can call both Convex tools and Composio tools

---

## Person B: Dashboard Shell

### Hour 0-1: Next.js + Convex Client Setup
- Install Convex React client (`convex/react`)
- Set up ConvexProvider in `app/layout.tsx`
- Create dashboard layout: `app/dashboard/layout.tsx`
  - Sidebar nav: Tickets, Agents, Activity, Revenue
  - Main content area
  - Dark theme (looks good for demos)

### Hour 1-2: Ticket Kanban Board
- Create `app/dashboard/tickets/page.tsx`
- Kanban columns: Backlog | In Progress | In Review | Resolved | Blocked
- Each column subscribes to `getTicketsByStatus` (real-time)
- Ticket cards show: title, priority badge, assignee avatar, tags
- Clicking a ticket opens detail (placeholder for now)

### Hour 2-3: Activity Feed
- Create `app/dashboard/activity/page.tsx`
- Subscribe to `getAgentLogs` (real-time, newest first)
- Each log entry shows: agent avatar/name, action, timestamp, link to ticket
- Auto-scrolls as new entries appear
- Color-code by agent (CEO=purple, Dev=blue, Design=pink, Marketing=green)

---

## Phase 1 Gate

**Pass criteria:** POST a business idea to `/api/agents/ceo` → CEO agent creates tickets in Convex → tickets appear on dashboard kanban in real-time → agent actions appear in activity feed.

**Test it:**
```bash
curl -X POST http://localhost:3000/api/agents/ceo \
  -H "Content-Type: application/json" \
  -d '{"idea": "A personalized children's picture book company"}'
```
Then open `localhost:3000/dashboard/tickets` and watch tickets appear.
