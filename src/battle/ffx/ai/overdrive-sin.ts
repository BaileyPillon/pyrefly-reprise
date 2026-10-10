/**
 * **Overdrive Sin's clock and its Gaze** — link 4 of the assault from the *Fahrenheit* (re-parity AI lane C, **FFX only**).
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 7 (m140 in `ssbt03_00`):
 *
 * ```
 * turn n (counted from 1):
 *   n <= 3        "Drawn to Sin." (a dummy with no hit record); BattleDistance 3, then 1 after pull 2, then 0 after pull 3
 *   4 <= n <= 11  no command: the mouth opens one stage (a rank-3 turn); the Overdrive bar climbs 10 a turn
 *   n = 12        clear Auto-Life on all 17 party and aeon actors, Giga-Graviton on the front line, mark the summon game over
 * ```
 *
 * His `onHit` is the Gaze counter: `v3` rises by 1 on **every** hit event, from the first one, also during the pulls; once the
 * pulls are over it fires the aeon Gaze above 2 while an aeon 8 to 14 holds the field, otherwise one of Zombie, Petrify or
 * Confuse (`GetRandomValue() mod 3`) above 5, and `v3` returns to 0. A Gaze is a queued reaction: a hit that is itself a
 * counter-attack moves the count and loses the command. Sin has no other attack.
 *
 * The clock moves at decision time. An intent dry-run calls this on a cloned context (`intent.ts#cloneCtx` copies
 * `state.flags`), so asking never moves the live clock.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { SCRIPTED_GAME_OVER_FLAG } from '../results.ts';
import { AIRSHIP_RANGE } from './evrae-rules.ts';
import { gameMod } from './game-rolls.ts';
import { aeonHoldsField, frontIds, react, reactionAim } from './hit-gates.ts';
import { type AiContext, aiContextFor, registerAiScript, use } from './types.ts';
import {
  AIRSHIP_DISTANCE,
  DISTANCE_AFTER_PULL_TWO,
  GAZE_AEON_THRESHOLD,
  GAZE_THRESHOLD,
  GAZE_VARIANTS,
  OVERDRIVE_SIN_SCRIPT,
  PULL_TURNS,
  SIN_DRAWN,
  SIN_GAZE,
  SIN_GAZE_AEON,
  SIN_GIGA_GRAVITON,
  SIN_MOUTH,
  SIN_TURN,
  SIN_TURNS_LEFT,
  gigaGravitonTurn,
  mouthStage,
} from './overdrive-sin-rules.ts';

export * from './overdrive-sin-rules.ts';

/**
 * Placeholder copy for the pose turns (our own words; no line is quoted). The story and HUD tracks own the real lines once
 * Bailey picks the concept frames (AGENTS.md rule 9).
 */
const MOUTH_LINES: Record<number, string> = {
  1: "Sin's mouth begins to open",
  2: "Sin's mouth opens wider",
  3: "Sin's mouth opens wider still",
  4: "Sin's mouth is fully open",
};

/** One Overdrive Sin turn [note 7.2]. */
export function overdriveSinAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const flags = ctx.state.flags;
  const n = (typeof flags[SIN_TURN] === 'number' ? (flags[SIN_TURN] as number) : 0) + 1;
  const last = gigaGravitonTurn(ctx);
  flags[SIN_TURN] = n;
  flags[SIN_TURNS_LEFT] = Math.max(0, last - n);
  flags[SIN_MOUTH] = mouthStage(n, last);

  // Turns 1-3: the pull. The distance is 3 after the first, 1 after the second (Use, the items and Wakka's reels reach, melee
  // does not), 0 after the third, when the ship has come in.
  if (n <= PULL_TURNS) {
    if (n === 2) flags[AIRSHIP_DISTANCE] = DISTANCE_AFTER_PULL_TWO;
    if (n === PULL_TURNS) {
      flags[AIRSHIP_RANGE] = 'near';
      flags[AIRSHIP_DISTANCE] = 0;
    }
    return use(ai, SIN_DRAWN, [self.id]);
  }

  // The melee window: a pose, not an action. A pass still costs a rank-3 turn (`engine.ts#runTurn`).
  if (n < last) {
    ctx.emit({ type: 'message', text: MOUTH_LINES[mouthStage(n, last)] ?? MOUTH_LINES[1]!, kind: 'telegraph' });
    return null;
  }

  // The last turn: Giga-Graviton, and the Game Over is the script. Raised now; `engine.ts#checkEnd` reads it once the row has
  // resolved, whatever Auto-Life or an aeon did.
  flags[SCRIPTED_GAME_OVER_FLAG] = true;
  return use(ai, SIN_GIGA_GRAVITON, []);
}

/** His `onHit` (m140 f4 @0x464): the Gaze counter. */
function sinHit(event: HitEvent): void {
  const { ctx, target: sin, attacker } = event;
  const flags = ctx.state.flags;
  const count = (typeof flags[SIN_GAZE] === 'number' ? (flags[SIN_GAZE] as number) : 0) + 1;
  flags[SIN_GAZE] = count;
  const turn = typeof flags[SIN_TURN] === 'number' ? (flags[SIN_TURN] as number) : 0;
  if (turn < PULL_TURNS) return; // the pulls are not over

  const ai = aiContextFor(ctx, sin);
  if (aeonHoldsField(ctx)) {
    if (count < GAZE_AEON_THRESHOLD) return;
    flags[SIN_GAZE] = 0;
    react(ctx, sin, reactionAim(ctx, attacker), use(ai, SIN_GAZE_AEON, frontIds(ctx)));
    return;
  }
  if (count < GAZE_THRESHOLD) return;
  flags[SIN_GAZE] = 0;
  react(ctx, sin, reactionAim(ctx, attacker), use(ai, GAZE_VARIANTS[gameMod(ctx, 3)]!, frontIds(ctx)));
}

registerAiScript(OVERDRIVE_SIN_SCRIPT, overdriveSinAi);
registerHitScript(OVERDRIVE_SIN_SCRIPT, sinHit);
