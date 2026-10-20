// Continuity harness: the pure maths (CHK-026 size continuity, CHK-027 continuity of motion).
//
// No I/O, no browser, no image library: everything here is a function of plain numbers and arrays, so
// tests/unit/critic-continuity-pure.test.ts can hold it to known answers. The in-page probe
// (continuity-probe.mjs) records, for every rendered frame, each figure's two painted planes as four
// screen-space corners plus their opacities; the node side (continuity-analyze.mjs) decodes the paintings
// and calls these.
//
// Vocabulary
//   plane      one of a figure's two textured planes (`PaintedActor.slots`): the pose it draws, its fade
//              (0..1) and the screen position (CSS px) of the painting's four corners, top-left, top-right,
//              bottom-right, bottom-left, mirror included.
//   anchor     where a thing is on a painting, in the painting's own normalised coordinates (u across from
//              the left, t down from the top, both 0..1): the head box and the stance point. A painting's
//              resolution never matters, only these fractions.
//   swap       the frame in which the pose a figure is drawn in changes (`slots[active].pose`).
//   1600 px    every distance below is scaled to a canvas 1600 px wide (`scale1600`), the size the owner's
//              thresholds are written for.
//
// Game case: both (shared critic plumbing; a size jump or a snap is a defect in either game).

import { cameraShiftAt } from './continuity-camera.mjs';
import { applyH, invertH, polygonArea, unitSquareToQuad } from './continuity-geometry.mjs';
import { heldPlateau } from './continuity-held.mjs';
import { poseReadings } from './continuity-readings.mjs';
import { rigTrack } from './continuity-rig.mjs';
import { stagedStepOf } from './continuity-staged.mjs';

export { applyH, invertH, polygonArea, unitSquareToQuad };
export const FRAME_MS = 1000 / 60;

// ------------------------------------------------------------------ geometry
// (the projective maps, `unitSquareToQuad`, `applyH`, `invertH` and `polygonArea`, are in continuity-geometry.mjs and re-exported here)

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const WHOLE = { u0: 0, t0: 0, u1: 1, t1: 1 }; // the whole painting, as a box

/** CSS px -> px on a canvas 1600 wide, the unit of every threshold. */
export const scale1600 = (canvasCssWidth) => (canvasCssWidth > 0 ? 1600 / canvasCssWidth : 1);

/**
 * A head's size on screen: the square root of the area of its box as drawn (px). The same figure of merit the pose
 * registration uses (`tools/posescale/ps_lib.py head_size`): a turn or a tilt trades width for height and this keeps
 * one number, and it is what the owner's "head height" is measured as.
 */
export function headSizePx(H, head) {
  const poly = [applyH(H, head.u0, head.t0), applyH(H, head.u1, head.t0), applyH(H, head.u1, head.t1), applyH(H, head.u0, head.t1)];
  return Math.sqrt(polygonArea(poly));
}

/** The head box's centre on screen. */
export const headCentre = (H, head) => applyH(H, (head.u0 + head.u1) / 2, (head.t0 + head.t1) / 2);

/** The stance (feet) point on screen. */
export const feetPoint = (H, stance) => applyH(H, stance.u, stance.t);

// ------------------------------------------------------------------ silhouettes on screen

/**
 * How two silhouettes, each drawn through its own plane, overlap on screen: the intersection over union of
 * their alpha masks and the distance between their centres of mass (px).
 * A mask is `{ w, h, bits }` over the whole painting (bits[row * w + col] = 1 where alpha is solid).
 * `cells` is the long side of the comparison grid laid over both quads.
 * @returns {{iou:number, centroidShift:number, areaA:number, areaB:number}|null} null when a plane is degenerate.
 */
