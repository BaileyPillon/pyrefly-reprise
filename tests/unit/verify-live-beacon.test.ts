/**
 * The live byte check allows exactly one thing on the page a browser receives: Cloudflare Web Analytics' one beacon script
 * (release 39, D-418; critic finding LV-1 of the live check of release 38). Both games: shared delivery tooling.
 *
 * Cloudflare adds `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/v..." integrity="..."
 * data-cf-beacon='{...}' crossorigin="anonymous"></script>` and one line feed right before `</body>`, only when the request's
 * Accept names text/html. A generic Accept never receives it, which is how the byte check passed without seeing it. The check
 * now fetches every HTML page a second time with a browser's Accept, cuts out that one element (and the line feed) and compares
 * the rest byte for byte; any other difference fails. `_headers`, which Cloudflare reads and never serves, is in the artifact
 * but never downloaded. The token and hashes below are invented; the shape is what Cloudflare served on 2026-10-04.
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BROWSER_ACCEPT,
  HOST_READ_FILES,
  MANIFEST_NAME,
  buildManifest,
  selectForVerification,
  verifyLive,
  withoutCloudflareBeacon,
} from '../../tools/artifact-manifest.mjs';

const TOKEN = '0123456789abcdef0123456789abcdef';
const SRC = 'https://static.cloudflareinsights.com/beacon.min.js/v31edd6df95cf4e85bb4c19e7a9bdbcba1788362987495';
const BEACON = `<script type="module" src="${SRC}" integrity="sha512-${'A'.repeat(86)}==" data-cf-beacon='{"version":"2024.11.0","token":"${TOKEN}","r":1,"spa":2}' crossorigin="anonymous"></script>`;
const PAGE = '<!doctype html>\r\n<html>\r\n  <body>\r\n    <div id="app"></div>\r\n    <script type="module" src="/assets/index-Abc123.js"></script>\r\n  </body>\r\n</html>\r\n';

/** Where Cloudflare puts it: right before </body>, with one line feed after it. */
const inject = (page: string, element: string, after = '\n'): string => page.replace('</body>', `${element}${after}</body>`);

