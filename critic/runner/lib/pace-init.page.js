// In-page frame-pacing recorder (T-01 of the motion-fluidity pass, lane L5; both games, critic plumbing). PORTED from the pacing lane's candidate tools/pace-init.js (PACE-08, PACE-10).
//
// WHY THIS AND NOT THE CONTINUITY PROBE: the probe's per-frame work and strip encoding make long frames the game does not make (it read Chapter IV as 409 frames over 34 ms; the same machine, seed and route
// with only this recorder reads 4; DevTools tracing alone makes 60). Pacing is read from a run that has THIS recorder and nothing else (no probe, no trace, screenshots only as the route takes them and
// excluded by pace-pure.mjs), and the number to quote is "animation time lost a minute" and the frame counts a minute, not a share of frames.
//
// Injected with `addInitScript` before the game's first line (critic/runner/lib/pace-record.mjs does it). Read-only: it wraps requestAnimationFrame, a few WebGL / canvas calls and the critic harness's debug-API
// reads with timers, and records. It changes no game state. Config comes from window.__paceCfg (set by a script injected just before this one). A plain browser script: it is not imported by anything and
// is not part of the continuity harness's identity (tools/critic-harness-identity.mjs follows imports only).
// In-page frame-pacing recorder (injected with addInitScript before the game's first line). Read-only: it wraps requestAnimationFrame,
// a few WebGL / canvas calls and the critic harness's debug-API reads with timers, and records. It changes no game state.
// Config comes from window.__paceCfg (set by a script injected just before this one).
(() => {
  if (window.__pace) return;
  const cfg = window.__paceCfg || {};
  const N = 1 << 19; // frames kept (uncapped runs reach about 200k)
  const P = (window.__pace = {
    cfg,
    n: 0,
    fTs: new Float64Array(N), // rAF timestamp argument (frame time)
    fStart: new Float64Array(N), // performance.now() when the first callback of the frame began
    fJs: new Float32Array(N), // total ms inside all rAF callbacks of the frame
    fHeap: new Float32Array(N), // used JS heap, MB, at the frame's first callback
    fCbs: new Uint8Array(N), // callbacks in the frame
    gl: [], // [t, name, dur, a, b]
    glDropped: 0,
    lt: [], // longtask entries
    loaf: [], // long-animation-frame entries
    ev: [], // event timing entries (input delay / duration)
    harness: [], // [t, name, dur] calls of the critic harness (debug API reads)
    harnessCount: {},
    screens: [], // [t, name]
    gov: [], // [t, level, rung, p95]
    marks: 0,
    battleSince: null,
    errors: [],
  });
  const now = () => performance.now();

  // ---- rAF: group callbacks sharing one frame timestamp
  const realRAF = window.requestAnimationFrame.bind(window);
  // cfg.hz: a software refresh rate for an uncapped browser: the game's callbacks run only on a real frame at least one period after the last run (the browser itself is not capped, the game is). The real frames in between draw nothing.
  let origRAF = realRAF;
  if (cfg.hz > 0) {
    const period = 1000 / cfg.hz;
    let pending = [];
    let lastRun = -1e9;
    let looping = false;
    const loop = (ts) => {
      if (pending.length && ts - lastRun >= period - 0.6) {
        lastRun = ts;
        const run = pending; pending = [];
        for (const fn of run) fn(ts);
      }
      if (pending.length) realRAF(loop); else looping = false;
    };
    origRAF = (fn) => { pending.push(fn); if (!looping) { looping = true; realRAF(loop); } return 0; };
  }
  let lastTs = -1;
  window.requestAnimationFrame = (cb) =>
    origRAF((ts) => {
      const s = now();
      if (ts !== lastTs) {
        lastTs = ts;
        if (P.n < N) {
          const i = P.n++;
          P.fTs[i] = ts;
          P.fStart[i] = s;
          P.fCbs[i] = 0;
          P.fJs[i] = 0;
          try { P.fHeap[i] = performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0; } catch { P.fHeap[i] = 0; }
        }
      }
      try {
        cb(ts);
      } finally {
        const i = P.n - 1;
        if (i >= 0 && P.fTs[i] === ts) {
          P.fJs[i] += now() - s;
          if (P.fCbs[i] < 255) P.fCbs[i]++;
        }
      }
    });

  // ---- WebGL / canvas calls that can stall the main thread
  const GLMIN = 0.25; // ms: slower calls are kept
  const glCodes = {};
  const keepGl = (name, d, a, b, always) => {
    if (!always && d < GLMIN) return;
    if (P.gl.length >= 400000) { P.glDropped++; return; }
    P.gl.push([now() - d, name, +d.toFixed(3), a, b]);
  };
  const wrapProto = (proto, tag, names) => {
    if (!proto) return;
    for (const name of names) {
      const orig = proto[name];
      if (typeof orig !== 'function') continue;
      const always = name === 'linkProgram' || name === 'compileShader' || name === 'generateMipmap' || name === 'readPixels' || name === 'finish';
      proto[name] = function (...args) {
        const s = now();
        try {
          return orig.apply(this, args);
        } finally {
          const d = now() - s;
          let a = 0, b = 0;
          if (d >= GLMIN || always) {
            if (name === 'texImage2D' || name === 'texSubImage2D') {
              const src = args[args.length - 1];
              if (args.length >= 9 && typeof args[3] === 'number') { a = args[3]; b = args[4]; }
              else if (src && typeof src === 'object') { a = src.width || src.videoWidth || 0; b = src.height || src.videoHeight || 0; }
            } else if (name === 'texStorage2D') { a = args[3]; b = args[4]; }
            else if (name === 'bufferData') { a = args[1] && args[1].byteLength ? args[1].byteLength : typeof args[1] === 'number' ? args[1] : 0; }
            else if (name === 'getProgramParameter' || name === 'getShaderParameter') { a = args[1]; }
            else if (name === 'readPixels') { a = args[2]; b = args[3]; }
            else if (name === 'compileShader') { a = 0; }
            keepGl(tag + name, d, a, b, always);
          }
        }
      };
    }
  };
  const GL_NAMES = ['linkProgram', 'compileShader', 'getProgramParameter', 'getShaderParameter', 'getProgramInfoLog', 'texImage2D', 'texSubImage2D', 'texStorage2D', 'texImage3D', 'texSubImage3D', 'compressedTexImage2D', 'generateMipmap', 'readPixels', 'finish', 'bufferData', 'getError', 'validateProgram', 'copyTexImage2D', 'copyTexSubImage2D', 'blitFramebuffer'];
  try { wrapProto(window.WebGLRenderingContext && WebGLRenderingContext.prototype, 'gl1.', GL_NAMES); } catch (e) { P.errors.push('gl1 ' + e); }
  try { wrapProto(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype, 'gl2.', GL_NAMES); } catch (e) { P.errors.push('gl2 ' + e); }
  try { wrapProto(window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype, '2d.', ['getImageData', 'putImageData', 'drawImage', 'createPattern', 'measureText']); } catch (e) { P.errors.push('2d ' + e); }
  try { wrapProto(window.OffscreenCanvasRenderingContext2D && OffscreenCanvasRenderingContext2D.prototype, 'o2d.', ['getImageData', 'putImageData', 'drawImage']); } catch (e) { P.errors.push('o2d ' + e); }
  try { wrapProto(window.HTMLCanvasElement && HTMLCanvasElement.prototype, 'cv.', ['toDataURL', 'toBlob']); } catch (e) { P.errors.push('cv ' + e); }

  // ---- observers
  const obs = (type, fn, extra) => {
    try {
      const o = new PerformanceObserver((list) => { for (const e of list.getEntries()) fn(e); });
      o.observe({ type, buffered: true, ...extra });
    } catch (e) { P.errors.push('obs ' + type + ' ' + e); }
  };
  obs('longtask', (e) => P.lt.push([+e.startTime.toFixed(2), +e.duration.toFixed(2)]));
  obs('long-animation-frame', (e) => {
    const scripts = (e.scripts || []).map((s) => ({
      url: (s.sourceURL || '').split('/').slice(-1)[0], fn: s.sourceFunctionName || '', pos: s.sourceCharPosition, inv: s.invoker || '', type: s.invokerType || '',
      d: +s.duration.toFixed(2), forced: +(s.forcedStyleAndLayoutDuration || 0).toFixed(2), pause: +(s.pauseDuration || 0).toFixed(2), exec: +((s.startTime && s.executionStart) ? s.startTime - s.executionStart : 0).toFixed(2),
    }));
    P.loaf.push({ t: +e.startTime.toFixed(2), d: +e.duration.toFixed(2), rs: +e.renderStart.toFixed(2), sl: +(e.styleAndLayoutStart || 0).toFixed(2), blk: +(e.blockingDuration || 0).toFixed(2), scripts });
  });
  obs('event', (e) => { if (e.duration >= 16) P.ev.push([+e.startTime.toFixed(2), e.name, +(e.processingStart - e.startTime).toFixed(2), +e.duration.toFixed(2)]); }, { durationThreshold: 16 });

  // ---- the critic harness's own reads of the debug API (they run on the page's main thread)
  const HARNESS = ['screen', 'snapshotState', 'battleLog', 'battleState', 'audioDebug', 'battle', 'seed', 'setSeed'];
  let lastScreen = null;
  const hook = () => {
    const api = window.__pyrefly;
    if (!api) return false;
    for (const name of HARNESS) {
      const orig = api[name];
      if (typeof orig !== 'function' || orig.__paced) continue;
      const w = function (...args) {
        const s = now();
        let r;
        try { r = orig.apply(this, args); return r; }
        finally {
          const d = now() - s;
          P.harnessCount[name] = (P.harnessCount[name] || 0) + 1;
          if (d >= 0.15 && P.harness.length < 100000) P.harness.push([+s.toFixed(2), name, +d.toFixed(3)]);
          if (name === 'screen' && typeof r === 'string' && r !== lastScreen) {
            lastScreen = r;
            P.screens.push([+now().toFixed(2), r]);
            if (r === 'battle' && P.battleSince === null) P.battleSince = now();
          }
        }
      };
      w.__paced = true;
      try { api[name] = w; } catch (e) { P.errors.push('hook ' + name + ' ' + e); }
    }
    return true;
  };
  const hookTimer = setInterval(() => { if (hook()) { /* keep hooking: a reload rebuilds the API only with the page */ } }, 250);
  P.stopHook = () => clearInterval(hookTimer);

  // ---- the screen name twice a second (a driver that never asks, like the lean one, still gets its battle window)
  setInterval(() => { const api = window.__pyrefly; if (api && typeof api.screen === 'function') { try { api.screen(); } catch { /* ignore */ } } }, 500);

  // ---- sampler: governor level and the crisp rung twice a second at most, sync marks for the trace
  setInterval(() => {
    const t = now();
    if (cfg.trace) { try { performance.mark('pace-sync'); P.marks++; } catch { /* ignore */ } }
  }, 1000);
  setInterval(() => {
    const api = window.__pyrefly;
    if (!api) return;
    try {
      const g = api.govern && api.govern();
      const rung = api.crisp && api.crisp.rung && api.crisp.rung();
      if (g || rung) { const gv = g && g.governor ? g.governor : null; P.gov.push([+now().toFixed(1), g && g.live ? g.live.level : null, rung || null, gv && gv.last ? gv.last.p95 ?? null : null, gv ? gv.budgetMs : null, gv && gv.last ? (gv.last.over ? 1 : 0) : null, gv && gv.last ? (gv.last.under ? 1 : 0) : null, gv ? gv.recoverWaitMs : null]); }
    } catch (e) { if (P.errors.length < 20) P.errors.push('gov ' + e); }
  }, 2000);

  // ---- incremental drain: the route reloads the page after the fight (it checks the save), which would wipe everything; the runner pulls what is new every few seconds
  const cur = { n: 0, gl: 0, lt: 0, loaf: 0, ev: 0, harness: 0, screens: 0, gov: 0 };
  P.drain = () => {
    const t0 = now();
    const n = P.n;
    const sl = (a, from) => Array.from(a.subarray(from, n));
    const out = {
      timeOrigin: performance.timeOrigin, from: cur.n, n,
      fTs: sl(P.fTs, cur.n), fStart: sl(P.fStart, cur.n), fJs: sl(P.fJs, cur.n).map((x) => +x.toFixed(3)), fHeap: sl(P.fHeap, cur.n).map((x) => +x.toFixed(2)), fCbs: sl(P.fCbs, cur.n),
      gl: P.gl.slice(cur.gl), lt: P.lt.slice(cur.lt), loaf: P.loaf.slice(cur.loaf), ev: P.ev.slice(cur.ev), harness: P.harness.slice(cur.harness), screens: P.screens.slice(cur.screens), gov: P.gov.slice(cur.gov),
      harnessCount: P.harnessCount, glDropped: P.glDropped, battleSince: P.battleSince, marks: P.marks, errors: P.errors, ua: navigator.userAgent, dpr: devicePixelRatio, inner: [innerWidth, innerHeight],
    };
    cur.n = n; cur.gl = P.gl.length; cur.lt = P.lt.length; cur.loaf = P.loaf.length; cur.ev = P.ev.length; cur.harness = P.harness.length; cur.screens = P.screens.length; cur.gov = P.gov.length;
    if (P.harness.length < 100000) P.harness.push([+t0.toFixed(2), 'pace.drain', +(now() - t0).toFixed(3)]);
    return out;
  };

  // ---- dump (whole page, kept for a quick look; the runner uses drain())
  P.dump = () => {
    const n = P.n;
    const slice = (a) => Array.from(a.subarray(0, n));
    return {
      timeOrigin: performance.timeOrigin,
      n,
      fTs: slice(P.fTs), fStart: slice(P.fStart), fJs: slice(P.fJs).map((x) => +x.toFixed(3)), fHeap: slice(P.fHeap).map((x) => +x.toFixed(2)), fCbs: slice(P.fCbs),
      gl: P.gl, glDropped: P.glDropped, lt: P.lt, loaf: P.loaf, ev: P.ev, harness: P.harness, harnessCount: P.harnessCount, screens: P.screens, gov: P.gov,
      battleSince: P.battleSince, marks: P.marks, errors: P.errors,
      ua: navigator.userAgent, dpr: devicePixelRatio, inner: [innerWidth, innerHeight],
      hz: null,
    };
  };
})();
