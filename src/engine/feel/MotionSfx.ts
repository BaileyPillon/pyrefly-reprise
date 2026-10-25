/**
 * THE MOTION SOUNDS, PLANNED (motion program, lane "feel", step 2; Bailey, 2026-10-22: "Subtle synced sounds": a whoosh on a lunge and on a smear, a landing thud matched to the
 * squash, a cloth rustle on a cast, from the existing sound library, mixed under the music).
 *
 * {@link planMotionSfx} is the whole decision, pure: given a beat (`feel/MotionBeats.ts`), the gate (the switch, the running game, the playback speed, the clock) and a small memory of
 * what it played lately, it answers the sound to start (the cue, its volume, pitch, trim, fade and the delay that puts its loudest moment on the beat) or the reason it plays nothing.
 * The page's sink (`app/motionSfxSink.ts`) only carries that answer to `AudioManager.playSfx`.
 *
 * Gates, all of which must hold: `?motionsfx=on` (or `?pack=demo`) in Chapter I or Chapter IV (`FeelSwitch.motionSfxOn`: every other chapter, and every unit test, is silent here); the
 * running game is FFX or FFX-2 (a chapter's `sfxChapter` named it); the playback speed is `normal` (a fast or skipped fight has no time for foley, and the sound would be pitched for a
 * slow move); the same beat did not play a moment ago; and no more than three motion sounds started in the last 300 ms (FFX-2's Active ATB overlaps three girls' actions, and a pile of
 * whooshes is not subtle). **REDUCE MOTION does not gate it**: Bailey's pick turns off "Shake, punch, freeze, rumble" only, a sound is none of those, and the figures still move.
 *
 * Shape (every number `[ours]`, the sources describe no motion sound): a bigger movement is louder (a lunge 60 to 100 percent of its volume over reaches of 0 to 2.4 world units; a
 * landing 45 to 100 percent over hops of 0 to a third of the figure), a heavier body is lower and longer (a boss's whoosh 22 percent lower and 10 percent louder, its landing 35 percent lower and 15
 * percent louder: a lower pitch already carries more weight, and the boss's own hit must stay the loudest thing), and a smear within 90 ms of a lunge or a dash is halved (they are one movement: one whoosh with a zip on top, not two). Game case: both (shared plumbing, one neutral
 * set; `sfxV2/motionCues.ts` says why).
 */

import { motionCue, type MotionBeatKind } from '../../audio/sfxV2/motionCues.ts';
import type { MotionBeat } from './MotionBeats.ts';

export interface MotionGate {
  /** `FeelSwitch.motionSfxOn()`: the switch is on in Chapter I or Chapter IV. */
  on: boolean;
  /** The running chapter's game (`sfxGame()`), or null (the title, chapter select, FF7). */
  game: 'ffx' | 'ffx2' | null;
  /** `'normal'`, `'fast'` or `'skip'`. */
  speed: string;
  /** The clock in ms (`performance.now()`, or the stepper's). */
  now: number;
}

/** What the planner remembers between beats (one per page; the tests make their own). */
export interface MotionMemory {
  last: Partial<Record<MotionBeatKind, number>>;
  /** Start times of the motion sounds of the last 300 ms. */
  recent: number[];
}

export function newMotionMemory(): MotionMemory {
  return { last: {}, recent: [] };
}

export interface MotionPlan {
  kind: MotionBeatKind;
  /** The key `AudioManager.playSfx` is asked for. */
  key: string;
  volume: number;
  pitch: number;
  /** Seconds to wait (`PlaySfxOptions.delay`): puts the cue's loudest moment on the beat. */
  delay: number;
  trimMs: number;
  fadeMs: number;
  /** The smear was halved because a lunge or a dash was within 90 ms. */
  ducked: boolean;
}

export type MotionRefusal = 'off' | 'no-game' | 'speed' | 'other-game' | 'too-soon' | 'busy' | 'small' | 'gather';
export type MotionAnswer = { ok: true; plan: MotionPlan } | { ok: false; why: MotionRefusal };

