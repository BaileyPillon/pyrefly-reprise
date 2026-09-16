/**
 * "A City That Never Was" — Dream's End (inside Sin) scene theme.
 *
 * ORIGINAL COMPOSITION. Deep inside the fiend, a memory that isn't anyone's:
 * a beautiful, uncanny city assembled from pieces that don't belong together.
 * 76 bpm, 4/4. Harmony drifts through whole-tone and augmented colour, root
 * movement by whole step so nothing ever resolves the way a cadence should —
 * there is no tonic to return to for more than a bar. A celesta music-box
 * figure repeats mechanically at a fixed pitch regardless of the chord
 * underneath it (the toy doesn't know the room around it keeps changing),
 * under pad swells, a distant choir, an occasional bell and a shaker held
 * low and constant, like static on an old recording.
 *
 * `PYREFLY_RISE` returns bent toward whole-tone: its 2nd becomes a #4 and its
 * minor 3rd becomes a major 3rd (`DISTORTED_RISE` below) — the same rising
 * shape, familiar, but the ending lands wrong. Stated once quietly in the
 * choir at the top of the loop, and once more, exposed, a whole step higher
 * on a hollow pwm-lead at the section's peak.
 *
 * Form (4/4, 32 bars, 101.1 s):
 *   bars  1-4    intro   beats   0- 16   celesta alone, static starts
 *   bars  5-12   A       beats  16- 48   pad + distant choir enter,        <- loop start
 *                                        DISTORTED_RISE stated (quiet)
 *   bars 13-20   B       beats  48- 80   root cycle shifts a whole step up,
 *                                        celesta an octave higher
 *   bars 21-28   C       beats  80-112   augmented triads throughout — the
 *                                        least tonal, most dreamlike stretch;
 *                                        DISTORTED_RISE again, exposed, on
 *                                        pwm-lead
 *   bars 29-32   outro   beats 112-128   recedes to celesta + static, one
 *                                        bell, leading back into the loop
 * Loop 16 -> 128 (88.4 s); the outro's C major chord resolves — as much as
 * anything here resolves — straight into A's opening C.
 */

import {
  chordLine,
  concatNotes,
  repeatNotes,
  shiftNotes,
  transposeNotes,
  tracker,
  drumLine,
  type Note,
  type Track,
} from '../score.ts';
import { cell, PYREFLY_RISE } from './motifs.ts';

const A = 16;
const B = 48;
const C = 80;
const OUTRO = 112;
const LENGTH = 128;

/** Root movement by whole step, never landing on a functional cadence. */
const A_CHORDS = ['C', 'D', 'E', 'Gb', 'Ab', 'Bb', 'C', 'D'];
const B_CHORDS = ['D', 'E', 'Gb', 'Ab', 'Bb', 'C', 'D', 'E'];
const C_CHORDS = ['Caug', 'Eaug', 'Gbaug', 'Bbaug', 'Caug', 'Eaug', 'Gbaug', 'Bbaug'];
const OUTRO_CHORDS = ['Bb', 'Gb', 'D', 'C'];

/** `PYREFLY_RISE` with its 2nd bent to a #4 and its minor 3rd bent to a major 3rd. */
const DISTORTED_RISE: Note[] = PYREFLY_RISE.map(([start, dur, offset, vel]) => {
  const bent = offset === 2 ? 6 : offset === 3 ? 4 : offset;
  return [start, dur, bent, vel] as Note;
});

const RUN = 'C5:0.5 D5:0.5 E5:0.5 Gb5:0.5 Ab5:0.5 Bb5:0.5 C6:0.5 Ab5:0.5';
const RUN_DENSE =
  'C5:0.25 D5:0.25 E5:0.25 Gb5:0.25 Ab5:0.25 Bb5:0.25 C6:0.25 Bb5:0.25 ' +
  'Ab5:0.25 Gb5:0.25 E5:0.25 D5:0.25 C5:0.25 D5:0.25 E5:0.25 Gb5:0.25';

/** The music box: the same figure, tiled every bar, unrelated to the chord underneath. */
function musicBox(src: string, startBeat: number, times: number, transpose: number, velocity: number): Note[] {
  const base = tracker(src, { velocity });
  const shifted = transpose ? transposeNotes(base, transpose) : base;
  return shiftNotes(repeatNotes(shifted, times, 4), startBeat);
}

