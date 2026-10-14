/**
 * Yojimbo's action-counter script in the optional FFX-2 mission "Tourist Trap" (the Cavern of the Stolen Fayth; our hidden chapter), and Daigoro's endless wait. **FFX-2 only**
 * [AGENTS.md rule 14]: this is NOT FFX's Overdrive-gauge script (`battle/ffx/ai/yojimbo-rules.ts`), and its Zanmato is not FFX's 9,999.
 *
 * Source: `research/ffx-yojimbo.md` §8.2 (the wiki; FFExodus) with SinirothX confirming the counter and every weight (`research/ffx2-fallen-aeons.md` §7.2: the old open item Y-8 is
 * `[verified: 2 sources]`). No decompiled script is in the repo and none was read for this chapter; the RE session's rows (`research/re-ffx2-yojimbo-valefor.md`) replace the numbers when they land.
 *
 * ```
 * the action counter AC, +8 on each of his turns (it is tested BEFORE it is raised, so turn n reads 8 x (n - 1)):
 *   AC >= 100     Zanmato on the whole party, AC = 0                      (his 14th turn: ceil(100 / 8) = 13 turns to reach 104)
 *   AC  0 to 29   Daigoro 2/3, Kozuka 1/3                                  (turns 1 to 4)
 *   AC 30 to 69   Daigoro 1/2, Kozuka 1/4, Wakizashi A 1/4                 (turns 5 to 9)
 *   AC 70 to 99   Daigoro 1/4, Kozuka 1/4, Wakizashi A 1/4, Wakizashi B 1/4 (turns 10 to 13)
 * ```
 *
 * **Readings chosen where the sources are silent** (tagged `[estimate]`, listed in `docs/plans/ch-tourist-trap-review.md` §1): the counter is tested before it is raised (the research's own
 * derivation of the 14th turn); inside a band the roll `random() mod N` (the scripts' stream, {@link scriptModCtx}) maps to the moves in the order the table prints them, and only the
 * fractions are sourced; a single-target move is aimed at a uniform living girl, drawn after the roll ({@link pickGirl}), as every FFX-2 script here aims. Nothing raises the counter but his own
 * turn: no result-driven gain (that is Shiva's and Anima's rule, not his). Deterministic under the seeded RNG; the counter lives in the unit's AI memory (`ai/fallen-aeons.ts`'s `AC`), so the
 * intent board's clone-and-sample dry run sees it, and Zanmato is a certain, visible next move once the counter is full.
 *
 * **Daigoro** is a separate body that cannot be targeted. His script asks to be polled again in about nine hours of battle time (`idleFor(IDLE_UNTIL_WOKEN)`, nothing wakes it), so he takes no
 * turn, makes no event and holds no gauge; his one attack is Yojimbo's move "Daigoro".
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { setMem } from '../internal.ts';
import { AC, AC_OVERDRIVE, acOf, bumpAc } from './fallen-aeons.ts';
import { IDLE_UNTIL_WOKEN, idleFor } from './idle.ts';
import { pickGirl, scriptModCtx } from './script-rolls.ts';
import { YOJIMBO_ACTIONS, YOJIMBO_SCRIPTS } from '../../../data/ffx2/enemies/tourist-trap-abilities.ts';

/** The counter rises by this much on each of his turns `[verified: 2 sources]`. */
export const YOJIMBO_COUNTER_STEP = 8;

type Move = 'daigoro' | 'kozuka' | 'wakizashiA' | 'wakizashiB';

/**
 * The bands, by the counter's value when the turn begins, and the move each value of the roll picks (`moves[random() mod moves.length]`): the repeats are the fractions
 * (`daigoro, daigoro, kozuka` is 2/3 and 1/3). The fractions are sourced; the order inside a band is `[estimate]`.
 */
export const YOJIMBO_BANDS: readonly { readonly upTo: number; readonly moves: readonly Move[] }[] = [
  { upTo: 29, moves: ['daigoro', 'daigoro', 'kozuka'] },
  { upTo: 69, moves: ['daigoro', 'daigoro', 'kozuka', 'wakizashiA'] },
  { upTo: AC_OVERDRIVE - 1, moves: ['daigoro', 'kozuka', 'wakizashiA', 'wakizashiB'] },
];

/** The band a counter value falls in (the Zanmato line, 100 and above, is not a band). */
export function bandFor(counter: number): (typeof YOJIMBO_BANDS)[number] {
  return YOJIMBO_BANDS.find((band) => counter <= band.upTo) ?? YOJIMBO_BANDS[YOJIMBO_BANDS.length - 1]!;
}

function command(move: Move, ctx: AiContext): Command {
  return { kind: 'ability', id: YOJIMBO_ACTIONS[move], targets: pickGirl(ctx) };
}

/** Yojimbo: Zanmato once the counter is full, else a band's roll; the counter rises by 8 on every other turn. */
export const x2YojimboScript: AiScript = {
  id: YOJIMBO_SCRIPTS.yojimbo,
  decide(ctx) {
    const self = ctx.self;
    if (ctx.party().length === 0) return null;
    const counter = acOf(self);
    if (counter >= AC_OVERDRIVE) {
      setMem(self, AC, 0); // "then the counter resets to 0"
      return { kind: 'ability', id: YOJIMBO_ACTIONS.zanmato, targets: [] };
    }
    bumpAc(self, YOJIMBO_COUNTER_STEP);
    const band = bandFor(counter);
    return command(band.moves[scriptModCtx(ctx, band.moves.length)]!, ctx);
  },
};

/** Daigoro: one poll, then nothing, for good. */
export const x2DaigoroBystanderScript: AiScript = {
  id: YOJIMBO_SCRIPTS.daigoro,
  decide: (ctx) => idleFor(ctx.self, IDLE_UNTIL_WOKEN),
};

/** Both scripts, for the registry (`./index.ts`). */
export const touristTrapScripts: readonly AiScript[] = [x2YojimboScript, x2DaigoroBystanderScript];
