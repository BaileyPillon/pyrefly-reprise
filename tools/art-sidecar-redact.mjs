/**
 * The painting sidecars as a build ships them: the master's own text with the paths of the build machine replaced (r46-fix, FOC46-01).
 *
 * About 950 of the 1,263 `public/art/**\/*.json` sidecars (the provenance records of the renders that made each painting) name staging, scratch
 * and backup folders of the PC that built the game, and one a user-profile folder. The site is public (the standing rule: no personal or PC
 * details), so the BUILD OUTPUT carries those files with each local path replaced by that path's final name alone (`dist-local-paths.mjs`:
 * `X:/some/folder/tree/name.png` -> `name.png`, a folder -> its name). **The masters in `public/art` are never touched**: the Vite plugin
 * (`art-derive-plugin.mjs`) calls `redactBuildSidecars` on the build's output folder, after Vite has copied `public/` into it, and each file is
 * written through a temporary name and a rename, so even a file that shared its data with a master could not change it.
 *
 * THE FORMATTING RULE, the same for every file: the shipped file is the master's own text, byte for byte, except that each string VALUE
 * that held a local path is rewritten in place as `JSON.stringify` of its redacted text. Keys (names of properties), their order, every number
 * as it was spelt, every other string with its escapes, the white space and the line ends are the master's. A sidecar with no local path is the
 * master's bytes exactly (a gate that compares a shipped sidecar with its master compares it with `redactJsonText(master)`: one function).
 * A text that is not valid JSON (none exists today) is redacted as plain text and listed, so a broken file cannot carry a path either.
 *
 * What the game reads of these files does not change: `width`, `height`, `baselineY`, `scale`, `anchorY`, `facing`, `seed`, `prompt`, `focal`,
 * `headTop` and the fields of `art/manifest.json` and `art/portrait-parts/manifest.json` never hold a path (`tests/unit/art-sidecar-redact.test.ts`
 * reads every sidecar of the master folder and proves the redacted output equal to the master in all of them, and changed only in string values that held a path).
 *
 * Game case: both (shared build plumbing; no game content).
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import process from 'node:process';

import { isUnshippedPublicFile } from './dist-filter.mjs';
import { findLocalPaths, redactLocalPaths } from './dist-local-paths.mjs';

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
 * Rewrite the art sidecars of a build output folder (`<outDir>/art/**\/*.json`): every one with a local path in a string value.
 * Throws if a path survives the rewrite or a file is not UTF-8 text. Returns what was done; the paths themselves are never in it.
 * @param {string} outDir
 * @returns {{ files: number; changed: number; strings: number; paths: number; changedFiles: string[]; plain: string[] }}
 */
export function redactBuildSidecars(outDir) {
  const result = { files: 0, changed: 0, strings: 0, paths: 0, changedFiles: [], plain: [] };
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
      if (!Buffer.from(text, 'utf8').equals(bytes)) throw new Error(`${rel}: is not UTF-8 text, so its paths cannot be replaced safely`);
      const r = redactJsonText(text);
      if (r.plain) result.plain.push(rel);
      if (r.text === text) continue;
      if (findLocalPaths(r.text).length > 0) throw new Error(`${rel}: a local path is left after the replacement (the rule in tools/dist-local-paths.mjs does not cover its shape)`);
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