export function outlineJump(maskA, HA, maskB, HB, quadA, quadB, cells = 160) {
  const invA = invertH(HA), invB = invertH(HB);
  if (!invA || !invB || !maskA || !maskB) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const q of [quadA, quadB]) for (let i = 0; i < 8; i += 2) { x0 = Math.min(x0, q[i]); x1 = Math.max(x1, q[i]); y0 = Math.min(y0, q[i + 1]); y1 = Math.max(y1, q[i + 1]); }
  if (!(x1 > x0 && y1 > y0)) return null;
  const step = Math.max(x1 - x0, y1 - y0) / cells;
  let a = 0, b = 0, ab = 0, ax = 0, ay = 0, bx = 0, by = 0;
  const inside = (inv, m, x, y) => {
    const w = inv[6] * x + inv[7] * y + inv[8];
    const u = (inv[0] * x + inv[1] * y + inv[2]) / w, t = (inv[3] * x + inv[4] * y + inv[5]) / w;
    if (!(u >= 0 && u < 1 && t >= 0 && t < 1)) return false;
    return m.bits[Math.floor(t * m.h) * m.w + Math.floor(u * m.w)] === 1;
  };
  for (let y = y0 + step / 2; y < y1; y += step) {
    for (let x = x0 + step / 2; x < x1; x += step) {
      const ia = inside(invA, maskA, x, y), ib = inside(invB, maskB, x, y);
      if (ia) { a++; ax += x; ay += y; }
      if (ib) { b++; bx += x; by += y; }
      if (ia && ib) ab++;
    }
  }
  if (!a || !b) return { iou: 0, centroidShift: 0, areaA: a * step * step, areaB: b * step * step };
  return { iou: ab / (a + b - ab), centroidShift: dist([ax / a, ay / a], [bx / b, by / b]), areaA: a * step * step, areaB: b * step * step };
}

// ------------------------------------------------------------------ frame records

/** A plane record from the probe (`[k, fade, visible, x0,y0,x1,y1,x2,y2,x3,y3]`) as an object, or null. */
export function planeOf(raw) {
  if (!raw || !Array.isArray(raw)) return null;
  // `cs` (probe version 2): where the camera's change alone moved each corner since the last frame, present only while the camera moved (continuity-camera.mjs)
  return { k: raw[0], fade: raw[1], vis: raw[2] === 1, q: raw.slice(3, 11), cs: raw.length >= 19 ? raw.slice(11, 19) : null };
}

/** The plane that is `act` (the one the actor calls active) and the other one, from a figure record. */
export function planesOf(fig) {
  const cur = planeOf(fig.s[fig.act]);
  const other = planeOf(fig.s[fig.act === 0 ? 1 : 0]);
  return { cur, other };
}

/**
 * Where a figure is on screen in one frame: its feet and its head, each the average of its two planes weighted
 * by how visible each is (so a crossfade glides between them rather than hopping at 50 percent), using the
 * anchors of the paintings. Null when no plane has anchors or the figure is not showing.
 * `anchors[k]` = { head: {u0,t0,u1,t1}|null (registered), mass: number|null, stance: {u,t}|null, centroid: {u,t}|null }.
 *
 * `byCentroid` (r40 instrument edit (a)) follows the silhouette's CENTROID instead, for a figure with no registration: the stance read from
 * a silhouette is the middle of the lowest thick part, trustworthy only for a figure standing on its feet, and for a serpent, an aeon in
 * the air or a hanging fin it is whichever tip hangs lowest in that pose (228 foe swaps of round 23 read 40 px or more of "feet" shift at
 * a median 8.3 times the centroid's own shift, and held the top of the worst-jerk ranking: 807 px for a true shift of 102). In this mode
 * `feet` and `head` are null and `centroid` is the weighted point; otherwise `centroid` is null.
 */
