// Shared helpers for the fb-0929 sphere-grid probes (headless Playwright, GPU mode).
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';

export const OUT = 'D:/Tools/pyrefly-scratch/fb-0929/sphere';
export const GPU_ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--autoplay-policy=no-user-gesture-required'];

export async function open(url, { width = 1600, height = 900, mobile = false } = {}) {
  const browser = await chromium.launch({ headless: true, args: GPU_ARGS });
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' }
      : { viewport: { width, height }, deviceScaleFactor: 1 },
  );
  const page = await ctx.newPage();
  await page.addInitScript(HOOK);
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  return { browser, ctx, page, logs };
}

export async function shot(page, name) {
  const p = `${OUT}/${name}.jpg`;
  await page.screenshot({ path: p, type: 'jpeg', quality: 82 });
  return p;
}

/**
 * Records, per sphere-grid render, where the portrait tokens were drawn (the selected
 * character's is the last) and the ZOOM readout, so a probe can turn a node id into a
 * screen point without any hook inside the game.
 */
const HOOK = () => {
  const P = CanvasRenderingContext2D.prototype;
  const isGrid = (ctx) => ctx.canvas?.parentElement?.classList?.contains('ffxprep-sg__canvas');
  const clear = P.clearRect;
  P.clearRect = function (...a) { if (isGrid(this)) window.__sgRec = { tokens: [], zoom: null, a: this.getTransform().a }; return clear.apply(this, a); };
  const di = P.drawImage;
  P.drawImage = function (...a) {
    if (isGrid(this) && a.length === 9 && window.__sgRec) window.__sgRec.tokens.push({ cx: a[5] + a[7] / 2, cy: a[6] + a[8] / 2, r: a[7] / 2 });
    return di.apply(this, a);
  };
  const ft = P.fillText;
  P.fillText = function (t, x, y, ...rest) {
    if (isGrid(this) && window.__sgRec && typeof t === 'string' && t.startsWith('ZOOM ')) window.__sgRec.zoom = Number(t.slice(5).split('x')[0]);
    return ft.call(this, t, x, y, ...rest);
  };
};

export const sleep =(ms) => new Promise((r) => setTimeout(r, ms));

export async function screen(page) {
  return page.evaluate(() => window.__pyrefly.screen());
}

import { readFileSync } from 'node:fs';
const GRID = JSON.parse(readFileSync('D:/pyrefly-r29-options/src/data/ffx/sphere-grid/standard-grid.json', 'utf8'));
export const NODE = new Map(GRID.nodes.map((n) => [n.id, n]));
export const NEIGH = (() => {
  const m = new Map();
  const add = (a, b) => { if (a === b) return; if (!m.has(a)) m.set(a, new Set()); m.get(a).add(b); };
  for (const n of GRID.nodes) for (const o of n.links) add(n.id, o);
  for (const l of GRID.links) { add(l.a, l.b); add(l.b, l.a); }
  return m;
})();

/** The selected member's build as the prep screen holds it. */
export async function member(page) {
  return page.evaluate(() => {
    const s = window.__pyrefly.app.current;
    const b = s?.chapter?.buildRef;
    const i = s?.member ?? 0;
    const m = b?.members?.[i];
    return m ? { id: m.id, sLv: m.sphereGrid.sLv, pos: m.sphereGrid.position, act: m.sphereGrid.activatedNodeIds.length, stats: { ...m.stats }, hp: m.hp, learned: m.learnedAbilityIds.length, pouch: { ...b.sphereInventory } } : null;
  });
}

/** Screen (CSS px) point of a node id, from the last render's selected token. */
export async function nodePoint(page, nodeId) {
  const me = await member(page);
  const rec = await page.evaluate(() => {
    const c = document.querySelector('.ffxprep-sg__canvas canvas');
    const r = c.getBoundingClientRect();
    return { rec: window.__sgRec, rect: { x: r.x, y: r.y, w: r.width }, bw: c.width };
  });
  const tok = rec.rec.tokens.at(-1);
  const radius = tok.r;
  const zoom = radius > 6.01 && radius < 10.99 ? radius / 1.5 / 10.5 : rec.rec.zoom;
  const pos = NODE.get(Number(me.pos));
  const panX = tok.cx - pos.x * zoom;
  const panY = tok.cy - pos.y * zoom;
  const n = NODE.get(nodeId);
  const ax = panX + n.x * zoom;
  const ay = panY + n.y * zoom;
  const k = rec.rec.a * (rec.rect.w / rec.bw);
  return { x: rec.rect.x + ax * k, y: rec.rect.y + ay * k, zoom };
}

export async function sg(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s)?.textContent?.replace(/\s+/g, ' ').trim();
    return { head: q('.ffxprep-sg__head'), caption: q('.ffxprep-sg__caption'), roster: q('.prep__member--sel .prep__member-lv') };
  });
}

export async function toPrep(page) {
  await page.locator('#ui [data-action=confirm]', { hasText: 'Press' }).first().click();
  await sleep(900);
  if ((await screen(page)) !== 'chapter-select') { await page.keyboard.press('Enter'); await sleep(900); }
  await page.locator('#ui [data-action=fe-card-0]').first().click();
  await sleep(1200);
  for (let i = 0; i < 4 && (await screen(page)) !== 'party-prep'; i++) { await page.keyboard.press('Escape'); await sleep(900); }
}

/** Drag the grid so a node sits in the canvas centre, then return its point. */
export async function bringIntoView(page, id) {
  const r = await page.evaluate(() => { const b = document.querySelector('.ffxprep-sg__canvas canvas').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  let p = await nodePoint(page, id);
  const inside = p.x > r.x + 20 && p.x < r.x + r.w - 20 && p.y > r.y + 20 && p.y < r.y + r.h - 40;
  if (inside) return p;
  const cx = r.x + r.w / 2; const cy = r.y + r.h / 2 - 10;
  // Drag from the centre by (centre - p): keep the drag inside the canvas in steps.
  let dx = cx - p.x; let dy = cy - p.y;
  while (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
    const sx = Math.max(-r.w / 3, Math.min(r.w / 3, dx)); const sy = Math.max(-r.h / 3, Math.min(r.h / 3, dy));
    await page.mouse.move(cx - sx / 2, cy - sy / 2); await page.mouse.down();
    for (let k = 1; k <= 6; k++) await page.mouse.move(cx - sx / 2 + (sx * k) / 6, cy - sy / 2 + (sy * k) / 6);
    await page.mouse.up(); await sleep(150);
    dx -= sx; dy -= sy;
  }
  p = await nodePoint(page, id);
  return p;
}
