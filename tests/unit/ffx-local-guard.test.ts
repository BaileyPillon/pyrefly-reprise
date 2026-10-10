/**
 * **The guards around Bailey's own converted FFX files** (the hidden Fayth chapter's local `ffx` skin; `docs/plans/fayth-3d.md`, "Guards (rule 8)"): the files are his own copy of the game, local only,
 * and AGENTS.md hard rule 8 says no retail Square Enix asset is ever in the repo or on the site. The route and the probe are the only code that touches them, and this file pins that they cannot ship:
 *
 * 1. **The plugin is serve-only** (`tools/vite-ffx-local.mjs`): `apply: 'serve'` and `configureServer` and nothing else (no preview hook, no build hook), and Vite itself, resolving the plugin,
 *    leaves it out of a build and keeps it for the dev server. `vite.config.ts` registers it beside the other plugins.
 * 2. **The middleware is read-only and stays inside its folder**: it serves a file from a temp root, and refuses every traversal (`..`, encoded and doubled, absolute paths, drive letters, backslashes, NUL,
 *    a symlink out of the root), a directory, any method but GET and HEAD; a missing root is a 404, not a crash; a request outside the route is left to Vite.
 * 3. **No retail file type is in the repo**: git tracks no `.glb`, `.gltf`, `.phyre`, `.dds` or `.mgrp` anywhere, `public/` (tracked and on this disk) holds none.
 * 4. **The probe does nothing unless `import.meta.env.DEV`**: it returns null, fetches nothing and says nothing when it is false (the manifest's shape and the probe's failures are `ffx-local-manifest.test.ts`'s).
 *
 * Game case: FFX only (the files are FFX's); shared dev plumbing.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer, request, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from 'vite';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import viteConfig from '../../vite.config.ts';
import { FFX_LOCAL_DEFAULT_ROOT, FFX_LOCAL_ENV, ffxLocalMiddleware, ffxLocalRoot, pyreflyFfxLocal, resolveInside } from '../../tools/vite-ffx-local.mjs';
import { probeFfxLocal } from '../../src/engine/ffx3d/localAssets.ts';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RETAIL = new Set(['.glb', '.gltf', '.phyre', '.dds', '.mgrp']);
const SECRET = 'TOP-SECRET: outside the served folder';

describe('the plugin is serve-only', () => {
  it('has a name, apply: serve and configureServer, and no other key: no preview hook, no build hook of any kind', () => {
    const plugin = pyreflyFfxLocal() as unknown as Record<string, unknown>;
    expect(Object.keys(plugin).sort()).toEqual(['apply', 'configureServer', 'name']);
    expect(plugin['name']).toBe('pyrefly-ffx-local');
    expect(plugin['apply']).toBe('serve');
    expect(typeof plugin['configureServer']).toBe('function');
    expect(plugin['configurePreviewServer']).toBeUndefined();
  });

  it('mounts one middleware on the dev server, under the server\'s base', () => {
    const used: unknown[] = [];
    (pyreflyFfxLocal() as unknown as { configureServer(s: object): void }).configureServer({ middlewares: { use: (fn: unknown) => used.push(fn) }, config: { base: '/' } });
    expect(used).toHaveLength(1);
    expect(typeof used[0]).toBe('function');
  });

  it('Vite itself keeps it out of a build and in for the dev server', async () => {
    const names = async (command: 'build' | 'serve', isPreview = false): Promise<string[]> =>
      (await resolveConfig({ configFile: false, logLevel: 'silent', plugins: [pyreflyFfxLocal()] }, command, 'development', 'development', isPreview)).plugins.map((p) => p.name);
    expect(await names('build')).not.toContain('pyrefly-ffx-local');
    expect(await names('serve')).toContain('pyrefly-ffx-local');
    expect(await names('serve', true)).toContain('pyrefly-ffx-local'); // `vite preview` resolves as `serve`...
    // ...and mounts only what configurePreviewServer adds, which this plugin does not have (the key test above).
  });

  it('vite.config.ts registers it with the other plugins', () => {
    const plugins = (viteConfig as unknown as (env: object) => { plugins: Array<{ name: string }> })({ command: 'serve', mode: 'development', isPreview: false }).plugins.map((p) => p.name);
    expect(plugins).toContain('pyrefly-ffx-local');
    expect(plugins).toContain('pyrefly-art-at-sign');
    expect(plugins.filter((n) => n === 'pyrefly-ffx-local')).toHaveLength(1);
    const text = readFileSync(join(REPO, 'vite.config.ts'), 'utf8');
    expect(text).toMatch(/pyreflyFfxLocal\(\)\]/); // in the plugin list, not elsewhere
  });
});

describe('the root', () => {
  it('is the environment\'s folder, else the default; a blank variable is no variable', () => {
    expect(FFX_LOCAL_ENV).toBe('PYREFLY_FFX_LOCAL');
    expect(FFX_LOCAL_DEFAULT_ROOT).toBe('D:/Tools/ffx-parity/assets/runtime');
    expect(ffxLocalRoot({})).toBe(FFX_LOCAL_DEFAULT_ROOT);
    expect(ffxLocalRoot({ PYREFLY_FFX_LOCAL: '   ' })).toBe(FFX_LOCAL_DEFAULT_ROOT);
    expect(ffxLocalRoot({ PYREFLY_FFX_LOCAL: 'E:/somewhere/else' })).toBe('E:/somewhere/else');
  });
});

describe('the middleware', () => {
  let tmp = '';
  let root = '';
  let server: Server;
  let port = 0;
  let linked = false;

  /** A raw request: the path goes out exactly as written (`fetch` would tidy `..` away before it left). */
  function get(path: string, method = 'GET'): Promise<{ status: number; headers: IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port, path, method }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
      });
      req.on('error', reject);
      req.end();
    });
  }

  beforeAll(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'ffx-local-guard-'));
    root = join(tmp, 'runtime');
    mkdirSync(join(root, 'models'), { recursive: true });
    writeFileSync(join(tmp, 'secret.txt'), SECRET);
    writeFileSync(join(root, 'manifest.json'), '{"version":1,"encounter":"evrae-airship","files":{}}');
    writeFileSync(join(root, 'models', 'evrae.glb'), Buffer.from('glTF-test-bytes'));
    writeFileSync(join(root, 'models', 'skin.png'), Buffer.from('png-test-bytes'));
    writeFileSync(join(root, 'models', 'odd.xyz'), 'plain');
    try {
      symlinkSync(join(tmp, 'secret.txt'), join(root, 'link-out'), 'file');
      symlinkSync(tmp, join(root, 'dir-out'), 'dir');
      linked = true;
    } catch {
      linked = false; // no right to make a link on this machine: the two link cases below say so
    }
    const mw = ffxLocalMiddleware({ root });
    server = createServer((req, res) => void mw(req, res, () => { res.statusCode = 418; res.end('next'); }));
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
    rmSync(tmp, { recursive: true, force: true });
  });

  it('serves a file from the root, read-only, uncached, with its type', async () => {
    const manifest = await get('/__ffx-local/manifest.json');
    expect(manifest.status).toBe(200);
    expect(manifest.body).toBe('{"version":1,"encounter":"evrae-airship","files":{}}');
    expect(manifest.headers['cache-control']).toBe('no-store');
    expect(manifest.headers['x-content-type-options']).toBe('nosniff');
    expect(manifest.headers['content-type']).toBe('application/json');
    const glb = await get('/__ffx-local/models/evrae.glb');
    expect([glb.status, glb.headers['content-type'], glb.body, glb.headers['content-length']]).toEqual([200, 'model/gltf-binary', 'glTF-test-bytes', String('glTF-test-bytes'.length)]);
    expect((await get('/__ffx-local/models/skin.png')).headers['content-type']).toBe('image/png');
    expect((await get('/__ffx-local/models/odd.xyz')).headers['content-type']).toBe('application/octet-stream');
    expect((await get('/__ffx-local/manifest.json?v=2#frag')).status).toBe(200); // the query is not part of the name
  });

  it('answers HEAD with the headers and no body, and refuses every other method with 405', async () => {
    const head = await get('/__ffx-local/models/evrae.glb', 'HEAD');
    expect([head.status, head.body, head.headers['content-length'], head.headers['cache-control']]).toEqual([200, '', String('glTF-test-bytes'.length), 'no-store']);
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
      const res = await get('/__ffx-local/manifest.json', method);
      expect([res.status, res.headers['allow'], res.headers['cache-control']], method).toEqual([405, 'GET, HEAD', 'no-store']);
    }
  });

  it('a missing file and a directory are 404', async () => {
    for (const path of ['/__ffx-local/nope.glb', '/__ffx-local/models', '/__ffx-local/models/', '/__ffx-local/', '/__ffx-local/models/nope/evrae.glb']) {
      const res = await get(path);
      expect([res.status, res.headers['cache-control']], path).toEqual([404, 'no-store']);
    }
  });

  it('refuses every traversal: parent steps (raw, encoded, doubled), absolute paths, drive letters, backslashes, NUL, a malformed escape', async () => {
    const attempts = [
      '/__ffx-local/../secret.txt',
      '/__ffx-local/%2e%2e/secret.txt',
      '/__ffx-local/..%2Fsecret.txt',
      '/__ffx-local/%2e%2e%2fsecret.txt',
      '/__ffx-local/models/../../secret.txt',
      '/__ffx-local/models/%2e%2e/%2e%2e/secret.txt',
      '/__ffx-local/models/..%5C..%5Csecret.txt',
      '/__ffx-local/..\\secret.txt',
      '/__ffx-local/models\\..\\..\\secret.txt',
      '/__ffx-local//secret.txt',
      `/__ffx-local/${encodeURIComponent(join(tmp, 'secret.txt'))}`,
      `/__ffx-local/${encodeURI(join(tmp, 'secret.txt').replaceAll('\\', '/'))}`,
      '/__ffx-local/C:/Windows/win.ini',
      '/__ffx-local/%2FWindows%2Fwin.ini',
      '/__ffx-local/manifest.json%00.png',
      '/__ffx-local/%zz',
      '/__ffx-local/%252e%252e/secret.txt',
    ];
    for (const path of attempts) {
      const res = await get(path);
      expect(res.status, path).toBe(404);
      expect(res.body, path).not.toContain('TOP-SECRET');
    }
  });

  it('refuses a symlink out of the root, to a file and to a folder; the check is on where the path really lands', async (ctx) => {
    if (!linked) ctx.skip();
    for (const path of ['/__ffx-local/link-out', '/__ffx-local/dir-out/secret.txt']) {
      const res = await get(path);
      expect(res.status, path).toBe(404);
      expect(res.body, path).not.toContain('TOP-SECRET');
    }
    expect(await resolveInside(root, 'link-out')).toBeNull();
    // A path written through the link that lands back inside the root is a file of the root, and is served: it is the resolved path that is checked, not the written one.
    expect((await get('/__ffx-local/dir-out/runtime/manifest.json')).status).toBe(200);
  });

  it('leaves a request outside the route to the next middleware, and serves under a base path when it is given one', async () => {
    const mw = ffxLocalMiddleware({ root });
    for (const url of ['/index.html', '/art/characters/tidus/idle.png', '/__ffx-localx/manifest.json', '/']) {
      const next = vi.fn();
      await mw({ url, method: 'GET' } as never, {} as never, next);
      expect(next, url).toHaveBeenCalledTimes(1);
    }
    const base = ffxLocalMiddleware({ root, base: '/pyrefly-reprise/' });
    const next = vi.fn();
    await base({ url: '/__ffx-local/manifest.json', method: 'GET' } as never, {} as never, next);
    expect(next, 'the route lives under the base').toHaveBeenCalledTimes(1);
  });

  it('a missing root is a 404 for everything and throws nothing', async () => {
    const mw = ffxLocalMiddleware({ root: join(tmp, 'no-such-folder') });
    for (const url of ['/__ffx-local/manifest.json', '/__ffx-local/models/evrae.glb', '/__ffx-local/']) {
      const res = { statusCode: 0, headers: {} as Record<string, string>, body: '', setHeader(n: string, v: string) { this.headers[n] = v; }, end(b?: string) { this.body = b ?? ''; } };
      await expect(mw({ url, method: 'GET' } as never, res as never, () => {})).resolves.toBeUndefined();
      expect([res.statusCode, res.headers['Cache-Control']], url).toEqual([404, 'no-store']);
    }
    expect(await resolveInside(join(tmp, 'no-such-folder'), 'manifest.json')).toBeNull();
  });
});

