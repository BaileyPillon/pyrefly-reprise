/**
 * R61 booth kit (Bailey, 2026-10-20, the conference demo on "This PC", from an offline copy): `tools/demo-kit/`.
 *
 * What must hold, each against the real code (a real server on the loopback, a real downloader fetching from it as if it were the live site; no browser, no internet):
 *  1. The server hands out exactly the folder's bytes, the way the live host does (types, cache rules, 304, Range for the audio), refuses to leave the folder, and falls to the next port when one is busy.
 *  2. The downloader keeps a file only if its bytes hash to the manifest's sha256, keeps what is already right, fetches what is missing, and deletes what is wrong. `@` goes on the wire as `%40`.
 *  3. Nothing is stopped but what the kit started: `stopPid` checks the command line first (a stale PID after a reboot is a stranger).
 *  4. The browser is opened full screen in a profile of its own, and Chrome is preferred over Edge.
 *
 * Game case: both (tooling).
 */
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { stopPid } from '../../tools/demo-kit/demo-kit.mjs';
import {
  DEMO_QUERY,
  HOST_READ_FILES,
  browserArgs,
  cacheControlOf,
  contentTypeOf,
  defaultSiteDir,
  demoUrl,
  destPath,
  findBrowser,
  formatBytes,
  kitHome,
  parseRange,
  safeJoin,
  selectFiles,
  sha256hex,
  tierOf,
  urlFor,
  type ArtifactManifest,
} from '../../tools/demo-kit/demo-kit-lib.mjs';
import { SITE_MARK, fetchSite } from '../../tools/demo-kit/fetch-site.mjs';
import { startServer } from '../../tools/demo-kit/serve-offline.mjs';

const roots: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'demo-kit-test-'));
  roots.push(d);
  return d;
}
afterAll(() => {
  for (const d of roots) rmSync(d, { recursive: true, force: true });
});

/** A small site: the files the real one has the shapes of (a page, a hashed bundle, a figure with an @ in its name, a tiered master, a sound, a host-read file). */
const FILES: Record<string, Buffer> = {
  'index.html': Buffer.from('<!doctype html><title>Echoes of Spira</title>'),
  'assets/index-AbC123.js': Buffer.from('console.log("bundle")'),
  'art/characters/tidus/idle.png': Buffer.from('png-1x-bytes'),
  'art/characters/tidus/idle@2x.png': Buffer.from('png-2x-bytes-xx'),
  'art/characters/tidus/idle@4x.png': Buffer.from('png-4x-bytes-xxxxxxxxxx'),
  'audio/music/title.mp3': Buffer.from('0123456789abcdefghij'),
  '_headers': Buffer.from('/assets/*\n  Cache-Control: immutable\n'),
};

function writeSite(dir: string, files: Record<string, Buffer> = FILES): void {
  for (const [p, b] of Object.entries(files)) {
    const f = join(dir, ...p.split('/'));
    mkdirSync(join(f, '..'), { recursive: true });
    writeFileSync(f, b);
  }
}

function manifestOf(files: Record<string, Buffer> = FILES): ArtifactManifest {
  return { manifestVersion: 1, count: Object.keys(files).length, artifactHash: 'test', files: Object.fromEntries(Object.entries(files).map(([p, b]) => [p, { sha256: sha256hex(b), bytes: b.length }])) };
}

