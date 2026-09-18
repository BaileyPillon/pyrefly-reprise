/**
 * "Hold the Trail" — the regular FFX fight.
 *
 * ORIGINAL COMPOSITION. E minor, 4/4, 150 bpm. Strings-and-band: a marcato
 * string ostinato and a rock kit under a tune the player is supposed to be
 * humming by the second encounter.
 *
 * THEMES (docs/audio/THEMES.md §6 and the cue map, row 4)
 *   BATTLE_HOOK, in full and three times over — the four-bar question that
 *   climbs to the octave over C - D - Em (the score's bVI-bVII-i fingerprint,
 *   here at speed), and the four-bar answer that lands the ONE authentic
 *   cadence in the whole FFX material: B7 - Em, with D#5 resolving up to E5.
 *   FATHER's *rhythm* only — never his pitches — in the kit and the bass. The
 *   regular battle borrows the father's energy, not his theme, so the bass
 *   moves in roots, fifths and octaves on his off-beat attack points and the
 *   kick sits exactly where his riff does.
 *
 * THE ONE EMOTION: we can win this.
 *
 * Performance rules applied: the and-of-beat is LOUDER than the downbeat
 * (0.95 against 0.72-0.80) in kit and bass, and no humaniser levels it; the
 * melody is gated 0.98-1.0 so the line is a phrase and not a row of events;
 * every section has its own velocity arch; the hook breathes — bar 2 of each
 * phrase has a beat of rest in the tune and nothing fills it.
 *
 * Form (48 bars, 192 beats, 76.8 s):
 *   bars  1- 4  intro    beats   0- 16  kit + bass alone on the father's rhythm
 *   bars  5-12  A        beats  16- 48  BATTLE_HOOK, strings              <- loop start
 *   bars 13-20  A'       beats  48- 80  the hook again, brass on the tune, the V-i lands
 *   bars 21-28  B        beats  80-112  the lyrical answer, flute doubling, no dominant
 *   bars 29-36  C        beats 112-144  climax: the hook's head, then a new peak on E6
 *   bars 37-44  A''      beats 144-176  the hook a third time, stripped back
 *   bars 45-48  turn     beats 176-192  four bars of bVII leaning home into the loop
 */

