"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ROLES } from "@/lib/dashboard/constants";
import type {
  StatusKey,
  PriorityKey,
  RoleKey,
} from "@/lib/dashboard/constants";
import {
  StatusPill,
  PriorityTag,
  Avatar,
  Eyebrow,
} from "@/lib/dashboard/primitives";

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

type CommentActivityItem = {
  kind: "comment";
  author: string;
  content: string;
  time: number;
};

type LogActivityItem = {
  kind: "log";
  author: string;
  content: string;
  detail?: string;
  time: number;
};

type StepActivityItem = {
  kind: "step";
  agentId: string;
  toolName: string;
  inputSummary: string;
  outputSummary?: string;
  status: "running" | "completed" | "failed";
  durationMs?: number;
  error?: string;
  time: number;
  completedAt?: number;
};

type ActivityItem = CommentActivityItem | LogActivityItem | StepActivityItem;

type DispatchStatusKey = "pending" | "running" | "completed" | "failed";

const STEP_STATUS = {
  running: { label: "Running", icon: "●", color: "#F2C744", bg: "#1A1404", border: "#5A4A15" },
  completed: { label: "Completed", icon: "✓", color: "#7FCFA0", bg: "#132118", border: "#244631" },
  failed: { label: "Failed", icon: "✗", color: "#F0A097", bg: "#24110D", border: "#4C231C" },
} as const;

const DISPATCH_STATUS: Record<
  DispatchStatusKey,
  {
    icon: string;
    label: string;
    description: string;
    color: string;
    background: string;
    border: string;
  }
> = {
  pending: {
    icon: "○",
    label: "Pending",
    description: "Ticket assigned, workflow not yet started.",
    color: "#BFBCB1",
    background: "#1A1815",
    border: "#26241F",
  },
  running: {
    icon: "▶",
    label: "Running",
    description: "Workflow is active.",
    color: "#F2C744",
    background: "#1A1404",
    border: "#5A4A15",
  },
  completed: {
    icon: "✓",
    label: "Completed",
    description: "Workflow finished successfully.",
    color: "#7FCFA0",
    background: "#132118",
    border: "#244631",
  },
  failed: {
    icon: "✗",
    label: "Failed",
    description: "Dispatch failed or the workflow threw an error.",
    color: "#F0A097",
    background: "#24110D",
    border: "#4C231C",
  },
};

