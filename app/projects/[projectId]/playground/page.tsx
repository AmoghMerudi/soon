"use client";

import dynamic from "next/dynamic";
import { use } from "react";

const PlaygroundScene = dynamic(
  () => import("@/lib/playground/three/Scene").then((m) => m.PlaygroundScene),
  {
    ssr: false,
    loading: () => (
      <div
        className="font-mono"
        style={{
          position: "absolute",
          inset: 0,
          background: "#0A0A0A",
          color: "#D9C4A8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          letterSpacing: "0.18em",
        }}
      >
        LOADING OFFICE…
      </div>
    ),
  },
);

export default function PlaygroundPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <PlaygroundScene projectId={projectId} />
    </div>
  );
}
