/**
 * SKETCH B for the Macalania battle cue — "The Processional".
 * Cold, ceremonial, and the ostinato tightens. 45 s, C# minor, 4/4, 112 bpm.
 *
 * ORIGINAL COMPOSITION. Nothing here is transcribed from any existing work.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only**, for the same reason as sketch A
 * — the `seymour-anima-macalania` chapter is FFX material, and this file is not
 * registered anywhere, so no FFX-2 chapter can reach it.
 *
 * THE CONTRAST it exists to draw. Sketch A answers the brief's "court dance"
 * reading: manners, and something rotten underneath them. This one answers the
 * other reading of the same brief — ceremony without a dance in it. Nothing
 * here is charming. The tempo never changes, the harmony barely moves, and the
 * only thing that develops is how *finely* the pulse is divided: halves, then
 * quarters, then eighths, then sixteenths. The fight gets faster without the
 * music getting faster, which is what "rising once at the summon and returning
 * to composure" can mean if the composure was never warm.
 *
 * ONE HONEST FLAG FOR BAILEY. The preflight's anti-brief for this chapter says
 * "no relentless pedal ostinato — those are the Flux chapter's"
 * (`chapter-macalania-review.md` §6.3). This sketch deliberately walks up to
 * that line so the line can be judged by ear instead of on paper: the ostinato
 * is here, but it is bowed strings and a bell rather than the Flux cue's organ
 * and choir mass, and it stops dead twice. If it still sounds like the Flux
 * chapter, that is the answer, and sketch A wins on the spot.
 *
 * THE MATERIAL is `SEYMOUR` and `SEYMOUR_MIRROR` (THEMES.md §3), imported. The
 * motif stays at its written register here — trombone and cellos where the
 * shipped cue uses pedal organ — so the two-second difference between this cue
 * and `boss-seymour` is carried entirely by the processional pulse and the
 * absence of the choir.
 *
 * Form (4/4, 112 bpm, 21 bars, 84 beats, 45.0 s):
 *   bars  1- 4  beats  0-16  bell, pedal, ostinato in HALVES
 *   bars  5-10  beats 16-40  QUARTERS; the motif enters, trombone
 *   bars 11-16  beats 40-64  EIGHTHS; the mirror answers in the cellos
 *   bars 17-20  beats 64-80  SIXTEENTHS; the full weight, one statement
 *   bar     21  beats 80-84  everything stops but the bell
 *
 * Resemblance guard (THEMES.md §3): no choir and no chanted text anywhere, and
 * the ostinato is a string section, never an organ left hand at speed.
 */

import { chordRoots, motif, toMidi } from '../../../../src/audio/score.ts';
import { SEYMOUR, SEYMOUR_MIRROR } from '../../../../src/audio/tracks/themes.ts';
import { arch, shape } from './sketch-kit.mjs';

const HALVES = 0;
const QUARTERS = 16;
const EIGHTHS = 40;
const SIXTEENTHS = 64;
const STOP = 80;
const LENGTH = 84;

/**
 * The procession's four pitches: tonic, minor third, fifth — and the #4 that
 * belongs to no key, which is the one note of the motif that carries weight.
 * The ostinato is therefore made of the theme's own material without ever
 * stating the theme.
 */
const STEPS = ['C#2', 'E2', 'G#2', 'G2'];

/** Lay one pitch cycle across [from, to) at a fixed subdivision. */
function ostinato(from, to, step, velocity) {
  const notes = [];
  let i = 0;
  for (let at = from; at < to - 1e-9; at += step, i++) {
    const strong = i % 4 === 0;
    notes.push([
      at,
      step * 0.92,
      toMidi(STEPS[i % STEPS.length]),
      Math.min(1, velocity + (strong ? 0.1 : 0)),
    ]);
  }
  return notes;
}

/**
 * The tightening. Each section divides the same bar more finely at the same
 * tempo, and each one is a touch louder than the last — but the sixteenths
 * stop a bar early, so the loudest thing in the cue is the silence at bar 21.
 */
const pulse = [
  ...ostinato(HALVES, QUARTERS, 2, 0.42),
  ...ostinato(QUARTERS, EIGHTHS, 1, 0.5),
  ...ostinato(EIGHTHS, SIXTEENTHS, 0.5, 0.56),
  ...ostinato(SIXTEENTHS, STOP, 0.25, 0.62),
];

