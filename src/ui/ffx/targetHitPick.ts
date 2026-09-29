/**
 * PR-0232: which target a tap or click on the field means (both games; the
 * target cursor is shared, `TargetCursor.ts`).
 *
 * Every candidate of a single-target command is drawn as its own clickable
 * bracket, sized to the painted figure. On a phone the figures overlap: in
 * Chapter XII at 390x844 Auron stands behind Yuna, and his bracket covered the
 * centre of hers, so a tap on Yuna healed Auron (measured before the fix: 4 of
 * 5 taps at Yuna's centre went to Auron, `docs/handoff/r29-input.md`); round 15
 * also saw a dimmed Mortiphasm's bracket catch the taps. Stacking order alone
 * cannot give every overlapping figure its own centre, so the click is
 * resolved from the point:
 *
 * 1. only brackets that contain the point are candidates;
 * 2. the side being aimed at (the active target's side: the party for a cure,
 *    the enemies for an attack) wins over the other side;
 * 3. among those, the bracket whose centre is nearest the point, measured in
 *    each bracket's own half-extents, so a big boss box does not swallow a
 *    small figure standing in front of it.
 *
 * Pure: plain rects in, an id out. `null` when no bracket contains the point,
 * and the caller falls back to the element that received the click.
 */

export interface HitCandidate {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** On the side the cursor is aiming at. */
  inSet: boolean;
}

/** How far the point is from the bracket's centre, in half-extents (0 at the centre, 1 at an edge). */
function reach(c: HitCandidate, x: number, y: number): number {
  const hw = Math.max(1, (c.right - c.left) / 2);
  const hh = Math.max(1, (c.bottom - c.top) / 2);
  const dx = (x - (c.left + hw)) / hw;
  const dy = (y - (c.top + hh)) / hh;
  return Math.hypot(dx, dy);
}

export function pickTargetAt(cands: readonly HitCandidate[], x: number, y: number): string | null {
  const inside = cands.filter((c) => c.right > c.left && c.bottom > c.top && x >= c.left && x <= c.right && y >= c.top && y <= c.bottom);
  if (!inside.length) return null;
  const pool = inside.some((c) => c.inSet) ? inside.filter((c) => c.inSet) : inside;
  let best = pool[0]!;
  for (const c of pool) if (reach(c, x, y) < reach(best, x, y)) best = c;
  return best.id;
}

/** Enemy against party: `ally` and `self` are one side. */
export function sameSide(a: string, b: string): boolean {
  return (a === 'enemy') === (b === 'enemy');
}
