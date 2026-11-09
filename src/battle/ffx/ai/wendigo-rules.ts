/**
 * **Wendigo's and the Guado Guardians' rules, as numbers and ids** (FFX only; the hidden Wendigo chapter, number 49; `research/re-ffx-wendigo-lake-macalania.md`, "RE n"). The scripts are `./wendigo.ts` and
 * `./lake-guardian.ts`; this file holds what they read, so each number has one home and one source. **Every number is the note's** (rule 6), read from the game's own files (`m212`, `m213`) and run in the earlier lanes'
 * Atel interpreter ("[bytes] [disasm] [run]" there): nothing here is an estimate of ours. The battle layer imports no `src/data` (hard rule 1), so the ids are copied here and
 * `tests/unit/chapters/wendigo-data.test.ts` pins the copies equal `data/ffx/wendigo-ids.ts`.
 *
 * | Rule | Number | RE note |
 * |---|---|---|
 * | Above half HP | 1 turn in 3 (residue 0 of `GetRandomValue() mod 3`, 21,846 of 65,536) the Double Punch on the **lowest-HP** member; else the Punch (accuracy 120) on a random living member | 4.2 |
 * | Below half HP (strictly under 9,000 of 18,000) | a **seven-turn cycle**: arms up for three Wendigo turns (the raise, then two), arms down, three attack turns (the plain Attack, accuracy 90, or the Double Punch, 1 in 3), then the arms go up again | 4.2 |
 * | The stance | while the arms are up, a **physical** hit on it is answered by the Counter Punch on the attacker, unless an aeon holds the field; Threaten, a Berserk and a reaction in progress stop it; Sleep ends it | 4.3 |
 * | The Guardians | Berserk on Wendigo (calm), Eye Drops on its Darkness, Berserk on a party member while the arms are up, 37.5 / 37.5 / 25 percent Thundara / Blizzara / Auto-Potion on Wendigo while it is Berserk | 4.4 |
 * | The Guardian hit | +1,000 HP on itself when it loses HP, unless stolen from, asleep, Threatened, or the hit was a Berserk cast | 4.4 |
 * | The Guardian dies | the first (actor 20) casts Protect on Wendigo, the second (actor 22) Shell, if Wendigo lives; Petrify is no death | 4.4 |
 */

import type { FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, rtOf } from '../state.ts';
import { livingFrontLine } from './game-rolls.ts';
import { drawPicker, pickMatching } from './script-random.ts';

/** The combatant and script ids (`data/ffx/wendigo-ids.ts`). */
export const WD_ID = 'wendigo';
export const WD_GUARDIAN_A_ID = 'lake-guardian-a';
export const WD_GUARDIAN_B_ID = 'lake-guardian-b';
export const WD_GUARDIAN_IDS: readonly string[] = [WD_GUARDIAN_A_ID, WD_GUARDIAN_B_ID];
export const WD_SCRIPT = 'wendigo';
export const WD_GUARDIAN_SCRIPT = 'lake-guardian';

/** The move rows (`data/ffx/enemies/wendigo-abilities.ts`; the last four are the player's own rows, used by their ids). */
export const WD_ROWS = {
  punch: 'wendigo-punch', // 0x407F
  haymaker: 'wendigo-haymaker', // 0x4080
  counterPunch: 'wendigo-counter-punch', // 0x4062
  raiseArms: 'wendigo-raise-arms', // 0x403B
  lowerArms: 'wendigo-lower-arms', // 0x4063
  berserk: 'lake-berserk', // 0x400F
  autoPotion: 'lake-auto-potion', // 0x4010
  eyeDrops: 'lake-eye-drops', // 0x200C
  blizzara: 'blizzara', // 0x3046
  thundara: 'thundara', // 0x3047
  protect: 'protect', // 0x303B
  shell: 'shell', // 0x303A
} as const;

