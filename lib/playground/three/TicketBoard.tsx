"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useQuery } from "convex/react";
import { Html } from "@react-three/drei";
import type { Mesh, MeshStandardMaterial } from "three";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { STATUS, type StatusKey } from "@/lib/dashboard/constants";
import { KANBAN_ANCHOR } from "./layout";

const COLUMN_ORDER: StatusKey[] = [
  "backlog",
  "in_progress",
  "in_review",
  "blocked",
  "resolved",
];

const COL_W = 1.1;
const COL_GAP = 0.2;
const CUBE_SIZE = 0.5;
const CUBE_GAP = 0.08;
const MAX_PER_COL = 6;

export function TicketBoard({
  projectId,
  onTicketClick,
}: {
  projectId: Id<"projects"> | null;
  onTicketClick?: (ticketId: Id<"tickets">) => void;
}) {
  const backlog = useQuery(
    api.queries.getTicketsByStatus,
    projectId ? { projectId, status: "backlog" } : "skip",
  );
  const inProgress = useQuery(
    api.queries.getTicketsByStatus,
    projectId ? { projectId, status: "in_progress" } : "skip",
  );
  const inReview = useQuery(
    api.queries.getTicketsByStatus,
    projectId ? { projectId, status: "in_review" } : "skip",
  );
  const blocked = useQuery(
    api.queries.getTicketsByStatus,
    projectId ? { projectId, status: "blocked" } : "skip",
  );
  const resolved = useQuery(
    api.queries.getTicketsByStatus,
    projectId ? { projectId, status: "resolved" } : "skip",
  );

  const cols: Record<StatusKey, typeof backlog> = {
    backlog,
    in_progress: inProgress,
    in_review: inReview,
    blocked,
    resolved,
  };

  const totalW = COLUMN_ORDER.length * COL_W + (COLUMN_ORDER.length - 1) * COL_GAP;
  const startX = -totalW / 2 + COL_W / 2;

  return (
    <group position={[KANBAN_ANCHOR.x, 0, KANBAN_ANCHOR.z]}>
      {/* Conference table base (the kanban sits on top of it) */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[totalW + 1.2, 0.08, 2.2]} />
        <meshStandardMaterial color="#3A2412" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[totalW + 1.0, 0.4, 2.0]} />
        <meshStandardMaterial color="#5A3A20" roughness={0.7} />
      </mesh>

      {COLUMN_ORDER.map((status, i) => {
        const x = startX + i * (COL_W + COL_GAP);
        const tickets = cols[status];
        const list = (tickets ?? []).slice(0, MAX_PER_COL);
        return (
          <group key={status} position={[x, 0.5, 0]}>
            {/* Column label */}
            <Html
              position={[0, 0.05, -0.95]}
              center
              style={{ pointerEvents: "none" }}
            >
              <div
                className="font-mono"
                style={{
                  fontSize: 8,
                  letterSpacing: "0.16em",
                  color: STATUS[status].dot,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  background: "#0F0E0Cdd",
                  padding: "2px 6px",
                  border: `1px solid ${STATUS[status].dot}66`,
                  borderRadius: 2,
                }}
              >
                {STATUS[status].label.toUpperCase()}
                {tickets ? ` · ${tickets.length}` : ""}
              </div>
            </Html>

            {/* Ticket cubes stacked */}
            {list.map((t, j) => (
              <TicketCube
                key={t._id}
                index={j}
                status={status}
                title={t.title}
                dispatching={t.dispatchStatus === "running"}
                onClick={() => onTicketClick?.(t._id)}
              />
            ))}

            {/* Overflow indicator */}
            {tickets && tickets.length > MAX_PER_COL && (
              <Html
                position={[0, 0.05, MAX_PER_COL * (CUBE_SIZE + CUBE_GAP) - 0.4]}
                center
                style={{ pointerEvents: "none" }}
              >
                <div
                  className="font-mono"
                  style={{
                    fontSize: 8,
                    color: "#8E8B82",
                    letterSpacing: "0.1em",
                  }}
                >
                  +{tickets.length - MAX_PER_COL}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function TicketCube({
  index,
  status,
  title,
  dispatching,
  onClick,
}: {
  index: number;
  status: StatusKey;
  title: string;
  dispatching: boolean;
  onClick: () => void;
}) {
  const mesh = useRef<Mesh>(null);
  const z = -0.7 + index * (CUBE_SIZE + CUBE_GAP);
  const color = STATUS[status].dot;

  useFrame(() => {
    if (!mesh.current) return;
    const mat = mesh.current.material as MeshStandardMaterial;
    const t = performance.now() / 1000;
    if (status === "blocked") {
      mat.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.4;
    } else if (dispatching) {
      mat.emissiveIntensity = 0.4 + Math.sin(t * 6) * 0.3;
    } else if (status === "in_progress") {
      mat.emissiveIntensity = 0.25;
    } else {
      mat.emissiveIntensity = 0.05;
    }
  });

  return (
    <mesh
      ref={mesh}
      position={[0, CUBE_SIZE / 2, z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
      castShadow
    >
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.1}
        roughness={0.5}
      />
      {/* Title tooltip on hover — simple HTML always rendered tiny */}
      <Html
        position={[0, CUBE_SIZE / 2 + 0.15, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: 7,
            color: "#D9C4A8",
            opacity: 0.55,
            maxWidth: 70,
            textAlign: "center",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title.slice(0, 16)}
        </div>
      </Html>
    </mesh>
  );
}
