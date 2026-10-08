// @vitest-environment jsdom
/**
 * The EYE CANDY page's nine parts, the save half (save-data class; CHK-024). D-317 (Bailey, 2026-10-02,
 * "all your recommendations, godspeed", option A): nine new `Settings` booleans under eye-candy D's three
 * looks, every one default ON; "players who had a look off keep the new parts off".
 *
 * Saves written by the live release-33, release-34 and release-35 builds themselves
 * (`tests/fixtures/saves/release-33.json`, `-34`, `-35`; each has the three looks, at least one of them
 * OFF, and none of the parts) must keep every clear, best time, play time, coach id, flag and setting they
 * had; the parts of a look they had OFF come up OFF and every other part ON; `SAVE_VERSION` stays 1; the
 * upgrade happens once (idempotent) and a reload keeps what was written. The seam the looks read
 * (`eyeCandyFlags.ts`) follows from the first frame. Older saves (no looks at all) get every part ON
 * (`save-fx-looks.test.ts`).
 *
 * Game case: both (shared plumbing).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { SAVE_KEY, SAVE_VERSION, SaveStore, defaultSettings, migrate, type SaveData } from '../../src/app/SaveData.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';
import { FX_PARTS, fxAllOnPatch, fxSwitchOn } from '../../src/app/fxParts.ts';
import { eyeCandyOn } from '../../src/engine/fx/eyeCandyFlags.ts';
import { eyeCandy } from '../../src/engine/fx/EyeCandy.ts';

type Look = 'fxLight' | 'fxLiving' | 'fxSpectacle';
interface Fixture {
  release: number;
  mainSha: string;
  bundle: string;
  localStorage: Record<string, string>;
  expect: {
    cleared: string[];
    notCleared: string[];
    bestTimeMs: Record<string, number>;
    settings: Record<string, unknown>;
    looksOff: Look[];
  };
}
const load = (name: string): Fixture =>
  JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', 'saves', name), 'utf8')) as Fixture;

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
const PART_FIELDS = FX_PARTS.map((p) => p.field);
const LOOK_OPT: Record<Look, 'a' | 'b' | 'c'> = { fxLight: 'a', fxLiving: 'b', fxSpectacle: 'c' };

afterEach(() => {
  applyComfort({ textSize: 1, reduceMotion: false, lowEffects: false, ...fxAllOnPatch() });
});

describe.each([
  ['release-33.json', 33, 'f302f163', 'index-DCYkAkI-.js'],
  ['release-34.json', 34, '25faec70', 'index-cJFxGdIo.js'],
  ['release-35.json', 35, 'ef3f6bbf', 'index-DiuZMSBm.js'],
] as const)('a %s save upgrades (three looks, a look OFF, no parts)', (file, release, sha, bundle) => {
  const fixture = load(file);
  const raw = fixture.localStorage[SAVE_KEY]!;
  const off = new Set<string>(fixture.expect.looksOff);

  it('is a real blob from that live build: the three looks, at least one OFF, none of the nine parts', () => {
    expect([fixture.release, fixture.mainSha, fixture.bundle]).toEqual([release, sha, bundle]);
    const parsed = JSON.parse(raw) as SaveData;
    expect(parsed.version).toBe(SAVE_VERSION);
    for (const look of ['fxLight', 'fxLiving', 'fxSpectacle']) expect(typeof (parsed.settings as unknown as Record<string, unknown>)[look], look).toBe('boolean');
    for (const f of PART_FIELDS) expect(parsed.settings, f).not.toHaveProperty(f);
    expect(off.size).toBeGreaterThan(0);
    for (const look of off) expect((parsed.settings as unknown as Record<string, unknown>)[look], look).toBe(false);
  });

  it('keeps everything it had, verbatim; the only additions are the nine parts and the VOICE-OVER pair', () => {
    const before = JSON.parse(raw) as SaveData;
    const store = new SaveStore(SAVE_KEY, slotWith(raw));
    const after = store.snapshot();
    for (const id of fixture.expect.cleared) expect(store.isCleared(id), id).toBe(true);
    for (const id of fixture.expect.notCleared) expect(store.isCleared(id), id).toBe(false);
    for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(store.chapter(id).bestTimeMs, id).toBe(ms);
    expect(after.version).toBe(1);
    expect(after.chapters).toEqual(before.chapters);
    expect(after.seenCoach).toEqual(before.seenCoach);
    expect(after.unlocked).toEqual(before.unlocked);
    expect(after.flags).toEqual(before.flags);
    for (const [k, v] of Object.entries(before.settings)) expect(after.settings[k as keyof typeof after.settings], k).toEqual(v);
    for (const [k, v] of Object.entries(fixture.expect.settings)) expect(after.settings[k as keyof typeof after.settings], k).toEqual(v);
    const added = Object.keys(after.settings).filter((k) => !(k in before.settings)).sort();
    // (the release-33 to 35 saves predate the 39.5 front-end choices too: they arrive at their defaults, `saveFrontend.ts`)
    // ...plus the recorded voice-over's two settings, which every save older than them gains at their defaults (ON, 0.9).
    expect(added).toEqual([...PART_FIELDS, 'titleArt', 'chapterSelectMusic', 'voiceOn', 'voiceVolume'].sort());
  });

  it('the parts of a look it had OFF come up OFF, every other part ON', () => {
    const s = new SaveStore(SAVE_KEY, slotWith(raw)).settings;
    for (const p of FX_PARTS) expect(s[p.field], `${p.field} under ${p.look}`).toBe(!off.has(p.look));
  });

  it('from the first frame the look stays off and the seam answers OFF for it and every one of its parts', () => {
    new SaveStore(SAVE_KEY, slotWith(raw));
    for (const look of ['fxLight', 'fxLiving', 'fxSpectacle'] as const) expect(eyeCandy.on[LOOK_OPT[look]], look).toBe(!off.has(look));
    for (const p of FX_PARTS) expect(eyeCandyOn(p.key), p.key).toBe(!off.has(p.look));
  });

  it('turning the look back on brings the look and leaves its new parts OFF until each is turned on', () => {
    const slot = slotWith(raw);
    const store = new SaveStore(SAVE_KEY, slot);
    const look = fixture.expect.looksOff[0]!;
    const part = FX_PARTS.find((p) => p.look === look)!;
    store.setSettings({ [look]: true });
    expect(eyeCandy.on[LOOK_OPT[look]]).toBe(true);
    expect(eyeCandyOn(part.key)).toBe(false);
    store.setSettings({ [part.field]: true });
    expect(eyeCandyOn(part.key)).toBe(true);
    const reread = new SaveStore(SAVE_KEY, slot);
    expect(reread.settings[look]).toBe(true);
    expect(reread.settings[part.field]).toBe(true);
    for (const p of FX_PARTS.filter((q) => q.look === look && q.field !== part.field)) expect(reread.settings[p.field], p.field).toBe(false);
  });

  it('upgrades once: idempotent, and a reload after the first write reads the same parts', () => {
    const once = migrate(JSON.parse(raw) as Partial<SaveData>);
    expect(migrate(JSON.parse(JSON.stringify(once)) as Partial<SaveData>)).toEqual(once);
    const slot = slotWith(raw);
    const store = new SaveStore(SAVE_KEY, slot);
    store.save();
    const stored = JSON.parse(slot.getItem(SAVE_KEY)!) as SaveData;
    for (const f of PART_FIELDS) expect(typeof stored.settings[f], f).toBe('boolean');
    expect(new SaveStore(SAVE_KEY, slot).snapshot().settings).toEqual(store.snapshot().settings);
    // A look turned on later does not re-run the rule: its stored parts stay as they were written.
    const look = fixture.expect.looksOff[0]!;
    store.setSettings({ [look]: true });
    const after = new SaveStore(SAVE_KEY, slot).settings;
    for (const p of FX_PARTS.filter((q) => q.look === look)) expect(after[p.field], p.field).toBe(false);
  });
});

describe('fresh players, round trips and the master rule in the save', () => {
  it('a fresh profile has all twelve ON', () => {
    const store = new SaveStore(SAVE_KEY, slotWith());
    for (const f of PART_FIELDS) expect(store.settings[f], f).toBe(true);
    for (const f of PART_FIELDS) expect(defaultSettings()[f], f).toBe(true);
  });

  it('a part written OFF survives a reload; a look written OFF keeps its parts’ own values', () => {
    const slot = slotWith();
    const store = new SaveStore(SAVE_KEY, slot);
    store.setSettings({ fxFog: false });
    store.setSettings({ fxLight: false });
    const reread = new SaveStore(SAVE_KEY, slot);
    expect([reread.settings.fxLight, reread.settings.fxFog, reread.settings.fxDof, reread.settings.fxEdges]).toEqual([false, false, true, true]);
    expect(eyeCandyOn('depthOfField')).toBe(false);
    reread.setSettings({ fxLight: true });
    expect([eyeCandyOn('depthOfField'), eyeCandyOn('fog'), eyeCandyOn('smoothEdges')]).toEqual([true, false, true]);
    expect(fxSwitchOn(reread.settings, 'fxFog')).toBe(false);
  });

  it('a truncated blob boots to defaults with every part ON, without throwing', () => {
    const raw = load('release-35.json').localStorage[SAVE_KEY]!;
    const store = new SaveStore(SAVE_KEY, slotWith(raw.slice(0, 90)));
    for (const f of PART_FIELDS) expect(store.settings[f], f).toBe(true);
  });

  it('two open tabs: a part flipped in one survives the other tab’s later write', () => {
    const slot = slotWith(load('release-34.json').localStorage[SAVE_KEY]!);
    const a = new SaveStore(SAVE_KEY, slot);
    const b = new SaveStore(SAVE_KEY, slot);
    a.setSettings({ fxSplash: true });
    b.setSettings({ masterVolume: 0.2 });
    const merged = new SaveStore(SAVE_KEY, slot).settings;
    expect(merged.fxSplash).toBe(true);
    expect(merged.masterVolume).toBe(0.2);
    expect(merged.fxFraming, 'untouched: still the upgrade’s OFF').toBe(false);
  });
});
