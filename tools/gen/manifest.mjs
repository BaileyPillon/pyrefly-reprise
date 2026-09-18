#!/usr/bin/env node
/**
 * Build `public/art/manifest.json` — the index of what the art fleet has
 * actually produced.
 *
 *   node tools/gen/manifest.mjs [--root=public/art] [--check] [--quiet]
 *
 * Why this exists: the runtime used to discover art by *asking the server* —
 * a HEAD probe per pose per figure, plus a GET per state inside
 * `PaintedArt.loadSubject`. Every pose nobody has painted yet (`ready`,
 * `defend`, `cast` on an aeon) is a 404, so the live site opened a battle with
 * dozens of red lines in the network panel and a console full of
 * `[painted] missing painting`. A static index generated at build time answers
 * the same question with one request and zero misses.
 *
 * Scanning rules — the art fleet owns these files, so this only ever reads:
 *
 * - `characters/<id>/<state>.png` is a **chosen** pose. `<state>` must be a
 *   bare name: `idle.png` counts, `idle.2.png` (a numbered candidate) and
 *   `ko.raw.png` (a pre-cutout source) do not.
 * - A pose needs its `.json` sidecar too. `PaintedArt` fetches the sidecar
 *   next to every PNG it loads, so a PNG without one would still be a 404 — it
 *   is listed as a state (the painting is real) but reported as a warning.
 * - `portraits/<id>.png`, `backdrops/<id>.png`, `pause/<id>.png` are flat
 *   lists under the same bare-name rule.
 * - `pause/<id>.2x.webp` is the **high-resolution master** of a pause plate
 *   (2688x1536 against the 1344x768 PNG). It is listed separately, in
 *   `pause2x`, because the pause screen is full-bleed on a desktop window and
 *   the 1x plate visibly softens past about 1400 CSS px — so the screen offers
 *   both through `srcset` and lets the browser pick. It is *only* ever listed
 *   when the file is really there: an `srcset` entry for a plate the fleet has
 *   not re-rendered would be a 404 on the one image the whole screen is.
 * - A subject's `facing` comes from `idle.json`, or from the first state that
 *   declares one, and is the value `PaintedArt` would otherwise have had to
 *   fetch every sidecar to learn.
 *
 * `--check` exits non-zero when the manifest on disk is out of date, which is
 * what a CI step would run; the default rewrites it.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

/** Default art root, relative to the repo. */
export const DEFAULT_ART_ROOT = join(REPO_ROOT, 'public', 'art');

/**
 * A "chosen" asset name: letters, digits, `-` and `_` only.
 *
 * Anything with a dot in the stem is a candidate the fleet has not promoted
 * (`idle.2.png`, `castBD.1.png`) or an intermediate (`ko.raw.png`), and the
 * game must never ask for it.
 */
const CHOSEN = /^([A-Za-z0-9][A-Za-z0-9_-]*)\.png$/;

/** `<stem>.<something>.png` — a numbered candidate or a `.raw` intermediate. */
const VARIANT = /^([A-Za-z0-9][A-Za-z0-9_-]*)\.(.+)\.png$/;

/**
 * A sidecar's `facing` is copied through as a trimmed, lower-cased string and
 * *interpreted* at runtime by `parseArtFacing` in `BattlePresenterActors.ts`,
 * which owns the alias table (`none`/`straight`/`camera` all mean `front`).
 * Keeping the vocabulary in one place means a new alias needs no change here.
 */
function readFacing(value) {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase();
  return v || undefined;
}

function listDir(dir) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/** `<stem>.2x.webp` — the high-resolution master beside a flat plate. */
const RETINA = /^([A-Za-z0-9][A-Za-z0-9_-]*)\.2x\.webp$/;

/** Bare-named PNG stems directly inside `dir`, sorted. */
function chosenStems(dir) {
  const out = [];
  for (const entry of listDir(dir)) {
    if (!entry.isFile()) continue;
    const m = CHOSEN.exec(entry.name);
    if (m) out.push(m[1]);
  }
  return out.sort();
}

/**
 * Stems in `dir` that have a `<stem>.2x.webp` master **and** the 1x PNG the
 * screen falls back to, sorted.
 *
 * Both halves matter: a `2x.webp` with no PNG beside it is a half-landed
 * render, and offering it alone would leave a browser that cannot decode WebP
 * — or one whose viewport picks the small candidate — with nothing at all.
 */
