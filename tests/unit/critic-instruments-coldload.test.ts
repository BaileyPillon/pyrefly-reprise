/**
 * The cold-load instrument (`critic/runner/lib/coldload.mjs` and `coldload-pure.mjs`), promoted from the round-25 chief's `coldload.mjs` (PR-0450 a, lane r43-critic-tools).
 * Round 25's `delivery.mjs` (R25-PD-01) loaded the page twice and started its clock after `__pyreflyReady`: the number it reported was a warm second load, and the first
 * load was not timed at all. A cold load is ONE navigation in a FRESH browser with the cache OFF before it starts, timed from the navigation, ready when the title answers
 * its first key, run alone. The browser half is run here against a fake page and a fake CDP session on a virtual clock, so the ORDER of what it does is what is tested;
 * the rules and numbers are pure. Nothing opens a browser.
 *
 * Game case: both (shared critic plumbing; the first load is the same in FFX and FFX-2).
 */
import { describe, expect, it } from 'vitest';
import { measureCold, runColdLoads } from '../../critic/runner/lib/coldload.mjs';
import type { ColdHandle } from '../../critic/runner/lib/coldload.mjs';
import {
  COLD_TIMEOUT_MS, HOST_BUSY_PCT, THROTTLE_DEFAULT, coldLoadReportLine, cpuBusyPct, frameStats, judgeColdRun, medianOf, parseThrottle, profilesFor, summarizeColdLoads,
} from '../../critic/runner/lib/coldload-pure.mjs';
import type { ColdRun } from '../../critic/runner/lib/coldload-pure.mjs';

// ================================================================== the pure half

