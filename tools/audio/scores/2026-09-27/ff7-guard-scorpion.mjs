/**
 * SKETCH for the FF7 Guard Scorpion fight — "Reactor Alarm".
 * F minor with a Phrygian flat second, 4/4, 154 bpm, 32 bars (128 beats, 49.9 s);
 * loop from bar 5 (beat 16) to the end.
 *
 * ORIGINAL COMPOSITION. Every motif below was written for this file from the
 * three cells named in it (PISTON, SIREN, ALARM). Nothing is transcribed,
 * quoted, paraphrased or imitated from any existing work: no retail FF7 music
 * (the fight's retail cue is named in research/ff7-guard-scorpion.md §11 as a
 * reference only; it was not played, opened or used as input), and nothing from
 * our own FFX / FFX-2 themes either (`themes.ts` is not imported, on purpose:
 * this is a different game). `tools/audio/scores/2026-09-27/originality-check.mjs`
 * measures the second half of that claim against every note array we own.
 *
 * GAME CASE (AGENTS.md rule 14): **FF7 only.** The hidden, experimental Guard
 * Scorpion encounter. Nothing in FFX or FFX-2 plays or changes because of it.
 * Its harmonic language is its own and differs from both house worlds on
 * purpose (THEMES.md "Harmonic language, by world"): not FFX's plain Aeolian
 * with rationed dominants, not FFX-2's Dorian pop. F minor coloured by the
 * PHRYGIAN FLAT SECOND (Gb) as a structural chord, and a real major dominant
 * (C) at every turn back home: a machine that keeps resetting.
 *
 * THE BRIEF (driver, 2026-09-27): an urgent industrial reactor-raid boss mood —
 * driving bass ostinato, brass stabs, snare, a tense minor melody. It is a
 * SKETCH for Bailey's ear (rule 13); it is not registered in
 * `src/audio/tracks/index.ts` and is wired to nothing.
 *
 * THE THREE CELLS
 *   PISTON  the bass ostinato: root, root, octave, root | root, octave, fifth,
 *           root, in eighths, off-beats pushed. Sixteenths at the climax.
 *   SIREN   a two-note alarm a semitone apart (the fifth and the flat sixth),
 *           two beats each, on the hollow square lead. Opens the cue and comes
 *           back as the tail charges.
 *   ALARM   the eight-bar tune: it climbs 1 - b3 - 5 - b6, falls back through
 *           the flat second, and ends its answer on a raised seventh (E) pulling
 *           up to the tonic. Rests in bars 3, 4, 6 and 8, so the stabs speak.
 *
 * Form (4/4, 154 bpm):
 *   bars  1- 4  intro  beats   0- 16  siren, clangs, taiko; PISTON enters bar 3
 *   bars  5-12  A      beats  16- 48  ALARM on violins over horns       <- loop start
 *   bars 13-16  B      beats  48- 64  "the tail rises": a climbing line, quarter stabs
 *   bars 17-24  C      beats  64- 96  ALARM on trumpets, violins an octave up, sixteenths
 *   bars 25-32  D      beats  96-128  horns low on the tune's head, then siren + roll into A
 */

import { chordMidis, chordRoots, concatNotes, drumLine, tracker, transposeNotes } from '../../../../src/audio/score.ts';
import { arch, louder } from '../2026-09-21/sketch-kit.mjs';

export const BPM = 154;
const INTRO = 0;
const A = 16;
const B = 48;
const C = 64;
const D = 96;
const LENGTH = 128;

/** Half-bar harmony (two beats per symbol), section by section. */
const INTRO_HALF = ['Fm', 'Fm', 'Fm', 'Fm', 'Fm', 'Fm', 'Gb', 'C'];
const ALARM_HALF = ['Fm', 'Fm', 'Bbm', 'Bbm', 'Eb', 'Eb', 'Db', 'Db', 'Fm', 'Fm', 'Gb', 'Gb', 'Db', 'C', 'Fm', 'Fm'];
const RISE_HALF = ['Db', 'Db', 'Eb', 'Eb', 'Gb', 'Gb', 'C', 'C'];
const D_HALF = ['Fm', 'Fm', 'Bbm', 'Bbm', 'Eb', 'Eb', 'Db', 'Db', 'Gb', 'Gb', 'Gb', 'Gb', 'C', 'C', 'C', 'C'];
export const ALL_HALF = [...INTRO_HALF, ...ALARM_HALF, ...RISE_HALF, ...ALARM_HALF, ...D_HALF];

/** The chord symbol in force at a beat. */
const chordAt = (beat) => ALL_HALF[Math.min(ALL_HALF.length - 1, Math.floor(beat / 2))];

// --- ALARM, the tune ---------------------------------------------------------

