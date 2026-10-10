/**
 * **Isaaru's three aeons** — Grothia, Pterya and Spathi, the three links of
 * Chapter XIV's contest of aeons in the Via Purifico (re-parity, AI lane C; **FFX only**).
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 4, the three scripts
 * (m284, m254, m287) run in the note's interpreter for every branch (an aeon out, Yuna
 * alone, the gauge at its edges). Each turn, in order:
 *
 * ```
 * first turn            Summon, aimed at Isaaru (D-17); no other change
 * Grothia (gauge 100 at the start) and Pterya (0):
 *   an aeon out, gauge >= 100   gauge = 0, then Hellfire on the front line / Energy Ray on ONE member
 *   an aeon out, otherwise      pick one living member, then GetRandomValue mod 3:
 *                               0 Fira / Sonic Wings, else Attack; gauge += 5 / 10     (D-16)
 *   no aeon out                 Attack on the living member (Grothia) / on Yuna (Pterya), whatever
 *                               the gauge says; gauge += 5 / 10, capped at 100         (D-15)
 * Spathi                the countdown: five turns that show 5 to 1 (+20 each), then Mega Flare on the
 *                       front line (Yuna if no aeon is out), then the count starts again
 * ```
 *
 * Their `onHit` adds 3 (Grothia) or 15 (Pterya) to the gauge, once per action per target after
 * its last hit, while they can counter and the hit is not itself a reaction; Spathi has no hit
 * reaction in this battle. The picks draw only with two or more standing. Gauges and the count
 * move at **decision time**, as Yojimbo's and Macalania Anima's do; an intent dry run calls
 * these on a cloned context, so asking never moves the live battle.
 *
 * The constants, the setup hook and the owner decisions kept are `./isaaru-rules.ts`.
 */

import type { Command } from '../../common/types.ts';
import { setGauge } from '../overdrive.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { gameMod, randomLiving } from './game-rolls.ts';
import { counterAllowed } from './hit-gates.ts';
import { type AiContext, flag, registerAiScript, use } from './types.ts';
import {
  ENEMY_GAUGE_AFTER_OVERDRIVE,
  ENEMY_GAUGE_FULL,
  GROTHIA_ATTACK,
  GROTHIA_ATTACK_YUNA,
  GROTHIA_FIRA,
  GROTHIA_GAUGE_PER_ATTACK,
  GROTHIA_GAUGE_PER_HIT_EVENT,
  GROTHIA_HELLFIRE,
  GROTHIA_SCRIPT,
  GROTHIA_SUMMON,
  ISAARU_BYSTANDER_SCRIPT,
  ISAARU_ID,
  PTERYA_ATTACK,
  PTERYA_ATTACK_YUNA,
  PTERYA_ENERGY_RAY,
  PTERYA_GAUGE_PER_ATTACK,
  PTERYA_GAUGE_PER_HIT_EVENT,
  PTERYA_SCRIPT,
  PTERYA_SONIC_WINGS,
  PTERYA_SUMMON,
  SPATHI_COUNTDOWN,
  SPATHI_COUNT_FLAG,
  SPATHI_COUNT_START,
  SPATHI_MEGA_FLARE,
  SPATHI_SCRIPT,
  SPATHI_SUMMON,
  aeonOut,
  spathiCount,
} from './isaaru-rules.ts';

export * from './isaaru-rules.ts';

const FIRST_DONE = 'isaaru.firstDone';

/** The shared shape of Grothia's and Pterya's turns [note 4.3, 4.4]. */
interface GaugeAeon {
  summon: string;
  /** The Attack against Yuna alone. */
  onYuna: string;
  /** Hellfire, or Energy Ray: with an aeon out the front line is that aeon alone, so "one member" and "the front line" are one actor. */
  overdrive: string;
  attack: string;
  /** Fira / Sonic Wings, rolled `mod 3` against the Attack. */
  special: string;
  perAttack: number;
  /** The Attack with no aeon out is aimed at Yuna herself, not at "the living member". */
  yunaByName: boolean;
}

