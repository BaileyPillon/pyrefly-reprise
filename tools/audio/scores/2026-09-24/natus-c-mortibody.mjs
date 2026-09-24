/**
 * SKETCH C for the Seymour Natus battle cue (Chapter X) — "Mortibody".
 * The machine and the corpse. About 60 s, C# minor, 4/4, 116 bpm.
 *
 * ORIGINAL COMPOSITION (AGENTS.md rule 8). The only borrowed material is this
 * project's own SEYMOUR cell and its mirror ("Noble Rot", imported from
 * `src/audio/tracks/themes.ts`). The clockwork, the bellows and the heartbeat
 * are written below. It quotes no retail cue — not the game's Seymour battle
 * music, not "Run!!". No choir; the organ never plays a fast figure (THEMES.md
 * §3 resemblance guard).
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Seymour Natus and Mortibody on
 * the Highbridge of Bevelle (docs/plans/chapter-natus-review.md). Seymour's
 * chromaticism is allowed; `SEYMOUR_UNMOORED` is not used (THEMES.md reserves
 * it for `boss-seymour`).
 *
 * THE IDEA. Two things share the stage. The MACHINE is a clockwork built on
 * the one chord in Seymour's cadence that belongs to no key, the #iv dim7
 * (G A# C# E): celesta and mallets in constant eighths at constant velocity,
 * no timing jitter — it does not breathe. The CORPSE is Seymour's cell on a
 * solo cello, slow and with vibrato, answered by the mirror in a bassoon. A
 * bellows (bowed strings swelling in and out every two bars) keeps it alive.
 * In the third section the machine takes the cell away from the cello. Then
 * everything stops, the bellows breathe twice, and the clockwork starts again
 * a semitone LOWER (F# dim7): revived, and a little more rotten.
 *
 * Form (4/4, 116 bpm, 29 bars, 116 beats, 60.0 s plus the tail):
 *   bars  1- 4  beats   0- 16  the clockwork alone, pizzicato on 1 and 3, the bellows
 *   bars  5-12  beats  16- 48  the corpse: cello SEYMOUR, bassoon mirror, a failing heartbeat
 *   bars 13-20  beats  48- 80  the machine takes it: the cell in low brass on the sequence,
 *                              taiko on the clockwork grid, the organ's cadence
 *   bars 21-24  beats  80- 96  the revive: silence, two breaths, a struck metal
 *   bars 25-29  beats  96-116  the clockwork again, a semitone down; the cello once more at pitch
 */

import { chordLine, motif } from '../../../../src/audio/score.ts';
import { SEYMOUR, SEYMOUR_MIRROR, SEYMOUR_CHORDS, SEYMOUR_SEQUENCE } from '../../../../src/audio/tracks/themes.ts';
import { shape } from '../2026-09-21/sketch-kit.mjs';

const CLOCK = 0;
const CORPSE = 16;
const MACHINE = 48;
const REVIVE = 80;
const AGAIN = 96;
const LENGTH = 116;

// ------------------------------------------------------------ the machine

/**
 * The clockwork: the #iv dim7's four notes, up and back, one bar. Relative to
 * the chord's root: 0 3 6 9 12 9 6 3. Constant velocity — deliberately.
 */
const WHEEL = [0, 3, 6, 9, 12, 9, 6, 3];
function clockwork(start, bars, root, velocity = 0.46) {
  const notes = [];
  for (let b = 0; b < bars; b++) {
    WHEEL.forEach((off, e) => notes.push([start + b * 4 + e * 0.5, 0.4, root + off, velocity]));
  }
  return notes;
}
const G4 = 67;
const F_SHARP4 = 66;
const celesta = [
  ...clockwork(CLOCK, 4, G4),
  ...clockwork(CORPSE, 8, G4, 0.4),
  ...clockwork(MACHINE, 8, G4, 0.5),
  ...clockwork(AGAIN, 5, F_SHARP4, 0.48),
];
/** The mallets an octave below, only where the machine has the stage. */
const mallets = [
  ...clockwork(CLOCK, 4, G4 - 12, 0.4),
  ...clockwork(MACHINE, 8, G4 - 12, 0.46),
  ...clockwork(AGAIN, 5, F_SHARP4 - 12, 0.44),
];

