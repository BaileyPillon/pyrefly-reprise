/**
 * "The Weight of a Thousand Years" — Shuyin boss theme.
 *
 * ORIGINAL COMPOSITION. C# minor, 154 bpm, electronic-rock: a fast piano
 * 16th-note riff is the spine, under supersaw chords, double-tracked
 * guitar-dist and a string bed, driven by a full electronic-rock kit. The
 * hook is `LENNE` (the score's love-and-loss cell, from `motifs.ts`) carried
 * by pwm-lead high and accented — his grief for Lenne, sharpened into fury.
 * The B section drops to half-time and hands `augment(LENNE, 2)` to epiano
 * and strings in dorian: the memory underneath the rage, tender before the
 * riff comes back harder.
 *
 * Form (154 bpm, 4/4, 272 beats = 106.0 s):
 *   intro   beats   0- 16   piano riff alone, kick building in            (4 bars)
 *   A1      beats  16- 80   full band, LENNE hook enters in pwm-lead      <- loop start
 *   B       beats  80-144   half-time, epiano + strings carry augment(LENNE,2), dorian
 *   A2      beats 144-208   riff returns harder, hook restated insistently
 *   climax  beats 208-240   fortissimo, hook shouted twice, everything in
 *   turn    beats 240-272   drums fall to a snare roll over a dominant chord
 * Loop 16 -> 272.
 */

import {
  arpLine,
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  type Note,
  type Pitch,
  type Track,
} from '../score.ts';
import { augment, cell, LENNE } from './motifs.ts';

const BPM = 154;
const INTRO = 0;
const A1 = 16;
const B = 80;
const A2 = 144;
const CLIMAX = 208;
const TURN = 240;
const LENGTH = 272;

const INTRO_CHORDS = ['C#m', 'C#m', 'A', 'B'];
const A1_CHORDS = [
  'C#m', 'A', 'E', 'B', 'C#m', 'A', 'E', 'B',
  'C#m', 'A', 'F#m', 'B', 'C#m', 'A', 'E', 'B',
];
const B_CHORDS = [
  'C#m', 'F#', 'E', 'B', 'C#m', 'F#', 'E', 'B',
  'C#m', 'F#', 'G#m', 'B', 'C#m', 'F#', 'E', 'B',
];
const A2_CHORDS = [
  'C#m', 'A', 'E', 'B', 'C#m', 'A', 'E', 'B',
  // bar 10 (index 10) is 'F#' not 'F#m': the hook's raised-6th accent (A#) lands
  // there, and A# is a semitone clash against F#m's own third (A) — F# major
  // makes A# the chord's own third instead, and it's dorian's IV anyway.
  'C#m', 'A', 'F#', 'G#7', 'C#m', 'A', 'B', 'G#7',
];
const CLIMAX_CHORDS = ['C#m', 'E', 'A', 'B', 'C#m', 'A', 'B', 'G#7'];
const TURN_CHORDS = ['C#m', 'C#m', 'F#m', 'F#m', 'G#', 'G#', 'G#7', 'G#7'];

// ---- the LENNE hook and its call/answer split ------------------------------

function stampCell(pattern: Note[], beats: number[], tonic: Pitch, vel: number): Note[] {
  return concatNotes(...beats.map((b) => cell(pattern, b, tonic, vel)));
}

const LENNE_LONG = augment(LENNE, 2);
/** First half of the cell (the "call"; beats 0-4) and the second half re-based to 0 (the "answer"). */
const LENNE_CALL: Note[] = LENNE.filter((n) => n[0] < 4);
const LENNE_ANSWER: Note[] = LENNE.filter((n) => n[0] >= 4).map((n): Note => [n[0] - 4, n[1], n[2], n[3]]);

// ---- piano: the fast 16th-note riff ----------------------------------------

const RIFF_PATTERN = [0, 1, 2, 1, 3, 2, 1, 0, 0, 1, 2, 3, 2, 1, 0, 1];

function riff(chords: string[], start: number, velocity: number, accent: number, center: number): Note[] {
  return arpLine(chords, { start, pattern: RIFF_PATTERN, step: 0.25, dur: 0.2, octave: 4, center, velocity, accent });
}

