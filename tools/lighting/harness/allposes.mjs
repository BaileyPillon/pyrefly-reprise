// Every pose of every figure of a chapter, looks 0, 1, 2, 3 on the same frozen frame: console errors, and whether a lit pose
// draws black/NaN or moves far more than a light should.
//   node allposes.mjs <chapter> [looks csv]
import { launch, ready, startChapter, freeze, sleep, writeFileSync } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/lib.mjs';
import { figuresInPage } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/inpage.mjs';

const chapter = process.argv[2] ?? 'seymour-flux';
const looks = (process.argv[3] ?? '0,1,2,3').split(',').map(Number);
const { browser, ctx, page, errors } = await launch({ width: 1600, height: 900 });
const stats = (box) => page.evaluate((b) => {
  const c = document.querySelector('canvas[data-role="game-canvas"]') || document.querySelector('canvas');
  const [x0, y0, x1, y1] = b.map((v, i) => Math.round(i % 2 ? Math.max(0, Math.min(c.height, v)) : Math.max(0, Math.min(c.width, v))));
  const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
  const t = document.createElement('canvas'); t.width = w; t.height = h;
  const g = t.getContext('2d', { willReadFrequently: true });
  g.drawImage(c, x0, y0, w, h, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  let s = 0, n = 0, dark = 0, sum = new Float64Array(3);
  const data = [];
  for (let i = 0; i < d.length; i += 4) { const l = (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722) / 255; s += l; n++; if (l < 0.02) dark++; }
  return { mean: s / n, dark: dark / n, w, h, px: Array.from(d.slice(0, 0)) };
}, box);
const rows = [];
try {
  await page.goto('http://127.0.0.1:6944/?coach=off', { waitUntil: 'domcontentloaded' });
  await ready(page, 1);
  await startChapter(page, chapter, 1);
  await freeze(page, true);
  await sleep(500);
  const names = await page.evaluate(() => { const st = window.__pyrefly.app.current.stage; return [...st.actors].map(([id, s]) => [id, [...s.actor.poses.keys()]]); });
  for (const [id, poses] of names) {
    for (const pose of poses) {
      await page.evaluate(([i, p]) => { const st = window.__pyrefly.app.current.stage; st.actors.get(i).actor.setPose(p, { immediate: true, force: true }); }, [id, pose]);
      await sleep(450);
      const info = await page.evaluate(figuresInPage);
      const fig = info.figures.find((f) => f.id === id && f.active) ?? info.figures.find((f) => f.id === id);
      if (!fig) { rows.push({ id, pose, error: 'not on screen' }); continue; }
      const xs = fig.quad.map((p) => p[0]), ys = fig.quad.map((p) => p[1]);
      const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      const row = { id, pose, url: (fig.url ?? '').replace(/^.*characters\//, '') };
      for (const look of looks) {
        await page.evaluate((m) => window.__pyrefly.fx.light.set({ mode: m }), look);
        await sleep(300);
        const s = await stats(box);
        row[`m${look}`] = +s.mean.toFixed(4);
        row[`d${look}`] = +s.dark.toFixed(3);
      }
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  }
  console.log('errors', JSON.stringify(errors.slice(0, 8)));
  writeFileSync(`D:/Tools/pyrefly-scratch/2026-10-06/lighting/harness/allposes-${chapter}.json`, JSON.stringify({ rows, errors }, null, 1));
} catch (e) { console.log('ERR', String(e).slice(0, 600)); }
await ctx.close(); await browser.close();
