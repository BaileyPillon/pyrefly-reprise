/**
 * **Formation flags** (re-parity RC10, lane "FFX formation-script flags"; **FFX only**).
 *
 * A formation script of the game sets flags the engine had no field for. This module carries the ones the notes prove AND a chapter of the
 * project reaches; every other flag is listed in `docs/handoff/re-parity-rc10-ffx-formation-flags.md` with the reason it is not wired.
 *
 * ## Defend off (`setDefendingEnabled(0)`), and counters off (`btlSetCounterFlag(0)`, below), the two wired
 *
 * What the game does (`FFX-G06` section 4.3 and the battle set-up, read from `FFX.exe`): the flag is a byte the battle set-up writes to 1 and the call stores
 * the low byte of its argument in. Its only reader returns, for a character, that character's "Defend command id" field (0x3021 for a party member or an
 * aeon, 0 for a monster) while the flag is non-zero and 0 while it is zero. The four menu routines that call it are the command window's input handlers: with
 * the Triangle bit down they take the id, queue that command and close the menu, and on a 0 they play the error cue and do nothing. In the original, Defend is
 * that Triangle press (`src/ui/ffx/defendControl.ts`), so with the flag at 0 **the party's Defend control does nothing** for the whole battle.
 *
 * Which formations of our chapters set it: Isaaru's three aeon-contest formations (`bvyt09_10`, `_11`, `_12`, Chapter XIV) and, since the Belgemine's Challenge chapter (45), Belgemine's eight Remiem
 * duels (`lmyt01_00` to `_07`). They are `EnemyGroupDef.defendOff`. The rule is the menu's and the executor's, nothing else: no formula reads the flag, and a monster has no menu (its scripts queue
 * their own commands), so a monster's Defend, if a script ever queued one, is not touched.
 *
 * | Where | Rule |
 * |---|---|
 * | `commands.ts` | no `defend` row for a party member or an aeon while the flag is set (the Triangle tab of `defendControl.ts` is drawn only for an enabled row, so it is not drawn) |
 * | `execute.ts` | a `defend` that arrives anyway is refused, the turn kept open, with no message (the game plays a cue; the words and the cue are presentation) |
 *
 * **The switch.** {@link FORMATION_DEFEND_OFF} is the one switch: `false` and no group is read, so every battle plays exactly as it did before this lane.
 * The flag lives in `state.flags` (like the aeon duel's), not on the runtime, so a rebuilt runtime and the advisor's dry runs see the same rule as the battle.
 *
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1].
 */

import type { Command, EnemyGroupDef, FFXCombatant } from '../common/types.ts';
import type { Ctx } from './state.ts';

/** The switch for Defend off. `false` makes {@link applyFormationFlags} a no-op, so no battle sets the flag. */
export const FORMATION_DEFEND_OFF = true;

/** `state.flags` key: this formation switched the party's Defend control off. */
export const DEFEND_OFF_FLAG = 'formation.defendOff';

/** The switch for counters off (`btlSetCounterFlag(0)`). `false` makes {@link counterSwitchOn} always 1, the engine's constant before the Belgemine chapter. */
export const FORMATION_COUNTER_OFF = true;

/** `state.flags` key: this formation switched the counter decider off for the whole battle. */
export const COUNTER_OFF_FLAG = 'formation.counterOff';

/** Copy the formation's flags into the battle. A no-op for every formation that sets none, and for every formation while the switches are off. */
export function applyFormationFlags(ctx: Ctx, group: EnemyGroupDef): void {
  if (FORMATION_DEFEND_OFF && group.defendOff === true) ctx.state.flags[DEFEND_OFF_FLAG] = true;
  if (FORMATION_COUNTER_OFF && group.counterOff === true) ctx.state.flags[COUNTER_OFF_FLAG] = true;
}

/**
 * The counter decider's switch byte: 0 while this battle's formation script called `btlSetCounterFlag(0)` (the game's decider, `FFX.exe` 0x0078C1D0, then returns "no counter" for every hit;
 * `FFX-G04` section 5.5), 1 otherwise. The one reader is `adapt/counter.ts#kindInput`. Belgemine's eight Remiem duels are the only chapter formations that set it. Nothing in them can arm a counter
 * today (no combatant carries a counter auto-ability and Bahamut's counter is a script reaction), so the switch changes no outcome there; it is wired so the rule is the game's, not an accident of the party.
 */
export function counterSwitchOn(ctx: Pick<Ctx, 'state'>): number {
  return ctx.state.flags[COUNTER_OFF_FLAG] === true ? 0 : 1;
}

/** True while this battle has the party's Defend switched off. */
export function defendOff(ctx: Ctx): boolean {
  return ctx.state.flags[DEFEND_OFF_FLAG] === true;
}

/** Does the flag take Defend from this actor's menu? Only a party member or an aeon has the control; an enemy has no menu. */
export function defendTakenFrom(ctx: Ctx, user: FFXCombatant): boolean {
  return user.side !== 'enemy' && defendOff(ctx);
}

/** Is this submitted command a Defend the flag forbids? The executor's half of the rule. */
export function defendRefused(ctx: Ctx, user: FFXCombatant, command: Command): boolean {
  return command.kind === 'defend' && defendTakenFrom(ctx, user);
}
