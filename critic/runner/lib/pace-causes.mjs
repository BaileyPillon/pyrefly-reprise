// What a long frame was doing, as far as the in-page recorder can say (T-01, lane L5; both games, critic plumbing). PORTED from the pacing lane's analyze-run.mjs; pure.
//
// The recorder times every rAF callback and wraps the WebGL / canvas calls that can stall the main thread (shader link, texture upload, readback, 2d draws, buffer upload). For a frame whose interval is over
// `longMs` this reads which of those calls fell in the stretch between the previous frame's first callback and this frame's, whether the critic's own debug-API read or screenshot was there, whether the heap
// dropped (a collection), and the long-animation-frame entry the browser wrote. `dominant` is the one-line answer; `byCause` counts frames and milliseconds by it. A frame no call explains is "outside the rAF
// callbacks (browser / compositor / GPU wait or other main-thread task)": the recorder does not guess what it cannot see. Nothing here reads a file or a browser.

import { battleWindow, frameRows } from './pace-pure.mjs';

const r2 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);
const CALL_KINDS = Object.freeze([
  ['link', /linkProgram|compileShader|getProgramParameter|getShaderParameter|getProgramInfoLog|validateProgram/],
  ['tex', /tex|generateMipmap|compressed|copyTex|blitFramebuffer/],
  ['readback', /getImageData|readPixels|finish|toDataURL|toBlob/],
  ['draw2d', /2d\.drawImage|2d\.putImageData|createPattern|measureText/],
  ['buf', /bufferData/],
]);

/** The ms of the dump's slow calls of each kind inside `[t0, t1]`. */
export function callTotals(gl, t0, t1) {
  const out = { link: 0, tex: 0, readback: 0, draw2d: 0, buf: 0 };
  for (const g of gl) {
    if (g.t < t0 - 0.5 || g.t > t1) continue;
    for (const [k, re] of CALL_KINDS) if (re.test(g.name)) out[k] += g.dur;
  }
  for (const k of Object.keys(out)) out[k] = r2(out[k]);
  return out;
}

const LABEL = { link: 'shader link / compile', tex: 'texture upload', readback: 'canvas / GL readback', draw2d: '2d canvas draws', buf: 'buffer upload' };

/** The one-line cause of a long frame, from its row, the call totals, the harness calls near it. */
export function dominantOf(r, c, harness) {
  const parts = Object.entries(LABEL).map(([k, label]) => [label, c[k]]).sort((a, b) => b[1] - a[1]);
  const known = parts[0][1];
  if (harness.length && r.iv < 120) return `harness call (${harness.join(', ')})`;
  if (known >= 0.5 * r.iv) return parts[0][0];
  if (r.jsPrev >= 0.6 * r.iv) return known >= 0.3 * r.jsPrev ? `script (${parts[0][0]} ${known} ms of ${r2(r.jsPrev)})` : `script (rAF callbacks ${r2(r.jsPrev)} ms)`;
  if (r.heapPrev - r.heap >= 1) return 'script + heap drop (GC?)';
  if (harness.length) return `harness call (${harness.join(', ')})`;
  return 'outside the rAF callbacks (browser / compositor / GPU wait or other main-thread task)';
}

/**
 * The long frames of a run and what each was doing.
 * @param {{dump: object, meta?: object, longMs?: number}} o
 * @returns {{longMs: number, frames: object[], byCause: Record<string, {n: number, ms: number}>}}
 */
export function classifyLongFrames({ dump, meta = {}, longMs = 33.5 }) {
  const d = dump;
  const win = battleWindow(d.screens ?? [], d.fStart[d.n - 1]);
  if (win.b0 === null) return { longMs, frames: [], byCause: {} };
  const { b0, b1, pauses } = win;
  const inPause = (t) => pauses.some(([a, b]) => t >= a && t <= b);
  const gl = (d.gl ?? []).map(([t, name, dur, a, b]) => ({ t, name, dur, a, b }));
  const toPage = (epoch) => epoch - d.timeOrigin;
  const shots = (meta.screenshots ?? []).map(([s, ms]) => [toPage(s), toPage(s) + ms]);
  const calls = (d.harness ?? []).map(([t, name, dur]) => [t, t + dur, name]);
  const harnessNear = (t0, t1) => {
    const hits = [];
    for (const [a, b, name] of calls) if (b >= t0 && a <= t1) hits.push(name);
    for (const [a, b] of shots) if (b >= t0 && a <= t1) hits.push('screenshot');
    return hits;
  };
  const rows = frameRows(d, b0, b1).filter((r) => !inPause(r.t) && r.iv > longMs);
  const frames = rows.map((r) => {
    const t0 = r.t - r.gap, t1 = r.t;
    const c = callTotals(gl, t0, t1);
    const hh = [...new Set(harnessNear(t0 - 0.5, t1))];
    const loaf = (d.loaf ?? []).filter((l) => l.t + l.d >= t0 && l.t <= t1).map((l) => ({ d: l.d, blk: l.blk, scripts: (l.scripts ?? []).slice(0, 4).map((s) => ({ d: s.d, forced: s.forced, fn: s.fn, type: s.type })) }));
    return { relSec: r2(r.rel), interval: r2(r.iv), gap: r2(r.gap), jsPrev: r2(r.jsPrev), ...c, harness: hh, gcDrop: r2(r.heapPrev - r.heap), loaf, dominant: dominantOf(r, c, hh) };
  });
  const byCause = {};
  for (const f of frames) {
    const k = f.dominant.replace(/\(.*\)/, '').trim();
    const e = (byCause[k] ??= { n: 0, ms: 0 });
    e.n++;
    e.ms = r2(e.ms + f.interval);
  }
  return { longMs, frames, byCause };
}
