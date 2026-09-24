/**
 * SKETCH B for the Yojimbo battle cue — "The Ronin's Price".
 * Yojimbo's cold menace first. About 60 s, F# Aeolian, 4/4, 104 bpm.
 *
 * ORIGINAL COMPOSITION. Nothing here is transcribed from any existing work. In
 * the game this fight plays Lulu's own theme; this sketch neither quotes nor
 * imitates it (AGENTS.md rule 8), and it does not borrow a stock "samurai"
 * pentatonic either: the blade line is built on stacked fourths inside the
 * natural minor, and every note of it is written below.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Lady Ginnem's Yojimbo is an FFX
 * encounter (research/ffx-yojimbo.md §1.2). Aeolian, never Dorian (THEMES.md
 * reserves the raised sixth for FFX-2); no dominant chord; no chromatic line
 * (THEMES.md gives chromaticism to Seymour alone).
 *
 * THE IDEA. The cue is built on the one mechanic the fight is about: the
 * Zanmato gauge. Its thresholds are sourced (research §4.1, `[verified: 3
 * sources]`): under 25 % only the dog attacks, at 25 % Kozuka joins, at 50 %
 * Wakizashi, at 80 % the blades come more often, at 100 % Zanmato. Each
 * threshold adds one layer here, in that order, and the last one is a single
 * cut followed by silence. The sections follow the ORDER of the thresholds,
 * not their exact proportions: a cue that saved Zanmato for the last beat
 * would leave nothing to hear after it.
 *
 * Form (4/4, 104 bpm, 26 bars, 104 beats, 60.0 s plus the tail):
 *   bars  1- 6  beats  0- 24  0 %:  a low open fifth, one drum, the blade line
 *   bars  7-12  beats 24- 48  25 %: pizzicato counts the price in 3+3+2
 *   bars 13-19  beats 48- 76  50 %: the drum takes the 3+3+2, trombones in fourths
 *   bars 20-24  beats 76- 96  80 %: brass cuts on the off-beats, the line climbs by step
 *   bars 25-26  beats 96-104  100 %: one cut, then silence and a gong
 */

import { chordLine, chordRoots, tracker } from '../../../../src/audio/score.ts';
import { augment } from '../../../../src/audio/tracks/themes.ts';
import { arch } from '../2026-09-21/sketch-kit.mjs';

const ZERO = 0;
const KOZUKA = 24;
const WAKIZASHI = 48;
const EIGHTY = 76;
const ZANMATO = 96;
const LENGTH = 104;

// -------------------------------------------------------------------- lines

/**
 * The blade. A rising fourth, a step, then down past the home note to the
 * flat seventh and back. Four bars; the fourths are the point.
 */
const BLADE = `
  F#4:3 B4:1 | C#5:4 | B4:1.5 A4:0.5 E4:2 | F#4:4 |
`;

/** The same line at an arbitrary start and transposition. */
function blade(start, transpose = 0, velocity = 0.66) {
  return tracker(BLADE, { start, transpose, velocity, gate: 1.0, checkBars: 4 });
}

/** 0 %: the alto flute alone, bars 3-6. Breath before each phrase. */
const flute0 = arch(blade(ZERO + 8, 0, 0.64), ZERO + 8, ZERO + 24, 0.5, 0.72);

/** 25 %: the horn answers a fourth higher, bars 8-11. */
const horn25 = arch(blade(KOZUKA + 4, 5, 0.62), KOZUKA + 4, KOZUKA + 20, 0.5, 0.74);

/** 50 %: trombones state the blade at half speed, in bare fourths (two lines). */
const bladeSlow = augment(blade(0, 0, 0.8), 1.5).map((n) => [n[0] + WAKIZASHI, n[1], n[2], n[3]]);
const trombone50 = [
  ...bladeSlow.map((n) => [n[0], n[1], n[2] - 12, 0.72]),
  ...bladeSlow.map((n) => [n[0], n[1], n[2] - 17, 0.62]),
];

/**
 * 80 %: the head of the blade (a fourth and a step) climbs by scale step, one
 * bar each: F#, G#, A, B, C#. Horns, loud. Diatonic all the way: no chromatic step.
 */
