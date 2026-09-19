/**
 * "Wherever the Tide Takes Me" — the FFX-2 ending.
 *
 * ORIGINAL COMPOSITION. A warm piano ballad in Bb major at 84 bpm that lifts
 * to C for its last chorus. The second game gets to say goodbye gently,
 * because it can.
 *
 * THEMES (docs/audio/THEMES.md §5, cue map row 21). This is the only cue that
 * gets the Songstress's hook COMPLETE — all eight bars, `SONGSTRESS_LEAD` over
 * `SONGSTRESS_CHORDS`, including bar 7's one borrowed bVII major, the brightest
 * bar in the score, dropped in at the climax and walked straight back out as
 * if nothing had happened. Every other cue in the game is rationed to
 * fragments of it. The bridge is `SONGSTRESS_BRIDGE` with its ii-V motion
 * intact, and it goes a sixth above the hook's ceiling, which is what a bridge
 * is for.
 *
 * And at the very end, over the ii chord, a solo flute plays `FAREWELL_RISE`:
 * FFX's four-note goodbye, minor third and all, inside FFX-2's major key. It
 * is the same four scale degrees the hook itself opens on. Nobody has to
 * notice. Everybody should feel that the two games are one score.
 *
 * Form (4/4, 84 bpm, 40 bars, 114 s):
 *   bars  1- 4  intro     beats   0- 16  solo piano
 *   bars  5-12  verse     beats  16- 48  the hook, piano and epiano    <- loop
 *   bars 13-20  chorus    beats  48- 80  strings take it, flute above
 *   bars 21-28  bridge    beats  80-112  ii-V, the tune goes higher
 *   bars 29-36  chorus+1  beats 112-144  up a step to C, choir enters
 *   bars 37-40  coda      beats 144-160  the farewell visits, and it pivots home
 * Loop 16 -> 160.
 */

