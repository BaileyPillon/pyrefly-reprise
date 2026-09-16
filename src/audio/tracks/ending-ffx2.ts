/**
 * "Wherever the Tide Takes Me" — FFX-2 ending / credits ballad.
 *
 * ORIGINAL COMPOSITION. Bb major, 84 bpm — a heartfelt pop ballad for two
 * lovers finally at peace and a heroine choosing her own future. The verse
 * lets the flute sing `augment(SPHERE_HOOK, 2)` slowed into a tender phrase;
 * the chorus carries `LENNE` reworked into the major (its 3rd raised, its
 * closing note resolved home) over a supersaw pad and strings. Drums and bass
 * enter with chorus 2 — the last third of the song — and build through the
 * modulated final chorus, which is the loudest passage in the piece: it steps
 * up a whole step to C major with `PYREFLY_RISE_MAJOR` echoing in celesta and
 * bell — FFX and FFX-2's themes meeting for a moment — before a short pivot
 * walks the harmony back down to Bb for a clean loop.
 *
 * Form (4/4, 60 bars, 171.4 s):
 *   bars  1- 4  intro       beats   0- 16  epiano solo vamp
 *   bars  5-12  verse 1     beats  16- 48  soft: epiano+strings, flute sings the augmented hook  <- loop start
 *   bars 13-20  verse 2     beats  48- 80  same shape, reharmonised, flute develops it
 *   bars 21-24  pre-chorus  beats  80- 96  strings swell, IV-V-iii-vi build
 *   bars 25-32  chorus 1    beats  96-128  LENNE_MAJOR in supersaw pad + strings + flute
 *   bars 33-36  bridge      beats 128-144  bare epiano, borrowed iv, "her own future"
 *   bars 37-40  pre-chorus  beats 144-160  builds again
 *   bars 41-48  chorus 2    beats 160-192  drums+bass enter here — the last third — fuller than chorus 1
 *   bars 49-56  chorus 3    beats 192-224  modulates to C major; PYREFLY_RISE_MAJOR cameo; loudest section
 *   bars 57-60  coda        beats 224-240  quiet epiano throughout, pivots C -> Bb for the loop
 * The loop runs 16 -> 240: the coda stays gentle to its last bar, which lands on
 * Bb — the same chord the loop reopens on — so the wrap doesn't lurch.
 */

import {
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  tracker,
  type Note,
  type Pitch,
  type Track,
} from '../score.ts';
import { augment, cell, LENNE, PYREFLY_RISE_MAJOR, SPHERE_HOOK } from './motifs.ts';

const BAR = 4;
const INTRO = 0;
const VERSE1 = 16;
const VERSE2 = 48;
const PRECHORUS1 = 80;
const CHORUS1 = 96;
const BRIDGE = 128;
const PRECHORUS2 = 144;
const CHORUS2 = 160;
const MODCHORUS = 192;
const CODA = 224;
const LENGTH = 240;
const LOOP_START = VERSE1;
// Drums and bass enter with CHORUS2, which lands exactly on the last third of the 171.4s form.

const INTRO_CHORDS = ['Bb', 'Eb', 'Bb', 'F'];
const VERSE1_CHORDS = ['Bb', 'Gm', 'Eb', 'F', 'Bb', 'Gm7', 'Cm', 'F'];
const VERSE2_CHORDS = ['Bb', 'Cm', 'Eb', 'F', 'Gm', 'Cm7', 'Eb', 'F'];
const PRECHORUS_CHORDS = ['Eb', 'F', 'Dm', 'Gm']; // IV - V - iii - vi
// I IV V vi, borrowed bVII colour. Indices 2 and 7 are 'Fsus4' (not 'F') because the chorus
// melody holds the tonic Bb there — over plain F that Bb sits a semitone above the chord's
// own 3rd (A); sus4 swaps that A for Bb, so the melody note IS the chord tone and the chord
// still pulls onward to resolve.
const CHORUS_CHORDS = ['Bb', 'Eb', 'Fsus4', 'Gm', 'Bb', 'Eb', 'Ab', 'Fsus4'];
const BRIDGE_CHORDS = ['Cm', 'Ebm', 'Bb', 'F']; // ii, borrowed iv colour, I, V
// Same shape up a step; indices 2 and 7 are 'Gsus4' for the same reason ('C' held by the
// melody would sit a semitone above G's own 3rd, B).
const MODCHORUS_CHORDS = ['C', 'F', 'Gsus4', 'Am', 'C', 'F', 'Bb', 'Gsus4'];
const CODA_CHORDS = ['C', 'Am', 'F', 'Bb']; // a short, even pivot from C major back down to Bb

