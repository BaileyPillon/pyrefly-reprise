#!/usr/bin/env node
/**
 * Songstress options at battle size (FFX-2 only). Real keys from the title into Chapter VI
 * (ffx2-leblanc) on a production build served by a scratch server whose override folder holds ONE
 * option's candidate idle (nothing is written to public/art). At the first command menu the option's
 * girl is re-dressed with the stage's own spherechange path, `stage.setArt(girl, '<girl>-songstress')`
 * (a LABELLED staging step: it shows the painting where a spherechange would, without spending the
 * turn), the other two girls stay in their shipped paintings, and a 1600x900 JPEG is taken.
 *   PYREFLY_BROWSER=gpu node capture-options.mjs <baseUrl> <girl> <outJpg> [W] [H]
 */
import { chromium } from 'playwright';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';
import fs from 'node:fs';

const [base, girl, out, W = '1600', H = '900'] = process.argv.slice(2);
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const b = await chromium.launch({ headless: true, args: currentChromiumArgs() });
const mobile = +W < 768;
const ctx = await b.newContext({ viewport: { width: +W, height: +H }, hasTouch: mobile, isMobile: mobile });
const page = await ctx.newPage();
const errs = []; const bad = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
const screen = () => page.evaluate(() => window.__pyrefly.screen()).catch(() => null);
const text = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')).catch(() => '');
const press = async (k, w = 300) => { await page.keyboard.press(k); await page.waitForTimeout(w); };

await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
await page.evaluate(() => window.__pyrefly.setSeed(1));
await page.waitForTimeout(1200);
await press('Enter', 2500);
if (/NEVER SHOW THIS AGAIN/i.test(await text()) || (await screen()) === 'title') await press('Enter', 2500);
for (let i = 0; i < 60 && (await screen()) !== 'chapter-select'; i++) await page.waitForTimeout(300);
const sel = () => page.evaluate(() => window.__pyrefly.snapshotState()['screenState']?.selectedId).catch(() => null);
const CH = process.env.CH || 'ffx2-leblanc';
for (let i = 0; i < 24 && (await sel()) !== CH; i++) await press('ArrowRight', 350);
log('selected', await sel());
await press('Enter', 1500);
for (let i = 0; i < 400; i++) {
  const s = await screen();
  if (s === 'battle') break;
  if (s === 'cutscene' || s === 'party-prep') { await press('Enter', s === 'party-prep' ? 1200 : 700); continue; }
  await page.waitForTimeout(300);
}
log('screen', await screen());
// wait for the first command menu (the fight is waiting on a human)
for (let i = 0; i < 200; i++) {
  const t = await text();
  if (/FIRST TIME ONLY/i.test(t)) { await press('Enter', 700); continue; }
  const pm = await page.evaluate(() => !!window.__pyrefly.battle()?.battlePresenter?.pendingMenu).catch(() => false);
  if (pm) break;
  await page.waitForTimeout(200);
}
const art = `${girl}-songstress`;
const r = await page.evaluate(async ([g, a]) => {
  const st = window.__pyrefly.battle().stage;
  await st.setArt(g, a);
  return st.snapshot().filter((x) => x.side === 'party').map((x) => `${x.id}:${x.art}`);
}, [girl, art]);
log('STAGED (labelled): stage.setArt', girl, art, '->', r.join(' '));
await page.waitForTimeout(2500);
const ph = await page.evaluate((g) => { const a = window.__pyrefly.battle().stage.actor(g); const s = a.slots?.[a.active]; const t = a.poses.get(s.pose); return { url: t?.url, placeholder: !!t?.placeholder, pose: s.pose }; }, girl);
log('actor', JSON.stringify(ph));
fs.mkdirSync(out.replace(/[^/\\]+$/, ''), { recursive: true });
await page.screenshot({ path: out, type: 'jpeg', quality: 80 });
fs.writeFileSync(out.replace(/\.jpg$/, '.json'), JSON.stringify({ chapter: CH, viewport: `${W}x${H}`, girl, art, party: r, actor: ph, staged: 'stage.setArt at the first command menu (labelled; the same presentation path a spherechange uses, turn not spent)', http4xx: bad, errors: errs.slice(0, 10) }, null, 1));
log('shot', out, 'placeholder', ph.placeholder, '4xx', bad.length);
await b.close();
