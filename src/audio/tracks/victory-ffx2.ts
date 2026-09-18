/**
 * "Sphere Shine" — the FFX-2 results screen.
 *
 * ORIGINAL COMPOSITION. Eb major, 128 bpm: a four-bar brass fanfare, then a
 * relaxed pop-jazz groove that loops while the spoils are counted.
 *
 * THEMES (docs/audio/THEMES.md §5, cue map row 20). The fanfare is
 * `SONGSTRESS_HOOK` — the identity leap, 3 up to 6 and home to the 5, which in
 * Eb is G - C - Bb — stated twice, major and intact, and closed with the
 * score's shared plagal AMEN in the major: the 4 falling to the 3 over the IV.
 * The same cadence ends the FFX victory fanfare and both hymn statements, so
 * winning in either game belongs to the same story as the prayer.
 *
 * The groove's tune opens on `SONGSTRESS_RISE` — the hook's own four rising
 * degrees, which are `FAREWELL`'s four degrees with a major third. Nobody is
 * meant to notice; everybody is meant to feel that the two games are one score.
 *
 * Form (4/4, 128 bpm, 36 bars, 68 s):
 *   bars  1- 4  fanfare  beats   0- 16  brass, one shot, never heard again
 *   bars  5-12  groove   beats  16- 48  keys and bass, the tune on marimba  <- loop
 *   bars 13-20  groove   beats  48- 80  flute takes the tune
 *   bars 21-28  groove   beats  80-112  fullest: brass answers, kit opens up
 *   bars 29-36  groove   beats 112-144  thins back out, the rise as a tag
 * Loop 16 -> 144.
 */

import { chordLine, concatNotes, tracker, type Note, type Track } from '../score.ts';
import { cell } from './motifs.ts';
import { AMEN, SONGSTRESS_HOOK, SONGSTRESS_RISE, lean } from './themes.ts';
import {
  bassLine,
  compLine,
  doubled,
  groove,
  humanise,
  legato,
  phrase,
} from './ffx2-common.ts';

const BAR = 4;
const FANFARE = 0;
const LOOP = 16;
const LENGTH = 144;
const PASSES = [16, 48, 80, 112];

const FANFARE_CHORDS = ['Eb', 'Ab', 'Cm7', 'Ab'];
/**
 * The results harmony: maj7 and m7 colours, one hanging 7sus4 where a dominant
 * would be, and a plagal Ab-Eb to finish. A results screen should feel like
 * rest, not like arrival.
 */
const GROOVE_CHORDS = ['Ebmaj7', 'Cm7', 'Fm7', 'Bb7sus4', 'Ebmaj7', 'Cm7', 'Ab6', 'Eb6'];

// --- the fanfare -----------------------------------------------------------

/** Bars 2 and 4: the answer, then the amen — 4 falling to 3 over the IV. */
const FANFARE_ANSWER = `
  C5:1 Bb4:1 Ab4:2 |
`;

const fanfareMelody = concatNotes(
  cell(SONGSTRESS_HOOK, FANFARE, 'Eb4', 0.82),
  tracker(FANFARE_ANSWER, { start: FANFARE + 4, checkBars: BAR, velocity: 0.76 }),
  cell(SONGSTRESS_HOOK, FANFARE + 8, 'Eb4', 0.9),
  // AMEN in the major: the 2 (F) held over the IV and falling to the tonic,
  // leaning louder than the note it resolves to. The same two notes close the
  // hymn, the farewell and the FFX victory fanfare.
  lean(cell(AMEN, FANFARE + 12, 'Eb4', 0.86), [[FANFARE + 12, FANFARE + 14]]),
);

const fanfareNotes = humanise(legato(fanfareMelody, 0.05), 0.03, 71);

/** Trumpets an octave up for the second statement only — the lift. */
const fanfareHigh = doubled(
  fanfareMelody.filter((n) => n[0] >= FANFARE + 8),
  12,
  0.72,
);

const fanfareChords = humanise(
  concatNotes(
    chordLine(FANFARE_CHORDS.slice(0, 3), { start: FANFARE, octave: 3, center: 58, velocity: 0.62, dur: 3.6, roll: 0.03 }),
    // The last IV is cut at the half bar: the plagal cadence needs the Ab to
    // STOP when the Eb arrives, or the two chords hold a semitone against each
    // other and the amen turns into a smear.
    chordLine(['Ab'], { start: FANFARE + 12, octave: 3, center: 58, velocity: 0.62, dur: 1.85, roll: 0.03 }),
    chordLine(['Eb6'], { start: FANFARE + 14, octave: 3, center: 58, velocity: 0.66, dur: 2.4, roll: 0.03 }),
  ),
  0.03,
  72,
);

