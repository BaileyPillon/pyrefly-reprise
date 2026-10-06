// The zero-light identity proof: the same frozen frame, drawn (A) with the light never switched on (the unpatched figure shader),
// (B) with each look compiled in and its strength at 0, (C) after the look is switched off again (the shader handed back), compared pixel by pixel.
//   node identity-proof.mjs <chapter> [url]
import { launch, ready, startChapter, freeze, sleep, writeFileSync, mkdirSync } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/lib.mjs';
import { canvasPngInPage } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/inpage.mjs';
import { decodeRaw } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/analyze.mjs';

const chapter = process.argv[2] ?? 'seymour-flux';
const url = process.argv[3] ?? 'http://127.0.0.1:6944/?coach=off';
const out = 'D:/Tools/pyrefly-scratch/2026-10-06/lighting/proof';
mkdirSync(out, { recursive: true });
const { browser, ctx, page, errors } = await launch({ width: 1600, height: 900 });
const grab = async () => decodeRaw(Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64'));
const cmp = (a, b) => {
  let diff = 0, maxd = 0;
  if (a.w !== b.w || a.h !== b.h) return { error: 'size differs' };
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]), Math.abs(a.data[i + 3] - b.data[i + 3]));
    if (d) { diff++; if (d > maxd) maxd = d; }
  }
  return { pixels: a.w * a.h, differing: diff, maxChannelDiff: maxd };
};
const res = { chapter, url, size: null, steps: [] };
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(page, 1);
  await startChapter(page, chapter, 1);
  await freeze(page, true);
  await sleep(1200);
  const A = await grab();
  res.size = [A.w, A.h];
  writeFileSync(`${out}/${chapter}-A-flag-off.png`, Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64'));
  await sleep(500);
  res.steps.push({ step: 'A vs A again (the frozen frame is stable)', ...cmp(A, await grab()) });
  for (const mode of [1, 2, 3]) {
    await page.evaluate((m) => window.__pyrefly.fx.light.set({ mode: m, strength: 0 }), mode);
    await sleep(1500);
    const snap = await page.evaluate(() => window.__pyrefly.fx.light.snapshot());
    const B = await grab();
    res.steps.push({ step: `look ${mode} compiled in, strength 0 vs flag off`, patchedSlots: snap.slots, ...cmp(A, B) });
    await page.evaluate((m) => window.__pyrefly.fx.light.set({ mode: m, strength: 1 }), mode);
    await sleep(1200);
    const L = await grab();
    res.steps.push({ step: `look ${mode} at strength 1 vs flag off (it must differ)`, ...cmp(A, L) });
    await page.evaluate(() => window.__pyrefly.fx.light.set({ mode: 0, strength: 1 }));
    await sleep(1500);
    res.steps.push({ step: `look ${mode} switched off again vs flag off`, ...cmp(A, await grab()) });
  }
  res.errors = errors.slice(0, 6);
} catch (e) { res.error = String(e).slice(0, 500); }
console.log(JSON.stringify(res, null, 1));
writeFileSync(`${out}/${chapter}-identity.json`, JSON.stringify(res, null, 1));
await ctx.close(); await browser.close();