const HEADS = ['F#4', 'G#4', 'A4', 'B4', 'C#5'];
const DIATONIC_FOURTH_UP = { 'F#4': 'B4', 'G#4': 'C#5', 'A4': 'D5', 'B4': 'E5', 'C#5': 'F#5' };
const DIATONIC_STEP = { 'B4': 'C#5', 'C#5': 'D5', 'D5': 'E5', 'E5': 'F#5', 'F#5': 'G#5' };
const horn80 = HEADS.flatMap((head, i) => {
  const at = EIGHTY + i * 4;
  const fourth = DIATONIC_FOURTH_UP[head];
  const step = DIATONIC_STEP[fourth];
  const v = 0.7 + i * 0.05;
  return [
    [at, 1.5, head, v],
    [at + 1.5, 0.5, fourth, v + 0.08],
    [at + 2, 1.8, step, v],
  ];
});

/** 100 %: after the cut, one flute note, the home note, alone. */
const fluteLast = [[ZANMATO + 4, 3.5, 'F#4', 0.46]];

// ------------------------------------------------------------------ texture

/** The floor: an open fifth on the tonic, held, then the root per bar. */
const drone = [
  [ZERO, 24, 'F#1', 0.46],
  [ZERO, 24, 'C#2', 0.4],
];

/** Power-fifth harmony from 25 % on: i, bVI, bVII only. */
const CHORDS_25 = ['F#5', 'F#5', 'D5', 'E5', 'F#5', 'F#5'];
const CHORDS_50 = ['F#5', 'F#5', 'D5', 'D5', 'E5', 'E5', 'F#5'];
const CHORDS_80 = ['F#5', 'E5', 'D5', 'E5', 'F#5'];
const ALL = [...CHORDS_25, ...CHORDS_50, ...CHORDS_80];

/** Low strings in quarter notes on each bar's root, from 25 % to the cut. */
const lowRoots = chordRoots(ALL, 1).flatMap((root, bar) =>
  [0, 1, 2, 3].map((q) => [KOZUKA + bar * 4 + q, 0.9, root, q === 0 ? 0.62 : 0.48]),
);

/**
 * The count: pizzicato eighths grouped 3+3+2, on the chord's root, fifth and
 * octave. Accents on 1, the and-of-2 and 4: the price, counted out.
 */
const COUNT_ACCENTS = [0.72, 0.44, 0.44, 0.7, 0.44, 0.44, 0.66, 0.44];
function counted(chords, start, lift = 0) {
  const notes = [];
  chords.forEach((symbol, bar) => {
    const root = chordRoots([symbol], 3)[0];
    const cycle = [root, root + 7, root + 12, root, root + 7, root + 12, root + 7, root];
    cycle.forEach((pitch, e) => {
      notes.push([start + bar * 4 + e * 0.5, 0.35, pitch, Math.min(1, COUNT_ACCENTS[e] + lift)]);
    });
  });
  return notes;
}
const pizz = [...counted(CHORDS_25, KOZUKA), ...counted(CHORDS_50, WAKIZASHI, 0.06), ...counted(CHORDS_80, EIGHTY, 0.12)];

/** The harp doubles only the accented counts, an octave up, from 50 %. */
const harp = pizz
  .filter((n) => n[0] >= WAKIZASHI && [0, 1.5, 3].includes(Math.round((n[0] % 4) * 2) / 2))
  .map((n) => [n[0], 0.8, n[2] + 12, n[3] * 0.8]);

/** Taiko. 0 %: one stroke a bar. 25 %: a second on 4. 50 % on: the 3+3+2 itself. */
function taikoBars(bars, start, pattern) {
  const notes = [];
  for (let b = 0; b < bars; b++) {
    for (const [offset, v] of pattern) notes.push([start + b * 4 + offset, 1, 'C2', v]);
  }
  return notes;
}
const taiko = [
  ...taikoBars(6, ZERO, [[0, 0.62]]),
  ...taikoBars(6, KOZUKA, [[0, 0.72], [3, 0.5]]),
  ...taikoBars(7, WAKIZASHI, [[0, 0.8], [1.5, 0.95], [3, 0.7]]),
  ...taikoBars(5, EIGHTY, [[0, 0.82], [1.5, 0.96], [3, 0.74], [3.5, 0.6]]),
  [ZANMATO, 2, 'C2', 1],
];

