import { tool } from "ai";
import { z } from "zod";
import { getConvexClient } from "@/lib/agent/convex-client";
import { api } from "@/convex/_generated/api";
import { exaSearchTool } from "./exa-tools";

const AGENT_NAME = "Developer";

export const developerTools = {
  updateTicketStatus: tool({
    description:
      "Move a ticket through the workflow. Use 'in_progress' when starting, 'in_review' when handing off for review, 'resolved' when complete. Set 'reason' if status is 'blocked'.",
    inputSchema: z.object({
      ticketId: z.string(),
      status: z.enum(["backlog", "in_progress", "in_review", "resolved", "blocked"]),
      reason: z.string().optional(),
    }),
    execute: async (input) => {
      const convex = getConvexClient();
      await convex.mutation(api.mutations.updateTicketStatus, {
        ticketId: input.ticketId as never,
        status: input.status,
        ...(input.reason ? { reason: input.reason } : {}),
      });
      await convex.mutation(api.mutations.logAgentAction, {
        agent: AGENT_NAME,
        action: "update_ticket",
        details: `Status → ${input.status}${input.reason ? `: ${input.reason}` : ""}`,
        ticketId: input.ticketId as never,
      });
      return { ok: true };
    },
  }),
  addComment: tool({
    description:
      "Add a progress note, decision, or hand-off comment to a ticket.",
    inputSchema: z.object({
      ticketId: z.string(),
      content: z.string(),
    }),
    execute: async (input) => {
      const convex = getConvexClient();
      const id = await convex.mutation(api.mutations.addComment, {
        ticketId: input.ticketId as never,
        author: AGENT_NAME,
        content: input.content,
      });
      return { commentId: id };
    },
  }),
  addArtifact: tool({
    description:
      "Attach a deliverable to a ticket. Use type 'pr' for pull requests, 'deployment' for preview URLs, 'document' for docs.",
    inputSchema: z.object({
      ticketId: z.string(),
      type: z.enum(["pr", "design", "deployment", "document", "image", "other"]),
      url: z.string(),
      description: z.string(),
    }),
    execute: async (input) => {
      const convex = getConvexClient();
      const id = await convex.mutation(api.mutations.addArtifact, {
        ticketId: input.ticketId as never,
        type: input.type,
        url: input.url,
        description: input.description,
      });
      await convex.mutation(api.mutations.logAgentAction, {
        agent: AGENT_NAME,
        action: "add_artifact",
        details: `Attached ${input.type}: ${input.url}`,
        ticketId: input.ticketId as never,
      });
      return { artifactId: id };
    },
  }),
  getTicketDetails: tool({
    description:
      "Read full ticket context including parent ticket, sub-tickets, comments, artifacts, and agent logs.",
    inputSchema: z.object({ ticketId: z.string() }),
    execute: async (input) => {
      const convex = getConvexClient();
      return await convex.query(api.queries.getTicketDetails, {
        ticketId: input.ticketId as never,
      });
    },
  }),
  markBlocked: tool({
    description:
      "Mark a ticket as blocked with a clear reason. Auto-escalates to the CTO after 5 minutes. Use only when truly stuck — communicate the blocker, don't spin.",
    inputSchema: z.object({
      ticketId: z.string(),
      reason: z.string(),
    }),
    execute: async (input) => {
      const convex = getConvexClient();
      await convex.mutation(api.mutations.markBlocked, {
        ticketId: input.ticketId as never,
        reason: input.reason,
      });
      await convex.mutation(api.mutations.logAgentAction, {
        agent: AGENT_NAME,
        action: "mark_blocked",
        details: input.reason,
        ticketId: input.ticketId as never,
      });
      return { ok: true };
    },
  }),

  exaSearch: exaSearchTool,
};
