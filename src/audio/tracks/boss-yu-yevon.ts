/**
 * "What the Tide Keeps" — Yu Yevon, the true final battle.
 *
 * ORIGINAL COMPOSITION. An ancient parasitic god behind every aeon the party
 * has ever summoned — enormous and ceremonial, then triumphant. B minor
 * lifting to its relative D major for the climax, 96 bpm with a double-time
 * drive (8th-note taiko, then 16ths in taiko and strings-short) so the piece
 * feels vast and urgent at once. Organ, choir, full strings, brass, timpani,
 * taiko and bell — the widest dynamic range and fullest orchestration in the
 * score. The whole score's themes return: choir states `SENDING` in dread
 * (A), brass and strings answer with `PYREFLY_SIGH` (B), and the climax lifts
 * to D major with `augment(PYREFLY_RISE_MAJOR, 2)` in brass and choir over
 * everything. A timpani-and-organ transition bar brings the climax back down
 * to the dread without a lurch before the loop turns over.
 *
 * Form (4/4, 52 bars, 130 s):
 *   bars  1- 4  intro     beats   0- 16  drone, organ enters, first toll
 *   bars  5-16  A dread   beats  16- 64  choir sings SENDING, low pedal     <- loop start
 *   bars 17-28  B answer  beats  64-112  brass+strings answer with the sigh,
 *                                        taiko/strings-short ostinati enter
 *   bars 29-36  C build   beats 112-144  choir and brass alternate, driving
 *                                        toward the modulation
 *   bars 37-48  D climax  beats 144-192  D major, the rise augmented, tutti
 *   bars 49-52  transition beats 192-208  timpani + organ ease back to dread
 * Loop runs 16 -> 208; the transition's Bm chord lands exactly where A began.
 */

