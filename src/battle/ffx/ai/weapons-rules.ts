/**
 * **The three Weapons' rules, as numbers and ids** (FFX only; the hidden Omega Ruins chapter, number 43; `research/re-ffx-omega-ultima-nemesis.md`, "RE n"). The scripts are `./ultima-weapon.ts`, `./omega-weapon.ts` and
 * `./nemesis.ts`; this file holds what they read, so each number has one home and one source. **Every number is the note's** (rule 6), read from the game's own files (`m99`, `m100`, `m276`) and run in the earlier lanes'
 * Atel interpreter (`[bytes] [run]` there): nothing here is an estimate of ours. The battle layer imports no `src/data` (hard rule 1), so the ids are copied here and
 * `tests/unit/chapters/omega-ruins-data.test.ts` pins the copies equal `data/ffx/omega-ruins-ids.ts`.
 *
 * | Rule | Number | RE note |
 * |---|---|---|
 * | Ultima Weapon's cycle | six turns, a counter raised at the start of each; with an aeon on the field Attack, Core Energy, Rain, Core Energy, Attack, Rain; with none Attack, one of Break, Silence or Confuse, Core Energy, one of Holy, Sleep or Confuse, Attack, Rain | 4.1 |
 * | Omega Weapon's Nova counter | +5 on an Attack, +2 on a special; Nova on the whole front line when it is 30 or more at the start of a turn, then 0 | 4.2 |
 * | Omega Weapon's draw | modulo 3 at every turn that is not a Nova: 0 is an Attack (a third), 1 and 2 are a special | 4.2 |
 * | Omega Weapon's cycle | four steps that advance on a special only; with an aeon out Core Energy, Rain, Core Energy, Rain; with none Core Energy, Break or Confuse (modulo 2), Rain, the player's Ultima or Demi (modulo 2) | 4.2 |
 * | Nemesis's Armageddon counter | +3 on an Attack, +2 on any other turn; Armageddon on the whole front line when it is 20 or more at the start of a turn, then 0 | 4.3 |
 * | Nemesis's cycle | Ethereal Cannon, Ultra Spark, Attack, advancing on the non-Attack draws only | 4.3 |
 * | Nemesis's reply | a command whose damage type is neither physical (1) nor magical (2) that reaches it is answered by Ultima on the front line | 4.3 |
 */

import type { Ctx } from '../state.ts';
import { aeonsOut } from '../state.ts';

/** The combatant and script ids (`data/ffx/omega-ruins-ids.ts`). */
export const UW_ID = 'ultima-weapon';
export const OW_ID = 'omega-weapon';
export const NM_ID = 'nemesis';
export const UW_SCRIPT = 'ultima-weapon';
export const OW_SCRIPT = 'omega-weapon';
export const NM_SCRIPT = 'nemesis';

/** The move rows (the fourteen of `data/ffx/enemies/weapons-abilities.ts`; Holy, Ultima and Demi are the player's own rows, used by their ids). */
export const WEAPON_MOVES = {
  ultimaAttack: 'ruins-ultima-attack', // 0x407F
  coreEnergy: 'ruins-core-energy', // 0x4022
  shimmeringRain: 'ruins-shimmering-rain', // 0x4023
  break: 'ruins-break', // 0x604F
  silence: 'ruins-silence', // 0x606E
  confuse: 'ruins-confuse', // 0x6072
  sleep: 'ruins-sleep', // 0x6071
  omegaAttack: 'ruins-omega-attack', // 0x410F
  nova: 'ruins-nova', // 0x4067
  nemesisAttack: 'ruins-nemesis-attack', // 0x40F0
  etherealCannon: 'ruins-ethereal-cannon', // 0x40D8
  ultraSpark: 'ruins-ultra-spark', // 0x40D9
  armageddon: 'ruins-armageddon', // 0x40F4
  nemesisUltima: 'ruins-nemesis-ultima', // 0x40F3
  holy: 'holy', // 0x303F
  ultima: 'ultima', // 0x3053
  demi: 'demi', // 0x304E
} as const;

/** The `state.flags` keys the scripts' state lives in (`data/ffx/omega-ruins-ids.ts` `WEAPON_FLAGS`). */
export const UW_TURN_FLAG = 'uw.turn';
export const OW_COUNTER_FLAG = 'ow.counter';
export const OW_STEP_FLAG = 'ow.step';
export const NM_COUNTER_FLAG = 'nm.counter';
export const NM_STEP_FLAG = 'nm.step';

/** Ultima Weapon (RE 4.1): the counter runs 1 to 6 and is zeroed on the sixth turn. */
export const UW_CYCLE_LENGTH = 6;
/** The draw modulo of the status turns (RE 4.1): turn 2 is Break, Silence or Confuse (0, 1, 2); turn 4 is Holy, Sleep or Confuse (0, 1, 2). */
export const UW_STATUS_MODULUS = 3;

/** Omega Weapon (RE 4.2): the Nova threshold, the two additions, the draw modulo and the cycle's length. */
export const OW_NOVA_AT = 30;
export const OW_ATTACK_ADDS = 5;
export const OW_SPECIAL_ADDS = 2;
export const OW_DRAW_MODULUS = 3;
export const OW_CYCLE_LENGTH = 4;
/** The draw modulo of Omega's two choosing steps (RE 4.2): Break or Confuse; Ultima or Demi. */
export const OW_CHOICE_MODULUS = 2;

/** Nemesis (RE 4.3): the Armageddon threshold, the two additions, the draw modulo and the cycle's length. */
export const NM_ARMAGEDDON_AT = 20;
export const NM_ATTACK_ADDS = 3;
export const NM_OTHER_ADDS = 2;
export const NM_DRAW_MODULUS = 3;
export const NM_CYCLE_LENGTH = 3;

/** The damage types a command's record can carry in its low two bits (`./command-class.ts`): Nemesis answers every one that is neither of these two. */
export const NM_QUIET_TYPES: readonly number[] = [1, 2];

/** A `state.flags` number, or `fallback`. */
export function flagNumber(ctx: Pick<Ctx, 'state'>, key: string, fallback = 0): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/**
 * **"An aeon on the field"** (RE 3, 4.1): the test of Ultima Weapon's and Omega Weapon's cycles, `countChrOverlap(front line, all aeons)`: non-zero while any aeon is out. **Yuna's Magus Sisters are counted** as aeons
 * (`[inferred]`: the note ran the test against a mock with one aeon out and did not run the three Sisters, whose actor numbers 15 to 17 sit beside the seven aeons'; `./hit-gates.ts#aeonHoldsField` is the narrower seven-aeon
 * test the Sin scripts use and is not this one; `tests/unit/chapters/omega-ruins-ai.test.ts` pins the choice). It is made at the start of **every** turn, so the branch can change in the middle of a cycle; the position in the
 * cycle is kept.
 */
export function aeonOnField(ctx: Ctx): boolean {
  return aeonsOut(ctx).length > 0;
}