import {
  arpLine,
  chordMidis,
  chordRoots,
  concatNotes,
  drumLine,
  parseChord,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { BATTLE_CHORDS, BATTLE_HOOK } from './themes.ts';

const BAR = 4;

const A = 16;
const A2 = 48;
const B = 80;
const C = 112;
const A3 = 144;
const TURN = 176;
const LENGTH = 192;

/** Half-bar harmony. The hook's own chords come from the bible; the rest is written around them. */
const INTRO_HALF = ['Em', 'Em', 'Em', 'Em', 'Em', 'Em', 'D', 'D'];
const HOOK_HALF = BATTLE_CHORDS;
const B_HALF = ['G', 'G', 'D', 'D', 'Em', 'Em', 'C', 'C', 'Am', 'Am', 'C', 'C', 'D', 'D', 'Em', 'Em'];
const C_HALF = ['C', 'C', 'D', 'D', 'Em', 'Em', 'Em', 'Em', 'Am', 'Am', 'C', 'C', 'D', 'D', 'Em', 'Em'];
const TURN_HALF = ['Am', 'Am', 'C', 'C', 'D', 'D', 'D', 'D'];

/** Every half bar of the cue, in order — the bass, the sub and the stabs all read this. */
const ALL_HALF = [
  ...INTRO_HALF,
  ...HOOK_HALF,
  ...HOOK_HALF,
  ...B_HALF,
  ...C_HALF,
  ...HOOK_HALF,
  ...TURN_HALF,
];

/** One symbol per bar, for anything that changes no faster than the bar line. */
const ALL_BARS = ALL_HALF.filter((_, i) => i % 2 === 0);

// ---------------------------------------------------------------------------
// The father's rhythm, without the father's pitches
// ---------------------------------------------------------------------------

/**
 * FATHER's attack points, cut into two-beat cells so they can follow half-bar
 * harmony. `off` is his bar 1 (everything off the beat), `push` is his bar 2
 * (the crowded one, with the sixteenth), `land` is his bar 4 (the only bar in
 * the riff that lands on a downbeat). Pitches are scale-free: root, fifth,
 * octave, chosen per cell, so the rhythm is quoted and the tune is not.
 */
const CELLS: Record<string, number[]> = {
  off: [0.5, 1.5],
  push: [0.5, 0.75, 1.75],
  land: [0, 0.75, 1, 1.5],
};

/** Eight half bars of bass: which cell, and which degrees it plays. */
const BASS_CYCLE: Array<{ cell: keyof typeof CELLS | string; degrees: number[] }> = [
  { cell: 'off', degrees: [0, 0] },
  { cell: 'off', degrees: [0, 7] },
  { cell: 'push', degrees: [0, 0, 12] },
  { cell: 'off', degrees: [7, 0] },
  { cell: 'off', degrees: [0, 0] },
  { cell: 'off', degrees: [0, 12] },
  { cell: 'push', degrees: [0, 7, 0] },
  { cell: 'land', degrees: [12, 7, 0, 0] },
];

/**
 * MACRO DYNAMICS — the single most important number set in this file.
 *
 * Battle music is the easiest thing in a score to render as a wall: every
 * section has the same instruments playing the same density, the master
 * normalises it, and eighty seconds come out at one unvarying level. The
 * first render of this cue measured 2.7 dB from its quietest second to its
 * loudest, which is not music, it is a texture.
 *
 * So every channel is multiplied by its section's weight before anything
 * else touches it: the intro is thin, the B section genuinely steps back so
 * the climax has somewhere to come from, and the turnaround throws it home.
 */
function macroLevel(beat: number): number {
  if (beat < A) return 0.62;
  if (beat < A2) return 0.82;
  if (beat < B) return 0.92;
  if (beat < C) return 0.66;
  if (beat < A3) return 1;
  if (beat < TURN) return 0.84;
  return 0.98;
}

function macro(notes: Note[]): Note[] {
  return notes.map((n): Note => [n[0], n[1], n[2], Math.min(1, (n[3] ?? 0.8) * macroLevel(n[0]))]);
}


/**
 * Nothing in this score holds one velocity for thirty seconds. A drone, a
 * shaker or a held pad written at a fixed level is the most machine-like
 * thing a mock-up can do, and it is also the easiest thing to fix: a slow
 * sine and a deterministic per-note wobble, both small enough that nobody
 * hears the device and everybody hears that the sound is alive.
 */
function breathe(notes: Note[], periodBeats: number, depth: number, wobble = 0): Note[] {
  return notes.map((n, i): Note => {
    const swell = 1 + depth * Math.sin((2 * Math.PI * n[0]) / periodBeats);
    const jitter = wobble === 0 ? 1 : 1 + wobble * Math.sin(i * 2.399963);
    return [n[0], n[1], n[2], Math.max(0.02, Math.min(1, (n[3] ?? 0.8) * swell * jitter))];
  });
}

/** The rule, as code: an attack on the beat is 0.80, an attack off it is 0.95. */
function attackVelocity(offset: number): number {
  if (offset % 1 === 0) return 0.8;
  if (offset % 0.5 === 0) return 0.95;
  return 0.88;
}

function bassLine(): Note[] {
  const roots = ALL_HALF.map((symbol) => {
    const spec = parseChord(symbol);
    return 36 + (spec.bass ?? spec.root); // E2 = 40, so the riff sits E2-E3
  });
  const notes: Note[] = [];
  roots.forEach((root, half) => {
    const at = half * 2;
    const step = BASS_CYCLE[half % BASS_CYCLE.length]!;
    const offsets = CELLS[step.cell]!;
    offsets.forEach((offset, i) => {
      const degree = step.degrees[i % step.degrees.length]!;
      const quiet = at < A ? 0.86 : 1;
      notes.push([at + offset, 0.44, root + degree, attackVelocity(offset) * quiet]);
    });
  });
  return notes;
}

// The kick lands on the father's off-beats and stays quieter on the downbeat.
const KICK_OFF = 'x.X...X...X...X.';
const KICK_PUSH = 'x.XX..X...X...X.';
const KICK_LAND = 'X.....X.X.X...X.';
const SNARE = '....X..g....X.g.';
const SNARE_FILL = '....X..g..X.XgXX';
const HAT_EIGHTHS = 'x.X.x.X.x.X.x.X.';
const HAT_SIXTEENTHS = 'xxXxxxXxxxXxxxXx';

function kickLine(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar * BAR < LENGTH; bar++) {
    const at = bar * BAR;
    const pattern = bar % 4 === 1 ? KICK_PUSH : bar % 4 === 3 ? KICK_LAND : KICK_OFF;
    const level = at < A ? 0.66 : at >= B && at < C ? 0.6 : at >= C && at < A3 ? 0.78 : 0.72;
    notes.push(
      ...drumLine(pattern, { start: at, pitch: 'C1', velocity: level, accentVelocity: Math.min(1, level * 1.34) }),
    );
  }
  return notes;
}

