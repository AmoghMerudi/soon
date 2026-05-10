"use client";

export const OFFICE_WIDTH = 1280;
export const OFFICE_HEIGHT = 800;

const PERIM_T = 14;
const WALL_T = 6;
const TOP_BAND = 36;
const DOOR_W = 80;

// ---- Palette ----
const VOID = "#0A0A0A";
const PLANK_A = "#6B5340";
const PLANK_B = "#5C4632";
const PLANK_C = "#7A6248";
const GRAIN = "#3A2A1F";
const RUG_BOARD = "#3D2230";
const RUG_BOARD_HI = "#5C3A4A";
const RUG_LOUNGE = "#1F3D5A";
const RUG_LOUNGE_HI = "#2D5476";
const RUG_DESIGN = "#3A4D2A";
const RUG_DESIGN_HI = "#516B3D";
const RUG_FOUNDER = "#3A2412";

const WALL = "#36302A";
const WALL_HI = "#4D453C";
const WALL_TRIM = "#1A1612";
const BASEBOARD = "#26201B";
const DOORFRAME = "#9C7A48";
const DOORFRAME_DARK = "#6B4F2A";

const HEADER_BG = "#0F0E0C";
const HEADER_FG = "#F2C744";
const ROOM_LABEL = "#D9C4A8";
const ROOM_LABEL_DIM = "#8E7A5E";

const DESK = "#7A4F2A";
const DESK_HI = "#9C7A48";
const DESK_DARK = "#5C3A1E";
const MONITOR_FRAME = "#1A1815";
const MONITOR_BEZEL = "#26241F";
const SCREEN_DARK = "#0A1018";
const CODE_GREEN = "#7FCFA0";
const CODE_BLUE = "#6E8FE5";
const CODE_PINK = "#E08AC9";
const KEYBOARD = "#26241F";

const TABLE = "#3A2412";
const TABLE_HI = "#5A3A20";
const TABLE_GLOSS = "#8B6F47";
const CHAIR = "#1A1815";
const CHAIR_HI = "#3D3B36";

const SERVER = "#1A1815";
const SERVER_RIM = "#3D3B36";
const SERVER_LIGHT = "#7FCFA0";
const SERVER_LIGHT_AMBER = "#F2C744";

const EASEL = "#9C7A48";
const EASEL_DARK = "#6B4F2A";
const CANVAS = "#F4F1E8";
const PALETTE_PINK = "#E08AC9";
const PALETTE_TEAL = "#2D6B7E";
const PALETTE_YELLOW = "#F2C744";
const PALETTE_RED = "#C8483A";

const PIN_FRAME = "#3A2412";
const PIN_BG = "#8B6F47";
const POSTER_BLUE = "#1B3A6F";
const POSTER_RED = "#C8483A";
const POSTER_YELLOW = "#F2C744";
const POSTER_TEAL = "#2D6B7E";

const COUCH = "#3A2438";
const COUCH_HI = "#5C3A56";
const COUCH_LEG = "#1A1815";

const COFFEE_MACHINE = "#1F1A14";
const COFFEE_MACHINE_HI = "#3D3B36";
const COFFEE_LIQ = "#3A2412";
const MUG = "#F4F1E8";

const PLANT_POT = "#7A2A20";
const PLANT_POT_HI = "#9C3A28";
const PLANT_LEAF = "#2D6B3F";
const PLANT_LEAF_DARK = "#1F4D2C";
const PLANT_LEAF_HI = "#4D8A5A";

const BOOK_RED = "#8B2A20";
const BOOK_GREEN = "#2D6B4F";
const BOOK_BLUE = "#1B3A6F";
const BOOK_GOLD = "#9C7A48";
const SHELF = "#5C3A1E";

const FRIDGE = "#D9D4C8";
const FRIDGE_DARK = "#A8A39A";
const SCREEN_PRESENTER = "#1B3A6F";

const WHITEBOARD_FRAME = "#9C7A48";
const WHITEBOARD = "#F4F1E8";

const PAPER = "#F4F1E8";
const NOTEBOOK = "#7A2A20";

type Rect = { x: number; y: number; w: number; h: number };

export const WALL_RECTS: Rect[] = [];
const push = (r: Rect) => WALL_RECTS.push(r);

// ============================================================
// ROOM LAYOUT  (1280 × 800)
// ============================================================
//
// Top band:        0–TOP_BAND (header)
// Reception:       y=TOP_BAND..150  (full width entry)
// Mid row:         y=150..420       (Boardroom | Kitchen | Engineering)
// Hallway:         y=420..470
// Bottom row:      y=470..800-PERIM (Design | Founder | Marketing)
//
const RECEP_BOTTOM = TOP_BAND + 110;
const MID_TOP = RECEP_BOTTOM + 8;
const MID_BOTTOM = MID_TOP + 280;
const HALL_TOP = MID_BOTTOM;
const HALL_BOTTOM = HALL_TOP + 60;
const BOT_TOP = HALL_BOTTOM;
const BOT_BOTTOM = OFFICE_HEIGHT - PERIM_T;

// Mid row column boundaries
const COL1 = 360; // boardroom right edge / kitchen left edge
const COL2 = 760; // kitchen right edge / engineering left edge
// Bottom row column boundaries
const BCOL1 = 420; // design right edge / founder left edge
const BCOL2 = 820; // founder right edge / marketing left edge

// ---- Perimeter ----
push({ x: 0, y: 0, w: OFFICE_WIDTH, h: PERIM_T + TOP_BAND });
push({ x: 0, y: OFFICE_HEIGHT - PERIM_T, w: OFFICE_WIDTH, h: PERIM_T });
push({ x: 0, y: 0, w: PERIM_T, h: OFFICE_HEIGHT });
push({ x: OFFICE_WIDTH - PERIM_T, y: 0, w: PERIM_T, h: OFFICE_HEIGHT });

