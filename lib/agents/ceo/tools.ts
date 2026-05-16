import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getWritable } from "workflow";
import type { UIMessageChunk, ToolSet } from "ai";
import { z } from "zod";
import { getSkillContent } from "./skills";
import { questionHook } from "./hooks";
import { exaSearchDurableTool } from "../exa-tools";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// --- Step functions (each uses "use step" for durability and automatic retries) ---

async function createTicketStep(input: {
  projectId: string;
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
    projectId: input.projectId as Id<"projects">,
    title: input.title,
    description: input.description,
    status: "backlog",
    priority: input.priority,
    tags: input.tags,
    assignee: input.assignee,
    createdBy: "CEO",
    taggedAgents: input.taggedAgents,
    dependsOn: input.dependsOn?.map(id => id as Id<"tickets">),
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CEO",
    action: "create_ticket",
    details: `Created ticket: ${input.title}`,
    ticketId,
    projectId: input.projectId as Id<"projects">,
  });

  return { ticketId: ticketId.toString(), title: input.title };
}

async function assignTicketStep(input: {
  projectId: string;
  ticketId: string;
  assignee: string;
}) {
  "use step";

  await convex.mutation(api.mutations.assignTicket, {
    ticketId: input.ticketId as Id<"tickets">,
    assignee: input.assignee,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CEO",
    action: "assign_ticket",
    details: `Assigned ticket ${input.ticketId} to ${input.assignee ?? "unassigned"}`,
    ticketId: input.ticketId as Id<"tickets">,
    projectId: input.projectId as Id<"projects">,
  });

  return { success: true };
}

async function updateTicketStatusStep(input: {
  projectId: string;
  ticketId: string;
  status: "backlog" | "in_progress" | "in_review" | "resolved" | "blocked";
}) {
  "use step";

  await convex.mutation(api.mutations.updateTicketStatus, {
    ticketId: input.ticketId as Id<"tickets">,
    status: input.status,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CEO",
    action: "update_ticket_status",
    details: `Updated ticket ${input.ticketId} to ${input.status}`,
    ticketId: input.ticketId as Id<"tickets">,
    projectId: input.projectId as Id<"projects">,
  });

  return { success: true };
}

async function addCommentStep(input: {
  ticketId: string;
  content: string;
}) {
  "use step";

  const commentId = await convex.mutation(api.mutations.addComment, {
    ticketId: input.ticketId as Id<"tickets">,
    content: input.content,
    author: "CEO",
  });

  return { commentId: commentId.toString() };
}

async function getTicketsByStatusStep(input: {
  projectId: string;
  status: "backlog" | "in_progress" | "in_review" | "resolved" | "blocked";
}) {
  "use step";

  const tickets = await convex.query(api.queries.getTicketsByStatus, {
    projectId: input.projectId as Id<"projects">,
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

async function getTicketsByAssigneeStep(input: {
  projectId: string;
  assignee: string;
}) {
  "use step";

  const tickets = await convex.query(api.queries.getTicketsByAssignee, {
    projectId: input.projectId as Id<"projects">,
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
      ticketId: input.ticketId as Id<"tickets">,
    }),
    convex.query(api.queries.getTicketComments, {
      ticketId: input.ticketId as Id<"tickets">,
    }),
    convex.query(api.queries.getTicketArtifacts, {
      ticketId: input.ticketId as Id<"tickets">,
    }),
  ]);

  return { ticket, comments, artifacts };
}

async function createSubTicketStep(input: {
  projectId: string;
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
    projectId: input.projectId as Id<"projects">,
    title: input.title,
    description: input.description,
    status: "backlog",
    priority: input.priority,
    tags: input.tags,
    assignee: input.assignee,
    createdBy: "CEO",
    taggedAgents: input.taggedAgents,
    parentTicket: input.parentTicketId as Id<"tickets">,
    dependsOn: input.dependsOn?.map(id => id as Id<"tickets">),
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CEO",
    action: "create_sub_ticket",
    details: `Created sub-ticket: ${input.title} (parent: ${input.parentTicketId})`,
    ticketId,
    projectId: input.projectId as Id<"projects">,
  });

  return { ticketId: ticketId.toString(), title: input.title };
}

async function loadSkillStep(input: { name: string }) {
  "use step";

  const content = getSkillContent(input.name);
  if (!content) return { error: `Skill "${input.name}" not found` };
  return { name: input.name, instructions: content };
}

