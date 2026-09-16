/**
 * "Rite Without End" — Yunalesca boss theme.
 *
 * ORIGINAL COMPOSITION. A ceremony that has been performed a thousand times
 * and will be performed a thousand more, indifferent to the two people about
 * to die inside it. F harmonic minor, compound 6/8 at 132 bpm (quarter note;
 * one bar = 3 beats in this engine's internal unit, `checkBars: 3`) — a
 * relentless harp-and-spiccato-strings ostinato built only from roots, fifths
 * and octaves (so it never fights the chords moving under it), a chanting
 * choir, and timpani that never once changes its pitch for the whole piece:
 * the rite does not care what chord is under it either.
 *
 * Distinct from `boss-dread` (D minor, 90 bpm, slow choir hymn, pedal-and-
 * toll) and `battle-ffx` (E minor, 150 bpm, rock kit and brass-stab riffing):
 * this is compound meter, no kit at all, and a chant instead of a melody.
 *
 * The choir's chant is `augment(SENDING, 1.5)` — F4 held beats 0-4.5, Ab4
 * 4.5-6, G4 6-9, F4 9-12 — repeated at a fixed pitch under harmony that keeps
 * shifting beneath it, the way a ritual repeats its words whether or not the
 * room around it has changed. Every chord under every bar of the chant was
 * chosen so the chant's held pitch is a tone of that chord (or at worst a
 * non-adjacent color tone) — the indifference reads as inevitability, not as
 * wrong notes. The one place a fixed transposition can't stay consonant
 * (the chant's G-slot against Edim7) the harmony/fifths layer simply rests
 * there instead of clashing.
 *
 * Form (6/8, 74 bars, 100.9 s):
 *   bars  1-6    intro     beats   0- 18   harp ostinato alone, thin taiko
 *   bars  7-38   A         beats  18-114   chant + ostinato, building        <- loop start
 *                                          (fifths and octave doubling join
 *                                           in the back half, brass under it)
 *   bars 39-46   B phr.1   beats 114-138   her final form begins: chant
 *                                          doubled an octave down, Edim7 bites
 *   bars 47-54   B phr.2   beats 138-162   phrase repeats, weight builds
 *   bars 55-62   B phr.3   beats 162-186   the chant restated a 4th higher
 *                                          (Bb) over chords chosen for it
 *   bars 63-70   B phr.4   beats 186-210   the chant compressed to half
 *                                          length, twice per 4 bars, taiko at
 *                                          full density — the loop's peak
 *   bars 71-74   breath    beats 210-222   one last quiet chant statement,
 *                                          ostinato thins — never fully stops
 * Loop 18 -> 222 (92.7 s of driving material); the closing Csus4 breath bar
 * (holding the chant's own F) leads straight back into A's opening Fm.
 */

import {
  barStarts,
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  scaleVelocity,
  transposeNotes,
  type Note,
  type Pitch,
  type Track,
} from '../score.ts';
import { augment, cell, SENDING } from './motifs.ts';

const BAR = 3; // beats per bar in 6/8 (barBeats = 6 * 4/8)
const CHANT_LEN = 12; // augment(SENDING, 1.5) spans exactly four bars
const CHANT_LEN_HALF = 6; // augment(SENDING, 0.75) spans exactly two bars

const INTRO_CHORDS = ['Fm', 'Fm', 'Fm', 'Fm', 'Db', 'C'];

// A: i VI V VI i iv V i — the chant's F/Ab/G/F is a chord tone (or a safe,
// non-adjacent color tone) against every one of these.
const A_PHRASE = ['Fm', 'Db', 'C', 'Db', 'Fm', 'Bbm', 'C', 'Fm'];
const A_CHORDS = [...A_PHRASE, ...A_PHRASE, ...A_PHRASE, ...A_PHRASE]; // 32 bars

