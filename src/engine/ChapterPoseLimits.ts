/**
 * **Which paintings a figure may draw in a chapter**, when that is fewer than
 * the art folder holds.
 *
 * An art folder is shared: `public/art/characters/anima/` is the aeon's, and it
 * holds an `attack`, a `hurt`, a `ko` and an `overdrive` beside the board's
 * approved `idle`. Chapter VII borrows that folder for the boss Anima
 * (`spriteKey: 'anima'`), and the e2e pass (commit 06338dbc, frames
 * `win-12..14`) caught her drawing all three unapproved paintings. Bailey's
 * D-045 (option A, "All your recommendations"): she "reuses the approved aeon
 * idle at the Macalania scale, no new render". So in this chapter she draws the
 * idle and nothing else; the presenter's lunge, recoil and flashes still carry
 * every action, the same way option A gives the Guardians no attack painting.
 *
 * Keyed by **combatant id**, not art id: the party's own summoned Anima in any
 * other chapter keeps her folder as it is. A presentation choice with no engine
 * meaning, so no shared contract widens. A pose left out is never fetched;
 * `PaintedActor.setPose` falls back to the idle for it.
 *
 * Game case: **FFX only** (Chapter VII's Anima); the filter itself is shared
 * plumbing and does nothing for an id not in the table.
 */

import type { CombatantId } from '../battle/common/types.ts';

/** Combatant id -> the only poses it may draw. */
export const POSE_LIMITS: Readonly<Partial<Record<CombatantId, readonly string[]>>> = {
  // FFX, Chapter VII: D-045 option A, the approved aeon idle only.
  'anima-macalania': ['idle'],
};

/**
 * `poses` cut down to what `id` may draw. An id with no limit keeps its map
 * unchanged; a limit that would leave nothing (the approved painting is not
 * installed) keeps the map too, so the figure is never staged invisible.
 */
export function limitPoses(id: CombatantId, poses: Record<string, string>): Record<string, string> {
  const keep = POSE_LIMITS[id];
  if (!keep) return poses;
  const kept = Object.fromEntries(Object.entries(poses).filter(([pose]) => keep.includes(pose)));
  return Object.keys(kept).length > 0 ? kept : poses;
}
