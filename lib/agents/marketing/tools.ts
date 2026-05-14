import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";
import { exaSearchDurableTool } from "../exa-tools";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// --- Step functions ---

async function getTicketDetailsStep(input: { ticketId: string }) {
  "use step";
  const result = await convex.query(api.queries.getTicketDetails, {
    ticketId: input.ticketId as any,
  });
  return result;
}

async function updateTicketStatusStep(input: {
  ticketId: string;
  status: string;
  reason?: string;
}) {
  "use step";
  await convex.mutation(api.mutations.updateTicketStatus, {
    ticketId: input.ticketId as any,
    status: input.status as any,
    reason: input.reason,
  });
  await convex.mutation(api.mutations.logAgentAction, {
    agent: "Marketing",
    action: "update_ticket_status",
    details: `Status updated to ${input.status}${input.reason ? `: ${input.reason}` : ""}`,
    ticketId: input.ticketId as any,
  });
  return { success: true };
}

async function addCommentStep(input: {
  ticketId: string;
  content: string;
}) {
  "use step";
  const id = await convex.mutation(api.mutations.addComment, {
    ticketId: input.ticketId as any,
    author: "Marketing",
    content: input.content,
  });
  return { commentId: id.toString() };
}

async function addArtifactStep(input: {
  ticketId: string;
  type: "pr" | "design" | "deployment" | "document" | "image" | "other";
  url: string;
  description: string;
}) {
  "use step";
  const id = await convex.mutation(api.mutations.addArtifact, {
    ticketId: input.ticketId as any,
    type: input.type,
    url: input.url,
    description: input.description,
  });
  await convex.mutation(api.mutations.logAgentAction, {
    agent: "Marketing",
    action: "add_artifact",
    details: `Added ${input.type} artifact: ${input.description}`,
    ticketId: input.ticketId as any,
  });
  return { artifactId: id.toString() };
}

async function saveDeliverableStep(input: {
  ticketId?: string;
  title: string;
  body: string;
  category: "plan" | "analysis" | "report" | "strategy" | "brief" | "spec" | "other";
}) {
  "use step";

  let projectId: string | undefined;
  if (input.ticketId) {
    let current = await convex.query(api.queries.getTicket, {
      ticketId: input.ticketId as any,
    });
    while (current && !current.projectId && current.parentTicket) {
      current = await convex.query(api.queries.getTicket, {
        ticketId: current.parentTicket,
      });
    }
    projectId = current?.projectId as string | undefined;
  }
  if (!projectId) return { error: "Cannot determine project — provide a ticketId" };

  const id = await convex.mutation(api.mutations.createDeliverable, {
    projectId: projectId as any,
    ticketId: (input.ticketId || undefined) as any,
    title: input.title,
    body: input.body,
    category: input.category,
    createdBy: "Marketing",
  });

  return { deliverableId: id.toString(), title: input.title };
}

async function markBlockedStep(input: {
  ticketId: string;
  reason: string;
}) {
  "use step";
  await convex.mutation(api.mutations.markBlocked, {
    ticketId: input.ticketId as any,
    reason: input.reason,
  });
  await convex.mutation(api.mutations.logAgentAction, {
    agent: "Marketing",
    action: "mark_blocked",
    details: `Ticket blocked: ${input.reason}`,
    ticketId: input.ticketId as any,
  });
  return { success: true };
}

// --- Tool definitions for DurableAgent ---

export const marketingTools = {
  getTicketDetails: {
    description:
      "Fetch full details of a ticket including comments, artifacts, and logs.",
    inputSchema: z.object({
      ticketId: z.string().describe("The ticket ID to fetch details for"),
    }),
    execute: getTicketDetailsStep,
  },

  updateTicketStatus: {
    description: "Update the status of a ticket and log the action.",
    inputSchema: z.object({
      ticketId: z.string().describe("The ticket ID to update"),
      status: z
        .string()
        .describe(
          "The new status: backlog, in_progress, in_review, resolved, or blocked"
        ),
      reason: z
        .string()
        .optional()
        .describe("Optional reason for the status change"),
    }),
    execute: updateTicketStatusStep,
  },

  addComment: {
    description: "Add a comment to a ticket.",
    inputSchema: z.object({
      ticketId: z.string().describe("The ticket ID to comment on"),
      content: z.string().describe("The content of the comment"),
    }),
    execute: addCommentStep,
  },

  addArtifact: {
    description:
      "Add an artifact (published URL, document, image, etc.) to a ticket.",
    inputSchema: z.object({
      ticketId: z
        .string()
        .describe("The ticket ID to add the artifact to"),
      type: z
        .enum(["pr", "design", "deployment", "document", "image", "other"])
        .describe("The type of artifact"),
      url: z.string().describe("The URL of the artifact"),
      description: z.string().describe("A description of the artifact"),
    }),
    execute: addArtifactStep,
  },

  markBlocked: {
    description: "Mark a ticket as blocked with a reason.",
    inputSchema: z.object({
      ticketId: z.string().describe("The ticket ID to mark as blocked"),
      reason: z.string().describe("The reason the ticket is blocked"),
    }),
    execute: markBlockedStep,
  },

  saveDeliverable: {
    description:
      "Save a deliverable to the repository — content drafts, SEO analyses, campaign reports, performance analyses. Always save significant work products here, not just in ticket comments.",
    inputSchema: z.object({
      ticketId: z.string().optional().describe("Related ticket ID if applicable"),
      title: z.string().describe("Clear title for the deliverable"),
      body: z.string().describe("Full content in markdown"),
      category: z
        .enum(["plan", "analysis", "report", "strategy", "brief", "spec", "other"])
        .describe("Type of deliverable"),
    }),
    execute: saveDeliverableStep,
  },

  exaSearch: exaSearchDurableTool,
};
