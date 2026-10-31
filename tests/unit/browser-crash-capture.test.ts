/**
 * Crash capture for the browser harnesses (`tools/browser-crash-capture.mjs`; tooling, both games; 2026-10-31).
 * A page that crashes is stamped with the time and the last sampled memory and its rings are written to disk; "Target crashed" is retried once and then UNVERIFIED, never a content failure.
 * Fakes only (an EventEmitter for the page and the browser, stub CDP sessions, a stub process sampler): no browser, no PowerShell.
 */
import { EventEmitter } from 'node:events';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CRASH_LAUNCH_ARGS, HEAP_RING, TargetCrashedError, annotateCrash, attachCrashCapture, defaultDumpFile, defaultSampleProcesses, isTargetCrashed, makeRing, runWithCrashRetry, shapeHeapRow, shapeProcRow,
} from '../../tools/browser-crash-capture.mjs';
import { openGame } from '../../tools/measure/session.mjs';

const MB = 1048576;
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

let dir = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'crash-capture-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** A page, a browser and a context whose CDP sessions answer like Chromium's: the heap grows 10 MB a sample, the browser has a renderer (11) and a GPU process (12). */
function fakes(over: { cdpFails?: boolean } = {}) {
  const page = new EventEmitter();
  const browser = new EventEmitter() as EventEmitter & { newBrowserCDPSession: () => Promise<unknown> };
  let heapMB = 100;
  const cdp = {
    send: vi.fn(async (method: string) => {
      if (method !== 'Performance.getMetrics') return {};
      heapMB += 10;
      return { metrics: [{ name: 'JSHeapUsedSize', value: heapMB * MB }, { name: 'JSHeapTotalSize', value: 200 * MB }, { name: 'Nodes', value: 5 }, { name: 'LayoutCount', value: 7 }] };
    }),
  };
  const bcdp = { send: vi.fn(async () => ({ processInfo: [{ id: 11, type: 'renderer', cpuTime: 1.234 }, { id: 12, type: 'GPU', cpuTime: 2 }] })) };
  const context = { newCDPSession: vi.fn(async () => { if (over.cdpFails) throw new Error('Protocol error: no session'); return cdp; }) };
  browser.newBrowserCDPSession = vi.fn(async () => bcdp);
  return { page, browser, context, cdp, bcdp };
}
const sampler = vi.fn(async (pids: number[]) => ({
  mem: { procs: pids.map((id) => ({ id, name: 'chrome', ws: 300 * MB, pm: 200 * MB, gpuDed: 50 * MB, gpuShr: 0 })), hostCpu: 40, hostFreeGB: 12.3, gpuDedTotalMB: 900, gpuOthers: ['99:100MB'] },
  nv: '4800, 16300, 25',
}));
const quiet = (): void => undefined;

describe('makeRing and the shapes of a sample', () => {
  it('a ring keeps the last items only', () => {
    const r = makeRing<number>(3);
    for (let i = 1; i <= 5; i++) r.push(i);
    expect(r.toArray()).toEqual([3, 4, 5]);
    expect(r.last()).toBe(5);
    expect(r.size).toBe(3);
    expect(makeRing(2).last()).toBeNull();
  });

  it('a heap row and a process row carry the numbers the crash investigation read, and nulls where nothing was read', () => {
    expect(shapeHeapRow(5, [{ name: 'JSHeapUsedSize', value: 150 * MB }, { name: 'JSHeapTotalSize', value: 300 * MB }, { name: 'Nodes', value: 9 }])).toEqual({ t: 5, heapUsedMB: 150, heapTotalMB: 300, nodes: 9, docs: null, listeners: null, layouts: null, recalcs: null });
    const row = shapeProcRow({ t: 7, why: 'tick', types: { 11: { type: 'renderer', cpu: 1.2 } }, mem: { procs: [{ id: 11, name: 'chrome', ws: 300 * MB, pm: 200 * MB, gpuDed: 50 * MB, gpuShr: 8 * MB }, { id: 99, name: 'chrome', ws: MB, pm: MB, gpuDed: 0, gpuShr: 0 }], hostCpu: 61.5, hostFreeGB: 9.5, gpuDedTotalMB: 700, gpuOthers: [] }, nv: '1, 2, 3' });
    expect(row).toMatchObject({ t: 7, why: 'tick', nv: '1, 2, 3', hostCpu: 61.5, hostFreeGB: 9.5, gpuDedTotalMB: 700 });
    expect(row.procs[0]).toEqual({ id: 11, type: 'renderer', cpu: 1.2, wsMB: 300, privMB: 200, gpuDedMB: 50, gpuShrMB: 8 });
    expect(row.procs[1]).toMatchObject({ id: 99, type: 'chrome', cpu: null }); // a process the browser did not list keeps its image name
    expect(shapeProcRow({ t: 1, why: 'x' })).toMatchObject({ nv: null, hostCpu: null, procs: [] });
  });

  it('the launch arguments are the two the investigation used', () => {
    expect([...CRASH_LAUNCH_ARGS]).toEqual(['--enable-logging=stderr', '--log-level=0']);
  });
});

