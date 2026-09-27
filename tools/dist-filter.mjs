/**
 * What in `public/` never ships (PR-0100, PR-0173).
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
 * The build prunes them (the `pyrefly-dist-filter` plugin in `vite.config.ts`)
 * so both `npm run build` and `npm run deploy` leave them out, and the deploy
 * preflight refuses a build that still carries one. They stay on disk and in
 * `D:\Tools\pyrefly-art-backup`.
 *
 * Game case: both (delivery plumbing, CHK-017).
 */
import { lstatSync, readdirSync, rmSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** @param {string} rel a path relative to the build root (or `public/`), either slash. */
export function isUnshippedPublicFile(rel) {
  const p = rel.split(sep).join('/').replace(/^\/+/, '');
  if (p === 'audio/candidates' || p.startsWith('audio/candidates/')) return true;
  if (!p.startsWith('art/')) return false;
  if (/\.raw\.png$/i.test(p)) return true;
  return /\.[0-9]+\.(png|json)$/i.test(p);
}

/** Every file under `root` (relative, forward slashes) that must not ship. */
export function findUnshipped(root) {
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
      const rel = relative(root, full).split(sep).join('/');
      // lstat, never stat: a link (a worktree's junctioned public/art) is not
      // followed, so pruning can only ever touch the build's own files.
      const st = lstatSync(full);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) walk(full);
      else if (isUnshippedPublicFile(rel)) out.push(rel);
    }
  };
  walk(root);
  return out;
}

/** Delete them from a finished build. Returns what was removed. */
export function pruneUnshipped(root) {
  const removed = findUnshipped(root);
  for (const rel of removed) rmSync(join(root, rel), { force: true });
  // The candidates folder itself goes too, so no empty directory ships (only
  // when it is a real, now empty folder).
  const folder = join(root, 'audio', 'candidates');
  try {
    const st = lstatSync(folder);
    if (st.isDirectory() && !st.isSymbolicLink() && readdirSync(folder).length === 0) rmSync(folder, { recursive: true });
  } catch {
    /* no such folder */
  }
  return removed;
}
