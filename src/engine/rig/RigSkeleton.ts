/**
 * The 2D bone maths of a rig, on typed arrays (the prototype's `Rig.ts`, with the three.js parts taken out). Pure: no `three`, no DOM.
 *
 * A pose is a flat channel array, five numbers a bone: `rot` (radians, clockwise on screen), `ox`, `oy` (painting px added to the bone's bind offset from its
 * parent joint), `sx`, `sy` (scale about the joint). `solve` turns a pose into one world matrix a bone, `skin` moves the bind-pose vertices of a part through them
 * (linear blend, two influences a vertex). Everything is in painting px (y down); the mesh layer maps to the plane.
 */
import type { RigData, RigPartData } from './RigData.ts';

/** Numbers a bone has in a pose. */
export const CH = 5;
export const C_ROT = 0;
export const C_OX = 1;
export const C_OY = 2;
export const C_SX = 3;
export const C_SY = 4;

export const DEG = Math.PI / 180;

/** A pose channel array at bind: every bone at rest. */
export function bindPose(boneCount: number, into?: Float64Array): Float64Array {
  const out = into ?? new Float64Array(boneCount * CH);
  for (let b = 0; b < boneCount; b++) {
    out[b * CH + C_ROT] = 0;
    out[b * CH + C_OX] = 0;
    out[b * CH + C_OY] = 0;
    out[b * CH + C_SX] = 1;
    out[b * CH + C_SY] = 1;
  }
  return out;
}

export class RigSkeleton {
  readonly count: number;
  /** World matrix a bone `[a b c d e f]`: x' = a x + c y + e, y' = b x + d y + f. */
  readonly m: Float64Array;
  /** Skin matrix (world after the bind inverse), the same layout. */
  readonly k: Float64Array;
  /** The pose last solved. */
  readonly pose: Float64Array;

  constructor(readonly data: RigData) {
    this.count = data.bones.length;
    this.m = new Float64Array(this.count * 6);
    this.k = new Float64Array(this.count * 6);
    this.pose = bindPose(this.count);
    this.solve(this.pose);
  }

  /** World and skin matrices from `pose` (parents come before children). The pose is copied into {@link RigSkeleton.pose}. */
  solve(pose: Float64Array): void {
    if (pose !== this.pose) this.pose.set(pose);
    const { m, k, data } = this;
    for (let i = 0; i < this.count; i++) {
      const b = data.bones[i]!;
      const o = i * CH;
      const rot = pose[o + C_ROT]!;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const sx = pose[o + C_SX]!;
      const sy = pose[o + C_SY]!;
      const la = c * sx;
      const lb = s * sx;
      const lc = -s * sy;
      const ld = c * sy;
      const le = b.bx + pose[o + C_OX]!;
      const lf = b.by + pose[o + C_OY]!;
      const q = i * 6;
      if (b.parent >= 0) {
        const p = b.parent * 6;
        const pa = m[p]!, pb = m[p + 1]!, pc = m[p + 2]!, pd = m[p + 3]!;
        m[q] = pa * la + pc * lb;
        m[q + 1] = pb * la + pd * lb;
        m[q + 2] = pa * lc + pc * ld;
        m[q + 3] = pb * lc + pd * ld;
        m[q + 4] = pa * le + pc * lf + m[p + 4]!;
        m[q + 5] = pb * le + pd * lf + m[p + 5]!;
      } else {
        m[q] = la; m[q + 1] = lb; m[q + 2] = lc; m[q + 3] = ld; m[q + 4] = le; m[q + 5] = lf;
      }
      k[q] = m[q]!;
      k[q + 1] = m[q + 1]!;
      k[q + 2] = m[q + 2]!;
      k[q + 3] = m[q + 3]!;
      k[q + 4] = m[q + 4]! - (m[q]! * b.x + m[q + 2]! * b.y);
      k[q + 5] = m[q + 5]! - (m[q + 1]! * b.x + m[q + 3]! * b.y);
    }
  }

  /**
   * Skin one part into `out` as normalised plane coordinates, three floats a vertex (x right, y up, z 0), the plane being the whole master painting centred on the
   * origin and one unit wide and tall: x = px / W - 0.5, y = 0.5 - py / H. This is the idle plane's own space, so the mesh just sits under a group that carries the
   * plane's scale and place.
   */
  skin(part: RigPartData, out: Float32Array): void {
    const { k } = this;
    const { verts, boneA, boneB, wA, wB } = part;
    const iw = 1 / this.data.image.w;
    const ih = 1 / this.data.image.h;
    const n = verts.length / 2;
    for (let i = 0; i < n; i++) {
      const x = verts[i * 2]!;
      const y = verts[i * 2 + 1]!;
      const a = boneA[i]! * 6;
      const wa = wA[i]!;
      let X = wa * (k[a]! * x + k[a + 2]! * y + k[a + 4]!);
      let Y = wa * (k[a + 1]! * x + k[a + 3]! * y + k[a + 5]!);
      const bi = boneB[i]!;
      if (bi >= 0) {
        const b = bi * 6;
        const wb = wB[i]!;
        X += wb * (k[b]! * x + k[b + 2]! * y + k[b + 4]!);
        Y += wb * (k[b + 1]! * x + k[b + 3]! * y + k[b + 5]!);
      }
      out[i * 3] = X * iw - 0.5;
      out[i * 3 + 1] = 0.5 - Y * ih;
      out[i * 3 + 2] = 0;
    }
  }

  /** A landmark now, in painting px (after skinning). Null for an unknown name. */
  landmark(name: string, out: { x: number; y: number } = { x: 0, y: 0 }): { x: number; y: number } | null {
    const l = this.data.landmarks.get(name);
    if (!l) return null;
    const q = l.bone * 6;
    const k = this.k;
    out.x = k[q]! * l.x + k[q + 2]! * l.y + k[q + 4]!;
    out.y = k[q + 1]! * l.x + k[q + 3]! * l.y + k[q + 5]!;
    return out;
  }

  /** A bone's absolute angle now (radians, clockwise on screen): the sum of the rotations down to the root. */
  absAngle(bone: number): number {
    const q = bone * 6;
    return Math.atan2(this.m[q + 1]!, this.m[q]!);
  }
}
