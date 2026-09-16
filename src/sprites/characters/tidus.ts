/**
 * RETIRED — the pixel-art path.
 *
 * The game renders painted 2.5D (`src/engine/PaintedActor.ts`, backdrops and
 * character PNGs generated through `docs/ART-PIPELINE.md`). Nothing here is
 * reachable from `src/main.ts`; `node tools/orphans.mjs` lists this file as an
 * orphan by design. Kept for reference only — do not extend it, and do not
 * build new work against it.
 */
/**
 * Tidus — 48x64, roughly six heads tall, facing +x.
 *
 * Yellow hooded vest over a black chest panel, black knee-length shorts with
 * one long leg, a silver hip chain, yellow-and-black boots, and the Brotherhood
 * sword: a watery blue blade with a hooked barb and a gold guard, shouldered in
 * the idle pose.
 *
 * Original art. No retail assets. Type-only imports so `node
 * tools/render-sprite.mjs` can load this module directly.
 */

import type { Frame, ShapeOp, SpriteDef } from '../format.ts';

// ------------------------------------------------------------------ palette

const palette = {
  o: '#120f1c', // deep outline (cloth, metal)
  q: '#7a5512', // hair outline
  p: '#9a5c3c', // skin outline
  s: '#f7d2a8', // skin
  S: '#d3966a', // skin shade
  h: '#f8dd80', // hair blond
  H: '#d0a334', // hair shade
  w: '#fff4c2', // hair highlight
  y: '#f5c93c', // vest yellow
  Y: '#bd8f1d', // vest yellow shade
  b: '#30334a', // black cloth
  B: '#4c5070', // black cloth highlight
  e: '#2f74d6', // Brotherhood blue
  E: '#a9e6fb', // blade highlight
  D: '#1a3c78', // blade deep
  g: '#eec14a', // gold guard
  G: '#9a7217', // gold shade
  n: '#c6cddd', // silver chain
  W: '#ffffff', // glint
};

const CLOTH = { outline: 'o' } as const;
const SKIN = { outline: 'p' } as const;
const HAIR = { outline: 'q' } as const;

// ------------------------------------------------------------- Brotherhood

/**
 * The Brotherhood, drawn in a canonical pose (grip at the origin, blade along
 * +x) and rotated into place. `deg` is clockwise on screen; -90 points straight
 * up. `(hx, hy)` is the hand.
 */
function sword(hx: number, hy: number, deg: number): ShapeOp[] {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const sn = Math.sin(rad);
  const P = (px: number, py: number): [number, number] => [hx + px * c - py * sn, hy + px * sn + py * c];
  const L = (
    a: [number, number],
    b: [number, number],
    color: string,
  ): ShapeOp => ({ op: 'line', x1: a[0], y1: a[1], x2: b[0], y2: b[1], color, outline: false });
  return [
    // grip + pommel
    { op: 'poly', points: [P(-5, -1.4), P(0, -1.4), P(0, 1.4), P(-5, 1.4)], color: 'b', ...CLOTH },
    { op: 'poly', points: [P(-6.5, -1.8), P(-5, -1.8), P(-5, 1.8), P(-6.5, 1.8)], color: 'G', ...CLOTH },
    // gold guard across the blade root
    { op: 'poly', points: [P(0, -3.2), P(2, -2.6), P(2, 2.6), P(0, 3.2)], color: 'g', ...CLOTH },
    // blade: straight back edge, bellied front edge, point at 18
    {
      op: 'poly',
      points: [P(2.5, -2.2), P(13, -2.6), P(18, -0.2), P(15, 2.2), P(2.5, 2.2)],
      color: 'e',
      ...CLOTH,
    },
    // hooked barb off the back edge
    { op: 'poly', points: [P(9, 2.2), P(13.5, 4.6), P(13, 2.2)], color: 'e', ...CLOTH },
    // water light: pale along the leading edge, deep blue in the hollow
    L(P(3.5, -1.2), P(15.5, -0.9), 'E'),
    L(P(3.5, 1.1), P(10, 1.1), 'D'),
    { op: 'poly', points: [P(15.5, -0.6), P(17.5, -0.2), P(15.5, 0.6)], color: 'E', outline: false },
  ];
}

// -------------------------------------------------------------- body pieces

