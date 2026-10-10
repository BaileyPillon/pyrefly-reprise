#!/usr/bin/env node
/**
 * Photograph and measure the experimental Leblanc room's LOOK in the engine (branch `exp-leblanc`; FFX-2 only).
 *
 *   PYREFLY_BROWSER=gpu node tools/exp-look.mjs capture --base http://127.0.0.1:4190/ --out DIR --tag NAME [--set '{"u.saturation":0.9}'] [--hud] [--plate]
 *   PYREFLY_BROWSER=gpu node tools/exp-look.mjs sweep   --base http://127.0.0.1:4190/ --out DIR --file sets.json
 *   PYREFLY_BROWSER=gpu node tools/exp-look.mjs hud     --base http://127.0.0.1:4190/ --out DIR --tag NAME
 *   PYREFLY_BROWSER=gpu node tools/exp-look.mjs chapter --base http://127.0.0.1:4190/ --out DIR --tag NAME --chapter ffx2-leblanc
 *
 * `base` is a `vite preview` of a BASE_PATH=/ build (`node tools/exp-smoke.mjs build` then `preview --port 4190`: the code-only build takes two seconds, the art is
 * read through junctions). Headless only (`PYREFLY_BROWSER=gpu`); never the Chrome extension or the browser pane.
 *
 * `capture` plays the experimental chapter by the debug route (the party attacks at the 'skip' pace) to Act III's first command menu, the framing of the shots run's
 * `preview-5b`, then holds the presentation clocks (`fx.freeze`, the same frame every time) and writes `NAME-clean.png` (no HUD, no dialogue box: the room alone)
 * and, with `--hud`, `NAME-hud.png` (the menu as the player sees it) and, with `--plate`, `NAME-plate-clean.png` (the same frame with every figure off the stage).
 * `--set` puts live overrides on the renderer first, for trying a look without a rebuild:
 *   "u.<uniform>"   a grade uniform (a number, or [r, g, b] for a vec3): `u.saturation`, `u.lift`, `u.gain`, `u.hazeProfile`, ...
 *   "p.<field>"     a field of the live scene palette, read every frame by option A: `p.vignette`
 *   "dial.<name>"   an eye-candy strength dial (1 = as tuned): `dial.look`, `dial.vignette`, `dial.bloom`
 * `sweep` takes one page to the menu once and photographs each `{ "tag": ..., "set": {...} }` of a JSON list in turn (the overrides of one entry replace the last).
 * `hud` writes `NAME-hud.json`: for every text element of the menu, its colour, the background behind it (median of the pixels of its box with the text hidden),
 * and their WCAG contrast ratio. `chapter` photographs another chapter's first menu the same frozen way (the proof that a look change leaves it as it was).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { open, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);

const argv = process.argv.slice(2);
const mode = argv[0];
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};
const BASE = arg('--base', 'http://127.0.0.1:4190/');
const OUT = resolve(arg('--out', 'D:/Tools/pyrefly-scratch/2026-10-06/exp-leblanc/look'));
const TAG = arg('--tag', 'frame');
mkdirSync(OUT, { recursive: true });

const girls = ['yuna', 'rikku', 'paine'];

/** Overrides on the live renderer; returns what it set (for the log). */
async function applySet(page, set) {
  return page.evaluate((s) => {
    const app = window.__pyrefly.app;
    const done = {};
    for (const [key, value] of Object.entries(s ?? {})) {
      const [kind, name] = [key.slice(0, key.indexOf('.')), key.slice(key.indexOf('.') + 1)];
      if (kind === 'u') {
        const u = app.renderer.gradePass.uniforms[name];
        if (!u) {
          done[key] = 'NO SUCH UNIFORM';
          continue;
        }
        if (Array.isArray(value)) u.value.set(...value);
        else u.value = value;
        done[key] = value;
      } else if (kind === 'p') {
        if (app.renderer.palette) app.renderer.palette[name] = value;
        done[key] = value;
      } else if (kind === 'dial') {
        window.__pyrefly.fx.dial(name, value);
        done[key] = value;
      } else done[key] = 'UNKNOWN KIND';
    }
    return done;
  }, set);
}

/** What the renderer holds now, so a sweep can put each entry on the same footing: the grade uniforms (numbers and vec3s), the live palette and the strength dials. */
async function readDefaults(page) {
  return page.evaluate(() => {
    const app = window.__pyrefly.app;
    const out = { u: {}, p: { ...(app.renderer.palette ?? {}) }, dial: {} };
    for (const [k, u] of Object.entries(app.renderer.gradePass.uniforms)) {
      const v = u.value;
      if (typeof v === 'number') out.u[k] = v;
      else if (v && typeof v.x === 'number' && typeof v.z === 'number' && v.w === undefined) out.u[k] = [v.x, v.y, v.z];
    }
    for (const n of ['bloom', 'look', 'vignette', 'grain', 'shafts', 'streaks', 'haze', 'dof', 'rim', 'flare', 'halo']) out.dial[n] = window.__pyrefly.fx.dial(n);
    return out;
  });
}

