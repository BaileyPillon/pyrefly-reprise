/**
 * PR-0396 (round 25, both games, shared delivery tooling): only files whose names carry a content hash are cached for a year.
 *
 * What is proved here:
 *   - the classification of paths: a file is `immutable` when it sits under `assets/` and is named the way Vite names a hashed file,
 *     and `revalidate` (the host's default) for everything else, including the art whose names merely look hashed;
 *   - the `_headers` file the build ships (`public/_headers`) is the vetted one and implements exactly that classification;
 *   - a real Vite build names every file it emits under `assets/` with a hash, so the rule covers all of them and `index.html`
 *     is the one file left outside it;
 *   - the deploy gate's check: every file the long-cache rule matches carries a hash, or the deploy stops.
 * The headers themselves can only be proved on the deployed site: docs/handoff/r43-delivery.md lists the curl checks.
 */
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { build } from 'vite';

import { CACHE_CLASSES, HASHED_DIR, cacheFromHeaders, cacheRules, classifyCache, isContentHashed, patternMatches, unhashedUnderRule } from '../../tools/cache-class.mjs';
import { VETTED_HEADERS, checkHeadersFile } from '../../tools/deploy-host.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const IMMUTABLE = 'public, max-age=31536000, immutable';

/** The files of the live build a061e9dc that carry a hash, byte for byte as its artifact manifest lists them. */
const LIVE_HASHED = ['assets/index-Chs9J3OY.js', 'assets/index-DiS-CYp9.css', 'assets/worker-CJvtQ5Pf.js', 'assets/worker-DJqiQx36.js'];

/**
 * Real paths of the live build that must keep the host's default: the page, the artifact manifest (served, though it does not list itself),
 * the licences, and the art, audio, fonts and depth maps. The art names in the middle are real ones that END IN A DASH AND EIGHT CHARACTERS, so by their shape alone they look
 * like Vite's (`road-to-the-farplane`, `via-infinito`, `od-slice-and-dice`): only the folder tells them apart.
 */
const LIVE_PLAIN = [
  'index.html',
  'artifact-manifest.json',
  'third-party-licenses.md',
  'art/title/keyart.webp',
  'art/title/keyart.2x.webp',
  'art/backdrops/dreams-end.webp',
  'art/backdrops/road-to-the-farplane.webp',
  'art/backdrops/road-to-the-farplane.json',
  'art/backdrops/via-infinito.webp',
  'art/backdrops/via-purifico.webp',
  'art/backdrops/wings/den-of-woe-left.png',
  'art/characters/tidus/od-slice-and-dice.png',
  'art/characters/tidus/idle@2x.png',
  'art/pause/ch14-isaaru-via-purifico.webp',
  'art/pause/ch18-sin-face.webp',
  'art/portraits/exp-leblanc-rikku-x2.json',
  'art/manifest.json',
  'audio/manifest.json',
  'audio/music/scene-gagazet.mp3',
  'audio/music/boss-seymour.mp3',
  'audio/sfx/sprite.mp3',
  'fonts/chakra-petch/ChakraPetch-Regular-400.woff2',
  'fx/bevelle-underground/depth.png',
  'fx/dreams-end/depth.json',
];

