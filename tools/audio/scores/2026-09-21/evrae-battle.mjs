/**
 * SKETCH for the Evrae battle cue — "Assault Under Open Sky".
 * 45 s, A Aeolian, 4/4, 144 bpm.
 *
 * ORIGINAL COMPOSITION. Nothing here is transcribed from any existing work.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Evrae on the *Fahrenheit* is an
 * FFX encounter (`docs/plans/chapter-evrae-review.md` §1-2, from
 * `research/ffx-evrae-airship.md`); nothing in FFX-2 uses it. The mode is
 * **Aeolian, not Dorian**, because THEMES.md reserves the raised sixth for the
 * FFX-2 material — that reservation is the absence test, and a Dorian Evrae
 * would sound like the wrong game.
 *
 * THE BRIEF it is answering (`chapter-evrae-review.md` O-5, from §12.6 of the
 * research): 140-150 bpm, **machina not menace**, engine-room percussion, a
 * short two-bar figure that survives interruption, minor-modal harmony with
 * **air in the middle**, and phase 2 changing the *subdivision*, not the tempo.
 * Anti-brief: no choir, no orchestral brass fanfare, nothing sacred — Bevelle's
 * holiness is the irony of this scene, not its sound. There is no choir on this
 * sketch, and the only brass is a two-note trombone stab that never arpeggiates.
 *
 * THE THREE THINGS TO LISTEN FOR, because the sketch is built to answer them in
 * one sitting rather than to be a finished cue:
 *
 *  1. **The two-bar figure.** Four bars in, and then again every two bars. It
 *     has a rest in the middle of each bar on purpose: the fight interrupts it
 *     constantly (a manoeuvre, a missile, a Trigger Command), and a figure with
 *     air in it survives being cut off where a legato line does not.
 *  2. **NEAR against FAR.** Bars 13-18 are the same music at range: the kit
 *     thins to a hat and one distant clang, the ostinato halves its rate, the
 *     figure moves up and widens. At FAR you hear *less* of it, not a quieter
 *     copy — which is exactly what §12.2 asks the painting to do.
 *  3. **Phase 2.** Bars 19-26. The tempo does not move by one bpm; the
 *     subdivision doubles. If that reads as "faster" without sounding rushed,
 *     the idea works and the real cue can be built on it.
 *
 * Form (4/4, 144 bpm, 27 bars, 108 beats, 45.0 s):
 *   bars  1- 4  beats  0-16  engine room: clangs, a kick, wind on tremolo strings
 *   bars  5-12  beats 16-48  NEAR: the figure, full kit, eighth-note ostinato
 *   bars 13-18  beats 48-72  FAR: air in the middle, the figure high and wide
 *   bars 19-26  beats 72-104 phase 2: sixteenths, same tempo, figure in octaves
 *   bar     27  beats104-108 cut
 */

import {
  chordRoots,
  concatNotes,
  drumLine,
  shiftNotes,
  tracker,
  transposeNotes,
} from '../../../../src/audio/score.ts';
import { arch, louder } from './sketch-kit.mjs';

const ENGINE = 0;
const NEAR = 16;
const FAR = 48;
const PHASE2 = 72;
const CUT = 104;
const LENGTH = 108;

/**
 * A Aeolian, four chords, no dominant anywhere: i - i - bVI - bVII. The bVI and
 * bVII are structural chords in this score's FFX language, not borrowings, and
 * refusing the dominant is what keeps a fast cue from sounding like library
 * action music.
 */
const CHORDS = ['Am', 'Am', 'F', 'G'];
const cycle = (bars) => Array.from({ length: bars }, (_, i) => CHORDS[i % CHORDS.length]);

/**
 * THE TWO-BAR FIGURE. Eight notes, two rests, and every phrase can be cut at
 * any rest without the ear noticing something was amputated.
 */
const FIGURE = `
  A3:0.5 -:0.5 C4:0.5 D4:0.5 E4:1 -:1 |
  G4:0.5 -:0.5 E4:0.5 D4:0.5 C4:1 -:1 |
`;

function figureAt(start, transpose = 0, velocity = 0.78) {
  return transposeNotes(
    tracker(FIGURE, { start, gate: 0.9, velocity, checkBars: 4 }),
    transpose,
  );
}