describe('the pure parts', () => {
  it('content types by extension, and plain bytes for the unknown', () => {
    expect(contentTypeOf('a/b/idle@4x.PNG')).toBe('image/png');
    expect(contentTypeOf('x.webp')).toBe('image/webp');
    expect(contentTypeOf('t.mp3')).toBe('audio/mpeg');
    expect(contentTypeOf('index.html')).toContain('text/html');
    expect(contentTypeOf('assets/game.js')).toContain('text/javascript');
    expect(contentTypeOf('fonts/a.woff2')).toBe('font/woff2');
    expect(contentTypeOf('noext')).toBe('application/octet-stream');
    expect(contentTypeOf('dir.d/noext')).toBe('application/octet-stream');
  });

  it('the live host\'s cache rule: a hashed bundle for a year, the rest asked about every time', () => {
    expect(cacheControlOf('/assets/index-AbC123.js')).toBe('public, max-age=31536000, immutable');
    expect(cacheControlOf('/index.html')).toBe('public, max-age=0, must-revalidate');
    expect(cacheControlOf('/art/characters/tidus/idle.png')).toBe('public, max-age=0, must-revalidate');
  });

  it('safeJoin: inside the folder only', () => {
    const root = join(tmpdir(), 'site-root');
    expect(safeJoin(root, '/')).toBe(join(root, 'index.html'));
    expect(safeJoin(root, '/art/x.png')).toBe(join(root, 'art', 'x.png'));
    expect(safeJoin(root, '/art/idle%404x.png')).toBe(join(root, 'art', 'idle@4x.png')); // the wire form of the @
    expect(safeJoin(root, '/art/')).toBe(join(root, 'art', 'index.html'));
    expect(safeJoin(root, '/a.png?v=123#x')).toBe(join(root, 'a.png'));
    for (const bad of ['/../secret', '/a/../../secret', '/%2e%2e/secret', '/a%2F..%2F..%2Fsecret', '/a\\b', '/C:/Windows/win.ini', '/a%00b', '/%', '/./x']) expect(safeJoin(root, bad), bad).toBeNull();
  });

  it('parseRange', () => {
    expect(parseRange('bytes=0-3', 20)).toEqual({ start: 0, end: 3 });
    expect(parseRange('bytes=5-', 20)).toEqual({ start: 5, end: 19 });
    expect(parseRange('bytes=-4', 20)).toEqual({ start: 16, end: 19 });
    expect(parseRange('bytes=10-999', 20)).toEqual({ start: 10, end: 19 });
    expect(parseRange('bytes=20-30', 20)).toBe('unsatisfiable');
    expect(parseRange('bytes=-0', 20)).toBe('unsatisfiable');
    expect(parseRange('bytes=0-1,5-6', 20)).toBeNull(); // not a single range: served whole
    expect(parseRange(undefined, 20)).toBeNull();
    expect(parseRange('bytes=0-3', 0)).toBeNull();
  });

  it('the address opens the demo: loopback, ?demo=1', () => {
    expect(demoUrl(5173)).toBe(`http://127.0.0.1:5173/${DEMO_QUERY}`);
    expect(DEMO_QUERY).toBe('?demo=1');
  });

  it('urlFor encodes every segment: @ goes on the wire as %40, a slash stays a slash', () => {
    expect(urlFor('https://echoesofspira.com', 'art/characters/seymour-flux/idle@4x.png')).toBe('https://echoesofspira.com/art/characters/seymour-flux/idle%404x.png');
    expect(urlFor('https://echoesofspira.com/', 'index.html')).toBe('https://echoesofspira.com/index.html');
  });

  it('tiers, selection and the host-read file', () => {
    expect(tierOf('art/characters/a/idle@4x.png')).toBe(4);
    expect(tierOf('art/backdrops/b@2x.webp')).toBe(2);
    expect(tierOf('art/characters/a/idle.png')).toBe(1);
    expect(tierOf('assets/a@b.js')).toBe(1);
    const m = manifestOf();
    expect(HOST_READ_FILES).toContain('_headers');
    expect(selectFiles(m)).not.toContain('_headers');
    expect(selectFiles(m)).toHaveLength(6);
    expect(selectFiles(m, { maxTier: 2 })).not.toContain('art/characters/tidus/idle@4x.png');
    expect(selectFiles(m, { maxTier: 2 })).toContain('art/characters/tidus/idle@2x.png');
    expect(selectFiles(m, { only: ['assets/', 'index.html'] })).toEqual(['assets/index-AbC123.js', 'index.html']);
    expect(selectFiles(m, { limit: 2 })).toHaveLength(2);
  });

  it('destPath refuses a manifest path that would leave the folder', () => {
    const dir = join(tmpdir(), 'dest-root');
    expect(destPath(dir, 'art/a.png')).toBe(join(dir, 'art', 'a.png'));
    for (const bad of ['../x', 'a/../../x', '/abs', 'C:/x', 'a\\b', 'a//b', '']) expect(destPath(dir, bad), bad).toBeNull();
  });

  it('the browser: full screen, a profile of its own, the address last', () => {
    const args = browserArgs({ url: 'http://127.0.0.1:5173/?demo=1', profileDir: 'C:\\k\\profile', kiosk: true });
    expect(args).toContain('--kiosk');
    expect(args).toContain('--start-fullscreen');
    expect(args).toContain('--user-data-dir=C:\\k\\profile');
    expect(args).toContain('--autoplay-policy=no-user-gesture-required');
    expect(args).toContain('--no-first-run');
    expect(args.at(-1)).toBe('http://127.0.0.1:5173/?demo=1');
    const windowed = browserArgs({ url: 'u', profileDir: 'p', kiosk: false });
    expect(windowed).not.toContain('--kiosk');
    expect(windowed.some((a) => a.startsWith('--window-size='))).toBe(true);
  });

  it('findBrowser prefers Chrome, falls back to Edge, and honours a choice', () => {
    const env = { ProgramFiles: 'C:\\PF', 'ProgramFiles(x86)': 'C:\\PF86', LOCALAPPDATA: 'C:\\L' };
    const only = (needle: string) => (p: string) => p.includes(needle);
    expect(findBrowser(only('chrome.exe'), undefined, env)?.name).toBe('chrome');
    expect(findBrowser(only('msedge.exe'), undefined, env)?.name).toBe('edge');
    expect(findBrowser(() => true, 'edge', env)?.name).toBe('edge');
    expect(findBrowser(() => false, undefined, env)).toBeNull();
  });

  it('where the kit keeps things: one folder, and the site copy inside it unless told otherwise', () => {
    expect(kitHome({ ECHOES_DEMO_HOME: 'D:\\x' })).toMatch(/x$/);
    expect(defaultSiteDir({ ECHOES_DEMO_SITE: 'E:\\booth' })).toMatch(/booth$/);
    expect(defaultSiteDir({ ECHOES_DEMO_HOME: 'D:\\x' })).toMatch(/x[\\/]site$/);
  });

  it('formatBytes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.50 KB');
    expect(formatBytes(10961893980)).toBe('10.2 GB');
  });
});

