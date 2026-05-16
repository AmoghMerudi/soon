"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { Vector3 } from "three";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { ROLES, type RoleKey } from "@/lib/dashboard/constants";

export type AgentPose = "sitting" | "standing" | "leaning" | "blocked";

const SKIN = "#e2b896";
const HAT = "#1a1612";

export function AgentCharacter({
  role,
  pose,
  rotY = 0,
  isPlayer = false,
}: {
  role: RoleKey;
  pose: AgentPose;
  rotY?: number;
  isPlayer?: boolean;
}) {
  const meta = ROLES[role];
  const group = useRef<Group>(null);
  const torsoRef = useRef<Mesh>(null);
  const headRef = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const unitScale = useMemo(() => new Vector3(1, 1, 1), []);

  // Blocked agents get a pulsing red halo + slight tremor.
  useFrame((_, dt) => {
    if (!group.current) return;
    const t = performance.now() / 1000;

    if (pose === "blocked") {
      const s = 1 + Math.sin(t * 5) * 0.08;
      group.current.scale.setScalar(s);
      if (halo.current) {
        const mat = halo.current.material as MeshStandardMaterial;
        mat.emissiveIntensity = 0.8 + Math.sin(t * 5) * 0.4;
        halo.current.visible = true;
      }
    } else {
      group.current.scale.lerp(unitScale, Math.min(1, dt * 6));
      if (halo.current) halo.current.visible = false;
    }

    // Idle breathing bob on the head
    if (headRef.current) {
      headRef.current.position.y = 1.6 + Math.sin(t * 1.6) * 0.02;
    }

    // Working agents tilt the torso slightly forward (toward their desk)
    if (torsoRef.current) {
      const target = pose === "sitting" ? 0.18 : pose === "leaning" ? 0.12 : 0;
      torsoRef.current.rotation.x = lerp(torsoRef.current.rotation.x, target, dt * 4);
    }
  });

  const torsoY = pose === "sitting" ? 0.65 : 0.95;
  const headY = pose === "sitting" ? 1.3 : 1.7;
  const bodyHeight = pose === "sitting" ? 0.7 : 1.0;
  const legVisible = pose !== "sitting";

  return (
    <group ref={group} rotation={[0, rotY, 0]}>
      {/* Blocked halo (visible only when pose === "blocked") */}
      <mesh ref={halo} position={[0, 1.5, 0]}>
        <torusGeometry args={[0.55, 0.06, 8, 32]} />
        <meshStandardMaterial
          color="#C8483A"
          emissive="#C8483A"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Legs (only when standing/leaning) */}
      {legVisible && (
        <>
          <mesh position={[-0.12, 0.22, 0]} castShadow>
            <boxGeometry args={[0.18, 0.45, 0.18]} />
            <meshStandardMaterial color="#1a1612" />
          </mesh>
          <mesh position={[0.12, 0.22, 0]} castShadow>
            <boxGeometry args={[0.18, 0.45, 0.18]} />
            <meshStandardMaterial color="#1a1612" />
          </mesh>
        </>
      )}

      {/* Torso (role-colored hoodie/jacket) */}
      <mesh ref={torsoRef} position={[0, torsoY, 0]} castShadow>
        <boxGeometry args={[0.7, bodyHeight, 0.45]} />
        <meshStandardMaterial color={meta.color} roughness={0.7} />
        <Outlines thickness={isPlayer ? 3 : 1.5} color="#0a0a0a" />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, headY, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
        <Outlines thickness={1.5} color="#0a0a0a" />
      </mesh>

      {/* Hat / cap */}
      <mesh position={[0, headY + 0.25, 0]} castShadow>
        <boxGeometry args={[0.46, 0.12, 0.46]} />
        <meshStandardMaterial color={role === "ceo" ? "#F2C744" : HAT} />
      </mesh>

      {/* Role-color shoulder accent (a small badge) */}
      <mesh position={[0, torsoY + bodyHeight / 2 - 0.1, 0.24]}>
        <boxGeometry args={[0.18, 0.08, 0.02]} />
        <meshStandardMaterial color={isPlayer ? "#FAFAF7" : meta.color} emissive={meta.color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
