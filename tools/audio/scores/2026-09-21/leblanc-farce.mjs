/**
 * SKETCH for the Leblanc battle cue — "A Fanfare She Wrote Herself".
 * Brassy, swung, comic menace. 45 s, F major, 4/4, 168 bpm.
 *
 * ORIGINAL COMPOSITION. Nothing here is transcribed from any existing work.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX-2 only.** The Leblanc Syndicate at
 * Chateau Leblanc is an FFX-2 encounter and every number in that chapter comes
 * from FFX-2 bestiary records (`docs/plans/chapter-leblanc-review.md` §1). The
 * musical language says so too, and that is the absence test you can hear: this
 * is major-key pop-jazz with real ii-V motion, `maj7`/`m7`/`m9`/`7sus4`
 * colours, a borrowed **bVII major**, electric bass and kit — all of which
 * THEMES.md ("Harmonic language, by world") reserves for FFX-2. Put this cue
 * into an FFX chapter and it would be audibly the wrong game, which is the
 * strongest form the rule-14 absence test takes in a score.
 *
 * THE BRIEF it is answering (`chapter-leblanc-review.md` §6, from §10.3 of the
 * research): *"the music is on the trio's side and the trio is ridiculous."*
 * Brassy, fast, upbeat, **nothing minor-key** — a boss theme that refuses to be
 * threatening. O4's framing: "a fanfare for someone who has awarded herself a
 * fanfare."
 *
 * HOW THE COMEDY IS BUILT, since a joke you have to explain is not one:
 *  - **The head announces itself and then has nowhere to go.** It opens on a
 *    trumpet fanfare shape and lands, twice, on the *second* beat — arriving
 *    late at its own party.
 *  - **The trombone answers every phrase with a slide down a tone.** It is the
 *    only descending gesture in the cue and it happens four times. That is the
 *    menace: something in the room is not impressed.
 *  - **One bar of Eb**, the borrowed bVII, dropped into the shout chorus and
 *    walked straight back out, so the brightest bar costs nothing.
 *  - **Swing.** Every eighth is pushed to the triplet point. Straight eighths
 *    at this tempo would read as urgent; swung, they read as strutting.
 *
 * Form (4/4, 168 bpm, 32 bars, 128 beats, 45.7 s):
 *   bars  1- 4  beats   0-16  vamp: walking bass, hats, vibraphone
 *   bars  5-12  beats  16-48  the head, trumpets
 *   bars 13-20  beats  48-80  the answer: trombone slides, bassoon underneath
 *   bars 21-28  beats  80-112 shout chorus, the bVII bar, everybody
 *   bars 29-32  beats 112-128 turn, and one last unimpressed trombone
 *
 * Resemblance guard (THEMES.md §5): the hook stays syncopated and
 * pentatonic-leaning but is never built on a repeated-note riff, there is no
 * scat or vocalised syllable anywhere, and there is no brass shout-and-answer
 * *between the phrases of the hook* — the trombone answers the phrase, it does
 * not interleave with it.
 */

import {
  arpLine,
  chordRoots,
  concatNotes,
  drumLine,
  tracker,
} from '../../../../src/audio/score.ts';
import { arch, louder, swing } from './sketch-kit.mjs';

const VAMP = 0;
const HEAD = 16;
const ANSWER = 48;
const SHOUT = 80;
const TURN = 112;
const LENGTH = 128;

/**
 * Functional ii-V motion, which only FFX-2 is allowed, plus the borrowed bVII
 * (Eb) at the top of the shout chorus. No chord in this cue is minor for longer
 * than two beats.
 */
const CHORDS = [
  // vamp
  'F6', 'Dm7', 'Gm7', 'C7sus4',
  // head
  'F6', 'Dm7', 'Gm9', 'C7sus4', 'F6', 'Am7', 'Bb', 'C7sus4',
  // answer
  'Dm7', 'Gm7', 'C7sus4', 'Fmaj7', 'Bbmaj7', 'Am7', 'Gm9', 'C7sus4',
  // shout
  'F6', 'Bb', 'Eb', 'C7sus4', 'F6', 'Dm7', 'Gm9', 'C7sus4',
  // turn
  'Bbmaj7', 'C7sus4', 'F6', 'F6',
];