export function figureTrack(fig, anchors, byCentroid = false) {
  if (fig.rg) return rigTrack(fig.rg); // a RIGGED figure (R57-002) draws no plane: where its head, feet and centroid are is in its record (continuity-rig.mjs)
  let wf = 0, fx = 0, fy = 0, wh = 0, hx = 0, hy = 0, wc = 0, cx = 0, cy = 0, headOk = true, seen = 0;
  // the camera's own shift of each tracked point, weighted like the point (continuity-camera.mjs): a head is moved by the camera far more than the origin is
  const cf = [0, 0], ch = [0, 0], cc = [0, 0];
  const add = (acc, plane, an, w) => { const s = cameraShiftAt(plane, an.u, an.t); acc[0] += s[0] * w; acc[1] += s[1] * w; };
  for (const raw of fig.s) {
    const p = planeOf(raw);
    if (!p || p.fade <= 0.001) continue;
    const an = anchors[p.k];
    if (!an) { headOk = false; continue; }
    seen++;
    const H = unitSquareToQuad(p.q);
    if (byCentroid) {
      if (an.centroid) { const c = applyH(H, an.centroid.u, an.centroid.t); wc += p.fade; cx += c[0] * p.fade; cy += c[1] * p.fade; add(cc, p, an.centroid, p.fade); }
      continue;
    }
    if (an.stance) { const f = feetPoint(H, an.stance); wf += p.fade; fx += f[0] * p.fade; fy += f[1] * p.fade; add(cf, p, an.stance, p.fade); }
    if (an.head) {
      const h = headCentre(H, an.head); wh += p.fade; hx += h[0] * p.fade; hy += h[1] * p.fade;
      add(ch, p, { u: (an.head.u0 + an.head.u1) / 2, t: (an.head.t0 + an.head.t1) / 2 }, p.fade);
    } else headOk = false;
  }
  if (!seen || (!wf && !wh && !wc)) return null;
  // The head is followed only while every plane that shows has a registered head: a head and a body centre are not one point.
  const per = (acc, w) => (w ? [acc[0] / w, acc[1] / w] : null);
  return {
    feet: wf ? [fx / wf, fy / wf] : null, head: headOk && wh ? [hx / wh, hy / wh] : null, centroid: wc ? [cx / wc, cy / wc] : null,
    // `cams`: the camera-only shift of each tracked point (CSS px), for detectJerks; [0, 0] where the recording carries none
    cams: { feet: per(cf, wf), head: headOk && wh ? per(ch, wh) : null, centroid: per(cc, wc) },
  };
}

// ------------------------------------------------------------------ swaps

/**
 * Everything CHK-026 and CHK-027 say about one pose swap, from the frames around it.
 *
 * @param {object} o
 * @param {Array} o.frames   the figure's consecutive frames around the swap, from where the incoming painting first
 *                           showed to a window after it; each `{ n, t, fig }` where fig is the probe's figure record
 * @param {number} o.at      the index in `frames` of the swap frame (the first one in which the new painting dominates)
 * @param {object} o.swap    `{ from, to }` plane keys
 * @param {Array} o.anchors  by plane key: { head (registered), mass, stance, stanceSrc, mask, prone }
 * @param {number} o.k1600   px scale to a 1600-wide canvas
 * @param {boolean} o.camCut a camera cut or whip in [s-1, s+1]
 * @param {object} o.cfg     the policy's `continuity` thresholds
 * @param {{from?:string, to?:string}} [o.names]  the planes' own pose names (a fallback for naming a twirl key when a painting says nothing about its file)
 */
