/**
 * Predicates over a single combatant or ability definition.
 *
 * Split out of `state.ts` in round 04 (PR-0040): that file crossed the 400-line
 * house limit [AGENTS.md hard rule 7] when the Threaten/Sleep repair added
 * {@link inTurnQueue}. The seam is the natural one — everything here answers a
 * question about **one** combatant and needs no {@link Ctx}, while what stayed
 * behind queries the battle context. No behaviour changed: `state.ts` re-exports
 * every name below, so every existing importer is untouched.
 *
 * Game case: **both**. This is shared FFX-engine plumbing with no rule change.
 */

import type { AbilityDef, Combatant, StatusId, StatusInstance } from '../common/types.ts';
/** Does this combatant carry `status`? */
export function has(c: Combatant, status: StatusId): boolean {
  return c.statuses[status] !== undefined;
}

/** The status instance, or `undefined`. */
export function statusOf(c: Combatant, status: StatusId): StatusInstance | undefined {
  return c.statuses[status];
}

/** Stack count for a stacking buff (0 when absent). */
export function stacks(c: Combatant, status: StatusId): number {
  return c.statuses[status]?.stacks ?? 0;
}

/**
 * True when the combatant **owns a CTB counter** and can be picked as the next
 * actor.
 *
 * §1.1 states the membership rule verbatim:
 *
 * > `nextActor = argmin(ctb) over living, non-Eject, non-Petrify actors`
 *
 * That list is exhaustive. Sleep and Threaten are **not** on it: they deny the
 * *action*, not the *turn*, and both of their clocks are paid on the victim's
 * own turn — Sleep "ticks down by 1 at the end of the victim's own action"
 * (§4.1) and Threaten "lasts until the user's next turn" (§4.2). Filtering them
 * out of the queue is what made round 03 blockers #3 and #4: the turn that
 * would have ended the status could never arrive, so Threaten deleted Yunalesca
 * from the fight for good and a Sleep sat on 3 turns remaining for 53 turns.
 *
 * Pair this with {@link canAct}: the engine asks this one *who goes next* and
 * that one *whether they may do anything when they get there*.
 * [ffx-combat-core §1.1, §4.1, §4.2]
 */
export function inTurnQueue(c: Combatant): boolean {
  if (!c.alive || c.removed) return false;
  return !has(c, 'ko') && !has(c, 'eject') && !has(c, 'petrify');
}

/**
 * True when the combatant may take an action on a turn that has arrived.
 *
 * See {@link inTurnQueue} for the other half of the split. A combatant that is
 * in the queue but cannot act loses the turn: the engine charges it a rank-3
 * recovery and runs the end-of-turn ticks, which is what pays Sleep's duration.
 */
export function canAct(c: Combatant): boolean {
  if (!inTurnQueue(c)) return false;
  if (has(c, 'sleep')) return false;
  if (has(c, 'threaten')) return false;
  return true;
}

/** True when the combatant occupies the field, alive or KO'd. */
export function onField(c: Combatant): boolean {
  return !c.removed && !has(c, 'eject');
}

/** True when the combatant is a legal target for an ordinary action. */
export function targetable(c: Combatant): boolean {
  return onField(c) && !c.flags.untargetable && !c.flags.hidden;
}

/** True when the combatant is alive (not KO'd, not petrified out of the battle). */
export function isAlive(c: Combatant): boolean {
  return c.alive && !has(c, 'ko') && onField(c);
}

/**
 * True when a **benched** member may be swapped onto the field.
 *
 * This is deliberately not {@link isAlive}. `isAlive` is the *on-field*
 * predicate: it requires {@link onField}, and `removed === true` is exactly what
 * being on the bench means — so gating a Switch row on `isAlive` disables every
 * switch the game can ever offer, which is what `commands.ts` used to do.
 *
 * The reserve rule is §1.7's: "any reserve member may be swapped in at any
 * point; all seven can therefore participate". The one member who cannot is one
 * who is unable to take a turn, because the incoming member **takes the turn
 * that is happening right now** — handing that turn to a KO'd or petrified body
 * would open a menu for an actor who can never close it. Shattering likewise
 * "removes one bench slot permanently for that battle"
 * [ffx-combat-core §1.7].
 */
export function canSwitchIn(c: Combatant): boolean {
  return c.alive && !has(c, 'ko') && !has(c, 'petrify') && !has(c, 'eject');
}

/**
 * True for an ability that is only a **submenu label**, not an action.
 *
 * Rikku's `Use` is the shipped case: §7.6 row 23 "opens the special items
 * submenu", authored `formula: 'none'`, `power: 0`, `extra.opensSubmenu:
 * 'special-items'` — and this menu is flat, so the gems, grenades and fangs it
 * fronts are already rows of their own beside it. Offered as an action it was
 * `enabled: true` and, submitted verbatim, produced `['action-start',
 * 'action-end']`: a spent turn, in silence.
 *
 * Treated exactly like Lulu's `fury` marker, and for the same reason — the row
 * the menu offers must be submittable as offered [AGENTS.md hard rule 4].
 * `commands.ts` does not offer it; `execute.ts` refuses it out loud if one
 * arrives anyway.
 */
export function isSubmenuMarker(def: AbilityDef): boolean {
  return typeof def.extra?.['opensSubmenu'] === 'string';
}
