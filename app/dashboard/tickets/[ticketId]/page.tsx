"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { STATUS, ROLES } from "@/lib/dashboard/constants";
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
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type ActivityItem = {
  kind: "comment" | "log";
  author: string;
  content: string;
  detail?: string;
  time: number;
};

function ActivityEntry({ item }: { item: ActivityItem }) {
  const roleKey = (item.author?.toLowerCase() ?? "ceo") as RoleKey;
  const role = ROLES[roleKey];
  const isComment = item.kind === "comment";

  return (
    <div className="flex gap-3" style={{ padding: "0 0 0 1px" }}>
      {/* Timeline dot + line */}
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

      {/* Content */}
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

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const router = useRouter();
  const id = ticketId as Id<"tickets">;

  const ticket = useQuery(api.queries.getTicket, { ticketId: id });
  const comments = useQuery(api.queries.getTicketComments, { ticketId: id });
  const logs = useQuery(api.queries.getAgentLogsByTicket, { ticketId: id });
  const addComment = useMutation(api.mutations.addComment);

  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
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
    return items.sort((a, b) => a.time - b.time);
  }, [comments, logs]);

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
            {ticket._id.slice(-8).toUpperCase()}
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
