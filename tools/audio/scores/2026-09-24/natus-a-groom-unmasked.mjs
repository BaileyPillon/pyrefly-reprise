/**
 * SKETCH A for the Seymour Natus battle cue (Chapter X) — "The Groom Unmasked".
 * The wedding is over and the courtesy has stopped pretending. About 60 s,
 * C# minor (Seymour's key, THEMES.md §3), 4/4, 84 bpm.
 *
 * ORIGINAL COMPOSITION (AGENTS.md rule 8). The only borrowed material is this
 * project's own SEYMOUR cell ("Noble Rot"), imported from
 * `src/audio/tracks/themes.ts`, never retyped. Everything else — the bell peal,
 * the extended decline, the voicings — is written below. It does not quote or
 * imitate any retail cue: not the game's Seymour battle music, not "Run!!", not
 * any wedding march. THEMES.md's resemblance guard holds: no choir of any kind,
 * no fast ostinato in the organ's left hand.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Seymour Natus is the Highbridge
 * of Bevelle fight, straight after the wedding (docs/plans/chapter-natus-review.md).
 * Chromaticism is Seymour's alone (THEMES.md), so it is allowed here.
 *
 * `SEYMOUR_UNMOORED` is NOT used: THEMES.md reserves it for `boss-seymour`'s
 * final form ("use once and never again"). The last section instead lets the
 * decline go two semitones further than the cell ever does — b3, 2, b2 — and
 * stop on the Neapolitan. It rots further; it does not come loose.
 *
 * Form (4/4, 84 bpm, 21 bars, 84 beats, 60.0 s plus the tail):
 *   bars  1- 4  beats  0-16  the peal: four bells in plain hunt, the organ bows once
 *   bars  5-12  beats 16-48  the period: SEYMOUR sequenced C# E G C# in trombones,
 *                            the mirror in horns, his cadence in the organ, a processional
 *   bars 13-18  beats 48-72  unmasked: the cell at 1.5x in full brass, and the bow
 *                            that was thrown away is now the loudest note; the second
 *                            statement a tritone up; bells ring the tritone
 *   bars 19-21  beats 72-84  composure: organ alone, the decline goes on to b2 and
 *                            stops on a Neapolitan over the C# pedal
 */

import { chordLine, motif } from '../../../../src/audio/score.ts';
import { augment, SEYMOUR, SEYMOUR_MIRROR, SEYMOUR_CHORDS, SEYMOUR_SEQUENCE } from '../../../../src/audio/tracks/themes.ts';
import { shape } from '../2026-09-21/sketch-kit.mjs';

const PEAL = 0;
const PERIOD = 16;
const UNMASKED = 48;
const COMPOSURE = 72;
const LENGTH = 84;

/** THEMES.md §3's velocity shape: the bow up to the b6 is thrown away. */
const COURTEOUS = [0.74, 0.52, 0.72, 0.78, 0.68, 0.62];
/** The same six notes with the courtesy gone: the bow is now the loudest. */
const UNMASKED_SHAPE = [0.8, 0.97, 0.84, 0.9, 0.8, 0.74];

// -------------------------------------------------------------------- bells

/**
 * Four bells, C#5 B4 G#4 E4 (the tonic triad plus the flat seventh), rung in
 * plain hunt: each row swaps pairs, alternately (12)(34) and (23). Quarter
 * notes. Rows: 1234 2143 2413 4231.
 */
