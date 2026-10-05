/**
 * The game is "Echoes of Spira" since 2026-10-04 (Bailey: "I need a new working title for my game I dont like
 * pyrefly reprise", then, from the driver's list, "I'll go with Echoes of Spira. The name change should take place
 * immediate in our next build please."). No copy of the old title, "Pyrefly Reprise", may remain where a player can
 * read it: the page title, the meta description, the no-script line, the title card's wordmark, the pause brand line,
 * the WebGL-refused heading, and anything a build writes beside them.
 *
 * What is NOT the title and is allowed to say "pyrefly": the internal identifiers. They are kebab or snake case, one
 * token, never the two words with a space, a tag or a line break between them: `pyrefly-reprise:save:v1` and
 * `pyrefly-reprise:experiments:v1` (renaming either would lose a player's progress, see
 * `save-release-37-1.test.ts`), the `/pyrefly-reprise/` base path, `window.__pyrefly`, `PYREFLY_*`, the CSS prefixes,
 * and the in-world pyrefly (the spirit lights, the dissolve, the `pyrefly` SFX id).
 *
 * Two layers, both here:
 *
 * 1. The shipped SOURCE, always: `index.html`, everything under `src/`, and `public/` outside `art/`. Whole-line comments
 *    are skipped (the minifier drops them; an HTML comment ships and is scanned).
 * 2. A BUILD, when one is there to scan: `PYREFLY_SCAN_DIST=<dir>` names one (it must exist, and a build that is named
 *    and missing fails), else `dist/` is scanned when it is newer than every source file. A stale `dist/` is skipped on
 *    purpose: after a merge it still holds the old bundle until the next `npm run build`, and a gate that fails on that
 *    would fail every test run for the wrong reason. Point it at a release candidate with
 *    `PYREFLY_SCAN_DIST=dist-release node node_modules/vitest/vitest.mjs run tests/unit/player-facing-title.test.ts`.
 *
 * Controls (the css-comments precedent): each shape the old title could ship in is fed to the scanner on a fixture, so
 * a green run means the gate can see them, not that it looks away.
 *
 * Game case: both. The title is the product's name, one string for FFX and FFX-2 alike (AGENTS.md rule 14).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const slash = (p: string): string => p.split('\\').join('/');

/**
 * The old title as a player could read it: the two words with only spaces, no-break spaces, entities, a middle dot or
 * markup between them (so a wordmark split over two stacked elements is the same match), in any case (the CSS
 * `text-transform` that capitalises it does not change the source).
 */
const OLD_TITLE = /pyrefly(?:\s|&nbsp;|&#160;|&#xa0;|&middot;|&#183;|[\u00a0\u00b7]|<[^>]*>)+reprise/i;
/** Either half alone as the whole text of an element: `>Pyrefly<`, `> Reprise <`. */
const LONE_HALF = />\s*(?:pyrefly|reprise)\s*</i;

/** Every place `text` would show the old title to a player, as short snippets (empty when it does not). */
function oldTitleSnippets(text: string): string[] {
  const out: string[] = [];
  for (const re of [OLD_TITLE, LONE_HALF]) {
    const g = new RegExp(re.source, 'gi');
    for (const m of text.matchAll(g)) {
      const at = m.index ?? 0;
      out.push(text.slice(Math.max(0, at - 30), at + m[0].length + 30).replace(/\s+/g, ' ').trim());
      if (out.length >= 5) return out;
    }
  }
  return out;
}

/** Drop whole-line comments (`//`, `/*`, ` * `, `*\/`) so prose about the old name in a doc comment is not "shipped". */
function withoutCommentLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^\s*(?:\/\/|\/\*|\*)/.test(line))
    .join('\n');
}

// ------------------------------------------------------------------ file walking

const TEXT_EXT = new Set(['.ts', '.js', '.mjs', '.css', '.html', '.json', '.svg', '.txt', '.md', '.webmanifest', '.xml']);
const MAX_BYTES = 12 * 1024 * 1024;

/** The scans read about thirteen hundred files (more under a build): give them room when the whole suite loads the machine. */
const SLOW_MS = 120_000;