// ---- Reception bottom wall (separates reception from mid row) ----
// One wide door in the center
const recDoorX = OFFICE_WIDTH / 2 - DOOR_W / 2;
push({ x: PERIM_T, y: RECEP_BOTTOM, w: recDoorX - PERIM_T, h: WALL_T });
push({
  x: recDoorX + DOOR_W,
  y: RECEP_BOTTOM,
  w: OFFICE_WIDTH - PERIM_T - (recDoorX + DOOR_W),
  h: WALL_T,
});

// ---- Mid row vertical walls ----
// Left wall (Boardroom | Kitchen) — door in middle
const midLeftDoorY = MID_TOP + (MID_BOTTOM - MID_TOP) / 2 - DOOR_W / 2;
push({ x: COL1, y: MID_TOP, w: WALL_T, h: midLeftDoorY - MID_TOP });
push({
  x: COL1,
  y: midLeftDoorY + DOOR_W,
  w: WALL_T,
  h: MID_BOTTOM - (midLeftDoorY + DOOR_W),
});

// Right wall (Kitchen | Engineering) — door in middle
const midRightDoorY = MID_TOP + (MID_BOTTOM - MID_TOP) / 2 - DOOR_W / 2;
push({ x: COL2 - WALL_T, y: MID_TOP, w: WALL_T, h: midRightDoorY - MID_TOP });
push({
  x: COL2 - WALL_T,
  y: midRightDoorY + DOOR_W,
  w: WALL_T,
  h: MID_BOTTOM - (midRightDoorY + DOOR_W),
});

// ---- Mid row bottom wall (mid → hallway) — three doors (one per room) ----
const doorMid1X = (PERIM_T + COL1) / 2 - DOOR_W / 2;
const doorMid2X = (COL1 + COL2) / 2 - DOOR_W / 2;
const doorMid3X = (COL2 + OFFICE_WIDTH - PERIM_T) / 2 - DOOR_W / 2;
const segs1 = [
  { from: PERIM_T, to: doorMid1X },
  { from: doorMid1X + DOOR_W, to: COL1 },
];
const segs2 = [
  { from: COL1, to: doorMid2X },
  { from: doorMid2X + DOOR_W, to: COL2 - WALL_T },
];
const segs3 = [
  { from: COL2 - WALL_T, to: doorMid3X },
  { from: doorMid3X + DOOR_W, to: OFFICE_WIDTH - PERIM_T },
];
[...segs1, ...segs2, ...segs3].forEach((s) =>
  push({ x: s.from, y: HALL_TOP - WALL_T, w: s.to - s.from, h: WALL_T }),
);

// ---- Hallway bottom wall (hallway → bottom row) — three doors ----
const doorBot1X = (PERIM_T + BCOL1) / 2 - DOOR_W / 2;
const doorBot2X = (BCOL1 + BCOL2) / 2 - DOOR_W / 2;
const doorBot3X = (BCOL2 + OFFICE_WIDTH - PERIM_T) / 2 - DOOR_W / 2;
const bsegs1 = [
  { from: PERIM_T, to: doorBot1X },
  { from: doorBot1X + DOOR_W, to: BCOL1 },
];
const bsegs2 = [
  { from: BCOL1, to: doorBot2X },
  { from: doorBot2X + DOOR_W, to: BCOL2 - WALL_T },
];
const bsegs3 = [
  { from: BCOL2 - WALL_T, to: doorBot3X },
  { from: doorBot3X + DOOR_W, to: OFFICE_WIDTH - PERIM_T },
];
[...bsegs1, ...bsegs2, ...bsegs3].forEach((s) =>
  push({ x: s.from, y: BOT_TOP, w: s.to - s.from, h: WALL_T }),
);

// ---- Bottom row vertical walls ----
const botLeftDoorY = BOT_TOP + (BOT_BOTTOM - BOT_TOP) / 2 - DOOR_W / 2;
push({ x: BCOL1, y: BOT_TOP, w: WALL_T, h: botLeftDoorY - BOT_TOP });
push({
  x: BCOL1,
  y: botLeftDoorY + DOOR_W,
  w: WALL_T,
  h: BOT_BOTTOM - (botLeftDoorY + DOOR_W),
});
const botRightDoorY = BOT_TOP + (BOT_BOTTOM - BOT_TOP) / 2 - DOOR_W / 2;
push({ x: BCOL2 - WALL_T, y: BOT_TOP, w: WALL_T, h: botRightDoorY - BOT_TOP });
push({
  x: BCOL2 - WALL_T,
  y: botRightDoorY + DOOR_W,
  w: WALL_T,
  h: BOT_BOTTOM - (botRightDoorY + DOOR_W),
});

// ============================================================
// FURNITURE  (also collidable)
// ============================================================

// ---- Reception ----
const RECEPTION_DESK: Rect = { x: OFFICE_WIDTH / 2 - 100, y: TOP_BAND + 50, w: 200, h: 36 };
push(RECEPTION_DESK);
const BENCH_L: Rect = { x: 80, y: TOP_BAND + 60, w: 130, h: 28 };
const BENCH_R: Rect = { x: OFFICE_WIDTH - 210, y: TOP_BAND + 60, w: 130, h: 28 };
push(BENCH_L);
push(BENCH_R);

// ---- Boardroom (top-left) ----
const CONF_TABLE: Rect = { x: 60, y: 220, w: 250, h: 90 };
push(CONF_TABLE);
// Boardroom screen on top wall
const BOARD_SCREEN: Rect = { x: 130, y: MID_TOP + 6, w: 110, h: 18 };
push(BOARD_SCREEN);
// Plant in boardroom corner
const BOARD_PLANT: Rect = { x: 290, y: MID_TOP + 14, w: 22, h: 28 };
push(BOARD_PLANT);

