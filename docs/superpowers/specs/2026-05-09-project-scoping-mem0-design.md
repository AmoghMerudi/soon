# Project Scoping + Mem0 Memory Integration

> Every entity in the system scopes to a project. Each project represents one company/business the user is building. Mem0 provides semantic memory per project and agent role.

## Decisions

- Single user, no auth — projects are the top-level organizational unit
- Explicit project creation — user creates a project before chatting
- Mem0 as semantic sidecar, Convex as structured source of truth
- Mem0 scoping: `app_id="0to1"`, `user_id=projectId`, `agent_id=role`, `run_id=workflowId`

---

## 1. Convex Schema Changes

### New table: `projects`

```typescript
projects: defineTable({
  name: v.string(),
  description: v.string(),
  status: v.union(v.literal("active"), v.literal("archived")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_status", ["status"])
  .index("by_updated", ["updatedAt"]),
```

### New table: `agentMemory`

Convex-side tracking of Mem0 references. Gives structured visibility into what agents remember.

```typescript
agentMemory: defineTable({
  projectId: v.id("projects"),
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
})
  .index("by_project", ["projectId"])
  .index("by_agent", ["projectId", "agentId"])
  .index("by_type", ["projectId", "memoryType"]),
```

### Add `projectId` to existing tables

| Table | Change |
|-------|--------|
| `tickets` | Add `projectId: v.id("projects")` + index `by_project_status: ["projectId", "status"]` |
| `agentLogs` | Add `projectId: v.id("projects")` + index `by_project: ["projectId"]` |
| `ceoChatThreads` | Add `projectId: v.id("projects")` + index `by_project: ["projectId"]` |
| `skills` | Add `projectId: v.optional(v.id("projects"))` (null = global) + index `by_project: ["projectId"]` |
| `comments` | No change — scoped via parent ticket |
| `artifacts` | No change — scoped via parent ticket |

---

## 2. Convex Mutations & Queries

### Projects CRUD

```
createProject(name, description) → Id<"projects">
listProjects(status?) → Project[]
getProject(projectId) → Project
updateProject(projectId, { name?, description?, status? })
archiveProject(projectId) — sets status to "archived"
```

### Scoped query updates

Every existing query that returns tickets, threads, or logs gains a required `projectId` argument and filters by the `by_project*` index.

| Current | Updated |
|---------|---------|
| `getTicketsByStatus(status)` | `getTicketsByStatus(projectId, status)` |
| `getTicketsByAssignee(assignee)` | `getTicketsByAssignee(projectId, assignee)` |
| `getAgentLogs()` | `getAgentLogs(projectId)` |
| `listThreads()` | `listThreads(projectId)` |

### Scoped mutation updates

| Current | Updated |
|---------|---------|
| `createTicket(...)` | `createTicket(projectId, ...)` |
| `logAgentAction(...)` | `logAgentAction(projectId, ...)` |
| `createThread(title)` | `createThread(projectId, title)` |

`getTicket`, `getTicketComments`, `getTicketArtifacts`, `addComment`, `addArtifact` — unchanged (they operate on a specific ticket ID which is already project-scoped).

---

## 3. Mem0 Integration

### Package

```
@mem0/vercel-ai-provider
```

Env var: `MEM0_API_KEY`

### Client module: `lib/memory/mem0-client.ts`

```typescript
interface Mem0Config {
  projectId: string;
  agentId: string;
}

function createMem0Client(config: Mem0Config)
  // Initializes with:
  //   app_id: "0to1"
  //   user_id: config.projectId
  //   agent_id: config.agentId

function searchMemory(config: Mem0Config, query: string, limit?: number)
  // Returns relevant memories for the query within project+agent scope

function addMemory(config: Mem0Config, messages: Message[], metadata?: Record<string, string>)
  // Stores conversation context. metadata can include ticketId, action type, etc.
```

### Agent workflow integration

The CEO workflow (and future agent workflows) follows this pattern:

```
ceoChatWorkflow(projectId, messages):
  1. [step] Retrieve relevant memories from Mem0
     - searchMemory({ projectId, agentId: "ceo" }, lastUserMessage)
     - Returns past decisions, preferences, context for this project

  2. Build system prompt
     - CEO_INSTRUCTIONS + buildSkillsPrompt() + memory context section
     - Memory injected as: "## Project Context\nHere is what you know..."

  3. DurableAgent.stream(messages, writable, maxSteps: 20)
     - All tools receive projectId via experimental_context
     - Every Convex mutation includes projectId

  4. [step] Store new memories after agent completes
     - addMemory({ projectId, agentId: "ceo" }, conversation)
     - Save structured summary to Convex agentMemory table
```

### Memory types

