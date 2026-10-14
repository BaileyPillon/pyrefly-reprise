/**
 * The art JSON as a build ships it: a painting sidecar cut to the fields the game reads (r47-rc, FOC46-06), every other file with the paths
 * of the build machine replaced (r46-fix, FOC46-01).
 *
 * The `public/art/**\/*.json` sidecars are the provenance records of the renders that made each painting. They named staging, scratch and backup
 * folders of the PC that built the game (FOC46-01, answered by replacing each path with its last name), and they carry the owner's first name (969
 * files) and links to private claude.ai pages (620) in their notes (FOC46-06). The site is public (the standing rule: no personal or PC details),
 * and the game reads ten fields of these files (`art-sidecar-fields.mjs`), so the BUILD OUTPUT carries each sidecar as exactly those fields of its
 * master, values untouched (`projectSidecarText`, the rule is in that file's header). **The masters in `public/art` are never touched**: the Vite plugin
 * (`art-derive-plugin.mjs`) calls `redactBuildSidecars` on the build's output folder, after Vite has copied `public/` into it, and each file is
 * written through a temporary name and a rename, so even a file that shared its data with a master could not change it.
 *
 * Every JSON under `art/` that is not a sidecar (`NON_SIDECAR_ART_JSON`: the two manifests the game reads whole, and the build's own record) keeps the
 * FOC46-01 rule, `redactJsonText`: the master's own text, byte for byte, except that each string VALUE that held a local path is rewritten in place as
 * `JSON.stringify` of its redacted text (keys and their order, numbers as spelt, other strings with their escapes, white space and line ends are the
 * master's; a file with no path is the master's bytes exactly; a text that is not valid JSON is redacted as plain text and listed). No manifest holds a
 * path today, so they ship as they are.
 *
 * `shippedArtJsonText(rel, masterText)` is the ONE function that says what the build writes for a file: the build step below, `art-derive verify`
 * (`verifyShippedSidecars`) and the tests all use it.
 *
 * What the game reads of these files does not change (`tests/unit/art-sidecar-redact.test.ts`, table `READERS`, with a guard over `src/`; and
 * `tests/unit/art-sidecar-fields.test.ts`, which reads every sidecar of the master folder and proves every field a reader takes equal to the master's).
 *
 * Game case: both (shared build plumbing; no game content).
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import process from 'node:process';

import { isSidecarJson, projectSidecarText } from './art-sidecar-fields.mjs';
import { isUnshippedPublicFile } from './dist-filter.mjs';
import { findLocalPaths, findPrivateLinks, redactLocalPaths } from './dist-local-paths.mjs';

/** A string literal that can hold a path at all: a drive needs a colon, a profile folder the word. (A cheap test before the literal is decoded.) */
const MAY_HOLD_PATH = /:|Users|Documents and Settings/;

/**
 * The master's text with each string value that holds a local path rewritten. Returns `{ text, strings, paths, plain }`: the text (the input
 * itself when nothing changed), the number of string values rewritten, the number of paths replaced, and whether the text was not JSON and was
 * redacted as plain text. Keys are never rewritten (a key that held a path is a leak the gate would catch).
 * @param {string} text
 */
export function redactJsonText(text) {
  try {
    JSON.parse(text);
  } catch {
    const r = redactLocalPaths(text, { count: true });
    return { text: r.text, strings: r.count > 0 ? 1 : 0, paths: r.count, plain: true };
  }
  const n = text.length;
  let out = '';
  let from = 0;
  let changed = false;
  let strings = 0;
  let paths = 0;
  let i = 0;
  while (i < n) {
    if (text.charCodeAt(i) !== 34) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < n) {
      const d = text.charCodeAt(j);
      if (d === 92) j += 2;
      else if (d === 34) break;
      else j++;
    }
    const end = j + 1;
    let k = end;
    while (k < n && [32, 9, 10, 13].includes(text.charCodeAt(k))) k++;
    if (text.charCodeAt(k) !== 58) {
      // a value, not a key
      const literal = text.slice(i, end);
      if (MAY_HOLD_PATH.test(literal)) {
        const r = redactLocalPaths(JSON.parse(literal), { count: true });
        if (r.count > 0) {
          out += text.slice(from, i) + JSON.stringify(r.text);
          from = end;
          changed = true;
          strings++;
          paths += r.count;
        }
      }
    }
    i = end;
  }
  return { text: changed ? out + text.slice(from) : text, strings, paths, plain: false };
}