/** The shortest gap between two sounds of one beat, ms. */
export const MIN_GAP_MS: Readonly<Record<MotionBeatKind, number>> = { lunge: 160, dash: 200, smear: 70, land: 100, cast: 250 };
/** At most this many motion sounds start in any {@link BUSY_WINDOW_MS}. */
export const BUSY_MAX = 3;
export const BUSY_WINDOW_MS = 300;
/** A smear this close after a lunge or a dash is one movement with it: its sound is multiplied by {@link DUCK}. */
export const DUCK_WINDOW_MS = 90;
export const DUCK = 0.5;
/**
 * A landing smaller than this share of a hop is not a landing: the turn-start weight shift is a hop of 3.5 percent of the figure (`PaintedActor.playCue('step')`, a strength of 0.106 at any size),
 * found by playing Chapter IV, where it made a thud at every turn start. The smallest real landing (a dodge of 0.18 on a 1.8 figure) is 0.30. Under the curves the same weight shift is a small leap
 * whose landing squash is 0.011 (`PaintedActor.playCue('step')`: a strength of 0.18, under this floor; the integration review found the thud back at 10 of 10 turn starts when it was 0.015, a strength of 0.25).
 */
export const MIN_LAND_STRENGTH = 0.2;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const num = (v: number | undefined, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** Decide the sound for one beat. Mutates `memory` only when a sound is planned. */
export function planMotionSfx(beat: MotionBeat, gate: MotionGate, memory: MotionMemory): MotionAnswer {
  if (!gate.on) return { ok: false, why: 'off' };
  if (gate.game === null) return { ok: false, why: 'no-game' };
  if (gate.speed !== 'normal') return { ok: false, why: 'speed' };
  const kind = beat.kind;
  const base = motionCue(kind, gate.game);
  if (base === null) return { ok: false, why: 'other-game' };
  const s = clamp(num(beat.strength, 0.6), 0, 1);
  const h = clamp(num(beat.heft, 0), 0, 1);
  if (kind === 'land' && s < MIN_LAND_STRENGTH) return { ok: false, why: 'small' };

  const last = memory.last[kind];
  if (last !== undefined && gate.now - last < MIN_GAP_MS[kind]) return { ok: false, why: 'too-soon' };
  memory.recent = memory.recent.filter((t) => gate.now - t < BUSY_WINDOW_MS);
  if (memory.recent.length >= BUSY_MAX) return { ok: false, why: 'busy' };

  let volume = base.volume;
  let pitch = base.pitch;
  let trim = base.trimMs;
  switch (kind) {
    case 'lunge':
      volume *= lerp(0.6, 1, s) * (1 + 0.1 * h);
      pitch *= 1 - 0.22 * h;
      trim *= 1 + 0.3 * h;
      break;
    case 'dash':
      volume *= lerp(0.7, 1, s) * (1 + 0.05 * h);
      pitch *= 1 - 0.15 * h;
      break;
    case 'smear':
      volume *= lerp(0.6, 1, s);
      break;
    case 'land':
      volume *= lerp(0.45, 1, s) * (1 + 0.15 * h);
      pitch *= 1 - 0.35 * h;
      trim *= 1 + 0.5 * h;
      break;
    case 'cast':
      pitch *= 1 - 0.2 * h;
      break;
  }
  let ducked = false;
  if (kind === 'smear') {
    const near = Math.max(memory.last.lunge ?? -Infinity, memory.last.dash ?? -Infinity);
    if (gate.now - near < DUCK_WINDOW_MS) {
      volume *= DUCK;
      ducked = true;
    }
  }
  const ms = num(beat.ms, 0);
  if (ms > 0) trim = Math.min(trim, Math.max(60, ms * (kind === 'dash' ? 0.95 : 0.9)));
  trim = Math.round(trim);
  const fadeMs = Math.min(base.fadeMs, Math.round(trim * 0.45));
  pitch = clamp(pitch, 0.5, 2);
  volume = clamp(volume, 0, 1.5);
  // The cue's loudest moment is `base.peakMs` into it at the base pitch; at another pitch it moves by the ratio. The cue starts that much before the beat, never before now.
  const peakLead = base.peakMs * (base.pitch / pitch);
  const delay = Math.max(0, num(beat.atMs, 0) - peakLead) / 1000;

  memory.last[kind] = gate.now;
  memory.recent.push(gate.now);
  return { ok: true, plan: { kind, key: base.key, volume: Math.round(volume * 1000) / 1000, pitch: Math.round(pitch * 1000) / 1000, delay: Math.round(delay * 1000) / 1000, trimMs: trim, fadeMs, ducked } };
}
