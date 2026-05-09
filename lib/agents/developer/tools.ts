import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";
import { getSkillContent } from "./skills";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const AGENT_NAME = "Developer";

// --- Step functions (each uses "use step" for durability and automatic retries) ---

async function updateTicketStatusStep(input: {
  ticketId: string;
  status: "backlog" | "in_progress" | "in_review" | "resolved" | "blocked";
  reason?: string;
}) {
  "use step";

  await convex.mutation(api.mutations.updateTicketStatus, {
    ticketId: input.ticketId as never,
    status: input.status,
    ...(input.reason ? { reason: input.reason } : {}),
  });

  await convex.mutation(api.mutations.logAgentAction, {
    agent: AGENT_NAME,
    action: "update_ticket",
    details: `Status -> ${input.status}${input.reason ? `: ${input.reason}` : ""}`,
    ticketId: input.ticketId as never,
  });

  return { ok: true };
}

async function addCommentStep(input: { ticketId: string; content: string }) {
  "use step";

  const commentId = await convex.mutation(api.mutations.addComment, {
    ticketId: input.ticketId as never,
    author: AGENT_NAME,
    content: input.content,
  });

  return { commentId: commentId.toString() };
}

async function addArtifactStep(input: {
  ticketId: string;
  type: "pr" | "design" | "deployment" | "document" | "image" | "other";
  url: string;
  description: string;
}) {
  "use step";

  const artifactId = await convex.mutation(api.mutations.addArtifact, {
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

  return { artifactId: artifactId.toString() };
}

async function getTicketDetailsStep(input: { ticketId: string }) {
  "use step";

  return await convex.query(api.queries.getTicketDetails, {
    ticketId: input.ticketId as never,
  });
}

async function markBlockedStep(input: {
  ticketId: string;
  reason: string;
}) {
  "use step";

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
}

async function loadSkillStep(input: { name: string }) {
  "use step";

  const content = getSkillContent(input.name);
  if (!content) return { error: `Skill "${input.name}" not found` };
  return { name: input.name, instructions: content };
}

// --- Tool definitions for DurableAgent ---

export const developerTools = {
  updateTicketStatus: {
    description:
      "Move a ticket through the workflow. Use 'in_progress' when starting, 'in_review' when handing off for review, 'resolved' when complete. Set 'reason' if status is 'blocked'.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
      status: z.enum([
        "backlog",
        "in_progress",
        "in_review",
        "resolved",
        "blocked",
      ]),
      reason: z
        .string()
        .optional()
        .describe("Required when status is 'blocked'"),
    }),
    execute: updateTicketStatusStep,
  },

  addComment: {
    description:
      "Add a progress note, decision, or hand-off comment to a ticket.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
      content: z
        .string()
        .describe("Progress note, decision rationale, or hand-off context"),
    }),
    execute: addCommentStep,
  },

  addArtifact: {
    description:
      "Attach a deliverable to a ticket. Use type 'pr' for pull requests, 'deployment' for preview URLs, 'document' for docs.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
      type: z.enum([
        "pr",
        "design",
        "deployment",
        "document",
        "image",
        "other",
      ]),
      url: z.string().describe("URL of the artifact"),
      description: z.string().describe("What this artifact is"),
    }),
    execute: addArtifactStep,
  },

  getTicketDetails: {
    description:
      "Read full ticket context including parent ticket, sub-tickets, comments, artifacts, and agent logs.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
    }),
    execute: getTicketDetailsStep,
  },

  markBlocked: {
    description:
      "Mark a ticket as blocked with a clear reason. Auto-escalates to the CTO after 5 minutes. Use only when truly stuck.",
    inputSchema: z.object({
      ticketId: z.string().describe("Exact ticket ID"),
      reason: z
        .string()
        .describe(
          "What is blocking progress — include what you tried and what failed"
        ),
    }),
    execute: markBlockedStep,
  },

  loadSkill: {
    description:
      "Load a skill's full instructions by name. Use when a task matches an available skill (feature-implementation, bug-fix, code-review-response).",
    inputSchema: z.object({
      name: z
        .string()
        .describe("Skill name from the available skills list"),
    }),
    execute: loadSkillStep,
  },
};
