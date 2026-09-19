/**
 * "Iron Verdict" — Vegnagun, the machine nobody is driving.
 *
 * ORIGINAL COMPOSITION. Electronic-orchestral menace in F minor at 168 bpm:
 * a machine pulse that never varies, low brass in bare octaves, choir slabs,
 * and an orchestra that keeps trying to make music out of it.
 *
 * THEMES (docs/audio/THEMES.md §5, cue map row 18). Everything here is
 * `SONGSTRESS_DARK` — b3 up to b6, home to the 5, which in F minor is
 * Ab - Db - C. Three things mechanise it:
 *
 *   1. CONSTANT NOTE LENGTHS AND CONSTANT VELOCITY on every machine layer,
 *      and — since the renderer grew per-channel performance overrides —
 *      TIMING TO MATCH. THEMES.md's humanisation table gives this cue and the
 *      Yunalesca canon a ceiling of `<= 3 ms`, and the cue map row says it
 *      again. It is a ceiling for the cue, not for the machine layers only:
 *      an earlier draft left the brass at 16 ms, the choir at 34 and the
 *      strings at 14 on the argument that the orchestra on top should still
 *      breathe, which is a nice idea and not what the bible says. It is also
 *      the wrong reading. The lurch is the only thing in this cue allowed to
 *      be out of time; if the choir is loose as well, the lurch stops being
 *      an event. So every channel is pulled onto the grid with `perform`,
 *      the choir last and only to the ceiling itself — the players have been
 *      dragged onto the machine's clock, which is the thing to be afraid of.
 *   2. BARE OCTAVES. The cell in the low brass has no third and no harmony
 *      under it — an interval, not a chord.
 *   3. NO MODULATION. The Songstress's bridge is functional ii-V motion; here
 *      it is stripped to one pedal F that never moves for ninety seconds. The
 *      ostinato's four pitches are the cell's own, cycling forever.
 *
 * The LURCH is the only thing that ever goes wrong: the ostinato's cycle is
 * written a sixteenth short, so it walks out of phase with the bar and then
 * slams back onto the downbeat. Nobody is driving.
 *
 * NO LEAN, AND NO TEMPO MAP, ON PURPOSE. `SONGSTRESS_DARK`'s b6 falling to
 * the 5 is an appoggiatura everywhere else it appears, and THEMES.md's rule
 * is that the leaning note is the louder one. Here it is deliberately flat:
 * the bible's own exemption is "the two places this document names (the
 * Yunalesca canon at 0.62, Vegnagun's machine)", and a machine that leans on
 * a dissonance is a machine that has an opinion about it. Same for the pulse:
 * the cue has no `tempo` map because the one thing this music must never do
 * is bend. Every other cue in this group got one.
 *
 * FLAT MEANS FLAT, THOUGH. "Deliberately flat" was the intention and not what
 * the score said: the cue-long crescendo on the brass was a smooth `ramp`
 * evaluated per note, so the 5 — struck four beats after the b6 it resolves —
 * came out very slightly the LOUDER of the two. Eleven statements, every one
 * of them a hair backwards, which is the one direction the bible calls "the
 * single loudest tell of a synthetic performance". The crescendo now steps
 * per statement (see `stepRamp`), so within a statement the machine is at one
 * level, exactly as the bible's "constant velocity" exemption describes, and
 * every marked pair measures a delta of exactly 0.000. A machine that steps
 * is also more of a machine than one that glides.
 *
 * Form (4/4, 168 bpm, 64 bars, 91 s):
 *   bars  1- 8  ostinato  beats   0- 32  the pulse alone, spinning up
 *   bars  9-24  A         beats  32- 96  the cell in bare octaves      <- loop start
 *   bars 25-32  lurch     beats  96-128  the cycle slips a sixteenth
 *   bars 33-48  A'        beats 128-192  the cell doubled, choir over it
 *   bars 49-56  apex      beats 192-224  everything, still not moving
 *   bars 57-64  collapse  beats 224-256  layers drop out, the pulse remains
 * Loop 32 -> 256.
 */

import { chordLine, concatNotes, type Note, type Track } from '../score.ts';
import { cell } from './motifs.ts';
import { augment, SONGSTRESS_DARK } from './themes.ts';
import { doubled, groove, humanise, phrase } from './ffx2-common.ts';

const OSTINATO = 0;
const A = 32;
const LURCH = 96;
const A2 = 128;
const APEX = 192;
const COLLAPSE = 224;
const LENGTH = 256;

/** The cell's own pitches, in the order the machine cycles them. */
const CYCLE = ['F2', 'Ab2', 'Db3', 'C3'];

/**
 * The pulse: sixteenths, one velocity, one length, forever. `step` is normally
 * 0.25; the lurch runs it at 0.2344 (a sixteenth short per cycle) so the
 * pattern walks out of phase with the bar instead of stumbling in a way a
 * drummer would.
 */