const BELLS = ['C#5', 'B4', 'G#4', 'E4'];
const ROWS = [
  [0, 1, 2, 3],
  [1, 0, 3, 2],
  [1, 3, 0, 2],
  [3, 1, 2, 0],
];
const peal = ROWS.flatMap((row, r) =>
  row.map((b, i) => [PEAL + r * 4 + i, 3, BELLS[b], i === 0 ? 0.62 : 0.5 - i * 0.03]),
);
/** Through the period the wedding bells still ring, once a bar, fading. */
const bellsAfter = [0, 1, 2, 3, 4, 5, 6, 7].map((bar) => [PERIOD + bar * 4, 3, BELLS[bar % 4], 0.5 - bar * 0.03]);
/** Unmasked: the bells ring G against his C#, the tritone, on each bow. */
const bellsTritone = [
  [UNMASKED + 1.5 * 1.75, 4, 'G4', 0.72],
  [UNMASKED + 1.5 * 1.75, 4, 'C#5', 0.6],
  [UNMASKED + 12 + 1.5 * 1.75, 4, 'C#5', 0.74],
  [UNMASKED + 12 + 1.5 * 1.75, 4, 'G5', 0.62],
];
const bellLast = [[COMPOSURE + 8, 4, 'G4', 0.4]];

// ------------------------------------------------------------------- organ

/** Bar 1-2: the tonic held under the peal; bars 3-4: his cadence, half-bar changes. */
const organIntro = [
  ...chordLine(['C#m'], { start: PEAL, octave: 3, dur: 8, velocity: 0.44 }),
  ...chordLine(SEYMOUR_CHORDS, { start: PEAL + 8, barBeats: 2, octave: 3, velocity: 0.5 }),
];
/** The bow, once, at written pitch, under the peal. */
const organBow = shape(motif(SEYMOUR, [PEAL + 8], ['C#3']), COURTEOUS);

/**
 * The period's cadences: SEYMOUR_CHORDS stamped on each root of the sequence
 * (C#, E, G, C#). Spelled by hand from `i - bVI - #iv dim7 - V` on each root.
 */
const CADENCES = [
  ['C#m', 'Amaj7', 'Gdim7', 'G#7'],
  ['Em', 'Cmaj7', 'Bbdim7', 'B7'],
  ['Gm', 'Ebmaj7', 'C#dim7', 'D7'],
  ['C#m', 'Amaj7', 'Gdim7', 'G#7'],
];
const organPeriod = CADENCES.flatMap((cadence, i) =>
  chordLine(cadence, { start: PERIOD + i * 8, barBeats: 2, octave: 3, velocity: 0.5 + (i % 2) * 0.04 }),
);

/**
 * Unmasked: the cadence at 1.5x (3 beats a chord), on C# then G. Loud for
 * him, still under the brass.
 */
const organUnmasked = [
  ...chordLine(['C#m', 'Amaj7', 'Gdim7', 'G#7'], { start: UNMASKED, barBeats: 3, octave: 3, velocity: 0.62 }),
  ...chordLine(['Gm', 'Ebmaj7', 'C#dim7', 'D7'], { start: UNMASKED + 12, barBeats: 3, octave: 3, velocity: 0.66 }),
];

/**
 * Composure: the decline goes on. 1, the bow to b6, then 5 #4 4 b3 2 b2 and a
 * held b2. The last two notes are new: the cell has never gone below b3.
 */
const DECAY = [
  [0, 1.75, 0],
  [1.75, 0.25, 8],
  [2, 1.5, 7],
  [3.5, 1, 6],
  [4.5, 1, 5],
  [5.5, 1, 3],
  [6.5, 1.5, 2],
  [8, 4, 1],
];
const organDecay = shape(motif(DECAY, [COMPOSURE], ['C#3']), [0.6, 0.4, 0.56, 0.58, 0.52, 0.48, 0.44, 0.4]);
/** The pedal: C# held, G under the #4 (the tritone in the floor), C# again. */
const pedal = [
  [PEAL, 16, 'C#2', 0.4],
  [PERIOD, 32, 'C#2', 0.36],
  [UNMASKED, 3.5, 'C#1', 0.52],
  [UNMASKED + 3.5, 2.5, 'G1', 0.54],
  [UNMASKED + 6, 6, 'C#1', 0.5],
  [UNMASKED + 12, 3.5, 'G1', 0.54],
  [UNMASKED + 15.5, 2.5, 'C#1', 0.56],
  [UNMASKED + 18, 6, 'G1', 0.52],
  [COMPOSURE, 3.5, 'C#2', 0.4],
  [COMPOSURE + 3.5, 1, 'G1', 0.42],
  [COMPOSURE + 4.5, 7.5, 'C#2', 0.36],
];
/** The last chord: D major (the Neapolitan) over the C# pedal, never resolved. */
const neapolitan = chordLine(['D'], { start: COMPOSURE + 8, octave: 4, dur: 4, velocity: 0.42 });

