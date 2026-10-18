/**
 * The draws a battle makes on its way in, before the opening counters (re-parity RC8, lane FFX-L; **FFX only**: FFX-2 has its
 * own start-up, FFX2-G10).
 *
 * The game spends two kinds of draw between "the battle begins" and `adapt/ctb.ts#openingCtb`, in this order
 * (`research/re-ffx-battle-entry.md` sections 1 and 2):
 *
 * 1. **The start-type roll** (VA 0x0078d090), ONE draw of stream 1 in every battle, scripted or not. Its answer (normal,
 *    preemptive, ambush) is overwritten by the formation script of every chapter formation, all 26 of which write a normal start,
 *    and by the debug override; the engine keeps `BattleSetup.condition` as its answer, so the roll is spent and thrown away.
 * 2. **The placement shuffle** (VA 0x007842f0) for monsters that share a model: 2n draws on the monsters' own streams (28 to 35)
 *    for each group of n. `kernel/placement-shuffle.ts` is the game's rule; this module tells it the formation's monster
 *    words. In the FFX chapters exactly four formation files repeat a word: Chapter VII's, Chapter XII's and the hidden Gui chapter's
 *    two (one file for each fight): {@link LINKED_FORMATIONS}. Every other chapter formation spends nothing.
 *
 * What it changes in play: the streams stand where the game's would. The monsters' opening counters, and every later roll
 * on the streams of the linked monsters (damage variance, the critical roll), are dealt again from that position: a new
 * deal of the same odds, no rule changes. Only Chapter VII shows it: Chapter XII's four discs and the Gui chapter's two arms take
 * no turns and so never roll on the streams the shuffle moved. The stored position the shuffle also produces is read by no
 * script of the game, so the engine discards it.
 *
 * **A one-stream generator** (`SeededRng`: FF7, the advisor's forecasts, a test's scripted generator) has no stream 1 and no
 * stream 28 to keep in place, so it spends nothing here and every scripted sequence reads as it always did. The engine's
 * game generator (`GameStreams`, 68 streams) always spends them.
 */

import { StartType, rollStartType } from '../kernel/rolls.ts';
import { placementShuffle } from '../kernel/placement-shuffle.ts';
import { hasAuto } from '../equipment.ts';
import { type Ctx, friendlies } from '../state.ts';
import { FfxStream } from './streams.ts';

/** The argument the game's only call site passes to the start-type roll (VA 0x00783020 phase 10). */
const START_TYPE_X = 0x20;

/**
 * The monster words (slots 0 to 7, in the formation file's order) of the chapter formations that repeat a word, by the engine
 * group's id. Mirrored here on purpose: `src/battle/**` does not import `src/data/**`, and `tests/unit/parity-ffx-engine-entry.test.ts`
 * pins that each id names the data group it should and that the group has one combatant for each used word, in this order.
 *
 * | Group | Formation file | Words | Linked slots |
 * |---|---|---|---|
 * | Chapter VII, Seymour with two Guado Guardians | `mcyt06_00` | 108d 107c 108d 107d | 0 and 2 (the Guardians) |
 * | Chapter XII, Seymour Omnis with the four Mortiphasm discs | `sins03_00` | 1083 106a 106a 106a 106a | 1 to 4 |
 * | the hidden Gui chapter, fight 1 and fight 2 | `kino02_00`, `kino03_10` | 1075 10a0 10a1 10a1 | 2 and 3 (the arms) |
 *
 * The other 22 chapter formation files (and the two neighbours the note also ran) have no repeated word.
 */
export const LINKED_FORMATIONS: Readonly<Record<string, readonly number[]>> = {
  'seymour-anima-macalania': [0x108d, 0x107c, 0x108d, 0x107d],
  'seymour-omnis': [0x1083, 0x106a, 0x106a, 0x106a, 0x106a],
  'sinspawn-gui-1': [0x1075, 0x10a0, 0x10a1, 0x10a1],
  'sinspawn-gui-2': [0x1075, 0x10a0, 0x10a1, 0x10a1],
};

/**
 * Spend a battle's entry draws, in the game's order: the start-type roll, then the placement shuffle of the formation's linked
 * monsters. Call it once per battle, after the combatants stand and before `seedInitialCtb`. Returns the start type the game
 * would have rolled (nothing reads it; the tests do).
 */
export function spendEntryDraws(ctx: Ctx, groupId: string): number {
  if (ctx.rng.streamCount < 2) return StartType.Normal;
  const initiative = friendlies(ctx).some((c) => hasAuto(c, 'initiative'));
  const rolled = rollStartType(START_TYPE_X, initiative, () => ctx.rng.on(FfxStream.StartType).int(0, 0xff));
  const words = LINKED_FORMATIONS[groupId];
  if (words !== undefined) placementShuffle(words, (stream, modulus) => ctx.rng.on(stream).int(0, modulus - 1));
  return rolled;
}