// --- the groove ------------------------------------------------------------

/**
 * Eight bars, opening on `SONGSTRESS_RISE`, with a written breath at the end
 * of bar 4 and a two-note sigh to close. Range Bb3-C5: a tune to hum while a
 * results screen counts, not a tune that demands anything.
 */
const GROOVE_TUNE = `
  -:4                          |
  F4:0.5 G4:0.5 Bb4:1 G4:1.5 -:0.5 |
  C5:1 Bb4:1 G4:2              |
  F4:1.5 Eb4:0.5 -:2           |
  -:4                          |
  F4:0.5 G4:0.5 Bb4:1 C5:1.5 -:0.5 |
  C5:1 Bb4:1 Ab4:2             |
  G4:2 Eb4:2                   |
`;

/** One pass of the tune: the imported rise, then its answer. */
function tune(start: number, velocity: number): Note[] {
  const rise = concatNotes(
    cell(SONGSTRESS_RISE, start, 'Eb4', velocity),
    cell(SONGSTRESS_RISE, start + 16, 'Eb4', velocity),
  );
  const rest = tracker(GROOVE_TUNE, { start, checkBars: BAR, velocity });
  const leaned = lean(concatNotes(rise, rest), [
    [start + 24, start + 26],
    [start + 28, start + 30],
  ]);
  return humanise(phrase(legato(leaned, 0.05), start, 32, 0.14), 0.03, 73);
}

const malletNotes = concatNotes(tune(PASSES[0]!, 0.6), tune(PASSES[2]!, 0.56));
const fluteNotes = concatNotes(tune(PASSES[1]!, 0.66), tune(PASSES[2]!, 0.7), tune(PASSES[3]!, 0.6));

const epianoNotes = humanise(
  concatNotes(
    ...PASSES.map((start, pass) =>
      compLine(
        GROOVE_CHORDS,
        [
          { at: 0.5, dur: 0.5, vel: 0.58, roll: 0.015 },
          { at: 1.75, dur: 0.8, vel: 0.64 },
          { at: 3, dur: 0.4, vel: 0.5 },
        ],
        {
          start,
          center: 65,
          velocity: pass === 3 ? 0.9 : pass === 2 ? 1.06 : 1,
          perBar: (bar) => (bar % 4 === 0 ? 1.05 : bar === 7 ? 0.88 : 0.97),
          seed: 74 + pass,
        },
      ),
    ),
  ),
  0.03,
  75,
);

const BASS_STEPS = [
  { at: 0, dur: 0.9, step: 0, vel: 0.82 },
  { at: 1.5, dur: 0.4, step: 7, vel: 0.56 },
  { at: 2, dur: 0.6, step: 12, vel: 0.66 },
  { at: 3.25, dur: 0.6, step: 7, vel: 0.6 },
];

const bassNotes = concatNotes(
  ...PASSES.map((start, pass) =>
    bassLine(GROOVE_CHORDS, BASS_STEPS, {
      start,
      octave: 1,
      velocity: pass === 0 ? 0.92 : pass === 3 ? 0.88 : 1,
      seed: 80 + pass,
    }),
  ),
);

/** Brass: punches answering the tune, and only in the fullest pass. */
const brassNotes = humanise(
  concatNotes(
    chordLine([GROOVE_CHORDS[1]!], { start: PASSES[2]! + 7.5, octave: 3, center: 62, velocity: 0.62, dur: 0.6 }),
    chordLine([GROOVE_CHORDS[3]!], { start: PASSES[2]! + 15.5, octave: 3, center: 62, velocity: 0.64, dur: 0.6 }),
    chordLine([GROOVE_CHORDS[5]!], { start: PASSES[2]! + 23.5, octave: 3, center: 62, velocity: 0.66, dur: 0.6 }),
    chordLine([GROOVE_CHORDS[7]!], { start: PASSES[2]! + 30, octave: 3, center: 62, velocity: 0.6, dur: 1.6 }),
  ),
  0.03,
  76,
);

