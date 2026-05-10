"use client";

export const OFFICE_WIDTH = 960;
export const OFFICE_HEIGHT = 600;

const WALL_T = 6;          // internal wall thickness
const PERIM_T = 12;        // perimeter wall thickness
const TOP_BAND = 28;       // top header band

// ---- Palette ----
const FLOOR_A = "#5C4632";       // warm wood
const FLOOR_B = "#6B5340";
const FLOOR_GROUT = "#3A2A1F";
const WALL = "#2A2520";
const WALL_HI = "#3D362E";
const WALL_TRIM = "#1A1612";
const HEADER_BG = "#0F0E0C";
const HEADER_FG = "#F2C744";
const ROOM_LABEL = "#C9A684";

const DESK = "#7A4F2A";
const DESK_DARK = "#5C3A1E";
const MONITOR_FRAME = "#1A1815";
const MONITOR_SCREEN = "#1F4D5A";
const SERVER = "#26241F";
const SERVER_LIGHT = "#7FCFA0";

const TABLE = "#3A2412";
const TABLE_HI = "#5A3A20";
const CHAIR = "#1A1815";

const EASEL = "#9C7A48";
const CANVAS = "#F4F1E8";
const PALETTE_PINK = "#E08AC9";
const PALETTE_TEAL = "#2D6B7E";

const PIN_BOARD = "#8B6F47";
const PIN_BOARD_FRAME = "#3A2412";
const POSTER_BLUE = "#1B3A6F";
const POSTER_RED = "#C8483A";

const PLANT_POT = "#7A2A20";
const PLANT_LEAF = "#2D6B3F";
const PLANT_LEAF_DARK = "#1F4D2C";

const COFFEE = "#3A2412";
const COFFEE_LIGHT = "#7A4F2A";

// ---- Room layout (logical units) ----
// Four rooms separated by a + corridor.
const CORRIDOR_X1 = 444;
const CORRIDOR_X2 = 516;
const CORRIDOR_Y1 = 282;
const CORRIDOR_Y2 = 318;

// Door width along walls
const DOOR_W = 60;

type Rect = { x: number; y: number; w: number; h: number };

// All AABBs the player cannot walk through.
export const WALL_RECTS: Rect[] = [];

function pushWall(r: Rect) {
  WALL_RECTS.push(r);
}

// --- Perimeter ---
pushWall({ x: 0, y: 0, w: OFFICE_WIDTH, h: PERIM_T + TOP_BAND });
pushWall({ x: 0, y: OFFICE_HEIGHT - PERIM_T, w: OFFICE_WIDTH, h: PERIM_T });
pushWall({ x: 0, y: 0, w: PERIM_T, h: OFFICE_HEIGHT });
pushWall({ x: OFFICE_WIDTH - PERIM_T, y: 0, w: PERIM_T, h: OFFICE_HEIGHT });

// --- Internal walls around vertical corridor (x=CORRIDOR_X1..X2) ---
// Top-left room's right wall: x = CORRIDOR_X1, y from PERIM_T+TOP_BAND to CORRIDOR_Y1
// Door opening in middle of vertical wall
const TL_DOOR_Y = (PERIM_T + TOP_BAND + CORRIDOR_Y1) / 2 - DOOR_W / 2;
pushWall({ x: CORRIDOR_X1, y: PERIM_T + TOP_BAND, w: WALL_T, h: TL_DOOR_Y - (PERIM_T + TOP_BAND) });
pushWall({ x: CORRIDOR_X1, y: TL_DOOR_Y + DOOR_W, w: WALL_T, h: CORRIDOR_Y1 - (TL_DOOR_Y + DOOR_W) });

// Top-right room's left wall (mirror)
pushWall({ x: CORRIDOR_X2 - WALL_T, y: PERIM_T + TOP_BAND, w: WALL_T, h: TL_DOOR_Y - (PERIM_T + TOP_BAND) });
pushWall({ x: CORRIDOR_X2 - WALL_T, y: TL_DOOR_Y + DOOR_W, w: WALL_T, h: CORRIDOR_Y1 - (TL_DOOR_Y + DOOR_W) });

// Bottom-left room's right wall
const BL_DOOR_Y = (CORRIDOR_Y2 + OFFICE_HEIGHT - PERIM_T) / 2 - DOOR_W / 2;
pushWall({ x: CORRIDOR_X1, y: CORRIDOR_Y2, w: WALL_T, h: BL_DOOR_Y - CORRIDOR_Y2 });
pushWall({ x: CORRIDOR_X1, y: BL_DOOR_Y + DOOR_W, w: WALL_T, h: OFFICE_HEIGHT - PERIM_T - (BL_DOOR_Y + DOOR_W) });

