/**
 * No art URL that starts at the server root ships (release 38, branch r38-keyart-fix). Game case: both (the page and the build are
 * shared plumbing, no game content).
 *
 * One build is served from two places: GitHub Pages serves release 38 under `/pyrefly-reprise/` and Cloudflare serves release 39
 * at the root. A name that starts with `/art/` is right at the root and a 404 under the folder, so every art URL a page, a sheet
 * or a script holds is built from the base: `artUrl()` and `artManifestPath()` in code (`import.meta.env.BASE_URL`), and the
 * `BASE_URL` variable in `index.html`, which Vite fills in from the base of the build.
 *
 * How it bit (2026-10-04, found by a check of release 38's candidate): `index.html` preloads the title plate by name, with a 1344w
 * and a 2688w candidate. Vite puts the base on such a name only when the file is in `public/` while it builds. A build that did
 * not find `public/art/title/keyart.2x.webp` (a half-installed art tree, a copy made before the master landed) kept
 * `/art/title/keyart.2x.webp` in the page, and a browser at 1600x900 (or on any 2x screen) picks that candidate for the preload and
 * asked the server root for it: a 404 under `/pyrefly-reprise/`, while the title's own `<img srcset>` (made by `artUrl`) asked the
 * right place. Built with every file in place the page was right, which is why no earlier check saw it.
 *
 * Two layers, both here (the precedent is `player-facing-title.test.ts`):
 *
 * 1. The shipped SOURCE, always: `index.html`, everything under `src/`, and `public/` outside `art/`, `fonts/` and `fx/`. No literal
 *    in them begins with an absolute path into the art tree (`"/art/..."`, `url(/art/...)`, the second candidate of a srcset,
 *    or the same behind a hard-coded folder, `/pyrefly-reprise/art/...`). A name joined onto the base is not one (`${base}/art/...`,
 *    `${import.meta.env.BASE_URL}art/...`, the page's `BASE_URL` variable). Whole-line comments, trailing `//` comments and HTML
 *    comments are prose and are skipped.
 * 2. A BUILD, when one is there to scan: `PYREFLY_SCAN_DIST=<dir>` names one (it must exist, and a build that is named and
 *    missing fails), else `dist/` is scanned when it is newer than every source file (a stale one is skipped on purpose, as in the
 *    precedent). The base is read from the build's own `index.html` (the folder its module script is served from); every art URL
 *    in its pages, sheets and scripts must start with `<base>art/`. A build's code is read whole (a minifier left no comments, and a
 *    `//` inside one of its strings must not hide the rest of a very long line); its pages lose only their HTML comments.
 *
 * Controls (the precedent's habit): each shape is fed to the scanner on a fixture, so a green run means the gate can see them.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const slash = (p: string): string => p.split('\\').join('/');

/**
 * A literal that BEGINS with an absolute path into the art tree, with at most one folder in front of `art/` (the hard-coded
 * `/pyrefly-reprise/art/...`). It starts after a quote, a backtick, `(` (a CSS `url(`), `=` (an unquoted attribute), `,` (the next
 * srcset candidate) or white space. Something joined onto the base has another character before the slash (`}/art/...`) or none
 * at all (`BASE_URL` + `art/...`), so it never matches.
 */
