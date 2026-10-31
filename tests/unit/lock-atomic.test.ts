/**
 * The review-browser lock is taken atomically (backlog 60, release 67; tooling, both games). On 2026-10-27 two browser jobs took RIG-RECORD in the same second: the takers checked the file and then overwrote it.
 * Now the file is created with an exclusive open and a stale one is replaced by one atomic rename under a takeover mutex that asks again (`tools/lock-atomic.mjs`).
 *
 * Pinned here: the two primitives; the three writers of the lock (`tools/measure/lock.mjs`, `tools/rig-record-lock.mjs`, `tools/rig/lane/lane-lock.mjs`) each with TWO OR MORE REAL PROCESSES taking it in the same
 * millisecond (a barrier), over a free lock and over a stale one, with a second holder detected by an exclusive marker; and that a live lane's lock is still waited for (the stale rule itself is the fair one of `tools/lock-fair.mjs` since 2026-10-31; its tests are `lock-fair.test.ts` and `rig-record-lock.test.ts`).
 * No browser, no Vite: node child processes and temp folders only.
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TAKEOVER_STALE_MS, createExclusive, replaceIfStale, unreadableAge } from '../../tools/lock-atomic.mjs';
import { takeLaneLock } from '../../tools/rig/lane/lane-lock.mjs';

const run = promisify(execFile);
const CHILD = fileURLToPath(new URL('./helpers/lock-race-child.mjs', import.meta.url));

let dir = '';
let file = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'lock-atomic-'));
  file = join(dir, 'RIG-RECORD');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const rec = (over: Record<string, unknown> = {}): string => JSON.stringify({ who: 'a lane', pid: 2147483000, at: new Date().toISOString(), maxMinutes: 10, ...over });
const stale = (): string => rec({ who: 'gone lane', at: new Date(Date.now() - 20 * 60000).toISOString() });
const read = (f = file): { who?: string; pid?: number; at?: string } => JSON.parse(readFileSync(f, 'utf8'));

describe('createExclusive', () => {
  it('creates the file once: the second taker sees it exists and writes nothing', () => {
    expect(createExclusive(file, 'first')).toBe(true);
    expect(createExclusive(file, 'second')).toBe(false);
    expect(readFileSync(file, 'utf8')).toBe('first');
  });

  it('of twenty takers of one free file exactly one gets it, and the file is that one\'s text', () => {
    const won = Array.from({ length: 20 }, (_, i) => createExclusive(file, `taker ${i}`)).map((ok, i) => (ok ? i : -1)).filter((i) => i >= 0);
    expect(won).toHaveLength(1);
    expect(readFileSync(file, 'utf8')).toBe(`taker ${won[0]}`);
  });

  it('lets an error other than "it exists" through (a folder that is not there)', () => {
    expect(() => createExclusive(join(dir, 'no', 'such', 'folder', 'RIG-RECORD'), 'x')).toThrow();
  });
});

describe('replaceIfStale', () => {
  it('replaces a stale lock in one rename: the file holds the new record, no temp file or mutex is left behind', () => {
    writeFileSync(file, stale());
    expect(replaceIfStale(file, rec({ who: 'taker' }), () => true)).toBe(true);
    expect(read().who).toBe('taker');
    expect(existsSync(`${file}.takeover`)).toBe(false);
    expect(readdirSync(dir)).toEqual(['RIG-RECORD']);
  });

  it('leaves a lock that is not stale (when asked again inside the mutex) alone', () => {
    writeFileSync(file, rec({ who: 'live lane' }));
    expect(replaceIfStale(file, rec({ who: 'taker' }), () => false)).toBe(false);
    expect(read().who).toBe('live lane');
    expect(existsSync(`${file}.takeover`)).toBe(false);
  });

  it('two takers that both judged the same lock stale: the first replaces it, the second asks again, finds the first one\'s fresh lock and backs off', () => {
    writeFileSync(file, stale());
    const isStale = (): boolean => Date.now() - Date.parse(read().at ?? '') > 15 * 60000; // asked inside the mutex, from the file itself
    expect(isStale()).toBe(true); // both saw this
    expect(replaceIfStale(file, rec({ who: 'first taker' }), isStale)).toBe(true);
    expect(replaceIfStale(file, rec({ who: 'second taker' }), isStale)).toBe(false);
    expect(read().who).toBe('first taker');
  });

  it('backs off while another taker holds the takeover mutex, and removes a mutex a dead taker left behind (older than ten seconds)', () => {
    writeFileSync(file, stale());
    writeFileSync(`${file}.takeover`, '1');
    expect(replaceIfStale(file, rec({ who: 'taker' }), () => true)).toBe(false);
    expect(read().who).toBe('gone lane');
    const old = new Date(Date.now() - TAKEOVER_STALE_MS - 1000);
    utimesSync(`${file}.takeover`, old, old);
    expect(replaceIfStale(file, rec({ who: 'taker' }), () => true)).toBe(false); // this call clears the dead mutex ...
    expect(existsSync(`${file}.takeover`)).toBe(false);
    expect(replaceIfStale(file, rec({ who: 'taker' }), () => true)).toBe(true); // ... the next one takes over
    expect(read().who).toBe('taker');
  });

  it('a lock that vanished before the move is created exclusively, not renamed over a fresh one', () => {
    expect(replaceIfStale(file, rec({ who: 'taker' }), () => true)).toBe(true);
    expect(read().who).toBe('taker');
  });

  it('an unreadable lock has an age from its mtime (null when gone)', () => {
    expect(unreadableAge(file)).toBeNull();
    writeFileSync(file, '');
    expect(unreadableAge(file)).toBeLessThan(5000);
    const old = new Date(Date.now() - 60000);
    utimesSync(file, old, old);
    expect(unreadableAge(file)!).toBeGreaterThan(50000);
  });
});

describe('takeLaneLock (the rig lane recorder)', () => {
  const text = (pid = process.pid): string => JSON.stringify({ pid, what: 'lulu poses', at: new Date().toISOString() });

  it('creates the lock when it is free and is refused by a live recording (one recording at a time)', () => {
    takeLaneLock({ lock: file, text: text() });
    expect(read().pid).toBe(process.pid);
    rmSync(file);
    writeFileSync(file, JSON.stringify({ pid: 4242, what: 'other poses', at: new Date().toISOString() }));
    expect(() => takeLaneLock({ lock: file, text: text(), pid: 9, ppid: 8, isAlive: (p: number) => p === 4242 })).toThrow(/another recording holds .*pid 4242/);
    expect(read().pid).toBe(4242);
  });

  it('takes over a lock whose pid is gone, in one rename, and a lock that is not a lock file once nobody can still be writing it', () => {
    writeFileSync(file, JSON.stringify({ pid: 4242, what: 'dead poses', at: new Date().toISOString() }));
    takeLaneLock({ lock: file, text: text(), isAlive: () => false });
    expect(read().pid).toBe(process.pid);
    writeFileSync(file, 'hello');
    const old = new Date(Date.now() - 60000);
    utimesSync(file, old, old);
    takeLaneLock({ lock: file, text: text(7), pid: 7, isAlive: () => false });
    expect(read().pid).toBe(7);
  });

  it('waits for a holder that is still writing its record (an empty or half-written file, younger than the grace), then gives up with a clear error', () => {
    writeFileSync(file, '');
    expect(() => takeLaneLock({ lock: file, text: text(), tries: 3, graceMs: 60000 })).toThrow(/could not take/);
    expect(readFileSync(file, 'utf8')).toBe('');
  });

  it('hands over from the parent: a lock held by this process\'s parent (a queue\'s waiter) is replaced by this recorder\'s own', () => {
    writeFileSync(file, JSON.stringify({ pid: 8, what: 'waiter', at: new Date().toISOString() }));
    takeLaneLock({ lock: file, text: text(9), pid: 9, ppid: 8, isAlive: () => true });
    expect(read().pid).toBe(9);
  });
});

/** Start `count` child takers at the same millisecond and return what they wrote. */
async function race(mode: 'browser' | 'rigrecord' | 'lane', count: number, rounds: number): Promise<string[]> {
  const goAt = Date.now() + 2500; // node needs a moment to start; they all spin until this instant
  await Promise.all(Array.from({ length: count }, (_, i) => run(process.execPath, [CHILD, mode, dir, String(goAt), String(rounds), `p${i}`], { timeout: 60000 })));
  return readFileSync(join(dir, 'events.log'), 'utf8').split('\n').filter(Boolean);
}