// ---- Kitchen / Cafe (top-center) ----
const COFFEE_BAR: Rect = { x: COL1 + 30, y: MID_TOP + 20, w: 180, h: 32 };
push(COFFEE_BAR);
const FRIDGE_R: Rect = { x: COL2 - 56, y: MID_TOP + 14, w: 36, h: 60 };
push(FRIDGE_R);
const COUCH_L: Rect = { x: COL1 + 40, y: MID_BOTTOM - 70, w: 90, h: 36 };
const COUCH_R: Rect = { x: COL2 - 130, y: MID_BOTTOM - 70, w: 90, h: 36 };
push(COUCH_L);
push(COUCH_R);
const COFFEE_TABLE: Rect = { x: (COL1 + COL2) / 2 - 30, y: MID_BOTTOM - 64, w: 60, h: 24 };
push(COFFEE_TABLE);

// ---- Engineering (top-right) ----
const DESK1: Rect = { x: COL2 + 40, y: MID_TOP + 50, w: 110, h: 38 };
const DESK2: Rect = { x: COL2 + 180, y: MID_TOP + 50, w: 110, h: 38 };
const DESK3: Rect = { x: COL2 + 40, y: MID_TOP + 160, w: 110, h: 38 };
const DESK4: Rect = { x: COL2 + 180, y: MID_TOP + 160, w: 110, h: 38 };
push(DESK1);
push(DESK2);
push(DESK3);
push(DESK4);
const SERVER_RACK: Rect = { x: OFFICE_WIDTH - 80, y: MID_TOP + 30, w: 44, h: 160 };
push(SERVER_RACK);
const WHITEBOARD_R: Rect = { x: COL2 + 30, y: MID_TOP + 6, w: 200, h: 16 };
push(WHITEBOARD_R);

// ---- Design Studio (bottom-left) ----
const EASEL_RECT: Rect = { x: 80, y: BOT_TOP + 70, w: 60, h: 100 };
const MOOD_BOARD: Rect = { x: 220, y: BOT_TOP + 30, w: 160, h: 18 };
const DESIGNER_DESK: Rect = { x: 220, y: BOT_TOP + 130, w: 130, h: 38 };
push(EASEL_RECT);
push(MOOD_BOARD);
push(DESIGNER_DESK);

// ---- Founder's office (bottom-center) ----
const FOUNDER_DESK: Rect = {
  x: (BCOL1 + BCOL2) / 2 - 70,
  y: BOT_TOP + 80,
  w: 140,
  h: 42,
};
push(FOUNDER_DESK);
const BOOKSHELF: Rect = { x: BCOL1 + 20, y: BOT_TOP + 30, w: 60, h: 14 };
push(BOOKSHELF);
const FOUNDER_PLANT: Rect = { x: BCOL2 - 38, y: BOT_TOP + 30, w: 22, h: 28 };
push(FOUNDER_PLANT);

// ---- Marketing pod (bottom-right) ----
const PIN_BOARD_RECT: Rect = { x: BCOL2 + 40, y: BOT_TOP + 24, w: 200, h: 22 };
const PRESENTER_SCREEN: Rect = { x: OFFICE_WIDTH - 160, y: BOT_TOP + 24, w: 140, h: 18 };
const PRESENTER_DESK: Rect = { x: BCOL2 + 50, y: BOT_TOP + 110, w: 160, h: 38 };
const GUEST_COUCH: Rect = { x: OFFICE_WIDTH - 180, y: BOT_TOP + 200, w: 140, h: 36 };
push(PIN_BOARD_RECT);
push(PRESENTER_SCREEN);
push(PRESENTER_DESK);
push(GUEST_COUCH);

// ---- Hallway decor ----
const HALL_PLANT_1: Rect = { x: 200, y: HALL_TOP + 18, w: 22, h: 28 };
const HALL_PLANT_2: Rect = { x: OFFICE_WIDTH - 222, y: HALL_TOP + 18, w: 22, h: 28 };
push(HALL_PLANT_1);
push(HALL_PLANT_2);

// All furniture rects collected for "skip drawing as walls" check
const FURNITURE: Rect[] = [
  RECEPTION_DESK, BENCH_L, BENCH_R,
  CONF_TABLE, BOARD_SCREEN, BOARD_PLANT,
  COFFEE_BAR, FRIDGE_R, COUCH_L, COUCH_R, COFFEE_TABLE,
  DESK1, DESK2, DESK3, DESK4, SERVER_RACK, WHITEBOARD_R,
  EASEL_RECT, MOOD_BOARD, DESIGNER_DESK,
  FOUNDER_DESK, BOOKSHELF, FOUNDER_PLANT,
  PIN_BOARD_RECT, PRESENTER_SCREEN, PRESENTER_DESK, GUEST_COUCH,
  HALL_PLANT_1, HALL_PLANT_2,
];
const FURNITURE_SET = new Set(FURNITURE);

// ============================================================
// RENDER
// ============================================================

function ParquetFloor() {
  const plankW = 80;
  const plankH = 16;
  const tiles: { x: number; y: number; fill: string; offset: number }[] = [];
  for (let y = PERIM_T + TOP_BAND; y < OFFICE_HEIGHT - PERIM_T; y += plankH) {
    const rowOdd = (Math.floor(y / plankH) % 2) === 0;
    const offset = rowOdd ? 0 : plankW / 2;
    for (let x = PERIM_T - offset; x < OFFICE_WIDTH - PERIM_T; x += plankW) {
      const i = Math.floor((x + y) / plankW);
      const fill = i % 3 === 0 ? PLANK_C : i % 3 === 1 ? PLANK_A : PLANK_B;
      tiles.push({ x, y, fill, offset });
    }
  }
  return (
    <g shapeRendering="crispEdges">
      {tiles.map((t, i) => (
        <rect
          key={i}
          x={Math.max(t.x, PERIM_T)}
          y={t.y}
          width={Math.min(plankW, OFFICE_WIDTH - PERIM_T - Math.max(t.x, PERIM_T))}
          height={plankH}
          fill={t.fill}
        />
      ))}
      {/* horizontal grain */}
      {tiles.map((t, i) => (
        <rect
          key={`g${i}`}
          x={Math.max(t.x, PERIM_T)}
          y={t.y + plankH - 1}
          width={Math.min(plankW, OFFICE_WIDTH - PERIM_T - Math.max(t.x, PERIM_T))}
          height={1}
          fill={GRAIN}
          opacity={0.5}
        />
      ))}
    </g>
  );
}

