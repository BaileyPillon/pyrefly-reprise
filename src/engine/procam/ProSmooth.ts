/**
 * Critically damped smoothing for the PRO CAMERA's follower (pure). A glide that starts and ends at rest, whatever the frame rate, in place of an exponential's abrupt first frame.
 * The same idea as the real FFX-2 auto camera's exponential follower (a fixed fraction of the error per 1/30 s step), but second order, so the camera has no velocity jump at the start of a
 * glide: "eased glides" (Bailey, 2026-10-22). OURS; the real follower's gains are in `data/procam/proShots.ts` (`PRO_AUTO_CAMERA.follower`) and set the times below.
 */
import type { V3 } from './ProTypes.ts';

/** One smoothed number: its value and its velocity. */
export interface Damped {
  value: number;
  velocity: number;
}

/**
 * Move `s` toward `target` over about `smoothTime` seconds (the time of the glide's first 63 percent), never faster than `maxSpeed` units a second. Frame-rate independent (the closed form of a
 * critically damped spring, Unity's `SmoothDamp`).
 */
export function smoothDamp(s: Damped, target: number, smoothTime: number, dt: number, maxSpeed = Infinity): number {
  const st = Math.max(0.0001, smoothTime);
  const omega = 2 / st;
  const x = omega * Math.max(0, dt);
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = s.value - target;
  const maxChange = maxSpeed * st;
  change = Math.max(-maxChange, Math.min(maxChange, change));
  const clamped = s.value - change;
  const temp = (s.velocity + omega * change) * dt;
  s.velocity = (s.velocity - omega * temp) * exp;
  let out = clamped + (change + temp) * exp;
  if (target - s.value > 0 === out > target) {
    out = target;
    s.velocity = dt > 0 ? (out - target) / dt : 0;
  }
  s.value = out;
  return out;
}

/** A smoothed point. */
export class DampedV3 {
  readonly x: Damped;
  readonly y: Damped;
  readonly z: Damped;

  constructor(v: V3) {
    this.x = { value: v[0], velocity: 0 };
    this.y = { value: v[1], velocity: 0 };
    this.z = { value: v[2], velocity: 0 };
  }

  get value(): V3 {
    return [this.x.value, this.y.value, this.z.value];
  }

  /** Jump to `v` at rest. */
  set(v: V3): void {
    this.x.value = v[0];
    this.y.value = v[1];
    this.z.value = v[2];
    this.x.velocity = this.y.velocity = this.z.velocity = 0;
  }

  step(target: V3, smoothTime: number, dt: number, maxSpeed = Infinity): V3 {
    smoothDamp(this.x, target[0], smoothTime, dt, maxSpeed);
    smoothDamp(this.y, target[1], smoothTime, dt, maxSpeed);
    smoothDamp(this.z, target[2], smoothTime, dt, maxSpeed);
    return this.value;
  }

  /** The speed now, units a second. */
  get speed(): number {
    return Math.hypot(this.x.velocity, this.y.velocity, this.z.velocity);
  }
}
