import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tickets: defineTable({
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
  })
    .index("by_status", ["status"])
    .index("by_assignee", ["assignee"])
    .index("by_parent", ["parentTicket"]),

  comments: defineTable({
    ticketId: v.id("tickets"),
    author: v.string(),
    content: v.string(),
  }).index("by_ticket", ["ticketId"]),

  artifacts: defineTable({
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
  }).index("by_ticket", ["ticketId"]),

  agentLogs: defineTable({
    agent: v.string(),
    action: v.string(),
    details: v.string(),
    ticketId: v.optional(v.id("tickets")),
  }).index("by_ticket", ["ticketId"]),

  agentMemory: defineTable({
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
    .index("by_ticket", ["ticketId"]),

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
});