function Rug({ x, y, w, h, fill, hi }: { x: number; y: number; w: number; h: number; fill: string; hi: string }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={x} y={y} width={w} height={h} fill={fill} opacity={0.85} />
      <rect x={x} y={y} width={w} height={2} fill={hi} opacity={0.9} />
      <rect x={x} y={y + h - 2} width={w} height={2} fill={hi} opacity={0.9} />
      <rect x={x} y={y} width={2} height={h} fill={hi} opacity={0.9} />
      <rect x={x + w - 2} y={y} width={2} height={h} fill={hi} opacity={0.9} />
      <rect x={x + 6} y={y + 6} width={w - 12} height={1} fill={hi} opacity={0.4} />
      <rect x={x + 6} y={y + h - 7} width={w - 12} height={1} fill={hi} opacity={0.4} />
    </g>
  );
}

function Wall({ r }: { r: Rect }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={WALL} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={WALL_HI} />
      <rect x={r.x} y={r.y + r.h - 2} width={r.w} height={2} fill={BASEBOARD} />
      <rect x={r.x} y={r.y + r.h - 1} width={r.w} height={1} fill={WALL_TRIM} />
    </g>
  );
}

function Doorframe({ x, y, w, vertical }: { x: number; y: number; w: number; vertical: boolean }) {
  if (vertical) {
    return (
      <g shapeRendering="crispEdges">
        <rect x={x} y={y - 2} width={WALL_T} height={2} fill={DOORFRAME} />
        <rect x={x} y={y + DOOR_W} width={WALL_T} height={2} fill={DOORFRAME} />
        <rect x={x - 1} y={y - 2} width={1} height={DOOR_W + 4} fill={DOORFRAME_DARK} />
        <rect x={x + WALL_T} y={y - 2} width={1} height={DOOR_W + 4} fill={DOORFRAME_DARK} />
      </g>
    );
  }
  return (
    <g shapeRendering="crispEdges">
      <rect x={x - 2} y={y} width={2} height={WALL_T} fill={DOORFRAME} />
      <rect x={x + DOOR_W} y={y} width={2} height={WALL_T} fill={DOORFRAME} />
      <rect x={x - 2} y={y - 1} width={DOOR_W + 4} height={1} fill={DOORFRAME_DARK} />
      <rect x={x - 2} y={y + WALL_T} width={DOOR_W + 4} height={1} fill={DOORFRAME_DARK} />
    </g>
  );
}

function Header() {
  return (
    <g shapeRendering="crispEdges">
      <rect x={0} y={0} width={OFFICE_WIDTH} height={PERIM_T + TOP_BAND} fill={HEADER_BG} />
      <rect x={0} y={PERIM_T + TOP_BAND - 2} width={OFFICE_WIDTH} height={2} fill={HEADER_FG} />
      <text
        x={OFFICE_WIDTH / 2}
        y={PERIM_T + TOP_BAND - 14}
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize={16}
        fontWeight={700}
        letterSpacing={5}
        fill={HEADER_FG}
      >
        ◆ STARTUP HQ ◆
      </text>
    </g>
  );
}

function RoomLabel({ x, y, text, dim }: { x: number; y: number; text: string; dim?: boolean }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize={11}
      fontWeight={700}
      letterSpacing={3}
      fill={dim ? ROOM_LABEL_DIM : ROOM_LABEL}
      opacity={0.85}
    >
      {text}
    </text>
  );
}

// ---------- Furniture renderers ----------

function ReceptionDesk() {
  const r = RECEPTION_DESK;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={DESK} />
      <rect x={r.x} y={r.y} width={r.w} height={3} fill={DESK_HI} />
      <rect x={r.x} y={r.y + r.h - 2} width={r.w} height={2} fill={DESK_DARK} />
      {/* phone */}
      <rect x={r.x + 12} y={r.y + 8} width={14} height={10} fill={MONITOR_FRAME} />
      <rect x={r.x + 14} y={r.y + 10} width={10} height={6} fill="#3D3B36" />
      {/* monitor */}
      <rect x={r.x + r.w - 60} y={r.y - 26} width={42} height={26} fill={MONITOR_FRAME} />
      <rect x={r.x + r.w - 58} y={r.y - 24} width={38} height={20} fill={SCREEN_DARK} />
      <rect x={r.x + r.w - 54} y={r.y - 20} width={16} height={1} fill={CODE_GREEN} />
      <rect x={r.x + r.w - 54} y={r.y - 17} width={22} height={1} fill={CODE_BLUE} />
      <rect x={r.x + r.w - 54} y={r.y - 14} width={14} height={1} fill={CODE_PINK} />
    </g>
  );
}

function Bench({ r }: { r: Rect }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={COUCH} />
      <rect x={r.x} y={r.y} width={r.w} height={3} fill={COUCH_HI} />
      <rect x={r.x + 4} y={r.y + r.h - 4} width={4} height={4} fill={COUCH_LEG} />
      <rect x={r.x + r.w - 8} y={r.y + r.h - 4} width={4} height={4} fill={COUCH_LEG} />
    </g>
  );
}

