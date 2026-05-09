# Phase 3: All Agents + Controls (Hours 6-8) — "The full company"

## Goal
Add Designer and Marketing agents. Add human controls so we can steer the system from the dashboard.

---

## Person A: Designer + Marketing Agents

### Hour 6-7: Designer Agent
- Create `lib/agents/prompts/designer.ts` — Designer system prompt:
  - Head of design with strong visual taste
  - Creates cohesive brand systems (logos, color palettes, typography)
  - Writes precise image generation prompts for consistent style
  - Processes and optimizes images for production use
  - Resolves tickets with image artifacts
- Create `lib/agents/tools/image-tools.ts`:
  - `generateImage` — call Google AI Studio API for image generation
  - Pass prompt + style parameters, receive image URL
- Wire Cloudinary tools from Composio:
  - `uploadImage` — upload generated images to Cloudinary
  - `transformImage` — resize, crop, optimize, format conversion
  - `getImageUrl` — get optimized delivery URL
- Create `/api/agents/designer/route.ts` — POST endpoint
- Add Designer to trigger system: tickets with `design` tag → trigger Designer endpoint

### Hour 7-8: Marketing Agent
- Create `lib/agents/prompts/marketing.ts` — Marketing system prompt:
  - Head of growth and marketing
  - Creates compelling copy, social posts, email campaigns
  - Thinks about conversion funnels and viral loops
  - Writes content that drives traffic and sales
  - Resolves tickets with content artifacts (post URLs, copy docs)
- Wire social media tools from Composio:
  - Twitter/X: `postTweet`, `scheduleTweet`
  - LinkedIn: `createPost`
  - Email: `sendEmail` (via Gmail or SendGrid integration)
- Create `/api/agents/marketing/route.ts` — POST endpoint
- Add Marketing to trigger system: tickets with `marketing` tag → trigger Marketing endpoint

---

## Person B: System Controls + Revenue

### Hour 6-7: System Controls
- Add to dashboard layout: control panel section
- **Pause/Resume per agent:**
  - Toggle button on each agent card
  - When paused: agent endpoint returns early without processing
  - Store pause state in Convex `agentStatus` table
  - Visual indicator: paused agents show yellow "paused" badge
- **Manual ticket injection:**
  - "Create Ticket" button on kanban view
  - Form: title, description, priority, tags, assignee
  - Directly creates ticket in Convex (bypasses CEO)
- **Kill switch:**
  - Red button in dashboard header
  - Sets all agents to paused
  - Clears any pending agent triggers
  - Shows confirmation dialog before executing

### Hour 7-8: Revenue Tracker
- Wire Stripe via Composio:
  - Read recent payments/charges
  - Get balance and revenue totals
- Create `app/dashboard/revenue/page.tsx`:
  - Big number: total revenue ($XX.XX)
  - Revenue chart: over time (simple line chart)
  - Recent transactions list: amount, customer, timestamp
  - All real-time via periodic polling (Stripe doesn't have real-time push)
- Add revenue summary card to main dashboard view
- Add Convex table for caching revenue data:
  ```
  revenue: {
    amount: number
    currency: string
    customerEmail: string
    description: string
    stripePaymentId: string
    timestamp: number
  }
  ```

---

## Person B (also): Agent Status Table in Convex

Add `agentStatus` table to support controls:
```
agentStatus: {
  role: string          // "ceo" | "developer" | "designer" | "marketing"
  status: string        // "idle" | "active" | "paused" | "blocked"
  currentTicketId: id | null
  lastAction: string
  lastActionAt: number
  ticketsCompleted: number
}
```

Agent endpoints check this table before processing. If `status === "paused"`, return immediately.

---

## Phase 3 Gate

**Pass criteria:**
1. All 4 agents operational and triggered by ticket assignments
2. CEO delegates across engineering, design, and marketing tags
3. Designer generates images and uploads to Cloudinary
4. Marketing creates social media content
5. Dashboard controls work: pause/resume, manual tickets, kill switch
6. Revenue tracker shows Stripe data (even if $0 at this point)

**What "working" looks like:**
- Enter a business idea → CEO creates tickets across all 3 workstreams
- Developer, Designer, and Marketing all pick up their respective tickets
- Activity feed shows all 4 agents working
- Pause the Marketing agent → it stops picking up tickets
- Resume it → it catches up
- Manually inject a ticket → appropriate agent picks it up
- Kill switch → everything stops
