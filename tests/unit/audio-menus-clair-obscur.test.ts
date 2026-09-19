/**
 * The menu register — `title`, `chapter-select`, `pause` — against THEMES.md.
 *
 * These are the three cues a player hears first and most, and nobody working on
 * them can hear them. So every claim the three files make about how they are
 * *performed* is asserted here against the notes the renderer will actually
 * play, rather than against a comment.
 *
 * The one that matters most is the appoggiatura rule, and it is checked twice
 * over, deliberately:
 *
 *   1. Every pair each cue DECLARES in its own `APPOGGIATURAS` table leans.
 *      That catches a regression in the performance helpers.
 *   2. Every pair that has the SHAPE the bible describes — a note held two or
 *      three beats giving way to a much shorter one a step below — leans,
 *      whether anybody declared it or not. That catches the failure declaring
 *      cannot: an arranger who did not notice a lean was there.
 *
 * Check 2 is the criterion `tools/audio/themes-audit.mjs` uses, on purpose. It
 * is the check that found the real bug in this pass: `pause`'s soprano walked
 * `A4 - G4 - F#4` across the bar 6/7 line, and because `lean()` takes pairs and
 * that is a chain, the G4 came out at 0.50 against an F#4 at 0.59 — backwards,
 * in the quietest and barest cue in the game.
 */

import { describe, expect, it } from 'vitest';

import { toMidi, tempoCurveOf, tempoWarnings, type Note, type Track } from '../../src/audio/score.ts';
import { descent, type Appoggiatura } from '../../src/audio/tracks/menus-perform.ts';
import { titleTrack, APPOGGIATURAS as TITLE_PAIRS } from '../../src/audio/tracks/title.ts';
import {
  chapterSelectTrack,
  APPOGGIATURAS as CHAPTER_PAIRS,
} from '../../src/audio/tracks/chapter-select.ts';
import { pauseTrack, APPOGGIATURAS as PAUSE_PAIRS } from '../../src/audio/tracks/pause.ts';

interface Cue {
  track: Track;
  pairs: Appoggiatura[];
}

const CUES: Cue[] = [
  { track: titleTrack, pairs: TITLE_PAIRS },
  { track: chapterSelectTrack, pairs: CHAPTER_PAIRS },
  { track: pauseTrack, pairs: PAUSE_PAIRS },
];

function channelOf(track: Track, name: string) {
  const channel = track.channels.find((c) => c.name === name);
  if (!channel) throw new Error(`${track.name}: no channel named "${name}"`);
  return channel;
}

/** The note a declared beat refers to. Agogic timing moves starts a little. */
function noteAt(notes: readonly Note[], beat: number): Note {
  let best: Note | undefined;
  let bestGap = Infinity;
  for (const n of notes) {
    const gap = Math.abs(n[0] - beat);
    if (gap < bestGap) {
      best = n;
      bestGap = gap;
    }
  }
  if (!best || bestGap > 0.26) throw new Error(`no note within a quarter beat of ${beat}`);
  return best;
}

const velocityOf = (n: Note): number => n[3] ?? 0.8;

describe('menus-clair-obscur: the appoggiatura rule', () => {
  for (const { track, pairs } of CUES) {
    it(`${track.name}: every declared leaning note is louder than its resolution`, () => {
      expect(pairs.length).toBeGreaterThan(0);
      for (const pair of pairs) {
        const notes = channelOf(track, pair.channel).notes;
        const lean = noteAt(notes, pair.lean);
        const resolve = noteAt(notes, pair.resolve);
        const margin = velocityOf(lean) - velocityOf(resolve);
        // THEMES.md asks for +0.08 on a marked lean and this file's `descent()`
        // lays chains out at 0.04-0.05 a link; 0.02 is the floor below which a
        // render's own velocity quantisation (1/64) could erase the gesture.
        expect(
          margin,
          `${track.name} / ${pair.channel} / ${pair.where}: leaning note ${velocityOf(lean).toFixed(3)} ` +
            `against its resolution ${velocityOf(resolve).toFixed(3)}`,
        ).toBeGreaterThanOrEqual(0.02);
        // ...and it has to actually be a fall, or it is not an appoggiatura.
        expect(toMidi(lean[2]), `${pair.where}: the resolution is not below the lean`).toBeGreaterThan(
          toMidi(resolve[2]),
        );
      }
    });
  }
});

