/**
 * **Penance's rules, as numbers and tests** (FFX only; the hidden Penance chapter; `research/re-ffx-penance.md`, "RE n"). The scripts themselves are `./penance.ts`; this file holds what they read, so that both stay
 * under the house limit [AGENTS.md hard rule 7] and so that every number has one home and one source. **Every number here is the note's** (rule 6): the three scripts of the game's own monster files (m344, m345, m346)
 * read from the bytes and run in the earlier lanes' interpreter ("[bytes] [run]" there). The two things that are derived and not read are marked `[derived]`.
 *
 * | Rule | Value | RE |
 * |---|---|---|
 * | The change | the first damaging hit that leaves Penance **strictly below `(max HP * 3) / 4`** (9,000,000) | 5.2 |
 * | At the change | Separation on itself, Protect off, Haste for **one** turn (a counter of 1) | 5.2 |
 * | Phase 1 | every turn is Obliteration on the whole front line; no counter | 5.2 |
 * | Phase 2 | every turn the counter gains 1, then Immolation on one random living member | 5.2 |
 * | The counter | +1 per own phase-2 turn, +1 per damaging action that reaches Penance in phase 2 (one per action and target) | 5.2 |
 * | Judgment Day | on the turn the counter is **20 or more and both arms are up**; the counter goes to 0; with an arm down the turn is an Immolation and the counter keeps growing | 5.2 |
 * | An arm's turn | a count of its turns (turn 1: Strength and Agility to 255; turn 2 on: the same plus Haste for one turn), then `GetRandomValue() mod 3` | 5.3 |
 * | An arm's death | with Penance alive: Atrophy, re-initialised at full HP, hidden and untargetable, and back **12 ticks later** `[derived]`; with Penance dead: Atrophy and no return | 5.3 |
 * | Penance's death | forces its own Death and takes both arms to 0 HP | 5.2 |
 *
 * ## Where the state lives
 *
 * The phase and the counter are Penance's private variables in the game (v5, v6); here they are two battle flags (`pen.phase`, `pen.counter`) so a fork carries them and a reader (the HUD strip, the advisor) can see them without
 * the script's memory. The arms' private turn count (v6 for the Right Arm, v5 for the Left) is the arm's own `ActorRuntime.ai` memory (`MEM_TURNS`). The two "down" flags the game's arms write (battle variables 0x04 and 0x08) are
 * not stored: an arm is down exactly while it is not alive (it dies, waits `ARM_RETURN_TICKS`, and is made whole again by `hp.ts#resolveDuePartRevivals`), so {@link armDown} reads the arm itself. The two phase flags
 * (battle variables 0x20 and 0x24) are written by Penance and read by none of the three scripts (RE 5.1), so they are not modelled.
 */

import type { FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, tryActor } from '../state.ts';

/** Ids, mirrored from `data/ffx/penance-ids.ts` (the battle layer does not import the data layer; `tests/unit/chapters/penance-data.test.ts` pins that the two agree). */
export const PENANCE_ID = 'penance';
export const PENANCE_RIGHT_ARM_ID = 'penance-right-arm';
export const PENANCE_LEFT_ARM_ID = 'penance-left-arm';
export const PENANCE_ARM_IDS: readonly string[] = [PENANCE_RIGHT_ARM_ID, PENANCE_LEFT_ARM_ID];
export const PENANCE_GROUP_ID = 'penance';
export const PENANCE_SCRIPT = 'penance';
export const PENANCE_RIGHT_ARM_SCRIPT = 'penance-arm-right';
export const PENANCE_LEFT_ARM_SCRIPT = 'penance-arm-left';
/** The painting Penance wears from the change on (`PENANCE_SPRITES.split`). */
export const PENANCE_SPLIT_SPRITE = 'penance-split';