/** The verse's tender phrase: SPHERE_HOOK stretched to twice its length. */
const AUG_HOOK: Note[] = augment(SPHERE_HOOK, 2);

/** LENNE with its 3rd raised to the major and its last note resolved home to the tonic. */
const LENNE_MAJOR: Note[] = LENNE.map((n) => [...n] as Note);
LENNE_MAJOR[2] = [LENNE_MAJOR[2]![0], LENNE_MAJOR[2]![1], 4, LENNE_MAJOR[2]![3]];
LENNE_MAJOR[5] = [LENNE_MAJOR[5]![0], LENNE_MAJOR[5]![1], 0, LENNE_MAJOR[5]![3]];

/** A broader climax variant: the same tonic -> 3rd -> 5th -> home shape as LENNE_MAJOR, but
 * each note held long instead of split into short passing notes. LENNE_MAJOR's first bar packs
 * four short attacks against its second bar's one long note, and a short note spends more of
 * itself in the attack/decay ramp than a long one — so on the modulated final chorus (meant to
 * be the loudest passage) that first bar was reading noticeably quieter every other bar. */
const LENNE_MAJOR_WIDE: Note[] = [
  [0, 2, 0],
  [2, 2, 4],
  [4, 3, 7],
  [7, 1, 0],
];

function introEpiano(): Note[] {
  return chordLine(INTRO_CHORDS, { start: INTRO, octave: 4, center: 67, velocity: 0.4, dur: 3.6, roll: 0.08 });
}

/** A flat, gentle level through all four coda bars — not a whisper, not a swell. */
function codaEpiano(): Note[] {
  return chordLine(CODA_CHORDS, { start: CODA, octave: 4, center: 65, velocity: 0.32, dur: 3.6, roll: 0.1 });
}

function epianoLine(): Note[] {
  return concatNotes(
    introEpiano(),
    // epiano's amplitude is 0.4+0.7*velocity with velocity clamped to >=0.05 (see voices/band.ts),
    // so 0.05 is the floor on loudness — verse 1 also shortens `dur` well below the bar so the
    // chord rings then falls silent instead of sustaining full-bar, cutting real time-averaged
    // energy that the velocity floor alone can't touch.
    chordLine(VERSE1_CHORDS, { start: VERSE1, octave: 4, center: 65, velocity: 0.05, dur: 1.6, roll: 0.05 }),
    chordLine(VERSE2_CHORDS, { start: VERSE2, octave: 4, center: 65, velocity: 0.08, dur: 2.2, roll: 0.05 }),
    chordLine(PRECHORUS_CHORDS, { start: PRECHORUS1, octave: 4, center: 67, velocity: 0.28, dur: 3.7, roll: 0.04 }),
    chordLine(CHORUS_CHORDS, { start: CHORUS1, octave: 4, center: 69, velocity: 0.42, dur: 3.7, roll: 0.03 }),
    chordLine(BRIDGE_CHORDS, { start: BRIDGE, octave: 4, center: 63, velocity: 0.17, dur: 3.6, roll: 0.08 }),
    chordLine(PRECHORUS_CHORDS, { start: PRECHORUS2, octave: 4, center: 67, velocity: 0.32, dur: 3.7, roll: 0.04 }),
    // Chorus 2 tops chorus 1, but both stay well under the modulated chorus's ceiling.
    chordLine(CHORUS_CHORDS, { start: CHORUS2, octave: 4, center: 69, velocity: 0.4, dur: 3.7, roll: 0.03 }),
    // The modulated final chorus must clearly outweigh both — every layer here runs hottest.
    chordLine(MODCHORUS_CHORDS, { start: MODCHORUS, octave: 4, center: 71, velocity: 1, dur: 3.7, roll: 0.02 }),
    codaEpiano(),
  );
}

function stringsLine(): Note[] {
  return concatNotes(
    // Same idea: velocity stays at the floor, and `dur` is cut hard so the chord doesn't
    // sustain through the whole bar.
    chordLine(VERSE1_CHORDS, { start: VERSE1, octave: 3, center: 57, velocity: 0.05, dur: 1.7 }),
    chordLine(VERSE2_CHORDS, { start: VERSE2, octave: 3, center: 57, velocity: 0.07, dur: 2.3 }),
    chordLine(PRECHORUS_CHORDS, { start: PRECHORUS1, octave: 3, center: 59, velocity: 0.26, dur: 3.85 }),
    chordLine(CHORUS_CHORDS, { start: CHORUS1, octave: 3, center: 60, velocity: 0.32, dur: 3.85 }),
    chordLine(PRECHORUS_CHORDS, { start: PRECHORUS2, octave: 3, center: 59, velocity: 0.28, dur: 3.85 }),
    chordLine(CHORUS_CHORDS, { start: CHORUS2, octave: 3, center: 60, velocity: 0.34, dur: 3.85 }),
    chordLine(MODCHORUS_CHORDS, { start: MODCHORUS, octave: 3, center: 62, velocity: 0.95, dur: 3.85 }),
    chordLine(CODA_CHORDS, { start: CODA, octave: 3, center: 58, velocity: 0.24, dur: 3.8 }),
  );
}