describe('no retail file type reaches the repo', () => {
  const git = (...args: string[]): string[] => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean);
  const retail = (files: string[]): string[] => files.filter((f) => RETAIL.has(extname(f).toLowerCase()));

  it('git tracks none of .glb, .gltf, .phyre, .dds or .mgrp anywhere, and nothing tracked under public/ is one', () => {
    expect(retail(git('ls-files', 'public')), 'tracked under public/').toEqual([]);
    expect(retail(git('ls-files')), 'tracked anywhere').toEqual([]);
  });

  it('public/ on this disk holds none either (an untracked file there would ship in a build)', () => {
    const found: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (RETAIL.has(extname(entry.name).toLowerCase())) found.push(path);
      }
    };
    try {
      walk(join(REPO, 'public'));
    } catch {
      /* no public/ folder here: nothing to find */
    }
    expect(found).toEqual([]);
  });
});

describe('the probe does nothing unless import.meta.env.DEV', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const manifest = { version: 1, encounter: 'evrae-airship', upAxis: 'y', units: 'ffx', stage: { file: 'evrae/stage.glb' }, actors: { evrae: { file: 'evrae/evrae.glb', rawHeight: 612.5 } }, source: 'test fixture' };
  const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('returns null and fetches nothing, and says nothing, when import.meta.env.DEV is false (a production build)', async () => {
    vi.stubEnv('DEV', false);
    const fetchSpy = vi.fn(async () => json(manifest));
    vi.stubGlobal('fetch', fetchSpy);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await probeFfxLocal()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('checks DEV before it fetches anything, in the source as well (so a build drops the fetch with the branch)', () => {
    const text = readFileSync(join(REPO, 'src', 'engine', 'ffx3d', 'localAssets.ts'), 'utf8');
    const dev = text.indexOf('if (!import.meta.env.DEV) return null');
    expect(dev).toBeGreaterThan(0);
    expect(text.indexOf('fetch(')).toBeGreaterThan(dev);
    expect(text.indexOf('await fetch(')).toBeGreaterThan(dev);
  });

  it('on a dev server asks for the manifest under the base, uncached, and returns what it says (the shape and its failures: ffx-local-manifest.test.ts)', async () => {
    vi.stubEnv('DEV', true);
    const fetchSpy = vi.fn(async () => json(manifest));
    vi.stubGlobal('fetch', fetchSpy);
    expect(await probeFfxLocal()).toEqual(manifest);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}__ffx-local/manifest.json`, { cache: 'no-store' });
  });
});
