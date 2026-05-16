"use client";

import { Html } from "@react-three/drei";
import { OFFICE_D, OFFICE_W, ROOMS, WALLS, WALL_H } from "./layout";

const FLOOR_BASE = "#0F0E0C";
const WALL_COLOR = "#36302A";
const WALL_TRIM = "#1A1612";

export function Office() {
  return (
    <group>
      {/* Outer floor (dark void surrounding the office) */}
      <mesh receiveShadow position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[OFFICE_W * 1.4, OFFICE_D * 1.4]} />
        <meshStandardMaterial color={FLOOR_BASE} />
      </mesh>

      {/* Per-room floors (gives each room a distinct tone) */}
      {ROOMS.map((r) => {
        const cx = (r.xMin + r.xMax) / 2;
        const cz = (r.zMin + r.zMax) / 2;
        const w = r.xMax - r.xMin;
        const d = r.zMax - r.zMin;
        return (
          <mesh
            key={r.key}
            receiveShadow
            position={[cx, 0, cz]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial color={r.floorColor} roughness={0.9} />
          </mesh>
        );
      })}

      {/* Walls */}
      {WALLS.map((w, i) => (
        <group key={i} position={[w.x + w.w / 2, WALL_H / 2, w.z + w.d / 2]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[w.w, WALL_H, w.d]} />
            <meshStandardMaterial color={WALL_COLOR} roughness={0.85} />
          </mesh>
          {/* Trim line along top */}
          <mesh position={[0, WALL_H / 2 - 0.05, 0]}>
            <boxGeometry args={[w.w + 0.01, 0.08, w.d + 0.01]} />
            <meshStandardMaterial color={WALL_TRIM} />
          </mesh>
        </group>
      ))}

      {/* Room labels — billboarded HTML at floor level */}
      {ROOMS.map((r) => {
        const cx = (r.xMin + r.xMax) / 2;
        const cz = (r.zMin + r.zMax) / 2;
        return (
          <Html
            key={`label-${r.key}`}
            position={[cx, 0.01, cz]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "#D9C4A8",
                opacity: 0.55,
                whiteSpace: "nowrap",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                fontWeight: 700,
              }}
            >
              {r.label}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
