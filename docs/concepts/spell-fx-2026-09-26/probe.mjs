// Probe: party, enemies, abilities and screen rects at the first command menu.
//   PYREFLY_BROWSER=gpu node docs/concepts/spell-fx-2026-09-26/probe.mjs seymour-flux
import { open, toMenu, SCRATCH } from './lib.mjs';
import { writeFileSync } from 'node:fs';

const chapter = process.argv[2] ?? 'seymour-flux';
const { browser, page } = await open('desk');
await toMenu(page, chapter);
await page.keyboard.press('Enter').catch(() => {});
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const st = window.__pyrefly.battleState();
  const t = window.__pyrefly.targeting();
  const units = (st.combatants ? Object.values(st.combatants) : []).map((c) => ({ id: c.id, side: c.side, keys: Object.keys(c).join(","), ab: JSON.stringify(c.abilities ?? c.skills ?? c.commands ?? c.dressphere ?? null).slice(0, 600), od: JSON.stringify(c.overdrives ?? null).slice(0, 300) }));
  return { keys: Object.keys(st), units, rects: t?.rects, log: window.__pyrefly.battleLog().slice(-5) };
});
writeFileSync(SCRATCH + `probe-${chapter}.json`, JSON.stringify(info, null, 1));
await page.screenshot({ path: SCRATCH + `probe-${chapter}.png` });
console.log(JSON.stringify(info).slice(0, 3000));
await browser.close();
