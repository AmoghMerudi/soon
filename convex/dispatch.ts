import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const MANAGER_OF: Record<string, string | null> = {
  ceo: null,
  cto: "ceo",
  cmo: "ceo",
  developer: "cto",
  designer: "cmo",
  marketing: "cmo",
};

export const dispatchAgent = internalAction({
  args: {
    ticketId: v.id("tickets"),
    agentRole: v.string(),
  },
  handler: async (ctx, { ticketId, agentRole }) => {
    await ctx.runMutation(internal.mutations._logAgentActionInternal, {
      agent: agentRole,
      action: "dispatched",
      details: `Ticket ${ticketId} dispatched to ${agentRole}`,
      ticketId,
    });
  },
});
