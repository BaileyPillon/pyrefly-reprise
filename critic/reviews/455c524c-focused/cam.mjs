// Scratch (r41-ch4cam, PR-0421): drives Chapter IV by real keys in headless Chromium and records the battle's opening as a CDP screencast,
// plus the first command menu. Not staged, not shipped.
//   node tools/zz-r41-ch4cam.tmp.mjs --base <url> --size 1600x900 [--touch] --out <dir> [--tag live]
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'file:///D:/pyrefly-r41-rc/node_modules/playwright/index.mjs';
import { currentChromiumArgs } from 'file:///D:/pyrefly-r41-rc/tools/browser-mode.mjs';

const arg = (n, d = null) => {
  const i = process.argv.indexOf(n);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = arg('--base');
const [w, h] = (arg('--size', '1600x900')).split('x').map(Number);
const touch = process.argv.includes('--touch');
const out = resolve(arg('--out'));
const tag = arg('--tag', 'run');
const id = arg('--id', 'ffx2-bahamut');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: false });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', String(e).slice(0, 200)));
await page.goto(base);
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
const screenOf = () => page.evaluate(() => window.__pyrefly.screen());
const selected = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null);
await page.evaluate(() => window.__pyrefly.setSeed(1));
await sleep(1500);
for (let i = 0; i < 12 && (await screenOf()) !== 'chapter-select'; i++) {
  await page.keyboard.press('Enter');
  await sleep(900);
}
await sleep(800);
for (let i = 0; i < 40 && (await selected()) !== id; i++) {
  await page.keyboard.press('ArrowRight');
  await sleep(300);
}
console.log('selected', await selected());
await page.keyboard.press('Enter');
for (let i = 0; i < 60 && (await screenOf()) !== 'party-prep'; i++) await sleep(250);
for (let i = 0; i < 4; i++) {
  await page.keyboard.press('ArrowRight');
  await sleep(450);
}
await page.evaluate(() => window.__pyrefly.trigger('prep:begin'));

const cdp = await ctx.newCDPSession(page);
const frames = [];
let first = null;
cdp.on('Page.screencastFrame', async (f) => {
  const t = f.metadata.timestamp;
  if (first === null) first = t;
  frames.push({ n: frames.length, s: +(t - first).toFixed(3), data: f.data });
  try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch { /* closed */ }
});
let casting = false;
const awaitingMenu = () => page.evaluate(() => /"awaitingMenu":true|"awaiting":true|"menuOpen":true/.test(JSON.stringify(window.__pyrefly.snapshotState()?.screenState ?? {})));
let taps = 0;
const t0 = Date.now();
let menuAt = null;
for (;;) {
  const s = await screenOf();
  if (s === 'battle' && !casting) {
    await page.evaluate(() => {
      window.__samples = [];
      const tick = () => {
        const c = window.__pyrefly.app.renderer.camera;
        window.__samples.push({ w: Date.now() / 1000, p: c.position.toArray().map((v) => +v.toFixed(3)), fov: +c.fov.toFixed(2), a: +c.aspect.toFixed(3) });
        if (window.__samples.length < 6000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      const b = window.__pyrefly.battle();
      window.__pipes = () => { const xs = []; b.scene.scene.traverse((o) => { if (o.name === 'pillar') xs.push(+o.position.x.toFixed(3)); }); return xs; };
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, everyNthFrame: 1 });
    casting = true;
    console.log('screencast started at battle', Date.now() - t0);
  }
  if (s === 'battle' && (await awaitingMenu())) {
    menuAt = Date.now();
    break;
  }
  if (s === 'cutscene' && taps < 160) {
    await page.keyboard.press('Enter');
    taps++;
    await sleep(330);
  } else await sleep(150);
  if (Date.now() - t0 > 240000) throw new Error('no command menu after 240 s');
}
await sleep(1200);
await cdp.send('Page.stopScreencast');
await page.screenshot({ path: resolve(out, `${tag}-first-menu.png`) });
console.log('first menu after taps', taps, 'frames', frames.length);
const { writeFile } = await import('node:fs/promises');
const index = [];
for (const f of frames) {
  const name = `${tag}-s${String(f.n).padStart(3, '0')}.jpg`;
  await writeFile(resolve(out, name), Buffer.from(f.data, 'base64'));
  index.push({ f: name, s: f.s });
}
const samples = await page.evaluate(() => window.__samples);
const pipes = await page.evaluate(() => window.__pipes());
writeFileSync(resolve(out, `${tag}-camera.json`), JSON.stringify(samples));
writeFileSync(resolve(out, `${tag}-index.json`), JSON.stringify({ size: `${w}x${h}`, touch, pipes, wall0: first, frames: index }, null, 1));
await browser.close();