/** Put the renderer back to what `readDefaults` read, then apply one entry's overrides. */
async function resetThen(page, defaults, set) {
  const flat = {};
  for (const [k, v] of Object.entries(defaults.u)) flat[`u.${k}`] = v;
  for (const [k, v] of Object.entries(defaults.p)) if (typeof v === 'number') flat[`p.${k}`] = v;
  for (const [k, v] of Object.entries(defaults.dial)) flat[`dial.${k}`] = v;
  await applySet(page, flat);
  return applySet(page, set);
}

/** Boot, play to Act III's first command menu by the debug route, and return the page. */
async function toActIII(ctx) {
  const { page } = ctx;
  const actors = () => page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.actors ?? []).map((a) => ({ id: a.id, art: a.art, pose: a.pose })));
  await page.evaluate(() => window.__pyrefly.setSeed(1));
  page.evaluate(() => window.__pyrefly.gotoChapter('exp-leblanc', { skipCutscenes: true, skipPrep: true, seed: 1 })).catch(() => {});
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.__pyrefly.setBattleSpeed('skip');
    window.__pyrefly.autoBattle('intended');
  });
  await waitFor('Act III on the field', async () => (await actors()).some((a) => a.art === 'exp-leblanc-leblanc'), { ms: 360000, pollMs: 80 });
  await page.evaluate(() => {
    window.__pyrefly.battle().battlePresenter.setAutoPlay(null); // the keys take over
    window.__pyrefly.setBattleSpeed('normal');
  });
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(3200);
}

/** Every figure on the stage out (alpha 0) or back (1): a frame of the plate alone, for measuring the room without a costume in it (`"plateOnly": true` on a sweep entry). */
async function actorsAlpha(page, a) {
  await page.evaluate((alpha) => {
    const stage = window.__pyrefly.battle().stage;
    for (const act of window.__pyrefly.snapshotState().screenState.actors) stage.actor(act.id)?.setAlpha(alpha);
  }, a);
  await page.waitForTimeout(250);
}

/** The frame as a capture wants it: the clocks held (the same frame every time), and the room alone or with the menu. */
async function hold(page) {
  await page.evaluate(() => {
    window.__pyrefly.fx.freeze(true);
    window.__pyrefly.fx.b?.pin?.(0);
  });
  await page.waitForTimeout(500);
}

async function clean(page, file) {
  await page.evaluate(() => window.__pyrefly.trigger('hud:off'));
  const style = await page.addStyleTag({ content: '.dbox { display: none !important; }' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: file });
  await style.evaluate((el) => el.remove());
  await page.evaluate(() => window.__pyrefly.trigger('hud:on'));
  await page.waitForTimeout(500);
}

async function capture() {
  const ctx = await open({ base: BASE, fresh: true });
  try {
    await toActIII(ctx);
    const set = JSON.parse(arg('--set', '{}'));
    const done = await applySet(ctx.page, set);
    console.log('set', JSON.stringify(done));
    await hold(ctx.page);
    await ctx.page.waitForTimeout(400);
    const withHud = argv.includes('--hud');
    if (withHud) {
      await ctx.page.screenshot({ path: join(OUT, `${TAG}-hud.png`) });
      console.log('wrote', join(OUT, `${TAG}-hud.png`));
    }
    await clean(ctx.page, join(OUT, `${TAG}-clean.png`));
    console.log('wrote', join(OUT, `${TAG}-clean.png`));
    if (argv.includes('--plate')) {
      // the same frozen frame with every figure off the stage: the room alone, for the numbers and for `look-figures.py`
      await actorsAlpha(ctx.page, 0);
      await clean(ctx.page, join(OUT, `${TAG}-plate-clean.png`));
      await actorsAlpha(ctx.page, 1);
      console.log('wrote', join(OUT, `${TAG}-plate-clean.png`));
    }
    console.log('console errors', JSON.stringify(ctx.consoleErrors), '404s', JSON.stringify(ctx.notFound));
  } finally {
    await ctx.browser.close();
  }
}

async function sweep() {
  const sets = JSON.parse(readFileSync(resolve(arg('--file')), 'utf8'));
  const ctx = await open({ base: BASE, fresh: true });
  try {
    await toActIII(ctx);
    const defaults = await readDefaults(ctx.page);
    await hold(ctx.page);
    for (const entry of sets) {
      const done = await resetThen(ctx.page, defaults, entry.set);
      if (entry.plateOnly) await actorsAlpha(ctx.page, 0);
      await ctx.page.waitForTimeout(450);
      await clean(ctx.page, join(OUT, `${entry.tag}-clean.png`));
      if (entry.plateOnly) await actorsAlpha(ctx.page, 1);
      console.log('wrote', entry.tag, JSON.stringify(done));
    }
    console.log('console errors', JSON.stringify(ctx.consoleErrors), '404s', JSON.stringify(ctx.notFound));
  } finally {
    await ctx.browser.close();
  }
}

