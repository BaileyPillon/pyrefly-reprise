/**
 * **Who one action touched, for the counters that answer it.** Moved out of
 * `engine.ts#afterAction` unchanged (house style: that file is over 400 lines
 * and must not grow). Pure and deterministic: it reads the action's events.
 */

import type { BattleEvent, CombatantId } from '../common/types.ts';

export interface CounterInputs {
  /** Enemies this action actually resolved against (HP or MP damage). */
  damaged: CombatantId[];
  /** `damaged`, less any enemy the blow pushed into a new form. */
  counterable: CombatantId[];
  /** Enemies this action landed a status on, less any that changed form. */
  statusCounterable: CombatantId[];
}

export function counterInputs(actorId: CombatantId, actionEvents: readonly BattleEvent[]): CounterInputs {
  const damaged = new Set<CombatantId>();
  // Enemies this action pushed into a new form. The killing blow of a form is
  // never countered: in the decompile, `onHit` runs the transformation block
  // *instead of* the counter switch [ffx-yunalesca §2.4, offset 0600]. By the
  // time counters are collected `advanceForm` has already revived the boss in
  // its next form, so without this the blow would draw that form's counter.
  const transformed = new Set<CombatantId>();
  // **Enemies this action landed a status on.** Only `damage` and `mp-damage`
  // fed the counter input until the Evrae chapter, and its counter-Haste
  // fires on **Slow landing** — a `status-add` event. Tidus's Slow uses the
  // `ctb` formula and may or may not emit a `damage` event on the same
  // action, so keying that counter off damage would have been incidental and
  // seed-dependent: precisely the class of bug hard rule 3 exists to catch
  // [preflight §4.2 E-5]. Existing bosses ignore the new set, so Chapters 1-3
  // are byte-identical.
  const statusAdded = new Set<CombatantId>();
  for (const e of actionEvents) {
    if (e.type === 'damage' && e.sourceId === actorId && e.amount > 0) damaged.add(e.targetId);
    if (e.type === 'mp-damage' && e.sourceId === actorId) damaged.add(e.targetId);
    if (e.type === 'status-add') statusAdded.add(e.targetId);
    if (e.type === 'form-change') transformed.add(e.enemyId);
  }
  return {
    damaged: [...damaged],
    counterable: [...damaged].filter((id) => !transformed.has(id)),
    statusCounterable: [...statusAdded].filter((id) => !transformed.has(id)),
  };
}
