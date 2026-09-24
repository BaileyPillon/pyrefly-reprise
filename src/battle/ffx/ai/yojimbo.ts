/**
 * **Yojimbo's rotation** — Lady Ginnem's aeon in the Cavern of the Stolen
 * Fayth, driven by his own Overdrive gauge.
 *
 * Source: `research/ffx-yojimbo.md` §4.2, the reference pseudocode this file
 * follows step for step:
 *
 * ```
 * onYojimboTurn():
 *   if gauge >= 100: use Zanmato (party, fixed 9,999); gauge = 0
 *   else:
 *     pool = [Daigoro]; +Kozuka at 25; +Wakizashi at 50
 *     act(pick(pool)); gauge += 2
 * ```
 *
 * Everything it reads (the bands, the constants, the assumptions, the setup
 * hook) is in `./yojimbo-rules.ts` and re-exported here. The "+3 % when
 * targeted" half of the gauge is paid by the engine, not by this script
 * (`overdrive.ts#onTargeted`, armed by the setup hook).
 *
 * **Daigoro** is an order, not an attack of Yojimbo's own: the row
 * `yojimbo-daigoro` deals nothing and names the dog in `extra.ordersActor`,
 * and `orders.ts` makes the dog act with **its own** Strength 25 on this same
 * turn [§2.5, §3.1 decompiled].
 *
 * The gauge moves at **decision time**, before the action resolves, exactly as
 * Macalania Anima's Oblivion does (`seymour-anima-macalania.ts`). An intent
 * dry-run calls this on a cloned context, so asking never moves the live gauge.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { addGauge, setGauge } from '../overdrive.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  BAND_ZANMATO,
  YOJIMBO_BYSTANDER_SCRIPT,
  YOJIMBO_GAUGE_AFTER_ZANMATO,
  YOJIMBO_GAUGE_PER_ATTACK,
  YOJIMBO_SCRIPT,
  YOJIMBO_ZANMATO,
  yojimboPool,
} from './yojimbo-rules.ts';

export * from './yojimbo-rules.ts';

/** One Yojimbo turn [§4.2]. */
export function yojimboAi(ai: AiContext): Command {
  const { ctx, self } = ai;
  const gauge = self.overdrive?.gauge ?? 0;

  // §4.1 [verified: 3 sources] — full gauge: Zanmato on this turn, 9,999 to
  // the whole party (or to the aeon standing in front of it). The reset value
  // is our estimate (B2).
  if (gauge >= BAND_ZANMATO) {
    setGauge(ctx, self, YOJIMBO_GAUGE_AFTER_ZANMATO, 'zanmato');
    return use(ai, YOJIMBO_ZANMATO, []);
  }

  // §4.1 — the band decides who is in the pool [verified: 3 sources]; each
  // open action is equally likely [B2, our estimate].
  const choice = ctx.rng.pick(yojimboPool(gauge));
  // "+2 % when attacking" [single source]; paid on the Daigoro order too
  // (research §4.2 pseudocode; not sourced either way, Y-1).
  addGauge(ctx, self, YOJIMBO_GAUGE_PER_ATTACK, 'attacking');
  return use(ai, choice, []);
}

/** Ginnem and Daigoro own no CTB turn; if one is ever asked, it passes. */
function bystanderAi(): Command | null {
  return null;
}

registerAiScript(YOJIMBO_SCRIPT, yojimboAi);
registerAiScript(YOJIMBO_BYSTANDER_SCRIPT, bystanderAi);