/** Walking upright bass, one note a beat, straight — the only straight part. */
const walk = chordRoots(CHORDS, 2).flatMap((root, bar) => {
  const at = bar * 4;
  const steps = [0, 4, 7, 5];
  return steps.map((s, i) => [at + i, 0.9, root + s, i % 2 === 0 ? 0.68 : 0.56]);
});

/** Hats on the swung off-beat; a ride from the shout chorus on. */
const hats = swing(
  concatNotes(
    drumLine('x.x.x.x.', { start: VAMP, step: 0.5, pitch: 'F#2', velocity: 0.3, times: 20 }),
    drumLine('xgxgxgxg', { start: SHOUT, step: 0.5, pitch: 'D#3', velocity: 0.34, times: 12 }),
  ),
);

const kick = concatNotes(
  drumLine('X..x', { start: VAMP, step: 1, pitch: 'C2', velocity: 0.62, times: 12 }),
  drumLine('X.xx', { start: ANSWER, step: 1, pitch: 'C2', velocity: 0.68, times: 20 }),
);

const snare = swing(
  concatNotes(
    drumLine('..X.', { start: VAMP, step: 1, pitch: 'D2', velocity: 0.56, times: 12 }),
    drumLine('..X.', { start: ANSWER, step: 1, pitch: 'D2', velocity: 0.62, times: 16 }),
    drumLine('..X.g.X.', { start: SHOUT, step: 0.5, pitch: 'D2', velocity: 0.64, times: 8 }),
  ),
);

/** Vibraphone comping: two chord tones on the off-beats, jazz-register sparkle. */
const comp = swing(
  arpLine(CHORDS, {
    pattern: [4, 2, 3, 1],
    step: 0.5,
    dur: 0.45,
    octave: 4,
    center: 72,
    velocity: 0.42,
  }).filter((n) => n[0] % 1 !== 0),
);

// --- the head --------------------------------------------------------------

/**
 * THE HEAD. Opens on a fanfare shape and then arrives on the *second* beat
 * twice — late at its own party. F major pentatonic-leaning, never a repeated
 * note on consecutive subdivisions.
 */
const HEAD_LINE = `
  F4:0.5 A4:0.5 C5:1 -:0.5 D5:0.5 C5:1 |
  -:0.5 A4:0.5 G4:1 F4:1 -:1 |
  F4:0.5 C5:0.5 D5:1 -:0.5 F5:0.5 D5:1 |
  -:0.5 C5:0.5 A4:2 -:1 |
`;

const head = swing(
  arch(tracker(HEAD_LINE, { start: HEAD, gate: 0.92, velocity: 0.8, checkBars: 4 }), HEAD, HEAD + 16, 0.66, 0.9),
);
const headAgain = swing(
  arch(tracker(HEAD_LINE, { start: HEAD + 16, gate: 0.92, velocity: 0.8, checkBars: 4 }), HEAD + 16, HEAD + 32, 0.68, 0.94),
);

/**
 * THE ANSWER. A trombone slide down a whole tone, four times, and nothing else.
 * It is the only descending gesture in the cue.
 */
const shrug = [
  [ANSWER + 6, 1, 'D3', 0.72], [ANSWER + 7, 1.5, 'C3', 0.6],
  [ANSWER + 14, 1, 'C3', 0.74], [ANSWER + 15, 1.5, 'Bb2', 0.62],
  [ANSWER + 22, 1, 'D3', 0.76], [ANSWER + 23, 1.5, 'C3', 0.64],
  [ANSWER + 30, 1, 'G3', 0.78], [ANSWER + 31, 2, 'F3', 0.66],
  [LENGTH - 4, 1, 'D3', 0.7], [LENGTH - 3, 3, 'C3', 0.56],
];

/** Bassoon under the answer: comic by register, dry, a fourth below the slide. */
const bassoon = tracker(
  `F2:1 -:1 A2:1 -:1 | Bb2:1 -:1 G2:1 -:1 | F2:1 -:1 D2:1 -:1 | C2:2 -:2 |`,
  { start: ANSWER + 16, gate: 0.85, velocity: 0.52, checkBars: 4 },
);