// ------------------------------------------------------------ the period

/** SEYMOUR in the trombones, sequenced C# E G C#, doubled in low strings an octave up. */
const period = shape(motif(SEYMOUR, [PERIOD, PERIOD + 8, PERIOD + 16, PERIOD + 24], SEYMOUR_SEQUENCE), COURTEOUS);
/** The strict mirror in the horns, an octave up, converging on the #4. */
const mirror = shape(
  motif(SEYMOUR_MIRROR, [PERIOD, PERIOD + 8, PERIOD + 16, PERIOD + 24], ['C#4', 'E4', 'G4', 'C#4']),
  [0.62, 0.46, 0.6, 0.66, 0.58, 0.54],
);

/** A processional: low strings on the root, quarter notes, stressed on 1. */
const processional = CADENCES.flatMap((cadence, cell) =>
  cadence.flatMap((symbol, half) => {
    const root = chordLine([symbol], { octave: 2 })[0][2];
    const at = PERIOD + cell * 8 + half * 2;
    return [
      [at, 0.9, root, half % 2 === 0 ? 0.6 : 0.5],
      [at + 1, 0.9, root, 0.46],
    ];
  }),
);

// ------------------------------------------------------------- unmasked

/** SEYMOUR at 1.5x: 12 beats a statement, on C# then G, tutti. */
const bigCell = augment(SEYMOUR, 1.5);
const unmaskedLow = shape(motif(bigCell, [UNMASKED, UNMASKED + 12], ['C#3', 'G3']), UNMASKED_SHAPE);
const unmaskedHigh = shape(motif(bigCell, [UNMASKED, UNMASKED + 12], ['C#4', 'G4']), UNMASKED_SHAPE);
/** The mirror at 1.5x on trumpets, high, against it. */
const unmaskedMirror = shape(
  motif(augment(SEYMOUR_MIRROR, 1.5), [UNMASKED, UNMASKED + 12], ['C#5', 'G5']),
  [0.7, 0.86, 0.74, 0.82, 0.72, 0.66],
);
/** Brass cuts on each chord of the 1.5x cadence, off the beat. */
const stabs = [
  ...['C#m', 'Amaj7', 'Gdim7', 'G#7'].map((s, i) => [UNMASKED + i * 3 + 1.5, s]),
  ...['Gm', 'Ebmaj7', 'C#dim7', 'D7'].map((s, i) => [UNMASKED + 12 + i * 3 + 1.5, s]),
].flatMap(([at, s], i) => chordLine([s], { start: at, octave: 3, dur: 0.6, velocity: 0.72 + (i % 4) * 0.04 }));
/** A tremolo wire on the tritone over all of it. */
const wire = [
  [UNMASKED, 12, 'C#5', 0.32],
  [UNMASKED, 12, 'G5', 0.28],
  [UNMASKED + 12, 12, 'G5', 0.36],
  [UNMASKED + 12, 12, 'C#6', 0.32],
];

// ------------------------------------------------------------ percussion

