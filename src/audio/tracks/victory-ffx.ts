/**
 * "Bright After the Storm" — the victory fanfare and the results loop.
 *
 * ORIGINAL COMPOSITION. C major, 4/4, 120 bpm. Four bars of brass, then eight
 * bars of rest played four times over, each time in a different light.
 *
 * THEMES (docs/audio/THEMES.md §6 and the cue map, row 15)
 *   VICTORY_FANFARE, one shot, built to be unlike the famous one on purpose:
 *   it opens on its LONGEST note instead of three short ones, it FALLS and
 *   then arches by step instead of rising through an arpeggio, and it closes
 *   PLAGAL — F to C, the melody sighing 4 to 3, which is the score's AMEN in
 *   the major. Winning is meant to read as relief, not as a trophy.
 *   VICTORY_LOOP, the relaxed eight bars after it. No dominant anywhere: a
 *   results screen should feel like rest, not like arrival.
 *   FAREWELL's incipit in the major (PYREFLY_RISE_MAJOR) on solo flute across
 *   bars 7-8 of the loop, twice in the cue and unremarked. Nobody will
 *   consciously notice; everybody will feel that the victory belongs to the
 *   same story as the goodbye.
 *
 * THE ONE EMOTION: relief, not triumph.
 *
 * Performance rules applied: the fanfare's closing F4 leans on the E4 it
 * falls to and is LOUDER than it; the loop's four passes are an arch of their
 * own (0.62 / 0.70 / 0.80 / 0.56) so the last pass hands the loop back to the
 * first without a step; nothing here is at constant velocity and nothing here
 * is loud.
 *
 * Form (36 bars, 144 beats, 72 s):
 *   bar   1- 4  fanfare  beats   0- 16  brass, horns, timpani, one cymbal
 *   bars  5-12  pass 1   beats  16- 48  pizzicato tune, piano under it       <- loop start
 *   bars 13-20  pass 2   beats  48- 80  piano takes the tune, harp, flute tag
 *   bars 21-28  pass 3   beats  80-112  strings an octave up, horns, light kit
 *   bars 29-36  pass 4   beats 112-144  back to pizzicato and air; flute tag closes
 */

