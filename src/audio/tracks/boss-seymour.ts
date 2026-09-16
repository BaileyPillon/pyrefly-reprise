/**
 * "Ascension of the Unmaker" — Seymour boss theme.
 *
 * ORIGINAL COMPOSITION. 132 bpm, C# minor: a demonic mass at battle tempo, not
 * a rock kit and not a slow hymn. The organ is the bass (16' weight, a
 * chromatically descending lament ground — C#-C-B-Bb-A-G#, the Baroque
 * passacaglia device, resolving to the dominant every four bars) so no
 * bass/bass-sub channel doubles it. Choir chants the lead in short, driving
 * phrases; strings-short keep a spiccato continuo pulse; taiko and timpani
 * carry the rhythm instead of a drum kit; brass stabs punctuate the harmony
 * while a second, slower brass line states the SENDING motif, augmented,
 * as a counter-line under the choir. A bell tolls at every turn of the mass.
 *
 * Form (4/4, 60 bars, ~109.1 s):
 *   bars  1- 4  intro     beats   0- 16   organ chord swell, choir invocation,
 *                                         one ominous taiko hit, brass stab
 *   bars  5-12  A         beats  16- 48   choir chant + lament bass         <- loop start
 *   bars 13-20  B         beats  48- 80   organ calms to a pedal; low brass
 *                                         states augment(SENDING, 2) twice
 *   bars 21-28  C         beats  80-112   full mass: choir climax, organ
 *                                         drives in eighths, stabs thicken
 *   bars 29-32  interlude beats 112-128   organ solo alone, quiet and eerie
 *   bars 33-36  build     beats 128-144   crescendo: taiko/timpani/choir/
 *                                         strings-short climb back in
 *   bars 37-44  A2        beats 144-176   the chant returns, louder
 *   bars 45-56  D         beats 176-224   extended second climax, SENDING
 *                                         echoes once more at half speed
 *   bars 57-60  turn      beats 224-240   timpani roll on the falling bass,
 *                                         cadencing V -> i into the loop
 * The loop runs 16 -> 240: the turn's dominant chord resolves straight into
 * A's tonic, so the mass never really stops.
 */