export function analyzeSwap({ frames, at = 0, swap, anchors, k1600, camCut, cfg, names }) {
  const f0 = frames[at];
  const planeIn = (fr, k) => (fr ? fr.fig.s.map(planeOf).find((p) => p && p.k === k) ?? null : null);
  // a plane re-pointed at another painting while it still shows has the old painting only in the frame before
  const fromRaw = planeIn(f0, swap.from) ?? planeIn(frames[at - 1], swap.from);
  const toRaw = planeIn(f0, swap.to) ?? planeIn(frames[at + 1], swap.to);
  const aFrom = anchors[swap.from] ?? null, aTo = anchors[swap.to] ?? null;
  // A swap between two dresspheres' paintings (or two forms of a boss) is a change of costume, staged by its own sequence (the spherechange's twirl), not a change of
  // pose: it is measured and shown (`costume`) and not judged against the pose tolerances. A swap between two pose names that draw one and the same painting (a pose
  // that falls back to the idle's) cannot change the figure's size, and whatever it moves is the pose state's own motion (a recoil, a lean: CHK-027's jerks).
  // A change of RANGE is staged by its own director too (Evrae's and Sin's fins' `idle-far` streak is swapped in sized and placed by the airship director, `idle-near` is the close set): one
  // painting of the swap is a far-range painting and the other is not. Another subject (dressphere, form) or another range is a change of costume and place, not of pose.
  const farOf = (a) => /-far(?:\.|$)/.test(String(a?.url ?? '').split('/').pop() ?? '');
  const range = Boolean(aFrom?.url && aTo?.url && farOf(aFrom) !== farOf(aTo));
  // A step of the spherechange's twirl (a cut between a figure's `twirl-*` keys, or into the first or out of the last) is one STAGED costume change: its keys are cut by design
  // (D-322, P4), so it is a costume swap and not a snap (continuity-staged.mjs; r40 instrument edit (b)).
  const staged = stagedStepOf(aFrom, aTo, cfg, names);
  const costume = range || Boolean(staged) || Boolean(aFrom?.subject && aTo?.subject && aFrom.subject !== aTo.subject);
  const sameArt = !costume && Boolean(aFrom?.url && aFrom.url === aTo?.url);
  const judged = !costume && !sameArt;
  const out = {
    camCut: Boolean(camCut), costume, sameArt, range, staged,
    head: null, feet: null, outline: null, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null }, blendFrames: 0,
    held: { frames: 0, ms: 0, from: null }, snap: false, snapStaged: false, hardCut: false, failHead: false, failFeet: false,
    // pose continuity (W4): the readings from the pixels (continuity-readings.mjs), null until taken
    height: null, feetSil: null, headReal: null, failHeight: false, failFeetSil: false, failRealHead: false, unregistered: false,
  };
  if (!fromRaw || !toRaw) return { ...out, unmeasured: 'a plane of the swap was not recorded' };
  const Hf = unitSquareToQuad(fromRaw.q), Ht = unitSquareToQuad(toRaw.q);
  // CHK-026 reads the old and the new painting through their own planes IN THE SAME FRAME (item 1), so that nothing but the registration can move the head or the feet.
  // When the old painting's plane was re-pointed in the swap's own frame (a KO cuts in while a crossfade is still running), `fromRaw` came from the frame before and
  // `toRaw` from this one, and whatever the figure itself did in that one frame (the collapse's first jolt, a lunge) was charged to the registration: Chapter I's Yuna hurt to idle
  // read 4.4 px of feet where the two planes of the frame before agree to 0.2 px. Where one frame shows both planes, the size and the feet are read there. The outline (CHK-027)
  // keeps reading what the picture did across the swap, so the snap counts do not move.
  const both = (fr) => { const a = planeIn(fr, swap.from), b = planeIn(fr, swap.to); return a && b ? [a, b] : null; };
  const same = both(f0) ?? both(frames[at - 1]) ?? both(frames[at + 1]);
  const Hf26 = same ? unitSquareToQuad(same[0].q) : Hf, Ht26 = same ? unitSquareToQuad(same[1].q) : Ht;

  // --- size: the head on screen before and after (CHK-026). Registered heads where both poses have one; else the two
  // masses (a head and a mass are never compared with each other).
  const bothHeads = Boolean(aFrom?.head && aTo?.head);
  let pf = null, pt = null;
  if (bothHeads) { pf = headSizePx(Hf26, aFrom.head); pt = headSizePx(Ht26, aTo.head); }
  else if (aFrom?.mass > 0 && aTo?.mass > 0) { pf = headSizePx(Hf26, WHOLE) * Math.sqrt(aFrom.mass); pt = headSizePx(Ht26, WHOLE) * Math.sqrt(aTo.mass); }
  if (pf !== null && pf > 0) {
    pf *= k1600; pt *= k1600;
    const ratio = pt / pf;
    // `label`: a registered head is held to the idle's size by the head lock and read through the table that drew it, so it agrees with itself whatever the body does: a CONTROL, not a proof
    // (W4: the HEIGHT and FEET readings below trust nothing the table says). The mass is read from the pixels and is no control.
    out.head = { fromPx: round(pf, 1), toPx: round(pt, 1), ratio: round(ratio, 4), source: bothHeads ? 'registration' : 'silhouette', metric: bothHeads ? 'head' : 'mass', label: bothHeads ? 'control' : 'mass' };
    out.failHead = judged && Math.abs(ratio - 1) > (bothHeads ? cfg.size.headTolerancePct : cfg.size.headTolerancePctCoarse) / 100;
  }
  // --- feet: where the standing figure stands, before and after
  if (aFrom?.stance && aTo?.stance) {
    const ff = feetPoint(Hf26, aFrom.stance), ft = feetPoint(Ht26, aTo.stance);
    const dx = (ft[0] - ff[0]) * k1600, dy = (ft[1] - ff[1]) * k1600;
    const standing = !aFrom.prone && !aTo.prone;
    const px = Math.hypot(dx, dy);
    const coarse = aFrom.stanceSrc !== 'registration' || aTo.stanceSrc !== 'registration';
    out.feet = { dx: round(dx, 1), dy: round(dy, 1), px: round(px, 1), standing, source: coarse ? 'silhouette' : 'registration' };
    if (standing) out.failFeet = judged && px > (coarse ? cfg.size.feetTolerancePxCoarse : cfg.size.feetTolerancePx);
  }
  // --- pose continuity (W4): the height, the silhouette's own feet and a hold's real head, from the pixels, through the same two planes of the same frame
  Object.assign(out, poseReadings({ aFrom, aTo, Hf: Hf26, Ht: Ht26, k1600, head: out.head, cfg, judged }));
  // --- the outline: what the swap does to the silhouette as drawn (CHK-027)
  if (aFrom?.mask && aTo?.mask) {
    const oj = outlineJump(aFrom.mask, Hf, aTo.mask, Ht, fromRaw.q, toRaw.q);
    if (oj) out.outline = { iou: round(oj.iou, 3), centroidShiftPx: round(oj.centroidShift * k1600, 1), areaRatio: oj.areaA ? round(oj.areaB / oj.areaA, 3) : null };
  }
  // --- blend and ghost frames: how the two planes share the screen from where the new painting first showed
  const differs = out.outline ? 1 - out.outline.iou >= cfg.motion.ghostOutlineMin : true;
  for (let j = 0; j < frames.length; j++) {
    const fr = frames[j];
    const pf = planeIn(fr, swap.from), pt = planeIn(fr, swap.to);
    const dt = Math.min(100, Math.max(0, j ? fr.t - frames[j - 1].t : FRAME_MS));
    if (!pf || !pt) continue;
    const lo = Math.min(pf.fade, pt.fade);
    if (lo > cfg.motion.blendFadeMin) out.blendFrames++;
    if (lo >= cfg.motion.ghostFadeMin && differs) {
      out.ghost.frames++;
      out.ghost.ms += dt;
      const sev = lo * (out.outline ? 1 - out.outline.iou : 1);
      if (lo > out.ghost.peak) out.ghost.peak = lo;
      if (sev > out.ghost.severity) { out.ghost.severity = sev; out.ghost.worstFrame = fr.n; }
    }
  }
  out.ghost.ms = round(out.ghost.ms, 0);
  out.ghost.peak = round(out.ghost.peak, 3);
  out.ghost.severity = round(out.ghost.severity, 3);
  out.hardCut = out.blendFrames === 0;
  // r40 instrument edit (c): the longest stretch in which both paintings showed and their fades did not move (a frozen blend), read instead of inferred.
  out.held = heldPlateau(frames, swap, cfg.motion.blendFadeMin, FRAME_MS);
  // A snap is a cut that shows: no in-between frame, and the picture jumps (the silhouette moved, or the head or the feet did).
  // A staged cut (a step of the twirl) is that by design: it is kept as `snapStaged` so a reader sees what the classification excused.
  const visibleJump = (out.outline ? 1 - out.outline.iou >= cfg.motion.snapOutlineMin || out.outline.centroidShiftPx >= cfg.motion.snapCentroidMinPx : false) || out.failHead || out.failFeet;
  out.snap = out.hardCut && visibleJump && !staged;
  out.snapStaged = out.hardCut && visibleJump && Boolean(staged);
  return out;
}