const pianoNotes = concatNotes(
  arpLine(INTRO_CHORDS, { start: INTRO, pattern: [0, 2, 1, 2], step: 0.5, dur: 0.4, octave: 4, center: 64, velocity: 0.5 }),
  riff(A1_CHORDS, A1, 0.72, 1.16, 66),
  chordLine(B_CHORDS, { start: B, octave: 4, center: 66, velocity: 0.28, dur: 0.4, roll: 0.02 }),
  riff(A2_CHORDS, A2, 0.82, 1.2, 68),
  // Call-and-response with the pwm hook's statements 5-6: piano answers in the gap.
  stampCell(LENNE_ANSWER, [180, 188], 'C#5', 0.7),
  riff(CLIMAX_CHORDS, CLIMAX, 0.9, 1.22, 70),
  riff(TURN_CHORDS, TURN, 0.84, 1.18, 68),
);

// ---- sub bass: a floor under the riff, never fighting it -------------------

function subLine(chords: string[], start: number, vel: number): Note[] {
  return chordRoots(chords, 1).map((midi, bar): Note => [start + bar * 4, 3.6, midi, vel]);
}

function subPulse(chords: string[], start: number, vel: number): Note[] {
  const notes: Note[] = [];
  chordRoots(chords, 1).forEach((midi, bar) => {
    const at = start + bar * 4;
    notes.push([at, 1.8, midi, vel], [at + 2, 1.8, midi, vel * 0.8]);
  });
  return notes;
}

const subNotes = concatNotes(
  subLine(INTRO_CHORDS, INTRO, 0.35),
  subLine(A1_CHORDS, A1, 0.55),
  subPulse(B_CHORDS, B, 0.42),
  subLine(A2_CHORDS, A2, 0.62),
  subLine(CLIMAX_CHORDS, CLIMAX, 0.7),
  subLine(TURN_CHORDS, TURN, 0.6),
);

// ---- drums: full electronic-rock kit, half-time in B -----------------------

const KICK = 'X.x.X...x.X.X...';
const SNARE = '....X.g.....X..g';
const HAT = 'x.x.x.x.X.x.x.x.';
const KICK_HALF = 'x.......x.......';
const SNARE_HALF = '........X.......';
const HAT_HALF = 'x...x...x...x...';

function buildRoll(start: number, dur: number, v0 = 0.32, v1 = 0.98): Note[] {
  const step = 0.25;
  const steps = Math.round(dur / step);
  const notes: Note[] = [];
  for (let s = 0; s < steps; s++) {
    const t = steps > 1 ? s / (steps - 1) : 1;
    notes.push([start + s * step, step * 0.9, 'D2', v0 + (v1 - v0) * t]);
  }
  return notes;
}

const introKick: Note[] = [
  [8, 0.4, 'C2', 0.5],
  [12, 0.4, 'C2', 0.58],
  [13, 0.3, 'C2', 0.5],
  [14, 0.4, 'C2', 0.68],
  [15, 0.3, 'C2', 0.6],
];

const kickNotes = concatNotes(
  introKick,
  drumLine(KICK, { start: A1, pitch: 'C2', velocity: 0.9, times: 16 }),
  drumLine(KICK_HALF, { start: B, pitch: 'C2', velocity: 0.7, times: 16 }),
  drumLine(KICK, { start: A2, pitch: 'C2', velocity: 0.95, times: 16 }),
  drumLine(KICK, { start: CLIMAX, pitch: 'C2', velocity: 1, times: 8 }),
  drumLine(KICK, { start: TURN, pitch: 'C2', velocity: 0.95, times: 7 }),
);

const snareNotes = concatNotes(
  drumLine(SNARE, { start: A1, pitch: 'D2', velocity: 0.82, times: 16 }),
  drumLine(SNARE_HALF, { start: B, pitch: 'D2', velocity: 0.75, times: 16 }),
  drumLine(SNARE, { start: A2, pitch: 'D2', velocity: 0.88, times: 16 }),
  drumLine(SNARE, { start: CLIMAX, pitch: 'D2', velocity: 0.95, times: 8 }),
  drumLine(SNARE, { start: TURN, pitch: 'D2', velocity: 0.9, times: 7 }),
  buildRoll(TURN + 28, 4),
);