function ConferenceTable() {
  const r = CONF_TABLE;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={TABLE} />
      <rect x={r.x} y={r.y + 4} width={r.w} height={r.h - 8} fill={TABLE} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={3} fill={TABLE_HI} />
      <rect x={r.x + 6} y={r.y + 6} width={r.w - 12} height={1} fill={TABLE_GLOSS} opacity={0.4} />
      <rect x={r.x + 6} y={r.y + r.h - 8} width={r.w - 12} height={1} fill={TABLE_HI} opacity={0.3} />
      {/* chairs around */}
      {[0.18, 0.4, 0.6, 0.82].map((t, i) => (
        <g key={`top${i}`}>
          <rect x={r.x + r.w * t - 9} y={r.y - 16} width={18} height={14} fill={CHAIR} />
          <rect x={r.x + r.w * t - 9} y={r.y - 16} width={18} height={2} fill={CHAIR_HI} />
        </g>
      ))}
      {[0.18, 0.4, 0.6, 0.82].map((t, i) => (
        <g key={`bot${i}`}>
          <rect x={r.x + r.w * t - 9} y={r.y + r.h + 2} width={18} height={14} fill={CHAIR} />
          <rect x={r.x + r.w * t - 9} y={r.y + r.h + 2} width={18} height={2} fill={CHAIR_HI} />
        </g>
      ))}
      <rect x={r.x - 16} y={r.y + r.h / 2 - 9} width={14} height={18} fill={CHAIR} />
      <rect x={r.x + r.w + 2} y={r.y + r.h / 2 - 9} width={14} height={18} fill={CHAIR} />
      {/* documents on table */}
      <rect x={r.x + 30} y={r.y + 30} width={20} height={14} fill={PAPER} />
      <rect x={r.x + 100} y={r.y + 36} width={24} height={16} fill={PAPER} />
      <rect x={r.x + 180} y={r.y + 28} width={20} height={14} fill={PAPER} />
      {/* coffee mugs */}
      <ellipse cx={r.x + 60} cy={r.y + 28} rx={4} ry={3} fill={MUG} />
      <ellipse cx={r.x + 200} cy={r.y + 56} rx={4} ry={3} fill={MUG} />
    </g>
  );
}

function BoardScreen() {
  const r = BOARD_SCREEN;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={MONITOR_FRAME} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={SCREEN_PRESENTER} />
      <rect x={r.x + 8} y={r.y + 6} width={r.w - 36} height={2} fill={PAPER} opacity={0.8} />
      <rect x={r.x + 8} y={r.y + 11} width={r.w - 60} height={2} fill={PAPER} opacity={0.6} />
    </g>
  );
}

function CoffeeBar() {
  const r = COFFEE_BAR;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={DESK} />
      <rect x={r.x} y={r.y} width={r.w} height={3} fill={DESK_HI} />
      <rect x={r.x} y={r.y + r.h - 2} width={r.w} height={2} fill={DESK_DARK} />
      {/* espresso machine */}
      <rect x={r.x + 14} y={r.y - 22} width={32} height={22} fill={COFFEE_MACHINE} />
      <rect x={r.x + 14} y={r.y - 22} width={32} height={2} fill={COFFEE_MACHINE_HI} />
      <rect x={r.x + 22} y={r.y - 14} width={4} height={2} fill={COFFEE_MACHINE_HI} />
      <rect x={r.x + 32} y={r.y - 14} width={4} height={2} fill={COFFEE_MACHINE_HI} />
      <rect x={r.x + 26} y={r.y - 4} width={8} height={4} fill={COFFEE_LIQ} />
      {/* mugs lined up */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <ellipse cx={r.x + 70 + i * 16} cy={r.y + 8} rx={5} ry={4} fill={MUG} />
          <ellipse cx={r.x + 70 + i * 16} cy={r.y + 7} rx={3} ry={2} fill={COFFEE_LIQ} />
        </g>
      ))}
      {/* sugar jar */}
      <rect x={r.x + 158} y={r.y + 4} width={14} height={20} fill={PAPER} />
      <rect x={r.x + 158} y={r.y + 4} width={14} height={2} fill={MONITOR_FRAME} />
    </g>
  );
}

function Fridge() {
  const r = FRIDGE_R;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={FRIDGE} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={FRIDGE_DARK} />
      <rect x={r.x} y={r.y + r.h / 2 - 1} width={r.w} height={2} fill={FRIDGE_DARK} />
      <rect x={r.x + r.w - 6} y={r.y + 8} width={2} height={6} fill={FRIDGE_DARK} />
      <rect x={r.x + r.w - 6} y={r.y + r.h / 2 + 6} width={2} height={6} fill={FRIDGE_DARK} />
      {/* magnets */}
      <rect x={r.x + 6} y={r.y + 8} width={6} height={4} fill={POSTER_RED} />
      <rect x={r.x + 14} y={r.y + 14} width={6} height={4} fill={POSTER_BLUE} />
    </g>
  );
}

function Couch({ r }: { r: Rect }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y - 8} width={r.w} height={r.h + 8} fill={COUCH} />
      <rect x={r.x} y={r.y - 8} width={r.w} height={4} fill={COUCH_HI} />
      <rect x={r.x} y={r.y - 8} width={6} height={r.h + 8} fill={COUCH_HI} />
      <rect x={r.x + r.w - 6} y={r.y - 8} width={6} height={r.h + 8} fill={COUCH_HI} />
      {/* cushion seam */}
      <rect x={r.x + r.w / 2 - 1} y={r.y} width={2} height={r.h - 6} fill={COUCH_HI} opacity={0.4} />
      {/* feet */}
      <rect x={r.x + 4} y={r.y + r.h - 4} width={4} height={4} fill={COUCH_LEG} />
      <rect x={r.x + r.w - 8} y={r.y + r.h - 4} width={4} height={4} fill={COUCH_LEG} />
    </g>
  );
}

function CoffeeTable() {
  const r = COFFEE_TABLE;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={TABLE} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={TABLE_HI} />
      <rect x={r.x + 6} y={r.y + 4} width={20} height={3} fill={PAPER} />
      <ellipse cx={r.x + 44} cy={r.y + 12} rx={5} ry={3} fill={MUG} />
    </g>
  );
}