/** NEAR: four statements, the middle two a little harder. */
const near = concatNotes(
  arch(figureAt(NEAR), NEAR, NEAR + 16, 0.6, 0.82),
  arch(figureAt(NEAR + 16), NEAR + 16, NEAR + 32, 0.62, 0.86),
);

/**
 * FAR: an octave up, and the answer bar left out entirely — at range you get
 * the question and the sky, and that hole is the mechanic.
 */
const far = concatNotes(
  arch(figureAt(FAR, 12, 0.6).filter((n) => n[0] < FAR + 4), FAR, FAR + 4, 0.5, 0.7),
  arch(figureAt(FAR + 8, 12, 0.6).filter((n) => n[0] < FAR + 12), FAR + 8, FAR + 12, 0.5, 0.7),
  arch(figureAt(FAR + 16, 12, 0.62), FAR + 16, FAR + 24, 0.52, 0.74),
);

/** PHASE 2: the figure in octaves, the answer doubled back on itself. */
const phase2 = concatNotes(
  louder(figureAt(PHASE2), 0.06),
  louder(transposeNotes(figureAt(PHASE2), -12), 0.02),
  louder(figureAt(PHASE2 + 8), 0.08),
  louder(transposeNotes(figureAt(PHASE2 + 8), -12), 0.04),
  louder(figureAt(PHASE2 + 16), 0.08),
  louder(figureAt(PHASE2 + 24), 0.1),
);

// --- the engine room -------------------------------------------------------

/**
 * A driveshaft that is slightly out of true: five clangs where four would fit,
 * so the pattern never quite lines up with the bar. Machina, not menace.
 */
const clangs = concatNotes(
  drumLine('X..x..x...x.....', { start: ENGINE, step: 0.25, pitch: 'D3', velocity: 0.5, times: 4 }),
  drumLine('X..x..x...x.....', { start: NEAR, step: 0.25, pitch: 'D3', velocity: 0.42, times: 8 }),
  drumLine('X...............', { start: FAR, step: 0.25, pitch: 'D3', velocity: 0.3, times: 6 }),
  drumLine('X..x..x.X.x..x..', { start: PHASE2, step: 0.25, pitch: 'D3', velocity: 0.54, times: 8 }),
);

const kick = concatNotes(
  drumLine('X..x', { start: ENGINE, step: 1, pitch: 'A1', velocity: 0.6, times: 4 }),
  drumLine('X.x.x..x', { start: NEAR, step: 0.5, pitch: 'A1', velocity: 0.72, times: 8 }),
  drumLine('X.......', { start: FAR, step: 0.5, pitch: 'A1', velocity: 0.45, times: 6 }),
  drumLine('X.x.X.x.x.x.X.x.', { start: PHASE2, step: 0.25, pitch: 'A1', velocity: 0.76, times: 8 }),
);

const snare = concatNotes(
  drumLine('..X...X.', { start: NEAR, step: 0.5, pitch: 'D2', velocity: 0.6, times: 8 }),
  drumLine('..X.....', { start: PHASE2, step: 0.5, pitch: 'D2', velocity: 0.66, times: 16 }),
);

const hats = concatNotes(
  drumLine('x.x.x.x.', { start: NEAR, step: 0.5, pitch: 'F#2', velocity: 0.34, times: 8 }),
  drumLine('x...x...', { start: FAR, step: 0.5, pitch: 'F#2', velocity: 0.26, times: 6 }),
  drumLine('xgxgxgxgxgxgxgxg', { start: PHASE2, step: 0.25, pitch: 'F#2', velocity: 0.3, times: 8 }),
);

// --- the floor and the air -------------------------------------------------

/** The ostinato: eighths NEAR, halves FAR, sixteenths in phase 2. */
function bassCycle(from, to, step, velocity) {
  const notes = [];
  const roots = chordRoots(cycle(Math.ceil((to - from) / 4)), 1);
  let i = 0;
  for (let at = from; at < to - 1e-9; at += step, i++) {
    const bar = Math.floor((at - from) / 4);
    notes.push([at, step * 0.9, roots[bar] ?? roots[0], i % 2 === 0 ? velocity : velocity - 0.1]);
  }
  return notes;
}

