/**
 * Stage geometry for site A — kept separate from the facts (`data.ts` and
 * friends never import from here except to place a `Piece`).
 *
 * Two kinds of placement:
 *  - **Ported.** Chapter 5's five painted parts (Tail/Leg/Body/Head/Shuyin)
 *    reuse the exact boxes from the verified target frames
 *    `docs/concepts/atlas/a-boss-atlas/a1-assembled.html` (home, `explode`
 *    0) and `a2-exploded-selected.html` (burst, `explode` 0.55) — `left`,
 *    `top`, `width`, `z-index` and `.flip`, read straight out of the frames'
 *    inline styles. Those frames are authored on a 1600 x 900 canvas
 *    (`a-boss-atlas/a.css`) and so is `learn/shared/themes/tokens.css`'s
 *    `.pyx-canvas`, so **one stage unit is one frame pixel**: a ported box
 *    needs no rescaling, only a shift from the frame's top-left origin to the
 *    stage's own origin (`ORIGIN`, where `.pyx-stage__world` sits). Positions
 *    stay top-left corners, exactly as the frames record them
 *    (`PieceStage` in `learn/shared/model.ts` explains why the anchor moved:
 *    the frames record no heights, so a centre would have to be guessed).
 *  - **Procedural.** Everything else: a chapter with no approved frame gets
 *    its primary unit large and centred with the rest smaller around it, and
 *    every "card" or "tile" piece (an ability, a support part with no
 *    painting of its own, a status/immunity/affinity/AI-script/reward fact)
 *    is placed relative to the piece it belongs to — a card fans out from its
 *    parent at `burst` (and sits tucked inside it at `home`); a tile never
 *    separates from its parent at all. Those arrangements are **not** an
 *    approved end state; only chapter 5's is.
 */

import type { PieceStage, Vec3 } from '../shared/model.ts';

/** The design canvas every approved frame (and `tokens.css`) is authored at. One stage unit = one of these pixels. */
const CANVAS = { width: 1600, height: 900 } as const;

/** Where `.pyx-stage__world` sits on that canvas (`tokens.css`: `left: 50%; top: 52%`). Every stage position is relative to it. */
const ORIGIN = { x: CANVAS.width * 0.5, y: CANVAS.height * 0.52 } as const;

/**
 * The part of the canvas no chrome covers, in stage units: right of the
 * systems panel, left of the card column, below the switcher, above the
 * slider. Derived from the same percentages `tokens.css` positions those four
 * with, minus a small gutter. Everything the stage draws — the assembled
 * machine, the pulled-apart parts and their cards, the inventory — lives
 * inside this box.
 */
export const FREE_STAGE = {
  x: 364 - ORIGIN.x,
  y: 96 - ORIGIN.y,
  width: 1212 - 364,
  height: 767 - 96,
} as const;

/** Kept for callers that want the nominal stage box rather than the chrome-derived one. */
export const STAGE = {
  width: FREE_STAGE.width,
  height: FREE_STAGE.height,
  /** `z` stays within [-zHalfRange, zHalfRange]. */
  zHalfRange: 200,
} as const;

/** A placement is a top-left corner at rest and at burst, plus the box the piece is drawn in. */
export interface Placement {
  readonly home: Vec3;
  readonly burst: Vec3;
  readonly stage?: PieceStage;
}

function clampZ(z: number): number {
  return Math.max(-STAGE.zHalfRange, Math.min(STAGE.zHalfRange, z));
}

// ---------------------------------------------------------------------------
// Ported: chapter 5's five painted parts
// ---------------------------------------------------------------------------

interface PixelBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  /** CSS `z-index` in the source frame: paint order, and the stage's depth cue. */
  readonly zIndex: number;
  /** The frame's `.part.flip`. */
  readonly flip?: boolean;
}

/** `a1-assembled.html`, `explode` 0 — the `.part` boxes, in document order. */
const A1_HOME_PX: Record<string, PixelBox> = {
  'vegnagun-tail': { left: 792, top: 318, width: 384, zIndex: 1 },
  'vegnagun-leg': { left: 872, top: 300, width: 226, zIndex: 1 },
  'vegnagun-body': { left: 462, top: 326, width: 552, zIndex: 2 },
  'vegnagun-head': { left: 420, top: 120, width: 424, zIndex: 3, flip: true },
  shuyin: { left: 1088, top: 596, width: 80, zIndex: 4 },
};

