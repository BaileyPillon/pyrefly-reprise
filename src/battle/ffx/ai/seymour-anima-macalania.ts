/**
 * The three Macalania rotations — Seymour, the two Guado Guardians, Anima —
 * and the Guardians' Auto-Potion counter.
 *
 * Everything these read (the ids, the sourced constants, the four AUTHORED
 * assumptions, the battle flags, the scripted opening and the two act
 * transitions) lives in `./macalania-rules.ts` and is re-exported from here, so
 * one import reaches the whole encounter. The split is the 400-line house limit
 * [AGENTS.md hard rule 7].
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — an FFX encounter registered in
 * the FFX AI registry.
 */

import type { Command } from '../../common/types.ts';
import { has, isAlive, rtOf, tryActor } from '../state.ts';
import { addGauge, setGauge } from '../overdrive.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  ACT_THREE_KEEPS_ELEMENT_ORDER,
  ANIMA_MACALANIA_SCRIPT,
  ANIMA_GAUGE_PER_TURN,
  AUTO_POTION_ON_ANY_DAMAGE,
  ELEMENT_CYCLE,
  GA_SPELL,
  GUADO_GUARDIAN_SCRIPT,
  GUARDIAN_HI_POTION_THRESHOLD,
  MAC_BOOST_NEXT,
  MULTI_SPELL,
  RA_SPELL,
  SEYMOUR_ID,
  SEYMOUR_MACALANIA_SCRIPT,
  macalaniaAct,
  nextElement,
  runMacalaniaPhaseHooks,
} from './macalania-rules.ts';

export * from './macalania-rules.ts';

// ---------------------------------------------------------------------------
// Seymour
// ---------------------------------------------------------------------------

export const seymourMacalaniaAi = (ai: AiContext): Command | null => {
  runMacalaniaPhaseHooks(ai.ctx);
  const act = macalaniaAct(ai.ctx);

  // §5.3 / §4.1 — while Anima is out his only scheduled action is a zero-hit
  // no-op aimed at her slot.
  if (act === 2) return use(ai, 'mac-seymour-idle', [ai.self.id]);

  const element = nextElement(ai.ctx);

  // §5.2 [single source: wiki] — against a summoned aeon he uses the -ga tier
  // instead, **even when the aeon absorbs that element**. A summoned Shiva is
  // therefore *healed* by his Blizzaga turn (Ice Eater) and hurt by the other
  // three. This is a target-class branch on the spell, not a second rotation.
  if (ai.ctx.state.aeonId !== null) return use(ai, GA_SPELL[element], []);

  // §5.4 — act three is the Multi- pair, base 36, twice in one turn. The order
  // persisting into act three is C-14, an AUTHORED assumption.
  if (act === 3) {
    const id = ACT_THREE_KEEPS_ELEMENT_ORDER ? MULTI_SPELL[element] : MULTI_SPELL[ELEMENT_CYCLE[0]];
    return use(ai, id, []);
  }

  return use(ai, RA_SPELL[element], []);
};

// ---------------------------------------------------------------------------
// Guado Guardian
// ---------------------------------------------------------------------------

/**
 * §2.3 / §5.2. **The branch SET is `[verified: 2 sources]`; the branch ORDER is
 * NOT sourced** (C-12) — no source states a priority, so this follows the
 * wiki's own sentence order and says so. The two orders differ only when
 * Seymour is simultaneously poisoned and under 4,800 HP.
 *
 * `hasPotions` is `stealCount === 0`: a single **successful** Steal sets it
 * false and consumes that Guardian's one allowed steal, both of which
 * `steal.ts#resolveSteal` already does (base chance 100 halves to 50 after one
 * success).
 *
 * **Steal disables Auto-Potion and Hi-Potion-on-Seymour and nothing else —
 * both Remedy branches survive** [§2.3, §14 row 1]. Gating them would silently
 * double the poison route's value and make the fight easier than canon.
 */
