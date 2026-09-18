/**
 * "Static Coronation" — the corrupted aeon in the Bevelle Underground.
 *
 * ORIGINAL COMPOSITION. Pop-jazz fusion, Bb minor, 160 bpm: electric piano
 * comping, fingered electric bass, a tight kit, brass punches, and — because
 * the girls are fighting something that used to be a friend — a string line
 * that refuses to join in.
 *
 * THEMES (docs/audio/THEMES.md §5, cue map row 17). The A theme is built on
 * `SONGSTRESS_DARK`, the Songstress hook's identity leap with both ends
 * flattened: b3 up to b6, home to the 5 — Db - Gb - F in Bb minor. It is
 * stamped literally at bar 3 of the theme and again as the supersaw stab that
 * answers every phrase. The CHORUS is `SONGSTRESS_LEAD` bars 1-4 at written
 * pitch (Db major, the relative major — the pop star enjoying herself) with an
 * original four-bar answer that pulls the key back down into Bb minor. The
 * BRIDGE is `SONGSTRESS_BRIDGE` over `SONGSTRESS_BRIDGE_CHORDS`: FFX-2 keeps
 * its ii-V motion even when it is fighting a god.
 *
 * The complete hook, with its bridge and its one bar of borrowed joy, is
 * rationed to `ending-ffx2`. This cue only ever gets its first four bars.
 *
 * Form (4/4, 160 bpm, 76 bars, 114 s):
 *   bars  1- 8  intro    beats   0- 32  epiano and hats, bass from bar 5
 *   bars  9-24  A        beats  32- 96  the theme, twice                <- loop start
 *   bars 25-40  chorus   beats  96-160  the hook in Db, brass doubling
 *   bars 41-56  bridge   beats 160-224  ii-V, strings carry the regret
 *   bars 57-72  A2       beats 224-288  the theme in octaves, hardest
 *   bars 73-76  turn     beats 288-304  back round
 * Loop 32 -> 304.
 */

