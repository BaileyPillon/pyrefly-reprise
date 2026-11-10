#!/usr/bin/env node
/**
 * What the hidden Wendigo chapter weighs, measured (branch `wendigo-finish`; FFX only): a headless Playwright run (`PYREFLY_BROWSER=gpu` for the real GPU) against a dev server that is already up.
 *
 *   PYREFLY_BROWSER=gpu node tools/lake-weight.mjs --base http://127.0.0.1:5471/ --out <dir> [--w 1600 --h 900]
 *
 * It reads three things at four moments (the title, the first menu of the fight, the bench and the aeons all in, and after Yuna has called an aeon by key):
 *   1. **The download**: every response under `models-exp/lake/` as the page asked for it (the file, its size from the body), summed by moment, so "the first open" (the front line, the enemies, the props, the weapons: what the
 *      fight waits for) and "the background" (the bench and the aeons) are two numbers.
 *   2. **The GPU memory**: the browser's own GPU process, its dedicated usage from Windows' "GPU Process Memory" counters (the process id comes from the browser's own process list), and three.js's counts and an estimate of the
 *      textures it holds (width x height x 4 bytes plus the mip chain, per distinct texture), so the estimate can be compared with the real counter.
 *   3. **The desktop-only gate**: the same typed word on a phone-sized touch window must not open the chapter.
 * Nothing is changed in the page. It takes the machine-wide browser lock before it opens a browser and gives it back at the end. Paths come from the command line, none is written here.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg('--base', 'http://127.0.0.1:5471/');
const OUT = resolve(arg('--out', 'lake-weight-out'));
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('wendigo-finish lake weight', { maxMinutes: 15, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, commandRows } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);

const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const failures = [];
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};
const MiB = (n) => Math.round((n / 1048576) * 10) / 10;

/** The GPU process's dedicated memory, bytes, from Windows' performance counters (null when they are not there). */
function gpuDedicated(pid) {
  const cmd = `try { $s = (Get-Counter -Counter '\\GPU Process Memory(pid_${pid}_*)\\Dedicated Usage' -ErrorAction Stop).CounterSamples; ($s | Measure-Object -Property CookedValue -Sum).Sum } catch { '' }`;
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', windowsHide: true, timeout: 20000 });
  const n = Number(String(r.stdout ?? '').trim());
  return Number.isFinite(n) && String(r.stdout ?? '').trim() !== '' ? n : null;
}

let ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: false });
let { page, browser } = ctx;
const errors = [];
const fetched = [];
let moment = 'title';
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 300));
});
page.on('response', async (r) => {
  const url = r.url();
  if (!url.includes('/models-exp/lake/') || r.status() !== 200) return;
  const at = moment;
  try {
    const body = await r.body();
    fetched.push({ url: url.split('/models-exp/lake/')[1], bytes: body.length, moment: at, at: Date.now() });
  } catch {
    fetched.push({ url: url.split('/models-exp/lake/')[1], bytes: -1, moment: at, at: Date.now() });
  }
});
const cdp = await browser.newBrowserCDPSession();
const gpuPid = async () => {
  const info = await cdp.send('SystemInfo.getProcessInfo');
  return info.processInfo.find((p) => p.type === 'GPU' || p.type === 'gpu')?.id ?? null;
};
const sizes = () =>
  page.evaluate(() => {
    const g = globalThis.__lake3d;
    const stats = window.__pyrefly?.art?.stats?.().gl ?? null;
    const seen = new Set();
    let texBytes = 0;
    let textures = 0;
    const count = (t) => {
      if (!t || seen.has(t)) return;
      seen.add(t);
      const img = t.image;
      const w = img?.width ?? img?.videoWidth ?? 0;
      const h = img?.height ?? img?.videoHeight ?? 0;
      if (!w || !h) return;
      textures++;
      texBytes += w * h * 4 * (t.generateMipmaps === false ? 1 : 4 / 3);
    };
    const perId = {};
    if (g) {
      for (const [id, m] of g.models.models) {
        const before = texBytes;
        m.root.traverse((o) => {
          for (const mat of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) for (const v of Object.values(mat)) if (v && v.isTexture) count(v);
        });
        perId[id] = Math.round((texBytes - before) / 1048576 * 10) / 10;
      }
    }
    return { gl: stats, modelTexturesMiB: Math.round((texBytes / 1048576) * 10) / 10, distinctTextures: textures, perIdMiB: perId, carrying: g?.skin.carrying ?? null, capsules: g?.models.capsules ?? null };
  });
const measure = async (label) => {
  const pid = await gpuPid();
  const dedicated = pid ? gpuDedicated(pid) : null;
  const total = fetched.filter((f) => f.moment === label || label === 'all').reduce((s, f) => s + f.bytes, 0);
  const row = { moment: label, gpuPid: pid, gpuDedicatedMiB: dedicated === null ? null : MiB(dedicated), ...(await sizes()) };
  log('measure', row);
  return row;
};

