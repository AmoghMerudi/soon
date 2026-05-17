"use client";

import { AGENT_REGISTRY, type ToolCategory } from "@/lib/dashboard/agent-registry";
import { ROLES, MANAGER, type RoleKey } from "@/lib/dashboard/constants";
import { TEAM_COMM } from "./teamComm";

const CATEGORY_LABEL: Record<ToolCategory, string> = {
  ticket: "Ticket ops",
  sandbox: "Sandbox",
  search: "Search",
  communication: "Communication",
  skill: "Skills",
};

const CATEGORY_COLOR: Record<ToolCategory, string> = {
  ticket: "#F2C744",
  sandbox: "#6E8FE5",
  search: "#7FCFA0",
  communication: "#E08AC9",
  skill: "#C97AB0",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.16em",
          color: "#8E8B82",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span
      className="font-mono"
      style={{
        display: "inline-block",
        padding: "3px 8px",
        marginRight: 6,
        marginBottom: 6,
        fontSize: 11,
        letterSpacing: "0.04em",
        background: color ? `${color}22` : "#26241F",
        color: color ?? "#FAFAF7",
        border: `1px solid ${color ?? "#3D3B36"}`,
        borderRadius: 3,
      }}
    >
      {label}
    </span>
  );
}

export function AgentInfoDrawer({
  role,
  onClose,
}: {
  role: RoleKey;
  onClose: () => void;
}) {
  if (role === "user") return null;
  const detail = AGENT_REGISTRY[role];
  if (!detail) return null;
  const meta = ROLES[role];
  const manager = MANAGER[role];
  const comms = TEAM_COMM[role as Exclude<RoleKey, "user">];

  const toolsByCat: Partial<Record<ToolCategory, typeof detail.tools>> = {};
  for (const t of detail.tools) {
    (toolsByCat[t.category] ||= []).push(t);
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 480,
        background: "#1A1815",
        borderLeft: "1px solid #26241F",
        boxShadow: "-12px 0 32px rgba(0,0,0,0.5)",
        zIndex: 9999,
        overflowY: "auto",
        padding: "20px 22px 32px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="font-mono"
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 24,
          height: 24,
          background: "transparent",
          border: "1px solid #3D3B36",
          color: "#8E8B82",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div className="flex items-center" style={{ gap: 16, marginTop: 4 }}>
        <div
          className="font-mono"
          style={{
            width: 72,
            height: 96,
            background: `${meta.color}1A`,
            border: `2px solid ${meta.color}`,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: meta.color,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {meta.initial}
        </div>
        <div className="flex-1">
          <div
            className="font-mono uppercase"
            style={{ fontSize: 10, letterSpacing: "0.18em", color: meta.color }}
          >
            {detail.entryType === "chat" ? "Chat agent" : "Ticket agent"}
          </div>
          <div
            className="font-sans"
            style={{ fontSize: 24, fontWeight: 700, color: "#FAFAF7", marginTop: 2 }}
          >
            {meta.label}
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 11, color: "#8E8B82", marginTop: 4 }}
          >
            {manager
              ? `Reports to ${ROLES[manager].label} · ${detail.model}`
              : `Top of org · ${detail.model}`}
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 11, color: "#8E8B82", marginTop: 2 }}
          >
            Up to {detail.maxSteps} reasoning steps per task
          </div>
        </div>
      </div>

      {/* Sample team comm */}
      <Section label="How they talk to the team">
        <div
          style={{
            background: "#0F0E0C",
            border: "1px solid #26241F",
            padding: 12,
            borderRadius: 4,
          }}
        >
          {comms.map((line, i) => (
            <div
              key={i}
              className="font-mono"
              style={{
                fontSize: 12,
                color: line.startsWith("←") ? "#8E8B82" : "#FAFAF7",
                lineHeight: 1.6,
                paddingLeft: 4,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </Section>

      {/* Connected integrations */}
      {detail.composioIntegrations.length > 0 && (
        <Section label="Connected integrations">
          <div>
            {detail.composioIntegrations.map((i) => (
              <Chip key={i} label={i} color="#9D7AC9" />
            ))}
          </div>
        </Section>
      )}

      {/* Capabilities by category */}
      <Section label="Capabilities">
        {(Object.keys(toolsByCat) as ToolCategory[]).map((cat) => (
          <div key={cat} style={{ marginBottom: 14 }}>
            <Chip label={CATEGORY_LABEL[cat]} color={CATEGORY_COLOR[cat]} />
            <div style={{ marginTop: 4 }}>
              {toolsByCat[cat]!.map((t) => (
                <div
                  key={t.name}
                  style={{
                    padding: "6px 0",
                    borderBottom: "1px solid #26241F",
                  }}
                >
                  <div
                    className="font-mono"
                    style={{ fontSize: 12, color: "#FAFAF7", fontWeight: 600 }}
                  >
                    {t.name}
                  </div>
                  <div
                    className="font-sans"
                    style={{ fontSize: 12, color: "#8E8B82", lineHeight: 1.4, marginTop: 2 }}
                  >
                    {t.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* Skills */}
      {detail.skills.length > 0 && (
        <Section label="Skills">
          {detail.skills.map((s) => (
            <div
              key={s.name}
              style={{
                padding: "8px 10px",
                background: "#0F0E0C",
                border: "1px solid #26241F",
                borderRadius: 4,
                marginBottom: 6,
              }}
            >
              <div
                className="font-mono"
                style={{ fontSize: 12, color: "#F2C744", fontWeight: 600 }}
              >
                {s.name}
              </div>
              <div
                className="font-sans"
                style={{ fontSize: 12, color: "#BFBCB1", lineHeight: 1.4, marginTop: 2 }}
              >
                {s.description}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
