import { mutation } from "./_generated/server";

const SEED_AGENTS = [
  {
    agentId: "ceo",
    displayName: "CEO",
    role: "strategic" as const,
    status: "idle" as const,
    maxActiveTickets: 10,
    maxStepsPerExecution: 20,
    composioEntityId: "ceo",
    enabledTools: ["slack", "google_docs", "google_sheets", "linear"],
  },
  {
    agentId: "cto",
    displayName: "CTO",
    role: "strategic" as const,
    status: "idle" as const,
    maxActiveTickets: 10,
    maxStepsPerExecution: 15,
    composioEntityId: "cto",
    enabledTools: ["github", "sentry", "slack", "linear"],
  },
  {
    agentId: "cmo",
    displayName: "CMO",
    role: "strategic" as const,
    status: "idle" as const,
    maxActiveTickets: 10,
    maxStepsPerExecution: 15,
    composioEntityId: "cmo",
    enabledTools: ["google_analytics", "slack", "google_ads"],
  },
  {
    agentId: "developer",
    displayName: "Developer",
    role: "execution" as const,
    status: "idle" as const,
    maxActiveTickets: 5,
    maxStepsPerExecution: 30,
    composioEntityId: "developer",
    enabledTools: ["github", "vercel", "convex"],
  },
  {
    agentId: "designer",
    displayName: "Designer",
    role: "execution" as const,
    status: "idle" as const,
    maxActiveTickets: 5,
    maxStepsPerExecution: 20,
    composioEntityId: "designer",
    enabledTools: ["figma", "cloudinary"],
  },
  {
    agentId: "marketing",
    displayName: "Marketing",
    role: "execution" as const,
    status: "idle" as const,
    maxActiveTickets: 5,
    maxStepsPerExecution: 20,
    composioEntityId: "marketing",
    enabledTools: ["twitter", "linkedin", "mailchimp", "google_analytics"],
  },
];

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const results: { agentId: string; action: "created" | "updated" }[] = [];

    for (const agent of SEED_AGENTS) {
      const existing = await ctx.db
        .query("agentConfig")
        .withIndex("by_agentId", (q) => q.eq("agentId", agent.agentId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          displayName: agent.displayName,
          role: agent.role,
          maxActiveTickets: agent.maxActiveTickets,
          maxStepsPerExecution: agent.maxStepsPerExecution,
          composioEntityId: agent.composioEntityId,
          enabledTools: agent.enabledTools,
        });
        results.push({ agentId: agent.agentId, action: "updated" });
      } else {
        await ctx.db.insert("agentConfig", {
          ...agent,
          currentTicketIds: [],
        });
        results.push({ agentId: agent.agentId, action: "created" });
      }
    }

    return { count: results.length, results };
  },
});

export const clearAllQueues = mutation({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("agentConfig").collect();
    for (const config of configs) {
      await ctx.db.patch(config._id, { currentTicketIds: [] });
    }
    return { cleared: configs.length };
  },
});