const ROOTED_ART = /(?<=["'`(=,\s])\/(?:[A-Za-z0-9_-]+\/)?art\/[A-Za-z0-9_@.\-/]*/g;
/** `[src*="/art/portraits/"]`: an attribute selector matches part of a URL and requests nothing. */
const SELECTOR = /\[[\w-]+[*^$~|]=["']\/(?:[A-Za-z0-9_-]+\/)?art\/[^"']*["']\]/g;

/**
 * What a file is, for reading it: repo `source` (its comments are prose), a `html` page (its `<!-- -->` comments are prose), or `built`
 * code (a minifier left no comments, and a `//` inside one of its strings must not hide the rest of a very long line).
 */
type Kind = 'source' | 'html' | 'built';

/**
 * The code of a file with its prose taken out: HTML comments, block comments that start a line (and any later line that starts with
 * `*`, the middle of a doc block), `//` comments. A comment is cut only where it is plainly one, so code is never read as prose.
 */
function withoutComments(text: string, kind: Kind): string {
  if (kind === 'built') return text;
  if (kind === 'html') return text.replace(/<!--[\s\S]*?-->/g, '');
  const out: string[] = [];
  let inBlock = false;
  for (const line of text.split(/\r?\n/)) {
    let code = line;
    if (inBlock) {
      const end = code.indexOf('*/');
      if (end < 0) continue;
      inBlock = false;
      code = code.slice(end + 2);
    }
    const open = code.indexOf('/*');
    if (open >= 0 && code.slice(0, open).trim() === '') {
      const end = code.indexOf('*/', open + 2);
      if (end < 0) {
        inBlock = true;
        continue;
      }
      code = code.slice(0, open) + code.slice(end + 2);
    }
    if (/^\s*\*(?:\s|\/|$)/.test(code)) continue;
    out.push(code.replace(/(^|\s)\/\/.*$/, '$1'));
  }
  return out.join('\n');
}

/** Every art URL in `text` that starts at the root (behind at most one hard-coded folder), as the matched text. */
function rootedArtUrls(text: string, kind: Kind = 'source'): string[] {
  return [...withoutComments(text, kind).replace(SELECTOR, '').matchAll(ROOTED_ART)].map((m) => m[0]);
}

/** The rooted art URLs of a BUILD's text that do not start with its own base (`/pyrefly-reprise/` or `/`). */
function offBase(text: string, base: string, kind: Kind = 'built'): string[] {
  return rootedArtUrls(text, kind).filter((url) => !url.startsWith(`${base}art/`));
}

/** The folder a build is served from, read where its module script is: `/pyrefly-reprise/` or `/` (null when it cannot be read). */
function baseOf(indexHtml: string): string | null {
  const m = /<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]*?)assets\/[^"]+"/.exec(indexHtml);
  return m ? (m[1] ?? null) : null;
}

// ------------------------------------------------------------------ file walking

const SCANNED = /\.(?:ts|js|mjs|css|html)$/i;
const MAX_BYTES = 12 * 1024 * 1024;
/** The scans read about thirteen hundred files (more under a build): give them room when the whole suite loads the machine. */
const SLOW_MS = 120_000;
/** Folders never scanned, by name and only at the top of `public/` or of a build: the painted art (a junction in a worktree), fonts, depth maps. */
const SKIP_AT_TOP = new Set(['art', 'fonts', 'fx']);

function walk(root: string, skipTop: boolean, dir = root, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || (skipTop && dir === root && SKIP_AT_TOP.has(entry.name))) continue;
      walk(root, skipTop, join(dir, entry.name), out);
    } else if (SCANNED.test(entry.name)) {
      const full = join(dir, entry.name);
      if (statSync(full).size <= MAX_BYTES) out.push(full);
    }
  }
  return out;
}

/** The art URLs `judge` objects to in `files`, as `<file relative to base>: <url>`; `built` files are a build's, the rest are repo source. */
function offenders(files: string[], base: string, built: boolean, judge: (text: string, kind: Kind) => string[]): string[] {
  const found: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes('art/')) continue; // one cheap pass: most files name no art at all
    const kind: Kind = /\.html$/i.test(file) ? 'html' : built ? 'built' : 'source';
    for (const url of judge(text, kind)) found.push(`${slash(relative(base, file))}: ${url}`);
  }
  return found;
}

const HOW = 'build it with artUrl() / artManifestPath() (import.meta.env.BASE_URL), or write %BASE_URL% before it in index.html';

// ------------------------------------------------------------------ the controls

