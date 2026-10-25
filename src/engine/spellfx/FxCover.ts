/**
 * THE DIM COVERS THE VIEW (r64, the trailer lane's finding on the live build r63): the `dim` atlas tile is clear in the middle and 95 % dark from its radius to its edge, and every effect drew it as a
 * square 1700 plate-pixels wide centred on its target. A target near one side of the frame (Yuna under Bahamut's Curse, Bahamut's chest at the right while he gathers Mega Flare) left the square's
 * far edge inside the frame, where the dark rim stopped dead: a hard-edged dark rectangle over a third of the picture, for as long as the effect lasted.
 *
 * The fix keeps the look inside the square and holds it outside it. A COVER quad (`p[0]` = 1 on a tile quad) is drawn over the whole view, and each pixel looks the tile up where it would have
 * been inside the square, clamped to the tile (`clampUv`): the rim texel held outward, the same flat 95 % the rim already is, so there is no step at the old edge. The painted finish's streaks
 * run on in the quad's own pixel space (they are not clamped), so the finish carries across too. The shader in `FxBatch.ts` is this file in GLSL.
 *
 * Pure: no `three`, no DOM.
 */

/** `p[0]` of a tile quad that is a cover quad. */
export const COVER = 1;

/** A rectangle in CSS pixels, y down: the centre and the size. */
export interface FxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What the cover rule reads of a drawn item. */
export interface CoverItem extends FxRect {
  shape: number;
  p: readonly number[];
}

/** True for a tile quad drawn over the whole view. */
export function isCover(it: Pick<CoverItem, 'shape' | 'p'>): boolean {
  return it.shape === 0 && (it.p[0] ?? 0) > 0.5;
}

/** The pixels the GPU fills for an item, as a rectangle from the view's top left: a cover quad fills the whole view, any other item its own (unrotated) rectangle. */
export function filledRect(it: CoverItem, view: { w: number; h: number }): { x0: number; y0: number; x1: number; y1: number } {
  if (isCover(it)) return { x0: 0, y0: 0, x1: view.w, y1: view.h };
  return { x0: it.x - it.w / 2, y0: it.y - it.h / 2, x1: it.x + it.w / 2, y1: it.y + it.h / 2 };
}

/** True when the pixels an item fills include every pixel of the view. */
export function coversView(it: CoverItem, view: { w: number; h: number }): boolean {
  const r = filledRect(it, view);
  return r.x0 <= 0 && r.y0 <= 0 && r.x1 >= view.w && r.y1 >= view.h;
}

/** The tile coordinate (0..1 across the quad, v up as the geometry's `uv`) the CSS pixel (px, py) looks up, before the clamp: inside the quad's own rectangle it is the ordinary 0..1. */
export function tileUv(it: FxRect, px: number, py: number): [number, number] {
  return [(px - (it.x - it.w / 2)) / it.w, 1 - (py - (it.y - it.h / 2)) / it.h];
}

/** The lookup the shader makes: the tile coordinate held to the tile, so outside the quad the rim texel is read. */
export function clampUv(uv: readonly [number, number]): [number, number] {
  return [Math.min(1, Math.max(0, uv[0])), Math.min(1, Math.max(0, uv[1]))];
}