/** `a2-exploded-selected.html`, `explode` 0.55 — the `#p-*` boxes. */
const A2_BURST_PX: Record<string, PixelBox> = {
  'vegnagun-tail': { left: 936, top: 118, width: 190, zIndex: 1, flip: true },
  'vegnagun-leg': { left: 1004, top: 402, width: 108, zIndex: 1 },
  'vegnagun-body': { left: 566, top: 322, width: 340, zIndex: 2 },
  'vegnagun-head': { left: 392, top: 108, width: 266, zIndex: 3, flip: true },
  shuyin: { left: 402, top: 566, width: 116, zIndex: 4 },
};

/**
 * A stacking order turned into a little real depth, so the CSS perspective
 * gives the near parts a touch more size than the far ones without moving
 * them off the frame's own positions.
 */
function zForLayer(zIndex: number): number {
  return clampZ((zIndex - 2.5) * 40);
}

function topLeft(box: PixelBox): Vec3 {
  return { x: box.left - ORIGIN.x, y: box.top - ORIGIN.y, z: zForLayer(box.zIndex) };
}

/** Combatant id -> ported placement, chapter 5's five painted parts only. */
export const CH5_PAINTED: Readonly<Record<string, Placement>> = Object.fromEntries(
  Object.entries(A1_HOME_PX).map(([id, home]) => {
    const burst = A2_BURST_PX[id];
    if (burst === undefined) {
      throw new Error(`learn/atlas/arrange: "${id}" has an a1 box but no a2 box`);
    }
    return [
      id,
      {
        home: topLeft(home),
        burst: topLeft(burst),
        // `flipX` and `layer` come from the assembled frame: that is the one whole
        // machine, and a cutout that mirrored itself halfway through the explode
        // would read as a different part rather than the same one moving.
        stage: { width: home.width, burstWidth: burst.width, flipX: home.flip === true, layer: home.zIndex },
      } satisfies Placement,
    ];
  }),
);

// ---------------------------------------------------------------------------
// Procedural: everything else
// ---------------------------------------------------------------------------

/** Widths for a chapter with no approved frame: the primary unit large, the rest a supporting size. */
const PROCEDURAL = { primaryWidth: 360, otherWidth: 190, burstScale: 0.8 } as const;

/**
 * Lays out `n` main pieces for a chapter with **no approved frame**: the
 * first (the chapter's primary combatant) large and centred, the rest
 * smaller on a ring around it at rest and spread across the free stage once
 * pulled apart. Unapproved by construction — only chapter 5's arrangement
 * has Bailey's yes (AGENTS.md hard rule 9).
 */
export function arrangeMainUnits(n: number): Placement[] {
  return Array.from({ length: n }, (_, i) => {
    const primary = i === 0;
    const width = primary ? PROCEDURAL.primaryWidth : PROCEDURAL.otherWidth;
    const burstWidth = Math.round(width * PROCEDURAL.burstScale);
    const layer = primary ? 3 : 2;
    const stage: PieceStage = { width, burstWidth, layer };

    if (primary) {
      return {
        home: { x: -width / 2, y: -width * 0.45, z: zForLayer(layer) },
        burst: { x: -burstWidth / 2, y: -burstWidth * 0.4, z: zForLayer(layer) },
        stage,
      };
    }

    const others = n - 1;
    const t = others <= 1 ? 0.5 : (i - 1) / (others - 1); // 0..1, left to right
    const angle = Math.PI * (1.15 + 0.7 * t); // an arc behind and around the primary
    return {
      home: {
        x: Math.cos(angle) * 230 - width / 2,
        y: Math.sin(angle) * 120 - width * 0.4,
        z: zForLayer(layer),
      },
      burst: {
        x: FREE_STAGE.x + 30 + t * Math.max(0, FREE_STAGE.width - 60 - burstWidth),
        y: FREE_STAGE.y + (i % 2 === 1 ? 40 : FREE_STAGE.height * 0.52),
        z: zForLayer(layer),
      },
      stage,
    };
  });
}

const FAN_RADIUS = 110;
const FAN_Y_STEP = 16;

/**
 * A "card" piece (an ability, or a support part with no painting of its
 * own): tucked exactly at its parent at `home` (not yet visibly separate),
 * fanned out around the parent at `burst` — `index` of `count` siblings
 * sharing the same parent, spread evenly around a small ring. The stage only
 * uses these positions for the pieces it does *not* draw as a threaded card
 * (`learn/shared/threads.ts` places those from the parent's real box), so
 * this stays a safe fallback rather than the arrangement anyone sees.
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
