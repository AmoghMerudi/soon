import type { RoleKey } from "../constants";

type Palette = Record<string, string>;

type Sprite = {
  palette: Palette;
  rows: string[];
};

const SKIN = "#E8C9A8";
const EYE = "#1A1815";

const CEO_SPRITE: Sprite = {
  palette: {
    H: "#1F1A14",
    S: SKIN,
    E: EYE,
    J: "#1A1815",
    W: "#F4F1E8",
    T: "#F2C744",
  },
  rows: [
    "........................",
    "........................",
    "........................",
    "........HHHHHHHH........",
    ".......HHHHHHHHHH.......",
    "......HHHHHHHHHHHH......",
    "......HSSSSSSSSSSH......",
    "......HSSSSSSSSSSH......",
    "......HSSEESSEESSH......",
    "......HSSSSSSSSSSH......",
    "......HSSSSSSSSSSH......",
    ".......SSSSSSSSSS.......",
    "........SSSSSSSS........",
    ".........SSSSSS.........",
    ".........SSSSSS.........",
    "........JJWWWWJJ........",
    ".......JJJWTTWJJJ.......",
    "......JJJJWTTWJJJJ......",
    ".....JJJJJWTTWJJJJJ.....",
    "....JJJJJJWTTWJJJJJJ....",
    "....JJJJJJWTTWJJJJJJ....",
    "...JJJJJJJWTTWJJJJJJJ...",
    "...JJJJJJJJTTJJJJJJJJ...",
    "...JJJJJJJJJJJJJJJJJJ...",
  ],
};

const CTO_SPRITE: Sprite = {
  palette: {
    S: SKIN,
    E: EYE,
    G: "#2D6B4F",
    k: "#1F4D38",
    W: "#F4F1E8",
  },
  rows: [
    "........................",
    "........................",
    "......GGGGGGGGGGGG......",
    ".....GGGGGGGGGGGGGG.....",
    "....GGGGGGGGGGGGGGGG....",
    "....GGkkkkkkkkkkkkGG....",
    "....GGkSSSSSSSSSSkGG....",
    "....GGkSSSSSSSSSSkGG....",
    "....GGkSSEESSEESSkGG....",
    "....GGkSSSSSSSSSSkGG....",
    "....GGkSSSSSSSSSSkGG....",
    ".....GkSSSSSSSSSSkG.....",
    "......kSSSSSSSSSSk......",
    "........SSSSSSSS........",
    ".........SSSSSS.........",
    ".......GGGGWWGGGG.......",
    "......GGGGGWWGGGGG......",
    ".....GGGGGGWWGGGGGG.....",
    "....GGGGGGGWWGGGGGGG....",
    "....GGGGGGGGGGGGGGGG....",
    "...GGGGGGGGGGGGGGGGGG...",
    "...GGGGGGGGGGGGGGGGGG...",
    "..GGGGGGGGGGGGGGGGGGGG..",
    "..GGGGGGGGGGGGGGGGGGGG..",
  ],
};

const CMO_SPRITE: Sprite = {
  palette: {
    H: "#3A2412",
    S: SKIN,
    E: EYE,
    V: "#1A1815",
    W: "#F4F1E8",
  },
  rows: [
    "........................",
    "........................",
    "........................",
    "........HHHHHHHH........",
    ".......HHHHHHHHHH.......",
    "......HHHHHHHHHHHH......",
    "......HSSSSSSSSSSH......",
    "......HSSSSSSSSSSH......",
    "......HSSEESSEESSH......",
    "......HSSSSSSSSSSH......",
    "......HSSSSSSSSSSH......",
    ".......SSSSSSSSSS.......",
    "........SSSSSSSS........",
    ".........SSSSSS.........",
    ".........SSSSSS.........",
    "........VWWWWWWV........",
    ".......VVWWWWWWVV.......",
    "......VVVWWWWWWVVV......",
    ".....VVVVWWWWWWVVVV.....",
    "....VVVVVWWWWWWVVVVV....",
    "....VVVVVWWWWWWVVVVV....",
    "...VVVVVVWWWWWWVVVVVV...",
    "...VVVVVVWWWWWWVVVVVV...",
    "...VVVVVVVVWWVVVVVVVV...",
  ],
};

