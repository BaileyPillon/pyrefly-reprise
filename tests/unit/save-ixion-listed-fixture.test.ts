/**
 * Listing Chapter XVI (Ixion at Djose, 2026-09-27) against a save written by the LIVE main build (release 25,
 * main 79adc4ff; `tests/fixtures/saves/release-25-main.json`, exported from that build's own SaveStore in a fresh
 * headless profile, see the fixture's `_note`): the save loads unchanged, the new chapter arrives unplayed, the
 * board counts it ("N of 15"), and the veteran rule does not re-decide. Shared plumbing, both games
 * (`src/app/SaveData.ts` is untouched by this branch); the chapter itself is FFX-2 only.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { buildChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';

interface Fixture {
  mainSha: string;
  localStorage: Record<string, string>;
  expect: { cleared: string[]; notCleared: string[]; bestTimeMs: Record<string, number>; settings: Record<string, unknown> };
}

const fixture = JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'saves', 'release-25-main.json'), 'utf8')) as Fixture;

class Slot {
  readonly items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
}

const slot = (): Slot => {
  const s = new Slot();
  s.setItem(SAVE_KEY, fixture.localStorage[SAVE_KEY]!);
  return s;
};

describe('a main-built save (release 25) on the build that lists Chapter XVI', () => {
  it('is a real release-25 blob under the save key, written before Chapter XVI existed on main', () => {
    expect(fixture.mainSha).toBe('79adc4ff');
    const raw = JSON.parse(fixture.localStorage[SAVE_KEY]!) as { chapters: Record<string, unknown> };
    expect(Object.keys(raw.chapters)).not.toContain('ffx2-ixion-djose');
  });

  it('loads unchanged: every record, best time, setting and coach mark as the old build wrote it', () => {
    const raw = JSON.parse(fixture.localStorage[SAVE_KEY]!) as { chapters: Record<string, Record<string, unknown>>; seenCoach: string[] };
    const store = new SaveStore(SAVE_KEY, slot());
    for (const [id, rec] of Object.entries(raw.chapters)) expect(store.chapter(id), id).toMatchObject(rec);
    for (const id of fixture.expect.cleared) expect(store.isCleared(id), id).toBe(true);
    for (const id of fixture.expect.notCleared) expect(store.isCleared(id), id).toBe(false);
    for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(store.chapter(id).bestTimeMs).toBe(ms);
    expect(store.settings).toMatchObject(fixture.expect.settings);
    expect(store.value.seenCoach).toEqual(raw.seenCoach); // the veteran rule fired once, on the old build, and never again
  });

  it('gains Chapter XVI as unplayed: no clear, no attempts, and a board of "N of 16" that counts it', () => {
    // 15 when Chapter XVI was listed; 16 since Chapter VII's unlock on 2026-09-29 (D-278).
    const store = new SaveStore(SAVE_KEY, slot());
    expect(store.isCleared('ffx2-ixion-djose')).toBe(false);
    expect(store.chapter('ffx2-ixion-djose')).toMatchObject({ cleared: false, attempts: 0, bestTimeMs: null });
    const tiles = buildChapterTiles(store);
    const ixion = tiles.find((t) => t.id === 'ffx2-ixion-djose')!;
    expect([ixion.playable, ixion.cleared, ixion.numeral]).toEqual([true, false, 'XVI']);
    const before = boardProgress(tiles, 0);
    expect([before.beaten, before.total]).toEqual([fixture.expect.cleared.length, 16]);

    store.recordAttempt('ffx2-ixion-djose');
    store.recordClear('ffx2-ixion-djose', 293_000, 38);
    const after = boardProgress(buildChapterTiles(store), 0);
    expect([after.beaten, after.total]).toEqual([fixture.expect.cleared.length + 1, 16]);
  });

  it('survives a save and a reload with the new clear and the old records side by side', () => {
    const s = slot();
    const store = new SaveStore(SAVE_KEY, s);
    store.recordClear('ffx2-ixion-djose', 293_000, 38);
    store.save();
    const again = new SaveStore(SAVE_KEY, s);
    expect(again.isCleared('ffx2-ixion-djose')).toBe(true);
    for (const id of fixture.expect.cleared) expect(again.isCleared(id), id).toBe(true);
    expect(again.settings).toMatchObject(fixture.expect.settings);
  });
});
