# Phase 2: CEO + Developer Loop (Hours 3-6) — "Two agents collaborate"

## Goal
The core feedback loop: CEO creates engineering tickets → Developer picks them up → Developer does the work → Developer resolves → CEO gets notified and reviews.

---

## Person A: CEO + Developer Agents

### Hour 3-4: CEO Agent
- Create `lib/agents/prompts/ceo.ts` — CEO system prompt:
  - Business strategist and project manager
  - Decomposes business ideas into milestones and workstreams
  - Creates tickets with clear descriptions, acceptance criteria, priority, tags
  - Assigns to the right agent role
  - On review: accepts work or reopens with specific feedback
  - Never does implementation — only plans and reviews
- CEO planning behavior:
  - Given a business idea, create a phased plan (milestone tickets)
  - Under each milestone, create actionable sub-tickets tagged to specific agents
  - Tag itself on all tickets so it gets notified on resolution
- CEO review behavior:
  - When a ticket is resolved, read the artifacts and comments
  - If satisfactory → accept and create follow-up tickets
  - If not → reopen with feedback comment

### Hour 4-5: Developer Agent
- Create `lib/agents/prompts/developer.ts` — Developer system prompt:
  - Senior full-stack engineer
  - Picks up engineering tickets, reads acceptance criteria
  - Writes code in E2B sandbox, tests it
  - Pushes to GitHub, creates PR if needed
  - Deploys to Vercel
  - Resolves ticket with artifacts
- Create `lib/agents/tools/e2b-tools.ts`:
  - `createSandbox` — spin up E2B sandbox
  - `executeCode` — run code in sandbox
  - `readFile` / `writeFile` — file operations in sandbox
  - `installPackages` — npm/pip install in sandbox
- Wire GitHub tools from Composio:
  - `createRepo`, `pushCode`, `createPR`, `mergePR`
- Create `/api/agents/developer/route.ts` — POST endpoint

### Hour 5-6: Agent Trigger System
- Create `convex/triggers.ts`:
  - Convex mutation hook: when ticket `assignee` or `status` changes, call the appropriate agent endpoint via HTTP action
  - When ticket status → `resolved` and `taggedAgents` includes "ceo", trigger CEO endpoint
  - When ticket assigned to "developer", trigger Developer endpoint
- Create `convex/actions/triggerAgent.ts`:
  - Convex HTTP action that POSTs to `/api/agents/[role]` with ticket context
  - Include ticket ID, title, description, acceptance criteria in the payload
- Test the full loop: CEO creates ticket → Developer auto-triggered → Developer resolves → CEO auto-triggered to review

---

## Person B: Dashboard Interactivity

### Hour 3-4: "New Company" Flow
- Create `app/dashboard/page.tsx` (main dashboard view)
- "New Company" button → opens modal/dialog
- Text input: "Describe your business idea..."
- Submit → POST to `/api/agents/ceo` with the idea
- Close modal → navigate to tickets view
- Show loading state: "CEO is planning..." with animated indicator
- Watch tickets populate in real-time on the kanban

### Hour 4-5: Agent Status Board
- Create `app/dashboard/agents/page.tsx`
- Card for each agent: CEO, Developer, Designer, Marketing
- Each card shows:
  - Status: idle (gray) / active (green pulse) / blocked (red)
  - Current ticket title (if working)
  - Last action + timestamp
  - Total tickets completed count
- Status derived from `agentLogs` and ticket assignments
- Real-time updates via Convex subscriptions

### Hour 5-6: Ticket Detail View
- Create `app/dashboard/tickets/[id]/page.tsx`
- Header: title, status badge, priority, assignee, tags
- Description section with acceptance criteria
- Comments thread: chronological, each comment shows author agent + timestamp
- Artifacts list: type icon, description, clickable URL
- Status controls: buttons to manually change status (for human override)
- Parent/child ticket links

---

## Phase 2 Gate

**Pass criteria:** Enter a business idea → CEO creates tickets with engineering tags → Developer agent is auto-triggered → Developer writes code in E2B → pushes to GitHub → resolves ticket with PR link → CEO is auto-triggered → CEO reviews and creates follow-up tickets. All visible on dashboard.

**What "working" looks like:**
1. Dashboard shows CEO active, creating tickets
2. Engineering tickets appear on kanban
3. Developer picks up a ticket (status → in_progress)
4. Developer activity shows in feed (code written, PR created)
5. Ticket moves to resolved with artifacts attached
6. CEO re-activates, reviews, creates next tickets
7. The cycle continues autonomously
