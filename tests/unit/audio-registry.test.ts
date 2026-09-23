import { describe, expect, it } from 'vitest';

import { INSTRUMENTS } from '../../src/audio/instruments.ts';
import { renderTrack } from '../../src/audio/render.ts';
import { toMidi } from '../../src/audio/score.ts';
import { MUSIC_KEYS, TRACKS, getTrack, hasTrack, isStandIn, trackNames } from '../../src/audio/tracks/index.ts';
import { SFX, SFX_GROUPS } from '../../src/audio/sfx/index.ts';

const SR = 4000;

/** Cue names UI, data and story agents are told to reference (docs/AUDIO-GUIDE.md). */
const SFX_CATALOG = [
  // weapons
  'slash-light', 'slash-heavy', 'pierce', 'ball-hit', 'claw', 'dagger-flurry', 'gunshot', 'gun-burst', 'whiff', 'guard', 'counter',
  // enemy
  'breath-attack', 'laser-charge', 'laser-fire', 'explosion', 'quake', 'whip', 'dissolve-pyreflies', 'machina-destroy',
  'boss-phase-shift', 'boss-overdrive-warning', 'petrify-shatter',
  // flow
  'ctb-tick', 'ctb-shift', 'turn-ready', 'menu-page', 'battle-start', 'escape', 'od-cursor-tick', 'od-timer-tick', 'od-hit-zone',
  'od-miss', 'od-input', 'od-sequence-complete', 'od-reel-spin', 'od-reel-stop', 'od-fury-rotation', 'od-mix-select', 'od-success',
  'od-fail', 'chain-hit', 'chain-break', 'spherechange', 'garment-grid-gate',
  // spells
  'fire-2', 'fire-3', 'ice-2', 'ice-3', 'lightning', 'lightning-2', 'lightning-3', 'water-2', 'water-3', 'holy-2', 'gravity',
  'gravity-2', 'flare', 'ultima', 'bio', 'death', 'doom-tick', 'drain', 'osmose', 'meteor',
  // support
  'cure-2', 'cure-3', 'regen', 'life', 'full-life', 'esuna', 'dispel', 'protect', 'shell', 'reflect', 'reflect-bounce', 'haste',
  'slow', 'stop', 'sleep', 'silence', 'blind', 'poison', 'berserk', 'confuse', 'curse', 'scan', 'steal-success', 'steal-fail',
  'item-use', 'phoenix-down', 'elixir', 'mp-restore', 'buff-generic', 'debuff-generic', 'summon-depart', 'aeon-overdrive',
  // story (named by src/story/scripts; see tests/unit/audio-story-cues.test.ts)
  'wind-high-altitude', 'wind-gust', 'kimahri-roar', 'fayth-hum', 'dome-echo', 'yu-yevon-chant', 'machina-groan',
  'farplane-voices', 'lenne-song', 'whistle-answer',
];

describe('music registry', () => {
  it('lists the twenty final keys exactly once', () => {
    // Eighteen, plus Chapter VIII's scene-fahrenheit and boss-evrae (2026-09-23).
    expect(MUSIC_KEYS).toHaveLength(20);
    expect(new Set(MUSIC_KEYS).size).toBe(20);
  });

  it('resolves every final key and keeps the original stand-ins playable', () => {
    for (const key of [...MUSIC_KEYS, 'battle-ffx', 'boss-dread']) {
      expect(hasTrack(key), key).toBe(true);
      expect(getTrack(key).channels.length, key).toBeGreaterThan(0);
    }
    expect(hasTrack('not-a-track')).toBe(false);
    expect(() => getTrack('not-a-track')).toThrow(/Unknown track/);
  });

  it('names each composed track after its key and never previews a stand-in', () => {
    for (const name of trackNames()) {
      expect(isStandIn(name), name).toBe(false);
      expect(TRACKS[name]!.name, name).toBe(name);
    }
  });

  it('composed tracks loop on barlines with valid notes and instruments', () => {
    for (const name of trackNames()) {
      const track = TRACKS[name]!;
      const barBeats = track.timeSig[0] * (4 / track.timeSig[1]);
      expect(track.loop.start % barBeats, `${name} loop.start`).toBe(0);
      expect(track.loop.end % barBeats, `${name} loop.end`).toBe(0);
      expect(track.loop.end, name).toBeLessThanOrEqual(track.length);
      expect(((track.loop.end - track.loop.start) * 60) / track.bpm, `${name} loop seconds`).toBeGreaterThanOrEqual(30);
      for (const channel of track.channels) {
        expect(INSTRUMENTS[channel.instrument], `${name}:${channel.instrument}`).toBeTypeOf('function');
        for (const note of channel.notes) {
          expect(note[0], name).toBeLessThan(track.length);
          const midi = toMidi(note[2]) + (channel.transpose ?? 0);
          expect(midi, name).toBeGreaterThan(11);
          expect(midi, name).toBeLessThan(120);
        }
      }
    }
  });

  it.each(trackNames().filter((n) => !['title', 'battle-ffx', 'boss-dread'].includes(n)))(
    'renders %s finite, audible and under full scale',
    (name) => {
      const out = renderTrack(TRACKS[name]!, SR);
      let finite = true;
      for (let i = 0; i < out.left.length; i += 7) {
        if (!Number.isFinite(out.left[i]!) || !Number.isFinite(out.right[i]!)) finite = false;
      }
      expect(finite).toBe(true);
      expect(out.peak).toBeGreaterThan(0.5);
      expect(out.peak).toBeLessThan(0.95);
    },
    60_000,
  );
});

describe('sfx registry', () => {
  it('never defines the same cue name in two files', () => {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const [group, cues] of Object.entries(SFX_GROUPS)) {
      for (const name of Object.keys(cues)) {
        if (owner.has(name)) clashes.push(`${name} (${owner.get(name)} + ${group})`);
        owner.set(name, group);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('has every catalogued cue', () => {
    const missing = SFX_CATALOG.filter((name) => !SFX[name]);
    expect(missing).toEqual([]);
  });

  it('describes every cue for the debug list', () => {
    for (const [name, def] of Object.entries(SFX)) {
      expect(def.about.length, name).toBeGreaterThan(8);
    }
  });
});
