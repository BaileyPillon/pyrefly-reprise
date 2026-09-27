/**
 * PR-0183 (FFX only): the party's faces are obstacles for the target name
 * plate.
 *
 * The plate hangs under its figure by default (`targetCursorParts.dockPlate`),
 * and in Chapter III the party stands right under the Yu Pagodas, so
 * "Yu Pagoda A" was printed between Auron's and Yuna's heads, far from the
 * Pagoda it names (round 13, `fight-targeting-s2-ch3.jpg`). Handing the dock
 * the faces alongside the HUD panels makes it take the figure's clear side
 * instead: it still touches its own figure, and no face is under it.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only.** The docked ink plate is FFX's
 * target chrome; FFX-2's parts carry their own plates (D-044).
 */

/** A screen rectangle, CSS px. */
export interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The top share of a fighter's painted box that is its head and face. */
export const FACE_SHARE = 1 / 3;

/** The face band of each of `ids` that has a box on screen. */
export function partyFaceRects(ids: readonly string[], rectOf: (id: string) => ScreenRect | null): ScreenRect[] {
  const out: ScreenRect[] = [];
  for (const id of ids) {
    const r = rectOf(id);
    if (!r || r.w <= 0 || r.h <= 0) continue;
    out.push({ x: r.x, y: r.y, w: r.w, h: r.h * FACE_SHARE });
  }
  return out;
}
