/**
 * Tempo maps: a pulse that can bend.
 *
 * Until this file existed a `Track` had exactly one `bpm`, so rubato had to be
 * written into the note values — which can move a note but cannot move the
 * *pulse*, and bending the pulse is half of what makes a line sound played
 * rather than typed (THEMES.md, "Renderer requests" #1).
 *
 * A tempo map is a list of marks in beats. Between two marks the tempo is
 * either held (a step: a new section, `a tempo`) or glided (a ramp: rit. and
 * accel.). A mark may also hold time still for a moment without changing the
 * tempo at all, which is a fermata.
 *
 * Everything else in the audio engine asks this module for time. There is one
 * beat-to-seconds function and one inverse, and note starts, note lengths,
 * the track's total length and both loop points all go through them.
 *
 * ## Exactness, and why a track with no map is byte-identical
 *
 * `tempoCurveOf({ bpm })` with no map returns a curve that multiplies by
 * `60 / bpm` in exactly the order `render.ts` used to, so every rendered
 * sample of every existing cue is unchanged and no cue needs re-rendering to
 * pick this up. `tests/unit/audio-tempo.test.ts` hashes one real cue to prove
 * it. Add a `tempo` to a track and only that track moves.
 *
 * ## The maths of a ramp
 *
 * Tempo is linear in *beats* across a ramp, which is the reading a player
 * gives "slow down evenly over these four bars". With
 * `bpm(x) = b0 + k(x - x0)`, the time to play from `x0` to `x` is the integral
 * of `60/bpm`:
 *
 *     t(x) - t(x0) = (60 / k) * ln(bpm(x) / b0)          (k != 0)
 *                  = (x - x0) * 60 / b0                  (k == 0)
 *
 * It is a closed form, not a sum over small steps, so a ritardando lands on an
 * exact number of seconds that a test can assert to the nanosecond.
 */

/** `'base'` means "the tempo written at the top of the track" — i.e. a tempo. */
export type TempoBpm = number | 'base';

export interface TempoMark {
  /** Beat this mark takes effect on. Marks run in non-decreasing beat order. */
  beat: number;
  /**
   * Tempo from this beat onward. Omit it to anchor the tempo that is already
   * sounding (which is how a ramp is given a starting point), or pass `'base'`
   * to return to the track's own `bpm`.
   */
  bpm?: TempoBpm;
  /**
   * How the tempo gets here from the mark before it.
   * - `'step'` (the default) — it jumps on this beat.
   * - `'ramp'` — it glides across the whole span from the previous mark.
   *   A ramp down is a ritardando, a ramp up an accelerando.
   */
  curve?: 'step' | 'ramp';
  /**
   * Seconds of held time inserted *immediately after* this beat: a fermata.
   * A note struck on the beat is held through it; everything later is pushed
   * back by the same amount.
   */
  holdSec?: number;
  /** Free text for the render report — `'rit.'`, `'a tempo'`, `'fermata'`. */
  label?: string;
}

/** `[beat, bpm]` is shorthand for a step mark, the form THEMES.md asked for. */
export type TempoEntry = TempoMark | readonly [beat: number, bpm: number];

export type TempoMap = readonly TempoEntry[];

/** What a curve is built from: any object with a base tempo and maybe a map. */
export interface TempoSource {
  bpm: number;
  tempo?: TempoMap;
}

export interface TempoCurve {
  /** The track's written tempo — what `'base'` and an absent map mean. */
  readonly baseBpm: number;
  /** False when the track has no map and time is a single multiplication. */
  readonly hasMap: boolean;
  /** The resolved marks, for reports and debug overlays. */
  readonly marks: readonly ResolvedMark[];
  /** Seconds from the top of the track to `beat`. Monotonic in `beat`. */
  secondsAt(beat: number): number;
  /** The inverse of `secondsAt`. Inside a fermata it returns that beat. */
  beatAt(sec: number): number;
  /** Tempo sounding at `beat`. */
  bpmAt(beat: number): number;
  /** `60 / bpmAt(beat)`. */
  secondsPerBeatAt(beat: number): number;
  /** How long `lengthBeats` beats starting at `startBeat` take to play. */
  spanSec(startBeat: number, lengthBeats: number): number;
}

