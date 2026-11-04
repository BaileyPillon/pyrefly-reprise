import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const REPO = 'D:/pyrefly-release55';
const OUT = join(REPO, 'critic/reviews/2342fe666-live');
mkdirSync(join(OUT, 'shots'), { recursive: true });
const BASE = 'https://echoesofspira.com/?cb=' + Date.now();
const lib = await import(pathToFileURL(join(REPO, 'critic/runner/lib/lib.mjs')).href);
const { open, assertScreen, waitBattleMenu, waitFor } = lib;
console.log('MODE', lib.MODE, process.env.PYREFLY_BROWSER);
const res = { steps: [], fails: [] };
const log = (k, v) => { res.steps.push({ k, v }); console.log(k, JSON.stringify(v)); };
const check = (n, ok, d) => { log('check.' + n, { ok, d }); if (!ok) res.fails.push(n); };
const scr = (p) => p.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const guideUp = (p) => p.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
const words = { keeper: 'keeper', infinito: 'infinito', yrp: 'yrp', waker: 'waker' };
const t0 = Date.now();

async function toBoard(page) {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await guideUp(page)) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
}
async function typeWord(page, w) {
  for (let a = 0; a < 3 && (await scr(page)) !== 'party-prep'; a++) {
    if (a > 0 && (await guideUp(page))) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
    await page.keyboard.type(w, { delay: 150 });
    await page.waitForTimeout(2500);
  }
  return scr(page);
}

const c = await open({ base: BASE, fresh: true, width: 812, height: 375, touch: true });
const { page } = c;
try {
  log('tier', await page.evaluate(() => ({ w: innerWidth, h: innerHeight, coarse: matchMedia('(pointer: coarse)').matches })));
  await toBoard(page);
  await page.screenshot({ path: join(OUT, 'shots/phone-board.png') });
  for (const w of ['yrp', 'waker', 'keeper']) {
    await page.keyboard.type(w, { delay: 150 }); await page.waitForTimeout(2500);
    const s = await scr(page);
    log('phone.' + w, s);
    check('phone.' + w + (w === 'keeper' ? ' opens' : ' refused'), w === 'keeper' ? s === 'party-prep' : s === 'chapter-select', s);
    await page.screenshot({ path: join(OUT, `shots/phone-${w}.png`) });
    if (s === 'party-prep') { await page.keyboard.press('Escape'); await page.waitForTimeout(1500); }
  }
} catch (e) { check('script', false, String(e).slice(0, 400)); }
res.consoleErrors = c.consoleErrors; res.notFound = c.notFound;
writeFileSync(join(OUT, 'smoke-phone.json'), JSON.stringify(res, null, 1));
console.log('DONE', res.fails, c.consoleErrors.length, c.notFound.length);
await c.browser.close();
