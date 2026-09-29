/**
 * **The Fins' rotations and Cid without missiles** (Sin, links 1 and 2).
 *
 * **STUB with the final signatures**, written by package S
 * (`docs/plans/sin-two-chapters-plan.md` §2.2). Package F fills the three
 * scripts from research/ffx-sin.md §2.5, §4 and §5.1.4. Each stub registers its
 * script and returns `null`: a deliberate pass, which still costs a rank-3 turn
 * (`engine.ts#runTurn`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { type AiContext, registerAiScript } from './types.ts';
import { SIN_CID_SCRIPT, SIN_LEFT_FIN_SCRIPT, SIN_RIGHT_FIN_SCRIPT } from './sin-ids.ts';

export * from './sin-fins-rules.ts';

/** **STUB (package F).** One Left Fin turn (§5.1). */
export function leftFinAi(ai: AiContext): Command | null {
  void ai;
  return null;
}

/** **STUB (package F).** One Right Fin turn (§5.2). */
export function rightFinAi(ai: AiContext): Command | null {
  void ai;
  return null;
}

/** **STUB (package F).** One Cid turn in the Fin fights: a queued order, else nothing (§2.5, S-19). */
export function cidSinAi(ai: AiContext): Command | null {
  void ai;
  return null;
}

registerAiScript(SIN_LEFT_FIN_SCRIPT, leftFinAi);
registerAiScript(SIN_RIGHT_FIN_SCRIPT, rightFinAi);
registerAiScript(SIN_CID_SCRIPT, cidSinAi);