const rows = [];
try {
  // ---- the title: the baseline ---------------------------------------------------------------------------------------------------
  await assertScreen(page, 'title');
  await page.waitForTimeout(1500);
  rows.push(await measure('title'));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
  }
  for (let attempt = 0; attempt < 3 && (await page.evaluate(() => window.__pyrefly?.screen?.())) !== 'party-prep'; attempt++) {
    await page.keyboard.type('wendigo', { delay: 150 });
    await page.waitForTimeout(2200);
  }
  await assertScreen(page, 'party-prep');
  await page.waitForTimeout(1200);
  moment = 'first-open';
  const t0 = Date.now();
  await page.keyboard.press('Enter');
  await assertScreen(page, 'battle', 150000);
  await waitBattleMenu(page, 150000);
  const firstMenuAt = Date.now();
  const firstMenuMs = firstMenuAt - t0;
  const before = fetched.filter((f) => f.at <= firstMenuAt);
  const after = fetched.filter((f) => f.at > firstMenuAt);
  log('download.before-the-first-menu', { files: before.length, MiB: MiB(before.reduce((s, f) => s + Math.max(0, f.bytes), 0)), names: before.map((f) => f.url) });
  log('download.after-the-first-menu-so-far', { files: after.length, MiB: MiB(after.reduce((s, f) => s + Math.max(0, f.bytes), 0)), names: after.map((f) => f.url) });
  log('first-open.seconds-to-the-first-menu', Math.round(firstMenuMs / 100) / 10);
  await page.waitForTimeout(1000);
  const firstOpen = await measure('first-open');
  rows.push(firstOpen);
  // ---- the background: the bench and the aeons come in -------------------------------------------------------------------------------
  moment = 'background';
  let backgroundMs = 0;
  const b0 = Date.now();
  for (let i = 0; i < 400; i++) {
    const s = await page.evaluate(() => {
      const g = globalThis.__lake3d;
      return g ? [...g.models.models.keys()].length : 0;
    });
    if (s >= 14) break;
    await page.waitForTimeout(250);
  }
  backgroundMs = Date.now() - b0;
  log('background.seconds-until-every-model-is-in', Math.round(backgroundMs / 100) / 10);
  await page.waitForTimeout(1500);
  const everything = await measure('background');
  rows.push(everything);
  // ---- an aeon called by key -----------------------------------------------------------------------------------------------------------
  moment = 'summon';
  await page.evaluate(() => {
    const st = window.__pyrefly.battleState();
    for (const id of st.activeIds) {
      const c = st.combatants[id];
      c.stats.maxHp = 99999;
      c.hp = 99999;
    }
  });
  let called = false;
  for (let guard = 0; guard < 8 && !called; guard++) {
    if (!(await waitBattleMenu(page, 60000).then(() => true).catch(() => false))) break;
    const labels = (await commandRows(page)).rows.map((r) => r.text);
    if (labels.some((t) => /^summon/i.test(t))) {
      for (const re of [/^summon/i, /^ifrit/i]) {
        for (let i = 0; i < 40; i++) {
          const { rows: rr } = await commandRows(page);
          const want = rr.findIndex((r) => re.test(r.text) && !r.disabled);
          const at = rr.findIndex((r) => r.selected);
          if (want >= 0 && at === want) {
            await page.keyboard.press('Enter');
            await page.waitForTimeout(450);
            break;
          }
          await page.keyboard.press(want < 0 || want > at ? 'ArrowDown' : 'ArrowUp');
          await page.waitForTimeout(160);
        }
      }
      called = true;
      break;
    }
    await page.keyboard.press('KeyQ');
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(3000);
  rows.push(await measure('summon'));
  check('Yuna called an aeon with the keys', called, null);
  const net = {};
  for (const f of fetched) {
    const slot = (net[f.moment] ??= { files: 0, bytes: 0 });
    slot.files++;
    slot.bytes += Math.max(0, f.bytes);
  }
  for (const k of Object.keys(net)) net[k].MiB = MiB(net[k].bytes);
  log('download', net);
  const t = (f) => Math.round(((f.at - t0) / 1000) * 10) / 10;
  writeFileSync(join(OUT, 'download.json'), JSON.stringify({ net, files: fetched.map((f) => ({ url: f.url, bytes: f.bytes, secondsAfterEnter: t(f) })), firstMenuSeconds: firstMenuMs / 1000, backgroundSeconds: backgroundMs / 1000 }, null, 1));
  check('no file of the set is over 25 MiB', fetched.every((f) => f.bytes < 25 * 1048576), fetched.filter((f) => f.bytes >= 25 * 1048576));
  check('no capsule stands in', (rows.at(-1).capsules ?? []).length === 0, rows.at(-1).capsules);
  await browser.close();

  // ---- the desktop-only gate on a phone-sized touch window ----------------------------------------------------------------------------
  const phone = await open({ base: BASE, fresh: true, width: 390, height: 844, touch: true });
  const p = phone.page;
  await p.waitForTimeout(1200);
  await p.keyboard.press('Enter').catch(() => undefined);
  await p.waitForTimeout(2500);
  let screen = await p.evaluate(() => window.__pyrefly?.screen?.());
  for (let attempt = 0; attempt < 2; attempt++) {
    await p.keyboard.type('wendigo', { delay: 150 });
    await p.waitForTimeout(2200);
  }
  screen = await p.evaluate(() => window.__pyrefly?.screen?.());
  log('phone.screen-after-the-word', screen);
  check('the word does not open the chapter on a phone-sized touch window', screen !== 'party-prep' && screen !== 'battle', screen);
  await phone.browser.close();
  browser = null;
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 800));
}
writeFileSync(join(OUT, 'weight.json'), JSON.stringify({ rows }, null, 1));
check('no console error or page error', errors.length === 0, errors.slice(0, 8));
try {
  await browser?.close();
} catch {
  /* closed */
}
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
