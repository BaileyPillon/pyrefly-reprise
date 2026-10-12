/**
 * Re-parity W4: the engine hands out turns in the game's READY LIST order.
 *
 * `MsChrATBprocess` (exe 0x006343a0) serves the characters that ran out in a step lowest recovery counter first: the one whose last
 * subtraction overshot furthest (the most negative counter) goes first, ties by slot (`research/re-ffx2-atb-status.md` section 3.7;
 * `kernel/atb-tick.ts readyOrder`, proven by `parity-ffx2-atb.test.ts`). The engine used to give the turn to the party first, then
 * enemies, each by slot. These tests put two units into the same step by hand and check who gets the turn, and that a unit that
 * became ready in an EARLIER step still goes before one that runs out later. **Game case: FFX-2 only.**
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine, STEP_MS } from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { AiScript, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../src/battle/ffx2/ai/index.ts';
import { Ffx2AtbState } from '../../src/battle/ffx2/kernel/atb-gauge.ts';

const quiet: AiScript = { id: 'zz-order-quiet', decide: () => null };
registerAiScript(quiet);

function battle(): { engine: FFX2Engine; u(id: string): Ffx2Unit } {
  const enemies = [0, 1].map((i) => enemy(`m${i}`, `M${i}`, 'zz-order-quiet', { agi: 60, hp: 9_999_999, maxHp: 9_999_999 }, { slot: i, immunityFlags: [], flags: {} }));
  const engine = new FFX2Engine({ minigames: false });
  engine.init({ ...setup(group('zz-order', enemies), { seed: 1, level: 24 }), condition: 'scripted' });
  const state = engine.state();
  return { engine, u: (id) => (state.combatants as Record<string, Ffx2Unit>)[id] as Ffx2Unit };
}

/** Put a unit mid-recovery with `left` units to go (a tick is 95 at the Normal speed); everyone else far from ready. */
function recovering(b: ReturnType<typeof battle>, left: Record<string, number>): void {
  for (const id of ['yuna', 'rikku', 'paine', 'm0', 'm1']) {
    const u = b.u(id);
    u.gauge.state = Ffx2AtbState.Recover;
    u.gauge.thinking = 0;
    u.atb.recovery = left[id] ?? 90_000;
  }
}

/** The first turn the engine hands out after `steps` logic steps: who acts, from the decision it returns. */
function firstTurn(b: ReturnType<typeof battle>, steps: number): string[] {
  const who: string[] = [];
  for (let i = 0; i < steps; i++) {
    // A monster that comes up inside the tick plays its turn there; its events come back from the call.
    for (const e of b.engine.tick(STEP_MS)) if (e.type === 'turn-start') who.push(e.actorId);
  }
  for (let guard = 0; guard < 4; guard++) {
    const d = b.engine.nextDecision();
    if (d.kind === 'player-input') {
      who.push(d.actorId);
      break;
    }
    if (d.kind === 'resolved') {
      for (const e of d.events) if (e.type === 'turn-start') who.push(e.actorId);
      continue;
    }
    break;
  }
  return who;
}

describe('the ready list: lowest recovery counter first', () => {
  it('a monster that overshoots further (-85) goes before a girl who ran out in the same step (-45), though the party used to go first', () => {
    const b = battle();
    recovering(b, { yuna: 50, m0: 10 });
    // One step takes 95 off: Yuna 50 -> -45, m0 10 -> -85. Both are ready; the game serves m0 first, then Yuna's menu opens.
    expect(firstTurn(b, 1)).toEqual(['m0', 'yuna']);
  });

  it('the girl who overshoots further goes first: Rikku at -80 before Yuna at -45, though Yuna has the lower slot', () => {
    const b = battle();
    recovering(b, { yuna: 50, rikku: 15 });
    expect(firstTurn(b, 1)).toEqual(['rikku']);
  });

  it('a tie in the counter is broken by slot: two units at -45 serve the lower slot first', () => {
    const b = battle();
    recovering(b, { yuna: 50, rikku: 50 });
    expect(firstTurn(b, 1)).toEqual(['yuna']);
  });

  it('a unit that became ready in an EARLIER step is served before one that runs out later, whatever their counters', () => {
    const b = battle();
    recovering(b, { rikku: 10, yuna: 100 });
    // Step 1: Rikku 10 -> -85 (ready). Step 2: Yuna 100 -> 5 -> -90 would need two steps: she is ready after step 2 at -90, a lower counter
    // than Rikku's -85 and a lower slot, but Rikku ran out first and the game had already served her.
    b.engine.tick(STEP_MS);
    expect(b.u('rikku').gauge.state).toBe(Ffx2AtbState.WaitCommand);
    expect(b.u('yuna').gauge.state).toBe(Ffx2AtbState.Recover);
    b.engine.tick(STEP_MS);
    expect(b.u('yuna').gauge.state).toBe(Ffx2AtbState.WaitCommand);
    expect(b.u('yuna').atb.recovery).toBeLessThan(b.u('rikku').atb.recovery);
    const d = b.engine.nextDecision();
    expect(d.kind === 'player-input' ? d.actorId : d.kind).toBe('rikku');
  });
});
