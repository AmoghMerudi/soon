import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";
import { getSkillContent } from "./skills";
import { exaSearchDurableTool } from "../exa-tools";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// --- Step functions (each uses "use step" for durability and automatic retries) ---

async function getTicketDetailsStep(input: { ticketId: string }) {
  "use step";

  const details = await convex.query(api.queries.getTicketDetails, {
    ticketId: input.ticketId as any,
  });

  return details;
}

async function createTicketStep(input: {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  tags: string[];
  assignee: string;
  taggedAgents: string[];
  projectId?: string;
}) {
  "use step";

  const ticketId = await convex.mutation(api.mutations.createTicket, {
    title: input.title,
    description: input.description,
    status: "backlog",
    priority: input.priority,
    tags: input.tags,
    assignee: input.assignee,
    createdBy: "CMO",
    taggedAgents: input.taggedAgents,
    ...(input.projectId ? { projectId: input.projectId as any } : {}),
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CMO",
    action: "create_ticket",
    details: `Created ticket: ${input.title}`,
    ticketId,
  });

  return { ticketId: ticketId.toString(), title: input.title };
}

async function assignTicketStep(input: {
  ticketId: string;
  assignee: string;
}) {
  "use step";

  await convex.mutation(api.mutations.assignTicket, {
    ticketId: input.ticketId as any,
    assignee: input.assignee,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CMO",
    action: "assign_ticket",
    details: `Assigned ticket ${input.ticketId} to ${input.assignee ?? "unassigned"}`,
    ticketId: input.ticketId as any,
  });

  return { success: true };
}

async function updateTicketStatusStep(input: {
  ticketId: string;
  status: "backlog" | "in_progress" | "in_review" | "resolved" | "blocked";
}) {
  "use step";

  await convex.mutation(api.mutations.updateTicketStatus, {
    ticketId: input.ticketId as any,
    status: input.status,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CMO",
    action: "update_ticket_status",
    details: `Updated ticket ${input.ticketId} to ${input.status}`,
    ticketId: input.ticketId as any,
  });

  return { success: true };
}

async function addCommentStep(input: {
  ticketId: string;
  content: string;
}) {
  "use step";

  const commentId = await convex.mutation(api.mutations.addComment, {
    ticketId: input.ticketId as any,
    content: input.content,
    author: "CMO",
  });

  return { commentId: commentId.toString() };
}

async function reviewArtifactStep(input: { ticketId: string }) {
  "use step";

  const [ticket, comments, artifacts] = await Promise.all([
    convex.query(api.queries.getTicket, {
      ticketId: input.ticketId as any,
    }),
    convex.query(api.queries.getTicketComments, {
      ticketId: input.ticketId as any,
    }),
    convex.query(api.queries.getTicketArtifacts, {
      ticketId: input.ticketId as any,
    }),
  ]);

  return { ticket, comments, artifacts };
}

async function getTicketsByAssigneeStep(input: { assignee: string }) {
  "use step";

  const tickets = await convex.query(api.queries.getTicketsByAssignee, {
    assignee: input.assignee,
  });

  return tickets.map((t) => ({
    id: t._id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee,
    tags: t.tags,
  }));
}

async function getTicketsByTagStep(input: { tag: string }) {
  "use step";

  const tickets = await convex.query(api.queries.getTicketsByTag, {
    tag: input.tag,
  });

  return tickets.map((t) => ({
    id: t._id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee,
    tags: t.tags,
  }));
}

async function saveDeliverableStep(input: {
  ticketId?: string;
  title: string;
  body: string;
  category: "plan" | "analysis" | "report" | "strategy" | "brief" | "spec" | "other";
  projectId?: string;
}) {
  "use step";

  let projectId = input.projectId;
  if (!projectId && input.ticketId) {
    const ticket = await convex.query(api.queries.getTicket, {
      ticketId: input.ticketId as any,
    });
    projectId = ticket?.projectId as string | undefined;
  }
  if (!projectId) return { error: "Cannot determine project — provide a ticketId" };

  const id = await convex.mutation(api.mutations.createDeliverable, {
    projectId: projectId as any,
    ticketId: (input.ticketId || undefined) as any,
    title: input.title,
    body: input.body,
    category: input.category,
    createdBy: "CMO",
  });

  return { deliverableId: id.toString(), title: input.title };
}

async function loadSkillStep(input: { name: string }) {
  "use step";

  const content = getSkillContent(input.name);
  if (!content) return { error: `Skill "${input.name}" not found` };
  return { name: input.name, instructions: content };
}

