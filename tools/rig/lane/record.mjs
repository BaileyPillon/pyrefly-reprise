/**
 * **The recorder** (the lane kit; the rig program, 2026-10-18): one command that does what `record.sh` and the six per-subject play scripts did for Kimahri and for Lulu, for any subject.
 *
 *   PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject lulu --out <dir> [--modes poses,cast,hurtko] [--poses a,b] [--off] [--rigs-dir D:/pyrefly-art-rigs] [--alias lulu=lulu-v2]
 *                                                    [--repo <tree>] [--port N] [--tail 150] [--cap 40000] [--no-warm] [--wait] [--still [--settle 1800]]
 *
 * What it does, in order, and why each step is there:
 *   1. refuses while `D:/Tools/pyrefly-scratch/REVIEW-BROWSER` exists (no Vite, no browser at all; `--wait` polls instead) and while another recording holds `RIG-RECORD` (one recording at a time:
 *      headless Chromium on the real GPU is shared with ComfyUI and the review browsers). A lock whose pid is gone is taken over.
 *   2. picks a free port, writes the scratch Vite config beside `vite.config.ts` (the repo's config plus `tools/vite-rig-art.mjs`, a private cache dir; `--alias subject=folder` serves a fixture
 *      or a candidate rig folder AS the subject's) and starts Vite. The server's PID is the child's own: it is stopped BY PID, on a normal end, on an error and on a signal.
 *   3. warms the server with one long-timeout page load (the first load compiles everything and used to hit the recorder's 30 s timeout) and then runs `play.mjs` for each mode, retrying a mode
 *      once when it left no result file (`expectedOutputs`). `--off` also records the painting set (`--rig off`) into `<out>/<mode>-off/` (for poses, cast, fight and ko), the other half of a clip beside its painting.
 *   4. stops Vite by PID, removes the scratch config and the lock.
 * Output: `<out>/<mode>/` (and `<mode>-off/`); `poses-info.json`, `window-log.json`, `jerks.json`, `tracks.json`, `console.json` and the frames (see `play-modes.mjs`).
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUARD_DIR, MODES, expectedOutputs, guards, parseArgs, resolvePoses, subjectSpec, viteConfigText } from './lane-pure.mjs';
import { takeLaneLock } from './lane-lock.mjs';
import { openGame, sleep } from './play-common.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const a = parseArgs(process.argv.slice(2));
const log = (...x) => console.log('[record]', ...x);
const LOCK = `${GUARD_DIR}/RIG-RECORD`;

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const killTree = (pid) => { if (pid) spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); }; // by PID, never by image name

async function freePort(from = 5880) {
  for (let p = from; p < from + 200; p++) {
    const ok = await new Promise((res) => { const s = net.createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true))).listen(p, '127.0.0.1'); });
    if (ok) return p;
  }
  throw new Error('no free port');
}

let parentLockText = null; // the hand-over lock of a queue waiter that is this process's parent: put back at the end (several recordings under one hold)
function takeLock() {
<<<<<<< HEAD
  // atomic since release 67 (backlog 60, lane-lock.mjs): an exclusive create, or one rename over a stale or hand-over lock; a lock held by THIS process's parent is a queue's hand-over (a waiter that claimed the free slot, then started the recorder)
  takeLaneLock({ lock: LOCK, text: JSON.stringify({ pid: process.pid, what: `${a.subject} ${a.modes ?? 'poses'}`, at: new Date().toISOString() }), isAlive: alive });
=======
  const st = lockStatus(fs.existsSync(LOCK) ? fs.readFileSync(LOCK, 'utf8') : null, alive);
  if (st.state === 'held' && st.by.pid !== process.ppid) throw new Error(`lane: another recording holds ${LOCK} (pid ${st.by.pid}, ${st.by.what ?? '?'}): one recording at a time`); // a lock held by THIS process's parent is a queue's hand-over (a waiter that claimed the free slot, then started the recorder)
  if (st.state === 'held' && st.by.pid === process.ppid) parentLockText = fs.readFileSync(LOCK, 'utf8');
  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  fs.writeFileSync(LOCK, JSON.stringify({ pid: process.pid, what: `${a.subject} ${a.modes ?? 'poses'}`, at: new Date().toISOString() }));
>>>>>>> origin/motion-rigs
}

async function waitHttp(url, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { const r = await fetch(url); if (r.ok || r.status < 500) return true; } catch { /* not up yet */ } await sleep(1000); }
  return false;
}

