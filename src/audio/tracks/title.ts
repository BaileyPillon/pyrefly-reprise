/**
 * "Tide, Remembered" — title theme.
 *
 * ORIGINAL COMPOSITION. Nothing here quotes any existing work; it aims for the
 * mood of standing over a drowned city at dawn — 64 bpm, A minor with a lift
 * into C major for the B section, solo piano first, strings entering at B.
 *
 * Form (4/4, 28 bars, 105 s):
 *   bars  1-4   intro    beats   0- 16   piano arpeggio alone
 *   bars  5-12  A        beats  16- 48   melody enters            <- loop start
 *   bars 13-20  B        beats  48- 80   major lift, strings enter
 *   bars 21-28  A'       beats  80-112   melody returns with cello counter-line
 * The loop runs 16 -> 112 so the intro plays once and the song circles forever.
 */

import {
  arpLine,
  chordLine,
  chordRoots,
  concatNotes,
  scaleVelocity,
  tracker,
  type Note,
  type Track,
} from '../score.ts';

const BAR = 4;
const INTRO = ['Am', 'F', 'Dm', 'E'];
const A_CHORDS = ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E'];
const B_CHORDS = ['C', 'G/B', 'Am', 'Em', 'F', 'C', 'Dm7', 'G'];
const ALL_CHORDS = [...INTRO, ...A_CHORDS, ...B_CHORDS, ...A_CHORDS];

const A_START = 16;
const B_START = 48;
const A2_START = 80;
const LENGTH = 112;

/** Right hand, A section: a rising question answered by a falling sigh. */
const MELODY_A = `
  -:1 E4:1 A4:1 B4:1     | C5:2 A4:1 G4:1        |
  E4:1.5 G4:0.5 C5:2     | B4:2 D5:1 B4:1        |
  C5:1 B4:1 A4:2         | F4:1 A4:1 C5:2        |
  D5:1.5 C5:0.5 A4:2     | B4:2 E4:2             |
`;

/** B section: the same shape lifted into the major and pushed up an octave. */
const MELODY_B = `
  E5:1.5 D5:0.5 C5:1 E5:1 | D5:2 B4:2            |
  C5:1 E5:1 A5:2          | G5:2.5 E5:0.5 D5:1   |
  C5:1 A4:1 F4:2          | G4:1 C5:1 E5:2       |
  D5:2 F5:1 E5:1          | D5:3 G4:1            |
`;

/** A' — as A, but the last two bars turn the cadence over instead of closing. */
const MELODY_A2 = `
  -:1 E4:1 A4:1 B4:1     | C5:2 A4:1 G4:1        |
  E4:1.5 G4:0.5 C5:2     | B4:2 D5:1 B4:1        |
  C5:1 B4:1 A4:2         | F4:1 A4:1 C5:2        |
  D5:1.5 F5:0.5 E5:1 C5:1 | B4:2 E4:1.5 -:0.5    |
`;

/** Cello counter-melody under A', walking down against the rising right hand. */
const COUNTER = `
  A2:4 | C3:3 D3:1 | E3:4 | D3:2 B2:2 |
  C3:4 | A2:3 F2:1 | F2:4 | E2:4      |
`;

function melody(): Note[] {
  return concatNotes(
    scaleVelocity(tracker(MELODY_A, { start: A_START, velocity: 0.8, checkBars: BAR }), 0.92),
    tracker(MELODY_B, { start: B_START, velocity: 0.86, checkBars: BAR }),
    tracker(MELODY_A2, { start: A2_START, velocity: 0.82, checkBars: BAR }),
  );
}

function accompaniment(): Note[] {
  // Left hand: root - fifth - octave - tenth - and back down, twice a bar.
  return arpLine(ALL_CHORDS, {
    start: 0,
    pattern: [0, 2, 3, 4, 5, 4, 3, 2],
    step: 0.5,
    dur: 0.62,
    octave: 2,
    velocity: 0.44,
    accent: 1.25,
  });
}

function bassNotes(): Note[] {
  const roots = chordRoots(ALL_CHORDS, 1);
  return roots.map((midi, bar): Note => [bar * BAR, 3.6, midi, bar % 4 === 0 ? 0.62 : 0.5]);
}

function sparkle(): Note[] {
  // Three celesta falls: closing B's first phrase, closing B, and the last bar.
  return concatNotes(
    tracker('E6:0.5 C6:0.5 G5:0.5 E5:0.5', { start: 62, velocity: 0.55 }),
    tracker('B5:0.5 G5:0.5 D5:0.5 B4:0.5', { start: 78, velocity: 0.5 }),
    tracker('E6:0.5 B5:0.5 G5:0.5 E5:1', { start: 108, velocity: 0.45 }),
  );
}

export const titleTrack: Track = {
  name: 'title',
  bpm: 64,
  timeSig: [4, 4],
  loop: { start: A_START, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  fx: {
    reverb: { room: 0.86, damp: 0.28, width: 0.95, preDelay: 0.03 },
    delay: { timeBeats: 0.75, feedback: 0.3, damp: 2600 },
  },
  channels: [
    {
      name: 'piano melody',
      instrument: 'piano',
      volume: 1,
      pan: -0.06,
      notes: melody(),
      fx: { reverb: 0.32 },
    },
    {
      name: 'piano left hand',
      instrument: 'piano',
      volume: 0.6,
      pan: 0.12,
      notes: accompaniment(),
      fx: { reverb: 0.26 },
    },
    {
      name: 'piano bass',
      instrument: 'piano',
      volume: 0.52,
      pan: -0.02,
      notes: bassNotes(),
      fx: { reverb: 0.2 },
    },
    {
      name: 'strings bed',
      instrument: 'strings',
      volume: 0.5,
      pan: 0.05,
      notes: concatNotes(
        chordLine(B_CHORDS, { start: B_START, octave: 3, center: 64, velocity: 0.5, dur: 3.9, roll: 0.05 }),
        chordLine(A_CHORDS, { start: A2_START, octave: 3, center: 64, velocity: 0.56, dur: 3.9, roll: 0.05 }),
      ),
      fx: { reverb: 0.45 },
    },
    {
      name: 'cello',
      instrument: 'strings-low',
      volume: 0.46,
      pan: -0.28,
      notes: concatNotes(
        chordRoots(B_CHORDS, 2).map((midi, bar): Note => [B_START + bar * BAR, 3.8, midi, 0.42]),
        tracker(COUNTER, { start: A2_START, velocity: 0.5, checkBars: BAR }),
      ),
      fx: { reverb: 0.4 },
    },
    {
      name: 'celesta',
      instrument: 'celesta',
      volume: 0.34,
      pan: 0.3,
      notes: sparkle(),
      fx: { reverb: 0.5, delay: 0.35 },
    },
  ],
};

export default titleTrack;
