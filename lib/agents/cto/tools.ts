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

async function createSubTicketStep(input: {
  parentTicketId: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  tags: string[];
  assignee: string | null;
  taggedAgents: string[];
}) {
  "use step";

  const ticketId = await convex.mutation(api.mutations.createTicket, {
    title: input.title,
    description: input.description,
    status: "backlog",
    priority: input.priority,
    tags: input.tags,
    assignee: input.assignee,
    createdBy: "CTO",
    taggedAgents: input.taggedAgents,
    parentTicket: input.parentTicketId as any,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CTO",
    action: "create_sub_ticket",
    details: `Created sub-ticket: ${input.title} (parent: ${input.parentTicketId})`,
    ticketId,
  });

  return { ticketId: ticketId.toString(), title: input.title };
}

async function assignTicketStep(input: {
  ticketId: string;
  assignee: string | null;
}) {
  "use step";

  await convex.mutation(api.mutations.assignTicket, {
    ticketId: input.ticketId as any,
    assignee: input.assignee,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CTO",
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
    agent: "CTO",
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
    author: "CTO",
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

async function loadSkillStep(input: { name: string }) {
  "use step";

  const content = getSkillContent(input.name);
  if (!content) return { error: `Skill "${input.name}" not found` };
  return { name: input.name, instructions: content };
}

// --- Tool definitions for DurableAgent ---

export const ctoTools = {
  getTicketDetails: {
    description:
      "Fetch full ticket context including description, parent ticket, sub-tickets, comments, and artifacts. Always call this first when assigned a ticket.",
    inputSchema: z.object({
      ticketId: z.string().describe("The ticket ID to fetch details for"),
    }),
    execute: getTicketDetailsStep,
  },

  createSubTicket: {
    description:
      "Break a ticket into implementation sub-tasks. Assign to 'Developer' only. Max 5 sub-tickets per decomposition. Include clear acceptance criteria in each description.",
    inputSchema: z.object({
      parentTicketId: z.string().describe("The parent ticket ID"),
      title: z.string().describe("Short, action-oriented task title"),
      description: z
        .string()
        .describe("Detailed description with acceptance criteria"),
      priority: z.enum(["critical", "high", "medium", "low"]),
      tags: z.array(z.string()).describe("Domain tags inherited from parent"),
      assignee: z
        .nullable(z.string())
        .describe("Use 'Developer' for implementation tasks"),
      taggedAgents: z
        .array(z.string())
        .describe("Agents to notify — always include CTO"),
    }),
    execute: createSubTicketStep,
  },

  assignTicket: {
    description:
      "Assign or reassign a ticket. CTO delegates to 'Developer' only.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
      assignee: z
        .nullable(z.string())
        .describe("'Developer' for implementation work, or null to unassign"),
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
      "Add architecture guidance, technical feedback, or review notes to a ticket.",
    inputSchema: z.object({
      ticketId: z
        .string()
        .describe("The EXACT ticket ID (long alphanumeric string)"),
      content: z
        .string()
        .describe(
          "Architecture decisions, technical guidance, tradeoff analysis, or review feedback"
        ),
    }),
    execute: addCommentStep,
  },

  reviewArtifact: {
    description:
      "Review completed work on a ticket — fetches ticket details, all comments, and attached artifacts (PRs, deployments). Use to approve or request changes.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
    }),
    execute: reviewArtifactStep,
  },

  getTicketsByAssignee: {
    description:
      "See what a specific agent is working on. Check Developer workload before assigning new tasks.",
    inputSchema: z.object({
      assignee: z
        .string()
        .describe("Agent name: Developer, CTO, CEO, CMO, Designer, Marketing"),
    }),
    execute: getTicketsByAssigneeStep,
  },

  getTicketsByTag: {
    description:
      "Query tickets by domain tag to understand engineering workload and priorities.",
    inputSchema: z.object({
      tag: z
        .string()
        .describe(
          'Tag to filter by: "engineering", "infrastructure", "security", etc.'
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

  exaSearch: exaSearchDurableTool,
};
