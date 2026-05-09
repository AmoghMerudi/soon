"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { STATUS, ROLES } from "@/lib/dashboard/constants";
import type { StatusKey, PriorityKey, RoleKey } from "@/lib/dashboard/constants";
import { PriorityTag, Avatar, Btn } from "@/lib/dashboard/primitives";
import { useProjectId } from "@/lib/dashboard/project-context";

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

function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: (t: Ticket) => void }) {
  const roleKey = (ticket.assignee?.toLowerCase() ?? "ceo") as RoleKey;
  const role = ROLES[roleKey] ?? ROLES.ceo;
  return (
    <div
      onClick={() => onClick(ticket)}
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
  const projectId = useProjectId();
  const tickets = useQuery(api.queries.getTicketsByStatus, {
    projectId,
    status,
  });
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

const COLUMNS: StatusKey[] = ["backlog", "in_progress", "in_review", "resolved", "blocked"];

export default function TicketsPage() {
  const router = useRouter();
  const projectId = useProjectId();
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
          <KanbanColumn
            key={c}
            status={c}
            onTicketClick={(t) => router.push(`/projects/${projectId}/tickets/${t._id}`)}
          />
        ))}
      </div>
    </div>
  );
}
