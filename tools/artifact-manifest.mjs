#!/usr/bin/env node
/**
 * The identity of a build, and proof that the live site serves exactly it.
 *
 * Matching the JavaScript bundle's file name says nothing about the painted
 * art and the audio, which ship separately (public/art is not even in git).
 * So a build's identity is a manifest of EVERY shipped file: path, bytes and
 * sha256, plus one `artifactHash` over the whole list. The deploy publishes
 * the manifest beside the game as `artifact-manifest.json`; live verification
 * (critic check CHK-017) downloads files from the real URL and compares their
 * bytes. An HTTP 200 proves nothing; identical bytes to a candidate whose
 * media decoded (CHK-019) proves the player gets a working file.
 *
 *   node tools/artifact-manifest.mjs build --dir dist-release [--out <file>] [--no-decode]
 *   node tools/artifact-manifest.mjs diff <previous.json> <next.json>
 *   node tools/artifact-manifest.mjs verify-live --manifest <file> --url <base url>
 *        [--changed-from <previous.json>] [--sample 40] [--full] [--out <report.json>]
 *
 * Results are PASS, FAIL or UNVERIFIED. Anything that could not be checked is
 * UNVERIFIED, never PASS: a live site with no manifest, a file that would not
 * download, audio with no decoder available.
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const MANIFEST_NAME = 'artifact-manifest.json';
const IMAGE = new Set(['.png', '.webp', '.jpg', '.jpeg']);
const AUDIO = new Set(['.mp3', '.ogg', '.wav']);
const TYPE_FAMILY = {
  '.html': 'text/html', '.js': 'javascript', '.css': 'text/css', '.json': 'json', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp3': 'audio/', '.ogg': 'audio/', '.wav': 'audio/', '.woff2': 'font', '.woff': 'font', '.svg': 'image/svg',
};
const FFPROBE = process.env.PYREFLY_FFPROBE ?? 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffprobe.exe';

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function walk(dir, root = dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, root, out);
    else out.push(relative(root, p).replace(/\\/g, '/'));
  }
  return out;
}

/** One hash over the sorted `path<TAB>sha256` lines; the manifest file itself is left out. */
export function artifactHashOf(files) {
  const lines = Object.keys(files).filter((p) => p !== MANIFEST_NAME).sort().map((p) => `${p}\t${files[p].sha256}\n`);
  return sha256(lines.join(''));
}

/** Does this media file decode, and is it something other than a blank frame? */
async function decodeStatus(path, ext) {
  if (IMAGE.has(ext)) {
    try {
      const sharp = (await import('sharp')).default;
      const stats = await sharp(path).stats();
      const blank = stats.channels.slice(0, 3).every((c) => c.max === c.min);
      return blank ? 'blank' : 'ok';
    } catch {
      return 'failed';
    }
  }
  if (AUDIO.has(ext)) {
    if (!existsSync(FFPROBE)) return 'UNVERIFIED';
    const r = spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], { encoding: 'utf8' });
    const seconds = Number.parseFloat(r.stdout);
    return r.status === 0 && Number.isFinite(seconds) && seconds > 0 ? 'ok' : 'failed';
  }
  return undefined;
}

/** Hash (and by default decode-check) every file under `dir`. */
export async function buildManifest(dir, { decode = true } = {}) {
  const root = resolve(dir);
  const files = {};
  const problems = [];
  for (const rel of walk(root).sort()) {
    if (rel === MANIFEST_NAME) continue;
    const full = join(root, rel);
    const buf = readFileSync(full);
    const entry = { sha256: sha256(buf), bytes: buf.length };
    if (buf.length === 0 && rel !== '.nojekyll') problems.push(`${rel}: empty file`);
    if (decode) {
      const status = await decodeStatus(full, extname(rel).toLowerCase());
      if (status) entry.decode = status;
      if (status === 'failed' || status === 'blank') problems.push(`${rel}: ${status === 'blank' ? 'decodes to a single flat colour' : 'does not decode'}`);
    }
    files[rel] = entry;
  }
  const audioUnverified = Object.values(files).filter((f) => f.decode === 'UNVERIFIED').length;
  return {
    manifestVersion: 1, count: Object.keys(files).length, totalBytes: Object.values(files).reduce((n, f) => n + f.bytes, 0),
    artifactHash: artifactHashOf(files), decodeChecked: decode, audioUnverified, problems, files,
  };
}

/** Paths added, changed or removed between two manifests. */
export function diffManifests(previous, next) {
  const a = previous?.files ?? {}, b = next.files;
  const added = [], changed = [], removed = [];
  for (const p of Object.keys(b)) {
    if (!a[p]) added.push(p);
    else if (a[p].sha256 !== b[p].sha256) changed.push(p);
  }
  for (const p of Object.keys(a)) if (!b[p]) removed.push(p);
  return { added, changed, removed };
}

/**
 * Shipped paths as the repo-relative paths the review planner understands:
 * the build copies `public/**` to the site root, and everything the bundler
 * emits under `assets/` comes from tracked source that git already reports.
 */
export function shippedToRepoPaths(paths) {
  return paths.filter((p) => !p.startsWith('assets/') && p !== 'index.html' && p !== '.nojekyll').map((p) => `public/${p}`);
}