const hatNotes = concatNotes(
  drumLine(HAT, { start: A1, pitch: 'F#3', velocity: 0.45, times: 16 }),
  drumLine(HAT_HALF, { start: B, pitch: 'F#3', velocity: 0.32, times: 16 }),
  drumLine(HAT, { start: A2, pitch: 'F#3', velocity: 0.5, times: 16 }),
  drumLine(HAT, { start: CLIMAX, pitch: 'F#3', velocity: 0.56, times: 8 }),
  drumLine(HAT, { start: TURN, pitch: 'F#3', velocity: 0.5, times: 7 }),
);

const crashNotes: Note[] = [
  [A1, 1.4, 'C5', 0.62],
  [B, 1.4, 'C5', 0.5],
  [A2, 1.4, 'C5', 0.68],
  [CLIMAX, 1.4, 'C5', 0.78],
  [CLIMAX + 16, 1.4, 'C5', 0.74],
  [TURN, 1.4, 'C5', 0.6],
];

const clapNotes: Note[] = [16, 48, 80, 112, 144, 176, 208, 240].map((b): Note => [b, 0.3, 'C3', 0.7]);

// ---- guitar-dist: double-tracked rock chug ---------------------------------

const GUITAR_PATTERN = 'X.x.x.x.X.x.x.x.';

/**
 * `side` makes the double-track real: R lags ~4.6 ms, sits a hair quieter,
 * drops every other ghost chug for air, and rings the 5th under the downbeat
 * where L plays a single root.
 */
function guitarChug(chords: string[], start: number, vel: number, side: 'L' | 'R' = 'L'): Note[] {
  const notes: Note[] = [];
  const delay = side === 'R' ? 0.012 : 0;
  const trim = side === 'R' ? 0.93 : 1;
  let ghost = 0;
  chords.forEach((chord, bar) => {
    const root = chordRoots([chord], 2)[0]!;
    const at = start + bar * 4;
    for (let s = 0; s < GUITAR_PATTERN.length; s++) {
      const ch = GUITAR_PATTERN[s];
      if (ch === '.') continue;
      const accent = ch === 'X';
      if (!accent) {
        ghost++;
        if (side === 'R' && ghost % 2 === 0) continue;
      }
      const t = at + s * 0.25 + delay;
      const v = Math.min(1, (accent ? vel * 1.12 : vel * 0.82) * trim);
      notes.push([t, accent ? 0.4 : 0.2, root, v]);
      if (accent && side === 'R') notes.push([t, 0.4, root + 7, Math.min(1, vel * 0.92 * trim)]);
    }
  });
  return notes;
}

const guitarL = concatNotes(
  guitarChug(A1_CHORDS, A1, 0.62, 'L'),
  guitarChug(A2_CHORDS, A2, 0.68, 'L'),
  guitarChug(CLIMAX_CHORDS, CLIMAX, 0.86, 'L'),
  guitarChug(TURN_CHORDS, TURN, 0.78, 'L'),
);
const guitarR = concatNotes(
  guitarChug(A1_CHORDS, A1, 0.62, 'R'),
  guitarChug(A2_CHORDS, A2, 0.68, 'R'),
  guitarChug(CLIMAX_CHORDS, CLIMAX, 0.86, 'R'),
  guitarChug(TURN_CHORDS, TURN, 0.78, 'R'),
);

// ---- supersaw: the pop-electronic chord wall -------------------------------

const supersawNotes = concatNotes(
  chordLine(A1_CHORDS, { start: A1, octave: 4, center: 64, velocity: 0.52, dur: 3.7, roll: 0.02 }),
  chordLine(A2_CHORDS, { start: A2, octave: 4, center: 64, velocity: 0.52, dur: 3.7, roll: 0.02 }),
  // A2 statements 3-4: the hook handed down to supersaw, an octave lower.
  stampCell(LENNE, [160, 168], 'C#4', 0.72),
  chordLine(CLIMAX_CHORDS, { start: CLIMAX, octave: 4, center: 66, velocity: 0.8, dur: 3.7, roll: 0.02 }),
  chordLine(TURN_CHORDS, { start: TURN, octave: 4, center: 64, velocity: 0.58, dur: 3.7 }),
);

// ---- strings: an orchestral undertone, and B's tender duet -----------------

