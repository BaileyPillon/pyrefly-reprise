/**
 * Almighty Shinra, act 1 of the hidden chapter "The Fiend Arena Superbosses" (monster row 329, script `m329`). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The order below is the game's own, poll by poll** (`research/re-ffx2-fiend-arena-superbosses.md` section 3.1, decoded from the shipped source and checked against the compiled worker by the research lane: the sets of
 * queued command ids are equal), in our own words. A poll is one call of the action entry; every poll answers with one command. The script has no reaction, no menu, no targeted entry, no death entry (his death is a fade-out,
 * a data fact) and no time-out block, and **it draws no random number: the loop is fully deterministic except the targets**.
 *
 * ```
 * Shinra (counter "count" = 0 at the start). Each poll, a switch on the counter:
 *   0:  Clione on the party (ten random hits)
 *   1:  Attack on one girl
 *   2:  HP below max / 4:  Final Impact on the party;   else Ultima on the party
 *   3:  Attack on one girl
 *   4:  HP below max / 2:  Fireworks on the party;      else Full Break on one girl
 *   5:  (the default) he is NOT hasted:  Haste on himself;   hasted:  Final Impact on the party
 * ```
 *
 * The counter goes up by one after every case and back to 0 after the sixth: **a loop of six polls**. Two lines of the source are commented out (a Curaga on his own side under a quarter at the second poll, a White Wind
 * on his side under a half at the fourth); the compiled worker does not queue them, so neither is here.
 *
 * **Targets**: "a living girl" is `searchr(all players, alive)`. The game's search is near-weighted by distance and facing; the engine has no positions for this chapter (the arena has no formation row, RE section 1: the
 * stage is a stand-in), so the pick is {@link searchUniform}, the uniform search with no draw below two candidates (the paper preflight's item E6: "uniform picks"). Pick S2-1, the driver's, his to overturn; the alternative is
 * the near-weighted search over a stand-in scene, as the Farplane Cup's `CUP_SCENE` does. One function ({@link onOne}) holds the choice.
 *
 * **RNG** [RE section 3]: no `random() mod n` here; the searches are stream 4, a draw only with two or more candidates.
 */

import type { Command } from '../../common/types.ts';
import { FS_ABILITY as A, SHINRA_SCRIPT_ID } from '../../../data/fiend-superbosses-ids.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { girls, maxHpDiv, searchUniform } from './script-rolls.ts';

/** AI memory key of the poll counter. */
export const SHINRA_COUNT = 'fsShinraCount';
/** The loop's length: the counter goes 0 to 5 and starts over. */
export const SHINRA_POLLS = 6;
/** [RE section 3.1] The Ultima becomes the Final Impact below a quarter of his maximum HP, the Full Break becomes Fireworks below a half. */
export const SHINRA_QUARTER_DIV = 4;
export const SHINRA_HALF_DIV = 2;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** A command at a living girl (`searchr(all players, alive)`): the choice of search lives here (see the header, pick S2-1). */
function onOne(ctx: AiContext, party: readonly Ffx2Unit[], id: string): Command {
  const pick = searchUniform(ctx.rng, party);
  return use(id, pick ? [pick.id] : []);
}

/** Almighty Shinra, one poll. */
export const x2AlmightyShinraScript: AiScript = {
  id: SHINRA_SCRIPT_ID,
  decide(ctx) {
    const self = ctx.self;
    const party = girls(ctx);
    if (party.length === 0) return null;
    const count = mem(self, SHINRA_COUNT);
    setMem(self, SHINRA_COUNT, count >= SHINRA_POLLS - 1 ? 0 : count + 1);
    switch (count) {
      case 0:
        return use(A.clione, []);
      case 1:
      case 3:
        return onOne(ctx, party, A.attack);
      case 2:
        return self.hp < maxHpDiv(self, SHINRA_QUARTER_DIV) ? use(A.finalImpact, []) : use(A.ultimaShinra, []);
      case 4:
        return self.hp < maxHpDiv(self, SHINRA_HALF_DIV) ? use(A.fireworks, []) : onOne(ctx, party, A.fullBreak);
      default:
        return self.statuses['haste'] === undefined ? use(A.haste, [self.id]) : use(A.finalImpact, []);
    }
  },
};

/** The one script of act 1, for the registry (`./index.ts`). */
export const shinraAlmightyScripts: readonly AiScript[] = [x2AlmightyShinraScript];