const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };

// ------------------------------------------------------------------ jerks

/**
 * Teleports and jerks on every frame of a move. `track` is one figure's samples in order, each
 * `{ n, t, feet:[x,y]|null, head:[x,y]|null, centroid?:[x,y]|null, cam:[dx,dy], cams?:{feet,head,centroid} }` (a figure with no registration has only a centroid, see
 * `figureTrack`) where `cam` is how far the camera alone moved the
 * figure's world point since the previous sample (so the jump of the figure itself is the step minus `cam`), and `cams` (probe version 2) how far it moved each
 * TRACKED point (`figureTrack`, continuity-camera.mjs): a head is moved by far more than the origin is, and the step minus `cam` read a camera cut as a 40 to 57 px head jerk
 * on every figure in the frame. A part with no `cams` entry falls back to `cam`; `cam` alone still decides whether the camera cut (its own shift under `cutPx`).
 * Only consecutive frames count; a gap (the figure hid, the battle paused) resets.
 *
 * A step is a jerk when it is at least `jerkMinPx`, is `jerkRatio` times the local speed of the move (the median
 * of the neighbouring steps, never less than `jerkFloorPx`), does not open a dash that keeps half its speed for
 * `ballisticChain` frames, and the camera did not cut (its own shift under `cutPx`). Steps within `mergeFrames` of each
 * other are one event (a two-frame pop is one pop).
 * @returns {Array<{n:number, t:number, px:number, localPx:number, ratio:number, part:'feet'|'head'|'centroid', dx:number, dy:number}>}
 */
