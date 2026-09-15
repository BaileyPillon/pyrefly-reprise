/**
 * Chord, arpeggio and drum-pattern helpers.
 *
 * These exist so a 90 second arrangement is a dozen readable lines instead of
 * a thousand hand-typed note tuples. Everything returns plain `Note[]`.
 */

import { midiFromName, toMidi, type Note, type Pitch } from './score.ts';

const QUALITIES: Record<string, number[]> = {
  '': [0, 4, 7],
  maj: [0, 4, 7],
  M: [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  '5': [0, 7],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  M7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  add9: [0, 4, 7, 14],
  madd9: [0, 3, 7, 14],
  '9': [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  '7sus4': [0, 5, 7, 10],
};

export interface ChordSpec {
  root: number;
  intervals: number[];
  bass: number | null;
  symbol: string;
}

/** Parse "Am", "F#m7b5", "Csus4", "G/B" into root + intervals (+ slash bass). */
export function parseChord(symbol: string): ChordSpec {
  const match = /^([A-Ga-g][#b]*)([^/]*)(?:\/([A-Ga-g][#b]*))?$/.exec(symbol.trim());
  if (!match) throw new Error(`Bad chord symbol "${symbol}"`);
  const rootName = match[1]!;
  const quality = match[2] ?? '';
  const intervals = QUALITIES[quality];
  if (!intervals) {
    throw new Error(`Unknown chord quality "${quality}" in "${symbol}" (see QUALITIES in harmony.ts)`);
  }
  const root = midiFromName(`${rootName}0`) % 12;
  const bass = match[3] ? midiFromName(`${match[3]}0`) % 12 : null;
  return { root, intervals, bass, symbol };
}

export interface VoicingOptions {
  /** Octave of the chord root, 3 ≈ middle. */
  octave?: number;
  /** Pull every tone within a sixth of this MIDI note (simple voice leading). */
  center?: number;
  /** Also sound the root this many octaves below the voicing. */
  bassOctaves?: number;
}

/** MIDI notes for a chord symbol, optionally voiced around a centre. */
export function chordMidis(symbol: string, options: VoicingOptions = {}): number[] {
  const spec = parseChord(symbol);
  const octave = options.octave ?? 3;
  const base = (octave + 1) * 12 + spec.root;
  let tones = spec.intervals.map((i) => base + i);
  if (options.center !== undefined) {
    const center = options.center;
    tones = tones.map((t) => {
      let v = t;
      while (v < center - 6) v += 12;
      while (v > center + 6) v -= 12;
      return v;
    });
    tones.sort((a, b) => a - b);
  }
  if (spec.bass !== null) {
    let bassNote = (octave + 1) * 12 + spec.bass;
    while (bassNote >= (tones[0] ?? bassNote)) bassNote -= 12;
    tones.unshift(bassNote);
  }
  if (options.bassOctaves) {
    const root = base - 12 * options.bassOctaves;
    tones.unshift(root);
  }
  return tones;
}

export interface ChordLineOptions extends VoicingOptions {
  start?: number;
  barBeats?: number;
  /** Sounding length; defaults to the full bar. */
  dur?: number;
  velocity?: number;
  /** Stagger chord tones by this many beats (a gentle roll/strum). */
  roll?: number;
}

/** One sustained chord per entry, laid out one bar apart. */
export function chordLine(symbols: string[], options: ChordLineOptions = {}): Note[] {
  const barBeats = options.barBeats ?? 4;
  const start = options.start ?? 0;
  const velocity = options.velocity ?? 0.7;
  const notes: Note[] = [];
  symbols.forEach((symbol, bar) => {
    if (symbol === '-' || symbol === '') return;
    const at = start + bar * barBeats;
    const dur = options.dur ?? barBeats;
    const tones = chordMidis(symbol, options);
    tones.forEach((midi, i) => {
      const offset = (options.roll ?? 0) * i;
      notes.push([at + offset, Math.max(0.05, dur - offset), midi, velocity]);
    });
  });
  return notes;
}

export interface ArpOptions extends VoicingOptions {
  start?: number;
  barBeats?: number;
  /**
   * Indices into the chord-tone array, extended upwards: with a triad,
   * 0/1/2 are root/third/fifth and 3/4/5 are the same an octave up.
   */
  pattern: number[];
  /** Length of one pattern step in beats. */
  step: number;
  /** Sounding length of each note; defaults to `step`. */
  dur?: number;
  velocity?: number;
  /** Velocity multiplier applied to pattern index 0 (the downbeat). */
  accent?: number;
}

/** Repeat an arpeggio pattern across a chord sequence, one chord per bar. */
export function arpLine(symbols: string[], options: ArpOptions): Note[] {
  const barBeats = options.barBeats ?? 4;
  const start = options.start ?? 0;
  const velocity = options.velocity ?? 0.65;
  const notes: Note[] = [];
  symbols.forEach((symbol, bar) => {
    if (symbol === '-' || symbol === '') return;
    const tones = chordMidis(symbol, options);
    const barStart = start + bar * barBeats;
    const steps = Math.round(barBeats / options.step);
    for (let s = 0; s < steps; s++) {
      const index = options.pattern[s % options.pattern.length]!;
      const tone = tones[index % tones.length]! + 12 * Math.floor(index / tones.length);
      const vel = s === 0 ? Math.min(1, velocity * (options.accent ?? 1.12)) : velocity;
      notes.push([barStart + s * options.step, options.dur ?? options.step, tone, vel]);
    }
  });
  return notes;
}

export interface DrumLineOptions {
  start?: number;
  /** Length of one character in beats (0.25 = sixteenths). */
  step?: number;
  /** Pitch handed to the voice (matters for taiko/tom/timpani). */
  pitch?: Pitch;
  velocity?: number;
  accentVelocity?: number;
  ghostVelocity?: number;
  /** Repeat the whole pattern this many times. */
  times?: number;
}

/**
 * Step-sequencer string for drums.
 *
 *   "x..x..x...x.x..."   x = hit, X = accent, o = open/long, g = ghost, . = rest
 */
export function drumLine(pattern: string, options: DrumLineOptions = {}): Note[] {
  const step = options.step ?? 0.25;
  const start = options.start ?? 0;
  const pitch = toMidi(options.pitch ?? 'C2');
  const vel = options.velocity ?? 0.8;
  const accent = options.accentVelocity ?? Math.min(1, vel * 1.3);
  const ghost = options.ghostVelocity ?? vel * 0.4;
  const chars = pattern.replace(/[|\s]/g, '').split('');
  const times = options.times ?? 1;
  const period = chars.length * step;
  const notes: Note[] = [];
  for (let t = 0; t < times; t++) {
    chars.forEach((ch, i) => {
      if (ch === '.' || ch === '-') return;
      const at = start + t * period + i * step;
      if (ch === 'x') notes.push([at, step, pitch, vel]);
      else if (ch === 'X') notes.push([at, step, pitch, accent]);
      else if (ch === 'g') notes.push([at, step, pitch, ghost]);
      else if (ch === 'o') notes.push([at, step * 3, pitch, vel]);
      else throw new Error(`Unknown drum step "${ch}" in "${pattern}"`);
    });
  }
  return notes;
}

/** Roots of a chord sequence as MIDI notes, for bass riffs. */
export function chordRoots(symbols: string[], octave = 2): number[] {
  return symbols.map((s) => {
    const spec = parseChord(s);
    const bass = spec.bass ?? spec.root;
    return (octave + 1) * 12 + bass;
  });
}

/** Scale degrees of common modes, for quick melodic sketching. */
export const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonicMinor: [0, 3, 5, 7, 10],
};

/** Degree (0-based, can go negative or past the octave) → MIDI note. */
export function degree(root: Pitch, scale: number[], index: number): number {
  const size = scale.length;
  const octave = Math.floor(index / size);
  const step = ((index % size) + size) % size;
  return toMidi(root) + scale[step]! + 12 * octave;
}
