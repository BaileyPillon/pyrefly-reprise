// Continuity harness: a RIGGED figure's pose changes (CHK-026 size continuity across pose changes, CHK-027 continuity of motion; R57-002 of the release 57 focused review).
//
// The probe (continuity-probe.mjs, with continuity-rig-probe.mjs in the page) records a rigged figure as a figure whose pose is the rig's KEY and whose every frame carries `rg`: where
// its head, feet and centroid are drawn, where they are in the idle plane's own coordinates, the area of its head mesh and of all its parts, and the painted box of the key. This module
// reads that back. Release 57 and every release before it read a rigged figure's plane, which a rig never draws: no swap, no stature, no feet, 0 px everywhere, and a rigged knock-out
// was invisible to the checks (the harness's PASS measured nothing; `tools/rig/lane/track.mjs` documents it from the Kimahri and Lulu handoffs).
//
//   rigTrack         the figure's head, feet and centroid in one frame, in the shape `figureTrack` returns for a painted figure (continuity-pure.mjs calls it), so the jerk detector,
//                    the strips' marks and the per-frame tracks read a rig as they read a painting
//   analyzeRigSwap   everything CHK-026 and CHK-027 say about one change of key, in the shape `analyzeSwap` returns for a change of painting, so the summary, the verdicts and the worst-swap
//                    ranking need no second code path
//   rigProbeConfig   what the page-side reader is told (landmark names, the head part); `cfg.rig === false` in the policy gives the earlier reading back, an old-versus-new run of one recording
//
// What a change of key is judged on. A painted swap is instantaneous, so its two paintings are read through their two planes in ONE frame and the stage's motion and the camera cancel. A move
// between two keys takes time (`ms` of the key, 120 by default), during which the figure may lunge, recoil or be carried by the camera, so a rig is read the way a painted swap is by taking
// out what the stage did: both readings are in the idle plane's OWN coordinates (the master's pixels over its size), where only the pose is. They are taken at the last frame before the
// change and at the first frame after it in which no move is in flight (`settled`):
//   HEAD     the head part's mesh area before and after, as a linear size (its square root), judged at the registered tolerance (`size.headTolerancePct`, 3 percent): the rig's gate keeps the head
//            at 1.0000 by construction, so this reads the build, not a table. Where the head part is not drawn in either key the whole figure's mesh area is read instead, `metric: 'mass'`,
//            judged at the coarse tolerance, as a painted pose with no registered head is.
//            Only between two keys that show THE SAME head (R59, decision 146). A key may bring in another part that carries a head in front of the head part (Lulu's front-view upper body in
//            `defend` and `od-fury`; the page-side reader names it, `rg.hv`): the head part is then a side head the rig shrinks and tucks behind the front view, and its mesh area is a bookkeeping number
//            of the rig (0.80 and its inverse 1.25 in Lulu's two keys), not a head anyone sees change. Such a change of key is `metric: 'variant'`: the mesh ratio is not read, and the key is
//            judged by the head the player really sees over the idle's (`headReal`, the owner-reviewed registration of the painting the key reproduces, `ruled.headRatio`) against its pose
//            class's band (`BANDS[class].head`, 0.85 to 1.15), the band a painted pose is judged in. With no registration for the key it is shown, not judged.
//   FEET     the lowest foot the gate stamped for each key, in the plane's coordinates, mapped through the plane as drawn after the change: the vertical gap (the ground line) is judged at the
//            silhouette reading's tolerance (2 percent of the figure's height, never under 6 px at 1600 wide: `feetSilhouetteTolerancePx`), the sideways gap is shown, not judged (the lowest foot
//            is the near foot in one key and the far foot in another, which is not the figure sliding). Only for two PLANTED keys: a knock-out and a key that leaves the ground by design
//            (`notPlanted`: jump, overdrive) are shown, not judged, as a lying painting is.
//   HEIGHT   the key's painted box over the idle's, from the same stamped boxes, judged in the band of the pose's class as a painted pose is (`pose-bands.mjs`), a knock-out's LENGTH report-only.
// Mid-move jerks are CHK-027's (`detectJerks` over `rigTrack`), in the same split as a painted figure's: AT the key change they are gateable, mid-move dashes are reported.
// Pure: plain numbers in, plain numbers out.
//
// Game case: both (shared critic plumbing; FFX's Kimahri, Lulu and aeons and Valefor, which FFX-2's Besaid chapter shares, are the rigs there are).
import { BANDS, READ_SLACK, SLACK } from '../../../tools/posescale/pose-bands.mjs';
import { isPropsOut, poseClassOf, subjectKind } from '../../../tools/posescale/pose-kinds.mjs';
import { feetSilhouetteTolerancePx, statureBandOf } from './continuity-readings.mjs';