export const ALARM = `
  F4:1.5 Ab4:0.5 C5:1 Db5:1 |
  C5:1.5 Bb4:0.5 Ab4:0.5 Gb4:0.5 F4:1 |
  -:0.5 Eb4:0.5 F4:0.5 Ab4:0.5 Bb4:1 Eb5:1 |
  Db5:2.5 -:1.5 |
  F5:1.5 Eb5:0.5 Db5:1 C5:1 |
  Db5:0.5 C5:0.5 Bb4:1 Gb4:1.5 -:0.5 |
  Ab4:1 Bb4:1 C5:1 Db5:0.5 E5:0.5 |
  F5:3 -:1 |
`;

/** "The tail rises": a climbing line over bVI - bVII - bII - V. */
export const RISE = `
  F4:2 Ab4:2 | G4:2 Bb4:2 | Bb4:2 Db5:2 | C5:2 E5:1.5 -:0.5 |
`;

function alarmAt(start, transpose = 0, low = 0.6, peak = 0.84) {
  const notes = transposeNotes(tracker(ALARM, { start, gate: 0.96, velocity: 0.8, checkBars: 4 }), transpose);
  // Two four-bar arches (THEMES.md default shape), the answer a little harder.
  return concatNotes(
    arch(notes.filter((n) => n[0] < start + 16), start, start + 16, low, peak),
    arch(notes.filter((n) => n[0] >= start + 16), start + 16, start + 32, low + 0.02, peak + 0.04),
  );
}

function riseAt(start, transpose = 0) {
  const notes = transposeNotes(tracker(RISE, { start, gate: 1.0, checkBars: 4 }), transpose);
  // A crescendo, not an arch: the tail is coming up.
  return notes.map((n, i) => [n[0], n[1], n[2], Math.min(1, 0.56 + i * 0.05)]);
}

const violins = concatNotes(
  alarmAt(A),
  riseAt(B, 12),
  louder(alarmAt(C, 12), 0.04),
);
const hornsTune = concatNotes(
  alarmAt(A, -12, 0.54, 0.76),
  riseAt(B),
  alarmAt(C, -12, 0.6, 0.82),
  // D: only the head of the tune, low and quiet, as the room drains.
  alarmAt(D, -12, 0.46, 0.62).filter((n) => n[0] < D + 16),
);
const trumpets = louder(alarmAt(C, 0, 0.62, 0.86), 0.04);

// --- SIREN -------------------------------------------------------------------

function siren(from, bars, low, peak) {
  const notes = [];
  for (let i = 0; i < bars * 2; i++) notes.push([from + i * 2, 1.9, i % 2 === 0 ? 'C5' : 'Db5', 0.7]);
  return arch(notes, from, from + bars * 4, low, peak);
}
const sirens = concatNotes(siren(INTRO, 4, 0.5, 0.72), siren(D + 16, 4, 0.46, 0.7));

// --- PISTON, the bass ostinato -------------------------------------------------

const EIGHTHS = [0, 0, 12, 0, 0, 12, 7, 0];
const EIGHTH_VEL = [0.8, 0.6, 0.9, 0.64, 0.76, 0.9, 0.72, 0.62];
const SIXTEENTHS = [0, 0, 12, 0, 0, 7, 12, 0];

function piston(from, to, step, level) {
  const notes = [];
  const shape = step < 0.5 ? SIXTEENTHS : EIGHTHS;
  let i = 0;
  for (let at = from; at < to - 1e-9; at += step, i++) {
    const root = chordRoots([chordAt(at)], 2)[0];
    const v = EIGHTH_VEL[i % EIGHTH_VEL.length] * level;
    notes.push([at, step * 0.82, root + shape[i % shape.length], Math.min(1, v)]);
  }
  return notes;
}
const bass = concatNotes(
  piston(8, A, 0.5, 0.72),
  piston(A, B, 0.5, 0.92),
  piston(B, C, 0.5, 1.0),
  piston(C, D, 0.25, 0.95),
  piston(D, D + 16, 1, 0.7),
  piston(D + 16, LENGTH, 0.25, 0.9),
);

/** Low strings: the root on each half bar, held; the weight under the piston. */
function lowStrings(from, to, level) {
  const notes = [];
  for (let at = from; at < to - 1e-9; at += 2) {
    const root = chordRoots([chordAt(at)], 2)[0];
    notes.push([at, 2.05, root, level * (at % 4 === 0 ? 1 : 0.84)]);
  }
  return notes;
}
const lows = concatNotes(lowStrings(A, D + 16, 0.66), lowStrings(D + 16, LENGTH, 0.74));

// --- stabs, beds and the running sixteenths ------------------------------------

