/**
 * **Evrae's `onHit`** — the Stone Gaze counter, the Haste phase, and the Scythe and Haste he answers a hit with
 * (re-parity, AI lane C; **FFX only**; `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 2.5, m119 f4 @0x3E8).
 *
 * It is the engine's hit event (the one runner `./hooks.ts#runOnHit`, registered through `./hit-script.ts`): once per action per target after the last hit record, before the death check,
 * for a hit, a miss and a status-only action alike, from the party, from Cid's missiles and from a party counter-attack
 * (the hook runs, only the command it queues is dropped, D-34). Split out of `./evrae-rules.ts` for the 400-line house limit
 * [AGENTS.md hard rule 7]; `./evrae.ts` re-exports both.
 *
 * His rows, in the script's order (`v9` is the Haste phase, `v11` the one-event guard, `v12` the Delay count):
 *
 * 1. `v11` set: clear it and stop. It swallows the hit event of the Haste action itself.
 * 2. Haste phase and FAR: Swooping Scythe on the front line, BattleDistance := 0, the pending order cleared, stop (D-06).
 * 3. Haste phase, NEAR, Slow on him: Haste on himself, stop (D-07).
 * 4. Haste phase otherwise: nothing.
 * 5. Phase 1: the Gaze counter takes the command's step (D-03); Delay Attack counts 1 and Delay Buster 3 toward `v12`.
 * 6. HP < 10,666 (strict): the Haste phase starts (`v9`, `v11` set) with a Haste on himself (D-01).
 * 7. Else `v12` >= 3: the same Haste (D-02; on since Bailey's answer of 2026-10-09, `DELAY_ADVANCES_HASTE_PHASE`).
 *
 * The Haste and the Scythe are queued reactions: a Threatened or otherwise disabled Evrae, or a hit that is itself a
 * counter-attack, still moves `v9` and `v11` without the command running. The Haste is the player's own Haste command (0x3036)
 * aimed at himself, so it halves his pending counter and his recovery, and a Reflect on him bounces it (C-14, kept).
 */

import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type Ctx, has } from '../state.ts';
import { gazeStepOf } from './command-formula.ts';
import {
  AIRSHIP_DELAY_COUNT,
  AIRSHIP_DELAY_SWITCH,
  AIRSHIP_GAZE,
  AIRSHIP_HASTE_GUARD,
  AIRSHIP_ORDER,
  AIRSHIP_PHASE,
  AIRSHIP_RANGE,
  DELAY_ADVANCES_HASTE_PHASE,
  EVRAE_HASTE,
  EVRAE_SCRIPT,
  EVRAE_SWOOPING_SCYTHE,
  GAZE_THRESHOLD,
  HASTE_THRESHOLD,
  airshipRange,
  evraePhase,
} from './evrae-rules.ts';
import { frontIds, react, reactionAim } from './hit-gates.ts';
import { aiContextFor, use } from './types.ts';

function num(ctx: Ctx, key: string, fallback: number): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** True when the Stone Gaze counter is above 5: his next Attack slot is a Stone Gaze (still true after the Haste phase starts). */
export function stoneGazeDue(ctx: Ctx): boolean {
  return num(ctx, AIRSHIP_GAZE, 0) >= GAZE_THRESHOLD;
}

/** Spend the counter: firing a Stone Gaze zeroes it. */
export function spendStoneGazeCounter(ctx: Ctx): void {
  ctx.state.flags[AIRSHIP_GAZE] = 0;
}

/** Whether the Delay rule is on for this battle: the owner decision (on), or a bench's override. */
function delayRuleOn(ctx: Ctx): boolean {
  const override = ctx.state.flags[AIRSHIP_DELAY_SWITCH];
  return typeof override === 'boolean' ? override : DELAY_ADVANCES_HASTE_PHASE;
}

/** The Haste phase starts: `v9` and `v11` are written, then the Haste is asked for (it may be refused, see the header). */
function startHastePhase(event: HitEvent): void {
  const { ctx, attacker } = event;
  ctx.state.flags[AIRSHIP_PHASE] = 2;
  ctx.state.flags[AIRSHIP_HASTE_GUARD] = true;
  castHaste(event, reactionAim(ctx, attacker));
}

function castHaste(event: HitEvent, aimId: string): void {
  const { ctx, target: evrae } = event;
  react(ctx, evrae, aimId, use(aiContextFor(ctx, evrae), EVRAE_HASTE, [evrae.id]));
}

/** His `onHit`. */
function evraeHit(event: HitEvent): void {
  const { ctx, target: evrae, attacker, def } = event;
  const flags = ctx.state.flags;

  if (flags[AIRSHIP_HASTE_GUARD] === true) {
    flags[AIRSHIP_HASTE_GUARD] = false;
    return;
  }

  if (evraePhase(ctx) === 2) {
    if (airshipRange(ctx) === 'far') {
      // The Scythe comes first in the script; the writes follow it and stand even when the queue refuses the command.
      react(ctx, evrae, reactionAim(ctx, attacker), use(aiContextFor(ctx, evrae), EVRAE_SWOOPING_SCYTHE, frontIds(ctx)));
      flags[AIRSHIP_RANGE] = 'near';
      flags[AIRSHIP_ORDER] = '';
      return;
    }
    if (has(evrae, 'slow')) castHaste(event, evrae.id);
    return;
  }

  flags[AIRSHIP_GAZE] = num(ctx, AIRSHIP_GAZE, 0) + gazeStepOf(def, attacker);
  if (def.flags.includes('weak-delay')) flags[AIRSHIP_DELAY_COUNT] = num(ctx, AIRSHIP_DELAY_COUNT, 0) + 1;
  if (def.flags.includes('strong-delay')) flags[AIRSHIP_DELAY_COUNT] = num(ctx, AIRSHIP_DELAY_COUNT, 0) + 3;

  if (evrae.hp < HASTE_THRESHOLD || (delayRuleOn(ctx) && num(ctx, AIRSHIP_DELAY_COUNT, 0) >= 3)) startHastePhase(event);
}

registerHitScript(EVRAE_SCRIPT, evraeHit);