export const RIG_DEFAULTS = Object.freeze({
  head: ['headCenter', 'head'],
  centroid: ['bodyCenter', 'pelvisCenter', 'chestCenter'],
  feet: ['soleN', 'soleF', 'soleL', 'soleR', 'toeN', 'toeF', 'feet'],
  headPart: 'head',
  /** The landmark of the top of the head (rigs-v3): with the feet it is the figure's stature head to soles, as a painted figure's is read (`tu` in the probe). A rig with none is read by its painted box, as before. */
  crown: ['crown', 'headTop'],
  /** Parts other than the head part that carry a head when a key brings them in (Lulu's front-view upper body: `front` in format v2, `fdef` and `fod` in version 1), and the share of the idle plane's area at which one counts as drawn (a version 1 rig stores such a part as an always-visible speck). */
  headVariants: ['front', 'fdef', 'fod'],
  variantMinArea: 0.02,
  settleFrames: 120,
  notPlanted: ['jump', 'overdrive'],
});

/** The rig block of the policy over the defaults, or null when the policy switches rig reading off (`rig: false`). */
export function rigConfig(cfg) {
  if (cfg?.rig === false) return null;
  const own = cfg?.rig && typeof cfg.rig === 'object' ? cfg.rig : {};
  return { ...RIG_DEFAULTS, ...own };
}

/** What the page-side reader needs (`createRigReader`), or null when rig reading is off. */
export function rigProbeConfig(cfg) {
  const r = rigConfig(cfg);
  return r ? { head: r.head, centroid: r.centroid, feet: r.feet, crown: r.crown, headPart: r.headPart, headVariants: r.headVariants, variantMinArea: r.variantMinArea } : null;
}

const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const pair = (p) => (Array.isArray(p) && p.length === 2 && finite(p[0]) && finite(p[1]) ? p : null);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const outside = (v, [lo, hi], slack = SLACK) => finite(v) && (v < lo - slack || v > hi + slack);

/** One frame's `rg` as the track a painted figure has: its feet, head and centroid on the screen, and the camera's own shift of each (`cs`, present only while the camera moved). Null with no `rg`. */
export function rigTrack(rg) {
  if (!rg) return null;
  const cs = Array.isArray(rg.cs) && rg.cs.length === 6 ? rg.cs : null;
  const feet = pair(rg.f), head = pair(rg.h), centroid = pair(rg.c);
  if (!feet && !head && !centroid) return null;
  return { feet, head, centroid, cams: { head: cs && head ? [cs[0], cs[1]] : null, feet: cs && feet ? [cs[2], cs[3]] : null, centroid: cs && centroid ? [cs[4], cs[5]] : null } };
}

/** The idle's painted box over the plane's height for one figure, from the frames in which its idle was showing and no move was in flight (the median of them); null when it never was. */
export function idleBoxOf(list, poses, fi) {
  const v = [];
  for (const e of list) {
    const rg = e.fig.rg, k = e.fig.s?.[0]?.[0];
    if (rg && !rg.b && finite(rg.bh) && poses[k]?.pose === 'idle' && poses[k]?.fig === fi) v.push(rg.bh);
  }
  return median(v);
}

/** The figure read head to soles in the idle plane's own units: the plane's `t` of its feet over the crown's (rigs-v3), or null with no crown or no feet in the frame. */
export const bodyOf = (rg) => { const f = pair(rg?.fu), t = pair(rg?.tu); return f && t && f[1] > t[1] ? f[1] - t[1] : null; };

/** The idle's stature head to soles in the plane's own units (the median of the frames in which its idle was showing and no move was in flight); null when the rig has no crown reading. */
export function idleBodyOf(list, poses, fi) {
  const v = [];
  for (const e of list) {
    const rg = e.fig.rg, k = e.fig.s?.[0]?.[0], b = rg && !rg.b ? bodyOf(rg) : null;
    if (b !== null && poses[k]?.pose === 'idle' && poses[k]?.fig === fi) v.push(b);
  }
  return median(v);
}

