// The node side of the in-page pacing recorder (T-01 of the motion-fluidity pass, lane L5; both games, critic plumbing). PORTED from the pacing lane's pace.mjs.
//
// `installRecorder(ctx, cfg)` puts `pace-init.page.js` into a Playwright context before the game's first line. `createDrainer(getPage)` pulls what the recorder has recorded since the last pull every few
// seconds (the route reloads the page after the fight to check the save, which would wipe everything; the pull keeps it), and `mergeSegments` puts the chunks of each page life back together in the
// shape the recorder's own `dump()` has, which is what `pace-pure.mjs` analyses. Nothing here traces: a DevTools trace makes long frames of its own (60 against 4 in Chapter IV, PACE-08) and a traced
// run is never a pacing number.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACE_INIT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pace-init.page.js');
const ARRAYS = ['fTs', 'fStart', 'fJs', 'fHeap', 'fCbs', 'gl', 'lt', 'loaf', 'ev', 'harness', 'screens', 'gov'];

/** Put the recorder into a context (`cfg`: `{ hz }` for a software refresh rate on an uncapped browser, `{ label }`). Call before the first page is opened. */
export async function installRecorder(ctx, cfg = {}) {
  await ctx.addInitScript({ content: `window.__paceCfg=${JSON.stringify(cfg)};` });
  await ctx.addInitScript({ path: PACE_INIT });
}

/** Chunks of one page life (one `timeOrigin`) become one dump with the shape the recorder's `dump()` has; `gapFrames` counts frames no pull saw. Pure. */
export function mergeSegments(chunks) {
  const segs = new Map();
  for (const { c } of chunks) {
    const k = c.timeOrigin;
    let g = segs.get(k);
    if (!g) {
      g = { timeOrigin: k, n: 0, harnessCount: {}, glDropped: 0, battleSince: null, marks: 0, errors: [], ua: c.ua, dpr: c.dpr, inner: c.inner, chunks: 0, gapFrames: 0 };
      for (const key of ARRAYS) g[key] = [];
      segs.set(k, g);
    }
    if (c.from !== g.n) g.gapFrames += Math.abs(c.from - g.n);
    for (const key of ARRAYS) for (const x of c[key]) g[key].push(x);
    g.n = c.n; g.harnessCount = c.harnessCount; g.glDropped = c.glDropped; g.battleSince = c.battleSince; g.marks = c.marks; g.errors = c.errors; g.chunks++;
  }
  return [...segs.values()];
}

/** A puller: `start(everyMs)` drains the page's recorder on a timer, `finish()` drains once more and returns the segments. A page that is navigating loses that pull (counted in `lost`). */
export function createDrainer(getPage) {
  const d = { chunks: [], busy: false, timer: null, lost: 0 };
  const once = async () => {
    const page = getPage();
    if (d.busy || !page) return;
    d.busy = true;
    try {
      const c = await page.evaluate(() => (window.__pace && window.__pace.drain ? window.__pace.drain() : null));
      if (c) d.chunks.push({ epoch: Date.now(), c });
    } catch { d.lost++; }
    d.busy = false;
  };
  return {
    drain: once,
    start(everyMs = 8000) { d.timer = setInterval(once, everyMs); },
    async finish() { if (d.timer) clearInterval(d.timer); await once(); return mergeSegments(d.chunks); },
    get lost() { return d.lost; },
  };
}

/** The segment with the most frames (the page life the battle was in). */
export function mainSegment(segs) {
  return [...segs].sort((a, b) => b.n - a.n)[0] ?? null;
}

/** Read a `pace.json.gz`-style file (gzipped `{ meta, page }`) back. */
export async function readRun(file) {
  const zlib = await import('node:zlib');
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
}
