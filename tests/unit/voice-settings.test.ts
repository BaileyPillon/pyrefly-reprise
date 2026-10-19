/**
 * VOICE-OVER and VOICE in the options: defaults ON, a save older than the setting reads ON, both persist through the save store,
 * reach the mixer, and show only where a game has recorded voice (FFX), never in FFX-2 or FF7 (rule 14). Game case: both for the
 * plumbing; FFX only for the rows' presence.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { audio } from '../../src/audio/index.ts';
import { voice } from '../../src/audio/voice/index.ts';
import { SAVE_VERSION, SaveStore, defaultSettings, migrate, type SaveData } from '../../src/app/SaveData.ts';
import { optionRows } from '../../src/app/screens/PauseScreenPanels.ts';
import { adjustSetting } from '../../src/app/screens/pause/settings.ts';
import { optionsColumns } from '../../src/app/screens/pause/panels.ts';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null { return this.map.get(key) ?? null; }
  setItem(key: string, value: string): void { this.map.set(key, value); }
  removeItem(key: string): void { this.map.delete(key); }
}

const ctxFor = (store: SaveStore, game?: 'ffx' | 'ffx2' | 'ff7') => ({
  settings: store.settings, battleHelpOn: null, canRestart: false, canChapterSelect: false, canQuit: false, extraRows: [], ...(game ? { game } : {}),
});
const rowIds = (store: SaveStore, game?: 'ffx' | 'ffx2' | 'ff7'): string[] => optionsColumns(ctxFor(store, game)).flatMap((c) => c.rows.map((r) => r.id));

beforeEach(() => {
  audio.applySettings({ masterVolume: 0.9, musicVolume: 0.7, sfxVolume: 0.9, voiceVolume: 0.9, voiceOn: true });
});

describe('the defaults and the upgrade', () => {
  it('defaults ON at 0.9', () => {
    const s = defaultSettings();
    expect(s.voiceOn).toBe(true);
    expect(s.voiceVolume).toBe(0.9);
  });

  it('a save written before the setting existed reads ON at 0.9 (no migration needed, the settings merge onto the defaults)', () => {
    const old = { version: SAVE_VERSION, updatedAt: 1, chapters: {}, unlocked: [], flags: {}, settings: { masterVolume: 0.5, musicVolume: 0.5, sfxVolume: 0.5 } } as unknown as SaveData;
    const migrated = migrate(old);
    expect(migrated.settings.voiceOn).toBe(true);
    expect(migrated.settings.voiceVolume).toBe(0.9);
    expect(migrated.settings.masterVolume).toBe(0.5);
  });

  it('keeps a player\'s own choice, and repairs a malformed value to the default instead of carrying it', () => {
    const own = migrate({ settings: { ...defaultSettings(), voiceOn: false, voiceVolume: 0.3 } } as unknown as SaveData);
    expect(own.settings.voiceOn).toBe(false);
    expect(own.settings.voiceVolume).toBe(0.3);
    const bad = migrate({ settings: { ...defaultSettings(), voiceOn: 'no', voiceVolume: Number.NaN } } as unknown as SaveData);
    expect(bad.settings.voiceOn).toBe(true);
    expect(bad.settings.voiceVolume).toBe(0.9);
  });
});

describe('persistence and the mixer', () => {
  it('a change is saved, survives a reload, and reaches the mixer at once', () => {
    const storage = new MemoryStorage();
    const store = new SaveStore('voice-test', storage);
    store.setSettings({ voiceVolume: 0.4 });
    expect(audio.debug().voiceVolume).toBe(0.4);
    store.setSettings({ voiceOn: false });
    expect(audio.voiceEnabled).toBe(false);
    expect(audio.debug().voiceVolume).toBe(0); // off is silence on the bus, not a different level

    const reloaded = new SaveStore('voice-test', storage);
    expect(reloaded.settings.voiceOn).toBe(false);
    expect(reloaded.settings.voiceVolume).toBe(0.4);
    expect(audio.voiceEnabled).toBe(false); // the boot path pushes it before any pause screen exists
  });

  it('VOICE 0 is text only: nothing is enabled to speak', () => {
    audio.applySettings({ masterVolume: 0.9, musicVolume: 0.7, sfxVolume: 0.9, voiceVolume: 0, voiceOn: true });
    expect(audio.voiceEnabled).toBe(false);
    audio.setVoiceVolume(0.5);
    expect(audio.voiceEnabled).toBe(true);
    audio.setVoiceOn(false);
    expect(audio.voiceEnabled).toBe(false);
  });

  it('clamps the level and ignores a non-finite one', () => {
    audio.setVoiceVolume(7);
    expect(audio.debug().voiceVolume).toBe(1);
    audio.setVoiceVolume(-2);
    expect(audio.debug().voiceVolume).toBe(0);
    audio.applySettings({ masterVolume: 0.9, musicVolume: 0.7, sfxVolume: 0.9, voiceVolume: Number.NaN });
    expect(audio.debug().voiceVolume).toBe(0);
  });

  it('the voice bus does not go through the music duck: a duck leaves the voice level alone', () => {
    // No context in Node: the bus does not exist yet, and the level it will be created with is the setting\'s.
    audio.setVoiceVolume(0.6);
    audio.duck(0.3, 0.1);
    expect(audio.debug().voiceVolume).toBe(0.6);
    expect(audio.voiceDestination).toBeNull();
  });

  it('muting the game (master) is not a voice setting: the mute switch silences the voice through the master bus', () => {
    audio.setMuted(true);
    expect(audio.isMuted).toBe(true);
    expect(audio.debug().voiceVolume).toBe(0.9); // the voice level is its own setting; the master gain is what the mute zeroes
    audio.setMuted(false);
  });
});

describe('the options rows', () => {
  it('VOICE (a level) and VOICE-OVER (the switch) follow SOUND EFFECTS', () => {
    const rows = optionRows(defaultSettings());
    const ids = rows.map((r) => r.id);
    expect(ids.slice(ids.indexOf('sfxVolume'), ids.indexOf('sfxVolume') + 3)).toEqual(['sfxVolume', 'voiceVolume', 'voiceOn']);
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by['voiceVolume']).toMatchObject({ label: 'VOICE', value: '90', ratio: 0.9 });
    expect(by['voiceOn']).toMatchObject({ label: 'VOICE-OVER', value: 'ON', ratio: null });
    expect(optionRows({ ...defaultSettings(), voiceOn: false }).find((r) => r.id === 'voiceOn')?.value).toBe('OFF');
  });

  it('FFX chapters show them; FFX-2 and FF7 do not, because they have no recorded voice to switch (rule 14)', () => {
    const store = new SaveStore('voice-rows', new MemoryStorage());
    expect(rowIds(store, 'ffx')).toEqual(expect.arrayContaining(['voiceVolume', 'voiceOn']));
    expect(rowIds(store)).toEqual(expect.arrayContaining(['voiceVolume', 'voiceOn'])); // no game context reads as FFX
    expect(rowIds(store, 'ffx2')).not.toContain('voiceVolume');
    expect(rowIds(store, 'ffx2')).not.toContain('voiceOn');
    expect(rowIds(store, 'ff7')).not.toContain('voiceVolume');
    expect(rowIds(store, 'ff7')).not.toContain('voiceOn');
  });
});

describe('adjusting them from the pause menu', () => {
  it('steps VOICE a notch at a time, clamps, saves, reaches the mixer, and a level of 0 stops a line already speaking', () => {
    const store = new SaveStore('voice-adjust', new MemoryStorage());
    expect(adjustSetting(store, 'voiceVolume', -1)).toBe(true);
    expect(store.settings.voiceVolume).toBe(0.8);
    expect(audio.debug().voiceVolume).toBe(0.8);
    for (let i = 0; i < 12; i++) adjustSetting(store, 'voiceVolume', 1);
    expect(store.settings.voiceVolume).toBe(1);
    const stops: number[] = [];
    const original = voice.stop.bind(voice);
    voice.stop = (fade?: number) => { stops.push(store.settings.voiceVolume); original(fade); };
    for (let i = 0; i < 12; i++) adjustSetting(store, 'voiceVolume', -1);
    voice.stop = original;
    expect(store.settings.voiceVolume).toBe(0);
    expect(audio.voiceEnabled).toBe(false);
    expect(stops.length).toBeGreaterThan(0);
    expect(stops.every((level) => level === 0)).toBe(true); // it stops only on reaching zero, never on the way down
  });

  it('VOICE-OVER flips whichever way you push it (so Confirm works on it too), and the save and mixer agree', () => {
    const store = new SaveStore('voice-toggle', new MemoryStorage());
    expect(adjustSetting(store, 'voiceOn', 1)).toBe(true);
    expect(store.settings.voiceOn).toBe(false);
    expect(audio.voiceEnabled).toBe(false);
    expect(adjustSetting(store, 'voiceOn', -1)).toBe(true);
    expect(store.settings.voiceOn).toBe(true);
    expect(audio.voiceEnabled).toBe(true);
  });

  it('turning the voice off stops the voice director (nothing keeps talking)', () => {
    const store = new SaveStore('voice-off', new MemoryStorage());
    const calls: string[] = [];
    const original = voice.stop.bind(voice);
    voice.stop = (fade?: number) => { calls.push('stop'); original(fade); };
    adjustSetting(store, 'voiceOn', 1);
    adjustSetting(store, 'voiceOn', 1); // back on: no stop
    voice.stop = original;
    expect(calls).toEqual(['stop']);
  });
});
