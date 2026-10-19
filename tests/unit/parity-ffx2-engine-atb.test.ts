/**
 * Re-parity W4, the engine against the game: the FFX-2 battle clock.
 *
 * The kernels of `src/battle/ffx2/kernel/atb*.ts` and `status-timers*.ts` are proven against FFX-2.exe by emulation
 * (`parity-ffx2-atb.test.ts`, `parity-ffx2-status-timers.test.ts`). This file proves the part left: that the ENGINE gives
 * them the right inputs, in the game's order, and applies their answers.
 *
 * `makeScenario` writes generated battles in the game's terms (Agility bytes, the Config speed, ATB and cast costs, status
 * counters, an action time, Delay hits). `engineRun` plays one through the real `FFX2Engine`, one logic step at a time;
 * `oracleRun` (`helpers/ffx2AtbOracle.ts`) plays the same scenario straight through the kernels the way the game does, and
 * imports nothing from the engine's gauge, opening, step or status-clock modules. After EVERY step the two traces must agree
 * on every character's gauge state, recovery counter and its maximum, thinking time, delay carry, tick, charge, action time,
 * HP, Poison and Regen accumulators and status clocks, and on the events the clocks make (an expiry, a lost count, a Poison
 * or Regen payout, a knock-out). The random draws are checked too: both sides draw from the engine's seed, in the order the
 * game asks, so one draw too many or too few shows as a different opening or a different knock-out wait a long way on.
 *
 * Mutation check: see the table in `docs/handoff/re-parity-w4.md` (a deliberate fault put into the engine, one at a time).
 *
 * **Game case: FFX-2 only.**
 */

import { describe, expect, it } from 'vitest';
import { makeScenario, engineRun, type Scenario } from './helpers/ffx2AtbRig.ts';
import { oracleRun } from './helpers/ffx2AtbOracle.ts';

const SCENARIOS = Number(process.env['PYREFLY_W4_SCENARIOS'] ?? 250);

function describeScenario(sc: Scenario): string {
  return JSON.stringify({ ...sc, events: sc.events.slice(0, 12) });
}

describe('FFX-2 engine ATB clock against the game (generated battles)', () => {
  it(`${SCENARIOS} generated battles: every gauge, charge, status clock and clock event agrees with the kernels step for step`, () => {
    for (let i = 0; i < SCENARIOS; i++) {
      const sc = makeScenario(i);
      const { trace: engine, world } = engineRun(sc);
      const game = oracleRun(sc, world);
      expect(engine.steps.length).toBe(game.steps.length);
      for (let s = 0; s < game.steps.length; s++) {
        const a = engine.steps[s] as string[];
        const b = game.steps[s] as string[];
        for (let u = 0; u < b.length; u++) {
          if (a[u] !== b[u]) {
            throw new Error(`scenario ${i} step ${s}: engine ${a[u]} but the game ${b[u]}\n${describeScenario(sc)}`);
          }
        }
        const ea = [...(engine.events[s] as string[])].sort();
        const eb = [...(game.events[s] as string[])].sort();
        if (JSON.stringify(ea) !== JSON.stringify(eb)) {
          throw new Error(`scenario ${i} step ${s}: engine events ${JSON.stringify(ea)} but the game ${JSON.stringify(eb)}\n${describeScenario(sc)}`);
        }
      }
    }
  }, 600_000);
});
