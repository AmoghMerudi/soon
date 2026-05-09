# Agent Build Order

> Agents must exist before dispatch, observability, or review loops can be built on top of them.

## Phase 1: Individual Agents

Build each agent as a DurableAgent workflow with skills, tools, and Convex integration. Each follows the same pattern as the CEO agent: workflow file, tools file, skills, API route.

### 1. CEO Agent — done
- DurableAgent with business idea intake skill
- Tools: ticket CRUD, askQuestion (human-in-the-loop), loadSkill
- Chat UI with WorkflowChatTransport

### 2. CTO Agent
- Receives engineering tickets from CEO
- Reviews technical feasibility, adds architecture guidance
- Creates sub-tickets with implementation details for Developer
- Tools: ticket management, addComment (architecture decisions), createSubTicket
- Skills: architecture review, tech stack selection, ticket decomposition

### 3. Developer Agent
- Picks up implementation tickets from CTO
- Writes code in E2B sandbox, runs tests
- Creates PRs via GitHub, deploys previews via Vercel
- Tools: sandbox execution, GitHub operations, ticket updates, addArtifact
- Skills: implementation workflow, code review prep, testing

### 4. CMO Agent
- Receives marketing/design tickets from CEO
- Defines campaign strategy, content briefs, brand guidelines
- Delegates to Designer and Marketing agents
- Tools: ticket management, addComment (brand/strategy guidance), createSubTicket
- Skills: go-to-market planning, content strategy, campaign design

### 5. Designer Agent
- Picks up design tickets from CMO
- Creates mockups, UI components, visual assets
- Tools: image generation, design token output, addArtifact
- Skills: design system, component design, brand application

### 6. Marketing Agent
- Picks up content/social/email tickets from CMO
- Writes copy, schedules posts, creates email campaigns
- Tools: content creation, addArtifact, ticket updates
- Skills: content writing, SEO, social media, email campaigns

## Phase 2: Orchestration Systems

Only after all agents are functional.

### 7. Project Scoping + Mem0 Memory
- Add `projects` table, scope all data by projectId
- Wire up Mem0 for semantic memory per project/agent
- Spec: `docs/superpowers/specs/2026-05-09-project-scoping-mem0-design.md`

### 8. Agent Dispatch System
- Ticket assignment triggers agent workflows automatically
- Convex scheduled functions → Workflow `start()`
- Agent picks up ticket, works it, reports back

### 9. Agent Observability
- Live view of what each agent is doing
- Stream tool calls, sandbox output, progress to the dashboard
- Workflow run inspection per ticket

### 10. CEO Review Loop
- Periodic review of all completed work across agents
- CEO agent triggered on schedule or when tickets move to `in_review`
- Approves, requests changes, or creates follow-up tickets
