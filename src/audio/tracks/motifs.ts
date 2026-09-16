/**
 * Shared leitmotifs. ORIGINAL MATERIAL — every cell below is derived from this
 * repo's own tracks, never from a retail soundtrack.
 *
 * Pitches are semitone offsets from a tonic, so a cell can be stamped in any
 * key with `cell(PYREFLY_RISE, startBeat, 'E4')` or with `motif()` directly.
 * Recurring cells are what make eighteen tracks feel like one score: the title
 * theme's question returns in the endings, the boss hymn's turn returns in the
 * final battle, and the FFX-2 hook grows up into its ending ballad.
 *
 *   PYREFLY_*  from "Tide, Remembered" (title), bars 5–6. FFX's heart.
 *   SENDING    from "The Unsent Hymn" (boss-dread), bar 5. FFX's dread.
 *   SPHERE_HOOK  FFX-2's bright syncopated major-pentatonic hook.
 *   LENNE      FFX-2's dorian love-and-loss line (Shuyin, ending-ffx2).
 */

import { motif, type Note, type Pitch } from '../score.ts';

/** Title's rising question: dominant below, tonic, 2nd, minor 3rd held. 5 beats. */
export const PYREFLY_RISE: Note[] = [
  [0, 1, -5],
  [1, 1, 0],
  [2, 1, 2],
  [3, 2, 3],
];

/** The same question in major (3rd raised) — use it where FFX finds hope. */
export const PYREFLY_RISE_MAJOR: Note[] = [
  [0, 1, -5],
  [1, 1, 0],
  [2, 1, 2],
  [3, 2, 4],
];

/** Title's answering sigh: the 3rd falling back through the tonic. 4 beats. */
export const PYREFLY_SIGH: Note[] = [
  [0, 2, 3],
  [2, 1, 0],
  [3, 1, -2],
];

/** Boss hymn's turn: tonic held, up a minor 3rd, down by step home. 8 beats. */
export const SENDING: Note[] = [
  [0, 3, 0],
  [3, 1, 3],
  [4, 2, 2],
  [6, 2, 0],
];

/** FFX-2 hook: syncopated leap to the 5th, drop to the 3rd, reach for the 6th. 4 beats. */
export const SPHERE_HOOK: Note[] = [
  [0, 0.75, 0],
  [0.75, 0.75, 7],
  [1.5, 0.5, 4],
  [2, 1, 9],
  [3, 1, 7],
];

/** FFX-2 love-and-loss line, dorian (the raised 6th is the ache). 8 beats. */
export const LENNE: Note[] = [
  [0, 1.5, 0],
  [1.5, 0.5, 2],
  [2, 1, 3],
  [3, 1, 9],
  [4, 3, 7],
  [7, 1, 5],
];

/** Stretch (factor > 1) or compress a cell in time: augmentation for grand statements. */
export function augment(pattern: Note[], factor: number): Note[] {
  return pattern.map((n) => [n[0] * factor, n[1] * factor, n[2], n[3]] as Note);
}

/** Give every note of a cell the same velocity. */
export function withVelocity(pattern: Note[], velocity: number): Note[] {
  return pattern.map((n) => [n[0], n[1], n[2], velocity] as Note);
}

/** Stamp one cell at `startBeat` on `tonic` (e.g. `'E4'` or 64). */
export function cell(pattern: Note[], startBeat: number, tonic: Pitch, velocity?: number): Note[] {
  const notes = motif(pattern, [startBeat], [tonic]);
  return velocity === undefined ? notes : withVelocity(notes, velocity);
}