function snareLine(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar * BAR < LENGTH; bar++) {
    const at = bar * BAR;
    if (at < 8) continue; // the first two bars are bass and kick only
    if (at >= C - 2 * BAR && at < C) {
      // Two bars of crescendo pushing into the climax — written, not a preset roll.
      for (let s = 0; s < 16; s++) {
        const t = (at - (C - 2 * BAR)) / (2 * BAR) + s / 32;
        notes.push([at + s * 0.25, 0.24, 'D2', 0.3 + t * 0.6]);
      }
      continue;
    }
    const fill = bar % 8 === 7;
    const level = at >= B && at < C ? 0.62 : at >= C && at < A3 ? 0.84 : 0.74;
    notes.push(...drumLine(fill ? SNARE_FILL : SNARE, { start: at, pitch: 'D2', velocity: level }));
  }
  return notes;
}

function hatLine(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar * BAR < LENGTH; bar++) {
    const at = bar * BAR;
    const dense = at >= C && at < A3;
    const level = at < A ? 0.3 : at >= B && at < C ? 0.26 : dense ? 0.42 : 0.36;
    notes.push(
      ...drumLine(dense ? HAT_SIXTEENTHS : HAT_EIGHTHS, {
        start: at,
        pitch: 'F#3',
        velocity: level,
        accentVelocity: Math.min(1, level * 1.5),
      }),
    );
  }
  return notes;
}

function crashLine(): Note[] {
  return [A, A2, B, C, A3, TURN].map((beat, i): Note => [beat, 1.6, 'C5', i === 3 ? 0.66 : 0.52]);
}

function tomFills(): Note[] {
  const fill = 'A3:0.25 A3:0.25 F3:0.25 F3:0.25 D3:0.25 D3:0.25 C3:0.5';
  return concatNotes(
    tracker(fill, { start: A2 - 2, velocity: 0.72 }),
    tracker(fill, { start: A3 - 2, velocity: 0.8 }),
    tracker('D3:0.5 C3:0.5 A2:1', { start: TURN - 2, velocity: 0.66 }),
  );
}

// ---------------------------------------------------------------------------
// The tune
// ---------------------------------------------------------------------------

/**
 * B — the lyrical answer. No dominant anywhere: the cue's one B7 belongs to
 * the hook's cadence and nowhere else, which is what keeps it worth hearing.
 * The A5 over C in bar 4 and the B5 over D in bar 7 are added sixths, the
 * Hamauzu colour the bible asks for wherever the mood softens.
 */
const B_LEAD = `
  B4:1 D5:1 G5:2       | F#5:1 D5:1 A4:2     |
  B4:1 E5:1 G5:1 B5:1  | A5:2 G5:2           |
  A4:1 C5:1 E5:2       | G5:1 E5:1 C5:2      |
  D5:1 F#5:1 A5:1 B5:1 | E5:4                |
`;

/**
 * C — the climax. It opens with the hook's own head so the ear knows where it
 * is, then goes somewhere the hook never does: E6, the highest note in the
 * cue, on the last downbeat of the section.
 */
const C_LEAD = `
  E5:0.5 G5:0.5 B5:1 C6:1 B5:1   | A5:0.5 B5:0.5 D6:2 -:1 |
  E6:1 D6:1 B5:2                 | G5:1 A5:1 B5:2         |
  A5:0.5 C6:0.5 E6:1 D6:1 B5:1   | C6:1 B5:1 G5:2         |
  F#5:1 A5:1 D6:1 B5:1           | E6:4                   |
`;