/** High tremolo from 50 %: a thin wire over everything. */
const wire = [
  [WAKIZASHI, 28, 'F#5', 0.3],
  [WAKIZASHI, 28, 'C#6', 0.26],
  [EIGHTY, 20, 'F#5', 0.4],
  [EIGHTY, 20, 'C#6', 0.36],
];

/** 80 %: brass cuts on the and-of-2 and the and-of-4 of every bar. */
const stabs = CHORDS_80.flatMap((symbol, bar) => {
  const at = EIGHTY + bar * 4;
  const voicing = chordLine([symbol], { octave: 3, dur: 0.4, velocity: 0.8 });
  return [
    ...voicing.map((n) => [at + 1.5, 0.4, n[2], 0.84]),
    ...voicing.map((n) => [at + 3.5, 0.4, n[2], 0.78]),
  ];
});

/** 100 %: the cut. Everything on one beat, then nothing. */
const cut = chordLine(['F#5'], { start: ZANMATO, octave: 3, bassOctaves: 1, dur: 1.2, velocity: 1 });
const cutLow = [[ZANMATO, 1.5, 'F#1', 0.9]];
const timpani = [
  [KOZUKA, 2, 'F#2', 0.5],
  [WAKIZASHI, 2, 'F#2', 0.6],
  [EIGHTY, 2, 'F#2', 0.7],
  ...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((t, i) => [ZANMATO - 4 + t, 0.3, 'C#2', 0.4 + i * 0.03]),
  [ZANMATO, 3, 'F#2', 1],
];
const gong = [
  [EIGHTY + 16, 4, 'C2', 0.4],
  [ZANMATO, 8, 'C2', 0.86],
];

export default {
  name: 'sketch-yojimbo-b',
  bpm: 104,
  timeSig: [4, 4],
  loop: { start: KOZUKA, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  gain: 1,
  fx: {
    reverb: { room: 0.9, damp: 0.34, width: 0.92, preDelay: 0.03 },
  },
  channels: [
    { name: 'alto flute (the blade)', instrument: 'alto-flute', volume: 0.8, pan: 0.12, notes: [...flute0, ...fluteLast], fx: { reverb: 0.42 }, perform: { timingJitterMs: 12 } },
    { name: 'horn (the answer, the climb)', instrument: 'horn', volume: 0.72, pan: 0.2, notes: [...horn25, ...horn80], fx: { reverb: 0.36 }, perform: { timingJitterMs: 11 } },
    { name: 'trombones (fourths)', instrument: 'trombone', volume: 0.74, pan: -0.08, notes: trombone50, fx: { reverb: 0.3 }, perform: { timingJitterMs: 10 } },
    { name: 'low drone', instrument: 'strings-low', volume: 0.6, pan: -0.12, notes: [...drone, ...cutLow], fx: { reverb: 0.3 } },
    { name: 'low strings (quarters)', instrument: 'strings-low', volume: 0.5, pan: -0.16, notes: lowRoots, fx: { reverb: 0.22 }, perform: { timingJitterMs: 9 } },
    { name: 'pizzicato (the count)', instrument: 'pizzicato', volume: 0.64, pan: -0.22, notes: pizz, fx: { reverb: 0.24 }, perform: { timingJitterMs: 8 } },
    { name: 'harp (accents)', instrument: 'harp', volume: 0.5, pan: 0.3, notes: harp, fx: { reverb: 0.34 } },
    { name: 'tremolo wire', instrument: 'strings-trem', volume: 0.36, pan: 0.1, notes: wire, fx: { reverb: 0.4 } },
    { name: 'brass stabs', instrument: 'brass-stab', volume: 0.58, pan: 0.06, notes: [...stabs, ...cut], fx: { reverb: 0.3 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.64, pan: 0, notes: taiko, fx: { reverb: 0.28 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.54, pan: 0.05, notes: timpani, fx: { reverb: 0.3 } },
    { name: 'tam-tam', instrument: 'tam-tam', volume: 0.52, pan: 0.14, notes: gong, fx: { reverb: 0.5 } },
  ],
};

