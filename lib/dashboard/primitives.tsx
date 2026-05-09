"use client";

import { STATUS, ROLES, PRIORITY, THREAD_STATUS } from "./constants";
import type { StatusKey, RoleKey, PriorityKey, ThreadStatusKey } from "./constants";

export function StatusPill({ status }: { status: StatusKey }) {
  const s = STATUS[status] ?? STATUS.backlog;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase leading-none whitespace-nowrap"
      style={{
        padding: "3px 9px",
        letterSpacing: "0.04em",
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
      }}
    >
      <span
        className="rounded-full"
        style={{ width: 6, height: 6, background: s.dot }}
      />
      {s.label}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: PriorityKey }) {
  const p = PRIORITY[priority] ?? PRIORITY.medium;
  return (
    <span
      className="font-mono font-bold uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.16em",
        padding: "2px 6px",
        background: p.bg,
        color: p.fg,
        borderRadius: 4,
        border: "border" in p ? `1px solid ${p.border}` : "none",
      }}
    >
      {p.label}
    </span>
  );
}

export function Avatar({ role, size = 24 }: { role: RoleKey; size?: number }) {
  const r = ROLES[role] ?? ROLES.ceo;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-mono font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: r.color,
        color: r.fg,
        fontSize: Math.round(size * 0.42),
      }}
    >
      {r.initial}
    </span>
  );
}

export function Btn({
  kind = "secondary",
  icon,
  children,
  onClick,
  disabled,
}: {
  kind?: "primary" | "signal" | "secondary" | "ghost" | "danger";
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: "#1A1815", color: "#FAFAF7", border: "1px solid #3D3B36" },
    signal:    { background: "#F2C744", color: "#1A1404", border: "1px solid #F2C744", fontWeight: 600 },
    secondary: { background: "transparent", color: "#FAFAF7", border: "1px solid #BFBCB1" },
    ghost:     { background: "transparent", color: "#BFBCB1", border: "1px solid transparent" },
    danger:    { background: "#C8483A", color: "#fff", border: "1px solid #C8483A" },
  };
  const s = styles[kind];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 leading-none whitespace-nowrap shrink-0"
      style={{
        ...s,
        fontWeight: (s.fontWeight as number) ?? 500,
        fontSize: 14,
        letterSpacing: "-0.003em",
        padding: "7px 12px",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 160ms",
      }}
    >
      {icon && <span className="text-sm leading-none">{icon}</span>}
      {children}
    </button>
  );
}

export function StateBadge({ state }: { state: "working" | "idle" | "blocked" }) {
  if (state === "working") {
    return (
      <span
        className="inline-flex items-center gap-1 font-mono font-semibold uppercase leading-none"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          padding: "2px 7px",
          background: "#F2C744",
          color: "#1A1404",
          borderRadius: 999,
        }}
      >
        <span
          className="pulse rounded-full"
          style={{ width: 5, height: 5, background: "#1A1404" }}
        />
        Working
      </span>
    );
  }
  if (state === "blocked") {
    return (
      <span
        className="font-mono font-semibold uppercase leading-none"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          padding: "2px 7px",
          background: "#3A1A14",
          color: "#F0A097",
          borderRadius: 999,
        }}
      >
        ● Blocked
      </span>
    );
  }
  return (
    <span
      className="font-mono font-semibold uppercase leading-none"
      style={{
        fontSize: 11,
        letterSpacing: "0.1em",
        padding: "2px 7px",
        background: "#26241F",
        color: "#8E8B82",
        borderRadius: 999,
      }}
    >
      Idle
    </span>
  );
}

export function ThreadStatusBadge({ status }: { status: ThreadStatusKey }) {
  const s = THREAD_STATUS[status] ?? THREAD_STATUS.active;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono font-semibold uppercase leading-none"
      style={{
        fontSize: 11,
        letterSpacing: "0.1em",
        padding: "3px 9px",
        background: s.bg,
        color: s.fg,
        borderRadius: 999,
      }}
    >
      <span
        className={s.pulse ? "pulse" : ""}
        style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }}
      />
      {s.label}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono font-medium uppercase"
      style={{ fontSize: 11, letterSpacing: "0.16em", color: "#8E8B82" }}
    >
      {children}
    </div>
  );
}
