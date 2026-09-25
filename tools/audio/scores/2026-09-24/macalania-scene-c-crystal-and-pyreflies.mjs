/**
 * SKETCH C for Chapter VII's scene cue (`scene-macalania-temple`, working key)
 * — "Crystal and Pyreflies". The lake's shimmer, with a hint of the six-note
 * theme. About 60 s, B Aeolian, 4/4, 72 bpm.
 *
 * ORIGINAL COMPOSITION (AGENTS.md rule 8). The violin line, the shimmer and the
 * pyrefly flicks are written below. The only borrowed material is this
 * project's own: the first three notes of SEYMOUR ("Noble Rot", THEMES.md §3,
 * the six-note theme) once, as a shadow under the ice, and the score's AMEN
 * (THEMES.md, "the amen") as the close, both imported from
 * `src/audio/tracks/themes.ts`. It quotes no retail cue: not "Macalania
 * Woods", not the game's lake scene music, not any Uematsu tune. RESEMBLANCE
 * GUARD written for this sketch: the shimmer is NOT a steady arpeggio
 * ostinato under a melody (that is the forest's recognisable texture in the
 * source); every glint below is placed by hand-seeded chance, with no grid and
 * no repeating figure.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Macalania's frozen lake and the
 * pyreflies over it (research/ffx-seymour-anima-macalania.md §9.1, §9.7: the
 * aftermath, the fight the party wins cleanly and loses completely). Aeolian,
 * flat sixth, `bVI - bVII - i` and a plagal amen: Spira's language. No
 * dominant. B minor is FAREWELL's key: the aftermath leans toward the heart of
 * the score.
 *
 * Form (4/4, 72 bpm, 18 bars, 72 beats, 60.0 s plus the tail):
 *   bars  1- 4  beats  0-16  the lake: a few glints, a string bed, one pyrefly rising
 *   bars  5-12  beats 16-48  the violin over the shimmer, tremolo high; bVI - bVII - i
 *   bars 13-14  beats 48-56  the shadow: SEYMOUR's bow (1 - b6 - 5) in the bassoon, and
 *                            one glint on his #4, the pitch that belongs to no key
 *   bars 15-18  beats 56-72  the amen, iv to i; the last pyreflies rise and go out
 */

import { chordLine, motif } from '../../../../src/audio/score.ts';
import { AMEN, SEYMOUR, augment } from '../../../../src/audio/tracks/themes.ts';
import { arch, shape } from '../2026-09-21/sketch-kit.mjs';

const LAKE = 0;
const SONG = 16;
const SHADOW = 48;
const AMEN_AT = 56;
const LENGTH = 72;

// ------------------------------------------------------------ the shimmer

/** A small deterministic generator: the same glints on every render. */
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
/** B Aeolian's upper register, with the flat sixth (G) in it. */
const GLINT_PITCHES = ['B5', 'C#6', 'D6', 'F#6', 'G6', 'A6', 'B6', 'D7', 'F#5', 'E6'];
/**
 * Glints between `from` and `to`, on a 16th grid but never on a pattern: each
 * gap is drawn from `minGap`..`maxGap` beats. Instruments rotate by chance.
 */
function glints(from, to, minGap, maxGap, velocity, seed) {
  const rand = lcg(seed);
  const out = { celesta: [], glock: [], harp: [] };
  let at = from + 0.25 + Math.round(rand() * 4) / 4;
  while (at < to) {
    const pitch = GLINT_PITCHES[Math.floor(rand() * GLINT_PITCHES.length)];
    const v = velocity * (0.78 + rand() * 0.3);
    const which = rand();
    if (which < 0.45) out.celesta.push([at, 1.5, pitch, v]);
    else if (which < 0.7) out.glock.push([at, 1.2, pitch, v * 0.8]);
    else out.harp.push([at, 2, pitch.replace(/\d$/, (o) => String(Number(o) - 1)), v * 1.1]);
    at += Math.round((minGap + rand() * (maxGap - minGap)) * 4) / 4;
  }
  return out;
}
const G1 = glints(LAKE, SONG, 1.75, 3.5, 0.4, 7);
const G2 = glints(SONG, SHADOW, 0.75, 2.25, 0.36, 11);
const G3 = glints(SHADOW, AMEN_AT, 2.5, 4, 0.3, 13);
const G4 = glints(AMEN_AT, LENGTH - 4, 1.5, 3.5, 0.32, 17);
/** His #4 (E#, written F), one glint, in the shadow, with nothing near it to resolve it. */
const CRACK_AT = SHADOW + 5.25;
const crack = [[CRACK_AT, 1.6, 'F6', 0.38]];
const shimmer = (k) =>
  [...G1[k], ...G2[k], ...G3[k], ...G4[k]].filter((n) => Math.abs(n[0] - CRACK_AT) > 1.75);

/**
 * Pyreflies: quick three-note flicks upward on celesta, each one starting
 * higher than the last, the last one the highest note in the piece.
 */
const FLICKS = [
  [10, ['F#5', 'B5', 'C#6']],
  [27.5, ['A5', 'D6', 'E6']],
  [41, ['B5', 'E6', 'F#6']],
  [62.5, ['D6', 'F#6', 'A6']],
  [67, ['F#6', 'B6', 'C#7']],
];
const flicks = FLICKS.flatMap(([at, ps]) =>
  ps.map((p, i) => [at + i * 0.25, 1.4 - i * 0.2, p, 0.34 + i * 0.05]),
);

// ------------------------------------------------------------- the bed

