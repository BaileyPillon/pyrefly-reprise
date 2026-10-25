#!/usr/bin/env node
/**
 * The booth's one command (R61; docs/DEMO-KIT.md): serve the offline copy of the site, open it full screen, stop it, or put a fresh visitor in front of a fresh save.
 *
 *   node tools/demo-kit/demo-kit.mjs start  [--dir <folder>] [--port 5173] [--browser chrome|edge] [--no-kiosk] [--no-browser] [--keep-profile] [--cold] [--plain]
 *   node tools/demo-kit/demo-kit.mjs reset  [--browser chrome|edge] [--no-kiosk]        (close the browser, wipe its save and per-tab memory, keep its caches, open it again; the server keeps running)
 *   node tools/demo-kit/demo-kit.mjs stop   [--wipe]                                     (close the browser, stop the server; --wipe also deletes the browser profile)
 *   node tools/demo-kit/demo-kit.mjs status
 *
 * `start` runs `serve-offline.mjs` in the background (loopback only, no internet needed), then opens Chrome (else Edge) in kiosk mode on `http://127.0.0.1:<port>/?demo=1&pack=demo` (the conference pack on:
 * the F1 HUD, the sound pass, the pro look / camera / staging, the boss re-cut, the booth cards, the fight prebuild; `--plain` opens `?demo=1` alone, the plain release-62 demo), in a browser profile of its own
 * under `%LOCALAPPDATA%\EchoesDemoKit` (or `ECHOES_DEMO_HOME`). The game's save lives in that profile's localStorage, and the demo's per-tab counters in its session, so a fresh profile is a fresh save and
 * a fresh first fight. What it started it stops BY PID, after checking the process still is the one it started (a stale file from before a reboot never kills a stranger); nothing is stopped by image name.
 *
 * Game case: both (tooling).
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DEFAULT_PORT, SAVE_PATHS, boothUrl, browserArgs, defaultSiteDir, findBrowser, isPlainBoothUrl, kitHome } from './demo-kit-lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, 'serve-offline.mjs');
const IS_WINDOWS = process.platform === 'win32';

const home = kitHome();
const STATE = join(home, 'state.json');
const PID_FILE = join(home, 'server.pid.json');
const LOG = join(home, 'server.log');
const PROFILE = join(home, 'profile');

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const say = (m) => console.log(m);

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** The command line of a process, or null when no such process runs. Windows: CIM; elsewhere: ps. */
export function commandLineOf(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  if (IS_WINDOWS) {
    const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" -ErrorAction SilentlyContinue).CommandLine`], { encoding: 'utf8', windowsHide: true });
    const out = (r.stdout ?? '').trim();
    return out === '' ? null : out;
  }
  const r = spawnSync('ps', ['-o', 'args=', '-p', String(pid)], { encoding: 'utf8' });
  const out = (r.stdout ?? '').trim();
  return out === '' ? null : out;
}

/** Stop a process tree by PID, but only when its command line still contains `marker` (it is the process the kit started). Returns what happened. */
export function stopPid(pid, marker) {
  const cmd = commandLineOf(pid);
  if (cmd === null) return 'gone';
  if (!cmd.includes(marker)) return 'not-ours';
  if (IS_WINDOWS) spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
  else {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  }
  return 'stopped';
}