| Type | What gets stored | Example |
|------|-----------------|---------|
| `decision` | Strategic choices the agent made | "Chose subscription pricing at $29/mo based on competitor analysis" |
| `preference` | User preferences learned from conversation | "User prefers React + Tailwind, no backend frameworks" |
| `context` | Business context and facts | "Target market is SMB owners in North America" |
| `knowledge` | Technical or domain knowledge acquired | "API rate limits are 100 req/min on the free tier" |

---

## 4. CEO Agent Tool Updates

### `experimental_context` for project scoping

The DurableAgent passes `projectId` to all tools via `experimental_context`:

```typescript
await agent.stream({
  messages,
  writable,
  maxSteps: 20,
  experimental_context: { projectId },
});
```

Each tool's execute function reads `projectId` from the context:

```typescript
async function createTicketStep(
  input: { ... },
  { experimental_context }: { experimental_context: { projectId: string } }
) {
  "use step";
  const { projectId } = experimental_context;
  await convex.mutation(api.mutations.createTicket, { projectId, ...input });
}
```

### New memory tools for the CEO

```
rememberDecision(summary, ticketId?)
  — Stores a decision to both Mem0 and Convex agentMemory

recallContext(query)
  — Searches Mem0 for relevant project context
```

These let the CEO explicitly store important decisions beyond what auto-memory captures.

---

## 5. URL Structure & Routing

```
/dashboard                              → project list (home)
/dashboard/[projectId]                  → project overview / redirect to tickets
/dashboard/[projectId]/tickets          → tickets for this project
/dashboard/[projectId]/agents           → agents for this project
/dashboard/[projectId]/ceo-chat         → CEO chat scoped to this project
/dashboard/[projectId]/threads          → chat threads for this project
/dashboard/[projectId]/revenue          → revenue for this project
```

### Layout changes

- `app/dashboard/layout.tsx` — top-level layout with project selector
- `app/dashboard/[projectId]/layout.tsx` — project-scoped layout, passes `projectId` to all children via context or params
- All page components read `projectId` from route params and pass to Convex queries

### API route changes

```
POST /api/agents/ceo
  Body: { messages: UIMessage[], projectId: string }
  — projectId passed to ceoChatWorkflow
```

The reconnection endpoint and hooks endpoint remain unchanged — they operate on workflow run IDs which are already unique.

---

## 6. Migration Path

Since this is early development with no production data that matters:

1. Add `projectId` fields as **optional** to all tables in `convex/schema.ts`
2. Add the `projects` and `agentMemory` tables
3. Deploy schema with `npx convex dev`
4. Create a migration mutation that:
   - Creates a default project ("Default Project")
   - Backfills all existing tickets, threads, logs with the default project ID
5. Make `projectId` **required** on all tables
6. Deploy final schema
7. Update all queries and mutations to accept/filter by `projectId`
8. Update all agent tools to pass `projectId`
9. Update routing from `/dashboard/*` to `/dashboard/[projectId]/*`
10. Update the dashboard home to show project list

---

## 7. Files to Create or Modify

### New files
- `lib/memory/mem0-client.ts` — Mem0 client wrapper
- `convex/projects.ts` — project CRUD mutations/queries
- `app/dashboard/page.tsx` — project list (new home)
- `app/dashboard/[projectId]/layout.tsx` — project-scoped layout
- `app/dashboard/[projectId]/tickets/page.tsx` — moved from `/dashboard/tickets`
- `app/dashboard/[projectId]/agents/page.tsx` — moved
- `app/dashboard/[projectId]/ceo-chat/page.tsx` — moved
- `app/dashboard/[projectId]/threads/page.tsx` — moved
- `app/dashboard/[projectId]/revenue/page.tsx` — moved

### Modified files
- `convex/schema.ts` — add projects table, agentMemory table, projectId fields
- `convex/mutations.ts` — add projectId to createTicket, logAgentAction
- `convex/queries.ts` — add projectId filtering to all queries
- `convex/ceoChatMutations.ts` — add projectId to createThread
- `convex/ceoChatQueries.ts` — add projectId filtering to listThreads
- `lib/agents/ceo/workflow.ts` — accept projectId, inject memory, pass context
- `lib/agents/ceo/tools.ts` — read projectId from experimental_context
- `app/api/agents/ceo/route.ts` — accept projectId from request body
- `app/dashboard/layout.tsx` — remove project-specific nav, add project selector
- `package.json` — add `@mem0/vercel-ai-provider`

### Unchanged
- `app/api/agents/ceo/[runId]/stream/route.ts` — operates on run IDs
- `app/api/agents/ceo/hooks/answer/route.ts` — operates on hook tokens
- `lib/agents/ceo/skills.ts` — skills are global, not project-scoped
- `lib/agents/ceo/hooks.ts` — hooks are workflow-scoped
