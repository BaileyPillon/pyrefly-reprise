/**
 * **Every pinned painting is in `public/art` with its recorded hash** (r76c review, MINOR 5). `docs/target/approved-hashes.json` and `docs/target/judge-locked-hashes.json` pin each painting the owner or the driver
 * accepted by sha256. Code that names a painting (a sprite key, a scene plate, a pause plate) is merged ahead of an art mirror that holds it, and a build cut with `public/art` pointing at an older mirror passes the pose
 * gate (it reads only the paintings that are there) and the unit tests (the art-reading ones skip), then ships 404s for the plates and placeholders for the sprites. This is the check that says so before the build:
 * the same one as the art-training kit's `verify-approved.mjs` (a file in either list is exactly as locked as the other), as a module the deploy can call.
 *
 * Game case: both (shared release plumbing; the pins themselves are per game by their paths).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The two pin lists, relative to the repo root. The judge-locked list is optional (a tree without it checks the other alone). */
export const PIN_LISTS = ['docs/target/approved-hashes.json', 'docs/target/judge-locked-hashes.json'];

const ART_PREFIX = 'public/art/';

/** `{ file: 'public/art/...', sha256 }` for every pinned file of one list, once per set it appears in. */
function pinsOfList(file) {
  if (!existsSync(file)) return [];
  const sets = JSON.parse(readFileSync(file, 'utf8')).sets ?? {};
  const pins = [];
  for (const set of Object.values(sets)) {
    for (const [name, value] of Object.entries(set)) {
      if (value && typeof value === 'object' && typeof value.sha256 === 'string') pins.push({ file: name, sha256: value.sha256 });
    }
  }
  return pins;
}

/**
 * Hash every pinned file under `root` and compare it with its pin.
 * @param {{ root: string, lists?: string[], artDir?: string }} options `root` is the repo root (pins name `public/art/...` below it, so a `public/art` link is followed); `lists` replaces {@link PIN_LISTS}; `artDir` reads the `public/art/` pins from that folder instead (an art mirror, without re-pointing the tree)
 * @returns {{ ok: number, bad: string[], missing: string[], pins: number }} `bad` are files that exist with another hash, `missing` are files that are not there
 */
export function verifyApprovedArt({ root, lists = PIN_LISTS, artDir }) {
  const pins = lists.flatMap((l) => pinsOfList(join(root, l)));
  const hashes = new Map();
  let ok = 0;
  const bad = [];
  const missing = [];
  for (const pin of pins) {
    const path = pin.file.startsWith(ART_PREFIX) && artDir ? join(artDir, pin.file.slice(ART_PREFIX.length)) : join(root, pin.file);
    let hash = hashes.get(pin.file);
    if (hash === undefined) {
      hash = existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : null;
      hashes.set(pin.file, hash);
    }
    if (hash === null) missing.push(pin.file);
    else if (hash === pin.sha256) ok++;
    else bad.push(pin.file);
  }
  return { ok, bad, missing, pins: pins.length };
}

/** What the deploy says when a pinned painting is not what `public/art` holds. `--owner-override` and `--skip-tests` do not cover it. */
export function approvedArtRefusal(result) {
  const parts = [];
  if (result.missing.length) parts.push(`${result.missing.length} missing`);
  if (result.bad.length) parts.push(`${result.bad.length} with a different hash`);
  return `the approved-art check refuses this deploy: ${parts.join(' and ')} of ${result.pins} pinned painting(s) in ${PIN_LISTS.join(' and ')}. public/art is older than the code (or holds a changed painting): point it at the art mirror that holds every pinned file and run node tools/verify-approved-art.mjs to list them.`;
}

/**
 * The deploy's check before the build: refuse (`fail` throws or exits) when any pinned painting is missing from `public/art` or has another hash.
 * @returns {{ ok: number, bad: string[], missing: string[], pins: number }}
 */
export function enforceApprovedArt({ root, log = console.log, fail, lists, artDir } = {}) {
  const result = verifyApprovedArt({ root, lists, artDir });
  log(`approved art: ${result.pins} pinned painting(s), ${result.ok} ok, ${result.bad.length} with another hash, ${result.missing.length} missing`);
  if (result.bad.length || result.missing.length) {
    for (const f of result.missing.slice(0, 25)) log(`  missing: ${f}`);
    for (const f of result.bad.slice(0, 25)) log(`  different hash: ${f}`);
    const more = result.missing.length + result.bad.length - Math.min(25, result.missing.length) - Math.min(25, result.bad.length);
    if (more > 0) log(`  ... and ${more} more (node tools/verify-approved-art.mjs lists them all)`);
    fail(approvedArtRefusal(result));
  }
  return result;
}