async function saveDeliverableStep(input: {
  projectId: string;
  ticketId?: string;
  title: string;
  body: string;
  category: "plan" | "analysis" | "report" | "strategy" | "brief" | "spec" | "other";
}) {
  "use step";

  const id = await convex.mutation(api.mutations.createDeliverable, {
    projectId: input.projectId as Id<"projects">,
    ticketId: (input.ticketId || undefined) as Id<"tickets"> | undefined,
    title: input.title,
    body: input.body,
    category: input.category,
    createdBy: "CEO",
  });

  return { deliverableId: id.toString(), title: input.title };
}

async function saveStripeApiKeyStep(input: {
  projectId: string;
  apiKey: string;
}) {
  "use step";

  const apiKey = input.apiKey.trim();
  if (!apiKey) return { error: "Empty API key" };
  if (!/^sk_(test|live)_/.test(apiKey)) {
    return {
      error:
        "Invalid Stripe key format — expected to start with sk_test_ or sk_live_",
    };
  }

  await convex.mutation(api.projects.setStripeApiKey, {
    projectId: input.projectId as Id<"projects">,
    apiKey,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CEO",
    action: "save_stripe_key",
    details: `Saved Stripe API key (${apiKey.startsWith("sk_live_") ? "live" : "test"} mode)`,
    projectId: input.projectId as Id<"projects">,
  });

  return {
    ok: true,
    mode: apiKey.startsWith("sk_live_") ? "live" : "test",
  };
}

async function storeGithubRepoStep(input: {
  projectId: string;
  repoUrl: string;
  repoName: string;
  owner: string;
}) {
  "use step";

  await convex.mutation(api.mutations.updateProject, {
    projectId: input.projectId as Id<"projects">,
    githubRepo: input.repoUrl,
    githubOwner: input.owner,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CEO",
    action: "github_repo_created",
    details: `GitHub repo created: ${input.owner}/${input.repoName} — ${input.repoUrl}`,
    projectId: input.projectId as Id<"projects">,
  });

  return { repoUrl: input.repoUrl, owner: input.owner, repoName: input.repoName };
}

