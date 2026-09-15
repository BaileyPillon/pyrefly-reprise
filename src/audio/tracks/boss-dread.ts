/**
 * "The Unsent Hymn" — boss dread theme (Seymour / Yunalesca).
 *
 * ORIGINAL COMPOSITION. 90 bpm, D minor leaning Phrygian (the Eb chord) with a
 * harmonic-minor dominant. Choir in slow parallel motion over a low string
 * pedal, timpani, and a bell that tolls once per section.
 *
 * Form (32 bars, 85 s):
 *   bars  1-4   intro   beats   0- 16   drone, first toll, distant timpani
 *   bars  5-12  A       beats  16- 48   choir hymn over the pedal   <- loop start
 *   bars 13-20  B       beats  48- 80   brass swells, timpani doubles, it rises
 *   bars 21-28  A'      beats  80-112   hymn in bare parallel fifths, full weight
 *   bars 29-32  outro   beats 112-128   collapse back to the drone
 */

import {
  chordLine,
  chordRoots,
  concatNotes,
  motif,
  barStarts,
  transposeNotes,
  tracker,
  type Note,
  type Track,
} from '../score.ts';

const BAR = 4;
const INTRO_CHORDS = ['Dm', 'Dm', 'Dm', 'Dm'];
const A_CHORDS = ['Dm', 'Dm', 'Eb', 'Eb', 'Dm', 'Bb', 'Gm', 'A'];
const B_CHORDS = ['Bb', 'Bb', 'Gm', 'Gm', 'Eb', 'F', 'Gm', 'A'];
const OUTRO_CHORDS = ['Dm', 'Bb', 'Gm', 'A'];
const ALL_CHORDS = [...INTRO_CHORDS, ...A_CHORDS, ...B_CHORDS, ...A_CHORDS, ...OUTRO_CHORDS];
const BARS = ALL_CHORDS.length;
const LENGTH = BARS * BAR;
const A = 16;
const B = 48;
const A2 = 80;
const OUTRO = 112;

/** The hymn. Half and whole notes only — it has to feel like it cannot be hurried. */
const HYMN = `
  D4:3 F4:1   | E4:2 D4:2    |
  Eb4:3 G4:1  | F4:2 Eb4:2   |
  D4:2 A4:2   | Bb4:3 A4:1   |
  G4:2 F4:2   | E4:2 C#4:2   |
`;

/** Counter-line for A', a fourth below in bare organum-ish motion. */
const HYMN_UNDER = `
  A3:3 D4:1   | B3:2 A3:2    |
  Bb3:3 Eb4:1 | C4:2 Bb3:2   |
  A3:2 F4:1 E4:1 | F4:3 F4:1 |
  D4:2 C4:2   | A3:2 A3:2    |
`;

/** Low strings: a heartbeat on the root, heavy on 1, leaning on 3. */
const PEDAL: Note[] = [
  [0, 0.9, 0, 0.8],
  [1, 0.9, 0, 0.5],
  [2, 0.9, 0, 0.66],
  [3, 0.9, 0, 0.48],
];

const PEDAL_DOUBLE: Note[] = [
  [0, 0.45, 0, 0.82],
  [0.5, 0.45, 0, 0.42],
  [1, 0.45, 0, 0.6],
  [1.5, 0.45, 0, 0.42],
  [2, 0.45, 0, 0.72],
  [2.5, 0.45, 0, 0.42],
  [3, 0.45, 0, 0.6],
  [3.5, 0.45, 7, 0.5],
];

function pedalLine(): Note[] {
  const bars = barStarts(0, BARS, BAR);
  const roots = chordRoots(ALL_CHORDS, 2);
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bars[bar]!;
    const root = roots[bar]!;
    const pattern = at >= B && at < A2 ? PEDAL_DOUBLE : PEDAL;
    notes.push(...motif(pattern, [at], [root]));
  }
  return notes;
}