describe('classifyCache: a year only for a file whose name changes with its content', () => {
  it.each(LIVE_HASHED)('%s is immutable', (path) => {
    expect(isContentHashed(path)).toBe(true);
    expect(classifyCache(path)).toEqual({ cache: 'immutable', cacheControl: IMMUTABLE });
  });

  it.each(LIVE_PLAIN)('%s keeps the host\'s default', (path) => {
    expect(isContentHashed(path)).toBe(false);
    expect(classifyCache(path)).toEqual({ cache: 'revalidate', cacheControl: null });
  });

  it('reads a path the way a URL or a Windows build writes it', () => {
    for (const form of ['/assets/index-Chs9J3OY.js', 'assets/index-Chs9J3OY.js?v=1700000000000', 'assets/index-Chs9J3OY.js#x', 'assets\\index-Chs9J3OY.js', '//assets/index-Chs9J3OY.js']) {
      expect(classifyCache(form).cache, form).toBe('immutable');
    }
    expect(classifyCache('/index.html?v=1').cache).toBe('revalidate');
  });

  it('wants both the folder and the shape', () => {
    // under assets/ but no hash: a file someone dropped into public/assets/
    for (const p of ['assets/logo.svg', 'assets/readme.txt', 'assets/index.js', 'assets/sub/chunk.mjs', 'assets/index-abc.js', 'assets/index-Chs9J3O.js', 'assets/index-Chs9J3OYZ.js', 'assets/index-.js', 'assets/-Chs9J3OY.js', 'assets/index-Chs9J3OY', 'assets/Chs9J3OY.js']) {
      expect(isContentHashed(p), p).toBe(false);
    }
    // the shape of a hash, in the wrong place
    for (const p of ['index-Chs9J3OY.js', 'static/index-Chs9J3OY.js', 'assets-old/index-Chs9J3OY.js', 'xassets/index-Chs9J3OY.js', 'art/assets/index-Chs9J3OY.js', 'art/backdrops/road-to-the-farplane.webp']) {
      expect(isContentHashed(p), p).toBe(false);
    }
    // a hashed file in a sub-folder of assets/ still counts (Vite writes chunks and workers there)
    expect(isContentHashed('assets/sub/chunk-AbCd_Ef9.mjs')).toBe(true);
    expect(HASHED_DIR).toBe('assets/');
  });

  it('there are exactly two classes, and the long one is the vetted value', () => {
    expect(CACHE_CLASSES).toEqual({ immutable: IMMUTABLE, revalidate: null });
    expect(VETTED_HEADERS.cacheControl).toBe(IMMUTABLE);
    expect(Object.keys(CACHE_CLASSES)).toEqual(['immutable', 'revalidate']);
  });
});

describe('patternMatches: Cloudflare\'s splat', () => {
  it('matches anything under the folder, slashes included, and nothing outside it', () => {
    expect(patternMatches('/assets/*', 'assets/index-Chs9J3OY.js')).toBe(true);
    expect(patternMatches('/assets/*', '/assets/sub/dir/x.js')).toBe(true);
    expect(patternMatches('/assets/*', 'assets/')).toBe(true);
    expect(patternMatches('/assets/*', 'assets')).toBe(false);
    expect(patternMatches('/assets/*', 'assetsx/a.js')).toBe(false);
    expect(patternMatches('/assets/*', 'art/assets/a.js')).toBe(false);
    expect(patternMatches('/assets/*', 'index.html')).toBe(false);
  });

  it('is exact without a splat, and takes a dot as a dot', () => {
    expect(patternMatches('/index.html', 'index.html')).toBe(true);
    expect(patternMatches('/index.html', 'indexXhtml')).toBe(false);
    expect(patternMatches('/a+b/*', 'a+b/c')).toBe(true);
    expect(patternMatches('/a+b/*', 'aab/c')).toBe(false);
  });
});

describe('the _headers the build ships', () => {
  const text = readFileSync(join(ROOT, 'public', '_headers'), 'utf8');

  it('is the vetted file: one rule, the long cache on /assets/*, nothing else', () => {
    expect(checkHeadersFile(text)).toEqual([]);
    expect(cacheRules(text)).toEqual([{ pattern: '/assets/*', cacheControl: IMMUTABLE }]);
    expect(VETTED_HEADERS.patterns).toEqual(['/assets/*']);
  });

  it('is kept with LF line endings, so its bytes (which the artifact hashes) do not depend on the machine that checks it out', () => {
    const attributes = readFileSync(join(ROOT, '.gitattributes'), 'utf8');
    expect(attributes).toMatch(/^public\/_headers\s+text\s+eol=lf\s*$/m);
  });

  it('makes exactly the files the classifier calls immutable immutable, and leaves every other file with the host\'s default', () => {
    for (const p of [...LIVE_HASHED, ...LIVE_PLAIN, 'assets/logo.svg', 'assets/index-abc.js']) {
      expect(cacheFromHeaders(p, text), p).toBe(p.startsWith('assets/') ? 'immutable' : 'revalidate');
    }
    // and for every live file the file and the classifier agree, except where a file under assets/ has no hash: that is the gate's case
    for (const p of [...LIVE_HASHED, ...LIVE_PLAIN]) expect(cacheFromHeaders(p, text), p).toBe(classifyCache(p).cache);
  });

  it('reads the same with CRLF, comments and blank lines', () => {
    const crlf = text.replace(/\n/g, '\r\n');
    expect(cacheRules(crlf)).toEqual(cacheRules(text));
    expect(cacheFromHeaders('assets/index-Chs9J3OY.js', crlf)).toBe('immutable');
    expect(cacheFromHeaders('index.html', crlf)).toBe('revalidate');
  });
});

