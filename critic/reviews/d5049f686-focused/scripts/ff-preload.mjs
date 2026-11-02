// Node preload for the r73 motion lane (loaded with NODE_OPTIONS=--import into continuity.mjs and its route.mjs child). Measuring only; nothing here ships.
// FF_MODE=observe : every page the route opens gets (1) the Vite HMR socket stubbed (a save by another agent cannot reload the page mid-run), (2) a per-frame sampler of the presenter's playback speed
//                   (read from the screen stack, no snapshot), the R presses, and the damage numerals (.dnum / .pf-num) with the time they appeared, all sent to FF_LOG (JSONL) through an exposed function.
// FF_MODE=force   : the same, and on every frame of a battle the speed is read BEFORE the game's own update; when it is not 'fast' (an R press ends a forced fast: FastForwardHold) it is set back with
//                   window.__pyrefly.setBattleSpeed('fast') and the deviation is logged (that line is a "re-assertion").
import { createRequire } from 'node:module';
import fs from 'node:fs';

const mode = process.env.FF_MODE;
const logFile = process.env.FF_LOG;
if (mode && logFile) {
  const req = createRequire('D:/pyrefly-release55/package.json');
  const { chromium } = req('playwright');
  const FORCE = mode === 'force';
  const SCRIPT = `(() => {
    if (window.__ff) return;
    const FORCE = ${FORCE ? 'true' : 'false'};
    const Real = window.WebSocket;
    const isHmr = (p) => p === 'vite-hmr' || (Array.isArray(p) && p.includes('vite-hmr'));
    const Stub = function (url, protocols) {
      if (!isHmr(protocols)) return new Real(url, protocols);
      return { readyState: 3, url: String(url), addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; }, send() {}, close() {}, onopen: null, onclose: null, onerror: null, onmessage: null };
    };
    Stub.prototype = Real.prototype;
    Object.assign(Stub, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
    window.WebSocket = Stub;
    const F = (window.__ff = { force: FORCE, frames: 0, battleFrames: 0, reasserts: 0, rPresses: 0, speedFrames: {}, numerals: 0, started: performance.now() });
    const send = (o) => { try { window.__ffLog(JSON.stringify(o)); } catch (e) {} };
    addEventListener('keydown', (e) => { if (!e.repeat && (e.code === 'KeyR' || e.key === 'r' || e.key === 'R')) { F.rPresses++; send({ k: 'r', t: Math.round(performance.now()), bf: F.battleFrames }); } }, true);
    const presenter = (p) => { const st = p.app && p.app.screens; if (!st) return null; for (let i = st.length - 1; i >= 0; i--) { const b = st[i] && st[i].battlePresenter; if (b) return b; } return null; };
    let lastSec = 0;
    const tick = (ts) => {
      F.frames++;
      try {
        const p = window.__pyrefly;
        if (p && p.app) {
          const b = presenter(p);
          if (b) {
            F.battleFrames++;
            const sp = b.playbackSpeed;
            F.speedFrames[sp] = (F.speedFrames[sp] || 0) + 1;
            if (FORCE && sp !== 'fast') { F.reasserts++; p.setBattleSpeed('fast'); send({ k: 'reassert', t: Math.round(ts), bf: F.battleFrames, was: sp }); }
            if (ts - lastSec >= 1000) { lastSec = ts; send({ k: 's', t: Math.round(ts), bf: F.battleFrames, speed: sp, phase: (b.snapshot && b.snapshot().phase) || null, reasserts: F.reasserts, r: F.rPresses }); }
          }
        }
      } catch (e) { send({ k: 'err', m: String(e).slice(0, 200) }); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const startObs = () => {
      if (!document.documentElement) return setTimeout(startObs, 50);
      new MutationObserver((muts) => {
        const t = performance.now();
        for (const m of muts) for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          const c = typeof n.className === 'string' ? n.className : '';
          if (/(^|\\s)(dnum|pf-num)(\\s|$)/.test(c)) { F.numerals++; send({ k: 'num', t: Math.round(t * 10) / 10, bf: F.battleFrames, cls: c.slice(0, 60), txt: (n.textContent || '').slice(0, 12) }); }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    };
    startObs();
  })();`;
  if (!chromium.__ffPatched) {
    chromium.__ffPatched = true;
    const origLaunch = chromium.launch.bind(chromium);
    chromium.launch = async (...a) => {
      const browser = await origLaunch(...a);
      const origNew = browser.newContext.bind(browser);
      browser.newContext = async (...x) => {
        const ctx = await origNew(...x);
        await ctx.exposeFunction('__ffLog', (s) => { try { fs.appendFileSync(logFile, s + '\n'); } catch { /* gone */ } });
        await ctx.addInitScript({ content: SCRIPT });
        return ctx;
      };
      return browser;
    };
  }
}