async function main() {
  const repo = path.resolve(a.repo ?? process.cwd()).replace(/\\/g, '/');
  const registry = JSON.parse(fs.readFileSync(a.registry ?? path.join(here, 'lane-subjects.json'), 'utf8'));
  const spec = subjectSpec(registry, a.subject);
  if (!a.out) throw new Error('lane: --out <dir> is required');
  const modeList = String(a.modes ?? 'poses').split(',').filter(Boolean);
  const bad = modeList.filter((m) => !MODES.includes(m));
  if (bad.length) throw new Error(`lane: unknown mode ${bad.join(', ')} (${MODES.join(', ')})`);
  resolvePoses(spec, a.poses, { any: a['any-pose'] === true });
  for (;;) { // REVIEW-BROWSER: a review is using the browser
    const g = guards(fs.existsSync);
    if (!g.includes('REVIEW-BROWSER')) break;
    if (a.wait !== true) { log('REVIEW-BROWSER exists: no Vite, no browser (--wait polls)'); process.exitCode = 3; return; }
    log('REVIEW-BROWSER exists: waiting 60 s');
    await sleep(60000);
  }
  takeLock();
  const port = Number(a.port ?? (await freePort()));
  const cfgFile = path.join(repo, 'tools', `zz-rig-lane-${port}.tmp.config.mjs`);
  const aliases = Object.fromEntries(String(a.alias ?? '').split(',').filter(Boolean).map((s) => s.split('=')));
  const tmp = process.env.TEMP ?? 'D:/Tools/pyrefly-scratch/tmp-rig-lane';
  fs.writeFileSync(cfgFile, viteConfigText({ cacheDir: path.join(tmp, `vite-cache-lane-${port}`).replace(/\\/g, '/'), rigsDir: a['rigs-dir'] ?? 'D:/pyrefly-art-rigs', aliases }));
  const out = path.resolve(a.out);
  fs.mkdirSync(out, { recursive: true });
  const vlog = fs.openSync(path.join(out, 'vite.log'), 'w');
  const vite = spawn(process.execPath, [path.join(repo, 'node_modules/vite/bin/vite.js'), '--config', cfgFile, '--port', String(port)], { cwd: repo, stdio: ['ignore', vlog, vlog], windowsHide: true });
  const pid = vite.pid;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    killTree(pid);
    for (const f of [cfgFile, LOCK]) { try { if (f !== LOCK || JSON.parse(fs.readFileSync(LOCK, 'utf8')).pid === process.pid) { if (f === LOCK && parentLockText) fs.writeFileSync(LOCK, parentLockText); else fs.rmSync(f, { force: true }); } } catch { /* gone */ } }
    log(`vite (pid ${pid}) stopped`);
  };
  process.on('exit', stop);
  for (const s of ['SIGINT', 'SIGTERM', 'SIGBREAK']) process.on(s, () => { stop(); process.exit(130); });
  try {
    log(`vite pid ${pid} on :${port} (${repo})`);
    if (!(await waitHttp(`http://127.0.0.1:${port}/`, 180000))) throw new Error(`vite did not answer on :${port}: see ${path.join(out, 'vite.log')}`);
    const base = `http://127.0.0.1:${port}/`;
    process.env.PYREFLY_BROWSER ??= 'gpu';
    if (a['no-warm'] !== true) {
      try { const g = await openGame({ repo, base, rig: 'on', log, loadTimeout: 240000 }); await g.browser.close(); } catch (e) { log('warm-up failed (continuing):', String(e).slice(0, 200)); }
    }
    let failed = 0;
    const offOk = (m) => a.off === true && ['poses', 'cast', 'fight', 'ko', 'motion', 'hurtko'].includes(m);
    const runs = modeList.flatMap((m) => (a['only-off'] === true ? [{ mode: m, rig: 'off', dir: `${m}-off` }] : [{ mode: m, rig: 'on', dir: m }, ...(offOk(m) ? [{ mode: m, rig: 'off', dir: `${m}-off` }] : [])]));
    for (const r of runs) {
      const dir = path.join(out, r.dir);
      let done = false;
      for (let attempt = 1; attempt <= 2 && !done; attempt++) {
        const args = [path.join(here, 'play.mjs'), '--subject', a.subject, '--mode', r.mode, '--base', base, '--out', dir, '--rig', r.rig, '--repo', repo, '--tail', String(a.tail ?? 150), '--cap', String(a.cap ?? 40000)];
        if (a.poses) args.push('--poses', String(a.poses));
        if (a['any-pose']) args.push('--any-pose');
        if (a.still === true) args.push('--still', '--settle', String(a.settle ?? 1800));
        if (a['keep-sway'] === true) args.push('--keep-sway');
        if (a.registry) args.push('--registry', String(a.registry));
        fs.mkdirSync(dir, { recursive: true });
        const logFd = fs.openSync(path.join(dir, 'play.log'), 'w');
        const status = await new Promise((res) => { const c = spawn(process.execPath, args, { cwd: repo, stdio: ['ignore', logFd, logFd], env: process.env, windowsHide: true }); c.on('exit', (code) => res(code)); c.on('error', () => res(1)); }); // async, so a signal still reaches the handlers that stop Vite
        fs.closeSync(logFd);
        done = status === 0 && expectedOutputs(r.mode).every((f) => fs.existsSync(path.join(dir, f)));
        log(`${r.dir}: attempt ${attempt} ${done ? 'done' : `failed (see ${path.join(dir, 'play.log')})`}`);
      }
      if (!done) failed++;
    }
    process.exitCode = failed ? 1 : 0;
  } finally {
    stop();
  }
}

main().catch((e) => { console.error('FAILED', e && e.message ? e.message : e); process.exitCode = 1; });
