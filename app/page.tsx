import Link from "next/link";

export const metadata = {
  title: "0to1 — AI Company OS",
  description:
    "Autonomous AI agents that plan, build, and operate companies. Hand off an idea — ship a business.",
};

const INK = "#0A0A0A";
const PAPER = "#FAFAF7";
const SIGNAL = "#F2C744";
const SIGNAL_INK = "#1A1404";
const CARD = "#1A1815";
const BORDER = "#26241F";
const BORDER_STRONG = "#3D3B36";
const MUTED = "#8E8B82";
const MUTED_LIGHT = "#BFBCB1";

const ROLES = {
  ceo: { label: "CEO", initial: "C", color: "#F2C744", fg: "#0F0E0C" },
  cto: { label: "CTO", initial: "T", color: "#6FBFA0", fg: "#0F0E0C" },
  cmo: { label: "CMO", initial: "M", color: "#9D7AC9", fg: "#FAFAF7" },
  developer: { label: "Developer", initial: "D", color: "#6E8FE5", fg: "#FAFAF7" },
  designer: { label: "Designer", initial: "D", color: "#C97AB0", fg: "#FAFAF7" },
  marketing: { label: "Marketing", initial: "M", color: "#E08A3C", fg: "#FAFAF7" },
};

function Avatar({
  role,
  size = 28,
}: {
  role: keyof typeof ROLES;
  size?: number;
}) {
  const r = ROLES[role];
  return (
    <span
      className="inline-flex items-center justify-center font-mono font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: r.color,
        color: r.fg,
        fontSize: Math.round(size * 0.45),
        letterSpacing: 0,
        flexShrink: 0,
      }}
    >
      {r.initial}
    </span>
  );
}

function StatusPill({
  label,
  bg,
  fg,
  dot,
}: {
  label: string;
  bg: string;
  fg: string;
  dot?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono"
      style={{
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: "3px 9px",
        fontSize: 11,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{ width: 6, height: 6, borderRadius: 999, background: dot }}
        />
      )}
      {label}
    </span>
  );
}

