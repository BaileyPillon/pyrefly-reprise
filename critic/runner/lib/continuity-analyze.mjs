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
import { analyzeRigSwap, idleBoxOf, rigConfig, rigCoverage } from './continuity-rig.mjs';

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
 */
export function analyzeRun({ meta, records, anchors, cfg }) {
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
  const rigOn = rigConfig(cfg), idleBox = new Map(); // R57-002: a rigged figure's change of key is read by continuity-rig.mjs
  let seq = 0;
  for (const sw of meta.swaps) {
    if (sw.from < 0) continue;
    const list = byFig.get(sw.i) ?? [];
    const at = index.get(sw.i)?.get(sw.n);
    const base = { id: seq++, figure: figs[sw.i]?.id ?? String(sw.i), side: figs[sw.i]?.side ?? null, fromPose: poses[sw.from]?.pose, toPose: poses[sw.to]?.pose, n: sw.n, tMs: sw.t, fi: sw.i, from: sw.from, to: sw.to, cause: causeOf(meta.logEvents, sw.n) };
    const names = { from: poses[sw.from]?.pose, to: poses[sw.to]?.pose };
    if (at === undefined || sw.a < 0.9) { swaps.push({ ...base, startFrame: sw.n, notShowing: true, counted: false, camCut: false, staged: stagedStepOf(anchors[sw.from], anchors[sw.to], cfg, names), head: null, feet: null, outline: null, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null }, blendFrames: 0, snap: false, hardCut: false, failHead: false, failFeet: false }); continue; }
    if (sw.rig) {
      if (!rigOn) continue; // policy continuity.rig is false: the earlier reading, in which a rig had no swaps
      if (!idleBox.has(sw.i)) idleBox.set(sw.i, idleBoxOf(list, poses, sw.i));
      const nextN = meta.swaps.reduce((m, x) => (x.i === sw.i && x.n > sw.n ? Math.min(m, x.n) : m), Infinity); // the window ends where the next change of key begins
      const start = Math.max(0, at - 1), win = [];
      for (let j = start; j < list.length && list[j].n < nextN && j - at <= rigOn.settleFrames; j++) { if (win.length && list[j].n !== win[win.length - 1].n + 1) break; win.push(list[j]); }
      const res = analyzeRigSwap({ frames: win, at: at - start, from: poses[sw.from], to: poses[sw.to], idleBh: idleBox.get(sw.i), k1600, camCut: nearCut(sw.n), cfg });
      swaps.push({ ...base, startFrame: list[start].n, ...res, notShowing: false, counted: !res.camCut && !res.unmeasured });
      continue;
    }
    // from where the incoming painting first showed (it cannot have been showing longer than the window) to a window after the flip
    let first = at;
    while (first > 0 && at - first < cfg.motion.windowFrames && list[first - 1].n === list[first].n - 1 && fadeOf(list[first - 1].fig, sw.to) > cfg.motion.blendFadeMin) first--;
    const frames = [];
    for (let j = first; j < Math.min(list.length, at + cfg.motion.windowFrames); j++) { if (frames.length && list[j].n !== frames[frames.length - 1].n + 1) break; frames.push(list[j]); }
    const res = analyzeSwap({ frames, at: at - first, swap: { from: sw.from, to: sw.to }, anchors, k1600, camCut: nearCut(sw.n), cfg, names });
    swaps.push({ ...base, startFrame: list[first].n, ...res, notShowing: false, counted: !res.camCut && !res.unmeasured });
  }
  // r40 instrument edit (b): the steps of one twirl are one staged change (chained through every swap, counted or not, so a step under a camera cut does not split it)
  groupStaged(swaps, cfg.staged?.gapFrames ?? STAGED_GAP_FRAMES);

  // ---- jerks: every figure's feet and head (or centroid) on every frame
  const jerks = [];
  for (const [i, list] of byFig) {
    const byC = centroidFigs.has(i);
    const track = list.map((e) => { const tr = figureTrack(e.fig, anchors, byC); return tr ? { n: e.n, t: e.t, feet: tr.feet, head: tr.head, centroid: tr.centroid, cam: e.fig.g, cams: perPoint ? tr.cams : null } : null; });
    const evs = detectJerks(track.map((s) => s ?? { n: -10, t: 0, feet: null, head: null, centroid: null, cam: [0, 0] }), k1600, cfg);
    const mine = swaps.filter((s) => s.fi === i);
    for (const e of evs) {
      const near = (s) => e.n >= s.startFrame - 1 && e.n <= s.n + 2;
      const atSwap = mine.some(near);
      const stagedAt = mine.find((s) => s.staged && near(s));
      const frameMs = dtOf.has(e.n) ? Math.round(dtOf.get(e.n) * 10) / 10 : null;
      // `kind` (W4, the CHK-027 split): a jerk AT a pose swap is gateable; a mid-move DASH (a lunge, a recoil, a hop) is reported; a mid-move step of `jerks.teleportPx` or more is a TELEPORT (no
      // lunge covers its whole reach in one frame) and is gated like a swap's. `longFrame`: it fell on a frame longer than `motion.longFrameMs`.
      const kind = atSwap ? 'swap' : cfg.jerks?.teleportPx && e.px >= cfg.jerks.teleportPx ? 'teleport' : 'dash';
      jerks.push({ ...e, figure: figs[i]?.id ?? String(i), fi: i, atSwap, kind, frameMs, longFrame: frameMs !== null && frameMs > longMs, ...(stagedAt ? { staged: { kind: stagedAt.staged.kind, seq: stagedAt.staged.seq } } : {}), cause: causeOf(meta.logEvents, e.n, 60) });
    }
  }
  jerks.sort((a, b) => b.px - a.px).forEach((j, id) => { j.id = id; });
  // r43 (FOC40-02): a jerk whose step happened under the Save Sphere's wash carries what was over it (`wash`) and, when the policy excuses it, `covered`: it stays in `jerks` (so the
  // report shows it) and is left out of the summary, the verdict and the worst-jerk strips, as a jerk under a camera cut never gets that far (continuity-wash.mjs).
  const wash = washPolicy(cfg);
  tagWash(jerks, { records, alpha: meta.wash?.alpha ?? null, policy: wash });
  const visibleJerks = jerks.filter((j) => !j.covered), coveredJerks = jerks.filter((j) => j.covered);

  const battleSeconds = meta.stats?.battleSeconds ?? 0;
  const summary = summarize({ swaps, jerks: visibleJerks, coveredJerks, battleSeconds, cfg, frameTime });
  const run = { fps: meta.stats?.fps ?? null, error: meta.errors?.length ? meta.errors[0] : null };
  summary.checks = verdicts(summary, cfg, run);
  summary.run = { fps: run.fps, maxDtMs: meta.stats?.maxDtMs ?? null, slowFrames: meta.stats?.slowFrames ?? null, frames: meta.stats?.battleFrames ?? null, probeErrors: meta.errors?.length ?? 0 };

  // ---- who was measured how (so a reader can see what a PASS rests on)
  const perFigure = {};
  for (const s of swaps.filter((x) => x.counted)) {
    const f = (perFigure[s.figure] ??= { swaps: 0, headRegistered: 0, headRig: 0, massRead: 0, worstHeadPct: 0, worstMassPct: 0, worstFeetPx: 0, snaps: 0, sizeOver: 0, feetOver: 0, heightOver: 0, feetSilOver: 0, minStature: null });
    f.swaps++;
    if (s.head) {
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
  return { swaps, jerks, summary, perFigure, coverage, worst, frameMs: FRAME_MS, cameraCuts: [...cutFrames].sort((x, y) => x - y), wash: washReport({ records, meta, policy: wash, jerks }), access: { trackAt, planeAt, recordAt } };
}
