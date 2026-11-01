/**
 * Crash capture for the browser harnesses (headless Chromium through Playwright); tooling only, both games (2026-10-31, from the r69-crash investigation of a "Target crashed" in the Leblanc fight).
 *
 * Why: three Leblanc runs ended in "Target crashed" and nothing was left to say why (no frame at the crash, no memory curve, the harness reported a content failure). The investigation's monitor is now a
 * module any harness can attach (and `tools/measure/session.mjs` does, for every game it opens):
 *
 *   - `CRASH_LAUNCH_ARGS` (`--enable-logging=stderr --log-level=0`): Chromium writes its own log, with wall-clock stamps, which survives a crash in the profile folder.
 *   - `page.on('crash')` stamps the crash with the harness clock, the wall clock and the LAST SAMPLED memory (heap and processes), and writes the evidence file at once.
 *   - a CDP heap sample every 2 s (`Performance.getMetrics`: JS heap, DOM nodes, listeners, layouts) and a process-memory sample every 10 s (the browser's process tree: working set, private bytes, GPU
 *     dedicated and shared memory per process, host CPU and free memory, the card via nvidia-smi) are kept in RING BUFFERS (the last 5 and the last 10 minutes), so a run that lasts an hour keeps a small
 *     file; the rings are written when the page crashes (`dump`), and a last process sample is taken after the crash and written over it.
 *   - the last console errors and the game's own `[ac]` and `[gl]` lines (audio context and GL context) are kept in a ring too: in the investigation the AudioContext error came 80 to 110 ms before the crash.
 *   - "Target crashed" is a harness event, not a result: `runWithCrashRetry` runs a job again once on a fresh browser, and if it crashes again the verdict is UNVERIFIED, never a content failure. Any other
 *     error is rethrown unchanged.
 *
 * Nothing here throws into the harness: a CDP session that cannot be made leaves the crash stamp alone; the timers do not keep the process alive; `stop()` ends them (they also end with the page or the browser).
 * The monitor is not free (a PowerShell sample every 10 s), and the investigation kept a "bare" arm to tell the monitor's effect from the thing under test: pass `sample: false` (or set
 * `PYREFLY_CRASH_CAPTURE=0` for the measuring session) for a run where timing is the measurement. The game's page is not touched: no init script, no proxies.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const CRASH_LAUNCH_ARGS = Object.freeze(['--enable-logging=stderr', '--log-level=0']);
export const HEAP_EVERY_MS = 2000;
export const PROC_EVERY_MS = 10000;
export const HEAP_RING = 150; // five minutes of 2 s samples
export const PROC_RING = 60; // ten minutes of 10 s samples
export const CONSOLE_RING = 100;
const PROCMEM_PS1 = fileURLToPath(new URL('./browser-crash-procmem.ps1', import.meta.url));
const mb = (bytes) => Math.round((Number(bytes) || 0) / 1048576);

/** A ring buffer: keeps the last `capacity` items. */
export function makeRing(capacity) {
  const items = [];
  return {
    push(x) {
      items.push(x);
      if (items.length > capacity) items.shift();
    },
    toArray: () => items.slice(),
    last: () => (items.length ? items[items.length - 1] : null),
    get size() { return items.length; },
  };
}

/** Thrown by `assertAlive` once the page has crashed: its message names "Target crashed", so `isTargetCrashed` and the retry treat it like Playwright's own. */
export class TargetCrashedError extends Error {
  constructor(message, crash = null) {
    super(message);
    this.name = 'TargetCrashedError';
    this.crash = crash;
  }
}

const CRASH_RE = /Target crashed|Page crashed/i;
/** Is this error the browser target dying (a harness event), as against a content failure? */
export function isTargetCrashed(err) {
  return err?.name === 'TargetCrashedError' || CRASH_RE.test(String(err?.message ?? err ?? ''));
}

/** Put the capture's crash stamp on an error (if it has none), so the retry's report carries the evidence; returns the error. */
export function annotateCrash(err, capture) {
  if (err && typeof err === 'object' && !err.crash && capture?.state?.crash) err.crash = capture.state.crash;
  return err;
}

/** One heap row from `Performance.getMetrics`' metrics list. */
export function shapeHeapRow(t, metrics) {
  const m = Object.fromEntries((metrics ?? []).map((x) => [x.name, x.value]));
  return { t, heapUsedMB: mb(m.JSHeapUsedSize), heapTotalMB: mb(m.JSHeapTotalSize), nodes: m.Nodes ?? null, docs: m.Documents ?? null, listeners: m.JSEventListeners ?? null, layouts: m.LayoutCount ?? null, recalcs: m.RecalcStyleCount ?? null };
}

