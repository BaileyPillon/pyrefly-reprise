/**
 * **Isaaru's three aeons** — Grothia, Pterya and Spathi, the three links of
 * Chapter XIV's contest of aeons in the Via Purifico.
 *
 * Source: `research/ffx-isaaru-bevelle.md` §4.5, the reference pseudocode this
 * file follows step for step:
 *
 * ```
 * link 1  Grothia: gauge = 100
 *   turn: if no aeon out: Attack(4:127) -> Yuna; return          // no gauge gain
 *         if gauge >= 100: Hellfire -> field; gauge = 0; return
 *         choose Attack(4:0) or Fira(3:69) -> aeon                // split [estimate]
 *         gauge += 5
 *   when targeted by the player: gauge += 3
 * link 2  Pterya: the same shape, gauge 0 at the start [estimate], +10 / +15,
 *         Energy Ray, Attack or Sonic Wings, Attack(4:92) on Yuna
 * link 3  Spathi: count = 5
 *   turn: if count == 0: Mega Flare -> field; count = 5; return
 *         show count; count -= 1
 * ```
 *
 * The constants, the setup hook and the assumptions are `./isaaru-rules.ts`.
 * "+N when targeted" is paid by the engine (`overdrive.ts#onTargeted`), not
 * here. Gauges and the count move at **decision time**, as Yojimbo's and
 * Macalania Anima's do; an intent dry run calls these on a cloned context, so
 * asking never moves the live battle.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { addGauge, setGauge } from '../overdrive.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  ENEMY_GAUGE_AFTER_OVERDRIVE,
  ENEMY_GAUGE_FULL,
  GROTHIA_ATTACK,
  GROTHIA_ATTACK_YUNA,
  GROTHIA_FIRA,
  GROTHIA_GAUGE_PER_ATTACK,
  GROTHIA_HELLFIRE,
  GROTHIA_SCRIPT,
  ISAARU_BYSTANDER_SCRIPT,
  PTERYA_ATTACK,
  PTERYA_ATTACK_YUNA,
  PTERYA_ENERGY_RAY,
  PTERYA_GAUGE_PER_ATTACK,
  PTERYA_SCRIPT,
  PTERYA_SONIC_WINGS,
  SPATHI_COUNTDOWN,
  SPATHI_COUNT_FLAG,
  SPATHI_COUNT_START,
  SPATHI_MEGA_FLARE,
  SPATHI_SCRIPT,
  aeonOut,
  spathiCount,
} from './isaaru-rules.ts';

export * from './isaaru-rules.ts';

/** The shared shape of Grothia's and Pterya's turns [§4.1, §4.2, §4.5]. */
interface GaugeAeon {
  onYuna: string;
  overdrive: string;
  pool: readonly [string, string];
  perAttack: number;
}

const GROTHIA: GaugeAeon = {
  onYuna: GROTHIA_ATTACK_YUNA,
  overdrive: GROTHIA_HELLFIRE,
  pool: [GROTHIA_ATTACK, GROTHIA_FIRA],
  perAttack: GROTHIA_GAUGE_PER_ATTACK,
};

const PTERYA: GaugeAeon = {
  onYuna: PTERYA_ATTACK_YUNA,
  overdrive: PTERYA_ENERGY_RAY,
  pool: [PTERYA_ATTACK, PTERYA_SONIC_WINGS],
  perAttack: PTERYA_GAUGE_PER_ATTACK,
};

function gaugeAeonTurn(ai: AiContext, spec: GaugeAeon): Command {
  const { ctx, self } = ai;
  // No aeon out: the attack reserved for Yuna, which fills no gauge
  // [verified: 2 sources]. It comes first in §4.5's pseudocode, so a full
  // gauge waits for an aeon (our reading, ISAARU_ASSUMPTIONS '§4.5').
  if (!aeonOut(ctx)) return use(ai, spec.onYuna, []);
  // Full: the Overdrive on this turn [verified: 2 sources]; the gauge is spent.
  if ((self.overdrive?.gauge ?? 0) >= ENEMY_GAUGE_FULL) {
    setGauge(ctx, self, ENEMY_GAUGE_AFTER_OVERDRIVE, 'overdrive');
    return use(ai, spec.overdrive, []);
  }
  // The split is unsourced: even, our estimate (O-5, B9).
  const move = ctx.rng.pick(spec.pool);
  // "+N % when attacking" [single source: wiki].
  addGauge(ctx, self, spec.perAttack, 'attacking');
  return use(ai, move, []);
}

/** One Grothia turn [§4.1]. */
export function grothiaAi(ai: AiContext): Command {
  return gaugeAeonTurn(ai, GROTHIA);
}

/** One Pterya turn [§4.2]. */
export function pteryaAi(ai: AiContext): Command {
  return gaugeAeonTurn(ai, PTERYA);
}

/**
 * One Spathi turn [§4.3, verified: 3 sources for the countdown]. The count
 * runs whether or not an aeon is out, so with Yuna alone Mega Flare lands on
 * her at 0 (O-6, our estimate).
 */
export function spathiAi(ai: AiContext): Command {
  const { ctx, self } = ai;
  const count = spathiCount(ctx.state);
  if (count <= 0) {
    ctx.state.flags[SPATHI_COUNT_FLAG] = SPATHI_COUNT_START;
    return use(ai, SPATHI_MEGA_FLARE, []);
  }
  // The number the player reads (B20): 5, 4, 3, 2, 1, then Mega Flare.
  ctx.emit({ type: 'message', text: `${self.name}: ${count}`, kind: 'telegraph' });
  ctx.state.flags[SPATHI_COUNT_FLAG] = count - 1;
  return use(ai, SPATHI_COUNTDOWN, [self.id]);
}

/** Isaaru owns no CTB turn (B8); if he is ever asked, he passes. */
function isaaruAi(): Command | null {
  return null;
}

registerAiScript(GROTHIA_SCRIPT, grothiaAi);
registerAiScript(PTERYA_SCRIPT, pteryaAi);
registerAiScript(SPATHI_SCRIPT, spathiAi);
registerAiScript(ISAARU_BYSTANDER_SCRIPT, isaaruAi);