/** The shout chorus: the head in the trumpets, doubled a sixth below. */
const shout = concatNotes(
  swing(louder(tracker(HEAD_LINE, { start: SHOUT, gate: 0.94, velocity: 0.86, checkBars: 4 }), 0.06)),
  swing(
    tracker(HEAD_LINE, { start: SHOUT + 16, gate: 0.94, velocity: 0.84, checkBars: 4, transpose: -9 }),
  ),
);

/** Organ pads the shout chorus only — the room getting louder, not brighter. */
const organ = arpLine(CHORDS.slice(20, 28), {
  pattern: [0, 2, 4],
  step: 4 / 3,
  dur: 1.2,
  octave: 3,
  center: 60,
  velocity: 0.4,
  start: SHOUT,
});

/** One crash at the top of the shout and one on the final hit. */
const crash = [
  [SHOUT, 2, 'C#3', 0.6],
  [TURN + 8, 3, 'C#3', 0.66],
];

/** The last chord: an Fadd9 hit that nobody asked for. */
const finalHit = [
  [TURN + 8, 3, 'F3', 0.86],
  [TURN + 8, 3, 'A3', 0.82],
  [TURN + 8, 3, 'C4', 0.84],
  [TURN + 8, 3, 'G4', 0.78],
];

export default {
  name: 'sketch-leblanc-farce',
  bpm: 168,
  timeSig: [4, 4],
  loop: { start: 0, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  gain: 1,
  fx: {
    reverb: { room: 0.66, damp: 0.46, width: 0.9, preDelay: 0.012 },
    delay: { timeBeats: 0.75, feedback: 0.16, damp: 3000 },
  },
  channels: [
    {
      name: 'trumpets (the head)',
      instrument: 'trumpet',
      volume: 0.92,
      pan: 0.1,
      notes: concatNotes(head, headAgain, shout),
      fx: { reverb: 0.22 },
      perform: { timingJitterMs: 8 },
    },
    {
      name: 'trombone (unimpressed)',
      instrument: 'trombone',
      volume: 0.7,
      pan: -0.2,
      notes: concatNotes(shrug, finalHit.slice(0, 1)),
      fx: { reverb: 0.22 },
      perform: { timingJitterMs: 9 },
    },
    {
      name: 'bassoon',
      instrument: 'bassoon',
      volume: 0.52,
      pan: -0.1,
      notes: bassoon,
      fx: { reverb: 0.24 },
      perform: { timingJitterMs: 10 },
    },
    {
      name: 'vibraphone',
      instrument: 'vibraphone',
      volume: 0.5,
      pan: 0.25,
      notes: comp,
      fx: { reverb: 0.28 },
      perform: { timingJitterMs: 7 },
    },
    {
      name: 'organ (shout)',
      instrument: 'organ-rock',
      volume: 0.44,
      pan: -0.25,
      notes: organ,
      fx: { reverb: 0.2 },
    },
    {
      name: 'upright bass',
      instrument: 'bass-upright',
      volume: 0.8,
      pan: -0.05,
      notes: walk,
      fx: { reverb: 0.1 },
      perform: { timingJitterMs: 6 },
    },
    { name: 'kick', instrument: 'kick', volume: 0.6, pan: 0, notes: kick, fx: { reverb: 0.08 } },
    { name: 'snare', instrument: 'snare', volume: 0.5, pan: -0.14, notes: snare, fx: { reverb: 0.14 } },
    { name: 'hats', instrument: 'hat', volume: 0.32, pan: 0.2, notes: hats, fx: { reverb: 0.08 } },
    { name: 'crash', instrument: 'crash', volume: 0.42, pan: 0.1, notes: crash, fx: { reverb: 0.3 } },
    {
      name: 'the hit',
      instrument: 'brass-stab',
      volume: 0.78,
      pan: 0.05,
      notes: finalHit,
      fx: { reverb: 0.26 },
    },
  ],
};