const timpani = [
  [PEAL + 8, 2, 'C#2', 0.4],
  ...[0, 1, 2, 3].map((i) => [PERIOD + i * 8, 2, ['C#2', 'E2', 'G2', 'C#2'][i], 0.52 + i * 0.04]),
  ...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((t, i) => [UNMASKED - 4 + t, 0.3, 'G#2', 0.36 + i * 0.03]),
  [UNMASKED, 3, 'C#2', 0.9],
  [UNMASKED + 12, 3, 'G2', 0.94],
  [UNMASKED + 21, 0.3, 'C#2', 0.7],
  [UNMASKED + 22, 2, 'C#2', 0.8],
];
/** The processional drum: once a bar through the period, twice through unmasked. */
const taiko = [
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((bar) => [PERIOD + bar * 4, 1, 'C2', 0.56 + (bar % 2) * 0.06]),
  ...[0, 1, 2, 3, 4, 5].flatMap((bar) => [
    [UNMASKED + bar * 4, 1, 'C2', 0.8],
    [UNMASKED + bar * 4 + 2.5, 1, 'C2', 0.66],
  ]),
];
const gong = [
  [UNMASKED, 6, 'C2', 0.62],
  [COMPOSURE, 8, 'C2', 0.7],
];

export default {
  name: 'sketch-natus-a',
  bpm: 84,
  timeSig: [4, 4],
  loop: { start: PERIOD, end: LENGTH },
  length: LENGTH,
  tailSec: 3.5,
  gain: 1,
  fx: {
    reverb: { room: 0.92, damp: 0.3, width: 0.95, preDelay: 0.03 },
  },
  channels: [
    { name: 'chimes (the wedding)', instrument: 'chimes', volume: 0.5, pan: 0.24, notes: [...peal, ...bellsAfter, ...bellsTritone, ...bellLast], fx: { reverb: 0.5 } },
    { name: "organ 8' (his cadence)", instrument: 'organ', volume: 0.46, pan: 0.02, notes: [...organIntro, ...organPeriod, ...organUnmasked, ...neapolitan], fx: { reverb: 0.34 } },
    { name: 'organ (the bow, the decay)', instrument: 'organ', volume: 0.55, pan: -0.04, notes: [...organBow, ...organDecay], fx: { reverb: 0.32 } },
    { name: 'organ pedal', instrument: 'organ', volume: 0.45, pan: 0, notes: pedal, fx: { reverb: 0.4 } },
    { name: 'trombones (the period)', instrument: 'trombone', volume: 0.66, pan: -0.1, notes: [...period, ...unmaskedLow], fx: { reverb: 0.3 }, perform: { timingJitterMs: 10 } },
    { name: 'low strings (doubling)', instrument: 'strings-low', volume: 0.5, pan: -0.16, transpose: 12, notes: [...period, ...unmaskedLow], fx: { reverb: 0.28 } },
    { name: 'low strings (processional)', instrument: 'strings-low', volume: 0.46, pan: -0.2, notes: processional, fx: { reverb: 0.24 }, perform: { timingJitterMs: 9 } },
    { name: 'horns (the mirror)', instrument: 'horn', volume: 0.54, pan: 0.18, notes: mirror, fx: { reverb: 0.36 }, perform: { timingJitterMs: 11 } },
    { name: 'brass (unmasked)', instrument: 'brass', volume: 0.9, pan: 0.04, notes: unmaskedHigh, fx: { reverb: 0.32 } },
    { name: 'trumpets (the mirror, high)', instrument: 'trumpet', volume: 0.64, pan: 0.2, notes: unmaskedMirror, fx: { reverb: 0.34 } },
    { name: 'brass cuts', instrument: 'brass-stab', volume: 0.64, pan: 0.08, notes: stabs, fx: { reverb: 0.3 } },
    { name: 'tremolo wire', instrument: 'strings-trem', volume: 0.34, pan: 0.12, notes: wire, fx: { reverb: 0.4 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.56, pan: 0.05, notes: timpani, fx: { reverb: 0.3 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.56, pan: 0, notes: taiko, fx: { reverb: 0.28 } },
    { name: 'tam-tam', instrument: 'tam-tam', volume: 0.5, pan: 0.14, notes: gong, fx: { reverb: 0.5 } },
  ],
};