/** A four-bar arch per phrase: swell, top, fall back. Never a flat channel. */
const ARCH_A = [0.66, 0.74, 0.7, 0.78, 0.7, 0.76, 0.82, 0.86];
const ARCH_B = [0.6, 0.68, 0.66, 0.74, 0.64, 0.7, 0.76, 0.72];
const ARCH_C = [0.78, 0.86, 0.9, 0.82, 0.84, 0.88, 0.9, 0.94];
const ARCH_A3 = [0.6, 0.68, 0.64, 0.72, 0.66, 0.7, 0.74, 0.7];

/** Bars are counted from the section start, so the arch table lines up. */
function sectionShape(notes: Note[], start: number, arch: number[]): Note[] {
  return notes.map((n): Note => {
    const bar = Math.floor((n[0] - start) / BAR);
    return [n[0], n[1], n[2], arch[Math.min(Math.max(bar, 0), arch.length - 1)] ?? n[3]];
  });
}

function hook(start: number, arch: number[], transpose = 0): Note[] {
  return sectionShape(tracker(BATTLE_HOOK, { start, transpose, gate: 0.99, checkBars: BAR }), start, arch);
}

function stringsLead(): Note[] {
  return concatNotes(
    hook(A, ARCH_A),
    sectionShape(tracker(B_LEAD, { start: B, gate: 0.99, checkBars: BAR }), B, ARCH_B),
    sectionShape(tracker(C_LEAD, { start: C, gate: 0.99, checkBars: BAR }), C, ARCH_C),
    hook(A3, ARCH_A3),
  );
}

/** Brass takes the tune at A' and doubles the climax an octave down. */
function brassLead(): Note[] {
  return concatNotes(
    hook(A2, ARCH_A.map((v) => v + 0.04)),
    sectionShape(
      tracker(C_LEAD, { start: C, transpose: -12, gate: 0.98, checkBars: BAR }),
      C,
      ARCH_C.map((v) => v - 0.1),
    ),
  );
}

/** Flute doubles the lyrical answer an octave up — air over the ostinato, nothing more. */
function fluteLine(): Note[] {
  return sectionShape(
    tracker(B_LEAD, { start: B, transpose: 12, gate: 0.99, checkBars: BAR }),
    B,
    ARCH_B.map((v) => v - 0.14),
  );
}

/** Strings double the hook an octave below from A' onward, so the sound widens with the form. */
function stringsLow(): Note[] {
  return concatNotes(
    hook(A2, ARCH_A.map((v) => v - 0.12), -12),
    hook(A3, ARCH_A3.map((v) => v - 0.1), -12),
  );
}

// ---------------------------------------------------------------------------
// The engine underneath
// ---------------------------------------------------------------------------

function ostinato(): Note[] {
  const bars = (from: number, count: number): string[] =>
    ALL_HALF.slice(from / 2, from / 2 + count * 2).filter((_, i) => i % 2 === 0);
  return concatNotes(
    arpLine(bars(A, 8), {
      start: A, pattern: [0, 1, 2, 1], step: 0.5, dur: 0.42, octave: 4, center: 71, velocity: 0.46,
    }),
    arpLine(bars(A2, 8), {
      start: A2, pattern: [0, 1, 2, 3], step: 0.5, dur: 0.42, octave: 4, center: 71, velocity: 0.52, accent: 1.25,
    }),
    arpLine(bars(B, 8), {
      start: B, pattern: [0, 1, 2, 1], step: 1, dur: 0.85, octave: 4, center: 71, velocity: 0.4,
    }),
    arpLine(bars(C, 8), {
      start: C, pattern: [0, 1, 2, 3, 2, 1, 2, 1], step: 0.25, dur: 0.22, octave: 4, center: 73, velocity: 0.54, accent: 1.3,
    }),
    arpLine(bars(A3, 8), {
      start: A3, pattern: [0, 1, 2, 1], step: 0.5, dur: 0.42, octave: 4, center: 71, velocity: 0.44,
    }),
    arpLine(bars(TURN, 4), {
      start: TURN, pattern: [0, 1, 2, 3], step: 0.5, dur: 0.42, octave: 4, center: 71, velocity: 0.56, accent: 1.3,
    }),
  );
}

