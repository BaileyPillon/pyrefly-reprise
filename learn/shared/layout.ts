/**
 * The explode transform: where one piece sits, and how the stage is rotated,
 * for a given `explode` value (`docs/plans/learning-sites.md` "The shared
 * explorer engine").
 *
 * The whole trip is two eased legs joined at `explode` 0.6, `piece.home` ->
 * `piece.burst` -> the piece's packed inventory slot (from `pack.ts`), with
 * depth (`z`) flattening to 0 and the stage's rotation easing to front-on by
 * `explode` 1. Both legs use the same easing curve and meet with the same
 * value at 0.6 from either side, so there is no visible seam.
 */

import type { Piece } from './model.ts';
import type { ViewName } from './store.ts';

/** A piece's packed position in the inventory grid (`pack.ts`'s `PackedSlot`, kept untyped here to avoid a cyclic import). */
export interface PieceSlot {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** The full transform a stage applies to one piece for a given `explode`. */
export interface PieceTransform {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly scale: number;
  readonly rotateY: number;
}

/** Where the two legs of the trip meet. Both `pieceTransform` and `stageRotation` join exactly here. */
const BURST_END = 0.6;

/** Cubic ease-in-out: monotonic on [0, 1], exact endpoints `easeInOut(0) === 0` and `easeInOut(1) === 1`. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Where `piece` sits at `explode`, travelling toward `slot` (its inventory
 * cell) once past the burst. `explode` 0 returns exactly `piece.home`
 * (scale 1); `explode` 1 returns exactly the slot's `x`/`y` with `z` 0.
 */
export function pieceTransform(piece: Piece, slot: PieceSlot, explode: number): PieceTransform {
  const progress = clamp01(explode);

  if (progress <= BURST_END) {
    const t = easeInOut(progress / BURST_END);
    return {
      x: lerp(piece.home.x, piece.burst.x, t),
      y: lerp(piece.home.y, piece.burst.y, t),
      z: lerp(piece.home.z, piece.burst.z, t),
      scale: 1,
      rotateY: 0,
    };
  }

  const t = easeInOut((progress - BURST_END) / (1 - BURST_END));
  const inventoryScale = piece.size > 0 ? slot.w / piece.size : 1;
  return {
    x: lerp(piece.burst.x, slot.x, t),
    y: lerp(piece.burst.y, slot.y, t),
    z: lerp(piece.burst.z, 0, t),
    scale: lerp(1, inventoryScale, t),
    rotateY: 0,
  };
}

/** The base yaw (degrees) of each view rail position before the explode eases it flat. */
const VIEW_ANGLES: Record<ViewName, number> = {
  threeQuarter: 45,
  front: 0,
  side: 90,
  back: 180,
};

/**
 * The stage's own rotation (degrees around Y) at `explode`: the chosen
 * view's angle up to the burst, then eased to exactly 0 (front-on) by
 * `explode` 1, so the inventory grid at 1 is always viewed head-on.
 */
export function stageRotation(view: ViewName, explode: number): number {
  const progress = clamp01(explode);
  const base = VIEW_ANGLES[view];

  if (progress <= BURST_END) {
    return base;
  }

  const t = easeInOut((progress - BURST_END) / (1 - BURST_END));
  return lerp(base, 0, t);
}
