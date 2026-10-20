#!/usr/bin/env node
/**
 * Make the booth's offline copy of the site from the live site's own files, with no build (R61; docs/DEMO-KIT.md).
 *
 *   node tools/demo-kit/fetch-site.mjs [--dir <folder>] [--manifest <file>|live] [--base https://echoesofspira.com/]
 *        [--only <prefix>[,<prefix>...]] [--max-tier 2] [--limit N] [--jobs 6]
 *        [--dry-run] [--verify-only] [--force-space] [--allow-newer]
 *
 * It reads the deploy's artifact manifest (`critic/artifacts/1cea6e937.json`, release 60's: every shipped file's path, bytes and sha256), downloads each file from the live host, and keeps a file only if
 * its bytes hash to the manifest's sha256. A file already in the folder with the right hash is kept, so a second run (or one after a dropped connection) only fetches what is missing; a file that
 * fails its hash is deleted, never kept. Nothing is built, nothing is read from this repository's tree but the manifest.
 *
 * It first asks the live site which build it is (`artifact-manifest.json`) and stops if that is not the manifest's build (`--allow-newer` goes on and fails the files that changed; `--manifest live`
 * takes the live site's own manifest instead). It checks the free space of the drive first and refuses a copy that does not fit (`--force-space` overrides).
 *
 * THE COPY IS BIG: release 60's manifest lists 6,161 files, 10.2 GiB, 4,830 of them under art/characters (the @2x, @3x and @4x masters are 9.9 GiB of it). `--max-tier 2` leaves out the @3x and @4x masters
 * (3.2 GiB left): the engine falls back one tier when a master does not load (`src/engine/ArtTier.ts`), so a 1080p or 1440p booth screen looks the same; a 4K screen would draw a soft figure now and then.
 *
 * Game case: both (tooling).
 */

import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, statfsSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { bytesOf, defaultSiteDir, destPath, formatBytes, selectFiles, urlFor } from './demo-kit-lib.mjs';

export const LIVE_BASE = 'https://echoesofspira.com/';
export const DEFAULT_MANIFEST = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'critic', 'artifacts', '1cea6e937.json');
export const SITE_MARK = '.demo-kit-site.json';
const MARGIN = 512 * 1024 * 1024;
const RETRY_WAIT_MS = [1000, 3000, 9000];

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Does a copy that needs `need` more bytes fit in `free`, with the margin to spare? Unknown free space (null) is a yes; `force` is a yes. Pure. */
export function enoughRoom(free, need, force = false) {
  return force || free === null || free >= need + MARGIN;
}

/** Free bytes on the drive that holds `dir` (the nearest folder that exists), or null where the platform cannot say. */
export function freeBytes(dir) {
  let at = resolve(dir);
  while (!existsSync(at) && dirname(at) !== at) at = dirname(at);
  try {
    const s = statfsSync(at);
    return Number(s.bavail) * Number(s.bsize);
  } catch {
    return null;
  }
}

/** sha256 of a file on disk (streamed), or null when it is not there. */
async function hashFile(file) {
  const { createReadStream } = await import('node:fs');
  const hash = createHash('sha256');
  try {
    for await (const chunk of createReadStream(file)) hash.update(chunk);
  } catch {
    return null;
  }
  return hash.digest('hex');
}

/** One download attempt: the bytes to `<dest>.part`, hashed on the way; resolves `{ sha256, bytes }` or throws. */
async function download(url, part, fetchImpl) {
  const res = await fetchImpl(url, { headers: { Accept: '*/*' }, signal: AbortSignal.timeout(180_000) });
  if (res.status !== 200 || !res.body) throw new Error(`HTTP ${res.status}`);
  mkdirSync(dirname(part), { recursive: true });
  const hash = createHash('sha256');
  const out = createWriteStream(part);
  let bytes = 0;
  try {
    for await (const chunk of res.body) {
      hash.update(chunk);
      bytes += chunk.length;
      if (!out.write(chunk)) await once(out, 'drain');
    }
    await new Promise((ok, bad) => out.end((err) => (err ? bad(err) : ok())));
  } catch (err) {
    out.destroy();
    rmSync(part, { force: true });
    throw err;
  }
  return { sha256: hash.digest('hex'), bytes };
}

/**
 * Fetch (or, with `verifyOnly`, just check) a selection of the manifest's files into `dir`. Returns
 * `{ kept, fetched, failed: [{ path, why }], bytesFetched, selected, complete }`. `fetchImpl` and `log` are injectable for the tests.
 */
