/**
 * Two open tabs of the game, one save (CHK-024-LIVE-1, `critic/reviews/5348c2e3-live.md`).
 *
 * Every tab builds its own `SaveStore` over the same `localStorage` slot. On the
 * live release 10, with real keys, a Master Volume changed in one tab was put
 * back to 0.8 within five seconds by the other tab's play-time flush, because
 * each write was the writer's whole in-memory copy (three of three trials; none
 * of six with a single tab). These tests are the same two stores over one shared
 * slot, and a third store standing in for the reload.
 *
 * Both games: shared plumbing (`src/app/SaveData.ts`, `src/app/saveMerge.ts`).
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { PLAY_TIME_FLUSH_MS, SaveStore } from '../../src/app/SaveData.ts';

/** One origin's `localStorage`, shared by every store built over it. */
class SharedSlot {
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

const KEY = 'test:two-tabs';
let slot: SharedSlot;
const open = (): SaveStore => new SaveStore(KEY, slot);

beforeEach(() => {
  slot = new SharedSlot();
});

describe('a second open tab does not undo the first tab’s writes', () => {
  it('keeps a Master Volume changed in tab A when tab B, still in a battle, flushes its play time', () => {
    const a = open();
    const b = open();
    a.setSettings({ masterVolume: 0.6 });
    // Tab B's battle keeps running: five 1 s frames reach one real flush.
    for (let i = 0; i < PLAY_TIME_FLUSH_MS / 1000; i++) b.addPlayTime('seymour-flux', 1000);

    const reloaded = open();
    expect(reloaded.settings.masterVolume).toBe(0.6);
    expect(reloaded.playTime('seymour-flux')).toBe(PLAY_TIME_FLUSH_MS);
  });

  it('keeps a setting tab B changed itself, and takes every other setting from tab A', () => {
    const a = open();
    const b = open();
    a.setSettings({ masterVolume: 0.6, ffx2Atb: 'active' });
    b.setSettings({ sfxVolume: 0.3 });
    const reloaded = open();
    expect(reloaded.settings.masterVolume).toBe(0.6);
    expect(reloaded.settings.ffx2Atb).toBe('active');
    expect(reloaded.settings.sfxVolume).toBe(0.3);
  });

  it('updates the stale tab’s own copy, so its next write does not clobber either', () => {
    const a = open();
    const b = open();
    a.setSettings({ masterVolume: 0.5 });
    b.setFlag('seen-intro', true);
    expect(b.settings.masterVolume).toBe(0.5);
    b.recordAttempt('seymour-flux');
    expect(open().settings.masterVolume).toBe(0.5);
    expect(open().getFlag('seen-intro')).toBe(true);
  });

  it('keeps a clear from tab A and adds both tabs’ attempts and play time', () => {
    const a = open();
    const b = open();
    a.recordAttempt('seymour-flux');
    a.addPlayTime('seymour-flux', 800);
    a.recordClear('seymour-flux', 90_000, 12);
    b.recordAttempt('seymour-flux');
    b.addPlayTime('seymour-flux', 700);
    b.flushPlayTime();
    a.addPlayTime('seymour-flux', 300);
    a.flushPlayTime();

    const rec = open().value.chapters['seymour-flux'];
    expect(rec?.cleared).toBe(true);
    expect(rec?.bestTimeMs).toBe(90_000);
    expect(rec?.bestTurns).toBe(12);
    expect(rec?.attempts).toBe(2);
    expect(rec?.playTimeMs).toBe(1800);
  });

  it('keeps the better best time and best turns of the two tabs', () => {
    const a = open();
    const b = open();
    a.recordClear('seymour-flux', 120_000, 9);
    b.recordClear('seymour-flux', 100_000, 14);
    const rec = open().value.chapters['seymour-flux'];
    expect(rec?.bestTimeMs).toBe(100_000);
    expect(rec?.bestTurns).toBe(9);
  });

  it('unions unlocks and coaching lines seen in either tab', () => {
    const a = open();
    const b = open();
    a.unlock('ch-a');
    a.markCoachSeen('coach-a');
    b.unlock('ch-b');
    b.markCoachSeen('coach-b');
    const reloaded = open();
    expect([...reloaded.value.unlocked].sort()).toEqual(['ch-a', 'ch-b']);
    expect(reloaded.hasSeenCoach('coach-a')).toBe(true);
    expect(reloaded.hasSeenCoach('coach-b')).toBe(true);
  });

  it('still works when both tabs started on an empty slot', () => {
    const a = open();
    const b = open();
    expect(slot.items.size).toBe(0);
    a.setSettings({ musicVolume: 0.2 });
    b.recordAttempt('seymour-flux');
    const reloaded = open();
    expect(reloaded.settings.musicVolume).toBe(0.2);
    expect(reloaded.value.chapters['seymour-flux']?.attempts).toBe(1);
  });
});

describe('one tab behaves exactly as before', () => {
  it('writes its own copy untouched when nothing else wrote the slot', () => {
    const a = open();
    a.setSettings({ masterVolume: 0.7 });
    a.recordAttempt('seymour-flux');
    const stored = JSON.parse(slot.getItem(KEY)!) as ReturnType<SaveStore['snapshot']>;
    expect(stored).toEqual(a.snapshot());
  });

  it('overwrites a slot another writer left unreadable, as before', () => {
    const a = open();
    slot.items.set(KEY, '{not json');
    a.setSettings({ masterVolume: 0.4 });
    expect(open().settings.masterVolume).toBe(0.4);
  });

  it('rewrites its own copy when the slot was emptied under it, as before', () => {
    const a = open();
    a.setSettings({ masterVolume: 0.4 });
    slot.items.delete(KEY);
    a.recordAttempt('seymour-flux');
    const reloaded = open();
    expect(reloaded.settings.masterVolume).toBe(0.4);
    expect(reloaded.value.chapters['seymour-flux']?.attempts).toBe(1);
  });
});
