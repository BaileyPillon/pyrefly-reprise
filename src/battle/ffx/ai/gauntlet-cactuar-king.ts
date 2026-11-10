/**
 * **The Cactuar King's script** (FFX only; the hidden Gauntlet chapter's act 1, the Monster Arena's Thunder Plains creation, monster file `m314`), as the game's own bytecode runs it (`research/re-ffx-monster-arena-creations.md`
 * 3.8, "RE n": 1,659 bytes of code, read from the file and run in the earlier lanes' interpreter with exact tallies over all 65,536 results of the random stream, `[disasm] [run]`). **No number here is ours.** The rows are
 * `data/ffx/enemies/gauntlet-abilities.ts`, the record `data/ffx/enemies/gauntlet.ts`.
 *
 * ## The turn (RE n 3.8)
 *
 * One draw, `GetRandomValue() mod 6` (the battle's script stream), then:
 *
 * | Draw | Share (of 65,536) | What it does |
 * |---:|---:|---|
 * | 0 | 10,923 | a **rest** that counts toward leaving: after two rests the **third** performs **Run Away** instead (`v5 > 1`); a rest queues nothing, so the turn is lost and pays the default recovery |
 * | 1, 2, 3 | 32,769 (50.00 percent) | **99999 Needles** (formula 23, power 51, capped at 99,999: lethal to any member) on one random living member |
 * | 4, 5 | 21,844 (33.33 percent) | **10000 Needles** (formula 6, power 200: a flat 10,000, which is lethal to a 9,999-HP member too) on one random living member |
 *
 * So 5/6 of its turns until it leaves are a lethal Needle, and it leaves on the third rest roll: after **about 18 of its own turns** on average (three rolls of one in six).
 *
 * ## When it is hit (RE n 3.8)
 *
 * Every hit event it takes (one per action that reaches it, a miss included) draws **10000 Needles on a random living member** when `isCounterattackAllowed()` holds (it can act and the hit is not itself part of a
 * reaction) **and the attacker is not the Cactuar King itself** (`countChrOverlap(LastAttacker, Self) == 0`). The counter aims at a random member, not at the attacker.
 *
 * ## Run Away and GA9
 *
 * The script performs `Run Away` on itself and the monster leaves. How a battle ends that way is not in the files (RE n 8, item 4); the chapter's pick **GA9** ends the act as **"it got away"** (`./gauntlet-end.ts`): the
 * engine's `'escape'` outcome, nothing paid, the act retried. The script sets the flag (`GOT_AWAY_FLAG`) as it performs the row; `checkEnd` reads it once the action is over.
 */

import type { Command } from '../../common/types.ts';
import { counterAllowed, react } from './hit-gates.ts';
import { gameMod, randomLiving } from './game-rolls.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';
import { GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, GOT_AWAY_FLAG } from './gauntlet-rules.ts';

/** The turn's draw is `mod 6` (RE n 3.8). */
export const CACTUAR_ROLL_MODULO = 6;
/** The draw that is a rest (or the departure): `v4 == 0`. */
export const CACTUAR_REST_DRAW = 0;
/** A draw above this is 10000 Needles (`v4 > 3`: draws 4 and 5); the draws 1 to 3 are 99999 Needles. */
export const CACTUAR_NEEDLES_10000_ABOVE = 3;
/** It leaves when a rest roll comes with more than this many rests behind it (`v5 > 1`: the third rest roll). */
export const CACTUAR_RESTS_BEFORE_LEAVING = 1;
/** The memory slot of the rest counter (the game's `v5`). */
export const CACTUAR_RESTS = 'gauntlet.cactuar.rests';

/** One Cactuar King turn (RE n 3.8). */
export function cactuarKingTurn(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  const roll = gameMod(ctx, CACTUAR_ROLL_MODULO);
  if (roll === CACTUAR_REST_DRAW) {
    const rests = num(memory, CACTUAR_RESTS);
    if (rests > CACTUAR_RESTS_BEFORE_LEAVING) {
      ctx.state.flags[GOT_AWAY_FLAG] = true; // read by `./gauntlet-end.ts` when the action is over
      return use(ai, ROW.runAway, [self.id]);
    }
    memory[CACTUAR_RESTS] = rests + 1;
    return null; // queues nothing: the turn is lost
  }
  const victim = randomLiving(ctx);
  if (victim === undefined) return null; // nobody left to aim at (the battle is over)
  return use(ai, roll > CACTUAR_NEEDLES_10000_ABOVE ? ROW.needles10000 : ROW.needles99999, [victim.id]);
}

/** The Cactuar King's `onHit` (RE n 3.8): 10000 Needles on a random living member, when a counter is allowed and the hitter is not the Cactuar King itself. */
export function cactuarKingHit(event: HitEvent): void {
  const { ctx, target, attacker } = event;
  if (!counterAllowed(ctx, target) || attacker.id === target.id) return;
  if (target.hp <= 0) return; // the blow that killed it: its owner cannot act, the game's queue drops the command
  const victim = randomLiving(ctx); // drawn before the command is performed, as the script does
  if (victim === undefined) return;
  react(ctx, target, victim.id, use(aiContextFor(ctx, target), ROW.needles10000, [victim.id]));
}

registerAiScript(GAUNTLET_SCRIPTS.cactuarKing, cactuarKingTurn);
registerHitScript(GAUNTLET_SCRIPTS.cactuarKing, cactuarKingHit);
