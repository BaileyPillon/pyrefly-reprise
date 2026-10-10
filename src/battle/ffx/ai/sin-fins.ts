/**
 * **The Fins' rotations, their `onHit`, and Cid without missiles** (Sin, links 1 and 2; re-parity AI lane C, **FFX only**).
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 5 (m136 Left Fin, m137 Right Fin, m149 Cid's order machinery).
 * Everything these scripts read — the constants, the flags, the setup — is in `./sin-fins-rules.ts`, re-exported from here so one
 * import reaches the whole of links 1 and 2.
 *
 * **The turn** (`v7` is the regular-turn count, 4 once charged; `v8` the hit counter):
 *
 * | | Condition | Action |
 * |---|---|---|
 * | 1 | FAR, charged | the do-nothing Gravija, aimed at the Fin himself; the count restarts |
 * | 2 | FAR, otherwise | Smack on the front line if `v8` is above the threshold (6 Left, 4 Right, 2 once latched), else the motionless dummy; `v8` := 0 after a Smack |
 * | 3 | NEAR, `v7` 0 to 2 | Ram on the front line if the test passes (Left: `GetRandomValue() mod 3 <= v8`, a draw every time; Right: latched or `v8` > 3), else the dummy; `v7` += 1 either way; `v8` := 0 after a Ram |
 * | 4 | NEAR, `v7` 3 | the charge dummy ("Core gathers energy."); `v7` := 4 |
 * | 5 | NEAR, charged | Gravija on the front line (75 % of current HP); `v7` := 0 |
 *
 * **The `onHit`** (`finHit`; D-19 to D-22): the Right Fin's latch first, then the one-event guard, then the counter (+2 with an aeon
 * 8 to 14 on the field, else +1), then the score, then the roll: at FAR a draw of `mod 100` (spent whether or not he has Mental
 * Break) and, with Mental Break and under 80, a Negation on himself that sets the guard; at NEAR a draw of `mod 16` (Left) or
 * `mod 12` (Right) against `max(0, score - 3)` and, if lower, a Negation on the front line and himself. A Negation is a hit on
 * the Fin himself, and so are the do-nothing Gravija: each raises a hit event on him (note 5.3's side effect), and only the FAR
 * Negation's is swallowed by the guard.
 *
 * Returning `null` is a deliberate pass; the engine still charges a rank-3 turn (`engine.ts#runTurn`).
 */

import type { Command } from '../../common/types.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { has, livingFriendlies } from '../state.ts';
import { AIRSHIP_RANGE, airshipRange, applyQueuedOrder, queuedOrder } from './evrae-rules.ts';
import { gameMod } from './game-rolls.ts';
import { aeonHoldsField, frontIds, react, reactionAim } from './hit-gates.ts';
import { type AiContext, aiContextFor, registerAiScript, use } from './types.ts';
import {
  SIN_CID_SCRIPT,
  SIN_FIN_CHARGED,
  SIN_FIN_GATHERS,
  SIN_FIN_GRAVIJA,
  SIN_FIN_GRAVIJA_FAR,
  SIN_FIN_HITS,
  SIN_FIN_LATCHED,
  SIN_FIN_NEGATION,
  SIN_FIN_NEGATION_FAR,
  SIN_FIN_NEGATION_GUARD,
  SIN_FIN_RAM,
  SIN_FIN_REGULAR_ACTS,
  SIN_FIN_SMACK,
  SIN_LEFT_FIN_SCRIPT,
  SIN_MOTIONLESS,
  SIN_RIGHT_FIN_ID,
  SIN_RIGHT_FIN_SCRIPT,
} from './sin-ids.ts';
import {
  AEON_HIT_WEIGHT,
  LEFT_FAR_HITS,
  LEFT_RAM_MODULUS,
  REGULAR_ACTS_BEFORE_CHARGE,
  RIGHT_FAR_HITS,
  RIGHT_LATCH_HP,
  RIGHT_LATCHED_FAR_HITS,
  RIGHT_NEAR_HITS,
} from './sin-fins-rules.ts';
import {
  NEGATION_DIVISOR_LEFT,
  NEGATION_DIVISOR_RIGHT,
  NEGATION_FAR_BELOW,
  NEGATION_OFFSET,
  SIN_NEGATION_OFF,
  finScore,
  publishNegationTaken,
} from './sin-negation.ts';

export * from './sin-fins-rules.ts';

function num(ai: AiContext, key: string): number {
  const v = ai.ctx.state.flags[key];
  return typeof v === 'number' ? v : 0;
}

/** Whether this turn's attack goes out. A pick-by-test: the Left Fin's draws every NEAR regular turn; the Right Fin's never. */
type AttackRule = (ai: AiContext, near: boolean, hits: number) => boolean;

