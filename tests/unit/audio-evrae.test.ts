import { describe, expect, it } from 'vitest';

import { INSTRUMENTS } from '../../src/audio/instruments.ts';
import { toMidi, tracker, type Note } from '../../src/audio/score.ts';
import { getTrack, MUSIC_KEYS } from '../../src/audio/tracks/index.ts';
import {
  PURSUIT_PHRASE,
  RANGE_GROUP,
  RANGE_MIX,
  rangeVariant,
  riseHead,
  shipFigure,
} from '../../src/audio/tracks/fahrenheit.ts';
import { FAREWELL_RISE } from '../../src/audio/tracks/themes.ts';

/**
 * Chapter VIII's two cues, `boss-evrae` and `scene-fahrenheit` — FFX only.
 * Each assertion is a line of research/ffx-evrae-airship.md §12.6 or of
 * docs/audio/THEMES.md that a later edit could silently undo.
 */

const battle = getTrack('boss-evrae');
const scene = getTrack('scene-fahrenheit');

const pcs = (notes: Note[], transpose = 0): Set<number> =>
  new Set(notes.map((n) => (((toMidi(n[2]) + transpose) % 12) + 12) % 12));

const PITCHED = (instrument: string): boolean =>
  !['kick', 'snare', 'hat', 'tom', 'crash', 'taiko', 'metal-hit', 'shaker'].includes(instrument);

function intervals(notes: Note[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < notes.length; i++) out.push(toMidi(notes[i]![2]) - toMidi(notes[i - 1]![2]));
  return out;
}

describe('Chapter VIII cues are registered', () => {
  it('names both reserved keys as final music keys', () => {
    expect(MUSIC_KEYS).toContain('boss-evrae');
    expect(MUSIC_KEYS).toContain('scene-fahrenheit');
  });

  it('only names instruments that also have a synthesised fallback', () => {
    for (const track of [battle, scene]) {
      for (const ch of track.channels) {
        expect(Object.prototype.hasOwnProperty.call(INSTRUMENTS, ch.instrument), `${track.name}/${ch.name}`).toBe(true);
      }
    }
  });
});

describe('the ship figure is FAREWELL_RISE, driven', () => {
  const rise = intervals(FAREWELL_RISE.map((n): Note => [n[0], n[1], 60 + toMidi(n[2])]));

  it('opens the pursuit phrase with the bible interval sequence', () => {
    const phrase = tracker(PURSUIT_PHRASE, { checkBars: 4 });
    expect(intervals(phrase.slice(0, 4))).toEqual(rise);
    expect(tracker(riseHead('A4')).map((n) => n[1])).toEqual([0.5, 0.5, 0.5, 1]);
  });

  it('keeps a rest in every two-bar unit of the phrase, so the fight can cut it anywhere', () => {
    const phrase = tracker(PURSUIT_PHRASE, { checkBars: 4 });
    for (let pair = 0; pair < 4; pair++) {
      const inPair = phrase.filter((n) => n[0] >= pair * 8 && n[0] < pair * 8 + 8);
      const sounding = inPair.reduce((sum, n) => sum + n[1], 0);
      expect(sounding, `bars ${pair * 2 + 1}-${pair * 2 + 2}`).toBeLessThanOrEqual(7);
    }
  });

  it('is the same figure the scene cue foreshadows, a fourth higher', () => {
    const a = tracker(shipFigure('A4'));
    const d = tracker(shipFigure('D5'));
    expect(intervals(d)).toEqual(intervals(a));
    expect(toMidi(d[0]![2]) - toMidi(a[0]![2])).toBe(5);
  });
});

