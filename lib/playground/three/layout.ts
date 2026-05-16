import type { RoleKey } from "@/lib/dashboard/constants";

// World space: X to the right, Z toward the camera (down on the map), Y is up.
// The whole office sits centered on the origin on the XZ plane.

export const OFFICE_W = 64; // X span
export const OFFICE_D = 40; // Z span
export const WALL_H = 3.2;
export const WALL_THICKNESS = 0.4;
export const DOOR_W = 4;

// Bounding rect in XZ for ease of authoring rooms (origin-centered).
const X_MIN = -OFFICE_W / 2;
const X_MAX = OFFICE_W / 2;
const Z_MIN = -OFFICE_D / 2;
const Z_MAX = OFFICE_D / 2;

// Row Z boundaries
const RECEP_Z = Z_MIN + 8; // reception spans the top 8 units of Z
const MID_Z = 6; // mid row bottom (Z=−12 .. 6)
const HALL_Z = 9; // hallway (Z=6 .. 9)
// Bottom row continues from HALL_Z to Z_MAX

// Column X boundaries for mid row
const MID_C1 = X_MIN + 19; // boardroom | kitchen
const MID_C2 = X_MIN + 39; // kitchen | engineering
// Column X boundaries for bottom row
const BOT_C1 = X_MIN + 22; // design | founder
const BOT_C2 = X_MIN + 42; // founder | marketing

export type RoomKey =
  | "reception"
  | "boardroom"
  | "kitchen"
  | "engineering"
  | "hallway"
  | "design"
  | "founder_office"
  | "marketing";

export type Room = {
  key: RoomKey;
  label: string;
  // XZ rect
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  floorColor: string;
};

export const ROOMS: Room[] = [
  { key: "reception",      label: "RECEPTION",       xMin: X_MIN,  xMax: X_MAX,  zMin: Z_MIN,   zMax: RECEP_Z, floorColor: "#2d241b" },
  { key: "boardroom",      label: "BOARDROOM",       xMin: X_MIN,  xMax: MID_C1, zMin: RECEP_Z, zMax: MID_Z,   floorColor: "#3a2434" },
  { key: "kitchen",        label: "KITCHEN · LOUNGE",xMin: MID_C1, xMax: MID_C2, zMin: RECEP_Z, zMax: MID_Z,   floorColor: "#1f2f44" },
  { key: "engineering",    label: "ENGINEERING",     xMin: MID_C2, xMax: X_MAX,  zMin: RECEP_Z, zMax: MID_Z,   floorColor: "#262017" },
  { key: "hallway",        label: "HALLWAY",         xMin: X_MIN,  xMax: X_MAX,  zMin: MID_Z,   zMax: HALL_Z,  floorColor: "#1a1612" },
  { key: "design",         label: "DESIGN STUDIO",   xMin: X_MIN,  xMax: BOT_C1, zMin: HALL_Z,  zMax: Z_MAX,   floorColor: "#2f3a25" },
  { key: "founder_office", label: "FOUNDER'S OFFICE",xMin: BOT_C1, xMax: BOT_C2, zMin: HALL_Z,  zMax: Z_MAX,   floorColor: "#2a1c12" },
  { key: "marketing",      label: "MARKETING POD",   xMin: BOT_C2, xMax: X_MAX,  zMin: HALL_Z,  zMax: Z_MAX,   floorColor: "#3d2418" },
];

// Walls as XZ rectangles (treated as boxes of WALL_H height).
export type WallRect = { x: number; z: number; w: number; d: number };

const walls: WallRect[] = [];
const push = (w: WallRect) => walls.push(w);

// Perimeter (full sides)
push({ x: X_MIN, z: Z_MIN, w: OFFICE_W, d: WALL_THICKNESS });            // top (north) wall
push({ x: X_MIN, z: Z_MAX - WALL_THICKNESS, w: OFFICE_W, d: WALL_THICKNESS }); // bottom
push({ x: X_MIN, z: Z_MIN, w: WALL_THICKNESS, d: OFFICE_D });            // left
push({ x: X_MAX - WALL_THICKNESS, z: Z_MIN, w: WALL_THICKNESS, d: OFFICE_D }); // right

// Helper to lay a wall segment along X (running east-west) with a door cutout at doorX.
function wallAlongX(z: number, fromX: number, toX: number, doorX: number | null) {
  if (doorX === null) {
    push({ x: fromX, z, w: toX - fromX, d: WALL_THICKNESS });
    return;
  }
  const leftW = doorX - fromX;
  const rightFrom = doorX + DOOR_W;
  if (leftW > 0) push({ x: fromX, z, w: leftW, d: WALL_THICKNESS });
  if (toX - rightFrom > 0) push({ x: rightFrom, z, w: toX - rightFrom, d: WALL_THICKNESS });
}

