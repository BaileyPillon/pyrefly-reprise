/**
 * The advisor-placement keys `FFXBattleHud.solveAdvisorPlacement` compares
 * frame to frame. Pure and DOM-free; moved out of `FFXBattleHud.ts` unchanged
 * (house style: that file is far over 400 lines and must not grow).
 */

import type { AdvisorZoneInput, Rect } from './hudSafeZones.ts';

/** A snapped rect's identity, for the placement key. */
export function rectKey(r: Rect | null): string {
  return r ? `${r.left},${r.top},${r.right},${r.bottom}` : '-';
}

/**
 * *Which* panels and fighters are on the screen, ignoring where they are.
 *
 * The shape of the frame rather than its measurements: a panel opening or
 * folding, a party member going down, a boss leaving the field. Used by
 * {@link FFXBattleHud.solveAdvisorPlacement} to decide when a declined solve is
 * worth asking again — measurements move every frame and are never a reason on
 * their own, presence moves only when something really happened.
 *
 * The two always-on panels (`cmdArea`, `partyStatus`) and the help slab's
 * reserved slot are deliberately absent: they are never `null`, so they could
 * not distinguish anything.
 */
export function panelPresence(input: AdvisorZoneInput): string {
  const on = (r: Rect | null | undefined): string => (r ? '1' : '0');
  return [
    on(input.guide),
    on(input.sensor),
    on(input.intent),
    on(input.intentChip),
    on(input.ctb),
    input.sprites.length,
    input.enemies?.length ?? 0,
  ].join(':');
}

/** A rect snapped **outwards** to a multiple of `q`, so it never shrinks. */
export function growToGrid(r: Rect | null, q: number): Rect | null {
  if (!r) return null;
  return {
    left: Math.floor(r.left / q) * q,
    top: Math.floor(r.top / q) * q,
    right: Math.ceil(r.right / q) * q,
    bottom: Math.ceil(r.bottom / q) * q,
  };
}

/** The smallest rect holding every non-null one, or `null` when there are none. */
export function unionOf(...rects: ReadonlyArray<Rect | null>): Rect | null {
  let out: Rect | null = null;
  for (const r of rects) {
    if (!r) continue;
    out = out
      ? { left: Math.min(out.left, r.left), top: Math.min(out.top, r.top), right: Math.max(out.right, r.right), bottom: Math.max(out.bottom, r.bottom) }
      : { ...r };
  }
  return out;
}