function retinaStems(dir, oneX) {
  const have = new Set(oneX);
  const out = [];
  for (const entry of listDir(dir)) {
    if (!entry.isFile()) continue;
    const m = RETINA.exec(entry.name);
    if (m && have.has(m[1])) out.push(m[1]);
  }
  return out.sort();
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Scan an art root and return `{ manifest, warnings, variantsOnly }`.
 *
 * Pure apart from the reads: it never writes and never mutates the tree, so a
 * test can point it at a fixture directory.
 */
export function buildManifest(artRoot = DEFAULT_ART_ROOT, opts = {}) {
  const now = opts.now ?? new Date().toISOString();
  const warnings = [];
  /** Subjects whose only art for a state is an un-promoted numbered variant. */
  const variantsOnly = [];

  const charRoot = join(artRoot, 'characters');
  const subjects = {};

  const subjectDirs = listDir(charRoot)
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();

  for (const id of subjectDirs) {
    const dir = join(charRoot, id);
    const states = [];
    const variants = new Set();

    for (const entry of listDir(dir)) {
      if (!entry.isFile()) continue;
      const chosen = CHOSEN.exec(entry.name);
      if (chosen) {
        const state = chosen[1];
        if (!existsSync(join(dir, `${state}.json`))) {
          warnings.push(`${id}/${state}.png has no .json sidecar (the loader would 404 on it)`);
        }
        states.push(state);
        continue;
      }
      const variant = VARIANT.exec(entry.name);
      if (variant && !variant[2].endsWith('raw')) variants.add(variant[1]);
    }

    states.sort();
    for (const stem of [...variants].sort()) {
      if (!states.includes(stem)) variantsOnly.push(`${id}/${stem}`);
    }

    if (!states.length) {
      warnings.push(`${id}/ has no chosen PNG at all — every pose is a grey silhouette`);
      continue;
    }
    if (!states.includes('idle')) {
      warnings.push(`${id}/ has ${states.join(', ')} but no idle.png — the fleet must promote one`);
    }

    // `facing` is idle's word, then whichever state speaks first. Reading it
    // here is what lets the runtime skip fetching sidecars it does not need.
    let facing;
    for (const state of ['idle', ...states]) {
      const declared = readFacing(readJson(join(dir, `${state}.json`))?.facing);
      if (declared) {
        facing = declared;
        break;
      }
    }

    const portrait = existsSync(join(artRoot, 'portraits', `${id}.png`));
    subjects[id] = { states, portrait, ...(facing ? { facing } : {}) };
  }

  const pause = chosenStems(join(artRoot, 'pause'));
  const manifest = {
    version: 1,
    generatedAt: now,
    subjects,
    portraits: chosenStems(join(artRoot, 'portraits')),
    backdrops: chosenStems(join(artRoot, 'backdrops')),
    pause,
    pause2x: retinaStems(join(artRoot, 'pause'), pause),
  };

  return { manifest, warnings, variantsOnly };
}

/** Everything but `generatedAt`, so `--check` ignores pure timestamp churn. */
function contentOf(manifest) {
  if (!manifest || typeof manifest !== 'object') return '';
  const { generatedAt: _ignored, ...rest } = manifest;
  return JSON.stringify(rest);
}

/**
 * Write the manifest next to the art, unless `check` is set.
 *
 * Returns `{ path, changed, manifest, warnings, variantsOnly }`. When the
 * content (ignoring the timestamp) is unchanged the file is left alone, so a
 * rebuild does not dirty the working tree for nothing.
 */
export function writeManifest(artRoot = DEFAULT_ART_ROOT, opts = {}) {
  const built = buildManifest(artRoot, opts);
  const path = join(artRoot, 'manifest.json');
  const existing = existsSync(path) ? readJson(path) : null;
  const changed = contentOf(existing) !== contentOf(built.manifest);

  if (changed && !opts.check) {
    writeFileSync(path, `${JSON.stringify(built.manifest, null, 2)}\n`, 'utf8');
  }
  return { ...built, path, changed };
}

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq === -1) out[a.slice(2)] = true;
    else out[a.slice(2, eq)] = a.slice(eq + 1);
  }
  return out;
}

function main(argv) {
  const args = parseArgs(argv);
  const artRoot = typeof args.root === 'string' ? resolve(REPO_ROOT, args.root) : DEFAULT_ART_ROOT;
  if (!existsSync(artRoot) || !statSync(artRoot).isDirectory()) {
    console.error(`[art:manifest] no art root at ${artRoot}`);
    process.exit(1);
  }

  const check = Boolean(args.check);
  const quiet = Boolean(args.quiet);
  const { manifest, warnings, variantsOnly, path, changed } = writeManifest(artRoot, { check });

  const subjectCount = Object.keys(manifest.subjects).length;
  const stateCount = Object.values(manifest.subjects).reduce((n, s) => n + s.states.length, 0);

  if (!quiet) {
    console.log(
      `[art:manifest] ${subjectCount} subjects, ${stateCount} poses, ` +
        `${manifest.portraits.length} portraits, ${manifest.backdrops.length} backdrops, ` +
        `${manifest.pause.length} pause paintings (${manifest.pause2x.length} with a 2x master) ` +
        `-> ${path}${changed ? '' : ' (unchanged)'}`,
    );
    for (const w of warnings) console.warn(`[art:manifest] warn: ${w}`);
    if (variantsOnly.length) {
      console.warn(
        `[art:manifest] ${variantsOnly.length} state(s) exist only as un-promoted variants ` +
          `(the art fleet owns these): ${variantsOnly.join(', ')}`,
      );
    }
  }

  if (check && changed) {
    console.error('[art:manifest] manifest.json is stale — run `npm run art:manifest`.');
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