// Bottom-right room's left wall (mirror)
pushWall({ x: CORRIDOR_X2 - WALL_T, y: CORRIDOR_Y2, w: WALL_T, h: BL_DOOR_Y - CORRIDOR_Y2 });
pushWall({ x: CORRIDOR_X2 - WALL_T, y: BL_DOOR_Y + DOOR_W, w: WALL_T, h: OFFICE_HEIGHT - PERIM_T - (BL_DOOR_Y + DOOR_W) });

// --- Internal walls around horizontal corridor (y=CORRIDOR_Y1..Y2) ---
// Top-left room's bottom wall: y = CORRIDOR_Y1, x from PERIM_T to CORRIDOR_X1
const TL_DOOR_X = (PERIM_T + CORRIDOR_X1) / 2 - DOOR_W / 2;
pushWall({ x: PERIM_T, y: CORRIDOR_Y1, w: TL_DOOR_X - PERIM_T, h: WALL_T });
pushWall({ x: TL_DOOR_X + DOOR_W, y: CORRIDOR_Y1, w: CORRIDOR_X1 - (TL_DOOR_X + DOOR_W), h: WALL_T });
// Bottom-left room's top wall (mirror)
pushWall({ x: PERIM_T, y: CORRIDOR_Y2 - WALL_T, w: TL_DOOR_X - PERIM_T, h: WALL_T });
pushWall({ x: TL_DOOR_X + DOOR_W, y: CORRIDOR_Y2 - WALL_T, w: CORRIDOR_X1 - (TL_DOOR_X + DOOR_W), h: WALL_T });

// Top-right room's bottom wall
const TR_DOOR_X = (CORRIDOR_X2 + OFFICE_WIDTH - PERIM_T) / 2 - DOOR_W / 2;
pushWall({ x: CORRIDOR_X2, y: CORRIDOR_Y1, w: TR_DOOR_X - CORRIDOR_X2, h: WALL_T });
pushWall({ x: TR_DOOR_X + DOOR_W, y: CORRIDOR_Y1, w: OFFICE_WIDTH - PERIM_T - (TR_DOOR_X + DOOR_W), h: WALL_T });
// Bottom-right room's top wall (mirror)
pushWall({ x: CORRIDOR_X2, y: CORRIDOR_Y2 - WALL_T, w: TR_DOOR_X - CORRIDOR_X2, h: WALL_T });
pushWall({ x: TR_DOOR_X + DOOR_W, y: CORRIDOR_Y2 - WALL_T, w: OFFICE_WIDTH - PERIM_T - (TR_DOOR_X + DOOR_W), h: WALL_T });

// --- Furniture (also collidable) ---
// Boardroom (top-left): conference table + chairs
const TABLE_RECT: Rect = { x: 160, y: 130, w: 200, h: 70 };
pushWall(TABLE_RECT);

// Engineering (top-right): two desks + server rack
const DESK1: Rect = { x: 580, y: 110, w: 90, h: 36 };
const DESK2: Rect = { x: 760, y: 110, w: 90, h: 36 };
const SERVER_RACK: Rect = { x: 880, y: 80, w: 36, h: 120 };
pushWall(DESK1);
pushWall(DESK2);
pushWall(SERVER_RACK);

// Design (bottom-left): easel + mood board
const EASEL_RECT: Rect = { x: 90, y: 420, w: 50, h: 80 };
const MOOD_BOARD: Rect = { x: 240, y: 360, w: 120, h: 14 };
pushWall(EASEL_RECT);
pushWall(MOOD_BOARD);

// Marketing (bottom-right): pin board + screen
const PIN_BOARD_RECT: Rect = { x: 580, y: 360, w: 140, h: 16 };
const SCREEN: Rect = { x: 800, y: 380, w: 100, h: 12 };
const PRESENTER_DESK: Rect = { x: 770, y: 470, w: 130, h: 36 };
pushWall(PIN_BOARD_RECT);
pushWall(SCREEN);
pushWall(PRESENTER_DESK);

// Plants in corridors
const PLANTS: Rect[] = [
  { x: 462, y: 40, w: 16, h: 16 },
  { x: 482, y: 40, w: 16, h: 16 },
  { x: 462, y: 540, w: 16, h: 16 },
  { x: 482, y: 540, w: 16, h: 16 },
];
PLANTS.forEach(pushWall);

// Coffee station in horizontal corridor
const COFFEE_STATION: Rect = { x: 24, y: 290, w: 24, h: 20 };
pushWall(COFFEE_STATION);

