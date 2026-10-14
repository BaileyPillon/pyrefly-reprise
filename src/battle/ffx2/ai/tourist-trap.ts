/**
 * Yojimbo's action-counter script in the optional FFX-2 mission "Tourist Trap" (the Cavern of the Stolen Fayth; our hidden chapter), and Daigoro's, who is an actor of his own. **FFX-2 only**
 * [AGENTS.md rule 14]: this is NOT FFX's Overdrive-gauge script (`battle/ffx/ai/yojimbo-rules.ts`), and its Zanmato is not FFX's 9,999.
 *
 * Source: **the RE review of 2026-10-14 of the game's own scripts `m170` (Yojimbo) and `m174` (Daigoro)** and the rows 170 and 174 (`research/re-ffx2-yojimbo-valefor.md`; the poll block is
 * `research/re-ffx2-ai-tourist-trap.md`, on `origin/re-ffx2-yojimbo-valefor`), read in our own words; it replaced the first draft, which was built from the wiki's and SinirothX's table
 * (`research/ffx-yojimbo.md` §8.2, `research/ffx2-fallen-aeons.md` §7.2) and had the dog as a Yojimbo move, the band chosen before the raise, and the moves in the table's printed order. No decompiled
 * code is in the repo.
 *
 * ```
 * Yojimbo, each poll (the game polls a ready monster every step; a poll is NOT a turn):
 *   counter >= 100     queue Zanmato on all girls; counter = 0                                  (the 14th poll: 13 raises of 8 reach 104)
 *   else               counter += 8 FIRST, then the band is read on the RAISED value:
 *     raised >= 70     random() mod 4:  0 Wakizashi B (the whole party), 1 Wakizashi A, 2 Kozuka, 3 the dog
 *     30 to 69         random() mod 4:  0 Kozuka, 1 Wakizashi A, 2 and 3 the dog
 *     below 30         random() mod 3:  0 Kozuka, 1 and 2 the dog
 *   the dog            NOT a move of his: he raises a battle flag, queues nothing, and is polled again on the very next step with the
 *                      counter already raised (no turn, no recovery spent)
 * Daigoro (his own actor, row 174: Lv 30, AGI 120, own gauge), each turn of his own:
 *   flag up            clear it; bite one girl (row 0x40a5: physical, power 16, rest 100)
 *   else               nothing (he waits)
 * ```
 *
 * The roll is `random() mod N` on the scripts' stream 2 ({@link scriptModCtx}); a single-target move is aimed by a uniform pick on stream 4 ({@link pickGirl}), drawn after the roll; Zanmato and
 * Wakizashi B take no target. **The dog's bite is aimed by a uniform pick too, where the game's script uses the near-weighted search**: it needs the formation's start positions, and `SCENES`
 * (`./script-rolls.ts`) holds only the Bahamut, Leg, Tail and Shuyin scenes (formation 1847 is not there). The Meteor enrage block of `m170` never runs in play: no timer is added.
 *
 * **What a cycle looks like.** Zanmato is the 14th poll of every cycle; how many real actions come before it varies, because every dog pick is a poll without a turn: the expected count is 3 x 1/3 +
 * 5 x 1/2 + 5 x 3/4 = 7.25, and 4 to 10 in about 96 percent of cycles (`tests/unit/chapters/tourist-trap-engine.test.ts` computes the distribution). Deterministic under the seeded RNG; the counter
 * lives in the unit's AI memory (`ai/fallen-aeons.ts`'s `AC`), so the intent board's clone-and-sample dry run sees it, and follows the chain of polls to the move that is really coming
 * (`AI_REPOLL`, `../intent.ts`). Nothing raises the counter but his own polls: no result-driven gain.
 *
 * **Daigoro** waits with `idleFor(self, IDLE_UNTIL_WOKEN, WAKE_ON_FLAG)`: one poll, then asleep until Yojimbo's dog pick wakes him (`wakeIdle`, `../atb-engine.ts`), so he is never polled every step
 * (a decision per logic step for the whole fight would trip the presenter's livelock limit, `engine/BattlePresenterUtil.ts`). A flag raised while he is biting or recovering waits for his next poll, as the
 * game's flag does; several calls before his turn are one bite.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { setMem } from '../internal.ts';
import { wakeIdle } from '../atb-engine.ts';
import { AC, AC_OVERDRIVE, acOf, bumpAc } from './fallen-aeons.ts';
import { AI_NO_INTENT, AI_REPOLL, IDLE_UNTIL_WOKEN, WAKE_ON_FLAG, idleFor } from './idle.ts';
import { pickGirl, scriptModCtx } from './script-rolls.ts';
import { DAIGORO_ACTIONS, TOURIST_TRAP_UNITS, YOJIMBO_ACTIONS, YOJIMBO_SCRIPTS } from '../../../data/ffx2/enemies/tourist-trap-abilities.ts';

/** The counter rises by this much on every poll (RE review, m170). */
export const YOJIMBO_COUNTER_STEP = 8;

