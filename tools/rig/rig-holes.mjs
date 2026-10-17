/**
 * **Holes at the joints** (the rig program; both games). Parts that are cut from one painting and bent apart can open a gap where they meet: the elbow of two rigid
 * tubes shows a wedge of background when it bends, worst half way (a tube folded flat shows none; the same tube at 90 degrees shows the most). The gate looks for it
 * at every joint, in every key and at 25, 50 and 75 percent between every two keys, because the game blends between any two.
 *
 * The test is local to each joint: in the rest pose the disc of radius `0.75 * depth` around the joint is solid (depth = how far the opaque body reaches from the joint,
 * read from the rest raster); in any other pose the same disc around the POSED joint must still be solid, to within `HOLE_PX` transparent pixels (a few, at the gate's raster,
 * where a figure is about 1100 px tall). A joint the rest body does not enclose (a spear's pivot, a tail tip: depth under `MIN_DEPTH`) is not a joint of the body and is skipped.
 */
import { blendPose, keyPose, restPose } from './rig-pose.mjs';
import { rasterize } from './rig-raster.mjs';

/** Transparent pixels a joint's disc may hold before it is a hole ("a few pixels"). */
export const HOLE_PX = 4;
/** A pixel under this alpha counts as transparent when looking for a hole (a seam of two half-covered pixels is not a hole). */
export const HOLE_ALPHA = 0.3;
/** The share of the rest depth the disc covers. */
export const DISC = 0.75;
/** A joint whose rest depth is under this many raster px is not a joint of the body. */
export const MIN_DEPTH = 6;
/** The blends the game can ask for between two keys. */
export const BLEND_STEPS = Object.freeze([0.25, 0.5, 0.75]);

/** The joints worth watching: [{bone, name, x, y (raster px at rest), depth, r}]. */
export function bodyJoints(ctx, restAlpha) {
  const { rt, frame } = ctx;
  const { W, H } = frame;
  const out = [];
  const maxR = Math.min(80, Math.round(H * 0.06));
  rt.bones.forEach((b, i) => {
    if (b.parent < 0) return;
    const jx = b.x * frame.sx + frame.ox;
    const jy = b.y * frame.sy + frame.oy;
    let depth = 0;
    for (let r = 1; r <= maxR; r++) {
      let clear = true;
      for (let a = 0; a < 48 && clear; a++) {
        const x = Math.round(jx + r * Math.cos((a / 48) * 2 * Math.PI));
        const y = Math.round(jy + r * Math.sin((a / 48) * 2 * Math.PI));
        if (x < 0 || y < 0 || x >= W || y >= H || restAlpha[y * W + x] < 128) clear = false;
      }
      if (!clear) break;
      depth = r;
    }
    if (depth >= MIN_DEPTH) out.push({ bone: i, name: b.name, depth, r: Math.max(2, Math.floor(depth * DISC)) });
  });
  return out;
}

/** Transparent pixels inside each joint's disc, around its POSED place. @returns {Array<{name: string, count: number}>} the joints with more than {@link HOLE_PX}. */
export function holesAt(ctx, alpha, joints, posedJoints) {
  const { W, H } = ctx.frame;
  const cut = Math.round(HOLE_ALPHA * 255);
  const bad = [];
  for (const j of joints) {
    const cx = posedJoints[j.bone * 2] * ctx.frame.sx + ctx.frame.ox;
    const cy = posedJoints[j.bone * 2 + 1] * ctx.frame.sy + ctx.frame.oy;
    let count = 0;
    const r2 = j.r * j.r;
    for (let y = Math.max(0, Math.floor(cy - j.r)); y <= Math.min(H - 1, Math.ceil(cy + j.r)); y++) {
      for (let x = Math.max(0, Math.floor(cx - j.r)); x <= Math.min(W - 1, Math.ceil(cx + j.r)); x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r2 && alpha[y * W + x] < cut) count++;
      }
    }
    if (count > HOLE_PX) bad.push({ name: j.name, count });
  }
  return bad;
}

/**
 * Scan every key and every blend between two keys (the rest counts as a key named `idle` when the rig has none).
 * @returns {{keys: Array<{pose: string, holes: object[]}>, blends: Array<{from: string, to: string, t: number, holes: object[]}>, rendered: number, joints: string[]}}
 */
export function scanHoles(ctx, { blends = true } = {}) {
  const { rt } = ctx;
  const rest = restPose(rt);
  const restRaster = rasterize(rt, rest, ctx.frame);
  const joints = bodyJoints(ctx, restRaster.alpha);
  const poses = new Map();
  if (!rt.keys.idle) poses.set('idle', rest);
  for (const [name, key] of Object.entries(rt.keys)) poses.set(name, keyPose(rt, key));
  const out = { keys: [], blends: [], rendered: 0, joints: joints.map((j) => j.name) };
  for (const [name, pose] of poses) {
    const { alpha, joints: pj } = rasterize(rt, pose, ctx.frame);
    out.rendered++;
    out.keys.push({ pose: name, holes: holesAt(ctx, alpha, joints, pj) });
  }
  if (!blends) return out;
  const names = [...poses.keys()];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      for (const t of BLEND_STEPS) {
        const { alpha, joints: pj } = rasterize(rt, blendPose(poses.get(names[i]), poses.get(names[j]), t), ctx.frame);
        out.rendered++;
        out.blends.push({ from: names[i], to: names[j], t, holes: holesAt(ctx, alpha, joints, pj) });
      }
    }
  }
  return out;
}
