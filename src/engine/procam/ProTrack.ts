/**
 * Keyed tracks of the PRO CAMERA: sampling a real shot's keys, and re-registering a shot onto the figures where they really stand. Pure: no `three`, no DOM.
 *
 * A shot (`data/procam/proShots.ts`) was laid by the real-motion lane for a DESIGN pair: the actor's feet `A`, the target's feet `T`, the actor's height `H`, on the scene's slots. The live
 * fight differs: a hero stands a little off his slot (a lunge, a run-in), the boss floats at its own height, the target may be an ally on the other side. {@link registerKeys} scales the shot
 * about the actor's feet by the ratio of the live height to the design height (`scale`; 1 for the party, whose heights are the design's), moves it to the live feet, and mirrors it about the
 * actor when the target lies on the other side of him than the shot was laid for (the real game mirrors a shot the same way). This is the registration the options book's directed-camera
 * mock-up used; it is OURS (the real game's camera is laid on its own stage), the numbers it moves are the real ones.
 */
import { ease, lerpPose } from './ProMath.ts';
import type { EaseName, KeyRow, Pose, ProShotRow, V3 } from './ProTypes.ts';

/** A key in pose form. `ease`: how the pose is reached from the previous key; `cut` holds the previous key until this one's time. */
export interface Key {
  readonly t: number;
  readonly pose: Pose;
  readonly ease: EaseName | 'cut';
}

const EASE_OF_CODE: readonly [EaseName | 'cut', EaseName | 'cut', EaseName | 'cut'] = ['cut', 'linear', 'cosine'];

export function keysOf(rows: readonly KeyRow[]): Key[] {
  return rows.map((r) => ({
    t: r[0],
    pose: { pos: [r[1], r[2], r[3]] as V3, look: [r[4], r[5], r[6]] as V3, fov: r[7], roll: r[8] },
    ease: EASE_OF_CODE[r[9]],
  }));
}

/** The pose of a key list at `tMs`: before the first key the first key; after the last the last; between two the later key's ease (a cut holds the earlier key). */
export function sampleKeys(keys: readonly Key[], tMs: number): Pose {
  const first = keys[0]!;
  if (keys.length === 1 || tMs <= first.t) return first.pose;
  let k = 0;
  for (let i = 0; i < keys.length; i++) if (keys[i]!.t <= tMs) k = i;
  if (k >= keys.length - 1) return keys[keys.length - 1]!.pose;
  const a = keys[k]!;
  const b = keys[k + 1]!;
  if (b.ease === 'cut') return a.pose;
  const u = (tMs - a.t) / Math.max(1, b.t - a.t);
  return lerpPose(a.pose, b.pose, ease(b.ease, u));
}

/** The total length of a key list, ms. */
export function lengthOf(keys: readonly Key[]): number {
  return keys.length === 0 ? 0 : keys[keys.length - 1]!.t;
}

/** Where the figures really stand: the actor's feet, the target's feet, the actor's painted height. */
export interface LiveSpot {
  readonly actor: V3;
  readonly target: V3 | undefined;
  readonly height: number;
}

/** How a shot is laid onto a live pair. */
export interface Registration {
  readonly scale: number;
  readonly mirror: boolean;
}

/**
 * The registration of `shot` onto `live`. `scaleMode`: 'party' keeps 1 (the party stands at the heights the shot was laid for), 'live' scales by the live height over the design height
 * (a boss), a number is the scale itself.
 */
export function registrationOf(shot: ProShotRow, live: LiveSpot, scaleMode: 'party' | 'live' | number = 'party'): Registration {
  const d = shot.design;
  const scale = typeof scaleMode === 'number' ? scaleMode : scaleMode === 'live' && d.H > 0 ? live.height / d.H : 1;
  let mirror = false;
  if (live.target) {
    const want = Math.sign(live.target[0] - live.actor[0]);
    const was = Math.sign(d.T[0] - d.A[0]);
    mirror = want !== was && Math.abs(live.target[0] - live.actor[0]) > 0.3;
  }
  return { scale, mirror };
}

/** The shot's keys laid on the live figures (see the file note). */
export function registerKeys(shot: ProShotRow, live: LiveSpot, reg: Registration = registrationOf(shot, live)): Key[] {
  const d = shot.design;
  const at = (p: V3): V3 => [
    live.actor[0] + (reg.mirror ? -1 : 1) * reg.scale * (p[0] - d.A[0]),
    live.actor[1] + reg.scale * (p[1] - d.A[1]),
    live.actor[2] + reg.scale * (p[2] - d.A[2]),
  ];
  return keysOf(shot.keys).map((k) => ({
    t: k.t,
    ease: k.ease,
    pose: { pos: at(k.pose.pos), look: at(k.pose.look), fov: k.pose.fov, roll: reg.mirror ? -k.pose.roll : k.pose.roll },
  }));
}

/** Re-time a key list: every key's time times `k` (a shot squeezed to the move it covers, or stretched). */
export function timeScale(keys: readonly Key[], k: number): Key[] {
  return keys.map((key) => ({ ...key, t: key.t * k }));
}

/** Pick one variant of a group by weight with a given uniform draw in [0, 1). */
export function pickWeighted<T extends { readonly weight: number }>(rows: readonly T[], draw: number): T | undefined {
  if (rows.length === 0) return undefined;
  const total = rows.reduce((a, r) => a + r.weight, 0);
  let x = draw * total;
  for (const r of rows) {
    x -= r.weight;
    if (x < 0) return r;
  }
  return rows[rows.length - 1];
}
