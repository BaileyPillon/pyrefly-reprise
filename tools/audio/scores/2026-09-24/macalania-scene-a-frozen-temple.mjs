/**
 * SKETCH A for Chapter VII's scene cue (`scene-macalania-temple`, working key)
 * — "The Frozen Temple". Cold, still, glassy. About 60 s, F# Aeolian, 4/4, 56 bpm.
 *
 * ORIGINAL COMPOSITION (AGENTS.md rule 8). The alto-flute line, the quartal
 * ice and the glockenspiel drips are written below note by note. The only
 * borrowed material is this project's own `HYMN_HEAD` (THEMES.md §1, imported
 * from `src/audio/tracks/themes.ts`, never retyped), once, as the fayth behind
 * the ice. It quotes no retail cue: not "Macalania Woods", not the temple's
 * hymn from the game, not any Uematsu tune. No chanted choir; no organ.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** The Macalania Temple
 * antechamber before and after the Seymour + Anima fight
 * (research/ffx-seymour-anima-macalania.md §9.1, §9.6; plan §6.3 names the cue
 * `scene-macalania-temple`). Aeolian with the flat sixth: THEMES.md reserves
 * that for Spira. No dominant anywhere.
 *
 * WHY F# MINOR. The battle cue that follows ("The Courtesy") is in C# minor.
 * F# is its iv, so the chapter as a whole moves scene-to-fight as a plagal
 * step, iv to i, the score's own cadence at the largest scale.
 *
 * THE IDEA. §9.1: the room is "ice pretending to be masonry", and the plan asks
 * for a held establishing frame of the empty room. So the first twelve seconds
 * are a held quartal stack in high strings and a few irregular drips, nothing
 * else. A single alto flute then walks through the room without a pulse. When
 * the Chamber-of-the-Fayth door glows (bars 9-11) the ice warms by one chord
 * (Dmaj7, the flat sixth shimmering) and a distant voice gives the hymn's four
 * notes, once. Then the room freezes again, and the last drip is the flat sixth.
 *
 * Form (4/4, 56 bpm, 14 bars, 56 beats, 60.0 s plus the tail):
 *   bars  1- 3  beats  0-12  the empty room: quartal ice, drips, a pedal
 *   bars  4- 8  beats 12-32  the flute walks through; harp open fifths on bVI - bVII - i
 *   bars  9-11  beats 32-44  the door glows: Dmaj7 then Bm(add9), one struck chime, HYMN_HEAD far away
 *   bars 12-14  beats 44-56  the ice again, thinner; F#m(add9); the last drip is D
 */

import { motif } from '../../../../src/audio/score.ts';
import { HYMN_HEAD, augment } from '../../../../src/audio/tracks/themes.ts';
import { arch } from '../2026-09-21/sketch-kit.mjs';

const ROOM = 0;
const WALK = 12;
const DOOR = 32;
const FREEZE = 44;
const LENGTH = 56;

// ---------------------------------------------------------------- the ice

/**
 * Quartal stacks in high strings, sul tasto in spirit: whole-bar holds with a
 * slow swell. Each entry is [start, beats, pitches, peak velocity].
 */
const ICE_PLAN = [
  [ROOM, 12, ['C#5', 'F#5', 'B5'], 0.34],
  [WALK, 4, ['C#5', 'F#5', 'B5'], 0.3],
  [WALK + 4, 4, ['D5', 'A5', 'E6'], 0.3],
  [WALK + 8, 4, ['E5', 'A5', 'B5'], 0.3],
  [WALK + 12, 4, ['C#5', 'F#5', 'B5'], 0.3],
  [WALK + 16, 4, ['B4', 'E5', 'A5'], 0.32],
  [DOOR, 8, ['C#5', 'F#5', 'A5'], 0.44],
  [DOOR + 8, 4, ['B4', 'E5', 'A5'], 0.4],
  [FREEZE, 12, ['C#5', 'F#5', 'B5'], 0.3],
];
/** A long note is three overlapping entries rising then falling, so it breathes. */
function held(start, beats, pitch, peak) {
  const third = beats / 3;
  return [
    [start, third + 0.1, pitch, peak * 0.7],
    [start + third, third + 0.1, pitch, peak],
    [start + 2 * third, third, pitch, peak * 0.62],
  ];
}
const ice = ICE_PLAN.flatMap(([at, beats, pitches, peak]) =>
  pitches.flatMap((p) => held(at, beats, p, peak)),
);

/** The floor: F#1 in the low strings, under everything, dropping out for the door. */
const floor = [
  ...held(ROOM, 32, 'F#1', 0.34),
  ...held(DOOR, 12, 'D2', 0.3),
  ...held(FREEZE, 12, 'F#1', 0.3),
];

/**
 * Drips: single glockenspiel notes at irregular times from F# Aeolian's upper
 * register. Hand-placed, not a pattern: no two gaps are the same.
 */
