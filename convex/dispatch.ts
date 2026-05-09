import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

export const MANAGER_OF: Record<string, string | null> = {
  ceo: null,
  cto: "ceo",
  cmo: "ceo",
  developer: "cto",
  designer: "cmo",
  marketing: "cmo",
};

const WIRED_AGENTS = new Set(["developer"]);

function appBaseUrl(): string | null {
  return (
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  );
}

export const dispatchAgent = internalAction({
  args: {
    ticketId: v.id("tickets"),
    agentRole: v.string(),
  },
  handler: async (ctx, { ticketId, agentRole }) => {
    if (!WIRED_AGENTS.has(agentRole)) {
      await ctx.runMutation(internal.mutations._logAgentActionInternal, {
        agent: agentRole,
        action: "dispatched",
        details: `Stub dispatch (no route wired) for ${agentRole}, ticket ${ticketId}`,
        ticketId,
      });
      return;
    }

    const base = appBaseUrl();
    if (!base) {
      await ctx.runMutation(internal.mutations._logAgentActionInternal, {
        agent: agentRole,
        action: "dispatch_error",
        details: "APP_BASE_URL not set; cannot reach agent route",
        ticketId,
      });
      return;
    }

    const url = `${base.replace(/\/$/, "")}/api/agents/${agentRole}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      await ctx.runMutation(internal.mutations._logAgentActionInternal, {
        agent: agentRole,
        action: "dispatch_error",
        details: `${response.status} ${response.statusText} ${body.slice(0, 200)}`,
        ticketId,
      });
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { runId?: string };
    await ctx.runMutation(internal.mutations._logAgentActionInternal, {
      agent: agentRole,
      action: "dispatched",
      details: `Started workflow${data.runId ? ` runId=${data.runId}` : ""} for ticket ${ticketId}`,
      ticketId,
    });
  },
});
