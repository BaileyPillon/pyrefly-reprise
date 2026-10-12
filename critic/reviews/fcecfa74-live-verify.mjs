import { readFileSync, writeFileSync } from 'node:fs';
import { verifyLive, selectForVerification, diffManifests } from 'file:///D:/pyrefly-r40-rc/tools/artifact-manifest.mjs';
const rd = (f) => JSON.parse(readFileSync(f, 'utf8'));
const manifest = rd('D:/pyrefly-r40-rc/critic/artifacts/fcecfa74.json');
const prev = rd('D:/pyrefly-r40-rc/critic/artifacts/2ae1a9e4.json');
const d = diffManifests(prev, manifest);
const url = 'https://echoesofspira.com/';
const bust = String(Date.now());
const paths = selectForVerification(manifest, { changed: [...d.added, ...d.changed], full: true });
console.log('files', paths.length, 'added', d.added.length, 'changed', d.changed.length, 'removed', d.removed?.length);
const cache = new Map();
let i = 0, done = 0;
async function worker() {
  while (i < paths.length) {
    const p = paths[i++];
    const u = `${url}${p}?v=${bust}`;
    for (let a = 0; a < 3; a++) {
      try {
        const r = await fetch(u, { signal: AbortSignal.timeout(60000) });
        const buf = Buffer.from(await r.arrayBuffer());
        cache.set(u, { status: r.status, headers: r.headers, buf });
        break;
      } catch (e) { if (a === 2) cache.set(u, { err: e.message }); }
    }
    if (++done % 500 === 0) console.log('fetched', done);
  }
}
await Promise.all(Array.from({ length: 16 }, worker));
const real = fetch;
const fetchImpl = async (u, opts) => {
  const c = cache.get(u);
  if (c && !opts?.headers) {
    if (c.err) throw new Error(c.err);
    return { status: c.status, headers: c.headers, arrayBuffer: async () => c.buf, text: async () => c.buf.toString('utf8') };
  }
  return real(u, { ...opts, signal: AbortSignal.timeout(60000) });
};
const report = await verifyLive(manifest, url, { changed: [...d.added, ...d.changed], full: true, fetchImpl, bust });
writeFileSync('D:/Tools/pyrefly-scratch/verify-live-result.json', JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1).slice(0, 3000));
