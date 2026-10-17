/**
 * **Bend a rig: keys, blends, bones, skin** (the rig program; both games). The maths is the runtime's (`src/engine/RigActor.ts` / `Rig.ts` of the prototype): a bone's
 * pose is a rotation `rot` (clockwise on screen, y down), a scale `sx, sy` and an offset `dx, dy`, applied about the bone's own bind joint after its parent's; skinning
 * is linear blend, at most two bones a vertex. A pose is a flat `Float64Array` of 5 numbers a bone `[rot, dx, dy, sx, sy]` plus the root's `[dx, dy, rot]`.
 * Blending two keys is a straight lerp of every number (the rotation too: the long way round if the keys are far apart, which is what the runtime does).
 */
import { CHANNELS } from './rig-format.mjs';

export const POSE_STRIDE = 5;

/** The rest pose of `rt`: every bone at its bind. */
export function restPose(rt) {
  const bones = new Float64Array(rt.bones.length * POSE_STRIDE);
  for (let i = 0; i < rt.bones.length; i++) { bones[i * POSE_STRIDE + 3] = 1; bones[i * POSE_STRIDE + 4] = 1; }
  return { bones, root: [0, 0, 0] };
}

/** The pose a key describes (`rt.keys[name]`, or any object of the same shape). */
export function keyPose(rt, key) {
  const p = restPose(rt);
  const idx = new Map(rt.bones.map((b, i) => [b.name, i]));
  for (const [bn, ch] of Object.entries(key?.bones ?? {})) {
    const i = idx.get(bn);
    if (i === undefined) continue;
    const c = { ...CHANNELS, ...ch };
    p.bones.set([c.rot, c.dx, c.dy, c.sx, c.sy], i * POSE_STRIDE);
  }
  const r = key?.root ?? {};
  p.root = [r.dx ?? 0, r.dy ?? 0, r.rot ?? 0];
  return p;
}

/** `a` to `b` at `t` (0 to 1). */
export function blendPose(a, b, t) {
  const bones = new Float64Array(a.bones.length);
  for (let i = 0; i < bones.length; i++) bones[i] = a.bones[i] + (b.bones[i] - a.bones[i]) * t;
  return { bones, root: a.root.map((v, i) => v + (b.root[i] - v) * t) };
}

/**
 * World and skin matrices for a pose. `k` (6 numbers a bone) maps a BIND point to its posed place: `x' = k0 x + k2 y + k4`, `y' = k1 x + k3 y + k5`.
 * `joints` (2 a bone) are the posed joint positions (the world matrices' translation).
 */
export function solve(rt, pose) {
  const nb = rt.bones.length;
  const m = new Float64Array(nb * 6);
  const k = new Float64Array(nb * 6);
  for (let i = 0; i < nb; i++) {
    const b = rt.bones[i];
    let rot = pose.bones[i * POSE_STRIDE];
    let ox = pose.bones[i * POSE_STRIDE + 1];
    let oy = pose.bones[i * POSE_STRIDE + 2];
    const sx = pose.bones[i * POSE_STRIDE + 3];
    const sy = pose.bones[i * POSE_STRIDE + 4];
    if (b.parent < 0) { ox += pose.root[0]; oy += pose.root[1]; rot += pose.root[2]; }
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const la = c * sx, lb = s * sx, lc = -s * sy, ld = c * sy;
    const le = b.bx + ox, lf = b.by + oy;
    const o = i * 6;
    if (b.parent >= 0) {
      const p = b.parent * 6;
      m[o] = m[p] * la + m[p + 2] * lb; m[o + 1] = m[p + 1] * la + m[p + 3] * lb;
      m[o + 2] = m[p] * lc + m[p + 2] * ld; m[o + 3] = m[p + 1] * lc + m[p + 3] * ld;
      m[o + 4] = m[p] * le + m[p + 2] * lf + m[p + 4]; m[o + 5] = m[p + 1] * le + m[p + 3] * lf + m[p + 5];
    } else {
      m[o] = la; m[o + 1] = lb; m[o + 2] = lc; m[o + 3] = ld; m[o + 4] = le; m[o + 5] = lf;
    }
    k[o] = m[o]; k[o + 1] = m[o + 1]; k[o + 2] = m[o + 2]; k[o + 3] = m[o + 3];
    k[o + 4] = m[o + 4] - (m[o] * b.x + m[o + 2] * b.y);
    k[o + 5] = m[o + 5] - (m[o + 1] * b.x + m[o + 3] * b.y);
  }
  const joints = new Float64Array(nb * 2);
  for (let i = 0; i < nb; i++) { joints[i * 2] = m[i * 6 + 4]; joints[i * 2 + 1] = m[i * 6 + 5]; }
  return { k, joints };
}

/** A bind point through one bone's skin matrix. @returns {[number, number]} */
export function through(k, bone, x, y) {
  const o = bone * 6;
  return [k[o] * x + k[o + 2] * y + k[o + 4], k[o + 1] * x + k[o + 3] * y + k[o + 5]];
}

/** Skin one part's vertices: `out` (2 a vertex) gets their posed image positions. */
export function skinPart(part, k, out) {
  const n = part.verts.length / 2;
  for (let i = 0; i < n; i++) {
    const x = part.verts[i * 2];
    const y = part.verts[i * 2 + 1];
    const o0 = part.b[i * 2] * 6;
    const w0 = part.w[i * 2];
    let X = w0 * (k[o0] * x + k[o0 + 2] * y + k[o0 + 4]);
    let Y = w0 * (k[o0 + 1] * x + k[o0 + 3] * y + k[o0 + 5]);
    const j1 = part.b[i * 2 + 1];
    if (j1 >= 0) {
      const o1 = j1 * 6;
      const w1 = part.w[i * 2 + 1];
      X += w1 * (k[o1] * x + k[o1 + 2] * y + k[o1 + 4]);
      Y += w1 * (k[o1 + 1] * x + k[o1 + 3] * y + k[o1 + 5]);
    }
    out[i * 2] = X;
    out[i * 2 + 1] = Y;
  }
}

/** The scale a bone's skin matrix applies to lengths (the square root of its determinant). */
export function boneScale(k, bone) {
  const o = bone * 6;
  return Math.sqrt(Math.abs(k[o] * k[o + 3] - k[o + 1] * k[o + 2]));
}