const stringsNotes = concatNotes(
  chordLine(A1_CHORDS, { start: A1, octave: 3, center: 58, velocity: 0.38, dur: 3.7 }),
  stampCell(LENNE_LONG, [B, B + 16, B + 32, B + 48], 'C#4', 0.55),
  chordLine(A2_CHORDS, { start: A2, octave: 3, center: 58, velocity: 0.38, dur: 3.7 }),
  chordLine(CLIMAX_CHORDS, { start: CLIMAX, octave: 3, center: 60, velocity: 0.62, dur: 3.7 }),
  chordLine(TURN_CHORDS, { start: TURN, octave: 3, center: 58, velocity: 0.42, dur: 3.7 }),
);

// ---- epiano: carries the memory of Lenne in B ------------------------------

const epianoNotes = stampCell(LENNE_LONG, [B, B + 16, B + 32, B + 48], 'C#5', 0.68);

// ---- pwm-lead: LENNE, sharpened into an anguished hook ---------------------

const pwmNotes = concatNotes(
  stampCell(LENNE, [16, 32, 48, 64], 'C#5', 0.88),
  // A2's hook, varied instead of hammering the same 8-beat cell 8 times running:
  stampCell(LENNE, [144, 152], 'C#5', 0.95), // 1-2: hook as before
  // 3-4 (160, 168) move to supersaw, an octave down — see supersawNotes
  stampCell(LENNE_CALL, [176, 184], 'C#5', 0.92), // 5-6: call only, piano answers the gap
  concatNotes(stampCell(LENNE, [192], 'C#5', 1), stampCell(LENNE, [192], 'C#6', 0.85)), // 7: back up, octave doubled
  concatNotes(stampCell(LENNE, [200], 'C#5', 1), stampCell(LENNE, [200], 'C#6', 0.85)), // 8: back up, octave doubled
  // Climax: the hook shouted twice, doubled in octaves so it tops A2.
  concatNotes(stampCell(LENNE, [208, 224], 'C#5', 1), stampCell(LENNE, [208, 224], 'C#6', 0.92)),
);

export const shuyinTrack: Track = {
  name: 'boss-shuyin',
  bpm: BPM,
  timeSig: [4, 4],
  loop: { start: A1, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.55, damp: 0.38, width: 0.9, preDelay: 0.015 },
    delay: { timeBeats: 0.5, feedback: 0.28, damp: 3200 },
  },
  channels: [
    { name: 'piano riff', instrument: 'piano', volume: 0.85, pan: -0.05, notes: pianoNotes, fx: { reverb: 0.15 } },
    { name: 'sub bass', instrument: 'bass-sub', volume: 0.55, pan: 0, notes: subNotes },
    { name: 'kick', instrument: 'kick', volume: 0.92, pan: 0, notes: kickNotes },
    { name: 'snare-909', instrument: 'snare-909', volume: 0.8, pan: -0.05, notes: snareNotes, fx: { reverb: 0.14 } },
    { name: 'hat', instrument: 'hat', volume: 0.42, pan: 0.2, notes: hatNotes },
    { name: 'crash', instrument: 'crash', volume: 0.42, pan: 0.1, notes: crashNotes, fx: { reverb: 0.28 } },
    { name: 'clap', instrument: 'clap', volume: 0.55, pan: -0.1, notes: clapNotes, fx: { reverb: 0.15 } },
    { name: 'guitar L', instrument: 'guitar-dist', volume: 0.55, pan: -0.35, notes: guitarL, fx: { reverb: 0.1 } },
    { name: 'guitar R', instrument: 'guitar-dist', volume: 0.52, pan: 0.35, notes: guitarR, fx: { reverb: 0.11 } },
    { name: 'supersaw', instrument: 'supersaw', volume: 0.6, pan: 0.05, notes: supersawNotes, fx: { reverb: 0.2 } },
    { name: 'strings', instrument: 'strings', volume: 0.55, pan: 0.15, notes: stringsNotes, fx: { reverb: 0.3 } },
    { name: 'epiano', instrument: 'epiano', volume: 0.72, pan: -0.18, notes: epianoNotes, fx: { reverb: 0.28, delay: 0.14 } },
    { name: 'pwm hook', instrument: 'pwm-lead', volume: 0.68, pan: 0.08, notes: pwmNotes, fx: { reverb: 0.24, delay: 0.18 } },
  ],
};

export default shuyinTrack;
