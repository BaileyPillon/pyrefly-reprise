/**
 * `tools/artifact-manifest.mjs` — the identity of a build and proof that a URL
 * serves exactly it (critic checks CHK-017 and CHK-019, policy v2).
 *
 * The bundle's file name says nothing about art and audio, and an HTTP 200
 * says nothing about the bytes. So: every shipped file is hashed, media must
 * decode to something other than one flat colour, and "live verification"
 * downloads from a real HTTP server and compares bytes. Anything that could
 * not be checked is UNVERIFIED, never PASS.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MANIFEST_NAME,
  buildManifest,
  diffManifests,
  selectForVerification,
  shippedToRepoPaths,
  verifyLive,
} from '../../tools/artifact-manifest.mjs';

const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
let dir = '';
let server: Server | null = null;
/** Per-test overrides: a path mapped to different bytes, a wrong content type, or a 404. */
let tamper: Record<string, { body?: Buffer; type?: string; status?: number }> = {};

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'pyrefly-artifact-'));
  mkdirSync(join(dir, 'assets'));
  mkdirSync(join(dir, 'art'));
  writeFileSync(join(dir, 'index.html'), '<script src="assets/index-Abc123.js"></script>');
  writeFileSync(join(dir, 'assets', 'index-Abc123.js'), 'console.log("game")');
  const gradient = Buffer.from(Array.from({ length: 8 * 8 * 3 }, (_, i) => (i * 7) % 256));
  await sharp(gradient, { raw: { width: 8, height: 8, channels: 3 } }).png().toFile(join(dir, 'art', 'tidus.png'));
  tamper = {};
});

afterEach(async () => {
  if (server) await new Promise((done) => server?.close(done));
  server = null;
  rmSync(dir, { recursive: true, force: true });
});

async function serve(): Promise<string> {
  server = createServer((req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '').replace(/^\//, '');
    const t = tamper[path];
    const file = join(dir, path);
    if (t?.status || !existsSync(file)) { res.writeHead(t?.status ?? 404).end(); return; }
    res.writeHead(200, { 'content-type': t?.type ?? TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(t?.body ?? readFileSync(file));
  });
  await new Promise<void>((done) => server?.listen(0, '127.0.0.1', done));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
}

describe('buildManifest', () => {
  it('hashes every shipped file and one artifact hash changes when any byte of art changes', async () => {
    const a = await buildManifest(dir);
    expect(Object.keys(a.files).sort()).toEqual(['art/tidus.png', 'assets/index-Abc123.js', 'index.html']);
    expect(a.files['art/tidus.png']?.decode).toBe('ok');
    expect(a.problems).toEqual([]);
    writeFileSync(join(dir, 'art', 'tidus.png'), readFileSync(join(dir, 'art', 'tidus.png')).subarray(0, 40));
    const b = await buildManifest(dir);
    expect(b.artifactHash).not.toBe(a.artifactHash);
    expect(b.files['assets/index-Abc123.js']?.sha256).toBe(a.files['assets/index-Abc123.js']?.sha256);
    expect(diffManifests(a, b)).toEqual({ added: [], changed: ['art/tidus.png'], removed: [] });
  });

  it('a file that does not decode, or decodes to one flat colour, is a problem, never a pass', async () => {
    writeFileSync(join(dir, 'art', 'broken.png'), 'not a png');
    await sharp({ create: { width: 8, height: 8, channels: 3, background: '#000000' } }).png().toFile(join(dir, 'art', 'black.png'));
    const m = await buildManifest(dir);
    expect(m.files['art/broken.png']?.decode).toBe('failed');
    expect(m.files['art/black.png']?.decode).toBe('blank');
    expect(m.problems).toHaveLength(2);
  });

  it('maps shipped media back to the repo paths the review planner classifies', () => {
    expect(shippedToRepoPaths(['art/tidus.png', 'audio/music/title.mp3', 'assets/index-Abc123.js', 'index.html']))
      .toEqual(['public/art/tidus.png', 'public/audio/music/title.mp3']);
  });

  it('always verifies the page, all code and every changed file, and samples the rest', () => {
    const files = Object.fromEntries(['index.html', 'assets/a.js', ...Array.from({ length: 100 }, (_, i) => `art/${String(i).padStart(3, '0')}.png`)].map((p) => [p, {}]));
    const picked = selectForVerification({ files }, { changed: ['art/077.png'], sample: 10 });
    expect(picked).toEqual(expect.arrayContaining(['index.html', 'assets/a.js', 'art/077.png']));
    expect(picked.length).toBeLessThan(20);
    expect(selectForVerification({ files }, { full: true })).toHaveLength(102);
  });
});

describe('verifyLive', () => {
  it('PASS when the URL publishes this manifest and serves identical bytes', async () => {
    const manifest = await buildManifest(dir);
    writeFileSync(join(dir, MANIFEST_NAME), JSON.stringify(manifest));
    const r = await verifyLive(manifest, await serve(), { full: true });
    expect(r).toMatchObject({ result: 'PASS', liveManifest: 'match', checked: 3, mismatched: [], missing: [] });
  });

  it('FAIL when one art file differs although the page and the bundle name are identical', async () => {
    const manifest = await buildManifest(dir);
    writeFileSync(join(dir, MANIFEST_NAME), JSON.stringify(manifest));
    tamper['art/tidus.png'] = { body: Buffer.from('stale cached painting') };
    const r = await verifyLive(manifest, await serve(), { full: true });
    expect(r.result).toBe('FAIL');
    expect(r.mismatched).toEqual(['art/tidus.png']);
  });

  it('FAIL on a missing file and on a 200 with the wrong content type', async () => {
    const manifest = await buildManifest(dir);
    writeFileSync(join(dir, MANIFEST_NAME), JSON.stringify(manifest));
    tamper['art/tidus.png'] = { type: 'text/html' };
    tamper['assets/index-Abc123.js'] = { status: 404 };
    const r = await verifyLive(manifest, await serve(), { full: true });
    expect(r.result).toBe('FAIL');
    expect(r.wrongType[0]).toMatch(/tidus\.png/);
    expect(r.missing[0]).toMatch(/index-Abc123\.js \(404\)/);
  });

  it('UNVERIFIED, not PASS, when the live site publishes no manifest even though every sampled byte matches', async () => {
    const manifest = await buildManifest(dir);
    const r = await verifyLive(manifest, await serve(), { full: true });
    expect(r.result).toBe('UNVERIFIED');
    expect(r.liveManifest).toBe('missing');
    expect(r.mismatched).toEqual([]);
  });

  it('FAIL when the live manifest names a different artifact', async () => {
    const manifest = await buildManifest(dir);
    writeFileSync(join(dir, MANIFEST_NAME), JSON.stringify({ ...manifest, artifactHash: '0'.repeat(64) }));
    expect((await verifyLive(manifest, await serve(), { full: true })).result).toBe('FAIL');
  });

  it('UNVERIFIED when nothing can be downloaded', async () => {
    const manifest = await buildManifest(dir);
    const r = await verifyLive(manifest, 'http://127.0.0.1:9/', { full: true });
    expect(r.result).toBe('UNVERIFIED');
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
