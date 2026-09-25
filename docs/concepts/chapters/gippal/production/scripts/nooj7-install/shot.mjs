// Den of Woe (ship branch, port 5821) with real keys, headless: capture Nooj's shade through one of his actions.
// The chapter's enemy data names spriteKey 'shade-<name>' while the installed art is 'characters/<name>-shade/':
// the art-id gap is bridged here by request interception only (manifest subjects copied under the chapter's ids,
// /characters/shade-<name>/ served from /characters/<name>-shade/). Nothing else is swapped.
// Usage: node shot.mjs <width> <height> <outPrefix>
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
const ART = 'D:/Final Fantasy/public/art/';
const [W, H, OUT] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
const charReqs = [];
page.on('response', (r) => { const u = r.url(); if (u.includes('/art/characters/')) charReqs.push(`${r.status()} ${r.request().method()} ${u.replace(/^.*\/art\//, '')}`); });
await page.route((u) => u.pathname.endsWith('/art/manifest.json'), async (r) => {
  const m = JSON.parse(readFileSync(ART + 'manifest.json', 'utf8'));
  for (const n of ['nooj', 'gippal', 'baralai']) if (m.subjects[`${n}-shade`]) m.subjects[`shade-${n}`] = m.subjects[`${n}-shade`];
  return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(m) });
});
await page.route((u) => /\/art\/characters\/shade-(nooj|gippal|baralai)\//.test(u.pathname), (r) => {
  const p = new URL(r.request().url()).pathname.replace(/^.*\/art\/characters\/shade-(\w+)\//, (_, n) => `characters/${n}-shade/`);
  if (!existsSync(ART + p)) return r.fulfill({ status: 404, body: '' });
  return r.fulfill({ status: 200, contentType: p.endsWith('.json') ? 'application/json' : 'image/png', body: readFileSync(ART + p) });
});
await page.goto('http://127.0.0.1:5821/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(() => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter('ffx2-den-of-woe', { skipCutscenes: true }); });
await page.evaluate(() => window.__pyrefly.waitForScreen('battle', 90000));
await page.waitForTimeout(8000);
// Watch Nooj's actor every frame: record pose changes.
await page.evaluate(() => {
  window.__nooj = { poses: [], seenAction: false };
  const tick = () => {
    const b = window.__pyrefly.battle();
    const a = b?.stage?.actors?.get('shade-nooj')?.actor;
    if (a) {
      const last = window.__nooj.poses[window.__nooj.poses.length - 1];
      if (!last || last.pose !== a.pose) window.__nooj.poses.push({ pose: a.pose, t: performance.now() });
      if (a.pose !== 'idle') window.__nooj.seenAction = true;
    }
    requestAnimationFrame(tick);
  };
  tick();
});
const state0 = await page.evaluate(() => {
  const b = window.__pyrefly.battle(); const out = {};
  for (const [k, e] of b.stage.actors.entries()) out[k] = { side: e.side, placeholder: e.actor.isPlaceholder, pose: e.actor.pose, poses: e.actor.poseNames, urls: e.actor.poseUrls };
  return out;
});
await page.screenshot({ path: `${OUT}-start.jpg`, type: 'jpeg', quality: 88 });
// Real keys: confirm the default command and target for whichever girl is up, until Nooj acts.
const shots = []; const res0 = {};
const t0 = Date.now(); let presses = 0; let noojEvent = null;
while (Date.now() - t0 < 240000) {
  const s = await page.evaluate(() => {
    const st = window.__pyrefly.battleState(); window.__enemyIds = st ? [...st.enemyIds] : null;
    const log = window.__pyrefly.battleLog() || [];
    const ev = log.find((e) => JSON.stringify(e).includes('x2-den-nooj'));
    return { seen: window.__nooj.seenAction, pose: window.__pyrefly.battle()?.stage?.actors?.get('shade-nooj')?.actor?.pose, ev: ev ? JSON.stringify(ev).slice(0, 300) : null, screen: window.__pyrefly.screen(), enemies: window.__enemyIds };
  });
  if (s.screen !== 'battle') break;
  // Staging shortcut (disclosed): Baralai and Gippal come first in this one battle; their HP is set to 1 so real
  // Attack keys fell them quickly and Nooj arrives through the chapter's own flow.
  await page.evaluate(() => { const c = window.__pyrefly.battleState()?.combatants || {}; for (const id of ['shade-baralai', 'shade-gippal']) if (c[id] && c[id].hp > 1) c[id].hp = 1; });
  if (s.seen && s.pose !== 'idle') {
    noojEvent = s.ev;
    res0.noojActor = await page.evaluate(() => { const a = window.__pyrefly.battle().stage.actors.get('shade-nooj').actor; return { placeholder: a.isPlaceholder, pose: a.pose, poses: a.poseNames, urls: a.poseUrls, worldHeight: a.worldHeight }; });
    for (let i = 0; i < 4; i++) { const f = `${OUT}-action-${i}.jpg`; await page.screenshot({ path: f, type: 'jpeg', quality: 88 }); shots.push({ f, pose: await page.evaluate(() => window.__pyrefly.battle()?.stage?.actors?.get('shade-nooj')?.actor?.pose) }); await page.waitForTimeout(150); }
    break;
  }
  if (presses % 20 === 0) console.log('enemies', JSON.stringify(s.enemies), 'presses', presses);
  await page.keyboard.press('Enter'); presses++;
  await page.waitForTimeout(350);
}
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}-after.jpg`, type: 'jpeg', quality: 88 });
const tail = await page.evaluate(() => ({ poses: window.__nooj.poses, placeholder: window.__pyrefly.battle()?.stage?.actors?.get('shade-nooj')?.actor?.isPlaceholder }));
const res = { viewport: [W, H], presses, noojEvent, noojActor: res0.noojActor, shots, state0, tail, errors, charReqs: [...new Set(charReqs)] };
writeFileSync(`${OUT}-report.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ presses, noojEvent, noojActor: res0.noojActor, shots, tail, errors: errors.slice(0, 5), noojReqs: [...new Set(charReqs)].filter((x) => /nooj/.test(x)) }, null, 1));
await browser.close();
