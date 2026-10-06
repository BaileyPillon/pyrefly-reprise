/**
 * Camera comfort presets (fb2-0929). **`calm` is the default for everyone** since
 * Bailey's pick (2026-09-29, "I'll go with all of your recommendations please",
 * `docs/target/decisions.json` D-291); `?cam=current` gives the camera as it was.
 *
 * Bailey's friend, 2026-09-29, Bailey concurring: "The camera movement between
 * attacks is a bit too fast and made me a bit dizzy". Measured live (release
 * 31a, 1600x900, real keys): the battle camera changes shot about once a
 * second, a rig move turns 7-11 degrees in 200-600 ms on a `cubicInOut` curve
 * that peaks at three times its average speed (58-111 deg/s), the impact cut
 * jumps 10-17 degrees, and every attack adds a 4 degree roll. Full numbers:
 * `docs/concepts/fb2-0929/camera/README.md`.
 *
 * - `current`   the camera before D-291, untouched (`?cam=current`).
 * - `calm`      THE DEFAULT. Half the travel toward a close shot, moves at least 1.8x as
 *               long on a sine curve (peak 1.57x average, not 3x) and capped at
 *               20 deg/s, no roll, half the push, no shake on a routine hit.
 * - `steady`    the master holds between turns: a close shot becomes a slow
 *               push on the wide frame, and a long rig change (victory, a
 *               scripted angle) is a cut rather than a whip.
 * - `originals` FFX only: every rig change is a cut and each shot holds still
 *               (no roll, no push), the one pattern the sources describe
 *               (`research/battle-camera-perspectives.md` §A.1, two informal
 *               GameFAQs posts read together, `[derived]`). FFX-2's per-action
 *               camera is `[absence]` in the sources, so an FFX-2 chapter plays
 *               `current` under it until Bailey says otherwise.
 *
 * Selected by `?cam=<name>` or `window.__pyrefly.cam(name)`; read on every call,
 * so a change applies to the next shot. REDUCE MOTION (`ComfortCamera.ts`) sits
 * outside this and still wins: its cuts and zeroes apply to whatever preset.
 *
 * No `three`, no DOM (hard rule 1): rig geometry is read as plain x/y/z.
 * Game case: `current`, `calm`, `steady` both games (shared presenter camera);
 * `originals` FFX only.
 */

import type { CameraRigId } from '../battle/common/types.ts';
import type { CameraPort } from './BattlePresenterPorts.ts';

export type CameraPresetName = 'current' | 'calm' | 'steady' | 'originals';
export const CAMERA_PRESET_NAMES: readonly CameraPresetName[] = ['current', 'calm', 'steady', 'originals'];

export interface CameraPresetSpec {
  readonly name: CameraPresetName;
  /** A rig move takes at least this many times the time it was asked for. */
  readonly moveScale: number;
  /** ...and never less than this, in ms (a move asked for at 0 ms is still a cut). */
  readonly minMoveMs: number;
  /** A rig move is lengthened until its peak angular speed stays under this, deg/s. */
  readonly maxDegPerSec: number;
  /** Share of the way from the master (`idle`) to a close shot (`party`, `enemy`, `action`) a move or cut goes. */
  readonly travel: number;
  /** The master holds for close shots; they become a push of {@link push} on it. */
  readonly holdWide: boolean;
  /** A move that turns more than this many degrees is played as a cut. */
  readonly cutAboveDeg: number;
  readonly easing: 'cubicInOut' | 'sineInOut';
  /** Multipliers on the attack roll, the held push and the impact punch. */
  readonly roll: number;
  readonly push: number;
  readonly punch: number;
  /** A held push runs this many times as long. */
  readonly pushSlow: number;
  /** Multipliers on a routine hit's shake and on a heavy one's ({@link HEAVY_SHAKE} and up). */
  readonly routineShake: number;
  readonly heavyShake: number;
  /** The enemy-intent slab hangs over where its enemy rests, not the frame in flight (`HudPort.LayoutProjector.labelsAtRest`). */
  readonly labelsAtRest: boolean;
}

/** A shake at or above this amplitude (world units) is a heavy hit: a crit, a KO, a boss slam. */
export const HEAVY_SHAKE = 0.15;

const CURRENT: CameraPresetSpec = {
  name: 'current', moveScale: 1, minMoveMs: 0, maxDegPerSec: Infinity, travel: 1, holdWide: false, cutAboveDeg: Infinity,
  easing: 'cubicInOut', roll: 1, push: 1, punch: 1, pushSlow: 1, routineShake: 1, heavyShake: 1, labelsAtRest: false,
};

