/**
 * The in-page half of the fight-start timeline (`tools/fight-start-timeline.mjs`; post-conference lane "post-fight-start", both games; measurement only, it changes nothing the player sees).
 *
 * `INSTRUMENT` is a function Playwright serialises into the page (`addInitScript`), so it must be self-contained. It writes marks on `window.__ft` with the page's own clock (`performance.now()`):
 *
 *   - AT THE CALL, not at the next frame: the screen stack (`push` / `enter-done` / `pop` with the screen's name, from a wrapper on `App.prototype`), the scene's last step (`scene-finished`: its `done` resolving) and the DOM the fight start puts up and takes down
 *     (`entry-add` / `entry-remove` for the entry overlay, `loadcard-add` / `-remove` for the card over it, `bosscard-add` / `-remove` for the battle's own boss card, from wrappers on
 *     `appendChild` and `remove`). A frame loop would see these only after a long task ends, and the fight start has tasks of 0.5 to 1.4 s right where the entry begins.
 *   - FROM A FRAME LOOP (late by at most a frame, or by a long task): the presenter's phase (`arrival`, `moment:battle-start` = the opening sweep, `decision`, `command:<actor>`), the camera rig, the first
 *     command menu (`menu`), and the dialogue box's lines.
 *
 * It also keeps every frame gap over 24 ms (`gaps`), the long tasks and long animation frames (`long`, `loaf`) and the resources the page fetched (`res`).
 */

/** @returns {void} */
export const INSTRUMENT = () => {
  const T = { marks: [], gaps: [], frames: 0, long: [], loaf: [], res: [] };
  window.__ft = T;
  const now = () => performance.now();
  const mark = (k, v) => T.marks.push({ t: Math.round(now() * 10) / 10, k, v: v ?? null });
  T.mark = mark;
  const last = {};
  const change = (k, v) => {
    if (last[k] !== v) {
      last[k] = v;
      mark(k, v);
    }
  };

  // ---- marks at the call -------------------------------------------------------------------------------------------------------------------------------------------------
  const kindOf = (node) => {
    if (!node || node.nodeType !== 1) return null;
    const cls = typeof node.className === 'string' ? node.className : '';
    if (/(^|\s)(pf-entry|pf-swirl)(\s|$)/.test(cls)) return ['entry', cls.replace(/\s+/g, ' ').trim()];
    const role = node.dataset?.role;
    if (role === 'battle-start-loading') return ['loadcard', null];
    if (role === 'battle-start') return ['bosscard', null];
    return null;
  };
  const origAppend = Node.prototype.appendChild;
  Node.prototype.appendChild = function (child) {
    const r = origAppend.call(this, child);
    try { const k = kindOf(child); if (k) mark(`${k[0]}-add`, k[1]); } catch { /* never in the way */ }
    return r;
  };
  const origRemove = Element.prototype.remove;
  Element.prototype.remove = function () {
    try { const k = kindOf(this); if (k) mark(`${k[0]}-remove`, k[1]); } catch { /* never in the way */ }
    return origRemove.call(this);
  };
  let appHooked = false;
  const hookApp = (api) => {
    const proto = Object.getPrototypeOf(api.app);
    const push = proto.push;
    proto.push = function (screen) {
      mark('push', screen?.name ?? null);
      // the scene's last step: its `done` resolves there (a frame loop never sees it: the flow goes on to the entry in the same task)
      if (screen?.name === 'cutscene' && typeof screen.done?.then === 'function') screen.done.then(() => mark('scene-finished', true));
      const p = push.call(this, screen);
      return Promise.resolve(p).then((v) => { mark('enter-done', screen?.name ?? null); return v; });
    };
    const popInternal = proto.popInternal;
    proto.popInternal = function () {
      const top = this.stack?.[this.stack.length - 1];
      mark('pop', top?.name ?? null);
      return popInternal.call(this);
    };
    appHooked = true;
  };

  // ---- observers ---------------------------------------------------------------------------------------------------------------------------------------------------------
  let prevFrame = now();
  let n = 0;
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) T.long.push([Math.round(e.startTime * 10) / 10, Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] });
  } catch { /* unsupported */ }
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const scripts = (e.scripts ?? []).map((s) => ({ d: Math.round(s.duration), fn: String(s.sourceFunctionName || s.invoker || '').slice(0, 60), t: String(s.invokerType || '') }));
        T.loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), block: Math.round(e.blockingDuration ?? 0), scripts: scripts.sort((a, b) => b.d - a.d).slice(0, 3) });
      }
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch { /* unsupported */ }
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) T.res.push([Math.round(e.startTime), Math.round(e.responseEnd - e.startTime), (e.name || '').replace(location.origin, '').slice(0, 110), e.transferSize === 0 ? 'cache' : 'net']);
    }).observe({ type: 'resource', buffered: true });
  } catch { /* unsupported */ }

  // ---- the frame loop ----------------------------------------------------------------------------------------------------------------------------------------------------
  const tick = (ts) => {
    n++;
    const t = ts || now();
    const gap = t - prevFrame;
    if (gap > 24) T.gaps.push([Math.round(t * 10) / 10, Math.round(gap * 10) / 10]);
    prevFrame = t;
    T.frames = n;
    try {
      const api = window.__pyrefly;
      if (api?.app && !appHooked) hookApp(api);
      const scr = api?.app?.current?.name ?? null;
      change('screen', scr);
      const dbox = document.querySelector('.dbox');
      if (dbox) {
        const line = (dbox.textContent || '').trim().slice(0, 48);
        if (line && line !== last['line']) change('line', line);
      }
      if (scr === 'battle') {
        const b = api.battle?.();
        const p = b?.presenter ?? null;
        if (p) {
          if (n % 3 === 0 || last['phase'] == null) change('phase', String(p.snapshot?.().phase ?? ''));
          change('menu', p.pendingMenu != null ? String(p.pendingMenu.actorId) : '');
          change('rig', String(b.scene?.battleCamera?.rigName ?? ''));
        }
      }
    } catch (err) {
      change('instrument-error', String(err).slice(0, 80));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