const bass = concatNotes(
  bassCycle(ENGINE, NEAR, 1, 0.5),
  bassCycle(NEAR, FAR, 0.5, 0.72),
  bassCycle(FAR, PHASE2, 2, 0.5),
  bassCycle(PHASE2, CUT, 0.25, 0.74),
  [[CUT, 4, 'A1', 0.7]],
);

/** Wind at altitude. Tremolo strings, wide, and nothing else in the middle. */
const wind = [
  [ENGINE, 16, 'A4', 0.3],
  [ENGINE, 16, 'E5', 0.26],
  [FAR, 24, 'A4', 0.32],
  [FAR, 24, 'E5', 0.3],
  [FAR + 8, 16, 'C5', 0.24],
];

/** Two-note stabs, low, never a fanfare: the ship answering, not announcing. */
const stabs = [
  [NEAR + 14, 0.5, 'A2', 0.7],
  [NEAR + 15, 1, 'E2', 0.66],
  [NEAR + 30, 0.5, 'A2', 0.72],
  [NEAR + 31, 1, 'G2', 0.68],
  [PHASE2 + 14, 0.5, 'A2', 0.8],
  [PHASE2 + 15, 1, 'E2', 0.76],
  [PHASE2 + 30, 0.5, 'C3', 0.82],
  [PHASE2 + 31, 1, 'A2', 0.78],
  [CUT, 3, 'A2', 0.7],
];

const machina = shiftNotes(
  [
    [0, 1.5, 'A5', 0.4],
    [2, 1, 'E5', 0.34],
    [3.5, 2.5, 'G5', 0.36],
  ],
  FAR + 12,
);

export default {
  name: 'sketch-evrae-battle',
  bpm: 144,
  timeSig: [4, 4],
  loop: { start: 0, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  gain: 1,
  fx: {
    reverb: { room: 0.72, damp: 0.4, width: 0.98, preDelay: 0.014 },
    delay: { timeBeats: 0.375, feedback: 0.22, damp: 3200 },
  },
  channels: [
    {
      name: 'figure NEAR',
      instrument: 'strings-short',
      volume: 0.86,
      pan: -0.1,
      notes: near,
      fx: { reverb: 0.2 },
      perform: { timingJitterMs: 10 },
    },
    {
      name: 'figure FAR',
      instrument: 'strings',
      volume: 0.7,
      pan: 0.25,
      notes: far,
      fx: { reverb: 0.42 },
      perform: { timingJitterMs: 15 },
    },
    {
      name: 'figure PHASE 2',
      instrument: 'strings-short',
      volume: 0.9,
      pan: 0,
      notes: phase2,
      fx: { reverb: 0.18 },
      perform: { timingJitterMs: 8 },
    },
    {
      name: 'machina call',
      instrument: 'pwm-lead',
      volume: 0.4,
      pan: 0.3,
      notes: machina,
      fx: { reverb: 0.38, delay: 0.2 },
    },
    {
      name: 'wind',
      instrument: 'strings-trem',
      volume: 0.42,
      pan: 0,
      notes: wind,
      fx: { reverb: 0.5 },
      perform: { timingJitterMs: 18 },
    },
    {
      name: 'low brass',
      instrument: 'trombone',
      volume: 0.62,
      pan: -0.15,
      notes: stabs,
      fx: { reverb: 0.24 },
      perform: { timingJitterMs: 6 },
    },
    {
      name: 'ostinato',
      instrument: 'bass',
      volume: 0.78,
      pan: 0,
      notes: bass,
      fx: { reverb: 0.1 },
      perform: { timingJitterMs: 5 },
    },
    {
      name: 'engine clangs',
      instrument: 'metal-hit',
      volume: 0.4,
      pan: 0.35,
      notes: clangs,
      fx: { reverb: 0.3 },
      perform: { timingJitterMs: 6 },
    },
    { name: 'kick', instrument: 'kick', volume: 0.66, pan: 0, notes: kick, fx: { reverb: 0.1 } },
    { name: 'snare', instrument: 'snare', volume: 0.5, pan: -0.12, notes: snare, fx: { reverb: 0.16 } },
    { name: 'hats', instrument: 'hat', volume: 0.3, pan: 0.18, notes: hats, fx: { reverb: 0.08 } },
  ],
};
