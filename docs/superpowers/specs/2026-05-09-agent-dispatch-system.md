# Agent Dispatch System

> Ticket assignment automatically triggers the correct agent workflow and tracks its run lifecycle. Currently dispatch fires-and-forgets with no run record — this spec closes that gap.

## Current State

- `convex/mutations.ts` `assignTicket` calls `ctx.scheduler.runAfter(0, internal.dispatch.dispatchAgent, { ticketId, agentRole })`
- `convex/dispatch.ts` `dispatchAgent` hits `/api/agents/{role}` via HTTP fetch
- All 6 agent routes exist and accept `{ ticketId }`, return `{ runId }`
- `WIRED_AGENTS = new Set(["cto", "cmo", "developer", "designer", "marketing"])`
- CEO is **not** dispatch-triggered — only triggered via chat UI

## Gaps to Close

1. `runId` returned by `start()` is discarded — no persistent link between ticket and workflow run
2. No way to know if a workflow is running, finished, or failed from the dashboard
3. No retry on dispatch failure — if the agent route returns 500, the log says "dispatch_error" and stops
4. CEO is outside the dispatch system; assigning a ticket to CEO does nothing

---

## 1. Schema: Store Run ID on Ticket

Add `workflowRunId` to the `tickets` table:

```typescript
tickets: defineTable({
  // ... existing fields
  workflowRunId: v.optional(v.string()),
  dispatchStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
  )),
})
```

`dispatchStatus` is set by the dispatch action and updated by the agent when it finishes or fails.

---

## 2. Dispatch Flow (Updated)

```
assignTicket(ticketId, agentRole)
  └─ ctx.scheduler.runAfter(0, dispatchAgent, { ticketId, agentRole })
       └─ POST /api/agents/{role}  { ticketId }
            └─ start(workflow, [ticketId])
                 └─ Response: { runId }
                      └─ ctx.runMutation(storeRunId, { ticketId, runId })
                           └─ tickets.patch({ workflowRunId: runId, dispatchStatus: "running" })
```

### `dispatchAgent` changes

```typescript
// After successful HTTP call:
const data = await response.json();
if (data.runId) {
  await ctx.runMutation(internal.mutations.storeWorkflowRun, {
    ticketId,
    runId: data.runId,
  });
}
```

### New internal mutation: `storeWorkflowRun`

```
storeWorkflowRun(ticketId, runId)
  — patches tickets with workflowRunId and dispatchStatus: "running"
```

---

## 3. Dispatch Retry

Current behavior: 4 Convex scheduler retries with exponential backoff happen automatically for the `dispatchAgent` action. This is sufficient for transient failures (cold start, brief 500).

For persistent failures: after 4 retries, log `dispatch_error` and set `dispatchStatus: "failed"` on the ticket. Dashboard can surface failed dispatches for manual retry.

Add a `retryDispatch` mutation callable from the dashboard:

```
retryDispatch(ticketId)
  — clears dispatchStatus, re-schedules dispatchAgent
```

---

## 4. Agent Completion Reporting

Each agent workflow should patch `dispatchStatus` when it finishes.

### Pattern for all agent workflows

```typescript
export async function ctoWorkflow(ticketId: string) {
  "use workflow";

  try {
    // ... agent work ...
    await markDispatchCompleted(ticketId);
  } catch (e) {
    await markDispatchFailed(ticketId, String(e));
    throw e;
  }
}
```

### New step functions (shared, in `lib/agents/shared/dispatch-steps.ts`)

```typescript
async function markDispatchCompleted(ticketId: string) {
  "use step";
  await convex.mutation(api.mutations.storeWorkflowRun, {
    ticketId,
    dispatchStatus: "completed",
  });
}

async function markDispatchFailed(ticketId: string, error: string) {
  "use step";
  await convex.mutation(api.mutations.storeWorkflowRun, {
    ticketId,
    dispatchStatus: "failed",
    errorDetail: error.slice(0, 500),
  });
}
```

---

## 5. CEO in the Dispatch System

The CEO receives assignments via the chat UI, not `assignTicket`. This asymmetry should be preserved — CEO is human-in-the-loop by design.

For now: when `assignTicket` is called with `agentRole: "ceo"`, log a message "CEO assignment — trigger via chat at /dashboard/ceo-chat" and set `dispatchStatus: "pending"`. Do not auto-trigger the CEO workflow.

Future: CEO review loop (item 10) will add a scheduled trigger for CEO without going through `assignTicket`.

---

## 6. Dispatch Status on Ticket Detail Page

`app/dashboard/tickets/[ticketId]/page.tsx` already shows a timeline. Add a dispatch status indicator:

```
○  Pending    — ticket assigned, workflow not yet started
▶  Running    — workflow active (shows runId)
✓  Completed  — workflow finished
✗  Failed     — dispatch error or workflow threw (shows retry button)
```

Source: `ticket.dispatchStatus` from Convex reactive query — updates in real time.

---

## 7. Files to Create or Modify

### New files
- `lib/agents/shared/dispatch-steps.ts` — `markDispatchCompleted`, `markDispatchFailed` shared step functions

### Modified files
- `convex/schema.ts` — add `workflowRunId`, `dispatchStatus` to tickets
- `convex/mutations.ts` — add `storeWorkflowRun` internal mutation, `retryDispatch` public mutation
- `convex/dispatch.ts` — call `storeWorkflowRun` after successful dispatch
- `lib/agents/cto/workflow.ts` — wrap in try/catch, call dispatch completion steps
- `lib/agents/cmo/workflow.ts` — same
- `lib/agents/developer/workflow.ts` — same
- `lib/agents/designer/workflow.ts` — same
- `lib/agents/marketing/workflow.ts` — same
- `app/dashboard/tickets/[ticketId]/page.tsx` — show dispatch status indicator
