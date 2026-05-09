# Agent Observability

> Live view of what each agent is doing. Stream tool call activity to Convex as agents run so the dashboard can show real-time progress per ticket and per agent.

## Current State

- `agentLogs` table exists — records coarse-grained actions (e.g. "create_ticket", "update_status") written by step functions
- `app/dashboard/tickets/[ticketId]/page.tsx` shows a merged timeline of comments + logs (reactive via Convex)
- `app/dashboard/agents/page.tsx` shows static agent cards — no live activity
- No per-step visibility: tool inputs, outputs, which step the agent is on, how long it ran

## Goals

1. See which agent is currently working, and on which ticket
2. See each tool call the agent made — name, input summary, output summary, timestamp
3. See the agent's current status per ticket: idle / thinking / calling tool / done
4. Inspect a full run timeline after it completes

---

## 1. Schema: `agentSteps` Table

Fine-grained record of each tool call made during a workflow run.

```typescript
agentSteps: defineTable({
  ticketId: v.id("tickets"),
  workflowRunId: v.string(),
  agentId: v.string(),                   // "cto", "developer", etc.
  stepIndex: v.number(),
  toolName: v.string(),
  inputSummary: v.string(),              // trimmed JSON, max 500 chars
  outputSummary: v.optional(v.string()), // set when step completes
  status: v.union(
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  durationMs: v.optional(v.number()),
  error: v.optional(v.string()),
})
  .index("by_ticket", ["ticketId"])
  .index("by_run", ["workflowRunId"])
  .index("by_agent_recent", ["agentId", "startedAt"]),
```

`agentLogs` remains for coarse-grained application events (ticket status changes, assignments). `agentSteps` is for workflow-level tool call detail.

---

## 2. Writing Steps from Agent Workflows

### DurableAgent `onStepFinish` callback

Each agent workflow passes `onStepFinish` to `agent.stream()`. This callback fires after each tool call completes.

```typescript
import { writeAgentStep } from "../shared/observability";

await agent.stream({
  messages,
  writable,
  maxSteps: 15,
  onStepFinish: async ({ stepNumber, toolCalls, toolResults, finishReason }) => {
    for (let i = 0; i < toolCalls.length; i++) {
      const call = toolCalls[i];
      const result = toolResults?.[i];
      await writeAgentStep({
        ticketId,
        workflowRunId,        // passed into the workflow function
        agentId: "cto",
        stepIndex: stepNumber,
        toolName: call.toolName,
        inputSummary: JSON.stringify(call.input).slice(0, 500),
        outputSummary: result ? JSON.stringify(result).slice(0, 500) : undefined,
        status: "completed",
        startedAt: Date.now(),
      });
    }
  },
});
```

`writeAgentStep` is a `"use step"` function in `lib/agents/shared/observability.ts`.

### Passing `workflowRunId` into the workflow

The Vercel Workflow SDK exposes the current run ID via `getWorkflowMetadata()` from `"workflow"`:

```typescript
import { getWritable, getWorkflowMetadata } from "workflow";

export async function ctoWorkflow(ticketId: string) {
  "use workflow";
  const { workflowRunId } = getWorkflowMetadata();
  // ...pass to onStepFinish
}
```

`WorkflowMetadata` also exposes `workflowName`, `workflowStartedAt`, and `url`.

---

## 3. `lib/agents/shared/observability.ts`

```typescript
// Shared observability utilities for all agent workflows

async function writeAgentStep(input: {
  ticketId: string;
  workflowRunId: string;
  agentId: string;
  stepIndex: number;
  toolName: string;
  inputSummary: string;
  outputSummary?: string;
  status: "running" | "completed" | "failed";
  startedAt: number;
  durationMs?: number;
  error?: string;
}) {
  "use step";
  await convex.mutation(api.mutations.logAgentStep, input);
}
```

---

## 4. New Convex Mutations & Queries

### Mutations

```
logAgentStep(ticketId, workflowRunId, agentId, stepIndex, toolName,
             inputSummary, outputSummary?, status, startedAt, durationMs?, error?)
  — inserts into agentSteps

updateAgentStep(stepId, { outputSummary, status, completedAt, durationMs, error? })
  — used to mark a step completed after it finishes (alternative to insert-on-complete)
```

### Queries

```
getAgentStepsByTicket(ticketId) → AgentStep[]
  — all steps for a ticket, ordered by startedAt asc

getAgentStepsByRun(workflowRunId) → AgentStep[]
  — full step log for one workflow run

getRecentStepsByAgent(agentId, limit?) → AgentStep[]
  — last N steps for an agent, used in the agents dashboard panel

getActiveAgents() → { agentId, ticketId, toolName, startedAt }[]
  — agents with a step in "running" status (indicates live activity)
```

---

## 5. Dashboard: Ticket Detail Page (`/dashboard/tickets/[ticketId]`)

Extend the existing timeline to include agent steps inline.

### Timeline item types (extended)

```
"comment"    — from agentLogs (existing)
"log"        — from agentLogs (existing)
"step"       — new: tool call from agentSteps
```

### Step entry appearance

```
[CTO avatar]  architecture-review  12ms ago
              createSubTicket({ title: "Auth API", ... })
              → { ticketId: "abc123" }    ✓
```

Fields shown: tool name, input summary (collapsed by default, expandable), output summary, duration, status indicator.

Only show steps for the current ticket's `workflowRunId` (from `ticket.workflowRunId`).

---

## 6. Dashboard: Agents Page (`/dashboard/agents`)

Currently static. Make it live.

### Per-agent card additions

Each agent card shows:
- **Status**: idle / working (with ticket ID and tool name)
- **Last active**: timestamp of most recent completed step
- **Current tool**: if `status = "running"`, show the tool being called right now

Data source: `getActiveAgents()` + `getRecentStepsByAgent(agentId, limit: 1)` — both reactive.

### Live activity feed panel

Below the agent grid: a scrolling feed of the most recent steps across all agents.

```
CTO        createSubTicket          2s ago   ✓  8ms
Developer  updateTicketStatus       5s ago   ✓  12ms
CTO        addComment               8s ago   ✓  45ms
Designer   getTicketDetails        12s ago   ✓  6ms
```

Data source: `getAgentStepsByRun` or a global recent steps query, reactive.

---

## 7. Files to Create or Modify

### New files
- `lib/agents/shared/observability.ts` — `writeAgentStep` step function, shared by all agents
- `convex/agentSteps.ts` — `logAgentStep`, `updateAgentStep` mutations; `getAgentStepsByTicket`, `getAgentStepsByRun`, `getRecentStepsByAgent`, `getActiveAgents` queries

### Modified files
- `convex/schema.ts` — add `agentSteps` table
- `lib/agents/cto/workflow.ts` — add `onStepFinish`, pass `workflowRunId`
- `lib/agents/cmo/workflow.ts` — same
- `lib/agents/developer/workflow.ts` — same
- `lib/agents/designer/workflow.ts` — same
- `lib/agents/marketing/workflow.ts` — same
- `app/dashboard/tickets/[ticketId]/page.tsx` — merge `agentSteps` into timeline
- `app/dashboard/agents/page.tsx` — add live status and activity feed

### Unchanged
- `lib/agents/ceo/workflow.ts` — CEO is chat-based; steps visible in chat UI not needed here
- `agentLogs` table — keep for coarse events, don't replace with agentSteps