// B phrases 1-2: i vii°7 iv V i VI iv Vsus — the chant's G-slot lands on
// Edim7's own 3rd (G), so the chant itself never clashes; only the +5 fifths
// layer needs to duck that slot (see choirFifths).
const B_PHRASE_BASE = ['Fm', 'Bbm', 'Edim7', 'Db', 'Fm', 'Db', 'Edim7', 'Csus4'];
// B phrase 3: the chant restated a 4th higher (F -> Bb, so it sings
// Bb/Db/C/Bb) over chords built for that transposition.
const B_PHRASE_3 = ['Bbm', 'Db', 'Fm', 'Bbm', 'Bbm', 'Db', 'Fm', 'Bbm'];
// B phrase 4: the chant compressed to 6 beats and stated twice per 4 bars,
// so each bar now holds F+Ab or G+F — Fm carries the F/Ab bars exactly,
// Csus4 (C F G) carries the G/F bars exactly.
const B_PHRASE_4 = ['Fm', 'Csus4', 'Fm', 'Csus4', 'Fm', 'Csus4', 'Fm', 'Csus4'];
const B_CHORDS = [...B_PHRASE_BASE, ...B_PHRASE_BASE, ...B_PHRASE_3, ...B_PHRASE_4]; // 32 bars

// Breath: i VI vii°7 Vsus — same safe shapes as B, ending on the chant's own F.
const BREATH_CHORDS = ['Fm', 'Db', 'Edim7', 'Csus4'];

const INTRO_BARS = INTRO_CHORDS.length; // 6
const A_BARS = A_CHORDS.length; // 32
const B_BARS = B_CHORDS.length; // 32
const BREATH_BARS = BREATH_CHORDS.length; // 4
const BARS = INTRO_BARS + A_BARS + B_BARS + BREATH_BARS; // 74
const LENGTH = BARS * BAR; // 222 beats = 100.9 s at 132 bpm

const A_START = INTRO_BARS * BAR; // 18
const B_START = A_START + A_BARS * BAR; // 114
const PHRASE3_START = B_START + 16 * BAR; // 162
const PHRASE4_START = B_START + 24 * BAR; // 186
const BREATH_START = B_START + B_BARS * BAR; // 210

const CHANT_CELL: Note[] = augment(SENDING, 1.5);
const CHANT_CELL_HALF: Note[] = augment(SENDING, 0.75);
/** The fifths layer's G-slot (index 2) lands on Edim7 during phrases 1-2 and would
 * form a minor 9th — it rests there instead of transposing into the clash. */
const CHANT_CELL_NO_THIRD: Note[] = CHANT_CELL.filter((_, i) => i !== 2);

/** `reps` statements of `patternCell`, `cellLen` beats apart, one velocity per rep. */
function chantReps(
  startBeat: number,
  reps: number,
  cellLen: number,
  patternCell: Note[],
  tonic: Pitch,
  velocity: (i: number) => number,
): Note[] {
  const notes: Note[] = [];
  for (let i = 0; i < reps; i++) {
    notes.push(...cell(patternCell, startBeat + i * cellLen, tonic, velocity(i)));
  }
  return notes;
}

/** Root-fifth-octave ostinato stamped once per bar over a chord sequence — safe over any
 * chord quality, so it never clashes with the major/minor thirds moving underneath it. */
function ostinato(pattern: Note[], chords: string[], startBeat: number, octave: number, velScale: number): Note[] {
  const notes = motif(pattern, barStarts(startBeat, chords.length, BAR), chordRoots(chords, octave));
  return velScale === 1 ? notes : scaleVelocity(notes, velScale);
}

/** Ascending gallop: root, fifth, octave, fifth, root, fifth. */
const OSTINATO_UP: Note[] = [
  [0, 0.5, 0, 0.85],
  [0.5, 0.5, 7, 0.7],
  [1, 0.5, 12, 0.8],
  [1.5, 0.5, 7, 0.7],
  [2, 0.5, 0, 0.85],
  [2.5, 0.5, 7, 0.68],
];

