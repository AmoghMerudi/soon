"use client";

import { useState } from "react";
import { ROLES, MANAGER, SEED_AGENTS } from "@/lib/dashboard/constants";
import type { RoleKey, AgentSeed } from "@/lib/dashboard/constants";
import { Avatar, StateBadge, Eyebrow } from "@/lib/dashboard/primitives";

function AgentNode({
  agent,
  isLead,
  onClick,
}: {
  agent: AgentSeed;
  isLead?: boolean;
  onClick: () => void;
}) {
  const r = ROLES[agent.role];
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex flex-col gap-2.5 cursor-pointer"
      style={{
        background: "#1A1815",
        border: "1px solid #26241F",
        borderTop: `3px solid ${r.color}`,
        borderRadius: 8,
        padding: "14px 16px 12px",
        color: "inherit",
        fontFamily: "inherit",
        transition: "border-color 160ms, background 160ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#221F1B";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#1A1815";
      }}
    >
      <div className="flex items-center gap-2.5">
        <Avatar role={agent.role} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold" style={{ fontSize: 15, color: "#FAFAF7" }}>
              {r.label}
            </span>
            {isLead && (
              <span
                className="font-mono uppercase"
                style={{ fontSize: 10, letterSpacing: "0.16em", color: "#8E8B82" }}
              >
                Lead
              </span>
            )}
          </div>
          <div
            className="font-mono truncate"
            style={{ fontSize: 11, color: "#8E8B82", letterSpacing: "0.04em", marginTop: 2 }}
          >
            {agent.tools.join(" · ")}
          </div>
        </div>
        <StateBadge state={agent.state} />
      </div>
      <div style={{ minHeight: 36, fontSize: 13, lineHeight: 1.4 }}>
        {agent.currentTicket ? (
          <>
            <span className="font-mono" style={{ color: "#8E8B82" }}>
              {agent.currentTicket.id}{" "}
            </span>
            <span style={{ color: "#BFBCB1" }}>{agent.currentTicket.title}</span>
          </>
        ) : (
          <span className="font-mono italic" style={{ color: "#5E5C56" }}>
            awaiting assignment
          </span>
        )}
      </div>
      <div
        className="flex gap-3.5 font-mono uppercase"
        style={{
          paddingTop: 8,
          borderTop: "1px solid #26241F",
          fontSize: 11,
          letterSpacing: "0.08em",
        }}
      >
        <span>
          <b style={{ color: "#FAFAF7", fontWeight: 600 }}>{agent.stats.active}</b>{" "}
          <span style={{ color: "#5E5C56" }}>active</span>
        </span>
        <span>
          <b style={{ color: "#FAFAF7", fontWeight: 600 }}>{agent.stats.resolved}</b>{" "}
          <span style={{ color: "#5E5C56" }}>resolved</span>
        </span>
        {agent.stats.blocked > 0 && (
          <span>
            <b style={{ color: "#C8483A", fontWeight: 600 }}>{agent.stats.blocked}</b>{" "}
            <span style={{ color: "#5E5C56" }}>blocked</span>
          </span>
        )}
      </div>
    </button>
  );
}

