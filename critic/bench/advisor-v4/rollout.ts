/**
 * Moved to the game: `src/engine/tactics/advisor-v4/rollout.ts` (advisor v4 build, 2026-09-28).
 * `chainOf` adds the screen's own link carry, which the engine layer takes by injection.
 */
import type { Chain } from '../../../src/engine/tactics/advisor-v4/rollout.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { DecisionContext } from '../advisor-v3/drive.ts';

export * from '../../../src/engine/tactics/advisor-v4/rollout.ts';

/** The drive's chain, with `setupForNextLink` as the carry (or `null`). */
export function chainOf(ctx: DecisionContext): Chain | null {
  return ctx.chain ? { ...ctx.chain, nextLink: (p, g, s, seed) => setupForNextLink(p, g, s, seed) } : null;
}
