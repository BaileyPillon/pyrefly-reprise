// Capture frames of one chapter, with the lighting looks switched at run time on the SAME frozen frame.
//   node cap.mjs --chapter seymour-flux --tag base [--url 'http://127.0.0.1:6944/?coach=off'] [--looks off,1,2,3] [--size 1600x900] [--out dir]
// Each look gives <out>/<chapter>__<look>__full.png (the page, HUD included) and __canvas.png (the game canvas only).
import { launch, ready, startChapter, freeze, sleep, mkdirSync, writeFileSync } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/lib.mjs';
import { canvasPngInPage } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/inpage.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const chapter = arg('--chapter', 'seymour-flux');
const url = arg('--url', 'http://127.0.0.1:6944/?coach=off');
const looks = arg('--looks', 'off').split(',');
const [W, H] = arg('--size', '1600x900').split('x').map(Number);
const out = arg('--out', 'D:/Tools/pyrefly-scratch/2026-10-06/lighting/frames');
const seed = Number(arg('--seed', '1'));
const strength = Number(arg('--strength', '1'));
const tune = JSON.parse(arg('--tune', '{}'));
mkdirSync(out, { recursive: true });

const { browser, ctx, page, errors } = await launch({ width: W, height: H });
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(page, seed);
  const ms = await startChapter(page, chapter, seed);
  console.log('first menu after', ms, 'ms');
  await freeze(page, true);
  await page.evaluate((t) => window.__pyrefly.fx.light.tune(t), tune);
  await sleep(800);
  for (const look of looks) {
    if (look !== 'off') {
      const ok = await page.evaluate(([m, s]) => { const l = window.__pyrefly.fx.light; if (!l) return 'no api'; l.set({ mode: Number(m), strength: s }); return 'ok'; }, [look, strength]);
      if (ok !== 'ok') console.log('light api:', ok);
    } else {
      await page.evaluate(() => window.__pyrefly.fx.light?.set({ mode: 0 }));
    }
    await sleep(1200);
    const base = `${out}/${chapter}__${look}`;
    await page.screenshot({ path: `${base}__full.png`, timeout: 120000 });
    const png = await page.evaluate(canvasPngInPage);
    writeFileSync(`${base}__canvas.png`, Buffer.from(png.split(',')[1], 'base64'));
    console.log('captured', look);
  }
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
} catch (e) { console.log('ERR', String(e).slice(0, 600)); }
await ctx.close(); await browser.close();