export const CAMERA_PRESETS: Readonly<Record<CameraPresetName, CameraPresetSpec>> = {
  current: CURRENT,
  calm: {
    name: 'calm', moveScale: 1.8, minMoveMs: 700, maxDegPerSec: 20, travel: 0.5, holdWide: false, cutAboveDeg: Infinity,
    easing: 'sineInOut', roll: 0, push: 0.5, punch: 0.5, pushSlow: 1.6, routineShake: 0, heavyShake: 0.5, labelsAtRest: true,
  },
  steady: {
    name: 'steady', moveScale: 1.8, minMoveMs: 700, maxDegPerSec: 20, travel: 0, holdWide: true, cutAboveDeg: 12,
    easing: 'sineInOut', roll: 0, push: 0.6, punch: 0, pushSlow: 2.5, routineShake: 0, heavyShake: 0.5, labelsAtRest: true,
  },
  originals: {
    name: 'originals', moveScale: 1, minMoveMs: 0, maxDegPerSec: Infinity, travel: 1, holdWide: false, cutAboveDeg: 0,
    easing: 'cubicInOut', roll: 0, push: 0, punch: 0, pushSlow: 1, routineShake: 1, heavyShake: 1, labelsAtRest: false,
  },
};

const CLOSE_RIGS = new Set(['party', 'enemy', 'action']);

/** What plays with no `?cam=`: Bailey's pick, D-291 (2026-09-29), both games. */
export const DEFAULT_CAMERA_PRESET: CameraPresetName = 'calm';

let active: CameraPresetName | null = null;

/** `?cam=<name>`, or null when absent or not a preset. */
export function cameraPresetFromSearch(search: string): CameraPresetName | null {
  const v = new URLSearchParams(search).get('cam');
  return v && (CAMERA_PRESET_NAMES as readonly string[]).includes(v) ? (v as CameraPresetName) : null;
}

/** The preset the player (or `?cam=`) chose; `calm` by default (D-291, both games). */
export function cameraPreset(): CameraPresetName {
  if (active === null) {
    let search = '';
    try {
      search = globalThis.location?.search ?? '';
    } catch {
      search = '';
    }
    active = cameraPresetFromSearch(search) ?? DEFAULT_CAMERA_PRESET;
  }
  return active;
}

/** Choose a preset; an unknown name is ignored. Answers the preset in force. */
export function setCameraPreset(name: string): CameraPresetName {
  if ((CAMERA_PRESET_NAMES as readonly string[]).includes(name)) active = name as CameraPresetName;
  return cameraPreset();
}

/** The spec a chapter of `game` plays: `originals` is FFX only (see the file head). */
export function cameraPresetFor(game: string, name: CameraPresetName = cameraPreset()): CameraPresetSpec {
  if (name === 'originals' && game !== 'ffx') return CURRENT;
  return CAMERA_PRESETS[name];
}

type XYZ = { x: number; y: number; z: number };
type RigShape = { position: XYZ | [number, number, number]; lookAt: XYZ | [number, number, number]; fov?: number; sway?: number };

/** What {@link PresetCamera} needs of `BattleCamera` beyond the port. */
export interface RigCamera extends CameraPort {
  moveTo(rig: CameraRigId, ms?: number, easing?: 'cubicInOut' | 'sineInOut'): Promise<void>;
  getRig(name: string): RigShape | undefined;
}

const xyz = (v: XYZ | [number, number, number]): [number, number, number] => (Array.isArray(v) ? [v[0], v[1], v[2]] : [v.x, v.y, v.z]);
const lerp3 = (a: number[], b: number[], t: number): [number, number, number] => [a[0]! + (b[0]! - a[0]!) * t, a[1]! + (b[1]! - a[1]!) * t, a[2]! + (b[2]! - a[2]!) * t];

/** Degrees between two rigs' view directions. */
export function rigTurnDeg(a: RigShape, b: RigShape): number {
  const dir = (r: RigShape): number[] => {
    const p = xyz(r.position), l = xyz(r.lookAt);
    const d = [l[0] - p[0], l[1] - p[1], l[2] - p[2]];
    const n = Math.hypot(d[0]!, d[1]!, d[2]!) || 1;
    return d.map((x) => x / n);
  };
  const u = dir(a), v = dir(b);
  const dot = Math.max(-1, Math.min(1, u[0]! * v[0]! + u[1]! * v[1]! + u[2]! * v[2]!));
  return (Math.acos(dot) * 180) / Math.PI;
}

/** Peak-to-average speed of each easing: 3 for `cubicInOut`, pi/2 for `sineInOut`. */
const PEAK = { cubicInOut: 3, sineInOut: Math.PI / 2 } as const;

/**
 * The stage's camera with a comfort preset applied. `current` passes every
 * call through untouched, so the default build plays exactly as before.
 */
export class PresetCamera implements CameraPort {
  /** The rig the moments asked for, which is what they read back (a blend or a held master is ours). */
  private asked: string | null = null;

  constructor(
    private readonly inner: RigCamera,
    private readonly spec: () => CameraPresetSpec,
  ) {}

  private get s(): CameraPresetSpec {
    return this.spec();
  }

