// Real-touch helpers for the r43-prepphone proof (scratch, not product code).
// A tap is Playwright's touchscreen.tap (touchStart + touchEnd through the browser's input pipeline); a drag is CDP
// Input.dispatchTouchEvent with a hold before the release, so the finger leaves at rest and the page does not fling (a tap that lands
// in a fling only stops it, as on a real phone, and would be swallowed).

export async function hit(page, selector, nth = 0) {
  return page.evaluate(
    ({ selector, nth }) => {
      const el = document.querySelectorAll(selector)[nth];
      if (!el) return { found: false };
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const top = document.elementFromPoint(cx, cy);
      return {
        found: true,
        box: { x: r.left, y: r.top, w: r.width, h: r.height },
        cx,
        cy,
        inView: r.left >= -0.5 && r.right <= innerWidth + 0.5 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5,
        covered: !(top && (el === top || el.contains(top))),
        topEl: top ? `${top.tagName.toLowerCase()}.${String(top.className).slice(0, 40)}` : null,
      };
    },
    { selector, nth },
  );
}

/**
 * Tap the centre of an element by touch. Throws when it is missing, off screen or covered by something else.
 * `partial`: an element running past the window (a tab in the strip) is tapped at the centre of the part that shows, when 36 px or more does.
 */
export async function tapSel(page, selector, nth = 0, { wait = 350, partial = false } = {}) {
  let h = await hit(page, selector, nth);
  if (!h.found) throw new Error(`tap: no element ${selector}[${nth}]`);
  if (!h.inView && partial) {
    const vw = await page.evaluate(() => innerWidth);
    const x0 = Math.max(0, h.box.x);
    const x1 = Math.min(vw, h.box.x + h.box.w);
    if (x1 - x0 >= 36 && h.box.y >= 0 && h.box.y + h.box.h <= (await page.evaluate(() => innerHeight))) {
      const cx = (x0 + x1) / 2;
      const cy = h.cy;
      const top = await page.evaluate(([x, y, sel, n]) => { const el = document.querySelectorAll(sel)[n]; const t = document.elementFromPoint(x, y); return !!(t && (el === t || el.contains(t))); }, [cx, cy, selector, nth]);
      h = { ...h, cx, inView: true, covered: !top, partial: true };
    }
  }
  if (!h.inView) throw new Error(`tap: ${selector}[${nth}] is not fully in view ${JSON.stringify(h.box)}`);
  if (h.covered) throw new Error(`tap: ${selector}[${nth}] is covered by ${h.topEl}`);
  await page.touchscreen.tap(h.cx, h.cy);
  await page.waitForTimeout(wait);
  return h;
}

/** The vertical centre of the tab strip right now (it sits under the eyebrow at the top of the page and pins to y=0 once the page scrolls). */
export const stripY = (page) => page.evaluate(() => { const r = document.querySelector('.prep__tabs').getBoundingClientRect(); return r.top + r.height / 2; });

/** A touch drag from (x0,y0) to (x1,y1) that ends at rest. */
export async function drag(page, x0, y0, x1, y1, { steps = 14, stepMs = 16, holdMs = 160 } = {}) {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= steps; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps }] });
      await page.waitForTimeout(stepMs);
    }
    await page.waitForTimeout(holdMs);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/** Wait until `.prep` scrollTop has not moved for `ms`. Returns it. */
export async function settle(page, ms = 350, max = 4000) {
  let last = -1;
  let since = Date.now();
  const t0 = Date.now();
  for (;;) {
    const top = await page.evaluate(() => document.querySelector('.prep')?.scrollTop ?? 0);
    if (top !== last) {
      last = top;
      since = Date.now();
    } else if (Date.now() - since >= ms) return top;
    if (Date.now() - t0 > max) return top;
    await page.waitForTimeout(60);
  }
}

export const scrollInfo = (page) =>
  page.evaluate(() => {
    const p = document.querySelector('.prep');
    return { top: p.scrollTop, max: p.scrollHeight - p.clientHeight, sh: p.scrollHeight, ch: p.clientHeight };
  });

/** Scroll the stacked page by touch until it rests at (or as near as the drags get to) `target` px. The first ~15 px of a drag is the touch slop. */
export async function scrollTo(page, target, W, H) {
  for (let i = 0; i < 8; i++) {
    const { top, max } = await scrollInfo(page);
    const want = Math.max(0, Math.min(max, target));
    if (Math.abs(top - want) <= 2) return top;
    const dy = want - top; // positive: the page moves down the content, so the finger moves up
    const span = Math.min(Math.abs(dy) + 18, H - 330); // the first ~15 px of a drag is the touch slop and moves nothing
    const y0 = dy > 0 ? H - 130 : 190;
    const y1 = dy > 0 ? y0 - span : y0 + span;
    await drag(page, Math.round(W / 2), y0, Math.round(W / 2), y1);
    await settle(page);
  }
  return (await scrollInfo(page)).top;
}