function supersawPad(): Note[] {
  return concatNotes(
    chordLine(CHORUS_CHORDS, { start: CHORUS1, octave: 4, center: 72, velocity: 0.4, dur: 3.8, roll: 0.03 }),
    chordLine(CHORUS_CHORDS, { start: CHORUS2, octave: 4, center: 72, velocity: 0.42, dur: 3.8, roll: 0.03 }),
    chordLine(MODCHORUS_CHORDS, { start: MODCHORUS, octave: 4, center: 74, velocity: 1, dur: 3.8, roll: 0.02 }),
  );
}

/** Four statements of a chorus hook cell, each spanning 2 bars, building in velocity. */
function chorusMelody(pattern: Note[], startBeat: number, tonic: Pitch, velocities: number[]): Note[] {
  return concatNotes(...velocities.map((v, i) => cell(pattern, startBeat + i * 8, tonic, v)));
}

function fluteLine(): Note[] {
  return concatNotes(
    // flute's loudness is 0.55+0.6*velocity (clamped >=0.05) — a narrow ~2x range top to
    // bottom, so verse 1 sits at the floor and leans on strings/epiano for most of the drop.
    cell(AUG_HOOK, VERSE1, 'Bb4', 0.05),
    tracker('D5:1.5 C5:0.5 Bb4:1 -:1 | Eb4:1.5 D4:0.5 C4:2 |', { start: VERSE1 + 8, velocity: 0.05, checkBars: BAR }),
    cell(AUG_HOOK, VERSE1 + 16, 'Bb4', 0.05),
    tracker('Eb5:1 D5:1 C5:1 Bb4:1 | C5:2 -:2 |', { start: VERSE1 + 24, velocity: 0.05, checkBars: BAR }),
    tracker('Bb4:2 D5:1 C5:1 | Eb5:1.5 D5:0.5 C5:2 |', { start: VERSE2, velocity: 0.09, checkBars: BAR }),
    tracker('F5:1 Eb5:1 D5:2 | C5:1.5 Bb4:0.5 -:2 |', { start: VERSE2 + 8, velocity: 0.1, checkBars: BAR }),
    cell(AUG_HOOK, VERSE2 + 16, 'C5', 0.1),
    tracker('D5:1 C5:1 Bb4:2 | Eb5:1.5 D5:0.5 C5:2 |', { start: VERSE2 + 24, velocity: 0.11, checkBars: BAR }),
    tracker('-:2 D5:1 Eb5:1 | F5:2 G5:2 | -:4 | Bb5:3 -:1 |', { start: PRECHORUS1, velocity: 0.34, checkBars: BAR }),
    chorusMelody(LENNE_MAJOR, CHORUS1, 'Bb4', [0.44, 0.48, 0.51, 0.55]),
    tracker('-:3 Eb5:1 | -:4 |', { start: BRIDGE, velocity: 0.24, checkBars: BAR }),
    tracker('-:2 D5:1 C5:1 | Bb4:2 -:2 |', { start: BRIDGE + 8, velocity: 0.22, checkBars: BAR }),
    tracker('-:2 D5:1 Eb5:1 | F5:1.5 G5:0.5 A5:2 | -:4 | Bb5:3 -:1 |', {
      start: PRECHORUS2,
      velocity: 0.38,
      checkBars: BAR,
    }),
    // Chorus 2 tops chorus 1, but both stay well under the modulated chorus's ceiling.
    chorusMelody(LENNE_MAJOR, CHORUS2, 'Bb4', [0.5, 0.53, 0.56, 0.6]),
    // The modulated final chorus uses the WIDE variant (see above) so it doesn't dip every
    // other bar, and tops both — the emotional peak is also the loudest passage.
    chorusMelody(LENNE_MAJOR_WIDE, MODCHORUS, 'C5', [1, 1, 1, 1]),
    // A single quiet closing gesture — no held last-bar note, nothing to swell the seam.
    tracker('-:2 C5:1 Bb4:1', { start: CODA, velocity: 0.25 }),
  );
}

function celestaLine(): Note[] {
  return concatNotes(cell(PYREFLY_RISE_MAJOR, MODCHORUS, 'C5', 0.85), cell(PYREFLY_RISE_MAJOR, MODCHORUS + 16, 'C5', 0.9));
}

