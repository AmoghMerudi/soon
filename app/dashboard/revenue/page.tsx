"use client";

import { SEED_REVENUE_TICKS } from "@/lib/dashboard/constants";
import { Eyebrow } from "@/lib/dashboard/primitives";

function MetricTile({
  eyebrow,
  value,
  delta,
  deltaTone = "neutral",
  footnote,
}: {
  eyebrow: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  footnote?: string;
}) {
  const toneColor = deltaTone === "up" ? "#2E8B57" : deltaTone === "down" ? "#C8483A" : "#8E8B82";
  return (
    <div
      style={{
        background: "#1A1815",
        border: "1px solid #26241F",
        padding: "16px 18px",
        borderRadius: 8,
      }}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <div
        className="font-sans font-bold"
        style={{
          fontSize: 44,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "#FAFAF7",
          marginTop: 8,
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        {value}
      </div>
      {delta && (
        <div className="font-mono mt-1.5" style={{ fontSize: 14, color: toneColor }}>
          {delta}
        </div>
      )}
      {footnote && (
        <div className="font-mono mt-1.5" style={{ fontSize: 14, color: "#8E8B82" }}>
          {footnote}
        </div>
      )}
    </div>
  );
}

function Sparkline({ ticks }: { ticks: number[] }) {
  const max = Math.max(...ticks);
  const points = ticks
    .map((v, i) => {
      const x = (i / (ticks.length - 1)) * 600;
      const y = 110 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 600 120" style={{ width: "100%", height: 120 }}>
      <line x1="0" y1="119" x2="600" y2="119" stroke="#BFBCB1" strokeWidth="1" />
      <polyline fill="none" stroke="#FAFAF7" strokeWidth="1.5" points={points} />
      {ticks.map((v, i) => {
        const x = (i / (ticks.length - 1)) * 600;
        const y = 110 - (v / max) * 100;
        return (
          <circle key={i} cx={x} cy={y} r="2" fill="#F2C744" stroke="#FAFAF7" strokeWidth="1" />
        );
      })}
    </svg>
  );
}

const TILES = [
  { eyebrow: "Live revenue", value: "$429.13", delta: "▲ $24.95 · last 1h", deltaTone: "up" as const },
  { eyebrow: "Books shipped", value: "86", delta: "▲ 5 · last 1h", deltaTone: "up" as const },
  { eyebrow: "Avg order", value: "$4.99", footnote: "Stripe · 100% conversion" },
];

export default function RevenuePage() {
  const ticks = SEED_REVENUE_TICKS;
  const total = ticks.reduce((a, b) => a + b, 0).toFixed(2);
  return (
    <div style={{ padding: "20px 24px" }}>
      <Eyebrow>Revenue · Stripe</Eyebrow>
      <div className="grid grid-cols-3 gap-3 mt-3.5">
        {TILES.map((t, i) => (
          <MetricTile key={i} {...t} />
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          background: "#1A1815",
          border: "1px solid #26241F",
          padding: 20,
          borderRadius: 8,
        }}
      >
        <div className="flex justify-between items-baseline mb-3.5">
          <span
            className="font-mono uppercase"
            style={{ fontSize: 14, color: "#8E8B82", letterSpacing: "0.14em" }}
          >
            Last 24h
          </span>
          <span className="font-mono" style={{ fontSize: 14, color: "#2E8B57" }}>
            {"▲"} ${total}
          </span>
        </div>
        <Sparkline ticks={ticks} />
      </div>
    </div>
  );
}