/** Lower body: shorts (one long leg), legs, boots, hip chain. */
function lowerBody(nearX: number, farX: number): ShapeOp[] {
  const n = nearX;
  const f = farX;
  return [
    // far leg (his left): long short-leg, boot set back
    { op: 'rect', x: f + 15, y: 45, w: 4, h: 8, color: 'S', ...SKIN },
    { op: 'poly', points: [[f + 12, 52], [f + 19, 52], [f + 20, 57], [f + 11, 57]], color: 'Y', ...CLOTH },
    { op: 'rect', x: f + 11, y: 56, w: 9, h: 2, color: 'b', ...CLOTH },
    // near leg
    { op: 'rect', x: n + 22, y: 38, w: 5, h: 15, color: 's', ...SKIN },
    { op: 'rect', x: n + 22, y: 38, w: 1, h: 15, color: 'S', outline: 'p' },
    { op: 'poly', points: [[n + 21, 52], [n + 28, 52], [n + 30, 58], [n + 20, 58]], color: 'y', ...CLOTH },
    { op: 'rect', x: n + 25, y: 53, w: 4, h: 2, color: 'b' },
    { op: 'rect', x: n + 20, y: 57, w: 11, h: 2, color: 'b', ...CLOTH },
    // shorts — the crotch notch between the leg pieces keeps the legs readable
    {
      op: 'poly',
      points: [[17 + Math.round(f / 2), 30], [27 + Math.round(n / 2), 30], [28 + n, 37], [16 + f, 37]],
      color: 'b',
      ...CLOTH,
    },
    { op: 'rect', x: f + 15, y: 37, w: 5, h: 9, color: 'b', ...CLOTH },
    { op: 'rect', x: f + 15, y: 45, w: 5, h: 1, color: 'B' },
    { op: 'rect', x: n + 22, y: 37, w: 6, h: 2, color: 'b', ...CLOTH },
    { op: 'rect', x: n + 22, y: 38, w: 6, h: 1, color: 'B' },
    // hip chain
    { op: 'line', x1: 27, y1: 33, x2: 29, y2: 37, color: 'n', ...CLOTH },
    { op: 'line', x1: 29, y1: 37, x2: 28, y2: 40, color: 'n', ...CLOTH },
  ];
}

const legs: ShapeOp[] = lowerBody(0, 0);
/** Combat stance: near foot forward, far foot planted back. */
const legsWide: ShapeOp[] = lowerBody(2, -2);

/** Torso: hood roll, yellow vest, black trim, belt, far arm, neck. */
const torso: ShapeOp[] = [
  // hood bunched behind the shoulders
  { op: 'ellipse', cx: 16, cy: 20, rx: 4, ry: 3.5, color: 'Y', ...CLOTH },
  { op: 'ellipse', cx: 16, cy: 20, rx: 2, ry: 1.6, color: 'y', outline: false },
  // vest
  { op: 'poly', points: [[17, 19], [27, 19], [28, 26], [26, 32], [18, 32], [16, 26]], color: 'y', ...CLOTH },
  // black collar + narrow front band
  { op: 'poly', points: [[18, 19], [26, 19], [25, 21], [19, 21]], color: 'b', outline: false },
  { op: 'poly', points: [[20, 21], [24, 21], [22, 26]], color: 'b', outline: false },
  { op: 'poly', points: [[26, 20], [28, 26], [26, 32], [24, 32]], color: 'b', outline: false },
  { op: 'line', x1: 24, y1: 20, x2: 26, y2: 26, color: 'Y', outline: false },
  // belt + buckle
  { op: 'rect', x: 17, y: 30, w: 10, h: 3, color: 'b', ...CLOTH },
  { op: 'rect', x: 21, y: 30, w: 3, h: 3, color: 'g', outline: false },
  // far arm: shoulder, armguard, hand
  { op: 'line', x1: 17, y1: 22, x2: 15, y2: 29, color: 'S', thickness: 2, ...SKIN },
  { op: 'rect', x: 14, y: 28, w: 3, h: 4, color: 'b', ...CLOTH },
  { op: 'rect', x: 14, y: 28, w: 3, h: 1, color: 'y', outline: false },
  { op: 'rect', x: 14, y: 32, w: 3, h: 3, color: 'S', ...SKIN },
  // neck
  { op: 'rect', x: 20, y: 16, w: 4, h: 4, color: 'S', ...SKIN },
];

