"use client";

import { useEffect, useState, use } from "react";
import { useAction } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Eyebrow } from "@/lib/dashboard/primitives";

type Metrics =
  | { configured: false }
  | { configured: true; error: string }
  | {
      configured: true;
      totalRevenueCents: number;
      last30dRevenueCents: number;
      customerCount: number;
      dailyRevenueCents: number[];
    };

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const num = new Intl.NumberFormat("en-US");

function MetricTile({
  eyebrow,
  value,
  footnote,
}: {
  eyebrow: string;
  value: string;
  footnote?: string;
}) {
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
      {footnote && (
        <div className="font-mono mt-1.5" style={{ fontSize: 14, color: "#8E8B82" }}>
          {footnote}
        </div>
      )}
    </div>
  );
}

function Sparkline({ ticks }: { ticks: number[] }) {
  const max = Math.max(1, ...ticks);
  const points = ticks
    .map((v, i) => {
      const x = (i / Math.max(1, ticks.length - 1)) * 600;
      const y = 110 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 600 120" style={{ width: "100%", height: 120 }}>
      <line x1="0" y1="119" x2="600" y2="119" stroke="#BFBCB1" strokeWidth="1" />
      <polyline fill="none" stroke="#FAFAF7" strokeWidth="1.5" points={points} />
      {ticks.map((v, i) => {
        const x = (i / Math.max(1, ticks.length - 1)) * 600;
        const y = 110 - (v / max) * 100;
        return (
          <circle key={i} cx={x} cy={y} r="2" fill="#F2C744" stroke="#FAFAF7" strokeWidth="1" />
        );
      })}
    </svg>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#1A1815",
        border: "1px solid #26241F",
        padding: 20,
        borderRadius: 8,
      }}
    >
      {children}
    </div>
  );
}

export default function RevenuePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const getStripeMetrics = useAction(api.stripe.getStripeMetrics);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const result = await getStripeMetrics({
        projectId: projectId as Id<"projects">,
      });
      setMetrics(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <div style={{ padding: "20px 24px" }}>
      <div className="flex items-center justify-between">
        <Eyebrow>Revenue · Stripe</Eyebrow>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="font-mono uppercase"
          style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            color: "#8E8B82",
            background: "transparent",
            border: "1px solid #26241F",
            padding: "6px 10px",
            borderRadius: 6,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="mt-3.5">
        {loading && metrics === null ? (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  background: "#1A1815",
                  border: "1px solid #26241F",
                  padding: "16px 18px",
                  borderRadius: 8,
                  height: 120,
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        ) : metrics && metrics.configured === false ? (
          <Card>
            <div style={{ color: "#FAFAF7", fontSize: 16, fontWeight: 600 }}>
              Stripe not connected
            </div>
            <div
              className="font-mono mt-2"
              style={{ fontSize: 14, color: "#8E8B82" }}
            >
              Ask the CEO agent to connect your Stripe account so revenue metrics show up here.
            </div>
            <Link
              href={`/projects/${projectId}/ceo-chat?new=1&prefill=${encodeURIComponent(
                "Use this Stripe API key for my revenue statistics: ",
              )}`}
              className="font-mono uppercase inline-block mt-4"
              style={{
                fontSize: 12,
                letterSpacing: "0.14em",
                color: "#FAFAF7",
                border: "1px solid #26241F",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              Open CEO chat →
            </Link>
          </Card>
        ) : metrics && "error" in metrics ? (
          <Card>
            <div style={{ color: "#C8483A", fontSize: 16, fontWeight: 600 }}>
              Stripe error
            </div>
            <div
              className="font-mono mt-2"
              style={{ fontSize: 14, color: "#8E8B82", whiteSpace: "pre-wrap" }}
            >
              {metrics.error}
            </div>
          </Card>
        ) : metrics ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <MetricTile
                eyebrow="All-time revenue"
                value={usd.format(metrics.totalRevenueCents / 100)}
                footnote="Stripe · successful charges"
              />
              <MetricTile
                eyebrow="Last 30 days"
                value={usd.format(metrics.last30dRevenueCents / 100)}
                footnote="Rolling 30d window"
              />
              <MetricTile
                eyebrow="Customers"
                value={num.format(metrics.customerCount)}
                footnote="Stripe customer objects"
              />
            </div>
            <div style={{ marginTop: 24 }}>
              <Card>
                <div className="flex justify-between items-baseline mb-3.5">
                  <span
                    className="font-mono uppercase"
                    style={{ fontSize: 14, color: "#8E8B82", letterSpacing: "0.14em" }}
                  >
                    Last 30 days · daily
                  </span>
                  <span className="font-mono" style={{ fontSize: 14, color: "#2E8B57" }}>
                    {"▲ "}
                    {usd.format(metrics.last30dRevenueCents / 100)}
                  </span>
                </div>
                <Sparkline ticks={metrics.dailyRevenueCents} />
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
