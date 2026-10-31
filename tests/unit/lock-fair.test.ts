/**
 * The fair stale rule of the review-browser lock and its heartbeat (`tools/lock-fair.mjs`; tooling, both games; 2026-10-31).
 * A lock or reservation is stale only when its process is not running, or nobody has written to the file for fifteen minutes; the holder and the waiter refresh the file, and a refresh never touches
 * another lane's record or brings back a file that is gone. Node and temp folders only: no browser.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { STALE_MINUTES, pidAlive, readLockFile, refreshOwn, staleVerdict, startHeartbeat } from '../../tools/lock-fair.mjs';

const MIN = 60000;
const WAIT_CHILD = fileURLToPath(new URL('./helpers/lock-wait-child.mjs', import.meta.url));
const NOW = Date.parse('2026-10-31T12:00:00Z');
const alive = (): boolean => true;
const dead = (): boolean => false;

let dir = '';
let file = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'lock-fair-'));
  file = join(dir, 'RIG-RECORD.next');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('staleVerdict', () => {
  const held = { who: 'a lane', pid: 4242, at: new Date(NOW - 40 * MIN).toISOString(), maxMinutes: 10 };

  it('a live pid in a file written a minute ago is not stale, however old the record\'s own at is', () => {
    expect(staleVerdict({ held, mtimeMs: NOW - MIN, now: NOW, isAlive: alive })).toMatchObject({ stale: false, why: null });
  });

  it('a pid that is not running is stale at once, however fresh the file', () => {
    expect(staleVerdict({ held: { ...held, at: new Date(NOW).toISOString() }, mtimeMs: NOW, now: NOW, isAlive: dead })).toMatchObject({ stale: true, why: 'pid-gone' });
  });

  it('a live pid in a file nobody has written to for more than fifteen minutes is stale; at fifteen it is not yet', () => {
    expect(staleVerdict({ held, mtimeMs: NOW - 15 * MIN - 1, now: NOW, isAlive: alive })).toMatchObject({ stale: true, why: 'no-heartbeat' });
    expect(staleVerdict({ held, mtimeMs: NOW - 15 * MIN, now: NOW, isAlive: alive }).stale).toBe(false);
    expect(STALE_MINUTES).toBe(15);
  });

  it('a holder past its maxMinutes with a live pid is stale only once the heartbeat has been missing for fifteen minutes', () => {
    const past = { ...held, at: new Date(NOW - 12 * MIN).toISOString(), maxMinutes: 10 };
    expect(staleVerdict({ held: past, mtimeMs: NOW - 14 * MIN, now: NOW, isAlive: alive }).stale).toBe(false);
    expect(staleVerdict({ held: past, mtimeMs: NOW - 16 * MIN, now: NOW, isAlive: alive }).stale).toBe(true);
  });

  it('an unreadable record, or one with no process id, is judged by the file\'s age alone (a holder mid-write)', () => {
    expect(staleVerdict({ held: null, mtimeMs: NOW - 2 * MIN, now: NOW, isAlive: dead }).stale).toBe(false);
    expect(staleVerdict({ held: null, mtimeMs: NOW - 20 * MIN, now: NOW, isAlive: dead })).toMatchObject({ stale: true, why: 'no-heartbeat' });
    expect(staleVerdict({ held: { who: 'no pid' }, mtimeMs: NOW - 2 * MIN, now: NOW, isAlive: dead }).stale).toBe(false);
  });

  it('the stale line is a parameter, and a file from the future (a clock step) is not idle', () => {
    expect(staleVerdict({ held, mtimeMs: NOW - 3 * MIN, now: NOW, staleMs: 2 * MIN, isAlive: alive }).stale).toBe(true);
    expect(staleVerdict({ held, mtimeMs: NOW + 5 * MIN, now: NOW, isAlive: alive })).toMatchObject({ stale: false, idleMs: 0 });
  });
});

describe('pidAlive', () => {
  it('knows this process, and does not take a pid that is not a process for one', () => {
    expect(pidAlive(process.pid)).toBe(true);
    expect(pidAlive(2147483000)).toBe(false);
    expect(pidAlive(0)).toBe(false);
    expect(pidAlive(-1)).toBe(false);
    expect(pidAlive(undefined)).toBe(false);
    expect(pidAlive('12')).toBe(false);
  });
});

describe('readLockFile', () => {
  it('gives the record and the mtime; null for no file; a null record for text that is not a record', () => {
    expect(readLockFile(file)).toBeNull();
    writeFileSync(file, JSON.stringify({ who: 'a', pid: 1 }));
    expect(readLockFile(file)?.held).toEqual({ who: 'a', pid: 1 });
    expect(readLockFile(file)?.mtimeMs).toBeGreaterThan(Date.now() - 5000);
    for (const text of ['', 'half {', '5', '"x"', '[1]', 'null']) {
      writeFileSync(file, text);
      expect(readLockFile(file)?.held).toBeNull();
    }
  });
});

describe('refreshOwn', () => {
  const mine = { who: 'lane a', pid: process.pid, at: '2026-10-31T09:18:00.000Z', maxMinutes: 10 };

  it('rewrites the record with a fresh at, keeps the four old fields and adds since (the first at); nothing else is left in the folder', () => {
    writeFileSync(file, JSON.stringify(mine));
    const old = new Date(Date.now() - 20 * MIN);
    utimesSync(file, old, old);
    expect(refreshOwn(file, mine)).toBe(true);
    const now = JSON.parse(readFileSync(file, 'utf8'));
    expect(now).toMatchObject({ who: 'lane a', pid: process.pid, maxMinutes: 10, since: mine.at });
    expect(Date.parse(now.at)).toBeGreaterThan(Date.now() - 5000);
    expect(statSync(file).mtimeMs).toBeGreaterThan(Date.now() - 5000);
    expect(readdirSync(dir)).toEqual(['RIG-RECORD.next']);
    expect(refreshOwn(file, { ...mine, since: mine.at })).toBe(true); // a second beat keeps the first since
    expect(JSON.parse(readFileSync(file, 'utf8')).since).toBe(mine.at);
  });

  it('never touches another lane\'s record (the file was taken over since), and never brings back a file that is gone', () => {
    const theirs = { who: 'lane b', pid: process.pid + 1, at: '2026-10-31T10:00:00.000Z', maxMinutes: 10 };
    writeFileSync(file, JSON.stringify(theirs));
    expect(refreshOwn(file, mine)).toBe(false);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(theirs);
    rmSync(file);
    expect(refreshOwn(file, mine)).toBe(false);
    expect(readdirSync(dir)).toEqual([]);
  });

  it('backs off while a taker holds the takeover mutex', () => {
    writeFileSync(file, JSON.stringify(mine));
    writeFileSync(`${file}.takeover`, '1');
    expect(refreshOwn(file, mine)).toBe(false);
    expect(JSON.parse(readFileSync(file, 'utf8')).at).toBe(mine.at);
  });
});

describe('startHeartbeat', () => {
  const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
  const mine = { who: 'lane a', pid: process.pid, at: '2026-10-31T09:18:00.000Z', maxMinutes: 10 };

  it('beats until stopped, and stops beating when asked', async () => {
    writeFileSync(file, JSON.stringify(mine));
    const stop = startHeartbeat(file, mine, { everyMs: 30 });
    await wait(200);
    const a = JSON.parse(readFileSync(file, 'utf8')).at;
    expect(Date.parse(a)).toBeGreaterThan(Date.parse(mine.at));
    stop();
    await wait(60);
    const b = JSON.parse(readFileSync(file, 'utf8')).at;
    await wait(150);
    expect(JSON.parse(readFileSync(file, 'utf8')).at).toBe(b);
  });

  it('stops by itself after forMs (a holder that has outlived its own promise is not kept alive)', async () => {
    writeFileSync(file, JSON.stringify(mine));
    startHeartbeat(file, mine, { everyMs: 30, forMs: 120 });
    await wait(450);
    const a = JSON.parse(readFileSync(file, 'utf8')).at;
    await wait(200);
    expect(JSON.parse(readFileSync(file, 'utf8')).at).toBe(a);
  });

  it('survives a beat that cannot be made (the folder is gone) and does not throw', async () => {
    writeFileSync(file, JSON.stringify(mine));
    const stop = startHeartbeat(file, mine, { everyMs: 20 });
    rmSync(dir, { recursive: true, force: true });
    await wait(100);
    stop();
  });
});

describe('tools/measure/lock.mjs: its waiter keeps its reservation young too', () => {
  it('a waiter in the line of the measuring tools rewrites its reservation (a newer at, the first kept as since) while it waits, so reservedBy never reads it as stale', async () => {
    const holder = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore', windowsHide: true });
    try {
      writeFileSync(join(dir, 'RIG-RECORD'), JSON.stringify({ who: 'busy lane', pid: holder.pid, what: 'a job', at: new Date().toISOString(), maxMinutes: 10 }));
      const child = spawn(process.execPath, [WAIT_CHILD, '1800'], { stdio: 'ignore', windowsHide: true, env: { ...process.env, PYREFLY_SCRATCH: dir, PYREFLY_LOCK_BEAT_MS: '60' } });
      const exited = new Promise<number | null>((resolve) => child.on('exit', resolve));
      await new Promise((r) => setTimeout(r, 1100));
      const next = JSON.parse(readFileSync(join(dir, 'RIG-RECORD.next'), 'utf8'));
      expect(next).toMatchObject({ who: 'wait child', pid: child.pid, maxMinutes: 1 });
      expect(typeof next.since).toBe('string'); // only a beat writes it
      expect(Date.parse(next.at)).toBeGreaterThan(Date.parse(next.since));
      expect(await exited).toBe(7);
    } finally {
      holder.kill();
    }
  });
});