function CodeMonitor({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={x} y={y} width={w} height={h} fill={MONITOR_FRAME} />
      <rect x={x + 2} y={y + 2} width={w - 4} height={h - 6} fill={SCREEN_DARK} />
      {/* code lines */}
      <rect x={x + 4} y={y + 5} width={Math.min(w - 14, 18)} height={1} fill={CODE_PINK} />
      <rect x={x + 4} y={y + 8} width={Math.min(w - 8, 26)} height={1} fill={CODE_GREEN} />
      <rect x={x + 8} y={y + 11} width={Math.min(w - 14, 18)} height={1} fill={CODE_BLUE} />
      <rect x={x + 4} y={y + 14} width={Math.min(w - 10, 22)} height={1} fill={CODE_GREEN} />
      <rect x={x + 8} y={y + 17} width={Math.min(w - 18, 14)} height={1} fill={CODE_PINK} />
      <rect x={x + 4} y={y + 20} width={Math.min(w - 6, 28)} height={1} fill={CODE_BLUE} />
      {/* stand */}
      <rect x={x + w / 2 - 1} y={y + h - 4} width={2} height={3} fill={MONITOR_FRAME} />
      <rect x={x + w / 2 - 4} y={y + h - 1} width={8} height={1} fill={MONITOR_BEZEL} />
    </g>
  );
}

function EngineeringDesk({ r, monitor }: { r: Rect; monitor: boolean }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={DESK} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={DESK_HI} />
      <rect x={r.x} y={r.y + r.h - 2} width={r.w} height={2} fill={DESK_DARK} />
      {/* keyboard */}
      <rect x={r.x + r.w / 2 - 18} y={r.y + r.h - 14} width={36} height={6} fill={KEYBOARD} />
      <rect x={r.x + r.w / 2 - 16} y={r.y + r.h - 12} width={32} height={2} fill={MONITOR_BEZEL} />
      {/* mug */}
      <ellipse cx={r.x + 14} cy={r.y + 10} rx={4} ry={3} fill={MUG} />
      {/* monitor */}
      {monitor && (
        <CodeMonitor x={r.x + r.w / 2 - 18} y={r.y - 28} w={36} h={28} />
      )}
    </g>
  );
}

function ServerRack() {
  const r = SERVER_RACK;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={SERVER} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={SERVER_RIM} />
      <rect x={r.x} y={r.y + r.h - 2} width={r.w} height={2} fill={SERVER_RIM} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <g key={i}>
          <rect x={r.x + 4} y={r.y + 8 + i * 22} width={r.w - 8} height={16} fill="#0F0E0C" />
          <rect x={r.x + 6} y={r.y + 12 + i * 22} width={3} height={2} fill={SERVER_LIGHT} />
          <rect x={r.x + 12} y={r.y + 12 + i * 22} width={2} height={2} fill={SERVER_LIGHT_AMBER} />
          <rect x={r.x + 18} y={r.y + 12 + i * 22} width={2} height={2} fill={CODE_BLUE} />
        </g>
      ))}
    </g>
  );
}

function Whiteboard() {
  const r = WHITEBOARD_R;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={WHITEBOARD_FRAME} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={WHITEBOARD} />
      {/* squiggles */}
      <rect x={r.x + 10} y={r.y + 5} width={28} height={1} fill={POSTER_BLUE} />
      <rect x={r.x + 10} y={r.y + 8} width={42} height={1} fill={POSTER_RED} />
      <rect x={r.x + 60} y={r.y + 5} width={20} height={1} fill={MONITOR_FRAME} />
      <rect x={r.x + 90} y={r.y + 7} width={32} height={1} fill={POSTER_BLUE} />
      <rect x={r.x + 130} y={r.y + 5} width={28} height={1} fill={POSTER_RED} />
    </g>
  );
}

function Easel() {
  const r = EASEL_RECT;
  return (
    <g shapeRendering="crispEdges">
      {/* legs */}
      <rect x={r.x + 4} y={r.y + 10} width={3} height={r.h - 10} fill={EASEL_DARK} />
      <rect x={r.x + r.w - 7} y={r.y + 10} width={3} height={r.h - 10} fill={EASEL_DARK} />
      <rect x={r.x + r.w / 2 - 1} y={r.y + 60} width={2} height={r.h - 60} fill={EASEL_DARK} />
      {/* canvas */}
      <rect x={r.x} y={r.y} width={r.w} height={66} fill={EASEL} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={62} fill={CANVAS} />
      {/* painting in progress */}
      <rect x={r.x + 8} y={r.y + 12} width={20} height={18} fill={PALETTE_TEAL} />
      <rect x={r.x + 32} y={r.y + 18} width={16} height={20} fill={PALETTE_PINK} />
      <rect x={r.x + 12} y={r.y + 36} width={36} height={14} fill={PALETTE_YELLOW} />
      <rect x={r.x + 8} y={r.y + 54} width={44} height={6} fill={PALETTE_RED} />
    </g>
  );
}

function MoodBoard() {
  const r = MOOD_BOARD;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={PIN_FRAME} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={PIN_BG} />
      {/* swatches */}
      <rect x={r.x + 8} y={r.y + 5} width={20} height={10} fill={PALETTE_PINK} />
      <rect x={r.x + 32} y={r.y + 5} width={20} height={10} fill={PALETTE_TEAL} />
      <rect x={r.x + 56} y={r.y + 5} width={20} height={10} fill={PALETTE_YELLOW} />
      <rect x={r.x + 80} y={r.y + 5} width={20} height={10} fill={POSTER_BLUE} />
      <rect x={r.x + 104} y={r.y + 5} width={20} height={10} fill={POSTER_RED} />
      <rect x={r.x + 128} y={r.y + 5} width={20} height={10} fill={MONITOR_FRAME} />
    </g>
  );
}

