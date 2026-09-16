/**
 * "Iron Undertow" — Bevelle's sunken machina ruins.
 *
 * ORIGINAL COMPOSITION. A labyrinth of ancient machine-ruins beneath a holy
 * city, where a doomsday weapon sleeps. G minor, 100 bpm, beat-driven and
 * tense: arp-pluck 16ths, synth-bass, half-time kick-808 + clap, and distant
 * metal-hit clangs like something moving deep in the walls.
 *
 * Form (4/4, 40 bars, 96 s):
 *   bars  1-4   intro      beats   0- 16   arp-pluck alone, pad fades in
 *   bars  5-12  A          beats  16- 48   full groove, hook fragment      <- loop start
 *   bars 13-20  A2         beats  48- 80   thicker groove, full hook cell
 *   bars 21-28  breakdown  beats  80-112   drums drop out, exposed hook
 *   bars 29-36  build      beats 112-144   drums return, hook doubled
 *   bars 37-40  turn       beats 144-160   turnaround into the loop
 * The loop runs 16 -> 160 so the intro plays once and the machine keeps turning.
 */

import {
  arpLine,
  barStarts,
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { SPHERE_HOOK, augment, cell } from './motifs.ts';

const BAR = 4;

const INTRO_CHORDS = ['Gm', 'Gm', 'Cm', 'D'];
const A_CHORDS = ['Gm', 'Eb', 'Cm', 'D', 'Gm', 'Bb', 'Cm', 'D'];
const A2_CHORDS = ['Gm', 'Eb', 'Cm', 'Bb', 'Gm', 'Eb', 'Cm', 'D'];
const BREAKDOWN_CHORDS = ['Gm', 'Gm', 'Cm', 'Cm', 'Eb', 'Eb', 'D', 'D'];
const BUILD_CHORDS = ['Gm', 'Eb', 'Cm', 'D', 'Gm', 'Bb', 'Cm', 'D'];
const TURN_CHORDS = ['Eb', 'Cm', 'D', 'D'];

const INTRO = 0;
const A = 16;
const A2 = 48;
const BREAKDOWN = 80;
const BUILD = 112;
const TURN = 144;
const LENGTH = 160;

/** Recast SPHERE_HOOK in minor: lower the 3rd (offset 4) and 6th (offset 9) a semitone. */
function toMinor(pattern: Note[]): Note[] {
  return pattern.map((n) => [n[0], n[1], n[2] === 4 ? 3 : n[2] === 9 ? 8 : n[2], n[3]] as Note);
}

const HOOK_MINOR = toMinor(SPHERE_HOOK);
const HOOK_FRAGMENT = HOOK_MINOR.slice(0, 3);
const TONIC = 'G4';

/** Over the tonic Gm itself, the hook's minor-6th (offset 8, beat 2) sits a semitone above
 * the chord's own 5th (D) — swap it back to the major 6th (offset 9), which clashes with nothing. */
const HOOK_MINOR_OVER_TONIC = HOOK_MINOR.map((n) => (n[0] === 2 ? ([n[0], n[1], 9, n[3]] as Note) : n));

/** Root-anchored 16th pluck, short and syncopated — synth-bass "octave pumping" cousin. */
const BASS_MOTIF: Note[] = [
  [0, 0.35, 0, 0.78],
  [0.5, 0.2, 0, 0.62],
  [1, 0.35, 0, 0.75],
  [1.5, 0.2, 7, 0.6],
  [2, 0.35, 0, 0.8],
  [2.5, 0.2, 0, 0.62],
  [3, 0.35, 12, 0.72],
  [3.5, 0.2, 7, 0.6],
];

const KICK_PATTERN = 'X......x........';
const KICK_PATTERN_BUILD = 'X......x...x....';
const CLAP_PATTERN = '........X.......';
const CLAP_PATTERN_BUILD = '........X....g..';
const HAT_PATTERN = 'x.x.x.x.x.x.x.x.';

function bassLine(): Note[] {
  const notes: Note[] = [];
  for (const { chords, start } of [
    { chords: A_CHORDS, start: A },
    { chords: A2_CHORDS, start: A2 },
    { chords: BUILD_CHORDS, start: BUILD },
    { chords: TURN_CHORDS, start: TURN },
  ]) {
    notes.push(...motif(BASS_MOTIF, barStarts(start, chords.length, BAR), chordRoots(chords, 1)));
  }
  // Breakdown: the beat drops, so the bass just holds the root — a pressure, not a pulse.
  const roots = chordRoots(BREAKDOWN_CHORDS, 1);
  for (let i = 0; i < BREAKDOWN_CHORDS.length; i += 2) {
    notes.push([BREAKDOWN + i * BAR, 6.5, roots[i]!, 0.5]);
  }
  return notes;
}

function kickLine(): Note[] {
  return concatNotes(
    drumLine(KICK_PATTERN, { start: A, pitch: 'C1', velocity: 0.82, times: 8 }),
    drumLine(KICK_PATTERN, { start: A2, pitch: 'C1', velocity: 0.86, times: 8 }),
    drumLine(KICK_PATTERN_BUILD, { start: BUILD, pitch: 'C1', velocity: 0.9, times: 8 }),
    drumLine(KICK_PATTERN_BUILD, { start: TURN, pitch: 'C1', velocity: 0.94, times: 4 }),
  );
}

function clapLine(): Note[] {
  return concatNotes(
    drumLine(CLAP_PATTERN, { start: A, pitch: 'C3', velocity: 0.7, times: 8 }),
    drumLine(CLAP_PATTERN, { start: A2, pitch: 'C3', velocity: 0.74, times: 8 }),
    drumLine(CLAP_PATTERN_BUILD, { start: BUILD, pitch: 'C3', velocity: 0.78, times: 8 }),
    drumLine(CLAP_PATTERN_BUILD, { start: TURN, pitch: 'C3', velocity: 0.82, times: 4 }),
  );
}

function hatLine(): Note[] {
  return concatNotes(
    drumLine(HAT_PATTERN, { start: A, pitch: 'F#3', velocity: 0.34, times: 8 }),
    drumLine(HAT_PATTERN, { start: A2, pitch: 'F#3', velocity: 0.38, times: 8 }),
    drumLine(HAT_PATTERN, { start: BUILD, pitch: 'F#3', velocity: 0.44, times: 8 }),
    drumLine(HAT_PATTERN, { start: TURN, pitch: 'F#3', velocity: 0.46, times: 4 }),
  );
}

function arpPluckLine(): Note[] {
  return concatNotes(
    arpLine(INTRO_CHORDS, { start: INTRO, pattern: [0, 2, 1, 2], step: 0.25, dur: 0.18, octave: 4, center: 72, velocity: 0.4, accent: 1.2 }),
    arpLine(A_CHORDS, { start: A, pattern: [0, 1, 2, 1], step: 0.25, dur: 0.18, octave: 4, center: 72, velocity: 0.48, accent: 1.25 }),
    arpLine(A2_CHORDS, { start: A2, pattern: [0, 2, 3, 2, 1, 0], step: 0.25, dur: 0.18, octave: 4, center: 74, velocity: 0.5, accent: 1.25 }),
    arpLine(BREAKDOWN_CHORDS, { start: BREAKDOWN, pattern: [0, 2], step: 1, dur: 0.8, octave: 4, center: 70, velocity: 0.34, accent: 1.1 }),
    arpLine(BUILD_CHORDS, { start: BUILD, pattern: [0, 1, 2, 3, 2, 1], step: 0.25, dur: 0.18, octave: 4, center: 74, velocity: 0.54, accent: 1.2 }),
    arpLine(TURN_CHORDS, { start: TURN, pattern: [0, 1, 2, 1], step: 0.25, dur: 0.18, octave: 4, center: 72, velocity: 0.52, accent: 1.2 }),
  );
}

function padBed(): Note[] {
  return concatNotes(
    chordLine(INTRO_CHORDS, { start: INTRO, octave: 2, center: 55, velocity: 0.16, dur: 3.8, roll: 0.15 }),
    chordLine(A_CHORDS, { start: A, octave: 2, center: 55, velocity: 0.3, dur: 3.9 }),
    chordLine(A2_CHORDS, { start: A2, octave: 2, center: 55, velocity: 0.36, dur: 3.9 }),
    chordLine(BREAKDOWN_CHORDS, { start: BREAKDOWN, octave: 2, center: 57, velocity: 0.42, dur: 3.95 }),
    chordLine(BUILD_CHORDS, { start: BUILD, octave: 2, center: 55, velocity: 0.44, dur: 3.9 }),
    chordLine(TURN_CHORDS, { start: TURN, octave: 2, center: 55, velocity: 0.4, dur: 3.9 }),
  );
}

function metalClangs(): Note[] {
  const hits: Note[] = [
    [6, 2, 'D3', 0.42],
    [13.5, 1.5, 'Eb3', 0.4],
    [30, 2, 'C3', 0.45],
    [44.5, 1.5, 'G3', 0.42],
    [58, 2, 'D3', 0.48],
    [73, 1.5, 'Bb2', 0.44],
    [86, 3, 'C3', 0.5],
    [98, 2.5, 'Eb3', 0.46],
    [108, 2, 'G2', 0.42],
    [122, 2, 'D3', 0.52],
    [136, 1.5, 'F3', 0.48],
    [150, 2, 'C3', 0.44],
  ];
  return hits;
}

function melodyLine(): Note[] {
  return concatNotes(
    cell(HOOK_FRAGMENT, A + 8, TONIC, 0.48),
    // Over 'D' (D F# A): A4/F#4 instead of Bb4, which sat a semitone above the chord's 5th.
    tracker('D5:1 C5:1 A4:2', { start: A + 12, velocity: 0.42 }),
    cell(HOOK_FRAGMENT, A + 24, TONIC, 0.54),
    cell(HOOK_MINOR, A2 + 4, TONIC, 0.6),
    // Over 'Bb' (Bb D F): F5 instead of Eb5, which sat a semitone above the chord's 3rd.
    tracker('F5:1 D5:1 C5:2', { start: A2 + 12, velocity: 0.48 }),
    cell(HOOK_MINOR, A2 + 20, TONIC, 0.66),
    // Over 'D' again: A4/F#4 (chord tones) instead of Bb4/G4.
    tracker('A4:2 F#4:2', { start: A2 + 28, velocity: 0.44 }),
    cell(augment(HOOK_FRAGMENT, 2), BREAKDOWN + 8, 'G3', 0.5),
    // Re-timed from beat 24 (a 'D' bar, where the fragment's root/3rd both clashed) to beat 20 ('Eb').
    cell(augment(HOOK_FRAGMENT, 2), BREAKDOWN + 20, 'G3', 0.56),
    // Over the tonic Gm, the safe (major-6th) variant — see HOOK_MINOR_OVER_TONIC above.
    cell(HOOK_MINOR_OVER_TONIC, BUILD, TONIC, 0.72),
    cell(HOOK_MINOR, BUILD + 8, TONIC, 0.78),
    // Over 'Gm': C5 lower-neighbour instead of Eb5, which sat a semitone above the chord's 5th.
    tracker('D5:1 C5:1 D5:2 | C5:2 Bb4:2', { start: BUILD + 16, velocity: 0.6, checkBars: BAR }),
    cell(HOOK_MINOR, BUILD + 24, TONIC, 0.82),
    cell(HOOK_FRAGMENT, TURN, TONIC, 0.48),
  );
}

export const sceneBevelleUndergroundTrack: Track = {
  name: 'scene-bevelle-underground',
  bpm: 100,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.78, damp: 0.35, width: 0.9, preDelay: 0.02 },
    delay: { timeBeats: 0.5, feedback: 0.28, damp: 2400 },
  },
  channels: [
    { name: 'arp-pluck', instrument: 'arp-pluck', volume: 0.5, pan: -0.22, notes: arpPluckLine(), fx: { reverb: 0.12, delay: 0.15 } },
    { name: 'synth-bass', instrument: 'synth-bass', volume: 0.85, pan: 0, notes: bassLine(), fx: { reverb: 0.05 } },
    { name: 'kick-808', instrument: 'kick-808', volume: 0.9, pan: 0, notes: kickLine() },
    { name: 'clap', instrument: 'clap', volume: 0.7, pan: 0.06, notes: clapLine(), fx: { reverb: 0.12 } },
    { name: 'hats', instrument: 'hat', volume: 0.4, pan: 0.24, notes: hatLine() },
    { name: 'dark pad', instrument: 'pad', volume: 0.55, pan: 0, notes: padBed(), fx: { reverb: 0.5 } },
    { name: 'metal clangs', instrument: 'metal-hit', volume: 0.55, pan: 0.3, notes: metalClangs(), fx: { reverb: 0.55, delay: 0.3 } },
    { name: 'machina hook', instrument: 'pwm-lead', volume: 0.75, pan: -0.1, notes: melodyLine(), fx: { reverb: 0.28, delay: 0.18 } },
  ],
};

export default sceneBevelleUndergroundTrack;