async function health(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/__demo-kit/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function startServer(dir, port) {
  mkdirSync(home, { recursive: true });
  rmSync(PID_FILE, { force: true });
  const log = openSync(LOG, 'a');
  const child = spawn(process.execPath, [SERVER, '--dir', dir, '--port', String(port), '--pid-file', PID_FILE], { detached: true, stdio: ['ignore', log, log], windowsHide: true });
  child.unref();
  for (let i = 0; i < 100; i++) {
    const p = readJson(PID_FILE);
    if (p?.port && (await health(p.port))) return { pid: p.pid, port: p.port };
    await sleep(100);
  }
  throw new Error(`the server did not come up; see ${LOG}`);
}

function launchBrowser({ url, kiosk, prefer }) {
  const found = findBrowser(existsSync, prefer);
  if (!found) return null;
  mkdirSync(PROFILE, { recursive: true });
  const child = spawn(found.path, browserArgs({ url, profileDir: PROFILE, kiosk }), { detached: true, stdio: 'ignore' });
  child.unref();
  return { pid: child.pid, name: found.name, path: found.path };
}

function stopBrowser(state) {
  if (!state?.browserPid) return 'gone';
  return stopPid(state.browserPid, `--user-data-dir=${PROFILE}`);
}

async function wipeProfile() {
  for (let i = 0; i < 20; i++) {
    try {
      rmSync(PROFILE, { recursive: true, force: true });
      if (!existsSync(PROFILE)) return true;
    } catch {
      /* a browser process still letting go of a file */
    }
    await sleep(300);
  }
  return !existsSync(PROFILE);
}

/** A fresh visitor: delete the game's save and the browser's per-tab memory, keep the caches (the compiled shaders make the next first fight smooth). The browser must be closed. */
async function wipeSave() {
  for (let i = 0; i < 20; i++) {
    let left = false;
    for (const rel of SAVE_PATHS) {
      const p = join(PROFILE, ...rel.split('/'));
      try {
        rmSync(p, { recursive: true, force: true });
      } catch {
        /* a browser process still letting go of a file */
      }
      if (existsSync(p)) left = true;
    }
    if (!left) return true;
    await sleep(300);
  }
  return false;
}

async function start(opt, flag) {
  const old = readJson(STATE);
  if (old?.port && (await health(old.port))) {
    say(`Already running at ${old.url}. Use reset to put a fresh visitor in front of a fresh save, or stop first.`);
    if (isPlainBoothUrl(old.url) !== flag('--plain')) say(`note: that is the ${isPlainBoothUrl(old.url) ? 'plain demo' : 'conference pack'}; to switch, run stop-demo.cmd, then start-demo.cmd${isPlainBoothUrl(old.url) ? '' : ' --plain'}.`);
    return 0;
  }
  if (old) {
    stopBrowser(old); // a browser from a run whose server is gone: close it before opening another
    await sleep(500);
  }
  const dir = resolve(opt('--dir', defaultSiteDir()));
  if (!existsSync(join(dir, 'index.html'))) {
    console.error(`There is no copy of the site in ${dir}.\nMake it with fetch-site.cmd (docs/DEMO-KIT.md), or name the folder with --dir.`);
    return 2;
  }
  const mark = readJson(join(dir, '.demo-kit-site.json'));
  if (!mark) say('note: this folder has no .demo-kit-site.json (not made by fetch-site); serving it as it is.');
  else if (!mark.complete) say(`WARNING: this copy is partial (${mark.selected} of ${mark.of} files). Some art or sound will be missing. Run fetch-site again.`);

  if (flag('--cold')) await wipeProfile();
  else if (!flag('--keep-profile')) await wipeSave();
  const server = await startServer(dir, Number(opt('--port', String(DEFAULT_PORT))));
  const url = boothUrl(server.port, { plain: flag('--plain') });
  say(`Serving ${dir}\n  at http://127.0.0.1:${server.port}/  (nothing leaves this machine)`);
  say(isPlainBoothUrl(url) ? 'Address: the plain demo (?demo=1, --plain): the conference pack is off.' : 'Address: the conference pack is on (?demo=1&pack=demo). start-demo.cmd --plain opens the plain demo.');
  const state = { serverPid: server.pid, port: server.port, dir, url, startedAt: new Date().toISOString(), browserPid: null, browser: null, kiosk: !flag('--no-kiosk') };
  if (!flag('--no-browser')) {
    const prefer = opt('--browser');
    const b = launchBrowser({ url, kiosk: state.kiosk, prefer: prefer === 'chrome' || prefer === 'edge' ? prefer : undefined });
    if (!b) {
      writeFileSync(STATE, JSON.stringify(state, null, 1));
      console.error(`No Chrome or Edge found. The server is up; open ${url} in any browser, full screen (F11).`);
      return 5;
    }
    state.browserPid = b.pid;
    state.browser = b.name;
    say(`Opened ${b.name}${state.kiosk ? ' in kiosk mode (Alt+F4 closes it)' : ''}: ${url}`);
  }
  writeFileSync(STATE, JSON.stringify(state, null, 1));
  return 0;
}

async function reset(opt, flag) {
  const state = readJson(STATE);
  if (!state?.port || !(await health(state.port))) {
    console.error('The kit is not running. Start it first (start-demo.cmd).');
    return 2;
  }
  const what = stopBrowser(state);
  if (what === 'not-ours') say(`note: process ${state.browserPid} is no longer the kit's browser; not touching it.`);
  await sleep(500);
  if (!(await wipeSave())) {
    console.error(`Could not delete the save in ${PROFILE}: a browser process is still holding it. Close the browser window (Alt+F4) and run reset again.`);
    return 3;
  }
  const prefer = opt('--browser') ?? state.browser;
  const b = launchBrowser({ url: state.url, kiosk: !flag('--no-kiosk') && state.kiosk !== false, prefer: prefer === 'chrome' || prefer === 'edge' ? prefer : undefined });
  if (!b) {
    console.error(`No Chrome or Edge found. Open ${state.url} in any browser.`);
    return 5;
  }
  writeFileSync(STATE, JSON.stringify({ ...state, browserPid: b.pid, browser: b.name, resetAt: new Date().toISOString() }, null, 1));
  say(`Fresh visitor: the save and the browser's memory are gone (its caches are kept), ${b.name} is open again at ${state.url}`);
  return 0;
}

async function stop(flag) {
  const state = readJson(STATE);
  const server = readJson(PID_FILE);
  if (!state && !server) {
    say('Nothing to stop: the kit is not running.');
    return 0;
  }
  if (state) {
    const what = stopBrowser(state);
    say(`browser: ${what === 'stopped' ? 'closed' : what === 'gone' ? 'already closed' : 'not the kit\'s any more (left alone)'}`);
  }
  const port = state?.port ?? server?.port;
  if (port) {
    try {
      await fetch(`http://127.0.0.1:${port}/__demo-kit/stop`, { method: 'POST', signal: AbortSignal.timeout(3000) });
    } catch {
      /* not answering: fall through to the PID */
    }
    for (let i = 0; i < 20 && (await health(port)); i++) await sleep(150);
    if (await health(port)) {
      const pid = state?.serverPid ?? server?.pid;
      say(`server: did not stop when asked; stopping process ${pid} by PID`);
      stopPid(pid, 'serve-offline.mjs');
    } else say('server: stopped');
  }
  rmSync(STATE, { force: true });
  rmSync(PID_FILE, { force: true });
  if (flag('--wipe')) {
    await sleep(500);
    say((await wipeProfile()) ? 'browser profile: deleted (the next start is a fresh save)' : `browser profile: could not delete ${PROFILE}`);
  }
  return 0;
}

async function status() {
  const state = readJson(STATE);
  if (!state) {
    say('The kit is not running (no state file).');
    return 0;
  }
  const h = await health(state.port);
  say(`server:  ${h ? `up, ${h.served} files served, ${h.notFound} not found` : 'NOT answering'}  (${state.url})`);
  const cmd = state.browserPid ? commandLineOf(state.browserPid) : null;
  say(`browser: ${state.browserPid ? (cmd?.includes(`--user-data-dir=${PROFILE}`) ? `running (${state.browser}, pid ${state.browserPid})` : 'NOT running') : 'none started'}`);
  say(`site:    ${state.dir}`);
  return h ? 0 : 1;
}

async function main(argv) {
  const [command, ...rest] = argv;
  const opt = (name, fallback = null) => {
    const i = rest.indexOf(name);
    return i >= 0 && rest[i + 1] !== undefined && !rest[i + 1].startsWith('--') ? rest[i + 1] : fallback;
  };
  const flag = (name) => rest.includes(name);
  switch (command) {
    case 'start':
      return start(opt, flag);
    case 'reset':
      return reset(opt, flag);
    case 'stop':
      return stop(flag);
    case 'status':
      return status();
    default:
      console.error('usage: demo-kit.mjs start|reset|stop|status  (docs/DEMO-KIT.md)');
      return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = await main(process.argv.slice(2));
