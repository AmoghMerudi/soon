import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// --- Step functions (each uses "use step" for durability and retries) ---

async function createTicketStep(input: {
  projectId: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  tags: string[];
  assignee: string | null;
  taggedAgents: string[];
  agentName: string;
  parentTicket?: string;
}) {
  "use step";

  const ticketId = await convex.mutation(api.mutations.createTicket, {
    projectId: input.projectId as any,
    title: input.title,
    description: input.description,
    status: "backlog",
    priority: input.priority,
    tags: input.tags,
    assignee: input.assignee,
    createdBy: input.agentName,
    taggedAgents: input.taggedAgents,
    ...(input.parentTicket ? { parentTicket: input.parentTicket as any } : {}),
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: input.agentName,
    action: "create_ticket",
    details: `Created ticket: ${input.title}`,
    ticketId,
  });

  return ticketId;
}

async function updateTicketStep(input: {
  ticketId: string;
  status: "backlog" | "in_progress" | "in_review" | "resolved" | "blocked";
  agentName: string;
}) {
  "use step";

  await convex.mutation(api.mutations.updateTicketStatus, {
    ticketId: input.ticketId as any,
    status: input.status,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: input.agentName,
    action: "update_ticket",
    details: `Updated ticket ${input.ticketId} status to ${input.status}`,
    ticketId: input.ticketId as any,
  });

  return { success: true };
}

async function addCommentStep(input: {
  ticketId: string;
  content: string;
  author: string;
}) {
  "use step";

  const commentId = await convex.mutation(api.mutations.addComment, {
    ticketId: input.ticketId as any,
    content: input.content,
    author: input.author,
  });

  return commentId;
}

async function addArtifactStep(input: {
  ticketId: string;
  type: "pr" | "design" | "deployment" | "document" | "image" | "other";
  url: string;
  description: string;
}) {
  "use step";

  const artifactId = await convex.mutation(api.mutations.addArtifact, {
    ticketId: input.ticketId as any,
    type: input.type,
    url: input.url,
    description: input.description,
  });

  return artifactId;
}

async function getMyTicketsStep(input: {
  projectId: string;
  assignee: string;
}) {
  "use step";

  const tickets = await convex.query(api.queries.getTicketsByAssignee, {
    projectId: input.projectId as any,
    assignee: input.assignee,
  });

  return tickets;
}

// --- Tool definitions for DurableAgent ---

export const convexTools = {
  createTicket: {
    description:
      "Create a new ticket in the project management system. Always set status to backlog. Provide your agent name in the agentName field.",
    inputSchema: z.object({
      projectId: z.string(),
      title: z.string(),
      description: z.string(),
      priority: z.enum(["critical", "high", "medium", "low"]),
      tags: z.array(z.string()),
      assignee: z.nullable(z.string()),
      taggedAgents: z.array(z.string()),
      agentName: z.string(),
      parentTicket: z.optional(z.string()),
    }),
    execute: createTicketStep,
  },
  updateTicket: {
    description:
      "Update the status of an existing ticket. Provide your agent name in the agentName field.",
    inputSchema: z.object({
      ticketId: z.string(),
      status: z.enum([
        "backlog",
        "in_progress",
        "in_review",
        "resolved",
        "blocked",
      ]),
      agentName: z.string(),
    }),
    execute: updateTicketStep,
  },
  addComment: {
    description: "Add a comment to an existing ticket.",
    inputSchema: z.object({
      ticketId: z.string(),
      content: z.string(),
      author: z.string(),
    }),
    execute: addCommentStep,
  },
  addArtifact: {
    description: "Attach an artifact (PR, design, document, etc.) to a ticket.",
    inputSchema: z.object({
      ticketId: z.string(),
      type: z.enum(["pr", "design", "deployment", "document", "image", "other"]),
      url: z.string(),
      description: z.string(),
    }),
    execute: addArtifactStep,
  },
  getMyTickets: {
    description: "Get all tickets assigned to a specific agent or person.",
    inputSchema: z.object({
      projectId: z.string(),
      assignee: z.string(),
    }),
    execute: getMyTicketsStep,
  },
};
