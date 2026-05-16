"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
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
  dispatchStatus?: "pending" | "running" | "completed" | "failed";
}

const AGENT_ROLES = ["ceo", "cto", "cmo", "developer", "designer", "marketing"] as const;
const PRIORITIES = ["critical", "high", "medium", "low"] as const;

function InjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const projectId = useProjectId();
  const createTicket = useMutation(api.mutations.createTicket);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PriorityKey>("medium");
  const [assignee, setAssignee] = useState<string>("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!assignee) {
      setError("Assignee is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const tags = tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const ticketId = await createTicket({
        projectId,
        title: title.trim(),
        description: description.trim(),
        status: "backlog",
        priority,
        assignee,
        tags,
        createdBy: "user",
        taggedAgents: [assignee],
      });
      onClose();
      router.push(`/projects/${projectId}/tickets/${ticketId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#26241F",
    border: "1px solid #3D3B36",
    borderRadius: 8,
    color: "#FAFAF7",
    fontSize: 14,
    padding: "8px 12px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontFamily: "monospace",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#8E8B82",
    display: "block",
    marginBottom: 6,
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "rgba(10,9,8,0.7)", zIndex: 50 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#1A1815",
          border: "1px solid #3D3B36",
          borderRadius: 12,
          padding: 28,
          width: 480,
          maxWidth: "calc(100vw - 48px)",
        }}
      >
        <div className="flex justify-between items-baseline mb-5">
          <span
            className="font-sans font-semibold"
            style={{ fontSize: 18, color: "#FAFAF7", letterSpacing: "-0.01em" }}
          >
            Inject ticket
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#8E8B82", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context for the agent..."
            />
          </div>

          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Priority</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityKey)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} style={{ background: "#26241F" }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Assign to agent</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="" style={{ background: "#26241F" }}>— unassigned —</option>
                {AGENT_ROLES.map((r) => (
                  <option key={r} value={r} style={{ background: "#26241F" }}>
                    {ROLES[r].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input
              style={inputStyle}
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="e.g. backend, auth, bug"
            />
          </div>

          {error && (
            <div
              style={{
                background: "#3A1A14",
                border: "1px solid #C8483A",
                borderRadius: 6,
                padding: "8px 12px",
                color: "#F0A097",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-1">
            <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
            <Btn kind="signal" disabled={submitting || !title.trim()}>
              {submitting ? "Creating…" : assignee ? `Inject → ${ROLES[assignee as RoleKey]?.label ?? assignee}` : "Inject ticket"}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: (t: Ticket) => void }) {
  const roleKey = (ticket.assignee?.toLowerCase() ?? "ceo") as RoleKey;
  const role = ROLES[roleKey] ?? ROLES.ceo;
  const isLive = ticket.dispatchStatus === "running";
  return (
    <div
      onClick={() => onClick(ticket)}
      className="cursor-pointer"
      style={{
        background: "#1A1815",
        border: `1px solid ${isLive ? "#3D3B36" : "#26241F"}`,
        borderLeft: `3px solid ${role.color}`,
        padding: "10px 12px",
        borderRadius: 8,
        transition: "box-shadow 160ms",
        boxShadow: isLive ? "0 0 0 1px rgba(242,199,68,0.18)" : undefined,
      }}
    >
      <div className="flex justify-between items-baseline mb-1.5 gap-2">
        <span className="inline-flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm" style={{ color: "#8E8B82" }}>
            {ticket._id.slice(-8).toUpperCase()}
          </span>
          {isLive && (
            <span
              className="inline-flex items-center gap-1 font-mono uppercase shrink-0"
              style={{
                fontSize: 10,
                color: "#F2C744",
                letterSpacing: "0.14em",
                background: "rgba(242,199,68,0.10)",
                border: "1px solid rgba(242,199,68,0.35)",
                padding: "1px 6px",
                borderRadius: 999,
                lineHeight: 1.4,
              }}
              title="Agent is actively running this ticket"
            >
              <span
                className="pulse rounded-full"
                style={{ width: 5, height: 5, background: "#F2C744" }}
              />
              Live
            </span>
          )}
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
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative h-full">
      {showModal && <InjectModal onClose={() => setShowModal(false)} />}
      <div className="flex justify-between items-baseline" style={{ padding: "20px 24px 0" }}>
        <h1
          className="font-sans font-semibold"
          style={{ fontSize: 34, letterSpacing: "-0.02em", color: "#FAFAF7", margin: 0 }}
        >
          Tickets
        </h1>
        <div className="flex gap-2">
          <Btn kind="secondary" icon={<span>+</span>} onClick={() => setShowModal(true)}>
            Inject ticket
          </Btn>
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
