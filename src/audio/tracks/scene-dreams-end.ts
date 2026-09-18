/**
 * "A City That Never Was" — Dream's End, inside Sin.
 *
 * ORIGINAL COMPOSITION. 4/4, 76 bpm, and no tonic anywhere: whole voicings
 * plane in parallel by step, the way an impressionist moves a chord when he
 * has stopped caring what key he is in. Nothing here cadences, because there
 * is nothing to cadence to.
 *
 * THEMES (docs/audio/THEMES.md cue map, row 12)
 *   FAREWELL_RISE, bent. The score's own incipit — 5 below, 1, 2, b3 — with
 *   its 2nd pushed to a #4 and its minor 3rd pulled to a major 3rd, so the
 *   shape is unmistakably familiar and the landing is wrong. Stated three
 *   times: once on celesta, alone, at the top; once in the choir, quietly,
 *   where the drift is thickest; once on a flute, exposed, a whole step
 *   higher, over nothing.
 *
 * THE ONE EMOTION: unmoored.
 *
 * What changed from the first pass: the second statement used to be a hollow
 * synth lead. A synthesiser is exactly what this score is trying to stop
 * sounding like, so the machina voice is gone and the line is a breathy solo
 * flute instead — which is stranger, not less strange, because it is human.
 * The music box keeps its fixed pitches while the harmony moves underneath:
 * the toy does not know the room around it keeps changing.
 *
 * Form (32 bars, 128 beats, 101.1 s):
 *   bars  1- 4  intro   beats   0- 16  celesta alone; the bent rise, once
 *   bars  5-12  A       beats  16- 48  planing triads, choir enters   <- loop start
 *   bars 13-20  B       beats  48- 80  the whole cycle a step higher
 *   bars 21-28  C       beats  80-112  augmented triads; the flute statement
 *   bars 29-32  outro   beats 112-128  back to celesta, one bell, no resolution
 */

