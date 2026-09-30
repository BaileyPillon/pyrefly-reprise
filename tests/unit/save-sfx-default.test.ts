/**
 * PR-0203 / D-210: lower the sound effects, **for new profiles only**.
 *
 * Bailey, 2026-09-26 (`docs/target/decisions.json` D-210): "I'll go with all of
 * your recommendations", accepting "lower, new profiles only". The value is
 * round 13's arithmetic (`critic/rounds/round-13.md` #41): the sprite peaks at
 * -1.13 dBTP and the music at -1.06 dBTP on a 0.7 bus, so THEMES.md SFX rule 8
 * (effects 6 dB under the music) needs an SFX bus of at most ~0.354: 0.35.
 * Preflight: `docs/plans/r29-audio-review.md` (save-data class; CHK-024).
 *
 * Game case: both (shared mixer default and save plumbing; CHK-020).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { defaultSave, defaultSettings, migrate, SaveStore, type SaveData } from '../../src/app/SaveData.ts';

function memoryStorage(seed?: [string, string]) {
  const map = new Map<string, string>(seed ? [seed] : []);
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

const PRE_D210_SFX = 0.9;

describe('D-210, as refined by D-293: the new-profile effects default', () => {
  it('fresh defaults are balance b (D-293): 0.70, the D-210 level 0.35 +6 dB (docs/handoff/sfx-b.md)', () => {
    expect(defaultSettings().sfxVolume).toBe(0.7);
    expect(defaultSave().settings.sfxVolume).toBe(0.7);
    const store = new SaveStore('test:sfx-fresh', memoryStorage());
    expect(store.settings.sfxVolume).toBe(0.7);
    // round 13's peaks (sprite -1.13 dBTP, music -1.06 dBTP on its bus): the SFX bus now sits level
    // with the music bus, so an effect's sample peak is within 0.1 dB of the music's (THEMES.md rule 8, D-293).
    const db = (x: number): number => 20 * Math.log10(x);
    const music = -1.06 + db(defaultSettings().musicVolume);
    const sfx = -1.13 + db(defaultSettings().sfxVolume);
    expect(Math.abs(music - sfx)).toBeLessThan(0.1);
    expect(db(defaultSettings().sfxVolume / 0.35)).toBeCloseTo(6.02, 1);
  });

  it('an existing save keeps its stored effects level, the old 0.9 default included', () => {
    for (const stored of [PRE_D210_SFX, 0.65, 0]) {
      const blob = { version: 1, settings: { ...defaultSettings(), sfxVolume: stored } } as Partial<SaveData>;
      expect(migrate(blob).settings.sfxVolume).toBe(stored);
    }
  });

  it('a save from before the setting existed keeps the level it was playing at (0.9)', () => {
    const blob = { version: 1, settings: { masterVolume: 0.5 } } as unknown as Partial<SaveData>;
    expect(migrate(blob).settings.sfxVolume).toBe(PRE_D210_SFX);
  });

  it('the stored release-25 fixture keeps its volumes through the upgrade (CHK-024)', () => {
    const fixture = JSON.parse(
      readFileSync(new URL('../fixtures/saves/release-25-main.json', import.meta.url), 'utf8'),
    ) as { localStorage: Record<string, string> };
    const key = 'pyrefly-reprise:save:v1';
    const store = new SaveStore(key, memoryStorage([key, fixture.localStorage[key]!]));
    expect(store.settings).toMatchObject({ masterVolume: 0.45, musicVolume: 0.3, sfxVolume: 0.9 });
  });
});
