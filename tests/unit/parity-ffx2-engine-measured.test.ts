/**
 * Re-parity W4: the engine replays what Bailey's running game showed on 2026-10-09 (`research/re-ffx2-timing-measured.md`).
 *
 * The kernels are proven against the game's code; these checks put the MEASURED sequences through the engine itself, the way they
 * were seen, so that a future change to the engine's wiring cannot drift away from the live game without a test noticing.
 * **Game case: FFX-2 only.**
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine, STEP_MS, isReady } from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { AiScript, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../src/battle/ffx2/ai/index.ts';
import { applyDelay } from '../../src/battle/ffx2/atb-engine.ts';
import { Ffx2AtbState } from '../../src/battle/ffx2/kernel/atb-gauge.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';

registerAiScript({ id: 'zz-measured-quiet', decide: () => null } satisfies AiScript);

function battle(): { engine: FFX2Engine; u(id: string): Ffx2Unit } {
  const enemies = [enemy('m0', 'M0', 'zz-measured-quiet', { agi: 60, hp: 9_999_999, maxHp: 9_999_999 }, { slot: 0, immunityFlags: [], flags: {} })];
  const engine = new FFX2Engine({ minigames: false });
  engine.init({ ...setup(group('zz-measured', enemies), { seed: 1, level: 24 }), condition: 'scripted' });
  const state = engine.state();
  return { engine, u: (id) => (state.combatants as Record<string, Ffx2Unit>)[id] as Ffx2Unit };
}

describe('the live game, replayed through the engine', () => {
  it('three weak Delay hits on a Hasted girl with her menu open: the counter is exactly 4,000 and she is ready again after 48 steps (14 or 15 of them halved)', () => {
    // research/re-ffx2-timing-measured.md section 5: Rikku (Haste, tick 99, hit-reaction tick 49) took the Giant's Attack with her menu open;
    // her state went 4 to 0 with the counter at 4,000 and she was ready again 48 steps later (1.60 s).
    const b = battle();
    const rikku = b.u('rikku');
    for (const id of ['yuna', 'paine', 'm0']) {
      b.u(id).gauge.state = Ffx2AtbState.Recover;
      b.u(id).atb.recovery = 90_000;
    }
    applyStatus(rikku, { status: 'haste', chance: 255, duration: 125 }, rikku.id);
    rikku.gauge.state = Ffx2AtbState.WaitCommand;
    rikku.atb.recovery = -6; // the overshoot of her last tick, as the game left it
    expect(applyDelay(rikku, 4000)).toBe(true); // the menu closes
    expect(rikku.gauge.state).toBe(Ffx2AtbState.Idle);
    expect(rikku.atb.recovery).toBe(4000);
    rikku.gauge.hitReaction = 15; // the flinch the same hit started
    let steps = 0;
    let halved = 0;
    while (!isReady(rikku) && steps < 200) {
      b.engine.tick(STEP_MS);
      steps += 1;
      if (rikku.gauge.speeds.tick === 49) halved += 1;
    }
    expect(steps).toBe(48);
    expect(halved).toBe(15);
    expect(rikku.gauge.speeds.tick).toBe(99);
  });

  it('a Hasted girl pays her recovery at 99 a step: 2,967 units a second', () => {
    const b = battle();
    const rikku = b.u('rikku');
    for (const id of ['yuna', 'paine', 'm0']) {
      b.u(id).gauge.state = Ffx2AtbState.Recover;
      b.u(id).atb.recovery = 90_000;
    }
    applyStatus(rikku, { status: 'haste', chance: 255, duration: 125 }, rikku.id);
    rikku.gauge.state = Ffx2AtbState.Recover;
    rikku.atb.recovery = 50_000;
    for (let i = 0; i < 30; i++) b.engine.tick(STEP_MS);
    expect(50_000 - rikku.atb.recovery).toBe(30 * 99);
  });
});
