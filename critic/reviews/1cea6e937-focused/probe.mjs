// Review-only probe (no product code). node probe.mjs <base> <query> <chapter> <WxH> <tag> [flashes] [attack]
// Setup uses the debug API gotoChapter (labelled injected setup); the attack uses real keys.
import { open, waitBattleMenu, shoot, MODE } from 'file:///D:/pyrefly-release55/critic/runner/lib/lib.mjs';
import sharp from 'file:///D:/pyrefly-release55/node_modules/sharp/dist/index.mjs';
import fs from 'node:fs';
const [base, query, chapter, size, tag, flashes, attack] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const out = 'D:/pyrefly-release55/critic/reviews/1cea6e937-focused/probe';
fs.mkdirSync(out, { recursive: true });
const q = query === '-' ? '' : query;
const { browser, page, consoleErrors, notFound } = await open({ base: base, width: w, height: h });
if (flashes === 'flashes') {
  await page.evaluate(() => {
    const k = 'pyrefly-reprise:save:v1';
    const s = JSON.parse(localStorage.getItem(k) || '{}');
    s.settings = { ...(s.settings || {}), reduceFlashes: true };
    localStorage.setItem(k, JSON.stringify(s));
  });
}
await page.goto(base + q);
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
const flashSetting = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || '{}').settings?.reduceFlashes; } catch { return null; } });
await page.evaluate((c) => { window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true, seed: 1 }); return 1; }, chapter);
const t0 = Date.now();
await waitBattleMenu(page, 120000);
await page.waitForTimeout(1500);
const info = await page.evaluate(async () => {
  const p = window.__pyrefly;
  const l = p.look?.stats?.();
  return {
    search: location.search,
    screen: p.screen(),
    chapter: p.snapshotState().chapter,
    lookName: p.look?.get?.() ?? 'no-look-api',
    lookStats: l ? { look: l.look, quality: l.quality, room: l.room, passes: l.passes ?? null } : null,
    demoMotion: p.demoMotion?.(),
    demoMode: p.demoMode?.(),
    rigs: p.rigs ? p.rigs().figures.map((f) => ({ s: f.subject, on: f.on, r: f.reason })) : null,
    actors: p.snapshotState().actors?.map((a) => a.id + ':' + a.art + ':' + a.pose),
  };
});
const meta = { asserted: 'screen=battle awaitingMenu via waitBattleMenu', injected: 'gotoChapter(skipCutscenes)', tag, chapter };
await shoot(page, out, `${tag}-menu.png`, meta);
const res = { tag, base, q, chapter, size, flashSetting, info, ms: Date.now() - t0 };
if (attack === 'attack') {
  // real keys: Enter on Attack, Enter on the target
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const tgt = await page.evaluate(() => window.__pyrefly.targeting?.());
  res.targeting = JSON.stringify(tgt)?.slice(0, 300);
  await page.keyboard.press('Enter');
  const lum = [];
  const t1 = Date.now();
  let i = 0;
  while (Date.now() - t1 < 6000) {
    const buf = await page.screenshot({ type: 'jpeg', quality: 60 });
    const st = await sharp(buf).resize(160, 90).greyscale().raw().toBuffer();
    let sum = 0, over = 0;
    for (const v of st) { sum += v; if (v > 235) over++; }
    lum.push({ t: Date.now() - t1, mean: +(sum / st.length).toFixed(1), over235: +(over / st.length).toFixed(4) });
    if (i++ % 6 === 0) fs.writeFileSync(`${out}/${tag}-atk-${String(i).padStart(3, '0')}.jpg`, buf);
  }
  res.lum = { n: lum.length, maxMean: Math.max(...lum.map((x) => x.mean)), minMean: Math.min(...lum.map((x) => x.mean)), maxOver235: Math.max(...lum.map((x) => x.over235)) };
}
res.consoleErrors = consoleErrors.slice(0, 8);
res.notFound = notFound.slice(0, 8);
res.notFoundCount = notFound.length;
res.browserMode = MODE;
fs.writeFileSync(`${out}/${tag}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res).slice(0, 1500));
await browser.close();