/** Brass stabs: 0.80 on the downbeat, 0.95 on the and-of-beat (THEMES.md boss accents). */
function stabs(from, to, hits) {
  const notes = [];
  for (let bar = from; bar < to - 1e-9; bar += 4) {
    for (const [offset, v] of hits) {
      const at = bar + offset;
      for (const midi of chordMidis(chordAt(at), { octave: 3, center: 60 })) notes.push([at, 0.34, midi, v]);
    }
  }
  return notes;
}
const brassStabs = concatNotes(
  stabs(12, A, [[2, 0.8], [3.5, 0.95]]),
  stabs(A, B, [[0, 0.8], [1.5, 0.95], [3.5, 0.9]]),
  stabs(B, C, [[0, 0.78], [1, 0.84], [2, 0.88], [3, 0.94]]),
  stabs(C, D, [[0, 0.82], [1.5, 0.96], [2.5, 0.9], [3.5, 0.97]]),
  stabs(D + 16, LENGTH, [[0, 0.8], [1.5, 0.92], [3.5, 0.96]]),
);

const bed = [
  [INTRO, 16, 'F3', 0.34], [INTRO, 16, 'C4', 0.3],
  [D, 8, 'F3', 0.36], [D, 8, 'C4', 0.32], [D + 8, 8, 'Eb3', 0.36], [D + 8, 8, 'Bb3', 0.32],
  [D + 16, 8, 'Gb3', 0.42], [D + 16, 8, 'Db4', 0.4], [D + 24, 8, 'G3', 0.46], [D + 24, 8, 'C4', 0.44],
];

/** Sixteenth arpeggios on the marcato strings under the climax. */
function runs(from, to) {
  const notes = [];
  const pattern = [0, 1, 3, 1, 2, 1, 3, 2];
  let i = 0;
  for (let at = from; at < to - 1e-9; at += 0.25, i++) {
    const tones = chordMidis(chordAt(at), { octave: 4, center: 67 });
    const k = pattern[i % pattern.length];
    const midi = tones[k % tones.length] + 12 * Math.floor(k / tones.length);
    notes.push([at, 0.22, midi, i % 4 === 0 ? 0.62 : i % 2 === 0 ? 0.48 : 0.42]);
  }
  return notes;
}
const strRuns = concatNotes(runs(C, D), runs(D + 24, LENGTH));

// --- the kit and the reactor ----------------------------------------------------

function bars(pattern, from, to, pitch, velocity, accent = 1.3) {
  const times = Math.round((to - from) / 4);
  return drumLine(pattern, { start: from, step: 0.25, pitch, velocity, accentVelocity: Math.min(1, velocity * accent), times });
}

const kick = concatNotes(
  bars('X.......X.......', 8, A, 'C1', 0.6),
  bars('X.....x.X.x.....', A, B, 'C1', 0.74),
  bars('X...X...X...X...', B, C, 'C1', 0.78),
  bars('X..x..X.X..x..x.', C, D, 'C1', 0.8),
  bars('X.......X.......', D, D + 16, 'C1', 0.6),
  bars('X...X...X...X.x.', D + 16, LENGTH, 'C1', 0.76),
);
const snareRoll = (at, beats, from, to) =>
  Array.from({ length: beats * 4 }, (_, s) => [at + s * 0.25, 0.24, 'D2', from + ((to - from) * s) / (beats * 4)]);
const snare = concatNotes(
  snareRoll(12, 4, 0.3, 0.8),
  bars('....X..g....X.g.', A, B - 4, 'D2', 0.72),
  bars('....X..g..X.X.XX', B - 4, B, 'D2', 0.74),
  bars('..x...x...x...x.', B, B + 12, 'D2', 0.6),
  snareRoll(B + 12, 4, 0.4, 0.9),
  bars('....X..g....X.gX', C, D, 'D2', 0.8),
  bars('....X.......X...', D + 8, D + 16, 'D2', 0.5),
  bars('....X..g....X.g.', D + 16, LENGTH - 8, 'D2', 0.7),
  snareRoll(LENGTH - 8, 8, 0.3, 0.9),
);
const hats = concatNotes(
  bars('x.X.x.X.x.X.x.X.', A, B, 'F#3', 0.34, 1.45),
  bars('xxXxxxXxxxXxxxXx', C, D, 'F#3', 0.36, 1.4),
  bars('x.X.x.X.x.X.x.X.', D + 16, LENGTH - 8, 'F#3', 0.32, 1.45),
);
const taiko = concatNotes(
  bars('X.....x.........', INTRO, 8, 'A1', 0.62),
  bars('X.....x.X.......', 8, A, 'A1', 0.66),
  bars('X...............', A, B, 'A1', 0.5),
  bars('X.x.X.x.X.x.XXXX', B, C, 'A1', 0.66),
  bars('X.....x.X.....x.', C, D, 'A1', 0.7),
  bars('X.......x.......', D, LENGTH, 'A1', 0.6),
);
/** The reactor: a press on the and-of-four, every other bar; faster in the intro. */
const clangs = concatNotes(
  bars('X.....x.....x...', INTRO, A, 'D3', 0.5),
  drumLine('..............X...........x.....', { start: A, step: 0.25, pitch: 'D3', velocity: 0.46, accentVelocity: 0.58, times: (D - A) / 8 }),
  bars('X.......x.......', D, D + 16, 'D3', 0.4),
);
const tomFill = 'A3:0.25 A3:0.25 F3:0.25 F3:0.25 D3:0.25 D3:0.25 C3:0.5';
const toms = concatNotes(
  tracker(tomFill, { start: A - 2, velocity: 0.66 }),
  tracker(tomFill, { start: C - 2, velocity: 0.78 }),
  tracker(tomFill, { start: D - 2, velocity: 0.7 }),
);
const crash = [A, B, C, D + 16].map((at, i) => [at, 1.6, 'C5', i === 2 ? 0.72 : 0.56]);
const swell = [[B - 4, 4, 'C5', 0.5], [C - 4, 4, 'C5', 0.56], [LENGTH - 4, 4, 'C5', 0.58]];
const timpani = concatNotes(
  [[0, 1.5, 'F2', 0.66], [8, 1.5, 'F2', 0.6], [B, 1.4, 'Db2', 0.7], [B + 4, 1.4, 'Eb2', 0.72], [B + 8, 1.4, 'Gb2', 0.74], [B + 12, 1.4, 'C2', 0.78]],
  [[D, 1.4, 'F2', 0.6], [D + 16, 1.4, 'Gb2', 0.66], [D + 24, 1.4, 'C2', 0.72]],
);