export interface ResolvedMark {
  beat: number;
  bpm: number;
  curve: 'step' | 'ramp';
  holdSec: number;
  label?: string;
}

interface Segment {
  /** Beat the segment starts on. */
  beat: number;
  /** Beat the next segment starts on; `Infinity` for the last one. */
  endBeat: number;
  /** Tempo at `beat`. */
  bpm: number;
  /** Tempo at `endBeat` — equal to `bpm` unless this span is a ramp. */
  endBpm: number;
  /** Seconds at `beat`, before this segment's own hold. */
  sec: number;
  /** Held seconds inserted immediately after `beat`. */
  holdSec: number;
}

function markOf(entry: TempoEntry): TempoMark {
  return Array.isArray(entry)
    ? { beat: (entry as readonly [number, number])[0], bpm: (entry as readonly [number, number])[1] }
    : (entry as TempoMark);
}

function requireFinite(value: number, what: string): number {
  if (!Number.isFinite(value)) throw new Error(`Tempo map: ${what} must be a finite number`);
  return value;
}

/**
 * Turn a written map into marks with every default filled in, validating as it
 * goes. A bad tempo map is a composition bug and throws here rather than
 * rendering something quietly wrong an hour later.
 */
export function resolveTempoMarks(source: TempoSource): ResolvedMark[] {
  const base = source.bpm;
  if (!(base > 0) || !Number.isFinite(base)) throw new Error(`Tempo map: track bpm must be > 0 (got ${base})`);
  const map = source.tempo;
  if (!map || map.length === 0) return [];
  const out: ResolvedMark[] = [];
  let running = base;
  let lastBeat = -Infinity;
  for (const entry of map) {
    const mark = markOf(entry);
    const beat = requireFinite(mark.beat, 'beat');
    if (beat < 0) throw new Error(`Tempo map: beat ${beat} is before the start of the track`);
    if (beat < lastBeat) {
      throw new Error(`Tempo map: marks must be in beat order (${beat} follows ${lastBeat})`);
    }
    lastBeat = beat;
    let bpm: number;
    if (mark.bpm === undefined) bpm = running;
    else if (mark.bpm === 'base') bpm = base;
    else bpm = requireFinite(mark.bpm, 'bpm');
    if (!(bpm > 0)) throw new Error(`Tempo map: bpm must be > 0 at beat ${beat} (got ${bpm})`);
    const holdSec = mark.holdSec ?? 0;
    if (!(holdSec >= 0) || !Number.isFinite(holdSec)) {
      throw new Error(`Tempo map: holdSec must be >= 0 at beat ${beat} (got ${holdSec})`);
    }
    const curve = mark.curve ?? 'step';
    if (curve !== 'step' && curve !== 'ramp') {
      throw new Error(`Tempo map: unknown curve "${String(curve)}" at beat ${beat}`);
    }
    if (curve === 'ramp' && beat === (out[out.length - 1]?.beat ?? 0)) {
      throw new Error(
        `Tempo map: the ramp at beat ${beat} has nowhere to happen — it starts and ends on the same beat`,
      );
    }
    out.push({ beat, bpm, curve, holdSec, ...(mark.label === undefined ? {} : { label: mark.label }) });
    running = bpm;
  }
  return out;
}

