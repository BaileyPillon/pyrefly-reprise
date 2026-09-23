/**
 * "Open Sky, Closed Gate" — Evrae, fought from the deck of the Fahrenheit.
 *
 * ORIGINAL COMPOSITION. A minor (Aeolian), 4/4, 144 bpm. Chapter VIII.
 * GAME CASE (AGENTS.md rule 14): FFX only — see `fahrenheit.ts`.
 *
 * THE BRIEF (research/ffx-evrae-airship.md §12.6; chapter-evrae-review.md O-5):
 * 140-150 bpm, forward motion not aggression, driving eighths, **machina, not
 * menace** (engine-room percussion, metallic pulses, a drone for altitude),
 * open fourths and fifths with air in the middle, a two-bar figure that
 * survives interruption, phase 2 changing the subdivision and not the tempo.
 * Anti-brief: no choir, no brass fanfare, nothing sacred — so no choir, organ
 * or bell here; horns carry the tune in unison or hold open fifths, and the one
 * brass accent is a two-note low stab in the figure's rests.
 *
 * THEMES (docs/audio/THEMES.md, cue map row 22)
 *   FAREWELL_RISE driven at speed as the head of the ship figure
 *   (`fahrenheit.ts` PURSUIT_PHRASE) — the goodbye's first four notes as a
 *   pursuit, because the crew is flying to reach Yuna and the wyrm is the
 *   doorman. At range, FAREWELL_RISE and FAREWELL_FALL at double length on a
 *   distant flute: the reason they are flying, heard from further away. No
 *   HYMN anywhere: Bevelle's holiness is this scene's irony, not its sound.
 *
 * THE ONE EMOTION: the ship is the weapon; keep your distance.
 *
 * Form (48 bars, 192 beats, 80.0 s; loop 16 -> 192):
 *   bars  1- 4  engine   beats   0- 16  clangs out of true, taiko, the drone opens
 *   bars  5-12  A        beats  16- 48  the pursuit phrase, strings over piano    <- loop start
 *   bars 13-20  A'       beats  48- 80  horns take the tune, violins sing above it
 *   bars 21-28  B (air)  beats  80-112  a hat, piano fifths, distant flute; a dead stop
 *   bars 29-36  C        beats 112-144  sixteenths under the same 144; tune in octaves
 *   bars 37-44  D        beats 144-176  piano alone on the tune over the engine
 *   bars 45-48  turn     beats 176-192  bVI - bVII twice, leaning home into bar 5
 *
 * RANGE. The cue the game plays is this balance. `rangeVariant(bossEvraeTrack,
 * 'near' | 'far')` (fahrenheit.ts) re-balances the same notes for §12.6's two
 * states; the audition page cross-fades them.
 */

import { concatNotes, drumLine, tracker, type Note, type Track } from '../score.ts';
import {
  OPEN_VOICING,
  PURSUIT_HALF,
  PURSUIT_PHRASE,
  barArch,
  breathe,
  offbeatAccent,
  rootIn,
  sectionMacro,
} from './fahrenheit.ts';
import { FAREWELL_FALL, FAREWELL_RISE, augment, lean } from './themes.ts';
import { cell } from './motifs.ts';

const BAR = 4;
const A = 16;
const A2 = 48;
const B = 80;
const C = 112;
const D = 144;
const TURN = 176;
const LENGTH = 192;
const STOP = C - 1; // the one beat where everything stops, so the climax has somewhere to land

const INTRO_HALF = ['Am', 'Am', 'Am', 'Am', 'F', 'F', 'G', 'G'];
const B_HALF = [
  'Fmaj7', 'Fmaj7', 'G', 'G', 'Am', 'Am', 'Em', 'Em',
  'Fmaj7', 'Fmaj7', 'G', 'G', 'Dm', 'Dm', 'F', 'G',
];
const TURN_HALF = ['F', 'F', 'G', 'G', 'F', 'F', 'G', 'G'];

/** Every half bar of the cue, in order. */
const ALL_HALF = [
  ...INTRO_HALF,
  ...PURSUIT_HALF,
  ...PURSUIT_HALF,
  ...B_HALF,
  ...PURSUIT_HALF,
  ...PURSUIT_HALF,
  ...TURN_HALF,
];
const chordAt = (beat: number): string => ALL_HALF[Math.floor(beat / 2)]!;

