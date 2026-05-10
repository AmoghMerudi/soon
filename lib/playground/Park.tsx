"use client";

import { useEffect, useRef, useState } from "react";
import { ROLES, type RoleKey } from "@/lib/dashboard/constants";
import {
  OfficeBackground,
  OFFICE_WIDTH as PARK_WIDTH,
  OFFICE_HEIGHT as PARK_HEIGHT,
  WALL_RECTS,
} from "./OfficeBackground";
import { PlaygroundSprite } from "./sprites";
import type { SpriteId } from "./sprites";
import { AgentInfoDrawer } from "./AgentInfoDrawer";

// ---- Logical sizing ----
const SPRITE_HEIGHT = 64;
const SPRITE_WIDTH = (SPRITE_HEIGHT * 24) / 32;
const FEET_W = 16;
const FEET_H = 8;
const PLAYER_SPEED = 140; // px/s logical
const INTERACT_RADIUS = 64;

// Agents posted at their stations.
const NPC_POSITIONS: Record<Exclude<RoleKey, "user">, { x: number; y: number }> = {
  ceo:       { x: 110, y: 220 },
  cto:       { x: 625, y: 200 },
  developer: { x: 805, y: 200 },
  designer:  { x: 200, y: 510 },
  cmo:       { x: 650, y: 480 },
  marketing: { x: 835, y: 540 },
};

const NPC_LIST = Object.entries(NPC_POSITIONS) as [
  Exclude<RoleKey, "user">,
  { x: number; y: number },
][];

// NPC feet-rects act as walls so the player can't walk through them.
const NPC_WALLS = NPC_LIST.map(([, p]) => ({
  x: p.x - FEET_W / 2,
  y: p.y - FEET_H / 2,
  w: FEET_W,
  h: FEET_H,
}));

const ALL_WALLS = [...WALL_RECTS, ...NPC_WALLS];

function intersectsAny(px: number, py: number) {
  const left = px - FEET_W / 2;
  const right = px + FEET_W / 2;
  const top = py - FEET_H / 2;
  const bottom = py + FEET_H / 2;
  for (const r of ALL_WALLS) {
    if (
      right > r.x &&
      left < r.x + r.w &&
      bottom > r.y &&
      top < r.y + r.h
    ) {
      return true;
    }
  }
  return false;
}

type Facing = "down" | "up" | "left" | "right";

export function Park() {
  // Scaling to fit container
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // Player position (logical). Spawn in the central corridor facing up.
  const [player, setPlayer] = useState({ x: 480, y: 470 });
  const [facing, setFacing] = useState<Facing>("up");
  const [moving, setMoving] = useState(false);
  const [tick, setTick] = useState(0); // for walking bob frame
  const [talkingTo, setTalkingTo] = useState<RoleKey | null>(null);
  const talkingToRef = useRef<RoleKey | null>(null);
  talkingToRef.current = talkingTo;

  const keysDown = useRef<Set<string>>(new Set());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w / PARK_WIDTH, h / PARK_HEIGHT);
      setScale(s > 0 ? s : 1);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)
      ) {
        e.preventDefault();
      }
      keysDown.current.add(k);

      if (k === "escape") {
        setTalkingTo(null);
      }
      if (k === "e") {
        // Toggle: close if open, else open closest within radius.
        if (talkingToRef.current) {
          setTalkingTo(null);
        } else {
          const closest = findClosestNpc(player.x, player.y);
          if (closest && closest.dist <= INTERACT_RADIUS) {
            setTalkingTo(closest.role);
          }
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [player.x, player.y]);

  // Movement loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Don't move while talking
      if (!talkingToRef.current) {
        let dx = 0;
        let dy = 0;
        const k = keysDown.current;
        if (k.has("arrowup") || k.has("w")) dy -= 1;
        if (k.has("arrowdown") || k.has("s")) dy += 1;
        if (k.has("arrowleft") || k.has("a")) dx -= 1;
        if (k.has("arrowright") || k.has("d")) dx += 1;

        const isMoving = dx !== 0 || dy !== 0;
        setMoving(isMoving);

        if (isMoving) {
          // Normalize diagonal
          const len = Math.hypot(dx, dy) || 1;
          dx /= len;
          dy /= len;

          // Update facing — prefer dominant axis
          if (Math.abs(dx) > Math.abs(dy)) {
            setFacing(dx < 0 ? "left" : "right");
          } else {
            setFacing(dy < 0 ? "up" : "down");
          }

          setPlayer((p) => {
            const stepX = dx * PLAYER_SPEED * dt;
            const stepY = dy * PLAYER_SPEED * dt;
            let nx = p.x + stepX;
            let ny = p.y;
            if (intersectsAny(nx, ny)) nx = p.x;
            ny = p.y + stepY;
            if (intersectsAny(nx, ny)) ny = p.y;
            return { x: nx, y: ny };
          });

          // Bob frame counter (used by sprite for walking)
          setTick((t) => (t + dt * 6) % 1000);
        }
      } else {
        setMoving(false);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const closest = findClosestNpc(player.x, player.y);
  const promptRole =
    closest && closest.dist <= INTERACT_RADIUS && !talkingTo ? closest.role : null;

  // Build render list and depth-sort by Y.
  type Entity = {
    id: string;
    role: SpriteId;
    x: number;
    y: number;
    isPlayer?: boolean;
    label?: string;
    highlight?: boolean;
  };
  const entities: Entity[] = [
    ...NPC_LIST.map(([role, p]) => ({
      id: role,
      role: role as SpriteId,
      x: p.x,
      y: p.y,
      label: ROLES[role].label,
      highlight: promptRole === role,
    })),
    {
      id: "founder",
      role: "founder" as SpriteId,
      x: player.x,
      y: player.y,
      isPlayer: true,
      label: "You",
    },
  ];
  entities.sort((a, b) => a.y - b.y);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#0A0A0A",
      }}
    >
      <div
        style={{
          width: PARK_WIDTH,
          height: PARK_HEIGHT,
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <OfficeBackground />
        </div>

        {entities.map((ent) => (
          <Entity
            key={ent.id}
            role={ent.role}
            x={ent.x}
            y={ent.y}
            label={ent.label}
            highlight={ent.highlight}
            facing={ent.isPlayer ? facing : "down"}
            walking={!!ent.isPlayer && moving}
            walkTick={tick}
            promptShown={!ent.isPlayer && promptRole === ent.id}
          />
        ))}

        {/* HUD */}
        <Hud talking={!!talkingTo} />

        {/* Drawer */}
        {talkingTo && talkingTo !== "user" && (
          <AgentInfoDrawer role={talkingTo} onClose={() => setTalkingTo(null)} />
        )}
      </div>
    </div>
  );
}

