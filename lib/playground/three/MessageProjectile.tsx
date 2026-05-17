"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Mesh, type MeshStandardMaterial } from "three";
import { ROLES } from "@/lib/dashboard/constants";
import { DESKS, KANBAN_ANCHOR } from "./layout";
import type { MentionEvent } from "./useTicketMentions";

const TRAVEL_MS = 1400;

function anchorFor(
  who: MentionEvent["from"] | MentionEvent["to"],
  playerPos?: { x: number; z: number },
): [number, number, number] {
  if (who === "founder") {
    if (playerPos) return [playerPos.x, 2.4, playerPos.z];
    return [KANBAN_ANCHOR.x, 2.4, KANBAN_ANCHOR.z];
  }
  const d = DESKS[who];
  return [d.x, 2.4, d.z];
}

export function MessageProjectiles({
  events,
  playerPosRef,
}: {
  events: MentionEvent[];
  playerPosRef: React.MutableRefObject<{ x: number; z: number }>;
}) {
  return (
    <group>
      {events.map((e) => (
        <Projectile key={e.id} event={e} playerPosRef={playerPosRef} />
      ))}
    </group>
  );
}

function Projectile({
  event,
  playerPosRef,
}: {
  event: MentionEvent;
  playerPosRef: React.MutableRefObject<{ x: number; z: number }>;
}) {
  const meshRef = useRef<Mesh>(null);
  const trailRef = useRef<Mesh>(null);

  // Snapshot the founder position at spawn time so the projectile flies from
  // where the player was when they sent it (not wherever they walk to later).
  const from = useMemo(
    // eslint-disable-next-line react-hooks/refs -- intentional one-time snapshot at spawn
    () => anchorFor(event.from, { ...playerPosRef.current }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event.id],
  );
  const to = anchorFor(event.to);
  const color = ROLES[event.to].color;

  // Bezier control point — arc upward midway.
  const ctrl = useMemo<[number, number, number]>(
    () => [
      (from[0] + to[0]) / 2,
      Math.max(from[1], to[1]) + 4,
      (from[2] + to[2]) / 2,
    ],
    [from, to],
  );

  const tmp = useMemo(() => new Vector3(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - event.spawnedAt;
    const t = Math.min(1, elapsed / TRAVEL_MS);

    // Quadratic Bezier
    const u = 1 - t;
    const x = u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0];
    const y = u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1];
    const z = u * u * from[2] + 2 * u * t * ctrl[2] + t * t * to[2];

    meshRef.current.position.set(x, y, z);

    // Fade out near the end
    const mat = meshRef.current.material as MeshStandardMaterial;
    const alpha = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
    mat.opacity = alpha;
    mat.emissiveIntensity = 1.4 * alpha;

    // Slight wobble
    tmp.set(x, y + Math.sin(elapsed / 80) * 0.05, z);
  });

  return (
    <group>
      <mesh ref={meshRef} position={from}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </mesh>
      {/* Soft glow ring */}
      <mesh ref={trailRef} position={from}>
        <ringGeometry args={[0.3, 0.45, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