export async function fetchSite({ manifest, dir, base = LIVE_BASE, only = [], maxTier = 9, limit = Infinity, jobs = 6, verifyOnly = false, fetchImpl = fetch, log = () => {}, retryWaitMs = RETRY_WAIT_MS }) {
  const all = selectFiles(manifest, {});
  const paths = selectFiles(manifest, { only, maxTier, limit });
  const result = { kept: 0, fetched: 0, failed: [], bytesFetched: 0, selected: paths.length, complete: paths.length === all.length };
  let next = 0;
  let done = 0;
  const startedAt = Date.now();
  let lastLog = 0;
  const tick = () => {
    const now = Date.now();
    if (now - lastLog < 5000 && done < paths.length) return;
    lastLog = now;
    const secs = Math.max(1, (now - startedAt) / 1000);
    log(`${done}/${paths.length} files, ${formatBytes(result.bytesFetched)} fetched (${formatBytes(result.bytesFetched / secs)}/s), ${result.failed.length} failed`);
  };

  async function one(path) {
    const dest = destPath(dir, path);
    const want = manifest.files[path];
    if (!dest) {
      result.failed.push({ path, why: 'the manifest names a path outside the folder' });
      return;
    }
    try {
      if (existsSync(dest) && statSync(dest).size === want.bytes && (await hashFile(dest)) === want.sha256) {
        result.kept++;
        return;
      }
    } catch {
      /* unreadable: fetch it again */
    }
    if (verifyOnly) {
      result.failed.push({ path, why: existsSync(dest) ? 'bytes differ from the manifest' : 'missing' });
      return;
    }
    const url = urlFor(base, path);
    const part = `${dest}.part`;
    let why = 'unknown';
    for (let attempt = 0; attempt <= retryWaitMs.length; attempt++) {
      try {
        const got = await download(url, part, fetchImpl);
        if (got.sha256 === want.sha256 && got.bytes === want.bytes) {
          renameSync(part, dest);
          result.fetched++;
          result.bytesFetched += got.bytes;
          return;
        }
        rmSync(part, { force: true });
        why = `hash differs (${got.bytes} bytes, ${got.sha256.slice(0, 12)}, the manifest says ${want.bytes} bytes, ${want.sha256.slice(0, 12)})`;
      } catch (err) {
        rmSync(part, { force: true });
        why = String(err?.message ?? err);
      }
      if (attempt < retryWaitMs.length) await sleep(retryWaitMs[attempt]);
    }
    result.failed.push({ path, why });
  }

  async function worker() {
    while (next < paths.length) {
      const path = paths[next++];
      await one(path);
      done++;
      tick();
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(jobs, paths.length || 1)) }, worker));
  tick();

  if (!verifyOnly) {
    // The mark says what the folder holds so `start` can warn about a partial copy. A smaller run onto a folder an earlier full run completed (same build) does not take that away.
    const markFile = resolve(dir, SITE_MARK);
    let before = null;
    try {
      before = JSON.parse(readFileSync(markFile, 'utf8'));
    } catch {
      before = null;
    }
    const complete = result.complete && result.failed.length === 0;
    mkdirSync(dir, { recursive: true });
    if (!(before?.complete === true && before.artifactHash === manifest.artifactHash && !complete && result.failed.length === 0)) {
      writeFileSync(markFile, JSON.stringify({ artifactHash: manifest.artifactHash, selected: paths.length, of: all.length, complete, failed: result.failed.length, at: new Date().toISOString() }, null, 1));
    }
  }
  return result;
}

/** The live site's own manifest, or null when it cannot be fetched. */
export async function liveManifest(base = LIVE_BASE, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(`${base.endsWith('/') ? base : `${base}/`}artifact-manifest.json?v=${Date.now()}`, { signal: AbortSignal.timeout(60_000) });
    return res.status === 200 ? JSON.parse(await res.text()) : null;
  } catch {
    return null;
  }
}

async function main(argv) {
  const opt = (name, fallback = null) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
  };
  const flag = (name) => argv.includes(name);
  const dir = resolve(opt('--dir', defaultSiteDir()));
  const base = opt('--base', LIVE_BASE);
  const say = (m) => console.log(m);

  const live = flag('--verify-only') ? null : await liveManifest(base);
  let manifest;
  const manifestArg = opt('--manifest', DEFAULT_MANIFEST);
  if (manifestArg === 'live') {
    if (!live) {
      console.error(`cannot read ${base}artifact-manifest.json`);
      process.exitCode = 4;
      return;
    }
    manifest = live;
  } else {
    manifest = JSON.parse(readFileSync(resolve(manifestArg), 'utf8'));
    if (live && live.artifactHash !== manifest.artifactHash && !flag('--allow-newer')) {
      console.error(`The live site is not the build of ${manifestArg}.\n  manifest: ${manifest.artifactHash}\n  live:     ${live.artifactHash}\nUse --manifest live to copy what is live now, or --allow-newer to try the older manifest anyway.`);
      process.exitCode = 4;
      return;
    }
    if (!live && !flag('--verify-only')) say(`note: could not ask ${base} which build it is; the files are checked against the manifest one by one`);
  }

  const only = (opt('--only', '') ?? '').split(',').filter(Boolean);
  const maxTier = Number(opt('--max-tier', '9'));
  const limit = Number(opt('--limit', 'Infinity'));
  const paths = selectFiles(manifest, { only, maxTier, limit });
  const total = bytesOf(manifest, paths);
  const free = freeBytes(dir);
  say(`${paths.length} of ${selectFiles(manifest, {}).length} files, ${formatBytes(total)}, into ${dir}`);
  say(`free space there: ${free === null ? 'unknown' : formatBytes(free)}`);
  if (flag('--dry-run')) return;
  if (!flag('--verify-only') && !enoughRoom(free, total, flag('--force-space'))) {
    console.error(`Not enough room: the copy needs ${formatBytes(total)} (and ${formatBytes(MARGIN)} to spare) and the drive has ${formatBytes(free)}.\nPick another folder with --dir, or leave out the biggest art with --max-tier 2. (Files already in the folder count against this too; --force-space goes on anyway.)`);
    process.exitCode = 3;
    return;
  }

  const result = await fetchSite({ manifest, dir, base, only, maxTier, limit, jobs: Number(opt('--jobs', '6')), verifyOnly: flag('--verify-only'), log: say });
  say(`${flag('--verify-only') ? 'checked' : 'done'}: ${result.kept} already right, ${result.fetched} fetched (${formatBytes(result.bytesFetched)}), ${result.failed.length} failed of ${result.selected}`);
  for (const f of result.failed.slice(0, 20)) say(`FAILED ${f.path}: ${f.why}`);
  if (result.failed.length > 20) say(`... and ${result.failed.length - 20} more`);
  if (result.failed.length === 0) say(result.complete ? 'The copy is complete and every file matches the manifest.' : 'The files you asked for match the manifest; the copy is PARTIAL (not every file was selected).');
  process.exitCode = result.failed.length === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main(process.argv.slice(2));