export default {
  name: 'sketch-ff7-guard-scorpion',
  bpm: BPM,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 2.5,
  fx: {
    reverb: { room: 0.6, damp: 0.46, width: 0.95, preDelay: 0.014 },
    delay: { timeBeats: 0.75, feedback: 0.22, damp: 3000 },
  },
  channels: [
    { name: 'piston', instrument: 'synth-bass', volume: 0.8, pan: 0, notes: bass, fx: { reverb: 0.06 }, perform: { timingJitterMs: 4 } },
    { name: 'low strings', instrument: 'strings-low', volume: 0.56, pan: -0.05, notes: lows, fx: { reverb: 0.3 }, perform: { timingJitterMs: 14 } },
    { name: 'violins: ALARM', instrument: 'strings', volume: 0.8, pan: 0.12, notes: violins, fx: { reverb: 0.3, delay: 0.06 }, perform: { timingJitterMs: 14 } },
    { name: 'horns', instrument: 'brass', volume: 0.7, pan: -0.14, notes: hornsTune, fx: { reverb: 0.28 }, perform: { timingJitterMs: 12 } },
    { name: 'trumpets', instrument: 'trumpet', volume: 0.6, pan: -0.06, notes: trumpets, fx: { reverb: 0.24 }, perform: { timingJitterMs: 10 } },
    { name: 'brass stabs', instrument: 'brass-stab', volume: 0.5, pan: -0.28, notes: brassStabs, fx: { reverb: 0.18 }, perform: { timingJitterMs: 6 } },
    { name: 'siren', instrument: 'pwm-lead', volume: 0.36, pan: 0.3, notes: sirens, fx: { reverb: 0.36, delay: 0.18 } },
    { name: 'dread bed', instrument: 'strings-trem', volume: 0.42, pan: 0, notes: bed, fx: { reverb: 0.46 }, perform: { timingJitterMs: 16 } },
    { name: 'runs', instrument: 'strings-short', volume: 0.46, pan: 0.3, notes: strRuns, fx: { reverb: 0.22 }, perform: { timingJitterMs: 10 } },
    { name: 'kick', instrument: 'kick', volume: 0.9, pan: 0, notes: kick },
    { name: 'snare', instrument: 'snare', volume: 0.74, pan: -0.05, notes: snare, fx: { reverb: 0.16 } },
    { name: 'hats', instrument: 'hat', volume: 0.32, pan: 0.2, notes: hats },
    { name: 'taiko', instrument: 'taiko', volume: 0.62, pan: -0.2, notes: taiko, fx: { reverb: 0.26 } },
    { name: 'reactor clangs', instrument: 'metal-hit', volume: 0.32, pan: 0.35, notes: clangs, fx: { reverb: 0.3 } },
    { name: 'toms', instrument: 'tom', volume: 0.55, pan: -0.15, notes: toms, fx: { reverb: 0.2 } },
    { name: 'crash', instrument: 'crash', volume: 0.42, pan: 0.1, notes: crash, fx: { reverb: 0.3 } },
    { name: 'swell', instrument: 'cymbal-swell', volume: 0.36, pan: 0.05, notes: swell, fx: { reverb: 0.3 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.6, pan: 0.08, notes: timpani, fx: { reverb: 0.3 } },
  ],
};
