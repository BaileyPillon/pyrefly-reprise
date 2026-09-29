/**
 * **The Fins' rotations and Cid without missiles** (Sin, links 1 and 2).
 *
 * Source: `research/ffx-sin.md` §5.1.4 (the reference pseudocode, transcribed
 * below step for step), §5.2 (the Right Fin's differences), §2.5 and §4 (Cid).
 * Everything these scripts read — the constants, the flags, the estimates, the
 * setup and the counters — is in `./sin-fins-rules.ts`, re-exported from here so
 * one import reaches the whole of links 1 and 2.
 *
 * ```
 * finTurn():
 *   if charged: charged = false; regularActs = 0
 *               return range == NEAR ? Gravija(75 % current) : GravijaWhiff()
 *   if range == NEAR and regularActs >= 3: charged = true; return CoreGathersEnergy()
 *   p = range == NEAR ? [0.33, 0.67, 1.0][min(hits, 2)] : (hits >= 7 ? 1.0 : 0.0)
 *   regularActs += (range == NEAR) ? 1 : 0          // "not while far away"
 *   if rng() < p: hits = 0; return range == NEAR ? Ram : Smack
 *   return SinRemainsMotionless()
 * ```
 *
 * The Right Fin swaps only `p` (§5.2): NEAR from 4 hits, FAR from 5; latched
 * under 16,250 HP, NEAR always and FAR from 3. A roll is drawn only when `p` is
 * strictly between 0 and 1, so a sure or an impossible attack costs no draw.
 *
 * Returning `null` is a deliberate pass; the engine still charges a rank-3
 * turn (`engine.ts#runTurn`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import { airshipRange, applyQueuedOrder, queuedOrder } from './evrae-rules.ts';
import {
  SIN_CID_SCRIPT,
  SIN_FIN_CHARGED,
  SIN_FIN_GATHERS,
  SIN_FIN_GRAVIJA,
  SIN_FIN_GRAVIJA_FAR,
  SIN_FIN_HITS,
  SIN_FIN_RAM,
  SIN_FIN_REGULAR_ACTS,
  SIN_FIN_SMACK,
  SIN_LEFT_FIN_SCRIPT,
  SIN_MOTIONLESS,
  SIN_RIGHT_FIN_SCRIPT,
} from './sin-ids.ts';
import {
  GRAVIJA_COUNTS_AS_REGULAR,
  LEFT_FAR_HITS,
  LEFT_NEAR_ATTACK_CHANCE,
  REGULAR_ACTS_BEFORE_CHARGE,
  RIGHT_FAR_HITS,
  RIGHT_LATCHED_FAR_HITS,
  RIGHT_NEAR_HITS,
  updateRightFinLatch,
} from './sin-fins-rules.ts';

export * from './sin-fins-rules.ts';

function num(ai: AiContext, key: string): number {
  const v = ai.ctx.state.flags[key];
  return typeof v === 'number' ? v : 0;
}

/** §5.1.4 `finTurn`, with the attack chance `p` supplied by the Fin. */
function finTurn(ai: AiContext, attackChance: (near: boolean, hits: number) => number): Command {
  const ctx = ai.ctx;
  const flags = ctx.state.flags;
  const near = airshipRange(ctx) === 'near';

  if (flags[SIN_FIN_CHARGED] === true) {
    flags[SIN_FIN_CHARGED] = false;
    flags[SIN_FIN_REGULAR_ACTS] = GRAVIJA_COUNTS_AS_REGULAR ? 1 : 0; // S-25
    // A charge resolving at FAR is the no-damage long-range row: the dodge [§3.1, verified: 3 sources].
    return near ? use(ai, SIN_FIN_GRAVIJA, []) : use(ai, SIN_FIN_GRAVIJA_FAR, []);
  }

  if (near && num(ai, SIN_FIN_REGULAR_ACTS) >= REGULAR_ACTS_BEFORE_CHARGE) {
    flags[SIN_FIN_CHARGED] = true; // the telegraph: one turn of warning [§5.1.2, verified: 3 sources]
    return use(ai, SIN_FIN_GATHERS, [ai.self.id]);
  }

  const p = attackChance(near, num(ai, SIN_FIN_HITS));
  if (near) flags[SIN_FIN_REGULAR_ACTS] = num(ai, SIN_FIN_REGULAR_ACTS) + 1; // "not while far away"
  const attacks = p >= 1 || (p > 0 && ctx.rng.next() < p);
  if (!attacks) return use(ai, SIN_MOTIONLESS, [ai.self.id]);
  flags[SIN_FIN_HITS] = 0; // the counter resets when the Fin attacks [§5.1.1, single source: wiki]
  return near ? use(ai, SIN_FIN_RAM, []) : use(ai, SIN_FIN_SMACK, []);
}

/** One Left Fin turn (§5.1): NEAR 33 / 67 / 100 % after 0 / 1 / 2+ hits; FAR from 7 hits. */
export function leftFinAi(ai: AiContext): Command | null {
  return finTurn(ai, (near, hits) =>
    near ? LEFT_NEAR_ATTACK_CHANCE[Math.min(hits, LEFT_NEAR_ATTACK_CHANCE.length - 1)]! : hits >= LEFT_FAR_HITS ? 1 : 0,
  );
}

/** One Right Fin turn (§5.2): NEAR from 4 hits, FAR from 5; latched under 16,250 HP, NEAR always and FAR from 3. */
export function rightFinAi(ai: AiContext): Command | null {
  const latched = updateRightFinLatch(ai.ctx, ai.self);
  return finTurn(ai, (near, hits) => {
    if (near) return latched || hits >= RIGHT_NEAR_HITS ? 1 : 0;
    return hits >= (latched ? RIGHT_LATCHED_FAR_HITS : RIGHT_FAR_HITS) ? 1 : 0;
  });
}

/**
 * One Cid turn in the Fin fights (§2.5, §4): a queued order is flown, with the
 * same telegraph line Evrae's Cid gives, and consumes the turn (a redundant one
 * too, Evrae's C-7); otherwise nothing at all. **No missiles** (S-19, Gestahl,
 * `[single source]`), so no volley, no rack and no "out of missiles" line.
 */
export function cidSinAi(ai: AiContext): Command | null {
  const ctx = ai.ctx;
  const order = queuedOrder(ctx);
  if (order === null) return null;
  applyQueuedOrder(ctx);
  ctx.emit({ type: 'message', text: order === 'far' ? 'The Fahrenheit pulls back' : 'The Fahrenheit closes in', kind: 'telegraph' });
  return null;
}

registerAiScript(SIN_LEFT_FIN_SCRIPT, leftFinAi);
registerAiScript(SIN_RIGHT_FIN_SCRIPT, rightFinAi);
registerAiScript(SIN_CID_SCRIPT, cidSinAi);
