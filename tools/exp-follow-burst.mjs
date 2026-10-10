#!/usr/bin/env node
/**
 * Photograph the girls' follow-through painting of the experimental Leblanc chapter in the engine (branch `exp-leblanc`; FFX-2 only).
 *
 *   PYREFLY_BROWSER=gpu node tools/exp-follow-burst.mjs [BASE_URL] [OUT_DIR]      (a `vite preview` of a BASE_PATH=/ build; default http://127.0.0.1:4191/)
 *
 * Why a burst: the follow-through (`follow`) is the painting a girl wears for about a fifth of a second after her blow lands (`engine/KeyPoses.ts`,
 * `FOLLOW_BEAT_MS` 180 ms), so a frame taken on a label misses it. The run plays Act I at the normal pace with the HUD and the story dialogue box hidden
 * and the party attacking (`autoBattle('attack')`); the moment a girl's stage pose is `follow` it takes 4 frames and prints each frame's pose, and it
 * stops when Rikku and Paine have both been photographed (Yuna has no follow painting: the beat does not play for her). It also prints each girl's
 * sequence of poses with the time of each change, so the order idle, ready, attack, follow, idle is read off the log.
 *
 * It writes `follow-<girl>-NN.jpg` (1600x900 JPEG) to OUT_DIR (default D:/Tools/pyrefly-scratch/2026-10-06/exp-leblanc/follow-burst). The committed
 * `preview-6b-follow-rikku.jpg` and `preview-6c-follow-paine.jpg` are frame 01 of such a run. Headless only (`PYREFLY_BROWSER=gpu`); never the Chrome
 * extension or the browser pane.
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { open, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const BASE = process.argv[2] ?? 'http://127.0.0.1:4191/';
const OUT = resolve(process.argv[3] ?? 'D:/Tools/pyrefly-scratch/2026-10-06/exp-leblanc/follow-burst');
mkdirSync(OUT, { recursive: true });

const ctx = await open({ base: BASE, fresh: true });
const { page, browser } = ctx;
const actors = () => page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.actors ?? []).map((a) => ({ id: a.id, art: a.art, side: a.side, pose: a.pose, facing: a.facing, mirrored: a.mirrored })));
const shot = (name) => page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 84 });
const t0 = Date.now();
const lap = () => `${Date.now() - t0} ms`;
const girls = ['yuna', 'rikku', 'paine'];
const sequences = {};

try {
  await page.evaluate(() => window.__pyrefly.setSeed(1));
  page.evaluate(() => window.__pyrefly.gotoChapter('exp-leblanc', { skipCutscenes: true, skipPrep: true, seed: 1 })).catch(() => {});
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__pyrefly.trigger('hud:off'));
  await page.addStyleTag({ content: '.dbox { display: none !important; }' });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.__pyrefly.setBattleSpeed('normal');
    window.__pyrefly.autoBattle('attack');
  });
  const done = new Set();
  const last = {};
  const t = Date.now();
  while (Date.now() - t < 90000 && done.size < 2) {
    for (const g of (await actors()).filter((a) => girls.includes(a.id))) {
      if (last[g.id] !== g.pose) {
        (sequences[g.id] ??= []).push(`${g.pose}@${lap()}`);
        last[g.id] = g.pose;
      }
      if (g.pose === 'follow' && !done.has(g.id)) {
        done.add(g.id);
        console.log('follow', g.id, lap(), JSON.stringify(g));
        for (let i = 0; i < 4; i++) {
          await shot(`follow-${g.id}-${String(i).padStart(2, '0')}`);
          const cur = (await actors()).find((a) => a.id === g.id);
          console.log(`  frame ${i} ${lap()}: ${cur ? cur.pose : 'gone'}`);
        }
      }
    }
    await page.waitForTimeout(16);
  }
  console.log('pose sequences', JSON.stringify(sequences));
  console.log('followed', JSON.stringify([...done]));
  console.log('console errors', JSON.stringify(ctx.consoleErrors), '404s', JSON.stringify(ctx.notFound));
  if (done.size < 2) process.exitCode = 1;
} finally {
  await browser.close();
}
