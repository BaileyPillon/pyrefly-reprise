import { launch, ready, startChapter, freeze, sleep } from 'file:///D:/pyrefly-r39-color/docs/handoff/r39-color-harness/lib.mjs';
const chapter = process.argv[2] ?? 'seymour-flux'; const look = Number(process.argv[3] ?? 2);
const { browser, ctx, page, errors } = await launch({ width: 1600, height: 900 });
try {
  await page.goto('http://127.0.0.1:6944/?coach=off', { waitUntil: 'domcontentloaded' });
  await ready(page, 1); await startChapter(page, chapter, 1); await freeze(page, true); await sleep(500);
  await page.evaluate((m) => window.__pyrefly.fx.light.set({ mode: m }), look); await sleep(1500);
  console.log(JSON.stringify(await page.evaluate(() => window.__pyrefly.fx.light.snapshot()), null, 1));
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
} catch (e) { console.log('ERR', String(e).slice(0, 500)); }
await ctx.close(); await browser.close();
