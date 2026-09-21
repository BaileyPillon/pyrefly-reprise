/**
 * Site B's authored stage geometry: every box, pin and card position the
 * studio painter draws, in **canvas pixels** (the 1600 x 900 design size every
 * approved frame is authored at, `learn/shared/region.ts`).
 *
 * Ported from the approved frames
 * `docs/concepts/atlas/b-battle-studio/b1-assembled.html` and
 * `b2-exploded-selected.html`, with one documented change: those frames were
 * drawn with their own chrome — no detail card on the right, an FFX-2 preview
 * panel instead — so their stage spans x 240 to 1250, while the shared shell's
 * chrome-free box (`FREE_STAGE`) is x 364 to 1176. Every value below is the
 * frame's composition **refitted into `FREE_STAGE`**: the pictorial elements
 * (backdrop, turntable, figures, shadows) keep the frame's proportions and
 * stacking, and the text blocks keep the frame's own type sizes and their
 * position relative to the figures, because scaling them down would have put
 * card text under 13px. `learn-studio-scene.test.ts` proves every box here
 * really is inside `FREE_STAGE` — the one thing a picture cannot show.
 *
 * Positions are top-left anchored, matching `PieceStage`'s anchor, and are
 * converted to the world's own origin-relative space by {@link toWorld}.
 *
 * FFX only (AGENTS.md hard rule 14): this is the CTB turn list and the
 * chapter-1 Mt. Gagazet cast. FFX-2 has gauges, not a turn list, and gets no
 * geometry here.
 */

import type { StageBox } from '../shared/region.ts';
import { ORIGIN } from '../shared/region.ts';
import type { StudioComponentId } from './rules.ts';

/** A point in canvas pixels. */
export interface ScenePoint {
  readonly x: number;
  readonly y: number;
}

/** A painted cutout on the turntable. Exactly one of {@link width} / {@link height} is set, as the frames do, so the art's own aspect decides the other. */
export interface SceneFigure {
  readonly art: string;
  readonly x: number;
  readonly y: number;
  readonly width?: number;
  readonly height?: number;
  /**
   * The painting's natural height ÷ width, measured from the file when this
   * composition was authored. The painter uses it only to draw the first
   * frame at the right shape (it then learns the loaded image's real aspect
   * and redraws), and `learn-studio-scene.test.ts` uses it to check the
   * composition fits. Never used to *set* both dimensions: the art keeps its
   * own aspect, so a regenerated painting is never stretched.
   */
  readonly aspect: number;
  /** Paint order, low to high. */
  readonly layer: number;
  /** The backdrop-lit treatment the frame gives the rear cutout (`b.css` `.fig.back`). */
  readonly back?: boolean;
}

/** A figure's on-stage box, from whichever dimension the frame authored plus `aspect`. */
export function figureBox(figure: SceneFigure, aspect = figure.aspect): StageBox {
  const w = figure.width ?? (figure.height ?? 0) / aspect;
  const h = figure.height ?? (figure.width ?? 0) * aspect;
  return { x: figure.x, y: figure.y, w, h };
}

/** The lit turntable and the plinth under it (`b.css` `.plinth` / `.turntable`). */
export interface SceneTable {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  /** Vertical squash, the frame's `--sq`. */
  readonly squash: number;
}

/** One state of the stage: the frame's whole pictorial composition. */
export interface SceneState {
  readonly backdrop: StageBox;
  readonly table: SceneTable;
  readonly shadows: readonly StageBox[];
  readonly figures: readonly SceneFigure[];
}

const TIDUS = 'characters/tidus/attack.png';
const SEYMOUR = 'characters/seymour-flux-body/idle.png';
const MORTIORCHIS = 'characters/mortiorchis/idle.png';

/** The backdrop cyclorama behind the turntable, the same Mt. Gagazet plate chapter 1 fights on. */
export const BACKDROP_ART = 'backdrops/gagazet.png';

/** Natural height ÷ width of each painting, measured 2026-09-21. See {@link SceneFigure.aspect}. */
const ASPECT = { tidus: 1135 / 816, seymour: 1211 / 750, mortiorchis: 829 / 1201 } as const;

