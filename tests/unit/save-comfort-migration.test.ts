// @vitest-environment jsdom
/**
 * OPTIONS accessibility A2 (D-285, PR-0032): the save half. TEXT SIZE is a new
 * `Settings` field; REDUCE MOTION and LOW EFFECTS are older ones that now have
 * rows. A save written by the live release-29 build
 * (`tests/fixtures/saves/release-29.json`, exported from that build's own
 * SaveStore, no `textSize`) must keep everything it had and read TEXT SIZE as
 * 100 %; a stored value that is not one of the three sizes must never reach the
 * layout (CHK-024); and whatever is stored is on `<html>` from the first frame.
 *
 * Both games: shared plumbing (`src/app/SaveData.ts`, `src/app/saveComfort.ts`,
 * `src/app/applyComfort.ts`). Save-data class.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { SAVE_KEY, SaveStore, defaultSettings, migrate, type SaveData } from '../../src/app/SaveData.ts';
import { TEXT_SIZES, isTextSize, stepTextSize, textSizeLabel } from '../../src/app/saveComfort.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';

interface Fixture {
  release: number;
  localStorage: Record<string, string>;
  expect: { cleared: string[]; notCleared: string[]; bestTimeMs: Record<string, number>; settings: Record<string, unknown> };
}

const fixture = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'fixtures', 'saves', 'release-29.json'), 'utf8'),
) as Fixture;
const rawBlob = fixture.localStorage[SAVE_KEY]!;

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

const html = (): HTMLElement => document.documentElement;
afterEach(() => {
  applyComfort({ textSize: 1, reduceMotion: false, lowEffects: false });
});

describe('a release-29 save upgrades (CHK-024, D-285)', () => {
  it('the fixture is a real release-29 blob with no textSize', () => {
    expect(fixture.release).toBe(29);
    const parsed = JSON.parse(rawBlob) as SaveData;
    expect(parsed.settings).not.toHaveProperty('textSize');
  });

  it('keeps every clear, best time, play time, coach id and setting, and gets TEXT SIZE 100 %', () => {
    const before = JSON.parse(rawBlob) as SaveData;
    const store = new SaveStore(SAVE_KEY, slotWith(rawBlob));
    const after = store.snapshot();
    for (const id of fixture.expect.cleared) expect(store.isCleared(id)).toBe(true);
    for (const id of fixture.expect.notCleared) expect(store.isCleared(id)).toBe(false);
    for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(store.chapter(id).bestTimeMs).toBe(ms);
    expect(after.chapters).toEqual(before.chapters);
    expect(after.seenCoach).toEqual(before.seenCoach);
    expect(after.unlocked).toEqual(before.unlocked);
    expect(after.flags).toEqual(before.flags);
    // Every stored setting survives verbatim; the only additions are textSize, eye-candy D's three looks
    // (`fxLooks.ts`, all ON; `save-fx-looks.test.ts` proves them on the release-30/31a saves too) and the EYE
    // CANDY page's nine parts (D-317, `fxParts.ts`: this save has no look OFF, so all ON; `save-fx-parts.test.ts`).
    for (const [k, v] of Object.entries(before.settings)) expect(after.settings[k as keyof typeof after.settings], k).toEqual(v);
    for (const [k, v] of Object.entries(fixture.expect.settings)) expect(after.settings[k as keyof typeof after.settings], k).toEqual(v);
    // ...plus D-293's one-time SFX balance marker (`saveSfxBalance.ts`); this save's 0.6 is kept above; and the recorded voice-over's pair (ON, 0.9).
    expect(Object.keys(after.settings).filter((k) => !(k in before.settings)).sort()).toEqual([
      'fxBreath', 'fxDof', 'fxEdges', 'fxFog', 'fxFraming', 'fxHero', 'fxKo', 'fxLight', 'fxLiving', 'fxSpectacle', 'fxSphere', 'fxSplash',
      'sfxBalanceMigrated', 'textSize', 'voiceOn', 'voiceVolume',
    ]);
    expect(after.settings.textSize).toBe(1);
  });

  it('the upgraded save is on <html> from construction: 100 %, and the two flags it already had', () => {
    new SaveStore(SAVE_KEY, slotWith(rawBlob));
    expect(html().dataset['textSize']).toBe('100');
    expect(html().hasAttribute('data-reduce-motion')).toBe(true);
    expect(html().hasAttribute('data-low-effects')).toBe(true);
    // judgment call K (round 21): the FFX-2 HUD and the pause follow TEXT SIZE since release 39, so the wide flag is on from the first frame too.
    expect(html().dataset['textSizeWide']).toBe('100');
  });

  it('writing it back keeps textSize, and a second load reads the same thing (idempotent)', () => {
    const slot = slotWith(rawBlob);
    const store = new SaveStore(SAVE_KEY, slot);
    store.setSettings({ textSize: 1.3 });
    const reread = new SaveStore(SAVE_KEY, slot);
    expect(reread.settings.textSize).toBe(1.3);
    expect(html().dataset['textSize']).toBe('130');
    const once = migrate(JSON.parse(rawBlob) as Partial<SaveData>);
    expect(migrate(JSON.parse(JSON.stringify(once)) as Partial<SaveData>)).toEqual(once);
  });
});

describe('TEXT SIZE coercion never reaches the layout with a bad value', () => {
  const withSettings = (settings: Record<string, unknown>): SaveData =>
    migrate({ version: 1, chapters: {}, settings: settings as never });

  it.each([['130'], [Number.NaN], [2], [null], [1.2], [0], ['big'], [undefined]])('textSize %p reads as 100 %%', (v) => {
    expect(withSettings({ textSize: v }).settings.textSize).toBe(1);
  });

  it.each([[1], [1.15], [1.3]])('textSize %p is kept', (v) => {
    expect(withSettings({ textSize: v }).settings.textSize).toBe(v);
  });

  it('non-boolean comfort flags read as their defaults', () => {
    const s = withSettings({ reduceMotion: 'yes', lowEffects: 1 }).settings;
    expect(s.reduceMotion).toBe(defaultSettings().reduceMotion);
    expect(s.lowEffects).toBe(false);
  });

  it('a fresh profile starts at 100 % with LOW EFFECTS off', () => {
    const store = new SaveStore(SAVE_KEY, slotWith());
    expect(store.settings.textSize).toBe(1);
    expect(store.settings.lowEffects).toBe(false);
    expect(html().dataset['textSize']).toBe('100');
  });

  it('a truncated blob boots to defaults without throwing', () => {
    const store = new SaveStore(SAVE_KEY, slotWith(rawBlob.slice(0, 80)));
    expect(store.settings.textSize).toBe(1);
  });
});

describe('the TEXT SIZE ladder', () => {
  it('is exactly 100 / 115 / 130 %', () => {
    expect([...TEXT_SIZES]).toEqual([1, 1.15, 1.3]);
    expect(TEXT_SIZES.map(textSizeLabel)).toEqual(['100%', '115%', '130%']);
    expect(isTextSize(1.15)).toBe(true);
    expect(isTextSize(1.2)).toBe(false);
  });

  it('steps and clamps at both ends, as TEXT SPEED does', () => {
    expect(stepTextSize(1, 1)).toBe(1.15);
    expect(stepTextSize(1.15, 1)).toBe(1.3);
    expect(stepTextSize(1.3, 1)).toBe(1.3);
    expect(stepTextSize(1.3, -1)).toBe(1.15);
    expect(stepTextSize(1, -1)).toBe(1);
    expect(stepTextSize('garbage', 1)).toBe(1.15);
  });

  it('applyComfort writes the step, the scale variable and the two flags', () => {
    applyComfort({ textSize: 1.15, reduceMotion: true, lowEffects: false });
    expect(html().dataset['textSize']).toBe('115');
    expect(html().style.getPropertyValue('--pyr-ts')).toBe('1.15');
    expect(html().hasAttribute('data-reduce-motion')).toBe(true);
    expect(html().hasAttribute('data-low-effects')).toBe(false);
    applyComfort({ textSize: 1, reduceMotion: false, lowEffects: true });
    expect(html().dataset['textSize']).toBe('100');
    expect(html().hasAttribute('data-reduce-motion')).toBe(false);
    expect(html().hasAttribute('data-low-effects')).toBe(true);
  });
});