function bellLine(): Note[] {
  return concatNotes(
    cell(PYREFLY_RISE_MAJOR, MODCHORUS + 0.5, 'C6', 0.6),
    cell(PYREFLY_RISE_MAJOR, MODCHORUS + 16.5, 'C6', 0.65),
  );
}

/** The bass voice under chorus 2: silent until the drums arrive, then roots the section. */
function bassLine(): Note[] {
  const notes: Note[] = [];
  const chorus2Roots = chordRoots(CHORUS_CHORDS, 1);
  for (let i = 0; i < 8; i++) notes.push([CHORUS2 + i * BAR, 3.7, chorus2Roots[i]!, 0.1] as Note);
  return notes;
}

/** The modulated final chorus swaps to a pure sine sub instead of the synth-bass — spectrally
 * uncontested, so it adds real low-end weight without fighting the same clipping a busier
 * voice would. Still only one bass voice sounding at any moment; nothing plays in the coda. */
function subLine(): Note[] {
  const notes: Note[] = [];
  const modRoots = chordRoots(MODCHORUS_CHORDS, 1);
  for (let i = 0; i < 8; i++) notes.push([MODCHORUS + i * BAR, 3.8, modRoots[i]!, 1] as Note);
  return notes;
}

function kickLine(): Note[] {
  return concatNotes(
    drumLine('X.x.', { start: CHORUS2, step: 1, pitch: 'C0', velocity: 0.1, times: 8 }),
    drumLine('X.x.', { start: MODCHORUS, step: 1, pitch: 'C0', velocity: 0.95, times: 8 }),
  );
}

function clapLine(): Note[] {
  return concatNotes(
    drumLine('.x.x', { start: CHORUS2, step: 1, pitch: 'C4', velocity: 0.1, times: 8 }),
    drumLine('.x.x', { start: MODCHORUS, step: 1, pitch: 'C4', velocity: 0.8, times: 8 }),
  );
}

function hatsLine(): Note[] {
  return concatNotes(
    drumLine('x.x.x.x.', { start: CHORUS2, step: 0.5, pitch: 'F#3', velocity: 0.14, times: 8 }),
    drumLine('x.x.x.x.', { start: MODCHORUS, step: 0.5, pitch: 'F#3', velocity: 0.46, times: 8 }),
  );
}

/** On the first and fifth bars of the modulated chorus — the same two downbeats where the
 * PYREFLY_RISE_MAJOR cameo lands in celesta/bell. */
function crashLine(): Note[] {
  return [
    [MODCHORUS, 1.8, 'C5', 0.78],
    [MODCHORUS + 16, 1.8, 'C5', 0.78],
  ] as Note[];
}

export const endingFfx2Track: Track = {
  name: 'ending-ffx2',
  bpm: 84,
  timeSig: [4, 4],
  loop: { start: LOOP_START, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  fx: {
    reverb: { room: 0.72, damp: 0.32, width: 0.92, preDelay: 0.025 },
    delay: { timeBeats: 0.75, feedback: 0.24, damp: 2600 },
  },
  channels: [
    { name: 'epiano', instrument: 'epiano', volume: 0.85, pan: -0.08, notes: epianoLine(), fx: { reverb: 0.3 } },
    { name: 'strings', instrument: 'strings', volume: 0.55, pan: 0.1, notes: stringsLine(), fx: { reverb: 0.45 } },
    { name: 'flute', instrument: 'flute', volume: 0.75, pan: 0.04, notes: fluteLine(), fx: { reverb: 0.35 } },
    { name: 'supersaw pad', instrument: 'supersaw', volume: 0.4, pan: 0, notes: supersawPad(), fx: { reverb: 0.4 } },
    { name: 'celesta', instrument: 'celesta', volume: 0.45, pan: 0.3, notes: celestaLine(), fx: { reverb: 0.5, delay: 0.3 } },
    { name: 'bell', instrument: 'bell', volume: 0.3, pan: -0.3, notes: bellLine(), fx: { reverb: 0.55, delay: 0.35 } },
    { name: 'bass', instrument: 'synth-bass', volume: 0.7, pan: 0, notes: bassLine() },
    { name: 'sub', instrument: 'bass-sub', volume: 0.85, pan: 0, notes: subLine() },
    { name: 'kick', instrument: 'kick-808', volume: 0.75, pan: 0, notes: kickLine() },
    { name: 'clap', instrument: 'clap', volume: 0.5, pan: 0, notes: clapLine(), fx: { reverb: 0.15 } },
    { name: 'hats', instrument: 'hat', volume: 0.3, pan: 0.18, notes: hatsLine() },
    { name: 'crash', instrument: 'crash', volume: 0.45, pan: 0.1, notes: crashLine(), fx: { reverb: 0.35 } },
  ],
};

export default endingFfx2Track;
