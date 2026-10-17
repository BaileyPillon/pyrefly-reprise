/**
 * **One model of how the game draws a painting** (pose continuity, W1; both games): `PaintedScale.ts` + `PoseRegistration.ts` + `HeadLock.ts` in plain
 * numbers, with no pixel read and no `three`. Angle 1 of the 2026-10-16 survey built it (`work/measure_all.py`); it agreed with the tool's own record within
 * 0.05 on 335 of 341 poses, and the six it did not are the `feetRow` defect. `pose-model.mjs` feeds it the measurements of a painting
 * (`pose-pixels.mjs`) and the registration table, and adds the readings that need the silhouette (overlap with the idle).
 *
 * Everything is a fraction of the idle's standing height (worldHeight = 1). The placement, as the engine does it:
 *   standingPx  the idle's alpha baseline (PaintedArt.measureAlpha)
 *   upp         1 / standingPx x idle.scale x pose.scale   (pose.scale = the table's, else the KO table's, else the sidecar's, else 1;
 *               the idle is sized once, not by its own scale twice); the longest side may not leave 0.35 to 2.2
 *   anchor row  the table's feetRow, else the sidecar's anchorY, else the measured alpha baseline
 *   stance      each plane slid so its registered stanceX sits where the idle's does (never for a laid-down plane)
 *   head lock   camera-free: factor = clamp(idle head / pose head, 0.9, 1.1) on the registered head box (a held pose's box is the idle's over the
 *               applied scale, so its factor is 1 and its REAL head ratio is the record's `held.headRatio`)
 */

const pos = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
export const clamp = (v, lo, hi) => (!Number.isFinite(v) || v < lo ? lo : v > hi ? hi : v);
/** A head box (fractions of its painting) as a length in the painting's pixels: the square root of its area. */
const headPx = (h, W, H) => Math.sqrt(Math.max(1e-9, (h[2] - h[0]) * W * (h[3] - h[1]) * H));
/** The registered stance x of a row, or null (0 is a real stance). */
const stanceOf = (row) => (Number.isFinite(row?.stanceX) ? row.stanceX : null);

/** The engine's aspect test: a plane wider than 1.15 x its height is laid down unless the table marks it `upright`. */
export const PRONE_ASPECT = 1.15;
/** HeadLock.ts HEAD_BAND. */
export const HEAD_LOCK_BAND = [0.9, 1.1];
/** PaintedScale.ts maxExtent / minExtent, as multiples of the world height. */
export const EXTENT = { max: 2.2, min: 0.35 };

/**
 * @typedef {object} Measured one painting, as read from its file (`pose-pixels.mjs#readPaint` makes it)
 * @property {string} pose
 * @property {number} W @property {number} H the painting's size in pixels
 * @property {number|null} engineBase the ground line the engine measures (PaintedArt.measureAlpha), pixels from the top
 * @property {{x0:number,x1:number,y0:number,y1:number}|null} engineBox the tight content box the engine measures
 * @property {{x:number,row:number}|null} stance the stance read from the silhouette (the middle of its lowest thick part)
 * @property {object} sidecar the `<pose>.json` beside it, or {}
 */

/** The pose's scale and where it came from: the table, the KO table, the sidecar, or none. */
export function poseScaleOf(m, row, koScale, subject) {
  if (pos(row?.scale)) return { scale: row.scale, src: 'reg' };
  if (m.pose === 'ko' && pos(koScale?.[subject])) return { scale: koScale[subject], src: 'ko-table' };
  if (pos(m.sidecar?.scale)) return { scale: m.sidecar.scale, src: 'sidecar' };
  return { scale: null, src: 'none' };
}

/** The row on which the engine plants the figure, and where that came from. */
export function anchorOf(m, row) {
  if (pos(row?.feetRow)) return { anchor: row.feetRow, src: 'feetRow' };
  const ay = m.sidecar?.anchorY;
  if (pos(ay)) return { anchor: ay <= 1 ? ay * m.H : ay, src: 'sidecar-anchorY' };
  return { anchor: m.engineBase ? m.engineBase : m.H, src: 'baseline' };
}

/**
 * The idle's side of the model: everything every other pose is read against.
 * @param {{subject:string, refName:string, ref:Measured, reg:object, koScale:object, want:number, facingOf:(m:Measured)=>string|null, mirrorFor:Function}} o
 */
export function makeRef({ subject, refName, ref, reg, koScale, want, facingOf, mirrorFor }) {
  const row = reg?.[refName] ?? {};
  const { scale: refScale } = poseScaleOf(ref, row, koScale, subject);
  const standing = clamp(ref.engineBase ? ref.engineBase : ref.H, 1, ref.H);
  const upp = (1 / standing) * (refScale || 1);
  const { anchor } = anchorOf(ref, row);
  const box = ref.engineBox ?? { x0: 0, x1: ref.W, y0: 0, y1: ref.H };
  const figH = (anchor - box.y0) * upp; // the idle's figure height as drawn; about 1 less its padding
  const facing = facingOf(ref);
  const mirror = mirrorFor(facing, want);
  const head = row.head ?? null;
  const headLen = head ? headPx(head, ref.W, ref.H) : null;
  const stanceReg = stanceOf(row);
  const stanceOff = stanceReg !== null ? (stanceReg - ref.W / 2) * upp * mirror : null;
  return {
    subject, refName, M: ref, row, standing, refScale, upp, anchor, box, figH, facing, mirror, want,
    head, headSize: headLen ? headLen * upp : null,
    stanceReg, stanceOff,
    stanceMeasured: ref.stance ? ref.stance.x : null,
    stanceMeasuredOff: ref.stance ? (ref.stance.x - ref.W / 2) * upp * mirror : null,
    solesGap: ref.stance ? (anchor - ref.stance.row) * upp : null,
    bodyH: head ? (anchor - head[1] * ref.H) * upp : null,
  };
}

