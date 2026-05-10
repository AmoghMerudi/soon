"use client";

import type { RoleKey } from "@/lib/dashboard/constants";

export type SpriteId = RoleKey | "founder";

type Palette = Record<string, string>;
type Sprite = { palette: Palette; rows: string[] };

const SKIN = "#E8C9A8";
const SKIN_SHADOW = "#C9A684";
const EYE = "#1A1815";
const MOUTH = "#7A2A20";
const PANTS_DARK = "#0F0E0C";
const BOOT = "#3A2412";
const BOOT_SHADE = "#1F1209";

// Each sprite is 24 wide x 32 tall.
// Heads preserve the signature look from the original PFP avatars
// (lib/dashboard/avatars/index.tsx). Bodies extend the same outfit colors
// downward into shoulders/arms/hands/torso/legs/boots so they read as
// full game characters.

// ---------- CEO: black suit, white shirt, gold tie ----------
const CEO: Sprite = {
  palette: {
    H: "#1F1A14",
    S: SKIN, s: SKIN_SHADOW, E: EYE,
    J: "#1A1815", W: "#F4F1E8", Y: "#F2C744",
    P: PANTS_DARK, B: BOOT, b: BOOT_SHADE,
  },
  rows: [
    "........HHHHHHHH........", // 0
    ".......HHHHHHHHHH.......", // 1
    "......HHHHHHHHHHHH......", // 2
    "......HSSSSSSSSSSH......", // 3
    "......HSSSSSSSSSSH......", // 4
    "......HSSEESSEESSH......", // 5
    "......HSSSSSSSSSSH......", // 6
    "......HSSSSSSSSSSH......", // 7
    ".......sSSSSSSSSs.......", // 8
    "........SSSSSSSS........", // 9  neck
    "......JJWWWWWWWWJJ......", // 10 collar
    ".....JJJWWWWWWWWJJJ.....", // 11
    ".....JJJJWWYYWWJJJJ.....", // 12 lapels + tie
    ".....JJJJJWYYWJJJJJ.....", // 13
    ".....JJJJJJYYJJJJJJ.....", // 14
    ".....JJJJJJYYJJJJJJ.....", // 15
    ".....SSJJJJYYJJJJSS.....", // 16 hands
    ".........JJYYJJ.........", // 17 waist
    "........JJJJJJJJ........", // 18 belt
    "........PPPPPPPP........", // 19 pants
    "........PPPPPPPP........", // 20
    "........PPPPPPPP........", // 21
    "........PPP..PPP........", // 22 legs split
    "........PPP..PPP........", // 23
    "........PPP..PPP........", // 24
    "........PPP..PPP........", // 25
    "........PPP..PPP........", // 26
    "........PPP..PPP........", // 27
    ".......BBBB..BBBB.......", // 28 boots
    ".......bBBB..BBBb.......", // 29
    "........................", // 30
    "........................", // 31
  ],
};

// ---------- CTO: techie — dark hair, simple eyes, dark hoodie w/ green zipper ----------
const CTO: Sprite = {
  palette: {
    H: "#2A1810",    // dark hair
    S: SKIN, s: SKIN_SHADOW, E: EYE,
    G: "#2A2D33",    // hoodie (charcoal)
    g: "#2D6B4F",    // green zipper accent (signature CTO color)
    k: "#1F4D38",    // hood inner (darker green)
    P: PANTS_DARK, B: BOOT, b: BOOT_SHADE,
  },
  rows: [
    "........HHHHHHHH........", // 0  hair top
    ".......HHHHHHHHHH.......", // 1
    "......HHHHHHHHHHHH......", // 2
    "......HSSSSSSSSSSH......", // 3  forehead
    "......HSSSSSSSSSSH......", // 4
    "......HSSSSSSSSSSH......", // 5
    "......HSSEESSEESSH......", // 6  simple eyes
    "......HSSSSSSSSSSH......", // 7
    "......HSSSSSSSSSSH......", // 8
    ".......sSSSSSSSSs.......", // 9  jaw
    "........SSSSSSSS........", // 10 neck
    "......GGGGGGGGGGGG......", // 11 hoodie shoulders
    "......GkkkkkkkkkkG......", // 12 hood collar (green inner peeks)
    "......GGGGGggGGGGG......", // 13 green zipper down center
    "......GGGGGggGGGGG......", // 14
    "......GGGGGggGGGGG......", // 15
    "......GGGGGggGGGGG......", // 16
    "......SSGGGggGGGSS......", // 17 hands
    ".........GGggGG.........", // 18 hem
    "........PPPPPPPP........", // 19 pants
    "........PPPPPPPP........", // 20
    "........PPPPPPPP........", // 21
    "........PPP..PPP........", // 22
    "........PPP..PPP........", // 23
    "........PPP..PPP........", // 24
    "........PPP..PPP........", // 25
    "........PPP..PPP........", // 26
    "........PPP..PPP........", // 27
    ".......BBBB..BBBB.......", // 28
    ".......bBBB..BBBb.......", // 29
    "........................", // 30
    "........................", // 31
  ],
};

