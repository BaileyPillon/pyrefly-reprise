/**
 * **The formation start hook** (re-parity, AI lane C; **FFX only**; row D-14).
 *
 * `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` sections 1.6, 3.1, 4.1, 6.1 and 7.1: the formations of Yojimbo (`nagi05_10`),
 * Isaaru's three aeons (`bvyt09_10`, `_11`, `_12`), Sinspawn Genais with the Core (`ssbt02_00`) and Overdrive Sin (`ssbt03_00`)
 * each register a *start hook* (slot 137) that runs after the engine's opening pass: the boss gets First Strike and its CTB
 * counter is written 0, and **each of the seven party counters (three active, four reserve) goes up by one**. So the boss's
 * first turn comes before anyone's, however fast the party is, and the party's counters are one tick later than the
 * ordinary opening gave them. Genais and Overdrive Sin write the same three lines again in their own init (the note takes the
 * net effect as open, C: +1 from the hook either way, +2 if both copies stand); this applies the hook once.
 *
 * The Evrae and Fin formations have no start hook, so their openings are the ordinary opening and are not touched here.
 */

import type { CombatantId } from '../../common/types.ts';
import { type Ctx, rtOf, tryActor } from '../state.ts';
import { normalise } from '../turnQueue.ts';

/** Write the start hook's counters, after `seedInitialCtb` has run: the boss at 0, every party slot one tick later. */
export function applyBossOpening(ctx: Ctx, bossIds: readonly CombatantId[]): void {
  for (const id of bossIds) if (tryActor(ctx, id) !== undefined) rtOf(ctx, id).ctb = 0;
  for (const id of [...ctx.state.activeIds, ...ctx.state.reserveIds]) rtOf(ctx, id).ctb += 1;
  normalise(ctx);
}