/** Two-bar chords, soft, in the strings: Spira's fingerprint at bars 9-12. */
const BED = ['Bmadd9', 'Gmaj7', 'Bmadd9', 'Em6', 'Gmaj7', 'A', 'Bmadd9'];
const BED_LENGTHS = [8, 8, 8, 8, 8, 4, 4];
const bed = [];
{
  let at = LAKE;
  BED.forEach((sym, i) => {
    const dur = BED_LENGTHS[i];
    bed.push(...chordLine([sym], { start: at, octave: 3, center: 62, dur, velocity: i === 0 ? 0.34 : 0.38 }));
    at += dur;
  });
  // The shadow: Bm held low and quiet; then the amen's Em6 (the iv) and the last Bm(add9).
  bed.push(...chordLine(['Bm'], { start: SHADOW, octave: 3, center: 57, dur: 8, velocity: 0.3 }));
  bed.push(...chordLine(['Em6'], { start: AMEN_AT, octave: 3, center: 60, dur: 6, velocity: 0.36 }));
  bed.push(...chordLine(['Bmadd9'], { start: AMEN_AT + 6, octave: 3, center: 60, dur: 10, velocity: 0.34 }));
}
const BASS_PLAN = [
  [0, 8, 'B1'], [8, 8, 'G1'], [16, 8, 'B1'], [24, 8, 'E2'], [32, 8, 'G1'], [40, 4, 'A1'], [44, 4, 'B1'],
  [SHADOW, 8, 'B1'], [AMEN_AT, 6, 'E2'], [AMEN_AT + 6, 10, 'B1'],
];
const bass = BASS_PLAN.map(([at, d, p]) => [at, d, p, 0.36]);

/** High tremolo on the song's chords, very soft: the lake catching light. */
const TREM = [
  [SONG, 8, ['F#5', 'C#6']],
  [SONG + 8, 8, ['G5', 'B5']],
  [SONG + 16, 8, ['F#5', 'B5']],
  [SONG + 24, 4, ['E5', 'A5']],
  [SONG + 28, 4, ['F#5', 'C#6']],
];
const trem = TREM.flatMap(([at, d, ps]) => ps.map((p) => [at, d, p, 0.26]));

// -------------------------------------------------------------- the song

/**
 * The violin. Starts on the fifth and falls, lifts through the iv, leans on
 * the flat sixth (G5) over Gmaj7, reaches A5 on the bVII and lands on F#5,
 * the fifth, over the tonic: the song does not end on B. The amen does that.
 */
const SONG_LINE = [
  [0, 2.5, 'F#5'], [2.5, 0.5, 'E5'], [3, 1, 'D5'],
  [4, 1.5, 'C#5'], [5.5, 0.5, 'D5'], [6, 2, 'B4'],
  [8, 1, 'E5'], [9, 2, 'G5'], [11, 1, 'F#5'],
  [12, 2, 'E5'], [14, 1, 'D5'], [15, 1, 'C#5'],
  [16, 3, 'D5'], [19, 1, 'B4'],
  [20, 3, 'G5'], [23, 1, 'F#5'],
  [24, 2, 'A5'], [26, 1, 'G5'], [27, 1, 'E5'],
  [28, 4, 'F#5'],
];
const violin = arch(SONG_LINE.map(([at, d, p]) => [SONG + at, d, p, 0.62]), SONG, SONG + 32, 0.5, 0.7);
/**
 * The amen at three times its length: C#5 held over the whole Em6 (the iv),
 * falling to B4 on the Bm(add9). The 2 is the louder of the pair.
 */
const amenLine = shape(motif(augment(AMEN, 3), [AMEN_AT], ['B4']), [0.58, 0.46]);

// ------------------------------------------------------------ the shadow

/**
 * SEYMOUR's first three notes on B (B2 - G3 - F#3): the bow up the minor
 * sixth and the first step down. Then nothing. He is under the ice.
 */
const shadow = shape(motif(SEYMOUR.slice(0, 3), [SHADOW + 1], ['B2']), [0.5, 0.36, 0.46]);

export default {
  name: 'sketch-macalania-scene-c',
  bpm: 72,
  timeSig: [4, 4],
  loop: { start: LAKE, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  gain: 1,
  fx: {
    reverb: { room: 0.92, damp: 0.24, width: 0.98, preDelay: 0.028 },
  },
  channels: [
    { name: 'strings (the bed)', instrument: 'strings', volume: 0.46, pan: 0.02, notes: bed, fx: { reverb: 0.48 } },
    { name: 'low strings (the floor)', instrument: 'strings-low', volume: 0.42, pan: -0.1, notes: bass, fx: { reverb: 0.4 } },
    { name: 'tremolo (light on the lake)', instrument: 'strings-trem', volume: 0.32, pan: 0.14, notes: trem, fx: { reverb: 0.5 } },
    { name: 'celesta (glints)', instrument: 'celesta', volume: 0.42, pan: 0.26, notes: shimmer('celesta'), fx: { reverb: 0.54 } },
    { name: 'glockenspiel (glints, the crack)', instrument: 'glockenspiel', volume: 0.32, pan: 0.34, notes: [...shimmer('glock'), ...crack], fx: { reverb: 0.56 } },
    { name: 'harp (glints)', instrument: 'harp', volume: 0.44, pan: -0.26, notes: shimmer('harp'), fx: { reverb: 0.5 } },
    { name: 'celesta (pyreflies)', instrument: 'celesta', volume: 0.4, pan: -0.18, notes: flicks, fx: { reverb: 0.58 } },
    { name: 'violin (the song, the amen)', instrument: 'violin-solo', volume: 0.66, pan: -0.12, notes: [...violin, ...amenLine], fx: { reverb: 0.42 }, perform: { timingJitterMs: 10 } },
    { name: 'bassoon (the shadow)', instrument: 'bassoon', volume: 0.56, pan: 0.1, notes: shadow, fx: { reverb: 0.36 }, perform: { timingJitterMs: 10 } },
  ],
};