/** `explode` 0: the whole turn assembled on the lit turntable (frame b1). */
export const ASSEMBLED: SceneState = {
  backdrop: { x: 380, y: 150, w: 780, h: 446 },
  table: { cx: 730, cy: 640, rx: 330, squash: 0.2 },
  shadows: [
    { x: 455, y: 600, w: 210, h: 40 },
    { x: 800, y: 568, w: 180, h: 38 },
  ],
  figures: [
    { art: MORTIORCHIS, x: 636, y: 200, width: 340, aspect: ASPECT.mortiorchis, layer: 1, back: true },
    { art: SEYMOUR, x: 766, y: 300, height: 300, aspect: ASPECT.seymour, layer: 2 },
    { art: TIDUS, x: 426, y: 335, height: 300, aspect: ASPECT.tidus, layer: 3 },
  ],
};

/** The burst (`explode` ~0.6): the figures pull back into the middle and the eight steps ring them (frame b2). */
export const SEPARATED: SceneState = {
  backdrop: { x: 596, y: 276, w: 344, h: 197 },
  table: { cx: 768, cy: 655, rx: 195, squash: 0.19 },
  shadows: [
    { x: 620, y: 612, w: 160, h: 32 },
    { x: 790, y: 596, w: 130, h: 28 },
  ],
  figures: [
    { art: MORTIORCHIS, x: 726, y: 262, width: 200, aspect: ASPECT.mortiorchis, layer: 1, back: true },
    { art: SEYMOUR, x: 786, y: 396, height: 224, aspect: ASPECT.seymour, layer: 2 },
    { art: TIDUS, x: 610, y: 400, height: 240, aspect: ASPECT.tidus, layer: 3 },
  ],
};

/** Where the big gold damage numeral sits in each state (`b.css` `.dmg`). */
export const DAMAGE_MARK = {
  assembled: { x: 700, y: 250, scale: 1 },
  separated: { x: 742, y: 404, scale: 0.64 },
} as const;

/**
 * One numbered annotation of the assembled frame: the pin, and the readout
 * that hangs off it. `pin` is the pin's own top-left; `body` is the top-left
 * of the block under it.
 */
export interface ScenePin {
  readonly component: StudioComponentId;
  /** The frame's two-digit number, "01" to "08". */
  readonly badge: string;
  readonly label: string;
  readonly pin: ScenePoint;
  readonly body: ScenePoint;
  /** A second line under the body, where the frame draws one (`b.css` `.plain`). */
  readonly note?: ScenePoint;
  /** False where the frame draws the number alone, because the block beside it already names itself (pin 07 sits on "Overdrive gauge"). */
  readonly showLabel?: boolean;
  /** Width the body block is laid out at, for the boxes the containment test checks. */
  readonly width: number;
  readonly height: number;
}

/**
 * The eight pins of frame b1, in `STUDIO_COMPONENTS` order. The frame numbers
 * them 01 to 08 and puts each readout beside the thing it belongs to — the
 * command banner by Tidus, the boss's intent over Seymour's aeon, the turn
 * list down the right — and so does this.
 */
export const PINS: readonly ScenePin[] = [
  {
    component: 'turn',
    badge: '01',
    label: 'Turn order',
    pin: { x: 984, y: 444 },
    body: { x: 984, y: 502 },
    note: { x: 968, y: 474 },
    width: 184,
    height: 195,
  },
  {
    component: 'command',
    badge: '02',
    label: 'Command',
    pin: { x: 390, y: 250 },
    body: { x: 394, y: 286 },
    note: { x: 390, y: 332 },
    width: 200,
    height: 40,
  },
  { component: 'hit', badge: '03', label: 'Hit roll', pin: { x: 676, y: 332 }, body: { x: 706, y: 332 }, width: 200, height: 26 },
  { component: 'damage', badge: '04', label: 'Damage', pin: { x: 690, y: 214 }, body: { x: 700, y: 250 }, width: 160, height: 62 },
  { component: 'element', badge: '05', label: 'Element', pin: { x: 676, y: 366 }, body: { x: 706, y: 366 }, width: 200, height: 26 },
  { component: 'status', badge: '06', label: 'Status', pin: { x: 676, y: 400 }, body: { x: 706, y: 400 }, width: 200, height: 26 },
  {
    component: 'overdrive',
    badge: '07',
    label: 'Overdrive gauge',
    pin: { x: 430, y: 650 },
    body: { x: 464, y: 648 },
    width: 270,
    height: 34,
    showLabel: false,
  },
  {
    component: 'boss',
    badge: '08',
    label: "The boss's next move",
    pin: { x: 886, y: 120 },
    body: { x: 886, y: 154 },
    width: 250,
    height: 34,
  },
];

