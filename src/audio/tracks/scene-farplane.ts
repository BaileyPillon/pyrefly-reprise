/**
 * "Where the Pyreflies Rest" — the Farplane.
 *
 * ORIGINAL COMPOSITION. The afterlife: an endless field of flowers and
 * drifting lights where the dead can be glimpsed. E major, 92 bpm, ethereal
 * and bittersweet — the place where the two games meet. FFX's own rising
 * question (now resolved into major, at peace) is answered by the first half
 * of FFX-2's love-and-loss line, held a fourth apart in F# dorian so every
 * pitch still belongs to the home key.
 *
 * Form (4/4, 38 bars, 99 s):
 *   bars  1- 4  intro   beats   0- 16   pad fades in, harp begins
 *   bars  5-14  A       beats  16- 56   flute states the rising question    <- loop start
 *   bars 15-24  B       beats  56- 96   epiano answers with Lenne's ache; soft pulse enters
 *   bars 25-34  A2      beats  96-136   both themes interweave, celesta motes
 *   bars 35-38  outro   beats 136-152   pulse recedes, turnaround into the loop
 * The loop runs 16 -> 152.
 */

import { arpLine, chordLine, concatNotes, drumLine, tracker, type Note, type Track } from '../score.ts';
import { LENNE, PYREFLY_RISE_MAJOR, cell } from './motifs.ts';

const BAR = 4;

const INTRO_CHORDS = ['E', 'C#m', 'A', 'B'];
const A_CHORDS = ['E', 'B', 'C#m', 'A', 'E', 'B', 'F#m', 'A', 'B', 'E'];
const B_CHORDS = ['C#m', 'A', 'F#m', 'B', 'E', 'C#m', 'A', 'B', 'E', 'B'];
const A2_CHORDS = ['E', 'C#m', 'A', 'B', 'F#m', 'A', 'E', 'B', 'C#m', 'E'];
const OUTRO_CHORDS = ['A', 'F#m', 'B', 'B'];

const INTRO = 0;
const A = 16;
const B = 56;
const A2 = 96;
const OUTRO = 136;
const LENGTH = 152;

/** The first half of Lenne, stamped a fourth below the melody's E on F# — its own dorian degree. */
const LENNE_FIRST_HALF = LENNE.filter((n) => n[0] < 4);

function harpArpeggio(): Note[] {
  return concatNotes(
    arpLine(INTRO_CHORDS, { start: INTRO, pattern: [0, 2, 3, 4, 3, 2], step: 0.5, dur: 0.9, octave: 3, center: 64, velocity: 0.3, accent: 1.1 }),
    arpLine(A_CHORDS, { start: A, pattern: [0, 2, 3, 4, 3, 2], step: 0.5, dur: 0.9, octave: 3, center: 64, velocity: 0.4, accent: 1.15 }),
    arpLine(B_CHORDS, { start: B, pattern: [0, 1, 2, 3, 2, 1], step: 0.5, dur: 0.9, octave: 3, center: 64, velocity: 0.56, accent: 1.1 }),
    arpLine(A2_CHORDS, { start: A2, pattern: [0, 2, 3, 4, 3, 2], step: 0.5, dur: 0.9, octave: 3, center: 66, velocity: 0.42, accent: 1.15 }),
    // Outro bars 1-2 recede; bars 3-4 swell back up into the loop with a denser flourish.
    arpLine(OUTRO_CHORDS.slice(0, 2), { start: OUTRO, pattern: [0, 2, 3, 2], step: 0.5, dur: 1.4, octave: 3, center: 64, velocity: 0.28, accent: 1.05 }),
    arpLine(OUTRO_CHORDS.slice(2), { start: OUTRO + 2 * BAR, pattern: [0, 1, 2, 3, 4, 3, 2, 1], step: 0.25, dur: 0.5, octave: 3, center: 66, velocity: 0.44, accent: 1.2 }),
  );
}

function softPad(): Note[] {
  return concatNotes(
    chordLine(INTRO_CHORDS, { start: INTRO, octave: 3, center: 64, velocity: 0.12, dur: 3.9, roll: 0.2 }),
    chordLine(A_CHORDS, { start: A, octave: 3, center: 64, velocity: 0.2, dur: 3.95 }),
    chordLine(B_CHORDS, { start: B, octave: 3, center: 64, velocity: 0.4, dur: 3.95 }),
    chordLine(A2_CHORDS, { start: A2, octave: 3, center: 64, velocity: 0.26, dur: 3.95 }),
    chordLine(OUTRO_CHORDS.slice(0, 2), { start: OUTRO, octave: 3, center: 64, velocity: 0.16, dur: 3.9 }),
    chordLine(OUTRO_CHORDS.slice(2), { start: OUTRO + 2 * BAR, octave: 3, center: 64, velocity: 0.34, dur: 3.95, roll: 0.1 }),
  );
}

/**
 * One long-held low pedal per section (not restruck every bar) — a floor that stays put
 * regardless of the harp's history-dependent ring-out or which chord happens to fall where,
 * so the quietest bars in a section are never far below its loudest.
 */
function pedalFloor(): Note[] {
  return [
    [B, B_CHORDS.length * BAR - 0.2, 'E3', 0.3],
    [A2, A2_CHORDS.length * BAR - 0.2, 'E3', 0.22],
  ];
}

function epianoChords(): Note[] {
  return concatNotes(
    chordLine(A_CHORDS, { start: A, octave: 4, center: 68, velocity: 0.34, dur: 3.5 }),
    chordLine(B_CHORDS, { start: B, octave: 4, center: 68, velocity: 0.5, dur: 3.5 }),
    chordLine(A2_CHORDS, { start: A2, octave: 4, center: 68, velocity: 0.42, dur: 3.5 }),
    chordLine(OUTRO_CHORDS.slice(0, 2), { start: OUTRO, octave: 4, center: 68, velocity: 0.3, dur: 3.5 }),
    chordLine(OUTRO_CHORDS.slice(2), { start: OUTRO + 2 * BAR, octave: 4, center: 68, velocity: 0.44, dur: 3.9 }),
  );
}