export const guadoGuardianAi = (ai: AiContext): Command | null => {
  runMacalaniaPhaseHooks(ai.ctx);
  const self = ai.self;
  const seymour = tryActor(ai.ctx, SEYMOUR_ID);
  const hasPotions = rtOf(ai.ctx, self.id).stealCount === 0;

  if (seymour && isAlive(seymour) && seymour.hp < GUARDIAN_HI_POTION_THRESHOLD && hasPotions) {
    return use(ai, 'guardian-hi-potion', [seymour.id]);
  }
  if (seymour && isAlive(seymour) && has(seymour, 'poison')) {
    return use(ai, 'guardian-remedy', [seymour.id]);
  }
  if (has(self, 'silence') || has(self, 'poison')) {
    return use(ai, 'guardian-remedy-self', [self.id]);
  }

  // §2.3 — otherwise 50 % to do nothing, and an even split of Thunder,
  // Blizzard and Shremedy across the remaining half.
  if (ai.ctx.rng.int(0, 99) < 50) return null;
  const roll = ai.ctx.rng.int(0, 2);
  const id = roll === 0 ? 'guardian-thunder' : roll === 1 ? 'guardian-blizzard' : 'guardian-shremedy';
  return use(ai, id, []);
};

/**
 * The Auto-Potion counter [§2.3, §4.2] — a **counter, not a turn**: it costs no
 * CTB and restores a flat 1,000 HP.
 *
 * Collected from `ai/reactions.ts#collectBossCounters`, which already refuses
 * to fire on an enemy-side attacker and on a Threatened enemy, and already
 * passes only the enemies the action actually damaged. Scope is C-11 — see
 * {@link AUTO_POTION_ON_ANY_DAMAGE}.
 *
 * Nothing here reuses `ticks.ts`'s Auto-Potion, which is the **character
 * equipment** path (HP < 50 %, `hasAuto`) and a different rule entirely.
 */
export function macalaniaGuardianCounter(ai: AiContext): Command | null {
  if (!AUTO_POTION_ON_ANY_DAMAGE) return null;
  if (rtOf(ai.ctx, ai.self.id).stealCount > 0) return null; // stolen from: no potions left
  return use(ai, 'guardian-auto-potion', [ai.self.id]);
}

// ---------------------------------------------------------------------------
// Anima
// ---------------------------------------------------------------------------

/**
 * §3.4 / §5.3 — she alternates **Boost** and **Pain** while a third clock, her
 * own Overdrive gauge, fills toward **Oblivion**.
 *
 * The gauge is **Boost-independent**, and the engine already gets that right
 * without a special case: `overdrive.ts#addGauge` applies Boost's ×1.5 only for
 * `side === 'aeon'`, and she is an enemy. Do not "fix" that.
 *
 * Boost first, so the player's first read of the loop is the window rather than
 * the punishment.
 */
export const animaMacalaniaAi = (ai: AiContext): Command | null => {
  runMacalaniaPhaseHooks(ai.ctx);
  const self = ai.self;
  addGauge(ai.ctx, self, ANIMA_GAUGE_PER_TURN, 'anima-turn');

  if ((self.overdrive?.gauge ?? 0) >= 100) {
    setGauge(ai.ctx, self, 0, 'oblivion');
    return use(ai, 'anima-oblivion', []);
  }

  const boostNext = ai.ctx.state.flags[MAC_BOOST_NEXT] !== true;
  ai.ctx.state.flags[MAC_BOOST_NEXT] = boostNext;
  return boostNext ? use(ai, 'anima-boost', [self.id]) : use(ai, 'anima-pain-boss', []);
};

registerAiScript(SEYMOUR_MACALANIA_SCRIPT, seymourMacalaniaAi);
registerAiScript(GUADO_GUARDIAN_SCRIPT, guadoGuardianAi);
registerAiScript(ANIMA_MACALANIA_SCRIPT, animaMacalaniaAi);