const DEVELOPER_SPRITE: Sprite = {
  palette: {
    H: "#4A2A1A",
    S: SKIN,
    E: EYE,
    Z: "#1F2937",
    W: "#BFBCB1",
  },
  rows: [
    "........................",
    "........................",
    "........................",
    "........HHHH.HHH........",
    ".......HHHHHHHHHH.......",
    "......HHHHHHHHHHHH......",
    "......HSSSSSSSSSSH......",
    "......HSSSSSSSSSSH......",
    "......HSSEESSEESSH......",
    "......HSSSSSSSSSSH......",
    "......HSSSSSSSSSSH......",
    ".......SSSSSSSSSS.......",
    "........SSSSSSSS........",
    ".........SSSSSS.........",
    ".........SSSSSS.........",
    "........ZZZWWZZZ........",
    ".......ZZZZWWZZZZ.......",
    "......ZZZZZWWZZZZZ......",
    ".....ZZZZZZWWZZZZZZ.....",
    "....ZZZZZZZWWZZZZZZZ....",
    "....ZZZZZZZZZZZZZZZZ....",
    "...ZZZZZZZZZZZZZZZZZZ...",
    "..ZZZZZZZZZZZZZZZZZZZZ..",
    "..ZZZZZZZZZZZZZZZZZZZZ..",
  ],
};

const DESIGNER_SPRITE: Sprite = {
  palette: {
    B: "#C8483A",
    b: "#8B2A20",
    H: "#2A1810",
    S: SKIN,
    E: EYE,
    T: "#2D6B7E",
    t: "#F4F1E8",
    P: "#E08AC9",
  },
  rows: [
    "........................",
    "........BBBBBBBB........",
    ".......BBBBBBBBBB.......",
    "......BBBBBBBBBBBB......",
    ".....BBBBBBBBBBBBBB.....",
    ".....bbbbbbbbbbbbbb.....",
    "......HSSSSSSSSSSH......",
    "......HSSSSSSSSSSH......",
    "......HSSEESSEESSH......",
    "......HSSSSSSSSSSH......",
    "......HSSSSSSSSSSH......",
    ".......SSSSSSSSSS.......",
    "........SSSSSSSS........",
    ".........SSSSSS.........",
    ".........SSSSSS.........",
    "........TTttTTTT........",
    ".......TTttTTTTTT.......",
    "......TTttTTTTTTTT......",
    ".....TTttTTTTPTTTTT.....",
    "....TTttTTTTTTTTTTTT....",
    "....TTttTTTTPTTTTTTT....",
    "...TTttTTTTTTTTTTTTTT...",
    "...TTttTTTTTTTTTTTTTT...",
    "...TTTTTTTTTTTTTTTTTT...",
  ],
};

const MARKETING_SPRITE: Sprite = {
  palette: {
    H: "#5A3A20",
    S: SKIN,
    E: EYE,
    M: "#7A2A20",
    T: "#1B3A6F",
  },
  rows: [
    "........................",
    "........................",
    "........................",
    "........HHHHHHHH........",
    ".......HHHHHHHHHH.......",
    "......HHHHHHHHHHHH......",
    "......HSSSSSSSSSSH......",
    "......HSSSSSSSSSSH......",
    "......HSSEESSEESSH......",
    "......HSSSSSSSSSSH......",
    "......HSSSMMMMSSSH......",
    ".......SSSSSSSSSS.......",
    "........SSSSSSSS........",
    ".........SSSSSS.........",
    ".........SSSSSS.........",
    "........TTTTTTTT........",
    ".......TTTTTTTTTT.......",
    "......TTTTTTTTTTTT......",
    ".....TTTTTTTTTTTTTT.....",
    "....TTTTTTTTTTTTTTTT....",
    "....TTTTTTTTTTTTTTTT....",
    "...TTTTTTTTTTTTTTTTTT...",
    "...TTTTTTTTTTTTTTTTTT...",
    "...TTTTTTTTTTTTTTTTTT...",
  ],
};

const SPRITES: Record<RoleKey, Sprite> = {
  ceo: CEO_SPRITE,
  cto: CTO_SPRITE,
  cmo: CMO_SPRITE,
  developer: DEVELOPER_SPRITE,
  designer: DESIGNER_SPRITE,
  marketing: MARKETING_SPRITE,
};

function spriteToRects(sprite: Sprite) {
  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  for (let y = 0; y < sprite.rows.length; y++) {
    const row = sprite.rows[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "." || !sprite.palette[ch]) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === ch) w++;
      rects.push({ x, y, w, fill: sprite.palette[ch] });
      x += w;
    }
  }
  return rects;
}

export function RoleAvatar({ role, size }: { role: RoleKey; size: number }) {
  const sprite = SPRITES[role] ?? SPRITES.ceo;
  const rects = spriteToRects(sprite);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}