export function detectJerks(track, k1600, cfg) {
  const m = cfg.motion;
  const steps = []; // step j is the move from sample j-1 to sample j
  for (let j = 1; j < track.length; j++) {
    const a = track[j - 1], b = track[j];
    if (!a || !b || b.n !== a.n + 1) { steps.push(null); continue; }
    let best = null;
    for (const part of ['feet', 'head', 'centroid']) {
      if (!a[part] || !b[part]) continue;
      // the camera's own shift of THIS point (W4, angle 2 section 6: a head 1.8 units above the origin is moved by far more than the origin is), else of the figure's origin (an older recording)
      const cam = (b.cams && b.cams[part]) || b.cam;
      const dx = (b[part][0] - a[part][0] - cam[0]) * k1600, dy = (b[part][1] - a[part][1] - cam[1]) * k1600;
      const px = Math.hypot(dx, dy);
      if (!best || px > best.px) best = { part, px, dx, dy };
    }
    steps.push(best ? { ...best, camPx: Math.hypot(b.cam[0], b.cam[1]) * k1600 } : null);
  }
  const events = [];
  for (let j = 0; j < steps.length; j++) {
    const s = steps[j];
    if (!s || s.px < m.jerkMinPx || s.camPx >= m.cutPx) continue;
    const nb = [];
    for (let i = Math.max(0, j - m.localWindow); i <= Math.min(steps.length - 1, j + m.localWindow); i++) if (i !== j && steps[i]) nb.push(steps[i].px);
    const local = Math.max(m.jerkFloorPx, median(nb));
    if (s.px < m.jerkRatio * local) continue;
    // A dash that starts at full speed and slows (85, 66, 48, 32 ...) is the move's own profile, not a pop: the steps that follow
    // stay at half the one before for `ballisticChain` frames. A pop is followed by stillness or by a different move.
    if (ballisticChain(steps, j, m.jerkMinPx) >= m.ballisticChain) continue;
    const at = track[j + 1];
    const last = events[events.length - 1];
    if (last && at.n - last.n <= m.mergeFrames) { if (s.px > last.px) Object.assign(last, { px: round(s.px, 1), part: s.part, dx: round(s.dx, 1), dy: round(s.dy, 1), localPx: round(local, 1), ratio: round(s.px / local, 1), n: at.n, t: at.t }); continue; }
    events.push({ n: at.n, t: at.t, px: round(s.px, 1), localPx: round(local, 1), ratio: round(s.px / local, 1), part: s.part, dx: round(s.dx, 1), dy: round(s.dy, 1) });
  }
  return events;
}

/** How many steps after step `j` keep at least half the speed of the one before (and at least half the minimum jerk). */
function ballisticChain(steps, j, minPx) {
  let prev = steps[j].px, chain = 0;
  for (let k = j + 1; k < steps.length; k++) {
    const s = steps[k];
    if (!s || s.px < 0.5 * prev || s.px < minPx / 2) break;
    chain++;
    prev = s.px;
  }
  return chain;
}

export function median(a) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y), h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

// ------------------------------------------------------------------ summary and verdicts
// (in continuity-summary.mjs, split out to keep this file under 400 lines; re-exported so nothing that imports it changes)
export { summarize, verdicts, swapBadness, distinctFirst, worstSwaps, continuityReportLine, frameTimeOf } from './continuity-summary.mjs';