function ActivityEntry({ item }: { item: ActivityItem }) {
  const roleKey = (
    (item.kind === "step" ? item.agentId : item.author)?.toLowerCase() ?? "ceo"
  ) as RoleKey;
  const role = ROLES[roleKey];
  const isComment = item.kind === "comment";
  const isStep = item.kind === "step";

  return (
    <div className="flex gap-3" style={{ padding: "0 0 0 1px" }}>
      <div
        className="flex flex-col items-center shrink-0"
        style={{ width: 24 }}
      >
        {isComment ? (
          <Avatar role={roleKey} size={24} />
        ) : (
          <span
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              background: role?.color ?? "#8E8B82",
              marginTop: 8,
            }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0" style={{ paddingBottom: 20 }}>
        {isComment ? (
          <>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span
                className="font-sans font-semibold"
                style={{ fontSize: 14, color: role?.color ?? "#FAFAF7" }}
              >
                {role?.label ?? item.author}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 11, color: "#5E5C56" }}
              >
                {timeAgo(item.time)}
              </span>
            </div>
            <div
              style={{
                background: "#1A1815",
                border: "1px solid #26241F",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                lineHeight: 1.55,
                color: "#E8E5DC",
              }}
            >
              {item.content}
            </div>
          </>
        ) : isStep ? (
          <div
            style={{
              background: "#141310",
              border: "1px solid #26241F",
              borderLeft: `3px solid ${role?.color ?? "#8E8B82"}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-sans font-semibold"
                style={{ fontSize: 13, color: role?.color ?? "#FAFAF7" }}
              >
                {role?.label ?? item.agentId}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 12, color: "#FAFAF7", letterSpacing: "0.02em" }}
              >
                {item.toolName}
              </span>
              <span
                className="inline-flex items-center gap-1 font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  padding: "2px 7px",
                  background: STEP_STATUS[item.status].bg,
                  color: STEP_STATUS[item.status].color,
                  border: `1px solid ${STEP_STATUS[item.status].border}`,
                  borderRadius: 999,
                }}
              >
                <span>{STEP_STATUS[item.status].icon}</span>
                {STEP_STATUS[item.status].label}
              </span>
              {formatDuration(item.durationMs) && (
                <span
                  className="font-mono"
                  style={{ fontSize: 11, color: "#8E8B82" }}
                >
                  {formatDuration(item.durationMs)}
                </span>
              )}
              <span
                className="font-mono"
                style={{ fontSize: 11, color: "#5E5C56" }}
              >
                {timeAgo(item.completedAt ?? item.time)}
              </span>
            </div>

            <details
              style={{
                marginTop: 10,
                borderRadius: 8,
                background: "#0F0E0C",
                border: "1px solid #26241F",
                padding: "8px 10px",
              }}
            >
              <summary
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "#BFBCB1",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                Input
              </summary>
              <div
                className="font-mono"
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "#E8E5DC",
                  wordBreak: "break-word",
                }}
              >
                {item.inputSummary}
              </div>
            </details>

            {(item.outputSummary || item.error) && (
              <details
                style={{
                  marginTop: 8,
                  borderRadius: 8,
                  background: "#0F0E0C",
                  border: "1px solid #26241F",
                  padding: "8px 10px",
                }}
              >
                <summary
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: item.error ? "#F0A097" : "#7FCFA0",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.error ? "Error" : "Output"}
                </summary>
                <div
                  className="font-mono"
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: item.error ? "#F0A097" : "#E8E5DC",
                    wordBreak: "break-word",
                  }}
                >
                  {item.error ?? item.outputSummary}
                </div>
              </details>
            )}
          </div>
        ) : (
          <div
            className="flex items-center gap-2 flex-wrap"
            style={{ minHeight: 24 }}
          >
            <span
              className="font-sans font-medium"
              style={{ fontSize: 13, color: role?.color ?? "#8E8B82" }}
            >
              {role?.label ?? item.author}
            </span>
            <span style={{ fontSize: 13, color: "#8E8B82" }}>
              {item.content}
            </span>
            {item.detail && (
              <span
                className="font-mono"
                style={{ fontSize: 12, color: "#5E5C56" }}
              >
                {item.detail}
              </span>
            )}
            <span
              className="font-mono"
              style={{ fontSize: 11, color: "#5E5C56" }}
            >
              {timeAgo(item.time)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4"
      style={{
        padding: "10px 0",
        borderBottom: "1px solid #1F1D1A",
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function DispatchCard({
  assignee,
  status,
  runId,
  errorDetail,
  retrying,
  onRetry,
}: {
  assignee: string | null;
  status: DispatchStatusKey | undefined;
  runId?: string;
  errorDetail?: string;
  retrying: boolean;
  onRetry: () => void;
}) {
  if (!assignee) {
    return (
      <div
        style={{
          background: "#141310",
          border: "1px solid #26241F",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div className="font-sans font-semibold" style={{ fontSize: 13, color: "#FAFAF7" }}>
          Dispatch
        </div>
        <div className="font-mono" style={{ fontSize: 12, color: "#5E5C56", marginTop: 8 }}>
          Assign this ticket to an agent to start workflow dispatch.
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div
        style={{
          background: "#141310",
          border: "1px solid #26241F",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div className="font-sans font-semibold" style={{ fontSize: 13, color: "#FAFAF7" }}>
          Dispatch
        </div>
        <div className="font-mono" style={{ fontSize: 12, color: "#5E5C56", marginTop: 8 }}>
          This assignment is not tracked yet.
        </div>
      </div>
    );
  }

  const state = DISPATCH_STATUS[status];
  const description =
    assignee === "ceo" && status === "pending"
      ? "CEO assignments are triggered manually from /dashboard/ceo-chat."
      : state.description;

  return (
    <div
      style={{
        background: state.background,
        border: `1px solid ${state.border}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: state.color, fontSize: 14 }}>{state.icon}</span>
        <span className="font-sans font-semibold" style={{ fontSize: 13, color: "#FAFAF7" }}>
          {state.label}
        </span>
      </div>

      <div
        className="font-sans"
        style={{ fontSize: 12, color: "#BFBCB1", lineHeight: 1.5, marginTop: 8 }}
      >
        {description}
      </div>

      {runId && (
        <div style={{ marginTop: 10 }}>
          <div className="font-mono" style={{ fontSize: 10, color: "#5E5C56", marginBottom: 4 }}>
            RUN ID
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 11, color: "#E8E5DC", wordBreak: "break-all" }}
          >
            {runId}
          </div>
        </div>
      )}

      {errorDetail && (
        <div style={{ marginTop: 10 }}>
          <div className="font-mono" style={{ fontSize: 10, color: "#5E5C56", marginBottom: 4 }}>
            ERROR
          </div>
          <div
            className="font-sans"
            style={{ fontSize: 12, color: "#F0A097", lineHeight: 1.45 }}
          >
            {errorDetail}
          </div>
        </div>
      )}

      {status === "failed" && assignee !== "ceo" && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="font-mono cursor-pointer"
          style={{
            marginTop: 12,
            background: retrying ? "#26241F" : "#F2C744",
            border: "none",
            borderRadius: 8,
            color: retrying ? "#5E5C56" : "#1A1404",
            padding: "8px 10px",
            fontSize: 11,
            letterSpacing: "0.04em",
            cursor: retrying ? "not-allowed" : "pointer",
          }}
        >
          {retrying ? "RETRYING" : "RETRY DISPATCH"}
        </button>
      )}
    </div>
  );
}

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const router = useRouter();
  const id = ticketId as Id<"tickets">;

  const ticket = useQuery(api.queries.getTicket, { ticketId: id });
  const comments = useQuery(api.queries.getTicketComments, { ticketId: id });
  const logs = useQuery(api.queries.getAgentLogsByTicket, { ticketId: id });
  const steps = useQuery(
    api.agentSteps.getAgentStepsByRun,
    ticket?.workflowRunId ? { workflowRunId: ticket.workflowRunId } : "skip"
  );
  const addComment = useMutation(api.mutations.addComment);
  const retryDispatch = useMutation(api.mutations.retryDispatch);

  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [retryingDispatch, setRetryingDispatch] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  const activity = useMemo(() => {
    const items: ActivityItem[] = [];
    if (comments) {
      for (const c of comments) {
        items.push({
          kind: "comment",
          author: c.author,
          content: c.content,
          time: c._creationTime,
        });
      }
    }
    if (logs) {
      for (const l of logs) {
        items.push({
          kind: "log",
          author: l.agent,
          content: l.action,
          detail: l.details || undefined,
          time: l._creationTime,
        });
      }
    }
    if (steps) {
      for (const step of steps) {
        items.push({
          kind: "step",
          agentId: step.agentId,
          toolName: step.toolName,
          inputSummary: step.inputSummary,
          outputSummary: step.outputSummary,
          status: step.status,
          durationMs: step.durationMs,
          error: step.error,
          time: step.startedAt,
          completedAt: step.completedAt,
        });
      }
    }
    return items.sort((a, b) => a.time - b.time);
  }, [comments, logs, steps]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activity.length]);

  async function handleSend() {
    const text = commentText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await addComment({ ticketId: id, author: "user", content: text });
      setCommentText("");
    } finally {
      setSending(false);
    }
  }

  async function handleRetryDispatch() {
    if (retryingDispatch) return;
    setRetryingDispatch(true);
    try {
      await retryDispatch({ ticketId: id });
    } finally {
      setRetryingDispatch(false);
    }
  }

  if (ticket === undefined) {
    return (
      <div
        className="flex items-center justify-center h-full font-mono"
        style={{ color: "#5E5C56", fontSize: 14 }}
      >
        Loading...
      </div>
    );
  }

  if (ticket === null) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-3"
        style={{ color: "#5E5C56" }}
      >
        <span className="font-mono" style={{ fontSize: 14 }}>
          Ticket not found
        </span>
        <button
          onClick={() => router.push("/dashboard/tickets")}
          className="font-mono cursor-pointer"
          style={{
            background: "transparent",
            border: "1px solid #26241F",
            color: "#BFBCB1",
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          Back to tickets
        </button>
      </div>
    );
  }

  const roleKey = (ticket.assignee?.toLowerCase() ?? "ceo") as RoleKey;
  const role = ROLES[roleKey] ?? ROLES.ceo;
  const creatorKey = (ticket.createdBy?.toLowerCase() ?? "ceo") as RoleKey;
  const dispatchStatus = ticket.dispatchStatus as DispatchStatusKey | undefined;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-2 shrink-0"
          style={{
            padding: "14px 28px",
            borderBottom: "1px solid #26241F",
          }}
        >
          <button
            onClick={() => router.push("/dashboard/tickets")}
            className="font-mono cursor-pointer inline-flex items-center gap-1.5"
            style={{
              background: "transparent",
              border: "none",
              color: "#8E8B82",
              fontSize: 13,
              padding: 0,
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ fontSize: 11 }}>←</span> Tickets
          </button>
          <span
            className="font-mono"
            style={{ color: "#3D3B36", fontSize: 13 }}
          >
            /
          </span>
            <span
              className="font-mono"
              style={{ color: "#BFBCB1", fontSize: 13 }}
            >
            {shortTicketId(ticket._id)}
            </span>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto max-w-4xl mx-auto "
          style={{ padding: "28px 28px 0" }}
        >
          {/* Title */}
          <h1
            className="font-sans font-semibold"
            style={{
              fontSize: 26,
              color: "#FAFAF7",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              margin: 0,
            }}
          >
            {ticket.title}
          </h1>

          {/* Description */}
          <p
            className="font-sans"
            style={{
              fontSize: 15,
              color: "#BFBCB1",
              lineHeight: 1.6,
              marginTop: 14,
              marginBottom: 0,
            }}
          >
            {ticket.description}
          </p>

          {/* Divider */}
          <div
            style={{
              borderTop: "1px solid #26241F",
              margin: "24px 0 20px",
            }}
          />

          {/* Activity header */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="font-sans font-semibold"
              style={{ fontSize: 15, color: "#FAFAF7" }}
            >
              Activity
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                color: "#5E5C56",
                letterSpacing: "0.06em",
              }}
            >
              {activity.length} events
            </span>
          </div>

          {/* Activity feed */}
          <div className="flex flex-col">
            {activity.length === 0 ? (
              <div
                className="font-mono text-center"
                style={{
                  color: "#5E5C56",
                  fontSize: 13,
                  padding: "32px 0",
                }}
              >
                No activity yet
              </div>
            ) : (
              activity.map((item, i) => (
                <ActivityEntry
                  key={`${item.kind}-${item.time}-${i}`}
                  item={item}
                />
              ))
            )}
            <div ref={feedEndRef} />
          </div>
        </div>

        {/* Comment input */}
        <div
          className="shrink-0"
          style={{
            padding: "14px 28px 18px",
            borderTop: "1px solid #26241F",
          }}
        >
          <div
            className="flex items-end gap-2"
            style={{
              background: "#1A1815",
              border: "1px solid #26241F",
              borderRadius: 10,
              padding: "4px 4px 4px 14px",
            }}
          >
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Leave a comment..."
              rows={1}
              className="flex-1 resize-none font-sans"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#FAFAF7",
                fontSize: 14,
                lineHeight: 1.5,
                padding: "8px 0",
                minHeight: 36,
                maxHeight: 120,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!commentText.trim() || sending}
              className="shrink-0 cursor-pointer"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background:
                  commentText.trim() && !sending ? "#F2C744" : "#26241F",
                color: commentText.trim() && !sending ? "#1A1404" : "#5E5C56",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor:
                  !commentText.trim() || sending ? "not-allowed" : "pointer",
                transition: "background 120ms",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* Properties sidebar */}
      <div
        className="shrink-0 overflow-y-auto"
        style={{
          width: 260,
          borderLeft: "1px solid #26241F",
          padding: "20px 20px",
          background: "#0F0E0C",
        }}
      >
        <div
          className="font-sans font-semibold"
          style={{ fontSize: 13, color: "#8E8B82", marginBottom: 8 }}
        >
          Properties
        </div>

        <div style={{ marginBottom: 16 }}>
          <DispatchCard
            assignee={ticket.assignee}
            status={dispatchStatus}
            runId={ticket.workflowRunId}
            errorDetail={ticket.dispatchErrorDetail}
            retrying={retryingDispatch}
            onRetry={handleRetryDispatch}
          />
        </div>

        <PropertyRow label="Status">
          <StatusPill status={ticket.status as StatusKey} />
        </PropertyRow>

        <PropertyRow label="Priority">
          <PriorityTag priority={ticket.priority as PriorityKey} />
        </PropertyRow>

        <PropertyRow label="Assignee">
          {ticket.assignee ? (
            <>
              <Avatar role={roleKey} size={18} />
              <span
                className="font-sans font-medium"
                style={{ fontSize: 13, color: "#FAFAF7" }}
              >
                {role.label}
              </span>
            </>
          ) : (
            <span
              className="font-mono"
              style={{ fontSize: 12, color: "#5E5C56" }}
            >
              Unassigned
            </span>
          )}
        </PropertyRow>

        <PropertyRow label="Created by">
          <Avatar role={creatorKey} size={18} />
          <span
            className="font-sans font-medium"
            style={{ fontSize: 13, color: "#FAFAF7" }}
          >
            {ROLES[creatorKey]?.label ?? ticket.createdBy}
          </span>
        </PropertyRow>

        <PropertyRow label="Tags">
          <div className="flex flex-wrap gap-1 justify-end">
            {ticket.tags.length > 0 ? (
              ticket.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono uppercase"
                  style={{
                    fontSize: 11,
                    padding: "2px 7px",
                    background: "#1A1815",
                    color: "#BFBCB1",
                    borderRadius: 4,
                    letterSpacing: "0.04em",
                    border: "1px solid #26241F",
                  }}
                >
                  {tag}
                </span>
              ))
            ) : (
              <span
                className="font-mono"
                style={{ fontSize: 12, color: "#5E5C56" }}
              >
                None
              </span>
            )}
          </div>
        </PropertyRow>

        {ticket.taggedAgents.length > 0 && (
          <PropertyRow label="Tagged">
            <div className="flex flex-wrap gap-1 justify-end">
              {ticket.taggedAgents.map((agent) => {
                const aKey = agent.toLowerCase() as RoleKey;
                return (
                  <span key={agent} className="inline-flex items-center gap-1">
                    <Avatar role={aKey} size={16} />
                    <span
                      className="font-sans"
                      style={{ fontSize: 12, color: "#BFBCB1" }}
                    >
                      {ROLES[aKey]?.label ?? agent}
                    </span>
                  </span>
                );
              })}
            </div>
          </PropertyRow>
        )}

        <PropertyRow label="Created">
          <span
            className="font-mono"
            style={{ fontSize: 12, color: "#BFBCB1" }}
          >
            {new Date(ticket._creationTime).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </PropertyRow>
      </div>
    </div>
  );
}
