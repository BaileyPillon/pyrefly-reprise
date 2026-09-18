/**
 * Shared note-shaping helpers for the seven FFX-2 cues.
 *
 * ORIGINAL MATERIAL. Nothing here is a melody; these are the small tools that
 * turn note data into a *performance* — velocity arches, deterministic micro
 * jitter, comping rhythms, drum grooves with ghost notes, and the parallel
 * minor that turns the Songstress's hook into Shuyin's grief.
 *
 * Why this file exists at all: `docs/audio/THEMES.md` §Performance rules says
 * a phrase is never rendered at constant velocity, appoggiaturas lean louder
 * than their resolutions, and a section is never exactly together. Those are
 * per-note facts, and writing them by hand seven times over would guarantee
 * they drifted apart. They live here once instead.
 *
 * Only the FFX-2 group's cues import this. It touches no other track.
 */

import { chordMidis, type Note, type Pitch, toMidi } from '../score.ts';

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

/**
 * A deterministic 0..1 hash. `Math.random()` is banned in the audio modules —
 * the note cache and the tests both assume a render is bit-identical every
 * time — so every "human" wobble in these cues comes from here.
 */
export function rand01(index: number, seed = 1): number {
  const x = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Velocity jitter on top of a written shape, ±`amount` (THEMES.md says never
 * more than 0.04 — past that the four-bar arch stops reading).
 */
export function humanise(notes: Note[], amount = 0.03, seed = 1): Note[] {
  return notes.map((n, i) => {
    const v = n[3] ?? 0.8;
    const d = (rand01(i, seed) - 0.5) * 2 * amount;
    return [n[0], n[1], n[2], clampVel(v + d)] as Note;
  });
}

export function clampVel(v: number): number {
  return Math.max(0.05, Math.min(1, v));
}

// ---------------------------------------------------------------------------
// Dynamics
// ---------------------------------------------------------------------------

/** Scale every velocity (and clamp), keeping the written shape's contour. */
export function atVolume(notes: Note[], factor: number): Note[] {
  return notes.map((n) => [n[0], n[1], n[2], clampVel((n[3] ?? 0.8) * factor)] as Note);
}

/**
 * The default four-bar arch, 0.62 → 0.78 → 0.58: a phrase swells and falls.
 * `phase` is the note's position through the phrase, 0..1.
 */
export function archAt(phase: number): number {
  const p = Math.max(0, Math.min(1, phase));
  return p < 0.5 ? 0.62 + (0.78 - 0.62) * (p / 0.5) : 0.78 + (0.58 - 0.78) * ((p - 0.5) / 0.5);
}

/**
 * Impose a swell-and-fall across a phrase of `beats` beats starting at
 * `start`, multiplying whatever shape the notes already carry so an
 * appoggiatura's lean survives.
 */
export function phrase(notes: Note[], start: number, beats: number, depth = 0.22): Note[] {
  return notes.map((n) => {
    const phase = (n[0] - start) / beats;
    const shape = 1 + (archAt(phase) - 0.7) * (depth / 0.2);
    return [n[0], n[1], n[2], clampVel((n[3] ?? 0.8) * shape)] as Note;
  });
}

/**
 * A crescendo (or diminuendo) written into the velocities across a span —
 * the only way a sampled section can be heard to build without the master
 * normaliser flattening it back out.
 */
export function ramp(notes: Note[], from: number, to: number, start: number, beats: number): Note[] {
  return notes.map((n) => {
    const t = Math.max(0, Math.min(1, (n[0] - start) / beats));
    return [n[0], n[1], n[2], clampVel((n[3] ?? 0.8) * (from + (to - from) * t))] as Note;
  });
}

// ---------------------------------------------------------------------------
// Articulation
// ---------------------------------------------------------------------------

/**
 * Legato by overlap. THEMES.md: a melodic line at gate 0.85 is a series of
 * events; at 0.98-1.02 it is a phrase. This stretches each note to reach
 * `overlap` beats past the next attack, which is what makes the sampled
 * release tails run into one another.
 */
export function legato(notes: Note[], overlap = 0.06, maxGap = 0.3): Note[] {
  const sorted = [...notes].sort((a, b) => a[0] - b[0]);
  return sorted.map((n, i) => {
    const next = sorted[i + 1];
    if (!next) return n;
    // A gap wider than `maxGap` is a written rest — a breath — and THEMES.md
    // is explicit that breaths are not to be filled. Only adjacent notes join.
    if (next[0] - (n[0] + n[1]) > maxGap) return n;
    return [n[0], Math.max(n[1], next[0] - n[0] + overlap), n[2], n[3]] as Note;
  });
}

/** Shorten every note to a fraction of its written length — staccato, chugs, stabs. */
export function gated(notes: Note[], gate: number): Note[] {
  return notes.map((n) => [n[0], Math.max(0.05, n[1] * gate), n[2], n[3]] as Note);
}

/** Nudge a whole line a few milliseconds late (a lazy back-phrased lead, a second guitar). */
export function nudge(notes: Note[], beats: number): Note[] {
  return notes.map((n) => [n[0] + beats, n[1], n[2], n[3]] as Note);
}

/** Double a line at an interval, the copy quieter — octaves, thirds, a section widening. */
export function doubled(notes: Note[], semitones: number, trim = 0.8): Note[] {
  return notes.map(
    (n) => [n[0], n[1], toMidi(n[2]) + semitones, clampVel((n[3] ?? 0.8) * trim)] as Note,
  );
}

// ---------------------------------------------------------------------------
// Harmony
// ---------------------------------------------------------------------------

/**
 * Stack a chord upward from near `center` and move the whole stack by octaves
 * to get there — never fold individual tones back inside it.
 *
 * This matters more than it looks. `chordMidis`'s `center` option pulls every
 * tone within a sixth of one note, which on a maj7 or an m9 drops the 7th or
 * the 9th right next to the root and leaves a semitone cluster in the middle
 * of a pad. On a sampled string section that reads as a mistake. Keeping the
 * stack's own spacing and transposing it bodily is what a player would do.
 */
export function stackTones(
  symbol: string,
  center: number,
  dropRoot = false,
  maxTones?: number,
): number[] {
  const raw = chordMidis(symbol, { octave: 3 });
  const dropped = dropRoot && raw.length >= 3 ? raw.slice(1) : raw;
  // A held bed takes the 3rd, 5th and 7th and leaves the 9th to whoever is
  // playing the tune: the 9th of an m9 sits a semitone from the b3, and two
  // string desks a semitone apart is a cluster rather than a colour.
  const tones = maxTones ? dropped.slice(0, maxTones) : dropped;
  // Placed by its TOP note, not its bottom one. That is how a player voices a
  // chord under a tune: you decide where the highest note sits relative to the
  // melody, and the rest of the hand follows. Placing by the lowest note lets
  // a wide voicing's top wander up into the melody's own octave, which is
  // where accompaniment starts fighting the line it is supposed to support.
  const high = tones[tones.length - 1] ?? center;
  let shift = 0;
  while (high + shift > center + 5) shift -= 12;
  while (high + shift < center - 6) shift += 12;
  return tones.map((t) => t + shift);
}

/**
 * Rootless voicing for comping: the bass owns the root, the keys own the 3rd,
 * the 7th and the colour. This is the difference between an electric piano
 * comping and an electric piano playing root-position triads.
 */
export function colourTones(symbol: string, center: number): number[] {
  // Three tones: the 3rd, the 5th and the 7th. The 9th belongs to whoever has
  // the tune — held in a comp it sits a semitone from the b3 of every m9.
  return stackTones(symbol, center, true, 3);
}

/**
 * A held bed — one voicing per bar, rootless, spread, and entered slightly
 * raggedly because a section does not arrive together.
 */
export function padLine(
  chords: string[],
  options: {
    start: number;
    barBeats?: number;
    dur?: number;
    center: number;
    velocity: number;
    keepRoot?: boolean;
    maxTones?: number;
    seed?: number;
    stagger?: number;
  },
): Note[] {
  const barBeats = options.barBeats ?? 4;
  const dur = options.dur ?? barBeats * 0.96;
  const stagger = options.stagger ?? 0.04;
  const notes: Note[] = [];
  let i = 0;
  chords.forEach((symbol, bar) => {
    if (!symbol) return;
    const at = options.start + bar * barBeats;
    stackTones(symbol, options.center, !options.keepRoot, options.maxTones ?? 3).forEach((midi, v) => {
      const wobble = (rand01(i++, options.seed ?? 5) - 0.5) * 0.05;
      notes.push([at + v * stagger, dur - v * stagger, midi, clampVel(options.velocity + wobble - v * 0.02)]);
    });
  });
  return notes;
}

/** One rhythmic cell of a comping pattern: when, how long, how hard. */
export interface Hit {
  /** Beats from the bar line. */
  at: number;
  dur: number;
  vel: number;
  /** Stagger the voicing's tones by this many beats (a light spread). */
  roll?: number;
}

/**
 * Comping: play a chord voicing on a rhythm, once per bar, with a per-bar
 * velocity scale so a section can breathe. `voicer` decides the notes, which
 * is how the same rhythm serves epiano colour tones and brass stabs.
 */
export function compLine(
  chords: string[],
  hits: Hit[],
  options: {
    start: number;
    barBeats?: number;
    center: number;
    velocity?: number;
    perBar?: (bar: number) => number;
    voicer?: (symbol: string, center: number) => number[];
    seed?: number;
  },
): Note[] {
  const barBeats = options.barBeats ?? 4;
  const base = options.velocity ?? 1;
  const voicer = options.voicer ?? colourTones;
  const notes: Note[] = [];
  let i = 0;
  chords.forEach((symbol, bar) => {
    if (!symbol) return;
    const scale = base * (options.perBar ? options.perBar(bar) : 1);
    const tones = voicer(symbol, options.center);
    const at0 = options.start + bar * barBeats;
    for (const hit of hits) {
      tones.forEach((midi, t) => {
        const offset = (hit.roll ?? 0) * t;
        const wobble = (rand01(i++, options.seed ?? 3) - 0.5) * 0.05;
        notes.push([
          at0 + hit.at + offset,
          Math.max(0.08, hit.dur - offset),
          midi,
          clampVel(hit.vel * scale + wobble),
        ]);
      });
    }
  });
  return notes;
}

/**
 * A bass line written as a per-bar rhythm of scale-relative steps, so one
 * pattern follows a chord sequence: `0` is the root, `7` the fifth, `-5` the
 * fifth below, `10` the b7. Real bass players play the root *and* somewhere
 * else; an octave pump on every eighth is the sound of a sequencer.
 */
export interface BassStep {
  at: number;
  dur: number;
  /** Semitones from the bar's chord root. */
  step: number;
  vel: number;
}

export function bassLine(
  chords: string[],
  steps: BassStep[],
  options: { start: number; barBeats?: number; octave?: number; velocity?: number; seed?: number },
): Note[] {
  const barBeats = options.barBeats ?? 4;
  const octave = options.octave ?? 1;
  const base = options.velocity ?? 1;
  const notes: Note[] = [];
  let i = 0;
  chords.forEach((symbol, bar) => {
    if (!symbol) return;
    const root = chordMidis(symbol, { octave })[0]!;
    const at0 = options.start + bar * barBeats;
    for (const s of steps) {
      const wobble = (rand01(i++, options.seed ?? 7) - 0.5) * 0.04;
      notes.push([at0 + s.at, s.dur, root + s.step, clampVel(s.vel * base + wobble)]);
    }
  });
  return notes;
}

/**
 * An arpeggio over a chord sequence, voiced by {@link stackTones} rather than
 * by `chordMidis`'s centring — so a rolling left hand keeps the chord's own
 * spacing and stays in its own register instead of folding tones back into a
 * cluster under the melody.
 *
 * `pattern` indexes the stack and wraps upward by octaves, exactly as
 * `arpLine` does.
 */
export function arpStackLine(
  chords: string[],
  options: {
    start: number;
    barBeats?: number;
    pattern: number[];
    step: number;
    dur?: number;
    center: number;
    velocity: number;
    accent?: number;
    keepRoot?: boolean;
    maxTones?: number;
    seed?: number;
  },
): Note[] {
  const barBeats = options.barBeats ?? 4;
  const steps = Math.round(barBeats / options.step);
  const notes: Note[] = [];
  let i = 0;
  chords.forEach((symbol, bar) => {
    if (!symbol) return;
    const tones = stackTones(symbol, options.center, !options.keepRoot, options.maxTones);
    const at0 = options.start + bar * barBeats;
    for (let s = 0; s < steps; s++) {
      const index = options.pattern[s % options.pattern.length]!;
      const midi = tones[index % tones.length]! + 12 * Math.floor(index / tones.length);
      const accent = s === 0 ? (options.accent ?? 1.12) : 1;
      const wobble = (rand01(i++, options.seed ?? 13) - 0.5) * 0.05;
      notes.push([at0 + s * options.step, options.dur ?? options.step, midi, clampVel(options.velocity * accent + wobble)]);
    }
  });
  return notes;
}

// ---------------------------------------------------------------------------
// Drums
// ---------------------------------------------------------------------------

/**
 * A groove, bar by bar, from a 16-step string — `X` accent, `x` hit, `g` ghost,
 * `.` rest — with every hit micro-shifted and micro-levelled.
 *
 * The jitter is the point. A kit rendered on the grid at one velocity is the
 * single most machine-like thing in a mock-up, and a drummer's backbeat is
 * neither exactly on the beat nor exactly as hard as the last one.
 */
export function groove(
  pattern: string,
  options: {
    start: number;
    bars: number;
    pitch: Pitch;
    step?: number;
    velocity?: number;
    accent?: number;
    ghost?: number;
    /** Seconds-ish feel: push (+) or drag (-) the whole part, in beats. */
    feel?: number;
    perBar?: (bar: number) => number;
    seed?: number;
    /** Deterministic timing wobble, in beats. */
    drift?: number;
  },
): Note[] {
  const step = options.step ?? 0.25;
  const chars = pattern.replace(/[|\s]/g, '').split('');
  const base = options.velocity ?? 0.8;
  const accent = options.accent ?? Math.min(1, base * 1.28);
  const ghost = options.ghost ?? base * 0.38;
  const drift = options.drift ?? 0.008;
  const pitch = toMidi(options.pitch);
  const notes: Note[] = [];
  let i = 0;
  for (let bar = 0; bar < options.bars; bar++) {
    const scale = options.perBar ? options.perBar(bar) : 1;
    chars.forEach((ch, s) => {
      if (ch === '.') return;
      const v = ch === 'X' ? accent : ch === 'g' ? ghost : base;
      const dur = ch === 'o' ? step * 3 : step;
      const r = rand01(i++, options.seed ?? 11);
      const at = options.start + bar * chars.length * step + s * step + (options.feel ?? 0) + (r - 0.5) * 2 * drift;
      notes.push([at, dur, pitch, clampVel(v * scale + (rand01(i++, options.seed ?? 11) - 0.5) * 0.06)]);
    });
  }
  return notes;
}

/** A tom fill down the kit — the punctuation at the end of an eight-bar phrase. */
export function tomFill(start: number, pitches: Pitch[], step = 0.25, velocity = 0.8): Note[] {
  return pitches.map(
    (p, i) => [start + i * step, step * 0.9, p, clampVel(velocity * (0.82 + i * 0.06))] as Note,
  );
}

// ---------------------------------------------------------------------------
// The parallel minor
// ---------------------------------------------------------------------------

/**
 * Db major → C# minor without moving the tonic: flatten the 3rd, 6th and 7th.
 * Two of those three accidentals are the whole Shuyin transformation (THEMES.md
 * §5), and doing it as a pitch-class map means his theme is provably the
 * Songstress's own line rather than a retyped approximation of it.
 *
 * Pitch classes in Db major: Db Eb F Gb Ab Bb C. F→E, Bb→A, C→B.
 */
const PARALLEL_MINOR: Record<number, number> = { 5: 4, 10: 9, 0: 11 };

export function minorise(notes: Note[]): Note[] {
  return notes.map((n) => {
    const midi = toMidi(n[2]);
    const mapped = PARALLEL_MINOR[((midi % 12) + 12) % 12];
    return [n[0], n[1], mapped === undefined ? midi : midi - 1, n[3]] as Note;
  });
}

// ---------------------------------------------------------------------------
// Registers
// ---------------------------------------------------------------------------

/**
 * Keep a line inside a playable register by folding stray octaves back in.
 * Sampled instruments stretch badly a long way from their recorded zone, and a
 * cello patch asked for C6 is the fastest way to sound like a sampler.
 */
export function inRange(notes: Note[], low: Pitch, high: Pitch): Note[] {
  const lo = toMidi(low);
  const hi = toMidi(high);
  return notes.map((n) => {
    let midi = toMidi(n[2]);
    while (midi < lo) midi += 12;
    while (midi > hi) midi -= 12;
    return [n[0], n[1], midi, n[3]] as Note;
  });
}
