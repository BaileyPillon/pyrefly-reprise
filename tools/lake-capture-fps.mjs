/**
 * The frame-rate counter of `tools/lake-capture.mjs` (the hidden Wendigo chapter's capture tool; FFX only), split out of it by the r78-fix2 pass so each file stays under 400 lines (house rule 7).
 * `frameCounter(page, fps, log)` returns `framesStart()` and `framesStop(label)`; the stop writes the label's mean, 99th percentile and worst-1-percent frame rate into `fps`.
 */
export function frameCounter(page, fps, log) {
  /** The page's frame counter (requestAnimationFrame deltas), made on first use: the game is already loaded when the tool starts the first window, so an init script would never run. */
  const framesStart = () =>
    page.evaluate(() => {
      if (!window.__frames) {
        window.__frames = { on: false, d: [], last: 0 };
        const tick = (t) => {
          const f = window.__frames;
          if (f.on && f.last) f.d.push(t - f.last);
          f.last = t;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      window.__frames.d = [];
      window.__frames.on = true;
    });
  const framesStop = async (label) => {
    const d = await page.evaluate(() => { if (!window.__frames) return []; window.__frames.on = false; return window.__frames.d.slice(); });
    if (d.length < 10) return;
    const s = [...d].sort((a, b) => a - b);
    const mean = d.reduce((a, b) => a + b, 0) / d.length;
    const worst1 = s.slice(Math.floor(s.length * 0.99));
    fps[label] = { frames: d.length, meanMs: +mean.toFixed(2), fps: +(1000 / mean).toFixed(1), p99Ms: +s[Math.floor(s.length * 0.99)].toFixed(1), worst1PctFps: +(1000 / (worst1.reduce((a, b) => a + b, 0) / worst1.length)).toFixed(1), over20ms: +(d.filter((x) => x > 20).length / d.length).toFixed(3) };
    log(`fps.${label}`, fps[label]);
  };
  return { framesStart, framesStop };
}