  /** The rig the camera really goes to for an asked `rig` under this preset. */
  private realRig(rig: string): string {
    const s = this.s;
    if (!CLOSE_RIGS.has(rig) || !this.inner.rigNames.includes('idle')) return rig;
    if (s.holdWide) return 'idle';
    if (s.travel >= 1) return rig;
    const name = `${rig}~${s.name}`;
    const from = this.inner.getRig('idle');
    const to = this.inner.getRig(rig);
    if (!from || !to) return rig;
    const fov = from.fov !== undefined && to.fov !== undefined ? from.fov + (to.fov - from.fov) * s.travel : to.fov;
    this.inner.addRig?.(name, {
      position: lerp3(xyz(from.position), xyz(to.position), s.travel),
      lookAt: lerp3(xyz(from.lookAt), xyz(to.lookAt), s.travel),
      ...(fov !== undefined ? { fov } : {}),
      ...(to.sway !== undefined ? { sway: to.sway } : {}),
    });
    return name;
  }

  /** The rig a cut to `rig` really lands on under this preset (`calm`: `action~calm`); the run-in's planner judges the frame by it. */
  shotRig(rig: string): string {
    return this.realRig(rig);
  }

  moveTo(rig: CameraRigId, ms = 900): Promise<void> {
    const s = this.s;
    this.asked = rig;
    if (s.name === 'current') return this.inner.moveTo(rig, ms);
    const real = this.realRig(rig);
    const here = this.inner.getRig(this.inner.rigName);
    const there = this.inner.getRig(real);
    const turn = here && there ? rigTurnDeg(here, there) : 0;
    if (turn > s.cutAboveDeg || (s.cutAboveDeg === 0 && real !== this.inner.rigName)) {
      this.inner.snapTo(real);
      return this.inner.moveTo(real, ms); // resolves on the same clock, as a move would
    }
    const capped = Number.isFinite(s.maxDegPerSec) ? (PEAK[s.easing] * turn * 1000) / s.maxDegPerSec : 0;
    const dur = ms <= 0 ? 0 : Math.max(ms * s.moveScale, s.minMoveMs, capped);
    return this.inner.moveTo(real, dur, s.easing);
  }

  snapTo(rig: CameraRigId): void {
    this.asked = rig;
    if (this.s.name === 'current') return this.inner.snapTo(rig);
    const real = this.realRig(rig);
    if (real === this.inner.rigName && this.s.holdWide) return; // the master holds: no cut to where it already is
    this.inner.snapTo(real);
  }

  shake(amplitude = 0.1, ms?: number): void {
    const s = this.s;
    const k = amplitude >= HEAVY_SHAKE ? s.heavyShake : s.routineShake;
    if (k > 0) this.inner.shake(amplitude * k, ms);
  }

  punch(fraction = 0.12, ms?: number): Promise<void> {
    return this.inner.punch(fraction * this.s.punch, ms);
  }

  push(fraction = 0.1, ms = 900): Promise<void> {
    if (!this.inner.push) return Promise.resolve();
    return this.inner.push(fraction * this.s.push, ms * this.s.pushSlow);
  }

  release(ms?: number): Promise<void> {
    return this.inner.release ? this.inner.release(ms) : Promise.resolve();
  }

  roll(deg = -4, ms?: number): Promise<void> {
    if (!this.inner.roll) return Promise.resolve();
    return this.inner.roll(deg * this.s.roll, ms);
  }

  frame(rig: string, push: number, subjects: Parameters<NonNullable<CameraPort['frame']>>[2], lens?: boolean): ReturnType<NonNullable<CameraPort['frame']>> {
    return this.inner.frame?.(rig, push, subjects, lens) ?? null;
  }

  fitSlice(rig: string, slice: number, subjects: Parameters<NonNullable<CameraPort['fitSlice']>>[2], top?: number): boolean {
    return this.inner.fitSlice?.(rig, slice, subjects, top) ?? false;
  }

  addRig(name: string, rig: Parameters<NonNullable<CameraPort['addRig']>>[1]): void {
    this.inner.addRig?.(name, rig);
  }

  /** B5: a rig `t` of the way from `from` to `to`, registered under a name of its own (a refreshed one keeps its name). */
  blendRig(from: string, to: string, t: number): string | null {
    const a = this.inner.getRig(from);
    const b = this.inner.getRig(to);
    if (!a || !b || !this.inner.addRig) return null;
    const k = Math.min(1, Math.max(0, t));
    const name = `${from}>${to}~${Math.round(k * 1000)}`;
    const fov = a.fov !== undefined && b.fov !== undefined ? a.fov + (b.fov - a.fov) * k : b.fov;
    this.inner.addRig(name, {
      position: lerp3(xyz(a.position), xyz(b.position), k),
      lookAt: lerp3(xyz(a.lookAt), xyz(b.lookAt), k),
      ...(fov !== undefined ? { fov } : {}),
      ...(b.sway !== undefined ? { sway: b.sway } : {}),
    });
    return name;
  }

  get rigNames(): string[] {
    return this.inner.rigNames;
  }

  get rigName(): string {
    const real = this.inner.rigName;
    if (this.s.name === 'current' || this.asked === null) return real;
    return real === this.asked || real === this.realRigName(this.asked) ? this.asked : real;
  }

  private realRigName(rig: string): string {
    const s = this.s;
    if (!CLOSE_RIGS.has(rig)) return rig;
    if (s.holdWide) return 'idle';
    return s.travel >= 1 ? rig : `${rig}~${s.name}`;
  }
}
