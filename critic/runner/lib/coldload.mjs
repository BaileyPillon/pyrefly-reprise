// Critic instruments: the cold-load measurement (delivery). The browser half; the rules and the numbers are in coldload-pure.mjs.
//
//   PYREFLY_BROWSER=gpu node critic/runner/lib/coldload.mjs --base=<url> --evidence=<dir> [--size=1600x900] [--runs=3] [--throttle=1.6,0.75,150|off] [--frames=0]
//
// Promoted from the round-25 chief's `coldload.mjs` by lane r43-critic-tools, PR-0450 (a): the capture owner's `delivery.mjs` loaded the page twice and started its clock after
// `__pyreflyReady`, so the first load was not timed (R25-PD-01). Each run is its own headless Chromium (nothing visited before), its HTTP cache switched off over CDP BEFORE the
// navigation, ONE `goto` that returns at the commit, the clock started before that `goto`, and READY meaning the title screen is up with the debug API ready; then the first Enter
// must move the title on. Run it ALONE: the host's CPU is sampled before every run and a busy host is written into the run and the report line. Real CDP, real Chromium, from node
// (never the Claude-in-Chrome extension or the in-app pane).
//
// Writes `<evidence>/gaps/coldload/out.json` (every run, the summary, the conditions, the report line) and prints the report line last. Game case: both (shared critic plumbing).
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { currentChromiumArgs, resolveBrowserMode } from '../../../tools/browser-mode.mjs';
import { parseArgs, requireBase, requireEvidence } from './cli.mjs';
import { COLD_TIMEOUT_MS, HOST_SAMPLE_MS, coldLoadReportLine, cpuBusyPct, frameStats, parseThrottle, profilesFor, summarizeColdLoads } from './coldload-pure.mjs';

// Run in the page (page.evaluate): self-contained, browser globals only.
const titleProbe = () => ({ ready: window.__pyreflyReady === true, screen: window.__pyrefly?.screen?.() ?? null, now: performance.now() });
const screenOf = () => window.__pyrefly.screen();
const navTiming = () => {
  const n = performance.getEntriesByType('navigation')[0];
  const p = Object.fromEntries(performance.getEntriesByType('paint').map((x) => [x.name, Math.round(x.startTime)]));
  return { responseEnd: n ? Math.round(n.responseEnd) : null, dcl: n ? Math.round(n.domContentLoadedEventEnd) : null, load: n ? Math.round(n.loadEventEnd) : null, ...p };
};
const frameTimes = (count) => new Promise((resolve) => {
  const ts = [];
  const step = (t) => { ts.push(t); if (ts.length < count) requestAnimationFrame(step); else resolve(ts); };
  requestAnimationFrame(step);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The host's CPU busy percent over `ms`, from two `os.cpus()` snapshots. null if the platform will not say. */
export async function sampleHost(ms = HOST_SAMPLE_MS) {
  try {
    const before = os.cpus();
    await sleep(ms);
    return { cpuBusyPct: cpuBusyPct(before, os.cpus()), sampledMs: ms };
  } catch {
    return { cpuBusyPct: null, sampledMs: ms };
  }
}

/** The real browser: a fresh Chromium, a fresh context, one page and a CDP session on it, in the order the chief's run used. */
export async function launchChromium({ width = 1600, height = 900 } = {}) {
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  return { browser, page, cdp, version: typeof browser.version === 'function' ? browser.version() : null };
}

/**
 * One cold load. `launch()` gives `{ browser, page, cdp }` (injected so a test can drive it with a fake and read the order of the calls).
 * The order is the instrument: the cache is switched off and the network shaped BEFORE the clock starts, the clock starts BEFORE the one `goto`, and nothing navigates after it.
 */
export async function measureCold({ launch, base, profile, timeoutMs = COLD_TIMEOUT_MS, pressEnter = true, frames = 0, host = null, now = Date.now }) {
  const { browser, page, cdp, version } = await launch();
  const rec = { profile: profile.name, throttled: profile.throttled, browserVersion: version ?? null, host };
  try {
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    rec.cacheDisabled = true; // written only once the browser accepted it
    if (profile.net) await cdp.send('Network.emulateNetworkConditions', profile.net);
    let bytes = 0, requests = 0, errors = 0, navigations = 0, fromCache = 0;
    cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; requests++; });
    cdp.on('Network.requestServedFromCache', () => { fromCache++; });
    page.on('pageerror', () => { errors++; });
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) navigations++; });

    const tNav = now();
    await page.goto(base, { waitUntil: 'commit' });
    const deadline = tNav + timeoutMs;
    let title = null;
    while (now() < deadline) {
      const r = await page.evaluate(titleProbe).catch(() => null);
      if (r && r.ready && r.screen === 'title') { title = r; rec.bytesAtTitle = bytes; rec.requestsAtTitle = requests; break; }
      await page.waitForTimeout(50);
    }
    rec.wallMsToTitle = title ? now() - tNav : null;
    rec.pageMsToTitle = title ? Math.round(title.now) : null; // performance.now() in the page counts from navigation start too
    rec.timedOut = !title;
    rec.paint = await page.evaluate(navTiming).catch(() => null);

    // Does the title answer its first key? A title that is drawn and does not move on is not interactive.
    if (title && pressEnter) {
      const t1 = now();
      await page.keyboard.press('Enter');
      let moved = false;
      for (let i = 0; i < 400; i++) {
        const s = await page.evaluate(screenOf).catch(() => null);
        if (s && s !== 'title') { moved = s; break; }
        await page.waitForTimeout(50);
      }
      rec.enterToNextScreen = moved; rec.enterToNextMs = moved ? now() - t1 : null;
      await page.waitForTimeout(profile.net ? 4000 : 2500);
      rec.bytesAfterSettle = bytes; rec.requestsAfterSettle = requests;
    }
    // Frame times on whatever screen the run is on now (named), when asked: 180 frames is three seconds at 60 fps.
    if (title && frames > 0) {
      const ts = await page.evaluate(frameTimes, frames).catch(() => null);
      rec.frameTimes = ts ? { screen: await page.evaluate(screenOf).catch(() => null), ...frameStats(ts) } : null;
    }
    rec.navigations = navigations;
    rec.servedFromCache = fromCache; // told, not judged: the in-memory cache can answer a repeat within one page load
    rec.pageErrors = errors;
  } finally {
    try { await browser.close(); } catch { /* closed */ }
  }
  return rec;
}

