/**
 * **Sin's liveness hook** (FFX only): link 3's marks that depend on who is alive, recomputed once per action through the one
 * line `reactions.ts#runMortibsorptionIfDown` carries (`docs/plans/sin-two-chapters-plan.md` §2.1, REVIEW must-change 2).
 *
 * The Fins', Genais's, the Core's and Overdrive Sin's answers used to be collected here once per player-side action; they are
 * the engine's hit events now (`hooks.ts`, registered through `hit-script.ts` by `sin-fins.ts`, `sin-genais-core.ts` and `overdrive-sin.ts`), which
 * see a miss, a heal and a status-only action too and take a party counter-attack's counters without its commands.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Ctx } from '../state.ts';
import { syncGenaisCoreLiveness } from './sin-genais-core-rules.ts';

/** Recompute the Sin marks that depend on who is alive, for every action (link 3; a no-op elsewhere). */
export function runSinLivenessHooks(ctx: Ctx): void {
  syncGenaisCoreLiveness(ctx);
}
