"use client";

import { useEffect, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import { AgentCharacter } from "./AgentCharacter";
import {
  DESKS,
  PLAYER_SPAWN,
  WALLS,
  rectsOverlap,
  type Footprint,
} from "./layout";
import type { PlaygroundRole } from "./useAgentState";

const PLAYER_SPEED = 6.5; // world units per second
const PLAYER_FOOT_W = 0.55;
const PLAYER_FOOT_D = 0.55;
const INTERACT_RADIUS = 3.2;

// Desks also collide. Build their footprints from DESKS.
const DESK_FOOT_W = 2.4;
const DESK_FOOT_D = 1.2;
const DESK_RECTS: Footprint[] = Object.values(DESKS).map((d) => ({
  x: d.x - DESK_FOOT_W / 2,
  z: d.z - DESK_FOOT_D / 2,
  w: DESK_FOOT_W,
  d: DESK_FOOT_D,
}));

const WALL_RECTS: Footprint[] = WALLS.map((w) => ({
  x: w.x,
  z: w.z,
  w: w.w,
  d: w.d,
}));

const ALL_RECTS: Footprint[] = [...WALL_RECTS, ...DESK_RECTS];

function collides(x: number, z: number): boolean {
  const foot: Footprint = {
    x: x - PLAYER_FOOT_W / 2,
    z: z - PLAYER_FOOT_D / 2,
    w: PLAYER_FOOT_W,
    d: PLAYER_FOOT_D,
  };
  for (const r of ALL_RECTS) {
    if (rectsOverlap(foot, r)) return true;
  }
  return false;
}

function findClosestRole(x: number, z: number): { role: PlaygroundRole; dist: number } | null {
  let best: { role: PlaygroundRole; dist: number } | null = null;
  for (const [role, d] of Object.entries(DESKS) as [PlaygroundRole, typeof DESKS[PlaygroundRole]][]) {
    const dist = Math.hypot(d.x - x, d.z - z);
    if (!best || dist < best.dist) best = { role, dist };
  }
  return best;
}

export type PlayerHandle = {
  position: { x: number; z: number };
};

export function Player({
  positionRef,
  onClosestRoleChange,
  onInteract,
  paused,
}: {
  /** Shared ref for player XZ position — components that need live position
   * read this directly to avoid forcing Scene re-renders per frame. */
  positionRef: React.MutableRefObject<{ x: number; z: number }>;
  onClosestRoleChange: (role: PlaygroundRole | null) => void;
  onInteract: (role: PlaygroundRole) => void;
  paused: boolean;
}) {
  const group = useRef<Group>(null);
  const rotY = useRef(0);
  const keys = useRef<Set<string>>(new Set());
  const pausedRef = useRef(paused);
  const lastClosestRef = useRef<PlaygroundRole | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }
      keys.current.add(k);
      if (k === "e" && !pausedRef.current) {
        const c = findClosestRole(positionRef.current.x, positionRef.current.z);
        if (c && c.dist <= INTERACT_RADIUS) onInteract(c.role);
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onInteract, positionRef]);

  useFrame((_, dt) => {
    if (pausedRef.current) return;

    let dx = 0;
    let dz = 0;
    const k = keys.current;
    // In our world: camera looks roughly down +X+Z mix. We map W=−Z (north), S=+Z, A=−X, D=+X.
    if (k.has("w") || k.has("arrowup")) dz -= 1;
    if (k.has("s") || k.has("arrowdown")) dz += 1;
    if (k.has("a") || k.has("arrowleft")) dx -= 1;
    if (k.has("d") || k.has("arrowright")) dx += 1;

    if (dx !== 0 || dz !== 0) {
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;
      const stepX = dx * PLAYER_SPEED * dt;
      const stepZ = dz * PLAYER_SPEED * dt;

      let nx = positionRef.current.x + stepX;
      let nz = positionRef.current.z;
      if (collides(nx, nz)) nx = positionRef.current.x;
      nz = positionRef.current.z + stepZ;
      if (collides(nx, nz)) nz = positionRef.current.z;

      positionRef.current.x = nx;
      positionRef.current.z = nz;
      rotY.current = Math.atan2(dx, dz);
    }

    if (group.current) {
      group.current.position.set(positionRef.current.x, 0, positionRef.current.z);
      group.current.rotation.y = rotY.current;
    }

    // Only notify React state when closest role changes — avoids per-frame re-renders.
    const c = findClosestRole(positionRef.current.x, positionRef.current.z);
    const next = c && c.dist <= INTERACT_RADIUS ? c.role : null;
    if (next !== lastClosestRef.current) {
      lastClosestRef.current = next;
      onClosestRoleChange(next);
    }
  });

  return (
    <group ref={group} position={[PLAYER_SPAWN.x, 0, PLAYER_SPAWN.z]}>
      <AgentCharacter role="user" pose="standing" isPlayer />
    </group>
  );
}

export function preventBubbling(e: ThreeEvent<MouseEvent>) {
  e.stopPropagation();
}