/**
 * One process row: `types` is {pid: {type, cpu}} from `SystemInfo.getProcessInfo`, `mem` the JSON of `browser-crash-procmem.ps1` ({procs: [{id, name, ws, pm, gpuDed, gpuShr}], hostCpu, hostFreeGB,
 * gpuDedTotalMB, gpuOthers}) or null, `nv` the nvidia-smi line or null. Everything a sample could not read is null.
 */
export function shapeProcRow({ t, why, types = {}, mem = null, nv = null }) {
  return {
    t, why, nv,
    hostCpu: mem?.hostCpu ?? null, hostFreeGB: mem?.hostFreeGB ?? null, gpuDedTotalMB: mem?.gpuDedTotalMB ?? null, gpuOthers: mem?.gpuOthers ?? null,
    procs: (mem?.procs ?? []).map((p) => ({ id: p.id, type: types[p.id]?.type ?? p.name, cpu: types[p.id]?.cpu ?? null, wsMB: mb(p.ws), privMB: mb(p.pm), gpuDedMB: mb(p.gpuDed), gpuShrMB: mb(p.gpuShr) })),
  };
}

const run = (file, args) => new Promise((resolve) => execFile(file, args, { timeout: 20000, windowsHide: true }, (err, stdout) => resolve(err ? null : stdout)));

/** The default process sampler: PowerShell for the memory of these pids (Windows only), nvidia-smi for the card. Never throws; {mem: null, nv: null} where it cannot read. */
export async function defaultSampleProcesses(pids) {
  if (process.platform !== 'win32' || !pids.length) return { mem: null, nv: null };
  const args = ['-NoProfile', '-File', PROCMEM_PS1, '-Pids', pids.join(',')];
  const out = (await run('pwsh', args)) ?? (await run('powershell', args));
  let mem = null;
  try { mem = JSON.parse(out); } catch { /* no reading */ }
  const nv = await run('nvidia-smi', ['--query-gpu=memory.used,memory.total,utilization.gpu', '--format=csv,noheader,nounits']);
  return { mem, nv: nv ? nv.trim() : null };
}

/** Where a capture writes by default: `$PYREFLY_CRASH_DIR` or a folder under the temp dir, one file per process and moment. */
export function defaultDumpFile(tag = 'browser') {
  const dir = process.env.PYREFLY_CRASH_DIR || path.join(os.tmpdir(), 'pyrefly-crash-captures');
  return path.join(dir, `crash-${tag}-${new Date().toISOString().replace(/[:.]/g, '-')}-pid${process.pid}.json`);
}

/**
 * Attach the capture to one page. The crash and console listeners are installed before anything is awaited, so no event is missed; the CDP sessions come after.
 * @param {{ browser?: any, context?: any, page: any, t0?: number, dumpFile?: string | null, sample?: boolean, heapEveryMs?: number, procEveryMs?: number, sampleProcesses?: (pids: number[]) => Promise<{ mem: any, nv: string | null }>, log?: (m: string) => void, now?: () => number }} o
 *   `context` is the page's browser context (for its CDP session); `browser` the browser (for the process list); `t0` the harness clock's zero (default: now); `dumpFile` is written on a crash (null: not written)
 */
