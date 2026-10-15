// Live verification of build ca9fd0b4 (bundle Cg05Z3H_): the stock verifyLive() from tools/artifact-manifest.mjs with --full semantics
// (every shipped file except the host-read _headers, byte for byte, content types, the live manifest, the browser-Accept page twin),
// fed by a 16-way prefetch that runs a bounded window ahead of the sequential consumer. Same wrapper as critic/reviews/d5bf2206-live-verify.mjs
// (D:/pyrefly-r45), re-pointed at this build and the release tree D:/pyrefly-r46: bodies are dropped as soon as verifyLive has hashed them
// (the build ships about 10.8 GB), so nothing large is written to D:.
import { readFileSync, writeFileSync } from 'node:fs';
import { verifyLive, selectForVerification, diffManifests } from 'file:///D:/pyrefly-r46/tools/artifact-manifest.mjs';

const ROOT = 'D:/pyrefly-r46';
const SHA = 'ca9fd0b4';
const PREV = 'd5bf2206';
const rd = (f) => JSON.parse(readFileSync(f, 'utf8'));
const manifest = rd(`${ROOT}/critic/artifacts/${SHA}.json`);
const prev = rd(`${ROOT}/critic/artifacts/${PREV}.json`);
const d = diffManifests(prev, manifest);
const url = 'https://echoesofspira.com/';
const bust = String(Date.now());
const changed = [...d.added, ...d.changed];
const paths = selectForVerification(manifest, { changed, full: true });
console.log(JSON.stringify({ pid: process.pid, files: paths.length, added: d.added.length, changed: d.changed.length, removed: d.removed, bust }));

const WORKERS = 16;
const WINDOW = 48;
const keyOf = (p) => `${url}${p}?v=${bust}`;
const idxOf = new Map(paths.map((p, i) => [keyOf(p), i]));
const pending = new Map();
let nextToFetch = 0;
let consumed = 0;
let inflight = 0;
let bytes = 0;
const t0 = Date.now();
const real = fetch;

async function getWithRetry(u) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await real(u, { signal: AbortSignal.timeout(120000) });
      const buf = Buffer.from(await r.arrayBuffer());
      return { status: r.status, headers: r.headers, buf };
    } catch (e) {
      if (a === 2) return { err: `${e.message}${e.cause ? ` (${e.cause.code ?? e.cause.message})` : ''}` };
    }
  }
}

function pump() {
  while (nextToFetch < paths.length && inflight < WORKERS && nextToFetch - consumed < WINDOW) {
    const u = keyOf(paths[nextToFetch++]);
    inflight++;
    pending.set(u, getWithRetry(u).then((c) => { inflight--; if (c.buf) bytes += c.buf.length; pump(); return c; }));
  }
}

const fetchImpl = async (u, opts) => {
  if (opts?.headers) return real(u, { ...opts, signal: AbortSignal.timeout(120000) });
  if (idxOf.has(u)) {
    let slot = pending.get(u);
    if (!slot) slot = getWithRetry(u); // outside the window (should not happen): fetch it directly
    pending.delete(u);
    const c = await slot;
    consumed++;
    if (consumed % 250 === 0) console.log(`consumed ${consumed}/${paths.length}  ${(bytes / 1048576).toFixed(0)} MB fetched  ${Math.round((Date.now() - t0) / 1000)} s`);
    pump();
    if (c.err) throw new Error(c.err);
    return { status: c.status, headers: c.headers, arrayBuffer: async () => c.buf, text: async () => c.buf.toString('utf8') };
  }
  return real(u, { ...opts, signal: AbortSignal.timeout(120000) });
};

pump();
const report = await verifyLive(manifest, url, { changed, full: true, fetchImpl, bust });
report.run = { files: paths.length, wrapper: `critic/reviews/${SHA}-live-verify.mjs`, workers: WORKERS, window: WINDOW, megabytesFetched: Math.round(bytes / 1048576), seconds: Math.round((Date.now() - t0) / 1000), liveUrl: url, bust, finishedAt: new Date().toISOString() };
writeFileSync(`${ROOT}/critic/artifacts/${SHA}-verify-live.json`, `${JSON.stringify(report, null, 1)}\n`);
console.log(JSON.stringify(report, null, 1).slice(0, 4000));
process.exitCode = report.result === 'PASS' ? 0 : report.result === 'FAIL' ? 1 : 2;