/** One of the eight step cards of frame b2, with the frame's own perspective tilt. */
export interface SceneStep {
  readonly component: StudioComponentId;
  readonly badge: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** The frame's `transform` on that card, minus the shared `perspective()`. */
  readonly tilt: string;
}

const STEP_W = 210;
const STEP_H = 150;

/**
 * The ring of frame b2, refitted: three cards down each side and two across
 * the top, each turned toward the middle exactly as the frame turns them.
 */
export const STEPS: readonly SceneStep[] = [
  { component: 'turn', badge: '01', x: 368, y: 562, w: STEP_W, h: STEP_H, tilt: 'rotateY(22deg) scale(1.03)' },
  { component: 'command', badge: '02', x: 372, y: 408, w: STEP_W, h: STEP_H, tilt: 'rotateY(22deg)' },
  { component: 'hit', badge: '03', x: 376, y: 254, w: STEP_W, h: STEP_H, tilt: 'rotateY(22deg) scale(.97)' },
  { component: 'damage', badge: '04', x: 500, y: 100, w: STEP_W, h: STEP_H, tilt: 'rotateX(-11deg)' },
  { component: 'element', badge: '05', x: 740, y: 100, w: STEP_W, h: STEP_H, tilt: 'rotateX(-11deg)' },
  { component: 'status', badge: '06', x: 956, y: 254, w: STEP_W, h: STEP_H, tilt: 'rotateY(-22deg) scale(.97)' },
  { component: 'overdrive', badge: '07', x: 960, y: 408, w: STEP_W, h: STEP_H, tilt: 'rotateY(-22deg)' },
  { component: 'boss', badge: '08', x: 964, y: 562, w: STEP_W, h: STEP_H, tilt: 'rotateY(-22deg) scale(1.03)' },
];

/** The dashed track the frame runs behind the ring (`b2`'s `path.trk`), through the card centres. */
export const TRACK_PATH = 'M473 637 V 329 Q 473 175 605 175 H 845 Q 1063 175 1063 329 V 637';

/** Where the stubs point: the middle of the figure group, so every leader line reads as "this card is about that". */
export const STAGE_FOCUS: ScenePoint = { x: 768, y: 470 };

/** A canvas x -> the world layer's own origin-relative space. */
export function wx(x: number): number {
  return x - ORIGIN.x;
}

/** A canvas y -> the world layer's own origin-relative space. */
export function wy(y: number): number {
  return y - ORIGIN.y;
}

/** Canvas pixels -> the world layer's own origin-relative space. */
export function toWorld(point: ScenePoint): ScenePoint {
  return { x: wx(point.x), y: wy(point.y) };
}

/** A canvas-pixel box -> the world layer's own space. */
export function boxToWorld(box: StageBox): StageBox {
  return { x: box.x - ORIGIN.x, y: box.y - ORIGIN.y, w: box.w, h: box.h };
}

/** Every box this scene draws at `explode` 0 and at the burst, for the containment test. */
export function sceneBoxes(): readonly StageBox[] {
  const boxes: StageBox[] = [];
  for (const state of [ASSEMBLED, SEPARATED]) {
    boxes.push(state.backdrop);
    boxes.push({
      x: state.table.cx - state.table.rx,
      y: state.table.cy - state.table.rx * state.table.squash,
      w: state.table.rx * 2,
      h: state.table.rx * 2 * state.table.squash + 15,
    });
    boxes.push(...state.shadows);
    for (const figure of state.figures) boxes.push(figureBox(figure));
  }
  for (const pin of PINS) {
    boxes.push({ x: pin.pin.x, y: pin.pin.y, w: 26, h: 26 });
    boxes.push({ x: pin.body.x, y: pin.body.y, w: pin.width, h: pin.height });
  }
  for (const step of STEPS) boxes.push({ x: step.x, y: step.y, w: step.w, h: step.h });
  return boxes;
}