function pulse(start: number, beats: number, step: number, velocity: number, octave = 0): Note[] {
  const notes: Note[] = [];
  const count = Math.floor(beats / step);
  for (let i = 0; i < count; i++) {
    const pitch = CYCLE[i % CYCLE.length]!;
    notes.push([start + i * step, step * 0.85, pitch, velocity]);
  }
  return octave === 0 ? notes : doubled(notes, octave, 1);
}

const ostinatoNotes = concatNotes(
  pulse(OSTINATO, 32, 0.25, 0.5),
  pulse(A, 64, 0.25, 0.62),
  pulse(LURCH, 32, 0.234375, 0.66),
  pulse(A2, 64, 0.25, 0.66),
  pulse(APEX, 32, 0.25, 0.72),
  pulse(COLLAPSE, 24, 0.25, 0.6),
  pulse(COLLAPSE + 24, 8, 0.25, 0.5),
);

/** The pedal. One note. It is under everything in the cue and it never moves. */
const pedalNotes: Note[] = [
  [OSTINATO, 32, 'F1', 0.5],
  [A, 32, 'F1', 0.62],
  [A + 32, 32, 'F1', 0.62],
  [LURCH, 32, 'F1', 0.66],
  [A2, 32, 'F1', 0.66],
  [A2 + 32, 32, 'F1', 0.68],
  [APEX, 32, 'F1', 0.74],
  [COLLAPSE, 32, 'F1', 0.6],
];

/**
 * The cell in bare octaves, augmented so one statement fills two bars. No
 * third is ever sounded under it: this is an interval, not a progression.
 */
function octaveCell(start: number, root: string, velocity: number): Note[] {
  const line = cell(augment(SONGSTRESS_DARK, 2), start, root, velocity);
  return concatNotes(line, doubled(line, -12, 0.85));
}

/**
 * A fifth above the cell — the upper octave only. Doubling the lower octave a
 * fifth up would put a G right under the choir's Ab, and the whole point of
 * these bare octaves is that nothing sits a semitone from anything.
 */
function fifthAbove(start: number, root: string, velocity: number): Note[] {
  return doubled(cell(augment(SONGSTRESS_DARK, 2), start, root, velocity), 7, 0.72);
}

/**
 * A crescendo that steps rather than glides.
 *
 * `ramp()` interpolates per note, which is right for players and wrong for
 * this desk: one statement of the augmented cell lasts eight beats, so its
 * three notes each land on a different point of the curve and the last one —
 * the 5, resolving down a semitone out of the held b6 — ends up fractionally
 * louder than the note leaning on it. It measured -0.0015 across eleven
 * statements: inaudible, and backwards, and there is no reason to ship a
 * machine that is backwards.
 *
 * So the factor is taken from the START of the statement a note belongs to.
 * The level changes between statements and never inside one.
 */
function stepRamp(
  notes: Note[],
  from: number,
  to: number,
  start: number,
  beats: number,
  stepBeats: number,
): Note[] {
  return notes.map((n) => {
    const block = Math.floor((n[0] - start) / stepBeats) * stepBeats;
    const t = Math.max(0, Math.min(1, block / beats));
    const v = (n[3] ?? 0.8) * (from + (to - from) * t);
    return [n[0], n[1], n[2], Math.max(0.05, Math.min(1, v))] as Note;
  });
}

/** One statement of the augmented cell, and of its retrograde, is eight beats. */
const STATEMENT = 8;

/** The retrograde — the machine running the same four notes backwards. */
const DARK_BACK: Note[] = [
  [0, 2, 7],
  [2, 4, 8],
  [6, 2, 3],
];

const brassNotes = concatNotes(
  octaveCell(A, 'F3', 0.72),
  humanise(concatNotes(cell(DARK_BACK, A + 8, 'F3', 0.68), doubled(cell(DARK_BACK, A + 8, 'F3', 0.68), -12, 0.85)), 0.02, 3),
  octaveCell(A + 16, 'F3', 0.76),
  humanise(concatNotes(cell(DARK_BACK, A + 24, 'F3', 0.7), doubled(cell(DARK_BACK, A + 24, 'F3', 0.7), -12, 0.85)), 0.02, 4),
  octaveCell(A + 32, 'F3', 0.78),
  octaveCell(A + 48, 'F3', 0.8),
  // A': the same statements with a third voice a fifth up — still no third.
  octaveCell(A2, 'F3', 0.82),
  fifthAbove(A2, 'F3', 0.82),
  octaveCell(A2 + 16, 'F3', 0.84),
  octaveCell(A2 + 32, 'F3', 0.86),
  fifthAbove(A2 + 32, 'F3', 0.86),
  octaveCell(A2 + 48, 'F3', 0.88),
  octaveCell(APEX, 'F3', 0.92),
  fifthAbove(APEX, 'F3', 0.92),
  octaveCell(APEX + 16, 'F3', 0.94),
  octaveCell(COLLAPSE, 'F3', 0.66),
);

