/**
 * PORTABLE SAVES (ChatGPT point 9): the part that touches the store (`src/app/savePortFlow.ts`,
 * `SaveStore.replaceWith` in `src/app/SaveData.ts`).
 *
 * Pinned: an export reads and writes nothing; an import replaces the whole save, in memory and in the slot, and a
 * fresh store over the slot reads it; the old save is kept as an undo and an undo puts it back exactly; the undo is a
 * stack five deep, so two imports in a row do not cost the save the player started from; a store that will not write
 * (no storage, a throwing slot) is left exactly as it was with no undo step recorded; a refused file never reaches the
 * store; the file's save is copied in, not aliased; and an older tab's next write merges into the imported save the
 * way `saveMerge.ts` always merges (the known limit, written down).
 *
 * Game case: both (shared plumbing).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import { SAVE_KEY, SaveStore, type SaveData } from '../../src/app/SaveData.ts';
import { buildSaveFile, readSaveFile, type Accepted } from '../../src/app/savePort.ts';
import { MAX_UNDO_STEPS, commitImport, currentSummary, exportCurrent, undoImport, undoPreview, undoSteps } from '../../src/app/savePortFlow.ts';

class Slot {
  readonly items = new Map<string, string>();
  writes = 0;
  failWrites = false;
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.writes++;
    this.items.set(key, value);
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
}

const T0 = new Date(2026, 9, 28, 12, 0, 0).getTime();
let slot: Slot;
beforeEach(() => {
  slot = new Slot();
});

/** A store with `clears` chapters cleared and a distinctive master volume. */
function played(clears: string[], volume = 0.8, s: Slot = slot): SaveStore {
  const store = new SaveStore(SAVE_KEY, s);
  for (const id of clears) {
    store.recordAttempt(id);
    store.addPlayTime(id, 1000);
    store.recordClear(id, 120_000, 10);
  }
  store.setSettings({ masterVolume: volume });
  return store;
}

/** The file another device's save would arrive as, read back to an `Accepted`. */
function fileOf(store: SaveStore): Accepted {
  const r = readSaveFile(buildSaveFile(store.value, T0));
  if (!r.ok) throw new Error(r.code);
  return r;
}

const withoutStamp = (save: Readonly<SaveData>): Omit<SaveData, 'updatedAt'> => {
  const { updatedAt: _ignored, ...rest } = JSON.parse(JSON.stringify(save)) as SaveData;
  return rest;
};

describe('export reads and writes nothing', () => {
  it('no storage write, no change to the save, and the text is the save', () => {
    const store = played(['seymour-flux']);
    store.addPlayTime('seymour-flux', 400); // unflushed: in memory only
    const writes = slot.writes;
    const before = JSON.stringify(store.value);
    const out = exportCurrent(store, T0);
    if (!out.ok) throw new Error(out.detail);
    expect(slot.writes).toBe(writes);
    expect(JSON.stringify(store.value)).toBe(before);
    const back = readSaveFile(out.text);
    expect(back.ok && back.save.chapters['seymour-flux']?.playTimeMs).toBe(1400); // the unflushed 400 ms is in the file
    expect(out.filename).toBe('echoes-of-spira-save-2026-10-28.json');
    expect(out.summary.cleared).toBe(1);
  });
});

describe('a file is handed out only if it reads back', () => {
  it('a save with a value the reader would refuse (a volume that is not a number) is not turned into a file', () => {
    const store = played(['seymour-flux']);
    store.setSettings({ masterVolume: Number.NaN });
    const out = exportCurrent(store, T0);
    expect(out.ok).toBe(false);
    expect(!out.ok && out.detail).toBe('save.settings.masterVolume');
  });

  it('every save the store can make by its own methods exports', () => {
    const store = played(['seymour-flux', 'ffx2-bahamut']);
    store.unlock('a');
    store.markCoachSeen('briefing');
    store.setFlag('f', 'x');
    store.setSettings({ ffx2AtbSpeed: 'slow', textSize: 1.15, colourVision: 'red-green' });
    expect(exportCurrent(store, T0).ok).toBe(true);
    expect(exportCurrent(new SaveStore(SAVE_KEY, null), T0).ok).toBe(true); // a brand-new save too
  });
});

describe('a player with a save from any of the last releases can export it', () => {
  const names = ['release-20', 'release-25-main', 'release-28-main', 'release-29', 'release-30-sfx-b', 'release-30', 'release-31a-sfx-b', 'release-31a', 'release-33', 'release-34', 'release-35', 'release-37.1'];
  for (const name of names) {
    it(`${name}: loaded by the store, exported, and read back as the same save`, () => {
      const fixture = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'saves', `${name}.json`), 'utf8')) as { localStorage: Record<string, string> };
      const s = new Slot();
      s.setItem(SAVE_KEY, fixture.localStorage[SAVE_KEY]!);
      const store = new SaveStore(SAVE_KEY, s);
      const out = exportCurrent(store, T0);
      if (!out.ok) throw new Error(`${name}: ${out.detail}`);
      const back = readSaveFile(out.text);
      expect(back.ok && back.save).toEqual(store.snapshot());
    });
  }
});

