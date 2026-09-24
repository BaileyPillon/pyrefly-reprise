import { describe, expect, it } from 'vitest';

import { INSTRUMENTS } from '../../src/audio/instruments.ts';
import { toMidi, tracker, type Note } from '../../src/audio/score.ts';
import { DUTY_LINE, YOJIMBO_LINE } from '../../src/audio/tracks/boss-yojimbo.ts';
import { getTrack, MUSIC_KEYS, TRACK_NOTES } from '../../src/audio/tracks/index.ts';

/**
 * Chapter IX's battle cue, `boss-yojimbo` ("The Summoner's Sorrow") — FFX only.
 * Each assertion is a line of the O-6 brief (docs/plans/chapter-yojimbo-review.md
 * §6.2), of THEMES.md, or of the sketch Bailey picked
 * (tools/audio/scores/2026-09-24/yojimbo-a-summoners-sorrow.mjs) that a later
 * edit could silently undo. Not wired into the chapter's data here: that is the
 * Chapter IX data owner's (docs/concepts/chapters/yojimbo/INSTALLED.md).
 */

const cue = getTrack('boss-yojimbo');
const channel = (prefix: string) => cue.channels.find((c) => (c.name ?? '').startsWith(prefix))!;

const PULSE = 32;
const DUTY = 64;
const OCTAVES = 96;
const STRAIN = 128;
const CRACK = 152;
const CONTROL = 160;

const within = (notes: Note[], from: number, to: number): Note[] => notes.filter((n) => n[0] >= from - 1e-9 && n[0] < to - 1e-9);
const pitches = (notes: Note[]): number[] => [...notes].sort((a, b) => a[0] - b[0]).map((n) => toMidi(n[2]));
const PERCUSSIVE = new Set(['taiko', 'cymbal-swell']);

describe('registration', () => {
  it('is a final music key with its cue-map note', () => {
    expect(MUSIC_KEYS).toContain('boss-yojimbo');
    expect(TRACK_NOTES['boss-yojimbo']?.title).toBe("The Summoner's Sorrow");
  });

  it('only names instruments the runtime fallback can also play', () => {
    for (const ch of cue.channels) {
      expect(Object.prototype.hasOwnProperty.call(INSTRUMENTS, ch.instrument), ch.name).toBe(true);
    }
  });
});

