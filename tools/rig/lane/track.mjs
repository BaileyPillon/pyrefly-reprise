/**
 * **The rig tracker** (the lane kit; the rig program, 2026-10-18): per-frame tracks of a figure's head, feet, pelvis, hand and prop tip, from the ENGINE (a rig's skeleton landmarks, or a painted
 * actor's anchors), projected through the live camera, and the critic's own CHK-027 jerk detector over them (`critic/runner/lib/continuity-pure.mjs#detectJerks`, `critic/policy.json` `continuity`).
 *
 * Why: the continuity probe (CHK-026/027) reads the painted PLANE's pixels; a rig draws no plane, so with the rig on the probe reads nothing (stature null, 0 px everywhere: a vacuous PASS, in both
 * the Kimahri and Lulu handoffs). The skeleton's projected points are what a viewer sees move. `cam` is the camera's own shift of the figure's root between two frames (the probe's definition),
 * so a camera cut is not a jerk. Promoted from the per-subject copies `trk.mjs` (Kimahri) and `trk-lulu.mjs`; the landmark names are the registry's (`lane-subjects.json` `track`).
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/** In the page: record the actor's points every time `__trkPush(n)` is called. `points` is `trackerPoints(spec)`. */
export async function installTracker(page, actor, points) {
  await page.evaluate(([who, pts]) => {
    const b = window.__pyrefly.battle();
    const a = b.stage.actor(who);
    const cam = b.app.renderer.camera;
    window.__trkRecords = [];
    window.__trkPush = (n) => {
      cam.updateMatrixWorld();
      const pos = a.position;
      const rig = typeof a.rigInfo === 'function';
      const v = pos.clone();
      const lm = (name) => { const l = name ? a.landmark?.(name) : null; return l ? [pos.x + l.x, pos.y + l.y, pos.z] : null; };
      const mean = (list) => { const ps = list.map(lm).filter(Boolean); return ps.length ? [0, 1, 2].map((i) => ps.reduce((s, p) => s + p[i], 0) / ps.length) : null; };
      let head, feet, centroid, hand, tip;
      if (rig) {
        head = lm(pts.head);
        feet = mean(pts.feet) ?? [pos.x, pos.y, pos.z];
        centroid = lm(pts.centroid);
        hand = lm(pts.hand);
        tip = lm(pts.tip);
      } else {
        a.headPoint(v); head = [v.x, v.y, v.z];
        feet = [pos.x, pos.y, pos.z];
        a.centerPoint(v); centroid = [v.x, v.y, v.z];
        hand = null; tip = null;
      }
      window.__trkRecords.push({ n, t: performance.now(), rig, pose: a.pose, head, feet, centroid, hand, tip, root: [pos.x, pos.y, pos.z], V: Array.from(cam.matrixWorldInverse.elements), P: Array.from(cam.projectionMatrix.elements) });
    };
  }, [actor, points]);
}

export const pushTrack = (page, n) => page.evaluate((k) => window.__trkPush(k), n);
export const collectTracks = (page) => page.evaluate(() => window.__trkRecords);

const proj = (V, P, p, W, H) => {
  const m = (M, x, y, z, w) => [M[0] * x + M[4] * y + M[8] * z + M[12] * w, M[1] * x + M[5] * y + M[9] * z + M[13] * w, M[2] * x + M[6] * y + M[10] * z + M[14] * w, M[3] * x + M[7] * y + M[11] * z + M[15] * w];
  const e = m(V, p[0], p[1], p[2], 1);
  const c = m(P, e[0], e[1], e[2], e[3]);
  return [(c[0] / c[3] * 0.5 + 0.5) * W, (-c[1] / c[3] * 0.5 + 0.5) * H];
};

/** Screen-space samples `{n, t, pose, fig: {head, feet, centroid, hand, tip, cam}}` from the raw records. */
export function toSamples(records, W = 1600, H = 900) {
  const out = [];
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const pj = (p) => (p ? proj(r.V, r.P, p, W, H) : null);
    let cam = [0, 0];
    if (i > 0) {
      const q = records[i - 1];
      const a0 = proj(q.V, q.P, q.root, W, H);
      const a1 = proj(r.V, r.P, q.root, W, H);
      cam = [a1[0] - a0[0], a1[1] - a0[1]];
    }
    out.push({ n: r.n, t: r.t, pose: r.pose, fig: { head: pj(r.head), feet: pj(r.feet), centroid: pj(r.centroid), hand: pj(r.hand), tip: pj(r.tip), cam } });
  }
  return out;
}

/** The detector over head+feet+pelvis, and over each point alone. `repo` is the tree whose critic runner and policy are read. */
export async function analyse(samples, repo, width = 1600) {
  const { detectJerks, scale1600 } = await import(pathToFileURL(`${repo}/critic/runner/lib/continuity-pure.mjs`).href);
  const cfg = JSON.parse(fs.readFileSync(`${repo}/critic/policy.json`, 'utf8')).continuity;
  const k1600 = scale1600(width);
  const NONE = { n: -10, t: 0, feet: null, head: null, centroid: null, cam: [0, 0] };
  const mk = (pick) => samples.map((s) => {
    const f = s.fig;
    if (!f) return NONE;
    const p = pick(f);
    return { n: s.n, t: s.t, feet: p.feet ?? null, head: p.head ?? null, centroid: p.centroid ?? null, cam: f.cam ?? [0, 0] };
  });
  const full = detectJerks(mk((f) => ({ feet: f.feet, head: f.head, centroid: f.centroid })), k1600, cfg);
  const only = {};
  for (const part of ['head', 'feet', 'centroid', 'hand', 'tip']) {
    if (!samples.some((s) => s.fig[part])) { only[part] = null; continue; }
    only[part] = detectJerks(mk((f) => ({ [part === 'hand' || part === 'tip' ? 'centroid' : part]: f[part] })), k1600, cfg);
  }
  let cuts = 0;
  for (const s of samples) if (Math.hypot(s.fig.cam[0], s.fig.cam[1]) * k1600 >= cfg.motion.cutPx) cuts++;
  const maxStep = {};
  for (const part of ['head', 'feet', 'centroid', 'hand', 'tip']) {
    let m = 0;
    for (let j = 1; j < samples.length; j++) {
      const a = samples[j - 1].fig[part];
      const b = samples[j].fig[part];
      if (!a || !b || samples[j].n !== samples[j - 1].n + 1) continue;
      const c = samples[j].fig.cam;
      if (Math.hypot(c[0], c[1]) * k1600 >= cfg.motion.cutPx) continue;
      m = Math.max(m, Math.hypot(b[0] - a[0] - c[0], b[1] - a[1] - c[1]) * k1600);
    }
    maxStep[part] = Number(m.toFixed(1));
  }
  const poseSwaps = samples.reduce((n, s, i) => n + (i > 0 && s.pose !== samples[i - 1].pose ? 1 : 0), 0);
  return { frames: samples.length, thresholds: cfg.motion, jerksHeadFeetPelvis: full.length, jerks: full, perPoint: Object.fromEntries(Object.entries(only).map(([k, v]) => [k, v ? v.length : null])), maxStepPxPerFrame: maxStep, cameraCutFrames: cuts, poseKeyChanges: poseSwaps };
}
