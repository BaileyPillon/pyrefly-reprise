// Capture driver for the preview-picks run: headless GPU Chromium, 1600x900, optional WebM recording,
// overlay on/off through the dev server's /__preview/on|off. One browser at a time. Never Claude-in-Chrome.
import { chromium } from 'playwright';
import { currentChromiumArgs } from '../browser-mode.mjs';
import fs from 'node:fs';
import path from 'node:path';

export const OUT = 'D:/Tools/pyrefly-scratch/2026-10-03/visual-options/preview';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function waitFor(label, pred, { ms = 60000, poll = 250 } = {}) {
  const t0 = Date.now();
  for (;;) {
    const r = await pred();
    if (r) return r;
    if (Date.now() - t0 > ms) throw new Error(`ASSERT-FAIL ${label} after ${Date.now() - t0}ms`);
    await sleep(poll);
  }
}

/** Open the game. mode: 'preview' | 'live'. record: a folder for the WebM, or falsy. */
export async function openGame({ port = 6210, mode = 'preview', record = null, settings = {}, query = '' } = {}) {
  await fetch(`http://127.0.0.1:${port}/__preview/${mode === 'live' ? 'off' : 'on'}`).then((r) => r.json());
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    ...(record ? { recordVideo: { dir: record, size: { width: 1600, height: 900 } } } : {}),
  });
  const ctxStart = Date.now();
  const page = await ctx.newPage();
  const errors = [];
  const missing = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 300)));
  page.on('response', (r) => { if (r.status() >= 400) missing.push(`${r.status()} ${r.url().replace(`http://127.0.0.1:${port}`, '')}`); });
  const base = `http://127.0.0.1:${port}/${query}`;
  await page.goto(base);
  await page.evaluate((s) => {
    try {
      localStorage.clear();
      const k = 'pyrefly-reprise:save:v1';
      localStorage.setItem(k, JSON.stringify({ settings: { ffx2AtbMigrated: true, ...s } }));
    } catch { /* storage blocked */ }
  }, settings);
  await page.goto(base);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
  return { browser, ctx, page, errors, missing, ctxStart };
}

export const screen = (page) => page.evaluate(() => window.__pyrefly.screen());

/** Start a chapter straight into its battle (cutscenes skipped, prep skipped). */
export async function enterBattle(page, chapterId, seed = 1) {
  await page.evaluate(([id, sd]) => {
    window.__pyrefly.setSeed(sd);
    window.__pyrefly.gotoChapter(id, { skipCutscenes: true, skipPrep: true, seed: sd }).catch(() => {});
  }, [chapterId, seed]);
  await waitFor(`screen battle (${chapterId})`, async () => (await screen(page)) === 'battle', { ms: 120000, poll: 400 });
  await sleep(2500);
}

export const phase = (page) => page.evaluate(() => { const s = window.__pyrefly.snapshotState().screenState; return { phase: s?.playback?.phase, awaiting: s?.playback?.awaitingMenu }; });

export async function waitMenu(page, ms = 120000) {
  return waitFor('awaitingMenu', async () => { const p = await phase(page); return p.awaiting ? p : false; }, { ms, poll: 300 });
}

export const rows = (page) => page.evaluate(() => [...document.querySelectorAll('.ig-cmd')].map((e, i) => {
  const r = e.getBoundingClientRect();
  return { i, text: (e.querySelector('.ffx-cmd__label,.ffx2cmd__label')?.textContent ?? e.textContent).trim().slice(0, 60), selected: e.classList.contains('ig-cmd--selected'), od: e.classList.contains('ig-cmd--overdrive'), w: Math.round(r.width), h: Math.round(r.height) };
}).filter((r) => r.w > 4 && r.h > 4));

/** Sample every actor's pose per frame into window.__samp (id -> [t,pose]). */
export async function startSampler(page) {
  await page.evaluate(() => {
    window.__samp = { t0: performance.now(), poses: [], last: {} };
    const tick = () => {
      try {
        const st = window.__pyrefly.app.current?.stage;
        if (st?.staged) for (const id of st.staged()) {
          const p = st.actor(id)?.pose;
          if (p !== undefined && window.__samp.last[id] !== p) { window.__samp.last[id] = p; window.__samp.poses.push({ t: Math.round(performance.now() - window.__samp.t0), id, pose: p, menu: !!window.__pyrefly.battle?.()?.battlePresenter?.pendingMenu }); }
        }
      } catch { /* not staged yet */ }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
export const poses = (page) => page.evaluate(() => window.__samp.poses);

export async function shot(page, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
  return file;
}

/** Close the context so the WebM is flushed; returns the webm path (if any), after ffmpeg trims/compresses it. */
export async function finishVideo(ctx, page, browser, outWebm, { startMs = 0, maxSec = 9.5 } = {}) {
  const vid = page.video ? page.video() : null;
  await ctx.close();
  await browser.close();
  if (!vid || !outWebm) return null;
  const src = await vid.path();
  const FF = 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
  const { execFileSync } = await import('node:child_process');
  fs.mkdirSync(path.dirname(outWebm), { recursive: true });
  for (const crf of [34, 38, 42]) {
    execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', String(startMs / 1000), '-i', src, '-t', String(maxSec), '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(crf), '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', outWebm]);
    if (fs.statSync(outWebm).size <= 3 * 1024 * 1024) break;
  }
  return { webm: outWebm, bytes: fs.statSync(outWebm).size, raw: src };
}