/**
 * What the build writes for one art JSON file: `rel` is its site-relative path (`art/characters/yuna/idle.json`), `masterText` the master's text.
 * A painting sidecar is cut to the fields the game reads (`projectSidecarText`: an error for a text that is not a JSON object, with the file named);
 * any other file has the paths of the build machine replaced (`redactJsonText`).
 * Returns `{ text, sidecar, kept, dropped, strings, paths, plain }`: the text to write, whether the file is a sidecar, for a sidecar the keys kept and
 * the keys left out (names, in order), for any other file the string values rewritten and the paths replaced, and whether it was not JSON.
 * @param {string} rel
 * @param {string} masterText
 * @returns {{ text: string; sidecar: boolean; kept: string[]; dropped: string[]; strings: number; paths: number; plain: boolean }}
 */
export function shippedArtJsonText(rel, masterText) {
  if (isSidecarJson(rel)) {
    let projected;
    try {
      projected = projectSidecarText(masterText);
    } catch (err) {
      throw new Error(`${rel}: a painting sidecar must be a JSON object (${err instanceof Error ? err.message : String(err)})`);
    }
    return { text: projected.text, sidecar: true, kept: projected.kept, dropped: projected.dropped, strings: 0, paths: 0, plain: false };
  }
  const r = redactJsonText(masterText);
  return { text: r.text, sidecar: false, kept: [], dropped: [], strings: r.strings, paths: r.paths, plain: r.plain };
}

/**
 * Every art sidecar a build ships, from `public/`: all `public/art/**\/*.json` except what `dist-filter.mjs` never ships (the numbered takes).
 * Links ARE followed (a worktree's junctioned `public/art` is read, never written).
 */
export function listMasterSidecars(publicDir) {
  const out = [];
  const root = join(publicDir, 'art');
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (name.toLowerCase().endsWith('.json')) {
        const rel = relative(publicDir, full).split(sep).join('/');
        if (!isUnshippedPublicFile(rel)) out.push({ rel, full, bytes: st.size });
      }
    }
  };
  if (existsSync(root)) walk(root);
  return out.sort((a, b) => (a.rel < b.rel ? -1 : 1));
}

/** Write through a temporary name and rename, so the file's old data is never modified in place. */
function writeReplacing(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}

/**
 * Write the art JSON of a build output folder (`<outDir>/art/**\/*.json`) as the build ships it (`shippedArtJsonText`): each painting sidecar cut to
 * the fields the game reads, every other file with its local paths replaced. Throws if a file is not UTF-8 text, a sidecar is not a JSON object, or
 * what is written still holds a local path or a link to claude.ai (a kept field that holds one is a master to fix, never text to rewrite: the
 * values of the kept fields are the master's own). Returns what was done; neither a path, a link nor a value is ever in it.
 * @param {string} outDir
 * @returns {{ files: number; sidecars: number; keysKept: number; keysDropped: number; changed: number; strings: number; paths: number; changedFiles: string[]; plain: string[] }}
 *   `files` art JSON files seen; `sidecars` of them painting sidecars; `keysKept` and `keysDropped` summed over the sidecars; `changed` files written
 *   (a file already in its shipped form is not written again); `strings` and `paths` the string values rewritten and the paths replaced in the
 *   non-sidecar files; `plain` the non-sidecar files that are not JSON.
 */
export function redactBuildSidecars(outDir) {
  const result = { files: 0, sidecars: 0, keysKept: 0, keysDropped: 0, changed: 0, strings: 0, paths: 0, changedFiles: [], plain: [] };
  const root = join(outDir, 'art');
  if (!existsSync(root)) return result;
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = lstatSync(full);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.toLowerCase().endsWith('.json')) continue;
      const rel = relative(outDir, full).split(sep).join('/');
      result.files++;
      const bytes = readFileSync(full);
      const text = bytes.toString('utf8');
      if (!Buffer.from(text, 'utf8').equals(bytes)) throw new Error(`${rel}: is not UTF-8 text, so it cannot be cut or its paths replaced safely`);
      const r = shippedArtJsonText(rel, text);
      if (r.sidecar) {
        result.sidecars++;
        result.keysKept += r.kept.length;
        result.keysDropped += r.dropped.length;
      } else if (r.plain) result.plain.push(rel);
      if (findLocalPaths(r.text).length > 0) throw new Error(`${rel}: a local path is left in what the build would write (${r.sidecar ? 'in a field the game reads: fix the master' : 'the rule in tools/dist-local-paths.mjs does not cover its shape'})`);
      if (findPrivateLinks(r.text).length > 0) throw new Error(`${rel}: a link to claude.ai is in what the build would write${r.sidecar ? ' (in a field the game reads: fix the master)' : ''}`);
      if (r.text === text) continue;
      writeReplacing(full, r.text);
      result.changed++;
      result.strings += r.strings;
      result.paths += r.paths;
      result.changedFiles.push(rel);
    }
  };
  walk(root);
  return result;
}
