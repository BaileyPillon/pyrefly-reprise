// Frame time of each look on this machine, the looks interleaved (off, 1, 2, 3, off, ...) over several rounds so a drift of the
// machine (another process, the GPU's clocks) lands on every look alike. Vsync and the frame limiter are off (`lib.mjs`'s GPU
// flags), so the frame interval is the real cost of a frame; the GPU time of the whole composer render is read from a timer query
// where the browser offers one.
//   node frametime.mjs <chapter> [size WxH] [rounds] [crispPin]
import { launch, ready, startChapter, sleep, writeFileSync } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/lib.mjs';

const chapter = process.argv[2] ?? 'seymour-flux';
const [W, H] = (process.argv[3] ?? '1600x900').split('x').map(Number);
const rounds = Number(process.argv[4] ?? 3);
const pin = process.argv[5] ?? 'fplus';
const FRAMES = Number(process.argv[6] ?? 300);
const SHUFFLE = process.argv[7] === 'shuffle';
const url = `http://127.0.0.1:6944/?coach=off&crisp=${pin}`;
const { browser, ctx, page, errors } = await launch({ width: W, height: H });
const res = { chapter, size: [W, H], crisp: pin, rounds, looks: {} };
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(page, 1);
  await startChapter(page, chapter, 1);
  await sleep(1500);
  res.gpuTimer = await page.evaluate(() => {
    const r = window.__pyrefly.app.renderer; const gl = r.renderer.getContext();
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    window.__gpu = { ext, gl, pending: [], done: [] };
    if (!ext) return false;
    const comp = r.composer; const orig = comp.render.bind(comp);
    comp.render = (dt) => {
      const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      const out = orig(dt);
      gl.endQuery(ext.TIME_ELAPSED_EXT); window.__gpu.pending.push(q);
      return out;
    };
    return true;
  });
  res.crispRung = await page.evaluate(() => window.__pyrefly.crisp?.state?.() ?? window.__pyrefly.crisp?.snapshot?.() ?? null).catch(() => null);
  const measure = (frames) => page.evaluate(async (n) => {
    const g = window.__gpu; g.done.length = 0;
    const dts = [];
    let last = performance.now();
    for (let i = 0; i < n + 30; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      const t = performance.now();
      if (i >= 30) dts.push(t - last);
      last = t;
      if (g.ext) {
        const keep = [];
        for (const q of g.pending) {
          if (g.gl.getQueryParameter(q, g.gl.QUERY_RESULT_AVAILABLE)) {
            if (!g.gl.getParameter(g.ext.GPU_DISJOINT_EXT)) g.done.push(g.gl.getQueryParameter(q, g.gl.QUERY_RESULT) / 1e6);
            g.gl.deleteQuery(q);
          } else keep.push(q);
        }
        g.pending = keep;
      }
    }
    const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
    const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length * 0.95)] : null; };
    const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const gpuLate = g.done.slice(Math.floor(g.done.length * 0.15));
    return { n: dts.length, frameMedian: med(dts), frameMean: mean(dts), frameP95: p95(dts), gpuMedian: med(gpuLate), gpuMean: mean(gpuLate), gpuN: gpuLate.length };
  }, frames);
  const order = [0, 1, 2, 3];
  const shuf = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  for (let r = 0; r < rounds; r++) {
    for (const look of (SHUFFLE ? shuf(order) : order)) {
      await page.evaluate((m) => window.__pyrefly.fx.light.set({ mode: m, strength: 1 }), look);
      await sleep(400);
      const m = await measure(FRAMES);
      (res.looks[look] ??= []).push(m);
      console.log(`round ${r + 1} look ${look}: frame median ${m.frameMedian?.toFixed(2)} ms mean ${m.frameMean?.toFixed(2)} p95 ${m.frameP95?.toFixed(2)} | gpu median ${m.gpuMedian?.toFixed(3)} mean ${m.gpuMean?.toFixed(3)} (${m.gpuN})`);
    }
  }
  res.mixUpdate = await page.evaluate(() => window.__pyrefly.fx.light.snapshot().updateMs);
  const avg = (k, f) => { const v = res.looks[k].map((m) => m[f]).filter((x) => x !== null); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(3) : null; };
  res.summary = Object.fromEntries(order.map((k) => [k, { frameMedianMs: avg(k, 'frameMedian'), frameMeanMs: avg(k, 'frameMean'), frameP95Ms: avg(k, 'frameP95'), gpuMedianMs: avg(k, 'gpuMedian'), gpuMeanMs: avg(k, 'gpuMean') }]));
  console.log(JSON.stringify(res.summary, null, 1));
  res.errors = errors.slice(0, 5);
} catch (e) { res.error = String(e).slice(0, 500); console.log('ERR', res.error); }
writeFileSync(`D:/Tools/pyrefly-scratch/2026-10-06/lighting/harness/frametime-${chapter}-${W}x${H}.json`, JSON.stringify(res, null, 1));
await ctx.close(); await browser.close();