/** Chord per bar — five chords in twenty-one bars. Ceremony does not modulate. */
const CHORDS = [
  'C#m', 'C#m', 'Amaj7', 'Amaj7',
  'C#m', 'C#m', 'Amaj7', 'Gdim7', 'C#m', 'C#m',
  'C#m', 'Amaj7', 'Gdim7', 'G#7', 'C#m', 'C#m',
  'C#m', 'Amaj7', 'Gdim7', 'C#m',
  'C#m',
];

/** The organ pedal, one note per four bars. It is a floor, not a part. */
const pedal = [
  [HALVES, 16, 'C#1', 0.4],
  [QUARTERS, 24, 'C#1', 0.46],
  [EIGHTHS, 24, 'C#1', 0.5],
  [SIXTEENTHS, 16, 'C#1', 0.56],
  [STOP, 4, 'C#1', 0.3],
];

/** SEYMOUR's published velocity shape (THEMES.md §3), verbatim. */
const BOW = [0.74, 0.52, 0.72, 0.78, 0.68, 0.62];

/** Three statements in the trombone, at written pitch. */
const statement = shape(
  motif(SEYMOUR, [QUARTERS, QUARTERS + 8, QUARTERS + 16], ['C#3', 'C#3', 'B2']),
  BOW,
);

/** The mirror answers, cellos, in genuine contrary motion. */
const answer = shape(
  motif(SEYMOUR_MIRROR, [EIGHTHS, EIGHTHS + 8, EIGHTHS + 16], ['C#3', 'C#3', 'D3']),
  BOW.map((v) => v - 0.08),
);

/** The full weight: one statement, strings and trombone together, loudest. */
const weight = shape(
  motif(SEYMOUR, [SIXTEENTHS, SIXTEENTHS + 8], ['C#3', 'C#3']),
  BOW.map((v) => Math.min(1, v + 0.14)),
);

/** A bell at the head of each section, and one alone at the end. */
const bell = [
  [HALVES, 8, 'C#4', 0.5],
  [QUARTERS, 8, 'C#4', 0.46],
  [EIGHTHS, 8, 'G#4', 0.5],
  [SIXTEENTHS, 8, 'C#5', 0.58],
  [STOP, 4, 'C#4', 0.4],
];

/** Timpani only where the subdivision changes: the pulse tightening is the event. */
const drum = [
  [QUARTERS, 2, 'C#2', 0.46],
  [EIGHTHS, 2, 'C#2', 0.54],
  [SIXTEENTHS, 3, 'C#2', 0.64],
];

const roots = chordRoots(CHORDS, 2).map((m, i) => [i * 4, 3.7, m, i % 4 === 0 ? 0.52 : 0.4]);

export default {
  name: 'sketch-macalania-b',
  bpm: 112,
  timeSig: [4, 4],
  loop: { start: 0, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  gain: 1,
  fx: {
    reverb: { room: 0.92, damp: 0.24, width: 0.95, preDelay: 0.03 },
  },
  channels: [
    {
      name: 'ostinato (tightening)',
      instrument: 'strings-short',
      volume: 0.78,
      pan: -0.15,
      notes: pulse,
      fx: { reverb: 0.22 },
      perform: { timingJitterMs: 12 },
    },
    {
      name: 'organ pedal',
      instrument: 'organ',
      volume: 0.42,
      pan: 0,
      notes: pedal,
      fx: { reverb: 0.4 },
    },
    {
      name: 'trombone (the motif)',
      instrument: 'trombone',
      volume: 0.8,
      pan: -0.05,
      notes: statement,
      fx: { reverb: 0.3 },
      perform: { timingJitterMs: 11 },
    },
    {
      name: 'cellos (the mirror)',
      instrument: 'strings-low',
      volume: 0.7,
      pan: -0.28,
      notes: answer,
      fx: { reverb: 0.32 },
      perform: { timingJitterMs: 16 },
    },
    {
      name: 'strings (the weight)',
      instrument: 'strings',
      volume: 0.74,
      pan: 0.08,
      notes: arch(weight, SIXTEENTHS, STOP, 0.6, 0.88),
      fx: { reverb: 0.34 },
      perform: { timingJitterMs: 17 },
    },
    {
      name: 'bell',
      instrument: 'bell',
      volume: 0.5,
      pan: 0.2,
      notes: bell,
      fx: { reverb: 0.55 },
    },
    {
      name: 'basses',
      instrument: 'strings-low',
      volume: 0.46,
      pan: -0.1,
      transpose: -12,
      notes: roots,
      fx: { reverb: 0.24 },
      perform: { timingJitterMs: 15 },
    },
    {
      name: 'timpani',
      instrument: 'timpani',
      volume: 0.5,
      pan: 0.05,
      notes: drum,
      fx: { reverb: 0.32 },
    },
  ],
};