/** Section weights: thin intro, B genuinely steps back, C is the top. */
function level(beat: number): number {
  if (beat < A) return 0.64;
  if (beat < A2) return 0.8;
  if (beat < B) return 0.9;
  if (beat < C) return 0.62;
  if (beat < D) return 1;
  if (beat < TURN) return 0.74;
  return 0.94;
}

/** Drop anything that would start inside the stop beat. */
function silenceStop(notes: Note[]): Note[] {
  return notes.filter((n) => n[0] < STOP || n[0] >= C);
}

const macro = (notes: Note[]): Note[] => silenceStop(sectionMacro(notes, level));

// --- The tune

const ARCH_A = [0.64, 0.7, 0.68, 0.74, 0.7, 0.78, 0.82, 0.86];
const ARCH_A2 = [0.68, 0.74, 0.72, 0.78, 0.74, 0.82, 0.86, 0.9];
const ARCH_C = [0.8, 0.86, 0.84, 0.88, 0.86, 0.9, 0.94, 0.98];
const ARCH_D = [0.6, 0.66, 0.62, 0.7, 0.66, 0.72, 0.76, 0.8];

function phrase(start: number, arch: number[], transpose = 0, gate = 0.92): Note[] {
  return barArch(tracker(PURSUIT_PHRASE, { start, transpose, gate, checkBars: BAR }), start, arch);
}

/** The violins' line over the horns at A': long notes, two appoggiaturas leaned. */
const COUNTER = `
  E5:4      | F5:2 E5:2 | D5:4      | B4:2 E5:2 |
  C5:2 A5:2 | F5:4      | A5:2 G5:2 | E5:4      |
`;

function counter(start: number, fromBar = 0): Note[] {
  const all = tracker(COUNTER, { start: start - fromBar * BAR, gate: 1.01, checkBars: BAR });
  const line = all.filter((n) => n[0] >= start - 1e-9);
  const shaped = barArch(line, start - fromBar * BAR, [0.6, 0.66, 0.64, 0.7, 0.68, 0.74, 0.78, 0.72]);
  const o = start - fromBar * BAR;
  return lean(shaped, [[o + 4, o + 6], [o + 24, o + 26]]);
}

/** B: the strings answer the flute, falling F5 to E5 on the lean. */
const B_ANSWER = `-:2 A4:2 | B4:2 D5:2 | F5:3 E5:1 | C5:2 D5:1 -:1 |`;

function stringsLead(): Note[] {
  const answer = barArch(tracker(B_ANSWER, { start: B + 16, gate: 1, checkBars: BAR }), B + 16, [0.52, 0.58, 0.64, 0.6]);
  const turn = barArch(
    tracker('C5:4 | D5:4 | E5:4 | D5:1 E5:1 F5:1 G5:1 |', { start: TURN, gate: 1, checkBars: BAR }),
    TURN,
    [0.62, 0.68, 0.74, 0.86],
  );
  return concatNotes(
    phrase(A, ARCH_A),
    counter(A2),
    lean(answer, [[B + 24, B + 27]]),
    phrase(C, ARCH_C, 12),
    counter(D + 16, 4),
    lean(turn, [[TURN + 8, TURN + 12]]),
  );
}

/** Horns carry the tune in unison — a line, never a call. */
function horns(): Note[] {
  const dyads = (at: number, symbols: string[], v: number): Note[] =>
    symbols.flatMap((s, i): Note[] => {
      const root = rootIn(s, 3) - (rootIn(s, 3) > 55 ? 12 : 0);
      return [
        [at + i * BAR, BAR * 0.55, root, v * 0.84],
        [at + i * BAR + BAR * 0.5, BAR * 0.6, root, v],
        [at + i * BAR, BAR * 1.05, root + 7, v * 0.8],
      ];
    });
  return concatNotes(
    dyads(8, ['F', 'G'], 0.5),
    phrase(A2, ARCH_A2, 0, 0.96),
    phrase(C, ARCH_C.map((v) => v - 0.06), 0, 0.96),
    dyads(TURN, ['F', 'G', 'F', 'G'], 0.66),
  );
}

/** The flute at range: FAREWELL_RISE then FAREWELL_FALL, both at double length. */
function flute(): Note[] {
  const rise = cell(augment(FAREWELL_RISE, 2), B + 2, 'A5');
  const fall = cell(augment(FAREWELL_FALL, 2), B + 10, 'A5');
  const shaped = [...rise, ...fall].map((n, i): Note => [n[0], n[1], n[2], [0.5, 0.56, 0.62, 0.68, 0.74, 0.6][i] ?? 0.6]);
  return lean(shaped, [[B + 10, B + 16]]);
}

