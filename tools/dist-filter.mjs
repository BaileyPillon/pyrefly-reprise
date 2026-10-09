/**
 * What never ships: working files in `public/` (PR-0100, PR-0173) and source
 * maps (PR-0328, D-335).
 *
 * Vite copies `public/` into the build whole, so three kinds of working file
 * went live in every release although nothing in the game can request them:
 *
 * - `audio/candidates/**`: audition sketches (52 files, 34 MB in round 13).
 *   `docs/audio/audition.html` plays them from `../../public/audio/candidates/`
 *   on this disk, never from the site, and `tools/audio/render-range.mjs` and
 *   `ace-step.mjs` write them there on purpose, unlisted in the manifest.
 * - `art/**\/*.raw.png`: the unprocessed render behind a painting.
 * - `art/**\/*.N.png` and `*.N.json` (a number before the extension): the
 *   numbered takes a painting was picked from. The art manifest lists none of
 *   them and `src/` names none (CHK-018); their sidecars only mention such
 *   paths as provenance strings.
 *
 * - `bts/**` (while the page's switch is off): the pictures of the BEHIND THE SCENES page. Bailey, 2026-10-08: the
 *   page is built and not public until he approves it (`src/app/changelog/behindTheScenes.ts`, `BTS_LIVE`), so its
 *   sixteen pictures in `public/bts/` stay on disk and out of every build until the switch is turned on; with it on,
 *   this rule is gone and they ship. The page's code and words are kept out of the bundle by the same constant.
 *
 * Source maps are the fourth kind (PR-0328, adopted by Bailey 2026-10-03 as
 * D-335): the three `.js.map` files of release 36 weighed 22,775,896 bytes,
 * nobody in the game or the critic's tooling ever requests them, and the site
 * is held to 800,000,000 bytes (D-332). A build keeps a copy of them outside
 * the build folder when it is told where (`keepSourceMaps`, used by the
 * deploy), never ships a `.map` file and never leaves a `sourceMappingURL`
 * comment in the code (`findSourceMapReferences`).
 *
 * The build prunes the unshipped files (the `pyrefly-dist-filter` plugin in
 * `vite.config.ts`) so both `npm run build` and `npm run deploy` leave them
 * out, and the deploy preflight refuses a build that still carries one. They
 * stay on disk and in `D:\Tools\pyrefly-art-backup`.
 *
 * Game case: both (delivery plumbing, CHK-017).
 */
import { copyFileSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';

import { BTS_LIVE } from '../src/app/changelog/behindTheScenes.ts';

/**
 * The environment variable that asks a build to keep its source maps off to the
 * side (a folder path). Unset: the build makes none. `vite.config.ts` reads it;
 * `tools/deploy-pages.mjs` sets it to a folder keyed by the commit.
 */
export const SOURCEMAP_DIR_ENV = 'PYREFLY_SOURCEMAP_DIR';

/** @param {string} rel a path relative to the build root (or `public/`), either slash. */
export function isUnshippedPublicFile(rel) {
  const p = rel.split(sep).join('/').replace(/^\/+/, '');
  if (p === 'audio/candidates' || p.startsWith('audio/candidates/')) return true;
  if (!BTS_LIVE && (p === 'bts' || p.startsWith('bts/'))) return true;
  if (!p.startsWith('art/')) return false;
  if (/\.raw\.png$/i.test(p)) return true;
  return /\.[0-9]+\.(png|json)$/i.test(p);
}

/**
 * A source map the bundler wrote beside its code: `assets/index-x.js.map`,
 * `assets/worker-y.js.map`, a `.css.map`. Only these suffixes, so a data file
 * that happens to end in `.map` is never touched.
 * @param {string} rel a path relative to the build root, either slash.
 */
export function isSourceMapFile(rel) {
  return /\.(?:m?js|css)\.map$/i.test(rel.split(sep).join('/'));
}

/**
 * Does this code or stylesheet text point at a source map? True for a
 * `//# sourceMappingURL=` line comment or a `/*# sourceMappingURL=` block
 * comment that starts a line, which is where bundlers put it (after the last
 * statement). A string inside the code that merely mentions the name does not
 * match.
 * @param {string} text
 */
export function hasSourceMapReference(text) {
  return /(?:^|\n)[ \t]*(?:\/\/|\/\*)[#@][ \t]*sourceMappingURL=/.test(text);
}

/** Every real file under `root` as `{ rel, full }`; links are never followed. */
function listFiles(root) {
  const out = [];
  const walk = (dir) => {
    let names;
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      const full = join(dir, name);
      // lstat, never stat: a link (a worktree's junctioned public/art) is not
      // followed, so pruning can only ever touch the build's own files.
      const st = lstatSync(full);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) walk(full);
      else out.push({ rel: relative(root, full).split(sep).join('/'), full });
    }
  };
  walk(root);
  return out;
}

/** Every file under `root` (relative, forward slashes) that must not ship. */
export function findUnshipped(root) {
  return listFiles(root)
    .filter(({ rel }) => isUnshippedPublicFile(rel) || isSourceMapFile(rel))
    .map(({ rel }) => rel);
}

/** The code, stylesheets and pages under `root` that still carry a `sourceMappingURL` comment. */
export function findSourceMapReferences(root) {
  return listFiles(root)
    .filter(({ rel }) => ['.js', '.mjs', '.css', '.html'].includes(extname(rel).toLowerCase()))
    .filter(({ full }) => hasSourceMapReference(readFileSync(full, 'latin1')))
    .map(({ rel }) => rel);
}

/**
 * Copy every source map of a finished build to `dest` (same relative paths,
 * `dest/assets/index-x.js.map`), before the build is pruned. Returns what was
 * copied. The copy is the only place the maps live afterwards: the deploy
 * keys `dest` by commit under `D:\Tools\pyrefly-sourcemaps`.
 */
export function keepSourceMaps(root, dest) {
  const kept = [];
  for (const { rel, full } of listFiles(root)) {
    if (!isSourceMapFile(rel)) continue;
    const to = join(dest, ...rel.split('/'));
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(full, to);
    kept.push(rel);
  }
  return kept;
}

/** Delete them from a finished build. Returns what was removed. */
export function pruneUnshipped(root) {
  const removed = findUnshipped(root);
  for (const rel of removed) rmSync(join(root, rel), { force: true });
  // The candidates folder (and the page's picture folder while its switch is off) goes too, so no
  // empty directory ships (only when it is a real, now empty folder).
  for (const folder of [join(root, 'audio', 'candidates'), join(root, 'bts')]) {
    try {
      const st = lstatSync(folder);
      if (st.isDirectory() && !st.isSymbolicLink() && readdirSync(folder).length === 0) rmSync(folder, { recursive: true });
    } catch {
      /* no such folder */
    }
  }
  return removed;
}
