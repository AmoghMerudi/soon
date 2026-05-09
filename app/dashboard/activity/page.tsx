"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentLog {
  _id: string;
  _creationTime: number;
  agent: string;
  action: string;
  details: string;
  ticketId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  CEO: "#8b5cf6",
  Developer: "#3b82f6",
  Designer: "#ec4899",
  Marketing: "#22c55e",
};

function getAgentColor(agent: string): string {
  for (const [role, color] of Object.entries(AGENT_COLORS)) {
    if (agent.toLowerCase().includes(role.toLowerCase())) {
      return color;
    }
  }
  return "#6b7280";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(creationTime: number): string {
  const diffMs = Date.now() - creationTime;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentAvatar({ agent, color }: { agent: string; color: string }) {
  return (
    <div
      className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-sm font-bold text-white"
      style={{ backgroundColor: color }}
      aria-label={agent}
    >
      {agent.charAt(0).toUpperCase()}
    </div>
  );
}

function TicketBadge({ ticketId }: { ticketId: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium"
      style={{
        backgroundColor: "rgba(139,92,246,0.15)",
        color: "#a78bfa",
        border: "1px solid rgba(139,92,246,0.3)",
      }}
    >
      #{ticketId.slice(-8)}
    </span>
  );
}

function LogEntry({ log }: { log: AgentLog }) {
  const color = getAgentColor(log.agent);
  return (
    <div
      className="flex items-start gap-3 rounded-lg p-3"
      style={{
        backgroundColor: "var(--card-background)",
        border: "1px solid var(--border)",
      }}
    >
      <AgentAvatar agent={log.agent} color={color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-bold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {log.agent}
            </span>
            <span className="text-sm" style={{ color: "var(--foreground)" }}>
              {log.action}
            </span>
            {log.ticketId && <TicketBadge ticketId={log.ticketId} />}
          </div>
          <span
            className="text-xs shrink-0"
            style={{ color: "var(--muted)" }}
          >
            {formatRelativeTime(log._creationTime)}
          </span>
        </div>
        {log.details && (
          <p
            className="text-xs mt-1 leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            {log.details}
          </p>
        )}
      </div>
    </div>
  );
}

function SkeletonEntry() {
  return (
    <div
      className="flex items-start gap-3 rounded-lg p-3 animate-pulse"
      style={{
        backgroundColor: "var(--card-background)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="w-9 h-9 rounded-full shrink-0"
        style={{ backgroundColor: "var(--border)" }}
      />
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div
            className="h-3.5 rounded w-40"
            style={{ backgroundColor: "var(--border)" }}
          />
          <div
            className="h-3 rounded w-12"
            style={{ backgroundColor: "var(--border)" }}
          />
        </div>
        <div
          className="h-3 rounded w-3/4"
          style={{ backgroundColor: "var(--border)" }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const logs = useQuery(api.queries.getAgentLogs);
  const topRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);

  // Scroll to top when new entries arrive (newest-first list)
  useEffect(() => {
    if (logs !== undefined && logs.length > prevCountRef.current) {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    if (logs !== undefined) {
      prevCountRef.current = logs.length;
    }
  }, [logs]);

  const isLoading = logs === undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Activity
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Live feed of agent actions — updates in real time.
        </p>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-2">
        {/* Scroll anchor at top */}
        <div ref={topRef} />

        {isLoading ? (
          <>
            <SkeletonEntry />
            <SkeletonEntry />
            <SkeletonEntry />
            <SkeletonEntry />
            <SkeletonEntry />
          </>
        ) : logs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl py-20 gap-2"
            style={{
              backgroundColor: "var(--card-background)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="text-4xl select-none"
              role="img"
              aria-label="No activity"
            >
              🤖
            </span>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              No activity yet
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Agent actions will appear here as they happen.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <LogEntry key={log._id} log={log as AgentLog} />
          ))
        )}
      </div>
    </div>
  );
}
