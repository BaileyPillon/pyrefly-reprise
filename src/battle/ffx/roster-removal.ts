/**
 * **Chapter III's roster removal** (re-parity RC11, lane "FFX Chapter III roster"; **FFX only**; handoff `docs/handoff/re-parity-rc11-ffx-ch3-roster.md`, plan `docs/plans/re-parity-rc11-ffx-ch3-roster-review.md`).
 *
 * ## What the game does (`FFX.exe`, Steam build 25501027; research notes `FFX-G11` and `FFX-G11c`, `research/re-ffx-last-summoning.md` sections 2 and 5)
 *
 * The field event `sins0700` (worker 26) lets the player choose one of the aeons Yuna still holds, **calls removePartyMember with it** (event native 0xCB, handler 0x85B820), and **then** launches that
 * aeon's possession battle. The call clears the aeon's roster flag (bit 0 of its party-record flag byte, via 0x7869B0) and its entry in the party order table. The battle setup (0x79C110) turns a
 * character's in-battle flag on from the roster flag, and the Summon list builder (0x00785410, case 5) lists only the aeons that exist in the battle; Grand Summon opens the same list. So **an aeon the
 * event has removed is absent from Yuna's Summon list and from Grand Summon's picker in every later battle, its own link included**: not drawn greyed, absent. (A script lock alone, the availability
 * byte the possessed copy's own script clears, leaves the row listed and drawn greyed; with the roster flag already cleared it is redundant for the copy's own aeon.) With no aeon left in the battle the
 * Summon and Grand Summon openers answer -3 and are drawn greyed.
 *
 * ## What this module does
 *
 * One switch, {@link CH3_ROSTER_REMOVAL}, **on** (Bailey, 2026-10-18, "I'll go with all of your recommendations"; release 55). `EnemyGroupDef.rosterRemoved` (set on Chapter III's links 2 to 7 by `data/ffx/enemies/braskas-final-aeon.ts`) lists the roster keys the event had removed before that
 * link's fight; while the switch is on, {@link applyRosterRemoval} writes one `state.flags` key per aeon (like the script lock's, so a fork and the advisor's dry runs see the rule). A removed aeon **stays in
 * `aeonRoster`** (the possessed copy's stats are read from it; `ai/possession-setup.ts`): it is only left out of `availableAeons`, `grandSummonChoices`, the Summon rows and the picker, and
 * `formation-commands.ts#commandRefused` refuses a Summon or a Grand Summon that names it (0 events, the turn kept open). A Grand Summon with **no aeon left** is refused and its row drawn greyed.
 * With the switch off (`setCh3RosterRemoval(false)`) no flag is written and no battle changes.
 *
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1].
 */

import type { EnemyGroupDef } from '../common/types.ts';
import type { Ctx } from './state.ts';

/** The one switch, **on** as shipped (r55 RE). `{ on: false }` and no group is read: every battle plays exactly as it did before this lane. */
export const CH3_ROSTER_REMOVAL: { on: boolean } = { on: true };

/** Set the switch; the returned function puts it back as it was (the lock lane's pattern). */
export function setCh3RosterRemoval(on: boolean): () => void {
  const before = CH3_ROSTER_REMOVAL.on;
  CH3_ROSTER_REMOVAL.on = on;
  return () => {
    CH3_ROSTER_REMOVAL.on = before;
  };
}

/** `state.flags` key prefix: `roster.removed:<aeonKey>` is true while the field event has removed that aeon from the party (the roster key, `valefor` ... `mindy`). */
export const ROSTER_REMOVED_PREFIX = 'roster.removed:';

/**
 * Copy the group's removed aeons into the battle. A no-op while the switch is off and for every group that lists none. Returns true when it wrote any flag (the caller raises the menu's
 * "something is switched off" quick test, so the Grand Summon row is checked).
 */
export function applyRosterRemoval(ctx: Ctx, group: EnemyGroupDef): boolean {
  if (!CH3_ROSTER_REMOVAL.on) return false;
  let wrote = false;
  for (const key of group.rosterRemoved ?? []) {
    ctx.state.flags[ROSTER_REMOVED_PREFIX + key] = true;
    wrote = true;
  }
  return wrote;
}

/** Has the field event removed this aeon (the roster key) from the party? Always false while the switch is off, and in a battle whose group lists none. */
export function aeonRosterRemoved(ctx: Ctx, aeonKey: string): boolean {
  return ctx.state.flags[ROSTER_REMOVED_PREFIX + aeonKey] === true;
}

/** Is every aeon of the roster removed (so the game's Summon and Grand Summon lists are empty)? False for a battle with no roster and for any battle the switch did not touch. */
export function rosterEmptied(ctx: Ctx): boolean {
  if (ctx.rt.aeonRoster.size === 0) return false;
  for (const key of ctx.rt.aeonRoster.keys()) if (!aeonRosterRemoved(ctx, key)) return false;
  return true;
}
