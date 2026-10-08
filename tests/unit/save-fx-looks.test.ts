// @vitest-environment jsdom
/**
 * Eye-candy D's three look rows, the save half (save-data class). Bailey, 2026-09-29 ~23:45 EDT:
 * "Ok yes I picked D so all 3 together however in the settings I want to be able to turn each one
 * off. Default will be on. Please."
 *
 * `fxLight` (CINEMA LIGHT, option A), `fxLiving` (LIVING PAINTINGS, B) and `fxSpectacle` (BATTLE
 * SPECTACLE, C) are new `Settings` booleans, default ON. Saves written by the live release-29,
 * release-30 and release-31a builds themselves (`tests/fixtures/saves/`, none of them has the
 * fields) must keep every clear, best time, play time, coach id, flag and setting they had, and read
 * all three looks as ON; `SAVE_VERSION` stays 1. A non-boolean never reaches the look (CHK-024). A
 * row written OFF persists across a reload, and the saved choice switches the live look through
 * `applyComfort`, except on a page whose URL named `?fx=` (tests and captures).
 *
 * Game case: both (shared plumbing).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { SAVE_KEY, SAVE_VERSION, SaveStore, defaultSettings, migrate, type SaveData } from '../../src/app/SaveData.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';
import { FX_LOOK_ROWS, fxLooksOf, migrateFxLooks } from '../../src/app/fxLooks.ts';
import { FX_PARTS } from '../../src/app/fxParts.ts';
import { EyeCandyState, eyeCandy, parseFxQuery } from '../../src/engine/fx/EyeCandy.ts';

interface Fixture {
  release: number | string;
  localStorage: Record<string, string>;
  expect: { cleared: string[]; notCleared: string[]; bestTimeMs: Record<string, number>; settings: Record<string, unknown> };
}
const load = (name: string): Fixture =>
  JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'saves', name), 'utf8')) as Fixture;
const FIXTURES = [
  ['release-29.json', 29],
  ['release-30.json', '30'],
  ['release-31a.json', '31a'],
] as const;

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
const LOOKS = ['fxLight', 'fxLiving', 'fxSpectacle'] as const;

afterEach(() => {
  applyComfort({ textSize: 1, reduceMotion: false, lowEffects: false, fxLight: true, fxLiving: true, fxSpectacle: true });
});

describe.each(FIXTURES)('a %s save upgrades with every look ON', (file, release) => {
  const fixture = load(file);
  const raw = fixture.localStorage[SAVE_KEY]!;

  it('is a real blob from that release, with none of the three fields', () => {
    expect(fixture.release).toBe(release);
    const parsed = JSON.parse(raw) as SaveData;
    for (const f of LOOKS) expect(parsed.settings).not.toHaveProperty(f);
    expect(parsed.version).toBe(SAVE_VERSION);
  });

  it('keeps everything else it had, verbatim; the only additions are the looks, their parts and TEXT SIZE', () => {
    const before = JSON.parse(raw) as SaveData;
    const store = new SaveStore(SAVE_KEY, slotWith(raw));
    const after = store.snapshot();
    for (const id of fixture.expect.cleared) expect(store.isCleared(id)).toBe(true);
    for (const id of fixture.expect.notCleared) expect(store.isCleared(id)).toBe(false);
    for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(store.chapter(id).bestTimeMs).toBe(ms);
    expect(after.version).toBe(1);
    expect(after.chapters).toEqual(before.chapters);
    expect(after.seenCoach).toEqual(before.seenCoach);
    expect(after.unlocked).toEqual(before.unlocked);
    expect(after.flags).toEqual(before.flags);
    for (const [k, v] of Object.entries(before.settings)) expect(after.settings[k as keyof typeof after.settings], k).toEqual(v);
    for (const [k, v] of Object.entries(fixture.expect.settings)) expect(after.settings[k as keyof typeof after.settings], k).toEqual(v);
    const added = Object.keys(after.settings).filter((k) => !(k in before.settings)).sort();
    // D-317's nine parts arrive too (`fxParts.ts`): no look of these saves is OFF, so every part comes in ON.
    // (and, since 39.5, the two front-end choices at their defaults: `saveFrontend.ts`)
    expect(added).toEqual([...FX_PARTS.map((p) => p.field), 'fxLight', 'fxLiving', 'fxSpectacle', 'sfxBalanceMigrated', 'textSize', 'titleArt', 'chapterSelectMusic'].sort());
    for (const f of LOOKS) expect(after.settings[f], f).toBe(true);
    for (const p of FX_PARTS) expect(after.settings[p.field], p.field).toBe(true);
  });

  it('switches every look on at construction, and a row written OFF survives a reload', () => {
    const slot = slotWith(raw);
    const store = new SaveStore(SAVE_KEY, slot);
    expect(eyeCandy.on).toEqual({ a: true, b: true, c: true });
    store.setSettings({ fxLiving: false });
    expect(eyeCandy.on).toEqual({ a: true, b: false, c: true });
    const reread = new SaveStore(SAVE_KEY, slot);
    expect(reread.settings.fxLiving).toBe(false);
    expect(reread.settings.fxLight).toBe(true);
    expect(eyeCandy.on.b).toBe(false);
    const stored = JSON.parse(slot.getItem(SAVE_KEY)!) as SaveData;
    expect(stored.chapters).toEqual((JSON.parse(raw) as SaveData).chapters);
  });

  it('migrates idempotently', () => {
    const once = migrate(JSON.parse(raw) as Partial<SaveData>);
    expect(migrate(JSON.parse(JSON.stringify(once)) as Partial<SaveData>)).toEqual(once);
  });
});

describe('the three fields', () => {
  const withSettings = (settings: Record<string, unknown>): SaveData => migrate({ version: 1, chapters: {}, settings: settings as never });

  it('default ON for a fresh profile', () => {
    const d = defaultSettings();
    for (const f of LOOKS) expect(d[f]).toBe(true);
  });

  it.each([['off'], [0], [1], [null], ['false'], [Number.NaN]])('a stored %p reads as ON (CHK-024)', (v) => {
    const s = withSettings({ fxLight: v, fxLiving: v, fxSpectacle: v }).settings;
    for (const f of LOOKS) expect(s[f], f).toBe(true);
  });

  it('a stored false is kept, each on its own', () => {
    const s = withSettings({ fxLight: false, fxLiving: true, fxSpectacle: false }).settings;
    expect([s.fxLight, s.fxLiving, s.fxSpectacle]).toEqual([false, true, false]);
    expect(fxLooksOf(s)).toEqual({ a: false, b: true, c: false });
  });

  it('migrateFxLooks coerces in place and leaves booleans alone', () => {
    const s: Record<string, unknown> = { fxLight: false, fxLiving: 'x' };
    migrateFxLooks(s);
    expect(s).toEqual({ fxLight: false, fxLiving: true, fxSpectacle: true });
    expect(FX_LOOK_ROWS.map((r) => [r.field, r.opt, r.key])).toEqual([
      ['fxLight', 'a', 'cinemaLight'],
      ['fxLiving', 'b', 'livingPaintings'],
      ['fxSpectacle', 'c', 'battleSpectacle'],
    ]);
  });
});

describe('the URL wins for one page load', () => {
  it('?fx=off stays off whatever the rows say; no ?fx= follows the rows live', () => {
    const url = new EyeCandyState(parseFxQuery('?fx=off'));
    url.applyLooks({ a: true, b: true, c: true });
    expect(url.on).toEqual({ a: false, b: false, c: false });
    const named = new EyeCandyState(parseFxQuery('?fx=a'));
    named.applyLooks({ a: false, b: true, c: true });
    expect(named.on).toEqual({ a: true, b: false, c: false });
    const rows = new EyeCandyState(parseFxQuery('?seed=3'));
    let changes = 0;
    rows.onChange(() => changes++);
    rows.applyLooks({ a: false, b: true, c: false });
    expect(rows.on).toEqual({ a: false, b: true, c: false });
    expect(changes).toBe(2);
    rows.applyLooks({ a: false, b: true, c: false });
    expect(changes, 'the same choice again changes nothing').toBe(2);
  });

  it('a look turned OFF keeps REDUCE MOTION and LOW EFFECTS independent (they never touch the switches)', () => {
    const s = new EyeCandyState(parseFxQuery(''));
    s.applyLooks({ a: true, b: false, c: true });
    s.env = () => ({ lowEffects: true, reduceMotion: true, reduceFlashes: false, width: 1600, height: 900 });
    expect(s.tier).toBe('low');
    expect(s.reduceMotion).toBe(true);
    expect(s.on).toEqual({ a: true, b: false, c: true });
  });
});
