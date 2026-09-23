#!/usr/bin/env node
/**
 * Ormi round 2 (FFX-2 only, Chapter 6): measure each pose in a running battle.
 *
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/leblanc/lora/ormi/round2/ingame.mjs <port> <label>
 *
 * Needs a vite dev server on <port> (the round-2 run starts its own on a random free
 * port 5400-5990 and stops it by its PID). Boots the game, `__pyrefly.gotoChapter
 * ('ffx2-leblanc')`, waits for the battle, then forces the Ormi actor (`ormi-entrance`,
 * Act I, spriteKey 'ormi') into each state with `setPose(state, {immediate, force})` and
 * records the silhouette's projected screen rectangle (`PaintedStage.projectRect`, the
 * rect the target bracket uses) plus a screenshot at deviceScaleFactor 2 and a crop
 * around him. Writes round2/ingame-<label>.json and round2/ingame-<label>-<state>.png.
 * The head comparison (heads within 5 percent of idle's) is done by measure.py from
 * this JSON and the PNGs' own pixels.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..', '..', '..', '..', '..');
const { chromium } = await import(pathToFileURL(join(REPO, 'node_modules/playwright/index.mjs')).href);
const { currentChromiumArgs, resolveBrowserMode } = await import(pathToFileURL(join(REPO, 'tools/browser-mode.mjs')).href);

const [port, label = 'now'] = process.argv.slice(2);
const STATES = ['idle', 'attack', 'cast', 'hurt', 'ko'];
const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90_000 });
const renderer = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
});
await page.evaluate(async () => {
  const P = window.__pyrefly;
  P.setSeed(6);
  P.gotoChapter('ffx2-leblanc', { skipCutscenes: true });
  await P.waitForScreen('battle', 90_000);
  await P.frames(360); // past the chapter's title card ("A Farce, Armed")
  P.trigger('hud:off');
  await P.frames(10);
});
const out = { label, port: Number(port), browser: resolveBrowserMode(), renderer, viewport: [1600, 900], dsf: 2, states: {} };
for (const state of STATES) {
  const r = await page.evaluate(async (state) => {
    const P = window.__pyrefly;
    const st = P.battle().stage;
    const a = st.actor('ormi-entrance');
    P.trigger('hud:off');
    // The battle camera moves between rigs, so every state is measured PAIRED with idle a
    // few frames apart under the same camera: idle rect, state rect, idle rect again.
    const rectOf = async (pose) => {
      a.setPose(pose, { immediate: true, force: true });
      await P.frames(4);
      return st.projectRect('ormi-entrance');
    };
    if (state !== 'idle') { a.setPose(state, { immediate: true, force: true }); await P.frames(state === 'ko' ? 90 : 30); }
    const idleBefore = await rectOf('idle');
    const rect = await rectOf(state);
    const idleAfter = await rectOf('idle');
    const rectFinal = await rectOf(state);
    const tex = a.poses?.[state] ?? a.poses?.get?.(state);
    const meta = tex?.meta ? { width: tex.meta.width, height: tex.meta.height, baselineY: tex.meta.baselineY, scale: tex.meta.scale ?? null, content: tex.meta.content ?? tex.content ?? null } : null;
    const itex = a.poses?.['idle'] ?? a.poses?.get?.('idle');
    const idleMeta = itex?.meta ? { content: itex.meta.content ?? itex.content ?? null } : null;
    return { pose: a.pose, rect: rectFinal, rectPaired: rect, idleBefore, idleAfter, meta, idleMeta, url: a.poseUrls?.[state] ?? a.poseUrls?.get?.(state) ?? null };
  }, state);
  const png = join(HERE, `ingame-${label}-${state}.png`);
  const { x, y, w, h } = r.rect;
  const pad = 70;
  await page.screenshot({ path: png, clip: { x: Math.max(0, x - pad * 1.6), y: Math.max(0, y - pad), width: w + pad * 3.2, height: h + pad * 2 } });
  if (state === 'idle' || state === 'ko') await page.screenshot({ path: join(HERE, `ingame-${label}-${state}-full.jpg`), type: 'jpeg', quality: 85 });
  out.states[state] = r;
  console.log(`[ingame] ${state}: pose ${r.pose}, rect h ${h.toFixed(1)} w ${w.toFixed(1)}`);
}
writeFileSync(join(HERE, `ingame-${label}.json`), JSON.stringify(out, null, 1));
await browser.close();
