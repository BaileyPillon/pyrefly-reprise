// Continuity harness: the readings pose continuity (W4) added to CHK-026, all of them from the pixels (both games; shared critic plumbing).
//
// Until now CHK-026 read the head from the registration table the engine itself uses, so it passed any registered pose by construction (the r50.1
// note: Lulu's hurt was drawn at 0.667 of her idle's height for ten releases with CHK-026 green), and read the feet from the same table. Three readings
// that trust nothing the table says, each taken from a swap's two planes in the SAME frame (the plane's quad through the camera and the painting's own
// alpha mask), so the camera, the lunge and the head lock are all in them:
//
//   HEIGHT   the figure drawn against the idle: from the top of its silhouette to the ground line, along the plane's own vertical axis, over the same
//            for the idle's plane. A KO or a laid-down pose is read by LENGTH (its long side over the idle's height), which is REPORT-ONLY (the owner has
//            not ruled on the KO band). The bands are the gate's (`tools/posescale/pose-bands.mjs`): standing, strike and hurt 0.90 to 1.10, low poses
//            0.75 to 1.10; the same file the gate (`tools/pose-gate.mjs`) and the static census read, so a deploy refusal and a live review cannot disagree.
//   FEET     where the silhouette stands (the middle of the lowest thick part: continuity-silhouette.mjs `estimateStance`, the registration generator's own
//            rule) in both planes, whatever stance the registration claims. A knee-planted Lady Luck row, a Dark Aeon painting with no stance at all: the
//            registered stance passes, the pixels do not. Where both paintings have a REGISTERED stance (a person with rulers read it and the engine slides the
//            plane onto the idle's by it) the gate is the vertical gap only, the ground line, 2 percent of the figure's height (the gate's `BANDS.feet`, floor 6 px):
//            the auto stance's HORIZONTAL part is crude (against the 27 swaps r50.1's own recordings put 15 to 56 px off sideways, the registered stance is the reviewed one:
//            a trailing foot, a lunge) and is shown (`dx`, `registeredGapPx`), not gated. Where a painting has no registered stance the plane is not slid, so both
//            axes are gated at that tolerance.
//   HEAD     the registered head box, as before, now LABELLED `control`: it is held to the idle's size by the head lock, so it agrees with itself. For
//            a recorded hold (r50.1's nine FFX poses) the box is a virtual one, so the head the player really sees is the record's `held.headRatio`
//            times the control's: that is `realHead`, shown and judged against the gate's hold band (0.80 to 1.45), not hidden behind the 1.000.
//
// A pose in the waiver ledger (continuity-waivers.mjs) is read and shown but not failed. Pure: plain numbers in, plain numbers out.

import { BANDS, LOW_STATURE_MIN, READ_SLACK, SLACK } from '../../../tools/posescale/pose-bands.mjs';
import { applyH } from './continuity-geometry.mjs';

const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const outside = (v, [lo, hi], slack = SLACK) => Number.isFinite(v) && (v < lo - slack || v > hi + slack);

/** The silhouette's height on screen (CSS px): the top of the figure to its ground line, along the plane's own vertical axis. */
export function figureHeightPx(H, ext) {
  return dist(applyH(H, 0.5, ext.top), applyH(H, 0.5, ext.base));
}

/** Head to soles on screen (CSS px): from the top of the real head to the ground line, along the plane's own vertical axis. Null with no head box to measure from. */
export function bodyHeightPx(H, ext, headTopT) {
  return Number.isFinite(headTopT) && ext ? dist(applyH(H, 0.5, headTopT), applyH(H, 0.5, ext.base)) : null;
}

/** The silhouette's length on screen (CSS px): its left to its right edge, along the plane's own horizontal axis at the middle of its body. */
export function figureLengthPx(H, ext) {
  const v = (ext.top + ext.base) / 2;
  return dist(applyH(H, ext.left, v), applyH(H, ext.right, v));
}

/** The stature band of a class, `[lo, hi]` of the idle's height, or null for a class no height band judges (the gate's own numbers). */
export function statureBandOf(cls, pose) {
  if (cls === 'standing') return BANDS.standing.stature;
  if (cls === 'low') return [LOW_STATURE_MIN[pose] ?? BANDS.low.stature[0], BANDS.low.stature[1]];
  return null;
}

/** The waiver covering either painting of a swap, or null. */
const waiverOf = (...as) => as.map((a) => a?.waiver).find(Boolean) ?? null;

/**
 * The HEIGHT reading of one swap. `aFrom`/`aTo` are the paintings' anchors (continuity-silhouette.mjs), `Hf`/`Ht` their planes' maps IN THE SAME FRAME.
 * One side being the figure's idle gives the pose's stature (or, for a KO, its length); two non-idle poses give the pair's ratio, judged against the
 * widest ratio their two bands allow (both in band implies it, so it is a necessary condition, never a false alarm).
 * @returns {null | {fromPx:number, toPx:number, ratio:number|null, vs:'idle'|'pair', pose:string|null, side:'from'|'to'|null, class:string|null, stature:number|null,
 *   length:number|null, band:number[]|null, flags:string[], report:string[], waived:object|null, source:'pixels'}}
 */