import {
  chordLine,
  concatNotes,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { cell } from './motifs.ts';
import {
  lean,
  SONGSTRESS_BRIDGE,
  SONGSTRESS_BRIDGE_CHORDS,
  SONGSTRESS_DARK,
  SONGSTRESS_LEAD,
} from './themes.ts';
import {
  atVolume,
  bassLine,
  compLine,
  doubled,
  gated,
  groove,
  humanise,
  legato,
  nudge,
  padLine,
  phrase,
  ramp,
  tomFill,
} from './ffx2-common.ts';

const BAR = 4;
const INTRO = 0;
const A = 32;
const CHORUS = 96;
const BRIDGE = 160;
const A2 = 224;
const TURN = 288;
const LENGTH = 304;

// --- harmony ---------------------------------------------------------------

/**
 * Root motion by step and third, m7 and maj7 colours throughout: the FFX-2
 * language. The one dominant is the hanging `F7sus4` at the end of each
 * phrase — a 7sus4 rather than a plain V7, so the leading tone is withheld
 * and the phrase turns over instead of slamming shut.
 */
const A_PHRASE = ['Bbm7', 'Ab', 'Gbmaj7', 'Dbmaj7', 'Bbm7', 'Gbmaj7', 'Ebm7', 'F7sus4'];
const A_CHORDS = [...A_PHRASE, ...A_PHRASE];
const INTRO_CHORDS = ['Bbm7', 'Bbm7', 'Gbmaj7', 'Ab', 'Bbm7', 'Bbm7', 'Ebm7', 'F7sus4'];
/** Four bars of the hook's own harmony, then four that walk it home to the minor. */
const CHORUS_PHRASE = ['Dbmaj7', 'Bbm7', 'Gbmaj7', 'Ab7sus4', 'Bbm7', 'Gbmaj7', 'Ebm7', 'F7sus4'];
const CHORUS_CHORDS = [...CHORUS_PHRASE, ...CHORUS_PHRASE];
const BRIDGE_CHORDS = [...SONGSTRESS_BRIDGE_CHORDS, ...SONGSTRESS_BRIDGE_CHORDS];
const TURN_CHORDS = ['Gbmaj7', 'Ab', 'Bbm7', 'F7sus4'];

// --- the A theme -----------------------------------------------------------

/**
 * Eight bars, range F4-Gb5, and the shape a listener should be able to hum:
 * a rising cell (F - Bb - Db) answered by a fall, then the identity leap up to
 * the b6 at bar 3, restated a step higher at bar 6, and the 2-1 sigh at bar 8.
 * Bar 3 is left empty here and filled by `SONGSTRESS_DARK` itself.
 */
const THEME_LINE = `
  F4:0.5 Bb4:0.5 Db5:1 -:0.5 C5:1 -:0.5 |
  C5:0.75 Bb4:0.25 Ab4:1 F4:2           |
  -:4                                   |
  F5:1.5 Eb5:0.5 Db5:2                  |
  F4:0.5 Bb4:0.5 Db5:1 -:0.5 Eb5:1 -:0.5 |
  Gb5:0.75 F5:0.25 Eb5:1 Db5:2          |
  Eb5:1 Db5:1 Bb4:2                     |
  C5:2 Bb4:2                            |
`;

/** One statement of the theme, with the leap stamped in and the sighs leaning. */
function theme(start: number, velocity: number): Note[] {
  const sung = tracker(THEME_LINE, { start, checkBars: BAR, velocity, gate: 1.02 });
  const leap = cell(SONGSTRESS_DARK, start + 8, 'Bb4', velocity + 0.06);
  // bar 4's F5 leans on the Eb5 under it; bar 8's C5 is the 2 falling to the 1.
  const leaned = lean(concatNotes(sung, leap), [
    [start + 12, start + 13.5],
    [start + 28, start + 30],
  ]);
  return humanise(phrase(legato(leaned, 0.05), start, 32, 0.16), 0.03, 4);
}

/** The chorus: four bars of the hook itself, then four that walk it home. */
const CHORUS_ANSWER = `
  F4:1 Db5:1 C5:2      |
  Bb4:1.5 Ab4:0.5 Gb4:2 |
  Gb4:1 Bb4:1 Ab4:2    |
  C5:2 Bb4:2           |
`;

function chorusMelody(start: number, velocity: number): Note[] {
  const hook = tracker(SONGSTRESS_LEAD, { start, checkBars: BAR, velocity, gate: 1.0 }).filter(
    (n) => n[0] < start + 16,
  );
  const answer = tracker(CHORUS_ANSWER, {
    start: start + 16,
    checkBars: BAR,
    velocity: velocity - 0.04,
    gate: 1.02,
  });
  const leaned = lean(concatNotes(hook, answer), [[start + 28, start + 30]]);
  return humanise(phrase(legato(leaned, 0.05), start, 32, 0.14), 0.03, 9);
}

// --- parts -----------------------------------------------------------------

/** Electric piano: colour tones only — the bass owns the roots. */
const epianoNotes = humanise(
  concatNotes(
    compLine(INTRO_CHORDS, [{ at: 0, dur: 1.7, vel: 0.5, roll: 0.02 }, { at: 2.5, dur: 1.2, vel: 0.42 }], {
      start: INTRO,
      center: 60,
      perBar: (bar) => 0.82 + bar * 0.03,
    }),
    compLine(
      A_CHORDS,
      [
        { at: 0.5, dur: 0.45, vel: 0.6, roll: 0.015 },
        { at: 1.5, dur: 0.9, vel: 0.66 },
        { at: 2.75, dur: 0.3, vel: 0.5 },
        { at: 3.5, dur: 0.45, vel: 0.62 },
      ],
      { start: A, center: 60, perBar: (bar) => (bar % 8 === 7 ? 0.86 : bar % 4 === 0 ? 1.04 : 0.96) },
    ),
    compLine(
      CHORUS_CHORDS,
      [
        { at: 0, dur: 0.6, vel: 0.62, roll: 0.012 },
        { at: 1.75, dur: 0.5, vel: 0.56 },
        { at: 2.5, dur: 1.2, vel: 0.6 },
      ],
      { start: CHORUS, center: 60, perBar: (bar) => (bar >= 8 ? 1.06 : 0.98) },
    ),
    // The bridge is the electric piano's own eight bars: it comps looser and
    // higher while the strings take the tune.
    compLine(
      BRIDGE_CHORDS,
      [
        { at: 0.5, dur: 0.6, vel: 0.54, roll: 0.02 },
        { at: 2, dur: 0.9, vel: 0.6 },
        { at: 3.25, dur: 0.5, vel: 0.48 },
      ],
      { start: BRIDGE, center: 60, perBar: (bar) => 0.8 + bar * 0.02 },
    ),
    compLine(
      A_CHORDS,
      [
        { at: 0.5, dur: 0.45, vel: 0.64, roll: 0.015 },
        { at: 1.5, dur: 0.9, vel: 0.7 },
        { at: 2.75, dur: 0.3, vel: 0.54 },
        { at: 3.5, dur: 0.45, vel: 0.66 },
      ],
      { start: A2, center: 60, perBar: (bar) => (bar % 4 === 0 ? 1.06 : 1) },
    ),
    compLine(TURN_CHORDS, [{ at: 0, dur: 1.8, vel: 0.6, roll: 0.02 }, { at: 2.5, dur: 1.2, vel: 0.52 }], {
      start: TURN,
      center: 60,
    }),
  ),
  0.03,
  21,
);

/** The tune, over three sections. */
const leadNotes = concatNotes(theme(A, 0.8), theme(A + 32, 0.84), theme(A2, 0.88), theme(A2 + 32, 0.9));

/** The flute joins only for the second chorus, an octave up: the lift you hear. */
const fluteNotes = atVolume(doubled(chorusMelody(CHORUS + 32, 0.8), 12, 0.92), 1);

/**
 * Horns sing the chorus — Ab3-Bb4 is the middle of their range, which is why
 * the hook was written there — and answer the theme's phrase ends elsewhere.
 */
const brassNotes = concatNotes(
  chorusMelody(CHORUS, 0.78),
  chorusMelody(CHORUS + 32, 0.84),
  // Two-note answers in the gaps at the end of each A phrase.
  humanise(
    [
      [A + 30, 0.5, 'F4', 0.78],
      [A + 31, 0.75, 'Db4', 0.72],
      [A + 62, 0.5, 'F4', 0.8],
      [A + 63, 0.75, 'Bb3', 0.74],
      [A2 + 30, 0.5, 'F4', 0.84],
      [A2 + 31, 0.75, 'Db4', 0.78],
      [A2 + 62, 0.5, 'Ab4', 0.86],
      [A2 + 63, 0.75, 'F4', 0.8],
    ] as Note[],
    0.02,
    5,
  ),
);

/** Brass stabs: the punctuation, always on an off beat, never on the downbeat. */
const brassStabNotes = humanise(
  gated(
    concatNotes(
      chordLine(['F7sus4'], { start: INTRO + 30, octave: 3, center: 62, velocity: 0.72, dur: 1 }),
      chordLine([A_CHORDS[0]!], { start: A + 3.5, octave: 3, center: 62, velocity: 0.7, dur: 0.6 }),
      chordLine([A_CHORDS[4]!], { start: A + 19.5, octave: 3, center: 62, velocity: 0.72, dur: 0.6 }),
      chordLine([A_CHORDS[8]!], { start: A + 35.5, octave: 3, center: 62, velocity: 0.74, dur: 0.6 }),
      chordLine([CHORUS_CHORDS[0]!], { start: CHORUS - 0.5, octave: 3, center: 64, velocity: 0.8, dur: 0.8 }),
      chordLine([CHORUS_CHORDS[8]!], { start: CHORUS + 31.5, octave: 3, center: 64, velocity: 0.82, dur: 0.8 }),
      chordLine([A_CHORDS[0]!], { start: A2 - 0.5, octave: 3, center: 62, velocity: 0.86, dur: 0.8 }),
      chordLine([A_CHORDS[0]!], { start: A2 + 3.5, octave: 3, center: 62, velocity: 0.78, dur: 0.6 }),
      chordLine([A_CHORDS[8]!], { start: A2 + 35.5, octave: 3, center: 62, velocity: 0.8, dur: 0.6 }),
      chordLine([TURN_CHORDS[3]!], { start: TURN + 11, octave: 3, center: 62, velocity: 0.78, dur: 1 }),
    ),
    0.9,
  ),
  0.03,
  13,
);

/**
 * Supersaw: the dark cell as a stab, doubling the theme's own leap at bars 3
 * and 6 — and nothing else. THEMES.md gives this cue "SONGSTRESS_DARK as
 * supersaw stabs", and a supersaw pad held through the chorus would put a
 * synth chord in the same octave as the horns singing the hook.
 */
const supersawNotes = concatNotes(
  ...[A + 8, A + 20, A + 40, A + 52, A2 + 8, A2 + 20, A2 + 40, A2 + 52].map((beat, i) =>
    gated(
      humanise(cell(SONGSTRESS_DARK, beat, i >= 4 ? 'Bb5' : 'Bb4', i >= 4 ? 0.66 : 0.56), 0.03, 17),
      0.72,
    ),
  ),
);

/** Fingered bass: a real line with ghosts and air, not an octave pump. */
const BASS_A = [
  { at: 0, dur: 0.85, step: 0, vel: 0.88 },
  { at: 1.5, dur: 0.3, step: 0, vel: 0.44 },
  { at: 2, dur: 0.55, step: 7, vel: 0.74 },
  { at: 2.75, dur: 0.25, step: 12, vel: 0.5 },
  { at: 3.25, dur: 0.6, step: 7, vel: 0.68 },
];
const BASS_CHORUS = [
  { at: 0, dur: 0.9, step: 0, vel: 0.9 },
  { at: 1, dur: 0.4, step: 0, vel: 0.5 },
  { at: 2, dur: 0.9, step: 12, vel: 0.72 },
  { at: 3.5, dur: 0.4, step: 7, vel: 0.66 },
];
const BASS_BRIDGE = [
  { at: 0, dur: 1.4, step: 0, vel: 0.76 },
  { at: 2, dur: 0.8, step: 7, vel: 0.62 },
  { at: 3.5, dur: 0.4, step: 12, vel: 0.56 },
];

const bassNotes = concatNotes(
  bassLine(INTRO_CHORDS.slice(4), BASS_A, { start: INTRO + 16, octave: 1, velocity: 0.78 }),
  bassLine(A_CHORDS, BASS_A, { start: A, octave: 1 }),
  bassLine(CHORUS_CHORDS, BASS_CHORUS, { start: CHORUS, octave: 1, velocity: 1.02 }),
  bassLine(BRIDGE_CHORDS, BASS_BRIDGE, { start: BRIDGE, octave: 1, velocity: 0.88 }),
  bassLine(A_CHORDS, BASS_A, { start: A2, octave: 1, velocity: 1.04 }),
  bassLine(TURN_CHORDS, BASS_A, { start: TURN, octave: 1, velocity: 0.94 }),
);

/** Strings: the friend the party is fighting. They arrive late and leave early. */
const stringsNotes = concatNotes(
  // The bridge line: the jazz bridge played straight, legato, as a lament.
  humanise(
    legato(
      tracker(SONGSTRESS_BRIDGE, { start: BRIDGE, checkBars: BAR, velocity: 0.6, gate: 1.02 }),
      0.09,
    ),
    0.03,
    31,
  ),
  humanise(
    legato(
      tracker(SONGSTRESS_BRIDGE, { start: BRIDGE + 32, checkBars: BAR, velocity: 0.66, gate: 1.02, transpose: -12 }),
      0.09,
    ),
    0.03,
    32,
  ),
  // A held bed under the second chorus, entering only at the lift.
  padLine(CHORUS_CHORDS.slice(8), { start: CHORUS + 32, center: 55, velocity: 0.42, dur: 3.9, seed: 19 }),
);

// --- kit -------------------------------------------------------------------

const KICK_A = 'X..x..x...x.x...';
const KICK_CHORUS = 'X..x..x.X...x.x.';
const KICK_BRIDGE = 'x.......x.......';
const SNARE_A = '....X..g....X.gg';
const SNARE_BRIDGE = '....g.......X...';
const HAT_A = 'X.x.x.x.X.x.x.x.';
const HAT_BUSY = 'X.xgx.xgX.xgx.xg';
const HAT_BRIDGE = 'x...g...x...g...';

const kickNotes = concatNotes(
  groove(KICK_A, { start: INTRO + 16, bars: 4, pitch: 'C2', velocity: 0.6, seed: 2 }),
  groove(KICK_A, { start: A, bars: 16, pitch: 'C2', velocity: 0.78, seed: 3, perBar: (b) => (b % 8 === 0 ? 1.08 : 1) }),
  groove(KICK_CHORUS, { start: CHORUS, bars: 16, pitch: 'C2', velocity: 0.82, seed: 4 }),
  groove(KICK_BRIDGE, { start: BRIDGE, bars: 16, pitch: 'C2', velocity: 0.6, seed: 5, perBar: (b) => 0.9 + b * 0.02 }),
  groove(KICK_A, { start: A2, bars: 16, pitch: 'C2', velocity: 0.88, seed: 6, perBar: (b) => (b % 8 === 0 ? 1.06 : 1) }),
  groove(KICK_CHORUS, { start: TURN, bars: 4, pitch: 'C2', velocity: 0.84, seed: 7 }),
);

const snareNotes = concatNotes(
  groove(SNARE_A, { start: A, bars: 15, pitch: 'D2', velocity: 0.72, ghost: 0.26, seed: 8 }),
  tomFill(A + 62, ['D2', 'D2', 'A2', 'A2', 'F2', 'F2', 'D2', 'D2'], 0.25, 0.66),
  groove(SNARE_A, { start: CHORUS, bars: 16, pitch: 'D2', velocity: 0.76, ghost: 0.28, seed: 9 }),
  groove(SNARE_BRIDGE, { start: BRIDGE, bars: 16, pitch: 'D2', velocity: 0.52, ghost: 0.2, seed: 10 }),
  groove(SNARE_A, { start: A2, bars: 15, pitch: 'D2', velocity: 0.8, ghost: 0.3, seed: 11 }),
  tomFill(A2 + 62, ['D2', 'A2', 'F2', 'D2', 'A2', 'F2', 'D2', 'D2'], 0.25, 0.78),
  groove(SNARE_A, { start: TURN, bars: 4, pitch: 'D2', velocity: 0.78, ghost: 0.3, seed: 12 }),
);

const hatNotes = concatNotes(
  groove(HAT_A, { start: INTRO, bars: 8, pitch: 'F#2', velocity: 0.3, seed: 13, perBar: (b) => 0.7 + b * 0.05 }),
  groove(HAT_A, { start: A, bars: 16, pitch: 'F#2', velocity: 0.4, seed: 14 }),
  groove(HAT_BUSY, { start: CHORUS, bars: 16, pitch: 'F#2', velocity: 0.42, seed: 15 }),
  groove(HAT_BRIDGE, { start: BRIDGE, bars: 16, pitch: 'F#2', velocity: 0.3, seed: 16 }),
  groove(HAT_BUSY, { start: A2, bars: 16, pitch: 'F#2', velocity: 0.44, seed: 17 }),
  groove(HAT_A, { start: TURN, bars: 4, pitch: 'F#2', velocity: 0.42, seed: 18 }),
);

const tomNotes = concatNotes(
  tomFill(A + 30, ['A2', 'F2', 'D2', 'D2'], 0.25, 0.6),
  tomFill(CHORUS - 1, ['A2', 'F2', 'D2', 'C2'], 0.25, 0.7),
  tomFill(A2 - 1, ['A2', 'A2', 'F2', 'D2'], 0.25, 0.76),
);

const crashNotes: Note[] = [
  [A, 1.6, 'C4', 0.52],
  [CHORUS, 1.8, 'C4', 0.62],
  [CHORUS + 32, 1.8, 'C4', 0.58],
  [A2, 1.8, 'C4', 0.66],
  [TURN, 1.6, 'C4', 0.5],
];

/** Celesta: three notes, at the three section heads. Nothing else. */
const celestaNotes: Note[] = [
  [CHORUS, 2, 'Db6', 0.5],
  [CHORUS + 32, 2, 'F6', 0.46],
  [A2, 2, 'Bb5', 0.5],
];

export const bossFfx2AeonTrack: Track = {
  name: 'boss-ffx2-aeon',
  bpm: 160,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.52, damp: 0.42, width: 0.9, preDelay: 0.012 },
    delay: { timeBeats: 0.375, feedback: 0.2, damp: 3400 },
  },
  channels: [
    { name: 'epiano', instrument: 'epiano', volume: 0.7, pan: -0.14, notes: epianoNotes, fx: { reverb: 0.16 } },
    {
      name: 'trumpets',
      instrument: 'brass-stab',
      volume: 0.64,
      pan: 0.1,
      notes: ramp(leadNotes, 1, 1.06, A, LENGTH - A),
      fx: { reverb: 0.22, delay: 0.14 },
    },
    { name: 'horns', instrument: 'brass', volume: 0.66, pan: -0.08, notes: brassNotes, fx: { reverb: 0.28 } },
    { name: 'flute', instrument: 'flute', volume: 0.5, pan: 0.12, notes: fluteNotes, fx: { reverb: 0.32 } },
    { name: 'brass punches', instrument: 'brass-stab', volume: 0.56, pan: 0.18, notes: brassStabNotes, fx: { reverb: 0.2 } },
    { name: 'supersaw', instrument: 'supersaw', volume: 0.44, pan: 0.2, notes: supersawNotes, fx: { reverb: 0.22, delay: 0.16 } },
    { name: 'strings', instrument: 'strings', volume: 0.6, pan: -0.2, notes: stringsNotes, fx: { reverb: 0.34 } },
    { name: 'bass', instrument: 'bass', volume: 0.85, pan: 0, notes: nudge(bassNotes, 0.004), fx: { reverb: 0.05 } },
    { name: 'kick', instrument: 'kick', volume: 0.72, pan: 0, notes: kickNotes, fx: { reverb: 0.08 } },
    { name: 'snare', instrument: 'snare', volume: 0.6, pan: -0.06, notes: snareNotes, fx: { reverb: 0.14 } },
    { name: 'hats', instrument: 'hat', volume: 0.34, pan: 0.24, notes: hatNotes, fx: { reverb: 0.08 } },
    { name: 'toms', instrument: 'tom', volume: 0.52, pan: 0.12, notes: tomNotes, fx: { reverb: 0.14 } },
    { name: 'crash', instrument: 'crash', volume: 0.38, pan: 0.1, notes: crashNotes, fx: { reverb: 0.3 } },
    { name: 'celesta', instrument: 'celesta', volume: 0.4, pan: -0.3, notes: celestaNotes, fx: { reverb: 0.4, delay: 0.2 } },
  ],
};

export default bossFfx2AeonTrack;