// --- Piano: a sparkle over the strings at A, the air at B, the tune alone at D

function pianoLead(): Note[] {
  const leftHand: Note[] = [];
  for (let half = 0; half < 16; half++) {
    const at = D + half * 2;
    const symbol = chordAt(at);
    if (half % 2 === 1 && symbol === chordAt(at - 2)) continue;
    const root = rootIn(symbol, 2);
    const v = 0.5 + 0.03 * Math.floor(half / 4);
    leftHand.push([at, 1.8, root, v + 0.04], [at, 1.8, root + 12, v]);
  }
  return concatNotes(
    phrase(A, ARCH_A.map((v) => v - 0.24), 12, 0.85),
    phrase(D, ARCH_D, 0, 0.95),
    leftHand,
  );
}

/** Open five-note voicings, rippled up and back in eighths. */
function pianoAir(): Note[] {
  const ripple = [0, 1, 2, 3, 4, 3, 2, 1];
  const notes: Note[] = [];
  const bars = (from: number, count: number, v: number): void => {
    for (let bar = 0; bar < count; bar++) {
      for (let s = 0; s < 8; s++) {
        const at = from + bar * BAR + s * 0.5;
        const voicing = OPEN_VOICING[chordAt(at)] ?? OPEN_VOICING.Am!;
        const top = s === 4 ? 0.1 : 0;
        const ring = chordAt(at + 0.5) === chordAt(at) ? 0.9 : 0.5; // pedal, cleared at a chord change
        notes.push([at, ring, voicing[ripple[s]!]!, v + top + (s === 0 ? 0.06 : 0) - s * 0.008]);
      }
    }
  };
  bars(8, 2, 0.34);
  bars(B, 7, 0.46);
  bars(B + 28, 1, 0.4);
  bars(TURN, 4, 0.44);
  return notes.filter((n) => n[0] < STOP || n[0] >= C);
}

// --- The engine room

/** Open fifths per half bar: root, fifth, octave, fifth. Eighths, sixteenths at C. */
function ostinato(): Note[] {
  const notes: Note[] = [];
  const run = (from: number, to: number, step: number, v: number): void => {
    let i = 0;
    for (let at = from; at < to - 1e-9; at += step, i++) {
      const root = rootIn(chordAt(at), 4);
      const tone = root + [0, 7, 12, 7][i % 4]!;
      notes.push([at, step * 0.8, tone, v * offbeatAccent((at - from) % 1)]);
    }
  };
  run(8, A, 0.5, 0.5);
  run(A, B, 0.5, 0.66);
  run(C, D, 0.25, 0.72);
  run(D, TURN, 0.5, 0.6);
  run(TURN, LENGTH, 0.5, 0.72);
  return breathe(notes, 16, 0.08);
}

/** Driving eighths: root, octave, root, fifth — the and-of-beat always louder. */
function bassDrive(): Note[] {
  const notes: Note[] = [];
  for (let at = 0; at < LENGTH; at += 0.5) {
    const inB = at >= B && at < C;
    const root = rootIn(chordAt(at), 2) - (rootIn(chordAt(at), 2) > 45 ? 12 : 0);
    if (at < 8) {
      if (at % 2 === 0) notes.push([at, 1.8, root, 0.5]);
      continue;
    }
    if (inB) {
      if (at % 2 === 0) notes.push([at, 1.7, root, 0.6]);
      continue;
    }
    const degree = [0, 12, 0, 7][Math.round(at * 2) % 4]!;
    notes.push([at, 0.42, root + degree, offbeatAccent(at)]);
  }
  return notes;
}

const sub = (): Note[] =>
  breathe(Array.from({ length: LENGTH / BAR }, (_, bar): Note => [bar * BAR, 3.8, rootIn(chordAt(bar * BAR), 1), bar >= 28 && bar < 36 ? 0.56 : 0.46]), 32, 0.1);

/** A1 and E2 under everything: altitude. Eight-beat bows, swelled by tied attacks. */
function drone(): Note[] {
  const notes: Note[] = [];
  for (let at = 0; at < LENGTH; at += 8) {
    const len = at + 8 === C ? 7 : 8;
    const v = at < A ? 0.4 + at * 0.02 : 0.5;
    notes.push([at, len * 0.55, 'A1', v * 0.9], [at + len * 0.45, len * 0.55, 'A1', v]);
    notes.push([at, len * 0.55, 'E2', v * 0.8], [at + len * 0.45, len * 0.55, 'E2', v * 0.9]);
  }
  return breathe(notes, 48, 0.12);
}

