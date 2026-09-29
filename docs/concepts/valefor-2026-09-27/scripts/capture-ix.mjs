// agent scratch (valefor options, 2026-09-28): headless production run of Chapter IX to the first
// command menu; saves the frame with the HUD, the frame without it, and every staged actor's
// on-screen box. node tools/zz-valefor-opts-capture.tmp.mjs <outDir> <width> <height>
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { currentChromiumArgs } from '../../../../tools/browser-mode.mjs';

const [dir, W, H] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const mobile = +W < 768;
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
await page.goto('http://127.0.0.1:6811/pyrefly-reprise/');
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180000 });
await page.evaluate(() => { const P = window.__pyrefly; P.setMuted(true); P.markCoachSeen?.(); P.setSeed(1); void P.gotoChapter('yojimbo-cavern', { skipCutscenes: true }); });
const phase = () => page.evaluate(() => window.__pyrefly.battle()?.presenter?.snapshot().phase ?? '');
const t0 = Date.now();
while (Date.now() - t0 < 180000 && !(await phase()).startsWith('command:')) await sleep(150);
await sleep(1500);
const field = await page.evaluate(() => {
  const st = window.__pyrefly.battle().stage; const o = {};
  for (const id of st.staged()) { const r = st.projectRect(id); const a = st.actor(id);
    o[id] = { side: st.sideOf(id), alpha: +(a?.alpha ?? -1).toFixed(2), box: r && [r.x, r.y, r.w, r.h].map(Math.round) }; }
  return { phase: window.__pyrefly.battle().presenter.snapshot().phase, staged: o, version: window.__pyrefly.version };
});
await page.screenshot({ path: `${dir}/ix-${W}x${H}-hud.png` });
await page.evaluate(() => window.__pyrefly.trigger?.('hud:off'));
await sleep(600);
await page.screenshot({ path: `${dir}/ix-${W}x${H}-nohud.png` });
// background plate: the same frame with the party faded out, so a composite can put the aeon BEHIND the party
await page.evaluate(() => { const st = window.__pyrefly.battle().stage; for (const id of st.staged()) if (st.sideOf(id) === 'party') st.actor(id)?.fadeTo?.(0, 1); });
await sleep(700);
await page.screenshot({ path: `${dir}/ix-${W}x${H}-plate.png` });
const bundle =await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s)));
writeFileSync(`${dir}/ix-${W}x${H}.json`, JSON.stringify({ ...field, bundle, errors }, null, 1));
console.log(JSON.stringify({ ...field, bundle, errors }));
await browser.close();
