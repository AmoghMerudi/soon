import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { MANAGER_OF } from "./dispatch";

const BLOCK_THRESHOLD_MS = 5 * 60 * 1000;

export const _listEscalatable = internalQuery({
  args: { cutoff: v.number() },
  handler: async (ctx, { cutoff }) => {
    const blocked = await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", "blocked"))
      .collect();
    return blocked.filter(
      (t) =>
        t.blockedAt !== undefined &&
        t.blockedAt < cutoff &&
        !t.escalatedTo &&
        t.assignee
    );
  },
});

export const checkBlocked = internalAction({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - BLOCK_THRESHOLD_MS;
    const candidates = await ctx.runQuery(internal.escalation._listEscalatable, {
      cutoff,
    });

    for (const t of candidates) {
      const manager = t.assignee ? MANAGER_OF[t.assignee] : null;
      if (!manager) continue;

      await ctx.runMutation(internal.mutations.reassignTicketInternal, {
        ticketId: t._id,
        assignee: manager,
        escalatedTo: manager,
      });
      await ctx.runMutation(internal.mutations._logAgentActionInternal, {
        agent: manager,
        action: "auto_escalated",
        details: `Ticket auto-escalated from ${t.assignee} after ${BLOCK_THRESHOLD_MS / 60000}min blocked: ${t.blockedReason ?? "no reason"}`,
        ticketId: t._id,
      });
    }
  },
});
