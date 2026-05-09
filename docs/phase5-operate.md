# Phase 5: Operate (Hours 10-36) — "Run the business"

## Goal
The system is live. Agents operate the children's picture book company autonomously. Humans monitor via dashboard and intervene only if needed. Generate real Stripe revenue during the hackathon.

---

## What Happens Autonomously

### CEO Agent (every 5 min via cron + on ticket resolution)
- Reviews completed work, creates follow-up tickets
- Monitors revenue data, adjusts strategy
- Creates marketing push tickets when revenue is low
- Creates bug fix tickets if customers report issues
- Prioritizes based on business impact

### Developer Agent (on engineering ticket assignment)
- Builds the product features CEO requests
- Fixes bugs reported via tickets
- Ships updates, deploys to Vercel
- Creates PRs for code review

### Designer Agent (on design ticket assignment)
- Creates brand assets CEO requests
- Generates product images (book illustrations, social media graphics)
- Processes images through Cloudinary for optimization
- Delivers assets as artifacts on tickets

### Marketing Agent (on marketing ticket assignment)
- Posts launch content on Twitter/X and LinkedIn
- Creates email campaigns
- Writes compelling product descriptions
- Generates buzz around the product

---

## Human Responsibilities (Minimal)

### Monitor
- Keep dashboard open — watch for blocked tickets or agent errors
- Check revenue tracker for real transactions

### Intervene Only If
- An agent is stuck in a loop (hit kill switch, fix the issue, resume)
- Composio auth expires (re-authenticate)
- E2B sandbox has issues (check API status)
- A ticket is blocked with no resolution path (inject a manual ticket to unblock)

### Do NOT
- Write code manually (defeats the demo narrative)
- Create tickets for the agents (let CEO handle it)
- Override agent decisions unless something is actually broken

---

## Revenue Generation Strategy

### Getting First Customers
- Marketing agent posts on Twitter/X with examples of generated books
- Share the product link in relevant communities (parenting, AI, tech)
- Price at $4.99 — low enough for impulse purchase
- The product should be live and functional by hour 12-14

### Tracking Revenue
- Every Stripe payment triggers a webhook
- Webhook logs to Convex `revenue` table
- Dashboard revenue tracker updates in real-time
- Goal: at least 1 real transaction before demo time

---

## Preparing for Demo

### By Hour 30 (6 hours before deadline)
- [ ] Product is live and accepting payments
- [ ] At least 1 real Stripe transaction
- [ ] Dashboard shows full agent activity history
- [ ] No critical bugs or blocked agents
- [ ] Landing page looks polished

### Demo Prep (Hours 34-36)
- Record a backup video of the system working (in case of live demo issues)
- Prepare talking points:
  1. What is 0to1? (30 sec)
  2. Live demo: launch a new company (3 min)
  3. Show the product the agents built (1 min)
  4. Show real revenue (30 sec)
  5. Architecture overview (1 min)
  6. Sponsor integrations: Composio, Cloudinary, Polarity (1 min)
- Practice the demo flow twice
- Have a "reset" plan if the live demo needs a fresh start

### Demo Script
1. Open dashboard — show 4 agents and their activity history
2. "We built 0to1 — an AI company operating system. You give it a business idea, and AI agents plan, build, and operate the entire company."
3. Click "New Company" → type the business idea
4. Watch CEO create tickets in real-time
5. Show agents picking up and completing work
6. Show the live product the agents built
7. Show Stripe — real revenue
8. "This entire company was built and operated by AI agents."
9. Show Composio (tools), Cloudinary (images), Polarity (code quality)
10. Q&A