describe('the sketch, kept', () => {
  it('runs at the sketch tempo, loops on barlines from the pulse joining, and is about ninety seconds', () => {
    expect(cue.bpm).toBe(132);
    expect(cue.tempo).toBeUndefined();
    expect(cue.loop).toEqual({ start: PULSE, end: cue.length });
    const seconds = (cue.length * 60) / cue.bpm;
    expect(seconds).toBeGreaterThan(80);
    expect(seconds).toBeLessThan(130);
  });

  it('opens with the line on the solo cello and no battle pulse', () => {
    const cello = channel('cello (the line').notes;
    expect(pitches(within(cello, 0, PULSE))).toEqual(pitches(tracker(YOJIMBO_LINE)));
    for (const name of ['bowed pulse', 'taiko', 'horn', 'violin']) {
      expect(within(channel(name).notes, 0, PULSE), name).toEqual([]);
    }
  });

  it('passes the line to the violin, an octave up, when the pulse joins', () => {
    const violin = channel('violin').notes;
    const want = pitches(tracker(YOJIMBO_LINE)).map((m) => m + 12);
    expect(pitches(within(violin, PULSE, DUTY))).toEqual(want);
    expect(within(channel('bowed pulse').notes, PULSE, PULSE + 1).length).toBeGreaterThan(0);
    expect(within(channel('taiko').notes, PULSE, PULSE + 1).length).toBeGreaterThan(0);
  });

  it('stays in C Aeolian: no raised sixth, no leading tone, so no dominant chord anywhere', () => {
    const aeolian = new Set([0, 2, 3, 5, 7, 8, 10]);
    for (const ch of cue.channels) {
      if (PERCUSSIVE.has(ch.instrument)) continue;
      for (const n of ch.notes) expect(aeolian.has(toMidi(n[2]) % 12), `${ch.name} @${n[0]}`).toBe(true);
    }
  });

  it('cracks once: the flat sixth held at the top of the violin, the pulse and drums stopped dead', () => {
    const violin = channel('violin').notes;
    const top = Math.max(...violin.map((n) => toMidi(n[2])));
    expect(top).toBe(toMidi('Ab5'));
    expect(violin.filter((n) => toMidi(n[2]) === top).every((n) => n[0] >= CRACK && n[0] < CONTROL)).toBe(true);
    for (const name of ['bowed pulse', 'taiko']) expect(within(channel(name).notes, CRACK, CONTROL), name).toEqual([]);
    // For the last two beats of the crack only the piano sounds, one note.
    const sounding = cue.channels.filter((ch) => within(ch.notes, CRACK + 6, CONTROL).length > 0).map((ch) => ch.name);
    expect(sounding).toEqual(['felt piano']);
  });

  it('closes on the amen: the 2 over the iv, louder than the tonic it falls to', () => {
    const cello = channel('cello (answer').notes;
    const amen = within(cello, CONTROL + 24, CONTROL + 32);
    expect(amen.map((n) => n[2])).toEqual([toMidi('D4'), toMidi('C4')]);
    expect(amen[0]![3]!).toBeGreaterThan(amen[1]![3]!);
    const pulse = within(channel('bowed pulse').notes, CONTROL + 24, CONTROL + 28);
    expect(pulse.every((n) => toMidi(n[2]) % 12 === 5)).toBe(true); // F, the iv, under the 2
  });
});

describe('what this pass added (flagged as a guess on the audition page)', () => {
  it('moves the line two steps up the mode for the duty, on one horn', () => {
    const scale = [0, 2, 3, 5, 7, 8, 10];
    const up2 = (m: number): number => {
      const octave = Math.floor(m / 12);
      const i = scale.indexOf(m % 12);
      return octave * 12 + scale[(i + 2) % 7]! + (i + 2 >= 7 ? 12 : 0);
    };
    expect(pitches(tracker(DUTY_LINE))).toEqual(pitches(tracker(YOJIMBO_LINE)).map(up2));
    expect(pitches(within(channel('horn (the duty)').notes, DUTY, OCTAVES))).toEqual(pitches(tracker(DUTY_LINE)));
  });

  it('puts violin and cello in octaves on the line before the strain', () => {
    const high = pitches(within(channel('violin').notes, OCTAVES, STRAIN));
    const low = pitches(within(channel('cello (the line').notes, OCTAVES, STRAIN));
    expect(high).toEqual(low.map((m) => m + 12));
  });

  it('builds section by section into the crack, and control falls back', () => {
    const density = (from: number, to: number): number =>
      cue.channels.reduce((sum, ch) => sum + within(ch.notes, from, to).reduce((s, n) => s + (n[3] ?? 0.8) * (ch.volume ?? 1), 0), 0) /
      ((to - from) / 4);
    const grief = density(0, PULSE);
    const pulse = density(PULSE, DUTY);
    const strain = density(STRAIN, CRACK);
    const control = density(CONTROL, cue.length);
    expect(pulse).toBeGreaterThan(grief);
    expect(density(OCTAVES, STRAIN)).toBeGreaterThan(pulse);
    expect(strain).toBeGreaterThan(density(OCTAVES, STRAIN));
    expect(control).toBeLessThan(strain);
  });

  it('never holds one velocity across a channel', () => {
    for (const ch of cue.channels) {
      if (ch.notes.length < 16) continue;
      expect(new Set(ch.notes.map((n) => (n[3] ?? 0.8).toFixed(4))).size, ch.name).toBeGreaterThanOrEqual(3);
    }
  });
});
