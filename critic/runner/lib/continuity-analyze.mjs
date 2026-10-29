// Continuity harness: from what the probe recorded to the chapter's numbers (CHK-026 and CHK-027).
//
// `anchorsForPoses` decodes every painting the battle used (through whatever `fetchImage` gives it) and finds the head and
// the stance of each, from the registration where there is one and from the silhouette where there is not.
// `analyzeRun` is pure: it takes the probe's records, swap list and pose table plus those anchors and returns the swaps,
// the jerks, the summary and the two checks' results. Nothing here touches a browser.
import { FRAME_MS, analyzeSwap, applyH, detectJerks, distinctFirst, feetPoint, figureTrack, frameTimeOf, headCentre, planeOf, scale1600, summarize, unitSquareToQuad, verdicts, worstSwaps } from './continuity-pure.mjs';
import { anchorsFor, decodeMask } from './continuity-silhouette.mjs';
import { waiverFor } from './continuity-waivers.mjs';
import { STAGED_GAP_FRAMES, groupStaged, stagedStepOf } from './continuity-staged.mjs';
import { tagWash, washPolicy, washReport } from './continuity-wash.mjs';
import { excuseGlideFeet, figureHeightPx, smearPolicy, smearReport, smearedJerk, tagSmears } from './continuity-smear.mjs'; // motion pass (lane "core", step 2): a PLANNED smear is not a snap or a swap jerk (CHK-027)
import { dissolvePolicy, dissolveTravel } from './continuity-dissolve.mjs'; // pc-residues: the weighted head's travel inside a dissolve is not a swap jerk (CHK-027)
import { unseenIn, unseenPolicy } from './continuity-unseen.mjs'; // R63-M1: a figure off the view cannot be seen to jerk or to snap (CHK-027)
import { gapPolicy, startedInGap } from './continuity-gaps.mjs'; // held-chapters lane: a swap whose blend began in a gap of the recording is not a snap
import { analyzeRigSwap, idleBoxOf, rigConfig, rigCoverage } from './continuity-rig.mjs';
import { flickerPairs, flickerSummary, flickerWindowMs, tagFlickers } from './continuity-flicker.mjs'; // post-conference plan, step 2: the ready-idle-ready flicker, a named class (reported, not gated)
import { classReport, prepareClasses } from './continuity-why.mjs'; // fluidity pass, T-02 (lane L5): the named classes, why a painting was asked for, the designed blend (reported; one switchable rule)

/**
 * The anchors of every pose in the probe's pose table (`poses[k] = { url, ... }`), by pose key; null for a pose with no painting. `waivers` (continuity-waivers.mjs) is the ledger of poses
 * the owner (or, for a legacy row, the release driver under his request) has let stand outside a band: each painting it covers carries its waiver (`anchors.waiver`).
 */
export async function anchorsForPoses({ poses, fetchImage, measure, waivers = null }) {
  const masks = new Map();
  const anchors = new Array(poses.length).fill(null);
  const notes = [];
  for (let k = 0; k < poses.length; k++) {
    const p = poses[k];
    if (p.rig) continue; // a rig's key has no painting to read: the page measured it (continuity-rig.mjs)
    if (!p.url) { notes.push(`pose ${p.pose} of figure ${p.fig} has no painting url (a stand-in)`); continue; }
    if (!masks.has(p.url)) {
      try { masks.set(p.url, await decodeMask(await fetchImage(p.url))); } catch (e) { masks.set(p.url, null); notes.push(`could not read ${p.url}: ${String(e).slice(0, 120)}`); }
    }
    const mask = masks.get(p.url);
    if (mask) {
      anchors[k] = anchorsFor({ url: p.url, mask, measure });
      anchors[k].waiver = waiverFor(waivers, anchors[k]);
    }
  }
  if (waivers?.error) notes.push(`could not read the pose waiver ledger ${waivers.path}: ${waivers.error}`);
  return { anchors, notes };
}

