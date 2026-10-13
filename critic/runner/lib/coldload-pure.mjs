// Critic instruments: the cold-load measurement, the judging half (delivery: "measured loading ... on NAMED hardware, browser, network and cache conditions").
//
// Promoted from the round-25 chief's `coldload.mjs` by lane r43-critic-tools, PR-0450 (a). Round 25's `delivery.mjs` (R25-PD-01) loaded the page twice, so the number it
// reported was a warm second load, and started its clock after `__pyreflyReady`, so the first load was not timed at all. A cold load, as this instrument defines it:
//
//   - ONE navigation in a FRESH browser (nothing visited before, the page never reloaded): the run says how many times the main frame navigated, and a run that says more than one
//     is not a cold load;
//   - the HTTP cache DISABLED before the navigation starts (CDP `Network.setCacheDisabled`), so a warm disk cache cannot answer for the network;
//   - the clock STARTS at the navigation (before `goto`), and `pageMsToTitle` is the page's own `performance.now()`, which also counts from navigation start; the two agree to
//     within the browser's start-up, and both are kept;
//   - READY means `__pyreflyReady` is true AND the screen is the title AND (when asked) the first key moves it on: a title that is drawn and does not answer is not interactive;
//   - RUN ALONE: the host's CPU is sampled just before every run and the run says when the host was busy, so a number taken beside other browsers is named as such.
//
// Everything below is pure (numbers and records in, numbers and strings out) and held by tests/unit/critic-instruments-coldload.test.ts. The browser half is coldload.mjs.
// Game case: both (shared critic plumbing; the title and the first load are the same in FFX and FFX-2).

/** How long a run waits for an interactive title before it is a timeout (a finding, not a harness failure). */
export const COLD_TIMEOUT_MS = 240000;

/** A host busier than this (percent of all cores, sampled over `HOST_SAMPLE_MS`) is named as loaded in the run and the report line. */
export const HOST_BUSY_PCT = 40;
export const HOST_SAMPLE_MS = 1000;

/** The throttled profile the round-25 chief used: 1.6 Mbps down, 0.75 Mbps up, 150 ms of latency (CDP wants bytes per second). */
export const THROTTLE_DEFAULT = Object.freeze({ downMbps: 1.6, upMbps: 0.75, latencyMs: 150 });

/**
 * The runs of one measurement: `unthrottled` cold loads (default 3, so there is a median) and, unless switched off, one throttled load.
 * @returns {Array<{ name: string, throttled: boolean, net: null | { offline: boolean, latency: number, downloadThroughput: number, uploadThroughput: number } }>}
 */
export function profilesFor({ runs = 3, throttle = THROTTLE_DEFAULT } = {}) {
  const out = [];
  for (let i = 1; i <= Math.max(1, Math.floor(runs)); i++) out.push({ name: `unthrottled-${i}`, throttled: false, net: null });
  if (throttle) {
    const t = { ...THROTTLE_DEFAULT, ...throttle };
    out.push({ name: `throttled-${t.downMbps}Mbps-${t.latencyMs}ms`, throttled: true, net: { offline: false, latency: t.latencyMs, downloadThroughput: Math.round((t.downMbps * 1e6) / 8), uploadThroughput: Math.round((t.upMbps * 1e6) / 8) } });
  }
  return out;
}

/** Parses `--throttle=1.6,0.75,150` (down Mbps, up Mbps, latency ms), `--throttle=off`, or nothing (the default profile). Throws on anything else. */
export function parseThrottle(arg) {
  if (arg === undefined || arg === true || arg === '') return THROTTLE_DEFAULT;
  if (String(arg).toLowerCase() === 'off') return null;
  const p = String(arg).split(',').map(Number);
  if (p.length !== 3 || p.some((v) => !Number.isFinite(v) || v <= 0)) throw new Error(`--throttle wants "down Mbps,up Mbps,latency ms" (for example 1.6,0.75,150) or "off", got "${arg}"`);
  return { downMbps: p[0], upMbps: p[1], latencyMs: p[2] };
}

export function medianOf(values) {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const h = v.length >> 1;
  return v.length % 2 ? v[h] : Math.round(((v[h - 1] + v[h]) / 2) * 10) / 10;
}

/**
 * What a run has to say for its number to be a cold-load number: one navigation, the cache off. A run that timed out is a result (the title never answered), not a protocol failure.
 * @param {{ navigations?: number, cacheDisabled?: boolean, timedOut?: boolean, error?: string }} rec
 */
export function judgeColdRun(rec) {
  const problems = [];
  if (rec.error) problems.push(`the run failed before it could be timed: ${rec.error}`);
  else if (rec.navigations !== 1) problems.push(`the main frame navigated ${rec.navigations ?? 'an unknown number of'} times (a cold load is one navigation)`);
  if (!rec.error && rec.cacheDisabled !== true) problems.push('the HTTP cache was not switched off before the navigation');
  return { protocol: problems.length === 0, problems, reachedTitle: rec.timedOut !== true && Number.isFinite(rec.wallMsToTitle) };
}

/** CPU busy percent between two `os.cpus()` snapshots (each core's times: user, nice, sys, irq, idle), over all cores. null when the snapshots cannot be compared. */
export function cpuBusyPct(before, after) {
  if (!Array.isArray(before) || !Array.isArray(after) || before.length !== after.length || !before.length) return null;
  let idle = 0, total = 0;
  for (let i = 0; i < before.length; i++) {
    const a = before[i].times, b = after[i].times;
    const di = b.idle - a.idle;
    const dt = (b.user - a.user) + (b.nice - a.nice) + (b.sys - a.sys) + (b.irq - a.irq) + di;
    idle += di; total += dt;
  }
  if (total <= 0) return null;
  return Math.round((1 - idle / total) * 1000) / 10;
}

