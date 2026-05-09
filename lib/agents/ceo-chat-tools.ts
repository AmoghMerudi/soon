import { tool } from "ai";
import { z } from "zod";
import { getConvexClient } from "@/lib/agent/convex-client";
import { api } from "@/convex/_generated/api";

export const ceoChatTools = {
  createTicket: tool({
    description:
      "Create a new ticket in the project management system. Use this when the user has approved a plan and you're ready to create work items. Always set status to backlog.",
    inputSchema: z.object({
      title: z.string().describe("Short, descriptive ticket title"),
      description: z
        .string()
        .describe("Detailed description with acceptance criteria"),
      priority: z.enum(["critical", "high", "medium", "low"]),
      tags: z.array(z.string()).describe('e.g. ["engineering", "infra"]'),
      assignee: z
        .nullable(z.string())
        .describe("Agent role to assign: Developer, Designer, Marketing, or null"),
      taggedAgents: z
        .array(z.string())
        .describe("Agents to notify, usually includes CEO"),
    }),
    execute: async (input) => {
      const convex = getConvexClient();
      const ticketId = await convex.mutation(api.mutations.createTicket, {
        title: input.title,
        description: input.description,
        status: "backlog",
        priority: input.priority,
        tags: input.tags,
        assignee: input.assignee,
        createdBy: "CEO",
        taggedAgents: input.taggedAgents,
      });
      await convex.mutation(api.mutations.logAgentAction, {
        agent: "CEO",
        action: "create_ticket",
        details: `Created ticket: ${input.title}`,
        ticketId,
      });
      return { ticketId: ticketId.toString(), title: input.title };
    },
  }),

  updateTicketStatus: tool({
    description: "Update the status of an existing ticket.",
    inputSchema: z.object({
      ticketId: z.string(),
      status: z.enum([
        "backlog",
        "in_progress",
        "in_review",
        "resolved",
        "blocked",
      ]),
    }),
    execute: async (input) => {
      const convex = getConvexClient();
      await convex.mutation(api.mutations.updateTicketStatus, {
        ticketId: input.ticketId as any,
        status: input.status,
      });
      await convex.mutation(api.mutations.logAgentAction, {
        agent: "CEO",
        action: "update_ticket",
        details: `Updated ticket ${input.ticketId} to ${input.status}`,
        ticketId: input.ticketId as any,
      });
      return { success: true };
    },
  }),

  addComment: tool({
    description: "Add a comment to an existing ticket.",
    inputSchema: z.object({
      ticketId: z.string(),
      content: z.string(),
    }),
    execute: async (input) => {
      const convex = getConvexClient();
      await convex.mutation(api.mutations.addComment, {
        ticketId: input.ticketId as any,
        content: input.content,
        author: "CEO",
      });
      return { success: true };
    },
  }),

  listTickets: tool({
    description:
      "List all tickets, optionally filtered by assignee. Use to check current state of work.",
    inputSchema: z.object({
      assignee: z
        .string()
        .optional()
        .describe("Filter by assignee role, e.g. Developer"),
    }),
    execute: async (input) => {
      const convex = getConvexClient();
      if (input.assignee) {
        const tickets = await convex.query(api.queries.getTicketsByAssignee, {
          assignee: input.assignee,
        });
        return tickets.map((t) => ({
          id: t._id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee,
        }));
      }
      const allTickets = await Promise.all(
        (
          ["backlog", "in_progress", "in_review", "resolved", "blocked"] as const
        ).map((status) =>
          convex.query(api.queries.getTicketsByStatus, { status })
        )
      );
      return allTickets.flat().map((t) => ({
        id: t._id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee,
      }));
    },
  }),
};
