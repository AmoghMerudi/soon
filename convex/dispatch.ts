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

const WIRED_AGENTS = new Set(["cto", "cmo", "developer", "designer", "marketing"]);
const MAX_DISPATCH_ATTEMPTS = 4;

function retryDelayMs(attempt: number) {
  return Math.min(1_000 * 2 ** attempt, 30_000);
}

function appBaseUrl(): string | null {
  return (
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  );
}

function isHostedConvexDeployment(): boolean {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return false;

  try {
    const hostname = new URL(convexUrl).hostname.toLowerCase();
    return hostname.endsWith(".convex.cloud");
  } catch {
    return false;
  }
}

function isLoopbackBaseUrl(base: string): boolean {
  try {
    const hostname = new URL(base).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname.startsWith("127.")
    );
  } catch {
    return false;
  }
}

export const dispatchAgent = internalAction({
  args: {
    ticketId: v.id("tickets"),
    agentRole: v.string(),
    attempt: v.optional(v.number()),
  },
  handler: async (ctx, { ticketId, agentRole, attempt = 0 }) => {
    const normalizedRole = agentRole.toLowerCase();

    async function failDispatch(details: string) {
      if (attempt + 1 < MAX_DISPATCH_ATTEMPTS) {
        const nextAttempt = attempt + 1;
        await ctx.scheduler.runAfter(
          retryDelayMs(attempt),
          internal.dispatch.dispatchAgent,
          {
            ticketId,
            agentRole: normalizedRole,
            attempt: nextAttempt,
          }
        );
        await ctx.runMutation(internal.mutations._logAgentActionInternal, {
          agent: normalizedRole,
          action: "dispatch_retry",
          details: `Dispatch attempt ${nextAttempt} failed: ${details.slice(0, 200)}`,
          ticketId,
        });
        return;
      }

      await ctx.runMutation(internal.mutations._storeWorkflowRunInternal, {
        ticketId,
        dispatchStatus: "failed",
        errorDetail: details,
      });
      await ctx.runMutation(internal.mutations._logAgentActionInternal, {
        agent: normalizedRole,
        action: "dispatch_error",
        details: details.slice(0, 500),
        ticketId,
      });
    }

    if (!WIRED_AGENTS.has(normalizedRole)) {
      await ctx.runMutation(internal.mutations._storeWorkflowRunInternal, {
        ticketId,
        dispatchStatus: "failed",
        errorDetail: `No dispatch route wired for ${normalizedRole}`,
      });
      await ctx.runMutation(internal.mutations._logAgentActionInternal, {
        agent: normalizedRole,
        action: "dispatch_error",
        details: `No dispatch route wired for ${normalizedRole}`,
        ticketId,
      });
      return;
    }

    const base = appBaseUrl();
    if (!base) {
      await failDispatch("APP_BASE_URL not set; cannot reach agent route");
      return;
    }

    if (isHostedConvexDeployment() && isLoopbackBaseUrl(base)) {
      await failDispatch(
        `APP_BASE_URL=${base} points to localhost, but hosted Convex actions cannot dispatch to loopback addresses. Use a public URL for the Next app (for example a Vercel deployment or tunnel), or run Convex locally.`
      );
      return;
    }

    try {
      const url = `${base.replace(/\/$/, "")}/api/agents/${normalizedRole}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        await failDispatch(
          `${response.status} ${response.statusText} ${body.slice(0, 200)}`.trim()
        );
        return;
      }

      const data = (await response.json().catch(() => ({}))) as { runId?: string };
      if (!data.runId) {
        await failDispatch("Agent route returned no runId");
        return;
      }

      await ctx.runMutation(internal.mutations._storeWorkflowRunInternal, {
        ticketId,
        runId: data.runId,
      });
      await ctx.runMutation(internal.mutations._logAgentActionInternal, {
        agent: normalizedRole,
        action: "dispatched",
        details: `Started workflow runId=${data.runId} for ticket ${ticketId}`,
        ticketId,
      });
    } catch (error) {
      await failDispatch(error instanceof Error ? error.message : String(error));
    }
  },
});
