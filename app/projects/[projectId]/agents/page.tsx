"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ROLES, MANAGER } from "@/lib/dashboard/constants";
import type { RoleKey } from "@/lib/dashboard/constants";
import { Avatar, StateBadge, Eyebrow } from "@/lib/dashboard/primitives";

type AgentOverview = {
  agentId: string;
  displayName: string;
  enabledTools: string[];
  currentTicket: {
    id: string;
    title: string;
    dispatchStatus?: string;
  } | null;
  activeStep: {
    stepId: string;
    ticketId: string;
    toolName: string;
    startedAt: number;
    stepIndex: number;
  } | null;
  lastStep: {
    stepId: string;
    ticketId: string;
    toolName: string;
    startedAt: number;
    completedAt?: number;
    durationMs?: number;
    status: "running" | "completed" | "failed";
  } | null;
  stats: {
    active: number;
    resolved: number;
    blocked: number;
  };
  isThinking: boolean;
};

type RecentStep = {
  _id: string;
  ticketId: string;
  agentId: string;
  toolName: string;
  status: "running" | "completed" | "failed";
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
};

const AGENT_ORDER: RoleKey[] = [
  "ceo",
  "cto",
  "cmo",
  "developer",
  "designer",
  "marketing",
];

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const secs = Math.floor(diff / 1_000);
  if (secs < 5) return "now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined) return null;
  if (durationMs < 1_000) return `${durationMs}ms`;
  const seconds = durationMs / 1_000;
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  return `${Math.round(seconds)}s`;
}

function shortTicketId(id: string) {
  return id.slice(-8).toUpperCase();
}

function toRoleKey(role: string): RoleKey {
  return (role.toLowerCase() as RoleKey) in ROLES
    ? (role.toLowerCase() as RoleKey)
    : "ceo";
}

function getAgentState(agent: AgentOverview) {
  if (agent.activeStep || agent.isThinking) return "working" as const;
  if (agent.stats.blocked > 0) return "blocked" as const;
  return "idle" as const;
}

function getStatusLine(agent: AgentOverview) {
  if (agent.activeStep) return `Calling ${agent.activeStep.toolName}`;
  if (agent.isThinking && agent.currentTicket) {
    return `Thinking on ${shortTicketId(agent.currentTicket.id)}`;
  }
  if (agent.currentTicket) {
    return `Assigned ${shortTicketId(agent.currentTicket.id)}`;
  }
  return "Idle";
}

function getLastActiveLine(agent: AgentOverview) {
  if (!agent.lastStep) return "No steps yet";
  return `${timeAgo(agent.lastStep.completedAt ?? agent.lastStep.startedAt)}`;
}

