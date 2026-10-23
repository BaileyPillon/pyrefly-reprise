/**
 * Small pure maths of the PRO CAMERA (`?camera=pro`): vectors as plain triples, the easings, pose blending. No `three`, no DOM, no state.
 */
import type { EaseName, Pose, V3 } from './ProTypes.ts';

export const DEG = Math.PI / 180;

export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const len3 = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
export const dist3 = (a: V3, b: V3): number => len3(sub3(a, b));
export const dot3 = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
export const lerp3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const clamp01 = (v: number): number => clamp(v, 0, 1);
export const norm3 = (a: V3): V3 => {
  const l = len3(a);
  return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, -1];
};

const EASES: Readonly<Record<EaseName, (u: number) => number>> = {
  linear: (u) => u,
  cosine: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  cubic: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  outCubic: (u) => 1 - Math.pow(1 - u, 3),
  inCubic: (u) => u * u * u,
  outQuad: (u) => 1 - (1 - u) * (1 - u),
  outSine: (u) => Math.sin((u * Math.PI) / 2),
  inOutSine: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
};

/** The eased fraction of `u` (clamped to 0..1). */
export function ease(name: EaseName, u: number): number {
  return EASES[name](clamp01(u));
}

export function lerpPose(a: Pose, b: Pose, u: number): Pose {
  return { pos: lerp3(a.pos, b.pos, u), look: lerp3(a.look, b.look, u), fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll, b.roll, u) };
}

/** The same pose with the eye pushed along its own view by `k` of the eye-to-look distance (a dolly; the lens does not change). Negative `k` backs out. */
export function dollyPose(p: Pose, k: number): Pose {
  return { ...p, pos: lerp3(p.pos, p.look, k) };
}

/** `p` moved so its eye stands `d` metres from the look-at on the same line of sight (keeps the aim). */
export function eyeDistance(p: Pose, d: number): Pose {
  const dir = norm3(sub3(p.pos, p.look));
  return { ...p, pos: add3(p.look, mul3(dir, d)) };
}

/** Turn `p` about the vertical axis through `pivot` by `yawDeg` (positive = the eye swings toward +x), moving the eye only (the look-at stays). */
export function yawEyeAbout(p: Pose, pivot: V3, yawDeg: number): Pose {
  const a = yawDeg * DEG;
  const dx = p.pos[0] - pivot[0];
  const dz = p.pos[2] - pivot[2];
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { ...p, pos: [pivot[0] + dx * c + dz * s, p.pos[1], pivot[2] - dx * s + dz * c] };
}

/** Exponential approach: the fraction of the error removed in `dt` seconds at `rate` per second (frame-rate independent). */
export function dampK(rate: number, dt: number): number {
  return 1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt));
}

export const samePose = (a: Pose, b: Pose, eps = 1e-6): boolean =>
  dist3(a.pos, b.pos) < eps && dist3(a.look, b.look) < eps && Math.abs(a.fov - b.fov) < eps && Math.abs(a.roll - b.roll) < eps;
