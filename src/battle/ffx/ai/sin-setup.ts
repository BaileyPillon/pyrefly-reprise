/**
 * **Sin's setup and runtime marks, aggregated** (FFX only): one entry point for
 * every Sin link, so the shared engine files take each hook through one line
 * swapped in place and do not grow (`docs/plans/sin-two-chapters-plan.md` §2.1;
 * `setup.ts` and `simulate.ts` are already over the 400-line house limit).
 *
 * | Swapped line | Now calls |
 * |---|---|
 * | `setup.ts`: `applyOverdriveSinSetup(ctx);` | {@link applySinSetups} |
 * | `simulate.ts`: `markEvraeRuntime(state.flags, rt.actors);` | {@link markAirshipRuntime} |
 *
 * Every callee returns early without its own enemy on the field or its own
 * `state.flags` keys, so every other battle is untouched (the FFX golden hashes,
 * `tests/unit/tools/ffx-chapter-hashes.test.ts`, are identical before and after).
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3].
 */

import type { CombatantId } from '../../common/types.ts';
import type { ActorRuntime, Ctx } from '../state.ts';
import { markEvraeRuntime } from './evrae-rules.ts';
import { applyOverdriveSinSetup } from './overdrive-sin-rules.ts';
import { applySinFinsSetup, markSinFinsRuntime } from './sin-fins-rules.ts';
import { applySinGenaisCoreSetup, markSinGenaisCoreRuntime } from './sin-genais-core-rules.ts';

/**
 * Called once from `setup.ts#buildBattle`, in the slot Overdrive Sin's setup
 * had: link 4's clock first (unchanged), then the Fins (links 1 and 2), then
 * Genais and the Core (link 3).
 */
export function applySinSetups(ctx: Ctx): void {
  applyOverdriveSinSetup(ctx); // the ship FAR for the pulls, the clock, Gaze's count [ffx-sin §5.4]
  applySinFinsSetup(ctx); // links 1-2 [ffx-sin §4, §5.1, §5.2]
  applySinGenaisCoreSetup(ctx); // link 3 [ffx-sin §5.3]
}

/**
 * The Sin marks a rebuilt runtime needs (links 1 to 3), read off `state.flags`
 * alone. Overdrive Sin's own mark (the counted foe) is `markEvraeRuntime`'s.
 */
export function markSinRuntime(
  flags: Readonly<Record<string, unknown>>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  markSinFinsRuntime(flags, actors);
  markSinGenaisCoreRuntime(flags, actors);
}

/**
 * `simulate.ts#runtimeFor` rebuilds a preview's runtime from `BattleState`,
 * which does not carry `ActorRuntime`. This restores Evrae's marks and then
 * Sin's, so a preview in a Sin link reaches, counts and ends as the live battle
 * does (the `markEvraeRuntime` lesson: Wakka's reach was lost in previews).
 */
export function markAirshipRuntime(
  flags: Readonly<Record<string, unknown>>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  markEvraeRuntime(flags, actors);
  markSinRuntime(flags, actors);
}
