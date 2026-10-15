// @vitest-environment jsdom
/**
 * SAVE DATA: the ACCESSIBILITY tab's two settings (PR-0032; `src/app/saveAccess.ts`, `src/app/SaveData.ts`). **This lane touches the save schema**
 * (AGENTS.md "Release": `src/app/SaveData.ts`, the settings schema is the save-data class, which gets a deep review before the deploy). The Options
 * settings live in the save itself (`SaveData.settings`), not in a separate store, so this is the save schema's migration test.
 *
 * Both fields are ADDITIVE: `reduceFlashes: boolean` (default false) and `colourVision: 'off' | 'red-green' | 'blue-yellow'` (default 'off'), absent
 * from every blob written before release 44. No `SAVE_VERSION` bump, no one-time rule, no veteran rule (the `textSize` and `battleHelp` precedents).
 *
 *  - from the current schema (the newest stored export, `fixtures/saves/release-37.1.json`, and the schema of origin/r43-rc as its own defaults minus the
 *    two fields): every clear, best time, play time, coach id, flag and setting survives verbatim; the only additions are the two defaults;
 *  - from every older stored export: the two defaults arrive and nothing the older migrations did changes;
 *  - garbage in either field reads as the default and never reaches the layout (CHK-024);
 *  - what is stored is on <html> from construction, before any pause is opened (the round-03 blocker-5 lesson);
 *  - two open tabs: a stale tab flushing play time cannot undo the other tab's choice, in either direction (`saveMerge.ts` merges settings per key);
 *  - a build that does not know the fields keeps them through a load and a save (rollback, a stale second tab on an old bundle).
 *
 * Game case: both (shared plumbing).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { SAVE_KEY, SaveStore, defaultSettings, migrate, type SaveData } from '../../src/app/SaveData.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';
import { COLOUR_VISION_MODES, isColourVision, migrateAccess } from '../../src/app/saveAccess.ts';
import { readColourVision, readReduceFlashes } from '../../src/app/accessFlags.ts';

const FIXTURES = resolve(__dirname, '..', 'fixtures', 'saves');
const NEW_KEYS = ['colourVision', 'reduceFlashes'];

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
  const s = new Slot();
  if (raw !== undefined) s.setItem(SAVE_KEY, raw);
  return s;
};
const blobOf = (file: string): string => (JSON.parse(readFileSync(resolve(FIXTURES, file), 'utf8')) as { localStorage: Record<string, string> }).localStorage[SAVE_KEY]!;
const html = (): HTMLElement => document.documentElement;

afterEach(() => {
  applyComfort({});
});

describe('the new fields: shape and defaults', () => {
  it('defaults: REDUCE FLASHES off, COLOUR VISION off', () => {
    const d = defaultSettings();
    expect(d.reduceFlashes).toBe(false);
    expect(d.colourVision).toBe('off');
  });

  it('the settings key set is exactly the old schema plus the two fields (nothing else was added to the save)', () => {
    const OLD = [
      'advisorVisible', 'battleHelp', 'ffx2Atb', 'ffx2AtbMigrated', 'fxBreath', 'fxDof', 'fxEdges', 'fxFog', 'fxFraming', 'fxHero', 'fxKo', 'fxLight',
      'fxLiving', 'fxSphere', 'fxSpectacle', 'fxSplash', 'guideVisible', 'intentVisible', 'lowEffects', 'masterVolume', 'musicVolume',
      'pausePanelsHidden', 'reduceMotion', 'sfxBalanceMigrated', 'sfxVolume', 'skipSeenCutscenes', 'textSize', 'textSpeed',
    ];
    expect(Object.keys(defaultSettings()).sort()).toEqual([...OLD, ...NEW_KEYS].sort());
  });

  it('the modes, in the order the row steps through them', () => {
    expect([...COLOUR_VISION_MODES]).toEqual(['off', 'red-green', 'blue-yellow']);
  });
});

describe('from the current schema: nothing it had changes, the two defaults arrive', () => {
  it('release-37.1.json (the newest stored export): every field survives verbatim, and the only additions are the two', () => {
    const raw = blobOf('release-37.1.json');
    const before = JSON.parse(raw) as SaveData;
    expect(before.settings).not.toHaveProperty('reduceFlashes');
    expect(before.settings).not.toHaveProperty('colourVision');
    const store = new SaveStore(SAVE_KEY, slotWith(raw));
    const after = store.snapshot();
    expect(after.chapters).toEqual(before.chapters);
    expect(after.seenCoach).toEqual(before.seenCoach);
    expect(after.unlocked).toEqual(before.unlocked);
    expect(after.flags).toEqual(before.flags);
    for (const [k, v] of Object.entries(before.settings)) expect(after.settings[k as keyof typeof after.settings], k).toEqual(v);
    expect(Object.keys(after.settings).filter((k) => !(k in before.settings)).sort()).toEqual(NEW_KEYS);
    expect(after.settings.reduceFlashes).toBe(false);
    expect(after.settings.colourVision).toBe('off');
  });

  it('the schema of origin/r43-rc (its defaults without the two fields, changed as a player would): the same', () => {
    const old = { ...defaultSettings(), masterVolume: 0.5, textSize: 1.3, reduceMotion: true, lowEffects: true, ffx2Atb: 'active', ffx2AtbSpeed: 'fast', guideVisible: false } as Record<string, unknown>;
    for (const k of NEW_KEYS) delete old[k];
    const blob = {
      version: 1,
      updatedAt: 1760000000000,
      chapters: { 'seymour-flux': { id: 'seymour-flux', cleared: true, bestTimeMs: 480000, bestTurns: 27, attempts: 4, playTimeMs: 900000 } },
      unlocked: ['bestiary-x'],
      settings: old,
      seenCoach: ['briefing'],
      flags: { introSeen: true },
    };
    const after = migrate(JSON.parse(JSON.stringify(blob)) as Partial<SaveData>);
    expect(after.chapters).toEqual(blob.chapters);
    expect(after.unlocked).toEqual(blob.unlocked);
    expect(after.seenCoach).toEqual(blob.seenCoach);
    expect(after.flags).toEqual(blob.flags);
    for (const [k, v] of Object.entries(old)) expect(after.settings[k as keyof typeof after.settings], k).toEqual(v);
    expect(Object.keys(after.settings).filter((k) => !(k in old)).sort()).toEqual(NEW_KEYS);
  });

  it('every stored export upgrades: the two defaults arrive, and the clears and best times are what they were', () => {
    const files = readdirSync(FIXTURES).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThanOrEqual(12);
    for (const f of files) {
      const raw = blobOf(f);
      const before = JSON.parse(raw) as SaveData;
      const after = migrate(JSON.parse(raw) as Partial<SaveData>);
      expect(after.settings.reduceFlashes, f).toBe(false);
      expect(after.settings.colourVision, f).toBe('off');
      for (const [id, rec] of Object.entries(before.chapters)) expect(after.chapters[id]?.cleared, `${f} ${id}`).toBe(rec.cleared);
      expect(after.unlocked, f).toEqual(before.unlocked);
    }
  });

  it('migrate is idempotent', () => {
    const once = migrate(JSON.parse(blobOf('release-37.1.json')) as Partial<SaveData>);
    expect(migrate(JSON.parse(JSON.stringify(once)) as Partial<SaveData>)).toEqual(once);
  });
});

describe('garbage in either field reads as the default', () => {
  const settingsOf = (patch: Record<string, unknown>): SaveData['settings'] => migrate({ version: 1, chapters: {}, settings: patch as never }).settings;

  it.each([['yes'], ['true'], [1], [0], [null], [{}], [[]], [undefined]])('reduceFlashes %p reads OFF', (v) => {
    expect(settingsOf({ reduceFlashes: v }).reduceFlashes).toBe(false);
  });

  it.each([[true], [false]])('reduceFlashes %p is kept', (v) => {
    expect(settingsOf({ reduceFlashes: v }).reduceFlashes).toBe(v);
  });

  it.each([['red'], ['RED-GREEN'], ['off '], [''], [2], [null], [{}], [true], [undefined], ['redgreen']])('colourVision %p reads OFF', (v) => {
    expect(settingsOf({ colourVision: v }).colourVision).toBe('off');
  });

  it.each([['off'], ['red-green'], ['blue-yellow']])('colourVision %p is kept', (v) => {
    expect(settingsOf({ colourVision: v }).colourVision).toBe(v);
  });

  it('migrateAccess coerces in place and never throws; the type guard agrees', () => {
    const s = { ...defaultSettings(), reduceFlashes: 'x' as never, colourVision: 7 as never };
    expect(() => migrateAccess(s)).not.toThrow();
    expect(s.reduceFlashes).toBe(false);
    expect(s.colourVision).toBe('off');
    expect(isColourVision('red-green')).toBe(true);
    expect(isColourVision('green')).toBe(false);
  });
});

describe('written, read back, and applied on the first frame', () => {
  it('a choice survives a reload; the second store reads it and <html> carries it before any pause is opened', () => {
    const slot = slotWith(blobOf('release-37.1.json'));
    const first = new SaveStore(SAVE_KEY, slot);
    first.setSettings({ reduceFlashes: true, colourVision: 'blue-yellow' });
    applyComfort({});
    expect(html().hasAttribute('data-reduce-flashes')).toBe(false);
    const second = new SaveStore(SAVE_KEY, slot);
    expect(second.settings.reduceFlashes).toBe(true);
    expect(second.settings.colourVision).toBe('blue-yellow');
    expect(html().hasAttribute('data-reduce-flashes'), 'REDUCE FLASHES is in force at construction').toBe(true);
    expect(html().dataset['colourVision'], 'so is COLOUR VISION').toBe('blue-yellow');
    expect(html().style.getPropertyValue('--cvd-gate-g'), 'with its colours').toBe('#00a6a6');
    expect(readReduceFlashes()).toBe(true);
    expect(readColourVision()).toBe('blue-yellow');
    const stored = JSON.parse(slot.getItem(SAVE_KEY)!) as SaveData;
    expect(stored.settings.reduceFlashes).toBe(true);
    expect(stored.settings.colourVision).toBe('blue-yellow');
    expect(stored.version, 'no SAVE_VERSION bump').toBe(1);
  });

  it('reset brings both back to OFF', () => {
    const store = new SaveStore(SAVE_KEY, slotWith());
    store.setSettings({ reduceFlashes: true, colourVision: 'red-green' });
    store.reset();
    expect(store.settings.reduceFlashes).toBe(false);
    expect(store.settings.colourVision).toBe('off');
  });

  it('with storage blocked (a private window) the settings hold in memory and nothing throws', () => {
    const store = new SaveStore(SAVE_KEY, null);
    expect(() => store.setSettings({ reduceFlashes: true, colourVision: 'red-green' })).not.toThrow();
    expect(store.settings.reduceFlashes).toBe(true);
    expect(readColourVision()).toBe('red-green');
  });

  it('the debug snapshot carries both', () => {
    const store = new SaveStore(SAVE_KEY, slotWith());
    store.setSettings({ colourVision: 'red-green' });
    expect(store.snapshot().settings).toMatchObject({ reduceFlashes: false, colourVision: 'red-green' });
  });
});

describe('two open tabs (CHK-024-LIVE-1: the last tab to write used to win)', () => {
  it('tab A turns both on; tab B, still in a fight, flushes its play time three times: A\'s choices are still there', () => {
    const slot = slotWith(blobOf('release-37.1.json'));
    const a = new SaveStore(SAVE_KEY, slot);
    const b = new SaveStore(SAVE_KEY, slot);
    a.setSettings({ reduceFlashes: true, colourVision: 'red-green' });
    for (let i = 0; i < 3; i++) {
      b.addPlayTime('seymour-flux', 1000);
      b.flushPlayTime();
    }
    const stored = JSON.parse(slot.getItem(SAVE_KEY)!) as SaveData;
    expect(stored.settings.reduceFlashes, 'A\'s REDUCE FLASHES').toBe(true);
    expect(stored.settings.colourVision, 'A\'s COLOUR VISION').toBe('red-green');
    expect(stored.chapters['seymour-flux']!.playTimeMs, 'and B\'s play time').toBeGreaterThanOrEqual(3000);
  });

  it('the other way: B changes a setting while A flushes play time', () => {
    const slot = slotWith(blobOf('release-37.1.json'));
    const a = new SaveStore(SAVE_KEY, slot);
    const b = new SaveStore(SAVE_KEY, slot);
    b.setSettings({ colourVision: 'blue-yellow', reduceFlashes: true });
    a.addPlayTime('seymour-flux', 2000);
    a.flushPlayTime();
    const stored = JSON.parse(slot.getItem(SAVE_KEY)!) as SaveData;
    expect(stored.settings.colourVision).toBe('blue-yellow');
    expect(stored.settings.reduceFlashes).toBe(true);
  });

  it('two different choices in two tabs both land', () => {
    const slot = slotWith();
    const a = new SaveStore(SAVE_KEY, slot);
    const b = new SaveStore(SAVE_KEY, slot);
    a.setSettings({ reduceFlashes: true });
    b.setSettings({ colourVision: 'red-green' });
    const stored = JSON.parse(slot.getItem(SAVE_KEY)!) as SaveData;
    expect(stored.settings.reduceFlashes).toBe(true);
    expect(stored.settings.colourVision).toBe('red-green');
  });
});

describe('rollback: a build that does not know the fields keeps them', () => {
  it('migrate keeps a setting key it has never heard of through a load, so the previous build\'s save() writes the two fields back', () => {
    // The previous build merged `{ ...defaults, ...raw.settings }`: an unknown key is spread in and written out again. This build does the same for a key
    // a later build may add, which is the property that makes a rollback or a stale tab on the old bundle safe for the two fields.
    const raw = { version: 1, chapters: {}, settings: { futureSetting: 7, reduceFlashes: true, colourVision: 'red-green' } };
    const after = migrate(raw as never) as unknown as { settings: Record<string, unknown> };
    expect(after.settings['futureSetting']).toBe(7);
    expect(after.settings['reduceFlashes']).toBe(true);
    expect(after.settings['colourVision']).toBe('red-green');
  });
});