function buildSegments(base: number, marks: readonly ResolvedMark[]): Segment[] {
  const segments: Segment[] = [
    { beat: 0, endBeat: Infinity, bpm: base, endBpm: base, sec: 0, holdSec: 0 },
  ];
  for (const mark of marks) {
    const previous = segments[segments.length - 1]!;
    if (mark.beat <= previous.beat) {
      // A second mark on the same beat: it replaces the tempo and adds its hold.
      previous.bpm = mark.bpm;
      previous.endBpm = mark.bpm;
      previous.holdSec += mark.holdSec;
      continue;
    }
    previous.endBeat = mark.beat;
    if (mark.curve === 'ramp') previous.endBpm = mark.bpm;
    segments.push({
      beat: mark.beat,
      endBeat: Infinity,
      bpm: mark.bpm,
      endBpm: mark.bpm,
      sec: 0,
      holdSec: mark.holdSec,
    });
  }
  // Second pass: the seconds each segment starts at, which needs every span
  // before it to have its final endBpm.
  let sec = 0;
  for (const segment of segments) {
    segment.sec = sec;
    if (segment.endBeat === Infinity) break;
    sec += segment.holdSec + spanOf(segment, segment.endBeat);
  }
  return segments;
}

/** Seconds from a segment's start beat to `beat`, ignoring its hold. */
function spanOf(segment: Segment, beat: number): number {
  const beats = beat - segment.beat;
  if (beats <= 0) return 0;
  if (segment.endBpm === segment.bpm || segment.endBeat === Infinity) {
    return (beats * 60) / segment.bpm;
  }
  const k = (segment.endBpm - segment.bpm) / (segment.endBeat - segment.beat);
  const here = segment.bpm + k * beats;
  return (60 / k) * Math.log(here / segment.bpm);
}

function bpmOf(segment: Segment, beat: number): number {
  if (segment.endBpm === segment.bpm || segment.endBeat === Infinity) return segment.bpm;
  const k = (segment.endBpm - segment.bpm) / (segment.endBeat - segment.beat);
  const clamped = Math.min(Math.max(beat, segment.beat), segment.endBeat);
  return segment.bpm + k * (clamped - segment.beat);
}

/**
 * The constant-tempo curve.
 *
 * Deliberately written as the same multiplications, in the same order, that
 * `render.ts` did before tempo maps existed: `beat * (60 / bpm)`. Floating
 * point is not associative, so "the same value" here means the same bits, and
 * that is what keeps every un-mapped cue byte-identical.
 */
function constantCurve(bpm: number): TempoCurve {
  if (!(bpm > 0) || !Number.isFinite(bpm)) throw new Error(`Tempo: bpm must be > 0 (got ${bpm})`);
  const secondsPerBeat = 60 / bpm;
  return {
    baseBpm: bpm,
    hasMap: false,
    marks: [],
    secondsAt: (beat) => beat * secondsPerBeat,
    beatAt: (sec) => sec / secondsPerBeat,
    bpmAt: () => bpm,
    secondsPerBeatAt: () => secondsPerBeat,
    spanSec: (_startBeat, lengthBeats) => lengthBeats * secondsPerBeat,
  };
}

/** Build the curve for a track (or anything with `bpm` and an optional `tempo`). */
export function tempoCurveOf(source: TempoSource): TempoCurve {
  const marks = resolveTempoMarks(source);
  if (marks.length === 0) return constantCurve(source.bpm);
  const segments = buildSegments(source.bpm, marks);

  function segmentAt(beat: number): Segment {
    // Linear scan: a map is a handful of marks, and this is called once per
    // note. Binary search would be noise against a sampler read.
    let found = segments[0]!;
    for (const segment of segments) {
      if (segment.beat <= beat) found = segment;
      else break;
    }
    return found;
  }

  function secondsAt(beat: number): number {
    if (beat <= 0) return 0;
    const segment = segmentAt(beat);
    // A segment's own hold sits immediately after its beat, so anything
    // strictly later than that beat waits through it.
    const hold = beat > segment.beat ? segment.holdSec : 0;
    return segment.sec + hold + spanOf(segment, beat);
  }

  return {
    baseBpm: source.bpm,
    hasMap: true,
    marks,
    secondsAt,
    beatAt(sec) {
      if (sec <= 0) return 0;
      let found = segments[0]!;
      for (const segment of segments) {
        if (segment.sec <= sec) found = segment;
        else break;
      }
      const after = sec - found.sec - found.holdSec;
      if (after <= 0) return found.beat;
      if (found.endBpm === found.bpm || found.endBeat === Infinity) {
        return found.beat + (after * found.bpm) / 60;
      }
      const k = (found.endBpm - found.bpm) / (found.endBeat - found.beat);
      return found.beat + (found.bpm * Math.exp((k * after) / 60) - found.bpm) / k;
    },
    bpmAt(beat) {
      return bpmOf(segmentAt(beat), beat);
    },
    secondsPerBeatAt(beat) {
      return 60 / bpmOf(segmentAt(beat), beat);
    },
    spanSec(startBeat, lengthBeats) {
      if (lengthBeats <= 0) return 0;
      return secondsAt(startBeat + lengthBeats) - secondsAt(startBeat);
    },
  };
}