export async function attachCrashCapture({ browser, context, page, t0 = Date.now(), dumpFile = null, sample = true, heapEveryMs = HEAP_EVERY_MS, procEveryMs = PROC_EVERY_MS, sampleProcesses = defaultSampleProcesses, log = (m) => console.error(m), now = Date.now } = {}) {
  const rel = () => now() - t0;
  const heap = makeRing(HEAP_RING);
  const procs = makeRing(PROC_RING);
  const lines = makeRing(CONSOLE_RING);
  const state = { crash: null, closedAtMs: null, disconnectedAtMs: null, sampling: false, cdpError: null };
  let cdp = null;
  let bcdp = null;
  let lastPids = [];
  let procBusy = false;
  let stopped = false;
  let timers = [];

  const snapshot = () => ({ ...state, heap: heap.toArray(), procs: procs.toArray(), console: lines.toArray() });
  /** Write the rings to `file` (default: the capture's dumpFile). Returns the path, or null when there is none or it could not be written. */
  const dump = (file = dumpFile) => {
    if (!file) return null;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(snapshot(), null, 1));
      return file;
    } catch {
      return null;
    }
  };
  const stop = () => {
    stopped = true;
    for (const t of timers) clearInterval(t);
    timers = [];
  };

  async function heapSample() {
    if (!cdp) return;
    try {
      const { metrics } = await cdp.send('Performance.getMetrics');
      heap.push(shapeHeapRow(rel(), metrics));
    } catch { /* the page is gone */ }
  }
  async function procSample(why = 'tick') {
    if (!bcdp || procBusy) return;
    procBusy = true;
    try {
      const types = {};
      try {
        const { processInfo } = await bcdp.send('SystemInfo.getProcessInfo');
        lastPids = processInfo.map((p) => p.id);
        for (const p of processInfo) types[p.id] = { type: p.type, cpu: Math.round(p.cpuTime * 10) / 10 };
      } catch { /* the browser is gone: the last pids stay */ }
      const { mem, nv } = await sampleProcesses(lastPids);
      procs.push(shapeProcRow({ t: rel(), why, types, mem, nv }));
    } catch { /* best effort */ } finally {
      procBusy = false;
    }
  }

  page.on('crash', () => {
    if (state.crash) return;
    state.crash = { atMs: rel(), wallClock: new Date().toISOString(), lastHeap: heap.last(), lastProc: procs.last() };
    log(`[crash-capture] PAGE CRASH at ${(state.crash.atMs / 1000).toFixed(1)} s on the harness clock; last heap ${state.crash.lastHeap?.heapUsedMB ?? '?'} MB, ${procs.size} process samples kept${dumpFile ? `; evidence in ${dumpFile}` : ''}`);
    dump(); // the evidence is on disk before anything else can go wrong
    void procSample('crash').then(() => {
      state.crash.afterCrashProc = procs.last();
      dump();
    });
  });
  page.on('console', (m) => {
    try {
      const type = m.type();
      const text = m.text();
      if (type === 'error' || /^\[(ac|gl)\]/.test(text)) lines.push({ t: rel(), type, text: text.slice(0, 300) });
    } catch { /* a message that cannot be read */ }
  });
  page.on('pageerror', (e) => lines.push({ t: rel(), type: 'pageerror', text: String(e).slice(0, 300) }));
  page.on('close', () => {
    state.closedAtMs = rel();
    stop();
  });
  browser?.on?.('disconnected', () => {
    state.disconnectedAtMs = rel();
    stop();
  });

  if (sample && context && page) {
    try {
      cdp = await context.newCDPSession(page);
      await cdp.send('Performance.enable');
      bcdp = browser?.newBrowserCDPSession ? await browser.newBrowserCDPSession() : null;
      if (!stopped) {
        timers = [setInterval(() => void heapSample(), heapEveryMs), setInterval(() => void procSample('tick'), procEveryMs)];
        for (const t of timers) t.unref?.();
        state.sampling = true;
      }
    } catch (err) {
      state.cdpError = String(err?.message ?? err).slice(0, 200);
      log(`[crash-capture] no sampling (${state.cdpError}); the crash stamp still works`);
    }
  }

  /** Throws a TargetCrashedError once the page has crashed (a harness loop calls it, so a crash ends the attempt with the evidence attached). */
  const assertAlive = () => {
    if (state.crash) throw new TargetCrashedError(`Target crashed (page crash event at ${(state.crash.atMs / 1000).toFixed(1)} s on the harness clock)`, state.crash);
  };
  return { state, heap, procs, console: lines, snapshot, dump, stop, heapSample, procSample, crashed: () => state.crash, assertAlive };
}

/**
 * Run a browser job (`attempt(n)`, n from 1) and treat the browser target dying as a harness event: run it again once on a fresh browser (the attempt opens and closes its own), and if that crashes too
 * the answer is UNVERIFIED, not a failure. An error that is not a crash is rethrown at once, unchanged (a content failure stays a failure and is not retried).
 * @param {(attempt: number) => Promise<any>} attempt
 * @param {{ retries?: number, log?: (m: string) => void }} [o]
 * @returns {Promise<{ status: 'OK', value: any, attempts: number, crashes: any[] } | { status: 'UNVERIFIED', reason: string, attempts: number, crashes: any[] }>}
 */
export async function runWithCrashRetry(attempt, { retries = 1, log = () => undefined } = {}) {
  const crashes = [];
  for (let n = 1; n <= retries + 1; n++) {
    try {
      const value = await attempt(n);
      return { status: 'OK', value, attempts: n, crashes };
    } catch (err) {
      if (!isTargetCrashed(err)) throw err;
      crashes.push({ attempt: n, at: new Date().toISOString(), message: String(err?.message ?? err).slice(0, 300), crash: err?.crash ?? null });
      log(`[crash-capture] attempt ${n} of ${retries + 1}: the browser target crashed (${crashes[crashes.length - 1].message})${n <= retries ? '; trying again on a fresh browser' : ''}`);
    }
  }
  return { status: 'UNVERIFIED', reason: `the browser target crashed on all ${retries + 1} attempts: a harness event, not a content failure`, attempts: retries + 1, crashes };
}
