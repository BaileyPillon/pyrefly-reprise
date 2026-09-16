/**
 * "Threshold, Unhurried" — chapter-select menu theme.
 *
 * ORIGINAL COMPOSITION. A calmer, brighter cousin of the title theme for a
 * screen the player may sit on for minutes: F major coloured by its raised
 * 4th — lydian's bright "II" chord, G major, standing in for the diatonic
 * G minor — at 84 bpm in 3/4. Harp arpeggios and a soft pad carry the
 * harmony; light strings and celesta trade the title theme's rising
 * gesture (`PYREFLY_RISE_MAJOR`), now heard at rest instead of in search
 * of an answer.
 *
 * Form (3/4, 36 bars, 77 s):
 *   bars  1-4   intro   beats   0- 12   harp alone, augmented motif quote
 *   bars  5-12  A       beats  12- 36   arpeggio settles, celesta motif    <- loop start
 *   bars 13-20  B       beats  36- 60   strings enter, richer 7th chords
 *   bars 21-28  C       beats  60- 84   fullest texture, string climax note
 *   bars 29-36  A'      beats  84-108   strings fade out, closes on a C7
 * The loop runs 12 -> 108; the closing C7 resolves straight into A's F chord.
 */

import { arpLine, chordLine, concatNotes, tracker, type Note, type Track } from '../score.ts';
import { PYREFLY_RISE_MAJOR, augment, cell } from './motifs.ts';

const BAR = 3;
const INTRO_CHORDS = ['F', 'C', 'Dm', 'G'];
const A_CHORDS = ['F', 'G', 'Am', 'C', 'Dm', 'G', 'F', 'C'];
const B_CHORDS = ['F', 'G', 'Am7', 'Cmaj7', 'Dm7', 'G', 'Bdim', 'C'];
const C_CHORDS = ['Dm', 'G', 'Em', 'Am', 'F', 'G', 'Am', 'C'];
const A2_CHORDS = ['F', 'G', 'Am', 'C', 'Dm', 'G', 'F', 'C7'];

const A_START = 12;
const B_START = 36;
const C_START = 60;
const A2_START = 84;
const LENGTH = 108;

/** B section melody: strings enter, a rising phrase answered, then a small development. */
const STRINGS_B = `
  A4:1.5 C5:1.5   | D5:2 B4:1      |
  C5:1 A4:1 -:1   | E5:2 C5:1      |
  D5:1.5 F5:1.5   | E5:1 B4:1 G4:1 |
  F5:2 D5:1       | E5:2 -:1       |
`;

/** C section melody: the climax — register climbs, C6 held at the peak, then eases down. */
const STRINGS_C = `
  D5:1 F5:1 A5:1  | B5:2 G5:1      |
  E5:1 G5:1 B5:1  | C6:3           |
  A5:1.5 F5:1.5   | G5:1 E5:1 B4:1 |
  A4:2 -:1        | E5:1 C5:1 -:1  |
`;

/** A' melody: A's shape restated softer, then rests for the last two bars so the loop lands quiet. */
const STRINGS_A2 = `
  A4:1.5 C5:1.5   | D5:2 B4:1      |
  C5:1 A4:2       | E5:1.5 C5:1.5  |
  D5:2 -:1        | B4:1.5 G4:1.5  |
  -:3             | -:3            |
`;

function harpArps(): Note[] {
  return concatNotes(
    arpLine(INTRO_CHORDS, { start: 0, barBeats: BAR, pattern: [0, 1, 2, 3, 2, 1], step: 0.5, dur: 0.48, octave: 3, center: 65, velocity: 0.3, accent: 1.15 }),
    arpLine(A_CHORDS, { start: A_START, barBeats: BAR, pattern: [0, 1, 2, 3, 2, 1], step: 0.5, dur: 0.48, octave: 3, center: 67, velocity: 0.38, accent: 1.15 }),
    arpLine(B_CHORDS, { start: B_START, barBeats: BAR, pattern: [0, 2, 1, 3, 2, 1], step: 0.5, dur: 0.48, octave: 3, center: 69, velocity: 0.44, accent: 1.2 }),
    arpLine(C_CHORDS, { start: C_START, barBeats: BAR, pattern: [0, 1, 2, 4, 3, 2], step: 0.5, dur: 0.48, octave: 4, center: 74, velocity: 0.52, accent: 1.25 }),
    arpLine(A2_CHORDS, { start: A2_START, barBeats: BAR, pattern: [0, 1, 2, 3, 2, 1], step: 0.5, dur: 0.48, octave: 3, center: 65, velocity: 0.34, accent: 1.1 }),
  );
}

