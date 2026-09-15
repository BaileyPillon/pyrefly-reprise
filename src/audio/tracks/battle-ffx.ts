/**
 * "Hold the Trail" — FFX random/boss battle theme.
 *
 * ORIGINAL COMPOSITION. Driving 4/4 rock-orchestral at 150 bpm in E minor:
 * distorted-ish bass riff, rock kit, brass stabs, spiccato string ostinato.
 *
 * Form (48 bars, 76.8 s):
 *   bars  1-4   intro   beats   0- 16   kit + bass riff alone
 *   bars  5-12  A       beats  16- 48   riff + brass stabs          <- loop start
 *   bars 13-20  B       beats  48- 80   string ostinato + brass lead
 *   bars 21-28  C       beats  80-112   bridge, half-time, builds back
 *   bars 29-36  D       beats 112-144   climax lead, everything in
 *   bars 37-44  A2      beats 144-176   riff returns
 *   bars 45-48  turn    beats 176-192   four-bar turnaround into the loop
 */

import {
  arpLine,
  chordLine,
  chordMidis,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  barStarts,
  tracker,
  type Note,
  type Track,
} from '../score.ts';

const BAR = 4;
const A_CHORDS = ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B'];
const B_CHORDS = ['Em', 'G', 'C', 'D', 'Em', 'G', 'Am', 'B'];
const C_CHORDS = ['Am', 'F', 'C', 'G', 'Am', 'F', 'D', 'B'];
const D_CHORDS = ['Em', 'C', 'G', 'D', 'Am', 'C', 'D', 'B'];
const TURN_CHORDS = ['Em', 'C', 'D', 'B'];
const INTRO_CHORDS = ['Em', 'Em', 'Em', 'B'];
const ALL_CHORDS = [
  ...INTRO_CHORDS,
  ...A_CHORDS,
  ...B_CHORDS,
  ...C_CHORDS,
  ...D_CHORDS,
  ...A_CHORDS,
  ...TURN_CHORDS,
];
const BARS = ALL_CHORDS.length;
const LENGTH = BARS * BAR;
const A = 16;
const B = 48;
const C = 80;
const D = 112;
const A2 = 144;
const TURN = 176;

/** Eighth-note riff: root, root, octave, root, root, fifth, octave, fifth. */
const BASS_MOTIF: Note[] = [
  [0, 0.44, 0, 0.98],
  [0.5, 0.44, 0, 0.7],
  [1, 0.44, 12, 0.82],
  [1.5, 0.44, 0, 0.72],
  [2, 0.44, 0, 0.92],
  [2.5, 0.44, 7, 0.74],
  [3, 0.44, 12, 0.84],
  [3.5, 0.44, 7, 0.78],
];

const KICK = 'X..x..X...X.x...';
const SNARE = '....X..g....X.g.';
const SNARE_FILL = '....X..g..X.XXXX';
const HAT = 'x.X.x.X.x.X.x.X.';

function bassLine(): Note[] {
  return motif(BASS_MOTIF, barStarts(0, BARS, BAR), chordRoots(ALL_CHORDS, 1));
}

function kit(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bar * BAR;
    const bridge = at >= C && at < D - 2 * BAR;
    if (bridge) {
      // Half-time bridge: kick on 1 and 3, no backbeat until the build.
      notes.push(...drumLine('x.......x.......', { start: at, pitch: 'C1', velocity: 0.72 }));
      continue;
    }
    notes.push(...drumLine(KICK, { start: at, pitch: 'C1', velocity: 0.9 }));
  }
  return notes;
}

function snareLine(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bar * BAR;
    if (at >= C && at < D - 2 * BAR) continue;
    if (at >= D - 2 * BAR && at < D) {
      // Two-bar snare crescendo pushing into the climax.
      for (let s = 0; s < 16; s++) {
        const t = (at - (D - 2 * BAR)) / (2 * BAR) + s / 32;
        notes.push([at + s * 0.25, 0.25, 'D2', 0.32 + t * 0.62]);
      }
      continue;
    }
    const fill = bar % 8 === 7;
    notes.push(...drumLine(fill ? SNARE_FILL : SNARE, { start: at, pitch: 'D2', velocity: 0.8 }));
  }
  return notes;
}

function hats(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bar * BAR;
    const quiet = at >= C && at < D - 2 * BAR;
    notes.push(...drumLine(HAT, { start: at, pitch: 'F#3', velocity: quiet ? 0.3 : 0.5 }));
  }
  return notes;
}

function crashes(): Note[] {
  return [A, B, C, D, A2, TURN].map((beat): Note => [beat, 1.5, 'C5', 0.62]);
}

function toms(): Note[] {
  // Descending tom fill at the end of the A sections.
  return concatNotes(
    tracker('A3:0.25 A3:0.25 F3:0.25 F3:0.25 D3:0.25 D3:0.25 C3:0.5', { start: 46, velocity: 0.8 }),
    tracker('A3:0.25 A3:0.25 F3:0.25 F3:0.25 D3:0.25 D3:0.25 C3:0.5', { start: 174, velocity: 0.8 }),
  );
}

/** Short chord hits on the off-beats — the classic battle-brass punctuation. */
function stabs(chords: string[], start: number, offsets: number[], velocity: number): Note[] {
  const notes: Note[] = [];
  chords.forEach((symbol, bar) => {
    const tones = chordMidis(symbol, { octave: 4, center: 67 });
    for (const offset of offsets) {
      for (const midi of tones) {
        notes.push([start + bar * BAR + offset, 0.3, midi, velocity]);
      }
    }
  });
  return notes;
}