describe('the scanner sees a root-absolute art URL in every shape it could ship in (controls)', () => {
  const caught: Array<[string, string, number]> = [
    [
      'the title preload as it was (href and both srcset candidates)',
      '<link rel="preload" as="image" href="/art/title/keyart.png"\n  imagesrcset="/art/title/keyart.png 1344w, /art/title/keyart.2x.webp 2688w" />',
      3,
    ],
    ['the second candidate of a srcset', '<img srcset="/pyrefly-reprise/art/a.png 1w, /art/b.2x.webp 2w">', 2],
    ['a hard-coded base folder', '<img src="/pyrefly-reprise/art/title/keyart.png">', 1],
    ['a single-quoted literal', "const u = '/art/portraits/tidus.png';", 1],
    ['a double-quoted literal', 'const u = "/art/portraits/tidus.png";', 1],
    ['a template literal that starts at the root', 'const u = `/art/characters/${id}/idle.png`;', 1],
    ['a CSS url() with no quote', '.a { background: url(/art/backdrops/sky.png); }', 1],
    ['a CSS url() with a quote', ".a { background: url('/art/backdrops/sky.png'); }", 1],
    ['an unquoted attribute', '<img src=/art/title/keyart.png>', 1],
  ];
  for (const [shape, text, count] of caught) {
    it(`flags ${shape}`, () => {
      expect(rootedArtUrls(text), shape).toHaveLength(count);
    });
  }

  const allowed: Array<[string, string, Kind]> = [
    ['the page\'s BASE_URL variable', '<link rel="preload" as="image" href="%BASE_URL%art/title/keyart.png" imagesrcset="%BASE_URL%art/title/keyart.png 1344w, %BASE_URL%art/title/keyart.2x.webp 2688w">', 'html'],
    ['a template joined onto the base (ArtManifest.ts)', "return `${base.replace(/\\/+$/, '')}/art/manifest.json`;", 'source'],
    ['a template on BASE_URL', 'const u = `${import.meta.env.BASE_URL}art/title/keyart.png`;', 'source'],
    ['the relative name artUrl() takes', "export const TITLE_PLATE = 'art/title/keyart.png';", 'source'],
    ['a repo path in a string', "const f = 'public/art/title/keyart.png';", 'source'],
    ['an attribute selector (a part of a URL, no request)', "root.querySelectorAll('img[src*=\"/art/portraits/\"]:not([data-face-crop])')", 'source'],
    ['a block comment line', ' * `/art/.../ready.png` answers index.html and a 200', 'source'],
    ['a line comment', '// the plate is /art/title/keyart.png at the root', 'source'],
    ['a trailing comment', 'const a = 1; // was "/art/x.png"', 'source'],
    ['an HTML comment', '<!-- never write /art/title/keyart.png here -->', 'html'],
  ];
  for (const [what, text, kind] of allowed) {
    it(`lets ${what} through`, () => {
      expect(rootedArtUrls(text, kind), what).toEqual([]);
    });
  }

  it('a block comment that spans lines hides its prose and not the code after it', () => {
    expect(rootedArtUrls('/**\n * the plate is "/art/title/keyart.png"\n */\nconst u = "/art/x.png";')).toEqual(['/art/x.png']);
  });

  it('a built bundle is read whole: a "//" inside one of its strings does not hide what follows on the line', () => {
    const line = 'var a="see // there";f("/art/x.png")';
    expect(rootedArtUrls(line, 'built')).toEqual(['/art/x.png']);
  });

  it('a build is judged by its own base: /art/ is wrong under the folder, the folder is wrong at the root', () => {
    expect(offBase('<img src="/art/x.png">', '/pyrefly-reprise/', 'html')).toEqual(['/art/x.png']);
    expect(offBase('<img src="/pyrefly-reprise/art/x.png">', '/pyrefly-reprise/', 'html')).toEqual([]);
    expect(offBase('<img src="/art/x.png">', '/', 'html')).toEqual([]);
    expect(offBase('<img src="/pyrefly-reprise/art/x.png">', '/', 'html')).toEqual(['/pyrefly-reprise/art/x.png']);
    expect(offBase('f("/art/x.png")', '/pyrefly-reprise/')).toEqual(['/art/x.png']);
  });

  it('reads the base from where the build serves its module script', () => {
    expect(baseOf('<script type="module" crossorigin src="/pyrefly-reprise/assets/index-AbC.js"></script>')).toBe('/pyrefly-reprise/');
    expect(baseOf('<script type="module" crossorigin src="/assets/index-AbC.js"></script>')).toBe('/');
    expect(baseOf('<html></html>')).toBeNull();
  });
});

// ------------------------------------------------------------------ the shipped source