import {
  arpLine,
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import {
  PYREFLY_RISE_MAJOR,
  VICTORY_FANFARE,
  VICTORY_FANFARE_CHORDS,
  VICTORY_LOOP,
  VICTORY_LOOP_CHORDS,
} from './themes.ts';

const BAR = 4;
const R1 = 16;
const R2 = 48;
const R3 = 80;
const R4 = 112;
const LENGTH = 144;
const PASSES = [R1, R2, R3, R4];

// ---------------------------------------------------------------------------
// The fanfare
// ---------------------------------------------------------------------------

/**
 * Four bars and not a beat more. The last two notes are the amen: F4 over the
 * IV falling to E4 over the tonic, and the F4 — the leaning note — is the
 * louder of the pair. Machines always invert that, and inverting it is the
 * loudest tell of a synthetic performance.
 */
function fanfare(velocity: number, transpose = 0): Note[] {
  const arch = [0.84, 0.88, 0.92, 0.86];
  return tracker(VICTORY_FANFARE, { transpose, gate: 0.98, checkBars: BAR }).map((n): Note => {
    const bar = Math.floor(n[0] / BAR);
    let v = (arch[Math.min(bar, 3)] ?? 0.85) * velocity;
    if (n[0] === 12) v += 0.06; // the leaning F4
    if (n[0] === 14) v -= 0.06; // its resolution
    return [n[0], n[1], n[2], Math.min(1, v)];
  });
}

function fanfareHarmony(): Note[] {
  return chordLine(VICTORY_FANFARE_CHORDS, {
    barBeats: 2, octave: 3, center: 60, velocity: 0.52, dur: 1.9, roll: 0.05,
  });
}

function fanfareTimpani(): Note[] {
  return concatNotes(
    [[0, 2.6, 'C2', 0.6] as Note],
    [[4, 1.6, 'F2', 0.44] as Note],
    [[8, 1.6, 'A2', 0.4] as Note],
    drumLine('x.x.X...', { start: 12, step: 0.5, pitch: 'F2', velocity: 0.34, accentVelocity: 0.5 }),
    [[14, 2.4, 'C2', 0.46] as Note],
  );
}

// ---------------------------------------------------------------------------
// The results loop
// ---------------------------------------------------------------------------


/**
 * Nothing in this score holds one velocity for thirty seconds. A drone, a
 * shaker or a held pad written at a fixed level is the most machine-like
 * thing a mock-up can do, and it is also the easiest thing to fix: a slow
 * sine and a deterministic per-note wobble, both small enough that nobody
 * hears the device and everybody hears that the sound is alive.
 */
function breathe(notes: Note[], periodBeats: number, depth: number, wobble = 0): Note[] {
  return notes.map((n, i): Note => {
    const swell = 1 + depth * Math.sin((2 * Math.PI * n[0]) / periodBeats);
    const jitter = wobble === 0 ? 1 : 1 + wobble * Math.sin(i * 2.399963);
    return [n[0], n[1], n[2], Math.max(0.02, Math.min(1, (n[3] ?? 0.8) * swell * jitter))];
  });
}

/** Each pass has its own level; together they are one long arch back into the loop. */
const PASS_LEVEL = [0.62, 0.7, 0.8, 0.56];

/** A gentle per-bar shape inside a pass, so no eight bars are ever flat. */
const BAR_SHAPE = [1, 1.04, 0.98, 1.06, 1, 1.05, 0.96, 0.92];

function loopTune(pass: number, transpose = 0, trim = 1): Note[] {
  const start = PASSES[pass]!;
  return tracker(VICTORY_LOOP, { start, transpose, gate: 0.99, checkBars: BAR }).map((n): Note => {
    const bar = Math.floor((n[0] - start) / BAR);
    return [n[0], n[1], n[2], Math.min(1, PASS_LEVEL[pass]! * (BAR_SHAPE[bar] ?? 1) * trim)];
  });
}

/** The tag: FAREWELL's four degrees in the major, one octave above the tune. */
function fluteTag(): Note[] {
  return concatNotes(
    ...[R2, R4].map((start, i) =>
      motif(PYREFLY_RISE_MAJOR, [start + 24], ['C5']).map(
        (n): Note => [n[0], n[1] * 0.99, n[2], (i === 0 ? 0.44 : 0.38) + (n[0] > start + 26 ? 0.04 : 0)],
      ),
    ),
  );
}

function pizzTune(): Note[] {
  return concatNotes(loopTune(0), loopTune(3, 0, 0.95));
}

function pianoTune(): Note[] {
  return loopTune(1);
}

function stringTune(): Note[] {
  return loopTune(2, 12, 0.9);
}

/** Piano comps in every pass but the one where it has the tune. */
function pianoComp(): Note[] {
  return concatNotes(
    arpLine(VICTORY_LOOP_CHORDS, {
      start: R1, pattern: [0, 1, 2, 1], step: 0.5, dur: 0.46, octave: 3, center: 60, velocity: 0.34,
    }),
    arpLine(VICTORY_LOOP_CHORDS, {
      start: R3, pattern: [0, 2, 1, 2], step: 0.5, dur: 0.46, octave: 3, center: 62, velocity: 0.42,
    }),
    arpLine(VICTORY_LOOP_CHORDS, {
      start: R4, pattern: [0, 1, 2, 1], step: 1, dur: 0.9, octave: 3, center: 60, velocity: 0.26,
    }),
  );
}

/** Harp: a rolled chord a bar, never a run. It is here for the shimmer, not the notes. */
function harpBed(): Note[] {
  return concatNotes(
    chordLine(VICTORY_LOOP_CHORDS, {
      start: R2, octave: 4, center: 72, velocity: 0.3, dur: 3.6, roll: 0.12,
    }),
    chordLine(VICTORY_LOOP_CHORDS, {
      start: R4, octave: 4, center: 72, velocity: 0.22, dur: 3.6, roll: 0.16,
    }),
  );
}

function stringBed(): Note[] {
  return concatNotes(
    chordLine(VICTORY_LOOP_CHORDS, { start: R2, octave: 3, center: 64, velocity: 0.24, dur: 3.8 }),
    chordLine(VICTORY_LOOP_CHORDS, { start: R3, octave: 3, center: 64, velocity: 0.36, dur: 3.8 }),
    chordLine(VICTORY_LOOP_CHORDS, { start: R4, octave: 3, center: 64, velocity: 0.18, dur: 3.8 }),
  );
}

/** Horns hold long notes under the third pass and nothing else. Warmth, not brass. */
function hornPad(): Note[] {
  return chordLine(VICTORY_LOOP_CHORDS.filter((_, i) => i % 2 === 0), {
    start: R3, barBeats: 8, octave: 3, center: 55, velocity: 0.34, dur: 7.6, roll: 0.1,
  });
}

/** Cellos walk the roots, one or two a bar. The bass of a results screen should stroll. */
function cellos(): Note[] {
  const notes: Note[] = [];
  for (const [start, level] of [[R1, 0.34], [R2, 0.4], [R3, 0.5], [R4, 0.3]] as Array<[number, number]>) {
    chordRoots(VICTORY_LOOP_CHORDS, 2).forEach((midi, bar) => {
      const at = start + bar * BAR;
      notes.push([at, 2.6, midi, level]);
      if (bar % 2 === 1) notes.push([at + 3, 0.9, midi + 7, level * 0.7]);
    });
  }
  return notes;
}

function shakerLine(): Note[] {
  return concatNotes(
    ...PASSES.map((start, i) =>
      drumLine('x..x..x.x..x..x.', {
        start, step: 0.25, pitch: 'C3', velocity: [0.16, 0.2, 0.26, 0.14][i]!, times: 8,
      }),
    ),
  );
}

/** The only kit in the cue, and only in the fullest pass: kick on 1 and 3, hats on eighths. */
function lightKit(): Note[] {
  return drumLine('x.......x.......', { start: R3, step: 0.25, pitch: 'C1', velocity: 0.42, times: 8 });
}

function hats(): Note[] {
  return drumLine('x.x.x.x.x.x.x.x.', { start: R3, step: 0.25, pitch: 'F#3', velocity: 0.24, times: 8 });
}

function cymbal(): Note[] {
  return [
    [0, 3, 'C5', 0.5],
    [R3, 2, 'C5', 0.34],
  ];
}

export const victoryTrack: Track = {
  name: 'victory-ffx',
  bpm: 120,
  timeSig: [4, 4],
  loop: { start: R1, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.56, damp: 0.4, width: 0.9, preDelay: 0.014 },
    delay: { timeBeats: 0.5, feedback: 0.18, damp: 3000 },
  },
  channels: [
    { name: 'fanfare brass', instrument: 'brass', volume: 0.95, pan: -0.08, notes: fanfare(1), fx: { reverb: 0.28 } },
    {
      name: 'fanfare trumpets',
      instrument: 'brass-stab',
      volume: 0.5,
      pan: 0.12,
      notes: fanfare(0.8, 12).filter((n) => n[0] % 4 === 0),
      fx: { reverb: 0.2 },
    },
    { name: 'fanfare strings', instrument: 'strings', volume: 0.5, pan: 0.1, notes: fanfareHarmony(), fx: { reverb: 0.3 } },
    { name: 'fanfare timpani', instrument: 'timpani', volume: 0.66, pan: 0, notes: fanfareTimpani(), fx: { reverb: 0.3 } },
    { name: 'cymbal', instrument: 'crash', volume: 0.42, pan: 0.1, notes: cymbal(), fx: { reverb: 0.35 } },
    { name: 'pizz tune', instrument: 'pluck', volume: 0.9, pan: 0.08, notes: pizzTune(), fx: { reverb: 0.26 } },
    { name: 'piano tune', instrument: 'piano', volume: 0.85, pan: -0.06, notes: pianoTune(), fx: { reverb: 0.3 } },
    { name: 'strings tune', instrument: 'strings', volume: 0.66, pan: 0.14, notes: stringTune(), fx: { reverb: 0.32, delay: 0.08 } },
    { name: 'flute tag', instrument: 'flute', volume: 0.6, pan: -0.1, notes: fluteTag(), fx: { reverb: 0.34, delay: 0.16 } },
    { name: 'piano comp', instrument: 'piano', volume: 0.55, pan: -0.14, notes: pianoComp(), fx: { reverb: 0.26 } },
    { name: 'harp', instrument: 'harp', volume: 0.5, pan: -0.3, notes: harpBed(), fx: { reverb: 0.34, delay: 0.18 } },
    { name: 'string bed', instrument: 'strings', volume: 0.42, pan: 0.2, notes: breathe(stringBed(), 24, 0.16), fx: { reverb: 0.38 } },
    { name: 'horns', instrument: 'brass', volume: 0.4, pan: -0.26, notes: breathe(hornPad(), 32, 0.15), fx: { reverb: 0.36 } },
    { name: 'cellos', instrument: 'strings-low', volume: 0.55, pan: 0.16, notes: cellos(), fx: { reverb: 0.3 } },
    { name: 'shaker', instrument: 'shaker', volume: 0.3, pan: 0.28, notes: breathe(shakerLine(), 16, 0.26, 0.14), fx: { reverb: 0.18 } },
    { name: 'kick', instrument: 'kick', volume: 0.5, pan: 0, notes: lightKit() },
    { name: 'hats', instrument: 'hat', volume: 0.3, pan: 0.22, notes: breathe(hats(), 8, 0.2, 0.1) },
  ],
};

export default victoryTrack;
