"use client";

import { useState } from "react";
import { ROLES, SEED_THREADS } from "@/lib/dashboard/constants";
import type { RoleKey, ThreadSeed, ThreadStatusKey } from "@/lib/dashboard/constants";
import { Avatar, ThreadStatusBadge, Eyebrow } from "@/lib/dashboard/primitives";

function ThreadRow({
  thread,
  active,
  onClick,
}: {
  thread: ThreadSeed;
  active: boolean;
  onClick: () => void;
}) {
  const fromR = ROLES[thread.from];
  const toR = ROLES[thread.to];
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex flex-col gap-2 cursor-pointer"
      style={{
        padding: "14px 16px",
        background: active ? "#221F1B" : "transparent",
        border: "none",
        borderBottom: "1px solid #1F1D1A",
        borderLeft: active ? "3px solid #F2C744" : "3px solid transparent",
        color: "inherit",
        fontFamily: "inherit",
        transition: "background 140ms",
      }}
    >
      <div className="flex justify-between items-center gap-2.5">
        <div className="inline-flex items-center gap-1.5">
          <Avatar role={thread.from} size={20} />
          <span className="font-mono" style={{ color: "#5E5C56", fontSize: 13 }}>
            →
          </span>
          <Avatar role={thread.to} size={20} />
        </div>
        <span className="font-mono" style={{ fontSize: 11, color: "#5E5C56", letterSpacing: "0.06em" }}>
          {thread.lastAt}
        </span>
      </div>
      <div
        className="font-medium overflow-hidden"
        style={{
          fontSize: 14,
          lineHeight: 1.4,
          color: "#FAFAF7",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {thread.topic}
      </div>
      <div
        className="flex justify-between items-center gap-2.5 font-mono"
        style={{ fontSize: 11, color: "#8E8B82", letterSpacing: "0.04em" }}
      >
        <span>
          <span style={{ color: fromR.color }}>{fromR.label}</span>
          <span style={{ color: "#3D3B36", margin: "0 5px" }}>→</span>
          <span style={{ color: toR.color }}>{toR.label}</span>
        </span>
        <span>{thread.turns.length} turns</span>
      </div>
      <div className="flex justify-between items-center gap-2.5">
        <ThreadStatusBadge status={thread.status} />
        <span className="font-mono" style={{ fontSize: 11, color: "#5E5C56" }}>
          {thread.id} · {thread.parentTicket}
        </span>
      </div>
    </button>
  );
}

function ThreadBubble({
  turn,
  fromRole,
}: {
  turn: { role: RoleKey; ts: string; body: string };
  fromRole: RoleKey;
}) {
  const role = ROLES[turn.role];
  const isInitiator = turn.role === fromRole;
  const align = isInitiator ? "flex-start" : "flex-end";
  return (
    <div
      className="flex flex-col gap-1.5"
      style={{ alignItems: align, alignSelf: align, maxWidth: "82%" }}
    >
      <div
        className="flex items-center gap-2"
        style={{ flexDirection: isInitiator ? "row" : "row-reverse" }}
      >
        <Avatar role={turn.role} size={24} />
        <span className="font-sans font-semibold" style={{ fontSize: 13, color: role.color }}>
          {role.label}
        </span>
        <span className="font-mono" style={{ fontSize: 11, color: "#5E5C56" }}>
          {turn.ts}
        </span>
      </div>
      <div
        style={{
          background: isInitiator ? "#1A1815" : "#221F1B",
          border: "1px solid #26241F",
          borderRadius: 14,
          borderTopLeftRadius: isInitiator ? 4 : 14,
          borderTopRightRadius: isInitiator ? 14 : 4,
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.5,
          color: "#E8E5DC",
        }}
      >
        {turn.body}
      </div>
    </div>
  );
}

function ThreadDetail({ thread }: { thread: ThreadSeed | undefined }) {
  if (!thread) {
    return (
      <div
        className="flex-1 flex items-center justify-center flex-col gap-2.5 font-mono uppercase"
        style={{ color: "#5E5C56", fontSize: 13, letterSpacing: "0.1em" }}
      >
        <span style={{ fontSize: 28, color: "#3D3B36" }}>{"⇄"}</span>
        Select a thread
      </div>
    );
  }
  const fromR = ROLES[thread.from];
  const toR = ROLES[thread.to];
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#0F0E0C" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #26241F", background: "#0F0E0C" }}>
        <div className="flex justify-between items-center mb-3">
          <div
            className="font-mono uppercase"
            style={{ fontSize: 11, color: "#8E8B82", letterSpacing: "0.16em" }}
          >
            Thread {thread.id} · started {thread.startedAt}
          </div>
          <ThreadStatusBadge status={thread.status} />
        </div>
        <div className="flex items-center gap-3.5 mb-2.5">
          <div className="flex items-center gap-2">
            <Avatar role={thread.from} size={32} />
            <div>
              <div className="font-sans font-semibold" style={{ fontSize: 14, color: fromR.color, lineHeight: 1.1 }}>
                {fromR.label}
              </div>
              <div
                className="font-mono uppercase"
                style={{ fontSize: 11, color: "#5E5C56", letterSpacing: "0.06em" }}
              >
                Initiator
              </div>
            </div>
          </div>
          <span className="font-mono" style={{ fontSize: 18, color: "#3D3B36" }}>
            →
          </span>
          <div className="flex items-center gap-2">
            <Avatar role={thread.to} size={32} />
            <div>
              <div className="font-sans font-semibold" style={{ fontSize: 14, color: toR.color, lineHeight: 1.1 }}>
                {toR.label}
              </div>
              <div
                className="font-mono uppercase"
                style={{ fontSize: 11, color: "#5E5C56", letterSpacing: "0.06em" }}
              >
                Recipient
              </div>
            </div>
          </div>
        </div>
        <h2
          className="font-sans font-semibold"
          style={{ fontSize: 20, color: "#FAFAF7", letterSpacing: "-0.01em", margin: "4px 0 8px", lineHeight: 1.3 }}
        >
          {thread.topic}
        </h2>
        <div
          className="flex gap-3.5 font-mono"
          style={{ fontSize: 11, color: "#8E8B82", letterSpacing: "0.04em" }}
        >
          <span>{thread.turns.length} turns</span>
          <span style={{ color: "#3D3B36" }}>·</span>
          <span style={{ color: "#8FAACB" }}>
            Spawned from {thread.parentTicket}
          </span>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4" style={{ padding: "22px 24px" }}>
        {thread.turns.map((turn, i) => (
          <ThreadBubble key={i} turn={turn} fromRole={thread.from} />
        ))}
        {thread.status === "resolved" && (
          <div
            className="self-center font-mono uppercase mt-1.5"
            style={{
              padding: "6px 12px",
              background: "#1B2330",
              color: "#8FAACB",
              fontSize: 11,
              letterSpacing: "0.12em",
              borderRadius: 999,
            }}
          >
            Run terminated · resolved
          </div>
        )}
        {thread.status === "blocked" && (
          <div
            className="self-center font-mono uppercase mt-1.5"
            style={{
              padding: "6px 12px",
              background: "#2D1A18",
              color: "#E89A8E",
              fontSize: 11,
              letterSpacing: "0.12em",
              borderRadius: 999,
            }}
          >
            Run paused · awaiting external input
          </div>
        )}
      </div>
    </div>
  );
}

