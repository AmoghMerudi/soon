"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "backlog" | "in_progress" | "in_review" | "resolved" | "blocked";
type Priority = "critical" | "high" | "medium" | "low";

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string | null;
  tags: string[];
  createdBy: string;
  taggedAgents: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const PRIORITY_BG: Record<Priority, string> = {
  critical: "rgba(239,68,68,0.15)",
  high: "rgba(249,115,22,0.15)",
  medium: "rgba(234,179,8,0.15)",
  low: "rgba(34,197,94,0.15)",
};

const COLUMNS: { status: Status; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "#6b7280" },
  { status: "in_progress", label: "In Progress", color: "#3b82f6" },
  { status: "in_review", label: "In Review", color: "#a855f7" },
  { status: "resolved", label: "Resolved", color: "#22c55e" },
  { status: "blocked", label: "Blocked", color: "#ef4444" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize"
      style={{
        color: PRIORITY_COLORS[priority],
        backgroundColor: PRIORITY_BG[priority],
      }}
    >
      {priority}
    </span>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
      style={{
        backgroundColor: "rgba(139,92,246,0.15)",
        color: "#a78bfa",
      }}
    >
      {label}
    </span>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2"
      style={{
        backgroundColor: "var(--card-background)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Title + Priority */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
          {ticket.title}
        </p>
        <PriorityBadge priority={ticket.priority} />
      </div>

      {/* Tags */}
      {ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ticket.tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
      )}

      {/* Footer: assignee + created by */}
      <div className="flex items-center justify-between text-xs gap-2 mt-1">
        <span
          style={{ color: ticket.assignee ? "var(--foreground)" : "var(--muted)" }}
        >
          {ticket.assignee ?? "Unassigned"}
        </span>
        <span style={{ color: "var(--muted)" }} className="truncate text-right">
          by {ticket.createdBy}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2 animate-pulse"
      style={{
        backgroundColor: "var(--card-background)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex justify-between gap-2">
        <div className="h-4 rounded w-3/4" style={{ backgroundColor: "var(--border)" }} />
        <div className="h-4 rounded w-14" style={{ backgroundColor: "var(--border)" }} />
      </div>
      <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--border)" }} />
      <div className="h-3 rounded w-1/3" style={{ backgroundColor: "var(--border)" }} />
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  color,
}: {
  status: Status;
  label: string;
  color: string;
}) {
  const tickets = useQuery(api.queries.getTicketsByStatus, { status });
  const isLoading = tickets === undefined;

  return (
    <div
      className="flex flex-col rounded-xl shrink-0 w-72"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {label}
          </span>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isLoading ? "var(--border)" : `${color}22`,
            color: isLoading ? "var(--muted)" : color,
            minWidth: "1.5rem",
            textAlign: "center",
          }}
        >
          {isLoading ? "—" : tickets.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto" style={{ minHeight: "4rem" }}>
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : tickets.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              No tickets
            </span>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket as Ticket} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Tickets
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Real-time board — updates automatically as agents work.
        </p>
      </div>

      {/* Kanban board — horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 0 }}>
        {COLUMNS.map(({ status, label, color }) => (
          <KanbanColumn key={status} status={status} label={label} color={color} />
        ))}
      </div>
    </div>
  );
}