describe('FFX harmonic language (THEMES.md "Harmonic language, by world")', () => {
  it('boss-evrae is A Aeolian: no G# (no dominant) and no F# (no Dorian sixth)', () => {
    for (const ch of battle.channels.filter((c) => PITCHED(c.instrument))) {
      const found = pcs(ch.notes, ch.transpose ?? 0);
      expect(found.has(8), `${ch.name} plays a G#`).toBe(false);
      expect(found.has(6), `${ch.name} plays an F#`).toBe(false);
    }
  });

  it('scene-fahrenheit is D Aeolian: no C# (no dominant) and no B natural (no Dorian sixth)', () => {
    for (const ch of scene.channels.filter((c) => PITCHED(c.instrument))) {
      const found = pcs(ch.notes, ch.transpose ?? 0);
      expect(found.has(1), `${ch.name} plays a C#`).toBe(false);
      expect(found.has(11), `${ch.name} plays a B natural`).toBe(false);
    }
  });

  it('has no choir, organ or bell anywhere — nothing sacred (§12.6 anti-brief)', () => {
    for (const track of [battle, scene]) {
      for (const ch of track.channels) expect(['choir', 'organ', 'bell', 'pad']).not.toContain(ch.instrument);
    }
  });
});

describe('boss-evrae performance', () => {
  it('stops dead for one beat before the climax', () => {
    for (const ch of battle.channels) {
      const inStop = ch.notes.filter((n) => n[0] >= 111 && n[0] < 112);
      expect(inStop, `${ch.name} plays in the stop beat`).toEqual([]);
    }
  });

  it('plays the and-of-beat louder than the downbeat in the bass drive', () => {
    const bass = battle.channels.find((c) => c.name === 'bass drive')!;
    const bar = bass.notes.filter((n) => n[0] >= 16 && n[0] < 20);
    const on = bar.filter((n) => n[0] % 1 === 0).map((n) => n[3]!);
    const off = bar.filter((n) => n[0] % 1 === 0.5).map((n) => n[3]!);
    expect(Math.min(...off)).toBeGreaterThan(Math.max(...on));
  });

  it('doubles the subdivision at C without moving the tempo', () => {
    const ost = battle.channels.find((c) => c.name === 'string ostinato')!;
    const gapIn = (from: number): number => {
      const starts = ost.notes.filter((n) => n[0] >= from && n[0] < from + 4).map((n) => n[0]);
      return starts[1]! - starts[0]!;
    };
    expect(gapIn(16)).toBeCloseTo(0.5);
    expect(gapIn(112)).toBeCloseTo(0.25);
    expect(battle.tempo).toBeUndefined();
  });

  it('never holds one velocity across a channel', () => {
    for (const track of [battle, scene]) {
      for (const ch of track.channels) {
        if (ch.notes.length < 16) continue;
        expect(new Set(ch.notes.map((n) => (n[3] ?? 0.8).toFixed(4))).size, `${track.name}/${ch.name}`)
          .toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('the NEAR and FAR balances (§12.6 "two states, not one")', () => {
  const near = rangeVariant(battle, 'near');
  const far = rangeVariant(battle, 'far');

  it('changes the balance and never the notes, so a cross-fade only moves the room', () => {
    for (const variant of [near, far]) {
      expect(variant.bpm).toBe(battle.bpm);
      expect(variant.loop).toEqual(battle.loop);
      variant.channels.forEach((ch, i) => expect(ch.notes).toBe(battle.channels[i]!.notes));
    }
  });

  it('assigns every channel of the cue to a range group', () => {
    for (const ch of battle.channels) expect(RANGE_GROUP[ch.name ?? ''], ch.name).toBeDefined();
  });

  it('puts the percussion forward at NEAR and nearly out at FAR, and the air the other way', () => {
    expect(RANGE_MIX.near.percussion.gain).toBeGreaterThan(1);
    expect(RANGE_MIX.far.percussion.gain).toBeLessThan(0.5);
    expect(RANGE_MIX.far.air.gain).toBeGreaterThan(RANGE_MIX.near.air.gain);
    expect(RANGE_MIX.far.lead.send).toBeGreaterThan(RANGE_MIX.near.lead.send);
  });
});