/**
 * Place one painting against the idle, as the engine does. No silhouette is read here; `drawn` is what the silhouette pass needs (scale, anchor,
 * shift, mirror) and the rest are the readings.
 * @param {ReturnType<typeof makeRef>} R
 * @param {Measured} m
 * @param {{row?: object, rec?: object, koScale: object, facingOf: Function, mirrorFor: Function}} o `rec`: the pose's entry in docs/target/pose-measure.json
 */
export function placePose(R, m, { row = {}, rec = {}, koScale, facingOf, mirrorFor }) {
  const isRef = m.pose === R.refName;
  const { scale: sc, src: scaleSrc } = poseScaleOf(m, row, koScale, R.subject);
  let upp = isRef ? R.upp : (1 / R.standing) * (R.refScale || 1) * (sc || 1);
  let clamped = false;
  const longest = Math.max(m.W, m.H) * upp;
  if (longest > EXTENT.max) { upp *= EXTENT.max / longest; clamped = true; }
  else if (longest < EXTENT.min) { upp *= EXTENT.min / longest; clamped = true; }
  const { anchor, src: anchorSrc } = anchorOf(m, row);
  const box = m.engineBox ?? { x0: 0, x1: m.W, y0: 0, y1: m.H };
  const prone = m.W > m.H * PRONE_ASPECT && row.upright !== true;
  const facing = facingOf(m);
  const mirror = isRef ? R.mirror : mirrorFor(facing ?? R.facing, R.want);
  const head = row.head ?? null;
  const hp = head ? headPx(head, m.W, m.H) : null;
  const headTable = hp && R.headSize && !isRef ? (hp * upp) / R.headSize : null;
  // the head lock (HeadLock.ts), camera-free
  let lock = 1;
  let locked = false;
  if (headTable && !isRef) { lock = clamp(1 / headTable, HEAD_LOCK_BAND[0], HEAD_LOCK_BAND[1]); locked = true; }
  const uppEff = upp * lock;
  const held = rec.held ?? null;
  const figH = (anchor - box.y0) * upp;
  const statureTable = R.figH ? figH / R.figH : null;
  const stature = R.figH ? (figH * lock) / R.figH : null;
  const lengthRatio = prone && R.figH ? ((box.x1 - box.x0) * uppEff) / R.figH : null;
  const bodyStature = head && R.bodyH && !prone ? ((anchor - head[1] * m.H) * uppEff) / R.bodyH : null;
  const headEff = headTable ? headTable * lock : null;
  // a hold draws the figure at its height, not its head's: the record's own ratio is the head the player sees
  const headReal = held?.headRatio ? held.headRatio * lock : headEff;
  // the stance slid onto the idle's (never for a laid-down plane, never for the idle)
  const stanceReg = stanceOf(row);
  const shift = !isRef && R.stanceOff !== null && stanceReg !== null && !prone ? R.stanceOff - (stanceReg - m.W / 2) * uppEff * mirror : 0;
  let feetDx = null;
  let feetDy = null;
  if (m.stance && R.stanceMeasured !== null && !prone && !isRef && R.figH) {
    feetDy = ((anchor - m.stance.row) * uppEff - R.solesGap) / R.figH;
    feetDx = ((m.stance.x - m.W / 2) * uppEff * mirror + shift - R.stanceMeasuredOff) / R.figH;
  }
  // what hangs below the row the engine plants on the floor: boots under the floor (a knee-planted feetRow) or a weapon tip on purpose
  const baseline = m.engineBase ? m.engineBase : m.H;
  return {
    isRef, prone, clamped, facing, mirror,
    scale: sc, scaleSrc, anchor, anchorSrc, upp, uppEff, lock: locked ? lock : null, shift,
    statureTable, stature, bodyStature, lengthRatio, headTable, headEff, headReal,
    held: !!held, heldHeadRatio: held?.headRatio ?? null,
    hasRow: Object.keys(row).length > 0, hasHead: !!head, hasStance: stanceReg !== null,
    stanceRegistered: stanceReg, stanceDiffPx: m.stance && stanceReg !== null ? m.stance.x - stanceReg : null,
    feetDx, feetDy,
    feetRowGap: anchorSrc === 'feetRow' ? (baseline - anchor) / m.H : 0,
    sinkIdle: R.figH ? ((baseline - anchor) * uppEff) / R.figH : null,
    drawn: { upp: uppEff, anchor, shift, mirror },
  };
}
