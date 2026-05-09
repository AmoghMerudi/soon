"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROLES, SEED_AGENTS } from "@/lib/dashboard/constants";
import { Avatar, Btn } from "@/lib/dashboard/primitives";

const NAV_ITEMS = [
  { id: "tickets",  href: "/dashboard/tickets",   label: "Tickets",  glyph: "◆" },
  { id: "agents",   href: "/dashboard/agents",    label: "Agents",   glyph: "●" },
  { id: "ceo-chat", href: "/dashboard/ceo-chat",  label: "CEO Chat", glyph: "✉" },
  { id: "revenue",  href: "/dashboard/revenue",   label: "Revenue",  glyph: "$" },
];

function TopBar({
  paused,
  onPause,
  onChatCEO,
  onNewCompany,
}: {
  paused: boolean;
  onPause: () => void;
  onChatCEO: () => void;
  onNewCompany: () => void;
}) {
  const live = !paused;
  return (
    <div
      className="flex items-center shrink-0 px-5 gap-5"
      style={{
        height: 56,
        background: "#0A0A0A",
        borderBottom: "1px solid #26241F",
      }}
    >
      <span
        className="font-sans font-bold"
        style={{ fontSize: 22, letterSpacing: "-0.045em", color: "#FAFAF7" }}
      >
        0to1<span style={{ color: "#F2C744" }}>.</span>
      </span>
      <div className="flex-1 flex items-center gap-3.5">
        <span
          className="font-mono"
          style={{ fontSize: 14, color: "#8E8B82", letterSpacing: "0.04em" }}
        >
          /dashboard
        </span>
        {live && (
          <span
            className="inline-flex items-center gap-1.5 font-mono uppercase"
            style={{ fontSize: 12, color: "#F2C744", letterSpacing: "0.14em" }}
          >
            <span
              className="pulse rounded-full"
              style={{ width: 6, height: 6, background: "#F2C744" }}
            />
            Live
          </span>
        )}
      </div>
      <Btn kind="ghost" onClick={onPause}>
        <span style={{ color: "#FAFAF7" }}>
          {paused ? "▶ Resume" : "❚❚ Pause agents"}
        </span>
      </Btn>
      <Btn kind="secondary" onClick={onChatCEO}>
        ✉ Chat CEO
      </Btn>
      <Btn kind="signal" onClick={onNewCompany}>
        + New company
      </Btn>
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const agents = SEED_AGENTS;
  const activeId = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  )?.id;

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        width: 240,
        background: "#0F0E0C",
        borderRight: "1px solid #26241F",
        padding: "20px 0",
        gap: 18,
        height: "100%",
      }}
    >
      {/* Workspace */}
      <div style={{ padding: "0 20px" }}>
        <div
          className="font-mono font-medium uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "#8E8B82",
            marginBottom: 8,
          }}
        >
          Workspace
        </div>
        <div
          className="font-sans font-semibold"
          style={{ fontSize: 15, color: "#FAFAF7" }}
        >
          Children&apos;s books co.
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 12, color: "#8E8B82", marginTop: 2 }}
        >
          day 1
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col">
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 relative"
              style={{
                background: isActive ? "#26241F" : "transparent",
                border: "none",
                textAlign: "left",
                padding: "10px 20px",
                fontWeight: isActive ? 600 : 500,
                fontSize: 15,
                color: "#FAFAF7",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              {isActive && (
                <span
                  className="absolute left-0"
                  style={{
                    top: 6,
                    bottom: 6,
                    width: 3,
                    background: "#F2C744",
                  }}
                />
              )}
              <span
                className="font-mono"
                style={{ color: "#8E8B82", width: 16, fontSize: 14 }}
              >
                {item.glyph}
              </span>
              {item.label}
            </a>
          );
        })}
      </div>

      {/* Agent status */}
      <div
        style={{
          padding: "0 20px",
          borderTop: "1px solid #26241F",
          paddingTop: 18,
          marginTop: 6,
        }}
      >
        <div
          className="font-mono font-medium uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "#8E8B82",
            marginBottom: 10,
          }}
        >
          Agents
        </div>
        <div className="flex flex-col gap-2">
          {agents.map((a) => (
            <div key={a.role} className="flex items-center gap-2.5">
              <Avatar role={a.role} size={22} />
              <div className="flex-1">
                <div
                  className="font-sans font-medium"
                  style={{ fontSize: 14, color: "#FAFAF7", lineHeight: 1.2 }}
                >
                  {ROLES[a.role].label}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color:
                      a.state === "blocked" ? "#C8483A" : "#8E8B82",
                    letterSpacing: "0.04em",
                  }}
                >
                  {a.state === "working" && (
                    <>
                      <span
                        className="pulse inline-block rounded-full align-middle"
                        style={{
                          width: 5,
                          height: 5,
                          background: "#F2C744",
                          marginRight: 5,
                        }}
                      />
                      working
                    </>
                  )}
                  {a.state === "idle" && "idle"}
                  {a.state === "blocked" && "● blocked"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh", background: "#0A0A0A" }}
    >
      <TopBar
        paused={paused}
        onPause={() => setPaused((p) => !p)}
        onChatCEO={() => router.push("/dashboard/ceo-chat")}
        onNewCompany={() => router.push("/dashboard/ceo-chat")}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar pathname={pathname} />
        <div
          className="flex-1 overflow-y-auto"
          style={{ background: "#0A0A0A" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