/**
 * `tools/audio/themes-audit.mjs`'s own shape test, applied to every channel of
 * these three cues rather than only to the ones that state FAREWELL.
 *
 * A note at least 1.5 beats long, at least twice the length of the note that
 * follows it immediately, one or two semitones above it. That pair is
 * unambiguous in this score, and the bible's rule is that the held note is the
 * louder of the two.
 */
function shapedLeans(track: Track): Array<{ channel: string; a: Note; b: Note }> {
  const found: Array<{ channel: string; a: Note; b: Note }> = [];
  for (const channel of track.channels) {
    const notes = [...channel.notes].sort((x, y) => x[0] - y[0] || toMidi(x[2]) - toMidi(y[2]));
    for (let i = 0; i + 1 < notes.length; i++) {
      const a = notes[i]!;
      const b = notes[i + 1]!;
      const step = toMidi(b[2]) - toMidi(a[2]);
      const adjacent = Math.abs(b[0] - (a[0] + a[1])) < 0.26;
      const held = a[1] >= 1.5 && a[1] >= b[1] * 2;
      if (!adjacent || !held || (step !== -1 && step !== -2)) continue;
      found.push({ channel: channel.name ?? channel.instrument, a, b });
    }
  }
  return found;
}

describe('menus-clair-obscur: leaning notes nobody declared', () => {
  for (const { track, pairs } of CUES) {
    it(`${track.name}: every note of the bible's shape leans, and is declared`, () => {
      const shaped = shapedLeans(track);
      expect(shaped.length, `${track.name}: the shape scan found nothing to check`).toBeGreaterThan(0);
      const declared = new Set(pairs.map((p) => `${p.channel}@${p.lean.toFixed(3)}`));
      for (const { channel, a, b } of shaped) {
        expect(
          velocityOf(a),
          `${track.name} / ${channel} at beat ${a[0]}: a ${a[1]}-beat note falling onto a ` +
            `${b[1]}-beat note a step below, and it is the QUIETER of the two`,
        ).toBeGreaterThan(velocityOf(b));
        expect(
          declared.has(`${channel}@${a[0].toFixed(3)}`),
          `${track.name} / ${channel} at beat ${a[0]}: leans, but is missing from APPOGGIATURAS`,
        ).toBe(true);
      }
    });
  }
});

describe('menus-clair-obscur: dynamics', () => {
  for (const { track } of CUES) {
    it(`${track.name}: no channel is rendered at constant velocity`, () => {
      for (const channel of track.channels) {
        const vs = channel.notes.map(velocityOf);
        expect(vs.length).toBeGreaterThan(0);
        const mean = vs.reduce((x, y) => x + y, 0) / vs.length;
        const sd = Math.sqrt(vs.reduce((x, y) => x + (y - mean) ** 2, 0) / vs.length);
        // THEMES.md names exactly two constant-velocity channels in the whole
        // score — the Yunalesca canon and Vegnagun's machine — and neither is
        // in this group.
        expect(sd, `${track.name} / ${channel.name}: velocity never moves`).toBeGreaterThan(0.005);
      }
    });

    it(`${track.name}: velocity stays inside the renderable range`, () => {
      for (const channel of track.channels) {
        for (const note of channel.notes) {
          expect(velocityOf(note)).toBeGreaterThan(0);
          expect(velocityOf(note)).toBeLessThanOrEqual(1);
        }
      }
    });
  }

  it('descent() keeps the phrase at the level the table gave it', () => {
    const line: Note[] = [
      [0, 2, 'A4', 0.6],
      [2, 2, 'G4', 0.5],
      [4, 1, 'F#4', 0.7],
    ];
    const out = descent(line, [0, 2, 4], 0.05);
    const before = line.reduce((a, n) => a + velocityOf(n), 0) / 3;
    const after = out.reduce((a, n) => a + velocityOf(n), 0) / 3;
    expect(after).toBeCloseTo(before, 10);
    expect(velocityOf(out[0]!) - velocityOf(out[1]!)).toBeCloseTo(0.05, 10);
    expect(velocityOf(out[1]!) - velocityOf(out[2]!)).toBeCloseTo(0.05, 10);
  });

  it('descent() refuses a chain that is not there', () => {
    expect(() => descent([[0, 2, 'A4', 0.6]], [0, 9], 0.05)).toThrow(/does not exist/);
  });
});

/**
 * THEMES.md's humanisation table, as the bands each of these lines sits in.
 * The shared section presets are far wider than any of this — `choir` scatters
 * a section's entries by 34 ms — so every channel here overrides its preset,
 * and this asserts it did and landed in the right band.
 */
