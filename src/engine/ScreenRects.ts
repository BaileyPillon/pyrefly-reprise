/**
 * Rectangle maths for the targeting layer: how much of a combatant the player
 * can actually see.
 *
 * Pure — no `three`, no DOM — so the occlusion rule Bailey's complaint turns on
 * ("some enemies are hidden behind bigger enemies? they are not clearly
 * visible") is unit-tested directly rather than only through a screenshot.
 *
 * The rectangles are CSS pixels in the canvas's own frame, as
 * `PaintedStage.projectRect` produces them.
 */

/** A projected screen rectangle. */
export interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A rectangle plus how far its owner is from the camera, in world units. */
export interface DepthRect extends ScreenRect {
  /** Distance to the camera. Smaller = nearer = draws on top. */
  depth: number;
}

/** Area of a rectangle, floored at 0 for a degenerate one. */
export function rectArea(r: ScreenRect): number {
  return Math.max(0, r.w) * Math.max(0, r.h);
}

/** The overlapping part of two rectangles, or `null` when they miss. */
export function intersect(a: ScreenRect, b: ScreenRect): ScreenRect | null {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * How much of `target` is not covered by anything in `occluders`, as a
 * fraction 0..1.
 *
 * Exact, not sampled: the covered area is the union of the intersections, and
 * a union of axis-aligned rectangles is measured by sweeping the distinct x
 * edges and, inside each vertical strip, merging the y intervals. Two fiends
 * standing side by side in front of a boss overlap each other as well as the
 * boss, and adding their two intersections would double-count that overlap and
 * report a target as more hidden than it is.
 *
 * A zero-area target returns 0: nothing of it is visible because there is
 * nothing of it on screen, which is the answer a caller wants for a combatant
 * that has been projected off-camera.
 */
export function visibleFraction(target: ScreenRect, occluders: readonly ScreenRect[]): number {
  const area = rectArea(target);
  if (area <= 0) return 0;

  const clipped: ScreenRect[] = [];
  for (const o of occluders) {
    const hit = intersect(target, o);
    if (hit) clipped.push(hit);
  }
  if (!clipped.length) return 1;

  const xs = new Set<number>();
  for (const r of clipped) {
    xs.add(r.x);
    xs.add(r.x + r.w);
  }
  const edges = [...xs].sort((a, b) => a - b);

  let covered = 0;
  for (let i = 0; i < edges.length - 1; i++) {
    const x0 = edges[i]!;
    const x1 = edges[i + 1]!;
    const stripW = x1 - x0;
    if (stripW <= 0) continue;
    // Every rectangle spanning this strip, as y intervals, merged.
    const spans: Array<[number, number]> = [];
    for (const r of clipped) {
      if (r.x <= x0 && r.x + r.w >= x1) spans.push([r.y, r.y + r.h]);
    }
    if (!spans.length) continue;
    spans.sort((a, b) => a[0] - b[0]);
    let height = 0;
    let curStart = spans[0]![0];
    let curEnd = spans[0]![1];
    for (let s = 1; s < spans.length; s++) {
      const [a, b] = spans[s]!;
      if (a > curEnd) {
        height += curEnd - curStart;
        curStart = a;
        curEnd = b;
      } else if (b > curEnd) {
        curEnd = b;
      }
    }
    height += curEnd - curStart;
    covered += stripW * height;
  }

  return Math.max(0, Math.min(1, 1 - covered / area));
}

/**
 * Visible fraction of each entry, counting only the combatants **in front of
 * it** plus any fixed panels.
 *
 * Depth is what makes this honest: a party member standing between the camera
 * and a fiend hides the fiend, but the fiend does not hide the party member,
 * and a naive "does anything overlap" test reports both as occluded. Ties
 * (two parts of one machine at the same depth) count as not occluding, because
 * neither is in front.
 *
 * `panels` are HUD rectangles — the command stack, the party-status panel, the
 * turn list — which cover everything regardless of depth.
 */
export function visibilityOf(
  rects: ReadonlyMap<string, DepthRect>,
  panels: readonly ScreenRect[] = [],
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [id, rect] of rects) {
    const occluders: ScreenRect[] = [...panels];
    for (const [otherId, other] of rects) {
      if (otherId === id) continue;
      if (other.depth < rect.depth) occluders.push(other);
    }
    out.set(id, visibleFraction(rect, occluders));
  }
  return out;
}

/**
 * The panel that covers most of `target`, or `null` when none of them touch
 * it.
 *
 * The formation needs one rectangle to move *away from*, and "most of it" is
 * the honest choice: a fiend clipped by the turn list's corner and buried
 * under the command stack should walk out from under the stack. Panels cover
 * regardless of depth, so no depth test here.
 */
export function worstPanelFor(
  target: ScreenRect,
  panels: readonly ScreenRect[],
): ScreenRect | null {
  let best: ScreenRect | null = null;
  let bestArea = 0;
  for (const p of panels) {
    const hit = intersect(target, p);
    if (!hit) continue;
    const area = rectArea(hit);
    if (area > bestArea) {
      bestArea = area;
      best = p;
    }
  }
  return best;
}

/**
 * Which combatants are covering `id` — what the x-ray fade needs to know.
 *
 * Only figures genuinely in front and genuinely overlapping (more than
 * `minOverlap` of the target's own area) count, so a fiend whose wingtip
 * clips the target's bracket by two pixels is not faded out.
 */
export function occludersOf(
  id: string,
  rects: ReadonlyMap<string, DepthRect>,
  minOverlap = 0.04,
): string[] {
  const rect = rects.get(id);
  if (!rect) return [];
  const area = rectArea(rect);
  if (area <= 0) return [];
  const out: string[] = [];
  for (const [otherId, other] of rects) {
    if (otherId === id) continue;
    if (other.depth >= rect.depth) continue;
    const hit = intersect(rect, other);
    if (hit && rectArea(hit) / area > minOverlap) out.push(otherId);
  }
  return out;
}
