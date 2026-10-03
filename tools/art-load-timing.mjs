#!/usr/bin/env node
/**
 * What the derived WebP art costs a player in load time (release 38, "r38-bytes"): the battle's first load, before and after.
 *
 * Two builds of the same sources, each served by `vite preview` (a PNG build, e.g. `PYREFLY_ART_WEBP=off`, and the default build),
 * are played by the same headless Chromium (Playwright from node, `PYREFLY_BROWSER=gpu`): for each chapter, the time from asking
 * for it (`__pyrefly.gotoChapter`, the pre-battle scene skipped, so only the battle's own load) to its first command menu, on a
 * first load of the page with a cold HTTP cache (a fresh browser context for every run), plus what the page fetched meanwhile.
 * Runs alternate before / after and the median of each is reported. Profiles:
 *
 *   desktop          1600x900, no throttle: a local server, so all of the decode cost and none of the byte saving;
 *   phone-4x         390x844, touch, CPU throttled 4x (the phone tier: 1x art, the phone battle layout);
 *   desktop-50mbit   1600x900 on a 50 Mbit/s line with 20 ms round trip: what the saved bytes are worth to a player.
 *
 *   node tools/art-load-timing.mjs --before http://127.0.0.1:6502/pyrefly-reprise/ --after http://127.0.0.1:6503/pyrefly-reprise/
 *        [--runs 3] [--chapters seymour-flux,ffx2-bahamut] [--profiles desktop,phone-4x,desktop-50mbit] [--out timing.json]
 *
 * Run it on a quiet machine (nothing else encoding, building or playing), or the spread of the runs swallows the difference.
 * Game case: both (shared build plumbing).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { currentChromiumArgs, resolveBrowserMode } from './browser-mode.mjs';

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

const PROFILES = {
  desktop: { viewport: { width: 1600, height: 900 }, touch: false, throttle: 1 },
  'phone-4x': { viewport: { width: 390, height: 844 }, touch: true, throttle: 4 },
  'desktop-50mbit': { viewport: { width: 1600, height: 900 }, touch: false, throttle: 1, net: { downloadThroughput: (50 * 1e6) / 8, uploadThroughput: (10 * 1e6) / 8, latency: 20 } },
};

/** One cold first load of `base`, then one chapter to its first command menu. */
async function once(browser, base, chapter, profile) {
  const ctx = await browser.newContext({ viewport: profile.viewport, deviceScaleFactor: 1, hasTouch: profile.touch, isMobile: false });
  const page = await ctx.newPage();
  const seen = { images: 0, imageBytes: 0, webp: 0, png: 0 };
  page.on('response', (r) => {
    const url = r.url();
    if (!/\.(png|webp)(\?|$)/.test(url)) return;
    seen.images++;
    if (/\.webp/.test(url)) seen.webp++;
    else seen.png++;
    seen.imageBytes += Number(r.headers()['content-length'] ?? 0);
  });
  if (profile.throttle > 1 || profile.net) {
    const cdp = await ctx.newCDPSession(page);
    if (profile.throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.throttle });
    if (profile.net) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...profile.net });
  }
  await page.goto(base);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  await sleep(1500); // the title settles: its own loads are not the battle's
  const before = { ...seen };
  const t0 = Date.now();
  await page.evaluate((c) => {
    window.__pyrefly.setSeed(1);
    void window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true });
  }, chapter);
  for (;;) {
    const screen = await page.evaluate(() => window.__pyrefly.screen());
    if (screen === 'battle' && (await page.evaluate(() => /"awaitingMenu":true|"awaiting":true|"menuOpen":true/.test(JSON.stringify(window.__pyrefly.snapshotState()?.screenState ?? {}))))) break;
    if (Date.now() - t0 > 240000) throw new Error(`no command menu after 240 s (screen ${screen})`);
    await sleep(50);
  }
  const ms = Date.now() - t0;
  await ctx.close();
  return { ms, images: seen.images - before.images, imageBytes: seen.imageBytes - before.imageBytes, webp: seen.webp - before.webp, png: seen.png - before.png };
}

async function main() {
  const builds = { before: arg('--before'), after: arg('--after') };
  if (!builds.before || !builds.after) throw new Error('give --before <url> and --after <url> (each a served build, `vite preview`)');
  const runs = Number(arg('--runs', '3'));
  const chapters = (arg('--chapters', 'seymour-flux,ffx2-bahamut')).split(',');
  const names = (arg('--profiles', Object.keys(PROFILES).join(','))).split(',');
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const rows = [];
  try {
    console.log(`art-load-timing (${resolveBrowserMode()}): ${runs} runs each, alternating`);
    for (const name of names) {
      for (const chapter of chapters) {
        const samples = { before: [], after: [] };
        for (let i = 0; i < runs; i++) {
          for (const which of i % 2 === 0 ? ['before', 'after'] : ['after', 'before']) {
            const r = await once(browser, builds[which], chapter, PROFILES[name]);
            samples[which].push(r);
            console.log(`  ${name} ${chapter} ${which} run ${i + 1}: ${r.ms} ms, ${r.images} images (${r.webp} webp, ${r.png} png), ${(r.imageBytes / 1e6).toFixed(1)} MB`);
          }
        }
        const row = { profile: name, chapter };
        for (const which of ['before', 'after']) {
          row[which] = {
            medianMs: median(samples[which].map((s) => s.ms)),
            runsMs: samples[which].map((s) => s.ms),
            images: median(samples[which].map((s) => s.images)),
            imageMB: Number((median(samples[which].map((s) => s.imageBytes)) / 1e6).toFixed(2)),
          };
        }
        row.deltaMs = row.after.medianMs - row.before.medianMs;
        rows.push(row);
        console.log(`=> ${name} ${chapter}: before ${row.before.medianMs} ms, after ${row.after.medianMs} ms (${row.deltaMs >= 0 ? '+' : ''}${row.deltaMs} ms), image bytes ${row.before.imageMB} -> ${row.after.imageMB} MB`);
      }
    }
  } finally {
    await browser.close();
  }
  if (arg('--out')) {
    mkdirSync(dirname(resolve(arg('--out'))), { recursive: true });
    writeFileSync(resolve(arg('--out')), `${JSON.stringify(rows, null, 1)}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