// --- Tool definitions for DurableAgent ---

export function buildCmoTools(projectId?: string) {
  return {
  getTicketDetails: {
    description:
      "Fetch full ticket context including description, parent ticket, sub-tickets, comments, and artifacts. Always call this first when assigned a ticket.",
    inputSchema: z.object({
      ticketId: z.string().describe("The ticket ID to fetch details for"),
    }),
    execute: getTicketDetailsStep,
  },

  createTicket: {
    description:
      "Create a new marketing or design ticket. Assign design work to 'Designer', content/distribution work to 'Marketing'.",
    inputSchema: z.object({
      title: z.string().describe("Short, descriptive ticket title"),
      description: z
        .string()
        .describe("Detailed description with acceptance criteria"),
      priority: z.enum(["critical", "high", "medium", "low"]),
      tags: z
        .array(z.string())
        .describe(
          'Domain tags: "design", "marketing", "content", "brand", "campaign", "social"'
        ),
      assignee: z
        .string()
        .describe(
          "REQUIRED. 'Designer' for visual work, 'Marketing' for content/distribution."
        ),
      taggedAgents: z
        .array(z.string())
        .describe("Agents to notify — always include CMO"),
    }),
    execute: (input: Parameters<typeof createTicketStep>[0]) =>
      createTicketStep({ ...input, projectId }),
  },

  assignTicket: {
    description:
      "Assign or reassign a ticket. CMO delegates to 'Designer' or 'Marketing' only.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
      assignee: z
        .nullable(z.string())
        .describe(
          "'Designer' for visual work, 'Marketing' for content/campaigns, or null to unassign"
        ),
    }),
    execute: assignTicketStep,
  },

  updateTicketStatus: {
    description:
      "Move a ticket through workflow states: backlog → in_progress → in_review → resolved. Use blocked when work is stuck.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
      status: z.enum([
        "backlog",
        "in_progress",
        "in_review",
        "resolved",
        "blocked",
      ]),
    }),
    execute: updateTicketStatusStep,
  },

  addComment: {
    description:
      "Add marketing strategy, campaign briefs, feedback, or review notes to a ticket.",
    inputSchema: z.object({
      ticketId: z
        .string()
        .describe("The EXACT ticket ID (long alphanumeric string)"),
      content: z
        .string()
        .describe(
          "Strategy guidance, campaign briefs, messaging direction, or review feedback"
        ),
    }),
    execute: addCommentStep,
  },

  reviewArtifact: {
    description:
      "Review completed work on a ticket — fetches ticket details, all comments, and attached artifacts (designs, copy, campaigns). Use to approve or request changes.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
    }),
    execute: reviewArtifactStep,
  },

  getTicketsByAssignee: {
    description:
      "See what a specific agent is working on. Check Designer and Marketing workload before assigning new tasks.",
    inputSchema: z.object({
      assignee: z
        .string()
        .describe("Agent name: Designer, Marketing, CMO, CEO, CTO"),
    }),
    execute: getTicketsByAssigneeStep,
  },

  getTicketsByTag: {
    description:
      "Query tickets by domain tag to understand marketing and design workload.",
    inputSchema: z.object({
      tag: z
        .string()
        .describe(
          'Tag to filter by: "design", "marketing", "content", "brand", "campaign", "social"'
        ),
    }),
    execute: getTicketsByTagStep,
  },

  loadSkill: {
    description:
      "Load a skill's full instructions by name. Use when a task matches an available skill.",
    inputSchema: z.object({
      name: z.string().describe("Skill name from the available skills list"),
    }),
    execute: loadSkillStep,
  },

  saveDeliverable: {
    description:
      "Save a deliverable to the repository — marketing strategies, campaign briefs, brand analyses, content plans. Persists beyond ticket comments for long-term reference.",
    inputSchema: z.object({
      ticketId: z.string().optional().describe("Related ticket ID if applicable"),
      title: z.string().describe("Clear title for the deliverable"),
      body: z.string().describe("Full content in markdown"),
      category: z
        .enum(["plan", "analysis", "report", "strategy", "brief", "spec", "other"])
        .describe("Type of deliverable"),
    }),
    execute: (input: { ticketId?: string; title: string; body: string; category: "plan" | "analysis" | "report" | "strategy" | "brief" | "spec" | "other" }) =>
      saveDeliverableStep({ ...input, projectId }),
  },

  exaSearch: exaSearchDurableTool,
  };
}