/** The answering, descending gallop that interlocks with it a register higher. */
const OSTINATO_DOWN: Note[] = [
  [0, 0.5, 12, 0.6],
  [0.5, 0.5, 7, 0.55],
  [1, 0.5, 0, 0.65],
  [1.5, 0.5, 12, 0.6],
  [2, 0.5, 7, 0.55],
  [2.5, 0.5, 0, 0.65],
];

/** B-only accent: a hard root hit on each of the bar's two dotted-quarter pulses. */
const PLUCK_ACCENT: Note[] = [
  [0, 0.4, 0, 0.95],
  [1.5, 0.4, 0, 0.85],
];

function choirMain(): Note[] {
  return concatNotes(
    chantReps(A_START, 8, CHANT_LEN, CHANT_CELL, 'F4', (i) => 0.5 + i * 0.03),
    chantReps(B_START, 4, CHANT_LEN, CHANT_CELL, 'F4', (i) => 0.68 + i * 0.03), // phrases 1-2
    chantReps(PHRASE3_START, 2, CHANT_LEN, CHANT_CELL, 'Bb4', (i) => 0.8 + i * 0.03), // phrase 3, up a 4th
    chantReps(PHRASE4_START, 4, CHANT_LEN_HALF, CHANT_CELL_HALF, 'F4', (i) => 0.86 + i * 0.02), // phrase 4, compressed
    chantReps(BREATH_START, 1, CHANT_LEN, CHANT_CELL, 'F4', () => 0.4),
  );
}

/** Doubled an octave down starting in her final form — one quiet foreshadow at the end of A.
 * Same pitch classes as the main chant throughout, so every consonance check above holds. */
function choirLow(): Note[] {
  return concatNotes(
    cell(CHANT_CELL, A_START + 7 * CHANT_LEN, 'F3', 0.25),
    chantReps(B_START, 4, CHANT_LEN, CHANT_CELL, 'F3', (i) => 0.42 + i * 0.04),
    chantReps(PHRASE3_START, 2, CHANT_LEN, CHANT_CELL, 'Bb3', (i) => 0.58 + i * 0.03),
    chantReps(PHRASE4_START, 4, CHANT_LEN_HALF, CHANT_CELL_HALF, 'F3', (i) => 0.66 + i * 0.03),
  );
}

/** A 4th above (not a 5th — a 5th puts the chant's own tones a semitone from Db/Edim7).
 * Entering only for A's back half and phrases 1-2 of B; rests through phrase 3's transposed
 * chant and phrase 4's compression rather than risk a new clash, and drops the chant's G-slot
 * during phrases 1-2 since it would land a semitone from Edim7's Db. */
function choirFifths(): Note[] {
  return concatNotes(
    transposeNotes(chantReps(A_START + 4 * CHANT_LEN, 4, CHANT_LEN, CHANT_CELL, 'F4', (i) => 0.18 + i * 0.05), 5),
    transposeNotes(chantReps(B_START, 4, CHANT_LEN, CHANT_CELL_NO_THIRD, 'F4', (i) => 0.28 + i * 0.03), 5),
  );
}

function harpLine(): Note[] {
  return concatNotes(
    ostinato(OSTINATO_UP, INTRO_CHORDS, 0, 3, 0.55),
    ostinato(OSTINATO_UP, A_CHORDS, A_START, 3, 0.85),
    ostinato(OSTINATO_UP, B_CHORDS.slice(0, 24), B_START, 3, 1),
    ostinato(OSTINATO_UP, B_CHORDS.slice(24), PHRASE4_START, 3, 1.15),
    ostinato(OSTINATO_UP, BREATH_CHORDS, BREATH_START, 3, 0.5),
  );
}

function stringsShortLine(): Note[] {
  return concatNotes(
    ostinato(OSTINATO_DOWN, A_CHORDS, A_START, 4, 0.75),
    ostinato(OSTINATO_DOWN, B_CHORDS.slice(0, 24), B_START, 4, 1),
    ostinato(OSTINATO_DOWN, B_CHORDS.slice(24), PHRASE4_START, 4, 1.2),
    ostinato(OSTINATO_DOWN, BREATH_CHORDS, BREATH_START, 4, 0.45),
  );
}

