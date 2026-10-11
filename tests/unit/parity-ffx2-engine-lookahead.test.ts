/**
 * Re-parity W4: the engine's lookahead (`lookahead.ts stepsUntilNextEvent`) never runs the clock past an event.
 *
 * The presenter asks `nextDecision()` for a `waiting` answer, "nothing needs you for `nextEventMs`", and ticks that long in one
 * call. The step loop inside `tick` runs every logic step exactly, so a lookahead that is too SMALL only costs one more call;
 * one that is too LARGE would let a call spend past a ready girl, a payout or an expiry the presenter wants to play. This test
 * proves the second cannot happen: over the generated battles of `parity-ffx2-engine-atb.test.ts` (every Config speed, Haste,
 * Slow, Stop, Sleep, Doom, Poison, Regen, casts, Delay hits and the action time) it records, at the end of every step, the number
 * of steps the lookahead promises are quiet, and checks from the trace that nothing observable happens in fewer steps than that.
 * "Observable" = a unit's gauge state, whether it has a cast on the bar or a command executing, its HP, or any clock event
 * (an expiry, a Poison or Regen payout, a knock-out; a lost count is a HUD refresh and is not one).
 *
 * Mutation check: see the table in `docs/handoff/re-parity-w4.md`. **Game case: FFX-2 only.**
 */

import { describe, expect, it } from 'vitest';
import { baseSpeedOf, stepsUntilNextEvent } from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { makeScenario, engineRun } from './helpers/ffx2AtbRig.ts';

const SCENARIOS = Number(process.env['PYREFLY_W4_LOOKAHEAD_SCENARIOS'] ?? 80);

/**
 * The part of a unit's trace line a presenter can see change: state, a cast on the bar, a command executing, HP. IDLE (0) and
 * RECOVER (1) are one thing to a presenter (the unit is not ready; the engine goes from one to the other on its own the step after a
 * command ends), so they share a letter.
 */
function visible(line: string): string {
  const parts = line.split('|');
  const state = parts[1] === 's0' ? 's1' : parts[1];
  const cast = (parts[7] ?? '').startsWith('ch-') ? 'nocast' : 'cast';
  const executing = (parts[8] ?? '') === 'x0' ? 'idle' : 'exec';
  const hp = parts[9];
  return [state, cast, executing, hp].join('/');
}

describe('the lookahead is a lower bound on the next event (generated battles)', () => {
  it(`${SCENARIOS} battles: after every step, nothing observable happens before the lookahead says it can`, () => {
    let checked = 0;
    let finite = 0;
    for (let i = 0; i < SCENARIOS; i++) {
      const sc = makeScenario(i);
      const promised: number[] = [];
      const { trace } = engineRun(sc, (engine) => {
        const units = Object.values(engine.state().combatants) as Ffx2Unit[];
        promised.push(stepsUntilNextEvent(units, baseSpeedOf(sc.speed)));
      });
      // promised[k] was read after step k + 1; trace.steps[k + 1] / events[k + 1] are that step's result.
      for (let k = 0; k < promised.length; k++) {
        const n = promised[k] as number;
        checked += 1;
        expect(n, `scenario ${i} step ${k + 1}: a step always advances`).toBeGreaterThanOrEqual(1);
        if (!Number.isFinite(n)) continue;
        finite += 1;
        const here = trace.steps[k + 1] as string[];
        // The scenario's own happenings (a status landing, a Delay hit) are applied between steps and change the world the
        // lookahead was asked about (a Haste makes everything sooner), so the promise is only checked up to the next one.
        const nextHappening = Math.min(Infinity, ...sc.events.map((e) => e.step).filter((s) => s > k + 1));
        for (let ahead = 1; ahead < n && k + 1 + ahead < trace.steps.length && k + 1 + ahead < nextHappening; ahead++) {
          const there = trace.steps[k + 1 + ahead] as string[];
          const events = trace.events[k + 1 + ahead] as string[];
          const changed = here.some((line, u) => visible(line) !== visible(there[u] as string));
          // A lost count (`tick:`) only refreshes the status icon's number; nothing waits for it (the old engine sent one every sub-step).
          const clock = events.filter((t) => !t.startsWith('tick:'));
          if (changed || clock.length > 0) {
            throw new Error(`scenario ${i}: after step ${k + 1} the lookahead said ${n} quiet steps, but step ${k + 1 + ahead} changed ${changed ? 'a unit' : ''} ${JSON.stringify(clock)}`);
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(SCENARIOS * 300);
    expect(finite).toBeGreaterThan(checked / 4); // the check is not vacuous: most steps promise a finite wait
  }, 600_000);
});
