/**
 * **Read a posed rig the way the pose model reads a painting** (the rig program; both games). The gate's rules are the pose gate's: the same model
 * (`tools/posescale/pose-model.mjs`: PaintedScale + PoseRegistration + the idle's stance), the same bands (`pose-bands.mjs`), the same silhouette grid
 * (`pose-pixels.mjs`), so a rig key and a painting of the same pose are measured with one ruler and cannot disagree about "in band".
 *
 *   - A key is drawn into the COSTUME painting's frame (the rig is one painting bent), at the costume's registered placement, planted on `baselineY`.
 *   - Its readings (`stature`, `bodyStature`, `headReal`, `feet`, `massRatio`, `solidity`) are `placePose`'s, taken from the raster it makes.
 *   - The APPROVED painting of the same pose is the target. Both are registered at the idle's scale and feet before they are compared (see {@link approvedTarget}):
 *     the painting as the game draws it (its table scale, its stance slid onto the idle's), then, for a standing or low pose, rescaled about its soles into its
 *     class's stature band and put on the idle's soles. The rig is judged on the shape of the pose, never on a painting's registration flaw.
 */
import { join } from 'node:path';
import { poseClassOf } from '../posescale/pose-kinds.mjs';
import { BANDS, LOW_STATURE_MIN } from '../posescale/pose-bands.mjs';
import { referenceOf, readSubject } from '../posescale/pose-model.mjs';
import { GRID, drawnMask, engineAlpha, maskIou, openedSilhouette, readPaint, stanceFromHem } from '../posescale/pose-pixels.mjs';
import { boneScale, through } from './rig-pose.mjs';
import { rasterize } from './rig-raster.mjs';

/** The height the gate draws a rig at, in raster px (the grid is 220 cells per idle height; this is 4 or 5 times finer). */
export const GATE_HEIGHT = 1100;

/** A raster of alpha as a "painting" the pose model can measure: mask at alpha over 128, alpha box and ground line, stance, mass. */
export async function measureRaster(a, W, H) {
  const mask = new Uint8Array(W * H);
  let x0 = W, y0 = H, x1 = -1, y1 = -1, area = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (a[y * W + x] > 128) {
        mask[y * W + x] = 1;
        area++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  }
  const empty = x1 < 0;
  const bbox = empty ? [0, 0, W, H] : [x0, y0, x1 + 1, y1 + 1];
  const eng = await engineAlpha(a, W, H);
  const bh = bbox[3] - bbox[1];
  const opened = empty ? null : openedSilhouette(mask, W, H, bh, 0.022);
  const stanceOpened = empty ? null : openedSilhouette(mask, W, H, bh, 0.02);
  return {
    W, H, mask, bbox, empty, area, engineBase: eng.base, engineBox: eng.box,
    stance: empty ? null : stanceFromHem(mask, W, H, bbox, stanceOpened),
    mass: opened ? Math.sqrt(opened.area) : Math.sqrt(area),
    proneRaw: W > H * 1.15,
  };
}

const headLen = (h, W, H) => Math.sqrt(Math.max(1e-9, (h[2] - h[0]) * W * (h[3] - h[1]) * H));

/**
 * Everything a read needs about one rig: the idle's side of the pose model, the costume painting's reading and registered placement, and the raster frame.
 * @param {object} rt a normalised rig (`rig-format.mjs#normaliseRig`) @param {object} inputs the pose model's inputs (`loadModelInputs`)
 */
export async function rigContext(rt, inputs) {
  const subject = rt.name;
  const R = await referenceOf(inputs, subject);
  const costumePose = rt.costume.pose ?? rt.costume.painting.split('/').pop();
  const [cr] = await readSubject(inputs, subject, { poses: [costumePose] });
  const [W1, H1] = cr.size;
  const g = Math.min(1, GATE_HEIGHT / H1);
  const mx = Math.round(W1 * 0.35);
  const my = Math.round(H1 * 0.3);
  const frame = { W: Math.ceil((W1 + 2 * mx) * g), H: Math.ceil((H1 + 2 * my) * g), sx: g / rt.scale, sy: g / rt.scale, ox: mx * g, oy: my * g };
  const anchor1 = rt.baselineY / rt.scale;
  const place = { upp: cr.drawn.upp / g, anchor: (anchor1 + my) * g, shift: cr.drawn.shift, mirror: cr.drawn.mirror };
  const row = inputs.table[subject]?.[costumePose] ?? {};
  return { rt, inputs, subject, R, cr, costumePose, W1, H1, g, mx, my, frame, place, row, anchor1 };
}