/** The move rows (`data/ffx/enemies/penance-abilities.ts`; three are the Dark Aeons' rows and one the party's Slowga: `data/ffx/penance-ids.ts`). */
export const PENANCE_ROWS = {
  immolation: 'penance-immolation',
  obliteration: 'penance-obliteration',
  judgmentDay: 'penance-judgment-day',
  separation: 'penance-separation',
  teraGraviton: 'penance-tera-graviton',
  mightyGuard: 'penance-mighty-guard',
  armAttack: 'dark-sandy-attack',
  calamity: 'dark-calamity',
  dispellingAttack: 'dark-cindy-attack',
  slowga: 'slowga',
} as const;

/** The change comes when HP is strictly below `(max HP * 3) / 4` (RE 5.2). */
export const PHASE2_NUMERATOR = 3;
export const PHASE2_DENOMINATOR = 4;
/** The counter at which Judgment Day is on offer (RE 5.2). */
export const JUDGMENT_COUNTER = 20;
/** An arm's roll: `GetRandomValue() mod 3` (RE 5.3). */
export const ARM_ROLL_MODULO = 3;
/** The write both arms make on their first turn, and again every turn after (RE 5.3). */
export const ARM_BUFFED_STAT = 255;
/** An arm's Strength and Agility as the record gives them (RE 3), which the re-initialisation at its death puts back. */
export const ARM_RECORD_STR = 200;
export const ARM_RECORD_AGI = 150;
/**
 * Ticks from an arm's death to its return `[derived]`: the re-initialised arm's counter is its stored base, 3 times the tick speed of Agility 150 (4), so 12; its next turn is the Regeneration that makes it whole
 * (RE 5.3 "Clock numbers", the repo's CTB kernel). Penance's own turn is 9 ticks (4 on its one Hasted turn), so an arm is down for one Penance turn, sometimes two. The live check that settles it is RE 10 item 2.
 */
export const ARM_RETURN_TICKS = 12;
/** Haste "counter of 1": one turn (RE 5.2 for Penance at the change, 5.3 for an arm from its second turn). */
export const HASTE_TURNS = 1;

/** The battle flags. */
export const PEN_PHASE_FLAG = 'pen.phase';
export const PEN_COUNTER_FLAG = 'pen.counter';
/** The arm's private turn count (`ActorRuntime.ai`). */
export const MEM_TURNS = 'turns';

/** 0 before the change, 1 after (Penance's private v5). */
export function phaseOf(ctx: Pick<Ctx, 'state'>): 0 | 1 {
  return ctx.state.flags[PEN_PHASE_FLAG] === 1 ? 1 : 0;
}

/** The hidden counter (Penance's private v6): 0 until the change. */
export function counterOf(ctx: Pick<Ctx, 'state'>): number {
  const v = ctx.state.flags[PEN_COUNTER_FLAG];
  return typeof v === 'number' ? v : 0;
}

export function setCounter(ctx: Pick<Ctx, 'state'>, value: number): void {
  ctx.state.flags[PEN_COUNTER_FLAG] = value;
}

/** Penance, when it is on the field in this battle. */
export function penanceBody(ctx: Pick<Ctx, 'state'>): FFXCombatant | undefined {
  return tryActor(ctx as Ctx, PENANCE_ID);
}

/** An arm (both, alive or not). */
export function armsOf(ctx: Pick<Ctx, 'state'>): FFXCombatant[] {
  return PENANCE_ARM_IDS.map((id) => tryActor(ctx as Ctx, id)).filter((c): c is FFXCombatant => c !== undefined);
}

/** True while the arm is dead and waiting to return (the game's RIGHT_DOWN / LEFT_DOWN flag): an arm only stops being alive by dying. */
export function armDown(ctx: Pick<Ctx, 'state'>, armId: string): boolean {
  const arm = tryActor(ctx as Ctx, armId);
  return arm === undefined || !isAlive(arm);
}

/** The Judgment Day gate: both arms stand (the game reads both down flags as 0). */
export function bothArmsUp(ctx: Pick<Ctx, 'state'>): boolean {
  return PENANCE_ARM_IDS.every((id) => !armDown(ctx, id));
}

/** The HP below which the change comes (integer division, as the script does it). */
export function changeLine(maxHp: number): number {
  return Math.floor((maxHp * PHASE2_NUMERATOR) / PHASE2_DENOMINATOR);
}
