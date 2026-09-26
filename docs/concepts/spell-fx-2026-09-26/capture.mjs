// B1 spell effects: capture the real-engine plates the mock paints over, the
// combatants' screen rects, and a "today" clip of the live build's hit glow.
//   PYREFLY_BROWSER=gpu node docs/concepts/spell-fx-2026-09-26/capture.mjs seymour-flux|ffx2-bahamut [today]
import { open, toMenu, frames, SCRATCH } from './lib.mjs';
import { writeFileSync, readdirSync, renameSync, mkdirSync } from 'node:fs';

const chapter = process.argv[2] ?? 'seymour-flux';
const mode = process.argv[3] ?? 'plate';

if (mode === 'plate') {
  const { browser, page } = await open('desk');
  await toMenu(page, chapter);
  await page.evaluate(() => window.__pyrefly.trigger('hud:off'));
  await frames(page, 20);
  await page.waitForTimeout(600);
  const rects = await page.evaluate(() => window.__pyrefly.targeting()?.rects);
  writeFileSync(SCRATCH + `rects-${chapter}.json`, JSON.stringify(rects, null, 1));
  await page.screenshot({ path: SCRATCH + `plate-${chapter}.png` });
  console.log('plate', chapter, Object.keys(rects ?? {}));
  await browser.close();
} else {
  // Today: the live build's own effects, recorded in real time while the
  // 'intended' strategy plays (every action lands the same tinted bloom).
  const dir = SCRATCH + `video-${chapter}/`;
  mkdirSync(dir, { recursive: true });
  const { browser, ctx, page } = await open('desk', dir);
  await toMenu(page, chapter);
  await page.evaluate(() => window.__pyrefly.trigger('hud:off'));
  const t0 = Date.now();
  await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
  // Log what played, with wall-clock stamps, so the clip can be trimmed to the actions.
  const seen = [];
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    const log = await page.evaluate(() => window.__pyrefly.battleLog().filter((e) => e.type === 'action-start').map((e) => `${e.actorId}:${e.abilityName ?? e.abilityId}->${(e.targets ?? []).join('+')}`));
    for (const l of log.slice(seen.length)) { seen.push(l); console.log(((Date.now() - t0) / 1000).toFixed(1), l); }
  }
  await ctx.close();
  await browser.close();
  const f = readdirSync(dir).find((n) => n.endsWith('.webm'));
  if (f) renameSync(dir + f, SCRATCH + `today-${chapter}.webm`);
  writeFileSync(SCRATCH + `today-${chapter}.txt`, seen.join('\n'));
}