function DesignerDesk() {
  const r = DESIGNER_DESK;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={DESK} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={DESK_HI} />
      <rect x={r.x} y={r.y + r.h - 2} width={r.w} height={2} fill={DESK_DARK} />
      {/* mac */}
      <rect x={r.x + r.w / 2 - 26} y={r.y - 32} width={52} height={32} fill={MONITOR_FRAME} />
      <rect x={r.x + r.w / 2 - 24} y={r.y - 30} width={48} height={26} fill={SCREEN_DARK} />
      <rect x={r.x + r.w / 2 - 20} y={r.y - 26} width={20} height={18} fill={PALETTE_PINK} />
      <rect x={r.x + r.w / 2 + 2} y={r.y - 26} width={18} height={18} fill={PALETTE_TEAL} />
      <rect x={r.x + r.w / 2 - 12} y={r.y - 6} width={24} height={2} fill={MONITOR_BEZEL} />
      {/* tablet */}
      <rect x={r.x + 6} y={r.y + 6} width={26} height={18} fill={MONITOR_FRAME} />
      <rect x={r.x + 8} y={r.y + 8} width={22} height={14} fill={PALETTE_TEAL} opacity={0.6} />
    </g>
  );
}

function FounderDesk() {
  const r = FOUNDER_DESK;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={DESK} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={DESK_HI} />
      <rect x={r.x} y={r.y + r.h - 2} width={r.w} height={2} fill={DESK_DARK} />
      <CodeMonitor x={r.x + r.w / 2 - 22} y={r.y - 32} w={44} h={32} />
      <rect x={r.x + 8} y={r.y + 8} width={24} height={16} fill={NOTEBOOK} />
      <rect x={r.x + 10} y={r.y + 10} width={20} height={2} fill={PAPER} />
      <ellipse cx={r.x + r.w - 14} cy={r.y + 14} rx={5} ry={4} fill={MUG} />
      <ellipse cx={r.x + r.w - 14} cy={r.y + 13} rx={3} ry={2} fill={COFFEE_LIQ} />
    </g>
  );
}

function Bookshelf() {
  const r = BOOKSHELF;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={SHELF} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={DESK_HI} />
      {/* books on top */}
      {[BOOK_RED, BOOK_GREEN, BOOK_BLUE, BOOK_GOLD, BOOK_RED, BOOK_GREEN].map((c, i) => (
        <rect key={i} x={r.x + 2 + i * 9} y={r.y - 22} width={8} height={22} fill={c} />
      ))}
    </g>
  );
}

function PinBoard() {
  const r = PIN_BOARD_RECT;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={PIN_FRAME} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={PIN_BG} />
      <rect x={r.x + 8} y={r.y + 4} width={36} height={14} fill={POSTER_BLUE} />
      <rect x={r.x + 50} y={r.y + 4} width={36} height={14} fill={POSTER_RED} />
      <rect x={r.x + 92} y={r.y + 4} width={36} height={14} fill={POSTER_YELLOW} />
      <rect x={r.x + 134} y={r.y + 4} width={36} height={14} fill={POSTER_TEAL} />
      {/* pin dots */}
      {[8, 50, 92, 134].map((x, i) => (
        <rect key={i} x={r.x + x + 1} y={r.y + 5} width={2} height={2} fill="#F2C744" />
      ))}
    </g>
  );
}

function PresentationScreen() {
  const r = PRESENTER_SCREEN;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={MONITOR_FRAME} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={SCREEN_PRESENTER} />
      <rect x={r.x + 10} y={r.y + 5} width={r.w - 30} height={2} fill={PAPER} />
      <rect x={r.x + 10} y={r.y + 9} width={r.w - 60} height={2} fill={PAPER} opacity={0.7} />
      <rect x={r.x + 10} y={r.y + 13} width={r.w - 80} height={2} fill={PAPER} opacity={0.5} />
    </g>
  );
}

function PresenterDesk() {
  const r = PRESENTER_DESK;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={DESK} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={DESK_HI} />
      <rect x={r.x} y={r.y + r.h - 2} width={r.w} height={2} fill={DESK_DARK} />
      <CodeMonitor x={r.x + 18} y={r.y - 28} w={42} h={28} />
      <rect x={r.x + 70} y={r.y + 8} width={28} height={20} fill={PAPER} />
      <rect x={r.x + 110} y={r.y + 14} width={26} height={16} fill={PAPER} />
      <ellipse cx={r.x + r.w - 14} cy={r.y + 18} rx={5} ry={4} fill={MUG} />
    </g>
  );
}

function GuestCouch() {
  return <Couch r={GUEST_COUCH} />;
}

function Plant({ r }: { r: Rect }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y + r.h - 8} width={r.w} height={8} fill={PLANT_POT} />
      <rect x={r.x} y={r.y + r.h - 8} width={r.w} height={2} fill={PLANT_POT_HI} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 9} fill={PLANT_LEAF} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={4} fill={PLANT_LEAF_DARK} />
      <rect x={r.x + r.w / 2 - 1} y={r.y + 6} width={2} height={r.h - 14} fill={PLANT_LEAF_DARK} />
      <rect x={r.x + 4} y={r.y + 6} width={2} height={4} fill={PLANT_LEAF_HI} />
      <rect x={r.x + r.w - 6} y={r.y + 10} width={2} height={4} fill={PLANT_LEAF_HI} />
    </g>
  );
}

function FramedArt({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={x} y={y} width={w} height={h} fill={DOORFRAME} />
      <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill={color} />
      <rect x={x + 4} y={y + 4} width={w - 8} height={2} fill={CANVAS} opacity={0.4} />
    </g>
  );
}

function CeilingLamp({ x, y }: { x: number; y: number }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={x - 1} y={y} width={2} height={6} fill={MONITOR_FRAME} />
      <rect x={x - 6} y={y + 6} width={12} height={2} fill="#F2C744" opacity={0.8} />
      <ellipse cx={x} cy={y + 14} rx={14} ry={6} fill="#F2C744" opacity={0.08} />
    </g>
  );
}

