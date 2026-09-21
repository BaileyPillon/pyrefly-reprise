/**
 * SKETCH — "Disquiet", the Vegnagun reveal sting. 15 s, no tonic, 4/4, 60 bpm.
 *
 * ORIGINAL COMPOSITION. Nothing here is transcribed from any existing work.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX-2 only.** `scene-disquiet` is beat 14 of
 * the Chateau Leblanc chapter (`docs/plans/chapter-leblanc-review.md` §6), an
 * FFX-2 encounter throughout. The absence test here is the plainer kind: the
 * cue names a machine that exists only in FFX-2, and no FFX chapter's `music`
 * block could reference it — nothing references it at all, because it is not
 * registered.
 *
 * WHAT IT IS. The research (§10.3) asks for "low, unresolved, no melody to hold
 * on to — the sound of a room that has just become a different kind of room."
 * The 2026-09-19 fact-check recovered this beat, and the preflight says
 * skipping it costs the chapter its most important moment.
 *
 * SO THE STING IS BUILT AS A SUBTRACTION, and it only works heard straight
 * after `leblanc-farce`:
 *
 *  - **It opens by cutting the farce off mid-gesture.** One trumpet note, 0.4
 *    of a beat, on the farce's own F — and then it is simply not there. No
 *    cadence, no ritardando, no cymbal to cover the join.
 *  - **A full beat of nothing.** The rest is the loudest thing in the cue.
 *  - **Then the floor arrives** and never resolves: a sub, a tam-tam, tremolo
 *    strings and one low machine tone, stacked in **fourths** rather than
 *    thirds, so nothing in it has a quality — not major, not minor, no tonic.
 *    THEMES.md gives quartal spacing to the places the score should feel
 *    hollow, and this is one.
 *  - **There is no melody.** Nothing here can be hummed, on purpose. The one
 *    moving line is the machine tone sliding a semitone, once, near the end,
 *    which is the only event in fifteen seconds.
 *
 * Form (4/4, 60 bpm, 15 beats, 15.0 s + tail):
 *   beat  0      the farce, cut
 *   beats 1- 2   nothing
 *   beats 2-15   the floor: quartal stack, tam-tam, sub, one semitone move
 */

import { concatNotes } from '../../../../src/audio/score.ts';

const LENGTH = 15;

/** The farce, cut. One note, and the room changes. */
const cut = [[0, 0.4, 'F4', 0.8]];

/** The sub arrives under the silence and stays for the whole sting. */
const sub = [
  [2, 9, 'D0', 0.56],
  [11, 4, 'C#0', 0.52],
];

/**
 * The quartal stack: D - G - C - F. Fourths, so the chord has no third and
 * therefore no quality — it is a floor, not a harmony.
 */
const stack = [
  [2.5, 8, 'D2', 0.4],
  [2.8, 7.7, 'G2', 0.36],
  [3.2, 7.3, 'C3', 0.34],
  [3.6, 6.9, 'F3', 0.3],
  [11, 4, 'C#2', 0.4],
  [11.3, 3.7, 'F#2', 0.36],
  [11.6, 3.4, 'B2', 0.34],
];

/** One tam-tam stroke, and the hall answers for four seconds. */
const tam = [[2, 4, 'C2', 0.62]];

/**
 * The machine, felt rather than heard, and the only thing that moves: it slides
 * down a semitone at beat 11 and stops. That slide is the event.
 */
const machine = concatNotes(
  [[3, 8, 'D1', 0.44]],
  [[11, 4, 'C#1', 0.46]],
);

export default {
  name: 'sketch-leblanc-disquiet',
  bpm: 60,
  timeSig: [4, 4],
  loop: { start: 0, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  gain: 1,
  fx: {
    reverb: { room: 0.95, damp: 0.2, width: 0.98, preDelay: 0.035 },
  },
  channels: [
    {
      name: 'the farce, cut',
      instrument: 'trumpet',
      volume: 0.8,
      pan: 0.1,
      notes: cut,
      fx: { reverb: 0.2 },
    },
    { name: 'sub', instrument: 'bass-sub', volume: 0.76, pan: 0, notes: sub, fx: { reverb: 0.12 } },
    {
      name: 'quartal stack',
      instrument: 'strings-trem',
      volume: 0.62,
      pan: 0,
      notes: stack,
      fx: { reverb: 0.55 },
      perform: { timingJitterMs: 18 },
    },
    { name: 'tam-tam', instrument: 'tam-tam', volume: 0.5, pan: 0.15, notes: tam, fx: { reverb: 0.5 } },
    {
      name: 'the machine',
      instrument: 'pwm-lead',
      volume: 0.34,
      pan: -0.2,
      notes: machine,
      fx: { reverb: 0.4 },
    },
  ],
};