// ---- Render helpers ----
function FloorTiles() {
  const tileW = 32;
  const tileH = 24;
  const tiles: { x: number; y: number; fill: string }[] = [];
  for (let y = PERIM_T + TOP_BAND; y < OFFICE_HEIGHT - PERIM_T; y += tileH) {
    for (let x = PERIM_T; x < OFFICE_WIDTH - PERIM_T; x += tileW) {
      const checker = (Math.floor(x / tileW) + Math.floor(y / tileH)) % 2;
      tiles.push({ x, y, fill: checker ? FLOOR_A : FLOOR_B });
    }
  }
  return (
    <>
      {tiles.map((t, i) => (
        <rect key={i} x={t.x} y={t.y} width={tileW} height={tileH} fill={t.fill} />
      ))}
      {/* Grout lines */}
      {tiles.map((t, i) => (
        <rect key={`g${i}`} x={t.x} y={t.y + tileH - 1} width={tileW} height={1} fill={FLOOR_GROUT} opacity={0.4} />
      ))}
    </>
  );
}

function Wall({ r }: { r: Rect }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={WALL} />
      <rect x={r.x} y={r.y} width={r.w} height={Math.min(2, r.h)} fill={WALL_HI} />
      <rect x={r.x} y={r.y + r.h - 1} width={r.w} height={1} fill={WALL_TRIM} />
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
        y={PERIM_T + TOP_BAND - 10}
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize={14}
        fontWeight={700}
        letterSpacing={4}
        fill={HEADER_FG}
      >
        ◆ STARTUP HQ ◆
      </text>
    </g>
  );
}

function RoomLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize={10}
      fontWeight={700}
      letterSpacing={3}
      fill={ROOM_LABEL}
      opacity={0.7}
    >
      {text}
    </text>
  );
}

function ConferenceTable() {
  const r = TABLE_RECT;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={TABLE} />
      <rect x={r.x} y={r.y} width={r.w} height={3} fill={TABLE_HI} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={TABLE_HI} opacity={0.15} />
      {/* Chairs around the table */}
      {[0.2, 0.5, 0.8].map((t, i) => (
        <rect key={`top${i}`} x={r.x + r.w * t - 8} y={r.y - 14} width={16} height={12} fill={CHAIR} />
      ))}
      {[0.2, 0.5, 0.8].map((t, i) => (
        <rect key={`bot${i}`} x={r.x + r.w * t - 8} y={r.y + r.h + 2} width={16} height={12} fill={CHAIR} />
      ))}
      <rect x={r.x - 14} y={r.y + r.h / 2 - 8} width={12} height={16} fill={CHAIR} />
      <rect x={r.x + r.w + 2} y={r.y + r.h / 2 - 8} width={12} height={16} fill={CHAIR} />
    </g>
  );
}

function Desk({ r, withMonitor }: { r: Rect; withMonitor?: boolean }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={DESK} />
      <rect x={r.x} y={r.y} width={r.w} height={2} fill={"#9C7A48"} />
      <rect x={r.x} y={r.y + r.h - 2} width={r.w} height={2} fill={DESK_DARK} />
      {withMonitor && (
        <>
          <rect x={r.x + r.w / 2 - 14} y={r.y - 18} width={28} height={18} fill={MONITOR_FRAME} />
          <rect x={r.x + r.w / 2 - 12} y={r.y - 16} width={24} height={14} fill={MONITOR_SCREEN} />
          <rect x={r.x + r.w / 2 - 1} y={r.y} width={2} height={2} fill={MONITOR_FRAME} />
        </>
      )}
    </g>
  );
}

function ServerRack() {
  const r = SERVER_RACK;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={SERVER} />
      <rect x={r.x + 1} y={r.y + 1} width={r.w - 2} height={1} fill={WALL_HI} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={r.x + 4} y={r.y + 10 + i * 18} width={r.w - 8} height={10} fill={"#0F0E0C"} />
          <rect x={r.x + 6} y={r.y + 13 + i * 18} width={3} height={2} fill={SERVER_LIGHT} />
          <rect x={r.x + 12} y={r.y + 13 + i * 18} width={2} height={2} fill="#F2C744" />
        </g>
      ))}
    </g>
  );
}

function Easel() {
  const r = EASEL_RECT;
  return (
    <g shapeRendering="crispEdges">
      {/* legs */}
      <rect x={r.x + 4} y={r.y} width={3} height={r.h} fill={EASEL} />
      <rect x={r.x + r.w - 7} y={r.y} width={3} height={r.h} fill={EASEL} />
      {/* canvas */}
      <rect x={r.x} y={r.y + 6} width={r.w} height={48} fill={CANVAS} />
      <rect x={r.x} y={r.y + 6} width={r.w} height={2} fill="#BFBCB1" />
      <rect x={r.x + 8} y={r.y + 18} width={12} height={12} fill={PALETTE_TEAL} />
      <rect x={r.x + 24} y={r.y + 30} width={14} height={10} fill={PALETTE_PINK} />
    </g>
  );
}

