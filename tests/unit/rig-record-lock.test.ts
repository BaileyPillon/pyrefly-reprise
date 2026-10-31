/**
 * The review-browser lock the fight-start timeline takes (`tools/rig-record-lock.mjs`; post-conference lane "post-fight-start", tooling only; both games).
 * A temp file stands in for `D:/Tools/pyrefly-scratch/RIG-RECORD`.
 *
 * The stale rule (2026-10-31, `tools/lock-fair.mjs`): a lock or reservation is stale only when its process is not running, or nobody has written to the file for fifteen minutes by its mtime; the
 * holder and the waiter refresh their file while they hold or wait. "Another lane" in these tests is a real sleeping child process (a live pid) or a pid that no process has.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { takeRigRecord } from '../../tools/rig-record-lock.mjs';

const DEAD_PID = 2147483000;
let sleeper: ChildProcess;
let livePid = 0;
beforeAll(() => {
  sleeper = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 600000)'], { stdio: 'ignore', windowsHide: true });
  livePid = sleeper.pid ?? 0;
});
afterAll(() => {
  sleeper.kill();
});

let dir = '';
let file = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-record-'));
  file = join(dir, 'RIG-RECORD');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** A record as an older copy of the tool wrote it ({who, pid, at, maxMinutes}); `pid` is a live process unless said otherwise. */