const LEAD_B = `
  B4:1 E5:1 D5:0.5 B4:0.5 G4:1 | D5:2 B4:1 D5:1 |
  E5:1 G5:1 E5:1 C5:1          | D5:2 A4:2      |
  B4:1 E5:1 G5:2               | F#5:1 D5:1 B4:2 |
  C5:1 E5:1 A5:1 G5:1          | F#5:2 B4:2     |
`;

const LEAD_D = `
  E5:1.5 G5:0.5 B5:2 | C6:1 B5:1 G5:2  |
  A5:1 B5:1 D6:2     | B5:2 A5:2       |
  A5:1 C6:1 E6:2     | D6:1 C6:1 G5:2  |
  F#5:1 A5:1 D6:1 A5:1 | B5:2 F#5:2    |
`;

const LEAD_C = `
  A4:2 C5:2   | A4:3 G4:1    |
  G4:2 E4:2   | D5:4         |
  C5:2 E5:2   | F5:3 E5:1    |
  D5:2 F#5:2  | B4:2 F#5:2   |
`;

export const battleTrack: Track = {
  name: 'battle-ffx',
  bpm: 150,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 2.5,
  fx: {
    reverb: { room: 0.58, damp: 0.5, width: 0.85, preDelay: 0.008 },
    delay: { timeBeats: 0.75, feedback: 0.26, damp: 2800 },
  },
  channels: [
    {
      name: 'bass riff',
      instrument: 'bass',
      volume: 0.95,
      pan: 0,
      notes: bassLine(),
      fx: { reverb: 0.05 },
    },
    { name: 'kick', instrument: 'kick', volume: 0.95, pan: 0, notes: kit() },
    { name: 'snare', instrument: 'snare', volume: 0.78, pan: -0.05, notes: snareLine(), fx: { reverb: 0.16 } },
    { name: 'hats', instrument: 'hat', volume: 0.4, pan: 0.2, notes: hats() },
    { name: 'crash', instrument: 'crash', volume: 0.45, pan: 0.1, notes: crashes(), fx: { reverb: 0.3 } },
    { name: 'toms', instrument: 'tom', volume: 0.6, pan: -0.15, notes: toms(), fx: { reverb: 0.2 } },
    {
      name: 'brass stabs',
      instrument: 'brass-stab',
      volume: 0.5,
      pan: -0.3,
      notes: concatNotes(
        stabs(A_CHORDS, A, [0, 1.5, 2.5], 0.8),
        stabs(A_CHORDS, A2, [0, 1.5, 2.5, 3.5], 0.85),
        stabs(TURN_CHORDS, TURN, [0, 1.5, 2.5], 0.9),
        stabs(D_CHORDS, D, [0, 2], 0.7),
      ),
      fx: { reverb: 0.18 },
    },
    {
      name: 'string ostinato',
      instrument: 'strings-short',
      volume: 0.5,
      pan: 0.3,
      notes: concatNotes(
        arpLine(B_CHORDS, { start: B, pattern: [0, 1, 2, 1], step: 0.25, dur: 0.22, octave: 4, center: 72, velocity: 0.55 }),
        arpLine(D_CHORDS, { start: D, pattern: [0, 2, 1, 2], step: 0.25, dur: 0.22, octave: 4, center: 72, velocity: 0.62 }),
        arpLine(A_CHORDS, { start: A2, pattern: [0, 1, 2, 1], step: 0.5, dur: 0.45, octave: 4, center: 72, velocity: 0.5 }),
      ),
      fx: { reverb: 0.24 },
    },
    {
      name: 'brass lead',
      instrument: 'brass',
      volume: 0.8,
      pan: -0.12,
      notes: concatNotes(
        tracker(LEAD_B, { start: B, velocity: 0.82, gate: 0.94, checkBars: BAR }),
        tracker(LEAD_D, { start: D, velocity: 0.9, gate: 0.94, checkBars: BAR }),
      ),
      fx: { reverb: 0.2, delay: 0.12 },
    },
    {
      name: 'strings lead',
      instrument: 'strings',
      volume: 0.62,
      pan: 0.15,
      notes: concatNotes(
        tracker(LEAD_C, { start: C, velocity: 0.7, checkBars: BAR }),
        tracker(LEAD_D, { start: D, velocity: 0.55, transpose: -12, gate: 0.94, checkBars: BAR }),
      ),
      fx: { reverb: 0.3 },
    },
    {
      name: 'pad',
      instrument: 'pad',
      volume: 0.34,
      pan: 0,
      notes: concatNotes(
        chordLine(C_CHORDS, { start: C, octave: 3, center: 60, velocity: 0.5, dur: 3.9 }),
        chordLine(B_CHORDS, { start: B, octave: 3, center: 60, velocity: 0.34, dur: 3.9 }),
      ),
      fx: { reverb: 0.35 },
    },
    {
      name: 'sub',
      instrument: 'bass-sub',
      volume: 0.42,
      pan: 0,
      notes: chordRoots(ALL_CHORDS, 1).map((midi, bar): Note => [bar * BAR, 3.7, midi, 0.5]),
    },
  ],
};

export default battleTrack;