function pluckLine(): Note[] {
  return concatNotes(
    ostinato(PLUCK_ACCENT, B_CHORDS.slice(0, 24), B_START, 3, 1),
    ostinato(PLUCK_ACCENT, B_CHORDS.slice(24), PHRASE4_START, 3, 1.25),
  );
}

/** The rite's pulse: fixed pitch, never varies, whatever chord is passing underneath. */
function timpaniLine(): Note[] {
  return drumLine('X..X..', { start: 0, step: 0.5, pitch: 'F2', velocity: 0.72, times: BARS });
}

function taikoLine(): Note[] {
  return concatNotes(
    drumLine('x.x.x.', { start: 0, step: 0.5, pitch: 'F2', velocity: 0.4, times: INTRO_BARS + A_BARS }),
    drumLine('XxXx.x', { start: B_START, step: 0.5, pitch: 'F2', velocity: 0.62, times: 24 }), // phrases 1-3
    drumLine('XxXxXx', { start: PHRASE4_START, step: 0.5, pitch: 'F2', velocity: 0.8, times: 8 }), // phrase 4: full density
    drumLine('x..x..', { start: BREATH_START, step: 0.5, pitch: 'F2', velocity: 0.3, times: BREATH_BARS }),
  );
}

function brassSwells(): Note[] {
  return concatNotes(
    chordLine(A_CHORDS.slice(16), { start: A_START + 16 * BAR, barBeats: BAR, octave: 3, center: 55, velocity: 0.34, dur: 2.1, roll: 0.1 }),
    chordLine(B_CHORDS.slice(0, 24), { start: B_START, barBeats: BAR, octave: 3, center: 52, velocity: 0.5, dur: 2.1, roll: 0.12 }),
    chordLine(B_CHORDS.slice(24), { start: PHRASE4_START, barBeats: BAR, octave: 3, center: 50, velocity: 0.7, dur: 2.1, roll: 0.14 }),
    chordLine(BREATH_CHORDS, { start: BREATH_START, barBeats: BAR, octave: 3, center: 55, velocity: 0.28, dur: 2.1 }),
  );
}

export const yunalescaTrack: Track = {
  name: 'boss-yunalesca',
  bpm: 132,
  timeSig: [6, 8],
  loop: { start: A_START, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.72, damp: 0.32, width: 0.92, preDelay: 0.018 },
    delay: { timeBeats: 1.5, feedback: 0.24, damp: 2600 },
  },
  channels: [
    { name: 'choir chant', instrument: 'choir', volume: 0.9, pan: -0.05, notes: choirMain(), fx: { reverb: 0.4 } },
    { name: 'choir low', instrument: 'choir', volume: 0.6, pan: 0.1, notes: choirLow(), fx: { reverb: 0.4 } },
    { name: 'choir fourths', instrument: 'choir', volume: 0.42, pan: 0.22, notes: choirFifths(), fx: { reverb: 0.45 } },
    { name: 'harp ostinato', instrument: 'harp', volume: 0.62, pan: -0.28, notes: harpLine(), fx: { reverb: 0.14 } },
    { name: 'strings ostinato', instrument: 'strings-short', volume: 0.55, pan: 0.28, notes: stringsShortLine(), fx: { reverb: 0.18 } },
    { name: 'pluck accents', instrument: 'pluck', volume: 0.55, pan: 0, notes: pluckLine(), fx: { reverb: 0.1 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.85, pan: 0.06, notes: timpaniLine(), fx: { reverb: 0.22 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.68, pan: -0.15, notes: taikoLine(), fx: { reverb: 0.16 } },
    { name: 'brass swells', instrument: 'brass', volume: 0.62, pan: -0.2, notes: brassSwells(), fx: { reverb: 0.3 } },
  ],
};

export default yunalescaTrack;
