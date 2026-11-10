/**
 * Test 15 of the FFX-2 Special look (step A; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2; the coach state and the save list it uses are shared plumbing, unchanged):
 * the first-time answer through the REAL coach state and a save round trip.
 *
 * The battle screen (step C2) will hand the presenter `{ has: hasSeen, mark: markSeen }` of `ui/coach/coachState.ts`. Here that pair is used as it is: the answer survives a reload
 * (`seenCoach` in the save, no schema, no migration), a veteran-migrated save never has a Special id pre-marked, and `markSeen` writes nothing to the save inside a hidden
 * experiment run (CHK-025).
 *
 * Removal: make `entryKind` always answer 'full' and the reload case fails.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { SaveStore, migrate, defaultSettings, type SaveData } from '../../src/app/SaveData.ts';
import { beginExperimentRun } from '../../src/app/experiments/experimentRun.ts';
import { entryKind } from '../../src/engine/SpecialBeatPlans.ts';
import { specialSeenId } from '../../src/engine/SpecialFormTracker.ts';
import { hasSeen, markSeen, resetCoach } from '../../src/ui/coach/coachState.ts';
import { FORM_GIRLS } from './helpers/specialFormState.ts';

const KEY = 'special-first-time-test';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

const coachPort = { has: (id: string) => hasSeen(id), mark: (id: string) => markSeen(id) };

afterEach(() => resetCoach());

describe('the first-time answer through the real coach state', () => {
  it('is full, then short after the id is marked, then still short after a reload (the save keeps it)', () => {
    const storage = memoryStorage();
    new SaveStore(KEY, storage);
    expect(entryKind(coachPort, 'yuna', 'floral-fallal')).toBe('full');
    coachPort.mark(specialSeenId('yuna', 'floral-fallal'));
    expect(entryKind(coachPort, 'yuna', 'floral-fallal')).toBe('short');
    expect(entryKind(coachPort, 'rikku', 'machina-maw'), 'per girl').toBe('full');

    resetCoach(); // the session set is gone, as after a reload
    new SaveStore(KEY, storage); // and the save is read again
    expect(entryKind(coachPort, 'yuna', 'floral-fallal')).toBe('short');
    expect(entryKind(coachPort, 'paine', 'full-throttle')).toBe('full');
    expect(JSON.parse(storage.getItem(KEY) as string).seenCoach).toContain('special-yuna-floral-fallal');
  });

  it('a save migrated from before onboarding (a veteran) never has a Special id pre-marked', () => {
    const veteran: Partial<SaveData> = {
      version: 1,
      updatedAt: 1,
      chapters: { 'seymour-flux': { id: 'seymour-flux', cleared: true, bestTimeMs: 1, bestTurns: 1, attempts: 1, playTimeMs: 1 } },
      unlocked: [],
      settings: { ...defaultSettings(), battleHelp: undefined as unknown as boolean },
      flags: {},
    };
    const out = migrate(veteran);
    for (const { girl, special } of FORM_GIRLS) expect(out.seenCoach).not.toContain(specialSeenId(girl, special));
    const storage = memoryStorage();
    storage.setItem(KEY, JSON.stringify(out));
    new SaveStore(KEY, storage);
    for (const { girl, special } of FORM_GIRLS) expect(entryKind(coachPort, girl, special), girl).toBe('full');
  });

  it('inside an experiment run `markSeen` writes nothing to the save', () => {
    const storage = memoryStorage();
    new SaveStore(KEY, storage);
    const before = storage.getItem(KEY);
    const end = beginExperimentRun();
    try {
      coachPort.mark(specialSeenId('paine', 'full-throttle'));
      expect(storage.getItem(KEY)).toBe(before);
    } finally {
      end();
    }
    resetCoach();
    expect(entryKind(coachPort, 'paine', 'full-throttle'), 'outside the run the save is the memory: the run left no trace').toBe('full');
  });

  it('a mark made in this session is answered in this session (the session set is written beside the save)', () => {
    const id = specialSeenId('rikku', 'machina-maw');
    coachPort.mark(id);
    expect(entryKind(coachPort, 'rikku', 'machina-maw')).toBe('short');
  });
});