import {
  chordMidis,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { augment, SENDING } from './motifs.ts';

const BAR = 4;

/** The i-VII-VI-V unit under the lament bass, at BAR grain — used only where a
 *  single downbeat root per bar is enough (timpani accents). */
const UNIT = ['C#m', 'B', 'A', 'G#'];
const A_CHORDS = [...UNIT, ...UNIT];

/**
 * The SAME four bars, but harmonised in HALF-bars so the chord actually
 * follows the lament bass's own chromatic steps (C#-C-B-Bb-A-G#-G#-G#)
 * instead of fighting them: i, V6 (G# major, its 3rd B# spelled C in the
 * bass), B, a passing F#-triad-over-A#, IV, first-inversion E acting as a
 * V6/vi-ish colour on the G# pedal, then V and V7. Everything that has to
 * "spell the chord" under the lament (the ostinato, the stabs) reads this
 * instead of the old per-bar `UNIT`.
 */
const HALF_UNIT = ['C#m', 'G#/C', 'B', 'F#/A#', 'A', 'E/G#', 'G#', 'G#7'];
const A_HALF = [...HALF_UNIT, ...HALF_UNIT];
const B_CHORDS = ['C#m', 'C#m', 'F#m', 'F#m', 'C#m', 'C#m', 'G#', 'C#m/G#'];
const C_CHORDS = ['C#m', 'A', 'F#m', 'G#', 'C#m', 'E', 'B', 'G#'];
const BUILD_CHORDS = ['C#m', 'C#m', 'F#m', 'G#'];
const D_CHORDS = [...C_CHORDS, 'F#m', 'G#', 'C#m', 'G#'];

const A_START = 16;
const B_START = 48;
const C_START = 80;
const INTERLUDE_START = 112;
const BUILD_START = 128;
const A2_START = 144;
const D_START = 176;
const TURN_START = 224;
const LENGTH = 240;

// -------------------------------------------------------------------- organ

/** The chromatic lament ground: C#-C-B-Bb-A-G#, the last note held as a dominant pedal. */
function lamentUnit(start: number, vel: number): Note[] {
  return tracker('C#2:2 C2:2 | B1:2 A#1:2 | A1:2 G#1:2 | G#1:4', { start, velocity: vel, checkBars: BAR });
}

/** A calmer sustained pedal on the chord roots — used while B section features the brass counter-line. */
function organPedal(chords: string[], start: number, vel: number, dur = 3.9): Note[] {
  return chordRoots(chords, 2).map((midi, bar): Note => [start + bar * BAR, dur, midi, vel]);
}

/** A driving eighth-note pulse on the chord roots — the mass's engine at the climaxes. */
function organDrive(chords: string[], start: number, vel: number): Note[] {
  const roots = chordRoots(chords, 2);
  const notes: Note[] = [];
  roots.forEach((root, bar) => {
    const at = start + bar * BAR;
    for (let s = 0; s < 8; s++) notes.push([at + s * 0.5, 0.46, root, s % 2 === 0 ? vel : vel * 0.7]);
  });
  return notes;
}

function organLine(): Note[] {
  const introChord = chordMidis('C#m', { octave: 2, bassOctaves: 1 });
  return concatNotes(
    introChord.map((m): Note => [0, 15.5, m, 0.62]),
    lamentUnit(A_START, 0.72),
    lamentUnit(A_START + 16, 0.78),
    organPedal(B_CHORDS, B_START, 0.42),
    organDrive(C_CHORDS, C_START, 0.7),
    tracker('C#3:2 -:2 | C3:2 -:2 | B2:2 G3:1 F#3:1 | A#2:3 -:1', { start: INTERLUDE_START, velocity: 0.32, checkBars: BAR }),
    // Rewritten from an earlier draft that spelled F#/A over C#m and G# over
    // F#m — both a semitone off the bar's own chord. Now every note here is
    // a tone of its bar (C#m, C#m, F#m, G#).
    tracker('C#2:1 E2:1 G#2:1 C#3:1 | G#2:1 C#3:1 E3:1 G#3:1 | F#1:1 F#1:1 F#1:1 F#1:1 | G#1:2 G#2:2', {
      start: BUILD_START,
      velocity: 0.55,
      checkBars: BAR,
    }),
    lamentUnit(A2_START, 0.85),
    lamentUnit(A2_START + 16, 0.92),
    organDrive(D_CHORDS, D_START, 0.78),
    lamentUnit(TURN_START, 0.75),
  );
}

// -------------------------------------------------------------------- choir

// PHRASE1/2 sit over A_HALF (see below): each 4-bar phrase spans two
// HALF_UNIT statements, so the harmony under it changes every 2 beats, not
// every 4. Re-voiced against that: bar-1's held tone follows the bass into
// G#/C (C#5 -> C5, i.e. B# spelled as C), bar-2's held tone follows it into
// F#/A# (B4 -> A#4, a nice echo of the organ's own chromatic step), and
// bar-3 rides straight through A -> E/G# (both already chord tones).
const CHOIR_PHRASE1 = 'C#4:1 E4:1 G#4:1 C5:1 | B4:1.5 D#5:0.5 A#4:2 | A4:1 C#5:1 E5:1 C#5:1 | G#4:2 F#4:1 D#4:1';
const CHOIR_PHRASE2 = 'E5:1 C#5:1 G#4:1 C5:1 | D#5:2 A#4:2 | E5:1.5 C#5:0.5 B4:2 | G#4:2 G#4:2';
const CHOIR_CLIMAX = `
  E5:0.75 E5:0.75 G#5:0.5 C#5:1 E5:1 | A5:1.5 E5:0.5 C#5:2 |
  F#5:1 A5:1 C#6:2                   | G#5:2 F#5:1 D#5:1   |
  E5:0.75 E5:0.75 G#5:0.5 C#5:1 E5:1 | G#5:2 E5:2          |
  F#5:1.5 D#5:0.5 B4:2               | A4:2 G#4:2          |
`;
// Bar 8's A4 is a written-out appoggiatura: it clashes with the G# under it
// for 2 beats but resolves straight down by step onto the G#4 that follows,
// so it's kept rather than re-voiced.
const CHOIR_D_TAIL = 'A5:2 F#5:2 | G#5:1 F#5:1 D#5:2 | C#5:2 E5:2 | G#4:2 -:2';

function choirLine(): Note[] {
  return concatNotes(
    // The intro's A3 (beats 8-11) rubs against the sustained organ chord's
    // G#, but it resolves straight down by step to the G#3 that follows —
    // a suspension over the static tonic pedal, kept rather than re-voiced.
    tracker('C#4:3 -:1 | B3:3 -:1 | A3:3 -:1 | G#3:4', { start: 0, velocity: 0.4, checkBars: BAR }),
    tracker(CHOIR_PHRASE1, { start: A_START, velocity: 0.7, checkBars: BAR }),
    tracker(CHOIR_PHRASE2, { start: A_START + 16, velocity: 0.78, checkBars: BAR }),
    tracker(CHOIR_CLIMAX, { start: C_START, velocity: 0.75, checkBars: BAR }),
    tracker('C#4:4 | C#4:2 E4:2', { start: BUILD_START, velocity: 0.45, checkBars: BAR }),
    // Was G#4/C#5 here, a semitone off BUILD_CHORDS' F#m and G# respectively.
    tracker('A4:4 | G#4:2 C5:2', { start: BUILD_START + 8, velocity: 0.62, checkBars: BAR }),
    tracker(CHOIR_PHRASE1, { start: A2_START, velocity: 0.82, checkBars: BAR }),
    tracker(CHOIR_PHRASE2, { start: A2_START + 16, velocity: 0.88, checkBars: BAR }),
    tracker(CHOIR_CLIMAX, { start: D_START, velocity: 0.85, checkBars: BAR }),
    tracker(CHOIR_D_TAIL, { start: D_START + 32, velocity: 0.9, checkBars: BAR }),
  );
}

// ------------------------------------------------------------ strings-short

function ostinato(
  chords: string[],
  start: number,
  vel: number,
  pattern: number[] = [0, 1, 2, 1],
  barBeats = BAR,
): Note[] {
  const notes: Note[] = [];
  const steps = Math.round(barBeats / 0.25);
  chords.forEach((symbol, bar) => {
    if (symbol === '-' || symbol === '') return;
    const tones = chordMidis(symbol, { octave: 4, center: 73 });
    for (let s = 0; s < steps; s++) {
      const idx = pattern[s % pattern.length]!;
      const tone = tones[idx % tones.length]! + 12 * Math.floor(idx / tones.length);
      notes.push([start + bar * barBeats + s * 0.25, 0.2, tone, s === 0 ? Math.min(1, vel * 1.15) : vel]);
    }
  });
  return notes;
}

function ostinatoLine(): Note[] {
  return concatNotes(
    // A/A2/turn spell A_HALF/HALF_UNIT at 2-beat grain so the ostinato tracks
    // the lament bass's own chord changes instead of holding one triad
    // across a bar that secretly has two.
    ostinato(A_HALF, A_START, 0.42, undefined, 2),
    ostinato(C_CHORDS, C_START, 0.55, [0, 1, 2, 3]),
    ostinato(BUILD_CHORDS, BUILD_START, 0.5),
    ostinato(A_HALF, A2_START, 0.5, undefined, 2),
    ostinato(D_CHORDS, D_START, 0.6, [0, 1, 2, 3]),
    ostinato(HALF_UNIT, TURN_START, 0.48, undefined, 2),
  );
}

// --------------------------------------------------------------- taiko + timpani

function taikoLine(): Note[] {
  return concatNotes(
    drumLine('X.......', { start: 0, step: 0.5, pitch: 'C2', velocity: 0.5, times: 4 }),
    drumLine('X.x.X.x.', { start: A_START, step: 0.5, pitch: 'C2', velocity: 0.68, times: 8 }),
    drumLine('x...x...', { start: B_START, step: 0.5, pitch: 'C2', velocity: 0.4, times: 8 }),
    drumLine('X.x.X.x.', { start: C_START, step: 0.5, pitch: 'C2', velocity: 0.8, times: 8 }),
    drumLine('x.x.x.x.', { start: BUILD_START, step: 0.5, pitch: 'C2', velocity: 0.45, times: 2 }),
    drumLine('X.X.X.X.', { start: BUILD_START + 8, step: 0.5, pitch: 'C2', velocity: 0.72, times: 2 }),
    drumLine('X.x.X.x.', { start: A2_START, step: 0.5, pitch: 'C2', velocity: 0.78, times: 8 }),
    drumLine('X.x.X.x.', { start: D_START, step: 0.5, pitch: 'C2', velocity: 0.85, times: 12 }),
    drumLine('X.X.X.x.', { start: TURN_START, step: 0.5, pitch: 'C2', velocity: 0.75, times: 4 }),
  );
}

function timpaniHits(chords: string[], start: number, vel: number): Note[] {
  return chordRoots(chords, 2).map((midi, bar): Note => [start + bar * BAR, 1.6, midi, vel]);
}

/** A rolling crescendo on each bar's (or half-bar's) own root — used for the final turnaround into the loop. */
function timpaniBuildRoll(chords: string[], start: number, velFrom: number, velTo: number, barBeats = BAR): Note[] {
  const roots = chordRoots(chords, 2);
  const notes: Note[] = [];
  const hits = Math.round(barBeats / 0.5);
  roots.forEach((root, bar) => {
    const at = start + bar * barBeats;
    const t = roots.length > 1 ? bar / (roots.length - 1) : 0;
    const vel = velFrom + (velTo - velFrom) * t;
    for (let s = 0; s < hits; s++) notes.push([at + s * 0.5, 0.5, root, vel * (s % 2 === 0 ? 1 : 0.7)]);
  });
  return notes;
}

function timpaniLine(): Note[] {
  return concatNotes(
    // These stay on the old per-bar UNIT/A_CHORDS: a 1.6-beat hit at the
    // downbeat never rings into the bar's second half-bar chord, and the
    // downbeat root is the same either way (that's how HALF_UNIT was built).
    timpaniHits(A_CHORDS, A_START, 0.6),
    timpaniHits(B_CHORDS, B_START, 0.4),
    timpaniHits(C_CHORDS, C_START, 0.72),
    timpaniHits(A_CHORDS, A2_START, 0.7),
    timpaniHits(D_CHORDS, D_START, 0.76),
    // The turn rolls at half-bar grain now too — the old per-bar roll held
    // one pitch across two different chords (e.g. B ringing under F#/A#).
    timpaniBuildRoll(HALF_UNIT, TURN_START, 0.4, 0.75, 2),
  );
}

// -------------------------------------------------------------- brass stabs

function stabs(chords: string[], start: number, offsets: number[], vel: number, barBeats = BAR): Note[] {
  const notes: Note[] = [];
  chords.forEach((symbol, bar) => {
    if (symbol === '-' || symbol === '') return;
    const tones = chordMidis(symbol, { octave: 4, center: 64 });
    for (const offset of offsets) for (const midi of tones) notes.push([start + bar * barBeats + offset, 0.28, midi, vel]);
  });
  return notes;
}

function stabsLine(): Note[] {
  return concatNotes(
    stabs(['C#m'], 0, [0], 0.7),
    // A/A2/turn read A_HALF/HALF_UNIT at 2-beat grain (offset 1 = the "and"
    // of each half-bar) so a stab always spells the chord that's actually
    // sounding under it, not the bar's opening chord for all 4 beats.
    stabs(A_HALF, A_START, [1], 0.6, 2),
    stabs(C_CHORDS, C_START, [0, 1.5, 2.5, 3.5], 0.75),
    stabs(BUILD_CHORDS, BUILD_START, [2, 3], 0.55),
    stabs(A_HALF, A2_START, [1], 0.68, 2),
    stabs(D_CHORDS, D_START, [0, 2], 0.78),
    stabs(HALF_UNIT, TURN_START, [0, 1], 0.7, 2),
  );
}

// --------------------------------------------------------- low brass: SENDING

function sendingLine(): Note[] {
  return concatNotes(
    motif(augment(SENDING, 2), [B_START, B_START + 16], ['C#3', 'C#3']),
    // On C#3 the motif's middle segment (offset +2 = D#) held through
    // D_CHORDS[5]'s 'E' a semitone off; B2 keeps every segment (B, D, C#) a
    // chord tone or a safe whole step from E/C#m/B, the three chords it
    // now crosses.
    motif(augment(SENDING, 1.5), [D_START + 16], ['B2']),
  );
}

// ------------------------------------------------------------------- bell

function bellTolls(): Note[] {
  return [
    [0, 4, 'C#3', 0.55],
    [B_START, 4, 'C#3', 0.45],
    [INTERLUDE_START, 5, 'G#2', 0.5],
    [A2_START, 4, 'C#3', 0.62],
    [D_START, 4, 'G#2', 0.58],
  ];
}

export const seymourTrack: Track = {
  name: 'boss-seymour',
  bpm: 132,
  timeSig: [4, 4],
  loop: { start: A_START, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.76, damp: 0.35, width: 0.92, preDelay: 0.02 },
    delay: { timeBeats: 0.5, feedback: 0.24, damp: 2500 },
  },
  channels: [
    { name: 'organ', instrument: 'organ', volume: 0.85, pan: 0, notes: organLine(), fx: { reverb: 0.3 } },
    { name: 'choir', instrument: 'choir', volume: 0.85, pan: -0.05, notes: choirLine(), fx: { reverb: 0.42 } },
    { name: 'strings-short', instrument: 'strings-short', volume: 0.45, pan: 0.3, notes: ostinatoLine(), fx: { reverb: 0.22 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.7, pan: -0.15, notes: taikoLine(), fx: { reverb: 0.2 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.65, pan: 0.15, notes: timpaniLine(), fx: { reverb: 0.28 } },
    { name: 'brass stabs', instrument: 'brass-stab', volume: 0.55, pan: -0.25, notes: stabsLine(), fx: { reverb: 0.18 } },
    { name: 'low brass sending', instrument: 'brass', volume: 0.6, pan: 0.2, notes: sendingLine(), fx: { reverb: 0.32, delay: 0.15 } },
    { name: 'bell', instrument: 'bell', volume: 0.5, pan: 0.35, notes: bellTolls(), fx: { reverb: 0.55, delay: 0.25 } },
  ],
};

export default seymourTrack;
