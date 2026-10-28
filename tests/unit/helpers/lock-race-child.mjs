// One racing taker of the review-browser lock, run as a child process by tests/unit/lock-atomic.test.ts (backlog 60, release 67; tooling, both games).
//
// argv: <mode> <dir> <goAt> <rounds> <tag>
//   mode: 'browser' (tools/measure/lock.mjs, PYREFLY_SCRATCH = dir), 'rigrecord' (tools/rig-record-lock.mjs, file = dir/RIG-RECORD) or 'lane' (tools/rig/lane/lane-lock.mjs, one try)
//   goAt: an epoch ms; every child spins until it, so the takers start in the same millisecond
// Each round: take the lock, then create <dir>/INSIDE exclusively (a second creator is a second holder: that is written as VIOLATION), hold 30 ms, remove it, release. Events go to <dir>/events.log.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [mode, dir, goAt, rounds, tag] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '../../..');
const events = path.join(dir, 'events.log');
const inside = path.join(dir, 'INSIDE');
const note = (s) => fs.appendFileSync(events, `${tag} ${s}\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function critical() {
  try {
    fs.writeFileSync(inside, tag, { flag: 'wx' });
  } catch {
    note('VIOLATION');
    return;
  }
  note('enter');
  await sleep(30);
  fs.rmSync(inside, { force: true });
  note('exit');
}

while (Date.now() < Number(goAt)) { /* spin: all takers start together */ }

if (mode === 'browser') {
  process.env.PYREFLY_SCRATCH = dir;
  const { takeBrowserLock } = await import(pathToFileURL(path.join(root, 'tools/measure/lock.mjs')).href);
  for (let i = 0; i < Number(rounds); i++) {
    const release = await takeBrowserLock({ who: `child ${tag}`, what: `race ${tag} ${i}`, maxMinutes: 1, watchdog: false, log: () => undefined });
    await critical();
    release();
  }
} else if (mode === 'rigrecord') {
  const { takeRigRecord } = await import(pathToFileURL(path.join(root, 'tools/rig-record-lock.mjs')).href);
  for (let i = 0; i < Number(rounds); i++) {
    const release = await takeRigRecord(`child ${tag}`, { file: path.join(dir, 'RIG-RECORD'), pollMs: 10 });
    await critical();
    release();
  }
} else if (mode === 'lane') {
  const { takeLaneLock } = await import(pathToFileURL(path.join(root, 'tools/rig/lane/lane-lock.mjs')).href);
  try {
    takeLaneLock({ lock: path.join(dir, 'RIG-RECORD'), text: JSON.stringify({ pid: process.pid, what: `race ${tag}`, at: new Date().toISOString() }) });
    note('won');
    await sleep(1200); // the winner holds it while the losers look
    fs.rmSync(path.join(dir, 'RIG-RECORD'), { force: true });
  } catch (err) {
    note(`lost ${String(err?.message ?? err).slice(0, 60)}`);
  }
}
