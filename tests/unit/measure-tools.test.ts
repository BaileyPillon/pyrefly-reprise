/**
 * The shared plumbing of the measuring tools (`tools/measure/`, motion-fluidity pass, lane L5; both games, tooling): the browser lock's rules, the in-process static server, and the tool stamp.
 * No browser, no real lock file: the lock's decisions are pure functions with the clock and the process table injected.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { heldBy, reservedBy } from '../../tools/measure/lock.mjs';
import { parseRange, resolveUnder, serveDist } from '../../tools/measure/serve.mjs';
import { describeStamp, incomparable, toolDigest, toolStamp } from '../../tools/measure/stamp.mjs';

const NOW = Date.parse('2026-10-27T05:00:00Z');
const at = (minAgo: number): string => new Date(NOW - minAgo * 60000).toISOString();

describe('the RIG-RECORD lock', () => {
  it('is held by somebody else until it is 15 minutes old, whether or not its pid answers (the pass never removes another lane lock earlier)', () => {
    const rec = { who: 'other', pid: 4242, at: at(3), maxMinutes: 10 };
    expect(heldBy(rec, { pid: 1, now: NOW })).toBe(rec);
    expect(heldBy({ ...rec, at: at(14) }, { pid: 1, now: NOW })).not.toBeNull(); // a wrapper pid that exited while its job runs
    expect(heldBy({ ...rec, at: at(16) }, { pid: 1, now: NOW })).toBeNull(); // older than 15 minutes: stale
    expect(heldBy(rec, { pid: 4242, now: NOW })).toBeNull(); // our own
    expect(heldBy(null)).toBeNull();
    expect(heldBy({ who: 'x', at: at(1) } as never, { pid: 1, now: NOW })).toBeNull(); // no pid
  });
  it('a reservation is good while its owner lives and is younger than its own max plus the stale margin', () => {
    const rec = { who: 'next', pid: 77, at: at(20), maxMinutes: 10 };
    expect(reservedBy(rec, { pid: 1, now: NOW, isAlive: () => true })).toBe(rec);
    expect(reservedBy({ ...rec, at: at(26) }, { pid: 1, now: NOW, isAlive: () => true })).toBeNull();
    expect(reservedBy(rec, { pid: 77, now: NOW, isAlive: () => true })).toBeNull();
  });
});

describe('the static server', () => {
  it('never leaves the folder it serves', () => {
    const root = path.resolve('some/dist');
    expect(resolveUnder(root, '/assets/a.js?x=1')).toBe(path.join(root, 'assets', 'a.js'));
    expect(resolveUnder(root, '/../secret.txt')).toBeNull();
    expect(resolveUnder(root, '/%2e%2e/%2e%2e/etc/passwd')).toBeNull();
    expect(resolveUnder(root, '/')).toBe(root);
  });
  it('reads byte ranges', () => {
    expect(parseRange('bytes=0-9', 100)).toEqual({ start: 0, end: 9 });
    expect(parseRange('bytes=90-', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=0-1000', 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange('bytes=200-300', 100)).toBe('bad');
    expect(parseRange(undefined, 100)).toBeNull();
  });
  it('serves a built folder read-only, with ranges, index.html for an unknown path and a 403 outside it', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'measure-serve-'));
    try {
      fs.writeFileSync(path.join(dir, 'index.html'), '<title>game</title>');
      fs.mkdirSync(path.join(dir, 'assets'));
      fs.writeFileSync(path.join(dir, 'assets', 'a.js'), '0123456789');
      const s = await serveDist(dir);
      try {
        expect(await (await fetch(`${s.base}`)).text()).toContain('<title>game</title>');
        expect(await (await fetch(`${s.base}no/such/path`)).text()).toContain('<title>game</title>'); // a route of the one-page game
        const missing = await fetch(`${s.base}assets/missing.webp`);
        expect(missing.status).toBe(404); // a missing FILE is a 404, never an HTML page for the decoder to choke on
        const js = await fetch(`${s.base}assets/a.js`);
        expect(js.headers.get('content-type')).toMatch(/javascript/);
        expect(await js.text()).toBe('0123456789');
        const part = await fetch(`${s.base}assets/a.js`, { headers: { Range: 'bytes=2-4' } });
        expect(part.status).toBe(206);
        expect(await part.text()).toBe('234');
        expect((await fetch(`${s.base}assets/a.js`, { headers: { Range: 'bytes=50-60' } })).status).toBe(416);
      } finally { await s.close(); }
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
  it('refuses a folder that is not a built candidate', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'measure-serve-empty-'));
    try { await expect(serveDist(dir)).rejects.toThrow(/no index.html/); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe('the tool stamp', () => {
  const root = path.resolve(__dirname, '..', '..');
  it('names the tool\'s own files (its import closure) and the continuity harness of the tree it ran from', () => {
    const s = toolStamp('measure-test', 'tools/measure/stamp.mjs', root);
    expect(s.schema).toBe('measure-tool/1');
    expect(Object.keys(s.toolFiles)).toContain('tools/measure/stamp.mjs');
    expect(Object.keys(s.toolFiles)).toContain('tools/critic-harness-identity.mjs');
    expect(s.toolId).toBe(toolDigest(s.toolFiles));
    expect(s.harness.id).toMatch(/^[0-9a-f]{64}$/);
    expect(s.harness.files).toBeGreaterThan(30);
    expect(describeStamp(s)).toMatch(/^measure-test [0-9a-f]{12} \(harness [0-9a-f]{12};/);
  });
  it('two outputs are comparable only when the same tool read them with the same harness', () => {
    const a = toolStamp('measure-test', 'tools/measure/stamp.mjs', root);
    expect(incomparable(a, { ...a })).toEqual([]);
    expect(incomparable(a, { ...a, toolId: 'ffffffffffff' })[0]).toMatch(/different tool files/);
    expect(incomparable(a, { ...a, harness: { ...a.harness, id: 'x' } })[0]).toMatch(/different continuity harness/);
    expect(incomparable(a, { ...a, tool: 'other' })[0]).toMatch(/different tools/);
    expect(incomparable(a, null)[0]).toMatch(/no stamp/);
  });
  it('covers a file the tool reads at run time without importing it, and the thresholds its numbers depend on (review M2)', () => {
    const base = toolStamp('measure-test', 'tools/measure/stamp.mjs', root);
    const withPage = toolStamp('measure-test', 'tools/measure/stamp.mjs', root, { extraFiles: ['critic/runner/lib/pace-init.page.js'] });
    expect(Object.keys(withPage.toolFiles)).toContain('critic/runner/lib/pace-init.page.js');
    expect(withPage.toolId).not.toBe(base.toolId);
    const t1 = toolStamp('measure-test', 'tools/measure/stamp.mjs', root, { thresholds: { minJumpPx: 2.5, minShare: 0.3 } });
    const t2 = toolStamp('measure-test', 'tools/measure/stamp.mjs', root, { thresholds: { minShare: 0.3, minJumpPx: 2.5 } });
    const t3 = toolStamp('measure-test', 'tools/measure/stamp.mjs', root, { thresholds: { minJumpPx: 3, minShare: 0.3 } });
    expect(t1.toolId).toBe(t2.toolId); // the order they are written in does not matter
    expect(t1.toolId).not.toBe(base.toolId);
    expect(t1.toolId).not.toBe(t3.toolId); // a changed threshold is another tool
    expect(incomparable(t1, t3)[0]).toMatch(/different tool files/);
    expect(t1.thresholds).toEqual({ minJumpPx: 2.5, minShare: 0.3 });
    expect(() => toolStamp('measure-test', 'tools/measure/stamp.mjs', root, { extraFiles: ['no/such/file.js'] })).toThrow(/not in/);
  });
  it('the digest does not depend on the order the files are listed in', () => {
    expect(toolDigest({ a: '1', b: '2' })).toBe(toolDigest({ b: '2', a: '1' }));
    expect(toolDigest({ a: '1' })).not.toBe(toolDigest({ a: '2' }));
  });
});

describe('a pacing run on a busy machine says so (the first Chapter IV run of the lane)', () => {
  it('flags total CPU over a quarter busy on average, and stays silent on a quiet or unsampled machine', async () => {
    const { BUSY_CPU_AVG, busyNote, summariseMachine } = await import('../../tools/measure/machine.mjs');
    expect(BUSY_CPU_AVG).toBe(25);
    expect(busyNote({ cpuBusy: { avg: 49.4, max: 85.1 } })).toMatch(/MACHINE BUSY: total CPU 49.4 percent on average \(85.1 at most\).*GPU-QUIET/);
    expect(busyNote({ cpuBusy: { avg: 12, max: 40 } })).toBeNull();
    expect(busyNote({ cpuBusy: null })).toBeNull();
    expect(busyNote(null)).toBeNull();
    const s = summariseMachine({ smi: [], cpu: [{ at: 10, busy: 60 }, { at: 20, busy: 40 }, { at: 99, busy: 0 }] }, 0, 50);
    expect(s.cpuBusy).toEqual({ avg: 50, max: 60 });
    expect(busyNote(s)).not.toBeNull();
  });
});