/** Head: skull, jaw, blond spikes. The face itself is a pixel overlay. */
const head: ShapeOp[] = [
  { op: 'ellipse', cx: 21, cy: 12, rx: 4, ry: 4, color: 's', ...SKIN },
  { op: 'poly', points: [[18, 13], [25, 13], [24, 17], [20, 18]], color: 's', ...SKIN },
  { op: 'rect', x: 17, y: 12, w: 2, h: 4, color: 'S', outline: 'p' },
  // hair mass — a tight cap, not a mane: five short clumps
  { op: 'ellipse', cx: 21, cy: 10, rx: 4, ry: 3, color: 'h', ...HAIR },
  { op: 'rect', x: 16, y: 10, w: 3, h: 5, color: 'h', ...HAIR },
  { op: 'poly', points: [[16, 9], [14, 6], [19, 7]], color: 'h', ...HAIR },
  { op: 'poly', points: [[18, 7], [20, 4], [22, 7]], color: 'h', ...HAIR },
  { op: 'poly', points: [[22, 6], [25, 4], [25, 9]], color: 'h', ...HAIR },
  { op: 'poly', points: [[24, 8], [28, 10], [24, 12]], color: 'h', ...HAIR },
  { op: 'poly', points: [[16, 12], [13, 14], [16, 15]], color: 'h', ...HAIR },
  // brow shadow under the fringe, crown highlight
  { op: 'line', x1: 18, y1: 11, x2: 23, y2: 11, color: 'H', outline: false },
  { op: 'pixels', x: 20, y: 6, rows: ['w', 'w'], outline: false },
];

/** Face: brows, eyes, mouth. Stamped after shading so it never gets muddied. */
const face = [
  {
    x: 18,
    y: 12,
    rows: [
      '.q...q.',
      '.oe..oe',
      '.....S.',
      '.......',
      '....p..',
    ],
  },
];

/** Front arm reaching from the near shoulder to a grip point. */
function frontArm(ex: number, ey: number, hx: number, hy: number): ShapeOp[] {
  return [
    { op: 'line', x1: 26, y1: 21, x2: ex, y2: ey, color: 's', thickness: 2, ...SKIN },
    { op: 'line', x1: ex, y1: ey, x2: hx, y2: hy, color: 's', thickness: 2, ...SKIN },
    { op: 'ellipse', cx: hx, cy: hy, rx: 1.5, ry: 1.5, color: 's', ...SKIN },
  ];
}

// --------------------------------------------------------------- the sprite

const named: Record<string, Frame> = {
  legs: { ops: legs },
  legsWide: { ops: legsWide },
  torso: { ops: torso },
  head: { ops: head, overlays: face },
};

const stand = ['legs', 'torso', 'head'];

/** Idle: sword shouldered, blade angled up and forward. */
const idleSword: ShapeOp[] = [...frontArm(30, 27, 30, 24), ...sword(30, 24, -48)];

