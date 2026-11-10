/**
 * **Don Tonberry's script** (FFX only; the hidden Gauntlet chapter's act 2, the Monster Arena's Cavern of the Stolen Fayth creation, monster file `m317`), as the game's own bytecode runs it (`research/re-ffx-monster-arena-creations.md`
 * 3.9, "RE n": 2,586 bytes of code, read from the file and run in the earlier lanes' interpreter, `[disasm] [run]`). **No number here is ours.** The rows are `data/ffx/enemies/gauntlet-abilities.ts`, the record
 * `data/ffx/enemies/gauntlet.ts`.
 *
 * ## The turn (RE n 3.9)
 *
 * No random draw decides the move; the script keeps two variables, `v4` (the Waddles done, 0 to 4) and `v5` (a Waddle was just done), and an aeon in the front line overrides everything:
 *
 * | Condition | What it does |
 * |---|---|
 * | **an aeon is in the front line** | **Voodoo** (formula 3, power 255) on one random living member, every turn from the first, whatever `v4` says |
 * | otherwise `v4` is 0, 1, 2 or 3 | **Waddle**: `v4` is raised to 1, 2, 3 or 4, `v5` to 1, the position to move to is written (waypoint 1, 2, 3 or 4) and Waddle is performed on itself; it walks in over four turns |
 * | otherwise (`v4` is 4) | **Attack** (row 0x4062, power 20) on one random living member |
 *
 * ## When it is hit: Karma (RE n 3.9)
 *
 * On every hit event, if `isCounterattackAllowed()` holds: **if `v5` is 1 it is set to 0 and nothing happens** (the first hit after each Waddle is free); otherwise **nothing if `v4` is 4 or more** (it has arrived) **and
 * nothing if an aeon is in the front line**; else **Karma on the last attacker**. Karma is formula 22: the target's **kill count x 100** (`kernel/damage.ts` case 0x16, fed by `adapt/kill-count.ts`), 99,999 at most,
 * so it kills a member with 100 kills or more outright. A hit before its first Waddle (`v5` is 0) is answered; the very first Waddle sets `v5`, so the first hit after it is free, and so on after each of the four.
 *
 * The waypoint a Waddle moves to (the formation's chunk-3 monster positions, 112 to 91 units from the party) is published in `state.flags` (`TONBERRY_WAYPOINT_FLAG`) for the scene.
 */

import type { Command } from '../../common/types.ts';
import { type Ctx, rtOf } from '../state.ts';
import { aeonHoldsField, counterAllowed, react } from './hit-gates.ts';
import { randomLiving } from './game-rolls.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';
import { GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, TONBERRY_WAYPOINT_FLAG } from './gauntlet-rules.ts';

/** The Waddles it walks in over (`v4` reaches 4 and stays). */
export const TONBERRY_WADDLES = 4;
/** The memory slots of `v4` (Waddles done) and `v5` (the first hit after a Waddle is free). */
export const TONBERRY_WADDLES_DONE = 'gauntlet.tonberry.waddles';
export const TONBERRY_FREE_HIT = 'gauntlet.tonberry.freeHit';

/** One Don Tonberry turn (RE n 3.9). */
export function donTonberryTurn(ai: AiContext): Command | null {
  const { ctx, self, memory } = ai;
  const victim = (): string[] => {
    const v = randomLiving(ctx);
    return v === undefined ? [] : [v.id];
  };
  if (aeonHoldsField(ctx)) return use(ai, ROW.voodoo, victim());
  const waddles = num(memory, TONBERRY_WADDLES_DONE);
  if (waddles < TONBERRY_WADDLES) {
    memory[TONBERRY_WADDLES_DONE] = waddles + 1;
    memory[TONBERRY_FREE_HIT] = 1;
    ctx.state.flags[TONBERRY_WAYPOINT_FLAG] = waddles + 1; // PositionToMoveTo
    return use(ai, ROW.waddle, [self.id]);
  }
  // `findMatchingChr` is drawn before the script tests for an aeon again (it cannot be one here: the first test has settled that).
  const targets = victim();
  if (targets.length === 0) return null;
  return use(ai, ROW.tonberryAttack, targets);
}

/** True while Karma would answer a hit: it has not arrived and no aeon stands in the front line (the two tests after the free hit). */
function answersWithKarma(ctx: Ctx, waddlesDone: number): boolean {
  return waddlesDone < TONBERRY_WADDLES && !aeonHoldsField(ctx);
}

/** Don Tonberry's `onHit` (RE n 3.9): Karma on the attacker while it is still walking in. */
export function donTonberryHit(event: HitEvent): void {
  const { ctx, target, attacker } = event;
  if (!counterAllowed(ctx, target)) return;
  const memory = rtOf(ctx, target.id).ai;
  if (num(memory, TONBERRY_FREE_HIT) === 1) {
    memory[TONBERRY_FREE_HIT] = 0; // the first hit after a Waddle is free
    return;
  }
  if (!answersWithKarma(ctx, num(memory, TONBERRY_WADDLES_DONE))) return;
  if (target.hp <= 0) return; // the blow that killed it: its owner cannot act
  react(ctx, target, attacker.id, use(aiContextFor(ctx, target), ROW.karma, [attacker.id]));
}

registerAiScript(GAUNTLET_SCRIPTS.donTonberry, donTonberryTurn);
registerHitScript(GAUNTLET_SCRIPTS.donTonberry, donTonberryHit);
