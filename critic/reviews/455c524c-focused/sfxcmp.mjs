import { open } from 'file:///D:/pyrefly-r41-rc/critic/runner/lib/lib.mjs';
import fs from 'node:fs';
const targets = { cand: 'http://127.0.0.1:5400/pyrefly-reprise/', live: 'https://echoesofspira.com/' };
const out = {};
for (const ch of ['seymour-flux', 'ffx2-bahamut']) for (const [tag, base] of Object.entries(targets)) {
  const { browser, page } = await open({ base });
  await page.keyboard.press('Enter');
  await page.evaluate((c) => { window.__pyrefly.setSeed(1); window.__res = null; window.__pyrefly.gotoChapter(c, { skipCutscenes: true, auto: true, speed: 'skip' }).then(r => window.__res = JSON.stringify(r)).catch(e => window.__res = 'ERR ' + e); }, ch);
  const t0 = Date.now();
  while (Date.now() - t0 < 420000) { if (await page.evaluate(() => window.__res)) break; await page.waitForTimeout(1000); }
  const o = await page.evaluate(() => { const d = window.__pyrefly.audioDebug(); return { res: window.__res, log: d.sfxLog, parity: d.sfx?.parity ?? d.parity ?? null, screen: window.__pyrefly.screen() }; });
  out[`${ch}-${tag}`] = o;
  console.log(ch, tag, 'screen', o.screen, 'outcome', (o.res || '').slice(0, 80), 'cues', o.log.length, 'parity', JSON.stringify(o.parity));
  await browser.close();
}
fs.writeFileSync('sfxcmp.json', JSON.stringify(out));
for (const ch of ['seymour-flux', 'ffx2-bahamut']) {
  const a = out[`${ch}-cand`].log, b = out[`${ch}-live`].log;
  const k = (l) => l.map(e => `${e.asked}>${e.played}>${e.via}`);
  const ka = k(a), kb = k(b);
  let same = ka.length === kb.length && ka.every((v, i) => v === kb[i]);
  let firstDiff = ka.findIndex((v, i) => v !== kb[i]);
  const dt = (l) => l.map((e, i) => i ? +(e.t - l[i - 1].t).toFixed(3) : 0);
  const da = dt(a), db = dt(b); let maxd = 0; for (let i = 0; i < Math.min(da.length, db.length); i++) maxd = Math.max(maxd, Math.abs(da[i] - db[i]));
  console.log(ch, 'identicalSequence', same, 'lenCand', ka.length, 'lenLive', kb.length, 'firstDiff', firstDiff, 'maxGapDiffSec', maxd.toFixed(3), 'anyParityVia', a.some(e => e.via === 'parity'));
}