const record = (over: Record<string, unknown> = {}): string => JSON.stringify({ who: 'other lane', pid: livePid, at: new Date().toISOString(), maxMinutes: 10, ...over });
/** Write `text` and make the file `minutes` old by its mtime (the only age the stale rule reads). */
const writeAged = (f: string, text: string, minutes: number): void => {
  writeFileSync(f, text);
  const t = new Date(Date.now() - minutes * 60000);
  utimesSync(f, t, t);
};
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('takeRigRecord', () => {
  it('creates the lock with who, pid, at and maxMinutes, and the release removes it', async () => {
    const release = await takeRigRecord('lane a', { file });
    const held = JSON.parse(readFileSync(file, 'utf8'));
    expect(held).toMatchObject({ who: 'lane a', pid: process.pid, maxMinutes: 10 });
    expect(Number.isFinite(Date.parse(held.at))).toBe(true);
    release();
    expect(existsSync(file)).toBe(false);
  });

  it('waits while a fresh lock of another lane exists and takes over when it goes', async () => {
    writeFileSync(file, record());
    const taking = takeRigRecord('lane b', { file, pollMs: 20 });
    let done = false;
    void taking.then(() => (done = true));
    await new Promise((r) => setTimeout(r, 120));
    expect(done).toBe(false);
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('other lane');
    rmSync(file);
    const freed = Date.now();
    const release = await taking;
    const taken = JSON.parse(readFileSync(file, 'utf8'));
    expect(taken.who).toBe('lane b');
    expect(Date.parse(taken.at)).toBeGreaterThanOrEqual(freed - 5); // stamped when taken, not when the wait began: another lane must not read a lock held for a few minutes as old
    release();
  });

  it('removes a lock nobody has written to for longer than the stale limit, and says so', async () => {
    writeAged(file, record({ who: 'gone lane' }), 20);
    const said: string[] = [];
    const release = await takeRigRecord('lane c', { file, pollMs: 20, log: (m: string) => said.push(m) });
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane c');
    expect(said.some((m) => m.includes('gone lane') && m.includes('removing'))).toBe(true);
    release();
  });

  it('reads an unreadable lock as a holder still writing it: its age is the file\'s, so a fresh one is waited for, not removed', async () => {
    writeFileSync(file, ''); // created, not yet written
    const taking = takeRigRecord('lane d', { file, pollMs: 20 });
    let done = false;
    void taking.then(() => (done = true));
    await new Promise((r) => setTimeout(r, 120));
    expect(done).toBe(false);
    expect(readFileSync(file, 'utf8')).toBe('');
    const old = new Date(Date.now() - 20 * 60000);
    utimesSync(file, old, old); // now it is old, and nobody is writing it
    const release = await taking;
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane d');
    release();
  });

  it('a release never removes a lock that has become another process\'s', async () => {
    const release = await takeRigRecord('lane e', { file });
    writeFileSync(file, JSON.stringify({ who: 'lane f', pid: process.pid + 1, at: new Date().toISOString(), maxMinutes: 10 }));
    release();
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane f');
  });

  it('keeps the line: it reserves RIG-RECORD.next while it waits, and gives the reservation up when the lock is its own', async () => {
    writeFileSync(file, record());
    const taking = takeRigRecord('lane h', { file, pollMs: 20 });
    await new Promise((r) => setTimeout(r, 80));
    expect(JSON.parse(readFileSync(`${file}.next`, 'utf8')).who).toBe('lane h');
    rmSync(file);
    const release = await taking;
    expect(existsSync(`${file}.next`)).toBe(false);
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane h');
    release();
  });

  it('does not take a free lock while another lane holds the reservation', async () => {
    writeFileSync(`${file}.next`, record({ who: 'lane in line' }));
    const taking = takeRigRecord('lane i', { file, pollMs: 20 });
    let done = false;
    void taking.then(() => (done = true));
    await new Promise((r) => setTimeout(r, 120));
    expect(done).toBe(false);
    expect(existsSync(file)).toBe(false);
    rmSync(`${file}.next`); // the lane in line has taken its turn and gone
    const release = await taking;
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane i');
    release();
  });

  it('removes a reservation nobody has kept for longer than the stale limit', async () => {
    writeAged(`${file}.next`, record({ who: 'gone waiter' }), 20);
    const said: string[] = [];
    const release = await takeRigRecord('lane j', { file, pollMs: 20, log: (m: string) => said.push(m) });
    expect(said.some((m) => m.includes('gone waiter') && m.includes('removing'))).toBe(true);
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane j');
    release();
  });

  it('removes a reservation whose process is gone at once, whichever lane made it (ownPrefix is accepted and changes nothing)', async () => {
    writeFileSync(`${file}.next`, record({ who: 'post-fight-start timeline 6 job(s)', pid: DEAD_PID }));
    const said: string[] = [];
    const release = await takeRigRecord('post-fight-start timeline 2 job(s)', { file, pollMs: 20, ownPrefix: 'post-fight-start', log: (m: string) => said.push(m) });
    expect(said.some((m) => m.includes('timeline 6 job(s)') && m.includes('is not running') && m.includes('removing'))).toBe(true);
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toContain('2 job(s)');
    release();
    writeFileSync(`${file}.next`, record({ who: 'other lane', pid: DEAD_PID }));
    const taking = takeRigRecord('post-fight-start x', { file, pollMs: 20 }); // no prefix: the rule is the same
    (await taking)();
  });

  it('takes nothing for file: null', async () => {
    const release = await takeRigRecord('lane g', { file: null });
    expect(existsSync(file)).toBe(false);
    release();
  });
});

