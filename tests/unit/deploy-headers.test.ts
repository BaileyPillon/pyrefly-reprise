/**
 * The upload gate allows one root config file: a vetted `_headers` (release 39; both games, shared delivery tooling).
 *
 * Cloudflare reads `_headers` and never serves it. The only rule worth shipping is the cache rule for Vite's hashed bundles
 * (`assets/index-<hash>.js` and `.css`: a new build changes the name, so a year of `immutable` never serves a stale one);
 * the art, fonts and depth maps keep plain names, so they keep Cloudflare's default (`max-age=0, must-revalidate` and an ETag).
 * The gate checks the text of the file, lists it in the artifact like any other file, and the live byte check does not
 * download it (`HOST_READ_FILES`, tests/unit/verify-live-beacon.test.ts).
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prepareCloudflareUpload } from '../../tools/deploy-cloudflare.mjs';
import { VETTED_HEADERS, checkHeadersFile } from '../../tools/deploy-host.mjs';

/** The file the handoff proposes (docs/handoff/r39-int.md), byte for byte. */
const PROPOSED = [
  '# Vite names every file it emits under assets/ with a content hash (index-<hash>.js, .css, the workers), so a bundle never',
  '# changes under its name and can be cached for a year. index.html, which names the bundle, and everything without a hash in',
  '# its URL (art, fonts, depth maps) keep the default: max-age=0, must-revalidate with an ETag.',
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
].join('\n');

