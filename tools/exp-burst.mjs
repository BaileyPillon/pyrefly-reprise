#!/usr/bin/env node
/**
 * Photograph the goons' attack and KO paintings of the experimental Leblanc chapter in the engine (branch `exp-leblanc`; FFX-2 only).
 *
 *   PYREFLY_BROWSER=gpu node tools/exp-burst.mjs [BASE_URL] [OUT_DIR]      (a `vite preview` of a BASE_PATH=/ build; default http://127.0.0.1:4191/)
 *
 * Why a burst: a goon strikes for under a second and, once downed, lies for only about 0.6 seconds (the stage's `ko` label, about a quarter of a second
 * until the lying painting is down, then it leaves the field in a shaft of light), so a single frame taken on a label misses it. The run plays Act I at the
 * normal pace with the HUD and the story dialogue box hidden:
 *
 *   Phase A  the party defends (`autoBattle('defend')`), so the goons act: a burst of 8 frames from the moment a goon's stage pose is `cast` (the wind-up,
 *            drawn with its attack painting) or `attack` (the strike), after one idle reference frame for the stance check;
 *   Phase B  the party plays the intended script: a burst of 18 frames from the moment a goon's pose is `ko`.
 *
 * It writes `A00-idle-reference.jpg`, `A<goon>-<pose>-NN.jpg` and `B<goon>-ko-NN.jpg` (1600x900 JPEG) to OUT_DIR (default
 * D:/Tools/pyrefly-scratch/2026-10-06/exp-leblanc/ko-burst) and prints each frame's pose, so which frames hold which painting is read off the log. Headless only
 * (`PYREFLY_BROWSER=gpu`); never the Chrome extension or the browser pane. The committed `preview-4b-`, `4d-` and `4e-` frames are picked from such a run.
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { open, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const BASE = process.argv[2] ?? 'http://127.0.0.1:4191/';
const OUT = resolve(process.argv[3] ?? 'D:/Tools/pyrefly-scratch/2026-10-06/exp-leblanc/ko-burst');
mkdirSync(OUT, { recursive: true });

const ctx = await open({ base: BASE, fresh: true });
const { page, browser } = ctx;
const actors = () => page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.actors ?? []).map((a) => ({ id: a.id, art: a.art, side: a.side, pose: a.pose, facing: a.facing, mirrored: a.mirrored, life: a.life })));
const shot = (name) => page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 84 });
const t0 = Date.now();
const lap = () => `${Date.now() - t0} ms`;
const isGoon = (a) => /goon$/.test(a.art ?? '');

try {
  await page.evaluate(() => window.__pyrefly.setSeed(1));
  page.evaluate(() => window.__pyrefly.gotoChapter('exp-leblanc', { skipCutscenes: true, skipPrep: true, seed: 1 })).catch(() => {});
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__pyrefly.trigger('hud:off'));
  await page.addStyleTag({ content: '.dbox { display: none !important; }' });
  await page.waitForTimeout(800);
  await shot('A00-idle-reference');
  console.log('idle reference', JSON.stringify((await actors()).filter((a) => a.side === 'enemy')));

  // Phase A: the party defends; the goons act.
  await page.evaluate(() => {
    window.__pyrefly.setBattleSpeed('normal');
    window.__pyrefly.autoBattle('defend');
  });
  const acted = new Set();
  const tA = Date.now();
  while (Date.now() - tA < 75000 && acted.size < 2) {
    const g = (await actors()).find((a) => isGoon(a) && (a.pose === 'attack' || a.pose === 'cast') && !acted.has(`${a.id}:${a.pose}`));
    if (g) {
      acted.add(`${g.id}:${g.pose}`);
      console.log('goon acts', lap(), JSON.stringify(g));
      for (let i = 0; i < 8; i++) {
        await shot(`A${g.id}-${g.pose}-${String(i).padStart(2, '0')}`);
        const cur = (await actors()).find((a) => a.id === g.id);
        console.log(`  frame ${i} ${lap()}: ${cur ? cur.pose : 'gone'}`);
      }
    }
    await page.waitForTimeout(30);
  }

  // Phase B: the party plays the intended script; a goon falls.
  await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
  const fallen = new Set();
  const tB = Date.now();
  while (Date.now() - tB < 90000 && fallen.size < 2) {
    const g = (await actors()).find((a) => isGoon(a) && a.pose === 'ko' && !fallen.has(a.id));
    if (g) {
      fallen.add(g.id);
      console.log('ko seen', lap(), JSON.stringify(g));
      for (let i = 0; i < 18; i++) {
        await shot(`B${g.id}-ko-${String(i).padStart(2, '0')}`);
        const cur = (await actors()).find((a) => a.id === g.id);
        console.log(`  frame ${i} ${lap()}: ${cur ? `${cur.pose} life ${cur.life} mirrored ${cur.mirrored}` : 'gone'}`);
      }
    }
    await page.waitForTimeout(30);
  }
  console.log('console errors', JSON.stringify(ctx.consoleErrors), '404s', JSON.stringify(ctx.notFound));
} finally {
  await browser.close();
}
