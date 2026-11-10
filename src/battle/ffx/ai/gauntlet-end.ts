/**
 * **How the hidden Gauntlet chapter's act 1 ends when its creation leaves** (FFX only; chapter 54), read by `engine-end.ts#checkEnd` before its own rules, as the Flooded Ways' own ends are
 * (`./flooded-ways-end.ts`).
 *
 * The Cactuar King's script ends a fight it is losing on its own terms: on the third rest roll it performs **Run Away** (`research/re-ffx-monster-arena-creations.md` 3.8, "RE n"; `[run]`), and the monster is gone with
 * nothing paid. The game does not say how that battle ends for the player (the live check "does it end as a loss or a draw" is open: RE n 8, item 4), so the chapter's pick **GA9** reads it as **"it got away"**: the
 * battle ends with the engine's `'escape'` outcome (the party withdraws; nobody is beaten and nothing is paid, no drop, no AP), the system line below is the last event, and the chain retries the act (the first act is
 * the chapter's start, where a withdrawal already retries from). `ejectActor` is not used: it would pay the monster's loot as a kill does.
 *
 * Inert in every other battle: the flag is written by the Cactuar King's script alone.
 */

import type { Ctx } from '../state.ts';
import { GOT_AWAY_FLAG } from './gauntlet-rules.ts';

/** The system line the battle ends on (the withdrawal card of the integration stage prints it). */
export const GOT_AWAY_LINE = 'The Cactuar King got away!';

/** `'escape'` once the Cactuar King has run away (announced once: the battle's result is set by the caller), else `undefined`. */
export function gauntletOutcome(ctx: Ctx): 'escape' | undefined {
  if (ctx.state.flags[GOT_AWAY_FLAG] !== true) return undefined;
  ctx.emit({ type: 'message', text: GOT_AWAY_LINE, kind: 'system' });
  return 'escape';
}
