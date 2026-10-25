/**
 * A group effect's frame (Mega Flare, D-233; FF7's Tail Laser): moved out of `SpellFxLayer.ts` to keep that file under the house line cap. The layer re-exports it.
 *
 * Pure: no `three`, no DOM.
 */

import { targetFromRect, type FxTarget } from './effects-shared.ts';
import type { RunningFx } from './SpellFxTimeline.ts';

type Rect = { x: number; y: number; w: number; h: number };

/**
 * A group effect's frame: the caster's rectangle with the targets' centre as
 * `party` (the middle of their rectangles, three quarters down, the mock's
 * party point). Without the caster on the field it is drawn from above the
 * targets, a boss's height up.
 */
export function groupTarget(r: RunningFx, rectOf: (id: string) => Rect | null, k: number): FxTarget | null {
  const rects = r.groupIds.map(rectOf).filter((x): x is Rect => x !== null);
  if (!rects.length) return null;
  const party = {
    x: rects.reduce((s, q) => s + q.x + q.w / 2, 0) / rects.length,
    y: rects.reduce((s, q) => s + q.y + q.h * 0.75, 0) / rects.length,
  };
  const src = r.targetId ? rectOf(r.targetId) : null;
  const h = 560 * k;
  const from = src ?? { x: party.x - h * 0.375, y: party.y - h * 1.6, w: h * 0.75, h };
  return { ...targetFromRect(from, k), party, members: rects };
}
