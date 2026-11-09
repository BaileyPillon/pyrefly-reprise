/**
 * **The Oblitzerator's and the Luca crane's rules, as numbers and ids** (FFX only; the hidden Oblitzerator chapter, number 50; `research/re-ffx-oblitzerator-crane.md`, "RE n"). The scripts are `./oblitzerator.ts` and
 * `./luca-crane.ts`; this file holds what they read, so each number has one home and one source. **Every number is the note's** (rule 6), read from the game's own files (`m110`, `m133`) and run in the earlier lanes' Atel
 * interpreter ("[bytes] [disasm] [run]" there): nothing here is an estimate of ours. The battle layer imports no `src/data` (hard rule 1), so the ids are copied here and
 * `tests/unit/chapters/oblitzerator-data.test.ts` pins the copies equal `data/ffx/oblitzerator-ids.ts`.
 *
 * | Rule | Number | RE note |
 * |---|---|---|
 * | Its turn | **Blitzball Rush** on the whole living front line, always; nothing else, ever; nothing at all once the crane has lifted it. It writes MAG 30 first (inert: every one of its rows is a strength formula) | 4.1 |
 * | The speed-up | a hit that leaves it **under a third of its HP** (strictly under 2,000): AGI + 15 (1 to 16); a later hit that leaves it **under a twelfth** (strictly under 500): AGI + 10 (16 to 26); one step per hit | 4.2 |
 * | The counters | a hit by a command whose **formula byte is 3** is answered by **Mute Ball**, one whose byte is **1** by **Blind Ball**, one whose byte is **2** by **Doze Ball**, each on the attacker and each when `GetRandomValue() mod 3` is 0 (**21,846 of 65,536**); the draw is taken only for those three bytes; none after the crane | 4.2 |
 * | Doze Ball | **unreachable**: the six rows with formula 2 in the tables are all monster moves, and no player command has one | 4.3 |
 * | Lifted | the crane's row (0x6012) naming it ends its turns and its counters at once (the game's `v2` = 255) | 4.4 |
 * | The crane | the first **two** Thunder casts (the player's own row 0x3043) answer with a line; the **third** powers it; **one Thunder Fury** (0x307a) powers it at once; after that nothing | 4.5 |
 * | Use crane | on the unpowered crane: a line, nothing else; on the powered crane: the Crane row on the Oblitzerator (15/16 of its current HP), the command leaves Tidus's list, the crane is untargetable | 4.5 |
 */

import { type Ctx } from '../state.ts';

/** The combatant and script ids (`data/ffx/oblitzerator-ids.ts`). */
export const OB_ID = 'oblitzerator';
export const OB_CRANE_ID = 'luca-crane';
export const OB_GROUP_ID = 'oblitzerator';
export const OB_SCRIPT = 'oblitzerator';
export const OB_CRANE_SCRIPT = 'luca-crane';
/** The only party member who has the Trigger Command: character 0 (RE 2). */
export const OB_USER_ID = 'tidus';

/** The move rows (`data/ffx/enemies/oblitzerator-abilities.ts`; the last two are the player's own rows, used by their ids). */
export const OB_ROWS = {
  rush: 'blitzball-rush', // 0x600C
  doze: 'doze-ball', // 0x600D
  blind: 'blind-ball', // 0x600E
  mute: 'mute-ball', // 0x600F
  lift: 'crane-lift', // 0x6012
  useCrane: 'use-crane', // 0x3102
  thunder: 'thunder', // 0x3043
  thunderFury: 'thunder-fury', // 0x307a
} as const;

/** The `state.flags` keys the state lives in (`data/ffx/oblitzerator-ids.ts` `OBLITZERATOR_FLAGS`). */
export const OB_PHASE_FLAG = 'oblitzerator.phase';
export const OB_ENDED_FLAG = 'oblitzerator.ended';
export const OB_CRANE_FLAG = 'oblitzerator.crane';
export const OB_THUNDERS_FLAG = 'oblitzerator.thunders';
export const OB_POINTED_FLAG = 'oblitzerator.pointed';

/** The `script-trigger` names of the banners (`data/ffx/oblitzerator-ids.ts` `OBLITZERATOR_CALLOUTS`). */
export const OB_CALLOUTS = {
  point: 'oblitzerator-point',
  responds1: 'oblitzerator-responds-1',
  responds2: 'oblitzerator-responds-2',
  powered: 'oblitzerator-powered',
  noPower: 'oblitzerator-no-power',
  lifted: 'oblitzerator-lifted',
} as const;

/** The crane's states (the game's `v0` of m133): no power, powered, spent. */
export const CRANE_DARK = 0;
export const CRANE_POWERED = 1;
export const CRANE_SPENT = 2;

/** The counters' fuse (RE 4.2): `GetRandomValue() mod 3 == 0`, 21,846 of the 65,536 values, taken only when the command's formula byte is 1, 2 or 3. */
export const COUNTER_MODULUS = 3;
/** The formula bytes the counters read (RE 4.2): 1 is Blind Ball, 2 Doze Ball, 3 Mute Ball. */
export const FORMULA_BLIND = 1;
export const FORMULA_DOZE = 2;
export const FORMULA_MUTE = 3;

/** The speed-up (RE 4.2): the first step once HP is under a third (`maxHP * 1 / 3`, integer division), AGI + 15; the second once under a twelfth (`maxHP * 1 / 12`), AGI + 10. */
export const SPEED_FIRST_DIVISOR = 3;
export const SPEED_FIRST_AGI = 15;
export const SPEED_SECOND_DIVISOR = 12;
export const SPEED_SECOND_AGI = 10;

/** What the turn writes to MAG first (RE 4.1): inert, every row of the Oblitzerator is a strength formula. */
export const MAG_WRITE = 30;

/** The unpowered crane answers the first two Thunder casts with a line and the third powers it (RE 4.5: `v2` counts 0, 1, then the third finds it at 2). */
export const THUNDERS_BEFORE_POWER = 2;

/** A `state.flags` number, or `fallback`. */
export function flagNumber(ctx: Pick<Ctx, 'state'>, key: string, fallback = 0): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** The crane has lifted the Oblitzerator: it takes no turn and answers nothing (the game's `v2` = 255). */
export function lifted(ctx: Pick<Ctx, 'state'>): boolean {
  return ctx.state.flags[OB_ENDED_FLAG] === true;
}

/** The crane's state: {@link CRANE_DARK}, {@link CRANE_POWERED} or {@link CRANE_SPENT}. */
export function craneState(ctx: Pick<Ctx, 'state'>): number {
  return flagNumber(ctx, OB_CRANE_FLAG, CRANE_DARK);
}

/** The line a hit must leave the Oblitzerator under for the first speed-up: `floor(maxHP / 3)`; the second is `floor(maxHP / 12)`. */
export function speedLine(maxHp: number, divisor: number): number {
  return Math.floor(maxHp / divisor);
}
