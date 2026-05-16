"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh, MeshStandardMaterial } from "three";
import { ROLES, type RoleKey } from "@/lib/dashboard/constants";
import { AgentCharacter, type AgentPose } from "./AgentCharacter";
import { ToolBadge } from "./ToolBadge";
import type { AgentLiveState } from "./useAgentState";

const DESK_W = 2.2;
const DESK_D = 1.1;
const DESK_H = 0.85;
const DESK_COLOR = "#5C3A1E";
const DESK_HI = "#7A4F2A";
const MONITOR_FRAME = "#1A1815";
const SCREEN_OFF = "#0A1018";
const KEYBOARD = "#26241F";

function poseForState(state: AgentLiveState["state"]): AgentPose {
  if (state === "working") return "sitting";
  if (state === "blocked") return "blocked";
  return "standing"; // idle
}

export function AgentDesk({
  role,
  anchor,
  live,
  highlighted,
}: {
  role: Exclude<RoleKey, "user">;
  anchor: { x: number; z: number; rotY: number };
  live: AgentLiveState | null;
  highlighted: boolean;
}) {
  const screen = useRef<Mesh>(null);
  const desk = useRef<Mesh>(null);
  const meta = ROLES[role];

  // Drive monitor emissive based on state. Working = bright code colors.
  // Idle = dim. Blocked = red.
  useFrame((_, dt) => {
    if (!screen.current) return;
    const mat = screen.current.material as MeshStandardMaterial;
    const t = performance.now() / 1000;

    let target = 0.05;
    let r = 0.0;
    let g = 0.0;
    let b = 0.0;
    if (live?.state === "working") {
      target = 0.9 + Math.sin(t * 6) * 0.15;
      // Code-screen tinted blue/green
      r = 0.2; g = 0.7; b = 0.6;
    } else if (live?.state === "blocked") {
      target = 0.6 + Math.sin(t * 5) * 0.3;
      r = 0.78; g = 0.28; b = 0.22;
    } else {
      target = 0.1;
      r = 0.18; g = 0.35; b = 0.5;
    }
    mat.emissiveIntensity = lerp(mat.emissiveIntensity, target, dt * 4);
    mat.emissive.setRGB(
      lerp(mat.emissive.r, r, dt * 4),
      lerp(mat.emissive.g, g, dt * 4),
      lerp(mat.emissive.b, b, dt * 4),
    );

    // Highlight pulse on desk when the player is nearby and can press E.
    if (desk.current) {
      const deskMat = desk.current.material as MeshStandardMaterial;
      const target = highlighted ? 0.35 + Math.sin(t * 4) * 0.15 : 0;
      deskMat.emissiveIntensity = lerp(deskMat.emissiveIntensity, target, dt * 6);
    }
  });

  const pose = poseForState(live?.state ?? "idle");

  // Agent sits in front of desk, on the side toward the player (away from monitor).
  // Desk faces rotY (monitor away). Agent stands on the opposite side.
  const agentBackZ = 0.85; // how far behind the desk center

  return (
    <group position={[anchor.x, 0, anchor.z]} rotation={[0, anchor.rotY, 0]}>
      {/* Desk */}
      <mesh ref={desk} position={[0, DESK_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DESK_W, DESK_H, DESK_D]} />
        <meshStandardMaterial
          color={DESK_COLOR}
          emissive={meta.color}
          emissiveIntensity={0}
          roughness={0.7}
        />
      </mesh>
      {/* Desk top highlight */}
      <mesh position={[0, DESK_H + 0.005, 0]}>
        <boxGeometry args={[DESK_W + 0.02, 0.04, DESK_D + 0.02]} />
        <meshStandardMaterial color={DESK_HI} />
      </mesh>

      {/* Monitor frame */}
      <mesh position={[0, DESK_H + 0.5, -DESK_D / 2 + 0.1]} castShadow>
        <boxGeometry args={[1.1, 0.7, 0.08]} />
        <meshStandardMaterial color={MONITOR_FRAME} />
      </mesh>
      {/* Monitor screen (emissive) */}
      <mesh
        ref={screen}
        position={[0, DESK_H + 0.5, -DESK_D / 2 + 0.16]}
      >
        <planeGeometry args={[1.0, 0.6]} />
        <meshStandardMaterial
          color={SCREEN_OFF}
          emissive={"#0a1018"}
          emissiveIntensity={0.05}
          toneMapped={false}
        />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, DESK_H + 0.15, -DESK_D / 2 + 0.18]}>
        <boxGeometry args={[0.12, 0.18, 0.08]} />
        <meshStandardMaterial color={MONITOR_FRAME} />
      </mesh>

      {/* Keyboard on desk */}
      <mesh position={[0, DESK_H + 0.02, 0.15]}>
        <boxGeometry args={[0.7, 0.04, 0.22]} />
        <meshStandardMaterial color={KEYBOARD} />
      </mesh>

      {/* Chair (only meaningful visually when agent is sitting; always shown) */}
      <mesh position={[0, 0.45, agentBackZ - 0.05]} castShadow>
        <boxGeometry args={[0.6, 0.06, 0.55]} />
        <meshStandardMaterial color="#1A1815" />
      </mesh>
      <mesh position={[0, 0.85, agentBackZ + 0.22]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.08]} />
        <meshStandardMaterial color="#1A1815" />
      </mesh>

      {/* The agent character — placed slightly behind the desk, facing the monitor */}
      <group position={[0, pose === "sitting" ? 0.5 : 0, agentBackZ]}>
        <AgentCharacter role={role} pose={pose} rotY={Math.PI} />
      </group>

      {/* Tool badge (live activity) above the agent. The current ticket title
          lives on the per-room wall board now (see RoomWorkBoard.tsx). */}
      <BadgeFor live={live} />

      {/* Role label at desk front */}
      <Html
        position={[0, 0.05, -DESK_D / 2 - 0.05]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: 8,
            letterSpacing: "0.18em",
            color: meta.color,
            fontWeight: 700,
            opacity: 0.7,
            whiteSpace: "nowrap",
          }}
        >
          {meta.label.toUpperCase()}
        </div>
      </Html>
    </group>
  );
}

function BadgeFor({ live }: { live: AgentLiveState | null }) {
  if (!live) return null;
  if (live.activeStep) {
    return (
      <ToolBadge
        position={[0, 2.6, 0.85]}
        kind="active"
        toolName={live.activeStep.toolName}
        startedAt={live.activeStep.startedAt}
      />
    );
  }
  if (live.isThinking) {
    return <ToolBadge position={[0, 2.6, 0.85]} kind="thinking" />;
  }
  if (live.lastStep) {
    return (
      <ToolBadge
        position={[0, 2.6, 0.85]}
        kind="last"
        toolName={live.lastStep.toolName}
        durationMs={live.lastStep.durationMs}
        failed={live.lastStep.status === "failed"}
      />
    );
  }
  if (live.state === "blocked") {
    return <ToolBadge position={[0, 2.6, 0.85]} kind="idle" label="blocked" />;
  }
  return <ToolBadge position={[0, 2.6, 0.85]} kind="idle" />;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