/** Frame times (ms between requestAnimationFrame callbacks) from the raw timestamps: how many frames, the median, the 95th percentile, the worst. */
export function frameStats(timestamps) {
  const d = [];
  for (let i = 1; i < timestamps.length; i++) d.push(timestamps[i] - timestamps[i - 1]);
  d.sort((a, b) => a - b);
  if (!d.length) return { frames: timestamps.length, medianMs: null, p95Ms: null, maxMs: null };
  const r2 = (v) => Math.round(v * 100) / 100;
  return { frames: timestamps.length, medianMs: r2(d[d.length >> 1]), p95Ms: r2(d[Math.min(d.length - 1, Math.floor(d.length * 0.95))]), maxMs: r2(d[d.length - 1]) };
}

/**
 * The run set's answer: the median and range of the unthrottled cold loads, each throttled load, which runs broke the protocol and which ran on a busy host.
 * @param {Array<{ profile: string, throttled: boolean, wallMsToTitle: number | null, pageMsToTitle?: number | null, bytesAtTitle?: number, requestsAtTitle?: number, navigations?: number, cacheDisabled?: boolean, timedOut?: boolean, host?: { cpuBusyPct: number | null } }>} runs
 */
export function summarizeColdLoads(runs, { busyPct = HOST_BUSY_PCT } = {}) {
  const judged = runs.map((r) => ({ r, j: judgeColdRun(r) }));
  const plain = judged.filter(({ r, j }) => !r.throttled && j.protocol);
  const reached = plain.filter(({ j }) => j.reachedTitle).map(({ r }) => r);
  const wall = reached.map((r) => r.wallMsToTitle);
  return {
    runs: runs.length,
    unthrottled: {
      runs: plain.length, reached: reached.length, timedOut: plain.length - reached.length,
      medianMs: medianOf(wall), minMs: wall.length ? Math.min(...wall) : null, maxMs: wall.length ? Math.max(...wall) : null,
      medianPageMs: medianOf(reached.map((r) => r.pageMsToTitle)), medianBytesAtTitle: medianOf(reached.map((r) => r.bytesAtTitle)), medianRequestsAtTitle: medianOf(reached.map((r) => r.requestsAtTitle)),
    },
    throttled: judged.filter(({ r }) => r.throttled).map(({ r, j }) => ({ profile: r.profile, protocol: j.protocol, reachedTitle: j.reachedTitle, wallMsToTitle: r.wallMsToTitle ?? null, bytesAtTitle: r.bytesAtTitle ?? null })),
    protocolProblems: judged.filter(({ j }) => !j.protocol).map(({ r, j }) => ({ profile: r.profile, problems: j.problems })),
    busyHost: runs.filter((r) => r.host && r.host.cpuBusyPct !== null && r.host.cpuBusyPct > busyPct).map((r) => ({ profile: r.profile, cpuBusyPct: r.host.cpuBusyPct })),
    hostUnread: runs.filter((r) => !r.host || r.host.cpuBusyPct === null).map((r) => r.profile),
  };
}

const sec = (ms) => (ms === null || ms === undefined ? 'not reached' : `${(ms / 1000).toFixed(1)} s`);
const mb = (b) => (b === null || b === undefined ? 'bytes not read' : `${(b / 1048576).toFixed(1)} MB`);

/**
 * The line a report carries for the instrument. `ctx` names the conditions the rubric asks for: `{ base, mode, viewport, browser, machine }`.
 * The unthrottled number is the MEDIAN of the cold loads that kept the protocol; a run set with none says so instead of printing a number.
 */
export function coldLoadReportLine(summary, ctx = {}) {
  const u = summary.unthrottled;
  const lead = u.reached > 0
    ? `cold load to an interactive title ${sec(u.medianMs)} median (${sec(u.minMs)} to ${sec(u.maxMs)}, ${u.reached} of ${u.runs} cold run(s), ${mb(u.medianBytesAtTitle)} and ${u.medianRequestsAtTitle ?? '?'} requests by then)`
    : `cold load: NO unthrottled run reached an interactive title with the protocol kept (${u.runs} kept it, ${u.timedOut} timed out)`;
  const t = summary.throttled.map((x) => `${x.profile} ${x.protocol ? sec(x.wallMsToTitle) : 'protocol broken'}`).join(', ');
  const host = summary.busyHost.length ? `; HOST BUSY on ${summary.busyHost.map((b) => `${b.profile} (${b.cpuBusyPct}% CPU)`).join(', ')}: not an idle-host number` : summary.hostUnread.length ? `; host load not read on ${summary.hostUnread.join(', ')}` : '; host idle before every run';
  const bad = summary.protocolProblems.length ? `; PROTOCOL BROKEN on ${summary.protocolProblems.map((p) => p.profile).join(', ')} (${summary.protocolProblems[0].problems[0]})` : '';
  const where = [ctx.base, ctx.mode && `${ctx.mode} rendering`, ctx.viewport, ctx.browser, ctx.machine].filter(Boolean).join(', ');
  return `cold load (delivery, one navigation, cache off, timed from navigation start): ${lead}${t ? `; ${t}` : ''}${host}${bad}${where ? ` [${where}]` : ''}`;
}
