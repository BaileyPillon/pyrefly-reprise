/**
 * **Sinspawn Genais and Sin's Core: the two rotations** (Sin, link 3).
 *
 * Source: `research/ffx-sin.md` §5.3 (`[verified: 3-4 sources]` unless the
 * rules file says otherwise); the constants, counters, setup and liveness hook
 * are in `./sin-genais-core-rules.ts`. Every judgement of ours is a row of
 * `SIN_CORE_ASSUMPTIONS` there.
 *
 * Both scripts first run the liveness sync, so a Genais KO inside the counter
 * phase (Zombie + Cura) is settled before either of them acts.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  SIN_CORE_GATHERS, SIN_CORE_GRAVIJA, SIN_CORE_INACTIVE, SIN_CORE_SCRIPT, SIN_CORE_STATE, SIN_GENAIS_SCRIPT, SIN_GENAIS_SHELL_IN, SIN_GENAIS_SHELL_OUT, SIN_GENAIS_SIGH, SIN_GENAIS_THRASHING,
  SIN_GENAIS_VENOM,
} from './sin-ids.ts';
import {
  GENAIS_LEAVE_AT, GENAIS_SHELL_AT, SIN_GENAIS_STEP, coreState, coreStateAfterGravija, genaisShelled,
  refreshCoreNegationChance, setShell, syncGenaisCoreLiveness,
} from './sin-genais-core-rules.ts';

export * from './sin-genais-core-rules.ts';

/** §5.3.1 item 1 [verified: 4 sources]: Venom, Venom, Thrashing, repeat. */
export const GENAIS_ROTATION: readonly string[] = [SIN_GENAIS_VENOM, SIN_GENAIS_VENOM, SIN_GENAIS_THRASHING];

/**
 * One Genais turn (§5.3.1):
 *
 * - out of the shell at 10,000 HP or less: "Enters shell." (item 3);
 * - in the shell at 12,000 or more: "Exits shell." (item 5, S-2);
 * - in the shell: Sigh (item 4);
 * - otherwise the next of Venom, Venom, Thrashing (item 1). Venom's single
 *   target is left to the row's own random pick under the seed.
 */
export function genaisAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  syncGenaisCoreLiveness(ctx);
  const shelled = genaisShelled(ctx);
  if (!shelled && self.hp <= GENAIS_SHELL_AT) {
    setShell(ctx, self, true);
    return use(ai, SIN_GENAIS_SHELL_IN, [self.id]);
  }
  if (shelled && self.hp >= GENAIS_LEAVE_AT) {
    setShell(ctx, self, false);
    return use(ai, SIN_GENAIS_SHELL_OUT, [self.id]);
  }
  if (shelled) return use(ai, SIN_GENAIS_SIGH);
  const raw = ctx.state.flags[SIN_GENAIS_STEP];
  const step = typeof raw === 'number' ? raw % GENAIS_ROTATION.length : 0;
  ctx.state.flags[SIN_GENAIS_STEP] = (step + 1) % GENAIS_ROTATION.length;
  return use(ai, GENAIS_ROTATION[step]!);
}

/**
 * One Core turn (§5.3.2): `ready` fires Gravija at everyone, Genais included
 * (its shell turns it aside, item 6; the Core is percentage-immune, S-14);
 * `charging` and `free` gather energy; `inactive` idles. The Negation chance is
 * recalculated here (S-12, the wiki: "recalculated on each Core turn").
 */
export function sinCoreAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  syncGenaisCoreLiveness(ctx);
  refreshCoreNegationChance(ctx);
  const state = coreState(ctx);
  if (state === 'ready') {
    ctx.state.flags[SIN_CORE_STATE] = coreStateAfterGravija(ctx);
    return use(ai, SIN_CORE_GRAVIJA);
  }
  if (state === 'charging' || state === 'free') {
    ctx.state.flags[SIN_CORE_STATE] = 'ready';
    return use(ai, SIN_CORE_GATHERS, [self.id]);
  }
  // Genais out of its shell (item 1); a dead Genais has already made the state `free` (the sync above).
  return use(ai, SIN_CORE_INACTIVE, [self.id]);
}

registerAiScript(SIN_GENAIS_SCRIPT, genaisAi);
registerAiScript(SIN_CORE_SCRIPT, sinCoreAi);
