import fs from 'node:fs';
import { open, waitBattleMenu } from './critic/runner/lib/lib.mjs';
const [,, label, query='', speed=''] = process.argv;
const E = 'D:/pyrefly-release55/critic/reviews/04631aedf-focused/shots';
const r = await open({ base: 'http://127.0.0.1:5871/' + query, width: 1600, height: 900 });
const { page } = r;
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const out = { label, query, speed, attempts: [] };
await page.keyboard.press('Enter'); await page.waitForTimeout(900); await page.keyboard.press('Escape'); for (const k of (process.env.NAV||'').split(',').filter(Boolean)) { await page.keyboard.press(k); await page.waitForTimeout(450); }
await page.keyboard.press('Enter');
for (let att = 1; att <= 2; att++) {
  const t0 = Date.now(); let ptime = null;
  // on first attempt Enter opens prep; on retry prep opens from card
  while (Date.now() - t0 < 150000 && (await scr()) !== 'battle') { await page.keyboard.press('Enter'); await page.waitForTimeout(450); if (!ptime && (await scr())==='party-prep') ptime = Date.now()-t0; }
  await waitBattleMenu(page, 100000);
  const menuMs = Date.now() - t0;
  const cinemaProbe = await page.evaluate(() => window.__pyrefly.battleLog().length);
  if (speed) await page.evaluate((s) => window.__pyrefly.setBattleSpeed(s), speed);
  await page.screenshot({ path: `${E}/${label}-att${att}-menu.png` });
  // lose with real keys
  const t1 = Date.now();
  while (Date.now() - t1 < 240000 && (await scr()) === 'battle') {
    await page.keyboard.press('Enter'); await page.waitForTimeout(250); if ((await scr()) !== 'battle') break; await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  }
  await page.waitForTimeout(2500);
  const s = await scr();
  const text = await page.evaluate(() => document.body.innerText);
  await page.screenshot({ path: `${E}/${label}-att${att}-end.png` });
  out.attempts.push({ att, menuMs, prepAt: ptime, endScreen: s, cause: (text.match(/FELLED BY[^\n]*/)||[''])[0], meta: (text.match(/TURN \d+[^\n]*/)||[''])[0], buttons: (text.match(/TRY AGAIN|CHAPTER SELECT|OTHER FIGHT/g)||[]) });
  console.log(JSON.stringify(out.attempts.at(-1)));
  if (s !== 'pro-defeat') break;
  if (att < 2) { await page.keyboard.press('Enter'); await page.waitForTimeout(600); }
}
out.errors = r.consoleErrors; fs.writeFileSync(`${E}/${label}.json`, JSON.stringify(out, null, 1));
await r.browser.close();