const KICK = 'X.......x.......';
const KICK_FULL = 'X.....x.x.......';
const SNARE = '....X.......X...';
const SNARE_FULL = '....X..g....X.gg';
const HAT = 'x.g.x.g.x.g.x.g.';
const HAT_FULL = 'X.gxx.gxX.gxx.gx';

const kickNotes = concatNotes(
  ...PASSES.map((start, pass) =>
    groove(pass >= 2 ? KICK_FULL : KICK, {
      start,
      bars: 8,
      pitch: 'C2',
      velocity: pass === 0 ? 0.52 : pass === 3 ? 0.56 : 0.62,
      seed: 84 + pass,
    }),
  ),
);

const snareNotes = concatNotes(
  ...PASSES.map((start, pass) =>
    groove(pass >= 2 ? SNARE_FULL : SNARE, {
      start,
      bars: 8,
      pitch: 'D2',
      velocity: pass === 0 ? 0.44 : pass === 3 ? 0.46 : 0.56,
      ghost: 0.2,
      seed: 88 + pass,
    }),
  ),
);

const hatNotes = concatNotes(
  ...PASSES.map((start, pass) =>
    groove(pass >= 2 ? HAT_FULL : HAT, {
      start,
      bars: 8,
      pitch: 'F#2',
      velocity: pass === 3 ? 0.26 : 0.32,
      ghost: 0.14,
      seed: 92 + pass,
    }),
  ),
);

/** Celesta: four points of light, one per pass, and one on the fanfare's landing. */
const celestaNotes: Note[] = [
  [FANFARE + 12, 3, 'Eb6', 0.44],
  [PASSES[1]!, 2, 'Bb5', 0.34],
  [PASSES[2]!, 2, 'Eb6', 0.36],
  [PASSES[3]! + 28, 4, 'G5', 0.3],
];

const crashNotes: Note[] = [
  [FANFARE, 2, 'C4', 0.6],
  [FANFARE + 12, 2, 'C4', 0.56],
  [PASSES[2]!, 1.6, 'C4', 0.4],
];

export const victoryFfx2Track: Track = {
  name: 'victory-ffx2',
  bpm: 128,
  timeSig: [4, 4],
  loop: { start: LOOP, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.58, damp: 0.38, width: 0.9, preDelay: 0.016 },
    delay: { timeBeats: 0.5, feedback: 0.18, damp: 3200 },
  },
  channels: [
    { name: 'fanfare brass', instrument: 'brass', volume: 0.78, pan: -0.06, notes: fanfareNotes, fx: { reverb: 0.3 } },
    { name: 'fanfare trumpets', instrument: 'brass-stab', volume: 0.5, pan: 0.14, notes: fanfareHigh, fx: { reverb: 0.26 } },
    { name: 'fanfare chords', instrument: 'brass', volume: 0.52, pan: 0.08, notes: fanfareChords, fx: { reverb: 0.32 } },
    { name: 'flute', instrument: 'flute', volume: 0.62, pan: 0.1, notes: fluteNotes, fx: { reverb: 0.3 } },
    { name: 'marimba', instrument: 'mallet', volume: 0.5, pan: -0.22, notes: malletNotes, fx: { reverb: 0.22 } },
    { name: 'epiano', instrument: 'epiano', volume: 0.66, pan: -0.12, notes: epianoNotes, fx: { reverb: 0.18 } },
    { name: 'brass answers', instrument: 'brass-stab', volume: 0.5, pan: 0.2, notes: brassNotes, fx: { reverb: 0.22 } },
    { name: 'bass', instrument: 'bass', volume: 0.8, pan: 0, notes: bassNotes, fx: { reverb: 0.05 } },
    { name: 'kick', instrument: 'kick', volume: 0.6, pan: 0, notes: kickNotes, fx: { reverb: 0.1 } },
    { name: 'snare', instrument: 'snare', volume: 0.46, pan: -0.06, notes: snareNotes, fx: { reverb: 0.16 } },
    { name: 'hats', instrument: 'hat', volume: 0.3, pan: 0.24, notes: hatNotes, fx: { reverb: 0.08 } },
    { name: 'celesta', instrument: 'celesta', volume: 0.42, pan: -0.28, notes: celestaNotes, fx: { reverb: 0.42, delay: 0.18 } },
    { name: 'crash', instrument: 'crash', volume: 0.36, pan: 0.1, notes: crashNotes, fx: { reverb: 0.3 } },
  ],
};

export default victoryFfx2Track;