/** Draw `pose` into the context's frame and measure it. @returns {Promise<{alpha: Uint8Array, vp: object, k: Float64Array, joints: Float64Array}>} */
export async function drawKey(ctx, pose, o = {}) {
  const { alpha, k, joints } = rasterize(ctx.rt, pose, ctx.frame, o);
  const vp = await measureRaster(alpha, ctx.frame.W, ctx.frame.H);
  return { alpha, vp, k, joints };
}

/** A key's silhouette on the common grid (the costume's placement). */
export const keyMask = (ctx, vp) => drawnMask(vp, ctx.place.upp, ctx.place.anchor, ctx.place.shift, ctx.place.mirror);

/**
 * `placePose`'s readings for a rig key, from the raster it drew, plus the verdict fields the bands read.
 * `body` is the head-to-soles height (props left out): the head bone carries the costume's registered head box.
 */
export function readKey(ctx, poseName, drawn) {
  const { rt, R, cr, place, row, W1, H1, frame } = ctx;
  const { vp, k } = drawn;
  const { upp, anchor, shift, mirror } = place;
  const box = vp.engineBox ?? { x0: 0, x1: vp.W, y0: 0, y1: vp.H };
  const stature = R.figH ? ((anchor - box.y0) * upp) / R.figH : null;
  const head = row.head ?? null;
  const hb = rt.landmarks.head.bone;
  let headReal = null;
  let bodyStature = null;
  if (head) {
    headReal = R.headSize ? (headLen(head, W1, H1) * boneScale(k, hb) * cr.drawn.upp) / R.headSize : null;
    const topX = ((head[0] + head[2]) / 2) * W1 * rt.scale;
    const topY = head[1] * H1 * rt.scale;
    const [, py] = through(k, hb, topX, topY);
    bodyStature = R.bodyH ? ((anchor - (py * frame.sy + frame.oy)) * upp) / R.bodyH : null;
  }
  let feet = null;
  if (vp.stance && R.stanceMeasured !== null && R.figH) {
    feet = {
      dy: ((anchor - vp.stance.row) * upp - R.solesGap) / R.figH,
      dx: ((vp.stance.x - vp.W / 2) * upp * mirror + shift - R.stanceMeasuredOff) / R.figH,
    };
  }
  const isRef = poseName === R.refName;
  const cls = poseClassOf({ pose: poseName, isRef, prone: false, kind: R.kind });
  const bw = vp.bbox[2] - vp.bbox[0];
  const bh = vp.bbox[3] - vp.bbox[1];
  const idleIou = isRef ? 1 : maskIou(keyMask(ctx, vp), R.mask);
  return {
    subject: rt.name, pose: poseName, kind: R.kind, game: R.game, class: cls, isRef,
    empty: vp.empty, solidity: vp.empty ? null : vp.area / (bw * bh),
    hasRow: true, hasHead: !!head, refHasHead: !!R.head, headBox: null, held: false, heldGap: null, refWide: R.M.proneRaw,
    headReal, stature, bodyStature, feet, feetPx: vp.stance ? { x: vp.stance.x, row: vp.stance.row } : null, feetRowGap: 0,
    lengthRatio: cls === 'ko' && R.figH ? ((box.x1 - box.x0) * upp) / R.figH : null,
    massRatio: R.M.mass ? (vp.mass * upp) / (R.M.mass * R.upp) : null,
    iou: idleIou,
  };
}

