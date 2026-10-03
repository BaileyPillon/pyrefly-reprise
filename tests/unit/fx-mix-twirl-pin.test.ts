/**
 * Round 19, PR-0315 and PR-0327 (FFX-2 only): a twirl key shows alone (the other plane pinned at none, so a pose crossfade the
 * presenter had started cannot ghost the old outfit under it), and the keys a girl always needs are known ahead.
 */
import { describe, expect, it } from 'vitest';
import { GRID_EVENT, LATE_MS, TwirlSlot, twirlPlan } from '../../src/engine/fx/mix/twirl.ts';

type Plane = { mesh: object; pose: string; fade: number };
const girl = (fades: [number, number], active = 0) => {
  const calls = { sync: 0 };
  const a = { slots: [{ mesh: {}, pose: 'idle', fade: fades[0] }, { mesh: {}, pose: 'idle', fade: fades[1] }] as Plane[], active, syncOpacity: () => void calls.sync++ };
  return { a, calls };
};
const pin = (t: TwirlSlot, a: unknown): void => (t as unknown as { pin(a: unknown): void }).pin(a);

describe('the twirl shows one painting at a time (PR-0315)', () => {
  it('pins the showing plane at full and the other at none, and records what the other showed', () => {
    const t = new TwirlSlot();
    const { a, calls } = girl([1, 0.6], 0); // a crossfade left the old outfit's plane at 0.6 under the key
    pin(t, a);
    expect(a.slots.map((s) => s.fade)).toEqual([1, 0]);
    expect(calls.sync).toBe(1);
    expect(t.stats.ghostNow).toBe(0.6);
    expect(t.stats.ghost).toBe(0.6);
    t.dispose();
  });

  it('follows the plane that is showing now (the presenter flipped them)', () => {
    const t = new TwirlSlot();
    const { a } = girl([0.4, 1], 1);
    pin(t, a);
    expect(a.slots.map((s) => s.fade)).toEqual([0, 1]);
    t.dispose();
  });

  it('with the pin off (a check\'s switch) it measures the ghost and leaves the planes as they were', () => {
    const t = new TwirlSlot();
    t.pinOn = false;
    const { a, calls } = girl([1, 1], 0);
    pin(t, a);
    expect(a.slots.map((s) => s.fade)).toEqual([1, 1]);
    expect(calls.sync).toBe(0);
    expect(t.stats.ghost).toBe(1);
    t.dispose();
  });
});

describe('the keys a girl always needs, ahead of her first change (PR-0327)', () => {
  const states: Record<string, string[]> = {
    'yuna-gunner': ['idle', 'twirl-start', 'twirl-going', 'twirl-mid', 'twirl-forming', 'twirl-end'],
    'yuna-black-mage': ['idle', 'twirl-start', 'twirl-going', 'twirl-forming', 'twirl-end'],
  };
  const of = (id: string) => states[id] ?? null;

  it("is the dressphere she leaves (start, going) and her twirl-mid: the new outfit's forming and end wait for the Change submenu", () => {
    const plan = twirlPlan('yuna-black-mage', '', of, Object.keys(states));
    expect(plan.map((k) => `${k.figure}/${k.key}`)).toEqual(['yuna-black-mage/twirl-start', 'yuna-black-mage/twirl-going', 'yuna-gunner/twirl-mid']);
  });

  it('names the event the Change submenu fires, and a short wait before keys that are late give way to today\'s flourish', () => {
    expect(GRID_EVENT).toBe('pyrefly:garment-grid');
    expect(LATE_MS).toBeGreaterThan(100);
    expect(LATE_MS).toBeLessThan(500);
  });
});