/** What to download: the page, all code, everything that changed, and an even sample of the rest. */
export function selectForVerification(manifest, { changed = [], sample = 40, full = false } = {}) {
  const all = Object.keys(manifest.files).sort();
  if (full) return all;
  const picked = new Set(all.filter((p) => p === 'index.html' || p.startsWith('assets/')));
  for (const p of changed) if (manifest.files[p]) picked.add(p);
  const rest = all.filter((p) => !picked.has(p));
  const step = Math.max(1, Math.floor(rest.length / Math.max(1, sample)));
  for (let i = 0; i < rest.length && sample > 0; i += step) picked.add(rest[i]);
  return [...picked].sort();
}

/**
 * Download from the real URL and compare bytes with the manifest.
 * PASS: the live manifest names this artifact and every selected file matched.
 * FAIL: a file differs, is missing, or has the wrong content type.
 * UNVERIFIED: the live site publishes no manifest, or something would not download.
 */
export async function verifyLive(manifest, baseUrl, { changed = [], sample = 40, full = false, fetchImpl = fetch, bust = String(Date.now()) } = {}) {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const out = { result: 'UNVERIFIED', artifactHash: manifest.artifactHash, liveManifest: 'missing', checked: 0, mismatched: [], missing: [], wrongType: [], errors: [], notes: [] };
  try {
    const res = await fetchImpl(`${base}${MANIFEST_NAME}?v=${bust}`);
    if (res.status === 200) {
      const live = JSON.parse(await res.text());
      out.liveManifest = live.artifactHash === manifest.artifactHash ? 'match' : 'mismatch';
    } else out.notes.push(`${MANIFEST_NAME} returned ${res.status}`);
  } catch (err) {
    out.errors.push(`${MANIFEST_NAME}: ${err.message}`);
  }
  for (const path of selectForVerification(manifest, { changed, sample, full })) {
    try {
      const res = await fetchImpl(`${base}${path}?v=${bust}`);
      if (res.status !== 200) { out.missing.push(`${path} (${res.status})`); continue; }
      const family = TYPE_FAMILY[extname(path).toLowerCase()];
      const type = res.headers.get('content-type') ?? '';
      if (family && !type.includes(family)) out.wrongType.push(`${path} (${type || 'no content-type'})`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (sha256(buf) !== manifest.files[path].sha256) out.mismatched.push(path);
      out.checked++;
    } catch (err) {
      out.errors.push(`${path}: ${err.message}`);
    }
  }
  if (out.mismatched.length || out.missing.length || out.wrongType.length || out.liveManifest === 'mismatch') out.result = 'FAIL';
  else if (out.errors.length || out.liveManifest !== 'match' || out.checked === 0) out.result = 'UNVERIFIED';
  else out.result = 'PASS';
  if (out.result === 'UNVERIFIED' && out.liveManifest === 'missing') out.notes.push('the live site publishes no artifact manifest, so its identity cannot be established');
  return out;
}

async function main(argv) {
  const [command, ...rest] = argv;
  const opt = (name, fallback = null) => { const i = rest.indexOf(name); return i >= 0 && rest[i + 1] ? rest[i + 1] : fallback; };
  const read = (f) => JSON.parse(readFileSync(resolve(f), 'utf8'));
  if (command === 'build') {
    const dir = opt('--dir', 'dist-release');
    const manifest = await buildManifest(dir, { decode: !rest.includes('--no-decode') });
    const out = resolve(opt('--out', join(dir, MANIFEST_NAME)));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(manifest)}\n`);
    console.log(`${manifest.count} files, ${(manifest.totalBytes / 1048576).toFixed(1)} MB, artifact ${manifest.artifactHash.slice(0, 16)} -> ${out}`);
    for (const p of manifest.problems) console.log(`PROBLEM ${p}`);
    if (manifest.audioUnverified) console.log(`UNVERIFIED ${manifest.audioUnverified} audio file(s): no ffprobe at ${FFPROBE}`);
    process.exitCode = manifest.problems.length ? 1 : 0;
  } else if (command === 'diff') {
    const d = diffManifests(read(rest[0]), read(rest[1]));
    console.log(JSON.stringify({ ...d, repoPaths: shippedToRepoPaths([...d.added, ...d.changed, ...d.removed]) }, null, 1));
  } else if (command === 'verify-live') {
    const manifest = read(opt('--manifest'));
    const previous = opt('--changed-from');
    const d = previous ? diffManifests(read(previous), manifest) : { added: [], changed: [] };
    const report = await verifyLive(manifest, opt('--url'), { changed: [...d.added, ...d.changed], sample: Number(opt('--sample', '40')), full: rest.includes('--full') });
    if (opt('--out')) writeFileSync(resolve(opt('--out')), `${JSON.stringify(report, null, 1)}\n`);
    console.log(JSON.stringify(report, null, 1));
    process.exitCode = report.result === 'PASS' ? 0 : report.result === 'FAIL' ? 1 : 2;
  } else {
    console.log('usage: artifact-manifest.mjs build|diff|verify-live (see the header of this file)');
    process.exitCode = 64;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