describe('the server', () => {
  let dir = '';
  let base = '';
  let close: () => Promise<void> = async () => {};
  let stopped = 0;

  beforeAll(async () => {
    dir = tmp();
    writeSite(dir);
    const s = await startServer({ dir, port: 0, onStop: () => void (stopped += 1) });
    base = `http://127.0.0.1:${s.port}`;
    close = s.close;
  });
  afterAll(async () => close());

  it('refuses a folder that is not a copy of the site', async () => {
    await expect(startServer({ dir: tmp(), port: 0 })).rejects.toThrow(/no index.html/);
  });

  it('serves the page at / with the live host\'s headers, and exactly the folder\'s bytes for a file', async () => {
    const page = await fetch(`${base}/`);
    expect(page.status).toBe(200);
    expect(page.headers.get('content-type')).toContain('text/html');
    expect(page.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
    expect(Buffer.from(await page.arrayBuffer())).toEqual(FILES['index.html']);
    const js = await fetch(`${base}/assets/index-AbC123.js`);
    expect(js.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    const fig = await fetch(`${base}/art/characters/tidus/idle%404x.png`); // the wire form of the @
    expect(fig.status).toBe(200);
    expect(fig.headers.get('content-type')).toBe('image/png');
    expect(Buffer.from(await fig.arrayBuffer())).toEqual(FILES['art/characters/tidus/idle@4x.png']);
  });

  it('answers 304 to a matching ETag, and HEAD with no body', async () => {
    const first = await fetch(`${base}/index.html`);
    const etag = first.headers.get('etag')!;
    expect(etag).toBeTruthy();
    await first.arrayBuffer();
    const again = await fetch(`${base}/index.html`, { headers: { 'If-None-Match': etag } });
    expect(again.status).toBe(304);
    const head = await fetch(`${base}/index.html`, { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(head.headers.get('content-length')).toBe(String(FILES['index.html']!.length));
    expect((await head.arrayBuffer()).byteLength).toBe(0);
  });

  it('serves a byte range of the audio (206), and 416 past the end', async () => {
    const part = await fetch(`${base}/audio/music/title.mp3`, { headers: { Range: 'bytes=2-5' } });
    expect(part.status).toBe(206);
    expect(part.headers.get('content-range')).toBe('bytes 2-5/20');
    expect(Buffer.from(await part.arrayBuffer()).toString()).toBe('2345');
    const past = await fetch(`${base}/audio/music/title.mp3`, { headers: { Range: 'bytes=50-60' } });
    expect(past.status).toBe(416);
    await past.arrayBuffer();
  });

  it('404 for what is not there, and for every way out of the folder; 405 for a write', async () => {
    for (const path of ['/nope.png', '/../x', '/%2e%2e/%2e%2e/windows', '/art', '/art/characters']) {
      const r = await fetch(`${base}${path}`);
      expect(r.status, path).toBe(404);
      await r.arrayBuffer();
    }
    const raw = await new Promise<number>((ok) => {
      // fetch normalises `..`; a raw socket does not
      import('node:net').then(({ createConnection }) => {
        const c = createConnection({ port: Number(new URL(base).port), host: '127.0.0.1' }, () => c.write('GET /../../etc/passwd HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n'));
        let data = '';
        c.on('data', (d) => (data += d));
        c.on('end', () => ok(Number(/HTTP\/1\.1 (\d+)/.exec(data)?.[1])));
      });
    });
    expect(raw).toBe(404);
    const put = await fetch(`${base}/index.html`, { method: 'PUT', body: 'x' });
    expect(put.status).toBe(405);
    await put.arrayBuffer();
    const health = await (await fetch(`${base}/__demo-kit/health`)).json();
    expect(health.ok).toBe(true);
    expect(health.notFound).toBeGreaterThan(0);
  });

  it('a busy port falls through to the next free one', async () => {
    const a = await startServer({ dir, port: 0 });
    const b = await startServer({ dir, port: a.port });
    expect(b.port).toBeGreaterThan(a.port);
    await a.close();
    await b.close();
  });

  it('POST /__demo-kit/stop closes it (and GET does not)', async () => {
    const s = await startServer({ dir, port: 0, onStop: () => void (stopped += 1) });
    const url = `http://127.0.0.1:${s.port}`;
    const get = await fetch(`${url}/__demo-kit/stop`);
    expect(get.status).toBe(405);
    await get.arrayBuffer();
    const before = stopped;
    const post = await fetch(`${url}/__demo-kit/stop`, { method: 'POST' });
    expect(post.status).toBe(200);
    await post.arrayBuffer();
    for (let i = 0; i < 50 && stopped === before; i++) await new Promise((r) => setTimeout(r, 20));
    expect(stopped).toBe(before + 1);
    await expect(fetch(`${url}/index.html`)).rejects.toThrow();
  });
});

describe('the downloader (from a stand-in live site)', () => {
  let live: { port: number; close: () => Promise<void> };
  let base = '';
  const seen: string[] = [];

  beforeAll(async () => {
    const siteDir = tmp();
    writeSite(siteDir);
    live = await startServer({ dir: siteDir, port: 0 });
    base = `http://127.0.0.1:${live.port}/`;
  });
  afterAll(async () => live.close());

  const spy: typeof fetch = (input, init) => {
    seen.push(String(input));
    return fetch(input, init);
  };
  const quick = { retryWaitMs: [0, 0] };

  it('fetches every file, verifies each, skips the host-read file, and marks the copy complete', async () => {
    const dir = tmp();
    seen.length = 0;
    const r = await fetchSite({ manifest: manifestOf(), dir, base, fetchImpl: spy, ...quick });
    expect(r.failed).toEqual([]);
    expect(r.fetched).toBe(6);
    expect(r.kept).toBe(0);
    expect(r.complete).toBe(true);
    for (const [p, b] of Object.entries(FILES)) {
      if (p === '_headers') expect(existsSync(join(dir, p))).toBe(false);
      else expect(readFileSync(join(dir, ...p.split('/')))).toEqual(b);
    }
    expect(seen.some((u) => u.includes('_headers'))).toBe(false);
    expect(seen.some((u) => u.includes('idle%404x.png'))).toBe(true); // the @ went on the wire encoded
    expect(seen.some((u) => u.includes('idle@4x.png'))).toBe(false);
    expect(JSON.parse(readFileSync(join(dir, SITE_MARK), 'utf8'))).toMatchObject({ complete: true, of: 6, selected: 6 });
    expect(readdirSync(join(dir, 'assets')).filter((f) => f.endsWith('.part'))).toEqual([]);
  });

  it('a second run keeps what is right and fetches only what is missing or wrong', async () => {
    const dir = tmp();
    await fetchSite({ manifest: manifestOf(), dir, base, ...quick });
    rmSync(join(dir, 'audio', 'music', 'title.mp3'));
    writeFileSync(join(dir, 'assets', 'index-AbC123.js'), 'tampered'); // wrong bytes, wrong size
    writeFileSync(join(dir, 'art', 'characters', 'tidus', 'idle.png'), Buffer.from('png-1x-BYTES')); // right size, wrong bytes
    seen.length = 0;
    const r = await fetchSite({ manifest: manifestOf(), dir, base, fetchImpl: spy, ...quick });
    expect(r.failed).toEqual([]);
    expect(r.kept).toBe(3);
    expect(r.fetched).toBe(3);
    expect(seen).toHaveLength(3);
    expect(readFileSync(join(dir, 'assets', 'index-AbC123.js'))).toEqual(FILES['assets/index-AbC123.js']);
    expect(readFileSync(join(dir, 'art', 'characters', 'tidus', 'idle.png'))).toEqual(FILES['art/characters/tidus/idle.png']);
  });

  it('a file whose live bytes do not match the manifest is never kept', async () => {
    const dir = tmp();
    const m = manifestOf();
    m.files['audio/music/title.mp3']!.sha256 = '0'.repeat(64); // the live site has other bytes than the manifest says
    const r = await fetchSite({ manifest: m, dir, base, ...quick });
    expect(r.failed).toHaveLength(1);
    expect(r.failed[0]!.path).toBe('audio/music/title.mp3');
    expect(r.failed[0]!.why).toMatch(/hash differs/);
    expect(existsSync(join(dir, 'audio', 'music', 'title.mp3'))).toBe(false);
    expect(existsSync(join(dir, 'audio', 'music', 'title.mp3.part'))).toBe(false);
    expect(r.fetched).toBe(5);
    expect(JSON.parse(readFileSync(join(dir, SITE_MARK), 'utf8')).complete).toBe(false);
  });

  it('a file the host does not have is a failure with the reason, not a crash', async () => {
    const dir = tmp();
    const m = manifestOf({ ...FILES, 'art/missing.png': Buffer.from('x') });
    const r = await fetchSite({ manifest: m, dir, base, ...quick });
    expect(r.failed.map((f) => f.path)).toEqual(['art/missing.png']);
    expect(r.failed[0]!.why).toBe('HTTP 404');
  });

  it('--max-tier and --only make a partial copy, marked partial; a later full run completes it, and a later small run does not undo that', async () => {
    const dir = tmp();
    const small = await fetchSite({ manifest: manifestOf(), dir, base, maxTier: 2, ...quick });
    expect(small.selected).toBe(5);
    expect(small.complete).toBe(false);
    expect(existsSync(join(dir, 'art', 'characters', 'tidus', 'idle@4x.png'))).toBe(false);
    expect(JSON.parse(readFileSync(join(dir, SITE_MARK), 'utf8')).complete).toBe(false);
    const full = await fetchSite({ manifest: manifestOf(), dir, base, ...quick });
    expect(full.kept).toBe(5);
    expect(full.fetched).toBe(1);
    expect(JSON.parse(readFileSync(join(dir, SITE_MARK), 'utf8')).complete).toBe(true);
    await fetchSite({ manifest: manifestOf(), dir, base, only: ['index.html'], ...quick });
    expect(JSON.parse(readFileSync(join(dir, SITE_MARK), 'utf8')).complete).toBe(true);
  });

  it('--verify-only touches no network and no file, and names what is missing or wrong', async () => {
    const dir = tmp();
    await fetchSite({ manifest: manifestOf(), dir, base, ...quick });
    writeFileSync(join(dir, 'index.html'), 'changed');
    rmSync(join(dir, 'audio', 'music', 'title.mp3'));
    seen.length = 0;
    const r = await fetchSite({ manifest: manifestOf(), dir, base, fetchImpl: spy, verifyOnly: true, ...quick });
    expect(seen).toEqual([]);
    expect(r.failed.map((f) => `${f.path}: ${f.why}`).sort()).toEqual(['audio/music/title.mp3: missing', 'index.html: bytes differ from the manifest']);
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toBe('changed');
  });

  it('the real manifest of release 60 is the shape the downloader expects (6,161 files, one host-read file, @ in names)', () => {
    const p = join(__dirname, '..', '..', 'critic', 'artifacts', '1cea6e937.json');
    const m = JSON.parse(readFileSync(p, 'utf8')) as ArtifactManifest;
    expect(m.count).toBe(Object.keys(m.files).length);
    expect(Object.keys(m.files).length).toBe(6161);
    expect(selectFiles(m)).toHaveLength(6160); // _headers is read by the host and never served
    expect(selectFiles(m, { maxTier: 2 }).length).toBeLessThan(selectFiles(m).length);
    for (const f of Object.values(m.files)) expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(m.files).some((k) => k.includes('@'))).toBe(true);
  });
});

describe('only what the kit started is stopped', () => {
  it('a process that is not there is "gone"', () => {
    expect(stopPid(2_000_000_000, 'serve-offline.mjs')).toBe('gone');
  });

  it('a live process whose command line is not the kit\'s is "not-ours" and keeps running (this very process)', () => {
    expect(stopPid(process.pid, 'serve-offline.mjs-no-such-marker')).toBe('not-ours');
    expect(process.pid).toBeGreaterThan(0); // still here
  });
});