/**
 * Everything CHK-026 and CHK-027 say about one change of rig key, from the figure's frames around it.
 * @param {object} o
 * @param {Array<{n:number, t:number, fig:object}>} o.frames consecutive frames of the figure, from the one before the change to the end of its window (the next change of key, or `settleFrames`)
 * @param {number} o.at      the index in `frames` of the frame the key changed in
 * @param {{pose:string, rig:string}} o.from the key the figure left; o.to the key it went to
 * @param {number|null} o.idleBh the idle's painted box over the plane's height (`idleBoxOf`)
 * @param {number|null} [o.idleBody] the idle's stature head to soles in the plane's units (`idleBodyOf`); with it and a crown reading in the key, the stature is read head to soles (rigs-v3), as a painted figure's is, props out
 * @param {number} o.k1600 px scale to a 1600-wide canvas
 * @param {boolean} o.camCut a camera cut or whip near the change
 * @param {object} o.cfg the policy's `continuity` block
 * @param {((pose:string) => number|null)|null} [o.realHead] the head the player really sees in a key over the idle's, from the owner-reviewed registration of the painting the key reproduces
 *   (`realHeadOfRegistration`); read only for a change of key that swaps the head (see HEAD above). Absent or null for a key: that key's head is shown, not judged.
 * @returns {object} the swap's analysis, shaped as `analyzeSwap`'s
 */