/** Pizzicato on 1 and 3: the tonic and the tritone, constant. */
function tick(start, bars, low, high, velocity = 0.56) {
  const notes = [];
  for (let b = 0; b < bars; b++) {
    notes.push([start + b * 4, 0.5, low, velocity], [start + b * 4 + 2, 0.5, high, velocity]);
  }
  return notes;
}
const pizz = [
  ...tick(CLOCK, 4, 'C#2', 'G2'),
  ...tick(CORPSE, 8, 'C#2', 'G2', 0.5),
  ...tick(MACHINE, 8, 'C#2', 'G2', 0.62),
  ...tick(AGAIN, 5, 'C2', 'F#2', 0.58),
];

// ------------------------------------------------------------- the corpse

/** THEMES.md §3's velocity shape, the bow thrown away. */
const COURTEOUS = [0.74, 0.52, 0.72, 0.78, 0.68, 0.62];
/** The cello states the cell twice at pitch, then its second half alone, lower each time. */
const cello = [
  ...shape(motif(SEYMOUR, [CORPSE + 4, CORPSE + 20], ['C#3', 'C#3']), COURTEOUS),
  ...shape(motif(SEYMOUR.slice(2), [CORPSE + 12 - 2], ['C#3']), [0.62, 0.58, 0.52, 0.48]),
  ...shape(motif(SEYMOUR.slice(3), [CORPSE + 28 - 4], ['C2']), [0.52, 0.46, 0.4]),
  ...shape(motif(SEYMOUR, [AGAIN + 4], ['C#3']), [0.66, 0.46, 0.64, 0.7, 0.6, 0.54]),
  [AGAIN + 12, 6, 'E3', 0.44],
];
/** The bassoon answers with the mirror, a bar behind, a little under the cello. */
const bassoon = shape(motif(SEYMOUR_MIRROR, [CORPSE + 8, CORPSE + 24], ['C#3', 'C#3']), [0.6, 0.44, 0.58, 0.62, 0.54, 0.5]);

/**
 * The bellows: bowed strings on C#3 + G#3, four beats in (quarter notes
 * swelling) and four out. Every two bars from bar 1 to 12; twice in the revive.
 */
function breath(start, low = 'C#3', high = 'G#3', peak = 0.5) {
  const up = [0.18, 0.28, 0.38, peak];
  const down = [peak - 0.06, 0.34, 0.24, 0.14];
  return [...up, ...down].flatMap((v, q) => [
    [start + q, 1, low, v],
    [start + q, 1, high, v * 0.86],
  ]);
}
const bellows = [
  ...[0, 8, 16, 24, 32, 40].flatMap((at) => breath(CLOCK + at)),
  ...breath(REVIVE, 'C#3', 'G#3', 0.56),
  ...breath(REVIVE + 8, 'C3', 'G3', 0.5),
];

/**
 * The heartbeat: a lub-dub at the top of each bar, but it skips every third
 * bar, and in the last bar of the section it misses twice.
 */
const heart = [];
for (let bar = 0; bar < 8; bar++) {
  if (bar % 3 === 2 || bar === 7) continue;
  const at = CORPSE + bar * 4;
  heart.push([at, 0.5, 'C#2', 0.6 - bar * 0.02], [at + 0.5, 0.8, 'C#2', 0.44 - bar * 0.02]);
}

// ------------------------------------------------------------ the takeover

/** The machine takes the cell: low brass on the minor-third sequence, harder. */
const brassCell = shape(
  motif(SEYMOUR, [MACHINE, MACHINE + 8, MACHINE + 16, MACHINE + 24], SEYMOUR_SEQUENCE),
  [0.8, 0.66, 0.8, 0.86, 0.76, 0.72],
);
/** The organ holds his cadence underneath, half-bar changes, never loud (<= 0.55). */
const organ = [
  ...chordLine([...SEYMOUR_CHORDS, 'Em', 'Cmaj7', 'Bbdim7', 'B7', 'Gm', 'Ebmaj7', 'C#dim7', 'D7', ...SEYMOUR_CHORDS], {
    start: MACHINE,
    barBeats: 2,
    octave: 3,
    velocity: 0.46,
  }),
  [MACHINE, 32, 'C#1', 0.44],
];
/** Taiko on the clockwork's own grid: every quarter, constant, accent on 1. */
const taiko = [];
for (let bar = 0; bar < 8; bar++) {
  for (let q = 0; q < 4; q++) taiko.push([MACHINE + bar * 4 + q, 1, 'C2', q === 0 ? 0.76 : 0.58]);
}
for (let bar = 0; bar < 5; bar++) taiko.push([AGAIN + bar * 4, 1, 'C2', 0.66]);
/** Brass cuts on the and-of-2 of every other bar: the dim7 the machine is made of. */
const stabs = [0, 2, 4, 6].flatMap((bar) =>
  chordLine(['Gdim7'], { start: MACHINE + bar * 4 + 1.5, octave: 3, dur: 0.4, velocity: 0.7 + bar * 0.02 }),
);