function finTurn(ai: AiContext, attacks: AttackRule): Command {
  const { ctx } = ai;
  const flags = ctx.state.flags;
  const near = airshipRange(ctx) === 'near';

  if (flags[SIN_FIN_CHARGED] === true) {
    flags[SIN_FIN_CHARGED] = false;
    flags[SIN_FIN_REGULAR_ACTS] = 0;
    // A charge resolving at FAR is the do-nothing Gravija, aimed at himself (it raises a hit event on him, note 5.3).
    return near ? use(ai, SIN_FIN_GRAVIJA, []) : use(ai, SIN_FIN_GRAVIJA_FAR, [ai.self.id]);
  }

  if (near && num(ai, SIN_FIN_REGULAR_ACTS) >= REGULAR_ACTS_BEFORE_CHARGE) {
    flags[SIN_FIN_CHARGED] = true; // the telegraph: one turn of warning
    return use(ai, SIN_FIN_GATHERS, [ai.self.id]);
  }

  const hits = num(ai, SIN_FIN_HITS);
  const goes = attacks(ai, near, hits);
  if (near) flags[SIN_FIN_REGULAR_ACTS] = num(ai, SIN_FIN_REGULAR_ACTS) + 1; // "not while far away", counted whether he attacks or not
  if (!goes) return use(ai, SIN_MOTIONLESS, [ai.self.id]);
  flags[SIN_FIN_HITS] = 0; // the counter resets when the Fin attacks
  return near ? use(ai, SIN_FIN_RAM, []) : use(ai, SIN_FIN_SMACK, []);
}

/** One Left Fin turn: NEAR, `mod 3 <= hits` (a draw every turn); FAR, more than 6 hits. */
export function leftFinAi(ai: AiContext): Command | null {
  return finTurn(ai, (a, near, hits) => (near ? gameMod(a.ctx, LEFT_RAM_MODULUS) <= hits : hits >= LEFT_FAR_HITS));
}

/** One Right Fin turn: NEAR, more than 3 hits or latched; FAR, more than 4 hits, more than 2 once latched. */
export function rightFinAi(ai: AiContext): Command | null {
  return finTurn(ai, (a, near, hits) => {
    const latched = a.ctx.state.flags[SIN_FIN_LATCHED] === true;
    if (near) return latched || hits >= RIGHT_NEAR_HITS;
    return hits >= (latched ? RIGHT_LATCHED_FAR_HITS : RIGHT_FAR_HITS);
  });
}

/** The Fins' `onHit` (m136 f5 @0x461, m137 f4 @0x43c). */
function finHit(event: HitEvent): void {
  const { ctx, target: fin, attacker } = event;
  const flags = ctx.state.flags;

  // Right Fin only: below 16,250 (strict) the phase flag is set for good, before the guard is looked at.
  if (fin.id === SIN_RIGHT_FIN_ID && fin.hp < RIGHT_LATCH_HP) flags[SIN_FIN_LATCHED] = true;

  // The Fin's own FAR Negation raises an event on him; this swallows it.
  if (flags[SIN_FIN_NEGATION_GUARD] === true) {
    flags[SIN_FIN_NEGATION_GUARD] = false;
    return;
  }

  flags[SIN_FIN_HITS] = (typeof flags[SIN_FIN_HITS] === 'number' ? (flags[SIN_FIN_HITS] as number) : 0) + (aeonHoldsField(ctx) ? AEON_HIT_WEIGHT : 1);

  const ai = aiContextFor(ctx, fin);
  const off = flags[SIN_NEGATION_OFF] === true;
  if (flags[AIRSHIP_RANGE] === 'far') {
    // The draw is spent whether or not he has Mental Break.
    const roll = gameMod(ctx, 100);
    if (has(fin, 'mental-break') && roll < NEGATION_FAR_BELOW) {
      flags[SIN_FIN_NEGATION_GUARD] = true;
      if (off) return;
      publishNegationTaken(ctx, [fin]);
      react(ctx, fin, reactionAim(ctx, attacker), use(ai, SIN_FIN_NEGATION_FAR, [fin.id]));
    }
    return;
  }
  const roll = gameMod(ctx, fin.id === SIN_RIGHT_FIN_ID ? NEGATION_DIVISOR_RIGHT : NEGATION_DIVISOR_LEFT);
  const score = Math.max(0, finScore(ctx, fin) - NEGATION_OFFSET);
  if (roll < score && !off) {
    publishNegationTaken(ctx, [...livingFriendlies(ctx), fin]);
    react(ctx, fin, reactionAim(ctx, attacker), use(ai, SIN_FIN_NEGATION, [...frontIds(ctx), fin.id]));
  }
}

/**
 * One Cid turn in the Fin fights (note 5.1): a queued order is flown, with the same telegraph line Evrae's Cid gives, and
 * consumes the turn (a redundant one too, Evrae's C-7); otherwise nothing at all. **No missiles**, so no volley, no rack and no
 * "out of missiles" line.
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
registerHitScript(SIN_LEFT_FIN_SCRIPT, finHit);
registerHitScript(SIN_RIGHT_FIN_SCRIPT, finHit);