export const tidus: SpriteDef = {
  name: 'tidus',
  size: [48, 64],
  anchor: [22, 60],
  description: 'FFX — Tidus, Brotherhood shouldered. Yellow hooded vest, one long short leg.',
  palette,
  outline: 'o',
  shading: { light: 'top-right', strength: 0.24 },
  fps: 5,
  scale: 8,
  defaultState: 'idle',
  frames: named,
  stateOptions: {
    ready: { loop: false },
    attack: { loop: false, next: 'ready' },
    hurt: { loop: false, next: 'idle' },
    ko: { loop: false },
  },
  states: {
    idle: [
      { base: stand, ops: idleSword, duration: 520 },
      {
        base: ['legs', { frame: 'torso', offset: [0, -1] }, { frame: 'head', offset: [0, -1] }],
        ops: [...frontArm(30, 26, 30, 23), ...sword(30, 23, -48)],
        duration: 460,
      },
    ],

    ready: [
      {
        base: ['legsWide', { frame: 'torso', offset: [1, 0] }, { frame: 'head', offset: [1, 0] }],
        ops: [...frontArm(31, 26, 29, 28), ...sword(29, 28, -32)],
      },
    ],

    attack: [
      // wind-up: weight back, blade cocked high behind the head
      {
        base: [
          { frame: 'legsWide', offset: [-1, 0] },
          { frame: 'torso', offset: [-2, 0] },
          { frame: 'head', offset: [-2, 0] },
        ],
        ops: [
          { op: 'line', x1: 24, y1: 21, x2: 23, y2: 15, color: 's', thickness: 2, ...SKIN },
          { op: 'ellipse', cx: 23, cy: 14, rx: 1.5, ry: 1.5, color: 's', ...SKIN },
          ...sword(23, 14, -148),
        ],
        duration: 170,
      },
      // slash: arm swung through, blade low and forward, speed streak behind
      {
        base: [
          { frame: 'legsWide', offset: [1, 0] },
          { frame: 'torso', offset: [2, 0] },
          { frame: 'head', offset: [2, 1] },
        ],
        ops: [
          { op: 'arc', cx: 28, cy: 22, rx: 16, ry: 15, from: -104, to: 10, color: 'E', outline: false, shade: false },
          { op: 'arc', cx: 28, cy: 22, rx: 13, ry: 12, from: -92, to: 0, color: 'W', outline: false, shade: false },
          ...frontArm(33, 24, 34, 29),
          ...sword(34, 29, 52),
        ],
        duration: 110,
      },
      // follow-through: blade swept down past the leading foot
      {
        base: [
          { frame: 'legsWide', offset: [1, 0] },
          { frame: 'torso', offset: [1, 1] },
          { frame: 'head', offset: [1, 2] },
        ],
        ops: [...frontArm(31, 29, 31, 33), ...sword(31, 33, 72)],
        duration: 220,
      },
    ],

    hurt: [
      {
        base: [
          { frame: 'legs', offset: [-1, 0] },
          { frame: 'torso', offset: [-3, 1] },
          { frame: 'head', offset: [-4, 1] },
        ],
        ops: [
          { op: 'line', x1: 23, y1: 23, x2: 28, y2: 29, color: 's', thickness: 2, ...SKIN },
          { op: 'ellipse', cx: 29, cy: 30, rx: 1.5, ry: 1.5, color: 's', ...SKIN },
          ...sword(29, 30, 62),
        ],
        overlays: [{ x: 14, y: 13, rows: ['.q...q.', '.o...o.', '.......', '.......', '...o.o.'] }],
      },
    ],

    ko: [
      {
        ops: [
          // far arm flung back over his head
          { op: 'line', x1: 17, y1: 52, x2: 14, y2: 48, color: 'S', thickness: 2, ...SKIN },
          { op: 'rect', x: 13, y: 46, w: 3, h: 3, color: 'S', ...SKIN },
          // legs, knees loose, trailing right
          { op: 'rect', x: 28, y: 52, w: 9, h: 4, color: 's', ...SKIN },
          { op: 'rect', x: 28, y: 52, w: 9, h: 1, color: 'S', outline: 'p' },
          { op: 'poly', points: [[36, 51], [42, 52], [43, 57], [35, 57]], color: 'y', ...CLOTH },
          { op: 'rect', x: 35, y: 56, w: 8, h: 2, color: 'b', ...CLOTH },
          // shorts
          { op: 'poly', points: [[21, 50], [30, 51], [30, 57], [21, 57]], color: 'b', ...CLOTH },
          { op: 'rect', x: 26, y: 51, w: 4, h: 6, color: 'b', ...CLOTH },
          // torso on its back, vest flat to the ground
          { op: 'poly', points: [[13, 50], [22, 49], [23, 57], [14, 57]], color: 'y', ...CLOTH },
          { op: 'poly', points: [[16, 49], [19, 49], [19, 52], [16, 52]], color: 'b', outline: false },
          { op: 'rect', x: 20, y: 55, w: 4, h: 2, color: 'b', outline: false },
          // near arm across the chest
          { op: 'line', x1: 17, y1: 54, x2: 24, y2: 52, color: 's', thickness: 2, ...SKIN },
          // head, tipped back, hair splayed on the ground
          { op: 'ellipse', cx: 10, cy: 54, rx: 4, ry: 3.5, color: 's', ...SKIN },
          { op: 'ellipse', cx: 8, cy: 53, rx: 4, ry: 3, color: 'h', ...HAIR },
          { op: 'poly', points: [[8, 51], [5, 48], [10, 51]], color: 'h', ...HAIR },
          { op: 'poly', points: [[5, 53], [3, 55], [6, 56]], color: 'h', ...HAIR },
          // the Brotherhood, dropped on the ground in front of him
          ...sword(13, 57, -4),
        ],
        overlays: [{ x: 11, y: 53, rows: ['o.o', '...', '.p.'] }],
      },
    ],

    victory: [
      {
        base: stand,
        ops: [
          { op: 'line', x1: 26, y1: 21, x2: 30, y2: 19, color: 's', thickness: 2, ...SKIN },
          { op: 'ellipse', cx: 31, cy: 21, rx: 1.5, ry: 1.5, color: 's', ...SKIN },
          ...sword(31, 21, -70),
        ],
        duration: 420,
      },
      {
        base: ['legs', { frame: 'torso', offset: [0, -1] }, { frame: 'head', offset: [0, -2] }],
        ops: [
          { op: 'line', x1: 26, y1: 20, x2: 31, y2: 17, color: 's', thickness: 2, ...SKIN },
          { op: 'ellipse', cx: 32, cy: 19, rx: 1.5, ry: 1.5, color: 's', ...SKIN },
          ...sword(32, 19, -70),
          { op: 'pixels', x: 39, y: 1, rows: ['W'], outline: false, shade: false },
        ],
        duration: 380,
      },
    ],
  },
};

export default tidus;
