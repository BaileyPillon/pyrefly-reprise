/**
 * Round 03 blocker #5: saved audio settings are never pushed into the mixer
 * at boot (`critic/rounds/round-03.md` lines 377-388). Repro there: mute the
 * game through OPTIONS, reload, `app.save.settings.masterVolume` is 0 but
 * `audioDebug().volumes.master` is back to 0.9 — because the only callers of
 * `AudioManager.setMasterVolume` / `setMusicVolume` / `setSfxVolume` were
 * `PauseScreen.ts`, so nothing ever told the mixer what the save file said
 * before a player opened pause.
 *
 * This exercises the real `AudioManager` singleton and the real `SaveStore`
 * (a fake in-memory `localStorage`, not a mock of either class under test) —
 * `SaveStore`'s constructor and `setSettings` are the boot path that must
 * push saved volumes into the mixer, per the fix in
 * `critic/rounds/round-03.md:385-387`. Case: both (shared boot plumbing;
 * `AudioManager`/`SaveStore` are not game-specific — AGENTS.md rule 14 /
 * CHK-020).
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { audio } from '../../src/audio/index.ts';
import { SAVE_VERSION, SaveStore, defaultSettings, type SaveData } from '../../src/app/SaveData.ts';

/** Minimal in-memory `localStorage` so no two tests in this file share state. */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function seededSave(settings: Partial<SaveData['settings']>): string {
  const save: Partial<SaveData> = {
    version: SAVE_VERSION,
    updatedAt: Date.now(),
    chapters: {},
    unlocked: [],
    flags: {},
    settings: { ...defaultSettings(), ...settings },
  };
  return JSON.stringify(save);
}

describe('saved audio settings applied at boot (round-03 #5)', () => {
  beforeEach(() => {
    // Bring the shared mixer back to the factory defaults before each case so
    // one test's fix-under-test does not leak into the next.
    audio.applySettings({ masterVolume: 0.9, musicVolume: 0.7, sfxVolume: 0.9 });
  });

  it('pushes a muted/lowered save into the mixer the instant SaveStore loads it, before any pause screen exists', () => {
    const storage = new MemoryStorage();
    storage.setItem('test-save', seededSave({ masterVolume: 0, musicVolume: 0.15, sfxVolume: 0.35 }));

    // Constructing SaveStore is the whole boot path here — `PauseScreen` is
    // never imported by this file, let alone constructed.
    new SaveStore('test-save', storage);

    expect(audio.debug().volumes).toEqual({ master: 0, music: 0.15, sfx: 0.35 });
  });

  it('keeps pushing to the mixer on every later settings write (SaveStore.setSettings)', () => {
    const storage = new MemoryStorage();
    storage.setItem('test-save', seededSave({ masterVolume: 0.6, musicVolume: 0.6, sfxVolume: 0.6 }));
    const store = new SaveStore('test-save', storage);
    expect(audio.debug().volumes).toEqual({ master: 0.6, music: 0.6, sfx: 0.6 });

    store.setSettings({ masterVolume: 0 });
    expect(audio.debug().volumes.master).toBe(0);
    // The two volumes this write did not touch are untouched too.
    expect(audio.debug().volumes.music).toBe(0.6);
    expect(audio.debug().volumes.sfx).toBe(0.6);
  });

  it('CHK-024: an old save with no volume fields at all gets defaults, never NaN', () => {
    const storage = new MemoryStorage();
    // A save from before these fields existed: no `settings` key at all.
    storage.setItem(
      'test-save',
      JSON.stringify({ version: 0, updatedAt: 1, chapters: {}, unlocked: [], flags: {} }),
    );

    new SaveStore('test-save', storage);

    const defaults = defaultSettings();
    const volumes = audio.debug().volumes;
    expect(volumes.master).toBe(defaults.masterVolume);
    expect(volumes.music).toBe(defaults.musicVolume);
    expect(volumes.sfx).toBe(defaults.sfxVolume);
    expect(Number.isNaN(volumes.master)).toBe(false);
    expect(Number.isNaN(volumes.music)).toBe(false);
    expect(Number.isNaN(volumes.sfx)).toBe(false);
  });

  it('a fresh profile with no save at all also leaves the mixer at defaults, not NaN', () => {
    // No storage backing at all (constructor's `storage` param defaults to
    // `safeStorage()`, but passing `null` explicitly is the documented way a
    // test gets the same "nothing persisted" path headlessly).
    new SaveStore('test-save-empty', null);

    const defaults = defaultSettings();
    const volumes = audio.debug().volumes;
    expect(volumes.master).toBe(defaults.masterVolume);
    expect(volumes.music).toBe(defaults.musicVolume);
    expect(volumes.sfx).toBe(defaults.sfxVolume);
  });
});
