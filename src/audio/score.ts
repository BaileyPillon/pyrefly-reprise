/**
 * The note-data format and the helpers that make writing a three minute track
 * by hand bearable.
 *
 * A `Track` is plain data: no DSP, no timing, no audio objects. `render.ts`
 * turns it into samples; the tracker parser and the chord/arp helpers in
 * `harmony.ts` are just Note[] factories.
 */

import type { ReverbOptions } from './dsp/reverb.ts';
import { tempoCurveOf, type TempoMap } from './tempo.ts';

/** A pitch is a MIDI number (60 = C4) or a name like "C4", "F#3", "Bb5". */
export type Pitch = number | string;

/** [startBeat, durationBeats, pitch, velocity?] — velocity defaults to 0.8. */
export type Note = [start: number, dur: number, pitch: Pitch, velocity?: number];

export interface ChannelFx {
  /** Send into the track reverb bus, 0..1. */
  reverb?: number;
  /** Send into the track delay bus, 0..1. */
  delay?: number;
}

/**
 * What one channel may say about *performance*, overriding the voice preset.
 *
 * Timing jitter and velocity spread are how a sampled section stops sounding
 * like one trigger, so they live on the instrument — but two cues can want the
 * same instrument played differently. Vegnagun is a machine and the Yunalesca
 * canon is a rite: both need `<= 3 ms` (THEMES.md, Humanisation) out of voices
 * whose presets ask for 14-18, and neither should drag every other cue that
 * uses those voices tight with them.
 *
 * Absent, nothing changes: the preset's own figures apply, exactly as before.
 */
export interface ChannelPerformance {
  /**
   * Replaces the voice preset's `timingJitterMs` for this channel. `0` is a
   * machine. Offline only — the runtime oscillator voices have never had
   * start jitter, so there is nothing there to override.
   */
  timingJitterMs?: number;
  /**
   * Multiplies whatever jitter is in force after the field above: `0` is
   * quantised, `1` is the preset as written, `0.5` is a tighter section.
   */
  humanise?: number;
  /**
   * Deterministic +/- velocity spread per note, on top of the written shape.
   * THEMES.md's ceiling is **0.04**; past that the dynamic arch stops reading,
   * so anything larger throws. Applies to the sampled and the synthesised
   * render alike, because velocity is a sequencer-level number.
   */
  velocityJitter?: number;
}

export interface Channel {
  /** Optional label for debugging / the render report. */
  name?: string;
  /** Key in `INSTRUMENTS`. */
  instrument: string;
  /** Linear gain, default 1. */
  volume?: number;
  /** -1 left .. 1 right, default 0. */
  pan?: number;
  /** Semitones added to every note in this channel. */
  transpose?: number;
  notes: Note[];
  fx?: ChannelFx;
  /** Per-channel timing and velocity overrides — see `ChannelPerformance`. */
  perform?: ChannelPerformance;
}

/** The preset's jitter as this channel wants it played, in milliseconds. */
export function effectiveJitterMs(presetJitterMs: number, perform?: ChannelPerformance): number {
  const base = perform?.timingJitterMs ?? presetJitterMs;
  const scaled = base * (perform?.humanise ?? 1);
  return Number.isFinite(scaled) && scaled > 0 ? scaled : 0;
}

/**
 * A stable tag for one channel's performance settings, or `''` when it has
 * none.
 *
 * It goes into the note cache key, which is also the per-note random seed, so
 * two channels on the same instrument with different jitter cannot share a
 * cached render — and, just as important, a channel with no `perform` keeps
 * the exact key (and therefore the exact seed, and therefore the exact
 * samples) it had before this field existed.
 */
export function performanceKey(perform?: ChannelPerformance): string {
  if (!perform) return '';
  const parts: string[] = [];
  if (perform.timingJitterMs !== undefined) parts.push(`j${perform.timingJitterMs}`);
  if (perform.humanise !== undefined) parts.push(`h${perform.humanise}`);
  if (perform.velocityJitter !== undefined) parts.push(`v${perform.velocityJitter}`);
  return parts.length === 0 ? '' : `|${parts.join(',')}`;
}

/** THEMES.md: "Velocity jitter: +/-0.04 ... Never more." */
export const MAX_VELOCITY_JITTER = 0.04;