const JITTER_BAND: Record<string, [number, number]> = {
  'piano melody': [6, 9],
  'piano left hand': [6, 9],
  'piano bass': [6, 9],
  'piano waltz': [6, 9],
  quartet: [8, 14],
  strings: [8, 14],
  cello: [8, 12],
  cellos: [8, 12],
  'distant voice': [8, 12],
  soprano: [8, 12],
  'tenor drone': [12, 18],
};

describe('menus-clair-obscur: humanisation', () => {
  for (const { track } of CUES) {
    it(`${track.name}: timing jitter is inside the bible's band`, () => {
      for (const channel of track.channels) {
        const band = JITTER_BAND[channel.name ?? ''];
        if (!band) continue;
        const jitter = channel.perform?.timingJitterMs;
        expect(jitter, `${track.name} / ${channel.name}: no timing override`).toBeDefined();
        expect(jitter!).toBeGreaterThanOrEqual(band[0]);
        expect(jitter!).toBeLessThanOrEqual(band[1]);
      }
    });

    it(`${track.name}: no channel exceeds the +/-0.04 velocity-jitter ceiling`, () => {
      for (const channel of track.channels) {
        expect(channel.perform?.velocityJitter ?? 0).toBeLessThanOrEqual(0.04);
      }
    });
  }
});

describe('menus-clair-obscur: the pulse', () => {
  for (const { track } of CUES) {
    it(`${track.name}: the loop wraps onto the pulse it left`, () => {
      // A cue whose tempo at loop.end differs from its tempo at loop.start
      // lurches on every single wrap, forever. This is the loop-seam problem
      // one level up, and it is the one way a tempo map makes a cue worse.
      expect(tempoWarnings(track)).toEqual([]);
      const curve = tempoCurveOf(track);
      expect(curve.bpmAt(track.loop.start)).toBeCloseTo(curve.bpmAt(track.loop.end), 6);
    });
  }

  it('title and chapter-select have a tempo map; the hymn does not', () => {
    // THEMES.md, twice: HYMN is "the only lyrical theme with none", and the
    // rubato table gives it and the Yunalesca canon **zero**. `pause` is HYMN,
    // so its rubato is written as rests and as the appoggiatura at bar 8, and
    // giving it a tempo map would be a change to the bible first.
    expect(tempoCurveOf(titleTrack).hasMap).toBe(true);
    expect(tempoCurveOf(chapterSelectTrack).hasMap).toBe(true);
    expect(tempoCurveOf(pauseTrack).hasMap).toBe(false);
  });

  it('chapter-select: the waltz leans into beat two and still keeps its bar', () => {
    const curve = tempoCurveOf(chapterSelectTrack);
    const bar = (3 * 60) / 84;
    // Every bar of the loop lasts exactly what 84 bpm says a 3/4 bar lasts, so
    // nothing accumulates across thirty-two bars under a loop — while inside
    // the bar, beat two arrives early and beat three is given its time back.
    for (let beat = 6; beat + 3 <= chapterSelectTrack.loop.end; beat += 3) {
      const length = curve.secondsAt(beat + 3) - curve.secondsAt(beat);
      const written = beat >= 54 && beat < 78 ? (3 * 60) / 81 : bar;
      // The phrase-end bars slow on purpose (a breath, and the cadence), so
      // they are the bars allowed to be longer than written.
      const breath = (beat - 6) % 24 === 9 || (beat - 6) % 24 === 21;
      if (breath) expect(length).toBeGreaterThan(written);
      else expect(length).toBeCloseTo(written, 9);
    }
    // The lean itself: the first beat of a bar is shorter than the written one.
    const first = curve.secondsAt(7) - curve.secondsAt(6);
    expect(first).toBeLessThan(60 / 84);
    expect(curve.secondsAt(8) - curve.secondsAt(7)).toBeGreaterThan(60 / 84);
  });

  it('title: the phrase ends breathe and the cadence lingers', () => {
    const curve = tempoCurveOf(titleTrack);
    const base = titleTrack.bpm;
    for (const breath of [23, 39, 71]) expect(curve.bpmAt(breath)).toBeLessThan(base);
    // The close that will not close: slower than anything else in the cue.
    expect(curve.bpmAt(87)).toBeLessThan(curve.bpmAt(23));
    // ...and then straight back onto the tempo the loop restarts at.
    expect(curve.bpmAt(titleTrack.length)).toBeCloseTo(base, 6);
  });
});
