/** Shared boot helpers for the pass-2 adversarial rigs. */
import { chromium } from 'playwright';

export const PORT = Number(process.env.PORT ?? 5541);
export const OUT = 'D:/Final Fantasy/docs/screenshots/fix3/prerelease/ffx2-hud';
export const ARGS_GPU = [
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--enable-gpu-rasterization',
  '--use-angle=d3d11',
  '--disable-gpu-sandbox',
];

export async function launch() {
  return chromium.launch({ args: ARGS_GPU });
}

export async function newPage(browser, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.routeWebSocket('**', () => {});
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('  [pageerror] ' + e.message));
  return { ctx, page };
}

export async function bootBattle(page, chapter, speed = 'normal') {
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction('window.__pyreflyReady === true', null, { timeout: 300000 });
  await page.evaluate((c) => {
    window.__pyrefly.setSeed(7);
    window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true }).catch(() => {});
  }, chapter);
  await page.waitForFunction(
    () => window.__pyrefly.screen() === 'battle' && document.querySelectorAll('.ffx2hud__party .ig-stat').length >= 3,
    null,
    { timeout: 600000 },
  );
  await page.evaluate((s) => window.__pyrefly.setBattleSpeed(s), speed);
  for (let i = 0; i < 40; i++) {
    const n = await page.evaluate(() => document.querySelectorAll('.ffx2hud__command .ig-cmd-stack > *').length);
    if (n > 0) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
  }
  await page.waitForTimeout(1200);
}

/** Read the command window exactly as the builder's rig does, plus a few extras. */
export const READ_MENU = () => ({
  screen: window.__pyrefly.screen(),
  title: (document.querySelector('.ffx2cmd__title')?.textContent || '').trim(),
  rows: [...document.querySelectorAll('.ffx2hud__command .ig-cmd')].map((r) => {
    const rb = r.getBoundingClientRect();
    const l = r.querySelector('.ffx2cmd__label');
    const g = r.querySelector('.ffx2cmd__grants');
    const lb = l?.getBoundingClientRect();
    return {
      text: (r.textContent || '').replace(/\s+/g, ' ').trim(),
      gate: r.classList.contains('ffx2cmd--gate'),
      row: rb ? { l: +rb.left.toFixed(1), t: +rb.top.toFixed(1), w: +rb.width.toFixed(1), h: +rb.height.toFixed(1) } : null,
      label: l
        ? {
            text: l.textContent,
            sw: l.scrollWidth,
            cw: l.clientWidth,
            clipped: l.scrollWidth > l.clientWidth + 1,
            // The thing scrollWidth cannot see when overflow is VISIBLE: does
            // the painted text box stick out past the row it lives in?
            paintOutRight: lb && rb ? +(lb.right - rb.right).toFixed(1) : null,
            paintOutLeft: lb && rb ? +(rb.left - lb.left).toFixed(1) : null,
            overflow: getComputedStyle(l).overflow,
          }
        : null,
      grants: g ? { text: g.textContent, sw: g.scrollWidth, cw: g.clientWidth, clipped: g.scrollWidth > g.clientWidth + 1 } : null,
    };
  }),
  stack: (() => {
    const s = document.querySelector('.ffx2hud__command');
    if (!s) return null;
    const b = s.getBoundingClientRect();
    return {
      l: +b.left.toFixed(1),
      t: +b.top.toFixed(1),
      r: +b.right.toFixed(1),
      b: +b.bottom.toFixed(1),
      scrollH: s.scrollHeight,
      clientH: s.clientHeight,
      overflowing: s.scrollHeight > s.clientHeight + 1,
    };
  })(),
  reticles: document.querySelectorAll('.ig-reticle').length,
});

/** Walk the top rows to the one whose label matches, with real arrow keys. */
export async function arrowTo(page, want, max = 12) {
  for (let i = 0; i < max; i++) {
    const sel = await page.evaluate(() => {
      const r = document.querySelector('.ffx2hud__command .ig-cmd--selected');
      return r ? (r.querySelector('.ffx2cmd__label')?.textContent || '').trim() : null;
    });
    if (sel === want) return true;
    if (sel === null) return false;
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(110);
  }
  return false;
}

/** Wait until a command window with rows is open (a fresh actor's turn). */
export async function waitMenu(page, ms = 60000) {
  return page
    .waitForFunction(() => document.querySelectorAll('.ffx2hud__command .ig-cmd').length > 0, null, { timeout: ms })
    .then(() => true)
    .catch(() => false);
}