function celestaLine(): Note[] {
  return concatNotes(
    musicBox(RUN, 0, 4, 0, 0.4),
    musicBox(RUN, A, 8, 0, 0.5),
    musicBox(RUN, B, 8, 12, 0.42),
    musicBox(RUN_DENSE, C, 8, 0, 0.58),
    musicBox(RUN, OUTRO, 4, -12, 0.3),
  );
}

function padLine(): Note[] {
  return concatNotes(
    chordLine(A_CHORDS, { start: A, octave: 3, center: 64, velocity: 0.18, dur: 3.8, roll: 0.08 }),
    chordLine(B_CHORDS, { start: B, octave: 3, center: 66, velocity: 0.32, dur: 3.8, roll: 0.1 }),
    chordLine(C_CHORDS, { start: C, octave: 3, center: 68, velocity: 0.46, dur: 3.8, roll: 0.12 }),
    chordLine(OUTRO_CHORDS, { start: OUTRO, octave: 3, center: 64, velocity: 0.2, dur: 3.8, roll: 0.08 }),
  );
}

/** A sustained bed plus the two DISTORTED_RISE statements — the first one lives here, soft. */
function choirLine(): Note[] {
  return concatNotes(
    chordLine(A_CHORDS, { start: A, octave: 4, center: 69, velocity: 0.12, dur: 3.7 }),
    chordLine(B_CHORDS, { start: B, octave: 4, center: 70, velocity: 0.22, dur: 3.7 }),
    chordLine(C_CHORDS, { start: C, octave: 4, center: 71, velocity: 0.32, dur: 3.7 }),
    chordLine(OUTRO_CHORDS, { start: OUTRO, octave: 4, center: 69, velocity: 0.15, dur: 3.7 }),
    cell(DISTORTED_RISE, A, 'C4', 0.4),
  );
}

/** The second, exposed statement of the bent rise — a whole step up, on a hollow lead. */
function pwmLine(): Note[] {
  return cell(DISTORTED_RISE, C + 8, 'D4', 0.55);
}

/** Five uneven, distant tolls on the #4 — never landing on a chord tone. */
function bellLine(): Note[] {
  return [
    [6, 4, 'Gb4', 0.4],
    [28, 4, 'Ab4', 0.36],
    [58, 4, 'Gb5', 0.4],
    [90, 4.5, 'Ab5', 0.44],
    [120, 4, 'Gb4', 0.28],
  ];
}

/** Constant soft static, growing brighter through the drift and receding at the end —
 * it also means no bar in the loop is ever truly silent. */
function shakerLine(): Note[] {
  const hits = 'x'.repeat(16);
  return concatNotes(
    drumLine(hits, { start: 0, step: 0.25, pitch: 'C4', velocity: 0.12, times: 4 }),
    drumLine(hits, { start: A, step: 0.25, pitch: 'C4', velocity: 0.16, times: 8 }),
    drumLine(hits, { start: B, step: 0.25, pitch: 'C4', velocity: 0.22, times: 8 }),
    drumLine(hits, { start: C, step: 0.25, pitch: 'C4', velocity: 0.28, times: 8 }),
    drumLine(hits, { start: OUTRO, step: 0.25, pitch: 'C4', velocity: 0.14, times: 4 }),
  );
}

export const dreamsEndTrack: Track = {
  name: 'scene-dreams-end',
  bpm: 76,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  fx: {
    reverb: { room: 0.88, damp: 0.2, width: 1, preDelay: 0.04 },
    delay: { timeBeats: 0.875, feedback: 0.34, damp: 2400 },
  },
  channels: [
    { name: 'celesta', instrument: 'celesta', volume: 0.62, pan: 0.15, notes: celestaLine(), fx: { reverb: 0.4, delay: 0.28 } },
    { name: 'pad', instrument: 'pad', volume: 0.6, pan: -0.05, notes: padLine(), fx: { reverb: 0.5 } },
    { name: 'choir', instrument: 'choir', volume: 0.7, pan: -0.1, notes: choirLine(), fx: { reverb: 0.55 } },
    { name: 'pwm memory', instrument: 'pwm-lead', volume: 0.5, pan: 0.2, notes: pwmLine(), fx: { reverb: 0.45, delay: 0.3 } },
    { name: 'bell', instrument: 'bell', volume: 0.4, pan: 0.3, notes: bellLine(), fx: { reverb: 0.6, delay: 0.25 } },
    { name: 'shaker', instrument: 'shaker', volume: 0.35, pan: 0, notes: shakerLine(), fx: { reverb: 0.2 } },
  ],
};

export default dreamsEndTrack;
