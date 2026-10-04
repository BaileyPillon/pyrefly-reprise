/**
 * The rename to "Echoes of Spira" (release 38, Bailey 2026-10-04) must not cost a player a save. Release 38 changes the
 * words a player reads; it renames no storage key. This file pins that against a save written by the LIVE release 37.1
 * build (main f4244e1f, bundle index-DhiL5vEz.js; `tests/fixtures/saves/release-37.1.json`, written by that build's own
 * SaveStore in a fresh headless profile on the live site, see the fixture's `_note`): the save is found under the key
 * 37.1 wrote it to, loads unchanged, keeps every clear, best time, attempt, play time, coach mark and setting, shows
 * on the board, survives a save and a reload, and no second key appears.
 *
 * The keys are written out as LITERALS here, not imported, so that a renamed `SAVE_KEY` fails this file instead of
 * moving the test along with it. Chapter-by-chapter upgrades of older saves live in the sibling `save-*` tests.
 *
 * Game case: both. Shared plumbing (`src/app/SaveData.ts` is untouched by this branch); the fixture holds FFX, FFX-2
 * and Chapter IX Yojimbo progress, and the board counts all of them.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SAVE_KEY, SAVE_VERSION, SaveStore, migrate, type SaveData } from '../../src/app/SaveData.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { buildChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';

/** The keys release 37.1 wrote, as literals. */
const LIVE_SAVE_KEY = 'pyrefly-reprise:save:v1';
const LIVE_EXPERIMENTS_KEY = 'pyrefly-reprise:experiments:v1';

interface Fixture {
  release: number;
  mainSha: string;
  bundle: string;
  localStorage: Record<string, string>;
  expect: {
    cleared: string[];
    notCleared: string[];
    bestTimeMs: Record<string, number>;
    bestTurns: Record<string, number>;
    attempts: Record<string, number>;
    playTimeMs: Record<string, number>;
    seenCoach: string[];
    settings: Record<string, unknown>;
  };
}

const fixture = JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'saves', 'release-37.1.json'), 'utf8')) as Fixture;
const raw = fixture.localStorage[LIVE_SAVE_KEY]!;

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

/** A slot holding the 37.1 save under the literal key, the way the live site's localStorage held it. */
const slot = (): Slot => {
  const s = new Slot();
  s.setItem(LIVE_SAVE_KEY, raw);
  return s;
};

/** The same assertions after a load and after a reload: nothing 37.1 wrote may be lost. */
function expectProgressKept(store: SaveStore): void {
  const blob = JSON.parse(raw) as SaveData;
  for (const [id, rec] of Object.entries(blob.chapters)) expect(store.value.chapters[id], id).toMatchObject(rec);
  for (const id of fixture.expect.cleared) expect(store.isCleared(id), id).toBe(true);
  for (const id of fixture.expect.notCleared) expect(store.isCleared(id), id).toBe(false);
  for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(store.value.chapters[id]?.bestTimeMs, id).toBe(ms);
  for (const [id, n] of Object.entries(fixture.expect.bestTurns)) expect(store.value.chapters[id]?.bestTurns, id).toBe(n);
  for (const [id, n] of Object.entries(fixture.expect.attempts)) expect(store.value.chapters[id]?.attempts, id).toBe(n);
  for (const [id, ms] of Object.entries(fixture.expect.playTimeMs)) expect(store.playTime(id), id).toBe(ms);
  expect(store.value.seenCoach).toEqual(fixture.expect.seenCoach);
  expect(store.settings).toMatchObject(fixture.expect.settings);
}

describe('the storage keys are exactly the ones release 37.1 wrote', () => {
  it('SAVE_KEY and EXPERIMENTS_KEY are unchanged, and the fixture holds the save under the first', () => {
    expect(SAVE_KEY).toBe(LIVE_SAVE_KEY);
    expect(EXPERIMENTS_KEY).toBe(LIVE_EXPERIMENTS_KEY);
    expect(Object.keys(fixture.localStorage)).toEqual([LIVE_SAVE_KEY]);
  });

  it('a store told to read any other key finds nothing, so the key is what carries the progress', () => {
    const lost = new SaveStore('echoes-of-spira:save:v1', slot());
    expect(lost.isCleared('seymour-flux')).toBe(false);
    expect(lost.totalPlayTime()).toBe(0);
  });
});

describe('a live release 37.1 save on the release 38 build (the rename)', () => {
  it('is a real 37.1 blob: version 1, three clears across the games, two attempted chapters, the nine eye-candy parts', () => {
    expect([fixture.release, fixture.mainSha, fixture.bundle]).toEqual([37.1, 'f4244e1f', 'index-DhiL5vEz.js']);
    const blob = JSON.parse(raw) as SaveData;
    expect(blob.version).toBe(1);
    expect(fixture.expect.cleared).toEqual(['seymour-flux', 'ffx2-bahamut', 'yojimbo-cavern']);
    expect(fixture.expect.notCleared).toEqual(['ffx2-ixion-djose', 'sin-fins-core']);
    for (const part of ['fxDof', 'fxFog', 'fxEdges', 'fxBreath', 'fxKo', 'fxFraming', 'fxHero', 'fxSphere', 'fxSplash']) {
      expect(typeof (blob.settings as unknown as Record<string, unknown>)[part], part).toBe('boolean');
    }
  });

  it('is found under the key it was written to and loads with every clear, time, attempt, coach mark and setting', () => {
    expectProgressKept(new SaveStore(undefined, slot())); // the DEFAULT key must be the literal one
  });

  it('shows on the board: three chapters beaten of the eighteen', () => {
    const store = new SaveStore(undefined, slot());
    const board = boardProgress(buildChapterTiles(store), 0);
    expect([board.beaten, board.total]).toEqual([3, 18]);
  });

  it('survives a save and a reload under the same key, with a new clear beside the old records and no second key', () => {
    const s = slot();
    const store = new SaveStore(undefined, s);
    store.recordAttempt('sin-face');
    store.recordClear('sin-face', 402_000, 77);
    expect(store.save()).toBe(true);

    expect([...s.items.keys()]).toEqual([LIVE_SAVE_KEY]); // nothing was written to a renamed key
    const again = new SaveStore(undefined, s);
    expectProgressKept(again);
    expect(again.isCleared('sin-face')).toBe(true);
    expect(again.value.chapters['sin-face']).toMatchObject({ bestTimeMs: 402_000, bestTurns: 77 });
  });

  it('migrates to itself: the version stays 1 and a second pass changes nothing', () => {
    expect(SAVE_VERSION).toBe(1);
    const once = migrate(JSON.parse(raw) as Partial<SaveData>);
    expect(once.version).toBe(1);
    expect(migrate(JSON.parse(JSON.stringify(once)) as Partial<SaveData>)).toEqual(once);
    expect(once.settings).toMatchObject(fixture.expect.settings);
  });
});