export function checkPerformance(channel: Channel): void {
  const perform = channel.perform;
  if (!perform) return;
  const where = channel.name ?? channel.instrument;
  if (perform.timingJitterMs !== undefined && !(perform.timingJitterMs >= 0)) {
    throw new Error(`Channel "${where}": timingJitterMs must be >= 0`);
  }
  if (perform.humanise !== undefined && !(perform.humanise >= 0)) {
    throw new Error(`Channel "${where}": humanise must be >= 0`);
  }
  if (perform.velocityJitter !== undefined) {
    if (!(perform.velocityJitter >= 0)) {
      throw new Error(`Channel "${where}": velocityJitter must be >= 0`);
    }
    if (perform.velocityJitter > MAX_VELOCITY_JITTER) {
      throw new Error(
        `Channel "${where}": velocityJitter ${perform.velocityJitter} is over the ` +
          `${MAX_VELOCITY_JITTER} ceiling in THEMES.md — past that the dynamic arch stops reading`,
      );
    }
  }
}

export interface TrackFx {
  reverb?: ReverbOptions;
  delay?: { timeBeats: number; feedback?: number; damp?: number };
}

export interface Track {
  name: string;
  /** The written tempo. With no `tempo` map this is the whole of the pulse. */
  bpm: number;
  /**
   * Optional tempo map: the pulse bends instead of being a grid. See
   * [`tempo.ts`](./tempo.ts) for the syntax and `rit` / `accel` / `fermata` /
   * `aTempo` for the helpers. A track without one renders byte-identically to
   * how it did before tempo maps existed.
   */
  tempo?: TempoMap;
  /** [beatsPerBar, beatUnit] — 4/4 is [4, 4]. */
  timeSig: [number, number];
  /** Loop points in beats. */
  loop: { start: number; end: number };
  channels: Channel[];
  /** Total length in beats (usually === loop.end). */
  length: number;
  fx?: TrackFx;
  /** Master gain applied before the limiter, default 1. */
  gain?: number;
  /** Extra seconds rendered past `length` for tails, default 3. */
  tailSec?: number;
}