export function OfficeBackground() {
  return (
    <svg
      width={OFFICE_WIDTH}
      height={OFFICE_HEIGHT}
      viewBox={`0 0 ${OFFICE_WIDTH} ${OFFICE_HEIGHT}`}
      shapeRendering="crispEdges"
      style={{ display: "block", imageRendering: "pixelated" }}
    >
      {/* Outer void */}
      <rect x={0} y={0} width={OFFICE_WIDTH} height={OFFICE_HEIGHT} fill={VOID} />

      {/* Parquet floor */}
      <ParquetFloor />

      {/* Per-room rugs */}
      <Rug x={70} y={MID_TOP + 30} w={290} h={240} fill={RUG_BOARD} hi={RUG_BOARD_HI} />
      <Rug x={COL2 - 220} y={MID_BOTTOM - 80} w={200} h={50} fill={RUG_LOUNGE} hi={RUG_LOUNGE_HI} />
      <Rug x={70} y={BOT_TOP + 100} w={310} h={210} fill={RUG_DESIGN} hi={RUG_DESIGN_HI} />
      <Rug x={BCOL1 + 30} y={BOT_TOP + 60} w={350} h={270} fill={RUG_FOUNDER} hi={DESK_HI} />

      {/* Header band */}
      <Header />

      {/* ---------- Furniture ---------- */}
      <ReceptionDesk />
      <Bench r={BENCH_L} />
      <Bench r={BENCH_R} />

      <ConferenceTable />
      <BoardScreen />
      <Plant r={BOARD_PLANT} />

      <CoffeeBar />
      <Fridge />
      <Couch r={COUCH_L} />
      <Couch r={COUCH_R} />
      <CoffeeTable />

      <EngineeringDesk r={DESK1} monitor />
      <EngineeringDesk r={DESK2} monitor />
      <EngineeringDesk r={DESK3} monitor />
      <EngineeringDesk r={DESK4} monitor />
      <ServerRack />
      <Whiteboard />

      <Easel />
      <MoodBoard />
      <DesignerDesk />

      <FounderDesk />
      <Bookshelf />
      <Plant r={FOUNDER_PLANT} />

      <PinBoard />
      <PresentationScreen />
      <PresenterDesk />
      <GuestCouch />

      <Plant r={HALL_PLANT_1} />
      <Plant r={HALL_PLANT_2} />

      {/* Hallway framed art */}
      <FramedArt x={300} y={HALL_TOP + 22} w={36} h={26} color={POSTER_RED} />
      <FramedArt x={400} y={HALL_TOP + 22} w={36} h={26} color={POSTER_BLUE} />
      <FramedArt x={500} y={HALL_TOP + 22} w={36} h={26} color={POSTER_YELLOW} />
      <FramedArt x={600} y={HALL_TOP + 22} w={36} h={26} color={PALETTE_TEAL} />
      <FramedArt x={700} y={HALL_TOP + 22} w={36} h={26} color={PALETTE_PINK} />
      <FramedArt x={800} y={HALL_TOP + 22} w={36} h={26} color={POSTER_RED} />
      <FramedArt x={900} y={HALL_TOP + 22} w={36} h={26} color={POSTER_BLUE} />

      {/* Walls */}
      {WALL_RECTS
        .filter((r) => !FURNITURE_SET.has(r))
        .map((r, i) => (
          <Wall key={i} r={r} />
        ))}

      {/* Doorframes */}
      <Doorframe x={recDoorX} y={RECEP_BOTTOM} w={DOOR_W} vertical={false} />
      <Doorframe x={COL1} y={midLeftDoorY} w={DOOR_W} vertical />
      <Doorframe x={COL2 - WALL_T} y={midRightDoorY} w={DOOR_W} vertical />
      <Doorframe x={doorMid1X} y={HALL_TOP - WALL_T} w={DOOR_W} vertical={false} />
      <Doorframe x={doorMid2X} y={HALL_TOP - WALL_T} w={DOOR_W} vertical={false} />
      <Doorframe x={doorMid3X} y={HALL_TOP - WALL_T} w={DOOR_W} vertical={false} />
      <Doorframe x={doorBot1X} y={BOT_TOP} w={DOOR_W} vertical={false} />
      <Doorframe x={doorBot2X} y={BOT_TOP} w={DOOR_W} vertical={false} />
      <Doorframe x={doorBot3X} y={BOT_TOP} w={DOOR_W} vertical={false} />
      <Doorframe x={BCOL1} y={botLeftDoorY} w={DOOR_W} vertical />
      <Doorframe x={BCOL2 - WALL_T} y={botRightDoorY} w={DOOR_W} vertical />

      {/* Ceiling lamps */}
      <CeilingLamp x={200} y={MID_TOP + 4} />
      <CeilingLamp x={(COL1 + COL2) / 2} y={MID_TOP + 4} />
      <CeilingLamp x={(COL2 + OFFICE_WIDTH) / 2} y={MID_TOP + 4} />
      <CeilingLamp x={BCOL1 / 2} y={BOT_TOP + 8} />
      <CeilingLamp x={(BCOL1 + BCOL2) / 2} y={BOT_TOP + 8} />
      <CeilingLamp x={(BCOL2 + OFFICE_WIDTH) / 2} y={BOT_TOP + 8} />

      {/* Room labels */}
      <RoomLabel x={OFFICE_WIDTH / 2} y={TOP_BAND + 22} text="◈ RECEPTION ◈" />
      <RoomLabel x={(PERIM_T + COL1) / 2} y={MID_TOP + 22} text="BOARDROOM" />
      <RoomLabel x={(COL1 + COL2) / 2} y={MID_TOP + 22} text="KITCHEN · LOUNGE" />
      <RoomLabel x={(COL2 + OFFICE_WIDTH - PERIM_T) / 2} y={MID_TOP + 22} text="ENGINEERING" />
      <RoomLabel x={(PERIM_T + BCOL1) / 2} y={BOT_TOP + 22} text="DESIGN STUDIO" />
      <RoomLabel x={(BCOL1 + BCOL2) / 2} y={BOT_TOP + 22} text="FOUNDER'S OFFICE" />
      <RoomLabel x={(BCOL2 + OFFICE_WIDTH - PERIM_T) / 2} y={BOT_TOP + 22} text="MARKETING POD" />
    </svg>
  );
}
