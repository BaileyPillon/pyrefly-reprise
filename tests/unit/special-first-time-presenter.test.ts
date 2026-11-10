/**
 * Test 8, the presenter half, of the FFX-2 Special look (step C2; game case: FFX-2 only in what is seen): the first entry is the full plan and the second the short one, across a save and a
 * reload (the real coach state and a save round trip through a memory store); the id is written at the cut of a full plan and not for a short plan, an aborted plan or skip speed; with the
 * port absent every entry is full and nothing throws; the hold policy `short-always` plays the short change every time.
 *
 * Removal: drop the `mark` call at the cut and the second entry stays full.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { PresenterDeps } from '../../src/engine/BattlePresenterPorts.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { hasSeen, markSeen } from '../../src/ui/coach/coachState.ts';
import { fullPlan, shortPlan } from '../../src/engine/SpecialBeatPlans.ts';
import { setSpecialLook } from '../../src/engine/SpecialStaging.ts';
import { loadLog, rig } from './helpers/specialPlayback.ts';

afterEach(() => setSpecialLook(null));

const entry = () => {
  const log = loadLog('entry-yuna');
  return { log, event: log.events.find((e) => e.type === 'spherechange') as BattleEvent };
};

const memory = (): Storage => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), clear: () => m.clear(), key: () => null, length: 0 } as Storage;
};

/** The total of the sleeps one entry asked for, plus the 600 ms the HUD's flourish took. */
async function played(port: PresenterDeps['specialSeen'] | undefined, speed?: 'skip') {
  const { log, event } = entry();
  const r = rig(log, port === undefined ? {} : { specialSeen: port });
  if (speed) r.presenter.setSpeed(speed);
  r.sleeps.length = 0;
  await r.play([event]);
  return r.sleeps.reduce((a, b) => a + b, 0) + 600;
}

describe('the first entry is full and the next is short, across a save and a reload', () => {
  it('uses the real coach state: the id lands in the save at the cut, and a reloaded save plays the short change', async () => {
    const store = memory();
    new SaveStore('special-first-time', store);
    const port = { has: hasSeen, mark: markSeen };
    expect(await played(port)).toBe(fullPlan('yuna').totalMs);
    expect(hasSeen('special-yuna-floral-fallal')).toBe(true);
    new SaveStore('special-first-time', store); // the reload: a new store over the same storage
    expect(hasSeen('special-yuna-floral-fallal')).toBe(true);
    expect(await played(port)).toBe(shortPlan('yuna').totalMs);
  });
});

describe('when the id is written', () => {
  it('not for a short plan, not at skip speed, not for an aborted plan', async () => {
    const marks: string[] = [];
    const port = { has: (id: string) => id === 'special-yuna-floral-fallal', mark: (id: string) => void marks.push(id) };
    await played(port); // short
    expect(marks).toEqual([]);
    const fresh = { has: () => false, mark: (id: string) => void marks.push(id) };
    await played(fresh, 'skip');
    expect(marks).toEqual([]);
    const { log, event } = entry();
    const r = rig(log, { specialSeen: fresh });
    let n = 0;
    const push = r.sleeps.push.bind(r.sleeps);
    r.sleeps.push = (...a: number[]) => (++n === 5 && r.presenter.abort(), push(...a));
    await r.play([event]);
    expect(marks).toEqual([]);
    await played(fresh); // and a whole full plan does
    expect(marks).toEqual(['special-yuna-floral-fallal']);
  });
});

describe('with the port absent, and the hold policy', () => {
  it('every entry is full when there is no port, and nothing throws', async () => {
    expect(await played(undefined)).toBe(fullPlan('yuna').totalMs);
    expect(await played(undefined)).toBe(fullPlan('yuna').totalMs);
  });

  it('short-always plays the short change every time, with the port present or absent, and marks nothing', async () => {
    setSpecialLook({ hold: 'short-always' });
    const marks: string[] = [];
    expect(await played({ has: () => false, mark: (id: string) => void marks.push(id) })).toBe(shortPlan('yuna').totalMs);
    expect(await played(undefined)).toBe(shortPlan('yuna').totalMs);
    expect(marks).toEqual([]);
  });
});