/**
 * Folders never scanned, by name and ONLY at the top of `public/` or of a build (`src/engine/fx` is source and is
 * scanned): painted art (a junction to the main tree in a worktree, 800 MB), fonts, derived fx depth maps.
 */
const SKIP_AT_TOP = new Set(['art', 'fonts', 'fx']);

function walk(root: string, skipTop: boolean, dir = root, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || (skipTop && dir === root && SKIP_AT_TOP.has(entry.name))) continue;
      walk(root, skipTop, join(dir, entry.name), out);
      continue;
    }
    // A reparse point (the `art` junction) is not a Dirent directory on Windows; it has no text extension either way.
    const dot = entry.name.lastIndexOf('.');
    if (dot < 0 || !TEXT_EXT.has(entry.name.slice(dot).toLowerCase())) continue;
    const full = join(dir, entry.name);
    if (statSync(full).size <= MAX_BYTES) out.push(full);
  }
  return out;
}

function offenders(files: string[], base: string, skipComments: boolean): string[] {
  const found: string[] = [];
  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    // One cheap pass first: most files name neither word, and the careful patterns need only see the rest.
    if (!/pyrefly|reprise/i.test(raw)) continue;
    const isCode = /\.(?:ts|js|mjs|css)$/i.test(file);
    for (const snip of oldTitleSnippets(skipComments && isCode ? withoutCommentLines(raw) : raw)) {
      found.push(`${slash(relative(base, file))}: ...${snip}...`);
    }
  }
  return found;
}

// ------------------------------------------------------------------ the controls

describe('the scanner sees the old title in every shape it could ship in (controls)', () => {
  const caught: Array<[string, string]> = [
    ['a page title', '<title>Pyrefly Reprise</title>'],
    ['a meta description', '<meta name="description" content="Pyrefly Reprise - an unofficial HD-2D fan tribute." />'],
    ['capitals', 'PYREFLY REPRISE'],
    ['a no-break space', 'Pyrefly\u00a0Reprise needs JavaScript'],
    ['an entity', 'Pyrefly&nbsp;Reprise'],
    ['the pause brand line', '<div class="pause__brand">Pyrefly Reprise &middot; Final Fantasy X</div>'],
    [
      'the title card split over two stacked lines (the shape that shipped)',
      '<div class="fe-title__name">Pyrefly</div>\n      <div class="fe-title__name">Reprise</div>',
    ],
    ['either half alone as an element', '<div class="fe-title__name">Reprise</div>'],
    ['a template literal holding it', 'ui.innerHTML=`<h1 style="x">\n          Pyrefly Reprise\n        </h1>`'],
  ];
  for (const [shape, text] of caught) {
    it(`flags ${shape}`, () => {
      expect(oldTitleSnippets(text), shape).not.toEqual([]);
    });
  }

  const allowed: Array<[string, string]> = [
    ['the save key', "export const SAVE_KEY = 'pyrefly-reprise:save:v1';"],
    ['the experiments key', "const K = 'pyrefly-reprise:experiments:v1';"],
    ['the base path in a built asset URL', '<script type="module" src="/pyrefly-reprise/assets/index-DhiL5vEz.js"></script>'],
    ['the debug handle', 'window.__pyrefly = api; window.__pyreflyReady = true;'],
    ['an environment variable', 'process.env.PYREFLY_BROWSER'],
    ['a console tag', "console.error('[pyrefly]', message)"],
    ['the in-world effect', 'a pyrefly dissolve, then the title reprise swells'],
    ['the new title', '<title>Echoes of Spira</title>'],
  ];
  for (const [what, text] of allowed) {
    it(`lets ${what} through`, () => {
      expect(oldTitleSnippets(text), what).toEqual([]);
    });
  }

  it('skips a doc comment that names the old title but not the same words in code', () => {
    expect(oldTitleSnippets(withoutCommentLines(' * Self-hosted OFL webfonts for Pyrefly Reprise.\n// Pyrefly Reprise\n/* Pyrefly Reprise */'))).toEqual([]);
    expect(oldTitleSnippets(withoutCommentLines('const t = "Pyrefly Reprise";'))).not.toEqual([]);
  });
});

// ------------------------------------------------------------------ the shipped source