describe('no art URL starts at the server root in what ships (source)', () => {
  const judge = (text: string, kind: Kind): string[] => rootedArtUrls(text, kind);

  it('index.html: the title preload names its art through the BASE_URL variable', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    expect(offenders([join(ROOT, 'index.html')], ROOT, false, judge), HOW).toEqual([]);
    const link = /<link rel="preload"[^>]*>/.exec(withoutComments(html, 'html'))?.[0] ?? '';
    expect(link, 'index.html still preloads the title plate').toContain('imagesrcset=');
    expect(link).toContain('href="%BASE_URL%art/title/keyart.png"');
    expect(link).toContain('imagesrcset="%BASE_URL%art/title/keyart.png 1344w, %BASE_URL%art/title/keyart.2x.webp 2688w"');
  });

  it('src/: every script, sheet and page', () => {
    const files = walk(join(ROOT, 'src'), false);
    expect(files.length, 'the walk found src/').toBeGreaterThan(300);
    expect(offenders(files, ROOT, false, judge), HOW).toEqual([]);
  }, SLOW_MS);

  it('public/ outside art/, fonts/ and fx/: pages and scripts that ship beside the bundle', () => {
    expect(offenders(walk(join(ROOT, 'public'), true), ROOT, false, judge), HOW).toEqual([]);
  }, SLOW_MS);
});

// ------------------------------------------------------------------ a build

/** The newest mtime among the files a build is made from. */
function newestSourceMs(): number {
  const files = [join(ROOT, 'index.html'), ...walk(join(ROOT, 'src'), false), ...walk(join(ROOT, 'public'), true)];
  return files.reduce((m, f) => Math.max(m, statSync(f).mtimeMs), 0);
}

type Build = { kind: 'scan'; dir: string; why: string } | { kind: 'missing'; why: string } | { kind: 'none'; why: string };

function resolveBuild(): Build {
  const named = process.env['PYREFLY_SCAN_DIST'];
  if (named) {
    const dir = resolve(named);
    return existsSync(join(dir, 'index.html'))
      ? { kind: 'scan', dir, why: `named by PYREFLY_SCAN_DIST (${slash(dir)})` }
      : { kind: 'missing', why: `PYREFLY_SCAN_DIST=${named} names a folder with no index.html` };
  }
  const index = join(ROOT, 'dist', 'index.html');
  if (!existsSync(index)) return { kind: 'none', why: 'no dist/ here: set PYREFLY_SCAN_DIST=<build folder> to scan a build' };
  if (statSync(index).mtimeMs < newestSourceMs()) {
    return { kind: 'none', why: 'dist/ is older than the source (a stale build is not scanned): rebuild or set PYREFLY_SCAN_DIST' };
  }
  return { kind: 'scan', dir: join(ROOT, 'dist'), why: 'dist/ is newer than every source file' };
}

describe('no art URL starts at the server root in a build', () => {
  const build = resolveBuild();
  // eslint-disable-next-line no-console
  console.info(`[art-url-base] build scan: ${build.kind === 'scan' ? 'ON, ' : 'skipped, '}${build.why}`);

  it.runIf(build.kind === 'missing')('the build named by PYREFLY_SCAN_DIST exists', () => {
    throw new Error(build.why);
  });

  it.runIf(build.kind === 'scan')('every art URL in its pages, sheets and scripts starts with the build\'s own base', () => {
    if (build.kind !== 'scan') return;
    const index = readFileSync(join(build.dir, 'index.html'), 'utf8');
    const base = baseOf(index);
    expect(base, 'the module script of the build\'s index.html says where it is served from').not.toBeNull();
    const files = walk(build.dir, true);
    expect(files.some((f) => f.endsWith('.js')), 'the build has scripts').toBe(true);
    expect(files.some((f) => f.endsWith('.css')), 'the build has a sheet').toBe(true);
    expect(offenders(files, build.dir, true, (text, kind) => offBase(text, base ?? '/', kind)), `a build served from ${base}`).toEqual([]);
    // The title preload is the one place a page names art before any script runs: it must hold the base too.
    const link = /<link rel="preload"[^>]*>/.exec(index)?.[0] ?? '';
    expect(link, 'the build preloads the title plate').toContain(`href="${base}art/title/keyart.`);
    expect(link).toMatch(new RegExp(`imagesrcset="${base}art/title/keyart\\.(?:png|webp) 1344w, ${base}art/title/keyart\\.2x\\.webp 2688w"`));
  }, SLOW_MS);
});
