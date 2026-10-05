// The switch is off by default and then the frame is what it was: the same frozen frame drawn with the patched grade shader (figureTrue 0) and with
// the committed original, byte for byte. Then with the switch on: what moves, and where (inside the figures, and nowhere else).
//   node identity.mjs <chapter> <seed> [url]
import { execFileSync } from 'node:child_process';
import { launch, ready, startChapter, freeze, sleep, writeFileSync, mkdirSync, ROOT } from './lib.mjs';
import { installMods } from './mods.mjs';
import { canvasPngInPage, figuresInPage } from './inpage.mjs';
import { decodeRaw } from './analyze.mjs';

const chapter = process.argv[2] ?? 'ffx2-leblanc';
const seed = Number(process.argv[3] ?? 1);
const url = process.argv[4] ?? 'http://127.0.0.1:6931/?coach=off';
const orig = execFileSync('git', ['-C', 'D:/pyrefly-r39-color', 'show', 'origin/r39-int:src/engine/shaders/GradeShader.ts'], { encoding: 'utf8', maxBuffer: 1e7 });
const m = orig.match(/fragmentShader: \/\* glsl \*\/ `([\s\S]*?)`,\s*\};/);
if (!m) throw new Error('original fragment shader not found');
const ORIG = m[1].replace(/\r\n/g, '\n');
const out = `${ROOT}/runs/identity/${chapter}`; mkdirSync(out, { recursive: true });

const { browser, ctx, page, errors } = await launch({ width: 2560, height: 1440 });
const grab = async () => decodeRaw(Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64'));
const cmp = (a, b) => {
  let diff = 0, maxd = 0, sum = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d) { diff++; sum += d; if (d > maxd) maxd = d; }
  }
  return { differingPixels: diff, maxChannelDiff: maxd, meanDiffWhereDifferent: diff ? +(sum / diff).toFixed(2) : 0 };
};
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(page, seed);
  await startChapter(page, chapter, seed);
  await freeze(page, true);
  await page.evaluate(installMods, ['mix:breathing', 'mix:koCollapse']);
  await sleep(1200);
  const info = await page.evaluate(() => ({ figureTrue: window.__pyrefly.fx.figureTrue ? window.__pyrefly.fx.figureTrue() : 'no api', hasUniform: !!window.__pyrefly.app.renderer.gradePass.uniforms.figureTrue }));
  console.log('switch', JSON.stringify(info));
  const A = await grab(); await sleep(400); const A2 = await grab();
  console.log('same shader, two grabs     ', JSON.stringify(cmp(A, A2)));
  await page.evaluate((src) => { const m = window.__pyrefly.app.renderer.gradePass.material; window.__patched = m.fragmentShader; m.fragmentShader = src; m.needsUpdate = true; }, ORIG);
  await sleep(1500);
  const B = await grab();
  console.log('patched (off) vs original  ', JSON.stringify(cmp(A, B)));
  await page.evaluate(() => { const m = window.__pyrefly.app.renderer.gradePass.material; m.fragmentShader = window.__patched; m.needsUpdate = true; });
  await sleep(1500);
  const figs = await page.evaluate(figuresInPage);
  await page.evaluate(() => window.__pyrefly.fx.figureTrue(1));
  await sleep(1000);
  const C = await grab();
  console.log('figureTrue 1 vs off        ', JSON.stringify(cmp(A, C)));
  // where it moved: inside the figures' quads or outside them
  const inQuad = (x, y) => figs.figures.some((f) => {
    const xs = f.quad.map((p) => p[0]), ys = f.quad.map((p) => p[1]);
    return x >= Math.min(...xs) - 6 && x <= Math.max(...xs) + 6 && y >= Math.min(...ys) - 6 && y <= Math.max(...ys) + 6;
  });
  let inside = 0, outside = 0, outMax = 0, outSum = 0;
  for (let y = 0; y < A.h; y++) for (let x = 0; x < A.w; x++) {
    const i = (y * A.w + x) * 4;
    const d = Math.max(Math.abs(A.data[i] - C.data[i]), Math.abs(A.data[i + 1] - C.data[i + 1]), Math.abs(A.data[i + 2] - C.data[i + 2]));
    if (!d) continue;
    if (inQuad(x, y)) inside++; else { outside++; outSum += d; if (d > outMax) outMax = d; }
  }
  console.log('figureTrue 1: changed pixels inside figure boxes', inside, ' outside', outside, ' (outside max/mean diff', outMax, (outside ? outSum / outside : 0).toFixed(2) + ')');
  writeFileSync(`${out}/on.png`, Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64'));
  console.log('errors', JSON.stringify(errors.slice(0, 4)));
} catch (e) { console.log('ERR', String(e).slice(0, 400)); }
await ctx.close(); await browser.close();
