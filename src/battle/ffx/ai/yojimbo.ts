/**
 * **Yojimbo's rotation** — Lady Ginnem's aeon in the Cavern of the Stolen
 * Fayth, driven by his own Overdrive gauge (re-parity, AI lane C; **FFX only**).
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 3, m288 run in the
 * note's interpreter over all 65,536 draws. His turn, in order (`gauge` is his Overdrive
 * bar, 0 to 100, which starts at 0):
 *
 * 1. **First turn**: Summon, aimed at Lady Ginnem. The gauge does not move.
 * 2. **Gauge 100 or more**: the gauge is zeroed, then Zanmato on the whole front line.
 * 3. **80 or more**: `GetRandomValue() mod 4`: 0 Wakizashi, 1 Kozuka (each at a random
 *    living front-line member), 2 and 3 Daigoro.
 * 4. **50 or more**: `mod 5`: 0 Wakizashi, 1 Kozuka, 2 to 4 Daigoro.
 * 5. **25 or more**: `mod 4`: 0 Kozuka, 1 to 3 Daigoro.
 * 6. **Otherwise**: Daigoro, no draw.
 *
 * After every row but the first, the gauge gains 2 (capped at 100), so Zanmato's own turn
 * ends with the gauge at 2 (D-12). His `onHit` adds 3 (capped) once per action that reaches
 * him, after its last hit record, a miss included, while he can counter and the hit is not
 * itself a reaction (D-13). Daigoro is an order to the dog; the dog bites with its own
 * Strength (`orders.ts`). The pick of a victim draws only with two or more standing.
 *
 * The gauge moves at **decision time**, before the action resolves, as Macalania Anima's
 * Oblivion does. An intent dry-run calls this on a cloned context, so asking never moves
 * the live gauge.
 */

import type { Command } from '../../common/types.ts';
import { setGauge } from '../overdrive.ts';
import { type HitEvent, registerHitScript } from '../hit-hooks.ts';
import { gameMod, randomLiving } from './game-rolls.ts';
import { counterAllowed } from './hit-gates.ts';
import { type AiContext, flag, registerAiScript, use } from './types.ts';
import {
  BAND_HEIGHTENED,
  BAND_KOZUKA,
  BAND_WAKIZASHI,
  BAND_ZANMATO,
  GINNEM_ID,
  YOJIMBO_BYSTANDER_SCRIPT,
  YOJIMBO_DAIGORO_ORDER,
  YOJIMBO_GAUGE_AFTER_ZANMATO,
  YOJIMBO_GAUGE_PER_HIT_EVENT,
  YOJIMBO_GAUGE_PER_TURN,
  YOJIMBO_KOZUKA,
  YOJIMBO_SCRIPT,
  YOJIMBO_SUMMON,
  YOJIMBO_WAKIZASHI,
  YOJIMBO_ZANMATO,
} from './yojimbo-rules.ts';

export * from './yojimbo-rules.ts';

const FIRST_DONE = 'yojimbo.firstDone';

/** `findMatchingChr` over the front line: one living, targetable actor, a draw only with two or more. */
function victim(ai: AiContext, id: string): Command {
  const target = randomLiving(ai.ctx);
  return use(ai, id, target === undefined ? [] : [target.id]);
}

/** The move the gauge band rolls (rows 3 to 6); `undefined` below 25 means Daigoro without a draw. */
function rolledMove(ai: AiContext, gauge: number): Command {
  const { ctx } = ai;
  if (gauge >= BAND_HEIGHTENED) {
    const d = gameMod(ctx, 4);
    return d === 0 ? victim(ai, YOJIMBO_WAKIZASHI) : d === 1 ? victim(ai, YOJIMBO_KOZUKA) : use(ai, YOJIMBO_DAIGORO_ORDER, []);
  }
  if (gauge >= BAND_WAKIZASHI) {
    const d = gameMod(ctx, 5);
    return d === 0 ? victim(ai, YOJIMBO_WAKIZASHI) : d === 1 ? victim(ai, YOJIMBO_KOZUKA) : use(ai, YOJIMBO_DAIGORO_ORDER, []);
  }
  if (gauge >= BAND_KOZUKA) return gameMod(ctx, 4) === 0 ? victim(ai, YOJIMBO_KOZUKA) : use(ai, YOJIMBO_DAIGORO_ORDER, []);
  return use(ai, YOJIMBO_DAIGORO_ORDER, []);
}

/** One Yojimbo turn [note 3.2]. */
export function yojimboAi(ai: AiContext): Command {
  const { ctx, self, memory } = ai;

  if (!flag(memory, FIRST_DONE)) {
    memory[FIRST_DONE] = true;
    return use(ai, YOJIMBO_SUMMON, [GINNEM_ID]);
  }

  const gauge = self.overdrive?.gauge ?? 0;
  let command: Command;
  if (gauge >= BAND_ZANMATO) {
    setGauge(ctx, self, YOJIMBO_GAUGE_AFTER_ZANMATO, 'zanmato');
    command = use(ai, YOJIMBO_ZANMATO, []);
  } else {
    command = rolledMove(ai, gauge);
  }
  setGauge(ctx, self, (self.overdrive?.gauge ?? 0) + YOJIMBO_GAUGE_PER_TURN, 'attacking');
  return command;
}

/** His `onHit` (m288 f3 @0x530): +3, capped at 100, while `isCounterattackAllowed()`. */
function yojimboHit(event: HitEvent): void {
  const { ctx, target: boss } = event;
  if (!counterAllowed(ctx, boss)) return;
  setGauge(ctx, boss, (boss.overdrive?.gauge ?? 0) + YOJIMBO_GAUGE_PER_HIT_EVENT, 'targeted');
}

/** Ginnem and Daigoro own no CTB turn; if one is ever asked, it passes. */
function bystanderAi(): Command | null {
  return null;
}

registerAiScript(YOJIMBO_SCRIPT, yojimboAi);
registerAiScript(YOJIMBO_BYSTANDER_SCRIPT, bystanderAi);
registerHitScript(YOJIMBO_SCRIPT, yojimboHit);