// ------------------------------------------------------------- the revive

const metal = [
  [REVIVE - 0.5, 1, 'C4', 0.7],
  [AGAIN - 1, 1, 'C4', 0.84],
];
const timpani = [
  [CORPSE, 2, 'C#2', 0.46],
  [MACHINE, 2, 'C#2', 0.72],
  [MACHINE + 16, 2, 'G2', 0.74],
  ...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((t, i) => [AGAIN - 2 + t, 0.3, 'C2', 0.4 + i * 0.05]),
  [AGAIN, 2, 'C2', 0.82],
  [LENGTH - 4, 3, 'C#2', 0.7],
];
const gong = [
  [REVIVE, 6, 'C2', 0.56],
  [LENGTH - 4, 8, 'C2', 0.66],
];
/** The end: the floor holds C# and G, the tritone, and nothing resolves. */
const floor = [
  [LENGTH - 4, 4, 'C#2', 0.46],
  [LENGTH - 4, 4, 'G2', 0.4],
];

export default {
  name: 'sketch-natus-c',
  bpm: 116,
  timeSig: [4, 4],
  loop: { start: CORPSE, end: LENGTH },
  length: LENGTH,
  tailSec: 3.5,
  gain: 1,
  fx: {
    reverb: { room: 0.9, damp: 0.34, width: 0.94, preDelay: 0.028 },
  },
  channels: [
    { name: 'celesta (the clockwork)', instrument: 'celesta', volume: 0.54, pan: 0.26, notes: celesta, fx: { reverb: 0.36 }, perform: { timingJitterMs: 0 } },
    { name: 'mallets (the clockwork, low)', instrument: 'mallet', volume: 0.46, pan: -0.2, notes: mallets, fx: { reverb: 0.3 }, perform: { timingJitterMs: 0 } },
    { name: 'pizzicato (the tick)', instrument: 'pizzicato', volume: 0.6, pan: -0.14, notes: pizz, fx: { reverb: 0.22 }, perform: { timingJitterMs: 0 } },
    { name: 'cello (the corpse)', instrument: 'cello-solo', volume: 0.74, pan: -0.06, notes: cello, fx: { reverb: 0.36 }, perform: { timingJitterMs: 14 } },
    { name: 'bassoon (the mirror)', instrument: 'bassoon', volume: 0.6, pan: 0.14, notes: bassoon, fx: { reverb: 0.34 }, perform: { timingJitterMs: 12 } },
    { name: 'bellows (bowed strings)', instrument: 'strings', volume: 0.44, pan: 0.04, notes: bellows, fx: { reverb: 0.42 } },
    { name: 'low brass (the machine takes the cell)', instrument: 'trombone', volume: 0.7, pan: -0.08, notes: brassCell, fx: { reverb: 0.3 }, perform: { timingJitterMs: 3 } },
    { name: 'organ (his cadence)', instrument: 'organ', volume: 0.44, pan: 0.02, notes: organ, fx: { reverb: 0.36 } },
    { name: 'brass cuts (dim7)', instrument: 'brass-stab', volume: 0.5, pan: 0.08, notes: stabs, fx: { reverb: 0.3 } },
    { name: 'heartbeat', instrument: 'timpani', volume: 0.5, pan: 0, notes: heart, fx: { reverb: 0.24 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.54, pan: 0.05, notes: timpani, fx: { reverb: 0.3 } },
    { name: 'taiko (the grid)', instrument: 'taiko', volume: 0.56, pan: 0, notes: taiko, fx: { reverb: 0.26 } },
    { name: 'metal', instrument: 'metal-hit', volume: 0.5, pan: 0.2, notes: metal, fx: { reverb: 0.44 } },
    { name: 'tam-tam', instrument: 'tam-tam', volume: 0.5, pan: 0.14, notes: gong, fx: { reverb: 0.5 } },
    { name: 'low strings (the floor)', instrument: 'strings-low', volume: 0.5, pan: -0.12, notes: floor, fx: { reverb: 0.34 } },
  ],
};
