/**
 * Bahamut — Bevelle Underground, Chapter 2 [ffx2-bahamut §2.1].
 *
 * A **fully deterministic, fixed 12-action loop**. No RNG branches, no HP
 * thresholds, no phase changes, and the loop never resets on damage:
 *
 * ```
 * 1      Curse on a random target
 * 2-4    Normal Attack on a random target
 * 5-6    Impulse (3/8 of current HP, party-wide)
 * 7-11   Countdown: 5, 4, 3, 2, 1 — five dead turns
 * 12     Mega Flare
 * 13     repeat from 1
 * ```
 *
 * Two consequences the encounter is built on, both worth protecting with tests:
 * - **There is no HP trigger for Mega Flare.** It is purely turn-counted.
 * - The counter is an **action counter, not a clock** — it advances only when
 *   Bahamut takes a turn, so Slowing him slows the countdown too.
 *
 * Turns 7–11 are the party's designated free-damage window and the reason the
 * fight is winnable at Lv 20. The countdown is presented as a numeric badge on
 * the boss, not a text banner: no source records an English string for the X-2
 * version, so inventing one would be presenting a guess as canon (§2.6).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { BAHAMUT_COUNTDOWN_START } from '../constants.ts';

/** 1-based position in the 12-action loop. */
const LOOP_LENGTH = 12;
const COUNTDOWN_FIRST = 7;
const COUNTDOWN_LAST = 11;
const MEGA_FLARE_STEP = 12;

/** Which step Bahamut is about to take, 1..12. */
export function bahamutStep(unitMemory: number): number {
  return (unitMemory % LOOP_LENGTH) + 1;
}

function randomPartyTarget(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

export const bahamutScript: AiScript = {
  id: 'ffx2-bahamut',

  decide(ctx: AiContext): Command | null {
    const step = bahamutStep(mem(ctx.self, 'actions'));
    setMem(ctx.self, 'actions', mem(ctx.self, 'actions') + 1);

    if (step === 1) {
      return { kind: 'ability', id: 'bahamut-curse', targets: randomPartyTarget(ctx) };
    }
    if (step >= 2 && step <= 4) {
      return { kind: 'ability', id: 'attack', targets: randomPartyTarget(ctx) };
    }
    if (step === 5 || step === 6) {
      return { kind: 'ability', id: 'impulse', targets: [] };
    }
    if (step >= COUNTDOWN_FIRST && step <= COUNTDOWN_LAST) {
      // Five consecutive actions that do nothing but display a number.
      const turnsLeft = BAHAMUT_COUNTDOWN_START - (step - COUNTDOWN_FIRST);
      ctx.emit({
        type: 'charge',
        enemyId: ctx.self.id,
        name: String(turnsLeft),
        turnsLeft,
        stage: turnsLeft <= 2 ? 2 : 1,
      });
      ctx.flags['bahamutCountdown'] = turnsLeft;
      return null;
    }
    if (step === MEGA_FLARE_STEP) {
      ctx.emit({ type: 'charge', enemyId: ctx.self.id, name: '0', turnsLeft: 0, stage: 2 });
      ctx.flags['bahamutCountdown'] = 0;
      return { kind: 'ability', id: 'mega-flare', targets: [] };
    }
    return null;
  },
};

export default bahamutScript;