/** The battle flag Yojimbo's dog pick raises and Daigoro's turn clears. */
export const DAIGORO_CALL_FLAG = 'daigoroCalled';

type Pick = 'wakizashiB' | 'wakizashiA' | 'kozuka' | 'dog';

/**
 * The bands, read on the RAISED counter, and the pick each value of `random() mod picks.length` makes (RE review, m170): the repeats are the fractions
 * (`kozuka, dog, dog` is 1/3 and 2/3). Listed from the highest band down; {@link bandFor} takes the first whose `from` the counter reaches.
 */
export const YOJIMBO_BANDS: readonly { readonly from: number; readonly picks: readonly Pick[] }[] = [
  { from: 70, picks: ['wakizashiB', 'wakizashiA', 'kozuka', 'dog'] },
  { from: 30, picks: ['kozuka', 'wakizashiA', 'dog', 'dog'] },
  { from: 0, picks: ['kozuka', 'dog', 'dog'] },
];

/** The band a raised counter value falls in (the Zanmato line, 100 and above, is tested before the raise and is not a band). */
export function bandFor(raised: number): (typeof YOJIMBO_BANDS)[number] {
  return YOJIMBO_BANDS.find((band) => raised >= band.from) ?? YOJIMBO_BANDS[YOJIMBO_BANDS.length - 1]!;
}

/** Raise the flag and wake the dog (if he is asleep): he is polled on the next step. */
function callDaigoro(ctx: AiContext): void {
  ctx.flags[DAIGORO_CALL_FLAG] = true;
  const dog = ctx.units.find((u) => u.id === TOURIST_TRAP_UNITS.daigoro && u.alive && !u.removed);
  if (dog) wakeIdle(dog, ctx.units, WAKE_ON_FLAG);
}

/** Yojimbo: one poll. Zanmato once the counter has filled (and the counter back to 0), else raise it and pick by the band; a dog pick is a poll without a turn. */
export const x2YojimboScript: AiScript = {
  id: YOJIMBO_SCRIPTS.yojimbo,
  decide(ctx) {
    const self = ctx.self;
    setMem(self, AI_REPOLL, 0);
    if (ctx.party().length === 0) return null;
    if (acOf(self) >= AC_OVERDRIVE) {
      setMem(self, AC, 0); // "queues Zanmato on all girls and resets the counter to 0"
      return { kind: 'ability', id: YOJIMBO_ACTIONS.zanmato, targets: [] };
    }
    bumpAc(self, YOJIMBO_COUNTER_STEP); // FIRST: the band is read on the raised value
    const band = bandFor(acOf(self));
    const pick = band.picks[scriptModCtx(ctx, band.picks.length)]!;
    if (pick === 'dog') {
      callDaigoro(ctx);
      setMem(self, AI_REPOLL, 1);
      return idleFor(self, 1); // polled again on the very next step: no turn, no recovery
    }
    if (pick === 'wakizashiB') return { kind: 'ability', id: YOJIMBO_ACTIONS.wakizashiB, targets: [] }; // the whole party: no target search
    const id = pick === 'kozuka' ? YOJIMBO_ACTIONS.kozuka : YOJIMBO_ACTIONS.wakizashiA;
    return { kind: 'ability', id, targets: pickGirl(ctx) } satisfies Command;
  },
};

/** Daigoro: bite one girl if Yojimbo has called him (and clear the call), else wait until he is. */
export const x2DaigoroScript: AiScript = {
  id: YOJIMBO_SCRIPTS.daigoro,
  decide(ctx) {
    setMem(ctx.self, AI_NO_INTENT, 0);
    if (ctx.flags[DAIGORO_CALL_FLAG] === true) {
      const girl = pickGirl(ctx);
      if (girl.length > 0) {
        ctx.flags[DAIGORO_CALL_FLAG] = false;
        return { kind: 'ability', id: DAIGORO_ACTIONS.bite, targets: girl };
      }
    }
    setMem(ctx.self, AI_NO_INTENT, 1); // asleep: the intent board looks past him to whoever really acts next
    return idleFor(ctx.self, IDLE_UNTIL_WOKEN, WAKE_ON_FLAG);
  },
};

/** Both scripts, for the registry (`./index.ts`). */
export const touristTrapScripts: readonly AiScript[] = [x2YojimboScript, x2DaigoroScript];

/** The unit kind the scripts above are for (kept so a test can name it without importing the enemy module). */
export type TouristTrapUnit = Ffx2Unit;