const SEMITONES: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** "C4" -> 60, "A4" -> 69, "Bb3" -> 58. Throws on nonsense. */
export function midiFromName(name: string): number {
  const match = /^([A-Ga-g])([#sb]*)(-?\d{1,2})$/.exec(name.trim());
  if (!match) throw new Error(`Bad note name "${name}" (expected e.g. C4, F#3, Bb5)`);
  const letter = match[1]!.toLowerCase();
  const accidentals = match[2] ?? '';
  const octave = Number.parseInt(match[3]!, 10);
  let semitone = SEMITONES[letter]!;
  for (const ch of accidentals) semitone += ch === 'b' ? -1 : 1;
  return (octave + 1) * 12 + semitone;
}

export function nameFromMidi(midi: number): string {
  const m = Math.round(midi);
  const octave = Math.floor(m / 12) - 1;
  return `${SHARP_NAMES[((m % 12) + 12) % 12]!}${octave}`;
}

export function midiToFreq(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function toMidi(pitch: Pitch): number {
  return typeof pitch === 'number' ? pitch : midiFromName(pitch);
}

export function pitchToFreq(pitch: Pitch, a4 = 440): number {
  return midiToFreq(toMidi(pitch), a4);
}

export interface TrackerOptions {
  /** Beat the first token starts on. */
  start?: number;
  /** Default velocity for tokens without an @ suffix. */
  velocity?: number;
  /** Multiplies every duration for articulation (0.5 = staccato, 1 = legato). */
  gate?: number;
  /** Semitones added to every parsed pitch. */
  transpose?: number;
  /** Multiplies every step length (0.5 turns a quarter-note string into eighths). */
  scale?: number;
  /** If set, every `|` must land on a multiple of this many beats. */
  checkBars?: number;
}

/**
 * Tiny tracker-string parser.
 *
 *   "C4:1 E4:1 G4:2 | -:1 C5+E5+G5:3 | A4:0.5@0.5 ~:1"
 *
 *   PITCH          note name (C4, F#3, Bb5) or raw MIDI number
 *   A+B+C          chord — all members share the step
 *   -  r  .        rest
 *   ~              tie: extends the previous step's notes instead of striking
 *   :N             step length in beats (sticky: omit it to reuse the last one)
 *   @V             velocity 0..1 for this step
 *   |              barline; ignored, but validated when `checkBars` is set
 *
 * Returns notes with absolute start beats.
 */
export function tracker(src: string, options: TrackerOptions = {}): Note[] {
  const start = options.start ?? 0;
  const baseVel = options.velocity ?? 0.8;
  const gate = options.gate ?? 1;
  const transpose = options.transpose ?? 0;
  const scale = options.scale ?? 1;
  const notes: Note[] = [];
  let cursor = start;
  let step = 1;
  let previous: Note[] = [];
  const tokens = src.split(/\s+/).filter((t) => t.length > 0);
  for (const token of tokens) {
    if (token === '|' || token === '||') {
      if (options.checkBars) {
        const offset = (cursor - start) % options.checkBars;
        const slack = 1e-6;
        if (Math.min(offset, options.checkBars - offset) > slack) {
          throw new Error(
            `Tracker barline at beat ${cursor - start} is not a multiple of ${options.checkBars}`,
          );
        }
      }
      continue;
    }
    let body = token;
    let velocity = baseVel;
    const at = body.indexOf('@');
    if (at >= 0) {
      velocity = Number.parseFloat(body.slice(at + 1));
      if (!Number.isFinite(velocity)) throw new Error(`Bad velocity in "${token}"`);
      body = body.slice(0, at);
    }
    const colon = body.indexOf(':');
    if (colon >= 0) {
      const value = Number.parseFloat(body.slice(colon + 1));
      if (!Number.isFinite(value) || value <= 0) throw new Error(`Bad step length in "${token}"`);
      step = value;
      body = body.slice(0, colon);
    }
    const length = step * scale;
    if (body === '-' || body === 'r' || body === '.') {
      cursor += length;
      previous = [];
      continue;
    }
    if (body === '~') {
      for (const note of previous) note[1] += length;
      cursor += length;
      continue;
    }
    const struck: Note[] = [];
    for (const part of body.split('+')) {
      const midi = /^-?\d+$/.test(part) ? Number.parseInt(part, 10) : midiFromName(part);
      const note: Note = [cursor, length * gate, midi + transpose, velocity];
      notes.push(note);
      struck.push(note);
    }
    previous = struck;
    cursor += length;
  }
  return notes;
}

/** Alias that reads better when a string is one musical line. */
export const line = tracker;

export function transposeNotes(notes: Note[], semitones: number): Note[] {
  return notes.map((n) => [n[0], n[1], toMidi(n[2]) + semitones, n[3]] as Note);
}

export function shiftNotes(notes: Note[], beats: number): Note[] {
  return notes.map((n) => [n[0] + beats, n[1], n[2], n[3]] as Note);
}

export function scaleVelocity(notes: Note[], factor: number): Note[] {
  return notes.map((n) => [n[0], n[1], n[2], Math.min(1, (n[3] ?? 0.8) * factor)] as Note);
}

/** Copy `notes` `times` times, each one `periodBeats` later (and optionally transposed). */
export function repeatNotes(
  notes: Note[],
  times: number,
  periodBeats: number,
  transposeEach = 0,
): Note[] {
  const out: Note[] = [];
  for (let i = 0; i < times; i++) {
    for (const n of notes) {
      out.push([n[0] + i * periodBeats, n[1], toMidi(n[2]) + i * transposeEach, n[3]]);
    }
  }
  return out;
}

/** Stamp a relative-pitch motif at each bar start with a per-bar root. */
export function motif(pattern: Note[], barStarts: number[], roots: Pitch[]): Note[] {
  const out: Note[] = [];
  for (let i = 0; i < barStarts.length; i++) {
    const root = toMidi(roots[i % roots.length]!);
    for (const n of pattern) {
      out.push([barStarts[i]! + n[0], n[1], root + toMidi(n[2]), n[3]]);
    }
  }
  return out;
}

export function concatNotes(...groups: Note[][]): Note[] {
  const out: Note[] = [];
  for (const g of groups) out.push(...g);
  return out;
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => a[0] - b[0] || toMidi(a[2]) - toMidi(b[2]));
}

/** Last beat touched by any note (handy for asserting a section's length). */
export function notesEnd(notes: Note[]): number {
  let end = 0;
  for (const n of notes) end = Math.max(end, n[0] + n[1]);
  return end;
}

/** Evenly spaced bar start beats, e.g. barStarts(16, 8, 4) -> [16,20,...,44]. */
export function barStarts(firstBeat: number, bars: number, barBeats = 4): number[] {
  const out: number[] = [];
  for (let i = 0; i < bars; i++) out.push(firstBeat + i * barBeats);
  return out;
}

/** How long the written music lasts, tempo map and fermatas included. */
export function trackDurationSec(track: Track): number {
  return tempoCurveOf(track).secondsAt(track.length);
}

/** The loop body's real length in seconds — through the tempo map, if any. */
export function loopDurationSec(track: Track): number {
  const curve = tempoCurveOf(track);
  return curve.secondsAt(track.loop.end) - curve.secondsAt(track.loop.start);
}

export * from './harmony.ts';
export * from './tempo.ts';
