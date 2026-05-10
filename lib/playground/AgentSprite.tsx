"use client";

import { ROLES, type RoleKey } from "@/lib/dashboard/constants";
import { PlaygroundSprite, PLAYGROUND_SPRITE_W, PLAYGROUND_SPRITE_H } from "./sprites";

export const SPRITE_HEIGHT = 80;
export const SPRITE_WIDTH = (SPRITE_HEIGHT * PLAYGROUND_SPRITE_W) / PLAYGROUND_SPRITE_H;
const LABEL_HEIGHT = 16;

export function AgentSprite({
  role,
  x,
  y,
  selected,
  onSelect,
}: {
  role: RoleKey;
  x: number;
  y: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = ROLES[role].label;
  const ring = ROLES[role].color;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        position: "absolute",
        left: x - SPRITE_WIDTH / 2,
        top: y - SPRITE_HEIGHT,
        width: SPRITE_WIDTH,
        height: SPRITE_HEIGHT + LABEL_HEIGHT,
        cursor: "pointer",
        userSelect: "none",
        zIndex: Math.floor(y),
      }}
    >
      {selected && (
        <div
          style={{
            position: "absolute",
            left: -6,
            top: -6,
            width: SPRITE_WIDTH + 12,
            height: SPRITE_HEIGHT + 12,
            border: `2px solid ${ring}`,
            borderRadius: 8,
            boxShadow: `0 0 16px ${ring}88`,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ width: SPRITE_WIDTH, height: SPRITE_HEIGHT }}>
        <PlaygroundSprite role={role} height={SPRITE_HEIGHT} />
      </div>
      <div
        className="font-mono"
        style={{
          marginTop: 2,
          textAlign: "center",
          fontSize: 10,
          letterSpacing: "0.1em",
          color: "#FAFAF7",
          textShadow: "0 1px 2px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.7)",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
    </div>
  );
}