// ---------- CMO: brown hair, white blazer, black lapels ----------
const CMO: Sprite = {
  palette: {
    H: "#3A2412",
    S: SKIN, s: SKIN_SHADOW, E: EYE,
    V: "#1A1815", W: "#F4F1E8",
    P: PANTS_DARK, B: BOOT, b: BOOT_SHADE,
  },
  rows: [
    "........HHHHHHHH........", // 0
    ".......HHHHHHHHHH.......", // 1
    "......HHHHHHHHHHHH......", // 2
    "......HSSSSSSSSSSH......", // 3
    "......HSSSSSSSSSSH......", // 4
    "......HSSEESSEESSH......", // 5
    "......HSSSSSSSSSSH......", // 6
    "......HSSSSSSSSSSH......", // 7
    ".......sSSSSSSSSs.......", // 8
    "........SSSSSSSS........", // 9
    "........VWWWWWWV........", // 10 lapels open
    ".......VVWWWWWWVV.......", // 11
    "......VVVWWWWWWVVV......", // 12
    "......VVVWWWWWWVVV......", // 13
    "......VVVWWWWWWVVV......", // 14
    "......VVVWWWWWWVVV......", // 15
    "......VVVWWWWWWVVV......", // 16
    "......SSVWWWWWWVSS......", // 17 hands
    ".........WWWWWW.........", // 18 hem
    "........PPPPPPPP........", // 19
    "........PPPPPPPP........", // 20
    "........PPPPPPPP........", // 21
    "........PPP..PPP........", // 22
    "........PPP..PPP........", // 23
    "........PPP..PPP........", // 24
    "........PPP..PPP........", // 25
    "........PPP..PPP........", // 26
    "........PPP..PPP........", // 27
    ".......BBBB..BBBB.......", // 28
    ".......bBBB..BBBb.......", // 29
    "........................", // 30
    "........................", // 31
  ],
};

// ---------- Developer: dark hair w/ part, dark blue hoodie + gray drawstrings ----------
const DEVELOPER: Sprite = {
  palette: {
    H: "#4A2A1A",
    S: SKIN, s: SKIN_SHADOW, E: EYE,
    Z: "#1F2937", W: "#BFBCB1",
    P: "#1A2435", B: BOOT, b: BOOT_SHADE,
  },
  rows: [
    "........HHHH.HHH........", // 0  hair part
    ".......HHHHHHHHHH.......", // 1
    "......HHHHHHHHHHHH......", // 2
    "......HSSSSSSSSSSH......", // 3
    "......HSSSSSSSSSSH......", // 4
    "......HSSEESSEESSH......", // 5
    "......HSSSSSSSSSSH......", // 6
    "......HSSSSSSSSSSH......", // 7
    ".......sSSSSSSSSs.......", // 8
    "........SSSSSSSS........", // 9
    "......ZZZZZZZZZZZZ......", // 10 hoodie shoulders
    "......ZZZZZWWZZZZZ......", // 11 drawstrings
    "......ZZZZZWWZZZZZ......", // 12
    "......ZZZZZZZZZZZZ......", // 13
    "......ZZZZZZZZZZZZ......", // 14
    "......ZZZZZZZZZZZZ......", // 15
    "......ZZZZZZZZZZZZ......", // 16
    "......SSZZZZZZZZSS......", // 17 hands
    ".........ZZZZZZ.........", // 18 hem
    "........PPPPPPPP........", // 19 jeans
    "........PPPPPPPP........", // 20
    "........PPPPPPPP........", // 21
    "........PPP..PPP........", // 22
    "........PPP..PPP........", // 23
    "........PPP..PPP........", // 24
    "........PPP..PPP........", // 25
    "........PPP..PPP........", // 26
    "........PPP..PPP........", // 27
    ".......BBBB..BBBB.......", // 28
    ".......bBBB..BBBb.......", // 29
    "........................", // 30
    "........................", // 31
  ],
};