export function readHeight({ aFrom, aTo, Hf, Ht, k1600 }) {
  if (!aFrom?.extent || !aTo?.extent || aFrom.kind === 'ff7' || aTo.kind === 'ff7') return null;
  const hf = figureHeightPx(Hf, aFrom.extent) * k1600, ht = figureHeightPx(Ht, aTo.extent) * k1600;
  if (!(hf > 0) || !(ht > 0)) return null;
  const out = { fromPx: round(hf, 1), toPx: round(ht, 1), ratio: round(ht / hf, 4), vs: 'pair', pose: null, side: null, class: null, stature: null, length: null, band: null, flags: [], report: [], waived: null, source: 'pixels' };
  const idleSide = aFrom.pose === 'idle' ? 'from' : aTo.pose === 'idle' ? 'to' : null;
  if (idleSide) {
    const idleH = idleSide === 'from' ? hf : ht;
    const judged = idleSide === 'from' ? aTo : aFrom, Hj = idleSide === 'from' ? Ht : Hf, ownH = idleSide === 'from' ? ht : hf;
    Object.assign(out, { vs: 'idle', pose: judged.pose, side: idleSide === 'from' ? 'to' : 'from', class: judged.cls ?? null, waived: judged.waiver ?? null });
    if (judged.cls === 'standing' || judged.cls === 'low') {
      out.stature = round(ownH / idleH, 4);
      // a props-out pose (victory, defend) is judged head to soles, as the gate judges it: the box counts the raised sword or staff as height
      if (judged.propsOut) {
        const idleA = idleSide === 'from' ? aFrom : aTo, Hi = idleSide === 'from' ? Hf : Ht;
        const own = bodyHeightPx(Hj, judged.extent, judged.headTopT), idleBody = bodyHeightPx(Hi, idleA.extent, idleA.headTopT);
        if (own > 0 && idleBody > 0) { out.stature = round(own / idleBody, 4); out.basis = 'body'; }
      }
      out.band = statureBandOf(judged.cls, judged.pose);
      if (outside(out.stature, out.band, SLACK + READ_SLACK)) out.flags.push(out.stature < out.band[0] ? 'stature-low' : 'stature-high');
    } else if (judged.cls === 'ko' && judged.extent) {
      out.length = round((figureLengthPx(Hj, judged.extent) * k1600) / idleH, 4);
      if (outside(out.length, BANDS.ko.length, 0)) out.report.push(out.length < BANDS.ko.length[0] ? 'ko-short' : 'ko-long');
    }
    return out;
  }
  const bf = statureBandOf(aFrom.cls, aFrom.pose), bt = statureBandOf(aTo.cls, aTo.pose);
  Object.assign(out, { waived: waiverOf(aFrom, aTo), class: `${aFrom.cls}>${aTo.cls}` });
  // a pair with a props-out pose in it is compared head to soles on both sides (a box ratio would count a raised sword against the band), when both have a head to measure from
  if (aFrom.propsOut || aTo.propsOut) {
    const bfPx = bodyHeightPx(Hf, aFrom.extent, aFrom.headTopT), btPx = bodyHeightPx(Ht, aTo.extent, aTo.headTopT);
    if (bfPx > 0 && btPx > 0) { out.ratio = round(btPx / bfPx, 4); out.basis = 'body'; }
    else { out.ratio = null; out.report.push('props-out-unread'); return out; }
  }
  if (bf && bt) {
    out.band = [round(bt[0] / bf[1], 4), round(bt[1] / bf[0], 4)];
    if (outside(out.ratio, out.band, 2 * (SLACK + READ_SLACK))) out.flags.push(out.ratio < out.band[0] ? 'stature-low' : 'stature-high');
  }
  return out;
}

/**
 * The independent FEET reading of one swap: the silhouette's stance in both planes of the same frame (px at 1600 wide), and, for a plane whose stance the
 * registration gives, how far that registered stance is from the silhouette's (`registeredGapPx`: the registration claims feet where the pixels have none).
 * `gate` says which part of the gap judges the swap (see the header): `dy` (both stances registered) or `xy`; `gatePx` is that part, in px at 1600 wide.
 * @returns {null | {dx:number, dy:number, px:number, gate:'dy'|'xy', gatePx:number, standing:boolean, source:'silhouette', registeredGapPx:[number|null, number|null]}}
 */
export function readFeetSilhouette({ aFrom, aTo, Hf, Ht, k1600 }) {
  if (!aFrom?.stanceSil || !aTo?.stanceSil) return null;
  const pt = (a, H) => applyH(H, a.stanceSil.u, a.stanceSil.t);
  const ff = pt(aFrom, Hf), ft = pt(aTo, Ht);
  const dx = (ft[0] - ff[0]) * k1600, dy = (ft[1] - ff[1]) * k1600;
  const gap = (a, H) => (a.stanceSrc === 'registration' && a.stance ? round(dist(applyH(H, a.stance.u, a.stance.t), pt(a, H)) * k1600, 1) : null);
  const bothRegistered = aFrom.stanceSrc === 'registration' && aTo.stanceSrc === 'registration';
  const px = Math.hypot(dx, dy);
  return { dx: round(dx, 1), dy: round(dy, 1), px: round(px, 1), gate: bothRegistered ? 'dy' : 'xy', gatePx: round(bothRegistered ? Math.abs(dy) : px, 1), standing: !aFrom.prone && !aTo.prone, source: 'silhouette', registeredGapPx: [gap(aFrom, Hf), gap(aTo, Ht)] };
}