describe('the fair stale rule: a live lane is never displaced, a dead one is replaced at once', () => {
  it('a LIVE waiter whose reservation is older than fifteen minutes (it keeps the file fresh) is NOT replaced', async () => {
    writeFileSync(`${file}.next`, record({ who: 'patient lane', at: new Date(Date.now() - 20 * 60000).toISOString() })); // entered 20 minutes ago, file written just now: its heartbeat
    const taking = takeRigRecord('lane k', { file, pollMs: 20 });
    let done = false;
    void taking.then(() => (done = true));
    await wait(200);
    expect(done).toBe(false);
    expect(existsSync(file)).toBe(false);
    expect(JSON.parse(readFileSync(`${file}.next`, 'utf8')).who).toBe('patient lane');
    rmSync(`${file}.next`); // the patient lane has taken its turn and gone
    const release = await taking;
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane k');
    release();
  });

  it('a LIVE holder whose lock says it began long ago but is still being written is waited for', async () => {
    writeFileSync(file, record({ who: 'long holder', at: new Date(Date.now() - 40 * 60000).toISOString(), maxMinutes: 10 }));
    let done = false;
    const taking = takeRigRecord('lane l', { file, pollMs: 20 }).then((r: () => void) => {
      done = true;
      return r;
    });
    await wait(200);
    expect(done).toBe(false);
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('long holder');
    rmSync(file);
    (await taking)();
  });

  it('a lock whose process is gone is replaced at once, however fresh it is', async () => {
    writeFileSync(file, record({ who: 'dead holder', pid: DEAD_PID }));
    const said: string[] = [];
    const release = await takeRigRecord('lane m', { file, pollMs: 20, log: (m: string) => said.push(m) });
    expect(said.some((m) => m.includes('dead holder') && m.includes('is not running'))).toBe(true);
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane m');
    release();
  });

  it('a holder past its maxMinutes with a live pid but no write for fifteen minutes IS replaced; one written 14 minutes ago is not', async () => {
    writeAged(file, record({ who: 'hung holder', at: new Date(Date.now() - 12 * 60000).toISOString(), maxMinutes: 10 }), 16);
    const release = await takeRigRecord('lane n', { file, pollMs: 20 });
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane n');
    release();
    writeAged(file, record({ who: 'quiet holder', at: new Date(Date.now() - 12 * 60000).toISOString(), maxMinutes: 10 }), 14);
    let done = false;
    const taking = takeRigRecord('lane o', { file, pollMs: 20 }).then((r: () => void) => {
      done = true;
      return r;
    });
    await wait(200);
    expect(done).toBe(false);
    rmSync(file);
    (await taking)();
  });

  it('reads the files older copies wrote ({who, pid, at, maxMinutes} only, never refreshed) by the same two rules', async () => {
    const old = { who: 'old copy', pid: livePid, at: new Date(Date.now() - 5 * 60000).toISOString(), maxMinutes: 10 };
    writeAged(`${file}.next`, JSON.stringify(old), 5);
    writeAged(file, JSON.stringify(old), 5);
    let done = false;
    const taking = takeRigRecord('lane p', { file, pollMs: 20 }).then((r: () => void) => {
      done = true;
      return r;
    });
    await wait(200);
    expect(done).toBe(false); // alive and written five minutes ago: honoured
    const twenty = new Date(Date.now() - 20 * 60000);
    utimesSync(`${file}.next`, twenty, twenty);
    utimesSync(file, twenty, twenty);
    const release = await taking; // untouched for twenty minutes: stale, both
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane p');
    release();
  });

  it('a waiter keeps its reservation fresh while it waits: the file is rewritten with a newer at (the first one kept as since) and a newer mtime', async () => {
    writeFileSync(file, record());
    const taking = takeRigRecord('lane q', { file, pollMs: 20, heartbeatMs: 40 });
    await wait(120);
    const first = JSON.parse(readFileSync(`${file}.next`, 'utf8'));
    const firstMtime = statSync(`${file}.next`).mtimeMs;
    await wait(300);
    const later = JSON.parse(readFileSync(`${file}.next`, 'utf8'));
    expect(later).toMatchObject({ who: 'lane q', pid: process.pid, maxMinutes: 10 });
    expect(Date.parse(later.at)).toBeGreaterThan(Date.parse(first.at));
    expect(later.since).toBe(first.since);
    expect(statSync(`${file}.next`).mtimeMs).toBeGreaterThan(firstMtime);
    rmSync(file);
    (await taking)();
    expect(existsSync(`${file}.next`)).toBe(false);
  });

  it('a holder keeps its lock fresh for its own maxMinutes, then stops; the release stops the beat and removes the lock', async () => {
    const release = await takeRigRecord('lane r', { file, pollMs: 20, heartbeatMs: 40, maxMinutes: 0.01 }); // 0.6 s
    const first = JSON.parse(readFileSync(file, 'utf8'));
    await wait(250);
    const mid = JSON.parse(readFileSync(file, 'utf8'));
    expect(Date.parse(mid.at)).toBeGreaterThan(Date.parse(first.at));
    expect(mid.since).toBe(first.at);
    await wait(900); // past the promise: the beats have stopped
    const a = JSON.parse(readFileSync(file, 'utf8')).at;
    await wait(300);
    expect(JSON.parse(readFileSync(file, 'utf8')).at).toBe(a);
    release();
    expect(existsSync(file)).toBe(false);
  });
});
