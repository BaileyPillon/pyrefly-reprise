import { chromium } from 'playwright';
import { currentChromiumArgs } from 'file:///D:/pyrefly-release55/tools/browser-mode.mjs';
import fs from 'node:fs';
const OUT = 'D:/pyrefly-release55/critic/reviews/01a767770-live';
const LIVE = 'https://echoesofspira.com/';
const b = await chromium.launch({ headless: true, args: currentChromiumArgs(process.env) });
const page = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
const errs = [], nf = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
page.on('response', (r) => { if (r.status() === 404) nf.push(r.url()); });
const sn = () => page.evaluate(() => window.__pyrefly?.app?.current?.name ?? null);
const save = () => page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
const out = [];
const L = (s, o, d) => { out.push({ s, o, d }); console.log(o ? '[OK]' : '[FAIL]', s, d ?? ''); };
await page.goto(LIVE + '?livesmoke2=' + Date.now());
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 40000 });
for (let i = 0; i < 12 && (await sn()) !== 'chapter-select'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
let bd = await page.evaluate(() => window.__pyrefly.app.current.snapshot());
const id = 'seymour-omnis';
for (let s = 0; bd.selectedId !== id && s < 30; s++) { await page.keyboard.press(bd.order.indexOf(id) > bd.order.indexOf(bd.selectedId) ? 'ArrowRight' : 'ArrowLeft'); await page.waitForTimeout(150); bd = await page.evaluate(() => window.__pyrefly.app.current.snapshot()); }
L('cursor on XII', bd.selectedId === id);
await page.keyboard.press('Enter');
for (let i = 0; i < 40 && (await sn()) !== 'party-prep'; i++) await page.waitForTimeout(500);
await page.waitForTimeout(600); await page.keyboard.press('Enter');
for (let i = 0; i < 80 && (await sn()) !== 'battle'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
for (let i = 0; i < 200; i++) { if (await page.evaluate(() => window.__pyrefly?.snapshotState?.()?.screenState?.playback?.awaitingMenu === true)) break; await page.waitForTimeout(300); }
L('XII at player turn', (await sn()) === 'battle');
await page.waitForTimeout(1500); await page.keyboard.press('KeyP'); await page.waitForTimeout(800);
L('1st Escape (guide card absorbs or pauses)', true, await sn());
if ((await sn()) !== 'pause') { await page.keyboard.press('KeyP'); await page.waitForTimeout(800); }
L('Escape reaches pause', (await sn()) === 'pause', await sn());
await page.screenshot({ path: OUT + '/xii-pause.png' });
console.log(await page.evaluate(() => document.querySelector('.pause')?.innerText?.slice(0, 500)));
const s0 = await save();
for (let i = 0; i < 12; i++) { const t = await page.evaluate(() => { const el = document.querySelector('.pause [aria-selected="true"], .pause [class*="tab"][class*="on"], .pause [class*="tab--sel"], .pause [class*="active"]'); return el?.textContent?.trim() ?? null; }); if (t && /^guide/i.test(t)) break; await page.keyboard.press('KeyE'); await page.waitForTimeout(300); }
for (const k of ['ArrowDown', 'ArrowLeft', 'Enter']) { await page.keyboard.press(k); await page.waitForTimeout(300); }
await page.screenshot({ path: OUT + '/xii-pause-options.png' });
await page.keyboard.press('KeyP'); await page.waitForTimeout(800); const s1 = await save(); L('pause settings change persisted to save', s0 !== s1, `len ${s0?.length}->${s1?.length}`);
await page.waitForTimeout(100);
L('Escape resumed to battle', (await sn()) === 'battle', await sn());
await page.reload(); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 40000 });
const s2 = await save(); L('reload keeps changed save', s2 === s1, `${s1?.length} vs ${s2?.length}`);
if (s0 && s2 && s0 !== s2) { const a = JSON.parse(s0).settings, c = JSON.parse(s2).settings; console.log('diff', Object.keys(c).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(c[k])).map((k) => `${k}:${JSON.stringify(a[k])}->${JSON.stringify(c[k])}`)); }
console.log('errs', errs.length, 'nf', nf.length, errs.slice(0, 5), nf.slice(0, 5));
fs.writeFileSync(OUT + '/smoke2-report.json', JSON.stringify({ out, errs, nf }, null, 1));
await b.close();
