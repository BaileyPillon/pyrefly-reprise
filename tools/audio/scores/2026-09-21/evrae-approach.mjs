/**
 * SKETCH — the Evrae APPROACH sting. 20 s, A Aeolian, 4/4, 88 bpm.
 *
 * ORIGINAL COMPOSITION. Nothing here is transcribed from any existing work.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only** — the same chapter and the same
 * reasoning as `evrae-battle.mjs`, including the deliberate Aeolian (the raised
 * sixth stays reserved for FFX-2).
 *
 * WHAT IT IS FOR. `chapter-evrae-review.md` Q1 recommends the research's
 * `[estimate]` reading of the canon: an approach cue, then the battle cue, then
 * a coda. This is the approach — the ~20 seconds between "something is out
 * there" and the first turn, over the *Fahrenheit*'s foredeck. It is the ship
 * that is the subject, not the wyrm (§12.6: "the wyrm is not the subject — the
 * airship is"), so what the sting establishes is altitude, engines and open
 * sky, and the creature is one shape crossing it.
 *
 * It ends **unresolved on the bVII**, deliberately: the battle cue lands on the
 * tonic four bars later, and the join is the whole point of auditioning these
 * two back to back.
 *
 * Form (4/4, 88 bpm, 7 bars, 28 beats, 19.1 s + tail):
 *   bar  1     the floor: sub and a distant clang
 *   bars 2-4   tremolo strings open above it; one machina call, twice
 *   bars 5-6   the shape crosses: a timpani roll and one low stab
 *   bar  7     the bVII, held, not resolved
 */

import { concatNotes, drumLine } from '../../../../src/audio/score.ts';
import { arch } from './sketch-kit.mjs';

const LENGTH = 28;

/** The floor. One note for the whole sting: the ship is not going anywhere. */
const sub = [
  [0, 20, 'A0', 0.5],
  [20, 8, 'G0', 0.46],
];

/** Wind and altitude — the middle deliberately left empty. */
const air = arch(
  [
    [2, 10, 'A4', 0.34],
    [2, 10, 'E5', 0.3],
    [8, 8, 'C5', 0.3],
    [12, 8, 'A5', 0.26],
    [20, 8, 'G4', 0.34],
    [20, 8, 'D5', 0.3],
  ],
  0,
  LENGTH,
  0.44,
  0.78,
);

/** The engines, far below, irregular. */
const clangs = concatNotes(
  drumLine('X.......x.......', { start: 0, step: 0.5, pitch: 'D3', velocity: 0.34, times: 1 }),
  drumLine('X.....x.........', { start: 8, step: 0.5, pitch: 'D3', velocity: 0.36, times: 1 }),
  drumLine('X..x..x.........', { start: 16, step: 0.5, pitch: 'D3', velocity: 0.44, times: 1 }),
);

/** The machina call: two notes, a fifth apart, answered fainter and later. */
const call = [
  [4, 1.5, 'A4', 0.42],
  [5.5, 2.5, 'E5', 0.38],
  [13, 1.5, 'A4', 0.34],
  [14.5, 3, 'E5', 0.3],
];

/** The shape crosses. One roll, one stab, and nothing follows it. */
const roll = [
  [16, 4, 'A1', 0.4],
  [20, 1, 'A1', 0.72],
];

const stab = [
  [20, 1.5, 'A2', 0.7],
  [20, 1.5, 'E2', 0.66],
  [24, 4, 'G2', 0.58],
  [24, 4, 'D3', 0.54],
];

export default {
  name: 'sketch-evrae-approach',
  bpm: 88,
  timeSig: [4, 4],
  loop: { start: 0, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  gain: 1,
  fx: {
    reverb: { room: 0.88, damp: 0.34, width: 0.98, preDelay: 0.024 },
  },
  channels: [
    { name: 'sub', instrument: 'bass-sub', volume: 0.72, pan: 0, notes: sub, fx: { reverb: 0.14 } },
    {
      name: 'air',
      instrument: 'strings-trem',
      volume: 0.6,
      pan: 0,
      notes: air,
      fx: { reverb: 0.55 },
      perform: { timingJitterMs: 18 },
    },
    {
      name: 'engines',
      instrument: 'metal-hit',
      volume: 0.36,
      pan: 0.35,
      notes: clangs,
      fx: { reverb: 0.4 },
      perform: { timingJitterMs: 8 },
    },
    {
      name: 'machina call',
      instrument: 'pwm-lead',
      volume: 0.44,
      pan: -0.25,
      notes: call,
      fx: { reverb: 0.42 },
    },
    { name: 'timpani', instrument: 'timpani', volume: 0.55, pan: 0.05, notes: roll, fx: { reverb: 0.3 } },
    {
      name: 'low brass',
      instrument: 'trombone',
      volume: 0.6,
      pan: -0.1,
      notes: stab,
      fx: { reverb: 0.3 },
      perform: { timingJitterMs: 9 },
    },
  ],
};