const GROTHIA: GaugeAeon = {
  summon: GROTHIA_SUMMON,
  onYuna: GROTHIA_ATTACK_YUNA,
  overdrive: GROTHIA_HELLFIRE,
  attack: GROTHIA_ATTACK,
  special: GROTHIA_FIRA,
  perAttack: GROTHIA_GAUGE_PER_ATTACK,
  yunaByName: false,
};

const PTERYA: GaugeAeon = {
  summon: PTERYA_SUMMON,
  onYuna: PTERYA_ATTACK_YUNA,
  overdrive: PTERYA_ENERGY_RAY,
  attack: PTERYA_ATTACK,
  special: PTERYA_SONIC_WINGS,
  perAttack: PTERYA_GAUGE_PER_ATTACK,
  yunaByName: true,
};

/** Add to the gauge, capped at 100, the way the script writes the property. */
function gain(ai: AiContext, amount: number, cause: string): void {
  setGauge(ai.ctx, ai.self, (ai.self.overdrive?.gauge ?? 0) + amount, cause);
}

function gaugeAeonTurn(ai: AiContext, spec: GaugeAeon): Command {
  const { ctx, self, memory } = ai;
  if (!flag(memory, FIRST_DONE)) {
    memory[FIRST_DONE] = true;
    return use(ai, spec.summon, [ISAARU_ID]);
  }

  // No aeon out: the attack reserved for Yuna, whatever the gauge reads; it fills the gauge (D-15).
  if (!aeonOut(ctx)) {
    const victim = spec.yunaByName ? undefined : randomLiving(ctx);
    gain(ai, spec.perAttack, 'attacking');
    return use(ai, spec.onYuna, spec.yunaByName ? ['yuna'] : victim === undefined ? [] : [victim.id]);
  }

  // Full: the Overdrive on this turn; the gauge is spent and takes nothing more.
  if ((self.overdrive?.gauge ?? 0) >= ENEMY_GAUGE_FULL) {
    setGauge(ctx, self, ENEMY_GAUGE_AFTER_OVERDRIVE, 'overdrive');
    return use(ai, spec.overdrive, []);
  }

  // Attack or the special, on one living member: the pick, then `mod 3` (D-16).
  const victim = randomLiving(ctx);
  const special = gameMod(ctx, 3) === 0;
  gain(ai, spec.perAttack, 'attacking');
  return use(ai, special ? spec.special : spec.attack, victim === undefined ? [] : [victim.id]);
}

/** One Grothia turn [note 4.3]. */
export function grothiaAi(ai: AiContext): Command {
  return gaugeAeonTurn(ai, GROTHIA);
}

/** One Pterya turn [note 4.4]. */
export function pteryaAi(ai: AiContext): Command {
  return gaugeAeonTurn(ai, PTERYA);
}

/**
 * One Spathi turn [note 4.5]. After the Summon, the count runs whether or not an aeon is out, so with Yuna alone Mega Flare
 * lands on her at 0.
 */
export function spathiAi(ai: AiContext): Command {
  const { ctx, self, memory } = ai;
  if (!flag(memory, FIRST_DONE)) {
    memory[FIRST_DONE] = true;
    return use(ai, SPATHI_SUMMON, [ISAARU_ID]);
  }
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

/** Grothia's and Pterya's `onHit` (m284 f3 @0x6F8, m254 f3 @0x604): a flat gain while they can counter. */
function gaugeOnHit(amount: number): (event: HitEvent) => void {
  return ({ ctx, target }) => {
    if (!counterAllowed(ctx, target)) return;
    setGauge(ctx, target, (target.overdrive?.gauge ?? 0) + amount, 'targeted');
  };
}

/** Isaaru owns no CTB turn (B8); if he is ever asked, he passes. */
function isaaruAi(): Command | null {
  return null;
}

registerAiScript(GROTHIA_SCRIPT, grothiaAi);
registerAiScript(PTERYA_SCRIPT, pteryaAi);
registerAiScript(SPATHI_SCRIPT, spathiAi);
registerAiScript(ISAARU_BYSTANDER_SCRIPT, isaaruAi);
registerHitScript(GROTHIA_SCRIPT, gaugeOnHit(GROTHIA_GAUGE_PER_HIT_EVENT));
registerHitScript(PTERYA_SCRIPT, gaugeOnHit(PTERYA_GAUGE_PER_HIT_EVENT));
