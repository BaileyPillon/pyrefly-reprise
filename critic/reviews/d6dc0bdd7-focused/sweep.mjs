import { open } from '../../runner/lib/lib.mjs';
import fs from 'node:fs';
const BASE = 'http://127.0.0.1:5612/';
const EV = 'M:/pyrefly-ch-angra-mainyu/critic/reviews/d6dc0bdd7-focused';
const IDS = process.argv[2].split(',');
const res = {};
for (const id of IDS) {
  const t0 = Date.now();
  const { browser, page, consoleErrors, notFound } = await open({ base: BASE, width: 1600, height: 900 });
  try {
    const r = await Promise.race([
      page.evaluate(async (cid) => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); const o = await p.gotoChapter(cid, { skipCutscenes: true, skipPrep: true, seed: 1, auto: 'intended' }); await p.frames(30); return { outcome: o.outcome, turns: o.result?.turns, screen: p.screen(), rewards: o.result ? Object.keys(o.result).slice(0, 12) : null }; }, id),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 400s')), 400000)),
    ]);
    res[id] = { ...r, s: Math.round((Date.now() - t0) / 1000) };
    if (r.screen) await page.screenshot({ path: `${EV}/sweep-${id}.png` });
  } catch (e) { res[id] = { error: String(e).slice(0, 300) }; }
  res[id].consoleErrors = consoleErrors.slice(0, 4); res[id].notFound = notFound.slice(0, 4);
  await browser.close();
  console.log(id, JSON.stringify(res[id]));
  fs.writeFileSync(EV + `/sweep-${process.argv[3] ?? 'a'}.json`, JSON.stringify(res, null, 1));
}
console.log('SWEEP DONE');
