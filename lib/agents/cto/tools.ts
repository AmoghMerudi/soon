import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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

async function addDependencyStep(input: {
  ticketId: string;
  dependsOnTicketId: string;
}) {
  "use step";

  await convex.mutation(api.mutations.addDependency, {
    ticketId: input.ticketId as any,
    dependsOnTicketId: input.dependsOnTicketId as any,
  });

  return { ok: true };
}

async function createSubTicketStep(input: {
  parentTicketId: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  tags: string[];
  assignee: string;
  taggedAgents: string[];
  dependsOn?: string[];
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
    dependsOn: input.dependsOn?.map(id => id as any),
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
  assignee: string;
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
    createdBy: "CTO",
  });

  return { deliverableId: id.toString(), title: input.title };
}

async function loadSkillStep(input: { name: string }) {
  "use step";

  const content = getSkillContent(input.name);
  if (!content) return { error: `Skill "${input.name}" not found` };
  return { name: input.name, instructions: content };
}

async function getProjectContextStep(input: { ticketId: string }) {
  "use step";

  const ticket = await convex.query(api.queries.getTicket, {
    ticketId: input.ticketId as Id<"tickets">,
  });
  if (!ticket?.projectId) {
    return { error: "Ticket has no associated project" };
  }
  const project = await convex.query(api.queries.getProject, {
    projectId: ticket.projectId,
  });
  return {
    projectId: ticket.projectId,
    projectName: project?.name ?? null,
    githubRepo: project?.githubRepo ?? null,
    githubOwner: project?.githubOwner ?? null,
    vercelProjectId: project?.vercelProjectId ?? null,
  };
}

async function createGithubRepoStep(input: {
  ticketId: string;
  repoName: string;
  isPrivate?: boolean;
  description?: string;
}) {
  "use step";

  const pat = process.env.AGENT_GITHUB_PAT;
  if (!pat) {
    return { error: "AGENT_GITHUB_PAT not configured — cannot create repo" };
  }

  const res = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.repoName,
      private: input.isPrivate ?? true,
      description: input.description ?? "",
      auto_init: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `GitHub API error ${res.status}: ${body}` };
  }

  const repo = (await res.json()) as { full_name: string; html_url: string; owner: { login: string } };

  const ticket = await convex.query(api.queries.getTicket, {
    ticketId: input.ticketId as Id<"tickets">,
  });
  if (ticket?.projectId) {
    await convex.mutation(api.mutations.updateProject, {
      projectId: ticket.projectId,
      githubRepo: repo.full_name,
      githubOwner: repo.owner.login,
    });
  }

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CTO",
    action: "create_github_repo",
    details: `Created GitHub repo: ${repo.full_name}`,
    ticketId: input.ticketId as Id<"tickets">,
  });

  return {
    repoFullName: repo.full_name,
    repoUrl: repo.html_url,
    owner: repo.owner.login,
  };
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
        .string()
        .describe("REQUIRED. Use 'Developer' for implementation tasks. Every ticket must have an assignee."),
      taggedAgents: z
        .array(z.string())
        .describe("Agents to notify — always include CTO"),
      dependsOn: z
        .array(z.string())
        .optional()
        .describe("Ticket IDs that must resolve before this ticket dispatches. Use for ordering."),
    }),
    execute: createSubTicketStep,
  },

  addDependency: {
    description:
      "Make one ticket depend on another. The dependent ticket will NOT be dispatched until the dependency is resolved. Use this to enforce ordering when creating multiple Developer sub-tickets — e.g., 'set up app foundation' must finish before 'implement features'. CRITICAL: when you create multiple Developer tickets that share a repo, ALWAYS make later tickets depend on the first one.",
    inputSchema: z.object({
      ticketId: z.string().describe("The ticket that should wait"),
      dependsOnTicketId: z.string().describe("The ticket that must be resolved first"),
    }),
    execute: addDependencyStep,
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

  saveDeliverable: {
    description:
      "Save a deliverable to the repository — architecture docs, technical specs, risk analyses, review reports. Persists beyond ticket comments for long-term reference.",
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

  getProjectContext: {
    description:
      "Check whether the project already has a GitHub repo and Vercel project configured. Call this BEFORE creating developer sub-tickets to decide if you need to create a repo first.",
    inputSchema: z.object({
      ticketId: z.string().describe("Any ticket ID belonging to the project"),
    }),
    execute: getProjectContextStep,
  },

  createGithubRepo: {
    description:
      "Create a new GitHub repository via the bot account and store it on the project record. MUST be called before creating Developer sub-tickets if the project has no repo yet. Developer agents cannot create repos — they will mark blocked if none exists.",
    inputSchema: z.object({
      ticketId: z.string().describe("Ticket ID (used to find the project)"),
      repoName: z
        .string()
        .describe("Repository slug (lowercase, hyphens, e.g. 'my-saas-app')"),
      isPrivate: z
        .boolean()
        .optional()
        .describe("Default true — create a private repo"),
      description: z
        .string()
        .optional()
        .describe("Short repo description"),
    }),
    execute: createGithubRepoStep,
  },

  exaSearch: exaSearchDurableTool,
};
