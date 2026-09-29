/**
 * "The Frozen Temple" — the antechamber of Macalania Temple, before and after Seymour and Anima.
 *
 * ORIGINAL COMPOSITION (AGENTS.md rule 8). F# minor (Aeolian with the flat sixth), 4/4, 56 bpm.
 * Chapter VII's scene cue. The alto-flute line, the quartal ice and the glockenspiel drips are
 * written below note by note. The only borrowed material is this project's own `HYMN_HEAD`
 * (THEMES.md §1, imported, never retyped), once, as the fayth behind the ice. It quotes no retail
 * cue: not "Macalania Woods", not the temple's hymn from the game, not any Uematsu tune.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Macalania Temple's antechamber
 * (research/ffx-seymour-anima-macalania.md §9.1, §9.6; plan §6.3 names the cue
 * `scene-macalania-temple`); no FFX-2 chapter names it.
 *
 * WHERE IT COMES FROM. Sketch A of the three Chapter VII scene sketches
 * (`tools/audio/scores/2026-09-24/macalania-scene-a-frozen-temple.mjs`), ported here note for
 * note. The shipped MP3 is that sketch's Direction B take through the R1 "focus" remaster
 * (`tools/audio/remaster-ship.py`, docs/audio/remaster-2026-09-29/README.md). D-278: Bailey
 * delegated the pick ("i'll go with your pick for chapter VII"); the driver picked A in R1 from
 * measurements and the sketch briefs, not by ear (rule 13), and Bailey can swap it. This module
 * is the score the manifest's fingerprint names and what the browser synthesises when the MP3
 * cannot be decoded.
 *
 * WHY F# MINOR. The battle cue that follows ("The Courtesy") is in C# minor. F# is its iv, so the
 * chapter moves scene-to-fight as a plagal step, iv to i. No dominant anywhere.
 *
 * Form (4/4, 56 bpm, 14 bars, 56 beats, 60.0 s; loop 12 -> 56, so the empty room is heard once
 * and the thinner ice of bars 12-14 stands in for it on every repeat):
 *   bars  1- 3  beats  0-12  the empty room: quartal ice, drips, a pedal
 *   bars  4- 8  beats 12-32  the flute walks through; harp open fifths on bVI - bVII - i   <- loop start
 *   bars  9-11  beats 32-44  the door glows: Dmaj7 then Bm(add9), one struck chime, HYMN_HEAD far away
 *   bars 12-14  beats 44-56  the ice again, thinner; F#m(add9); the last drip is D
 */

import { motif, type Note, type Track } from '../score.ts';
import { HYMN_HEAD, augment } from './themes.ts';

const ROOM = 0;
const WALK = 12;
const DOOR = 32;
const FREEZE = 44;
const LENGTH = 56;

/** A bell over a line by position (the sketch kit's `arch`): quiet, then `peak`, then quiet. */
function arch(notes: readonly Note[], from: number, to: number, low: number, peak: number): Note[] {
  const span = Math.max(1e-6, to - from);
  return notes.map((n): Note => {
    const t = Math.min(1, Math.max(0, (n[0] - from) / span));
    const v = low + (peak - low) * Math.sin(Math.PI * t);
    return [n[0], n[1], n[2], Math.min(1, Math.max(0.05, v * (n[3] ?? 0.8) * 1.25))];
  });
}

/** A long note is three overlapping entries rising then falling, so it breathes. */
function held(start: number, beats: number, pitch: string, peak: number): Note[] {
  const third = beats / 3;
  return [
    [start, third + 0.1, pitch, peak * 0.7],
    [start + third, third + 0.1, pitch, peak],
    [start + 2 * third, third, pitch, peak * 0.62],
  ];
}

// ---------------------------------------------------------------- the ice

