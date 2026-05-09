"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ProjectsPage() {
  const router = useRouter();
  const projects = useQuery(api.projects.listProjects);
  const createProject = useMutation(api.projects.createProject);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const id = await createProject({ name: trimmed });
      router.push(`/projects/${id}/tickets`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#FAFAF7",
        padding: "60px 24px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1
          className="font-sans font-semibold"
          style={{
            fontSize: 32,
            letterSpacing: "-0.02em",
            margin: 0,
            marginBottom: 24,
          }}
        >
          Projects
        </h1>

        <div
          style={{
            background: "#1A1815",
            border: "1px solid #26241F",
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name…"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid #3D3B36",
              color: "#FAFAF7",
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: 8,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="cursor-pointer"
            style={{
              padding: "8px 16px",
              background: name.trim() ? "#F2C744" : "#26241F",
              color: name.trim() ? "#1A1404" : "#5E5C56",
              border: "none",
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + New
          </button>
        </div>

        {projects === undefined ? (
          <div
            className="font-mono"
            style={{ color: "#5E5C56", fontSize: 13, padding: 32, textAlign: "center" }}
          >
            Loading…
          </div>
        ) : projects.length === 0 ? (
          <div
            className="font-mono"
            style={{ color: "#5E5C56", fontSize: 13, padding: 40, textAlign: "center" }}
          >
            No projects yet — create one above.
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 8 }}>
            {projects.map((p) => (
              <button
                key={p._id}
                onClick={() => router.push(`/projects/${p._id}/tickets`)}
                className="text-left cursor-pointer"
                style={{
                  background: "#1A1815",
                  border: "1px solid #26241F",
                  borderRadius: 10,
                  padding: "14px 16px",
                  color: "inherit",
                  fontFamily: "inherit",
                }}
              >
                <div
                  className="font-sans font-semibold"
                  style={{ fontSize: 15, color: "#FAFAF7" }}
                >
                  {p.name}
                </div>
                {p.description && (
                  <div
                    className="font-mono"
                    style={{ fontSize: 12, color: "#8E8B82", marginTop: 4 }}
                  >
                    {p.description}
                  </div>
                )}
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: "#5E5C56",
                    marginTop: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  Created {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