function AgentNode({
  agent,
  isLead,
  onClick,
}: {
  agent: AgentOverview;
  isLead?: boolean;
  onClick: () => void;
}) {
  const roleKey = toRoleKey(agent.agentId);
  const role = ROLES[roleKey];

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex flex-col gap-2.5 cursor-pointer"
      style={{
        background: "#1A1815",
        border: "1px solid #26241F",
        borderTop: `3px solid ${role.color}`,
        borderRadius: 8,
        padding: "14px 16px 12px",
        color: "inherit",
        fontFamily: "inherit",
        transition: "border-color 160ms, background 160ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#221F1B";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#1A1815";
      }}
    >
      <div className="flex items-center gap-2.5">
        <Avatar role={roleKey} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold" style={{ fontSize: 15, color: "#FAFAF7" }}>
              {role.label}
            </span>
            {isLead && (
              <span
                className="font-mono uppercase"
                style={{ fontSize: 10, letterSpacing: "0.16em", color: "#8E8B82" }}
              >
                Lead
              </span>
            )}
          </div>
          <div
            className="font-mono truncate"
            style={{ fontSize: 11, color: "#8E8B82", letterSpacing: "0.04em", marginTop: 2 }}
          >
            {agent.enabledTools.length > 0 ? agent.enabledTools.join(" · ") : "no tools loaded"}
          </div>
        </div>
        <StateBadge state={getAgentState(agent)} />
      </div>

      <div
        className="font-mono uppercase"
        style={{ fontSize: 10, letterSpacing: "0.14em", color: "#8E8B82" }}
      >
        {getStatusLine(agent)}
      </div>

      <div style={{ minHeight: 36, fontSize: 13, lineHeight: 1.4 }}>
        {agent.currentTicket ? (
          <>
            <span className="font-mono" style={{ color: "#8E8B82" }}>
              {shortTicketId(agent.currentTicket.id)}{" "}
            </span>
            <span style={{ color: "#BFBCB1" }}>{agent.currentTicket.title}</span>
          </>
        ) : (
          <span className="font-mono italic" style={{ color: "#5E5C56" }}>
            awaiting assignment
          </span>
        )}
      </div>

      <div
        className="flex gap-3.5 font-mono uppercase"
        style={{
          paddingTop: 8,
          borderTop: "1px solid #26241F",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "#5E5C56",
        }}
      >
        <span>
          <b style={{ color: "#FAFAF7", fontWeight: 600 }}>{agent.stats.active}</b> active
        </span>
        <span>
          <b style={{ color: "#FAFAF7", fontWeight: 600 }}>{agent.stats.resolved}</b> resolved
        </span>
        <span>
          <b style={{ color: "#BFBCB1", fontWeight: 600 }}>{getLastActiveLine(agent)}</b> last active
        </span>
      </div>
    </button>
  );
}

