"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { STATUS, ROLES } from "@/lib/dashboard/constants";
import type { StatusKey, PriorityKey, RoleKey } from "@/lib/dashboard/constants";
import { StatusPill, PriorityTag, Avatar, Btn, Eyebrow } from "@/lib/dashboard/primitives";

interface Ticket {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  status: StatusKey;
  priority: PriorityKey;
  assignee: string | null;
  tags: string[];
  createdBy: string;
  taggedAgents: string[];
}

function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const roleKey = (ticket.assignee?.toLowerCase() ?? "ceo") as RoleKey;
  const role = ROLES[roleKey] ?? ROLES.ceo;
  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{
        background: "#1A1815",
        border: "1px solid #26241F",
        borderLeft: `3px solid ${role.color}`,
        padding: "10px 12px",
        borderRadius: 8,
        transition: "box-shadow 160ms",
      }}
    >
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-mono text-sm" style={{ color: "#8E8B82" }}>
          {ticket._id.slice(-8).toUpperCase()}
        </span>
        <PriorityTag priority={ticket.priority} />
      </div>
      <div
        className="font-sans font-medium"
        style={{ fontSize: 14, color: "#FAFAF7", lineHeight: 1.35, letterSpacing: "-0.003em" }}
      >
        {ticket.title}
      </div>
      <div className="flex justify-between items-center mt-2.5 gap-2">
        <span className="inline-flex items-center gap-1.5 font-sans text-xs" style={{ color: "#BFBCB1" }}>
          <Avatar role={roleKey} size={16} />
          {role.label}
        </span>
        <span className="font-mono text-xs" style={{ color: "#8E8B82" }}>
          {ticket.tags.slice(0, 2).join(" · ")}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        background: "#1A1815",
        border: "1px solid #26241F",
        padding: "10px 12px",
        borderRadius: 8,
        height: 80,
      }}
    />
  );
}

function KanbanColumn({
  status,
  onTicketClick,
}: {
  status: StatusKey;
  onTicketClick: (t: Ticket) => void;
}) {
  const tickets = useQuery(api.queries.getTicketsByStatus, { status });
  const isLoading = tickets === undefined;
  const s = STATUS[status];
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1 gap-1.5">
        <span
          className="inline-flex items-center gap-2 font-mono font-semibold uppercase whitespace-nowrap"
          style={{ fontSize: 13, letterSpacing: "0.12em", color: "#FAFAF7" }}
        >
          <span className="rounded-full" style={{ width: 8, height: 8, background: s.dot }} />
          {s.label}
        </span>
        <span className="font-mono text-sm" style={{ color: "#8E8B82" }}>
          {isLoading ? "—" : tickets.length}
        </span>
      </div>
      <div
        className="flex flex-col gap-2 p-2 rounded-lg"
        style={{ background: "#1A1815", minHeight: 200 }}
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : tickets.length === 0 ? (
          <div className="font-mono text-center py-6" style={{ fontSize: 14, color: "#8E8B82" }}>
            —
          </div>
        ) : (
          tickets.map((t) => (
            <TicketCard
              key={t._id}
              ticket={t as Ticket}
              onClick={() => onTicketClick(t as Ticket)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TicketDrawer({
  ticket,
  onClose,
}: {
  ticket: Ticket | null;
  onClose: () => void;
}) {
  if (!ticket) return null;
  const roleKey = (ticket.assignee?.toLowerCase() ?? "ceo") as RoleKey;
  const role = ROLES[roleKey] ?? ROLES.ceo;
  return (
    <div
      className="absolute top-0 right-0 bottom-0 flex flex-col"
      style={{
        width: 420,
        background: "#1A1815",
        borderLeft: "1px solid #26241F",
        boxShadow: "var(--shadow-3)",
        zIndex: 5,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid #26241F" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-sm" style={{ color: "#8E8B82" }}>
            {ticket._id.slice(-8).toUpperCase()}
          </span>
          <PriorityTag priority={ticket.priority} />
          <StatusPill status={ticket.status} />
        </div>
        <button
          onClick={onClose}
          className="font-mono cursor-pointer"
          style={{ background: "transparent", border: "none", color: "#8E8B82", fontSize: 16 }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        <div
          className="font-sans font-semibold"
          style={{ fontSize: 20, color: "#FAFAF7", lineHeight: 1.25, letterSpacing: "-0.015em" }}
        >
          {ticket.title}
        </div>
        <div
          className="font-sans"
          style={{ fontSize: 14, color: "#BFBCB1", lineHeight: 1.55, marginTop: 12 }}
        >
          {ticket.description}
        </div>
        <div
          className="flex gap-6 mt-5 pt-4"
          style={{ borderTop: "1px solid #26241F" }}
        >
          <div>
            <Eyebrow>Assignee</Eyebrow>
            <div className="flex items-center gap-2 mt-1.5">
              <Avatar role={roleKey} size={20} />
              <span className="font-sans font-medium text-sm" style={{ color: "#FAFAF7" }}>
                {role.label}
              </span>
            </div>
          </div>
          <div>
            <Eyebrow>Tags</Eyebrow>
            <div className="flex gap-1.5 mt-1.5">
              {ticket.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono uppercase"
                  style={{
                    fontSize: 11,
                    padding: "2px 6px",
                    background: "#1A1815",
                    color: "#BFBCB1",
                    borderRadius: 4,
                    letterSpacing: "0.04em",
                    border: "1px solid #26241F",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex gap-2 justify-end px-5 py-3.5"
        style={{ borderTop: "1px solid #26241F" }}
      >
        <Btn kind="ghost" onClick={onClose}>Close</Btn>
        {ticket.status !== "resolved" && (
          <Btn kind="signal" onClick={onClose}>Mark resolved</Btn>
        )}
      </div>
    </div>
  );
}

const COLUMNS: StatusKey[] = ["backlog", "in_progress", "in_review", "resolved", "blocked"];

export default function TicketsPage() {
  const [drawer, setDrawer] = useState<Ticket | null>(null);
  return (
    <div className="relative h-full">
      <div className="flex justify-between items-baseline" style={{ padding: "20px 24px 0" }}>
        <h1
          className="font-sans font-semibold"
          style={{ fontSize: 34, letterSpacing: "-0.02em", color: "#FAFAF7", margin: 0 }}
        >
          Tickets
        </h1>
        <div className="flex gap-2">
          <Btn kind="secondary" icon={<span>+</span>}>Inject ticket</Btn>
        </div>
      </div>
      <div className="flex gap-2.5 items-start" style={{ padding: "20px 24px" }}>
        {COLUMNS.map((c) => (
          <KanbanColumn key={c} status={c} onTicketClick={setDrawer} />
        ))}
      </div>
      <TicketDrawer ticket={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}