export function analyzeRigSwap({ frames, at, from, to, idleBh, idleBody = null, k1600, camCut, cfg, realHead = null }) {
  const rc = rigConfig(cfg) ?? RIG_DEFAULTS;
  const rgOf = (e) => (e && e.fig ? e.fig.rg ?? null : null);
  const out = {
    camCut: Boolean(camCut), costume: false, sameArt: false, range: false, staged: null,
    head: null, feet: null, outline: null, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null }, blendFrames: 0,
    held: { frames: 0, ms: 0, from: null }, snap: false, snapStaged: false, hardCut: false, failHead: false, failFeet: false,
    height: null, feetSil: null, headReal: null, failHeight: false, failFeetSil: false, failRealHead: false, unregistered: false,
    rig: { name: to.rig ?? from.rig ?? null, fromKey: from.pose, toKey: to.pose, settled: false, framesToSettle: null, headMetric: null },
  };
  const before = rgOf(frames[at - 1]) ?? rgOf(frames[at]);
  const swapRg = rgOf(frames[at]);
  if (!before || !swapRg) return { ...out, unmeasured: 'the figure was not recorded on both sides of the key change' };
  // the first frame from the change in which no move between keys is in flight; a change that interrupted another (or ran into the next one) never settled and its feet are not read
  let settledAt = -1;
  for (let j = at; j < frames.length; j++) { const g = rgOf(frames[j]); if (!g) break; if (!g.b) { settledAt = j; break; } }
  const settled = settledAt >= 0;
  const afterAt = settled ? settledAt : frames.length - 1;
  const after = rgOf(frames[afterAt]) ?? swapRg;
  out.rig.settled = settled;
  out.rig.framesToSettle = settled ? settledAt - at : null;
  let moving = 0;
  for (let j = at; j < (settled ? settledAt : frames.length); j++) if (rgOf(frames[j])?.b) moving++;
  out.blendFrames = moving;
  out.hardCut = moving === 0;
  const kind = subjectKind(out.rig.name ?? '');
  const cls = (pose) => poseClassOf({ pose, isRef: pose === 'idle', prone: false, kind });
  const judged = cls(from.pose) !== 'staged' && cls(to.pose) !== 'staged';

  // --- size: the head part's mesh, before and after, in the plane's own units (a camera or a lunge in between cannot move it); the figure's whole mesh where a key hides the head
  const lin = (rg, key) => (finite(rg?.[key]) && rg[key] > 0 && finite(rg.pw) && finite(rg.ph) ? Math.sqrt(rg[key] * rg.pw * rg.ph) * k1600 : null);
  const bothHead = finite(before.ha) && before.ha > 0 && finite(after.ha) && after.ha > 0;
  const bothMass = finite(before.ma) && before.ma > 0 && finite(after.ma) && after.ma > 0;
  const hvBefore = typeof before.hv === 'string' ? before.hv : null, hvAfter = typeof after.hv === 'string' ? after.hv : null;
  const swapsHead = hvBefore !== hvAfter; // one key shows a head the other does not (or two different ones): the head part's mesh is not what the player sees change
  const metric = swapsHead ? 'variant' : bothHead ? 'head' : bothMass ? 'mass' : null;
  if (metric === 'variant') {
    // the head the player really sees, in the key that brings the variant in (idle is the reference, 1), against the band of that key's class
    const sides = [[hvBefore, from.pose], [hvAfter, to.pose]].filter(([hv]) => hv !== null).map(([hv, pose]) => ({ hv, pose, real: pose === 'idle' ? 1 : realHead ? realHead(pose) : null }));
    const read = sides.length > 0 && sides.every((x) => finite(x.real));
    const ratio = read ? (sides.length === 1 ? sides[0].real : round(realHead(to.pose) / realHead(from.pose), 4)) : null;
    out.head = { fromPx: null, toPx: null, ratio: null, source: 'rig', metric: 'variant', label: 'front view', variant: { from: hvBefore, to: hvAfter } };
    out.rig.headMetric = 'variant';
    if (read) {
      const bandOf = (pose) => BANDS[cls(pose)]?.head ?? BANDS.standing.head;
      const worst = sides.map((x) => ({ ...x, band: bandOf(x.pose) })).sort((a, b) => Math.abs(b.real - 1) - Math.abs(a.real - 1))[0];
      const outsideBand = sides.some((x) => outside(x.real, bandOf(x.pose)));
      out.headReal = { ratio: round(ratio, 4), fromHeld: null, toHeld: null, costPct: round((ratio - 1) * 100, 1), band: worst.band, outsideBand, waived: null, source: 'registration', variant: { from: hvBefore, to: hvAfter } };
      out.failRealHead = judged && outsideBand;
    }
  } else if (metric) {
    const key = metric === 'head' ? 'ha' : 'ma';
    const ratio = Math.sqrt(after[key] / before[key]);
    out.head = { fromPx: round(lin(before, key) ?? 0, 1), toPx: round(lin(after, key) ?? 0, 1), ratio: round(ratio, 4), source: 'rig', metric, label: metric === 'head' ? 'rig' : 'mass' };
    out.failHead = judged && Math.abs(ratio - 1) > (metric === 'head' ? cfg.size.headTolerancePct : cfg.size.headTolerancePctCoarse) / 100;
    out.rig.headMetric = metric;
  }

  // --- feet: where the planted figure stands, before and after, in the plane's coordinates (the pose's own move, not the stage's), as the plane is drawn after
  const planted = (pose) => cls(pose) !== 'ko' && !rc.notPlanted.includes(pose);
  const figurePx = Math.max(finite(before.bh) && finite(before.ph) ? before.bh * before.ph : 0, finite(after.bh) && finite(after.ph) ? after.bh * after.ph : 0) * k1600;
  const fb = pair(before.fu), fa = pair(after.fu);
  if (settled && !before.b && fb && fa && finite(after.pw) && finite(after.ph)) {
    const dx = (fa[0] - fb[0]) * after.pw * k1600, dy = (fa[1] - fb[1]) * after.ph * k1600;
    const standing = planted(from.pose) && planted(to.pose);
    const tol = feetSilhouetteTolerancePx(cfg, figurePx);
    // `px` is the part that judges (the ground line); the sideways gap is shown beside it
    out.feet = { dx: round(dx, 1), dy: round(dy, 1), px: round(Math.abs(dy), 1), sidewaysPx: round(Math.abs(dx), 1), standing, source: 'rig', gate: 'dy', gatePx: round(Math.abs(dy), 1), tolerancePx: tol };
    out.failFeet = judged && standing && Math.abs(dy) > tol;
  }

  // --- height: the key's painted box over the idle's (the stamped boxes read back through the plane), in the band of its class
  const ref = idleBh ?? (from.pose === 'idle' && finite(before.bh) ? before.bh : to.pose === 'idle' && finite(after.bh) ? after.bh : null);
  if (judged && ref > 0 && finite(before.bh) && finite(after.bh)) {
    const hf = before.bh * (before.ph ?? 0) * k1600, ht = after.bh * (after.ph ?? 0) * k1600;
    const h = { fromPx: round(hf, 1), toPx: round(ht, 1), ratio: round(after.bh / before.bh, 4), vs: 'pair', pose: null, side: null, class: `${cls(from.pose)}>${cls(to.pose)}`, stature: null, length: null, band: null, flags: [], report: [], waived: null, source: 'rig' };
    const idleSide = from.pose === 'idle' ? 'from' : to.pose === 'idle' ? 'to' : null;
    const side = idleSide === 'from' ? 'to' : idleSide === 'to' ? 'from' : null;
    if (side) {
      const key = side === 'to' ? to.pose : from.pose, rg = side === 'to' ? after : before;
      Object.assign(h, { vs: 'idle', pose: key, side, class: cls(key) });
      if (h.class === 'standing' || h.class === 'low') {
        // rigs-v3: with a crown reading the figure is read head to soles (the crown to the stamped foot, in the plane's own units), as the painted path reads it and as the gate does: the key's whole painted box counts a raised weapon
        // as height (Rikku's cast reads 1.19 by the box and 0.98 head to soles) and a blade swung low as length; without one (a rig with no crown landmark, a recording from before) the box is what it was, props out unread
        const own = bodyOf(rg);
        if (own !== null && finite(idleBody) && idleBody > 0) { h.stature = round(own / idleBody, 4); h.basis = 'body'; }
        else if (isPropsOut(key)) h.report.push('props-out-unread'); // a raised weapon is counted as height by the box; the gate reads these head to soles
        else h.stature = round(rg.bh / ref, 4);
        if (h.stature !== null) {
          h.band = statureBandOf(h.class, key);
          // the key being judged must have settled: a stature read mid-move is the move's, not the key's
          const keySettled = side === 'to' ? settled : !before.b;
          if (keySettled && outside(h.stature, h.band, SLACK + READ_SLACK)) h.flags.push(h.stature < h.band[0] ? 'stature-low' : 'stature-high');
        }
      } else if (h.class === 'ko' && finite(rg.bw)) {
        h.length = round(rg.bw / ref, 4);
        if (outside(h.length, BANDS.ko.length, 0)) h.report.push(h.length < BANDS.ko.length[0] ? 'ko-short' : 'ko-long');
      }
    }
    out.height = h;
    out.failHeight = h.flags.length > 0;
  }

  // --- what the pose itself moved (shown, not judged): the head and the centroid in the plane's coordinates, px at 1600 wide
  const moved = (key) => { const a = pair(before[key]), b = pair(after[key]); return a && b && finite(after.pw) && finite(after.ph) ? { dx: round((b[0] - a[0]) * after.pw * k1600, 1), dy: round((b[1] - a[1]) * after.ph * k1600, 1) } : null; };
  out.rig.moved = { head: moved('hu'), centroid: moved('cu') };

  // A snap is a cut that shows: no in-between frame, and the figure jumps (its centroid in the plane, its head or its feet).
  const jump = (() => { const a = pair(before.cu), b = pair(swapRg.cu); return a && b && finite(swapRg.pw) && finite(swapRg.ph) ? Math.hypot((b[0] - a[0]) * swapRg.pw, (b[1] - a[1]) * swapRg.ph) * k1600 : 0; })();
  out.rig.cutJumpPx = round(jump, 1);
  out.snap = out.hardCut && (jump >= cfg.motion.snapCentroidMinPx || out.failHead || out.failFeet);
  return out;
}

/** Which figures were drawn by a rig, with the keys each was seen in and how many changes of key were read: for the report's coverage. */
export function rigCoverage({ figs, poses, swaps }) {
  const rows = [];
  figs.forEach((f, i) => {
    if (!f.rig) return;
    const keys = poses.filter((p) => p.fig === i && p.rig).map((p) => p.pose);
    const mine = swaps.filter((s) => s.fi === i);
    rows.push({ figure: f.id, rig: f.rig, keys, swaps: mine.length, counted: mine.filter((s) => s.counted).length, settled: mine.filter((s) => s.rig?.settled).length, headMeasured: mine.filter((s) => s.counted && s.head).length, feetMeasured: mine.filter((s) => s.counted && s.feet).length });
  });
  return rows;
}