// ---------- Designer: red beret, teal shirt with white stripe + pink dots ----------
const DESIGNER: Sprite = {
  palette: {
    R: "#C8483A", r: "#8B2A20",
    H: "#2A1810",
    S: SKIN, s: SKIN_SHADOW, E: EYE,
    T: "#2D6B7E", t: "#F4F1E8", D: "#E08AC9",
    P: PANTS_DARK, B: BOOT, b: BOOT_SHADE,
  },
  rows: [
    "........RRRRRRRR........", // 0  beret
    ".......RRRRRRRRRR.......", // 1
    "......RRRRRRRRRRRR......", // 2
    ".....RRRRRRRRRRRRRR.....", // 3
    ".....rrrrrrrrrrrrrr.....", // 4  beret rim
    "......HSSSSSSSSSSH......", // 5  face
    "......HSSSSSSSSSSH......", // 6
    "......HSSEESSEESSH......", // 7
    "......HSSSSSSSSSSH......", // 8
    ".......sSSSSSSSSs.......", // 9
    "........SSSSSSSS........", // 10 neck
    "......TTTTTTTTTTTT......", // 11 shirt shoulders
    "......TtttttttttT.......", // 12 horizontal stripe — count: 6+1+10+1=18, need 24 → trim
    "......TTTDDTTTTDDT......", // 13 will fix — placeholder
    "......TTTTTTTTTTTT......", // 14
    "......TTDDTTTTDDTT......", // 15
    "......TTTTTTTTTTTT......", // 16
    "......SSTTTTTTTTSS......", // 17 hands
    ".........TTTTTT.........", // 18 hem
    "........PPPPPPPP........", // 19
    "........PPPPPPPP........", // 20
    "........PPPPPPPP........", // 21
    "........PPP..PPP........", // 22
    "........PPP..PPP........", // 23
    "........PPP..PPP........", // 24
    "........PPP..PPP........", // 25
    "........PPP..PPP........", // 26
    "........PPP..PPP........", // 27
    ".......BBBB..BBBB.......", // 28
    ".......bBBB..BBBb.......", // 29
    "........................", // 30
    "........................", // 31
  ],
};

// ---------- Marketing: brown hair, deep blue shirt, friendly smile ----------
const MARKETING: Sprite = {
  palette: {
    H: "#5A3A20",
    S: SKIN, s: SKIN_SHADOW, E: EYE, M: MOUTH,
    T: "#1B3A6F", t: "#11264A",
    P: PANTS_DARK, B: BOOT, b: BOOT_SHADE,
  },
  rows: [
    "........HHHHHHHH........", // 0
    ".......HHHHHHHHHH.......", // 1
    "......HHHHHHHHHHHH......", // 2
    "......HSSSSSSSSSSH......", // 3
    "......HSSSSSSSSSSH......", // 4
    "......HSSEESSEESSH......", // 5
    "......HSSSSSSSSSSH......", // 6
    "......HSSSMMMMSSSH......", // 7  smile
    ".......sSSSSSSSSs.......", // 8
    "........SSSSSSSS........", // 9
    "......TTTTTTTTTTTT......", // 10 shirt shoulders
    "......TTTTTTTTTTTT......", // 11
    "......TTTTTTTTTTTT......", // 12
    "......TTTttttttTT.......", // 13 — fix width
    "......TTTTTTTTTTTT......", // 14
    "......TTTTTTTTTTTT......", // 15
    "......TTTTTTTTTTTT......", // 16
    "......SSTTTTTTTTSS......", // 17
    ".........TTTTTT.........", // 18
    "........PPPPPPPP........", // 19
    "........PPPPPPPP........", // 20
    "........PPPPPPPP........", // 21
    "........PPP..PPP........", // 22
    "........PPP..PPP........", // 23
    "........PPP..PPP........", // 24
    "........PPP..PPP........", // 25
    "........PPP..PPP........", // 26
    "........PPP..PPP........", // 27
    ".......BBBB..BBBB.......", // 28
    ".......bBBB..BBBb.......", // 29
    "........................", // 30
    "........................", // 31
  ],
};

// ---------- Founder (the player) — orange hoodie + jeans, distinct from the 6 NPCs ----------
const FOUNDER: Sprite = {
  palette: {
    H: "#3A2412",
    S: SKIN, s: SKIN_SHADOW, E: EYE, M: MOUTH,
    O: "#E08A3C", o: "#A8602A",
    P: "#1A2435", B: BOOT, b: BOOT_SHADE,
  },
  rows: [
    "........HHHHHHHH........", // 0
    ".......HHHHHHHHHH.......", // 1
    "......HHHHHHHHHHHH......", // 2
    "......HSSSSSSSSSSH......", // 3
    "......HSSSSSSSSSSH......", // 4
    "......HSSSSSSSSSSH......", // 5
    "......HSSEESSEESSH......", // 6
    "......HSSSSSSSSSSH......", // 7
    "......HSSSMMMMSSSH......", // 8
    ".......sSSSSSSSSs.......", // 9
    "........SSSSSSSS........", // 10
    "......OOOOOOOOOOOO......", // 11 hoodie shoulders
    "......OOOOOOOOOOOO......", // 12
    "......OOOOOOOOOOOO......", // 13
    "......OOOoooooooOO......", // 14 hoodie shade
    "......OOOOOOOOOOOO......", // 15
    "......OOOOOOOOOOOO......", // 16
    "......SSOOOOOOOOSS......", // 17 hands
    ".........OOOOOO.........", // 18 hem
    "........PPPPPPPP........", // 19
    "........PPPPPPPP........", // 20
    "........PPPPPPPP........", // 21
    "........PPP..PPP........", // 22
    "........PPP..PPP........", // 23
    "........PPP..PPP........", // 24
    "........PPP..PPP........", // 25
    "........PPP..PPP........", // 26
    "........PPP..PPP........", // 27
    ".......BBBB..BBBB.......", // 28
    ".......bBBB..BBBb.......", // 29
    "........................", // 30
    "........................", // 31
  ],
};

