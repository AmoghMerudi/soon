"use client";

import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";

type Props =
  | { kind: "active"; toolName: string; startedAt: number }
  | { kind: "last"; toolName: string; durationMs: number | null; failed: boolean }
  | { kind: "thinking" }
  | { kind: "idle"; label?: string };

export function ToolBadge(props: Props & { position: [number, number, number] }) {
  const { position, ...rest } = props;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (rest.kind !== "active" && rest.kind !== "thinking") return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [rest.kind]);

  const inner = renderInner(rest, tick);

  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div
        className="font-mono"
        style={{
          padding: "3px 6px",
          background: "#0F0E0Cdd",
          border: "1px solid #3D3B36",
          borderRadius: 3,
          color: "#FAFAF7",
          fontSize: 8,
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          minWidth: 60,
          textAlign: "center",
          backdropFilter: "blur(2px)",
        }}
      >
        {inner}
      </div>
    </Html>
  );
}

function renderInner(p: Exclude<Props, { position: unknown }>, tick: number) {
  switch (p.kind) {
    case "active": {
      const ms = Math.max(0, Date.now() - p.startedAt);
      const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"][tick % 10];
      return (
        <>
          <span style={{ color: "#F2C744" }}>{spinner} </span>
          <span style={{ color: "#F2C744" }}>{p.toolName}</span>
          <span style={{ color: "#8E8B82" }}> · {formatDuration(ms)}</span>
        </>
      );
    }
    case "thinking":
      return (
        <span style={{ color: "#9DB4F0" }}>
          thinking{".".repeat((tick % 4))}
        </span>
      );
    case "last":
      return (
        <>
          <span style={{ color: "#8E8B82" }}>last · </span>
          <span style={{ color: p.failed ? "#F0A097" : "#7FCFA0" }}>{p.toolName}</span>
          {p.durationMs !== null && (
            <span style={{ color: "#8E8B82" }}> · {formatDuration(p.durationMs)}</span>
          )}
        </>
      );
    case "idle":
      return <span style={{ color: "#8E8B82" }}>{p.label ?? "idle"}</span>;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m${Math.round(s % 60)}s`;
}
