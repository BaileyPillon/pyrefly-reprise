// Continuity harness: the in-page probe (CHK-026 size continuity, CHK-027 continuity of motion).
//
// `createProbe` is stringified and run inside the game's page by `attachProbe` (continuity.mjs), once per page. It must
// stay self-contained: nothing outside its own body is in scope there. `tests/unit/critic-continuity-probe.test.ts` runs
// it in node against a fake page, and `tests/unit/critic-continuity-contract.test.ts` pins every engine field it reads.
//
// What it reads, all of it already exposed by a running build (no engine hook, so it works on a build that is already
// live): `window.__pyrefly.app` -> the battle screen -> `stage.actors` (id -> { actor, side, kind, anchor }) ->
// `actor.slots` (the two textured planes: `pose`, `fade`, `meta`, `mesh`, `painted.url`), `actor.active`, `actor._alpha`,
// `actor.poseUrls`; the stage's `opts.camera` and `opts.canvas`; and `window.__pyrefly.battleState().log`.
//
// What it records, once per rendered frame while a battle is the screen being played (it runs right after the game's
// own frame, via `app.nextFrame()`, so what it reads is what that frame drew):
//   - per visible figure, each plane: pose, fade, and the screen position (CSS px) of the painting's four corners,
//     mirror and yaw included, so the node side can put any anchor of the painting on the screen exactly;
//   - per figure, how far the camera alone moved its world point since the previous frame (so a camera cut is not
//     mistaken for the figure jumping);
//   - the battle log's new events, with the frame they arrived in;
//   - a rolling buffer of rendered frames (the WebGL canvas at `ringScale`), from which, around every pose swap and
//     every jerk candidate, `beforeFrames` before and `afterFrames` after are cropped to the figure, JPEG encoded a
//     couple per frame (so the encode never lands in one frame), and kept as a strip.
//
// A swap is the frame in which the painting that dominates a figure (the plane with the larger fade) changes: what the
// player sees become another pose. That follows a cut (the flip is that frame), a crossfade (the flip is its middle), the KO
// collapse (a buckle on the standing painting, then a cut) and a plane re-pointed at another painting while it still shows,
// and it does not care how many wrappers sit over `PaintedActor.setPose` or when the engine asked.
//
// Game case: both (shared critic plumbing).
export function createProbe(cfg, env) {
  const win = env.window, doc = env.document, perf = env.performance;
  const R1 = (v) => Math.round(v * 10) / 10, R3 = (v) => Math.round(v * 1000) / 1000;
  const S = {
    cfg, version: 1, running: false, stopping: false, frames: 0, t0: perf.now(), view: null,
    figs: [], figIdx: new Map(), poses: [], poseIdx: new Map(), fs: new Map(),
    records: [], swaps: [], logEvents: [], logSeen: 0, errors: [],
    ring: [], ringFrame: [], ringSize: null, jobs: [], strips: [], encodeQ: [], idle: null,
    battleMs: 0, battleFrames: 0, maxDt: 0, slowFrames: 0, lastT: 0, copyMs: 0, copies: 0, vpPrev: null, stripId: 0,
  };

  // ------------------------------------------------------------------ geometry
  const mul = (a, b) => { // 4x4 column-major a * b
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  };
  const project = (vp, rect, x, y, z) => {
    const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12], cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13], cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    return [rect.left + ((cx / cw) * 0.5 + 0.5) * rect.width, rect.top + (-(cy / cw) * 0.5 + 0.5) * rect.height];
  };
  const CORNERS = [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]; // the painting's top-left, top-right, bottom-right, bottom-left

  // ------------------------------------------------------------------ finding the battle
  const findBattle = () => {
    const app = win.__pyrefly && win.__pyrefly.app;
    if (!app) return null;
    const stack = app.screens || [];
    for (let i = stack.length - 1; i >= 0; i--) {
      const s = stack[i];
      if (s && s.name === 'battle' && s.fieldShown === true && s.stage && s.stage.actors && typeof s.stage.actors.entries === 'function') return { app, screen: s, stage: s.stage, paused: stack[stack.length - 1] !== s };
    }
    return null;
  };
  // The painting a plane draws NOW: the plane's own texture (`slot.painted.url`, what the stage shows), else the actor's url for that pose name.
  // A pose key is the figure, the pose name AND this painting: an FFX-2 girl's spherechange (and a boss's change of form) re-points the same
  // pose name ("idle") at another painting while the old keys stay valid, and a key that ignored the painting kept reading the first
  // painting's head, feet and outline for every later one (release 39's round 22: Paine's "registered" feet moving 20 px at every swap).
  const urlOf = (actor, sl) => (sl.painted && sl.painted.url) || (actor.poseUrls && actor.poseUrls[sl.pose]) || null;
  const keyId = (fi, pose, url) => `${fi}|${pose}|${url || ''}`;
  const poseKey = (fi, actor, sl) => {
    const url = urlOf(actor, sl);
    const id = keyId(fi, sl.pose, url);
    let k = S.poseIdx.get(id);
    if (k === undefined) {
      k = S.poses.length;
      S.poses.push({ fig: fi, pose: sl.pose, url, w: sl.meta ? sl.meta.width : 0, h: sl.meta ? sl.meta.height : 0 });
      S.poseIdx.set(id, k);
    }
    return k;
  };
  const figState = (fi) => {
    let f = S.fs.get(fi);
    if (!f) { f = { shown: -1, lastFlip: -1e9, w: null, bottom: null, steps: [] }; S.fs.set(fi, f); }
    return f;
  };

  // ------------------------------------------------------------------ the frame ring and the strips
  const ensureRing = (canvas, rect) => {
    const w = Math.max(64, Math.round(rect.width * cfg.ringScale)), h = Math.max(64, Math.round(rect.height * cfg.ringScale));
    if (S.ringSize && S.ringSize[0] === w && S.ringSize[1] === h) return true;
    try {
      S.ring = []; S.ringFrame = [];
      for (let i = 0; i < cfg.ringFrames; i++) { const c = doc.createElement('canvas'); c.width = w; c.height = h; S.ring.push({ c, x: c.getContext('2d') }); S.ringFrame.push(-1); }
      S.ringSize = [w, h];
      return true;
    } catch (e) { S.errors.push(`ring: ${String(e)}`); return false; }
  };
  const copyFrame = (canvas, n) => {
    if (!S.ringSize) return;
    const t = perf.now();
    const slot = S.ring[n % cfg.ringFrames];
    slot.x.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, S.ringSize[0], S.ringSize[1]);
    S.ringFrame[n % cfg.ringFrames] = n;
    S.copyMs += perf.now() - t; S.copies++;
  };
  const recAt = (n) => { for (let i = S.records.length - 1; i >= Math.max(0, S.records.length - 40); i--) if (S.records[i].n === n) return S.records[i]; return null; };
  const startJob = (kind, fi, n, extra) => {
    if (S.jobs.length + S.strips.length >= cfg.maxStrips) return;
    S.jobs.push({ id: S.stripId++, kind, fi, n, due: n + cfg.afterFrames - 1, ...extra });
  };
  const finishJob = (job) => {
    const first = job.n - cfg.beforeFrames, last = job.n + cfg.afterFrames - 1;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let n = first; n <= last; n++) {
      const r = recAt(n);
      const fr = r && r.f.find((g) => g.i === job.fi);
      if (!fr) continue;
      for (const sl of fr.s) if (sl) for (let i = 3; i < 11; i += 2) { x0 = Math.min(x0, sl[i]); x1 = Math.max(x1, sl[i]); y0 = Math.min(y0, sl[i + 1]); y1 = Math.max(y1, sl[i + 1]); }
    }
    if (!Number.isFinite(x0) || !S.ringSize) return;
    const v = S.view, kx = S.ringSize[0] / v[2], ky = S.ringSize[1] / v[3];
    let cx = (x0 - v[0]) * kx, cy = (y0 - v[1]) * ky, cw = (x1 - x0) * kx, ch = (y1 - y0) * ky;
    const mx = cw * 0.06, my = ch * 0.04; // a little air around the planes
    cx -= mx; cy -= my; cw += 2 * mx; ch += 2 * my;
    cw = Math.min(S.ringSize[0], Math.max(cw, 96)); ch = Math.min(S.ringSize[1], Math.max(ch, 128));
    cx = Math.max(0, Math.min(S.ringSize[0] - cw, cx)); cy = Math.max(0, Math.min(S.ringSize[1] - ch, cy));
    const scale = Math.min(1, cfg.cellHeight / ch), cellW = Math.max(8, Math.round(cw * scale)), cellH = Math.max(8, Math.round(ch * scale));
    const strip = { id: job.id, kind: job.kind, fi: job.fi, n: job.n, first, crop: [R1(cx), R1(cy), R1(cw), R1(ch)], ring: S.ringSize.slice(), cell: [cellW, cellH], view: v.slice(), frames: new Array(last - first + 1).fill(null), todo: 0, meta: job.meta || null };
    for (let n = first; n <= last; n++) {
      const slot = S.ring[n % cfg.ringFrames];
      if (S.ringFrame[n % cfg.ringFrames] !== n) continue; // the frame is gone (or the battle had not begun)
      const c = doc.createElement('canvas'); c.width = cellW; c.height = cellH;
      c.getContext('2d').drawImage(slot.c, cx, cy, cw, ch, 0, 0, cellW, cellH);
      S.encodeQ.push({ strip, idx: n - first, c });
      strip.todo++;
    }
    S.strips.push(strip);
  };
  const pumpEncoder = () => {
    for (let i = 0; i < cfg.encodePerFrame && S.encodeQ.length; i++) {
      const it = S.encodeQ.shift();
      try { it.strip.frames[it.idx] = it.c.toDataURL('image/jpeg', cfg.jpegQuality); } catch (e) { S.errors.push(`encode: ${String(e)}`); }
      it.strip.todo--;
    }
  };

  // ------------------------------------------------------------------ one frame
  const sample = () => {
    const now = perf.now(), n = S.frames++;
    const found = findBattle();
    if (!found || found.paused) { S.lastT = 0; S.vpPrev = null; for (const f of S.fs.values()) { f.w = null; f.bottom = null; f.steps = []; } pumpEncoder(); return; }
    const { stage } = found;
    const cam = stage.opts && stage.opts.camera, canvas = stage.opts && stage.opts.canvas;
    if (!cam || !canvas || !cam.projectionMatrix || !cam.matrixWorldInverse) { S.errors.push('no camera or canvas on the stage'); return; }
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (!S.view) S.view = [rect.left, rect.top, rect.width, rect.height];
    const vp = mul(cam.projectionMatrix.elements, cam.matrixWorldInverse.elements);
    const dt = S.lastT ? now - S.lastT : 0;
    S.lastT = now;
    if (dt > 0) { S.battleMs += Math.min(250, dt); S.battleFrames++; if (dt > S.maxDt) S.maxDt = dt; if (dt > 34) S.slowFrames++; }
    const t = R1(now - S.t0);
    if (ensureRing(canvas, rect)) copyFrame(canvas, n);

    const figs = [];
    for (const [id, st] of stage.actors.entries()) {
      const a = st && st.actor;
      if (!a || st.anchor || !a.slots || a.slots.length !== 2) continue;
      let fi = S.figIdx.get(id);
      if (fi === undefined) { fi = S.figs.length; S.figs.push({ id, side: st.side || null, kind: st.kind || null, artId: st.artId || null }); S.figIdx.set(id, fi); }
      const fs = figState(fi);
      const alpha = typeof a._alpha === 'number' ? a._alpha : 1;
      const showing = a.visible !== false && a.showFigure !== false && alpha > 0.02;
      const act = a.active | 0;
      const slActive = a.slots[act];
      if (!slActive || !slActive.pose) continue;
      // the painting that dominates: the plane with the larger fade (a flip is a swap)
      let bestI = -1, bestF = 0.0005, shownF = 0;
      for (let i = 0; i < 2; i++) {
        const sl = a.slots[i];
        if (!sl || !sl.pose) continue;
        if (sl.fade > bestF) { bestF = sl.fade; bestI = i; }
        if (fs.shown !== -1 && S.poseIdx.get(keyId(fi, sl.pose, urlOf(a, sl))) === fs.shown && sl.fade > shownF) shownF = sl.fade;
      }
      let flip = null, kBest = -1;
      if (bestI >= 0) {
        const sb = a.slots[bestI];
        kBest = poseKey(fi, a, sb);
        if (fs.shown !== -1 && kBest !== fs.shown && bestF > shownF) flip = { from: fs.shown, to: kBest };
      }
      if (flip) fs.lastFlip = n;
      const recent = n - fs.lastFlip <= cfg.recentFrames;

      const slots = [0, 0];
      for (let i = 0; i < 2; i++) {
        const sl = a.slots[i];
        if (!sl || !sl.pose) continue;
        if (!(i === act || sl.fade > 0.001 || recent)) continue;
        const k = poseKey(fi, a, sl);
        const m = sl.mesh.matrixWorld.elements;
        const rec = [k, R3(sl.fade), sl.mesh.visible ? 1 : 0];
        for (const [lx, ly] of CORNERS) {
          const p = project(vp, rect, m[0] * lx + m[4] * ly + m[12], m[1] * lx + m[5] * ly + m[13], m[2] * lx + m[6] * ly + m[14]);
          rec.push(R1(p[0]), R1(p[1]));
        }
        slots[i] = rec;
      }
      if (flip) {
        S.swaps.push({ n, t, i: fi, from: flip.from, to: flip.to, a: R3(alpha) });
        if (showing && alpha >= 0.9) startJob('swap', fi, n, { meta: { from: flip.from, to: flip.to } });
      }
      if (kBest >= 0 && (fs.shown === -1 || flip || bestF >= 0.5)) fs.shown = kBest;
      if (!showing) { fs.w = null; fs.bottom = null; fs.steps = []; continue; }

      // how far the camera alone moved this figure's world point since the last frame
      const me = a.matrixWorld && a.matrixWorld.elements;
      let g = [0, 0];
      if (me) {
        const w = [me[12], me[13], me[14]];
        if (fs.w && S.vpPrev) {
          const p1 = project(vp, rect, fs.w[0], fs.w[1], fs.w[2]), p0 = project(S.vpPrev, rect, fs.w[0], fs.w[1], fs.w[2]);
          g = [R1(p1[0] - p0[0]), R1(p1[1] - p0[1])];
        }
        fs.w = w;
      }
      // a cheap candidate test for jerks (the node side judges them again with the real feet): the step of the active plane's bottom
      const sa = slots[bestI >= 0 ? bestI : act];
      if (sa && fs.bottom && n - fs.lastFlip > 1) {
        const b = [(sa[7] + sa[9]) / 2, (sa[8] + sa[10]) / 2];
        const d = Math.hypot(b[0] - fs.bottom[0] - g[0], b[1] - fs.bottom[1] - g[1]);
        const hist = fs.steps.slice(-cfg.candidateWindow).sort((x, y) => x - y);
        const med = hist.length ? hist[hist.length >> 1] : 0;
        if (d >= cfg.jerkCandidatePx && d >= cfg.jerkCandidateRatio * Math.max(2, med) && Math.hypot(g[0], g[1]) < cfg.cutPx) startJob('jerk', fi, n, { meta: { px: R1(d) } });
        fs.steps.push(d);
        if (fs.steps.length > 24) fs.steps.shift();
      } else if (sa) fs.steps = [];
      if (sa) fs.bottom = [(sa[7] + sa[9]) / 2, (sa[8] + sa[10]) / 2];
      figs.push({ i: fi, a: R3(alpha), act, s: slots, g });
    }
    S.vpPrev = vp;
    if (figs.length) S.records.push({ n, t, f: figs });

    // the battle log: hits, spells, outcomes, with the frame they arrived in
    try {
      const bs = win.__pyrefly.battleState && win.__pyrefly.battleState();
      const log = bs && bs.log;
      if (log) {
        if (log.length < S.logSeen) S.logSeen = 0;
        for (; S.logSeen < log.length; S.logSeen++) {
          const e = log[S.logSeen] || {};
          const o = { n, i: S.logSeen, type: e.type };
          for (const key of ['actorId', 'targetId', 'sourceId', 'abilityId', 'id', 'amount']) if (e[key] !== undefined && typeof e[key] !== 'object') o[key] = e[key];
          S.logEvents.push(o);
        }
      }
    } catch (e) { S.errors.push(`log: ${String(e)}`); }

    // strips whose after-frames are in
    for (let i = S.jobs.length - 1; i >= 0; i--) if (S.jobs[i].due <= n) { const j = S.jobs.splice(i, 1)[0]; try { finishJob(j); } catch (e) { S.errors.push(`strip: ${String(e)}`); } }
    pumpEncoder();
  };

  // ------------------------------------------------------------------ the loop and what the node side calls
  const loop = async () => {
    const app = win.__pyrefly.app;
    while (S.running || S.jobs.length || S.encodeQ.length) {
      await app.nextFrame();
      try { if (S.running) sample(); else { S.frames++; pumpEncoder(); for (let i = S.jobs.length - 1; i >= 0; i--) if (S.jobs[i].due <= S.frames) S.jobs.splice(i, 1); } } catch (e) { S.errors.push(String(e && e.stack ? e.stack : e).slice(0, 300)); }
      if (S.errors.length > 30) S.running = false;
    }
    S.loopDone = true;
    if (S.idle) S.idle();
  };
  S.start = () => { if (S.running) return false; S.running = true; S.stopping = false; S.loopStarted = true; S.loopDone = false; loop(); return true; };
  S.finish = () => new Promise((resolve) => { if (S.loopDone || !S.loopStarted) return resolve(); S.idle = resolve; S.running = false; });
  S.drain = (max) => { const out = S.records.splice(0, max); return { records: out, left: S.records.length }; };
  S.meta = () => ({
    version: S.version, figs: S.figs, poses: S.poses, swaps: S.swaps, logEvents: S.logEvents, view: S.view, errors: S.errors,
    stats: { frames: S.frames, battleFrames: S.battleFrames, battleSeconds: R3(S.battleMs / 1000), maxDtMs: R1(S.maxDt), slowFrames: S.slowFrames, fps: S.battleMs > 0 ? R1((S.battleFrames * 1000) / S.battleMs) : null, copyMsMean: S.copies ? R3(S.copyMs / S.copies) : null },
    strips: S.strips.map((s) => ({ id: s.id, kind: s.kind, fi: s.fi, n: s.n, first: s.first, crop: s.crop, ring: s.ring, cell: s.cell, view: s.view, meta: s.meta, todo: s.todo, have: s.frames.filter(Boolean).length, length: s.frames.length })),
  });
  S.stripFrames = (ids) => ids.map((id) => { const s = S.strips.find((x) => x.id === id); return s ? { id, frames: s.frames } : { id, frames: [] }; });
  win.__cont = S;
  return S;
}
