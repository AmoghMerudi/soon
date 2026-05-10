"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useProjectId } from "@/lib/dashboard/project-context";
import { Avatar, Btn } from "@/lib/dashboard/primitives";
import { MarkdownMessage } from "@/lib/dashboard/markdown-message";

type Category =
  | "plan"
  | "analysis"
  | "report"
  | "strategy"
  | "brief"
  | "spec"
  | "other";

const CATEGORY_LABELS: Record<Category, { label: string; color: string }> = {
  plan: { label: "Plan", color: "#F2C744" },
  analysis: { label: "Analysis", color: "#5B9EF4" },
  report: { label: "Report", color: "#8B5CF6" },
  strategy: { label: "Strategy", color: "#F97316" },
  brief: { label: "Brief", color: "#10B981" },
  spec: { label: "Spec", color: "#EC4899" },
  other: { label: "Other", color: "#8E8B82" },
};

const ALL_CATEGORIES: Category[] = [
  "plan",
  "analysis",
  "report",
  "strategy",
  "brief",
  "spec",
  "other",
];

function CategoryBadge({ category }: { category: Category }) {
  const info = CATEGORY_LABELS[category];
  return (
    <span
      className="inline-flex items-center font-mono uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.06em",
        color: info.color,
        background: info.color + "18",
        borderRadius: 4,
        padding: "2px 8px",
      }}
    >
      {info.label}
    </span>
  );
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RepositoryPage() {
  const projectId = useProjectId();
  const deliverables = useQuery(api.queries.getDeliverables, {
    projectId: projectId as Id<"projects">,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");

  const filtered =
    deliverables?.filter(
      (d) => filterCategory === "all" || d.category === filterCategory
    ) ?? [];

  const selected = filtered.find((d) => d._id === selectedId) ?? null;

  return (
    <div className="flex h-full" style={{ background: "#0A0A0A" }}>
      {/* Left: List */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: 380,
          borderRight: "1px solid #26241F",
          height: "100%",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0 px-5"
          style={{
            height: 56,
            borderBottom: "1px solid #26241F",
          }}
        >
          <h1
            className="font-sans font-semibold"
            style={{ fontSize: 18, color: "#FAFAF7" }}
          >
            Repository
          </h1>
          <span
            className="font-mono"
            style={{ fontSize: 12, color: "#8E8B82" }}
          >
            {filtered.length} deliverable{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Category filter */}
        <div
          className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto shrink-0"
          style={{ borderBottom: "1px solid #1A1915" }}
        >
          <button
            onClick={() => setFilterCategory("all")}
            className="font-mono shrink-0"
            style={{
              fontSize: 11,
              letterSpacing: "0.04em",
              padding: "4px 10px",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              background:
                filterCategory === "all" ? "#26241F" : "transparent",
              color: filterCategory === "all" ? "#FAFAF7" : "#8E8B82",
            }}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="font-mono shrink-0"
              style={{
                fontSize: 11,
                letterSpacing: "0.04em",
                padding: "4px 10px",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background:
                  filterCategory === cat ? "#26241F" : "transparent",
                color:
                  filterCategory === cat
                    ? CATEGORY_LABELS[cat].color
                    : "#8E8B82",
              }}
            >
              {CATEGORY_LABELS[cat].label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {!deliverables && (
            <div
              className="flex items-center justify-center font-mono"
              style={{ padding: 40, color: "#8E8B82", fontSize: 13 }}
            >
              Loading...
            </div>
          )}
          {deliverables && filtered.length === 0 && (
            <div
              className="flex flex-col items-center justify-center gap-2"
              style={{ padding: 40, color: "#8E8B82" }}
            >
              <span style={{ fontSize: 28, opacity: 0.4 }}>&#9744;</span>
              <span className="font-mono" style={{ fontSize: 13 }}>
                No deliverables yet
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 11, maxWidth: 240, textAlign: "center" }}
              >
                Agents will save plans, analyses, and reports here as they work.
              </span>
            </div>
          )}
          {filtered.map((d) => {
            const isSelected = selectedId === d._id;
            return (
              <button
                key={d._id}
                onClick={() => setSelectedId(d._id)}
                className="w-full text-left relative"
                style={{
                  padding: "14px 20px",
                  background: isSelected ? "#1A1915" : "transparent",
                  borderBottom: "1px solid #1A1915",
                  border: "none",
                  borderLeft: isSelected
                    ? "3px solid #F2C744"
                    : "3px solid transparent",
                  cursor: "pointer",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CategoryBadge category={d.category as Category} />
                  <span
                    className="font-mono"
                    style={{ fontSize: 11, color: "#8E8B82" }}
                  >
                    {formatDate(d.createdAt)}
                  </span>
                </div>
                <div
                  className="font-sans font-medium"
                  style={{
                    fontSize: 14,
                    color: isSelected ? "#FAFAF7" : "#E6E3DA",
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}
                >
                  {d.title}
                </div>
                <div className="flex items-center gap-2">
                  <Avatar role={d.createdBy.toLowerCase() as "ceo" | "cto" | "cmo" | "developer" | "designer" | "marketing" | "user"} size={16} />
                  <span
                    className="font-mono"
                    style={{ fontSize: 11, color: "#8E8B82" }}
                  >
                    {d.createdBy}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Detail */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: "#8E8B82" }}
          >
            <span style={{ fontSize: 36, opacity: 0.3 }}>&#128196;</span>
            <span className="font-mono" style={{ fontSize: 14 }}>
              Select a deliverable to view
            </span>
          </div>
        ) : (
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 40px" }}>
            {/* Title + meta */}
            <div className="flex items-start gap-3 mb-1">
              <CategoryBadge category={selected.category as Category} />
            </div>
            <h2
              className="font-sans font-bold"
              style={{
                fontSize: 24,
                color: "#FAFAF7",
                lineHeight: 1.25,
                marginTop: 10,
                marginBottom: 8,
              }}
            >
              {selected.title}
            </h2>
            <div
              className="flex items-center gap-3 mb-6"
              style={{ color: "#8E8B82" }}
            >
              <div className="flex items-center gap-1.5">
                <Avatar role={selected.createdBy.toLowerCase() as "ceo" | "cto" | "cmo" | "developer" | "designer" | "marketing" | "user"} size={18} />
                <span className="font-mono" style={{ fontSize: 12 }}>
                  {selected.createdBy}
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: 12 }}>
                {formatDate(selected.createdAt)}
              </span>
              {selected.updatedAt !== selected.createdAt && (
                <span className="font-mono" style={{ fontSize: 12 }}>
                  Updated {formatDate(selected.updatedAt)}
                </span>
              )}
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "#26241F",
                marginBottom: 24,
              }}
            />

            {/* Body */}
            <MarkdownMessage text={selected.body} variant="assistant" />
          </div>
        )}
      </div>
    </div>
  );
}
