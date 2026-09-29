/**
 * Listing Sin's two chapters (XVII "Sin: the Fins and the Core", XVIII "Sin: the Face", 2026-09-29, D-279) against
 * a save written by the LIVE build before them (release 28, main 6ea8528f; `tests/fixtures/saves/release-28-main.json`,
 * exported from that build's own SaveStore in a fresh headless profile, see the fixture's `_note`): the save loads
 * unchanged, its progress stays (clears, best times, attempts, settings, coach marks), both new chapters arrive
 * unplayed, and the board counts them ("N of 17"). Shared plumbing, both games (`src/app/SaveData.ts` is untouched
 * by this branch); the chapters themselves are FFX only.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { buildChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';
import { CHAPTER_IDS } from '../../src/data/encounters.ts';

interface Fixture {
  release: number;
  mainSha: string;
  listedThen: string[];
  localStorage: Record<string, string>;
  expect: { cleared: string[]; notCleared: string[]; bestTimeMs: Record<string, number>; settings: Record<string, unknown> };
}

const fixture = JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'saves', 'release-28-main.json'), 'utf8')) as Fixture;
const SIN = ['sin-fins-core', 'sin-face'] as const;

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

describe('a live release-28 save on the build that lists Sin (XVII and XVIII)', () => {
  it('is a real release-28 blob under the save key, written when sixteen chapters were listed and no Sin', () => {
    expect([fixture.release, fixture.mainSha]).toEqual([28, '6ea8528f']);
    expect(fixture.listedThen).toHaveLength(16);
    expect(fixture.listedThen).toEqual(CHAPTER_IDS.filter((id) => !(SIN as readonly string[]).includes(id)));
    const raw = JSON.parse(fixture.localStorage[SAVE_KEY]!) as { chapters: Record<string, unknown> };
    for (const id of SIN) expect(Object.keys(raw.chapters)).not.toContain(id);
  });

  it('loads unchanged and its progress stays: every record, best time, setting and coach mark as the old build wrote it', () => {
    const raw = JSON.parse(fixture.localStorage[SAVE_KEY]!) as { chapters: Record<string, Record<string, unknown>>; seenCoach: string[] };
    const store = new SaveStore(SAVE_KEY, slot());
    for (const [id, rec] of Object.entries(raw.chapters)) expect(store.chapter(id), id).toMatchObject(rec);
    for (const id of fixture.expect.cleared) expect(store.isCleared(id), id).toBe(true);
    for (const id of fixture.expect.notCleared) expect(store.isCleared(id), id).toBe(false);
    for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(store.chapter(id).bestTimeMs).toBe(ms);
    expect(store.settings).toMatchObject(fixture.expect.settings);
    expect(store.value.seenCoach).toEqual(raw.seenCoach);
  });

  it('gains both Sin chapters unplayed, as XVII and XVIII on the FFX side, and a board of "N of 17" that counts them', () => {
    const store = new SaveStore(SAVE_KEY, slot());
    const tiles = buildChapterTiles(store);
    for (const [id, numeral] of [['sin-fins-core', 'XVII'], ['sin-face', 'XVIII']] as const) {
      expect(store.isCleared(id)).toBe(false);
      expect(store.chapter(id)).toMatchObject({ cleared: false, attempts: 0, bestTimeMs: null });
      const tile = tiles.find((t) => t.id === id)!;
      expect([tile.playable, tile.cleared, tile.numeral, tile.game]).toEqual([true, false, numeral, 'ffx']);
    }
    const before = boardProgress(tiles, 0);
    expect([before.beaten, before.total]).toEqual([fixture.expect.cleared.length, 17]);

    store.recordAttempt('sin-fins-core');
    store.recordClear('sin-fins-core', 1_402_000, 190);
    const after = boardProgress(buildChapterTiles(store), 0);
    expect([after.beaten, after.total]).toEqual([fixture.expect.cleared.length + 1, 17]);
  });

  it('survives a save and a reload with the new clears and the old records side by side', () => {
    const s = slot();
    const store = new SaveStore(SAVE_KEY, s);
    store.recordClear('sin-fins-core', 1_402_000, 190);
    store.recordClear('sin-face', 402_000, 77);
    store.save();
    const again = new SaveStore(SAVE_KEY, s);
    for (const id of [...SIN, ...fixture.expect.cleared]) expect(again.isCleared(id), id).toBe(true);
    for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(again.chapter(id).bestTimeMs).toBe(ms);
    expect(again.settings).toMatchObject(fixture.expect.settings);
  });
});
