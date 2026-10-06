// Crops of chosen poses of a chapter's figures, for looks given (each row one pose, each column one look), saved as PNGs to sheet.
//   node posesheet.mjs <chapter> <actor:pose,actor:pose,...> <looks csv> <outdir>
import { launch, ready, startChapter, freeze, sleep, mkdirSync, writeFileSync } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/lib.mjs';
import { figuresInPage, canvasPngInPage } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/inpage.mjs';

const chapter = process.argv[2];
const list = process.argv[3].split(',').map((s) => s.split(':'));
const looks = (process.argv[4] ?? '0,2,3').split(',').map(Number);
const out = process.argv[5] ?? 'D:/Tools/pyrefly-scratch/2026-10-06/lighting/frames/poses';
mkdirSync(out, { recursive: true });
const { browser, ctx, page, errors } = await launch({ width: 1600, height: 900 });
try {
  await page.goto('http://127.0.0.1:6944/?coach=off', { waitUntil: 'domcontentloaded' });
  await ready(page, 1);
  await startChapter(page, chapter, 1);
  await freeze(page, true);
  await sleep(500);
  for (const [id, pose] of list) {
    await page.evaluate(([i, p]) => { window.__pyrefly.app.current.stage.actors.get(i).actor.setPose(p, { immediate: true, force: true }); }, [id, pose]);
    await sleep(600);
    const info = await page.evaluate(figuresInPage);
    const fig = info.figures.find((f) => f.id === id && f.active) ?? info.figures.find((f) => f.id === id);
    const xs = fig.quad.map((p) => p[0]), ys = fig.quad.map((p) => p[1]);
    const pad = 20;
    const box = [Math.max(0, Math.min(...xs) - pad), Math.max(0, Math.min(...ys) - pad), Math.min(1600, Math.max(...xs) + pad), Math.min(900, Math.max(...ys) + pad)].map(Math.round);
    writeFileSync(`${out}/${chapter}__${id}__${pose}.box.json`, JSON.stringify(box));
    for (const look of looks) {
      await page.evaluate((m) => window.__pyrefly.fx.light.set({ mode: m, strength: 1 }), look);
      await sleep(700);
      writeFileSync(`${out}/${chapter}__${id}__${pose}__${look}.png`, Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64'));
    }
  }
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
} catch (e) { console.log('ERR', String(e).slice(0, 500)); }
await ctx.close(); await browser.close();