describe('unhashedUnderRule: the deploy gate\'s check', () => {
  const rule = '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n';

  it('passes the live build\'s files', () => {
    expect(unhashedUnderRule(rule, [...LIVE_HASHED, ...LIVE_PLAIN])).toEqual([]);
  });

  it('names every file the rule would cache for a year that has no hash in its name, sorted', () => {
    expect(unhashedUnderRule(rule, ['assets/logo.svg', ...LIVE_HASHED, 'assets/sub/pic.png', 'index.html', 'assets/index-abc.js'])).toEqual(['assets/index-abc.js', 'assets/logo.svg', 'assets/sub/pic.png']);
  });

  it('does not mind a file outside the rule, hashed or not', () => {
    expect(unhashedUnderRule(rule, ['index.html', 'art/backdrops/road-to-the-farplane.webp', 'index-Chs9J3OY.js'])).toEqual([]);
  });

  it('a file with no matching rule is not its business', () => {
    expect(unhashedUnderRule('/other/*\n  Cache-Control: public, max-age=60\n', ['assets/logo.svg'])).toEqual([]);
    expect(unhashedUnderRule('', ['assets/logo.svg'])).toEqual([]);
  });
});

describe('a real Vite build names everything under assets/ with a hash', () => {
  const dirs: string[] = [];
  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
  });

  it('the repo\'s own config leaves the names to Vite: assetsDir assets, no file-name override', () => {
    const config = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
    expect(config).toMatch(/assetsDir:\s*'assets'/);
    expect(config).not.toMatch(/assetFileNames|chunkFileNames|entryFileNames/);
  });

  it('a page with a script, a style sheet, a lazy chunk, a worker and an imported image', async () => {
    const root = mkdtempSync(join(tmpdir(), 'pyrefly-cache-class-'));
    dirs.push(root);
    const src = join(root, 'src');
    mkdirSync(src);
    writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><script type="module" src="/src/main.js"></script></body></html>\n');
    writeFileSync(join(src, 'main.js'), [
      "import './style.css';",
      "import pic from './pic.svg';",
      "import('./lazy.js').then((m) => console.log(m.default, pic));",
      "new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });",
      '',
    ].join('\n'));
    writeFileSync(join(src, 'style.css'), 'body { color: #123456; }\n');
    writeFileSync(join(src, 'lazy.js'), 'export default "lazy chunk, long enough to stay a file of its own".repeat(20);\n');
    writeFileSync(join(src, 'worker.js'), 'self.onmessage = (e) => self.postMessage(e.data * 2);\n');
    writeFileSync(join(src, 'pic.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">${'<rect width="10" height="10"/>'.repeat(300)}</svg>\n`);
    await build({ root, logLevel: 'silent', configFile: false, base: '/', build: { outDir: 'out', assetsDir: 'assets', emptyOutDir: true, assetsInlineLimit: 0, sourcemap: false, minify: true }, worker: { format: 'es' } });

    const out = join(root, 'out');
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else files.push(relative(out, full).split('\\').join('/'));
      }
    };
    walk(out);
    const hashed = files.filter((f) => f !== 'index.html');
    expect(files).toContain('index.html');
    expect(hashed.length, `what the build wrote: ${files.join(', ')}`).toBeGreaterThanOrEqual(5); // main, css, lazy chunk, worker, image
    for (const f of hashed) {
      expect(f.startsWith('assets/'), `${f} is outside assets/`).toBe(true);
      expect(isContentHashed(f), `${f} carries no hash Vite-shaped`).toBe(true);
    }
    // and the shipped rule gives all of them the long cache, and the page the default
    const rule = readFileSync(join(ROOT, 'public', '_headers'), 'utf8');
    for (const f of hashed) expect(cacheFromHeaders(f, rule), f).toBe('immutable');
    expect(cacheFromHeaders('index.html', rule)).toBe('revalidate');
    expect(unhashedUnderRule(rule, files)).toEqual([]);
  }, 60_000);
});