function timpaniLine(): Note[] {
  const roots = chordRoots(ALL_CHORDS, 2);
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bar * BAR;
    const root = roots[bar]!;
    if (at < A) {
      notes.push([at, 2, root, bar === 0 ? 0.7 : 0.5]);
      continue;
    }
    if (at >= B && at < A2) {
      // Rolling eighths under the B section, swelling into each bar.
      for (let s = 0; s < 8; s++) {
        notes.push([at + s * 0.5, 0.5, root, 0.32 + (s / 8) * 0.4]);
      }
      continue;
    }
    if (at >= OUTRO) {
      notes.push([at, 2, root, 0.42]);
      continue;
    }
    notes.push([at, 1.5, root, 0.78]);
    notes.push([at + 2.5, 1, root, 0.5]);
    if (at >= A2) notes.push([at + 3.5, 0.5, root, 0.62]);
  }
  return notes;
}

function tolls(): Note[] {
  return [
    [0, 4, 'D3', 0.7] as Note,
    [A, 4, 'D3', 0.6] as Note,
    [B, 4, 'Bb2', 0.55] as Note,
    [A2, 4, 'D3', 0.68] as Note,
    [OUTRO, 4, 'D3', 0.5] as Note,
  ];
}

const HYMN_A = tracker(HYMN, { start: A, velocity: 0.62, gate: 0.97, checkBars: BAR });
const HYMN_A2 = tracker(HYMN, { start: A2, velocity: 0.76, gate: 0.97, checkBars: BAR });

export const bossTrack: Track = {
  name: 'boss-dread',
  bpm: 90,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  fx: {
    reverb: { room: 0.92, damp: 0.22, width: 1, preDelay: 0.045 },
    delay: { timeBeats: 1.5, feedback: 0.32, damp: 2200 },
  },
  channels: [
    {
      name: 'choir',
      instrument: 'choir',
      volume: 0.8,
      pan: -0.08,
      notes: concatNotes(HYMN_A, HYMN_A2),
      fx: { reverb: 0.55 },
    },
    {
      name: 'choir fifths',
      instrument: 'choir',
      volume: 0.42,
      pan: 0.22,
      notes: concatNotes(
        transposeNotes(HYMN_A2, 7),
        tracker(HYMN_UNDER, { start: A2, velocity: 0.5, gate: 0.97, checkBars: BAR }),
      ),
      fx: { reverb: 0.6 },
    },
    {
      name: 'low strings',
      instrument: 'strings-low',
      volume: 0.72,
      pan: 0,
      notes: pedalLine(),
      fx: { reverb: 0.3 },
    },
    {
      name: 'string bed',
      instrument: 'strings',
      volume: 0.4,
      pan: 0.12,
      notes: concatNotes(
        chordLine(A_CHORDS, { start: A, octave: 3, center: 62, velocity: 0.38, dur: 3.9 }),
        chordLine(B_CHORDS, { start: B, octave: 3, center: 62, velocity: 0.5, dur: 3.9 }),
        chordLine(A_CHORDS, { start: A2, octave: 3, center: 62, velocity: 0.46, dur: 3.9 }),
        chordLine(OUTRO_CHORDS, { start: OUTRO, octave: 3, center: 62, velocity: 0.3, dur: 3.9 }),
      ),
      fx: { reverb: 0.45 },
    },
    {
      name: 'brass swells',
      instrument: 'brass',
      volume: 0.5,
      pan: -0.25,
      notes: concatNotes(
        chordLine(B_CHORDS, { start: B, octave: 3, center: 55, velocity: 0.5, dur: 3.8, roll: 0.08 }),
        tracker('D4:2 Eb4:2 | F4:4 | E4:2 C#4:2 | D4:4', { start: OUTRO, velocity: 0.42, checkBars: BAR }),
      ),
      fx: { reverb: 0.4 },
    },
    {
      name: 'timpani',
      instrument: 'timpani',
      volume: 0.75,
      pan: 0.1,
      notes: timpaniLine(),
      fx: { reverb: 0.3 },
    },
    {
      name: 'bell',
      instrument: 'bell',
      volume: 0.5,
      pan: 0.35,
      notes: tolls(),
      fx: { reverb: 0.6, delay: 0.3 },
    },
    {
      name: 'drone',
      instrument: 'bass-sub',
      volume: 0.55,
      pan: 0,
      notes: chordRoots(ALL_CHORDS, 1).map((midi, bar): Note => [bar * BAR, 3.9, midi, 0.55]),
    },
  ],
};

export default bossTrack;