import {
  accel,
  aTempo,
  chordRoots,
  concatNotes,
  fermata,
  rit,
  tempoMap,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { cell } from './motifs.ts';
import {
  FAREWELL_RISE,
  SONGSTRESS_BRIDGE,
  SONGSTRESS_LEAD,
  SONGSTRESS_RISE,
  lean,
  shapeByBar,
} from './themes.ts';
import {
  arpStackLine,
  bassLine,
  compLine,
  doubled,
  groove,
  humanise,
  legato,
  padLine,
  ramp,
} from './ffx2-common.ts';

const BAR = 4;
const INTRO = 0;
const VERSE = 16;
const CHORUS = 48;
const BRIDGE = 80;
const CHORUS2 = 112;
const CODA = 144;
const LENGTH = 160;

/** `SONGSTRESS_CHORDS` transposed into Bb; bar 7 is the borrowed bVII major. */
const HOOK_CHORDS_BB = ['Bbmaj7', 'Gm7', 'Ebmaj7', 'F7sus4', 'Bbmaj7', 'Gm7', 'Ab', 'Bb6'];
/** The same, a step up in C — the last chorus. */
const HOOK_CHORDS_C = ['Cmaj7', 'Am7', 'Fmaj7', 'G7sus4', 'Cmaj7', 'Am7', 'Bb', 'C6'];
/** `SONGSTRESS_BRIDGE_CHORDS` in Bb: real ii-V motion, which only FFX-2 is allowed. */
const BRIDGE_CHORDS_BB = ['Cm9', 'F9', 'Bbmaj7', 'Ebmaj7', 'Dm7', 'Gm7', 'Cm9', 'F7sus4'];
/** Four bars that let C major fall back to Bb without anybody noticing. */
const CODA_CHORDS = ['C6', 'Am7', 'Gm7', 'F7sus4'];
const INTRO_CHORDS = ['Bbmaj7', 'Gm7', 'Ebmaj7', 'F7sus4'];

/**
 * Per-bar dynamics for the hook. Bar 7 — the borrowed chord, the joy — is the
 * peak; bar 8 settles. The verse states this table scaled down, the choruses
 * scaled up, which is how one melody carries three different weights.
 */
const HOOK_DYNAMICS = [0.6, 0.64, 0.7, 0.66, 0.62, 0.68, 0.78, 0.6];

/** The hook, complete, at a given transposition and level. */
function hook(start: number, transpose: number, level: number, seed: number): Note[] {
  const raw = tracker(SONGSTRESS_LEAD, { start, checkBars: BAR, transpose });
  const shaped = shapeByBar(
    raw.map((n) => [n[0] - start, n[1], n[2], n[3]] as Note),
    HOOK_DYNAMICS.map((v) => v * level),
    BAR,
  ).map((n) => [n[0] + start, n[1], n[2], n[3]] as Note);
  // Bar 4's F leaning onto Eb, and bar 8's 2 falling to the tonic.
  const leaned = lean(shaped, [
    [start + 12, start + 13.5],
    [start + 28, start + 29],
  ]);
  return humanise(legato(leaned, 0.06), 0.03, seed);
}

/**
 * Per-bar dynamics for the bridge. It was written at one velocity for all
 * eight bars, which THEMES.md bans outright ("never render a phrase at
 * constant velocity") and which cost the cue its best moment: the bridge
 * exists to climb a sixth above the hook's ceiling, and a climb that does not
 * get louder is not a climb. Bar 7 — the Gb5, the highest note in the cue —
 * is the peak; bar 8 settles back under the last chorus.
 */
const BRIDGE_DYNAMICS = [0.6, 0.64, 0.62, 0.68, 0.66, 0.72, 0.8, 0.62];

/** The jazz bridge, which climbs a sixth above anything the hook could reach. */
function bridgeTune(start: number, transpose: number, level: number, seed: number): Note[] {
  const raw = tracker(SONGSTRESS_BRIDGE, { start, checkBars: BAR, transpose });
  const shaped = shapeByBar(
    raw.map((n) => [n[0] - start, n[1], n[2], n[3]] as Note),
    BRIDGE_DYNAMICS.map((v) => v * level),
    BAR,
  ).map((n) => [n[0] + start, n[1], n[2], n[3]] as Note);
  // Two appoggiaturas, and the second is the one that matters: the peak, Gb5
  // held three beats, leaning down onto the F under it. `lean` goes LAST, after
  // every shape and arch, because THEMES.md says no humaniser may level it —
  // and an arch applied afterwards is a humaniser. The first pair (bar 4's Bb
  // onto the Ab that opens bar 5) was unmarked and came out 0.03 INVERTED.
  return humanise(
    lean(legato(shaped, 0.06), [
      [start + 14, start + 16],
      [start + 24, start + 27],
    ]),
    0.03,
    seed,
  );
}

// --- piano -----------------------------------------------------------------

/** Rolling broken chords: pedalled, never a repeated-note ostinato. */
function leftHand(
  chords: string[],
  start: number,
  velocity: number,
  step: number,
  seed: number,
): Note[] {
  const rolled = arpStackLine(chords, {
    start,
    pattern: [0, 1, 2, 3, 2, 1],
    step,
    dur: step * 2.2,
    center: 55,
    keepRoot: true,
    maxTones: 3,
    velocity,
    accent: 1.12,
    seed,
  });
  const roots = chordRoots(chords, 2).map(
    (midi, bar): Note => [start + bar * BAR, BAR * 0.92, midi, velocity * 1.06],
  );
  return humanise(concatNotes(rolled, roots), 0.035, seed);
}

const pianoNotes = concatNotes(
  // Intro: the hook's own rise, twice, alone, with the left hand answering.
  humanise(legato(cell(SONGSTRESS_RISE, INTRO + 2, 'Bb4', 0.56), 0.06), 0.03, 101),
  humanise(legato(cell(SONGSTRESS_RISE, INTRO + 10, 'Bb4', 0.6), 0.06), 0.03, 102),
  leftHand(INTRO_CHORDS, INTRO, 0.3, 0.5, 103),
  // Verse: the piano sings it.
  hook(VERSE, 9, 0.95, 104),
  leftHand(HOOK_CHORDS_BB, VERSE, 0.34, 0.5, 105),
  // Chorus: the strings have the tune; the piano keeps the motion underneath.
  leftHand(HOOK_CHORDS_BB, CHORUS, 0.4, 0.25, 106),
  leftHand(BRIDGE_CHORDS_BB, BRIDGE, 0.38, 0.25, 107),
  leftHand(HOOK_CHORDS_C, CHORUS2, 0.44, 0.25, 108),
  // Coda: back to four bars of nothing much, and a last low octave.
  leftHand(CODA_CHORDS, CODA, 0.3, 0.5, 109),
);

// --- the tune, passed around ----------------------------------------------

const epianoNotes = humanise(
  concatNotes(
    compLine(
      HOOK_CHORDS_BB,
      [
        { at: 1, dur: 1.2, vel: 0.44, roll: 0.02 },
        { at: 2.5, dur: 1.2, vel: 0.4 },
      ],
      { start: VERSE, center: 60, seed: 110 },
    ),
    compLine(
      BRIDGE_CHORDS_BB,
      [
        { at: 0.5, dur: 1, vel: 0.46, roll: 0.02 },
        { at: 2, dur: 1.4, vel: 0.48 },
      ],
      { start: BRIDGE, center: 60, seed: 111 },
    ),
  ),
  0.03,
  112,
);

const stringsLead = concatNotes(
  hook(CHORUS, 9, 1, 113),
  bridgeTune(BRIDGE, -3, 1, 114),
  hook(CHORUS2, 11, 1.06, 115),
  // Violas double the last chorus an octave below from bar 5 onward, so the
  // sound widens exactly where the tune climbs.
  doubled(hook(CHORUS2, 11, 1.06, 115).filter((n) => n[0] >= CHORUS2 + 16), -12, 0.62),
);

const stringsBed = humanise(
  concatNotes(
    padLine(HOOK_CHORDS_BB, { start: CHORUS, center: 57, velocity: 0.36, dur: 3.9, seed: 140 }),
    padLine(BRIDGE_CHORDS_BB, { start: BRIDGE, center: 57, velocity: 0.34, dur: 3.9, seed: 141 }),
    padLine(HOOK_CHORDS_C, { start: CHORUS2, center: 59, velocity: 0.44, dur: 3.9, seed: 142 }),
    padLine(CODA_CHORDS, { start: CODA, center: 55, velocity: 0.3, dur: 3.9, seed: 143 }),
  ),
  0.03,
  116,
);

const lowStrings = humanise(
  concatNotes(
    chordRoots(HOOK_CHORDS_BB, 2).map((m, i): Note => [CHORUS + i * BAR, 3.8, m, 0.4]),
    chordRoots(BRIDGE_CHORDS_BB, 2).map((m, i): Note => [BRIDGE + i * BAR, 3.8, m, 0.38]),
    chordRoots(HOOK_CHORDS_C, 2).map((m, i): Note => [CHORUS2 + i * BAR, 3.8, m, 0.46]),
    chordRoots(CODA_CHORDS, 2).map((m, i): Note => [CODA + i * BAR, 3.8, m, 0.34]),
  ),
  0.03,
  117,
);

/**
 * Flute: doubles the chorus an octave up, takes the bridge's peak, and gets
 * the last word — `FAREWELL_RISE`, the other game's goodbye, over the ii.
 */
const fluteNotes = concatNotes(
  doubled(hook(CHORUS, 9, 0.8, 118), 12, 0.8).filter((n) => n[0] >= CHORUS + 8),
  doubled(hook(CHORUS2, 11, 0.84, 119), 12, 0.85),
  // Once. It is worth nothing if it is said twice.
  humanise(legato(cell(FAREWELL_RISE, CODA + 8, 'Bb4', 0.54), 0.08), 0.02, 120),
);

/** Choir: wordless, distant, and only for the last chorus. */
const choirNotes = humanise(
  // The choir swells across its eight bars rather than sitting at one level:
  // a section that never changes weight is the sound of a held sampler key.
  ramp(
    padLine(HOOK_CHORDS_C, { start: CHORUS2, center: 64, velocity: 0.34, dur: 3.8, seed: 144 }),
    0.78,
    1.2,
    CHORUS2,
    32,
  ),
  0.03,
  122,
);

const harpNotes = humanise(
  concatNotes(
    arpStackLine(BRIDGE_CHORDS_BB, {
      start: BRIDGE,
      pattern: [0, 1, 2, 3, 4, 3, 2, 1],
      step: 0.5,
      dur: 1.4,
      center: 76,
      maxTones: 3,
      velocity: 0.3,
      accent: 1.2,
      seed: 145,
    }),
    arpStackLine(HOOK_CHORDS_C, {
      start: CHORUS2,
      pattern: [0, 1, 2, 3],
      step: 1,
      dur: 2.2,
      center: 78,
      maxTones: 3,
      velocity: 0.28,
      accent: 1.2,
      seed: 146,
    }),
  ),
  0.04,
  123,
);

// --- the quietest possible rhythm section ----------------------------------

const BASS_BALLAD = [
  { at: 0, dur: 2.4, step: 0, vel: 0.64 },
  { at: 2.5, dur: 1.2, step: 7, vel: 0.5 },
];

const bassNotes = concatNotes(
  bassLine(HOOK_CHORDS_BB, BASS_BALLAD, { start: VERSE, octave: 1, velocity: 0.8, seed: 124 }),
  bassLine(HOOK_CHORDS_BB, BASS_BALLAD, { start: CHORUS, octave: 1, velocity: 0.92, seed: 125 }),
  bassLine(BRIDGE_CHORDS_BB, BASS_BALLAD, { start: BRIDGE, octave: 1, velocity: 0.88, seed: 126 }),
  bassLine(HOOK_CHORDS_C, BASS_BALLAD, { start: CHORUS2, octave: 1, velocity: 0.96, seed: 127 }),
  bassLine(CODA_CHORDS, BASS_BALLAD, { start: CODA, octave: 1, velocity: 0.74, seed: 128 }),
);

const kickNotes = concatNotes(
  groove('X.......x.......', { start: CHORUS, bars: 8, pitch: 'C2', velocity: 0.4, seed: 129 }),
  groove('X.......x.......', { start: CHORUS2, bars: 8, pitch: 'C2', velocity: 0.46, seed: 130 }),
);

const shakerNotes = concatNotes(
  groove('x...g...x...g...', { start: CHORUS, bars: 8, pitch: 'F#2', velocity: 0.2, ghost: 0.1, seed: 131 }),
  groove('x..gx..gx..gx..g', { start: CHORUS2, bars: 8, pitch: 'F#2', velocity: 0.22, ghost: 0.12, seed: 132 }),
);

const timpaniNotes = humanise(
  [
    [CHORUS - 1, 1, 'Bb1', 0.34],
    [CHORUS2 - 2, 2, 'G1', 0.4],
    [CHORUS2 - 1, 1, 'C2', 0.5],
  ] as Note[],
  0.03,
  133,
);

const bellNotes: Note[] = [
  [CHORUS2, 6, 'C5', 0.34],
  [CODA, 6, 'C5', 0.28],
];

export const endingFfx2Track: Track = {
  name: 'ending-ffx2',
  bpm: 84,
  /**
   * The pulse, bent. A ballad played to a grid is a ballad typed in, and this
   * is the cue that says goodbye — "more gently, because it can".
   *
   * Every bend sits where the kit is not: the drums play the two choruses
   * only (beats 48-80 and 112-144), and those two sections run at their
   * written tempo from end to end. The intro, the bridge and the coda are
   * piano, harp and strings alone, and that is where the rubato lives.
   *
   * The map returns to the written 84 by `loop.end`, so the wrap does not
   * lurch, and both fermatas are inside the loop where they will be heard.
   */
  tempo: tempoMap(
    // Solo piano, under tempo, finding it.
    [INTRO, 78],
    accel(INTRO + 8, VERSE, 84, 'into the verse'),
    rit(CHORUS - 4, CHORUS, 80, 'a breath before the chorus'),
    aTempo(CHORUS, 'base', 'a tempo'),
    // The bridge's peak — the highest note in the cue — is leaned on and held.
    rit(BRIDGE + 20, BRIDGE + 24, 78, 'leaning on the peak'),
    fermata(BRIDGE + 24, 0.6, 'the peak, held'),
    aTempo(BRIDGE + 27, 'base', 'a tempo'),
    accel(BRIDGE + 28, CHORUS2, 88, 'lifting a step'),
    rit(CHORUS2 + 28, CODA, 84, 'settling home'),
    // FFX's four-note goodbye visits at CODA + 8, and the whole cue slows to
    // let it. Then the pivot chord is held, and the verse comes round again.
    rit(CODA + 4, CODA + 12, 76, 'the farewell visits'),
    fermata(CODA + 12, 1.2, 'the pivot, held'),
    aTempo(CODA + 12, 'base', 'a tempo'),
  ),
  timeSig: [4, 4],
  loop: { start: VERSE, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  fx: {
    reverb: { room: 0.78, damp: 0.28, width: 0.95, preDelay: 0.026 },
    delay: { timeBeats: 0.75, feedback: 0.16, damp: 2400 },
  },
  channels: [
    { name: 'piano', instrument: 'piano', volume: 0.92, pan: -0.04, notes: pianoNotes, fx: { reverb: 0.3 } },
    { name: 'strings', instrument: 'strings', volume: 0.72, pan: -0.14, notes: ramp(stringsLead, 0.96, 1.05, CHORUS, LENGTH - CHORUS), fx: { reverb: 0.36 } },
    { name: 'string bed', instrument: 'pad', volume: 0.46, pan: 0.12, notes: stringsBed, fx: { reverb: 0.46 } },
    { name: 'low strings', instrument: 'strings-low', volume: 0.56, pan: 0.18, notes: lowStrings, fx: { reverb: 0.34 } },
    { name: 'flute', instrument: 'flute', volume: 0.56, pan: 0.16, notes: fluteNotes, fx: { reverb: 0.34 } },
    { name: 'choir', instrument: 'choir', volume: 0.44, pan: 0, notes: choirNotes, fx: { reverb: 0.52 } },
    { name: 'harp', instrument: 'harp', volume: 0.46, pan: -0.28, notes: harpNotes, fx: { reverb: 0.42 } },
    { name: 'epiano', instrument: 'epiano', volume: 0.5, pan: 0.22, notes: epianoNotes, fx: { reverb: 0.24 } },
    { name: 'bass', instrument: 'bass', volume: 0.66, pan: 0, notes: bassNotes, fx: { reverb: 0.06 } },
    { name: 'kick', instrument: 'kick', volume: 0.44, pan: 0, notes: kickNotes, fx: { reverb: 0.14 } },
    { name: 'shaker', instrument: 'shaker', volume: 0.24, pan: 0.26, notes: shakerNotes, fx: { reverb: 0.14 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.5, pan: 0.06, notes: timpaniNotes, fx: { reverb: 0.4 } },
    { name: 'bell', instrument: 'bell', volume: 0.28, pan: 0.3, notes: bellNotes, fx: { reverb: 0.5 } },
  ],
};

export default endingFfx2Track;