describe('no player-facing copy of the old title in what ships (source)', () => {
  it('index.html: the tab title, the description and the no-script line', () => {
    expect(offenders([join(ROOT, 'index.html')], ROOT, false)).toEqual([]);
  }, SLOW_MS);

  it('src/: every script, sheet and data file', () => {
    const files = walk(join(ROOT, 'src'), false);
    expect(files.length, 'the walk found src/').toBeGreaterThan(300);
    expect(offenders(files, ROOT, true)).toEqual([]);
  }, SLOW_MS);

  it('public/ outside art/: manifests and text files that ship beside the bundle', () => {
    expect(offenders(walk(join(ROOT, 'public'), true), ROOT, false)).toEqual([]);
  }, SLOW_MS);
});

describe('the new title is where the player reads it (source)', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

  it('index.html names the game "Echoes of Spira" in the tab title, the description and the no-script line', () => {
    expect(html).toMatch(/<title>Echoes of Spira<\/title>/);
    expect(html).toMatch(/<meta name="description" content="Echoes of Spira - an unofficial HD-2D fan tribute to Final Fantasy X and X-2\." \/>/);
    expect(html).toMatch(/<noscript>[\s\S]*Echoes of Spira needs JavaScript and WebGL 2\.[\s\S]*<\/noscript>/);
  });

  it('the pause brand line and the WebGL-refused heading say it too', () => {
    const pause = readFileSync(join(ROOT, 'src', 'app', 'screens', 'pause', 'PauseView.ts'), 'utf8');
    expect(pause).toContain('<div class="pause__brand">Echoes of Spira &middot; ${escapeHtml(game)}</div>');
    const main = readFileSync(join(ROOT, 'src', 'main.ts'), 'utf8');
    expect(main).toMatch(/<h1[^>]*>\s*Echoes of Spira\s*<\/h1>/);
  });
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
  const dist = join(ROOT, 'dist');
  const index = join(dist, 'index.html');
  if (!existsSync(index)) return { kind: 'none', why: 'no dist/ here: set PYREFLY_SCAN_DIST=<build folder> to scan a build' };
  if (statSync(index).mtimeMs < newestSourceMs()) {
    return { kind: 'none', why: 'dist/ is older than the source (a stale build is not scanned): rebuild or set PYREFLY_SCAN_DIST' };
  }
  return { kind: 'scan', dir: dist, why: 'dist/ is newer than every source file' };
}

describe('no player-facing copy of the old title in a build', () => {
  const build = resolveBuild();
  // eslint-disable-next-line no-console
  console.info(`[player-facing-title] build scan: ${build.kind === 'scan' ? 'ON, ' : 'skipped, '}${build.why}`);

  it.runIf(build.kind === 'missing')('the build named by PYREFLY_SCAN_DIST exists', () => {
    throw new Error(build.why);
  });

  const scan = it.runIf(build.kind === 'scan');

  scan('index.html and every shipped script, sheet and manifest hold none of it', () => {
    if (build.kind !== 'scan') return;
    const files = walk(build.dir, true);
    expect(files.some((f) => slash(f).endsWith('/index.html')), 'the build has an index.html').toBe(true);
    expect(files.some((f) => f.endsWith('.js')), 'the build has scripts').toBe(true);
    expect(files.some((f) => f.endsWith('.css')), 'the build has a sheet').toBe(true);
    expect(offenders(files, build.dir, false)).toEqual([]);
  }, SLOW_MS);

  scan('the build says "Echoes of Spira" in its tab title and in the code that draws the title card, pause and error screen', () => {
    if (build.kind !== 'scan') return;
    const index = readFileSync(join(build.dir, 'index.html'), 'utf8');
    expect(index).toMatch(/<title>Echoes of Spira<\/title>/);
    expect(index).toMatch(/Echoes of Spira needs JavaScript and WebGL 2\./);
    const scripts = walk(join(build.dir, 'assets'), false)
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(scripts).toMatch(/fe-title__name">Echoes<\/div>\s*<div class="fe-title__name">of Spira<\/div>/);
    expect(scripts).toContain('pause__brand">Echoes of Spira &middot; ');
    expect(scripts).toMatch(/<h1[^>]*>\s*Echoes of Spira\s*<\/h1>/);
  }, SLOW_MS);
});
