/**
 * The review-browser lock the fight-start timeline takes (`tools/rig-record-lock.mjs`; post-conference lane "post-fight-start", tooling only; both games).
 * A temp file stands in for `D:/Tools/pyrefly-scratch/RIG-RECORD`.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { takeRigRecord } from '../../tools/rig-record-lock.mjs';

let dir = '';
let file = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-record-'));
  file = join(dir, 'RIG-RECORD');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

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
    writeFileSync(file, JSON.stringify({ who: 'other lane', pid: 1, at: new Date().toISOString(), maxMinutes: 10 }));
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

  it('removes a lock older than the stale limit, and says so', async () => {
    writeFileSync(file, JSON.stringify({ who: 'gone lane', pid: 1, at: new Date(Date.now() - 20 * 60000).toISOString(), maxMinutes: 10 }));
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
    writeFileSync(file, JSON.stringify({ who: 'other lane', pid: 1, at: new Date().toISOString(), maxMinutes: 10 }));
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
    writeFileSync(`${file}.next`, JSON.stringify({ who: 'lane in line', pid: 1, at: new Date().toISOString(), maxMinutes: 10 }));
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
    writeFileSync(`${file}.next`, JSON.stringify({ who: 'gone waiter', pid: 1, at: new Date(Date.now() - 20 * 60000).toISOString(), maxMinutes: 10 }));
    const said: string[] = [];
    const release = await takeRigRecord('lane j', { file, pollMs: 20, log: (m: string) => said.push(m) });
    expect(said.some((m) => m.includes('gone waiter') && m.includes('removing'))).toBe(true);
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toBe('lane j');
    release();
  });

  it("removes this lane's own reservation when the job that made it is gone, and leaves another lane's alone", async () => {
    writeFileSync(`${file}.next`, JSON.stringify({ who: 'post-fight-start timeline 6 job(s)', pid: 2147483000, at: new Date().toISOString(), maxMinutes: 10 }));
    const said: string[] = [];
    const release = await takeRigRecord('post-fight-start timeline 2 job(s)', { file, pollMs: 20, ownPrefix: 'post-fight-start', log: (m: string) => said.push(m) });
    expect(said.some((m) => m.includes('left by a job that is gone'))).toBe(true);
    expect(JSON.parse(readFileSync(file, 'utf8')).who).toContain('2 job(s)');
    release();
    // another lane's reservation with a dead pid is not ours to remove
    writeFileSync(`${file}.next`, JSON.stringify({ who: 'other lane', pid: 2147483000, at: new Date().toISOString(), maxMinutes: 10 }));
    const taking = takeRigRecord('post-fight-start x', { file, pollMs: 20, ownPrefix: 'post-fight-start' });
    let done = false;
    void taking.then(() => (done = true));
    await new Promise((r) => setTimeout(r, 100));
    expect(done).toBe(false);
    rmSync(`${file}.next`);
    (await taking)();
  });

  it('takes nothing for file: null', async () => {
    const release = await takeRigRecord('lane g', { file: null });
    expect(existsSync(file)).toBe(false);
    release();
  });
});
