/**
 * waitslot.mjs <log file> -- <args of record.mjs ...> : a POLITE queue waiter for the shared RIG-RECORD slot (the conference-demo motion program, 2026-10-22).
 *
 * `tools/rig/lane/record.mjs` takes `D:/Tools/pyrefly-scratch/RIG-RECORD` itself and refuses when someone holds it. The nightly rules of the demo week add three things a recording job owes the others:
 * it waits while the lock is held (a lock is stale only when its pid is gone, or its `at` is more than maxMinutes + 15 minutes old); it never jumps a reservation (`RIG-RECORD.next` names whoever is next: the demo art
 * retouch has priority); and it leaves 90 seconds between two of its own holds. When all three are clear it writes the lock as `{who: 'rig pilots', pid, at, maxMinutes}` and runs record.mjs as a child that inherits the claim
 * (record.mjs accepts a lock held by its parent); the lock is removed when the child exits. A recording that runs past `maxMinutes` (default 10) is stopped BY PID with its Vite child.
 * Also waits while D:/Tools/pyrefly-scratch/REVIEW-BROWSER exists (record.mjs would refuse). Never kills by image name.
 */
import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

const DIR = 'D:/Tools/pyrefly-scratch';
const LOCK = `${DIR}/RIG-RECORD`;
const NEXT = `${DIR}/RIG-RECORD.next`;
const GAP = `${DIR}/RIG-RECORD.pilots-last`;
const REVIEW = `${DIR}/REVIEW-BROWSER`;
const argv = process.argv.slice(2);
const logFile = argv[0];
const sep = argv.indexOf('--');
const rec = argv.slice(sep + 1);
const maxMinutes = Number(process.env.PILOTS_MAX_MINUTES ?? 10);
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const say = (...x) => console.log(new Date().toISOString(), ...x);

function blocked() {
  if (fs.existsSync(REVIEW)) return 'REVIEW-BROWSER exists';
  const holder = read(LOCK);
  if (fs.existsSync(LOCK)) {
    const ageMin = holder?.at ? (Date.now() - Date.parse(holder.at)) / 60000 : 0;
    const stale = !holder || !Number.isInteger(holder.pid) || !alive(holder.pid) || ageMin > (holder.maxMinutes ?? 10) + 15;
    if (!stale) return `held by ${holder.what ?? holder.who ?? '?'} (pid ${holder.pid})`;
  }
  const next = read(NEXT);
  if (fs.existsSync(NEXT) && !(next?.who === 'rig pilots' && next.pid === process.pid)) {
    const ageMin = next?.at ? (Date.now() - Date.parse(next.at)) / 60000 : 0;
    if (!(next?.pid && !alive(next.pid)) && ageMin < (next?.maxMinutes ?? 10) + 15) return `reserved for ${next?.who ?? '?'}`;
  }
  const last = read(GAP);
  if (last?.at && Date.now() - Date.parse(last.at) < 90000) return 'the 90 second gap after our last hold';
  return null;
}

const waitStart = Date.parse(process.env.WAIT_SINCE ?? '') || Date.now(); // when we began waiting (written into our own reservation); another lane's reservation is never taken from it
let why = null;
let lastWhy = '';
for (;;) {
  why = blocked();
  if (!why) break;
  // the queue: when nobody has reserved the next slot, reserve it (the others do the same, and the file names who is next). A reservation that is there stays with its owner.
  if (!fs.existsSync(NEXT) && fs.existsSync(LOCK)) { try { fs.writeFileSync(NEXT, JSON.stringify({ who: 'rig pilots', pid: process.pid, at: new Date(waitStart).toISOString(), maxMinutes }), { flag: 'wx' }); say('reserved the next slot'); } catch { /* someone else was first */ } }
  if (why !== lastWhy) { say('waiting:', why); lastWhy = why; }
  await sleep(8000);
}
{ const nx = read(NEXT); if (nx?.who === 'rig pilots' && nx.pid === process.pid) fs.rmSync(NEXT, { force: true }); }
fs.rmSync(LOCK, { force: true });
fs.writeFileSync(LOCK, JSON.stringify({ who: 'rig pilots', pid: process.pid, what: `rig pilots: ${rec.slice(0, 6).join(' ')}`, at: new Date().toISOString(), maxMinutes }), { flag: 'w' });
say('claimed the slot for', maxMinutes, 'minutes');
const out = fs.openSync(logFile, 'w');
const child = spawn(process.execPath, ['tools/rig/lane/record.mjs', ...rec], { cwd: process.cwd(), stdio: ['ignore', out, out], env: { ...process.env, PYREFLY_BROWSER: process.env.PYREFLY_BROWSER ?? 'gpu' }, windowsHide: true });
const timer = setTimeout(() => { say('over the hold: stopping the recorder by PID', child.pid); spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); }, maxMinutes * 60000);
child.on('exit', (code) => {
  clearTimeout(timer);
  try { const h = read(LOCK); if (h?.pid === process.pid) fs.rmSync(LOCK, { force: true }); } catch { /* gone */ }
  fs.writeFileSync(GAP, JSON.stringify({ at: new Date().toISOString() }));
  say('record.mjs exit', code);
  process.exit(code ?? 1);
});
