/**
 * **Sinspawn Genais and Sin's Core: the two rotations** (Sin, link 3).
 *
 * **STUB with the final signatures**, written by package S
 * (`docs/plans/sin-two-chapters-plan.md` §2.2). Package G fills both scripts
 * from research/ffx-sin.md §5.3. Each stub registers its script and returns
 * `null`: a deliberate pass, which still costs a rank-3 turn.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { type AiContext, registerAiScript } from './types.ts';
import { SIN_CORE_SCRIPT, SIN_GENAIS_SCRIPT } from './sin-ids.ts';

export * from './sin-genais-core-rules.ts';

/** **STUB (package G).** One Genais turn: Venom, Venom, Thrashing out of the shell; Sigh in it (§5.3.1). */
export function genaisAi(ai: AiContext): Command | null {
  void ai;
  return null;
}

/** **STUB (package G).** One Core turn: inactive, charge and Gravija, or free (§5.3.2). */
export function sinCoreAi(ai: AiContext): Command | null {
  void ai;
  return null;
}

registerAiScript(SIN_GENAIS_SCRIPT, genaisAi);
registerAiScript(SIN_CORE_SCRIPT, sinCoreAi);
