import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getWritable } from "workflow";
import type { UIMessageChunk } from "ai";
import { z } from "zod";
import { getSkillContent } from "./skills";
import { questionHook } from "./hooks";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// --- Step functions (each uses "use step" for durability and automatic retries) ---

async function createTicketStep(input: {
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
    agent: "CEO",
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
    agent: "CEO",
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
    author: "CEO",
  });

  return { commentId: commentId.toString() };
}

async function getTicketsByStatusStep(input: {
  status: "backlog" | "in_progress" | "in_review" | "resolved" | "blocked";
}) {
  "use step";

  const tickets = await convex.query(api.queries.getTicketsByStatus, {
    status: input.status,
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
    createdBy: "CEO",
    taggedAgents: input.taggedAgents,
    parentTicket: input.parentTicketId as any,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CEO",
    action: "create_sub_ticket",
    details: `Created sub-ticket: ${input.title} (parent: ${input.parentTicketId})`,
    ticketId,
  });

  return { ticketId: ticketId.toString(), title: input.title };
}

// --- Skill & question step functions ---

async function loadSkillStep(input: { name: string }) {
  "use step";

  const content = getSkillContent(input.name);
  if (!content) return { error: `Skill "${input.name}" not found` };
  return { name: input.name, instructions: content };
}

async function writeQuestionToStream(
  toolCallId: string,
  question: string,
  options: string[]
) {
  "use step";

  const writable = getWritable<UIMessageChunk>();
  const writer = writable.getWriter();
  await writer.write({
    type: "data-question",
    id: toolCallId,
    data: { question, options },
  });
  writer.releaseLock();
}

async function askQuestionExecute(
  input: { question: string; options: string[] },
  { toolCallId }: { toolCallId: string }
) {
  await writeQuestionToStream(toolCallId, input.question, input.options);

  const hook = questionHook.create({ token: toolCallId });
  const { answer } = await hook;
  return answer;
}

// --- Tool definitions for DurableAgent ---

export const ceoTools = {
  createTicket: {
    description:
      "Create a new ticket. Assign engineering tickets to CTO, design/marketing tickets to CMO. Status is always backlog.",
    inputSchema: z.object({
      title: z.string().describe("Short, descriptive ticket title"),
      description: z
        .string()
        .describe("Detailed description with acceptance criteria"),
      priority: z.enum(["critical", "high", "medium", "low"]),
      tags: z
        .array(z.string())
        .describe(
          'Domain tags: "engineering", "design", "marketing", "strategy", "infrastructure", "security"'
        ),
      assignee: z
        .nullable(z.string())
        .describe(
          "CTO for engineering work, CMO for design/marketing. null for strategy."
        ),
      taggedAgents: z
        .array(z.string())
        .describe("Agents to notify — always include CEO"),
    }),
    execute: createTicketStep,
  },

  assignTicket: {
    description:
      "Assign or reassign a ticket to an agent. CEO delegates to CTO or CMO only. Use the EXACT ticketId from createTicket.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID from createTicket"),
      assignee: z
        .nullable(z.string())
        .describe("CTO, CMO, or null to unassign"),
    }),
    execute: assignTicketStep,
  },

  updateTicketStatus: {
    description:
      "Move a ticket through workflow states: backlog → in_progress → in_review → resolved. Use blocked when work is stuck.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID from createTicket"),
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
      "Add strategic context, feedback, or review notes to a ticket. Use the EXACT ticketId string returned by createTicket — it is a long alphanumeric ID.",
    inputSchema: z.object({
      ticketId: z
        .string()
        .describe(
          "The EXACT ticket ID returned by createTicket (long alphanumeric string, e.g. 'jx7akyp84a3ws1xfmx4cgxh9mn86db7r'). Do NOT shorten or modify it."
        ),
      content: z
        .string()
        .describe("Strategic guidance, feedback, or review notes"),
    }),
    execute: addCommentStep,
  },

  getTicketsByStatus: {
    description:
      "Query tickets by status for pipeline visibility. Use to understand workload and progress.",
    inputSchema: z.object({
      status: z.enum([
        "backlog",
        "in_progress",
        "in_review",
        "resolved",
        "blocked",
      ]),
    }),
    execute: getTicketsByStatusStep,
  },

  getTicketsByAssignee: {
    description:
      "See what a specific agent is working on. Check workload before assigning new work.",
    inputSchema: z.object({
      assignee: z
        .string()
        .describe("Agent name: CTO, CMO, Developer, Designer, Marketing"),
    }),
    execute: getTicketsByAssigneeStep,
  },

  reviewArtifact: {
    description:
      "Review completed work on a ticket — fetches ticket details, all comments, and attached artifacts (PRs, designs, deployments). Use to approve or request changes.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID from createTicket"),
    }),
    execute: reviewArtifactStep,
  },

  createSubTicket: {
    description:
      "Break a ticket into sub-tasks. Max depth: 3 levels. Use for large work items that need decomposition.",
    inputSchema: z.object({
      parentTicketId: z.string(),
      title: z.string(),
      description: z
        .string()
        .describe("Detailed description with acceptance criteria"),
      priority: z.enum(["critical", "high", "medium", "low"]),
      tags: z.array(z.string()),
      assignee: z
        .nullable(z.string())
        .describe("CTO, CMO, or null for strategy"),
      taggedAgents: z
        .array(z.string())
        .describe("Agents to notify — always include CEO"),
    }),
    execute: createSubTicketStep,
  },

  loadSkill: {
    description:
      "Load a skill's full instructions by name. Use when a task matches an available skill.",
    inputSchema: z.object({
      name: z.string().describe("Skill name from the available skills list"),
    }),
    execute: loadSkillStep,
  },

  askQuestion: {
    description:
      "Present a structured question to the user with selectable options. The workflow pauses until the user answers. Use for discovery, clarification, or decisions that need user input.",
    inputSchema: z.object({
      question: z.string().describe("The question to ask the user"),
      options: z
        .array(z.string())
        .describe(
          "2-6 concrete answer choices. Always include a 'Something else' option last."
        ),
    }),
    execute: askQuestionExecute,
  },
};