/**
 * The head the player really sees across a swap, where a recorded hold is on either side. A hold draws the figure at its height and not at its head's, so
 * the registered box is a virtual one and the control reading (`head.ratio`) is 1.000 by construction; the record's `held.headRatio` is the head over the
 * idle's. Null when neither painting is a hold (the control IS the head then).
 * @param {{ratio:number|null, source:string}|null} head the control reading
 * @returns {null | {ratio:number, fromHeld:number|null, toHeld:number|null, costPct:number, band:number[], outsideBand:boolean}}
 */
export function readRealHead({ aFrom, aTo, head }) {
  const rf = aFrom?.heldHeadRatio ?? null, rt = aTo?.heldHeadRatio ?? null;
  if (!head || head.source !== 'registration' || head.ratio === null || (rf === null && rt === null)) return null;
  const ratio = (head.ratio * (rt ?? 1)) / (rf ?? 1);
  // each hold is judged on its own head over the idle's (a pair of two holds is not a head against a head)
  const outsideBand = [rf, rt].some((r) => r !== null && outside(r, BANDS.heldHead, 0));
  return { ratio: round(ratio, 4), fromHeld: rf, toHeld: rt, costPct: round((ratio - 1) * 100, 1), band: BANDS.heldHead, outsideBand };
}

/** The feet tolerance (px at 1600 wide) of the silhouette reading: the gate's own fraction of the figure's drawn height (`BANDS.feet`, 2 percent; the policy may name another), never under the coarse px tolerance of a silhouette-read stance. */
export function feetSilhouetteTolerancePx(cfg, figurePx) {
  const pct = Number.isFinite(cfg?.size?.feetSilhouettePct) ? cfg.size.feetSilhouettePct : BANDS.feet * 100;
  const floor = Number.isFinite(cfg?.size?.feetTolerancePxCoarse) ? cfg.size.feetTolerancePxCoarse : 6;
  return round(Math.max(floor, (pct / 100) * (figurePx || 0)), 1);
}

/**
 * Everything pose continuity (W4) adds to one swap, from the paintings' anchors and the planes' maps of the SAME frame: the HEIGHT, the independent FEET and the real
 * HEAD readings, and whether each fails CHK-026. `head` is the swap's control reading (`analyzeSwap`'s `out.head`). A reading the policy switches off (`readings.*: false`)
 * is not taken; a swap that is not `judged` (a costume change, one painting twice) takes none. A pose in the waiver ledger is read and shown, never failed.
 * @returns {{height:object|null, feetSil:object|null, headReal:object|null, failHeight:boolean, failFeetSil:boolean, failRealHead:boolean, unregistered:boolean}}
 */
export function poseReadings({ aFrom, aTo, Hf, Ht, k1600, head, cfg, judged }) {
  const out = { height: null, feetSil: null, headReal: null, failHeight: false, failFeetSil: false, failRealHead: false, unregistered: false };
  if (!judged || !aFrom || !aTo) return out;
  const on = (k) => cfg?.readings?.[k] !== false;
  const waived = waiverOf(aFrom, aTo);
  // a painting of a character subject with no fresh registration record at all (the Dark Aeons before they were registered): reported, never failed here (the gate refuses it at install)
  out.unregistered = [aFrom, aTo].some((a) => a.subject && a.registered === false);
  if (on('height')) {
    out.height = readHeight({ aFrom, aTo, Hf, Ht, k1600 });
    out.failHeight = Boolean(out.height?.flags.length) && !out.height.waived;
  }
  if (on('feetSilhouette') && aFrom.kind !== 'ff7' && aTo.kind !== 'ff7') {
    out.feetSil = readFeetSilhouette({ aFrom, aTo, Hf, Ht, k1600 });
    if (out.feetSil) {
      const figPx = Math.max(out.height?.fromPx ?? 0, out.height?.toPx ?? 0)
        || Math.max(aFrom.extent ? figureHeightPx(Hf, aFrom.extent) : 0, aTo.extent ? figureHeightPx(Ht, aTo.extent) : 0) * k1600;
      out.feetSil.tolerancePx = feetSilhouetteTolerancePx(cfg, figPx);
      out.feetSil.waived = waived;
      out.failFeetSil = out.feetSil.standing && out.feetSil.gatePx > out.feetSil.tolerancePx && !waived;
    }
  }
  if (on('realHead')) {
    out.headReal = readRealHead({ aFrom, aTo, head });
    if (out.headReal) {
      out.headReal.waived = waived;
      out.failRealHead = out.headReal.outsideBand && !waived;
    }
  }
  return out;
}
