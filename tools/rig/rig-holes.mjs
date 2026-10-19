/**
 * **Holes at the joints** (the rig program; both games). Parts that are cut from one painting and bent apart can open a gap where they meet: the elbow of two rigid
 * tubes shows a wedge of background when it bends, worst half way (a tube folded flat shows none; the same tube at 90 degrees shows the most). The gate looks for it
 * at every joint, in every key and at 25, 50 and 75 percent between every two keys, because the game blends between any two.
 *
 * The test is local to each joint: in the rest pose the disc of radius `0.75 * depth` around the joint is solid (depth = how far the parts that MEET at the joint, the ones skinned to
 * its bone or to its parent's, reach from it: a wrist is covered by the arm, not by the hip the arm happens to hang in front of); in any other pose the same disc around the POSED
 * joint must still be solid in the whole picture, to within `HOLE_PX` transparent pixels (a few, at the gate's raster, where a figure is about 1100 px tall). A joint those parts do
 * not enclose (a spear's pivot, a tail tip: depth under `MIN_DEPTH`) is not a joint of the body and is skipped.
 *
 * **Format v2 (2026-10-18).** A pose also has a part STATE (`rig-pose.mjs#keyState`): which parts are shown and with which image. A joint is watched in a pose only if at least one of the parts
 * that meet there is shown in that pose (a key that hides both arms owes nothing at the elbows; a key that hides the forearm but not the upper arm still owes the elbow). "The parts that meet there"
 * are the ones that are shown AT REST and are skinned to the joint's bone or its parent's (they are what gave the joint its depth), so a part that is hidden at rest and brought in by a key (a
 * front body rigid on the root) does not make the root's children joints of its own, and a blend uses the
 * state `stateAt` gives (the state of the key moved FROM below 50 percent, of the one moved TO from 50). At exactly 50 percent a move in either direction is possible, so when two keys differ
 * in state the 50 percent pose is scanned in both. A v1 rig has one state, so none of this changes what it scans or how many poses it renders.
 */
import { blendPose, keyPose, keyState, restPose, restState, sameState, stateAt } from './rig-pose.mjs';
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

/** The names of the parts skinned to bone `i` or to its parent (the two sides of the joint). */
function partsAt(rt, i) {
  const want = new Set([i, rt.bones[i].parent].filter((b) => b >= 0));
  const skinned = (m) => { for (let v = 0; v < m.b.length; v++) if (m.b[v] >= 0 && want.has(m.b[v]) && m.w[v] > 0.05) return true; return false; };
  return rt.parts.filter((p) => skinned(p) || Object.values(p.variants ?? {}).some(skinned)).map((p) => p.name); // a v2 variant with a mesh of its own may be skinned to other bones
}

/** The joints worth watching: [{bone, name, depth, r}] (depth in raster px). */
export function bodyJoints(ctx) {
  const { rt, frame } = ctx;
  const { W, H } = frame;
  const out = [];
  const maxR = Math.min(80, Math.round(H * 0.06));
  const rest = restPose(rt);
  const restShown = restState(rt);
  rt.bones.forEach((b, i) => {
    if (b.parent < 0) return;
    const names = partsAt(rt, i).filter((n) => restShown[n].shown); // the parts that give the joint its depth: shown at rest
    if (!names.length) return;
    const restAlpha = rasterize(rt, rest, frame, { parts: names }).alpha;
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
    if (depth >= MIN_DEPTH) out.push({ bone: i, name: b.name, depth, r: Math.max(2, Math.floor(depth * DISC)), meet: names });
  });
  return out;
}

/** Transparent pixels inside each joint's disc, around its POSED place. A joint none of whose parts is shown in `state` (format v2) is not watched. @returns {Array<{name: string, count: number}>} the joints with more than {@link HOLE_PX}. */
export function holesAt(ctx, alpha, joints, posedJoints, state) {
  const { W, H } = ctx.frame;
  const cut = Math.round(HOLE_ALPHA * 255);
  const bad = [];
  for (const j of joints) {
    if (state && j.meet && !j.meet.some((n) => state[n]?.shown)) continue;
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
  const joints = bodyJoints(ctx);
  const poses = new Map(); // name -> { pose, state }
  if (!rt.keys.idle) poses.set('idle', { pose: rest, state: restState(rt) });
  for (const [name, key] of Object.entries(rt.keys)) poses.set(name, { pose: keyPose(rt, key), state: keyState(rt, key) });
  const out = { keys: [], blends: [], rendered: 0, joints: joints.map((j) => j.name) };
  for (const [name, { pose, state }] of poses) {
    const { alpha, joints: pj } = rasterize(rt, pose, ctx.frame, { state });
    out.rendered++;
    out.keys.push({ pose: name, holes: holesAt(ctx, alpha, joints, pj, state) });
  }
  if (!blends) return out;
  const names = [...poses.keys()];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = poses.get(names[i]);
      const b = poses.get(names[j]);
      for (const t of BLEND_STEPS) {
        const pose = blendPose(a.pose, b.pose, t);
        const state = stateAt(a.state, b.state, t);
        const { alpha, joints: pj } = rasterize(rt, pose, ctx.frame, { state });
        out.rendered++;
        out.blends.push({ from: names[i], to: names[j], t, holes: holesAt(ctx, alpha, joints, pj, state) });
        if (t === 0.5 && !sameState(a.state, b.state)) { // the same pose reached from the other side (j to i) shows the other state
          const back = stateAt(b.state, a.state, t);
          const r = rasterize(rt, pose, ctx.frame, { state: back });
          out.rendered++;
          out.blends.push({ from: names[j], to: names[i], t, holes: holesAt(ctx, r.alpha, joints, r.joints, back) });
        }
      }
    }
  }
  return out;
}
