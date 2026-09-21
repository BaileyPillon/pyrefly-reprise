/**
 * Stage geometry for site A — kept separate from the facts (`data.ts` and
 * friends never import from here except to place a `Piece`).
 *
 * Two kinds of placement:
 *  - **Ported.** Chapter 5's five painted parts (Tail/Leg/Body/Head/Shuyin)
 *    reuse the exact boxes from the verified target frames
 *    `docs/concepts/atlas/a-boss-atlas/a1-assembled.html` (home, `explode`
 *    0) and `a2-exploded-selected.html` (burst, `explode` ~0.55), read
 *    straight out of `build-a.mjs`'s inline styles rather than re-measuring
 *    the rendered HTML. Those frames use a 1600x900 canvas
 *    (`a-boss-atlas/a.css` `html, body { width: 1600px; height: 900px }`);
 *    this module rescales that canvas onto the shared stage box, 1000x560
 *    units, origin at stage centre, `z` in -200..200. A box's centre is
 *    approximated as `(left + width/2, top + width/2)` — the frames don't
 *    record each image's height, and a rough centre is enough for a stage
 *    position (this is not a pixel-accurate re-render).
 *  - **Procedural.** Everything else: a chapter's other main pieces are laid
 *    out along the stage, and every "card" or "tile" piece (an ability, a
 *    support part with no painting of its own, a status/immunity/affinity/
 *    AI-script/reward fact) is placed relative to the piece it belongs to —
 *    a card fans out from its parent at `burst` (and sits tucked inside it
 *    at `home`); a tile never separates from its parent at all.
 */

import type { Vec3 } from '../shared/model.ts';

/** The shared 3D stage every site's pieces are positioned on (CSS-transform units, not pixels). */
export const STAGE = {
  width: 1000,
  height: 560,
  /** `z` stays within [-zHalfRange, zHalfRange]. */
  zHalfRange: 200,
} as const;

export interface Placement {
  readonly home: Vec3;
  readonly burst: Vec3;
}

function clampZ(z: number): number {
  return Math.max(-STAGE.zHalfRange, Math.min(STAGE.zHalfRange, z));
}

// ---------------------------------------------------------------------------
// Ported: chapter 5's five painted parts
// ---------------------------------------------------------------------------

/** The a-boss-atlas mockup's canvas, `a-boss-atlas/a.css`. */
const CANVAS = { width: 1600, height: 900 };

interface PixelBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  /** CSS `z-index` in the source frame — stacking order only, rescaled below into stage depth. */
  readonly zIndex: number;
}

/** `a1-assembled.html`, `explode` 0 — `build-a.mjs`'s `a1` template literal. */
const A1_HOME_PX: Record<string, PixelBox> = {
  'vegnagun-tail': { left: 792, top: 318, width: 384, zIndex: 1 },
  'vegnagun-leg': { left: 872, top: 300, width: 226, zIndex: 1 },
  'vegnagun-body': { left: 462, top: 326, width: 552, zIndex: 2 },
  'vegnagun-head': { left: 420, top: 120, width: 424, zIndex: 3 },
  shuyin: { left: 1088, top: 596, width: 80, zIndex: 3 },
};

/** `a2-exploded-selected.html`, `explode` 55 — the `#p-*` boxes in `build-a.mjs`'s `a2` template literal. */
const A2_BURST_PX: Record<string, PixelBox> = {
  'vegnagun-tail': { left: 936, top: 118, width: 190, zIndex: 1 },
  'vegnagun-leg': { left: 1004, top: 402, width: 108, zIndex: 1 },
  'vegnagun-body': { left: 566, top: 322, width: 340, zIndex: 2 },
  'vegnagun-head': { left: 392, top: 108, width: 266, zIndex: 3 },
  shuyin: { left: 402, top: 566, width: 116, zIndex: 4 },
};

function centerOf(box: PixelBox): { x: number; y: number } {
  return { x: box.left + box.width / 2, y: box.top + box.width / 2 };
}

/** Rescales a stacking z-index into the stage's z range, relative to the other boxes in the same frame. */
function zFromIndex(zIndex: number, allIndices: readonly number[]): number {
  const min = Math.min(...allIndices);
  const max = Math.max(...allIndices);
  if (max === min) return 0;
  const frac = (zIndex - min) / (max - min); // 0..1
  return clampZ((frac - 0.5) * 2 * STAGE.zHalfRange);
}

function pixelBoxesToStage(byId: Record<string, PixelBox>): Record<string, Vec3> {
  const allIndices = Object.values(byId).map((box) => box.zIndex);
  const result: Record<string, Vec3> = {};
  for (const [id, box] of Object.entries(byId)) {
    const center = centerOf(box);
    result[id] = {
      x: (center.x - CANVAS.width / 2) * (STAGE.width / CANVAS.width),
      y: (center.y - CANVAS.height / 2) * (STAGE.height / CANVAS.height),
      z: zFromIndex(box.zIndex, allIndices),
    };
  }
  return result;
}

/** Combatant id -> ported `home` position, chapter 5's five painted parts only. */
export const CH5_PAINTED_HOME: Readonly<Record<string, Vec3>> = pixelBoxesToStage(A1_HOME_PX);

/** Combatant id -> ported `burst` position, chapter 5's five painted parts only. */
export const CH5_PAINTED_BURST: Readonly<Record<string, Vec3>> = pixelBoxesToStage(A2_BURST_PX);

// ---------------------------------------------------------------------------
// Procedural: everything else
// ---------------------------------------------------------------------------

/**
 * Lays out `n` main pieces (paintings with no ported position — every main
 * piece outside chapter 5) left to right: tightly clustered at `home`,
 * spread wider at `burst`, each a little further forward than the last so
 * they don't stack exactly on top of one another once exploded.
 */
export function arrangeMainUnits(n: number): Placement[] {
  if (n === 0) return [];
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1); // 0..1, left to right
    const centered = t - 0.5; // -0.5..0.5
    return {
      home: { x: centered * STAGE.width * 0.5, y: 0, z: clampZ(centered * STAGE.zHalfRange * 0.4) },
      burst: { x: centered * STAGE.width * 0.85, y: 0, z: clampZ(centered * STAGE.zHalfRange * 0.8) },
    };
  });
}

const FAN_RADIUS = 90;
const FAN_Y_STEP = 14;

/**
 * A "card" piece (an ability, or a support part with no painting of its
 * own): tucked exactly at its parent at `home` (not yet visibly separate),
 * fanned out around the parent at `burst` — `index` of `count` siblings
 * sharing the same parent, spread evenly around a small ring.
 */
export function fanCard(parent: Placement, index: number, count: number): Placement {
  const angle = count > 0 ? (index / count) * Math.PI * 2 : 0;
  const dx = Math.cos(angle) * FAN_RADIUS;
  const dz = Math.sin(angle) * FAN_RADIUS;
  const dy = (index - (count - 1) / 2) * FAN_Y_STEP;
  return {
    home: parent.home,
    burst: { x: parent.burst.x + dx, y: parent.burst.y + dy, z: clampZ(parent.burst.z + dz) },
  };
}

/** A "tile" piece (a catalogue fact — a status, immunity, affinity, AI script or reward): always co-located with the piece it describes, at both `home` and `burst`. */
export function sitAtParent(parent: Placement): Placement {
  return { home: parent.home, burst: parent.burst };
}
