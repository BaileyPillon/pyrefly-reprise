#!/usr/bin/env node
/**
 * Screenshots of the FF7 Guard Scorpion field with no HUD (FF7 only), from the
 * dev harness `tools/ff7-stage/harness.html`: the opening (both front row, tail
 * down), a hit with its damage numeral, Barret after Change (back row), and the
 * raised tail. At 1600x900 and 390x844.
 *
 *   node tools/ff7-stage-shots.mjs --url=http://localhost:6300 [--out=docs/screenshots/ff7] [--seed=1]
 *
 * Needs a Vite server on the repo (any port). Uses the house browser mode
 * (`PYREFLY_BROWSER=gpu` for the real GPU, `tools/browser-mode.mjs`). Writes
 * `stage-<w>x<h>-<moment>.jpg` plus one `stage-<w>x<h>.json` with every
 * figure's world spot, facing, mirror flag, art and screen box at each moment,
 * the console errors and the failed requests.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { currentChromiumArgs } from './browser-mode.mjs';

const arg = (name, dflt) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') ?? dflt;
const base = arg('url', 'http://localhost:6300');
const out = arg('out', 'docs/screenshots/ff7');
const seed = arg('seed', '1');
mkdirSync(out, { recursive: true });

const VIEWPORTS = [
  { width: 1600, height: 900 },
  { width: 390, height: 844 },
];

const browser = await chromium.launch({ args: currentChromiumArgs() });
let failed = false;
for (const vp of VIEWPORTS) {
  const tag = `${vp.width}x${vp.height}`;
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errors = [];
  const bad = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
  await page.goto(`${base}/tools/ff7-stage/harness.html?seed=${seed}`);
  await page.waitForFunction(() => window.__ff7stage?.frames() > 20, null, { timeout: 60000 });

  const record = { viewport: vp, seed: Number(seed), moments: {} };
  const shoot = async (moment) => {
    const file = join(out, `stage-${tag}-${moment}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
    record.moments[moment] = await page.evaluate(() => ({
      snapshot: window.__ff7stage.snapshot(),
      rows: window.__ff7stage.rows(),
      formIndex: window.__ff7stage.formIndex(),
      camera: window.__ff7stage.camera(),
      numerals: window.__ff7stage.numerals(),
      events: window.__ff7stage.events().length,
    }));
    console.log(`[ff7-stage] ${file}`);
  };
  const until = (fn, ms = 180000) => page.waitForFunction(fn, null, { timeout: ms, polling: 50 });

  // The opening: everything painted, both in the front row, the tail down.
  await until(() => window.__ff7stage.snapshot().every((s) => !s.placeholder) && window.__ff7stage.events().includes('turn-start'), 90000);
  await shoot('open');
  // A hit: the first damage numeral on screen.
  await until(() => window.__ff7stage.numerals().length > 0);
  await shoot('hit');
  // Change: Barret in the back row, after his step.
  await until(() => window.__ff7stage.rows().barret === 'back');
  await page.waitForTimeout(700);
  await shoot('back-row');
  // Raise Tail: the tail-raised painting on the field.
  await until(() => window.__ff7stage.snapshot().some((s) => s.art === 'ff7-guard-scorpion-tail-up'));
  await page.waitForTimeout(900);
  await shoot('tail-up');

  record.errors = errors;
  record.failedRequests = bad;
  writeFileSync(join(out, `stage-${tag}.json`), `${JSON.stringify(record, null, 1)}\n`);
  if (errors.length || bad.length) failed = true;
  console.log(`[ff7-stage] ${tag}: ${errors.length} console errors, ${bad.length} failed requests`);
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
