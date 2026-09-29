/**
 * **Overdrive Sin's clock** — link 4 of the assault from the *Fahrenheit*.
 *
 * Source: `research/ffx-sin.md` §5.4, whose reference pseudocode this follows:
 *
 * ```
 * odSinTurn(n):
 *   if n <= 3: DrawnToSin(); if n == 3: range = 'NEAR'; return
 *   if n < LAST (12 or 13, S-1): OpenMouth(stage); return       // no action row: a pose
 *   GigaGraviton(); scriptedGameOver()                           // ignores Auto-Life and aeons
 * ```
 *
 * Gaze is not a turn: it is the counter in `./overdrive-sin-rules.ts`, run by
 * `./reactions.ts`. Sin has **no other attack** (§5.4 "Gaze, the only attack",
 * `[verified: 3 sources]`), so between the pulls and the end the clock is the
 * whole of its turn.
 *
 * The clock moves at decision time. An intent dry-run calls this on a cloned
 * context (`intent.ts#cloneCtx` copies `state.flags`), so asking never moves
 * the live clock.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { SCRIPTED_GAME_OVER_FLAG } from '../results.ts';
import { AIRSHIP_RANGE } from './evrae-rules.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  OVERDRIVE_SIN_SCRIPT,
  PULL_TURNS,
  SIN_DRAWN,
  SIN_GIGA_GRAVITON,
  SIN_MOUTH,
  SIN_TURN,
  SIN_TURNS_LEFT,
  gigaGravitonTurn,
  mouthStage,
} from './overdrive-sin-rules.ts';

export * from './overdrive-sin-rules.ts';

/**
 * Placeholder copy for the pose turns (our own words; no line is quoted). The
 * story and HUD tracks own the real lines once Bailey picks the concept frames
 * (AGENTS.md rule 9).
 */
const MOUTH_LINES: Record<number, string> = {
  1: "Sin's mouth begins to open",
  2: "Sin's mouth opens wider",
  3: "Sin's mouth opens wider still",
  4: "Sin's mouth is fully open",
};

/** One Overdrive Sin turn [§5.4]. */
export function overdriveSinAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const flags = ctx.state.flags;
  const n = (typeof flags[SIN_TURN] === 'number' ? (flags[SIN_TURN] as number) : 0) + 1;
  const last = gigaGravitonTurn(ctx);
  flags[SIN_TURN] = n;
  flags[SIN_TURNS_LEFT] = Math.max(0, last - n);
  flags[SIN_MOUTH] = mouthStage(n, last);

  // Turns 1-3: the pull [§5.4, verified: 5 sources]. The third brings the ship in.
  if (n <= PULL_TURNS) {
    if (n === PULL_TURNS) flags[AIRSHIP_RANGE] = 'near';
    return use(ai, SIN_DRAWN, [self.id]);
  }

  // The melee window: a pose, not an action [§3.4, single source: wiki]. A pass
  // still costs a rank-3 turn (`engine.ts#runTurn`).
  if (n < last) {
    ctx.emit({ type: 'message', text: MOUTH_LINES[mouthStage(n, last)] ?? MOUTH_LINES[1]!, kind: 'telegraph' });
    return null;
  }

  // The last turn: Giga-Graviton, and the Game Over is the script [§3.4,
  // verified: 4 sources]. Raised now; `engine.ts#checkEnd` reads it once the row
  // has resolved, whatever Auto-Life or an aeon did.
  flags[SCRIPTED_GAME_OVER_FLAG] = true;
  return use(ai, SIN_GIGA_GRAVITON, []);
}

registerAiScript(OVERDRIVE_SIN_SCRIPT, overdriveSinAi);
