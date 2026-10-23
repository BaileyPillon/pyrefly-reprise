/**
 * The audio pass's data shapes (conference demo sound pass, 2026-10-22; decision 184). Pure types, no imports of Web Audio.
 *
 * A LAYER is one more existing library slice played with a hit, a spell landing or a UI cue: it names a cue that already ships (`public/audio/manifest.json`: the v2 sprite or the first bank), the
 * part of it to play, its pitch and its level against the cue it sits under. Nothing here is new audio (decision 184: no new paid generation).
 */

/** One library slice played on top of a base cue. */
export interface LayerSpec {
  /** The mixer key: a first-bank cue name (`counter`) or `v2:<name>` (the v2 sprite). Never a parity original: a layer plays whatever has decoded, early. */
  key: string;
  /** Level against the call's own volume, dB (negative: under the base). */
  db: number;
  /** Playback rate (`PlaySfxOptions.pitch`). */
  pitch: number;
  /** Start this far into the slice, ms of the slice: the slice's own silence before its first audible sample (so the layer's onset lands with the base's). */
  skipMs: number;
  /** Play only this much, ms of output time after the skip and the pitch. */
  trimMs: number;
  /** Fade to silence over the last of it, ms (a cut slice must fade or it clicks). */
  fadeMs: number;
  /** Extra ms after the base's onset (0: with it). Negative values are not allowed: a layer never leads its base. */
  lagMs?: number;
  /** -1 left .. 1 right. */
  pan?: number;
}

/** A layer as the mixer takes it (`PlaySfxOptions.pass.layers`). */
export interface SfxLayer {
  key: string;
  /** Linear gain against the base cue's own level (the call's volume times its trim): the mixer multiplies it in. */
  gain: number;
  pitch: number;
  skipMs: number;
  trimMs: number;
  fadeMs: number;
  lagMs: number;
  pan: number;
  /** What the layer is, for the log: `texture`, `body`, `thump`, `character`. */
  role: string;
}

/** The dip of the music before a big blow: from `startMs` before the blow, hold `holdMs` at `depthDb`, back over `releaseMs`. */
export interface DipPlan {
  /** ms before the blow the dip starts. */
  leadMs: number;
  /** ms held at the depth. */
  holdMs: number;
  /** Depth on the music, dB (negative). */
  depthDb: number;
  /** ms to come back after the hold. */
  releaseMs: number;
}

/** The longest leading silence the mixer cuts from a base cue, ms (the recorded dagger hit has 168 ms of it). */
export const MAX_BASE_SKIP_MS = 200;

/** A big moment: a critical, an Overdrive's finisher or a boss's headline blow. */
export type BigKind = 'crit' | 'overdrive' | 'boss';

/** What the pass adds to one sound: layers under the base, the base's own start (skip its silence), and for a big moment a thump and a dip. */
export interface PassPlan {
  /** True: start the base at its own first audible sample (its leading silence skipped, at most {@link MAX_BASE_SKIP_MS}) so the sound lands on the contact it is asked at. Absent: as it always played. */
  baseSkip?: true;
  layers: readonly SfxLayer[];
  /** Set for a big moment. */
  big?: BigKind;
  /** The dip to schedule before the blow, when the caller knows how far ahead the blow is. */
  dip?: DipPlan;
  /** A spell's landing: ms until the effect's own clock reaches the blow's mark when the cue was asked; the mixer waits that long less the cue's own silence (`planner.landingDelayMs`). */
  landingMs?: number;
}