function wallAlongZ(x: number, fromZ: number, toZ: number, doorZ: number | null) {
  if (doorZ === null) {
    push({ x, z: fromZ, w: WALL_THICKNESS, d: toZ - fromZ });
    return;
  }
  const topH = doorZ - fromZ;
  const botFrom = doorZ + DOOR_W;
  if (topH > 0) push({ x, z: fromZ, w: WALL_THICKNESS, d: topH });
  if (toZ - botFrom > 0) push({ x, z: botFrom, w: WALL_THICKNESS, d: toZ - botFrom });
}

// Reception | (Boardroom + Kitchen + Engineering)  — one wide central door
wallAlongX(RECEP_Z, X_MIN + WALL_THICKNESS, X_MAX - WALL_THICKNESS, -DOOR_W / 2);

// Boardroom | Kitchen  — door in mid of vertical wall
wallAlongZ(MID_C1, RECEP_Z, MID_Z, (RECEP_Z + MID_Z) / 2 - DOOR_W / 2);
// Kitchen | Engineering
wallAlongZ(MID_C2, RECEP_Z, MID_Z, (RECEP_Z + MID_Z) / 2 - DOOR_W / 2);

// Mid row | Hallway  — three doors (one per room)
const midDoor1 = (X_MIN + MID_C1) / 2 - DOOR_W / 2;
const midDoor2 = (MID_C1 + MID_C2) / 2 - DOOR_W / 2;
const midDoor3 = (MID_C2 + X_MAX) / 2 - DOOR_W / 2;
wallAlongX(MID_Z, X_MIN + WALL_THICKNESS, MID_C1, midDoor1);
wallAlongX(MID_Z, MID_C1, MID_C2, midDoor2);
wallAlongX(MID_Z, MID_C2, X_MAX - WALL_THICKNESS, midDoor3);

// Hallway | Bottom row
const botDoor1 = (X_MIN + BOT_C1) / 2 - DOOR_W / 2;
const botDoor2 = (BOT_C1 + BOT_C2) / 2 - DOOR_W / 2;
const botDoor3 = (BOT_C2 + X_MAX) / 2 - DOOR_W / 2;
wallAlongX(HALL_Z, X_MIN + WALL_THICKNESS, BOT_C1, botDoor1);
wallAlongX(HALL_Z, BOT_C1, BOT_C2, botDoor2);
wallAlongX(HALL_Z, BOT_C2, X_MAX - WALL_THICKNESS, botDoor3);

// Design | Founder | Marketing vertical walls
wallAlongZ(BOT_C1, HALL_Z, Z_MAX, (HALL_Z + Z_MAX) / 2 - DOOR_W / 2);
wallAlongZ(BOT_C2, HALL_Z, Z_MAX, (HALL_Z + Z_MAX) / 2 - DOOR_W / 2);

export const WALLS: WallRect[] = walls;

// Player spawn — middle of reception.
export const PLAYER_SPAWN = { x: 0, z: Z_MIN + 4 };

// Per-role desk anchors (where the agent sits + where the desk is rendered).
// `facing` points the agent's body toward their monitor.
export type DeskAnchor = {
  // Center of the desk on XZ.
  x: number;
  z: number;
  // Rotation around Y in radians (0 = facing −Z). Desk + agent face this direction.
  rotY: number;
};

export const DESKS: Record<Exclude<RoleKey, "user">, DeskAnchor> = {
  // CEO sits at the head of the boardroom table (north end of boardroom).
  ceo:       { x: X_MIN + 4,           z: RECEP_Z + 3.5, rotY: Math.PI }, // facing south into the table
  // CTO at the first engineering desk
  cto:       { x: MID_C2 + 5,          z: RECEP_Z + 4.5, rotY: Math.PI },
  // Developer at the second engineering desk
  developer: { x: MID_C2 + 11,         z: RECEP_Z + 4.5, rotY: Math.PI },
  // Designer in the design studio
  designer:  { x: X_MIN + 8,           z: HALL_Z + 6,    rotY: Math.PI },
  // CMO at the presenter desk in marketing
  cmo:       { x: BOT_C2 + 6,          z: HALL_Z + 5,    rotY: Math.PI },
  // Marketing at the second marketing desk
  marketing: { x: BOT_C2 + 12,         z: HALL_Z + 5,    rotY: Math.PI },
};

// Kanban board sits on the boardroom long table (boardroom rear).
export const KANBAN_ANCHOR = {
  x: X_MIN + 11,
  z: RECEP_Z + 4.5,
};

// Camera target — center of the office, raised slightly.
export const CAMERA_TARGET: [number, number, number] = [0, 0, 0];
export const CAMERA_POSITION: [number, number, number] = [38, 44, 38];
export const CAMERA_ZOOM = 16;

// Helper: AABB collision check on XZ. Treats input as a foot rect.
export type Footprint = { x: number; z: number; w: number; d: number };

export function rectsOverlap(a: Footprint, b: Footprint): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.z < b.z + b.d &&
    a.z + a.d > b.z
  );
}
