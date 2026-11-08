import { open, waitBattleMenu } from '../../runner/lib/lib.mjs';
const [, , base, ch] = process.argv;
const r = await open({ base, width: 1600, height: 900, fresh: true });
const { page } = r;
const msgs = []; const fails = [];
page.on('console', (m) => { const t = m.text(); if (/rig|texture|WebGL|image/i.test(t)) msgs.push(m.type() + ': ' + t.slice(0, 300)); });
page.on('requestfailed', (q) => fails.push(q.url() + ' ' + q.failure()?.errorText));
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const sel = () => page.evaluate(() => { try { return window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null; } catch { return null; } });
await page.waitForTimeout(3000);
for (let i = 0; i < 6 && (await scr()) === 'title'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(1500); }
for (let i = 0; i < 25 && (await sel()) !== ch; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250); }
await page.keyboard.press('Enter'); await page.waitForTimeout(1800);
let t0 = Date.now();
while (Date.now() - t0 < 150000 && (await scr()) !== 'battle') { await page.keyboard.press('Enter'); await page.waitForTimeout(600); }
await waitBattleMenu(page, 30000).catch(() => {});
await page.waitForTimeout(2500);
console.log('screen', await scr());
console.log(JSON.stringify(await page.evaluate(() => window.__pyrefly.rigs())).slice(0, 700));
console.log(msgs.join('\n')); console.log('FAILED REQS', JSON.stringify(fails.slice(0, 10))); console.log('404', JSON.stringify(r.notFound.slice(0, 5)));
console.log('gl', await page.evaluate(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); return g ? g.getParameter(g.MAX_TEXTURE_SIZE) + ' ' + (g.getExtension('WEBGL_debug_renderer_info') ? g.getParameter(g.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL) : '') : 'nogl'; }));
await r.browser.close();