/**
 * The head the player really sees in a key of a rigged figure over the idle's, from the pose registration records (`loadPoseMeasure`): the head ratio of the painting the key reproduces
 * (`held.headRatio`, else the sizing rule's `ruled.headRatio`; the same fields `anchorsFor` reads for a painted pose). Null for a key the records do not give.
 */
export function realHeadOfRegistration(measure, subject) {
  return (pose) => {
    const rec = measure?.subjects?.[subject]?.poses?.[pose];
    const v = rec?.held?.headRatio ?? rec?.ruled?.headRatio;
    return Number.isFinite(v) ? v : null;
  };
}

/** The last battle-log event at or before frame `n` (within `within` frames), preferring what moves a figure. */
export function causeOf(logEvents, n, within = 90) {
  const MOVES = new Set(['action-start', 'damage', 'ko', 'heal', 'turn-start', 'spell', 'status', 'phase-change']);
  let best = null;
  for (const e of logEvents) {
    if (e.n > n) break;
    if (n - e.n > within) continue;
    if (!best || MOVES.has(e.type) || !MOVES.has(best.type)) best = e;
  }
  return best ? { type: best.type, actorId: best.actorId ?? null, targetId: best.targetId ?? null, abilityId: best.abilityId ?? null, framesBefore: n - best.n } : null;
}

/**
 * @param {object} o
 * @param {{view:number[], figs:Array, poses:Array, swaps:Array, logEvents:Array, stats:object, errors:string[]}} o.meta  the probe's meta()
 * @param {Array} o.records  the probe's frame records, in order
 * @param {Array} o.anchors  from anchorsForPoses
 * @param {object} o.cfg     policy.json `continuity`
 * @param {{subjects:object}|null} [o.measure] the pose registration records (`loadPoseMeasure`): a rigged figure's change of key that swaps the head (Lulu's front view) is judged by the head the
 *   registration gives the key's painting (R59, decision 146); without it such a change is shown, not judged
 */