/** The recurring gesture, quoted by the harp: augmented and alone in the intro, a soft echo before the loop closes. */
function harpMotif(): Note[] {
  return concatNotes(
    cell(augment(PYREFLY_RISE_MAJOR, 2), 1, 'F4', 0.45),
    cell(PYREFLY_RISE_MAJOR, 102, 'F4', 0.35),
  );
}

function padBed(): Note[] {
  return concatNotes(
    chordLine(INTRO_CHORDS, { start: 0, barBeats: BAR, octave: 3, center: 60, velocity: 0.2, dur: 2.9, bassOctaves: 1, roll: 0.1 }),
    chordLine(A_CHORDS, { start: A_START, barBeats: BAR, octave: 3, center: 60, velocity: 0.28, dur: 2.9, bassOctaves: 1, roll: 0.08 }),
    chordLine(B_CHORDS, { start: B_START, barBeats: BAR, octave: 3, center: 62, velocity: 0.34, dur: 2.9, bassOctaves: 1, roll: 0.06 }),
    chordLine(C_CHORDS, { start: C_START, barBeats: BAR, octave: 3, center: 65, velocity: 0.42, dur: 2.9, bassOctaves: 1, roll: 0.05 }),
    chordLine(A2_CHORDS, { start: A2_START, barBeats: BAR, octave: 3, center: 60, velocity: 0.26, dur: 2.9, bassOctaves: 1, roll: 0.09 }),
  );
}

/** The gesture again on celesta at every section head, plus two small transition sparkles. */
function celestaLine(): Note[] {
  return concatNotes(
    cell(PYREFLY_RISE_MAJOR, A_START + 3, 'F5', 0.5),
    cell(PYREFLY_RISE_MAJOR, B_START + 3, 'F5', 0.55),
    tracker('G5:0.5 E5:0.5 C5:0.5 A4:0.5@0.4', { start: B_START + 21, velocity: 0.42 }),
    cell(PYREFLY_RISE_MAJOR, C_START, 'F5', 0.62),
    tracker('B5:0.5 G5:0.5 E5:0.5 C5:0.5@0.35', { start: C_START + 21, velocity: 0.36 }),
    cell(PYREFLY_RISE_MAJOR, A2_START + 3, 'F5', 0.4),
  );
}

function stringsMelody(): Note[] {
  return concatNotes(
    tracker(STRINGS_B, { start: B_START, velocity: 0.62, checkBars: BAR }),
    tracker(STRINGS_C, { start: C_START, velocity: 0.7, checkBars: BAR }),
    tracker(STRINGS_A2, { start: A2_START, velocity: 0.5, checkBars: BAR }),
  );
}

export const chapterSelectTrack: Track = {
  name: 'chapter-select',
  bpm: 84,
  timeSig: [3, 4],
  loop: { start: A_START, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.85, damp: 0.3, width: 0.95, preDelay: 0.03 },
    delay: { timeBeats: 0.75, feedback: 0.25, damp: 2600 },
  },
  channels: [
    {
      name: 'harp arpeggio',
      instrument: 'harp',
      volume: 0.55,
      pan: -0.18,
      notes: harpArps(),
      fx: { reverb: 0.3, delay: 0.15 },
    },
    {
      name: 'harp motif',
      instrument: 'harp',
      volume: 0.5,
      pan: 0.05,
      notes: harpMotif(),
      fx: { reverb: 0.35, delay: 0.2 },
    },
    {
      name: 'celesta',
      instrument: 'celesta',
      volume: 0.5,
      pan: 0.32,
      notes: celestaLine(),
      fx: { reverb: 0.5, delay: 0.3 },
    },
    {
      name: 'pad',
      instrument: 'pad',
      volume: 0.4,
      pan: 0,
      notes: padBed(),
      fx: { reverb: 0.42 },
    },
    {
      name: 'light strings',
      instrument: 'strings',
      volume: 0.82,
      pan: 0.12,
      notes: stringsMelody(),
      fx: { reverb: 0.38 },
    },
  ],
};

export default chapterSelectTrack;