/** Short chord hits off the beat — and, per the rule, louder there than on it. */
function stabs(): Note[] {
  const notes: Note[] = [];
  const place = (from: number, bars: number, offsets: number[], level: number): void => {
    for (let bar = 0; bar < bars; bar++) {
      const at = from + bar * BAR;
      const symbol = ALL_BARS[at / BAR]!;
      for (const offset of offsets) {
        for (const midi of chordMidis(symbol, { octave: 4, center: 67 })) {
          notes.push([at + offset, 0.28, midi, attackVelocity(offset) * level]);
        }
      }
    }
  };
  place(A2, 8, [1.5, 2.5], 0.8);
  place(C, 8, [0, 1.5, 3.5], 0.92);
  place(A3, 8, [1.5], 0.72);
  place(TURN, 4, [0, 1.5, 2.5], 0.95);
  return notes;
}

function timpaniLine(): Note[] {
  const notes: Note[] = [];
  const roots = chordRoots(ALL_BARS, 2);
  for (const [from, bars, level] of [
    [A2, 8, 0.52],
    [C, 8, 0.72],
    [TURN, 4, 0.68],
  ] as Array<[number, number, number]>) {
    for (let bar = 0; bar < bars; bar++) {
      const at = from + bar * BAR;
      notes.push([at, 1.4, roots[at / BAR]!, level]);
      if (bar % 2 === 1) notes.push([at + 2.5, 0.8, roots[at / BAR]!, level * 0.68]);
    }
  }
  return notes;
}

function subLine(): Note[] {
  return ALL_BARS.map((symbol, bar): Note => {
    const root = chordRoots([symbol], 1)[0]!;
    const at = bar * BAR;
    const level = at < A ? 0.4 : at >= C && at < A3 ? 0.56 : 0.48;
    return [at, 3.6, root, level];
  });
}

export const battleTrack: Track = {
  name: 'battle-ffx',
  bpm: 150,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 2.5,
  fx: {
    reverb: { room: 0.56, damp: 0.5, width: 0.85, preDelay: 0.01 },
    delay: { timeBeats: 0.75, feedback: 0.24, damp: 2800 },
  },
  channels: [
    { name: 'bass riff', instrument: 'bass', volume: 0.92, pan: 0, notes: macro(bassLine()), fx: { reverb: 0.05 } },
    { name: 'kick', instrument: 'kick', volume: 0.9, pan: 0, notes: macro(kickLine()) },
    { name: 'snare', instrument: 'snare', volume: 0.74, pan: -0.05, notes: macro(snareLine()), fx: { reverb: 0.16 } },
    { name: 'hats', instrument: 'hat', volume: 0.36, pan: 0.2, notes: macro(hatLine()) },
    { name: 'toms', instrument: 'tom', volume: 0.55, pan: -0.15, notes: macro(tomFills()), fx: { reverb: 0.2 } },
    { name: 'crash', instrument: 'crash', volume: 0.42, pan: 0.1, notes: macro(crashLine()), fx: { reverb: 0.3 } },
    {
      name: 'string ostinato',
      instrument: 'strings-short',
      volume: 0.52,
      pan: 0.3,
      notes: macro(breathe(ostinato(), 16, 0.13, 0.06)),
      fx: { reverb: 0.22 },
    },
    { name: 'brass stabs', instrument: 'brass-stab', volume: 0.46, pan: -0.3, notes: macro(stabs()), fx: { reverb: 0.18 } },
    { name: 'strings lead', instrument: 'strings', volume: 0.82, pan: 0.12, notes: macro(stringsLead()), fx: { reverb: 0.3, delay: 0.1 } },
    { name: 'brass lead', instrument: 'brass', volume: 0.78, pan: -0.14, notes: macro(brassLead()), fx: { reverb: 0.22, delay: 0.08 } },
    { name: 'flute', instrument: 'flute', volume: 0.5, pan: -0.06, notes: macro(fluteLine()), fx: { reverb: 0.3, delay: 0.14 } },
    { name: 'strings low', instrument: 'strings-low', volume: 0.55, pan: -0.1, notes: macro(stringsLow()), fx: { reverb: 0.26 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.62, pan: 0.08, notes: macro(timpaniLine()), fx: { reverb: 0.3 } },
    { name: 'sub', instrument: 'bass-sub', volume: 0.4, pan: 0, notes: macro(breathe(subLine(), 32, 0.12)) },
  ],
};

export default battleTrack;