const drips = [
  [1.5, 'C#6', 0.42], [4.25, 'F#6', 0.36], [6.75, 'B5', 0.3], [9.5, 'G#6', 0.34], [11.25, 'C#7', 0.28],
  [15.5, 'F#6', 0.26], [21.25, 'B6', 0.24], [27.75, 'E6', 0.26],
  [34.5, 'A6', 0.3], [39.25, 'C#7', 0.26],
  [45.5, 'B5', 0.32], [48.75, 'F#6', 0.28], [51.5, 'C#6', 0.24], [54.5, 'D6', 0.36],
].map(([at, p, v]) => [at, 1.5, p, v]);

// -------------------------------------------------------------- the walk

/**
 * The alto flute, no pulse under it. Opens on the fifth, rises a fourth, leans
 * on the flat sixth (D) and never lands on the tonic: the phrase stops on C#.
 */
const WALK_LINE = [
  [0, 2, 'C#5'], [2, 1.5, 'F#5'], [3.5, 0.5, 'E5'],
  [4, 3, 'D5'], [7, 1, 'C#5'],
  [8, 1.5, 'B4'], [9.5, 0.5, 'C#5'], [10, 2, 'A4'],
  [13, 1, 'G#4'], [14, 1, 'A4'], [15, 1, 'B4'],
  [16, 2.5, 'E5'], [18.5, 0.5, 'D5'], [19, 1, 'C#5'],
];
const flute = arch(
  WALK_LINE.map(([at, dur, p]) => [WALK + at, dur, p, 0.6]),
  WALK,
  WALK + 20,
  0.46,
  0.66,
);

/**
 * Harp: open fifths, one per bar, rolled low to high — the fingerprint
 * bVI - bVII - i with the tonic first: i | bVI | bVII | i | iv.
 */
const FIFTHS = [
  ['F#2', 'C#3'],
  ['D2', 'A2'],
  ['E2', 'B2'],
  ['F#2', 'C#3'],
  ['B1', 'F#2'],
];
const harp = FIFTHS.flatMap(([low, high], bar) => [
  [WALK + bar * 4, 3, low, 0.46],
  [WALK + bar * 4 + 0.12, 3, high, 0.4],
]);

// -------------------------------------------------------------- the door

/** One struck chime as the door lights, on D (the flat sixth). */
const chime = [[DOOR, 4, 'D5', 0.42]];
/** The celesta traces the Dmaj7 once, slowly, up from the root. */
const celesta = [
  [DOOR + 0.5, 2, 'D6', 0.34],
  [DOOR + 1.5, 2, 'F#6', 0.3],
  [DOOR + 2.5, 2, 'A6', 0.28],
  [DOOR + 3.5, 3, 'C#7', 0.26],
];
/** The warm chord under the door: Dmaj7 in the violas' register, then Bm(add9), the iv. */
const warm = [
  ...['D4', 'F#4', 'A4', 'C#5'].flatMap((p) => held(DOOR, 8, p, 0.36)),
  ...['B3', 'D4', 'F#4', 'C#5'].flatMap((p) => held(DOOR + 8, 4, p, 0.3)),
];
/**
 * The fayth behind the ice: HYMN_HEAD (1 - b7 - 1 - b3) on F#, at 1.5x length,
 * one distant voice, once. Written high and quiet so it reads as one singer.
 */
const voice = motif(augment(HYMN_HEAD, 1.5), [DOOR + 3], ['F#5']).map((n, i) => [
  n[0],
  n[1],
  n[2],
  [0.36, 0.3, 0.34, 0.4][i],
]);

export default {
  name: 'sketch-macalania-scene-a',
  bpm: 56,
  timeSig: [4, 4],
  loop: { start: ROOM, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  gain: 1,
  fx: {
    reverb: { room: 0.94, damp: 0.22, width: 0.98, preDelay: 0.03 },
  },
  channels: [
    { name: 'strings (the ice)', instrument: 'strings', volume: 0.5, pan: 0.06, notes: ice, fx: { reverb: 0.5 } },
    { name: 'low strings (the floor)', instrument: 'strings-low', volume: 0.42, pan: -0.1, notes: floor, fx: { reverb: 0.4 } },
    { name: 'glockenspiel (drips)', instrument: 'glockenspiel', volume: 0.36, pan: 0.3, notes: drips, fx: { reverb: 0.56 } },
    { name: 'alto flute (the walk)', instrument: 'alto-flute', volume: 0.72, pan: -0.08, notes: flute, fx: { reverb: 0.42 }, perform: { timingJitterMs: 14 } },
    { name: 'harp (open fifths)', instrument: 'harp', volume: 0.5, pan: -0.24, notes: harp, fx: { reverb: 0.44 } },
    { name: 'chime (the door)', instrument: 'chimes', volume: 0.36, pan: 0.18, notes: chime, fx: { reverb: 0.6 } },
    { name: 'celesta (the door)', instrument: 'celesta', volume: 0.4, pan: 0.22, notes: celesta, fx: { reverb: 0.52 } },
    { name: 'strings (the warm chord)', instrument: 'strings', volume: 0.42, pan: -0.04, notes: warm, fx: { reverb: 0.46 } },
    { name: 'distant voice (HYMN_HEAD)', instrument: 'soprano-distant', volume: 0.5, pan: 0.1, notes: voice, fx: { reverb: 0.62 } },
  ],
};