/** Two-note low stabs in the figure's rests: the ship answering, not announcing. */
function stabs(): Note[] {
  const notes: Note[] = [];
  const at = (from: number, bars: number, v: number): void => {
    for (let bar = 1; bar < bars; bar += 2) {
      const beat = from + bar * BAR;
      const root = rootIn(chordAt(beat), 3) - (rootIn(chordAt(beat), 3) > 57 ? 12 : 0);
      notes.push([beat + 2.5, 0.45, root, v * 0.95], [beat + 3, 0.9, root - 5, v * 0.8]);
    }
  };
  at(A2, 8, 0.78);
  at(C, 8, 0.9);
  at(TURN, 4, 0.86);
  return notes;
}

/** Five clangs where four would fit: a driveshaft slightly out of true. */
function clangs(): Note[] {
  const notes: Note[] = [];
  const run = (from: number, to: number, every: number, v: number): void => {
    let i = 0;
    for (let at = from; at < to - 1e-9; at += every, i++) {
      notes.push([at, 0.6, i % 3 === 2 ? 'A2' : 'D3', v * (i % 4 === 0 ? 1 : 0.78)]);
    }
  };
  run(0, A, 1.25, 0.52);
  run(A, B, 1.25, 0.42);
  run(B, STOP, 2.5, 0.3);
  run(C, D, 1.25, 0.5);
  run(D, LENGTH, 1.25, 0.44);
  return notes;
}

function bars(pattern: string, from: number, to: number, pitch: string, v: number, accent = 1.3): Note[] {
  const count = Math.round((to - from) / BAR);
  return count > 0
    ? drumLine(pattern, { start: from, step: 0.25, pitch, velocity: v, accentVelocity: Math.min(1, v * accent), times: count })
    : [];
}

function taiko(): Note[] {
  return concatNotes(
    bars('X.......x...x...', 0, A, 'A1', 0.6),
    bars('X.....x.....x...', A, B, 'A1', 0.64),
    bars('X...............', B, C, 'A1', 0.5),
    bars('X.x.....X.x...x.', C, D, 'A1', 0.7),
    bars('X.....x.....x...', D, TURN, 'A1', 0.6),
    bars('X.....x.....x...', TURN, LENGTH - BAR, 'A1', 0.7),
    bars('X...X...X.X.XXXX', LENGTH - BAR, LENGTH, 'A1', 0.72),
  );
}

function kit(): { kick: Note[]; snare: Note[]; hats: Note[]; toms: Note[]; crash: Note[]; timpani: Note[] } {
  const kick = concatNotes(
    bars('x.....X.x.X.....', A, B, 'C1', 0.72),
    bars('x.X...X.x.X...X.', C, D, 'C1', 0.76),
    bars('x.....X.x.......', D, TURN, 'C1', 0.62),
    bars('x.....X.x.X.....', TURN, LENGTH, 'C1', 0.74),
  );
  const snare = concatNotes(
    bars('....X..g....X.g.', A, B, 'D2', 0.7),
    bars('....X..g....X.gX', C, D, 'D2', 0.8),
    bars('....X.......X...', D + 16, TURN, 'D2', 0.62),
    bars('....X..g....X.g.', TURN, TURN + 8, 'D2', 0.72),
    Array.from({ length: 32 }, (_, s): Note => [TURN + 8 + s * 0.25, 0.24, 'D2', 0.32 + (s / 32) * 0.58]),
  );
  const hats = concatNotes(
    bars('..............x.', 12, A, 'F#3', 0.3),
    bars('x.X.x.X.x.X.x.X.', A, B, 'F#3', 0.34, 1.45),
    bars('x...x...x...x...', B, C, 'F#3', 0.26),
    bars('xxXxxxXxxxXxxxXx', C, D, 'F#3', 0.38, 1.4),
    bars('x.X.x.X.x.X.x.X.', D, LENGTH, 'F#3', 0.32, 1.45),
  );
  const fill = 'A3:0.25 A3:0.25 F3:0.25 F3:0.25 D3:0.25 D3:0.25 C3:0.5';
  const toms = concatNotes(
    tracker(fill, { start: A2 - 2, velocity: 0.7 }),
    tracker(fill, { start: D - 2, velocity: 0.76 }),
    tracker('D3:0.5 C3:0.5 A2:1', { start: LENGTH - 2, velocity: 0.7 }),
  );
  const crash: Note[] = [A, A2, C, D, TURN].map((at, i): Note => [at, 1.6, 'C5', i === 2 ? 0.7 : 0.54]);
  const roll = (at: number, n: number, pitch: string, from: number, by: number): Note[] =>
    Array.from({ length: n }, (_, s): Note => [at + s * 0.25, 0.3, pitch, from + s * by]);
  const hits: Array<[number, string, number]> = [
    [A2, 'A2', 0.6], [C, 'A2', 0.78], [C + 8, 'A2', 0.62], [C + 16, 'A2', 0.7], [C + 24, 'F2', 0.66],
    [TURN, 'F2', 0.62], [TURN + 4, 'G2', 0.64], [TURN + 8, 'F2', 0.66],
  ];
  const timpani = concatNotes(
    roll(12, 16, 'E2', 0.26, 0.03),
    hits.map(([at, pitch, v]): Note => [at, 1.4, pitch, v]),
    roll(TURN + 14, 8, 'G2', 0.44, 0.05),
  );
  return { kick, snare, hats, toms, crash, timpani };
}

