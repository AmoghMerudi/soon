# Phase 4: Polish + Deploy (Hours 8-10) — "Demo-ready"

## Goal
Harden everything, build the landing page, deploy to production, and run the first business.

---

## Person A: Safety + Triggers

### Hour 8-9: Safety Rails
- **Circuit breaker** in `convex/triggers.ts`:
  - Track ticket creation rate per agent (use `agentLogs`)
  - If any agent creates >20 tickets in 10 minutes → auto-pause that agent
  - Log a warning to `agentLogs` with details
  - CEO gets a special "circuit breaker triggered" notification
- **Max ticket depth:**
  - In `createTicket` mutation, check `parentTicket` chain depth
  - If depth > 3, reject the creation and log a warning
- **Max active tickets per agent:**
  - In ticket assignment, check how many `in_progress` tickets the agent has
  - If >= 5, queue the ticket as `backlog` instead of triggering the agent
- **Blocked escalation:**
  - Convex scheduled function: every 5 minutes, check for tickets `blocked` for >5 minutes
  - Auto-tag CEO on those tickets and trigger CEO review
- **Error handling in agent endpoints:**
  - Wrap `runAgent` in try/catch
  - On failure: log error to `agentLogs`, set ticket to `blocked` with error comment
  - Never let an agent crash silently

### Hour 9-10: Cron + Deployment Config
- **Vercel Cron Job** in `vercel.json`:
  ```json
  {
    "crons": [{
      "path": "/api/agents/ceo?trigger=cron",
      "schedule": "*/5 * * * *"
    }]
  }
  ```
  - CEO runs every 5 minutes to review state, check for stalled tickets, adjust strategy
- **Environment variables** (set in Vercel):
  - `CONVEX_URL` — Convex deployment URL
  - `COMPOSIO_API_KEY` — Composio API key
  - `E2B_API_KEY` — E2B sandbox API key
  - `AI_GATEWAY_API_KEY` — Vercel AI Gateway key
  - `GOOGLE_AI_STUDIO_KEY` — for image generation
  - `CRON_SECRET` — protect cron endpoint from unauthorized access
- **Deploy to Vercel:**
  - `vercel --prod`
  - Verify all environment variables are set
  - Test cron job fires correctly
  - Verify Convex production deployment is connected

---

## Person B: Landing Page + Polish

### Hour 8-9: Landing Page
- Create `app/page.tsx` — landing page for 0to1:
  - Hero: "From idea to company in minutes. Powered by AI agents."
  - How it works: 3-step visual (Idea → Agents Plan & Build → Company Runs)
  - Architecture diagram: show the 4 agents and how they collaborate
  - Live stats: total tickets processed, businesses launched (from Convex)
  - CTA: "Launch a Company" → links to `/dashboard`
- Keep it simple, bold, dark theme — hackathon judges see this first

### Hour 9-10: Polish Everything
- **Loading states:**
  - Skeleton loaders on kanban columns while Convex loads
  - "CEO is planning..." spinner when business idea submitted
  - Agent cards pulse when active
- **Error states:**
  - Agent endpoint failures show on dashboard with retry button
  - Convex connection lost → reconnecting banner
  - Empty states: "No tickets yet — launch a company to get started"
- **Responsive layout:**
  - Dashboard works on projector/large screen (demo mode)
  - Reasonable on laptop screens
- **Visual polish:**
  - Agent avatars/icons for each role
  - Color coding consistent: CEO=purple, Dev=blue, Design=pink, Marketing=green
  - Smooth transitions on ticket status changes
  - Timestamps as relative ("2 min ago")

---

## Joint (Hour 10): Integration Test + Launch

### Integration Test Checklist
- [ ] POST business idea → CEO creates ticket backlog (all 3 workstreams)
- [ ] Developer agent triggers on engineering ticket → does work → resolves
- [ ] Designer agent triggers on design ticket → generates image → resolves
- [ ] Marketing agent triggers on marketing ticket → creates content → resolves
- [ ] CEO re-triggers on resolution → reviews → creates follow-ups
- [ ] Dashboard shows all activity in real-time
- [ ] Pause/resume works per agent
- [ ] Kill switch stops everything
- [ ] Cron job fires every 5 minutes
- [ ] No console errors, no unhandled rejections

### Launch
1. Deploy to Vercel production
2. Open dashboard
3. Click "New Company"
4. Type: "A personalized children's picture book company that generates custom illustrated stories for kids. Charge $4.99 per book via Stripe."
5. Watch it go

---

## Phase 4 Gate

**Pass criteria:** System deployed to Vercel production. Enter a business idea → 4 agents autonomously plan, build, and begin operating a company. Dashboard shows everything in real-time. Safety rails prevent runaway behavior. Landing page looks good. Ready for judges.