export function analyzeRun({ meta, records, anchors, cfg, measure = null }) {
  const k1600 = scale1600(meta.view?.[2] ?? 1600);
  const figs = meta.figs, poses = meta.poses;
  const byFig = new Map();
  const cutFrames = new Set();
  for (const r of records) {
    for (const f of r.f) {
      if (!byFig.has(f.i)) byFig.set(f.i, []);
      byFig.get(f.i).push({ n: r.n, t: r.t, fig: f });
      if (Math.hypot(f.g[0], f.g[1]) * k1600 >= cfg.motion.cutPx) cutFrames.add(r.n);
    }
  }
  const index = new Map();
  for (const [i, list] of byFig) index.set(i, new Map(list.map((e, j) => [e.n, j])));
  const nearCut = (n) => cutFrames.has(n - 1) || cutFrames.has(n) || cutFrames.has(n + 1);
  // W4: the time since the frame before, for every drawn frame of the recording (a gap of frames, the figure hid or the battle paused, has none). It is the frame time that is read on its own
  // (`frameTime`: the percentiles) and the frame each jerk fell on (`frameMs`, `longFrame`).
  const dtOf = new Map(), dts = [];
  for (let i = 1; i < records.length; i++) if (records[i].n === records[i - 1].n + 1) { const dt = records[i].t - records[i - 1].t; dtOf.set(records[i].n, dt); dts.push(dt); }
  const longMs = cfg.motion.longFrameMs ?? 34;
  const frameTime = frameTimeOf(dts, longMs);
  // R63-M1: the time the long frames among the `windowFrames` frames up to and including frame `n` took beyond one frame each: what a stall can have delayed a flip by (continuity-smear.mjs, `elastic`)
  const stallBefore = (n) => { let sum = 0; for (let j = n; j > n - cfg.motion.windowFrames; j--) { const dt = dtOf.get(j); if (dt > longMs) sum += dt - FRAME_MS; } return Math.round(sum * 10) / 10; };
  // W4: the camera's shift of each tracked point (probe version 2) in place of the origin's shift; `tracking.camera: 'origin'` gives the earlier reading back for an old-versus-new run
  const perPoint = (cfg.tracking?.camera ?? 'point') !== 'origin' && (meta.version ?? 1) >= 2;
  const recordAt = (fi, n) => { const j = index.get(fi)?.get(n); return j === undefined ? null : byFig.get(fi)[j]; };
  // r40 instrument edit (a): a figure none of whose paintings has a registered head or stance (a foe or an aeon with no entry in the pose registration)
  // is followed by its silhouette's centroid, not by the middle of the lowest thick part (see `figureTrack`). `tracking.unregistered: 'feet'` in the policy gives the old reading back.
  const registered = new Set();
  poses.forEach((p, k) => { const a = anchors[k]; if (a && (a.head || a.stanceSrc === 'registration')) registered.add(p.fig); });
  const trackingMode = cfg.tracking?.unregistered ?? 'centroid';
  const centroidFigs = new Set(trackingMode === 'centroid' ? figs.map((_, i) => i).filter((i) => !registered.has(i)) : []);
  /** Where the figure is in a frame (its two planes blended by how visible each is): its feet and head, or its centroid when it has no registration; or null. */
  const trackAt = (fi, n) => { const e = recordAt(fi, n); return e ? figureTrack(e.fig, anchors, centroidFigs.has(fi)) : null; };
  /** Where one plane's own feet and head (or centroid, for a figure followed by it) are in a frame, or null. */
  const planeAt = (fi, n, k) => {
    const e = recordAt(fi, n);
    const p = e ? e.fig.s.map(planeOf).find((q) => q && q.k === k) : null;
    const an = anchors[k];
    if (!p || !an) return null;
    const H = unitSquareToQuad(p.q);
    if (centroidFigs.has(fi)) return { feet: null, head: null, centroid: an.centroid ? applyH(H, an.centroid.u, an.centroid.t) : null };
    return { feet: an.stance ? feetPoint(H, an.stance) : null, head: an.head ? headCentre(H, an.head) : null, centroid: null };
  };

  // ---- swaps (every flip of which painting dominates a figure)
  const fadeOf = (fig, k) => fig.s.reduce((m, raw) => { const p = planeOf(raw); return p && p.k === k ? Math.max(m, p.fade) : m; }, 0);
  const swaps = [];
  const unseenP = unseenPolicy(cfg);
  const gapP = gapPolicy(cfg);
  const rigOn = rigConfig(cfg), idleBox = new Map(); // R57-002: a rigged figure's change of key is read by continuity-rig.mjs
  let seq = 0;
  for (const sw of meta.swaps) {
    if (sw.from < 0) continue;
    const list = byFig.get(sw.i) ?? [];
    const at = index.get(sw.i)?.get(sw.n);
    const base = { id: seq++, figure: figs[sw.i]?.id ?? String(sw.i), side: figs[sw.i]?.side ?? null, fromPose: poses[sw.from]?.pose, toPose: poses[sw.to]?.pose, n: sw.n, tMs: sw.t, dtMs: dtOf.get(sw.n) ?? 0, stallMs: stallBefore(sw.n), fi: sw.i, from: sw.from, to: sw.to, cause: causeOf(meta.logEvents, sw.n) };
    const names = { from: poses[sw.from]?.pose, to: poses[sw.to]?.pose };
    if (at === undefined || sw.a < 0.9) { swaps.push({ ...base, startFrame: sw.n, notShowing: true, counted: false, camCut: false, staged: stagedStepOf(anchors[sw.from], anchors[sw.to], cfg, names), head: null, feet: null, outline: null, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null }, blendFrames: 0, snap: false, hardCut: false, failHead: false, failFeet: false }); continue; }
    if (sw.rig) {
      if (!rigOn) continue; // policy continuity.rig is false: the earlier reading, in which a rig had no swaps
      if (!idleBox.has(sw.i)) idleBox.set(sw.i, idleBoxOf(list, poses, sw.i));
      const nextN = meta.swaps.reduce((m, x) => (x.i === sw.i && x.n > sw.n ? Math.min(m, x.n) : m), Infinity); // the window ends where the next change of key begins
      const start = Math.max(0, at - 1), win = [];
      for (let j = start; j < list.length && list[j].n < nextN && j - at <= rigOn.settleFrames; j++) { if (win.length && list[j].n !== win[win.length - 1].n + 1) break; win.push(list[j]); }
      const res = analyzeRigSwap({ frames: win, at: at - start, from: poses[sw.from], to: poses[sw.to], idleBh: idleBox.get(sw.i), k1600, camCut: nearCut(sw.n), cfg, realHead: measure ? realHeadOfRegistration(measure, poses[sw.to].rig ?? poses[sw.from].rig) : null });
      swaps.push({ ...base, startFrame: list[start].n, ...res, notShowing: false, counted: !res.camCut && !res.unmeasured });
      continue;
    }
    // from where the incoming painting first showed (it cannot have been showing longer than the window) to a window after the flip
    let first = at;
    while (first > 0 && at - first < cfg.motion.windowFrames && list[first - 1].n === list[first].n - 1 && fadeOf(list[first - 1].fig, sw.to) > cfg.motion.blendFadeMin) first--;
    const frames = [];
    for (let j = first; j < Math.min(list.length, at + cfg.motion.windowFrames); j++) { if (frames.length && list[j].n !== frames[frames.length - 1].n + 1) break; frames.push(list[j]); }
    const res = analyzeSwap({ frames, at: at - first, swap: { from: sw.from, to: sw.to }, anchors, k1600, camCut: nearCut(sw.n), cfg, names });
    // R63-M1: a swap in a frame in which the figure is off the view is not seen, so it is not a snap (kept as `snapUnseen`); `figurePx` is how tall the figure is drawn there (the planned-smear excuse reads it)
    const unseen = unseenP.excuse && unseenIn(list[at].fig, meta.view, unseenP);
    // held-chapters lane (Ixion XVI's one snap, 4,765 ms of recording missing across a swap): the incoming painting was already showing in the last frame before a gap, so its blend began inside the gap and this recording has no frame of how it was made
    const gapped = gapP.excuse && startedInGap(list, at, sw.to, fadeOf, cfg.motion.blendFadeMin);
    swaps.push({ ...base, startFrame: list[first].n, ...res, ...(unseen ? { unseen: true, snap: false, snapUnseen: res.snap } : {}), ...(gapped ? { gapped: true, snap: false, snapGap: res.snap } : {}), figurePx: figureHeightPx([list[at - 1], list[at]], k1600), notShowing: false, counted: !res.camCut && !res.unmeasured });
  }
  // r40 instrument edit (b): the steps of one twirl are one staged change (chained through every swap, counted or not, so a step under a camera cut does not split it)
  groupStaged(swaps, cfg.staged?.gapFrames ?? STAGED_GAP_FRAMES);
  // motion pass, step 2: a swap that matches a cut the engine logged as a planned smear on a big change is not a snap (continuity-smear.mjs); every other fast swap is judged as before
  const smearP = smearPolicy(cfg);
  const smearTally = tagSmears(swaps, meta.smears, smearP, FRAME_MS);
  // MF-18 (lane pc-scope): a cut the engine anchored (the log entry carries a `glide`) drew the incoming plane back on purpose; the sideways part of its feet reading is excused up to the logged share (continuity-smear.mjs)
  const glideTally = excuseGlideFeet(swaps, smearP, cfg.size);
  // post-conference plan, step 2: a figure that shows A, then B, then A again within a tenth of a second (ready, idle, ready: Chapter IV's 22 in 6.3 minutes) is a FLICKER; both swaps are tagged and the summary counts them
  const flickerMs = flickerWindowMs(cfg), flickerWords = flickerPairs(cfg);
  const flickers = tagFlickers(swaps, flickerMs, flickerWords);
  const classPrep = prepareClasses(swaps, meta.swapLog, cfg); // before the summary: an excused designed blend leaves ghostOverFail (off by default)

  // ---- jerks: every figure's feet and head (or centroid) on every frame
  const jerks = [];
  const dissolveP = dissolvePolicy(cfg);
  for (const [i, list] of byFig) {
    const byC = centroidFigs.has(i);
    const track = list.map((e) => { const tr = figureTrack(e.fig, anchors, byC); return tr ? { n: e.n, t: e.t, feet: tr.feet, head: tr.head, centroid: tr.centroid, cam: e.fig.g, cams: perPoint ? tr.cams : null, unseen: unseenP.excuse && unseenIn(e.fig, meta.view, unseenP) } : null; });
    const evs = detectJerks(track.map((s) => s ?? { n: -10, t: 0, feet: null, head: null, centroid: null, cam: [0, 0] }), k1600, cfg);
    const mine = swaps.filter((s) => s.fi === i);
    for (const e of evs) {
      const near = (s) => e.n >= s.startFrame - 1 && e.n <= s.n + 2;
      const atSwap = mine.some(near);
      const stagedAt = mine.find((s) => s.staged && near(s));
      const frameMs = dtOf.has(e.n) ? Math.round(dtOf.get(e.n) * 10) / 10 : null;
      // `kind` (W4, the CHK-027 split): a jerk AT a pose swap is gateable; a mid-move DASH (a lunge, a recoil, a hop) is reported; a mid-move step of `jerks.teleportPx` or more is a TELEPORT (no
      // lunge covers its whole reach in one frame) and is gated like a swap's. `longFrame`: it fell on a frame longer than `motion.longFrameMs`.
      // R63-M1 (`jerks.commonMode`): the engine swaps the pose on the FASTEST frame of a move by design (Bailey 2026-10-22, "Cut on the motion peak"), so the first frames of a lunge fall inside the swap's
      // blend and the figure's own travel (head and feet moving together: Auron's swing is 101 px in one frame, the real clip 67 ms) was read as the swap's jerk. A dissolve of several frames moves the
      // weighted point by a fraction of the distance between the two heads each frame, so a one-frame step in one is the figure travelling: where NO swap near the jerk is a hard cut, and the pose-change part
      // of the step (the head against the feet, `relPx`) is under the jerk limit and at most half of it, the step is a dash (a teleport at `teleportPx`), reported and not gated, as a lunge is anywhere
      // else. A hard cut that also moves the whole figure (a plane drawn off its registration) is the swap's own and stays gated.
      const commonMode = atSwap && cfg.jerks?.commonMode === true && typeof e.relPx === 'number' && e.relPx < cfg.motion.jerkFailPx && e.relPx <= 0.5 * e.px && !mine.some((s) => near(s) && s.hardCut);
      const kind = atSwap && !commonMode ? 'swap' : cfg.jerks?.teleportPx && e.px >= cfg.jerks.teleportPx ? 'teleport' : 'dash';
      const smeared = kind === 'swap' ? smearedJerk(e, mine.find((s) => s.smear && near(s)), smearP) : null; // a jerk AT a planned smear's cut, no bigger than the policy's cap (maxJerkPx, or maxJerkShare of the drawn height)
      const dissolve = kind === 'swap' && !smeared && !stagedAt ? dissolveTravel({ jerk: e, swap: mine.find((s) => near(s) && !s.hardCut && s.counted), frames: list, policy: dissolveP }) : null; // pc-residues: Kimahri follow to idle, Tidus hurt to critical
      jerks.push({ ...e, figure: figs[i]?.id ?? String(i), fi: i, atSwap, ...(dissolve ? { dissolveTravel: dissolve } : {}), ...(commonMode ? { commonMode: true } : {}), kind, frameMs, longFrame: frameMs !== null && frameMs > longMs, ...(stagedAt ? { staged: { kind: stagedAt.staged.kind, seq: stagedAt.staged.seq } } : {}), ...(smeared ? { smeared } : {}), cause: causeOf(meta.logEvents, e.n, 60) });
    }
  }
  jerks.sort((a, b) => b.px - a.px).forEach((j, id) => { j.id = id; });
  // r43 (FOC40-02): a jerk whose step happened under the Save Sphere's wash carries what was over it (`wash`) and, when the policy excuses it, `covered`: it stays in `jerks` (so the
  // report shows it) and is left out of the summary, the verdict and the worst-jerk strips, as a jerk under a camera cut never gets that far (continuity-wash.mjs).
  const wash = washPolicy(cfg);
  tagWash(jerks, { records, alpha: meta.wash?.alpha ?? null, policy: wash });
  // pc-residues (method check step 2, Rikku's twirl): the keys of the spherechange's twirl are CUT to each other by design (Bailey's D-322 and P4, kept stepped on 2026-10-10), the harness already
  // reads such a cut as a costume change and not as a snap or a swap, and its jerk was still gated as a pose swap's. A jerk AT a staged step that is no bigger than `staged.jerkExcusePx`
  // (the policy's, 0 turns it off) is the twirl working as designed: reported (`stagedExcused`, motion.jerksStagedExcused) and not gated; a bigger one (a key painting placed far from its
  // neighbour) stays a swap jerk.
  const stagedExcusePx = Number.isFinite(cfg.staged?.jerkExcusePx) ? cfg.staged.jerkExcusePx : 0;
  for (const j of jerks) if (j.staged && j.kind === 'swap' && !j.smeared && j.px <= stagedExcusePx) j.stagedExcused = true;
  const visibleJerks = jerks.filter((j) => !j.covered && !j.smeared && !j.stagedExcused && !j.dissolveTravel), coveredJerks = jerks.filter((j) => j.covered), smearedJerks = jerks.filter((j) => j.smeared && !j.covered);
  const stagedExcusedJerks = jerks.filter((j) => j.stagedExcused && !j.covered);
  const dissolveJerks = jerks.filter((j) => j.dissolveTravel && !j.covered);

  const battleSeconds = meta.stats?.battleSeconds ?? 0;
  const smear = smearReport({ tally: smearTally, jerks, policy: smearP, smears: meta.smears, glide: glideTally });
  const summary = summarize({ swaps, jerks: visibleJerks, coveredJerks, smearedJerks, stagedExcusedJerks, dissolveJerks, smear, battleSeconds, cfg, frameTime });
  summary.flickers = flickerSummary(flickers, { battleSeconds, totalGhostFrames: summary.motion.ghostFrames, windowMs: flickerMs, pairs: flickerWords });
  summary.classes = classReport(swaps, { battleSeconds, totalGhostFrames: summary.motion.ghostFrames, prepared: classPrep, swapLog: meta.swapLog });
  const run = { fps: meta.stats?.fps ?? null, error: meta.errors?.length ? meta.errors[0] : null };
  summary.checks = verdicts(summary, cfg, run);
  summary.run = { fps: run.fps, maxDtMs: meta.stats?.maxDtMs ?? null, slowFrames: meta.stats?.slowFrames ?? null, frames: meta.stats?.battleFrames ?? null, probeErrors: meta.errors?.length ?? 0 };

  // ---- who was measured how (so a reader can see what a PASS rests on)
  const perFigure = {};
  for (const s of swaps.filter((x) => x.counted)) {
    const f = (perFigure[s.figure] ??= { swaps: 0, headRegistered: 0, headRig: 0, massRead: 0, worstHeadPct: 0, worstMassPct: 0, worstFeetPx: 0, snaps: 0, sizeOver: 0, feetOver: 0, heightOver: 0, feetSilOver: 0, minStature: null });
    f.swaps++;
    if (s.head && s.head.ratio !== null) {
      const pct = Math.round(Math.abs(s.head.ratio - 1) * 1000) / 10;
      if (s.head.source === 'registration') { f.headRegistered++; f.worstHeadPct = Math.max(f.worstHeadPct, pct); } else if (s.head.source === 'rig' && s.head.metric === 'head') { f.headRig++; f.worstHeadPct = Math.max(f.worstHeadPct, pct); } else { f.massRead++; f.worstMassPct = Math.max(f.worstMassPct, pct); }
    }
    if (s.feet && s.feet.standing) f.worstFeetPx = Math.max(f.worstFeetPx, s.feet.px);
    if (s.snap) f.snaps++;
    if (s.failHead) f.sizeOver++;
    if (s.failFeet) f.feetOver++;
    // W4: the readings from the pixels, per figure: how many swaps put a pose outside its height band or the silhouette's feet off the floor, and the lowest stature seen
    if (s.failHeight) f.heightOver++;
    if (s.failFeetSil) f.feetSilOver++;
    if (s.height?.stature != null) f.minStature = f.minStature === null ? s.height.stature : Math.min(f.minStature, s.height.stature);
  }
  const coverage = {
    figures: figs.map((f) => f.id),
    measuredWithRegistration: Object.entries(perFigure).filter(([, v]) => v.headRegistered > 0).map(([k]) => k),
    measuredFromRig: Object.entries(perFigure).filter(([, v]) => v.headRig > 0).map(([k]) => k), // R57-002: the head read from a rig's own head mesh
    measuredFromSilhouetteOnly: Object.entries(perFigure).filter(([, v]) => v.headRegistered === 0 && v.headRig === 0).map(([k]) => k),
    rigs: rigCoverage({ figs, poses, swaps }),
    posesWithAnchors: anchors.filter(Boolean).length, posesTotal: poses.length, staleRegistrationRecords: anchors.filter((a) => a?.stale).length,
    // r40 instrument edit (a): who was followed by their centroid, and so whose jerks are not "feet" readings
    tracking: trackingMode,
    trackedByCentroid: [...centroidFigs].filter((i) => poses.some((p, k) => p.fig === i && anchors[k]?.centroid)).map((i) => figs[i]?.id ?? String(i)),
    // W4: which class the pose was judged in, whether a fresh registration record backs it, and the waiver (if any) that lets it stand outside its band
    unregistered: poses.map((p, k) => (anchors[k]?.subject && anchors[k].registered === false ? `${anchors[k].subject}/${anchors[k].pose}` : null)).filter(Boolean),
    waived: poses.map((p, k) => (anchors[k]?.waiver ? { pose: `${anchors[k].subject}/${anchors[k].pose}`, legacy: anchors[k].waiver.legacy, shaChecked: anchors[k].waiver.shaChecked } : null)).filter(Boolean),
    poses: poses.map((p, k) => ({ figure: figs[p.fig]?.id ?? String(p.fig), pose: p.pose, url: p.url, head: anchors[k]?.head ? 'registration' : null, stance: anchors[k]?.stanceSrc ?? null, prone: anchors[k]?.prone ?? null, class: anchors[k]?.cls ?? null, registered: anchors[k]?.registered ?? null, waived: Boolean(anchors[k]?.waiver) })),
  };

  const worst = {
    swaps: worstSwaps(swaps, cfg.strips.worstSwaps, cfg).map((s) => s.id),
    jerks: distinctFirst(visibleJerks, (j) => `${j.figure}|${j.atSwap}|${j.part}`, cfg.strips.worstJerks).map((j) => j.id),
  };
  const taken = new Set(worst.swaps);
  const ghostly = swaps.filter((s) => s.counted && s.ghost.frames > 0 && !taken.has(s.id)).sort((a, b) => b.ghost.severity - a.ghost.severity);
  worst.ghosts = distinctFirst(ghostly, (s) => `${s.figure}|${s.fromPose}|${s.toPose}`, cfg.strips.worstGhosts).map((s) => s.id);
  return { swaps, jerks, summary, perFigure, coverage, worst, frameMs: FRAME_MS, cameraCuts: [...cutFrames].sort((x, y) => x - y), wash: washReport({ records, meta, policy: wash, jerks }), smear, access: { trackAt, planeAt, recordAt } };
}