function MoodBoard() {
  const r = MOOD_BOARD;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={PIN_BOARD_FRAME} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={PIN_BOARD} />
      {/* mini swatches */}
      <rect x={r.x + 8} y={r.y + 4} width={16} height={6} fill={PALETTE_PINK} />
      <rect x={r.x + 30} y={r.y + 4} width={16} height={6} fill={PALETTE_TEAL} />
      <rect x={r.x + 52} y={r.y + 4} width={16} height={6} fill="#F2C744" />
      <rect x={r.x + 74} y={r.y + 4} width={16} height={6} fill={POSTER_BLUE} />
      <rect x={r.x + 96} y={r.y + 4} width={16} height={6} fill={POSTER_RED} />
    </g>
  );
}

function PinBoard() {
  const r = PIN_BOARD_RECT;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={PIN_BOARD_FRAME} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={PIN_BOARD} />
      {/* posters */}
      <rect x={r.x + 8} y={r.y + 4} width={28} height={8} fill={POSTER_BLUE} />
      <rect x={r.x + 44} y={r.y + 4} width={28} height={8} fill={POSTER_RED} />
      <rect x={r.x + 80} y={r.y + 4} width={28} height={8} fill="#F2C744" />
    </g>
  );
}

function PresentationScreen() {
  const r = SCREEN;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={MONITOR_FRAME} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={POSTER_BLUE} />
      <rect x={r.x + 10} y={r.y + 4} width={20} height={2} fill="#F4F1E8" />
      <rect x={r.x + 10} y={r.y + 7} width={36} height={2} fill="#F4F1E8" opacity={0.6} />
    </g>
  );
}

function Plant({ r }: { r: Rect }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y + r.h - 6} width={r.w} height={6} fill={PLANT_POT} />
      <rect x={r.x + 2} y={r.y + 1} width={r.w - 4} height={r.h - 6} fill={PLANT_LEAF} />
      <rect x={r.x + 2} y={r.y + 1} width={r.w - 4} height={3} fill={PLANT_LEAF_DARK} />
      <rect x={r.x + r.w / 2 - 1} y={r.y + 4} width={2} height={r.h - 10} fill={PLANT_LEAF_DARK} />
    </g>
  );
}

function CoffeeStation() {
  const r = COFFEE_STATION;
  return (
    <g shapeRendering="crispEdges">
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={COFFEE} />
      <rect x={r.x + 4} y={r.y + 4} width={r.w - 8} height={8} fill={COFFEE_LIGHT} />
      <rect x={r.x + 8} y={r.y + 14} width={2} height={4} fill="#F4F1E8" />
      <rect x={r.x + 14} y={r.y + 14} width={2} height={4} fill="#F4F1E8" />
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
      {/* Outer void/wall fill */}
      <rect x={0} y={0} width={OFFICE_WIDTH} height={OFFICE_HEIGHT} fill={WALL_TRIM} />

      {/* Floor tiles inside playable area */}
      <FloorTiles />

      {/* Header band */}
      <Header />

      {/* Furniture (under walls so wall trim sits on top of monitors etc.) */}
      <ConferenceTable />
      <Desk r={DESK1} withMonitor />
      <Desk r={DESK2} withMonitor />
      <ServerRack />
      <Easel />
      <MoodBoard />
      <PinBoard />
      <PresentationScreen />
      <Desk r={PRESENTER_DESK} />

      {/* Plants */}
      {PLANTS.map((p, i) => (
        <Plant key={i} r={p} />
      ))}
      <CoffeeStation />

      {/* All collidable wall rectangles (perimeter + internal). Furniture is
          already drawn above; we draw walls last so they sit on top. */}
      {WALL_RECTS
        // Skip furniture — already drawn — but draw the wall AABBs.
        .filter(
          (r) =>
            r !== TABLE_RECT &&
            r !== DESK1 &&
            r !== DESK2 &&
            r !== SERVER_RACK &&
            r !== EASEL_RECT &&
            r !== MOOD_BOARD &&
            r !== PIN_BOARD_RECT &&
            r !== SCREEN &&
            r !== PRESENTER_DESK &&
            r !== COFFEE_STATION &&
            !PLANTS.includes(r),
        )
        .map((r, i) => (
          <Wall key={i} r={r} />
        ))}

      {/* Room labels */}
      <RoomLabel x={(PERIM_T + CORRIDOR_X1) / 2} y={PERIM_T + TOP_BAND + 18} text="BOARDROOM" />
      <RoomLabel x={(CORRIDOR_X2 + OFFICE_WIDTH - PERIM_T) / 2} y={PERIM_T + TOP_BAND + 18} text="ENGINEERING" />
      <RoomLabel x={(PERIM_T + CORRIDOR_X1) / 2} y={CORRIDOR_Y2 + 18} text="DESIGN STUDIO" />
      <RoomLabel x={(CORRIDOR_X2 + OFFICE_WIDTH - PERIM_T) / 2} y={CORRIDOR_Y2 + 18} text="MARKETING POD" />
    </svg>
  );
}
