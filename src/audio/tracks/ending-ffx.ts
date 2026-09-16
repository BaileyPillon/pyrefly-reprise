/**
 * "Tide, Answered" — FFX ending / credits theme.
 *
 * ORIGINAL COMPOSITION. The emotional answer to the title theme's A-minor
 * question: D major, 66 bpm. Solo piano opens with a hushed, minor-mode
 * memory of the title's rising cell (`PYREFLY_RISE`); strings enter and
 * build; a full strings-and-choir climax states the cell in augmentation
 * and major (`augment(PYREFLY_RISE_MAJOR, 2)`) over a bVI-bVII-I lift
 * (Bb -> C -> D) — the borrowed-chord colour that gives the climax its
 * lift out of plain D major; a quiet piano coda restates the cell once
 * more, softly, in major, and resolves.
 *
 * Form (4/4, 44 bars, 2:40):
 *   bars  1-8    intro     beats   0- 32  solo piano, PYREFLY_RISE quoted once, minor colour
 *   bars  9-20   strings   beats  32- 80  strings enter and build, one soft preview of the cell   <- loop start
 *   bars 21-36   climax    beats  80-144  full strings + choir, augmented cell, the bVI-bVII-I lift (twice)
 *   bars 37-44   coda      beats 144-176  quiet piano, cell restated in major, resolves to D
 * The loop runs 32 -> 176: the coda's last bar is D, the same chord the
 * strings section opens on, so the wrap is a held resolution, not a jump.
 */

import { arpLine, chordLine, chordRoots, concatNotes, tracker, type Note, type Track } from '../score.ts';
import { PYREFLY_RISE, PYREFLY_RISE_MAJOR, augment, cell } from './motifs.ts';

