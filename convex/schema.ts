import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    githubRepo: v.optional(v.string()),
    githubOwner: v.optional(v.string()),
    stripeApiKey: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  tickets: defineTable({
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("resolved"),
      v.literal("blocked")
    ),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    assignee: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
    createdBy: v.string(),
    taggedAgents: v.array(v.string()),
    parentTicket: v.optional(v.id("tickets")),
    depth: v.optional(v.number()),
    blockedAt: v.optional(v.number()),
    blockedReason: v.optional(v.string()),
    escalatedTo: v.optional(v.string()),
    workflowRunId: v.optional(v.string()),
    dispatchStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    dispatchErrorDetail: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_assignee", ["assignee"])
    .index("by_parent", ["parentTicket"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_project_assignee", ["projectId", "assignee"]),

  comments: defineTable({
    projectId: v.optional(v.id("projects")),
    ticketId: v.id("tickets"),
    author: v.string(),
    content: v.string(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_project_ticket", ["projectId", "ticketId"]),

  artifacts: defineTable({
    projectId: v.optional(v.id("projects")),
    ticketId: v.id("tickets"),
    type: v.union(
      v.literal("pr"),
      v.literal("design"),
      v.literal("deployment"),
      v.literal("document"),
      v.literal("image"),
      v.literal("other")
    ),
    url: v.string(),
    description: v.string(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_project_ticket", ["projectId", "ticketId"]),

  agentLogs: defineTable({
    projectId: v.optional(v.id("projects")),
    agent: v.string(),
    action: v.string(),
    details: v.string(),
    ticketId: v.optional(v.id("tickets")),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_project_ticket", ["projectId", "ticketId"]),

  agentSteps: defineTable({
    ticketId: v.id("tickets"),
    workflowRunId: v.string(),
    agentId: v.string(),
    stepIndex: v.number(),
    toolName: v.string(),
    inputSummary: v.string(),
    outputSummary: v.optional(v.string()),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_run", ["workflowRunId"])
    .index("by_agent_recent", ["agentId", "startedAt"]),

  agentMemory: defineTable({
    projectId: v.optional(v.id("projects")),
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
    .index("by_agent", ["agentId"])
    .index("by_type", ["memoryType"])
    .index("by_ticket", ["ticketId"])
    .index("by_project_agent", ["projectId", "agentId"]),

  agentConfig: defineTable({
    agentId: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("strategic"), v.literal("execution")),
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("busy"),
      v.literal("paused")
    ),
    maxActiveTickets: v.number(),
    maxStepsPerExecution: v.number(),
    composioEntityId: v.optional(v.string()),
    enabledTools: v.array(v.string()),
    currentTicketIds: v.array(v.id("tickets")),
  })
    .index("by_agentId", ["agentId"])
    .index("by_status", ["status"]),

  skills: defineTable({
    name: v.string(),
    description: v.string(),
    content: v.string(),
    agent: v.optional(v.string()),
    tags: v.array(v.string()),
    version: v.number(),
    isActive: v.boolean(),
  })
    .index("by_name", ["name"])
    .index("by_agent", ["agent"])
    .index("by_active", ["isActive"]),

  ceoChatThreads: defineTable({
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    preview: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_updated", ["updatedAt"])
    .index("by_project_updated", ["projectId", "updatedAt"]),

  ceoChatMessages: defineTable({
    projectId: v.optional(v.id("projects")),
    threadId: v.id("ceoChatThreads"),
    messageId: v.string(),
    role: v.string(),
    serialized: v.string(),
    createdAt: v.number(),
  })
    .index("by_thread", ["threadId", "createdAt"])
    .index("by_project_thread", ["projectId", "threadId"]),
});