import {
  chordLine,
  concatNotes,
  drumLine,
  motif,
  repeatNotes,
  shiftNotes,
  transposeNotes,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { FAREWELL_RISE } from './themes.ts';

const A = 16;
const B = 48;
const C = 80;
const OUTRO = 112;
const LENGTH = 128;


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

/** Root movement by whole step. Any two of these are a step apart and none is home. */
const A_CHORDS = ['C', 'D', 'E', 'Gb', 'Ab', 'Bb', 'C', 'D'];
const B_CHORDS = ['D', 'E', 'Gb', 'Ab', 'Bb', 'C', 'D', 'E'];
const C_CHORDS = ['Caug', 'Eaug', 'Gbaug', 'Bbaug', 'Caug', 'Eaug', 'Gbaug', 'Bbaug'];
const OUTRO_CHORDS = ['Bb', 'Gb', 'D', 'C'];

/**
 * FAREWELL_RISE with its 2nd bent to a #4 and its b3 bent to a major 3rd.
 * Four notes, the same rhythm, and the ear recognises it before it notices
 * that the last two steps are wrong.
 */
const BENT_RISE: Note[] = FAREWELL_RISE.map(([start, dur, offset]): Note => {
  const bent = offset === 2 ? 6 : offset === 3 ? 4 : offset;
  return [start, dur, bent];
});

/** Three statements, three velocities, and a written fall across each one. */
function bentRise(start: number, tonic: string, level: number, stretch = 1): Note[] {
  const shape = [level, level + 0.05, level - 0.03, level - 0.08];
  return motif(BENT_RISE, [start], [tonic]).map((n, i): Note => [
    start + (n[0] - start) * stretch,
    n[1] * stretch * 1.8,
    n[2],
    shape[i]!,
  ]);
}

const RUN = 'C5:0.5 D5:0.5 E5:0.5 Gb5:0.5 Ab5:0.5 Bb5:0.5 C6:0.5 Ab5:0.5';
const RUN_SPARSE = 'C5:1 E5:1 Ab5:1 Bb5:1';

/** The music box: one figure, tiled every bar, indifferent to the chord under it. */
function musicBox(src: string, startBeat: number, times: number, transpose: number, velocity: number): Note[] {
  const base = tracker(src, { velocity });
  const shifted = transpose ? transposeNotes(base, transpose) : base;
  return shiftNotes(repeatNotes(shifted, times, 4), startBeat);
}

function celestaLine(): Note[] {
  return concatNotes(
    musicBox(RUN_SPARSE, 0, 2, 0, 0.36),
    bentRise(8, 'C5', 0.42, 1.5),
    musicBox(RUN, A, 8, 0, 0.44),
    musicBox(RUN, B, 8, 12, 0.38),
    musicBox(RUN, C, 8, 0, 0.5),
    musicBox(RUN_SPARSE, OUTRO, 4, -12, 0.28),
  );
}

/**
 * Planing: the whole voicing moves in parallel by step, with no functional
 * logic at all. The pad is the drift; the strings double it a sixth away so
 * the parallel motion is audible as motion rather than as harmony.
 */
function padLine(): Note[] {
  return concatNotes(
    chordLine(A_CHORDS, { start: A, octave: 3, center: 64, velocity: 0.2, dur: 3.8, roll: 0.09 }),
    chordLine(B_CHORDS, { start: B, octave: 3, center: 66, velocity: 0.32, dur: 3.8, roll: 0.11 }),
    chordLine(C_CHORDS, { start: C, octave: 3, center: 68, velocity: 0.44, dur: 3.8, roll: 0.13 }),
    chordLine(OUTRO_CHORDS, { start: OUTRO, octave: 3, center: 64, velocity: 0.2, dur: 3.8, roll: 0.09 }),
  );
}

function suspendedStrings(): Note[] {
  return concatNotes(
    chordLine(A_CHORDS, { start: A, octave: 3, center: 57, velocity: 0.22, dur: 3.85, roll: 0.05 }),
    chordLine(B_CHORDS, { start: B, octave: 3, center: 59, velocity: 0.3, dur: 3.85, roll: 0.05 }),
    chordLine(C_CHORDS, { start: C, octave: 3, center: 61, velocity: 0.38, dur: 3.85, roll: 0.05 }),
    chordLine(OUTRO_CHORDS, { start: OUTRO, octave: 3, center: 57, velocity: 0.2, dur: 3.85, roll: 0.05 }),
  );
}

/** The low end drifts too — never a pedal, because a pedal would imply a key. */
function lowDrift(): Note[] {
  const all = [...A_CHORDS, ...B_CHORDS, ...C_CHORDS, ...OUTRO_CHORDS];
  return all.map((symbol, bar): Note => {
    const root = /^[A-Ga-g][#b]*/.exec(symbol)![0];
    const at = A + bar * 4;
    const level = at >= C && at < OUTRO ? 0.34 : at >= OUTRO ? 0.2 : 0.26;
    return [at, 3.85, `${root}2`, level];
  });
}

/** A sustained bed, and the second statement of the bent rise inside it. */
function choirLine(): Note[] {
  return concatNotes(
    chordLine(A_CHORDS, { start: A, octave: 4, center: 69, velocity: 0.14, dur: 3.7 }),
    chordLine(B_CHORDS, { start: B, octave: 4, center: 70, velocity: 0.24, dur: 3.7 }),
    chordLine(C_CHORDS, { start: C, octave: 4, center: 71, velocity: 0.32, dur: 3.7 }),
    chordLine(OUTRO_CHORDS, { start: OUTRO, octave: 4, center: 69, velocity: 0.16, dur: 3.7 }),
    bentRise(B + 8, 'D4', 0.4, 1.5),
  );
}

/** The exposed statement: a whole step higher, on one breathy flute, over nothing. */
function fluteLine(): Note[] {
  return bentRise(C + 8, 'D5', 0.5, 2);
}

/** Five uneven tolls on the #4 — never a chord tone, never on a downbeat twice. */
function bellLine(): Note[] {
  return [
    [6, 4, 'Gb4', 0.38],
    [28, 4, 'Ab4', 0.32],
    [58, 4, 'Gb5', 0.36],
    [90, 4.5, 'Ab5', 0.4],
    [120, 4, 'Gb4', 0.26],
  ];
}

/**
 * Air, not static: a soft shaker on the half beat, growing through the drift.
 * It also means no bar in the loop is ever completely silent, which is what
 * keeps the cue feeling like a place rather than a sequence of events.
 */
function airLine(): Note[] {
  return concatNotes(
    drumLine('x...x...x...x...', { start: 0, step: 0.25, pitch: 'C4', velocity: 0.1, times: 4 }),
    drumLine('x...x...x...x...', { start: A, step: 0.25, pitch: 'C4', velocity: 0.13, times: 8 }),
    drumLine('x..x..x.x..x..x.', { start: B, step: 0.25, pitch: 'C4', velocity: 0.17, times: 8 }),
    drumLine('x.x.x.x.x.x.x.x.', { start: C, step: 0.25, pitch: 'C4', velocity: 0.2, times: 8 }),
    drumLine('x...x...x...x...', { start: OUTRO, step: 0.25, pitch: 'C4', velocity: 0.11, times: 4 }),
  );
}

export const dreamsEndTrack: Track = {
  name: 'scene-dreams-end',
  bpm: 76,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  fx: {
    reverb: { room: 0.9, damp: 0.2, width: 1, preDelay: 0.042 },
    delay: { timeBeats: 0.875, feedback: 0.3, damp: 2400 },
  },
  channels: [
    { name: 'celesta', instrument: 'celesta', volume: 0.6, pan: 0.16, notes: celestaLine(), fx: { reverb: 0.42, delay: 0.26 } },
    { name: 'pad', instrument: 'pad', volume: 0.58, pan: -0.06, notes: breathe(padLine(), 26, 0.18), fx: { reverb: 0.5 } },
    { name: 'strings', instrument: 'strings', volume: 0.5, pan: 0.12, notes: breathe(suspendedStrings(), 34, 0.16), fx: { reverb: 0.5 } },
    { name: 'low drift', instrument: 'strings-low', volume: 0.5, pan: -0.16, notes: breathe(lowDrift(), 22, 0.14), fx: { reverb: 0.4 } },
    { name: 'choir', instrument: 'choir', volume: 0.68, pan: -0.1, notes: breathe(choirLine(), 30, 0.18), fx: { reverb: 0.58 } },
    { name: 'flute', instrument: 'flute', volume: 0.6, pan: 0.2, notes: fluteLine(), fx: { reverb: 0.5, delay: 0.3 } },
    { name: 'bell', instrument: 'bell', volume: 0.38, pan: 0.3, notes: bellLine(), fx: { reverb: 0.6, delay: 0.25 } },
    { name: 'air', instrument: 'shaker', volume: 0.3, pan: 0, notes: breathe(airLine(), 19, 0.32, 0.14), fx: { reverb: 0.22 } },
  ],
};

export default dreamsEndTrack;