const K = kit();

export const bossEvraeTrack: Track = {
  name: 'boss-evrae',
  bpm: 144,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 2.5,
  fx: {
    reverb: { room: 0.62, damp: 0.46, width: 0.95, preDelay: 0.014 },
    delay: { timeBeats: 0.75, feedback: 0.26, damp: 3000 },
  },
  channels: [
    { name: 'bass drive', instrument: 'bass', volume: 0.86, pan: 0, notes: macro(bassDrive()), fx: { reverb: 0.06 } },
    { name: 'sub', instrument: 'bass-sub', volume: 0.4, pan: 0, notes: macro(sub()) },
    { name: 'altitude drone', instrument: 'strings-low', volume: 0.5, pan: -0.05, notes: macro(drone()), fx: { reverb: 0.4 } },
    { name: 'kick', instrument: 'kick', volume: 0.86, pan: 0, notes: macro(K.kick) },
    { name: 'snare', instrument: 'snare', volume: 0.7, pan: -0.05, notes: macro(K.snare), fx: { reverb: 0.16 } },
    { name: 'hats', instrument: 'hat', volume: 0.34, pan: 0.2, notes: macro(K.hats) },
    { name: 'toms', instrument: 'tom', volume: 0.55, pan: -0.15, notes: macro(K.toms), fx: { reverb: 0.2 } },
    { name: 'crash', instrument: 'crash', volume: 0.4, pan: 0.1, notes: macro(K.crash), fx: { reverb: 0.3 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.62, pan: -0.2, notes: macro(taiko()), fx: { reverb: 0.26 } },
    { name: 'engine clangs', instrument: 'metal-hit', volume: 0.3, pan: 0.35, notes: macro(clangs()), fx: { reverb: 0.3 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.6, pan: 0.08, notes: macro(K.timpani), fx: { reverb: 0.3 } },
    { name: 'string ostinato', instrument: 'strings-short', volume: 0.5, pan: 0.3, notes: macro(ostinato()), fx: { reverb: 0.22 } },
    { name: 'low stabs', instrument: 'brass-stab', volume: 0.44, pan: -0.3, notes: macro(stabs()), fx: { reverb: 0.2 } },
    { name: 'strings lead', instrument: 'strings', volume: 0.8, pan: 0.12, notes: macro(stringsLead()), fx: { reverb: 0.3, delay: 0.08 } },
    { name: 'horns', instrument: 'brass', volume: 0.72, pan: -0.14, notes: macro(horns()), fx: { reverb: 0.26 } },
    { name: 'piano lead', instrument: 'piano', volume: 0.62, pan: -0.08, notes: macro(pianoLead()), fx: { reverb: 0.28 } },
    { name: 'piano air', instrument: 'piano', volume: 0.5, pan: 0.06, notes: macro(pianoAir()), fx: { reverb: 0.36, delay: 0.1 } },
    { name: 'flute', instrument: 'flute', volume: 0.5, pan: -0.06, notes: macro(flute()), fx: { reverb: 0.34, delay: 0.14 } },
  ],
};

export default bossEvraeTrack;