/** The `state.flags` keys the state lives in (`data/ffx/wendigo-ids.ts` `WENDIGO_FLAGS`). */
export const WD_ARMS_FLAG = 'wendigo.arms';
export const WD_ARM_TURNS_FLAG = 'wendigo.armTurns';
export const WD_CYCLE_FLAG = 'wendigo.cycle';

/** The game's `v7` at the start (RE 4.1): not below 4, so the first Wendigo turn under half HP raises the arms. */
export const CYCLE_START = 10;
/** `v7` after the arms come down (RE 4.2): the three attack turns count it from 1 to 4. */
export const CYCLE_AFTER_ARMS = 1;
/** The attack turns run while `v7 < 4` (RE 4.2): three turns, then the arms go up again. */
export const CYCLE_ATTACK_LIMIT = 4;
/** The stance's turn counter: 0 on the raise turn, the next two Wendigo turns count it to 2, the third lowers the arms (RE 4.2). */
export const ARM_TURNS_RAISED = 0;
export const ARM_TURNS_LAST = 2;
/** What Sleep writes to the counter when it ends the stance (RE 4.3). */
export const ARM_TURNS_AFTER_SLEEP = 3;

/** The strong punch's fuse (RE 4.2): `GetRandomValue() mod 3 == 0`, 21,846 of the 65,536 values. */
export const HAYMAKER_MODULUS = 3;
/** The Guardians' Berserk-branch draw (RE 4.4): `GetRandomValue() mod 4 == 0` is Auto-Potion on Wendigo (or Blizzara once stolen from); then a coin `mod 2` picks Blizzara (0) or Thundara. */
export const GUARDIAN_BRANCH_MODULUS = 4;
export const GUARDIAN_SPELL_MODULUS = 2;

/** A `state.flags` number, or `fallback`. */
export function flagNumber(ctx: Pick<Ctx, 'state'>, key: string, fallback = 0): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** Wendigo's arms are up: the game's status property 61 ("CounterAttack"), the `v5` of its script. The Guardians read it; so do the tactic and the stage. */
export function armsUp(ctx: Pick<Ctx, 'state'>): boolean {
  return ctx.state.flags[WD_ARMS_FLAG] === true;
}

/** Below half of the maximum HP, strictly (RE 4.2: 9,000 exactly does not count; the game halves the integer maximum). */
export function belowHalf(wendigo: FFXCombatant): boolean {
  return wendigo.hp < Math.floor(wendigo.stats.maxHp / 2);
}

/** The game's `TimesStolenFrom` of a monster: one or more successful steals. */
export function stolenFrom(ctx: Ctx, c: FFXCombatant): boolean {
  return rtOf(ctx, c.id).stealCount > 0;
}

/**
 * `findMatchingChr(front line, isAlive); findMatchingChr(MatchingGroup, HP, 0, Lowest)` (RE 4.2): the first call builds the group and, with two or more living, **spends one picker draw** whose result the script throws
 * away; the second keeps the candidates tied on the lowest HP and draws only among those. `undefined` for an empty front line (the game's 255).
 */
export function lowestHpLiving(ctx: Ctx): FFXCombatant | undefined {
  const pool = livingFrontLine(ctx);
  drawPicker(ctx, pool.length);
  const lowest = pool.reduce((best, c) => Math.min(best, c.hp), Number.POSITIVE_INFINITY);
  return pickMatching(ctx, pool.filter((c) => c.hp === lowest));
}

/** `findMatchingChr(front line, isAlive)`: a random living, targetable member, a draw only with two or more. */
export function randomLivingMember(ctx: Ctx): FFXCombatant | undefined {
  return pickMatching(ctx, livingFrontLine(ctx));
}

/** `findMatchingChr(front line, StatusBerserk, 0, Not)`: a random living member who is not Berserk (RE 4.4), `undefined` when every one is. */
export function randomCalmMember(ctx: Ctx): FFXCombatant | undefined {
  return pickMatching(ctx, livingFrontLine(ctx).filter((c) => !has(c, 'berserk')));
}