async function storeVercelProjectStep(input: {
  projectId: string;
  vercelProjectId: string;
  vercelTeamId?: string;
}) {
  "use step";

  await convex.mutation(api.mutations.updateProject, {
    projectId: input.projectId as Id<"projects">,
    vercelProjectId: input.vercelProjectId,
    vercelTeamId: input.vercelTeamId,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CEO",
    action: "vercel_project_stored",
    details: `Vercel project stored: ${input.vercelProjectId}`,
    projectId: input.projectId as Id<"projects">,
  });

  return { vercelProjectId: input.vercelProjectId };
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

async function addDependencyStep(input: {
  ticketId: string;
  dependsOnTicketId: string;
}) {
  "use step";

  await convex.mutation(api.mutations.addDependency, {
    ticketId: input.ticketId as Id<"tickets">,
    dependsOnTicketId: input.dependsOnTicketId as Id<"tickets">,
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: "CEO",
    action: "add_dependency",
    details: `Added dependency: ${input.ticketId} depends on ${input.dependsOnTicketId}`,
  });

  return { ok: true };
}

// --- Tool factory: builds DurableAgent tool set bound to a project ---

export function buildCeoTools(projectId: Id<"projects">): ToolSet {
  const pid = projectId as unknown as string;
  return {
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
          .string()
          .describe(
            "REQUIRED. CTO for engineering work, CMO for design/marketing. Every ticket must have an assignee."
          ),
        taggedAgents: z
          .array(z.string())
          .describe("Agents to notify — always include CEO"),
        dependsOn: z
          .array(z.string())
          .optional()
          .describe("Ticket IDs that must be resolved before this ticket can be dispatched. Use for ordering."),
      }),
      execute: (input: Omit<Parameters<typeof createTicketStep>[0], "projectId">) =>
        createTicketStep({ ...input, projectId: pid }),
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
      execute: (input: Omit<Parameters<typeof assignTicketStep>[0], "projectId">) =>
        assignTicketStep({ ...input, projectId: pid }),
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
      execute: (
        input: Omit<Parameters<typeof updateTicketStatusStep>[0], "projectId">
      ) => updateTicketStatusStep({ ...input, projectId: pid }),
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
      execute: (
        input: Omit<Parameters<typeof getTicketsByStatusStep>[0], "projectId">
      ) => getTicketsByStatusStep({ ...input, projectId: pid }),
    },

    getTicketsByAssignee: {
      description:
        "See what a specific agent is working on. Check workload before assigning new work.",
      inputSchema: z.object({
        assignee: z
          .string()
          .describe("Agent name: CTO, CMO, Developer, Designer, Marketing"),
      }),
      execute: (
        input: Omit<Parameters<typeof getTicketsByAssigneeStep>[0], "projectId">
      ) => getTicketsByAssigneeStep({ ...input, projectId: pid }),
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
          .string()
          .describe("REQUIRED. CTO for engineering, CMO for design/marketing. Every ticket must have an assignee."),
        taggedAgents: z
          .array(z.string())
          .describe("Agents to notify — always include CEO"),
      }),
      execute: (
        input: Omit<Parameters<typeof createSubTicketStep>[0], "projectId">
      ) => createSubTicketStep({ ...input, projectId: pid }),
    },

    addDependency: {
      description:
        "Make one ticket depend on another. The dependent ticket will NOT be dispatched until the dependency ticket is resolved. Use this to enforce ordering — e.g., 'scaffold repo' must complete before 'implement features'. IMPORTANT: always set dependencies for tickets that share a repo or have setup requirements.",
      inputSchema: z.object({
        ticketId: z.string().describe("The ticket that should wait"),
        dependsOnTicketId: z.string().describe("The ticket that must be resolved first"),
      }),
      execute: addDependencyStep,
    },

    loadSkill: {
      description:
        "Load a skill's full instructions by name. Use when a task matches an available skill.",
      inputSchema: z.object({
        name: z.string().describe("Skill name from the available skills list"),
      }),
      execute: loadSkillStep,
    },

    saveStripeApiKey: {
      description:
        "Store the user's Stripe API key for THIS project so the Revenue dashboard and other agents can pull live data. Call this whenever the user provides a Stripe secret key (sk_test_... or sk_live_...). The key is scoped to the current project only. Do not log or echo the key back to the user — confirm only that it was saved.",
      inputSchema: z.object({
        apiKey: z
          .string()
          .describe(
            "The Stripe secret API key the user provided (sk_test_... or sk_live_...)",
          ),
      }),
      execute: (input: { apiKey: string }) =>
        saveStripeApiKeyStep({ ...input, projectId: pid }),
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

    saveDeliverable: {
      description:
        "Save a deliverable to the repository — use this for any significant output: business plans, strategy documents, market analyses, research reports, project briefs, or specs. Always save plans and analyses here so they persist beyond chat and can be referenced later.",
      inputSchema: z.object({
        title: z.string().describe("Clear title for the deliverable"),
        body: z.string().describe("Full content in markdown"),
        category: z
          .enum(["plan", "analysis", "report", "strategy", "brief", "spec", "other"])
          .describe("Type of deliverable"),
        ticketId: z
          .string()
          .optional()
          .describe("Link to a ticket if this deliverable was produced for one"),
      }),
      execute: (input: Omit<Parameters<typeof saveDeliverableStep>[0], "projectId">) =>
        saveDeliverableStep({ ...input, projectId: pid }),
    },

    storeGithubRepo: {
      description:
        "After creating a GitHub repo via GITHUB_CREATE_REPO, call this to persist the repo URL and owner to the project record so the Developer agent can clone it. Must be called immediately after repo creation.",
      inputSchema: z.object({
        repoUrl: z.string().describe("Full HTTPS clone URL, e.g. https://github.com/owner/repo"),
        repoName: z.string().describe("Repository name (slug only, no owner)"),
        owner: z.string().describe("GitHub username or org that owns the repo"),
      }),
      execute: (input: Omit<Parameters<typeof storeGithubRepoStep>[0], "projectId">) =>
        storeGithubRepoStep({ ...input, projectId: pid }),
    },

    storeVercelProject: {
      description:
        "Persist the Vercel project ID to the project record so the Developer agent can deploy to the same Vercel project on future tickets.",
      inputSchema: z.object({
        vercelProjectId: z.string().describe("Vercel project ID"),
        vercelTeamId: z.string().optional().describe("Vercel team/org ID if applicable"),
      }),
      execute: (input: Omit<Parameters<typeof storeVercelProjectStep>[0], "projectId">) =>
        storeVercelProjectStep({ ...input, projectId: pid }),
    },

    exaSearch: exaSearchDurableTool,
  } as ToolSet;
}

/** @deprecated use buildCeoTools(projectId). Kept temporarily for legacy imports. */
export const ceoTools = undefined as unknown as ToolSet;