function AgentDrawer({
  agent,
  onClose,
}: {
  agent: AgentSeed | null;
  onClose: () => void;
}) {
  if (!agent) return null;
  const r = ROLES[agent.role];
  const managerRole = MANAGER[agent.role];
  return (
    <div
      className="absolute top-0 right-0 bottom-0 flex flex-col"
      style={{
        width: 460,
        background: "#1A1815",
        borderLeft: "1px solid #26241F",
        boxShadow: "var(--shadow-3)",
        zIndex: 5,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "18px 22px", borderBottom: "1px solid #26241F" }}
      >
        <div className="flex items-center gap-3">
          <Avatar role={agent.role} size={36} />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-sans font-semibold" style={{ fontSize: 18, color: "#FAFAF7" }}>
                {r.label}
              </span>
              <span
                className="font-mono uppercase"
                style={{ fontSize: 10, letterSpacing: "0.16em", color: "#8E8B82" }}
              >
                {agent.role === "ceo"
                  ? "Lead"
                  : `Reports to ${managerRole ? ROLES[managerRole].label : "CEO"}`}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <StateBadge state={agent.state} />
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="font-mono cursor-pointer"
          style={{ background: "transparent", border: "none", color: "#8E8B82", fontSize: 16 }}
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ padding: "20px 22px" }}>
        {agent.currentTicket && (
          <div
            style={{
              marginBottom: 22,
              padding: "12px 14px",
              background: "#0F0E0C",
              border: "1px solid #26241F",
              borderLeft: `3px solid ${r.color}`,
              borderRadius: 8,
            }}
          >
            <Eyebrow>Current focus</Eyebrow>
            <div className="flex justify-between items-baseline gap-2.5 mt-1.5">
              <span className="font-sans font-medium" style={{ fontSize: 15, color: "#FAFAF7", lineHeight: 1.35 }}>
                {agent.currentTicket.title}
              </span>
              <span className="font-mono text-xs whitespace-nowrap" style={{ color: "#8E8B82" }}>
                {agent.currentTicket.id}
              </span>
            </div>
          </div>
        )}
        <div style={{ marginBottom: 22 }}>
          <Eyebrow>Tools</Eyebrow>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {agent.tools.map((t) => (
              <span
                key={t}
                className="font-mono"
                style={{
                  fontSize: 11,
                  padding: "3px 7px",
                  background: "#26241F",
                  color: "#BFBCB1",
                  borderRadius: 4,
                  letterSpacing: "0.04em",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty() {
  return <div />;
}

export default function AgentsPage() {
  const agents = SEED_AGENTS;
  const [drawerAgent, setDrawerAgent] = useState<AgentSeed | null>(null);

  const get = (role: RoleKey) => agents.find((a) => a.role === role);
  const ceo = get("ceo");
  const cto = get("cto");
  const cmo = get("cmo");
  const dev = get("developer");
  const des = get("designer");
  const mkt = get("marketing");

  const stub = "calc((100% - 32px) / 6)";

  return (
    <div className="relative h-full" style={{ padding: "24px 24px 56px" }}>
      <div className="flex justify-between items-baseline mb-6">
        <div>
          <Eyebrow>Org chart</Eyebrow>
          <h1
            className="font-sans font-semibold"
            style={{ fontSize: 34, letterSpacing: "-0.02em", color: "#FAFAF7", margin: 0 }}
          >
            Agents
          </h1>
        </div>
        <div
          className="font-mono uppercase"
          style={{ fontSize: 11, letterSpacing: "0.14em", color: "#8E8B82" }}
        >
          Click an agent to view tasks
        </div>
      </div>

      <div className="relative" style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Row 1: CEO */}
        <div className="grid grid-cols-3 gap-4">
          <Empty />
          {ceo && <AgentNode agent={ceo} isLead onClick={() => setDrawerAgent(ceo)} />}
          <Empty />
        </div>

        {/* Connector: CEO to CTO+CMO */}
        <div className="relative" style={{ height: 48 }}>
          <div className="absolute" style={{ top: 0, left: "50%", width: 1, height: 24, background: "#3D3B36", transform: "translateX(-0.5px)" }} />
          <div className="absolute" style={{ top: 24, height: 1, background: "#3D3B36", left: stub, right: stub }} />
          <div className="absolute" style={{ top: 24, height: 24, width: 1, background: "#3D3B36", left: stub, transform: "translateX(-0.5px)" }} />
          <div className="absolute" style={{ top: 24, height: 24, width: 1, background: "#3D3B36", right: stub, transform: "translateX(0.5px)" }} />
        </div>

        {/* Row 2: CTO + CMO */}
        <div className="grid grid-cols-3 gap-4">
          {cto && <AgentNode agent={cto} onClick={() => setDrawerAgent(cto)} />}
          <Empty />
          {cmo && <AgentNode agent={cmo} onClick={() => setDrawerAgent(cmo)} />}
        </div>

        {/* Connector: Row 2 to Row 3 */}
        <div className="relative" style={{ height: 48 }}>
          <div className="absolute" style={{ top: 0, bottom: 0, width: 1, background: "#3D3B36", left: stub, transform: "translateX(-0.5px)" }} />
          <div className="absolute" style={{ top: 0, bottom: 0, width: 1, background: "#3D3B36", right: stub, transform: "translateX(0.5px)" }} />
          <div className="absolute" style={{ top: 24, height: 1, background: "#3D3B36", left: "50%", right: stub }} />
          <div className="absolute" style={{ top: 24, bottom: 0, width: 1, background: "#3D3B36", left: "50%", transform: "translateX(-0.5px)" }} />
        </div>

        {/* Row 3: Developer, Designer, Marketing */}
        <div className="grid grid-cols-3 gap-4">
          {dev && <AgentNode agent={dev} onClick={() => setDrawerAgent(dev)} />}
          {des && <AgentNode agent={des} onClick={() => setDrawerAgent(des)} />}
          {mkt && <AgentNode agent={mkt} onClick={() => setDrawerAgent(mkt)} />}
        </div>
      </div>

      <AgentDrawer agent={drawerAgent} onClose={() => setDrawerAgent(null)} />
    </div>
  );
}
