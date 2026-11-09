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
 * - `models-exp/**` except the two chapters' shipped sets (an allow-list: a new experiment's models stay out of every build until its folder is named here). (1) The models of the hidden 3D Bahamut chapter (FFX-2 only, `src/engine/yrp3d/`). They are large, gitignored and never committed (the tree that builds has them, as it has the
 *   art), and until 2026-11-02 nothing shipped them. Since the retail-assets rule was lifted (Bailey, 2026-10-18) and the chapter was folded in (branch `ch-yrp`) a build ships `isShippedModelFile`'s files: the base figures, their clips and
 *   weapons, the game's Bahamut in HD, and the fourteen dresspheres on Chapter IV's three Garment Grids at the base texture size (`YRP_SHIPPED_*`, `src/data/yrp-ids.ts`), with a `dress/index.json` rewritten to list only those
 *   (`trimDressIndex`), and their JSON notes cleaned of any local path (`scrubModelNotes`: the extraction wrote a scratch folder's path into one clip map's evidence line; ch-yrp review MAJOR-2). Never shipped: the AI boss's files, the HD figures of the girls, the HD tier of the dresspheres (688 MB; six files are over the 25 MiB the host takes) and the dresspheres no grid reaches.
 *   (2) `models-exp/windwaker/**` SHIPS whole (2026-11-02, the hidden Wind Waker chapter, Chapter 32, FFX-2 only: `src/engine/ww3d/`, the cast, the boss and the swappable weapon and temple pieces; the chapter loads them at run
 *   time and stands a neutral capsule in any slot whose file is missing). Like `public/art` and `public/fx` they come from this disk and are never committed (the repo is public): `tools/ww-models.mjs` records, backs up and
 *   verifies them, and a build from a clean worktree needs them restored first (`tools/vite-ww-models.mjs`). The allow-list names a FOLDER: a sibling that merely begins with `windwaker` stays out.
 *   (3) `models-exp/lake/**` SHIPS by a FILE allow-list (2026-11-07, the hidden Wendigo chapter, Chapter 49, FFX only: `src/engine/lake3d/`; `LAKE_SHIPPED_FILES` in `src/data/ffx/lake-models.ts`: ten Meshy bodies, nine weapons, five props, 24 files, every one under the host's 25 MiB). Like the others they come from this
 *   disk and are never committed: `tools/lake-models.mjs` records, backs up and restores them, `tools/vite-lake-models.mjs` runs that inside a build, and `tools/lake-models-verify.mjs` (the deploy's gate) proves the build carries exactly these files whole. A file in the folder that is not on the list stays out.
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
import { copyFileSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';

import { BTS_LIVE } from '../src/app/changelog/behindTheScenes.ts';
import { YRP_MODEL_DIRS, YRP_SHIPPED_BASE_FILES, YRP_SHIPPED_DRESS_FOLDERS, YRP_SHIPPED_HD_FILES } from '../src/data/yrp-ids.ts';
import { LAKE_MODEL_DIR, LAKE_SHIPPED_FILES } from '../src/data/ffx/lake-models.ts';
import { findLocalPaths, redactLocalPaths } from './dist-local-paths.mjs';

/**
 * The environment variable that asks a build to keep its source maps off to the
 * side (a folder path). Unset: the build makes none. `vite.config.ts` reads it;
 * `tools/deploy-pages.mjs` sets it to a folder keyed by the commit.
 */
export const SOURCEMAP_DIR_ENV = 'PYREFLY_SOURCEMAP_DIR';

/** The folder of the hidden 3D Bahamut's dress library under a build root, and its manifest. */
const DRESS_DIR = `${YRP_MODEL_DIRS.base}/dress/`;
const DRESS_INDEX = `${DRESS_DIR}index.json`;
const SHIPPED_BASE = new Set(YRP_SHIPPED_BASE_FILES.map((f) => `${YRP_MODEL_DIRS.base}/${f}`));
const SHIPPED_HD = new Set(YRP_SHIPPED_HD_FILES.map((f) => `${YRP_MODEL_DIRS.hd}/${f}`));
const SHIPPED_DRESS = new Set(YRP_SHIPPED_DRESS_FOLDERS);

/** The hidden Wind Waker chapter's models folder under a build root (ch-waker): it ships whole, every file in it (`tools/ww-models.mjs`, `tools/vite-ww-models.mjs`). */
const WINDWAKER_DIR = 'models-exp/windwaker';

/**
 * Is this path the hidden Wind Waker chapter's models folder, or a file in it? (`p` is under the build root with forward slashes.) The whole folder ships; `tools/yrp-models-verify.mjs` lets it stand beside the 3D Bahamut's set
 * (r74 integration: the two chapters' model sets ship together). A sibling folder that merely begins with the name is not it.
 * @param {string} p
 */
export function isWindwakerModelFile(p) {
  return p === WINDWAKER_DIR || p.startsWith(`${WINDWAKER_DIR}/`);
}

/** The hidden Wendigo chapter's models folder under a build root (ch-wendigo, Chapter 49, FFX only): `models-exp/lake`. Unlike the Wind Waker folder it ships by an ALLOW-LIST of files, not whole (`LAKE_SHIPPED_FILES`). */
export const LAKE_DIR = LAKE_MODEL_DIR.replace(/\/+$/, '');
const SHIPPED_LAKE = new Set(LAKE_SHIPPED_FILES.map((f) => `${LAKE_DIR}/${f}`));

/**
 * Is this path one of the hidden Wendigo chapter's 24 shipped model files (ten bodies, nine weapons, five props: `src/data/ffx/lake-models.ts` `LAKE_SHIPPED_FILES`)? (`p` is under the build root with forward slashes.) An allow-list of
 * files, so a stray file dropped into the folder (a scratch export, a rejected take, a retail file) stays out of every build; `tools/lake-models-verify.mjs` checks the shipped set is whole.
 * @param {string} p
 */
export function isLakeModelFile(p) {
  return SHIPPED_LAKE.has(p);
}

/**
 * Does this file of the hidden 3D Bahamut's models ship? (`p` is a path under the build root with forward slashes, starting `models-exp/`.) The base figures, clips, weapons and clip map; the game's Bahamut in HD and the HD clip
 * map; the shipped dresspheres' `anims.glb` and `clipmap.json` and the manifest (which `trimDressIndex` rewrites); and everything in the hidden Wind Waker chapter's own folder (`models-exp/windwaker/`, shipped whole; a sibling folder that merely begins with the name is not it).
 * Nothing else under `models-exp/`: not the AI boss, not the HD girls, not an HD dressphere, not an experiment whose folder is not named here.
 * @param {string} p
 */
export function isShippedModelFile(p) {
  if (isWindwakerModelFile(p) || isLakeModelFile(p)) return true;
  if (SHIPPED_BASE.has(p) || SHIPPED_HD.has(p) || p === DRESS_INDEX) return true;
  if (!p.startsWith(DRESS_DIR)) return false;
  const [folder, file, ...more] = p.slice(DRESS_DIR.length).split('/');
  return more.length === 0 && SHIPPED_DRESS.has(folder) && (file === 'anims.glb' || file === 'clipmap.json');
}

/** @param {string} rel a path relative to the build root (or `public/`), either slash. */
export function isUnshippedPublicFile(rel) {
  const p = rel.split(sep).join('/').replace(/^\/+/, '');
  if (p === 'audio/candidates' || p.startsWith('audio/candidates/')) return true;
  if (!BTS_LIVE && (p === 'bts' || p.startsWith('bts/'))) return true;
  if (p === 'models-exp' || p.startsWith('models-exp/')) return !isShippedModelFile(p);
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

/**
 * The dress library's manifest as it ships: only the entries whose folder ships, each with `hd` off (the HD tier is not shipped, so the page must not ask for it). A pure function of the parsed manifest; null when it is not one
 * (no `entries` array), which leaves the file as it is.
 * @param {unknown} json
 */
export function shippedDressIndex(json) {
  if (typeof json !== 'object' || json === null || Array.isArray(json) || !Array.isArray(json.entries)) return null;
  const entries = json.entries
    .filter((e) => typeof e === 'object' && e !== null && SHIPPED_DRESS.has(e.folder))
    .map((e) => ({ ...e, hd: false }));
  return { ...json, entries };
}

/** Rewrite the shipped copy of `models-exp/yrp/dress/index.json` in a pruned build (`shippedDressIndex`). Returns whether a manifest was there to rewrite; the build's own copy only, never the source. */
export function trimDressIndex(root) {
  const file = join(root, ...DRESS_INDEX.split('/'));
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return false; // no manifest (the chapter then plays on its single model per girl) or not JSON (left for the page to refuse)
  }
  const trimmed = shippedDressIndex(parsed);
  if (!trimmed) return false;
  writeFileSync(file, `${JSON.stringify(trimmed, null, 1)}\n`);
  return true;
}

/**
 * Does this text name a place on the PC that built it? The privacy gate's one definition of a local path (`tools/dist-local-paths.mjs` `findLocalPaths`: a drive path or a user-profile path), and the scratch folder's name
 * alone, which is just as local. The shipped models carry provenance notes written by the extraction scripts (a clip map's `evidence` line once named the folder its probe renders were in), and a local path is never
 * shipped in a string (house rule; ch-yrp review MAJOR-2).
 * @param {string} text
 */
export function carriesLocalPath(text) {
  return findLocalPaths(text).length > 0 || text.includes('pyrefly-scratch');
}

/**
 * The text of a shipped note with every local path taken out. A parenthetical that names one goes whole (with the space before it, so "...shows (renders in D:/x/y); the loops..." reads "...shows; the loops..."); any path
 * left is cut to its last name as the painting sidecars' are (`redactLocalPaths`); the scratch folder's name alone becomes "(a local folder)". Pure. The caller parses the result again before it writes it.
 * @param {string} text
 */
export function scrubLocalPaths(text) {
  const whole = text.replace(/[ \t]*\([^()"]*\)/g, (m) => (carriesLocalPath(m) ? '' : m));
  return redactLocalPaths(whole).replace(/[^\s"'()<>|,;]*pyrefly-scratch[^\s"'()<>|,;]*/g, '(a local folder)');
}

/**
 * Take the local paths out of the shipped copies of the models' JSON notes (the dresspheres' clip maps) in a pruned build. A file that has none is not touched; one that would stop parsing after the scrub is left alone
 * and named in the return so the verifier's scan reports it. The build's own copy only, never the source (the source is a hard link to the extraction output). Returns the files rewritten.
 */
export function scrubModelNotes(root) {
  const done = [];
  for (const { rel, full } of listFiles(join(root, 'models-exp'))) {
    if (extname(rel).toLowerCase() !== '.json') continue;
    const text = readFileSync(full, 'utf8');
    if (!carriesLocalPath(text)) continue;
    const clean = scrubLocalPaths(text);
    try {
      JSON.parse(clean);
    } catch {
      continue;
    }
    writeFileSync(full, clean);
    done.push(`models-exp/${rel}`);
  }
  return done;
}

/** Remove the empty folders under `dir`, deepest first, and `dir` itself when it ends up empty. Real folders only: a link is never followed or removed. */
function removeEmptyFolders(dir) {
  let st;
  try {
    st = lstatSync(dir);
  } catch {
    return; // no such folder
  }
  if (!st.isDirectory() || st.isSymbolicLink()) return;
  for (const name of readdirSync(dir)) removeEmptyFolders(join(dir, name));
  if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
}

/** Delete them from a finished build. Returns what was removed. */
export function pruneUnshipped(root) {
  const removed = findUnshipped(root);
  for (const rel of removed) rmSync(join(root, rel), { force: true });
  trimDressIndex(root);
  scrubModelNotes(root);
  // The candidates folder (and the page's picture folder while its switch is off) goes too, and so do the models' folders
  // that held only unshipped files, so no empty directory ships (only real, now empty folders).
  for (const folder of [join(root, 'audio', 'candidates'), join(root, 'bts'), join(root, 'models-exp')]) removeEmptyFolders(folder);
  return removed;
}
