/**
 * **Drawing a posed rig in colour with no browser** (the animation prototype's authoring tools: `anim-preview.mjs`, `anim-sim.mjs`). The rig's own maths (`rig-pose.mjs`, the gate's) skins every
 * part; the part PNGs are painted with their texture colours, back to front. Also the carry's skeleton adapter (world matrices from the skin matrices' linear part and the joints).
 */
import { join } from 'node:path';
import sharp from 'sharp';
import { solve, skinPart, through } from '../rig-pose.mjs';
import { PartBend } from '../../../src/engine/rig/anim/AnimBend.ts';

/** A channel array as the gate's pose; with `nb` (the rig's bone count) and a longer array, the pseudo-bone after the bones carries the knee's bend (pass 3). */
export const toGatePose = (ch, nb) => ({ bones: Float64Array.from(ch), root: [0, 0, 0], bend: nb !== undefined && ch.length > nb * 5 ? ch[nb * 5] : 0 });

/** The knees of a rig (`rt.bendSpec`, set by the caller): a PartBend a part named in the spec, made once. */
export function bendsOf(rt) {
  if (!rt.bendSpec) return null;
  if (!rt.bends) {
    const c = rt.bones.findIndex((b) => b.name === rt.bendSpec.carrier);
    rt.bends = new Map(rt.parts.filter((p) => rt.bendSpec.parts.includes(p.name) && c >= 0).map((p) => [p.name, new PartBend(p.verts, rt.bendSpec, c)]));
  }
  return rt.bends;
}

/** Skin `part` into `out` (px pairs) and bend it by `pose.bend` where the rig has a knee for it. */
export function skinBent(rt, part, k, pose, out) {
  skinPart(part, k, out);
  const pb = pose.bend ? bendsOf(rt)?.get(part.name) : undefined;
  if (!pb) return;
  pb.prepare(k, pose.bend);
  if (!pb.active) return;
  const o = { x: 0, y: 0 };
  for (let i = 0; i < out.length / 2; i++) { pb.at(i, out[i * 2], out[i * 2 + 1], o); out[i * 2] = o.x; out[i * 2 + 1] = o.y; }
}

/** The rig-pose maths as the carry's skeleton: world matrices from the skin matrices' linear part and the joints. */
export function carrySkeleton(rt) {
  const m = new Float64Array(rt.bones.length * 6);
  let k = null;
  return {
    m,
    solve(pose) {
      const r = solve(rt, toGatePose(pose));
      k = r.k;
      for (let i = 0; i < rt.bones.length; i++) { m[i * 6] = k[i * 6]; m[i * 6 + 1] = k[i * 6 + 1]; m[i * 6 + 2] = k[i * 6 + 2]; m[i * 6 + 3] = k[i * 6 + 3]; m[i * 6 + 4] = r.joints[i * 2]; m[i * 6 + 5] = r.joints[i * 2 + 1]; }
    },
    landmark(name, out = { x: 0, y: 0 }) {
      const l = rt.landmarks[name];
      if (!l || !k) return null;
      const [x, y] = through(k, l.bone, l.x, l.y);
      out.x = x; out.y = y;
      return out;
    },
  };
}

export async function loadTextures(rt, dir) {
  await Promise.all(rt.parts.map(async (p) => {
    const { data, info } = await sharp(join(dir, p.png)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    p.tex = { data, w: info.width, h: info.height };
  }));
}

function sample(tex, tx, ty, out) {
  const x = Math.min(tex.w - 1, Math.max(0, Math.round(tx - 0.5)));
  const y = Math.min(tex.h - 1, Math.max(0, Math.round(ty - 0.5)));
  const o = (y * tex.w + x) * 4;
  out[0] = tex.data[o]; out[1] = tex.data[o + 1]; out[2] = tex.data[o + 2]; out[3] = tex.data[o + 3] / 255;
}

/** One pose as an RGBA buffer (W x H, straight alpha over transparent). */
export function render(rt, pose, frame) {
  const { W, H, sx, sy, ox, oy } = frame;
  const acc = new Float32Array(W * H * 4); // premultiplied
  const { k } = solve(rt, pose);
  const px = [0, 0, 0, 0];
  for (const part of rt.parts) {
    if (part.hidden) continue;
    const n = part.verts.length / 2;
    const posed = new Float64Array(n * 2);
    skinBent(rt, part, k, pose, posed);
    const X = new Float64Array(n), Y = new Float64Array(n), U = new Float64Array(n), V = new Float64Array(n);
    for (let i = 0; i < n; i++) { X[i] = posed[i * 2] * sx + ox; Y[i] = posed[i * 2 + 1] * sy + oy; U[i] = part.tuv[i * 2] * part.tex.w; V[i] = part.tuv[i * 2 + 1] * part.tex.h; }
    const layer = new Float32Array(W * H * 4);
    for (let t = 0; t < part.tris.length; t += 3) {
      const a = part.tris[t], b = part.tris[t + 1], c = part.tris[t + 2];
      const den = (Y[b] - Y[c]) * (X[a] - X[c]) + (X[c] - X[b]) * (Y[a] - Y[c]);
      if (Math.abs(den) < 1e-9) continue;
      const minX = Math.max(0, Math.floor(Math.min(X[a], X[b], X[c]) - 0.5)), maxX = Math.min(W - 1, Math.ceil(Math.max(X[a], X[b], X[c]) + 0.5));
      const minY = Math.max(0, Math.floor(Math.min(Y[a], Y[b], Y[c]) - 0.5)), maxY = Math.min(H - 1, Math.ceil(Math.max(Y[a], Y[b], Y[c]) + 0.5));
      const inv = 1 / den;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const qx = x + 0.5, qy = y + 0.5;
        const l0 = ((Y[b] - Y[c]) * (qx - X[c]) + (X[c] - X[b]) * (qy - Y[c])) * inv;
        const l1 = ((Y[c] - Y[a]) * (qx - X[c]) + (X[a] - X[c]) * (qy - Y[c])) * inv;
        const l2 = 1 - l0 - l1;
        if (l0 < -0.02 || l1 < -0.02 || l2 < -0.02) continue;
        sample(part.tex, l0 * U[a] + l1 * U[b] + l2 * U[c], l0 * V[a] + l1 * V[b] + l2 * V[c], px);
        const o = (y * W + x) * 4;
        if (px[3] > layer[o + 3]) { layer[o] = px[0]; layer[o + 1] = px[1]; layer[o + 2] = px[2]; layer[o + 3] = px[3]; }
      }
    }
    for (let i = 0; i < W * H; i++) {
      const a = layer[i * 4 + 3];
      if (a <= 0) continue;
      const o = i * 4;
      const ia = 1 - a;
      acc[o] = layer[o] * a + acc[o] * ia; acc[o + 1] = layer[o + 1] * a + acc[o + 1] * ia; acc[o + 2] = layer[o + 2] * a + acc[o + 2] * ia; acc[o + 3] = a + acc[o + 3] * ia;
    }
  }
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const a = acc[i * 4 + 3];
    out[i * 4 + 3] = Math.round(a * 255);
    if (a > 0) for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.min(255, Math.round(acc[i * 4 + c] / a * 1)); // acc holds colour weighted by coverage; divide back
  }
  return out;
}