function findClosestNpc(px: number, py: number) {
  let best: { role: RoleKey; dist: number } | null = null;
  for (const [role, p] of NPC_LIST) {
    const d = Math.hypot(p.x - px, p.y - py);
    if (!best || d < best.dist) best = { role, dist: d };
  }
  return best;
}

function Entity({
  role,
  x,
  y,
  label,
  highlight,
  facing,
  walking,
  walkTick,
  promptShown,
}: {
  role: SpriteId;
  x: number;
  y: number;
  label?: string;
  highlight?: boolean;
  facing: Facing;
  walking: boolean;
  walkTick: number;
  promptShown?: boolean;
}) {
  const flipX = facing === "left";
  const bob = walking ? Math.round(Math.sin(walkTick * Math.PI) * 1) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x - SPRITE_WIDTH / 2,
        top: y - SPRITE_HEIGHT + bob,
        width: SPRITE_WIDTH,
        height: SPRITE_HEIGHT,
        zIndex: Math.floor(y),
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {highlight && (
        <div
          style={{
            position: "absolute",
            left: -5,
            top: -5,
            width: SPRITE_WIDTH + 10,
            height: SPRITE_HEIGHT + 10,
            border: "2px solid #F2C744",
            borderRadius: 6,
            boxShadow: "0 0 16px #F2C74488",
            pointerEvents: "none",
          }}
        />
      )}
      {promptShown && (
        <div
          className="font-mono"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: -22,
            background: "#F2C744",
            color: "#1A1404",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            padding: "2px 6px",
            borderRadius: 3,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
          }}
        >
          ▲ PRESS E
        </div>
      )}
      <PlaygroundSprite role={role} height={SPRITE_HEIGHT} flipX={flipX} />
      {label && (
        <div
          className="font-mono"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: SPRITE_HEIGHT - 2,
            fontSize: 9,
            letterSpacing: "0.1em",
            color: "#FAFAF7",
            textShadow: "0 1px 2px rgba(0,0,0,0.95)",
            textTransform: "uppercase",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function Hud({ talking }: { talking: boolean }) {
  return (
    <div
      className="font-mono"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 8,
        display: "flex",
        justifyContent: "center",
        gap: 16,
        fontSize: 10,
        letterSpacing: "0.16em",
        color: "#F4F1E8",
        textShadow: "0 1px 2px rgba(0,0,0,0.9)",
        pointerEvents: "none",
      }}
    >
      <span>WASD / ARROWS · MOVE</span>
      <span style={{ color: "#F2C744" }}>E · {talking ? "CLOSE" : "TALK"}</span>
      <span>ESC · CLOSE</span>
    </div>
  );
}