describe('real processes taking the lock in the same millisecond', () => {
  it('measure/lock.mjs: four processes, three rounds each, never two inside at once', { timeout: 90000 }, async () => {
    const events = await race('browser', 4, 3);
    expect(events.filter((e) => e.endsWith('VIOLATION'))).toEqual([]);
    expect(events.filter((e) => e.endsWith(' enter'))).toHaveLength(12);
    expect(events.filter((e) => e.endsWith(' exit'))).toHaveLength(12);
    expect(existsSync(file)).toBe(false); // every holder released
    expect(existsSync(join(dir, 'RIG-RECORD.next'))).toBe(false);
  });

  it('measure/lock.mjs: four processes over a STALE lock, never two inside at once', { timeout: 90000 }, async () => {
    writeFileSync(file, stale());
    const events = await race('browser', 4, 2);
    expect(events.filter((e) => e.endsWith('VIOLATION'))).toEqual([]);
    expect(events.filter((e) => e.endsWith(' enter'))).toHaveLength(8);
    expect(existsSync(`${file}.takeover`)).toBe(false);
  });

  it('rig-record-lock.mjs: four processes, three rounds each, never two inside at once', { timeout: 90000 }, async () => {
    const events = await race('rigrecord', 4, 3);
    expect(events.filter((e) => e.endsWith('VIOLATION'))).toEqual([]);
    expect(events.filter((e) => e.endsWith(' enter'))).toHaveLength(12);
    expect(existsSync(file)).toBe(false);
  });

  it('rig-record-lock.mjs: four processes over a STALE lock and a STALE reservation, never two inside at once', { timeout: 90000 }, async () => {
    writeFileSync(file, stale());
    writeFileSync(`${file}.next`, stale());
    const events = await race('rigrecord', 4, 2);
    expect(events.filter((e) => e.endsWith('VIOLATION'))).toEqual([]);
    expect(events.filter((e) => e.endsWith(' enter'))).toHaveLength(8);
  });

  it('the lane recorder: four processes take a free lock at once and exactly one wins; the others are told a recording holds it', { timeout: 90000 }, async () => {
    const events = await race('lane', 4, 1);
    expect(events.filter((e) => e.endsWith(' won'))).toHaveLength(1);
    const lost = events.filter((e) => / lost /.test(e));
    expect(lost).toHaveLength(3);
    for (const l of lost) expect(l).toMatch(/another recording holds/);
  });

  it('the lane recorder: four processes over a lock whose pid is gone take it once, not four times', { timeout: 90000 }, async () => {
    writeFileSync(file, JSON.stringify({ pid: 2147483000, what: 'dead poses', at: new Date().toISOString() }));
    const events = await race('lane', 4, 1);
    expect(events.filter((e) => e.endsWith(' won'))).toHaveLength(1);
    expect(events.filter((e) => / lost /.test(e))).toHaveLength(3);
  });
});

describe('the stale rule keeps a live lane (fair rule, 2026-10-31: a dead pid or no write for fifteen minutes is stale)', () => {
  it('a lock whose process runs and that was written within fifteen minutes is waited for by rig-record-lock, not taken over', async () => {
    const { takeRigRecord } = await import('../../tools/rig-record-lock.mjs');
    writeFileSync(file, rec({ who: 'live lane', pid: process.pid, at: new Date(Date.now() - 14 * 60000).toISOString() }));
    let done = false;
    const taking = takeRigRecord('lane x', { file, pollMs: 20 }).then((r: () => void) => {
      done = true;
      return r;
    });
    await new Promise((r) => setTimeout(r, 150));
    expect(done).toBe(false);
    expect(read().who).toBe('live lane');
    rmSync(file);
    (await taking)();
    expect(statSync(dir).isDirectory()).toBe(true);
  });
});