/** The WCAG contrast numbers of the HUD's text over what lies behind it. */
async function hud() {
  const ctx = await open({ base: BASE, fresh: true });
  const { page } = ctx;
  try {
    await toActIII(ctx);
    // Not held (no `fx.freeze`): a frozen presentation clock leaves the HUD's panels part way through their fade-in, and the contrast read off them is not the player's.
    const set = JSON.parse(arg('--set', '{}'));
    await applySet(page, set);
    if (arg('--css', null)) await page.addStyleTag({ content: arg('--css', '') }); // a style rule to try on the HUD (what a fix would be)
    await page.waitForTimeout(1500);
    // Text hidden (transparent, no shadow), so a screenshot shows the panel and the room behind each text box, never the glyphs.
    const boxes = await page.evaluate(() => {
      const rootEl = document.querySelector('[data-role="battle-root"]') ?? document.body;
      const out = [];
      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = (n.textContent ?? '').trim();
        if (t.length < 2) continue;
        const el = n.parentElement;
        if (!el || seen.has(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        // what the player sees of this text: its opacity through every ancestor, and its box cut to every ancestor that clips (a scrolled panel's text runs on below its edge)
        let eff = 1;
        let left = -Infinity;
        let top = -Infinity;
        let right = Infinity;
        let bottom = Infinity;
        for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
          const s = getComputedStyle(e);
          eff *= Number(s.opacity);
          if (e !== el && (s.overflowX !== 'visible' || s.overflowY !== 'visible')) {
            const b = e.getBoundingClientRect();
            left = Math.max(left, b.left);
            top = Math.max(top, b.top);
            right = Math.min(right, b.right);
            bottom = Math.min(bottom, b.bottom);
          }
        }
        if (eff < 0.5) continue;
        const r0 = el.getBoundingClientRect();
        const r = { left: Math.max(r0.left, left, 0), top: Math.max(r0.top, top, 0), right: Math.min(r0.right, right, innerWidth), bottom: Math.min(r0.bottom, bottom, innerHeight) };
        r.width = r.right - r.left;
        r.height = r.bottom - r.top;
        if (r.width < 8 || r.height < 6) continue;
        seen.add(el);
        out.push({ text: t.slice(0, 40), color: cs.color, size: parseFloat(cs.fontSize), weight: cs.fontWeight, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), cls: (el.className?.toString?.() ?? '').slice(0, 60) });
      }
      return out;
    });
    const style = await page.addStyleTag({ content: '*, *::before, *::after { color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; caret-color: transparent !important; }' });
    await page.waitForTimeout(400);
    const png = await page.screenshot();
    await style.evaluate((el) => el.remove());
    const pngPath = join(OUT, `${TAG}-hud-textless.png`);
    writeFileSync(pngPath, png);
    writeFileSync(join(OUT, `${TAG}-hud-boxes.json`), JSON.stringify(boxes, null, 1));
    console.log('wrote', pngPath, `${boxes.length} text boxes`);
  } finally {
    await ctx.browser.close();
  }
}

async function chapter() {
  const id = arg('--chapter', 'ffx2-leblanc');
  const ctx = await open({ base: BASE, fresh: true });
  const { page } = ctx;
  try {
    // Reduce motion (the browser's own setting) stops the camera sway, the dust and the drifts, so the same state is the same frame in two builds.
    if (argv.includes('--reduced')) await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => window.__pyrefly.setSeed(1));
    page.evaluate((c) => window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true, seed: 1 }), id).catch(() => {});
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(3200);
    await hold(page);
    await page.waitForTimeout(400);
    const file = join(OUT, `${TAG}.png`);
    await page.screenshot({ path: file });
    const palette = await page.evaluate(() => {
      const g = window.__pyrefly.app.renderer.gradePass.uniforms;
      const out = {};
      for (const [k, u] of Object.entries(g)) {
        const v = u.value;
        if (typeof v === 'number') out[k] = v;
        else if (v && typeof v.x === 'number') out[k] = [v.x, v.y, v.z];
      }
      return out;
    });
    writeFileSync(join(OUT, `${TAG}-uniforms.json`), JSON.stringify(palette, null, 1));
    console.log('wrote', file);
    console.log('console errors', JSON.stringify(ctx.consoleErrors), '404s', JSON.stringify(ctx.notFound));
  } finally {
    await ctx.browser.close();
  }
}

const modes = { capture, sweep, hud, chapter };
if (!modes[mode]) {
  console.error('usage: exp-look.mjs capture|sweep|hud|chapter [--base URL] [--out DIR] [--tag NAME] ...');
  process.exit(2);
}
await modes[mode]();
