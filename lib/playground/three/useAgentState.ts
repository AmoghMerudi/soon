"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { RoleKey } from "@/lib/dashboard/constants";

export type PlaygroundRole = Exclude<RoleKey, "user">;

export type AgentLiveState = {
  role: PlaygroundRole;
  /** Display state used by the playground visuals. */
  state: "working" | "idle" | "blocked";
  /** Title of the ticket they're currently focused on (for the thought bubble). */
  currentTicketTitle: string | null;
  currentTicketId: string | null;
  /** Live tool-call info (running). */
  activeStep: {
    toolName: string;
    startedAt: number;
  } | null;
  /** Most recent completed/failed step (for the dim "last:" badge). */
  lastStep: {
    toolName: string;
    durationMs: number | null;
    status: "completed" | "failed";
  } | null;
  /** Has tickets dispatched but no active step yet — "thinking". */
  isThinking: boolean;
  blockedCount: number;
};

const ROLE_KEYS: PlaygroundRole[] = [
  "ceo",
  "cto",
  "cmo",
  "developer",
  "designer",
  "marketing",
];

function mapStatus(
  configStatus: "active" | "idle" | "busy" | "paused" | undefined,
  isThinking: boolean,
  blockedCount: number,
): AgentLiveState["state"] {
  if (configStatus === "paused" || blockedCount > 0) return "blocked";
  if (configStatus === "active" || configStatus === "busy" || isThinking) return "working";
  return "idle";
}

/**
 * Merge `getAgentConfigs` (status) with `getAgentsDashboardOverview`
 * (currentTicket, activeStep, isThinking, stats) into a single record keyed by role.
 *
 * Returns `null` while either query is loading.
 */
export function useAgentLiveStates(): Record<PlaygroundRole, AgentLiveState> | null {
  const configs = useQuery(api.queries.getAgentConfigs);
  const overview = useQuery(api.agentSteps.getAgentsDashboardOverview);

  return useMemo(() => {
    if (!configs || !overview) return null;

    const configByAgentId = new Map(configs.map((c) => [c.agentId, c]));
    const overviewByAgentId = new Map(overview.map((o) => [o.agentId, o]));

    const out = {} as Record<PlaygroundRole, AgentLiveState>;
    for (const role of ROLE_KEYS) {
      const cfg = configByAgentId.get(role);
      const ov = overviewByAgentId.get(role);

      const blockedCount = ov?.stats.blocked ?? 0;
      const state = mapStatus(cfg?.status, ov?.isThinking ?? false, blockedCount);

      const last = ov?.lastStep ?? null;
      const lastStatus = last?.status;
      const completedLast: AgentLiveState["lastStep"] =
        last && (lastStatus === "completed" || lastStatus === "failed")
          ? {
              toolName: last.toolName,
              durationMs: last.durationMs ?? null,
              status: lastStatus,
            }
          : null;

      out[role] = {
        role,
        state,
        currentTicketTitle: ov?.currentTicket?.title ?? null,
        currentTicketId: ov?.currentTicket?.id ?? null,
        activeStep: ov?.activeStep
          ? {
              toolName: ov.activeStep.toolName,
              startedAt: ov.activeStep.startedAt,
            }
          : null,
        lastStep: completedLast,
        isThinking: ov?.isThinking ?? false,
        blockedCount,
      };
    }
    return out;
  }, [configs, overview]);
}
