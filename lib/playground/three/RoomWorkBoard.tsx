"use client";

import { Html } from "@react-three/drei";
import { ROLES } from "@/lib/dashboard/constants";
import {
  ROOM_AGENTS,
  ROOM_BOARD_ANCHORS,
  type RoomKey,
} from "./layout";
import type { AgentLiveState, PlaygroundRole } from "./useAgentState";

const BOARD_W = 2.4;
const BOARD_H = 1.6;
const BOARD_D = 0.06;

export function RoomWorkBoards({
  states,
}: {
  states: Record<PlaygroundRole, AgentLiveState> | null;
}) {
  return (
    <>
      {(Object.keys(ROOM_BOARD_ANCHORS) as RoomKey[]).map((roomKey) => {
        const anchor = ROOM_BOARD_ANCHORS[roomKey];
        const roles = ROOM_AGENTS[roomKey];
        if (!anchor || !roles || roles.length === 0) return null;
        return (
          <RoomWorkBoard
            key={roomKey}
            anchor={anchor}
            roles={roles}
            states={states}
          />
        );
      })}
    </>
  );
}

function RoomWorkBoard({
  anchor,
  roles,
  states,
}: {
  anchor: { x: number; y: number; z: number; rotY: number };
  roles: PlaygroundRole[];
  states: Record<PlaygroundRole, AgentLiveState> | null;
}) {
  return (
    <group position={[anchor.x, anchor.y, anchor.z]} rotation={[0, anchor.rotY, 0]}>
      {/* 3D backing slab — the "screen" on the wall */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BOARD_W, BOARD_H, BOARD_D]} />
        <meshStandardMaterial
          color="#15130F"
          emissive="#1F2A45"
          emissiveIntensity={0.25}
          roughness={0.55}
        />
      </mesh>
      {/* Thin frame */}
      <mesh position={[0, 0, BOARD_D / 2 + 0.005]}>
        <boxGeometry args={[BOARD_W + 0.06, BOARD_H + 0.06, 0.02]} />
        <meshStandardMaterial color="#1A1612" />
      </mesh>

      {/* HTML content. drei's <Html> billboards to the camera, so rows always
          read upright regardless of which wall the board is on. */}
      <Html
        position={[0, 0, BOARD_D / 2 + 0.02]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div
          className="font-mono"
          style={{
            width: 220,
            background: "#0F0E0Cee",
            border: "1px solid #3D3B36",
            borderRadius: 3,
            padding: "8px 10px",
            boxShadow: "0 0 18px rgba(31,42,69,0.25)",
          }}
        >
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.22em",
              color: "#8E8B82",
              marginBottom: 6,
            }}
          >
            NOW WORKING
          </div>
          {roles.map((role) => (
            <Row key={role} role={role} live={states?.[role] ?? null} />
          ))}
        </div>
      </Html>
    </group>
  );
}

function Row({
  role,
  live,
}: {
  role: PlaygroundRole;
  live: AgentLiveState | null;
}) {
  const meta = ROLES[role];
  const status = live?.state ?? "idle";
  const dot =
    status === "working" ? "#F2C744"
    : status === "blocked" ? "#C8483A"
    : "#5E5C56";
  const title = live?.currentTicketTitle;
  const detail =
    status === "blocked" && (live?.blockedCount ?? 0) > 0
      ? `BLOCKED · ${live!.blockedCount}`
      : title
        ? truncate(title, 32)
        : "IDLE";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 0",
        borderTop: "1px solid #1A1815",
        fontSize: 10,
        lineHeight: 1.25,
        color: "#FAFAF7",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dot,
          boxShadow: status === "working" ? `0 0 6px ${dot}` : "none",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color: meta.color,
          fontSize: 8,
          letterSpacing: "0.16em",
          fontWeight: 700,
          minWidth: 54,
        }}
      >
        {meta.label.toUpperCase()}
      </span>
      <span
        style={{
          color: title ? "#D9C4A8" : "#5E5C56",
          letterSpacing: "0.02em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {detail}
      </span>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