function TopNav() {
  return (
    <header
      className="flex items-center justify-between"
      style={{
        height: 64,
        padding: "0 24px",
        borderBottom: `1px solid ${BORDER}`,
        background: INK,
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-6">
        <span
          className="font-sans font-bold"
          style={{ fontSize: 22, letterSpacing: "-0.045em", color: PAPER }}
        >
          0to1<span style={{ color: SIGNAL }}>.</span>
        </span>
        <span
          className="font-mono uppercase hidden sm:inline-flex items-center gap-1.5"
          style={{ fontSize: 11, color: SIGNAL, letterSpacing: "0.16em" }}
        >
          <span
            className="pulse"
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: SIGNAL,
              display: "inline-block",
            }}
          />
          Live
        </span>
      </div>
      <nav className="flex items-center gap-2">
        <a
          href="#how"
          className="hidden md:inline font-mono"
          style={{
            fontSize: 13,
            color: MUTED_LIGHT,
            padding: "8px 12px",
            letterSpacing: "0.02em",
          }}
        >
          How it works
        </a>
        <a
          href="#agents"
          className="hidden md:inline font-mono"
          style={{
            fontSize: 13,
            color: MUTED_LIGHT,
            padding: "8px 12px",
            letterSpacing: "0.02em",
          }}
        >
          Agents
        </a>
        <a
          href="#stack"
          className="hidden md:inline font-mono"
          style={{
            fontSize: 13,
            color: MUTED_LIGHT,
            padding: "8px 12px",
            letterSpacing: "0.02em",
          }}
        >
          Stack
        </a>
        <Link
          href="/projects"
          className="inline-flex items-center font-sans font-semibold"
          style={{
            background: SIGNAL,
            color: SIGNAL_INK,
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 14,
            letterSpacing: "-0.01em",
          }}
        >
          Launch app →
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section
      style={{
        padding: "96px 24px 72px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid texture */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%)",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <div
          className="font-mono uppercase inline-flex items-center gap-2"
          style={{
            fontSize: 11,
            color: MUTED,
            letterSpacing: "0.18em",
            border: `1px solid ${BORDER}`,
            background: CARD,
            padding: "5px 10px",
            borderRadius: 999,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: SIGNAL,
              display: "inline-block",
            }}
            className="pulse"
          />
          The AI Company OS
        </div>

        <h1
          className="font-sans font-semibold"
          style={{
            fontSize: "clamp(40px, 7vw, 88px)",
            lineHeight: 0.98,
            letterSpacing: "-0.04em",
            margin: 0,
            color: PAPER,
            maxWidth: 980,
          }}
        >
          Hand off an idea.
          <br />
          <span style={{ color: MUTED }}>Ship a </span>
          <span
            style={{
              color: SIGNAL,
              borderBottom: `4px solid ${SIGNAL}`,
              paddingBottom: 4,
            }}
          >
            company
          </span>
          <span style={{ color: PAPER }}>.</span>
        </h1>

        <p
          className="font-sans"
          style={{
            fontSize: 19,
            lineHeight: 1.55,
            color: MUTED_LIGHT,
            marginTop: 28,
            maxWidth: 640,
          }}
        >
          0to1 is a team of autonomous agents — CEO, CTO, CMO, plus their
          builders — that plan workstreams, write code, ship designs, and run
          campaigns. You set the goal. They run the company.
        </p>

        <div
          className="flex items-center gap-3 flex-wrap"
          style={{ marginTop: 36 }}
        >
          <Link
            href="/projects"
            className="inline-flex items-center font-sans font-semibold"
            style={{
              background: SIGNAL,
              color: SIGNAL_INK,
              padding: "14px 22px",
              borderRadius: 10,
              fontSize: 15,
              letterSpacing: "-0.01em",
            }}
          >
            Start a company →
          </Link>
          <a
            href="#how"
            className="inline-flex items-center font-mono"
            style={{
              border: `1px solid ${BORDER_STRONG}`,
              color: PAPER,
              padding: "14px 18px",
              borderRadius: 10,
              fontSize: 13,
              letterSpacing: "0.04em",
            }}
          >
            See it operate
          </a>
        </div>

        <HeroPanel />
      </div>
    </section>
  );
}

function HeroPanel() {
  return (
    <div
      style={{
        marginTop: 64,
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        boxShadow:
          "0 24px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      {/* Mock app top bar */}
      <div
        className="flex items-center"
        style={{
          height: 44,
          padding: "0 16px",
          borderBottom: `1px solid ${BORDER}`,
          gap: 12,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#3D3B36",
            display: "inline-block",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#3D3B36",
            display: "inline-block",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#3D3B36",
            display: "inline-block",
          }}
        />
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            color: MUTED,
            letterSpacing: "0.04em",
            marginLeft: 8,
          }}
        >
          /projects/atlas-press/tickets
        </span>
        <span
          className="ml-auto font-mono uppercase inline-flex items-center gap-1.5"
          style={{ fontSize: 11, color: SIGNAL, letterSpacing: "0.14em" }}
        >
          <span
            className="pulse"
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: SIGNAL,
              display: "inline-block",
            }}
          />
          6 agents working
        </span>
      </div>

      {/* Ticket rows */}
      <div style={{ padding: 8 }}>
        {[
          {
            id: "TKT-0142",
            title: "Wire Stripe webhooks for subscription events",
            role: "developer" as const,
            status: { label: "In progress", bg: "#F2C744", fg: "#1A1404", dot: "#1A1404" },
            priority: "Critical",
          },
          {
            id: "TKT-0141",
            title: "Generate first 3 cover concepts",
            role: "designer" as const,
            status: { label: "In review", bg: "#1F2A45", fg: "#9DB4F0", dot: "#6E8FE5" },
            priority: "High",
          },
          {
            id: "TKT-0149",
            title: "Approve launch creative for X & LinkedIn",
            role: "cmo" as const,
            status: { label: "In review", bg: "#1F2A45", fg: "#9DB4F0", dot: "#6E8FE5" },
            priority: "High",
          },
          {
            id: "TKT-0138",
            title: "Set up Convex schema + auth",
            role: "developer" as const,
            status: { label: "Resolved", bg: "#16321F", fg: "#7FCFA0", dot: "#2E8B57" },
            priority: "Medium",
          },
          {
            id: "TKT-0150",
            title: "Q1 hiring plan + capital allocation",
            role: "ceo" as const,
            status: { label: "Backlog", bg: "#26241F", fg: "#BFBCB1", dot: "#8E8B82" },
            priority: "Low",
          },
        ].map((t, i) => (
          <div
            key={t.id}
            className="flex items-center gap-3"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                color: MUTED,
                letterSpacing: "0.06em",
                width: 70,
                flexShrink: 0,
              }}
            >
              {t.id}
            </span>
            <Avatar role={t.role} size={22} />
            <span
              className="font-sans"
              style={{
                fontSize: 14,
                color: PAPER,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {t.title}
            </span>
            <span
              className="font-mono hidden sm:inline"
              style={{
                fontSize: 11,
                color: MUTED,
                letterSpacing: "0.06em",
              }}
            >
              {t.priority}
            </span>
            <StatusPill
              label={t.status.label}
              bg={t.status.bg}
              fg={t.status.fg}
              dot={t.status.dot}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "You describe a business",
      body: "Pitch the CEO agent like you would a co-founder. One line is enough — it'll ask the right follow-ups.",
      mono: "→ chat with CEO",
    },
    {
      n: "02",
      title: "The org self-organizes",
      body: "CEO decomposes the goal, delegates to CTO and CMO, and they spin up tickets for the Developer, Designer, and Marketing agents.",
      mono: "→ tickets opened",
    },
    {
      n: "03",
      title: "Agents ship, in parallel",
      body: "Code is committed to GitHub. Designs render. Campaigns launch. Every action is a reviewable ticket — you can pause, redirect, or take over.",
      mono: "→ resolved · in review",
    },
    {
      n: "04",
      title: "Revenue, reported back",
      body: "The CEO closes the loop with metrics, then queues the next workstream. The company keeps running while you sleep.",
      mono: "→ MRR, retention, runway",
    },
  ];
  return (
    <section
      id="how"
      style={{ padding: "96px 24px", borderTop: `1px solid ${BORDER}` }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeading
          kicker="How it works"
          title="A company runs itself in four moves."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 56,
          }}
        >
          {steps.map((s) => (
            <div
              key={s.n}
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 240,
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: SIGNAL,
                  letterSpacing: "0.16em",
                }}
              >
                {s.n}
              </span>
              <h3
                className="font-sans font-semibold"
                style={{
                  fontSize: 19,
                  letterSpacing: "-0.02em",
                  color: PAPER,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {s.title}
              </h3>
              <p
                className="font-sans"
                style={{
                  fontSize: 14,
                  color: MUTED_LIGHT,
                  lineHeight: 1.55,
                  margin: 0,
                  flex: 1,
                }}
              >
                {s.body}
              </p>
              <span
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: MUTED,
                  letterSpacing: "0.06em",
                  borderTop: `1px dashed ${BORDER_STRONG}`,
                  paddingTop: 12,
                }}
              >
                {s.mono}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OrgChart() {
  const cellTitle = (
    role: keyof typeof ROLES,
    sub: string,
    tools: string[],
  ) => (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 18,
        minWidth: 200,
        flex: 1,
      }}
    >
      <div className="flex items-center gap-2.5">
        <Avatar role={role} size={32} />
        <div className="flex flex-col">
          <span
            className="font-sans font-semibold"
            style={{
              fontSize: 15,
              letterSpacing: "-0.01em",
              color: PAPER,
            }}
          >
            {ROLES[role].label}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: MUTED, letterSpacing: "0.04em" }}
          >
            {sub}
          </span>
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        {tools.map((t) => (
          <span
            key={t}
            className="font-mono"
            style={{
              fontSize: 10,
              color: MUTED_LIGHT,
              border: `1px solid ${BORDER_STRONG}`,
              borderRadius: 999,
              padding: "2px 8px",
              letterSpacing: "0.04em",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <section
      id="agents"
      style={{ padding: "96px 24px", borderTop: `1px solid ${BORDER}` }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeading
          kicker="The team"
          title="Six agents. One reporting line."
          tagline="Strategy delegates to leadership. Leadership delegates to builders. You stay the board."
        />

        <div style={{ marginTop: 64 }}>
          {/* CEO */}
          <div className="flex justify-center">
            <div style={{ maxWidth: 360, width: "100%" }}>
              {cellTitle("ceo", "Chief strategist", [
                "convex",
                "analytics",
                "strategy",
              ])}
            </div>
          </div>

          {/* CEO → CTO/CMO connector */}
          <div
            aria-hidden
            style={{
              height: 32,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 1, background: BORDER_STRONG }} />
          </div>

          {/* CTO + CMO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              maxWidth: 760,
              margin: "0 auto",
            }}
          >
            {cellTitle("cto", "Engineering lead", [
              "github",
              "convex",
              "vercel",
            ])}
            {cellTitle("cmo", "Brand & growth lead", [
              "analytics",
              "brand",
              "posthog",
            ])}
          </div>

          {/* connectors to executors */}
          <div
            aria-hidden
            style={{
              height: 32,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              maxWidth: 1060,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                borderRight: `1px solid ${BORDER_STRONG}`,
                borderTop: `1px solid ${BORDER_STRONG}`,
                marginRight: "50%",
              }}
            />
            <div style={{ borderTop: `1px solid ${BORDER_STRONG}` }} />
            <div
              style={{
                borderLeft: `1px solid ${BORDER_STRONG}`,
                borderTop: `1px solid ${BORDER_STRONG}`,
                marginLeft: "50%",
              }}
            />
          </div>

          {/* Executors */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {cellTitle("developer", "Builds the product", [
              "e2b",
              "github",
              "vercel",
            ])}
            {cellTitle("designer", "Visual + brand identity", [
              "google-ai",
              "cloudinary",
            ])}
            {cellTitle("marketing", "Distribution & launch", [
              "twitter",
              "linkedin",
              "email",
            ])}
          </div>
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  const items = [
    {
      glyph: "◆",
      title: "Tickets, end-to-end",
      body: "Every action is a ticket — backlog → in progress → review → resolved. Audit, comment, or hand off to a human at any point.",
    },
    {
      glyph: "▤",
      title: "A real GitHub repo",
      body: "The CTO provisions a repository on day one. The Developer commits, opens PRs, and waits for CTO review. You inherit the codebase.",
    },
    {
      glyph: "✉",
      title: "Talk to the CEO",
      body: "A single chat surface to the company. Ask for status, redirect priorities, or pitch a new line of business mid-flight.",
    },
    {
      glyph: "●",
      title: "Memory across runs",
      body: "Agents remember decisions, brand voice, and prior tradeoffs via Mem0. Context survives between sessions.",
    },
    {
      glyph: "$",
      title: "Revenue, in the loop",
      body: "Stripe wired in by default. Marketing reports back conversion. The CEO reallocates based on what's working.",
    },
    {
      glyph: "❚❚",
      title: "Pause anytime",
      body: "One toggle freezes the entire org. Resume when you're ready. No runaway spend.",
    },
  ];
  return (
    <section style={{ padding: "96px 24px", borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeading
          kicker="What's in the box"
          title="An operating system, not a chatbot."
        />
        <div
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 1,
            background: BORDER,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {items.map((it) => (
            <div
              key={it.title}
              style={{
                background: INK,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: 180,
              }}
            >
              <span
                style={{
                  color: SIGNAL,
                  fontSize: 22,
                  fontFamily: "var(--font-geist-mono), monospace",
                  lineHeight: 1,
                }}
              >
                {it.glyph}
              </span>
              <h3
                className="font-sans font-semibold"
                style={{
                  fontSize: 17,
                  letterSpacing: "-0.01em",
                  color: PAPER,
                  margin: "4px 0 0",
                }}
              >
                {it.title}
              </h3>
              <p
                className="font-sans"
                style={{
                  fontSize: 14,
                  color: MUTED_LIGHT,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stack() {
  const tools = [
    "GitHub",
    "Vercel",
    "Convex",
    "Stripe",
    "PostHog",
    "Slack",
    "Linear",
    "X / Twitter",
    "LinkedIn",
    "Google Docs",
    "Cloudinary",
    "E2B",
    "Mem0",
    "Composio",
  ];
  return (
    <section
      id="stack"
      style={{ padding: "96px 24px", borderTop: `1px solid ${BORDER}` }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeading
          kicker="Integrated"
          title="Plugs into the tools your company would already use."
          tagline="Routed through Composio's tool router — the agents discover and call integrations as they need them."
        />
        <div
          style={{
            marginTop: 48,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {tools.map((t) => (
            <span
              key={t}
              className="font-mono"
              style={{
                fontSize: 13,
                color: PAPER,
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 999,
                padding: "8px 14px",
                letterSpacing: "0.02em",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section
      style={{
        padding: "120px 24px",
        borderTop: `1px solid ${BORDER}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 800px 400px at 50% 100%, rgba(242,199,68,0.08), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}
      >
        <h2
          className="font-sans font-semibold"
          style={{
            fontSize: "clamp(36px, 5.5vw, 64px)",
            letterSpacing: "-0.035em",
            lineHeight: 1.02,
            margin: 0,
            color: PAPER,
          }}
        >
          The next company you start
          <br />
          <span style={{ color: SIGNAL }}>doesn&apos;t need a team.</span>
        </h2>
        <p
          className="font-sans"
          style={{
            fontSize: 17,
            color: MUTED_LIGHT,
            marginTop: 24,
            lineHeight: 1.55,
          }}
        >
          Open the app, name a project, and watch the org wake up.
        </p>
        <div
          className="flex justify-center items-center gap-3 flex-wrap"
          style={{ marginTop: 36 }}
        >
          <Link
            href="/projects"
            className="inline-flex items-center font-sans font-semibold"
            style={{
              background: SIGNAL,
              color: SIGNAL_INK,
              padding: "16px 28px",
              borderRadius: 10,
              fontSize: 16,
              letterSpacing: "-0.01em",
            }}
          >
            Start your company →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${BORDER}`,
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span
          className="font-sans font-bold"
          style={{ fontSize: 16, letterSpacing: "-0.045em", color: PAPER }}
        >
          0to1<span style={{ color: SIGNAL }}>.</span>
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            color: MUTED,
            letterSpacing: "0.04em",
          }}
        >
          Autonomous AI agents that plan, build, and operate companies.
        </span>
      </div>
    </footer>
  );
}

function SectionHeading({
  kicker,
  title,
  tagline,
}: {
  kicker: string;
  title: string;
  tagline?: string;
}) {
  return (
    <div style={{ maxWidth: 720 }}>
      <span
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          color: SIGNAL,
          letterSpacing: "0.18em",
        }}
      >
        {kicker}
      </span>
      <h2
        className="font-sans font-semibold"
        style={{
          fontSize: "clamp(30px, 4.2vw, 48px)",
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: PAPER,
          margin: "12px 0 0",
        }}
      >
        {title}
      </h2>
      {tagline && (
        <p
          className="font-sans"
          style={{
            fontSize: 16,
            color: MUTED_LIGHT,
            marginTop: 16,
            lineHeight: 1.55,
          }}
        >
          {tagline}
        </p>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <main style={{ background: INK, color: PAPER, minHeight: "100vh" }}>
      <TopNav />
      <Hero />
      <HowItWorks />
      <OrgChart />
      <Capabilities />
      <Stack />
      <FinalCTA />
      <Footer />
    </main>
  );
}
