/**
 * D-293 (Bailey, 2026-09-29 ~23:00 EDT, "yes, all your recommendations"): SFX balance b, effects
 * +6 dB against the D-210 default, is the default. A new profile gets 0.70; an existing save whose
 * SFX level is exactly D-210's untouched default (0.35) moves to 0.70 once; a level the player set
 * is kept exactly (`src/app/saveSfxBalance.ts`, preflight `docs/plans/sfx-b-review.md`).
 *
 * Fixtures: saves written by the release-29, 30 and 31a builds' own SaveStore (see each file's
 * `_note`): every other setting, every clear, best time, attempt and seen line survives.
 *
 * Game case: both (shared mixer default and save plumbing; CHK-020, CHK-024).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SAVE_KEY, SaveStore, defaultSave, defaultSettings, migrate, type SaveData } from '../../src/app/SaveData.ts';
import { PRE_D210_SFX_VOLUME } from '../../src/app/saveSfxBalance.ts';
import { D210_SFX_VOLUME, SFX_DEFAULT_VOLUME } from '../../src/audio/sfxMix.ts';

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
const slotWith = (raw?: string): Slot => {
  const slot = new Slot();
  if (raw !== undefined) slot.setItem(SAVE_KEY, raw);
  return slot;
};

/** A blob as a pre-D-293 build wrote it: every setting, no marker. */
function oldBlob(sfxVolume: unknown): Partial<SaveData> {
  const settings: Record<string, unknown> = { ...defaultSettings(), sfxVolume };
  delete settings.sfxBalanceMigrated;
  return { version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings: settings as unknown as SaveData['settings'], seenCoach: ['briefing'], flags: {} };
}

describe('D-293: the SFX balance default and its one-time migration', () => {
  it('a new profile gets balance b (0.70) and the marker', () => {
    expect(SFX_DEFAULT_VOLUME).toBe(0.7);
    expect(defaultSettings()).toMatchObject({ sfxVolume: 0.7, sfxBalanceMigrated: true });
    expect(defaultSave().settings.sfxVolume).toBe(0.7);
    const store = new SaveStore(SAVE_KEY, slotWith());
    expect(store.settings).toMatchObject({ sfxVolume: 0.7, sfxBalanceMigrated: true });
    expect(migrate({}).settings).toMatchObject({ sfxVolume: 0.7, sfxBalanceMigrated: true });
  });

  it('an old save whose SFX level is D-210\'s untouched default moves to 0.70, once', () => {
    const out = migrate(oldBlob(D210_SFX_VOLUME));
    expect(out.settings).toMatchObject({ sfxVolume: 0.7, sfxBalanceMigrated: true });
    expect(migrate(JSON.parse(JSON.stringify(out)) as Partial<SaveData>).settings.sfxVolume).toBe(0.7);
  });

  it('a level the player set is kept exactly, whatever it is', () => {
    for (const v of [0, 0.1, 0.25, 0.3, 0.4, 0.45, 0.6, 0.65, 0.7, 0.9, 1]) {
      const out = migrate(oldBlob(v));
      expect(out.settings.sfxVolume).toBe(v);
      expect(out.settings.sfxBalanceMigrated).toBe(true);
    }
  });

  it('a save older than the setting keeps the level it was playing at (0.9, D-210\'s rule)', () => {
    for (const v of [undefined, null, 'loud', Number.NaN, Number.POSITIVE_INFINITY]) {
      const blob = oldBlob(v);
      if (v === undefined) delete (blob.settings as unknown as Record<string, unknown>).sfxVolume;
      expect(migrate(blob).settings.sfxVolume).toBe(PRE_D210_SFX_VOLUME);
    }
  });

  it('after the upgrade a player who picks 0.35 keeps it on every load', () => {
    const slot = slotWith(JSON.stringify(oldBlob(D210_SFX_VOLUME)));
    const first = new SaveStore(SAVE_KEY, slot);
    expect(first.settings.sfxVolume).toBe(0.7);
    first.setSettings({ sfxVolume: 0.35 });
    for (let i = 0; i < 3; i++) expect(new SaveStore(SAVE_KEY, slot).settings.sfxVolume).toBe(0.35);
    expect(JSON.parse(slot.getItem(SAVE_KEY)!).settings.sfxBalanceMigrated).toBe(true);
  });

  it('two tabs on the new build: one tab\'s choice survives the other tab\'s write (saveMerge)', () => {
    const slot = slotWith(JSON.stringify(oldBlob(D210_SFX_VOLUME)));
    const a = new SaveStore(SAVE_KEY, slot);
    const b = new SaveStore(SAVE_KEY, slot);
    b.setSettings({ sfxVolume: 0.35 });
    a.recordClear('seymour-flux', 600000, 30);
    const again = new SaveStore(SAVE_KEY, slot);
    expect(again.settings.sfxVolume).toBe(0.35);
    expect(again.isCleared('seymour-flux')).toBe(true);
  });

  it('the first write after the upgrade stores the move and the marker', () => {
    const pre = JSON.stringify(oldBlob(D210_SFX_VOLUME));
    const slot = slotWith(pre);
    new SaveStore(SAVE_KEY, slot).recordAttempt('ffx2-bahamut');
    const stored = JSON.parse(slot.getItem(SAVE_KEY)!) as SaveData;
    expect(stored.settings).toMatchObject({ sfxVolume: 0.7, sfxBalanceMigrated: true });
  });
});

