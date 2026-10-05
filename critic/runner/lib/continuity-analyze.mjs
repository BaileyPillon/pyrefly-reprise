// Continuity harness: from what the probe recorded to the chapter's numbers (CHK-026 and CHK-027).
//
// `anchorsForPoses` decodes every painting the battle used (through whatever `fetchImage` gives it) and finds the head and
// the stance of each, from the registration where there is one and from the silhouette where there is not.
// `analyzeRun` is pure: it takes the probe's records, swap list and pose table plus those anchors and returns the swaps,
// the jerks, the summary and the two checks' results. Nothing here touches a browser.
import { FRAME_MS, analyzeSwap, detectJerks, distinctFirst, feetPoint, figureTrack, headCentre, planeOf, scale1600, summarize, unitSquareToQuad, verdicts, worstSwaps } from './continuity-pure.mjs';
import { anchorsFor, decodeMask } from './continuity-silhouette.mjs';

/** The anchors of every pose in the probe's pose table (`poses[k] = { url, ... }`), by pose key; null for a pose with no painting. */
export async function anchorsForPoses({ poses, fetchImage, measure }) {
  const masks = new Map();
  const anchors = new Array(poses.length).fill(null);
  const notes = [];
  for (let k = 0; k < poses.length; k++) {
    const p = poses[k];
    if (!p.url) { notes.push(`pose ${p.pose} of figure ${p.fig} has no painting url (a stand-in)`); continue; }
    if (!masks.has(p.url)) {
      try { masks.set(p.url, await decodeMask(await fetchImage(p.url))); } catch (e) { masks.set(p.url, null); notes.push(`could not read ${p.url}: ${String(e).slice(0, 120)}`); }
    }
    const mask = masks.get(p.url);
    if (mask) anchors[k] = anchorsFor({ url: p.url, mask, measure });
  }
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
  const recordAt = (fi, n) => { const j = index.get(fi)?.get(n); return j === undefined ? null : byFig.get(fi)[j]; };
  /** Where the figure's feet and head are in a frame (its two planes blended by how visible each is), or null. */
  const trackAt = (fi, n) => { const e = recordAt(fi, n); return e ? figureTrack(e.fig, anchors) : null; };
  /** Where one plane's own feet and head are in a frame, or null. */
  const planeAt = (fi, n, k) => {
    const e = recordAt(fi, n);
    const p = e ? e.fig.s.map(planeOf).find((q) => q && q.k === k) : null;
    const an = anchors[k];
    if (!p || !an) return null;
    const H = unitSquareToQuad(p.q);
    return { feet: an.stance ? feetPoint(H, an.stance) : null, head: an.head ? headCentre(H, an.head) : null };
  };

  // ---- swaps (every flip of which painting dominates a figure)
  const fadeOf = (fig, k) => fig.s.reduce((m, raw) => { const p = planeOf(raw); return p && p.k === k ? Math.max(m, p.fade) : m; }, 0);
  const swaps = [];
  let seq = 0;
  for (const sw of meta.swaps) {
    if (sw.from < 0) continue;
    const list = byFig.get(sw.i) ?? [];
    const at = index.get(sw.i)?.get(sw.n);
    const base = { id: seq++, figure: figs[sw.i]?.id ?? String(sw.i), side: figs[sw.i]?.side ?? null, fromPose: poses[sw.from]?.pose, toPose: poses[sw.to]?.pose, n: sw.n, tMs: sw.t, fi: sw.i, from: sw.from, to: sw.to, cause: causeOf(meta.logEvents, sw.n) };
    if (at === undefined || sw.a < 0.9) { swaps.push({ ...base, startFrame: sw.n, notShowing: true, counted: false, camCut: false, head: null, feet: null, outline: null, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null }, blendFrames: 0, snap: false, hardCut: false, failHead: false, failFeet: false }); continue; }
    // from where the incoming painting first showed (it cannot have been showing longer than the window) to a window after the flip
    let first = at;
    while (first > 0 && at - first < cfg.motion.windowFrames && list[first - 1].n === list[first].n - 1 && fadeOf(list[first - 1].fig, sw.to) > cfg.motion.blendFadeMin) first--;
    const frames = [];
    for (let j = first; j < Math.min(list.length, at + cfg.motion.windowFrames); j++) { if (frames.length && list[j].n !== frames[frames.length - 1].n + 1) break; frames.push(list[j]); }
    const res = analyzeSwap({ frames, at: at - first, swap: { from: sw.from, to: sw.to }, anchors, k1600, camCut: nearCut(sw.n), cfg });
    swaps.push({ ...base, startFrame: list[first].n, ...res, notShowing: false, counted: !res.camCut && !res.unmeasured });
  }

  // ---- jerks: every figure's feet and head on every frame
  const jerks = [];
  for (const [i, list] of byFig) {
    const track = list.map((e) => { const tr = figureTrack(e.fig, anchors); return tr ? { n: e.n, t: e.t, feet: tr.feet, head: tr.head, cam: e.fig.g } : null; });
    const evs = detectJerks(track.map((s) => s ?? { n: -10, t: 0, feet: null, head: null, cam: [0, 0] }), k1600, cfg);
    const mine = swaps.filter((s) => s.fi === i);
    for (const e of evs) {
      const atSwap = mine.some((s) => e.n >= s.startFrame - 1 && e.n <= s.n + 2);
      jerks.push({ ...e, figure: figs[i]?.id ?? String(i), fi: i, atSwap, cause: causeOf(meta.logEvents, e.n, 60) });
    }
  }
  jerks.sort((a, b) => b.px - a.px).forEach((j, id) => { j.id = id; });

  const battleSeconds = meta.stats?.battleSeconds ?? 0;
  const summary = summarize({ swaps, jerks, battleSeconds, cfg });
  const run = { fps: meta.stats?.fps ?? null, error: meta.errors?.length ? meta.errors[0] : null };
  summary.checks = verdicts(summary, cfg, run);
  summary.run = { fps: run.fps, maxDtMs: meta.stats?.maxDtMs ?? null, slowFrames: meta.stats?.slowFrames ?? null, frames: meta.stats?.battleFrames ?? null, probeErrors: meta.errors?.length ?? 0 };

  // ---- who was measured how (so a reader can see what a PASS rests on)
  const perFigure = {};
  for (const s of swaps.filter((x) => x.counted)) {
    const f = (perFigure[s.figure] ??= { swaps: 0, headRegistered: 0, massRead: 0, worstHeadPct: 0, worstMassPct: 0, worstFeetPx: 0, snaps: 0, sizeOver: 0, feetOver: 0 });
    f.swaps++;
    if (s.head) {
      const pct = Math.round(Math.abs(s.head.ratio - 1) * 1000) / 10;
      if (s.head.source === 'registration') { f.headRegistered++; f.worstHeadPct = Math.max(f.worstHeadPct, pct); } else { f.massRead++; f.worstMassPct = Math.max(f.worstMassPct, pct); }
    }
    if (s.feet && s.feet.standing) f.worstFeetPx = Math.max(f.worstFeetPx, s.feet.px);
    if (s.snap) f.snaps++;
    if (s.failHead) f.sizeOver++;
    if (s.failFeet) f.feetOver++;
  }
  const coverage = {
    figures: figs.map((f) => f.id),
    measuredWithRegistration: Object.entries(perFigure).filter(([, v]) => v.headRegistered > 0).map(([k]) => k),
    measuredFromSilhouetteOnly: Object.entries(perFigure).filter(([, v]) => v.headRegistered === 0).map(([k]) => k),
    posesWithAnchors: anchors.filter(Boolean).length, posesTotal: poses.length, staleRegistrationRecords: anchors.filter((a) => a?.stale).length,
    poses: poses.map((p, k) => ({ figure: figs[p.fig]?.id ?? String(p.fig), pose: p.pose, url: p.url, head: anchors[k]?.head ? 'registration' : null, stance: anchors[k]?.stanceSrc ?? null, prone: anchors[k]?.prone ?? null })),
  };

  const worst = {
    swaps: worstSwaps(swaps, cfg.strips.worstSwaps, cfg).map((s) => s.id),
    jerks: distinctFirst(jerks, (j) => `${j.figure}|${j.atSwap}|${j.part}`, cfg.strips.worstJerks).map((j) => j.id),
  };
  const taken = new Set(worst.swaps);
  const ghostly = swaps.filter((s) => s.counted && s.ghost.frames > 0 && !taken.has(s.id)).sort((a, b) => b.ghost.severity - a.ghost.severity);
  worst.ghosts = distinctFirst(ghostly, (s) => `${s.figure}|${s.fromPose}|${s.toPose}`, cfg.strips.worstGhosts).map((s) => s.id);
  return { swaps, jerks, summary, perFigure, coverage, worst, frameMs: FRAME_MS, cameraCuts: [...cutFrames].sort((x, y) => x - y), access: { trackAt, planeAt, recordAt } };
}