describe('withoutCloudflareBeacon', () => {
  it('cuts the element and the one line feed after it, and the result is the artifact page byte for byte', () => {
    const served = inject(PAGE, BEACON);
    expect(served.length - PAGE.length).toBe(BEACON.length + 1);
    const cut = withoutCloudflareBeacon(Buffer.from(served));
    expect(cut.beacons).toBe(1);
    expect(cut.beaconBytes).toBe(BEACON.length);
    expect(cut.variants[0]!.lineFeed).toBe(true);
    expect(cut.variants[0]!.bytes.toString()).toBe(PAGE);
    expect(cut.variants[1]!.lineFeed).toBe(false);
  });

  it('reads the element however the attributes are quoted and ordered, and with an upper-case tag', () => {
    const shaped = `<SCRIPT data-cf-beacon="{&quot;token&quot;:&quot;${TOKEN}&quot;}" crossorigin=anonymous defer src='https://static.cloudflareinsights.com/beacon.min.js'></SCRIPT>`;
    expect(withoutCloudflareBeacon(Buffer.from(inject(PAGE, shaped, ''))).variants[0]!.bytes.toString()).toBe(PAGE);
  });

  it('removes nothing that is not Cloudflare\'s beacon: the page\'s own scripts, another host, a missing data-cf-beacon, an attribute it does not use, a longer path', () => {
    const own = PAGE.replace('<div id="app"></div>', '<div id="app"></div><script>window.__x = 1</script>');
    expect(withoutCloudflareBeacon(Buffer.from(own))).toMatchObject({ beacons: 0, variants: [] });
    for (const element of [
      BEACON.replace('static.cloudflareinsights.com', 'static.cloudflareinsights.com.example.net'),
      BEACON.replace('https://static', 'https://cdn'),
      BEACON.replace(/ data-cf-beacon='[^']*'/, ''),
      BEACON.replace('crossorigin', 'onload="alert(1)" crossorigin'),
      BEACON.replace(/\/v[0-9a-f]+"/, '/beacon.js"'),
      BEACON.replace('<script', '<script data-cf-beacon=\'{}\''),
    ]) {
      expect(withoutCloudflareBeacon(Buffer.from(inject(PAGE, element))), element.slice(0, 80)).toMatchObject({ beacons: 0, variants: [] });
    }
  });

  it('refuses a page with two beacons: nothing is cut', () => {
    const two = inject(inject(PAGE, BEACON), BEACON);
    expect(withoutCloudflareBeacon(Buffer.from(two))).toMatchObject({ beacons: 2, variants: [] });
  });
});

describe('selectForVerification and HOST_READ_FILES', () => {
  it('never selects a host-read file, in a full check or because it changed', () => {
    expect(HOST_READ_FILES).toEqual(['_headers']);
    const manifest = { files: { 'index.html': {}, '_headers': {}, 'assets/a.js': {}, 'art/a.png': {} } };
    expect(selectForVerification(manifest, { full: true })).toEqual(['art/a.png', 'assets/a.js', 'index.html']);
    expect(selectForVerification(manifest, { changed: ['_headers', 'art/a.png'], sample: 0 })).toEqual(['art/a.png', 'assets/a.js', 'index.html']);
  });
});

describe('verifyLive against a host that adds the beacon for browsers', () => {
  let dir = '';
  let server: Server | null = null;
  /** What the fake Cloudflare does to the page. */
  let behaviour: { browser?: (page: string) => string; plain?: (page: string) => string; cache?: string } = {};
  const seenAccepts: string[] = [];

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pyrefly-beacon-'));
    mkdirSync(join(dir, 'assets'));
    writeFileSync(join(dir, 'index.html'), PAGE);
    writeFileSync(join(dir, 'assets', 'index-Abc123.js'), 'console.log("game")');
    behaviour = {};
    seenAccepts.length = 0;
  });
  afterEach(async () => {
    if (server) await new Promise((done) => server?.close(done));
    server = null;
    rmSync(dir, { recursive: true, force: true });
  });

  async function serve(): Promise<string> {
    server = createServer((req, res) => {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '').replace(/^\//, '');
      if (path === '_headers') { res.writeHead(404).end(); return; } // Cloudflare reads it and never serves it
      let body: Buffer | string;
      try { body = readFileSync(join(dir, path)); } catch { res.writeHead(404).end(); return; }
      const type = path.endsWith('.html') ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : 'application/json';
      const headers: Record<string, string> = { 'content-type': type };
      if (behaviour.cache && path.startsWith('assets/')) headers['cache-control'] = behaviour.cache;
      if (path === 'index.html') {
        const accept = String(req.headers.accept ?? '');
        seenAccepts.push(accept);
        const page = body.toString();
        body = accept.includes('text/html') ? (behaviour.browser ? behaviour.browser(page) : page) : (behaviour.plain ? behaviour.plain(page) : page);
      }
      res.writeHead(200, headers).end(body);
    });
    await new Promise<void>((done) => server?.listen(0, '127.0.0.1', done));
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  }

  async function check() {
    const manifest = await buildManifest(dir, { decode: false });
    writeFileSync(join(dir, MANIFEST_NAME), JSON.stringify(manifest));
    return verifyLive(manifest, await serve(), { full: true });
  }

  it('PASS when the browser\'s page is the artifact plus Cloudflare\'s beacon, and says what it removed', async () => {
    behaviour.browser = (page) => inject(page, BEACON);
    const r = await check();
    expect(r).toMatchObject({ result: 'PASS', liveManifest: 'match', mismatched: [], missing: [], checked: 2 });
    expect(r.browserPages['index.html']).toMatch(/identical to the artifact once Cloudflare's Web Analytics beacon is removed \(\d+ bytes and the line feed after it\)/);
    // the page is asked for twice: once with a generic Accept (the artifact itself), once the way a browser asks
    expect(seenAccepts).toHaveLength(2);
    expect(seenAccepts[1]).toBe(BROWSER_ACCEPT);
    expect(seenAccepts[0]).not.toContain('text/html');
  });

  it('PASS when the beacon comes without a line feed after it, and when the host adds nothing at all', async () => {
    behaviour.browser = (page) => inject(page, BEACON, '');
    expect((await check()).result).toBe('PASS');
    if (server) await new Promise((done) => server?.close(done));
    behaviour.browser = undefined;
    const r = await check();
    expect(r.result).toBe('PASS');
    expect(r.browserPages['index.html']).toBe('identical to the artifact');
  });

  it('FAIL when the browser\'s page differs by anything besides the one beacon', async () => {
    behaviour.browser = (page) => inject(page, BEACON).replace('<div id="app">', '<!-- injected --><div id="app">');
    const r = await check();
    expect(r.result).toBe('FAIL');
    expect(r.mismatched).toEqual(['index.html as a browser asks for it (it differs by more than the one Cloudflare beacon)']);
    expect(r.browserPages['index.html']).toBeUndefined();
  });

  it('FAIL on a second beacon, on a beacon from another host and on a page that differs with no beacon at all', async () => {
    behaviour.browser = (page) => inject(inject(page, BEACON), BEACON);
    expect((await check()).mismatched[0]).toMatch(/2 beacon elements/);
    if (server) await new Promise((done) => server?.close(done));
    behaviour.browser = (page) => inject(page, BEACON.replace('static.cloudflareinsights.com', 'cdn.example.net'));
    expect((await check()).mismatched[0]).toMatch(/differs and carries no Cloudflare beacon/);
    if (server) await new Promise((done) => server?.close(done));
    behaviour.browser = (page) => page.replace('id="app"', 'id="stale"');
    const r = await check();
    expect(r.result).toBe('FAIL');
    expect(r.mismatched[0]).toMatch(/differs and carries no Cloudflare beacon/);
  });

  it('FAIL when the page a generic Accept receives is not the artifact, even though the browser\'s page reduces to it', async () => {
    behaviour.plain = (page) => page.replace('id="app"', 'id="stale"');
    behaviour.browser = (page) => inject(page, BEACON);
    const r = await check();
    expect(r.result).toBe('FAIL');
    expect(r.mismatched).toEqual(['index.html']);
  });

  it('does not download _headers (no address serves it), and reports what the first bundle was served with', async () => {
    writeFileSync(join(dir, '_headers'), '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
    behaviour.cache = 'public, max-age=31536000, immutable';
    behaviour.browser = (page) => inject(page, BEACON);
    const r = await check();
    expect(r).toMatchObject({ result: 'PASS', checked: 2, missing: [], assetCacheControl: { path: 'assets/index-Abc123.js', value: 'public, max-age=31536000, immutable' } });
    expect(r.notes.join('\n')).toMatch(/_headers is part of this artifact and was not downloaded.*max-age=31536000, immutable/);
  });
});
