// Review-only wrapper (no product code): runs critic/runner/lib/route.mjs with a frame-time recorder injected into every page, and logs a summary every 5 s to <FPSLOG>.
// usage: FPSLOG=file node route-fps.mjs <route args...>
import { chromium } from 'file:///D:/pyrefly-release55/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const log = process.env.FPSLOG || 'fps.log';
const origLaunch = chromium.launch.bind(chromium);
chromium.launch = async (...a) => {
  const b = await origLaunch(...a);
  const oc = b.newContext.bind(b);
  b.newContext = async (...c) => {
    const ctx = await oc(...c);
    await ctx.addInitScript(() => {
      const st = { n: 0, sum: 0, max: 0, over50: 0, over100: 0, over250: 0, t0: performance.now(), last: 0 };
      window.__fpsw = st;
      const tick = (t) => {
        if (st.last) {
          const d = t - st.last;
          st.n++; st.sum += d; if (d > st.max) st.max = d;
          if (d > 50) st.over50++; if (d > 100) st.over100++; if (d > 250) st.over250++;
        }
        st.last = t;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setInterval(() => {
        let scr = '', look = null;
        try { scr = window.__pyrefly.screen(); look = window.__pyrefly.look?.stats?.(); } catch {}
        console.log('FPSW ' + JSON.stringify({ scr, n: st.n, avgMs: st.n ? +(st.sum / st.n).toFixed(1) : 0, max: Math.round(st.max), o50: st.over50, o100: st.over100, o250: st.over250, look: look ? { look: look.look, q: look.quality, room: look.room } : null }));
        st.n = 0; st.sum = 0; st.max = 0; st.over50 = 0; st.over100 = 0; st.over250 = 0;
      }, 5000);
    });
    ctx.on('page', (p) => p.on('console', (m) => { const t = m.text(); if (t.startsWith('FPSW')) fs.appendFileSync(log, t + '\n'); }));
    return ctx;
  };
  return b;
};
process.argv.splice(1, 1, 'D:/pyrefly-release55/critic/runner/lib/route.mjs');
await import('file:///D:/pyrefly-release55/critic/runner/lib/route.mjs');