import {
  arpLine,
  chordLine,
  chordMidis,
  chordRoots,
  concatNotes,
  drumLine,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { augment, cell, PYREFLY_SIGH, PYREFLY_RISE_MAJOR, SENDING } from './motifs.ts';

const BAR = 4;

const INTRO_CHORDS = ['Bm', 'Bm', 'Bm', 'Bm'];
// Bar 9 is 'A' (not 'G'): SENDING's 3rd statement holds a C#5 there, and that note is
// A's own 3rd rather than a half-step clash against a G chord's D.
const A_CHORDS = ['Bm', 'Bm', 'G', 'G', 'Bm', 'Bm', 'Em', 'F#', 'Bm', 'A', 'Em', 'F#'];
const B_CHORDS = ['G', 'D', 'Bm', 'F#', 'G', 'D', 'Em', 'F#', 'G', 'A', 'Bm', 'F#'];
const C_CHORDS = ['Em', 'F#', 'G', 'A', 'Bm', 'C#m', 'D', 'A'];
// Bars 5 and 10 are the tonic-over-dominant-bass 'D/A' (a cadential 6-4) rather than plain
// 'A': the climax's held D holds land on the chord instead of clashing with A's own C#.
const D_CHORDS = ['D', 'A', 'Bm', 'G', 'D', 'D/A', 'G', 'D', 'Bm', 'G', 'D/A', 'D'];
const TRANS_CHORDS = ['G', 'Em', 'F#', 'Bm'];
const ALL_CHORDS = [...INTRO_CHORDS, ...A_CHORDS, ...B_CHORDS, ...C_CHORDS, ...D_CHORDS, ...TRANS_CHORDS];
const BARS = ALL_CHORDS.length; // 52
const LENGTH = BARS * BAR; // 208 beats = 130s @96bpm

const INTRO = 0;
const A = 16;
const B = 64;
const C = 112;
const D = 144;
const TRANS = 192;

/** A: the dread. SENDING stated three times, each answered by a held drone breath
 * so the section feels vast rather than merely slow. Statement 1's breath sits under
 * G-G, where B is the 3rd — fine held straight through. Statements 2 and 3 sit under
 * Em-F#, so the breath moves from B3 (Em's 5th) to A#3 (F#'s own 3rd) instead of
 * holding B3 into F# and clashing a half-step against its A#. */
function choirDread(): Note[] {
  const notes: Note[] = [];
  for (let i = 0; i < 3; i++) {
    notes.push(...cell(SENDING, A + i * 16, 'B4', 0.5 + i * 0.09));
    const breath = i === 0 ? 'B3:8' : 'B3:4 A#3:4';
    notes.push(...tracker(breath, { start: A + i * 16 + 8, velocity: 0.3 + i * 0.05 }));
  }
  return notes;
}

/** B: a sustained choir pad under the brass/strings answer, pulled back so the climax
 * has somewhere to grow to. */
function choirAnswer(): Note[] {
  return chordLine(B_CHORDS, { start: B, octave: 4, center: 69, velocity: 0.32, dur: 3.8, roll: 0.06 });
}

/** C: choir and brass alternate bar by bar, both climbing in velocity toward D. */
function choirBuild(): Note[] {
  const notes: Note[] = [];
  C_CHORDS.forEach((symbol, bar) => {
    if (bar % 2 !== 0) return;
    const at = C + bar * BAR;
    const tones = chordMidis(symbol, { octave: 4, center: 71 });
    tones.forEach((m) => notes.push([at, 3.6, m, 0.52 + bar * 0.03]));
  });
  return notes;
}

function brassBuild(): Note[] {
  const notes: Note[] = [];
  C_CHORDS.forEach((symbol, bar) => {
    if (bar % 2 === 0) return;
    const at = C + bar * BAR;
    const tones = chordMidis(symbol, { octave: 4, center: 65 });
    for (const midi of tones) {
      notes.push([at, 0.35, midi, 0.68 + bar * 0.03]);
      notes.push([at + 2, 0.35, midi, 0.72 + bar * 0.03]);
    }
  });
  return notes;
}

/** D: choir and brass together sing the rise, augmented for ceremony, twice, then
 * hold the D major chord through the rest of the climax — pushed louder than B's
 * answer so the biggest section of the score is unmistakably the loudest. */
function choirClimax(): Note[] {
  return concatNotes(
    cell(augment(PYREFLY_RISE_MAJOR, 2), D, 'D5', 0.88),
    cell(augment(PYREFLY_RISE_MAJOR, 2), D + 20, 'D5', 1),
    tracker('D5+F#5+A5:9 F#5+A5+D6:9', { start: D + 30, velocity: 0.92 }),
  );
}

function brassClimax(): Note[] {
  return concatNotes(
    cell(augment(PYREFLY_RISE_MAJOR, 2), D, 'D4', 0.85),
    cell(augment(PYREFLY_RISE_MAJOR, 2), D + 20, 'D4', 0.98),
    tracker('D4+F#4+A4:9 F#4+A4+D5:9', { start: D + 30, velocity: 0.9 }),
  );
}

/** Off-beat brass punctuation reinforcing the double-time drive in C and D. */
function stabs(chords: string[], start: number, offsets: number[], velocity: number): Note[] {
  const notes: Note[] = [];
  chords.forEach((symbol, bar) => {
    const tones = chordMidis(symbol, { octave: 4, center: 76 });
    for (const offset of offsets) {
      for (const midi of tones) notes.push([start + bar * BAR + offset, 0.22, midi, velocity]);
    }
  });
  return notes;
}

/** Sustained cathedral wash. Loud in the intro and the transition, a quiet floor elsewhere. */
function organLine(): Note[] {
  return concatNotes(
    chordLine(INTRO_CHORDS, { start: INTRO, octave: 2, center: 48, velocity: 0.68, dur: 3.9 }),
    chordLine(A_CHORDS, { start: A, octave: 2, center: 48, velocity: 0.32, dur: 3.9 }),
    chordLine(B_CHORDS, { start: B, octave: 2, center: 48, velocity: 0.26, dur: 3.9 }),
    chordLine(C_CHORDS, { start: C, octave: 2, center: 48, velocity: 0.42, dur: 3.9 }),
    chordLine(D_CHORDS, { start: D, octave: 2, center: 50, velocity: 0.6, dur: 3.9 }),
    chordLine(TRANS_CHORDS, { start: TRANS, octave: 2, center: 48, velocity: 0.62, dur: 3.9 }),
  );
}

/** Low string heartbeat: sparse in the dread, doubling under the answer, full in the climax. */
function stringsLowPedal(): Note[] {
  const roots = chordRoots(ALL_CHORDS, 2);
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bar * BAR;
    const root = roots[bar]!;
    if (at < A) continue;
    if (at >= D) {
      for (let s = 0; s < 8; s++) notes.push([at + s * 0.5, 0.48, root, Math.min(1, 0.68 + (s % 2) * 0.2)]);
      continue;
    }
    if (at >= B) {
      for (let s = 0; s < 4; s++) notes.push([at + s, 0.9, root, 0.32 + (s === 0 ? 0.08 : 0)]);
      continue;
    }
    notes.push([at, 0.9, root, 0.5]);
    notes.push([at + 2, 0.9, root, 0.34]);
  }
  return notes;
}