describe('an import replaces the whole save', () => {
  it('in memory, in the slot, and in a fresh store over the slot', () => {
    const other = new Slot();
    const theirs = played(['seymour-flux', 'yunalesca', 'ffx2-bahamut'], 0.3, other);
    const mine = played(['braskas-final-aeon'], 0.9);
    expect(commitImport(mine, fileOf(theirs), T0 + 5000)).toBe(true);

    expect(Object.keys(mine.value.chapters).sort()).toEqual(['ffx2-bahamut', 'seymour-flux', 'yunalesca']);
    expect(mine.isCleared('braskas-final-aeon')).toBe(false);
    expect(mine.settings.masterVolume).toBe(0.3);
    expect(mine.value.updatedAt).toBe(T0 + 5000);

    const reloaded = new SaveStore(SAVE_KEY, slot);
    expect(withoutStamp(reloaded.value)).toEqual(withoutStamp(theirs.value));
    expect(reloaded.value.updatedAt).toBe(T0 + 5000);
  });

  it('writes the slot once, and the in-memory save only after that write held', () => {
    const mine = played(['braskas-final-aeon']);
    const writes = slot.writes;
    expect(commitImport(mine, fileOf(played(['seymour-flux'], 0.8, new Slot())), T0)).toBe(true);
    expect(slot.writes).toBe(writes + 1);
  });

  it('play time waiting to be flushed does not come back on top of the import', () => {
    const mine = played(['braskas-final-aeon']);
    mine.addPlayTime('braskas-final-aeon', 900); // unflushed
    commitImport(mine, fileOf(played(['seymour-flux'], 0.8, new Slot())), T0);
    const writes = slot.writes;
    mine.flushPlayTime();
    expect(slot.writes).toBe(writes); // nothing left to flush
    expect(mine.playTime('braskas-final-aeon')).toBe(0);
  });

  it('copies the file’s save in: the same file committed twice shares nothing with the store', () => {
    const file = fileOf(played(['seymour-flux'], 0.8, new Slot()));
    const a = played([]);
    commitImport(a, file, T0);
    a.chapter('seymour-flux').attempts = 99;
    a.setFlag('x', 1);
    expect(file.save.chapters['seymour-flux']?.attempts).toBe(1);
    expect(file.save.flags['x']).toBeUndefined();
    const b = played([], 0.8, new Slot());
    commitImport(b, file, T0);
    expect(b.chapter('seymour-flux').attempts).toBe(1);
  });

  it('later writes carry on from the imported save', () => {
    const mine = played(['braskas-final-aeon']);
    commitImport(mine, fileOf(played(['seymour-flux'], 0.8, new Slot())), T0);
    mine.recordClear('yunalesca', 100_000, 8);
    const reloaded = new SaveStore(SAVE_KEY, slot);
    expect(reloaded.isCleared('seymour-flux') && reloaded.isCleared('yunalesca')).toBe(true);
    expect(reloaded.isCleared('braskas-final-aeon')).toBe(false);
  });
});

describe('the old save is kept as an undo', () => {
  it('an undo puts the save back exactly, in memory and in the slot', () => {
    const mine = played(['braskas-final-aeon'], 0.9);
    const before = withoutStamp(mine.value);
    commitImport(mine, fileOf(played(['seymour-flux'], 0.3, new Slot())), T0);
    expect(undoSteps(mine)).toBe(1);
    expect(undoPreview(mine)?.cleared).toBe(1);

    expect(undoImport(mine, T0 + 1000)).toBe(true);
    expect(withoutStamp(mine.value)).toEqual(before);
    expect(withoutStamp(new SaveStore(SAVE_KEY, slot).value)).toEqual(before);
    expect(undoSteps(mine)).toBe(0);
    expect(undoPreview(mine)).toBeNull();
    expect(undoImport(mine, T0)).toBe(false); // nothing left to undo
  });

  it('the stash includes play time that had not been written yet', () => {
    const mine = played(['braskas-final-aeon']);
    mine.addPlayTime('braskas-final-aeon', 700);
    commitImport(mine, fileOf(played(['seymour-flux'], 0.8, new Slot())), T0);
    undoImport(mine, T0);
    expect(mine.playTime('braskas-final-aeon')).toBe(1700);
  });

  it('two imports in a row can both be undone, back to the save the player started from', () => {
    const mine = played(['braskas-final-aeon'], 0.9);
    const original = withoutStamp(mine.value);
    commitImport(mine, fileOf(played(['seymour-flux'], 0.3, new Slot())), T0);
    const afterFirst = withoutStamp(mine.value);
    commitImport(mine, fileOf(played(['yunalesca'], 0.2, new Slot())), T0 + 1);
    expect(undoSteps(mine)).toBe(2);
    undoImport(mine, T0 + 2);
    expect(withoutStamp(mine.value)).toEqual(afterFirst);
    undoImport(mine, T0 + 3);
    expect(withoutStamp(mine.value)).toEqual(original);
  });

  it(`keeps at most ${MAX_UNDO_STEPS} steps: the oldest goes first`, () => {
    const mine = played(['braskas-final-aeon'], 0.9);
    for (let i = 0; i < MAX_UNDO_STEPS + 2; i++) {
      commitImport(mine, fileOf(played([`chapter-${i}`], 0.8, new Slot())), T0 + i);
    }
    expect(undoSteps(mine)).toBe(MAX_UNDO_STEPS);
    for (let i = 0; i < MAX_UNDO_STEPS; i++) expect(undoImport(mine, T0)).toBe(true);
    expect(undoImport(mine, T0)).toBe(false);
  });

  it('an undo stack belongs to its store: another store has none', () => {
    const mine = played(['braskas-final-aeon']);
    commitImport(mine, fileOf(played(['seymour-flux'], 0.8, new Slot())), T0);
    expect(undoSteps(played([], 0.8, new Slot()))).toBe(0);
  });

  it('is in memory only: no extra key in the slot, and a reload starts with no undo', () => {
    const mine = played(['braskas-final-aeon']);
    commitImport(mine, fileOf(played(['seymour-flux'], 0.8, new Slot())), T0);
    expect([...slot.items.keys()]).toEqual([SAVE_KEY]);
    expect(undoSteps(new SaveStore(SAVE_KEY, slot))).toBe(0);
  });
});

