"use client";

import { useParams, useRouter } from "next/navigation";
import { ROLES, SEED_AGENTS } from "@/lib/dashboard/constants";
import { AGENT_REGISTRY, TOOL_CATEGORY_STYLES } from "@/lib/dashboard/agent-registry";
import type { ToolCategory } from "@/lib/dashboard/agent-registry";
import { Avatar, StateBadge, Eyebrow } from "@/lib/dashboard/primitives";

function CategoryBadge({ category }: { category: ToolCategory }) {
  const s = TOOL_CATEGORY_STYLES[category];
  return (
    <span
      className="font-mono uppercase"
      style={{
        fontSize: 10,
        letterSpacing: "0.12em",
        padding: "2px 6px",
        background: s.bg,
        color: s.fg,
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 12,
        padding: "3px 8px",
        background: "#26241F",
        color: "#BFBCB1",
        borderRadius: 4,
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </span>
  );
}

function IntegrationBadge({ name }: { name: string }) {
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 12,
        padding: "4px 10px",
        background: "#1A1815",
        color: "#BFBCB1",
        border: "1px solid #3D3B36",
        borderRadius: 6,
        letterSpacing: "0.04em",
      }}
    >
      {name}
    </span>
  );
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const agent = AGENT_REGISTRY[id];
  const seedAgent = SEED_AGENTS.find((a) => a.role === id);

  if (!agent) {
    return (
      <div style={{ padding: 40, color: "#8E8B82", fontFamily: "monospace" }}>
        Agent not found: {id}
      </div>
    );
  }

  const role = ROLES[agent.id];
  const managerEntry = Object.entries({
    cto: "ceo",
    cmo: "ceo",
    developer: "cto",
    designer: "cmo",
    marketing: "cmo",
  } as Record<string, string>).find(([k]) => k === id);
  const managerRole = managerEntry ? ROLES[managerEntry[1] as keyof typeof ROLES] : null;

  const toolsByCategory = agent.tools.reduce<Record<ToolCategory, typeof agent.tools>>(
    (acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<ToolCategory, typeof agent.tools>
  );

  const categoryOrder: ToolCategory[] = ["ticket", "sandbox", "communication", "search", "skill"];

  return (
    <div style={{ padding: "28px 32px 64px", maxWidth: 900 }}>
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/agents")}
        className="font-mono"
        style={{
          background: "transparent",
          border: "none",
          color: "#8E8B82",
          fontSize: 13,
          letterSpacing: "0.04em",
          cursor: "pointer",
          padding: 0,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Agents
      </button>

      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          background: "#1A1815",
          border: "1px solid #26241F",
          borderTop: `3px solid ${role.color}`,
          borderRadius: 10,
          marginBottom: 28,
        }}
      >
        <div className="flex items-start gap-4">
          <Avatar role={agent.id} size={48} />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="font-sans font-semibold"
                style={{ fontSize: 26, color: "#FAFAF7", margin: 0, letterSpacing: "-0.02em" }}
              >
                {role.label}
              </h1>
              {seedAgent && <StateBadge state={seedAgent.state} />}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 12, color: "#8E8B82", marginTop: 4, letterSpacing: "0.04em" }}
            >
              {agent.id === "ceo"
                ? "Lead · reports to nobody"
                : `Reports to ${managerRole?.label ?? "CEO"}`}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <MetaPill>{agent.model}</MetaPill>
              <MetaPill>{agent.maxSteps} steps max</MetaPill>
              <MetaPill>{agent.entryType === "chat" ? "chat-based" : "ticket-based"}</MetaPill>
              <MetaPill>{agent.tools.length} tools</MetaPill>
              <MetaPill>{agent.skills.length} {agent.skills.length === 1 ? "skill" : "skills"}</MetaPill>
            </div>
          </div>
        </div>
      </div>

      {/* Tools */}
      <section style={{ marginBottom: 32 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <Eyebrow>Tools</Eyebrow>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "#5E5C56", letterSpacing: "0.04em" }}
          >
            {agent.tools.length} native · {agent.composioIntegrations.length > 0 ? "composio loaded at runtime" : "no integrations"}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {categoryOrder.map((category) => {
            const tools = toolsByCategory[category];
            if (!tools || tools.length === 0) return null;
            return (
              <div key={category}>
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: TOOL_CATEGORY_STYLES[category].fg,
                    marginBottom: 8,
                    opacity: 0.7,
                  }}
                >
                  {TOOL_CATEGORY_STYLES[category].label}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 10,
                  }}
                >
                  {tools.map((tool) => (
                    <div
                      key={tool.name}
                      style={{
                        padding: "12px 14px",
                        background: "#1A1815",
                        border: "1px solid #26241F",
                        borderLeft: `3px solid ${TOOL_CATEGORY_STYLES[tool.category].fg}`,
                        borderRadius: 8,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="font-mono font-semibold"
                          style={{ fontSize: 13, color: "#FAFAF7", letterSpacing: "0.02em" }}
                        >
                          {tool.name}
                        </span>
                        <CategoryBadge category={tool.category} />
                      </div>
                      <p
                        className="font-sans"
                        style={{ fontSize: 12, color: "#8E8B82", margin: 0, lineHeight: 1.5 }}
                      >
                        {tool.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Composio integrations */}
      {agent.composioIntegrations.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div className="flex items-baseline gap-3 mb-3">
            <Eyebrow>Composio Integrations</Eyebrow>
            <span
              className="font-mono"
              style={{ fontSize: 11, color: "#5E5C56", letterSpacing: "0.04em" }}
            >
              loaded dynamically · toolkit tools available at runtime
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {agent.composioIntegrations.map((name) => (
              <IntegrationBadge key={name} name={name} />
            ))}
          </div>
        </section>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: "#26241F", marginBottom: 28 }} />

      {/* Skills */}
      <section>
        <div className="flex items-baseline gap-3 mb-4">
          <Eyebrow>Skills</Eyebrow>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "#5E5C56", letterSpacing: "0.04em" }}
          >
            {agent.skills.length} {agent.skills.length === 1 ? "skill" : "skills"} · loaded on demand via loadSkill
          </span>
        </div>

        {agent.skills.length === 0 ? (
          <p className="font-mono" style={{ fontSize: 13, color: "#5E5C56" }}>
            No skills defined.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {agent.skills.map((skill, i) => (
              <div
                key={skill.name}
                style={{
                  padding: "16px 18px",
                  background: "#1A1815",
                  border: "1px solid #26241F",
                  borderLeft: "3px solid #F2C744",
                  borderRadius: 8,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="font-mono"
                    style={{ fontSize: 11, color: "#5E5C56", letterSpacing: "0.04em" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="font-mono font-semibold"
                    style={{ fontSize: 14, color: "#F2C744", letterSpacing: "0.04em" }}
                  >
                    {skill.name}
                  </span>
                </div>
                <p
                  className="font-sans"
                  style={{ fontSize: 13, color: "#BFBCB1", margin: 0, lineHeight: 1.55 }}
                >
                  {skill.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
