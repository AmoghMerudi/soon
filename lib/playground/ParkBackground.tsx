"use client";

export const PARK_WIDTH = 960;
export const PARK_HEIGHT = 600;

const FENCE_THICKNESS = 24;

export const FENCE_BOUNDS = {
  minX: FENCE_THICKNESS,
  minY: FENCE_THICKNESS,
  maxX: PARK_WIDTH - FENCE_THICKNESS,
  maxY: PARK_HEIGHT - FENCE_THICKNESS,
};

const GRASS = "#4F8A3A";
const GRASS_DARK = "#3F6B2D";
const PATH = "#B8975F";
const PATH_DARK = "#9C7A48";
const FENCE_WOOD = "#7A4F2A";
const FENCE_WOOD_DARK = "#5C3A1E";
const TRUNK = "#3A2412";
const LEAF = "#2D6B3F";
const LEAF_DARK = "#1F4D2C";
const FLOWER_PINK = "#E08AC9";
const FLOWER_YELLOW = "#F2C744";

function GrassTexture() {
  const tufts: { x: number; y: number; c: string }[] = [];
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 220; i++) {
    tufts.push({
      x: Math.floor(rand() * PARK_WIDTH),
      y: Math.floor(rand() * PARK_HEIGHT),
      c: rand() > 0.5 ? GRASS_DARK : "#5C9A45",
    });
  }
  return (
    <>
      {tufts.map((t, i) => (
        <rect key={i} x={t.x} y={t.y} width={2} height={2} fill={t.c} />
      ))}
    </>
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} shapeRendering="crispEdges">
      {/* trunk */}
      <rect x={14} y={36} width={8} height={18} fill={TRUNK} />
      {/* leaves */}
      <rect x={6} y={6} width={24} height={6} fill={LEAF_DARK} />
      <rect x={2} y={12} width={32} height={18} fill={LEAF} />
      <rect x={6} y={30} width={24} height={6} fill={LEAF_DARK} />
      <rect x={10} y={14} width={4} height={4} fill={LEAF_DARK} />
      <rect x={22} y={20} width={4} height={4} fill={LEAF_DARK} />
    </g>
  );
}

function Flower({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <g transform={`translate(${x}, ${y})`} shapeRendering="crispEdges">
      <rect x={2} y={0} width={2} height={2} fill={c} />
      <rect x={0} y={2} width={2} height={2} fill={c} />
      <rect x={4} y={2} width={2} height={2} fill={c} />
      <rect x={2} y={2} width={2} height={2} fill={FLOWER_YELLOW} />
      <rect x={2} y={4} width={2} height={2} fill={c} />
    </g>
  );
}

function FencePost({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} shapeRendering="crispEdges">
      <rect x={0} y={0} width={8} height={24} fill={FENCE_WOOD} />
      <rect x={0} y={0} width={8} height={3} fill={FENCE_WOOD_DARK} />
      <rect x={6} y={0} width={2} height={24} fill={FENCE_WOOD_DARK} />
    </g>
  );
}

function FenceRailH({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} shapeRendering="crispEdges">
      <rect x={0} y={0} width={w} height={4} fill={FENCE_WOOD} />
      <rect x={0} y={3} width={w} height={1} fill={FENCE_WOOD_DARK} />
    </g>
  );
}

function FenceRailV({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} shapeRendering="crispEdges">
      <rect x={0} y={0} width={4} height={h} fill={FENCE_WOOD} />
      <rect x={3} y={0} width={1} height={h} fill={FENCE_WOOD_DARK} />
    </g>
  );
}

function Fence() {
  const postSpacing = 48;
  const posts: { x: number; y: number }[] = [];
  // Top + bottom posts
  for (let x = 0; x <= PARK_WIDTH - 8; x += postSpacing) {
    posts.push({ x, y: 0 });
    posts.push({ x, y: PARK_HEIGHT - 24 });
  }
  // Left + right posts (skip corners already added)
  for (let y = postSpacing; y <= PARK_HEIGHT - 24 - postSpacing; y += postSpacing) {
    posts.push({ x: 0, y });
    posts.push({ x: PARK_WIDTH - 8, y });
  }

  return (
    <g>
      {/* Horizontal rails (top + bottom) */}
      <FenceRailH x={0} y={6} w={PARK_WIDTH} />
      <FenceRailH x={0} y={16} w={PARK_WIDTH} />
      <FenceRailH x={0} y={PARK_HEIGHT - 18} w={PARK_WIDTH} />
      <FenceRailH x={0} y={PARK_HEIGHT - 8} w={PARK_WIDTH} />
      {/* Vertical rails (left + right) */}
      <FenceRailV x={6} y={0} h={PARK_HEIGHT} />
      <FenceRailV x={16} y={0} h={PARK_HEIGHT} />
      <FenceRailV x={PARK_WIDTH - 18} y={0} h={PARK_HEIGHT} />
      <FenceRailV x={PARK_WIDTH - 8} y={0} h={PARK_HEIGHT} />
      {/* Posts on top */}
      {posts.map((p, i) => (
        <FencePost key={i} x={p.x} y={p.y} />
      ))}
    </g>
  );
}

function Path() {
  // A simple horizontal dirt path through the middle
  const y = PARK_HEIGHT / 2 - 24;
  return (
    <g shapeRendering="crispEdges">
      <rect x={FENCE_THICKNESS} y={y} width={PARK_WIDTH - FENCE_THICKNESS * 2} height={48} fill={PATH} />
      <rect x={FENCE_THICKNESS} y={y} width={PARK_WIDTH - FENCE_THICKNESS * 2} height={2} fill={PATH_DARK} />
      <rect x={FENCE_THICKNESS} y={y + 46} width={PARK_WIDTH - FENCE_THICKNESS * 2} height={2} fill={PATH_DARK} />
    </g>
  );
}

export function ParkBackground() {
  return (
    <svg
      width={PARK_WIDTH}
      height={PARK_HEIGHT}
      viewBox={`0 0 ${PARK_WIDTH} ${PARK_HEIGHT}`}
      shapeRendering="crispEdges"
      style={{ display: "block", imageRendering: "pixelated" }}
    >
      {/* Grass base */}
      <rect x={0} y={0} width={PARK_WIDTH} height={PARK_HEIGHT} fill={GRASS} />
      <GrassTexture />

      {/* Path */}
      <Path />

      {/* Trees in the corners and around the field */}
      <Tree x={60} y={60} />
      <Tree x={PARK_WIDTH - 96} y={60} />
      <Tree x={60} y={PARK_HEIGHT - 96} />
      <Tree x={PARK_WIDTH - 96} y={PARK_HEIGHT - 96} />
      <Tree x={PARK_WIDTH / 2 - 18} y={80} />
      <Tree x={PARK_WIDTH / 2 - 18} y={PARK_HEIGHT - 116} />

      {/* Flowers scattered */}
      <Flower x={140} y={140} c={FLOWER_PINK} />
      <Flower x={180} y={420} c={FLOWER_YELLOW} />
      <Flower x={760} y={160} c={FLOWER_YELLOW} />
      <Flower x={820} y={460} c={FLOWER_PINK} />
      <Flower x={420} y={120} c={FLOWER_PINK} />
      <Flower x={540} y={460} c={FLOWER_YELLOW} />

      {/* Fence on top so it visually contains the field */}
      <Fence />
    </svg>
  );
}