function AgentDrawer({
  agent,
  onClose,
  onViewDetails,
}: {
  agent: AgentOverview | null;
  onClose: () => void;
  onViewDetails: (role: RoleKey) => void;
}) {
  if (!agent) return null;
  const roleKey = toRoleKey(agent.agentId);
  const role = ROLES[roleKey];
  const managerRole = MANAGER[roleKey];

  return (
    <div
      className="absolute top-0 right-0 bottom-0 flex flex-col"
      style={{
        width: 460,
        background: "#1A1815",
        borderLeft: "1px solid #26241F",
        boxShadow: "var(--shadow-3)",
        zIndex: 5,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "18px 22px", borderBottom: "1px solid #26241F" }}
      >
        <div className="flex items-center gap-3">
          <Avatar role={roleKey} size={36} />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-sans font-semibold" style={{ fontSize: 18, color: "#FAFAF7" }}>
                {role.label}
              </span>
              <span
                className="font-mono uppercase"
                style={{ fontSize: 10, letterSpacing: "0.16em", color: "#8E8B82" }}
              >
                {roleKey === "ceo"
                  ? "Lead"
                  : `Reports to ${managerRole ? ROLES[managerRole].label : "CEO"}`}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <StateBadge state={getAgentState(agent)} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(roleKey)}
            className="font-mono cursor-pointer"
            style={{
              background: "transparent",
              border: "1px solid #3D3B36",
              color: "#BFBCB1",
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 6,
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            View details →
          </button>
          <button
            onClick={onClose}
            className="font-mono cursor-pointer"
            style={{ background: "transparent", border: "none", color: "#8E8B82", fontSize: 16 }}
          >
            ✕
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ padding: "20px 22px" }}>
        <div style={{ marginBottom: 22 }}>
          <Eyebrow>Status</Eyebrow>
          <div className="font-mono" style={{ marginTop: 8, fontSize: 12, color: "#BFBCB1" }}>
            {getStatusLine(agent)}
          </div>
        </div>

        {agent.currentTicket && (
          <div
            style={{
              marginBottom: 22,
              padding: "12px 14px",
              background: "#0F0E0C",
              border: "1px solid #26241F",
              borderLeft: `3px solid ${role.color}`,
              borderRadius: 8,
            }}
          >
            <Eyebrow>Current focus</Eyebrow>
            <div className="flex justify-between items-baseline gap-2.5 mt-1.5">
              <span className="font-sans font-medium" style={{ fontSize: 15, color: "#FAFAF7", lineHeight: 1.35 }}>
                {agent.currentTicket.title}
              </span>
              <span className="font-mono text-xs whitespace-nowrap" style={{ color: "#8E8B82" }}>
                {shortTicketId(agent.currentTicket.id)}
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 22 }}>
          <Eyebrow>Live tool</Eyebrow>
          <div className="font-mono" style={{ marginTop: 8, fontSize: 12, color: "#BFBCB1" }}>
            {agent.activeStep
              ? `${agent.activeStep.toolName} · ${timeAgo(agent.activeStep.startedAt)}`
              : "No running tool call"}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <Eyebrow>Last activity</Eyebrow>
          <div className="font-mono" style={{ marginTop: 8, fontSize: 12, color: "#BFBCB1" }}>
            {agent.lastStep
              ? `${agent.lastStep.toolName} · ${getLastActiveLine(agent)}`
              : "No completed steps yet"}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <Eyebrow>Tools</Eyebrow>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {agent.enabledTools.map((tool) => (
              <span
                key={tool}
                className="font-mono"
                style={{
                  fontSize: 11,
                  padding: "3px 7px",
                  background: "#26241F",
                  color: "#BFBCB1",
                  borderRadius: 4,
                  letterSpacing: "0.04em",
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty() {
  return <div />;
}

function ActivityFeed({ steps }: { steps: RecentStep[] | undefined }) {
  return (
    <div
      style={{
        marginTop: 36,
        background: "#141310",
        border: "1px solid #26241F",
        borderRadius: 12,
        padding: "18px 20px",
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <Eyebrow>Live feed</Eyebrow>
          <div className="font-sans font-semibold" style={{ fontSize: 18, color: "#FAFAF7", marginTop: 4 }}>
            Recent tool calls
          </div>
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: "#5E5C56", letterSpacing: "0.08em" }}>
          REACTIVE
        </div>
      </div>

      <div className="flex flex-col">
        {steps === undefined ? (
          <div className="font-mono" style={{ fontSize: 12, color: "#8E8B82", padding: "10px 0" }}>
            Loading live activity…
          </div>
        ) : steps.length === 0 ? (
          <div className="font-mono" style={{ fontSize: 12, color: "#8E8B82", padding: "10px 0" }}>
            No recent step activity
          </div>
        ) : (
          steps.map((step) => {
            const roleKey = toRoleKey(step.agentId);
            const role = ROLES[roleKey];
            const statusColor =
              step.status === "completed"
                ? "#7FCFA0"
                : step.status === "failed"
                  ? "#F0A097"
                  : "#F2C744";

            return (
              <div
                key={step._id}
                className="grid items-center gap-3"
                style={{
                  gridTemplateColumns: "120px minmax(0, 1fr) auto auto auto",
                  padding: "10px 0",
                  borderTop: "1px solid #26241F",
                }}
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Avatar role={roleKey} size={18} />
                  <span className="font-sans font-medium" style={{ fontSize: 13, color: "#FAFAF7" }}>
                    {role.label}
                  </span>
                </span>
                <span className="font-mono truncate" style={{ fontSize: 12, color: "#BFBCB1" }}>
                  {step.toolName}
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: "#8E8B82" }}>
                  {shortTicketId(step.ticketId)}
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: statusColor }}>
                  {step.status === "completed" ? "✓" : step.status === "failed" ? "✗" : "●"}{" "}
                  {formatDuration(step.durationMs) ?? "live"}
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: "#5E5C56" }}>
                  {timeAgo(step.completedAt ?? step.startedAt)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const overview = useQuery(api.agentSteps.getAgentsDashboardOverview);
  const recentSteps = useQuery(api.agentSteps.getRecentAgentSteps, { limit: 16 });
  const [drawerAgentId, setDrawerAgentId] = useState<RoleKey | null>(null);

  const agents = AGENT_ORDER.map((role) => {
    const live = overview?.find((entry) => entry.agentId === role);
    return (
      live ?? {
        agentId: role,
        displayName: ROLES[role].label,
        enabledTools: [],
        currentTicket: null,
        activeStep: null,
        lastStep: null,
        stats: { active: 0, resolved: 0, blocked: 0 },
        isThinking: false,
      }
    );
  });

  const selectedAgent =
    drawerAgentId === null
      ? null
      : agents.find((agent) => agent.agentId === drawerAgentId) ?? null;

  const get = (role: RoleKey) => agents.find((agent) => agent.agentId === role);
  const ceo = get("ceo");
  const cto = get("cto");
  const cmo = get("cmo");
  const dev = get("developer");
  const des = get("designer");
  const mkt = get("marketing");

  const stub = "calc((100% - 32px) / 6)";

  return (
    <div className="relative h-full" style={{ padding: "24px 24px 56px" }}>
      <div className="flex justify-between items-baseline mb-6">
        <div>
          <Eyebrow>Org chart</Eyebrow>
          <h1
            className="font-sans font-semibold"
            style={{ fontSize: 34, letterSpacing: "-0.02em", color: "#FAFAF7", margin: 0 }}
          >
            Agents
          </h1>
        </div>
        <div
          className="font-mono uppercase"
          style={{ fontSize: 11, letterSpacing: "0.14em", color: "#8E8B82" }}
        >
          Live activity
        </div>
      </div>

      <div className="relative" style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="grid grid-cols-3 gap-4">
          <Empty />
          {ceo && <AgentNode agent={ceo} isLead onClick={() => setDrawerAgentId("ceo")} />}
          <Empty />
        </div>

        <div className="relative" style={{ height: 48 }}>
          <div className="absolute" style={{ top: 0, left: "50%", width: 1, height: 24, background: "#3D3B36", transform: "translateX(-0.5px)" }} />
          <div className="absolute" style={{ top: 24, height: 1, background: "#3D3B36", left: stub, right: stub }} />
          <div className="absolute" style={{ top: 24, height: 24, width: 1, background: "#3D3B36", left: stub, transform: "translateX(-0.5px)" }} />
          <div className="absolute" style={{ top: 24, height: 24, width: 1, background: "#3D3B36", right: stub, transform: "translateX(0.5px)" }} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {cto && <AgentNode agent={cto} onClick={() => setDrawerAgentId("cto")} />}
          <Empty />
          {cmo && <AgentNode agent={cmo} onClick={() => setDrawerAgentId("cmo")} />}
        </div>

        <div className="relative" style={{ height: 48 }}>
          <div className="absolute" style={{ top: 0, bottom: 0, width: 1, background: "#3D3B36", left: stub, transform: "translateX(-0.5px)" }} />
          <div className="absolute" style={{ top: 0, bottom: 0, width: 1, background: "#3D3B36", right: stub, transform: "translateX(0.5px)" }} />
          <div className="absolute" style={{ top: 24, height: 1, background: "#3D3B36", left: "50%", right: stub }} />
          <div className="absolute" style={{ top: 24, bottom: 0, width: 1, background: "#3D3B36", left: "50%", transform: "translateX(-0.5px)" }} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {dev && <AgentNode agent={dev} onClick={() => setDrawerAgentId("developer")} />}
          {des && <AgentNode agent={des} onClick={() => setDrawerAgentId("designer")} />}
          {mkt && <AgentNode agent={mkt} onClick={() => setDrawerAgentId("marketing")} />}
        </div>

        <ActivityFeed steps={recentSteps as RecentStep[] | undefined} />
      </div>

      <AgentDrawer
        agent={selectedAgent}
        onClose={() => setDrawerAgentId(null)}
        onViewDetails={(role) => router.push(`/dashboard/agents/${role}`)}
      />
    </div>
  );
}