/** Every profile, one fresh browser each, the host sampled before each; returns the runs and the summary. */
export async function runColdLoads({ launch, base, profiles, hostSample = sampleHost, log = () => undefined, ...rest }) {
  const runs = [];
  for (const profile of profiles) {
    const host = await hostSample();
    let rec;
    try {
      rec = await measureCold({ launch, base, profile, host, ...rest });
    } catch (e) {
      // a browser that would not start or died mid-run is a run that says so (and breaks the protocol in the summary), never a run that vanishes
      rec = { profile: profile.name, throttled: profile.throttled, host, wallMsToTitle: null, error: String(e && e.message ? e.message : e).slice(0, 300) };
    }
    runs.push(rec);
    log(JSON.stringify(rec));
  }
  return { runs, summary: summarizeColdLoads(runs) };
}

async function main(argv) {
  const args = parseArgs(argv);
  const base = requireBase(args);
  const evidence = path.resolve(requireEvidence(args));
  const [width, height] = String(args.size ?? '1600x900').split('x').map(Number);
  const profiles = profilesFor({ runs: Number(args.runs ?? 3), throttle: parseThrottle(args.throttle) });
  const mode = resolveBrowserMode();
  let version = null;
  const launch = async () => { const h = await launchChromium({ width, height }); version = h.version; return h; };
  const { runs, summary } = await runColdLoads({ launch, base, profiles, frames: Number(args.frames ?? 0), log: (l) => console.log(l) });
  const cpus = os.cpus();
  const machine = `${os.platform()} ${os.release()}, ${cpus[0]?.model?.replace(/\s+/g, ' ').trim() ?? 'cpu unknown'} x${cpus.length}, ${Math.round(os.totalmem() / 2 ** 30)} GB RAM`;
  const viewport = `${width}x${height}`;
  const reportLine = coldLoadReportLine(summary, { base, mode, viewport, browser: version ? `Chromium ${version}` : 'Chromium', machine });
  const dir = path.join(evidence, 'gaps', 'coldload');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'out.json'), JSON.stringify({ schema: 'coldload/1', base, mode, viewport, browser: version, machine, profiles: profiles.map((p) => p.name), runs, summary, reportLine, date: new Date().toISOString() }, null, 1));
  console.log(`REPORT LINE: ${reportLine}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(() => process.exit(0), (e) => { console.error(String(e && e.stack ? e.stack : e)); process.exit(1); });
}