/**
 * Choir: slabs, not singing. They arrive on the phrase heads, hold four bars
 * and stop. The `choir` preset asks for 34 ms of section jitter, which is
 * right for a choir and wrong for this cue; the channel overrides it to the
 * bible's ceiling of 3 ms — the loosest thing in the cue, and still tighter
 * than any human section has ever been.
 *
 * The voicing is root, b3 and the octave, with NO FIFTH. The cell's b6 (Db)
 * is sounding above them for four beats at a time, and a held C right under it
 * would turn the theme's ache into a semitone cluster. Leaving the fifth out
 * costs nothing: the organ and the pedal have it covered.
 */
function slab(at: number, dur: number, velocity: number): Note[] {
  return [
    [at, dur, 'F3', velocity],
    [at + 0.05, dur - 0.05, 'Ab3', velocity * 0.94],
    [at + 0.1, dur - 0.1, 'F4', velocity * 0.88],
  ];
}

const choirNotes = humanise(
  phrase(
    concatNotes(
      ...[
        { at: A + 32, vel: 0.5, dur: 14 },
        { at: A2, vel: 0.56, dur: 14 },
        { at: A2 + 32, vel: 0.6, dur: 14 },
        { at: APEX, vel: 0.68, dur: 14 },
        { at: APEX + 16, vel: 0.64, dur: 12 },
        { at: COLLAPSE, vel: 0.44, dur: 12 },
      ].map(({ at, vel, dur }) => slab(at, dur, vel)),
    ),
    A,
    LENGTH - A,
    0.1,
  ),
  0.03,
  19,
);

/**
 * Strings: short, stabbed, on the off beats the machine leaves empty. They are
 * the only part of the cue with a human accent pattern, and they lose.
 */
const stringsNotes = humanise(
  concatNotes(
    ...[A2, A2 + 16, A2 + 32, A2 + 48, APEX, APEX + 8, APEX + 16, APEX + 24].map((at) =>
      concatNotes(
        chordLine(['Fm'], { start: at + 1.5, octave: 4, center: 72, velocity: 0.62, dur: 0.4 }),
        chordLine(['Fm'], { start: at + 3.5, octave: 4, center: 72, velocity: 0.7, dur: 0.4 }),
        chordLine(['Db'], { start: at + 6.5, octave: 4, center: 72, velocity: 0.66, dur: 0.4 }),
      ),
    ),
  ),
  0.04,
  23,
);

/** Organ: the floor. Sixteen feet of it, never articulated, only swelling. */
const organNotes: Note[] = [
  [OSTINATO, 32, 'F2', 0.4],
  [A, 64, 'F2', 0.46],
  [LURCH, 32, 'F2', 0.5],
  [A2, 64, 'F2', 0.5],
  [APEX, 32, 'F2', 0.56],
  [COLLAPSE, 32, 'F2', 0.42],
];

/** Industrial percussion: a hammer mill, tuned to the pedal. */
const metalNotes = concatNotes(
  groove('X.......x.......', { start: OSTINATO + 16, bars: 4, pitch: 'F3', velocity: 0.5, seed: 41, drift: 0 }),
  groove('X.......x...x...', { start: A, bars: 16, pitch: 'F3', velocity: 0.56, seed: 42, drift: 0 }),
  groove('X...x...X...x.x.', { start: LURCH, bars: 8, pitch: 'F3', velocity: 0.62, seed: 43, drift: 0 }),
  groove('X.......x...x...', { start: A2, bars: 16, pitch: 'F3', velocity: 0.6, seed: 44, drift: 0 }),
  groove('X...x...X...x...', { start: APEX, bars: 8, pitch: 'F3', velocity: 0.68, seed: 45, drift: 0 }),
  groove('X...............', { start: COLLAPSE, bars: 8, pitch: 'F3', velocity: 0.5, seed: 46, drift: 0 }),
);

const kickNotes = concatNotes(
  groove('X.......X.......', { start: OSTINATO + 8, bars: 6, pitch: 'C2', velocity: 0.62, seed: 47, drift: 0 }),
  groove('X...x...X...x...', { start: A, bars: 16, pitch: 'C2', velocity: 0.74, seed: 48, drift: 0 }),
  groove('X...x...X..x.x..', { start: LURCH, bars: 8, pitch: 'C2', velocity: 0.78, seed: 49, drift: 0 }),
  groove('X...x...X...x...', { start: A2, bars: 16, pitch: 'C2', velocity: 0.8, seed: 50, drift: 0 }),
  groove('X...x...X...x.x.', { start: APEX, bars: 8, pitch: 'C2', velocity: 0.86, seed: 51, drift: 0 }),
  groove('X.......X.......', { start: COLLAPSE, bars: 6, pitch: 'C2', velocity: 0.6, seed: 52, drift: 0 }),
);