describe('a store that will not write is left exactly as it was', () => {
  it('a slot that throws: false, no change, no undo step', () => {
    const mine = played(['braskas-final-aeon'], 0.9);
    const before = JSON.stringify(mine.value);
    const stored = slot.getItem(SAVE_KEY);
    slot.failWrites = true;
    expect(commitImport(mine, fileOf(played(['seymour-flux'], 0.3, new Slot())), T0)).toBe(false);
    expect(JSON.stringify(mine.value)).toBe(before);
    expect(slot.getItem(SAVE_KEY)).toBe(stored);
    expect(undoSteps(mine)).toBe(0);
    expect(mine.settings.masterVolume).toBe(0.9);
  });

  it('no storage at all: false, no change', () => {
    const mine = new SaveStore(SAVE_KEY, null);
    mine.recordClear('braskas-final-aeon', 100_000, 9);
    const before = JSON.stringify(mine.value);
    expect(commitImport(mine, fileOf(played(['seymour-flux'], 0.8, new Slot())), T0)).toBe(false);
    expect(JSON.stringify(mine.value)).toBe(before);
    expect(undoSteps(mine)).toBe(0);
  });

  it('an undo whose write fails keeps its step and changes nothing', () => {
    const mine = played(['braskas-final-aeon'], 0.9);
    commitImport(mine, fileOf(played(['seymour-flux'], 0.3, new Slot())), T0);
    const imported = JSON.stringify(mine.value);
    slot.failWrites = true;
    expect(undoImport(mine, T0)).toBe(false);
    expect(JSON.stringify(mine.value)).toBe(imported);
    expect(undoSteps(mine)).toBe(1);
    slot.failWrites = false;
    expect(undoImport(mine, T0)).toBe(true);
  });
});

describe('a refused file never reaches the store', () => {
  it('reading is pure: a damaged file leaves the store and the slot untouched', () => {
    const mine = played(['braskas-final-aeon'], 0.9);
    const before = JSON.stringify(mine.value);
    const stored = slot.getItem(SAVE_KEY);
    const writes = slot.writes;
    const bad = buildSaveFile(played(['seymour-flux'], 0.3, new Slot()).value, T0).replace('"attempts": 1', '"attempts": 8');
    expect(readSaveFile(bad).ok).toBe(false);
    expect(JSON.stringify(mine.value)).toBe(before);
    expect(slot.getItem(SAVE_KEY)).toBe(stored);
    expect(slot.writes).toBe(writes);
    expect(undoSteps(mine)).toBe(0);
  });
});

describe('the summary the page shows', () => {
  it('currentSummary is the numbers of the live save', () => {
    const mine = played(['seymour-flux', 'yunalesca']);
    expect(currentSummary(mine)).toMatchObject({ cleared: 2, playTimeMs: 2000 });
  });
});

describe('two open tabs: the known limit', () => {
  it('an older tab’s next write merges its copy into the imported save (clears are OR-ed), as every two-tab write does', () => {
    const tabA = played(['braskas-final-aeon'], 0.9);
    const tabB = new SaveStore(SAVE_KEY, slot); // an older tab, open on the same slot
    commitImport(tabA, fileOf(played(['seymour-flux'], 0.3, new Slot())), T0);
    tabB.recordAttempt('yunalesca'); // tab B's next write
    const merged = new SaveStore(SAVE_KEY, slot);
    expect(merged.isCleared('seymour-flux')).toBe(true); // the import survives
    expect(merged.settings.masterVolume).toBe(0.3); // tab B never changed a setting, so the imported one stands
    expect(merged.isCleared('braskas-final-aeon')).toBe(true); // ...and the older tab's clear flows back in
  });
});
