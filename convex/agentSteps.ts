import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const agentStepStatus = v.union(
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed")
);

export const logAgentStep = mutation({
  args: {
    ticketId: v.id("tickets"),
    workflowRunId: v.string(),
    agentId: v.string(),
    stepIndex: v.number(),
    toolName: v.string(),
    inputSummary: v.string(),
    outputSummary: v.optional(v.string()),
    status: agentStepStatus,
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentSteps", args);
  },
});

export const updateAgentStep = mutation({
  args: {
    stepId: v.id("agentSteps"),
    outputSummary: v.optional(v.string()),
    status: agentStepStatus,
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const step = await ctx.db.get(args.stepId);
    if (!step) {
      throw new ConvexError("agent step not found");
    }

    await ctx.db.patch(args.stepId, {
      outputSummary: args.outputSummary,
      status: args.status,
      completedAt: args.completedAt,
      durationMs: args.durationMs,
      error: args.error,
    });
  },
});

export const getAgentStepsByTicket = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("agentSteps")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    return steps.sort((a, b) => a.startedAt - b.startedAt);
  },
});

export const getAgentStepsByRun = query({
  args: {
    workflowRunId: v.string(),
  },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("agentSteps")
      .withIndex("by_run", (q) => q.eq("workflowRunId", args.workflowRunId))
      .collect();

    return steps.sort((a, b) => a.startedAt - b.startedAt);
  },
});

export const getRecentStepsByAgent = query({
  args: {
    agentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentSteps")
      .withIndex("by_agent_recent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(Math.max(1, Math.min(args.limit ?? 10, 50)));
  },
});

export const getActiveAgents = query({
  args: {},
  handler: async (ctx) => {
    const runningSteps = (await ctx.db.query("agentSteps").collect())
      .filter((step) => step.status === "running")
      .sort((a, b) => b.startedAt - a.startedAt);

    const latestByAgent = new Map<string, (typeof runningSteps)[number]>();

    for (const step of runningSteps) {
      if (!latestByAgent.has(step.agentId)) {
        latestByAgent.set(step.agentId, step);
      }
    }

    return Array.from(latestByAgent.values()).map((step) => ({
      agentId: step.agentId,
      ticketId: step.ticketId,
      workflowRunId: step.workflowRunId,
      toolName: step.toolName,
      startedAt: step.startedAt,
      stepId: step._id,
      stepIndex: step.stepIndex,
    }));
  },
});

export const getRecentAgentSteps = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 20, 100));
    const steps = await ctx.db.query("agentSteps").collect();

    return steps.sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
  },
});

export const getAgentsDashboardOverview = query({
  args: {},
  handler: async (ctx) => {
    const [configs, tickets, steps] = await Promise.all([
      ctx.db.query("agentConfig").collect(),
      ctx.db.query("tickets").collect(),
      ctx.db.query("agentSteps").collect(),
    ]);

    const runningSteps = steps
      .filter((step) => step.status === "running")
      .sort((a, b) => b.startedAt - a.startedAt);
    const recentSteps = [...steps].sort((a, b) => b.startedAt - a.startedAt);
    const ticketsById = new Map(tickets.map((ticket) => [ticket._id, ticket]));

    return configs
      .sort((a, b) => a.agentId.localeCompare(b.agentId))
      .map((config) => {
        const agentTickets = tickets.filter((ticket) => ticket.assignee === config.agentId);
        const activeStep = runningSteps.find((step) => step.agentId === config.agentId) ?? null;
        const lastStep = recentSteps.find((step) => step.agentId === config.agentId) ?? null;
        const currentTicket =
          (activeStep ? ticketsById.get(activeStep.ticketId) : null) ??
          config.currentTicketIds
            .map((ticketId) => ticketsById.get(ticketId))
            .find((ticket) => ticket !== undefined) ??
          null;

        return {
          agentId: config.agentId,
          displayName: config.displayName,
          enabledTools: config.enabledTools,
          currentTicket: currentTicket
            ? {
                id: currentTicket._id,
                title: currentTicket.title,
                dispatchStatus: currentTicket.dispatchStatus,
              }
            : null,
          activeStep: activeStep
            ? {
                stepId: activeStep._id,
                ticketId: activeStep.ticketId,
                toolName: activeStep.toolName,
                startedAt: activeStep.startedAt,
                stepIndex: activeStep.stepIndex,
              }
            : null,
          lastStep: lastStep
            ? {
                stepId: lastStep._id,
                ticketId: lastStep.ticketId,
                toolName: lastStep.toolName,
                startedAt: lastStep.startedAt,
                completedAt: lastStep.completedAt,
                durationMs: lastStep.durationMs,
                status: lastStep.status,
              }
            : null,
          stats: {
            active: agentTickets.filter((ticket) =>
              ["backlog", "in_progress", "in_review"].includes(ticket.status)
            ).length,
            resolved: agentTickets.filter((ticket) => ticket.status === "resolved").length,
            blocked: agentTickets.filter((ticket) => ticket.status === "blocked").length,
          },
          isThinking:
            activeStep === null &&
            agentTickets.some((ticket) => ticket.dispatchStatus === "running"),
        };
      });
  },
});
