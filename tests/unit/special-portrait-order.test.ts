/**
 * Test 17 of the FFX-2 Special look (step C2; game case: FFX-2 only in what is seen): the entry sleeps the portrait slab's own time, taken from the same `BigMoveCut` the ordinary
 * special change shows, before the field starts. A slab that runs longer than its nominal 700 ms shortens the next step's sleep, never the cut; at skip speed there is no portrait and no wait.
 *
 * Removal: take `portraitWait()` out of the entry's `portrait` step and the order case fails; make the runner ignore a step's own time and the total case fails.
 */

import { describe, expect, it, vi } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { fullPlan } from '../../src/engine/SpecialBeatPlans.ts';
import { loadLog, rig } from './helpers/specialPlayback.ts';

const entry = () => {
  const log = loadLog('entry-yuna');
  return { log, event: log.events.find((e) => e.type === 'spherechange') as BattleEvent };
};

describe('the portrait before the field', () => {
  it('waits for the slab\'s own 700 ms of the recording clock; the field then starts at once and the cut stays at its absolute time', async () => {
    const { log, event } = entry();
    const marks: string[] = [];
    let r!: ReturnType<typeof rig>;
    const turnCutIn = vi.fn(async () => {
      marks.push(`slab@${r.clock.t}`);
      r.clock.t += 700; // the slab runs 700 ms of the recording clock
      marks.push(`slab-done@${r.clock.t}`);
    });
    r = rig(log, { moments: { turnCutIn } as never });
    const original = r.stage.vfx.special!.bind(r.stage.vfx);
    r.stage.vfx.special = async (c) => {
      marks.push(`${c.id}@${r.clock.t}`);
      return original(c);
    };
    r.sleeps.length = 0;
    await r.play([event]);
    expect(turnCutIn).toHaveBeenCalledTimes(1);
    const slabEnd = marks.find((m) => m.startsWith('slab-done@'))!;
    const field = marks.find((m) => m.startsWith('light-column@'))!;
    expect(Number(field.split('@')[1]), 'field starts after the slab').toBeGreaterThanOrEqual(Number(slabEnd.split('@')[1]));
    expect(r.presenter.moments.portraitWait(), 'the promise is handed back once').toBeNull();
    // the cut is at the plan's absolute time: the sleeps plus the slab's own 700 make up the plan
    expect(r.sleeps.reduce((a, b) => a + b, 0) + 700).toBe(fullPlan('yuna').totalMs - 600);
  });

  it('a slab longer than its nominal time shortens the field, not the cut', async () => {
    const { log, event } = entry();
    let r!: ReturnType<typeof rig>;
    r = rig(log, { moments: { turnCutIn: vi.fn(async () => void (r.clock.t += 1500)) } as never });
    r.sleeps.length = 0;
    await r.play([event]);
    expect(r.sleeps.reduce((a, b) => a + b, 0) + 1500).toBe(fullPlan('yuna').totalMs - 600);
  });

  it('at skip speed no slab starts (no big move) and nothing waits', async () => {
    const { log, event } = entry();
    const turnCutIn = vi.fn(async () => undefined);
    const r = rig(log, { moments: { turnCutIn } as never });
    r.presenter.setSpeed('skip');
    await r.play([event]);
    expect(turnCutIn).not.toHaveBeenCalled();
    expect(r.presenter.moments.portraitWait()).toBeNull();
  });
});
