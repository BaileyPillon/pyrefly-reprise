/**
 * Listing Mirror Aeons (Chapter XXVII, FFX; 2026-10-15, on Bailey's word that it "needs to go live over night and not be hidden") against a save written by the LIVE build before it
 * (release 37.1, main f4244e1f; `tests/fixtures/saves/release-37.1.json`, exported from that build's own SaveStore, see the fixture's `_note`): **the save schema does not change**.
 * `SaveData.chapters` is a free-form `Record<string, ChapterRecord>` keyed by the chapter id, so the new chapter's record is created at its first attempt like every listed chapter's, and
 * `src/app/SaveData.ts` is untouched (no field, no version, no migration). What this pins:
 *
 * - the live blob loads unchanged, every record, best time, setting and coach mark as the old build wrote it, and the new chapter is absent from it;
 * - the board gains the card (XXVII, FFX, playable, last in the FFX group) and counts it: "N of 19";
 * - a clear is recorded under the new id with the SAME record fields as any other chapter's, a save and a reload keep the old records beside it, and the blob's top-level shape and version are the old build's.
 *
 * Game case: shared plumbing, both games (the save is untouched); the chapter itself is FFX only.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SAVE_KEY, SAVE_VERSION, SaveStore } from '../../src/app/SaveData.ts';
import { buildChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';
import { CHAPTER_IDS } from '../../src/data/encounters.ts';

interface Fixture {
  release: number;
  mainSha: string;
  expect: { cleared: string[]; notCleared: string[]; bestTimeMs: Record<string, number>; settings: Record<string, unknown> };
  localStorage: Record<string, string>;
}

const fixture = JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'saves', 'release-37.1.json'), 'utf8')) as Fixture;
const ID = 'mirror-aeons';
const rawOf = (): { version: number; chapters: Record<string, Record<string, unknown>>; seenCoach: string[] } & Record<string, unknown> => JSON.parse(fixture.localStorage[SAVE_KEY]!);

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

describe('a live release-37.1 save on the build that lists Mirror Aeons (XXVII)', () => {
  it('is a real release-37.1 blob under the save key, written before the chapter was listed, at the schema version the build still has', () => {
    expect([fixture.release, fixture.mainSha]).toEqual([37.1, 'f4244e1f']);
    expect(Object.keys(rawOf().chapters)).not.toContain(ID);
    expect(rawOf().version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(1);
  });

  it('loads unchanged and its progress stays: every record, best time, setting and coach mark as the old build wrote it', () => {
    const raw = rawOf();
    const store = new SaveStore(SAVE_KEY, slot());
    for (const [id, rec] of Object.entries(raw.chapters)) expect(store.chapter(id), id).toMatchObject(rec);
    for (const id of fixture.expect.cleared) expect(store.isCleared(id), id).toBe(true);
    for (const id of fixture.expect.notCleared) expect(store.isCleared(id), id).toBe(false);
    for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(store.chapter(id).bestTimeMs).toBe(ms);
    expect(store.settings).toMatchObject(fixture.expect.settings);
    expect(store.value.seenCoach).toEqual(raw.seenCoach);
  });

  it('gains the chapter unplayed, as XXVII on the FFX side after Sin, in a board of "N of 19" that counts it', () => {
    expect(CHAPTER_IDS).toHaveLength(19);
    expect(CHAPTER_IDS[CHAPTER_IDS.length - 1]).toBe(ID);
    const store = new SaveStore(SAVE_KEY, slot());
    expect(store.isCleared(ID)).toBe(false);
    expect(store.chapter(ID)).toMatchObject({ cleared: false, attempts: 0, bestTimeMs: null });
    const tiles = buildChapterTiles(store);
    const tile = tiles.find((t) => t.id === ID)!;
    expect([tile.playable, tile.cleared, tile.numeral, tile.game]).toEqual([true, false, 'XXVII', 'ffx']);
    const ffx = tiles.filter((t) => t.game === 'ffx').map((t) => t.id);
    expect(ffx[ffx.length - 1], 'the last card of the FFX group').toBe(ID);
    expect(ffx.slice(-3)).toEqual(['sin-fins-core', 'sin-face', ID]);
    const before = boardProgress(tiles, 0);
    expect([before.beaten, before.total]).toEqual([fixture.expect.cleared.length, 19]);
    store.recordAttempt(ID);
    store.recordClear(ID, 1_402_000, 190);
    const after = boardProgress(buildChapterTiles(store), 0);
    expect([after.beaten, after.total]).toEqual([fixture.expect.cleared.length + 1, 19]);
  });

  it('records the clear with the same fields every listed chapter has, and a save and a reload keep the new record and the old ones side by side', () => {
    const s = slot();
    const store = new SaveStore(SAVE_KEY, s);
    store.recordAttempt(ID);
    store.recordClear(ID, 1_402_000, 190);
    store.save();
    const written = JSON.parse(s.getItem(SAVE_KEY)!) as ReturnType<typeof rawOf>;
    const aClearedOldChapter = Object.keys(rawOf().chapters)[0]!;
    expect(Object.keys(written.chapters[ID]!).sort(), 'the same record fields as an older chapter').toEqual(Object.keys(written.chapters[aClearedOldChapter]!).sort());
    expect(Object.keys(written).sort(), 'the same top-level shape as the old build wrote').toEqual(Object.keys(rawOf()).sort());
    expect(written.version).toBe(SAVE_VERSION);
    const again = new SaveStore(SAVE_KEY, s);
    for (const id of [ID, ...fixture.expect.cleared]) expect(again.isCleared(id), id).toBe(true);
    expect(again.chapter(ID)).toMatchObject({ cleared: true, attempts: 1, bestTimeMs: 1_402_000, bestTurns: 190 });
    for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(again.chapter(id).bestTimeMs).toBe(ms);
    expect(again.settings).toMatchObject(fixture.expect.settings);
  });
});