const SPRITES: Record<SpriteId, Sprite> = {
  ceo: CEO,
  cto: CTO,
  cmo: CMO,
  developer: DEVELOPER,
  designer: DESIGNER,
  marketing: MARKETING,
  user: FOUNDER,
  founder: FOUNDER,
};

// Skip leg + boot palette letters in static rect rendering — drawn procedurally
// per walk frame so we can do a proper alternating step.
const PROCEDURAL_LETTERS = new Set(["P", "p", "B", "b"]);

function spriteToRects(sprite: Sprite) {
  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  for (let y = 0; y < sprite.rows.length; y++) {
    const row = sprite.rows[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "." || !sprite.palette[ch] || PROCEDURAL_LETTERS.has(ch)) {
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

export const PLAYGROUND_SPRITE_W = 24;
export const PLAYGROUND_SPRITE_H = 32;

type Rect = { x: number; y: number; w: number; h: number; fill: string };

// Draw legs + boots procedurally so we can do a proper 2-frame walk cycle:
//   frame 0 = idle (both feet planted)
//   frame 1 = left foot stepping (lifted), right planted
//   frame 2 = right foot stepping (lifted), left planted
function drawLegs(palette: Palette, walkFrame: 0 | 1 | 2): Rect[] {
  const P = palette.P || "#0F0E0C";
  const rects: Rect[] = [];

  // Pants top (waist), always full
  rects.push({ x: 8, y: 19, w: 8, h: 3, fill: P });

  if (walkFrame === 0) {
    // Both legs same length, both feet planted
    rects.push({ x: 8, y: 22, w: 3, h: 6, fill: P });
    rects.push({ x: 13, y: 22, w: 3, h: 6, fill: P });
    addBoot(rects, 7, 28, false);
    addBoot(rects, 13, 28, true);
  } else if (walkFrame === 1) {
    // Left foot stepping (lifted up + slightly inward), right foot planted
    rects.push({ x: 8, y: 22, w: 3, h: 5, fill: P });   // left leg shorter (knee bent)
    rects.push({ x: 13, y: 22, w: 3, h: 6, fill: P });  // right leg straight
    addBoot(rects, 8, 26, false);   // left boot up + shifted right (forward)
    addBoot(rects, 13, 28, true);   // right boot planted
  } else {
    // Mirror: right foot stepping
    rects.push({ x: 8, y: 22, w: 3, h: 6, fill: P });
    rects.push({ x: 13, y: 22, w: 3, h: 5, fill: P });
    addBoot(rects, 7, 28, false);
    addBoot(rects, 12, 26, true);
  }

  return rects;
}

function addBoot(out: Rect[], x: number, y: number, mirror: boolean) {
  out.push({ x, y, w: 4, h: 1, fill: BOOT });
  out.push({ x, y: y + 1, w: 4, h: 1, fill: BOOT });
  out.push({ x: mirror ? x + 3 : x, y: y + 1, w: 1, h: 1, fill: BOOT_SHADE });
}

export function PlaygroundSprite({
  role,
  height,
  flipX,
  walkFrame = 0,
}: {
  role: SpriteId;
  height: number;
  flipX?: boolean;
  walkFrame?: 0 | 1 | 2;
}) {
  const sprite = SPRITES[role] ?? SPRITES.developer;
  const rects = spriteToRects(sprite);
  const legs = drawLegs(sprite.palette, walkFrame);
  const width = (height * PLAYGROUND_SPRITE_W) / PLAYGROUND_SPRITE_H;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${PLAYGROUND_SPRITE_W} ${PLAYGROUND_SPRITE_H}`}
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: "block",
        imageRendering: "pixelated",
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    >
      <ellipse cx={12} cy={30.5} rx={5} ry={1.2} fill="rgba(0,0,0,0.4)" />
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
      {legs.map((r, i) => (
        <rect key={`l${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
    </svg>
  );
}