/** Brass and strings answer together with PYREFLY_SIGH, three times through B, rising. */
function answerLine(tonic: string): Note[] {
  return concatNotes(
    cell(PYREFLY_SIGH, B, tonic, 0.55),
    cell(PYREFLY_SIGH, B + 16, tonic, 0.66),
    cell(PYREFLY_SIGH, B + 32, tonic, 0.76),
  );
}

/** Full string swell: enters quiet with the answer, widens through the build, crests loudest
 * in the climax so the biggest section of the score reads as clearly the loudest. */
function stringsSwell(): Note[] {
  return concatNotes(
    chordLine(B_CHORDS, { start: B, octave: 3, center: 64, velocity: 0.3, dur: 3.85, roll: 0.06 }),
    chordLine(C_CHORDS, { start: C, octave: 3, center: 64, velocity: 0.55, dur: 3.85, roll: 0.05 }),
    chordLine(D_CHORDS, { start: D, octave: 4, center: 71, velocity: 0.85, dur: 3.85, roll: 0.04 }),
    chordLine(TRANS_CHORDS, { start: TRANS, octave: 3, center: 62, velocity: 0.3, dur: 3.85 }),
  );
}

/** Double-time drive: silent in the dread, 8ths under the answer, 16ths building and driving. */
function stringsShortOstinato(): Note[] {
  return concatNotes(
    arpLine(B_CHORDS, { start: B, pattern: [0, 1, 2, 1], step: 0.5, dur: 0.42, octave: 4, center: 74, velocity: 0.32 }),
    arpLine(C_CHORDS, { start: C, pattern: [0, 2, 1, 2, 0, 1, 2, 1], step: 0.25, dur: 0.22, octave: 4, center: 74, velocity: 0.48 }),
    arpLine(D_CHORDS, { start: D, pattern: [0, 1, 2, 3, 2, 1, 2, 3], step: 0.25, dur: 0.22, octave: 4, center: 76, velocity: 0.62 }),
  );
}

/** Timpani: distant tolls, a heartbeat under the dread, rolling into the build, hits through the
 * climax, and the soft solo hit that anchors the transition bar back to the top of the loop. */
function timpaniLine(): Note[] {
  const roots = chordRoots(ALL_CHORDS, 2);
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bar * BAR;
    const root = roots[bar]!;
    if (at < A) {
      notes.push([at, 3, root, bar === 0 ? 0.65 : 0.4]);
      continue;
    }
    if (at >= TRANS) {
      notes.push([at, 2.5, root, 0.5]);
      if (at === TRANS + BAR * 2) notes.push([at + 3, 1, root, 0.42]);
      continue;
    }
    if (at >= D) {
      notes.push([at, 1, root, 0.85]);
      notes.push([at + 1.5, 0.5, root, 0.6]);
      notes.push([at + 2, 1, root, 0.78]);
      notes.push([at + 3.5, 0.5, root, 0.65]);
      continue;
    }
    if (at >= C) {
      for (let s = 0; s < 4; s++) notes.push([at + s, 0.9, root, 0.55 + s * 0.06]);
      continue;
    }
    if (at >= B) {
      for (let s = 0; s < 8; s++) notes.push([at + s * 0.5, 0.5, root, 0.3 + (s / 8) * 0.35]);
      continue;
    }
    notes.push([at, 1.5, root, 0.6]);
    notes.push([at + 2.5, 1, root, 0.4]);
  }
  return notes;
}