/** The stature band a class is judged in (null: not judged on height). */
export function statureBand(cls, pose) {
  if (cls === 'standing') return [BANDS.standing.stature[0], BANDS.standing.stature[1]];
  if (cls === 'low') return [LOW_STATURE_MIN[pose] ?? BANDS.low.stature[0], BANDS.low.stature[1]];
  return null;
}

/** Does the approved painting carry a prop above its head (the silhouette stands taller than head to soles)? Such a pose is read head to soles. */
export const propsOut = (apr) => Number.isFinite(apr?.bodyStature) && apr.bodyStature > 0 && Number.isFinite(apr?.stature) && apr.stature / apr.bodyStature > 1.08;

/**
 * Is the figure read head to soles? When the pose carries a prop above its head (`propsOut`), and ALSO whenever the IDLE does (a spear whose butt is the top of the idle's silhouette):
 * the prop's top then moves with the pose (a spear dropped in an attack lowers the silhouette though the body stands as tall), so the silhouette is no measure of the figure's height in
 * any pose of that subject. The idle is props-out when its head-to-soles height is under 93 percent of the height it is drawn at.
 */
export const readsBody = (R, apr) => propsOut(apr) || (Number.isFinite(R?.bodyH) && Number.isFinite(R?.figH) && R.figH > 0 && R.bodyH / R.figH < 0.93);

/**
 * The approved painting of a pose, registered at the idle's scale and feet: its mask on the common grid.
 * Standing and low poses: the game's placement (`apr.drawn`), then rescaled about the painting's soles into the class's stature band if it is outside it (a props-out pose
 * by its head to soles height, not its silhouette), and slid so its measured stance sits on the idle's. Every other class (a KO, a part, a staged painting): as the game draws it.
 * @param {object} apr the painting's reading (`readSubject`) @param {object} m the painting as `readPaint` read it
 * @returns {{mask: Uint8Array, upp: number, anchor: number, shift: number, k: number, band: number[]|null, propsOut: boolean, registered: boolean}}
 */
export function approvedTarget(ctx, apr, m) {
  const { R } = ctx;
  const d = apr.drawn;
  const asDrawn = { mask: drawnMask(m, d.upp, d.anchor, d.shift, d.mirror), upp: d.upp, anchor: d.anchor, shift: d.shift, k: 1, band: null, propsOut: false, registered: false };
  const band = statureBand(apr.class, apr.pose);
  if (!band || !m.stance || R.stanceMeasured === null || !R.figH || !m.engineBox) return asDrawn;
  const po = readsBody(R, apr);
  const headTop = apr.hasHead && ctx.inputs.table[apr.subject]?.[apr.pose]?.head ? ctx.inputs.table[apr.subject][apr.pose].head[1] * m.H : null;
  const useBody = po && headTop !== null && R.bodyH;
  const den = useBody ? R.bodyH : R.figH;
  const top = useBody ? headTop : m.engineBox.y0;
  const c = m.stance.row - top;
  const at = (upp) => (R.solesGap + c * upp) / den;
  let uppT = d.upp;
  const s0 = at(uppT);
  const lo = band[0] + 0.01;
  const hi = band[1] - 0.01;
  if (c > 0 && (s0 < lo || s0 > hi)) uppT = Math.min(d.upp * 2, Math.max(d.upp * 0.5, ((s0 < lo ? lo : hi) * den - R.solesGap) / c));
  const anchor = m.stance.row + R.solesGap / uppT;
  const shift = R.stanceMeasuredOff - (m.stance.x - m.W / 2) * uppT * d.mirror;
  return { mask: drawnMask(m, uppT, anchor, shift, d.mirror), upp: uppT, anchor, shift, k: uppT / d.upp, band, propsOut: po, registered: true };
}

/** Read the approved painting of `pose` (reading + pixels), or null when the art folder has none. */
export async function readApproved(ctx, pose) {
  const { inputs, subject, R } = ctx;
  if (!R.poses.includes(pose)) return null;
  const [apr] = await readSubject(inputs, subject, { poses: [pose] });
  const m = await readPaint(join(inputs.artDir, 'characters', subject, `${pose}.png`), pose);
  return { apr, m };
}

export { GRID };
