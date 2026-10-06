// The URL flag path of the zero-light proof: the page loaded WITH ?light=N&lightk=0 (the block compiled in from the first frame),
// one frozen frame; then the look is switched off in the same session (the shader handed back) and the same frame drawn again.
//   node identity-url.mjs <chapter> <look>
import { launch, ready, startChapter, freeze, sleep, writeFileSync } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/lib.mjs';
import { canvasPngInPage } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/inpage.mjs';
import { decodeRaw } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/analyze.mjs';

const chapter = process.argv[2] ?? 'seymour-flux';
const look = Number(process.argv[3] ?? 2);
const url = `http://127.0.0.1:6944/?coach=off&light=${look}&lightk=0`;
const { browser, ctx, page, errors } = await launch({ width: 1600, height: 900 });
const grab = async () => decodeRaw(Buffer.from((await page.evaluate(canvasPngInPage)).split(',')[1], 'base64'));
const cmp = (a, b) => {
  let diff = 0, maxd = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]), Math.abs(a.data[i + 3] - b.data[i + 3]));
    if (d) { diff++; if (d > maxd) maxd = d; }
  }
  return { pixels: a.w * a.h, differing: diff, maxChannelDiff: maxd };
};
const res = { chapter, url };
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(page, 1);
  await startChapter(page, chapter, 1);
  await freeze(page, true);
  await sleep(1500);
  res.state = await page.evaluate(() => { const s = window.__pyrefly.fx.light.snapshot(); return { mode: s.mode, strength: s.strength, slots: s.slots, room: s.room }; });
  const P = await grab();
  await page.evaluate(() => window.__pyrefly.fx.light.set({ mode: 0 }));
  await sleep(1500);
  const Q = await grab();
  res.urlFlagAtZeroVsSwitchedOff = cmp(P, Q);
  await page.evaluate(() => window.__pyrefly.fx.light.set({ mode: 1, strength: 1 }));
  await sleep(1500);
  res.sanityLookOneVsOff = cmp(Q, await grab());
  res.errors = errors.slice(0, 5);
} catch (e) { res.error = String(e).slice(0, 400); }
console.log(JSON.stringify(res, null, 1));
await ctx.close(); await browser.close();