describe('the profiles of a measurement', () => {
  it('are three unthrottled cold loads, so there is a median, and the chief\'s throttled one: 1.6 Mbps down, 0.75 up, 150 ms', () => {
    const p = profilesFor();
    expect(p.map((x) => x.name)).toEqual(['unthrottled-1', 'unthrottled-2', 'unthrottled-3', 'throttled-1.6Mbps-150ms']);
    expect(p.map((x) => x.throttled)).toEqual([false, false, false, true]);
    expect(p[0]!.net).toBeNull();
    expect(p[3]!.net).toEqual({ offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
    expect(THROTTLE_DEFAULT).toEqual({ downMbps: 1.6, upMbps: 0.75, latencyMs: 150 });
  });

  it('take a number of runs, and --throttle=off drops the throttled one', () => {
    expect(profilesFor({ runs: 5, throttle: null }).map((x) => x.name)).toEqual(['unthrottled-1', 'unthrottled-2', 'unthrottled-3', 'unthrottled-4', 'unthrottled-5']);
    expect(profilesFor({ runs: 0, throttle: null })).toHaveLength(1); // at least one
    expect(profilesFor({ runs: 1, throttle: { downMbps: 5, upMbps: 1, latencyMs: 40 } })[1]).toMatchObject({ name: 'throttled-5Mbps-40ms', net: { latency: 40, downloadThroughput: 625000 } });
  });

  it('parse --throttle and refuse a form they do not understand', () => {
    expect(parseThrottle(undefined)).toEqual(THROTTLE_DEFAULT);
    expect(parseThrottle('off')).toBeNull();
    expect(parseThrottle('OFF')).toBeNull();
    expect(parseThrottle('3,1,80')).toEqual({ downMbps: 3, upMbps: 1, latencyMs: 80 });
    for (const bad of ['3,1', 'fast', '0,1,1', '-1,1,1', '1,1,1,1']) expect(() => parseThrottle(bad), bad).toThrow(/--throttle wants/);
  });
});

describe('what makes a run a cold load', () => {
  const good = { navigations: 1, cacheDisabled: true, timedOut: false, wallMsToTitle: 3100 };

  it('one navigation and the cache off; a run that says otherwise is not a cold-load number', () => {
    expect(judgeColdRun(good)).toEqual({ protocol: true, problems: [], reachedTitle: true });
    expect(judgeColdRun({ ...good, navigations: 2 }).problems[0]).toMatch(/navigated 2 times/);
    expect(judgeColdRun({ ...good, navigations: undefined }).problems[0]).toMatch(/unknown number of times/);
    expect(judgeColdRun({ ...good, cacheDisabled: false }).problems.join(' ')).toMatch(/cache was not switched off/);
    expect(judgeColdRun({ ...good, navigations: 2, cacheDisabled: false }).problems).toHaveLength(2);
  });

  it('a run that timed out kept the protocol and reached no title: a finding about the game, not a failure of the instrument', () => {
    expect(judgeColdRun({ ...good, timedOut: true, wallMsToTitle: null })).toEqual({ protocol: true, problems: [], reachedTitle: false });
  });

  it('a run that failed before it could be timed breaks the protocol and says why', () => {
    const j = judgeColdRun({ error: 'browserType.launch: Executable doesn\'t exist', wallMsToTitle: null });
    expect(j.protocol).toBe(false);
    expect(j.problems).toEqual(['the run failed before it could be timed: browserType.launch: Executable doesn\'t exist']);
  });
});

describe('the numbers', () => {
  it('median of an odd and an even set, ignoring what is not a number', () => {
    expect(medianOf([3, 1, 2])).toBe(2);
    expect(medianOf([4, 1, 3, 2])).toBe(2.5);
    expect(medianOf([null, undefined, 5])).toBe(5);
    expect(medianOf([])).toBeNull();
  });

  it('CPU busy percent between two snapshots of all the cores, and null when they cannot be compared', () => {
    const core = (user: number, sys: number, idle: number) => ({ times: { user, nice: 0, sys, irq: 0, idle } });
    expect(cpuBusyPct([core(0, 0, 0), core(0, 0, 0)], [core(50, 0, 50), core(0, 0, 100)])).toBe(25); // one core half busy, one idle: a quarter of 200
    expect(cpuBusyPct([core(0, 0, 0)], [core(10, 10, 80)])).toBe(20);
    expect(cpuBusyPct([core(0, 0, 0)], [core(0, 0, 0)])).toBeNull();
    expect(cpuBusyPct([core(0, 0, 0)], [])).toBeNull();
    expect(cpuBusyPct(undefined as never, undefined as never)).toBeNull();
  });

  it('frame times: how many frames, the median, the 95th percentile and the worst', () => {
    const ts = [0]; for (let i = 1; i <= 100; i++) ts.push(ts[i - 1]! + (i === 50 ? 120 : 16.7));
    expect(frameStats(ts)).toEqual({ frames: 101, medianMs: 16.7, p95Ms: 16.7, maxMs: 120 });
    expect(frameStats([0])).toEqual({ frames: 1, medianMs: null, p95Ms: null, maxMs: null });
  });
});

describe('the summary of a set of runs', () => {
  const run = (over: Partial<ColdRun> & { profile: string }): ColdRun => ({ throttled: false, wallMsToTitle: 3000, pageMsToTitle: 2950, bytesAtTitle: 8 * 1048576, requestsAtTitle: 140, navigations: 1, cacheDisabled: true, timedOut: false, host: { cpuBusyPct: 6 }, ...over });
  const set: ColdRun[] = [
    run({ profile: 'unthrottled-1', wallMsToTitle: 3400 }), run({ profile: 'unthrottled-2', wallMsToTitle: 3000 }), run({ profile: 'unthrottled-3', wallMsToTitle: 3200 }),
    run({ profile: 'throttled-1.6Mbps-150ms', throttled: true, wallMsToTitle: 31000 }),
  ];

  it('takes the MEDIAN of the unthrottled cold loads, and lists each throttled one by itself', () => {
    const s = summarizeColdLoads(set);
    expect(s.unthrottled).toMatchObject({ runs: 3, reached: 3, timedOut: 0, medianMs: 3200, minMs: 3000, maxMs: 3400, medianPageMs: 2950, medianRequestsAtTitle: 140 });
    expect(s.throttled).toEqual([{ profile: 'throttled-1.6Mbps-150ms', protocol: true, reachedTitle: true, wallMsToTitle: 31000, bytesAtTitle: 8 * 1048576 }]);
    expect(s.protocolProblems).toEqual([]);
    expect(s.busyHost).toEqual([]);
    expect(s.hostUnread).toEqual([]);
  });

  it('leaves a run that broke the protocol out of the median and names it', () => {
    const s = summarizeColdLoads([...set.slice(0, 2), run({ profile: 'unthrottled-3', wallMsToTitle: 900, navigations: 2 }), set[3]!]);
    expect(s.unthrottled).toMatchObject({ runs: 2, reached: 2, medianMs: 3200, minMs: 3000, maxMs: 3400 });
    expect(s.protocolProblems).toEqual([{ profile: 'unthrottled-3', problems: [expect.stringMatching(/navigated 2 times/)] }]);
  });

  it('counts a timeout as a timeout and gives no median when no run reached the title', () => {
    const s = summarizeColdLoads([run({ profile: 'unthrottled-1', timedOut: true, wallMsToTitle: null }), run({ profile: 'unthrottled-2', timedOut: true, wallMsToTitle: null })]);
    expect(s.unthrottled).toMatchObject({ runs: 2, reached: 0, timedOut: 2, medianMs: null, minMs: null, maxMs: null });
  });

  it('names a busy host, and a host whose load was not read, so the number is not taken for an idle-host number', () => {
    const busy = summarizeColdLoads([run({ profile: 'unthrottled-1', host: { cpuBusyPct: 63.5 } }), run({ profile: 'unthrottled-2', host: { cpuBusyPct: HOST_BUSY_PCT } }), run({ profile: 'unthrottled-3', host: { cpuBusyPct: null } }), run({ profile: 'unthrottled-4', host: undefined })]);
    expect(busy.busyHost).toEqual([{ profile: 'unthrottled-1', cpuBusyPct: 63.5 }]); // the line itself is idle
    expect(busy.hostUnread).toEqual(['unthrottled-3', 'unthrottled-4']);
  });
});

describe('the report line', () => {
  const run = (profile: string, ms: number | null, over: Partial<ColdRun> = {}): ColdRun => ({ profile, throttled: profile.startsWith('throttled'), wallMsToTitle: ms, pageMsToTitle: ms, bytesAtTitle: 6 * 1048576, requestsAtTitle: 120, navigations: 1, cacheDisabled: true, timedOut: ms === null, host: { cpuBusyPct: 5 }, ...over });
  const ctx = { base: 'https://echoesofspira.com/', mode: 'gpu', viewport: '1600x900', browser: 'Chromium 146.0', machine: 'win32 10.0.26200, 16-core CPU, 64 GB RAM' };

  it('is one line with the median, the range, the throttled load, the host, and every condition the rubric asks for', () => {
    const s = summarizeColdLoads([run('unthrottled-1', 3400), run('unthrottled-2', 3000), run('unthrottled-3', 3200), run('throttled-1.6Mbps-150ms', 31000)]);
    const line = coldLoadReportLine(s, ctx);
    expect(line).not.toContain('\n');
    expect(line).toContain('cold load to an interactive title 3.2 s median (3.0 s to 3.4 s, 3 of 3 cold run(s), 6.0 MB and 120 requests by then)');
    expect(line).toContain('throttled-1.6Mbps-150ms 31.0 s');
    expect(line).toContain('host idle before every run');
    expect(line).toContain('one navigation, cache off, timed from navigation start');
    expect(line).toContain('[https://echoesofspira.com/, gpu rendering, 1600x900, Chromium 146.0, win32 10.0.26200, 16-core CPU, 64 GB RAM]');
  });

  it('says so, loudly, when the host was busy, the protocol broke or no run reached the title; and prints no number it does not have', () => {
    const busy = coldLoadReportLine(summarizeColdLoads([run('unthrottled-1', 3000, { host: { cpuBusyPct: 71.2 } })]), ctx);
    expect(busy).toContain('HOST BUSY on unthrottled-1 (71.2% CPU): not an idle-host number');
    const broke = coldLoadReportLine(summarizeColdLoads([run('unthrottled-1', 900, { navigations: 2 })]), ctx);
    expect(broke).toContain('NO unthrottled run reached an interactive title with the protocol kept (0 kept it, 0 timed out)');
    expect(broke).toContain('PROTOCOL BROKEN on unthrottled-1');
    const none = coldLoadReportLine(summarizeColdLoads([run('unthrottled-1', null)]), ctx);
    expect(none).toContain('(1 kept it, 1 timed out)');
    expect(none).not.toMatch(/median/);
  });
});

// ================================================================== the browser half, on a fake page and a virtual clock

interface Script { titleAtMs?: number | null; gotoMs?: number; navigations?: number; enterLeavesAfterMs?: number; failGoto?: boolean; failLaunch?: boolean }

function fake(script: Script) {
  const calls: string[] = [];
  const clock = { t: 5000 };
  const frame = {};
  let navStart = 0;
  let enterAt: number | null = null;
  let closed = 0;
  let launches = 0;
  const pageHandlers: Record<string, ((a: unknown) => void)[]> = {};
  const cdpHandlers: Record<string, ((a: unknown) => void)[]> = {};
  const on = (store: Record<string, ((a: unknown) => void)[]>) => (event: string, fn: (a: unknown) => void): void => { (store[event] ??= []).push(fn); };
  const page = {
    on: on(pageHandlers),
    mainFrame: () => frame,
    goto: async (_url: string, o: { waitUntil: string }): Promise<void> => {
      calls.push(`goto ${o.waitUntil}`);
      navStart = clock.t;
      if (script.failGoto) throw new Error('net::ERR_CONNECTION_REFUSED');
      clock.t += script.gotoMs ?? 0;
      for (let i = 0; i < (script.navigations ?? 1); i++) for (const h of pageHandlers['framenavigated'] ?? []) h(frame);
      for (const h of cdpHandlers['Network.loadingFinished'] ?? []) h({ encodedDataLength: 1048576 });
    },
    waitForTimeout: async (ms: number): Promise<void> => { clock.t += ms; },
    evaluate: async (fn: { name: string }, arg?: unknown): Promise<unknown> => {
      clock.t += 5;
      switch (fn.name) {
        case 'titleProbe': { const up = script.titleAtMs !== null && script.titleAtMs !== undefined && clock.t - navStart >= script.titleAtMs; return { ready: up, screen: up ? 'title' : null, now: clock.t - navStart }; }
        case 'screenOf': return enterAt !== null && clock.t - enterAt >= (script.enterLeavesAfterMs ?? 300) ? 'chapter-select' : 'title';
        case 'navTiming': return { responseEnd: 80, dcl: 900, load: 1500, 'first-paint': 700 };
        case 'frameTimes': return Array.from({ length: Number(arg) }, (_, i) => i * 16.7);
        default: throw new Error(`unexpected evaluate ${fn.name}`);
      }
    },
    keyboard: { press: async (k: string): Promise<void> => { calls.push(`press ${k}`); enterAt = clock.t; } },
  };
  const cdp = { send: async (m: string, p?: unknown): Promise<void> => { calls.push(p ? `${m} ${JSON.stringify(p)}` : m); }, on: on(cdpHandlers) };
  const launch = async (): Promise<ColdHandle> => {
    launches++;
    calls.push('launch');
    if (script.failLaunch) throw new Error('browserType.launch: Executable doesn\'t exist');
    return { browser: { close: async () => { closed++; } }, page: page as unknown as ColdHandle['page'], cdp: cdp as unknown as ColdHandle['cdp'], version: '999.0.0.0' };
  };
  return { launch, calls, clock, closed: () => closed, launches: () => launches };
}

const PLAIN = profilesFor({ runs: 1, throttle: null })[0]!;
const SLOW = profilesFor({ runs: 1 })[1]!;

describe('one cold load, in the order that makes it cold', () => {
  it('switches the cache off and shapes the network BEFORE the one goto, and does nothing that navigates after it', async () => {
    const f = fake({ titleAtMs: 3000 });
    const rec = await measureCold({ launch: f.launch, base: 'https://echoesofspira.com/', profile: SLOW, now: () => f.clock.t });
    const order = f.calls.map((c) => c.split(' ')[0]);
    expect(order.slice(0, 5)).toEqual(['launch', 'Network.enable', 'Network.setCacheDisabled', 'Network.emulateNetworkConditions', 'goto']);
    expect(f.calls.filter((c) => c.startsWith('goto'))).toEqual(['goto commit']); // one goto, returning at the commit
    expect(f.calls.find((c) => c.startsWith('Network.setCacheDisabled'))).toBe('Network.setCacheDisabled {"cacheDisabled":true}');
    expect(rec.navigations).toBe(1);
    expect(rec.cacheDisabled).toBe(true);
    expect(f.launches()).toBe(1);
    expect(f.closed()).toBe(1);
  });

  it('does not shape the network for an unthrottled run', async () => {
    const f = fake({ titleAtMs: 2000 });
    await measureCold({ launch: f.launch, base: 'https://x/', profile: PLAIN, now: () => f.clock.t });
    expect(f.calls.some((c) => c.startsWith('Network.emulateNetworkConditions'))).toBe(false);
  });

  it('starts the clock BEFORE the goto, so a slow first response is inside the number (the old delivery.mjs started it after the page was ready)', async () => {
    const f = fake({ titleAtMs: 3000, gotoMs: 400 });
    const rec = await measureCold({ launch: f.launch, base: 'https://x/', profile: PLAIN, now: () => f.clock.t });
    expect(rec.wallMsToTitle).toBeGreaterThanOrEqual(3000); // 3000 ms from the navigation, the 400 ms of goto among them
    expect(rec.wallMsToTitle).toBeLessThan(3100);
    expect(rec.pageMsToTitle).toBeGreaterThanOrEqual(3000); // performance.now() in the page also counts from the navigation
    expect(rec.timedOut).toBe(false);
    expect(rec.bytesAtTitle).toBe(1048576);
    expect(rec.requestsAtTitle).toBe(1);
  });

  it('presses Enter on the title and times how long the title takes to move on: a title that is drawn and does not answer is not interactive', async () => {
    const f = fake({ titleAtMs: 2000, enterLeavesAfterMs: 400 });
    const rec = await measureCold({ launch: f.launch, base: 'https://x/', profile: PLAIN, now: () => f.clock.t });
    expect(f.calls).toContain('press Enter');
    expect(rec.enterToNextScreen).toBe('chapter-select');
    expect(rec.enterToNextMs).toBeGreaterThanOrEqual(400);
    expect(rec.enterToNextMs).toBeLessThan(500);
    const dead = fake({ titleAtMs: 2000, enterLeavesAfterMs: 1e9 });
    const stuck = await measureCold({ launch: dead.launch, base: 'https://x/', profile: PLAIN, now: () => dead.clock.t });
    expect(stuck.enterToNextScreen).toBe(false);
    expect(stuck.enterToNextMs).toBeNull();
  });

  it('records a second navigation when there is one, so the run is not mistaken for a cold load', async () => {
    const f = fake({ titleAtMs: 2000, navigations: 2 });
    const rec = await measureCold({ launch: f.launch, base: 'https://x/', profile: PLAIN, now: () => f.clock.t });
    expect(rec.navigations).toBe(2);
    expect(judgeColdRun(rec).protocol).toBe(false);
  });

  it('times out when the title never answers, and says so', async () => {
    const f = fake({ titleAtMs: null });
    const rec = await measureCold({ launch: f.launch, base: 'https://x/', profile: PLAIN, timeoutMs: 2000, now: () => f.clock.t });
    expect(rec.timedOut).toBe(true);
    expect(rec.wallMsToTitle).toBeNull();
    expect(f.calls).not.toContain('press Enter');
    expect(COLD_TIMEOUT_MS).toBe(240000);
  });

  it('closes the browser when the goto throws', async () => {
    const f = fake({ failGoto: true });
    await expect(measureCold({ launch: f.launch, base: 'https://x/', profile: PLAIN, now: () => f.clock.t })).rejects.toThrow(/ERR_CONNECTION_REFUSED/);
    expect(f.closed()).toBe(1);
  });

  it('can sample frame times on the screen it ends on, named, when asked', async () => {
    const f = fake({ titleAtMs: 2000 });
    const rec = await measureCold({ launch: f.launch, base: 'https://x/', profile: PLAIN, frames: 180, now: () => f.clock.t });
    expect(rec.frameTimes).toMatchObject({ screen: 'chapter-select', frames: 180, medianMs: 16.7 });
    const none = fake({ titleAtMs: 2000 });
    expect((await measureCold({ launch: none.launch, base: 'https://x/', profile: PLAIN, now: () => none.clock.t })).frameTimes).toBeUndefined(); // off unless asked
  });
});

describe('a set of cold loads', () => {
  it('runs every profile in a fresh browser of its own, samples the host before each, and summarises', async () => {
    const f = fake({ titleAtMs: 3000 });
    const sampled: string[] = [];
    const { runs, summary } = await runColdLoads({
      launch: f.launch, base: 'https://x/', profiles: profilesFor({ runs: 2 }), now: () => f.clock.t,
      hostSample: async () => { sampled.push(`host@${f.launches()}`); return { cpuBusyPct: 4 }; },
    });
    expect(f.launches()).toBe(3);
    expect(f.closed()).toBe(3);
    expect(sampled).toEqual(['host@0', 'host@1', 'host@2']); // sampled before each browser starts
    expect(runs.map((r) => r.profile)).toEqual(['unthrottled-1', 'unthrottled-2', 'throttled-1.6Mbps-150ms']);
    expect(summary.unthrottled).toMatchObject({ runs: 2, reached: 2 });
    expect(summary.protocolProblems).toEqual([]);
  });

  it('keeps a run that could not start as a run that says so, and goes on with the rest', async () => {
    const f = fake({ failLaunch: true });
    const { runs, summary } = await runColdLoads({ launch: f.launch, base: 'https://x/', profiles: profilesFor({ runs: 2, throttle: null }), now: () => f.clock.t, hostSample: async () => ({ cpuBusyPct: 3 }) });
    expect(runs).toHaveLength(2);
    expect(runs[0]).toMatchObject({ profile: 'unthrottled-1', wallMsToTitle: null, error: expect.stringMatching(/Executable doesn't exist/) });
    expect(summary.protocolProblems).toHaveLength(2);
    expect(summary.unthrottled.reached).toBe(0);
  });
});