/** Quartal stacks in high strings: [start, beats, pitches, peak velocity]. */
const ICE_PLAN: ReadonlyArray<readonly [number, number, readonly string[], number]> = [
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
const ice: Note[] = ICE_PLAN.flatMap(([at, beats, pitches, peak]) => pitches.flatMap((p) => held(at, beats, p, peak)));

/** The floor: F#1 in the low strings, under everything, dropping to D for the door. */
const floor: Note[] = [...held(ROOM, 32, 'F#1', 0.34), ...held(DOOR, 12, 'D2', 0.3), ...held(FREEZE, 12, 'F#1', 0.3)];

/** Drips: single glockenspiel notes at irregular times; no two gaps are the same. */
const DRIPS: ReadonlyArray<readonly [number, string, number]> = [
  [1.5, 'C#6', 0.42], [4.25, 'F#6', 0.36], [6.75, 'B5', 0.3], [9.5, 'G#6', 0.34], [11.25, 'C#7', 0.28],
  [15.5, 'F#6', 0.26], [21.25, 'B6', 0.24], [27.75, 'E6', 0.26],
  [34.5, 'A6', 0.3], [39.25, 'C#7', 0.26],
  [45.5, 'B5', 0.32], [48.75, 'F#6', 0.28], [51.5, 'C#6', 0.24], [54.5, 'D6', 0.36],
];
const drips: Note[] = DRIPS.map(([at, p, v]): Note => [at, 1.5, p, v]);

// -------------------------------------------------------------- the walk

/** The alto flute, no pulse under it; leans on the flat sixth and stops on C#, never the tonic. */
const WALK_LINE: ReadonlyArray<readonly [number, number, string]> = [
  [0, 2, 'C#5'], [2, 1.5, 'F#5'], [3.5, 0.5, 'E5'],
  [4, 3, 'D5'], [7, 1, 'C#5'],
  [8, 1.5, 'B4'], [9.5, 0.5, 'C#5'], [10, 2, 'A4'],
  [13, 1, 'G#4'], [14, 1, 'A4'], [15, 1, 'B4'],
  [16, 2.5, 'E5'], [18.5, 0.5, 'D5'], [19, 1, 'C#5'],
];
const flute = arch(WALK_LINE.map(([at, dur, p]): Note => [WALK + at, dur, p, 0.6]), WALK, WALK + 20, 0.46, 0.66);

/** Harp: open fifths, one per bar, rolled low to high: i | bVI | bVII | i | iv. */
const FIFTHS: ReadonlyArray<readonly [string, string]> = [
  ['F#2', 'C#3'],
  ['D2', 'A2'],
  ['E2', 'B2'],
  ['F#2', 'C#3'],
  ['B1', 'F#2'],
];
const harp: Note[] = FIFTHS.flatMap(([low, high], bar): Note[] => [
  [WALK + bar * 4, 3, low, 0.46],
  [WALK + bar * 4 + 0.12, 3, high, 0.4],
]);

// -------------------------------------------------------------- the door

/** One struck chime as the door lights, on D (the flat sixth). */
const chime: Note[] = [[DOOR, 4, 'D5', 0.42]];
/** The celesta traces the Dmaj7 once, slowly, up from the root. */
const celesta: Note[] = [
  [DOOR + 0.5, 2, 'D6', 0.34],
  [DOOR + 1.5, 2, 'F#6', 0.3],
  [DOOR + 2.5, 2, 'A6', 0.28],
  [DOOR + 3.5, 3, 'C#7', 0.26],
];
/** The warm chord under the door: Dmaj7 in the violas' register, then Bm(add9), the iv. */
const warm: Note[] = [
  ...['D4', 'F#4', 'A4', 'C#5'].flatMap((p) => held(DOOR, 8, p, 0.36)),
  ...['B3', 'D4', 'F#4', 'C#5'].flatMap((p) => held(DOOR + 8, 4, p, 0.3)),
];
/** The fayth behind the ice: HYMN_HEAD on F#, at 1.5x length, one distant voice, once. */
const voice: Note[] = motif(augment(HYMN_HEAD, 1.5), [DOOR + 3], ['F#5']).map(
  (n, i): Note => [n[0], n[1], n[2], [0.36, 0.3, 0.34, 0.4][i] ?? 0.34],
);

export const sceneMacalaniaTempleTrack: Track = {
  name: 'scene-macalania-temple',
  bpm: 56,
  timeSig: [4, 4],
  loop: { start: WALK, end: LENGTH },
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

export default sceneMacalaniaTempleTrack;