/** Taiko: absent in the dread, an 8th-note pulse under the answer, 16ths from the build onward. */
function taikoLine(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < B_CHORDS.length; bar++) {
    notes.push(...drumLine('XxxxXxxx', { start: B + bar * BAR, step: 0.5, pitch: 'D2', velocity: 0.26 }));
  }
  for (let bar = 0; bar < C_CHORDS.length; bar++) {
    notes.push(...drumLine('XxxxxxxxXxxxxxxx', { start: C + bar * BAR, pitch: 'D2', velocity: 0.5 }));
  }
  for (let bar = 0; bar < D_CHORDS.length; bar++) {
    notes.push(...drumLine('XxxXxxxxXxxXxxxx', { start: D + bar * BAR, pitch: 'D2', velocity: 0.72 }));
  }
  return notes;
}

/** Two cymbal hits mark the climax's two rise statements — nothing else in the piece gets one,
 * so they land as the loudest single accents in the score. */
function crashes(): Note[] {
  return [
    [D, 1.8, 'C5', 0.75],
    [D + 20, 1.8, 'C5', 0.82],
  ];
}

/** One toll per section, the way the boss-dread bell does — never more insistent than that. */
function tolls(): Note[] {
  return [
    [0, 5, 'B2', 0.62],
    [A, 5, 'B2', 0.55],
    [B, 5, 'F#2', 0.58],
    [C, 4, 'A2', 0.6],
    [D, 6, 'D3', 0.75],
    [TRANS, 5, 'F#2', 0.5],
  ];
}

export const yuYevonTrack: Track = {
  name: 'boss-yu-yevon',
  bpm: 96,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  fx: {
    reverb: { room: 0.94, damp: 0.2, width: 1, preDelay: 0.05 },
    delay: { timeBeats: 1.5, feedback: 0.3, damp: 2200 },
  },
  channels: [
    {
      name: 'choir',
      instrument: 'choir',
      volume: 0.85,
      pan: -0.06,
      notes: concatNotes(choirDread(), choirAnswer(), choirBuild(), choirClimax()),
      fx: { reverb: 0.55 },
    },
    {
      name: 'organ',
      instrument: 'organ',
      volume: 0.7,
      pan: 0.08,
      notes: organLine(),
      fx: { reverb: 0.4 },
    },
    {
      name: 'strings-low',
      instrument: 'strings-low',
      volume: 0.7,
      pan: -0.15,
      notes: stringsLowPedal(),
      fx: { reverb: 0.32 },
    },
    {
      name: 'strings answer',
      instrument: 'strings',
      volume: 0.68,
      pan: 0.1,
      notes: answerLine('B4'),
      fx: { reverb: 0.4, delay: 0.1 },
    },
    {
      name: 'strings swell',
      instrument: 'strings',
      volume: 0.6,
      pan: 0.22,
      notes: stringsSwell(),
      fx: { reverb: 0.45 },
    },
    {
      name: 'strings-short',
      instrument: 'strings-short',
      volume: 0.5,
      pan: 0.3,
      notes: stringsShortOstinato(),
      fx: { reverb: 0.2 },
    },
    {
      name: 'brass answer',
      instrument: 'brass',
      volume: 0.72,
      pan: -0.22,
      notes: concatNotes(answerLine('B3'), brassBuild(), brassClimax()),
      fx: { reverb: 0.35, delay: 0.08 },
    },
    {
      name: 'brass stabs',
      instrument: 'brass-stab',
      volume: 0.5,
      pan: -0.35,
      notes: concatNotes(stabs(C_CHORDS, C, [0, 2], 0.7), stabs(D_CHORDS, D, [0, 1, 2, 3], 0.85)),
      fx: { reverb: 0.2 },
    },
    { name: 'timpani', instrument: 'timpani', volume: 0.8, pan: 0.12, notes: timpaniLine(), fx: { reverb: 0.32 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.62, pan: -0.1, notes: taikoLine(), fx: { reverb: 0.22 } },
    { name: 'bell', instrument: 'bell', volume: 0.5, pan: 0.35, notes: tolls(), fx: { reverb: 0.6, delay: 0.3 } },
    { name: 'crash', instrument: 'crash', volume: 0.5, pan: 0.15, notes: crashes(), fx: { reverb: 0.3 } },
    {
      name: 'sub',
      instrument: 'bass-sub',
      volume: 0.58,
      pan: 0,
      notes: chordRoots(ALL_CHORDS, 1).map((midi, bar): Note => [bar * BAR, 3.9, midi, bar * BAR >= D ? 0.7 : 0.5]),
    },
  ],
};

export default yuYevonTrack;
