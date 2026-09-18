/**
 * Performance helpers for the menu cues — `title`, `chapter-select`, `pause`.
 *
 * NOT a core file and not a track: this is shared workings for one arranger's
 * three cues (group `menus-clair-obscur`), kept in one place rather than
 * pasted three times. `themes.ts` owns the notes; this owns the way they are
 * played, and only the parts of that which are the same in all three cues.
 *
 * Everything here exists because of one line in docs/audio/THEMES.md:
 *
 *   > Never render a phrase at constant velocity.
 *
 * A per-bar dynamics table gets a phrase most of the way there, but it leaves
 * every note inside a bar at exactly the same level, which no player has ever
 * done. `perform()` layers the four things that are actually happening when
 * somebody plays a line: the shape of the phrase, the small lift a rising
 * interval gets, a hand that is not a grid, and — last, so nothing can undo
 * it — the appoggiatura rule.
 */

import type { Note } from '../score.ts';
import { toMidi } from '../score.ts';
import { agogic, lean, shapeByBar } from './themes.ts';

/** Deterministic pseudo-noise in -1..1 from a note's own beat and pitch. */
function wobble(beat: number, midi: number, salt: number): number {
  const x = Math.sin(beat * 12.9898 + midi * 78.233 + salt * 43.758) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * The small lift a line gets on the way up and gives back on the way down.
 *
 * Not a rule anybody writes in a score; it is just what hands and breath do,
 * and its absence is part of why a mock-up sounds typed. Kept deliberately
 * small (±0.03) so it colours the written arch instead of fighting it.
 */
export function contour(notes: Note[], amount = 0.03): Note[] {
  const order = [...notes].sort((a, b) => a[0] - b[0]);
  const lift = new Map<Note, number>();
  let previous: number | null = null;
  for (const note of order) {
    const midi = toMidi(note[2]);
    if (previous !== null) {
      if (midi > previous) lift.set(note, amount);
      else if (midi < previous) lift.set(note, -amount * 0.7);
    }
    previous = midi;
  }
  return notes.map((n) => {
    const delta = lift.get(n) ?? 0;
    return [n[0], n[1], n[2], clampVelocity((n[3] ?? 0.8) + delta)] as Note;
  });
}

/**
 * Deterministic velocity jitter, ±`amount` (THEMES.md: never more than 0.04,
 * "beyond that the arch stops reading"). Deterministic because a cue has to
 * render identically on every machine — the renderer's own timing jitter works
 * the same way.
 */
export function micro(notes: Note[], amount = 0.025, salt = 1): Note[] {
  return notes.map((n) => {
    const v = (n[3] ?? 0.8) + wobble(n[0], toMidi(n[2]), salt) * amount;
    return [n[0], n[1], n[2], clampVelocity(v)] as Note;
  });
}

function clampVelocity(v: number): number {
  return Math.max(0.05, Math.min(1, v));
}

export interface PerformOptions {
  /** Per-bar velocity table, applied first — the written arch. */
  table?: number[];
  /** Beats per bar for the table. 4 for the 4/4 cues, 3 for the waltz. */
  barBeats?: number;
  /** `[leaningBeat, resolvingBeat]` pairs — the appoggiatura rule. */
  leans?: Array<[number, number]>;
  /** How much louder the leaning note is. THEMES.md says 0.08 and means it. */
  lift?: number;
  /** Smaller leans for the inner sighs a phrase has besides its named ones. */
  softLeans?: Array<[number, number]>;
  /** Phrase-end beats (where a note *ends*) that get an agogic breath. */
  breaths?: number[];
  /** Breath size: 0.08 is a breath, 0.18 is an audible ritardando. */
  pull?: number;
  /** Velocity jitter amount, and a salt so two channels do not jitter alike. */
  jitter?: number;
  salt?: number;
  /** Contour amount; pass 0 for music that must not swell (the hymn's canon). */
  slope?: number;
}

/**
 * Turn written notes into a played phrase.
 *
 * Order matters and is the whole point: the table is the composer's plan, the
 * contour and the jitter are the performer, and `lean()` runs LAST so that
 * neither of them can end up making an appoggiatura quieter than the note it
 * falls to. THEMES.md calls that inversion "the single loudest tell of a
 * synthetic performance", so nothing downstream of it is allowed to happen.
 */
export function perform(notes: Note[], options: PerformOptions = {}): Note[] {
  let out = notes;
  if (options.table) out = shapeByBar(out, options.table, options.barBeats ?? 4);
  if (options.slope !== 0) out = contour(out, options.slope ?? 0.03);
  if (options.jitter !== 0) out = micro(out, options.jitter ?? 0.025, options.salt ?? 1);
  if (options.breaths?.length) out = agogic(out, options.breaths, options.pull ?? 0.08);
  if (options.softLeans?.length) out = lean(out, options.softLeans, 0.05);
  if (options.leans?.length) out = lean(out, options.leans, options.lift ?? 0.08);
  return out;
}

/**
 * Shape an accompaniment by the bar without flattening what is inside it.
 *
 * `shapeByBar` (and `perform`'s `table`) *sets* every note in a bar to one
 * velocity, which is right for a melody and wrong for a broken-chord figure
 * that has its own downbeat accent. This multiplies by the bar's level
 * instead, so the arch happens over the bar and the figure keeps its shape.
 */
export function swell(notes: Note[], table: number[], barBeats: number, at = 0): Note[] {
  const mean = table.reduce((a, b) => a + b, 0) / table.length;
  return notes.map((n) => {
    const bar = Math.floor((n[0] - at) / barBeats + 1e-6);
    const level = table[Math.max(0, Math.min(bar, table.length - 1))] ?? mean;
    return [n[0], n[1], n[2], clampVelocity((n[3] ?? 0.8) * (level / mean))] as Note;
  });
}

/**
 * Carve a written rest into an accompaniment.
 *
 * THEMES.md: *"Breaths are written as rests … Do not fill them."* A melody gets
 * its rests for free because they are in the tracker string; an accompaniment
 * built by `chordLine` or `arpLine` will happily play straight through the
 * phrase mark unless somebody takes the notes out. Anything starting inside a
 * window goes; anything sustaining into one is cut short at its edge.
 */
export function clip(notes: Note[], windows: Array<[number, number]>): Note[] {
  const out: Note[] = [];
  for (const n of notes) {
    let dur = n[1];
    let drop = false;
    for (const [from, to] of windows) {
      if (n[0] >= from - 1e-6 && n[0] < to - 1e-6) drop = true;
      else if (n[0] < from && n[0] + dur > from) dur = Math.max(0.2, from - n[0]);
    }
    if (!drop) out.push([n[0], dur, n[2], n[3]] as Note);
  }
  return out;
}

/**
 * The hairpin the renderer cannot play.
 *
 * A held string or choir note is dead straight — there is no per-note envelope
 * (THEMES.md §Renderer requests, item 2). The documented workaround is to split
 * it into two tied attacks, the second louder, overlapping by 0.15 beats so the
 * bow change is covered by the first note's release. Strings and choir only:
 * on a piano the restrike is audible and ruins the illusion instead of making
 * it.
 */
export function tiedSwell(notes: Note[], from = 0.55, to = 0.72, overlap = 0.15): Note[] {
  const out: Note[] = [];
  for (const n of notes) {
    const v = n[3] ?? 0.8;
    if (n[1] < 1.2) {
      out.push(n);
      continue;
    }
    const half = n[1] / 2;
    out.push([n[0], half + overlap, n[2], clampVelocity(v * from * 1.35)] as Note);
    out.push([n[0] + half, n[1] - half, n[2], clampVelocity(v * to * 1.35)] as Note);
  }
  return out;
}

/** The notes of a theme that fall inside `[fromBeat, toBeat)`, moved to `at`. */
export function bars(notes: Note[], fromBeat: number, toBeat: number, at: number): Note[] {
  return notes
    .filter((n) => n[0] >= fromBeat - 1e-6 && n[0] < toBeat - 1e-6)
    .map((n) => [n[0] - fromBeat + at, n[1], n[2], n[3]] as Note);
}

/**
 * Clear the piano pedal on the barline.
 *
 * THEMES.md: a pedalled left hand is `gate 0.98` plus reverb held through the
 * bar, "and the left hand cleared on the barline (shorten the last arp note of
 * the bar to 0.4 of its step)". Without this the harmony of bar 2 arrives on
 * top of bar 1 still ringing, which is the difference between a pedalled piano
 * and a smeared one.
 */
export function clearPedal(notes: Note[], barBeats: number, step: number, at = 0): Note[] {
  return notes.map((n) => {
    const offset = (n[0] - at + step) % barBeats;
    const last = Math.min(offset, barBeats - offset) < 1e-6;
    return last ? ([n[0], step * 0.4, n[2], n[3]] as Note) : n;
  });
}
