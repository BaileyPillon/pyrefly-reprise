/**
 * Play-time accumulation (`SaveStore.addPlayTime` / `flushPlayTime`).
 *
 * The pause screen's PLAY TIME row is fed from `BattleScreen.update`, i.e. once
 * per frame — so the interesting behaviour is not "does it add up" but "does it
 * add up *without* writing to storage sixty times a second", and "does it
 * refuse the deltas a frame clock produces when a tab comes back from the
 * background".
 */
import { beforeEach, describe, expect, it } from 'vitest';

import {
  MAX_PLAY_TIME_STEP_MS,
  PLAY_TIME_FLUSH_MS,
  SaveStore,
  defaultSettings,
  migrate,
  type SaveData,
} from '../../src/app/SaveData.ts';

/** An in-memory `localStorage` that counts writes. */
class FakeStorage {
  readonly items = new Map<string, string>();
  writes = 0;

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.writes++;
    this.items.set(key, value);
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
}

let storage: FakeStorage;
let save: SaveStore;

beforeEach(() => {
  storage = new FakeStorage();
  save = new SaveStore('test:play-time', storage);
});

describe('addPlayTime', () => {
  it('starts at zero for a chapter that has never been played', () => {
    expect(save.playTime('seymour-flux')).toBe(0);
    expect(save.totalPlayTime()).toBe(0);
  });

  it('accumulates across calls', () => {
    save.addPlayTime('seymour-flux', 16);
    save.addPlayTime('seymour-flux', 16);
    save.addPlayTime('seymour-flux', 18);
    expect(save.playTime('seymour-flux')).toBe(50);
  });

  it('keeps chapters apart and totals them', () => {
    save.addPlayTime('seymour-flux', 400);
    save.addPlayTime('yunalesca', 600);
    expect(save.playTime('seymour-flux')).toBe(400);
    expect(save.playTime('yunalesca')).toBe(600);
    expect(save.totalPlayTime()).toBe(1000);
  });

  it.each([0, -1, -1000, Number.NaN, Number.POSITIVE_INFINITY])('ignores the delta %s', (ms) => {
    save.addPlayTime('seymour-flux', ms);
    expect(save.playTime('seymour-flux')).toBe(0);
  });

  /**
   * `App` already clamps `dt`, but a caller handing over a whole elapsed span
   * must not be able to book it as play.
   */
  it('clamps one absurd delta rather than trusting it', () => {
    save.addPlayTime('seymour-flux', 60_000);
    expect(save.playTime('seymour-flux')).toBe(MAX_PLAY_TIME_STEP_MS);
  });
});

describe('write batching', () => {
  it('does not write once per frame', () => {
    const before = storage.writes;
    // A second of 60 fps frames, comfortably under the flush threshold.
    for (let i = 0; i < 60; i++) save.addPlayTime('seymour-flux', 16.67);
    expect(storage.writes).toBe(before);
    expect(save.playTime('seymour-flux')).toBeCloseTo(1000.2, 1);
  });

  it('writes once the unflushed total crosses the threshold', () => {
    const before = storage.writes;
    let added = 0;
    while (added < PLAY_TIME_FLUSH_MS) {
      save.addPlayTime('seymour-flux', 100);
      added += 100;
    }
    expect(storage.writes).toBe(before + 1);
  });

  it('flushPlayTime writes what is pending, and only when something is', () => {
    save.addPlayTime('seymour-flux', 250);
    const before = storage.writes;
    save.flushPlayTime();
    expect(storage.writes).toBe(before + 1);
    // Nothing pending now: a second flush is a no-op, not a second write.
    save.flushPlayTime();
    expect(storage.writes).toBe(before + 1);
  });

  it('round-trips through storage', () => {
    save.addPlayTime('yunalesca', 900);
    save.flushPlayTime();
    const reloaded = new SaveStore('test:play-time', storage);
    expect(reloaded.playTime('yunalesca')).toBe(900);
  });

  it('is cleared by reset, pending total included', () => {
    save.addPlayTime('yunalesca', 900);
    save.reset();
    expect(save.playTime('yunalesca')).toBe(0);
    const before = storage.writes;
    save.flushPlayTime();
    expect(storage.writes).toBe(before);
  });
});

describe('migration', () => {
  it('gives a save written before play time existed a zero, not a guess', () => {
    // The shape an older build wrote: a cleared chapter with a best time and
    // no `playTimeMs` at all. Borrowing `bestTimeMs` would claim one clear was
    // the whole play history.
    const raw = {
      chapters: {
        yunalesca: { id: 'yunalesca', cleared: true, bestTimeMs: 128_000, bestTurns: 12, attempts: 3 },
      },
    } as unknown as Partial<SaveData>;
    const out = migrate(raw);
    expect(out.chapters['yunalesca']?.playTimeMs).toBe(0);
    expect(out.chapters['yunalesca']?.bestTimeMs).toBe(128_000);
  });

  it('keeps a stored play time', () => {
    const raw = {
      chapters: {
        yunalesca: { id: 'yunalesca', cleared: true, bestTimeMs: null, bestTurns: null, attempts: 1, playTimeMs: 42_000 },
      },
    } as unknown as Partial<SaveData>;
    expect(migrate(raw).chapters['yunalesca']?.playTimeMs).toBe(42_000);
  });

  it('discards a nonsense stored play time', () => {
    const raw = {
      chapters: {
        yunalesca: {
          id: 'yunalesca',
          cleared: false,
          bestTimeMs: null,
          bestTurns: null,
          attempts: 0,
          playTimeMs: Number.NaN,
        },
      },
    } as unknown as Partial<SaveData>;
    expect(migrate(raw).chapters['yunalesca']?.playTimeMs).toBe(0);
  });
});

describe('the options the pause menu writes', () => {
  it('ships an X-2 ATB default of Wait (Bailey, D-029, 2026-09-22)', () => {
    expect(defaultSettings().ffx2Atb).toBe('wait');
  });

  it('round-trips a changed setting', () => {
    save.setSettings({ ffx2Atb: 'active', guideVisible: false });
    const reloaded = new SaveStore('test:play-time', storage);
    expect(reloaded.settings.ffx2Atb).toBe('active');
    expect(reloaded.settings.guideVisible).toBe(false);
  });

  it('fills the new setting in for a save that predates it', () => {
    const raw = { settings: { masterVolume: 0.5 } } as unknown as Partial<SaveData>;
    const out = migrate(raw);
    expect(out.settings.ffx2Atb).toBe('wait');
    expect(out.settings.masterVolume).toBe(0.5);
  });
});