describe('isTargetCrashed', () => {
  it('knows Playwright\'s crash messages and ours, and not a timeout or a content failure', () => {
    expect(isTargetCrashed(new Error('page.evaluate: Target crashed'))).toBe(true);
    expect(isTargetCrashed(new Error('Page crashed'))).toBe(true);
    expect(isTargetCrashed(new TargetCrashedError('x'))).toBe(true);
    expect(isTargetCrashed('locator.click: Target crashed')).toBe(true);
    expect(isTargetCrashed(new Error('page.waitForFunction: Timeout 30000ms exceeded.'))).toBe(false);
    expect(isTargetCrashed(new Error('expected the first menu, got title'))).toBe(false);
    expect(isTargetCrashed(new Error('Target page, context or browser has been closed'))).toBe(false);
    expect(isTargetCrashed(null)).toBe(false);
  });
});

describe('attachCrashCapture', () => {
  it('listens for the crash before it awaits anything: a crash during setup is not missed', async () => {
    const f = fakes();
    const attaching = attachCrashCapture({ browser: f.browser, context: f.context, page: f.page, sampleProcesses: sampler, log: quiet });
    f.page.emit('crash'); // before the CDP sessions exist
    const cap = await attaching;
    expect(cap.state.crash).toMatchObject({ lastHeap: null, lastProc: null });
    expect(() => cap.assertAlive()).toThrow(TargetCrashedError);
    cap.stop();
  });

  it('samples the heap and the processes into rings, and stop() ends the timers', async () => {
    const f = fakes();
    const cap = await attachCrashCapture({ browser: f.browser, context: f.context, page: f.page, heapEveryMs: 20, procEveryMs: 40, sampleProcesses: sampler, log: quiet });
    expect(cap.state.sampling).toBe(true);
    expect(f.cdp.send).toHaveBeenCalledWith('Performance.enable');
    await wait(250);
    expect(cap.heap.size).toBeGreaterThanOrEqual(3);
    expect(cap.procs.size).toBeGreaterThanOrEqual(2);
    expect(cap.heap.last()).toMatchObject({ heapTotalMB: 200, nodes: 5, layouts: 7 });
    expect(cap.procs.last()).toMatchObject({ why: 'tick', nv: '4800, 16300, 25', hostCpu: 40 });
    expect(cap.procs.last()?.procs.map((p) => p.type)).toEqual(['renderer', 'GPU']);
    cap.stop();
    await wait(60);
    const heapAfter = cap.heap.size;
    const procsAfter = cap.procs.size;
    await wait(150);
    expect(cap.heap.size).toBe(heapAfter);
    expect(cap.procs.size).toBe(procsAfter);
    expect(cap.heap.size).toBeLessThanOrEqual(HEAP_RING);
  });

  it('a crash is stamped with the harness time, the wall clock and the last sampled memory, and the rings are written to the evidence file at once, then again with a last process sample', async () => {
    const f = fakes();
    const dumpFile = join(dir, 'ev', 'crash.json');
    const said: string[] = [];
    let clock = 1_000_000;
    const cap = await attachCrashCapture({ browser: f.browser, context: f.context, page: f.page, t0: 1_000_000, now: () => clock, dumpFile, heapEveryMs: 20, procEveryMs: 40, sampleProcesses: sampler, log: (m: string) => said.push(m) });
    await wait(200);
    clock = 1_000_000 + 200_100; // 200.1 s into the run
    f.page.emit('crash');
    const stamp = cap.crashed();
    expect(stamp?.atMs).toBe(200_100);
    expect(Number.isFinite(Date.parse(stamp?.wallClock ?? ''))).toBe(true);
    expect(stamp?.lastHeap?.heapUsedMB).toBeGreaterThanOrEqual(110);
    expect(stamp?.lastProc?.procs[0]).toMatchObject({ type: 'renderer', wsMB: 300, privMB: 200, gpuDedMB: 50 });
    expect(said.some((m) => m.includes('PAGE CRASH at 200.1 s') && m.includes(dumpFile))).toBe(true);
    expect(existsSync(dumpFile)).toBe(true); // synchronously: before the last sample
    const first = JSON.parse(readFileSync(dumpFile, 'utf8'));
    expect(first.crash.atMs).toBe(200_100);
    expect(first.heap.length).toBeGreaterThanOrEqual(3);
    expect(first.procs.length).toBeGreaterThanOrEqual(2);
    await wait(120);
    const second = JSON.parse(readFileSync(dumpFile, 'utf8'));
    expect(second.crash.afterCrashProc.why).toBe('crash');
    cap.stop();
  });

  it('a second crash event does not restamp the first; assertAlive throws an error the retry treats as a crash', async () => {
    const f = fakes();
    let clock = 0;
    const cap = await attachCrashCapture({ browser: f.browser, context: f.context, page: f.page, t0: 0, now: () => clock, sample: false, log: quiet });
    expect(() => cap.assertAlive()).not.toThrow();
    clock = 5000;
    f.page.emit('crash');
    clock = 9000;
    f.page.emit('crash');
    expect(cap.crashed()?.atMs).toBe(5000);
    let thrown: unknown;
    try { cap.assertAlive(); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(TargetCrashedError);
    expect(isTargetCrashed(thrown)).toBe(true);
    expect((thrown as TargetCrashedError).crash?.atMs).toBe(5000);
    expect(String((thrown as Error).message)).toContain('5.0 s');
  });

  it('keeps the last console errors, the page errors and the game\'s [ac] and [gl] lines, and nothing else', async () => {
    const f = fakes();
    const cap = await attachCrashCapture({ browser: f.browser, context: f.context, page: f.page, sample: false, log: quiet });
    const msg = (type: string, text: string) => ({ type: () => type, text: () => text });
    f.page.emit('console', msg('log', 'just a log'));
    f.page.emit('console', msg('error', 'Uncaught TypeError: x'));
    f.page.emit('console', msg('info', '[ac] ctx1 ERROR event The AudioContext encountered an error'));
    f.page.emit('console', msg('info', '[gl] context LOST canvas'));
    f.page.emit('pageerror', new Error('boom'));
    expect(cap.console.toArray().map((l) => l.text)).toEqual(['Uncaught TypeError: x', '[ac] ctx1 ERROR event The AudioContext encountered an error', '[gl] context LOST canvas', 'Error: boom']);
  });

  it('a CDP session that cannot be made does not throw: the crash is still stamped, and the cause is kept', async () => {
    const f = fakes({ cdpFails: true });
    const said: string[] = [];
    const cap = await attachCrashCapture({ browser: f.browser, context: f.context, page: f.page, sampleProcesses: sampler, log: (m: string) => said.push(m) });
    expect(cap.state.sampling).toBe(false);
    expect(cap.state.cdpError).toContain('no session');
    expect(said.some((m) => m.includes('no sampling'))).toBe(true);
    f.page.emit('crash');
    expect(cap.crashed()?.lastHeap).toBeNull();
  });

  it('the timers end with the page and with the browser', async () => {
    for (const [event, key] of [['close', 'closedAtMs'], ['disconnected', 'disconnectedAtMs']] as const) {
      const f = fakes();
      const cap = await attachCrashCapture({ browser: f.browser, context: f.context, page: f.page, heapEveryMs: 20, procEveryMs: 40, sampleProcesses: sampler, log: quiet });
      await wait(80);
      (event === 'close' ? f.page : f.browser).emit(event);
      expect(cap.state[key]).not.toBeNull();
      await wait(40);
      const n = cap.heap.size;
      await wait(120);
      expect(cap.heap.size).toBe(n);
    }
  });

  it('writes nothing when there is no dumpFile, and the default file name is per process under a folder of its own', async () => {
    const f = fakes();
    const cap = await attachCrashCapture({ browser: f.browser, context: f.context, page: f.page, sample: false, log: quiet });
    f.page.emit('crash');
    expect(cap.dump()).toBeNull();
    expect(defaultDumpFile('measure')).toMatch(/crash-measure-.*-pid\d+\.json$/);
  });

  it('the default process sampler reads nothing without pids', async () => {
    await expect(defaultSampleProcesses([])).resolves.toEqual({ mem: null, nv: null });
  });
});

describe('runWithCrashRetry', () => {
  it('a job that passes is OK on the first attempt', async () => {
    const r = await runWithCrashRetry(async (n: number) => `fine ${n}`);
    expect(r).toEqual({ status: 'OK', value: 'fine 1', attempts: 1, crashes: [] });
  });

  it('a crash is retried once on a fresh browser, and the second attempt\'s answer stands', async () => {
    const said: string[] = [];
    const r = await runWithCrashRetry(async (n: number) => {
      if (n === 1) throw new Error('page.evaluate: Target crashed');
      return 'second time';
    }, { log: (m: string) => said.push(m) });
    expect(r).toMatchObject({ status: 'OK', value: 'second time', attempts: 2 });
    expect(r.crashes).toHaveLength(1);
    expect(said.some((m) => m.includes('trying again on a fresh browser'))).toBe(true);
  });

  it('a second crash is UNVERIFIED, never a failure, and carries the crash stamps', async () => {
    const f = fakes();
    const cap = await attachCrashCapture({ browser: f.browser, context: f.context, page: f.page, sample: false, log: quiet });
    f.page.emit('crash');
    const attempt = vi.fn(async () => {
      try { cap.assertAlive(); } catch (e) { throw annotateCrash(e, cap); }
    });
    const r = await runWithCrashRetry(attempt);
    expect(attempt).toHaveBeenCalledTimes(2);
    expect(r.status).toBe('UNVERIFIED');
    if (r.status === 'UNVERIFIED') expect(r.reason).toContain('not a content failure');
    expect(r.attempts).toBe(2);
    expect(r.crashes).toHaveLength(2);
    expect((r.crashes[0] as { crash: { atMs: number } }).crash.atMs).toBeGreaterThanOrEqual(0);
  });

  it('an error that is not a crash is rethrown at once and not retried (a content failure stays a failure)', async () => {
    const attempt = vi.fn(async () => { throw new Error('expected the first menu, got title'); });
    await expect(runWithCrashRetry(attempt)).rejects.toThrow('expected the first menu');
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('retries: 0 turns the first crash into UNVERIFIED without a second attempt', async () => {
    const attempt = vi.fn(async () => { throw new Error('Target crashed'); });
    const r = await runWithCrashRetry(attempt, { retries: 0 });
    expect(r).toMatchObject({ status: 'UNVERIFIED', attempts: 1 });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('annotateCrash leaves an error that already has evidence, and one with no capture, alone', () => {
    const e = Object.assign(new Error('x'), { crash: { atMs: 1 } });
    expect(annotateCrash(e, { state: { crash: { atMs: 2, wallClock: '', lastHeap: null, lastProc: null } } })).toBe(e);
    expect((e as unknown as { crash: { atMs: number } }).crash.atMs).toBe(1);
    expect(annotateCrash('not an object', null)).toBe('not an object');
  });
});

describe('the measuring session attaches it', () => {
  /** The pieces of Playwright that openGame touches, as stubs. */
  function fakeBrowser() {
    const f = fakes();
    const page = Object.assign(f.page, {
      clock: { install: async () => undefined },
      addInitScript: async () => undefined,
      goto: async () => undefined,
      evaluate: async () => undefined,
      waitForFunction: async () => undefined,
      keyboard: { press: async () => undefined },
    });
    const browser = Object.assign(f.browser, { newContext: async () => Object.assign(f.context, { newPage: async () => page }) });
    return { browser, page };
  }

  it('openGame gives the session a capture with the crash listener on its page and the samplers running; PYREFLY_CRASH_CAPTURE=0 turns it off', async () => {
    const { browser, page } = fakeBrowser();
    const g = await openGame(browser, 'http://localhost:1/', '');
    try {
      expect(g.crash).not.toBeNull();
      expect(g.crash?.state.sampling).toBe(true);
      expect(page.listenerCount('crash')).toBe(1);
    } finally {
      g.crash?.stop();
    }
    vi.stubEnv('PYREFLY_CRASH_CAPTURE', '0');
    try {
      const off = fakeBrowser();
      expect((await openGame(off.browser, 'http://localhost:1/', '')).crash).toBeNull();
      expect(off.page.listenerCount('crash')).toBe(0);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