const BAR = 4;
const INTRO_CHORDS = ['Dm', 'Bb', 'F', 'C', 'Dm', 'Gm', 'Bb', 'A'];
const SE_CHORDS = ['D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'A'];
const CLIMAX_CHORDS = ['D', 'A', 'Bm', 'G', 'D', 'Bb', 'C', 'D', 'Bm', 'G', 'D', 'A', 'Bb', 'C', 'D', 'D'];
const CODA_CHORDS = ['D', 'G', 'C', 'D', 'Bm', 'G', 'A', 'D'];

const INTRO_START = 0;
const SE_START = 32;
const CLIMAX_START = 80;
const CODA_START = 144;
const LENGTH = 176;

/** Bars 3-8 of the intro: an original, unhurried answer, easing onto the dominant. */
const INTRO_ANSWER = `
  A3:1 C4:1 F4:2  | E4:1 D4:1 C4:2 |
  D4:1 F4:1 A4:2  | Bb4:1 G4:1 -:2 |
  F4:1 D4:1 Bb3:2 | C#4:2 A3:2     |
`;

/** Strings' own melody once the bed has settled, closing with rests to make room for the quote. */
const SE_MELODY = `
  A4:1 D5:1 F#5:2 | E5:1 C#5:1 A4:2 |
  D5:1 B4:1 -:2   | G4:1 B4:1 D5:2  |
  F#5:2 D5:2      | -:4             |
  -:4             | -:4             |
`;

/** Climbing through the first bVI-bVII-I lift toward the climax's second, bigger statement. */
const CLIMAX_CONNECT = `
  B4:1 D5:1 G5:2  | F#5:1 D5:1 A4:2 |
  D5:1 F5:1 Bb5:2 | E5:1 G5:1 C6:2  |
  D6:2 A5:2       |
`;

/** Easing down from the second statement, through the lift's answer, into the coda's register. */
const CLIMAX_TAIL = `
  C#5:1 A4:1 -:2  | D5:1 Bb4:1 F4:2 |
  E4:1 G4:1 C5:2  | D5:2 A4:2       |
  F#4:2 D4:2      |
`;

/** Coda, after the quoted cell: a soft original close resolving hard onto the tonic. */
const CODA_ANSWER = `
  E5:1 D5:1 C5:2 | D5:2 -:2       |
  F#4:1 D4:1 B3:2 | G4:1 B4:1 -:2 |
  C#5:2 A4:2      | D4:4          |
`;

function pianoMelody(): Note[] {
  return concatNotes(
    cell(PYREFLY_RISE, INTRO_START, 'D4', 0.4),
    tracker(INTRO_ANSWER, { start: 8, velocity: 0.36, checkBars: BAR }),
    cell(PYREFLY_RISE_MAJOR, CODA_START, 'D5', 0.35),
    tracker(CODA_ANSWER, { start: CODA_START + 8, velocity: 0.3, checkBars: BAR }),
  );
}

function pianoLeftHand(): Note[] {
  return concatNotes(
    arpLine(INTRO_CHORDS, { start: INTRO_START, barBeats: BAR, pattern: [0, 2, 3, 4, 5, 4, 3, 2], step: 0.5, dur: 0.42, octave: 2, center: 55, velocity: 0.32, accent: 1.2 }),
    arpLine(CODA_CHORDS, { start: CODA_START, barBeats: BAR, pattern: [0, 2, 3, 4, 5, 4, 3, 2], step: 0.5, dur: 0.42, octave: 2, center: 55, velocity: 0.22, accent: 1.15 }),
  );
}

function pianoBass(): Note[] {
  return concatNotes(
    chordRoots(INTRO_CHORDS, 1).map((midi, bar): Note => [INTRO_START + bar * BAR, 3.7, midi, bar % 2 === 0 ? 0.4 : 0.32]),
    chordRoots(CODA_CHORDS, 1).map((midi, bar): Note => [CODA_START + bar * BAR, 3.7, midi, bar % 2 === 0 ? 0.32 : 0.26]),
  );
}

/** Strings carry the melody from bar 5 of their entrance clear through the climax. */
function stringsLead(): Note[] {
  return concatNotes(
    tracker(SE_MELODY, { start: SE_START + 16, velocity: 0.5, checkBars: BAR }),
    cell(PYREFLY_RISE_MAJOR, SE_START + 40, 'D5', 0.55),
    cell(augment(PYREFLY_RISE_MAJOR, 2), CLIMAX_START, 'D4', 0.75),
    tracker(CLIMAX_CONNECT, { start: CLIMAX_START + 12, velocity: 0.68, checkBars: BAR }),
    cell(augment(PYREFLY_RISE_MAJOR, 2), CLIMAX_START + 32, 'D4', 0.88),
    tracker(CLIMAX_TAIL, { start: CLIMAX_START + 44, velocity: 0.55, checkBars: BAR }),
  );
}

function stringsBed(): Note[] {
  return concatNotes(
    chordLine(SE_CHORDS.slice(0, 4), { start: SE_START, barBeats: BAR, octave: 3, center: 62, velocity: 0.22, dur: 3.8 }),
    chordLine(SE_CHORDS.slice(4, 8), { start: SE_START + 16, barBeats: BAR, octave: 3, center: 62, velocity: 0.32, dur: 3.8 }),
    chordLine(SE_CHORDS.slice(8, 12), { start: SE_START + 32, barBeats: BAR, octave: 3, center: 64, velocity: 0.42, dur: 3.8 }),
    chordLine(CLIMAX_CHORDS.slice(0, 8), { start: CLIMAX_START, barBeats: BAR, octave: 3, center: 65, velocity: 0.55, dur: 3.8, roll: 0.03 }),
    chordLine(CLIMAX_CHORDS.slice(8, 16), { start: CLIMAX_START + 32, barBeats: BAR, octave: 3, center: 67, velocity: 0.68, dur: 3.8, roll: 0.03 }),
  );
}

/** The one clear low voice under the strings section and the climax — piano's bass is silent there. */
function stringsLow(): Note[] {
  return concatNotes(
    chordRoots(SE_CHORDS, 2).map((midi, bar): Note => [SE_START + bar * BAR, 3.7, midi, 0.3]),
    chordRoots(CLIMAX_CHORDS, 2).map((midi, bar): Note => [CLIMAX_START + bar * BAR, 3.7, midi, bar < 8 ? 0.5 : 0.6]),
  );
}

/** Choir arrives only at the climax: a sustained wash, then doubles the second, bigger statement an octave up. */
function choirLine(): Note[] {
  return concatNotes(
    chordLine(CLIMAX_CHORDS.slice(0, 8), { start: CLIMAX_START, barBeats: BAR, octave: 4, center: 69, velocity: 0.4, dur: 3.7, roll: 0.05 }),
    chordLine(CLIMAX_CHORDS.slice(8, 16), { start: CLIMAX_START + 32, barBeats: BAR, octave: 4, center: 71, velocity: 0.52, dur: 3.7, roll: 0.05 }),
    cell(augment(PYREFLY_RISE_MAJOR, 2), CLIMAX_START + 32, 'D5', 0.72),
  );
}

/** A gentle roll under the climax and a single swell at the second statement's arrival. */
function timpaniLine(): Note[] {
  const notes: Note[] = [];
  chordRoots(CLIMAX_CHORDS, 2).forEach((midi, bar) => {
    const at = CLIMAX_START + bar * BAR;
    notes.push([at, 2.5, midi, bar === 8 ? 0.55 : 0.3]);
  });
  return notes;
}

function crashHits(): Note[] {
  return [[CLIMAX_START + 32, 3, 'C5', 0.45]];
}

export const endingTrack: Track = {
  name: 'ending-ffx',
  bpm: 66,
  timeSig: [4, 4],
  loop: { start: SE_START, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  fx: {
    reverb: { room: 0.9, damp: 0.25, width: 1, preDelay: 0.04 },
    delay: { timeBeats: 0.75, feedback: 0.28, damp: 2400 },
  },
  channels: [
    { name: 'piano melody', instrument: 'piano', volume: 1, pan: -0.05, notes: pianoMelody(), fx: { reverb: 0.35 } },
    { name: 'piano left hand', instrument: 'piano', volume: 0.55, pan: 0.14, notes: pianoLeftHand(), fx: { reverb: 0.3 } },
    { name: 'piano bass', instrument: 'piano', volume: 0.48, pan: -0.02, notes: pianoBass(), fx: { reverb: 0.22 } },
    { name: 'strings lead', instrument: 'strings', volume: 0.85, pan: 0.08, notes: stringsLead(), fx: { reverb: 0.4, delay: 0.1 } },
    { name: 'strings bed', instrument: 'strings', volume: 0.5, pan: -0.15, notes: stringsBed(), fx: { reverb: 0.5 } },
    { name: 'strings low', instrument: 'strings-low', volume: 0.55, pan: -0.1, notes: stringsLow(), fx: { reverb: 0.35 } },
    { name: 'choir', instrument: 'choir', volume: 0.75, pan: 0.1, notes: choirLine(), fx: { reverb: 0.6 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.5, pan: 0, notes: timpaniLine(), fx: { reverb: 0.35 } },
    { name: 'crash', instrument: 'crash', volume: 0.4, pan: 0.05, notes: crashHits(), fx: { reverb: 0.4 } },
  ],
};

export default endingTrack;