describe('checkHeadersFile', () => {
  it('vets the proposed file, with LF or CRLF line endings and with or without its comments', () => {
    expect(checkHeadersFile(PROPOSED)).toEqual([]);
    expect(checkHeadersFile(PROPOSED.replace(/\n/g, '\r\n'))).toEqual([]);
    expect(checkHeadersFile('/assets/*\n  Cache-Control: public, max-age=31536000, immutable')).toEqual([]);
    expect(VETTED_HEADERS.patterns).toEqual(['/assets/*']);
  });

  it('refuses any other pattern, header or value', () => {
    expect(checkHeadersFile('/*\n  Cache-Control: public, max-age=31536000, immutable\n').join('|')).toMatch(/pattern "\/\*" is not vetted/);
    expect(checkHeadersFile('/art/*\n  Cache-Control: public, max-age=31536000, immutable\n').join('|')).toMatch(/pattern "\/art\/\*" is not vetted/);
    expect(checkHeadersFile('/assets/*\n  Cache-Control: public, max-age=60\n').join('|')).toMatch(/only "Cache-Control: public, max-age=31536000, immutable" is vetted, found "Cache-Control: public, max-age=60"/);
    expect(checkHeadersFile('/assets/*\n  Content-Security-Policy: default-src none\n').join('|')).toMatch(/found "Content-Security-Policy/);
    expect(checkHeadersFile('/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n  X-Test: 1\n').join('|')).toMatch(/found "X-Test: 1"/);
    expect(checkHeadersFile('/assets/:file\n  Cache-Control: public, max-age=31536000, immutable\n').join('|')).toMatch(/is not vetted/);
  });

  it('refuses a detach line, a header before any pattern, a repeated pattern or header, and a file with no rule', () => {
    expect(checkHeadersFile('/assets/*\n  ! Cache-Control\n').join('|')).toMatch(/not a "Name: value" header/);
    expect(checkHeadersFile('  Cache-Control: public, max-age=31536000, immutable\n').join('|')).toMatch(/a header before any URL pattern/);
    expect(checkHeadersFile(`${PROPOSED}/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`).join('|')).toMatch(/appears twice/);
    expect(checkHeadersFile('/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n  Cache-Control: public, max-age=31536000, immutable\n').join('|')).toMatch(/must carry .* once \(it has 2\)/);
    expect(checkHeadersFile('/assets/*\n').join('|')).toMatch(/once \(it has 0\)/);
    expect(checkHeadersFile('# only a comment\n').join('|')).toMatch(/no rule/);
    expect(checkHeadersFile('').join('|')).toMatch(/no rule/);
  });
});

describe('prepareCloudflareUpload and _headers', () => {
  let dir = '';
  const logs: string[] = [];
  const deps = { log: (m: string) => { logs.push(m); }, fail: (m: string): never => { throw new Error(m); } };
  const listed = (...paths: string[]) => ({ artifactHash: 'a'.repeat(64), files: Object.fromEntries(paths.map((p) => [p, {}])) });
  const tree = (files: Record<string, string>) => {
    for (const [rel, body] of Object.entries(files)) {
      const full = join(dir, ...rel.split('/'));
      mkdirSync(join(full, '..'), { recursive: true });
      writeFileSync(full, body);
    }
  };
  const base = { 'index.html': '<h1>x</h1>', 'assets/index-Abc123.js': 'js', 'artifact-manifest.json': '{}' };
  const prepare = (manifestPaths: string[], kind: 'workers' | 'pages' = 'workers') => prepareCloudflareUpload({ dist: dir, manifest: listed(...manifestPaths), manifestName: 'artifact-manifest.json', kind, deps });

  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'pyrefly-headers-')); logs.length = 0; });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('lets the vetted _headers ship: listed in the artifact, never counted as an uploaded file', () => {
    tree({ ...base, _headers: PROPOSED });
    const report = prepare(['index.html', 'assets/index-Abc123.js', '_headers']);
    expect(report.ok).toBe(true);
    expect(report.fileCount).toBe(3);
    expect(logs.join('\n')).toMatch(/vetted _headers ships: Cloudflare reads it and never serves it, so the live check does not download it/);
    expect(existsSync(join(dir, '_headers'))).toBe(true); // the gate never deletes
  });

  it('refuses a _headers that is not the vetted one, and says why', () => {
    tree({ ...base, _headers: '/*\n  X-Test: 1\n' });
    expect(() => prepare(['index.html', 'assets/index-Abc123.js', '_headers'])).toThrow(/not fit for the Cloudflare upload/);
    expect(logs.join('\n')).toMatch(/dist-release\/_headers is not the vetted file: .*pattern "\/\*" is not vetted/);
  });

  it('refuses a vetted _headers the artifact manifest does not list, and a manifest entry with no file', () => {
    tree({ ...base, _headers: PROPOSED });
    expect(() => prepare(['index.html', 'assets/index-Abc123.js'])).toThrow(/not fit/);
    expect(logs.join('\n')).toMatch(/would be uploaded that the artifact manifest does not list, e\.g\. _headers/);
    logs.length = 0;
    rmSync(join(dir, '_headers'));
    expect(() => prepare(['index.html', 'assets/index-Abc123.js', '_headers'])).toThrow(/not fit/);
    expect(logs.join('\n')).toMatch(/the artifact manifest lists would not be uploaded, e\.g\. _headers/);
  });

  it('still refuses _redirects and .assetsignore, beside a vetted _headers', () => {
    tree({ ...base, _headers: PROPOSED, _redirects: '/a /b 301\n', '.assetsignore': 'x\n' });
    expect(() => prepare(['index.html', 'assets/index-Abc123.js', '_headers'])).toThrow(/not fit/);
    const text = logs.join('\n');
    expect(text).toMatch(/dist-release holds (?:.assetsignore, _redirects|_redirects, .assetsignore): Cloudflare reads those as configuration/);
    expect(text).not.toMatch(/_headers is not the vetted/);
  });

  it('applies the same rule to a Pages upload: _headers vetted, _routes.json refused', () => {
    tree({ ...base, _headers: PROPOSED });
    expect(prepare(['index.html', 'assets/index-Abc123.js', '_headers'], 'pages').ok).toBe(true);
    logs.length = 0;
    tree({ '_routes.json': '{}' });
    expect(() => prepare(['index.html', 'assets/index-Abc123.js', '_headers'], 'pages')).toThrow(/not fit/);
    expect(logs.join('\n')).toMatch(/dist-release holds _routes\.json/);
  });
});
