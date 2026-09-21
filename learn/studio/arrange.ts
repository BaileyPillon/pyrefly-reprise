/**
 * Procedural `home`/`burst` positions for site B's specimen
 * (`docs/plans/learning-sites.md` "B · studio/"). Pure arithmetic, no DOM —
 * `specimen.ts` is the only caller.
 *
 * Layout: the eight step cards sit on a single track left to right, in
 * `STUDIO_COMPONENTS` order, across a stage box `STUDIO_STAGE.width` x
 * `STUDIO_STAGE.height` units centred on the origin (`{0,0,0}` is the stage's
 * middle, matching `learn/shared/layout.ts`'s CSS-transform-unit space). Each
 * rule tile lives at its own step's column: packed into a small grid at
 * `home` (collapsed into the card, `explode` 0) and fanned out below and
 * behind that card at `burst` (`explode` ~0.6, per `layout.ts`'s two-leg
 * trip). Tile size and count never move the step cards — the track's spacing
 * is fixed at 8 columns regardless of how many rules a system owns.
 */

import type { Vec3 } from '../shared/model.ts';
import { STUDIO_COMPONENTS, type StudioComponentId } from './rules.ts';

/** The stage box every piece's coordinates are computed against. */
export const STUDIO_STAGE = { width: 1000, height: 560 } as const;

/** Horizontal margin left on each side of the track before the first/last card. */
const TRACK_MARGIN = 90;

/** How far a step card pops toward the viewer once past the burst threshold. */
const CARD_BURST_DEPTH = 220;

/** How far a tile's grid sits behind (and below) its step card at burst. */
const TILE_BURST_DEPTH = 60;
const TILE_BURST_DROP = 150;

/** Spacing between adjacent tile centres in a component's burst grid. */
const TILE_CELL = 34;

/** 0-based position of `component` on the track, left to right. Throws for an unknown id — every caller passes a `STUDIO_COMPONENTS` id. */
export function stepIndex(component: StudioComponentId): number {
  const index = STUDIO_COMPONENTS.findIndex((c) => c.id === component);
  if (index < 0) throw new Error(`arrange: unknown component "${component}"`);
  return index;
}

/** The card's resting x on the track: evenly spaced, centred on the stage's origin. */
function trackX(index: number): number {
  const count = STUDIO_COMPONENTS.length;
  const usable = STUDIO_STAGE.width - TRACK_MARGIN * 2;
  if (count <= 1) return 0;
  return -usable / 2 + (usable * index) / (count - 1);
}

/** A step card's position at `explode` 0: flat on the track, no depth. */
export function stepHome(component: StudioComponentId): Vec3 {
  return { x: trackX(stepIndex(component)), y: 0, z: 0 };
}

/** A step card's position at the burst: the same column, pushed toward the viewer. */
export function stepBurst(component: StudioComponentId): Vec3 {
  return { x: trackX(stepIndex(component)), y: 0, z: CARD_BURST_DEPTH };
}

/** A tile's small-grid offset from its step's column, `index`/`count` within that one component. */
function tileGridOffset(index: number, count: number): { readonly dx: number; readonly dy: number } {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    dx: (col - (cols - 1) / 2) * TILE_CELL,
    dy: (row - (rows - 1) / 2) * TILE_CELL,
  };
}

/**
 * A rule tile's position at `explode` 0: collapsed onto its own step card's
 * column, so it reads as "packed inside" the assembled piece until exploded.
 */
export function tileHome(component: StudioComponentId): Vec3 {
  return stepHome(component);
}

/** A rule tile's position at the burst: fanned into a small grid under its step card. */
export function tileBurst(component: StudioComponentId, index: number, count: number): Vec3 {
  const base = stepBurst(component);
  const { dx, dy } = tileGridOffset(index, count);
  return { x: base.x + dx, y: base.y + TILE_BURST_DROP + dy, z: base.z - TILE_BURST_DEPTH };
}