/**
 * Timpani: the orchestra's answer to the machine, on the tonic and the fifth.
 * Tuned, struck by a player — and on the grid with everything else, because
 * the ceiling in THEMES.md is the cue's, not the ostinato's. The written
 * velocity shape is where the player is still audible.
 */
const timpaniNotes = humanise(
  [
    [A + 30, 2, 'F2', 0.6],
    [A + 62, 2, 'C2', 0.66],
    [LURCH + 30, 2, 'F2', 0.72],
    [A2 + 62, 2, 'F2', 0.76],
    [APEX - 2, 1, 'C2', 0.7],
    [APEX - 1, 1, 'F2', 0.8],
    [APEX + 30, 2, 'F2', 0.84],
    [COLLAPSE + 30, 2, 'F2', 0.5],
  ] as Note[],
  0.04,
  29,
);

const crashNotes: Note[] = [
  [A, 1.5, 'C4', 0.5],
  [LURCH, 1.5, 'C4', 0.56],
  [A2, 1.5, 'C4', 0.58],
  [APEX, 1.5, 'C4', 0.66],
  [COLLAPSE, 1.5, 'C4', 0.44],
];

/** A high alarm, doubling the cell two octaves up at the apex only. */
const alarmNotes = concatNotes(
  cell(augment(SONGSTRESS_DARK, 2), APEX, 'F5', 0.42),
  cell(augment(SONGSTRESS_DARK, 2), APEX + 16, 'F5', 0.44),
);

export const vegnagunTrack: Track = {
  name: 'boss-vegnagun',
  bpm: 168,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 3.5,
  fx: {
    reverb: { room: 0.72, damp: 0.34, width: 0.92, preDelay: 0.022 },
    delay: { timeBeats: 0.5, feedback: 0.22, damp: 2600 },
  },
  channels: [
    { name: 'pulse', instrument: 'arp-pluck', volume: 0.42, pan: 0.22, notes: ostinatoNotes, fx: { reverb: 0.12, delay: 0.1 } },
    { name: 'pedal', instrument: 'synth-bass', volume: 0.78, pan: 0, notes: pedalNotes, fx: { reverb: 0.06 } },
    { name: 'sub', instrument: 'bass-sub', volume: 0.5, pan: 0, notes: pedalNotes.map((n) => [n[0], n[1], 'F1', (n[3] ?? 0.6) * 0.7] as Note), fx: { reverb: 0.05 } },
    // THEMES.md, Humanisation: "Vegnagun, the Yunalesca canon — <= 3 ms".
    // Every voice in this cue is held under that ceiling by hand, because the
    // presets are written for the orchestra these players used to be.
    // The crescendo steps per statement, so no note inside one is louder than
    // the note it resolves out of. See `stepRamp`.
    { name: 'low brass', instrument: 'brass', volume: 0.74, pan: -0.1, perform: { timingJitterMs: 2 }, notes: stepRamp(brassNotes, 0.94, 1.06, A, LENGTH - A, STATEMENT), fx: { reverb: 0.3 } },
    { name: 'choir', instrument: 'choir', volume: 0.6, pan: 0, perform: { timingJitterMs: 3 }, notes: choirNotes, fx: { reverb: 0.5 } },
    { name: 'strings', instrument: 'strings-short', volume: 0.46, pan: -0.24, perform: { timingJitterMs: 1 }, notes: stringsNotes, fx: { reverb: 0.26 } },
    { name: 'organ', instrument: 'organ', volume: 0.42, pan: 0, notes: organNotes, fx: { reverb: 0.4 } },
    { name: 'hammer', instrument: 'metal-hit', volume: 0.46, pan: 0.3, notes: metalNotes, fx: { reverb: 0.26 } },
    { name: 'kick', instrument: 'kick-808', volume: 0.7, pan: 0, notes: kickNotes, fx: { reverb: 0.08 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.6, pan: 0.08, perform: { timingJitterMs: 3 }, notes: timpaniNotes, fx: { reverb: 0.34 } },
    { name: 'crash', instrument: 'crash', volume: 0.34, pan: 0.12, perform: { timingJitterMs: 3 }, notes: crashNotes, fx: { reverb: 0.34 } },
    { name: 'alarm', instrument: 'pwm-lead', volume: 0.34, pan: -0.3, notes: alarmNotes, fx: { reverb: 0.3, delay: 0.24 } },
  ],
};

export default vegnagunTrack;