type FilterKey = "all" | ThreadStatusKey;

export default function ThreadsPage() {
  const threads = SEED_THREADS;
  const [selectedId, setSelectedId] = useState(threads[0]?.id);
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = filter === "all" ? threads : threads.filter((t) => t.status === filter);
  const selected = threads.find((t) => t.id === selectedId);

  const counts: Record<FilterKey, number> = {
    all: threads.length,
    active: threads.filter((t) => t.status === "active").length,
    in_review: threads.filter((t) => t.status === "in_review").length,
    blocked: threads.filter((t) => t.status === "blocked").length,
    resolved: threads.filter((t) => t.status === "resolved").length,
  };

  const filters: { id: FilterKey; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "in_review", label: "In review" },
    { id: "blocked", label: "Blocked" },
    { id: "resolved", label: "Resolved" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #26241F" }}>
        <div className="flex justify-between items-baseline mb-3.5">
          <div>
            <Eyebrow>Agent ↔ agent</Eyebrow>
            <h1
              className="font-sans font-semibold"
              style={{ fontSize: 34, letterSpacing: "-0.02em", color: "#FAFAF7", margin: 0 }}
            >
              Threads
            </h1>
          </div>
          <div
            className="font-mono uppercase text-right"
            style={{ fontSize: 11, letterSpacing: "0.14em", color: "#8E8B82" }}
          >
            <div>{counts.active} active · {counts.blocked} blocked</div>
            <div style={{ color: "#5E5C56", marginTop: 2 }}>each thread is a fresh run</div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="font-mono uppercase inline-flex items-center gap-1.5 cursor-pointer"
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid",
                background: filter === f.id ? "#26241F" : "transparent",
                borderColor: filter === f.id ? "#3D3B36" : "#26241F",
                color: filter === f.id ? "#FAFAF7" : "#8E8B82",
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              {f.label}
              <span style={{ color: filter === f.id ? "#8E8B82" : "#5E5C56" }}>
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-pane */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div
          className="overflow-y-auto shrink-0"
          style={{ width: 380, borderRight: "1px solid #26241F", background: "#0A0A0A" }}
        >
          {filtered.length === 0 ? (
            <div
              className="text-center font-mono uppercase"
              style={{ padding: "36px 20px", color: "#5E5C56", fontSize: 12, letterSpacing: "0.08em" }}
            >
              No threads match
            </div>
          ) : (
            filtered.map((t) => (
              <ThreadRow
                key={t.id}
                thread={t}
                active={t.id === selectedId}
                onClick={() => setSelectedId(t.id)}
              />
            ))
          )}
        </div>
        <ThreadDetail
          thread={
            selected && filtered.find((t) => t.id === selected.id)
              ? selected
              : filtered[0]
          }
        />
      </div>
    </div>
  );
}
