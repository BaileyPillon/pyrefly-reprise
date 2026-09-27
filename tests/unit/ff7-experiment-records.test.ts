// @vitest-environment jsdom
/**
 * The experiments' own store (`src/app/experiments/experimentRecords.ts`): its
 * own key, never the main save, and it survives bad storage.
 * Game case: FF7 only (the only experiment).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  EXPERIMENTS_KEY,
  addExperimentPlayTime,
  experimentRecord,
  readExperiments,
  recordExperimentAttempt,
  recordExperimentClear,
  setExperimentStorageForTests,
} from '../../src/app/experiments/experimentRecords.ts';
import { SAVE_KEY } from '../../src/app/SaveData.ts';

const ID = 'ff7-guard-scorpion';

beforeEach(() => localStorage.clear());
afterEach(() => setExperimentStorageForTests(undefined));

describe('experiment records', () => {
  it('uses its own key, never the save key', () => {
    expect(EXPERIMENTS_KEY).toBe('pyrefly-reprise:experiments:v1');
    expect(EXPERIMENTS_KEY).not.toBe(SAVE_KEY);
    recordExperimentAttempt(ID, 1000);
    recordExperimentClear(ID, 90_000);
    addExperimentPlayTime(ID, 500);
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(Object.keys(localStorage)).toEqual([EXPERIMENTS_KEY]);
  });

  it('counts attempts and clears, keeps the best time, and ignores a null (automated) time', () => {
    recordExperimentAttempt(ID, 1000);
    recordExperimentAttempt(ID, 2000);
    recordExperimentClear(ID, 90_000);
    recordExperimentClear(ID, 120_000);
    recordExperimentClear(ID, null);
    addExperimentPlayTime(ID, 250);
    addExperimentPlayTime(ID, -5);
    addExperimentPlayTime(ID, Number.NaN);
    expect(experimentRecord(ID)).toEqual({ attempts: 2, clears: 3, bestTimeMs: 90_000, playTimeMs: 250, lastPlayedAt: 2000 });
  });

  it('reads a corrupt or foreign value as empty and writes over it cleanly', () => {
    localStorage.setItem(EXPERIMENTS_KEY, '{not json');
    expect(readExperiments()).toEqual({});
    localStorage.setItem(EXPERIMENTS_KEY, JSON.stringify([1, 2]));
    expect(readExperiments()).toEqual({});
    localStorage.setItem(EXPERIMENTS_KEY, JSON.stringify({ [ID]: { attempts: 'x', clears: -3, bestTimeMs: 0 } }));
    expect(experimentRecord(ID)).toEqual({ attempts: 0, clears: 0, bestTimeMs: null, playTimeMs: 0, lastPlayedAt: null });
    recordExperimentAttempt(ID, 5);
    expect(experimentRecord(ID).attempts).toBe(1);
  });

  it('never throws when storage is missing or refuses writes', () => {
    setExperimentStorageForTests(null);
    expect(() => recordExperimentAttempt(ID)).not.toThrow();
    expect(experimentRecord(ID).attempts).toBe(0);
    setExperimentStorageForTests({
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(() => recordExperimentClear(ID, 1)).not.toThrow();
  });
});