interface Fixture {
  release: string | number;
  expect: { cleared: string[]; notCleared: string[]; bestTimeMs: Record<string, number> };
  localStorage: Record<string, string>;
}
const load = (name: string): Fixture =>
  JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'saves', name), 'utf8')) as Fixture;

describe.each([
  ['release-29.json', 0.6, 0.6],
  ['release-30-sfx-b.json', 0.45, 0.45],
  ['release-31a-sfx-b.json', 0.35, 0.7],
])('D-293 upgrade of %s (CHK-024)', (file, stored, expected) => {
  const fx = load(file);
  const raw = fx.localStorage[SAVE_KEY]!;
  const before = JSON.parse(raw) as SaveData;

  it(`stored SFX ${stored} reads ${expected}`, () => {
    expect(before.settings.sfxVolume).toBe(stored);
    expect(before.settings.sfxBalanceMigrated).toBeUndefined();
    const store = new SaveStore(SAVE_KEY, slotWith(raw));
    expect(store.settings.sfxVolume).toBe(expected);
    expect(store.settings.sfxBalanceMigrated).toBe(true);
  });

  it('every other stored setting, every chapter record and every seen line is kept', () => {
    const store = new SaveStore(SAVE_KEY, slotWith(raw));
    for (const [k, v] of Object.entries(before.settings)) {
      if (k !== 'sfxVolume') expect([k, store.settings[k as keyof SaveData['settings']]]).toEqual([k, v]);
    }
    expect(store.value.chapters).toEqual(before.chapters);
    for (const id of fx.expect.cleared) expect(store.isCleared(id)).toBe(true);
    for (const id of fx.expect.notCleared) expect(store.isCleared(id)).toBe(false);
    for (const [id, ms] of Object.entries(fx.expect.bestTimeMs)) expect(store.chapter(id).bestTimeMs).toBe(ms);
    expect(store.value.seenCoach).toEqual(before.seenCoach);
    expect(store.value.unlocked).toEqual(before.unlocked);
    expect(store.value.flags).toEqual(before.flags);
  });

  it('survives a save and a reload unchanged', () => {
    const slot = slotWith(raw);
    new SaveStore(SAVE_KEY, slot).save();
    const again = new SaveStore(SAVE_KEY, slot);
    expect(again.settings.sfxVolume).toBe(expected);
    expect(again.value.chapters).toEqual(before.chapters);
    expect(again.settings).toEqual(new SaveStore(SAVE_KEY, slotWith(raw)).settings);
    expect(again.settings.ffx2Atb).toBe(before.settings.ffx2Atb);
  });
});
