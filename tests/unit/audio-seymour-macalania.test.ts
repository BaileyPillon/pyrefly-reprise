import { describe, expect, it } from 'vitest';

import { INSTRUMENTS } from '../../src/audio/instruments.ts';
import { toMidi, type Note } from '../../src/audio/score.ts';
import { getTrack, MUSIC_KEYS } from '../../src/audio/tracks/index.ts';
import { SEYMOUR } from '../../src/audio/tracks/themes.ts';
import { SEYMOUR_ANIMA_MACALANIA } from '../../src/data/chapter-seymour-anima-macalania.ts';
import { SEYMOUR_ANIMA_MACALANIA_META } from '../../src/data/chapter-meta-seymour-anima-macalania.ts';
import { seymourAnimaMacalaniaGroup } from '../../src/data/ffx/enemies/seymour-anima-macalania.ts';

/**
 * Chapter VII's battle cue, `boss-seymour-macalania` ("The Courtesy") — FFX
 * only. Each assertion is a line of research/ffx-seymour-anima-macalania.md
 * §9.8, docs/plans/chapter-macalania-review.md §6.3, or the sketch Bailey
 * picked, that a later edit could silently undo.
 */

const cue = getTrack('boss-seymour-macalania');
const channel = (prefix: string) => cue.channels.find((c) => (c.name ?? '').startsWith(prefix))!;

const CURDLE = 112;
const RISE = 160;
const COMPOSURE = 208;

function intervals(notes: Note[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < notes.length; i++) out.push(toMidi(notes[i]![2]) - toMidi(notes[i - 1]![2]));
  return out;
}

const within = (notes: Note[], from: number, to: number): Note[] => notes.filter((n) => n[0] >= from && n[0] < to);
const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

describe('registration and wiring', () => {
  it('is a final music key', () => {
    expect(MUSIC_KEYS).toContain('boss-seymour-macalania');
  });

  it('only names instruments the runtime fallback can also play', () => {
    for (const ch of cue.channels) {
      expect(Object.prototype.hasOwnProperty.call(INSTRUMENTS, ch.instrument), ch.name).toBe(true);
    }
  });

  it('is the chapter battle cue, the formation start cue and in the jukebox list', () => {
    expect(SEYMOUR_ANIMA_MACALANIA.music.battle).toBe('boss-seymour-macalania');
    expect(seymourAnimaMacalaniaGroup.musicCues?.find((c) => c.at === 'start')?.track).toBe('boss-seymour-macalania');
    expect(SEYMOUR_ANIMA_MACALANIA_META.musicKeys).toContain('boss-seymour-macalania');
  });
});

describe('the brief (§9.8): unhurried, a short loop, C# minor', () => {
  it('runs at 126 bpm with no tempo map, and loops on barlines for about two minutes', () => {
    expect(cue.bpm).toBe(126);
    expect(cue.tempo).toBeUndefined();
    expect(cue.loop.start % 4).toBe(0);
    expect(cue.loop.end % 4).toBe(0);
    const seconds = (cue.length * 60) / cue.bpm;
    expect(seconds).toBeGreaterThan(110);
    expect(seconds).toBeLessThan(145);
  });

  it('states the theme — SEYMOUR\'s six-note interval sequence — on the oboe', () => {
    const oboe = channel('oboe').notes;
    const want = intervals(SEYMOUR);
    expect(intervals(oboe.slice(0, 6))).toEqual(want);
    // The published velocity shape: the snap up to the b6 is quieter than the note before it.
    expect(oboe[1]![3]!).toBeLessThan(oboe[0]![3]!);
  });
});

describe('the anti-brief', () => {
  it('has no organ, choir, synth or kit — nothing that belongs to the Flux chapter', () => {
    const banned = ['organ', 'choir', 'pad', 'supersaw', 'synth-bass', 'pwm-lead', 'kick', 'snare', 'hat', 'kick-808', 'snare-909'];
    for (const ch of cue.channels) expect(banned, ch.name).not.toContain(ch.instrument);
  });

  it('never runs the dance as an ostinato: it rests in every four-bar phrase', () => {
    const dance = channel('harpsichord').notes;
    for (let phrase = 0; phrase < cue.length; phrase += 16) {
      const inPhrase = within(dance, phrase, phrase + 16);
      if (inPhrase.length === 0) continue;
      // The last half-bar holds one chord (a bow), never the running figure.
      const tail = within(dance, phrase + 14, phrase + 16);
      expect(new Set(tail.map((n) => n[0])).size, `bars ${phrase / 4 + 1}-${phrase / 4 + 4}`).toBeLessThanOrEqual(1);
    }
  });

  it('silences the harpsichord through the curdle and the rise', () => {
    expect(within(channel('harpsichord').notes, CURDLE, CURDLE + 32)).toEqual([]);
    expect(within(channel('harpsichord').notes, RISE, COMPOSURE)).toEqual([]);
  });
});

describe('the slither, the rise, the composure', () => {
  it('declines by semitone for more than an octave and never lands on the tonic', () => {
    const line = [
      ...within(channel('violins').notes, CURDLE, CURDLE + 24),
      ...within(channel('clarinet').notes, CURDLE + 24, CURDLE + 32),
    ].sort((a, b) => a[0] - b[0]);
    const steps = intervals(line);
    expect(steps.length).toBeGreaterThanOrEqual(13);
    for (const s of steps) expect(s).toBe(-1);
    expect(toMidi(line.at(-1)![2]) % 12).not.toBe(1); // not C#
  });

  it('rises once: the rise is the densest and loudest stretch, and composure falls back', () => {
    const loudness = (from: number, to: number): number =>
      cue.channels.reduce((sum, ch) => sum + within(ch.notes, from, to).reduce((s, n) => s + (n[3] ?? 0.8) * (ch.volume ?? 1), 0), 0) /
      ((to - from) / 4);
    const rise = loudness(RISE, COMPOSURE);
    for (const [from, to] of [[16, 48], [48, 80], [80, 112], [112, 144], [208, 240]] as const) {
      expect(rise, `rise vs ${from}-${to}`).toBeGreaterThan(loudness(from, to));
    }
  });

  it('closes the rise on a plagal amen that resolves to the wrong chord (iv to bVI)', () => {
    const amen = within(channel('violins').notes, 200, 208);
    const first = new Set(amen.filter((n) => n[0] === 200).map((n) => toMidi(n[2]) % 12));
    const second = new Set(amen.filter((n) => n[0] === 204).map((n) => toMidi(n[2]) % 12));
    expect([...first].sort()).toEqual([1, 6, 9]); // F#m
    expect(second.has(9) && second.has(1) && second.has(4) && second.has(8)).toBe(true); // Amaj7
  });

  it('never holds one velocity across a channel', () => {
    for (const ch of cue.channels) {
      if (ch.notes.length < 16) continue;
      expect(new Set(ch.notes.map((n) => (n[3] ?? 0.8).toFixed(4))).size, ch.name).toBeGreaterThanOrEqual(3);
    }
    expect(mean(channel('quartet').notes.map((n) => n[3]!))).toBeLessThan(mean(within(channel('violins').notes, RISE, 200).map((n) => n[3]!)));
  });
});
