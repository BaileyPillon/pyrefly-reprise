/**
 * **Where a clip's action happens** (the hidden 3D Bahamut chapter, FFX-2 only): a model's attack clip is a whole quick-draw (7 seconds for the girls, with the draw, the aim, the shot, the holstering), and a battle's attack
 * lasts about a second. To play the right second of it, the clip is looked at once, when the model is built: how much its bones are turning at each moment (its **motion energy**), and from that where the strike is (the
 * moment the bones turn fastest, after the wind-up) and where the clip stops doing anything (so a victory's idle tail is cut). Pure: numbers in, numbers out, no `three`, so `tests/unit/yrp3d/clips.test.ts` runs it on made-up
 * tracks and the real file's analysis was checked offline.
 *
 * Only rotations are read (a bone turning is the action; a translation is mostly the root, and root motion is removed from these clips). Each track is `times` (seconds) and `values` (a unit quaternion per time, 4 numbers),
 * the layout of three's `QuaternionKeyframeTrack` (`track.times`, `track.values`).
 */

/** One bone's rotation over time. */
export interface RotationTrack {
  readonly times: ArrayLike<number>;
  readonly values: ArrayLike<number>;
}

/** The step the energy is sampled at (seconds): 30 samples a second is finer than any of these clips' keys. */
export const ENERGY_STEP = 1 / 30;

/** The unit quaternion of `track` at time `t` (spherical interpolation between the two keys around it, held before the first and after the last). */
export function quatAt(track: RotationTrack, t: number, out: [number, number, number, number] = [0, 0, 0, 1]): [number, number, number, number] {
  const n = track.times.length;
  if (n === 0) return out;
  const v = track.values;
  const read = (i: number): [number, number, number, number] => [v[i * 4]!, v[i * 4 + 1]!, v[i * 4 + 2]!, v[i * 4 + 3]!];
  if (t <= track.times[0]! || n === 1) {
    const q = read(0);
    out[0] = q[0]; out[1] = q[1]; out[2] = q[2]; out[3] = q[3];
    return out;
  }
  if (t >= track.times[n - 1]!) {
    const q = read(n - 1);
    out[0] = q[0]; out[1] = q[1]; out[2] = q[2]; out[3] = q[3];
    return out;
  }
  let i = 0;
  while (i < n - 2 && track.times[i + 1]! <= t) i++;
  const t0 = track.times[i]!;
  const k = (t - t0) / Math.max(1e-9, track.times[i + 1]! - t0);
  const a = read(i);
  let b = read(i + 1);
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (dot < 0) {
    b = [-b[0], -b[1], -b[2], -b[3]]; // the short way round
    dot = -dot;
  }
  let wa = 1 - k;
  let wb = k;
  if (dot < 0.9995) {
    const theta = Math.acos(Math.min(1, dot));
    const s = Math.sin(theta);
    wa = Math.sin((1 - k) * theta) / s;
    wb = Math.sin(k * theta) / s;
  }
  out[0] = wa * a[0] + wb * b[0];
  out[1] = wa * a[1] + wb * b[1];
  out[2] = wa * a[2] + wb * b[2];
  out[3] = wa * a[3] + wb * b[3];
  return out;
}

/** The angle between two unit quaternions, radians (0 to pi). */
export function angleBetween(a: readonly number[], b: readonly number[]): number {
  const dot = Math.abs(a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]! + a[3]! * b[3]!);
  return 2 * Math.acos(Math.min(1, dot));
}

/**
 * How fast the bones are turning, summed over every track, at each `step` of a clip `duration` seconds long (radians a second; entry `i` is the span ending at `i * step`; entry 0 is 0). A clip with no tracks is all zeros.
 */
export function motionEnergy(tracks: readonly RotationTrack[], duration: number, step: number = ENERGY_STEP): Float64Array {
  const n = Math.max(1, Math.floor(duration / step + 1e-9) + 1);
  const energy = new Float64Array(n);
  const prev = tracks.map((t) => quatAt(t, 0));
  const now: [number, number, number, number] = [0, 0, 0, 1];
  for (let i = 1; i < n; i++) {
    let sum = 0;
    tracks.forEach((t, k) => {
      quatAt(t, i * step, now);
      sum += angleBetween(prev[k]!, now) / step;
      prev[k]![0] = now[0]; prev[k]![1] = now[1]; prev[k]![2] = now[2]; prev[k]![3] = now[3];
    });
    energy[i] = sum;
  }
  return energy;
}

/** `energy` smoothed with a box of `width` seconds (the peak of a burst, not one noisy step). */
export function smooth(energy: Float64Array, width: number, step: number = ENERGY_STEP): Float64Array {
  const half = Math.max(0, Math.round(width / step / 2));
  const out = new Float64Array(energy.length);
  for (let i = 0; i < energy.length; i++) {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(energy.length - 1, i + half); j++) {
      sum += energy[j]!;
      n++;
    }
    out[i] = sum / n;
  }
  return out;
}

/** The moment of the strike: where the smoothed energy peaks, looking only after `skip` seconds (the wind-up's own burst is not the strike). Seconds; 0 for a clip with no motion. */
export function strikeTime(energy: Float64Array, skip = 0.3, step: number = ENERGY_STEP): number {
  const s = smooth(energy, 0.12, step);
  let best = 0;
  let at = 0;
  for (let i = Math.min(s.length - 1, Math.ceil(skip / step)); i < s.length; i++) {
    if (s[i]! > best) {
      best = s[i]!;
      at = i;
    }
  }
  return best > 0 ? at * step : 0;
}

/** Where the clip stops doing anything: the last moment the smoothed energy is above `share` of its peak, seconds (the clip's whole length for a clip that never settles; 0 for one with no motion). */
export function activeEnd(energy: Float64Array, share = 0.12, step: number = ENERGY_STEP): number {
  const s = smooth(energy, 0.12, step);
  const peak = Math.max(...s);
  if (!(peak > 0)) return 0;
  for (let i = s.length - 1; i >= 0; i--) if (s[i]! > share * peak) return i * step;
  return 0;
}

/** The part of a clip a role plays: from `start` to `end` seconds, with `shot` (the strike) inside it for a strike. */
export interface ClipWindow {
  readonly start: number;
  readonly end: number;
  readonly shot?: number;
}

/** The seconds before the strike an attack starts playing (the aim stance, which the crossfade from the idle settles into) and after it the follow-through lasts. */
export const STRIKE_PRE = 0.35;
export const STRIKE_POST = 0.75;
/** The seconds a one-shot plays on past its last motion, so it comes to rest before the fade back. */
export const SETTLE = 0.2;

/** The window of an attack clip: `STRIKE_PRE` before the strike to `STRIKE_POST` after it, inside the clip. */
export function attackWindow(energy: Float64Array, duration: number): ClipWindow {
  const shot = strikeTime(energy);
  const start = Math.max(0, Math.min(shot - STRIKE_PRE, duration));
  return { start, end: Math.min(duration, Math.max(start + 0.4, shot + STRIKE_POST)), shot: Math.max(shot, start) };
}

/** The window of a one-shot played whole but for its idle tail: from the start to the end of its motion and a moment to settle. */
export function wholeWindow(energy: Float64Array, duration: number): ClipWindow {
  const end = activeEnd(energy);
  return { start: 0, end: end > 0 ? Math.min(duration, end + SETTLE) : duration };
}