/** Epiano's top line: FFX-2's ache answering the flute, always on F# (its diatonic dorian home). */
function epianoLenneAnswer(): Note[] {
  return concatNotes(
    cell(LENNE_FIRST_HALF, B + 4, 'F#4', 0.52),
    // Re-timed from beat 20 (a 'C#m' bar, where the cell's A held a semitone above the chord's G#)
    // to beat 24 ('A'), where every note of the cell lands on or below a chord tone.
    cell(LENNE_FIRST_HALF, B + 24, 'F#4', 0.56),
    cell(LENNE_FIRST_HALF, A2 + 8, 'F#4', 0.58),
    // Two quiet chord-tone pings between the Lenne statements — B_CHORDS[3]/[7] are both 'B',
    // and these bars otherwise carry no melodic motion at all, reading much thinner than their neighbours.
    tracker('F#4:2 D#4:2', { start: B + 12, velocity: 0.4 }),
    tracker('F#4:2 D#4:2', { start: B + 28, velocity: 0.4 }),
  );
}

/** Flute's lead: FFX's rising question, now resolved into major, at peace. */
function fluteLead(): Note[] {
  return concatNotes(
    // Started right on the A downbeat instead of beat +4, so the held E4 lands on 'E' (its own
    // root) rather than the following 'B' bar, where it sat a semitone above the chord's D#.
    cell(PYREFLY_RISE_MAJOR, A, 'E4', 0.55),
    tracker('G#4:1 F#4:1 E4:2 | D#4:3 -:1', { start: A + 12, velocity: 0.48, checkBars: BAR }),
    cell(PYREFLY_RISE_MAJOR, A + 24, 'E4', 0.6),
    tracker('B4:2 A4:2 | G#4:3 E4:1', { start: A + 32, velocity: 0.28, checkBars: BAR }),
    tracker('E5:2 D#5:1 C#5:1 | B4:3 -:1', { start: A2 + 0, velocity: 0.44, checkBars: BAR }),
    cell(PYREFLY_RISE_MAJOR, A2 + 16, 'E4', 0.38),
    tracker('F#4:2 G#4:2 | A4:3 -:1', { start: A2 + 24, velocity: 0.3, checkBars: BAR }),
    cell(PYREFLY_RISE_MAJOR, OUTRO, 'E4', 0.35),
    // A last soft rising lift, timed to land right as the loop restarts.
    tracker('B4:1 C#5:1 D#5:1 E5:1', { start: OUTRO + 12, velocity: 0.5 }),
  );
}

/** Celesta motes: small falling glints, sparse. */
function celestaMotes(): Note[] {
  return concatNotes(
    tracker('B5:0.5 G#5:0.5 E5:0.5 B4:0.5', { start: A2 + 4, velocity: 0.32 }),
    tracker('C#6:0.5 A5:0.5 E5:0.5 C#5:0.5', { start: A2 + 20, velocity: 0.22 }),
    tracker('E6:0.5 B5:0.5 G#5:1', { start: A2 + 36, velocity: 0.3 }),
    tracker('A5:0.5 F#5:0.5 D#5:1', { start: OUTRO + 8, velocity: 0.26 }),
  );
}

/** A very soft heartbeat pulse — kick-808 given a short decay, for the middle section only. */
function softPulse(): Note[] {
  return drumLine('x...x...x...x...', { start: B, pitch: 'C2', velocity: 0.32, times: B_CHORDS.length });
}

function shakerPulse(): Note[] {
  return drumLine('x.x.x.x.x.x.x.x.', { start: B, pitch: 'C3', velocity: 0.22, times: B_CHORDS.length });
}

export const sceneFarplaneTrack: Track = {
  name: 'scene-farplane',
  bpm: 92,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  fx: {
    reverb: { room: 0.9, damp: 0.24, width: 1, preDelay: 0.04 },
    delay: { timeBeats: 1, feedback: 0.3, damp: 2200 },
  },
  channels: [
    { name: 'soft pad', instrument: 'supersaw', volume: 0.72, pan: 0, notes: softPad(), fx: { reverb: 0.55 } },
    { name: 'harp', instrument: 'harp', volume: 0.32, pan: -0.15, notes: harpArpeggio(), fx: { reverb: 0.4, delay: 0.15 } },
    { name: 'flute lead', instrument: 'flute', volume: 0.5, pan: 0.08, notes: fluteLead(), fx: { reverb: 0.35, delay: 0.12 } },
    { name: 'epiano chords', instrument: 'epiano', volume: 0.78, pan: 0.2, notes: epianoChords(), fx: { reverb: 0.4 } },
    { name: 'pedal floor', instrument: 'strings-low', volume: 0.5, pan: 0, notes: pedalFloor(), fx: { reverb: 0.4 } },
    { name: 'epiano answer', instrument: 'epiano', volume: 0.6, pan: -0.22, notes: epianoLenneAnswer(), fx: { reverb: 0.45, delay: 0.18 } },
    { name: 'celesta', instrument: 'celesta', volume: 0.38, pan: 0.3, notes: celestaMotes(), fx: { reverb: 0.55, delay: 0.3 } },
    { name: 'pulse', instrument: 'kick-808', volume: 0.35, pan: 0, notes: softPulse() },
    { name: 'shaker', instrument: 'shaker', volume: 0.3, pan: -0.1, notes: shakerPulse() },
  ],
};

export default sceneFarplaneTrack;