// ------------------------------------------------------------------ writing

/**
 * A ritardando: hold the tempo until `fromBeat`, then glide to `bpm` by
 * `toBeat`. The anchor mark is what makes the ramp start where you meant it to
 * rather than back at the previous tempo change.
 */
export function rit(fromBeat: number, toBeat: number, bpm: number, label = 'rit.'): TempoMark[] {
  return [
    { beat: fromBeat },
    { beat: toBeat, bpm, curve: 'ramp', label },
  ];
}

/** An accelerando. Identical shape to `rit`; the label is what differs. */
export function accel(fromBeat: number, toBeat: number, bpm: number, label = 'accel.'): TempoMark[] {
  return rit(fromBeat, toBeat, bpm, label);
}

/**
 * A fermata: time stops for `seconds` immediately after `beat`. The note
 * written on that beat is held through the pause; everything after it moves.
 */
export function fermata(beat: number, seconds: number, label = 'fermata'): TempoMark[] {
  return [{ beat, holdSec: seconds, label }];
}

/** Back to the track's written tempo (or to `bpm` if you name one). */
export function aTempo(beat: number, bpm: TempoBpm = 'base', label = 'a tempo'): TempoMark[] {
  return [{ beat, bpm, label }];
}

/** A bare `[beat, bpm]` pair, as opposed to a list of marks. */
function isPair(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

/** Flatten the helpers (and any bare marks) into the array `Track.tempo` wants. */
export function tempoMap(...parts: Array<TempoEntry | TempoEntry[]>): TempoMap {
  const out: TempoEntry[] = [];
  for (const part of parts) {
    if (isPair(part)) out.push(part as TempoEntry);
    else if (Array.isArray(part)) out.push(...(part as TempoEntry[]));
    else out.push(part);
  }
  return out;
}

/**
 * Non-fatal things worth saying about a map, printed by the renderer.
 *
 * The one that matters is the loop: a cue whose tempo at `loop.end` differs
 * from its tempo at `loop.start` lurches every time it comes round, which is
 * the loop-seam problem again one level up — the waveform is continuous and
 * the *pulse* is not.
 */
export function tempoWarnings(track: TempoSource & { loop?: { start: number; end: number } }): string[] {
  const warnings: string[] = [];
  const curve = tempoCurveOf(track);
  if (!curve.hasMap || !track.loop) return warnings;
  const atStart = curve.bpmAt(track.loop.start);
  const atEnd = curve.bpmAt(track.loop.end);
  if (Math.abs(atStart - atEnd) > 0.5) {
    warnings.push(
      `tempo at loop.end is ${atEnd.toFixed(1)} bpm but the loop restarts at ${atStart.toFixed(1)} bpm — ` +
        'the wrap will lurch; finish the rit. before loop.end or a tempo back onto it',
    );
  }
  for (const mark of curve.marks) {
    if (mark.holdSec > 0 && mark.beat >= track.loop.end) {
      warnings.push(`the fermata at beat ${mark.beat} is at or past loop.end, so nobody will ever hear it`);
    }
  }
  return warnings;
}
