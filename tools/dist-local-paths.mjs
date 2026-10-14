#!/usr/bin/env node
/**
 * What the build must never carry: a path of the machine that made it (r46-fix, FOC46-01).
 *
 * The painting sidecars (`public/art/**\/*.json`) began as the provenance records of the ComfyUI renders that made each painting, and so
 * name the staging, scratch and backup folders on the build PC (a drive letter and a folder; one a user-profile folder). They went live
 * with every release until the review of 0b0571d1 found them. The site is public: no file it serves may name a folder of the build machine.
 * Two halves, one definition of "a local path" (this file):
 *
 *   the REDACTION (`redactLocalPaths`, applied to the sidecars by `tools/art-sidecar-redact.mjs` in the build output only, never to
 *   `public/art`): each local path inside a text is replaced by that path's final name alone, `X:/some/folder/tree/name.png` -> `name.png`, a path
 *   that ends in a folder -> that folder's name, and the profile folder itself (`Users/<name>`) -> `Users`, because the folder's name is a person.
 *   THE GATE (`findLocalPaths`, `scanBuildForLocalPaths`, the command line): every shipped text file of a build is searched for what is left,
 *   `tools/deploy-pages.mjs` refuses a build with a hit, and the report names the file, the line and the kind and never the path.
 *
 *   node tools/dist-local-paths.mjs --dir dist          scan a build folder; exit 1 and list file:line:kind when one carries a path
 *   node tools/dist-local-paths.mjs --dir dist --json   the same as JSON
 *
 * The rule: a drive-letter path (one letter on its own, a colon, a slash or backslash, then a folder name: `D:/x`, `c:\x`) or a user-profile
 * path (`Users/<name>` or `Documents and Settings/<name>`, either slash). A URL scheme (`https://`) is a longer word before its colon, so it
 * never matches; a CSS declaration (`d: 0`, `a:hover`) has no slash after the colon; a bare "Users" in a sentence has no slash and a name after
 * it. How far a path runs (`LOCAL_PATH_SPAN`): its names are everything but a separator, a space and the marks that end a path in prose or markup
 * (quotes, `< > | ? : , ; ( ) [ ] { }`); a folder name may hold single spaces when every word starts with a capital letter or a digit (a spaced
 * folder such as a project folder), and only when a separator follows, so the words after a file name are never eaten. Trailing dots (a full
 * stop after the path) stay in the sentence. Game case: both (delivery plumbing, CHK-017).
 */
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

/** What ends a path in prose or markup: white space, quotes, a backtick, angle brackets, a pipe, `?`, `:`, a comma, `;` and brackets. */
const STOPPERS = String.raw`\s"'` + '`' + String.raw`<>|?:,;()\[\]{}`;
/** One character of a name in a path: anything but a separator or a stopper (so folder names in any script are whole). */
const NAME_CH = String.raw`[^\\/${STOPPERS}]`;
/** The first character of the first name after the start of a path: a name character that is not an asterisk (so a ternary then a block comment, `a:` and a slash and a star, is not a drive). */
const NAME_START = String.raw`[^\\/${STOPPERS}*]`;

/** A Windows drive path: a lone letter (not the tail of a word such as `https`), a colon, one or two slashes either way, then a folder name. */
export const DRIVE_PATH = new RegExp(String.raw`(?<![A-Za-z0-9_$.-])[A-Za-z]:[\\/]{1,2}(?=${NAME_START})`);
/**
 * The same for code and stylesheets, where minified source is full of `a:/regex/` (an object key, then a regex literal): an upper-case
 * drive letter and at least two folders. The paths the sidecars carried are all of this shape; a lower-case one in a bundle would not be.
 */
export const DRIVE_PATH_IN_CODE = /(?<![A-Za-z0-9_$.-])[A-Z]:[\\/]{1,2}[A-Za-z0-9_$@~. -]+[\\/]{1,2}[A-Za-z0-9_$@~.-]/;
/**
 * A user-profile path with no drive letter, as macOS and a drive-less Windows path write it: `/Users/<name>` or `Users\<name>` (or `Documents and
 * Settings/<name>`) at the start of a text or after a space, a quote or a bracket. A `Users` that is a part of a longer path (`site/Users/list`, a URL's
 * `/Users/`) or sits behind a drive letter (the drive rule has it whole) does not start one.
 */
const PROFILE_START = String.raw`(?<![A-Za-z0-9_$.\-:\\/])[\\/]*(?:Users|Documents and Settings)[\\/]+(?=${NAME_START})`;
export const PROFILE_PATH = new RegExp(PROFILE_START);

/** A word of a folder name that holds spaces: it starts with a capital letter or a digit, or is a small joining word (`Documents and Settings`). */
const CAP_WORD = String.raw`(?:[A-Z0-9]${NAME_CH}*|and|of|the)`;
/** What follows the start of a path: names joined by separators, the last one without a separator; a spaced folder name only where a separator follows it. */
const TAIL = String.raw`(?:(?:${CAP_WORD}(?: ${CAP_WORD})+|${NAME_CH}+)[\\/]+)*${NAME_CH}*`;
/** A whole local path (drive or profile) from its start to its end; a source, because a global regular expression carries its position (use `new RegExp(...)`). */
export const LOCAL_PATH_SPAN = String.raw`(?<![A-Za-z0-9_$.-])[A-Za-z]:[\\/]{1,2}(?=${NAME_START})${TAIL}|${PROFILE_START}${TAIL}`;

/** The name a path span is replaced by: its last name, a sentence's full stop kept after it; the profile folder itself (`Users/<name>`) is `Users`, never the person. */
export function leafOfPath(span) {
  const body = span.replace(/\.+$/, '');
  const dots = span.slice(body.length);
  const parts = body.split(/[\\/]+/).filter(Boolean);
  if (/^[A-Za-z]:$/.test(parts[0] ?? '')) parts.shift(); // the drive letter
  if (parts.length === 2 && /^(?:Users|Documents and Settings)$/i.test(parts[0])) return `${parts[0]}${dots}`;
  return `${parts[parts.length - 1] ?? ''}${dots}`;
}

/**
 * `text` with every local path replaced by its last name (`leafOfPath`), until none is left (a replaced name can sit next to the rest of a
 * second path). Returns the text; with `count` the number of paths replaced as well.
 * @param {string} text
 * @param {{ count?: boolean }} [options]
 */
export function redactLocalPaths(text, options = {}) {
  let n = 0;
  let out = text;
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    out = out.replace(new RegExp(LOCAL_PATH_SPAN, 'g'), (span) => {
      n++;
      changed = true;
      return leafOfPath(span);
    });
    if (!changed) break;
  }
  return options.count ? { text: out, count: n } : out;
}

/**
 * Every local path in `text` as `{ line, column, kind }` (1-based), in order of appearance. The match itself is never returned.
 * `code` is true for the bundle and the stylesheets (the stricter drive rule).
 * @param {string} text
 * @param {{ code?: boolean }} [options]
 * @returns {{ line: number; column: number; kind: 'drive' | 'profile' }[]}
 */
export function findLocalPaths(text, options = {}) {
  const out = [];
  const drive = options.code ? DRIVE_PATH_IN_CODE : DRIVE_PATH;
  const lines = text.split(/\r\n|\n|\r/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const [kind, re] of /** @type {const} */ ([['drive', drive], ['profile', PROFILE_PATH]])) {
      const g = new RegExp(re.source, 'g');
      let m;
      while ((m = g.exec(line)) !== null) out.push({ line: i + 1, column: m.index + 1, kind });
    }
  }
  return out.sort((a, b) => a.line - b.line || a.column - b.column);
}

/** Code and stylesheets: the files whose text is minified source. */
export const CODE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.css', '.map']);

/** The files a build serves as text. Everything else (images, audio, fonts) is binary and is not read. */
export const TEXT_EXTENSIONS = new Set(['.json', '.js', '.mjs', '.cjs', '.css', '.html', '.htm', '.txt', '.md', '.svg', '.xml', '.webmanifest', '.csv', '.tsv', '.yml', '.yaml', '.map', '.glsl', '.vert', '.frag', '.ts']);

/** Every text file under `root` (links are never followed) as `{ rel, full }`. */
export function listTextFiles(root) {
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
      const st = lstatSync(full);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) walk(full);
      else if (TEXT_EXTENSIONS.has(extname(name).toLowerCase())) out.push({ rel: relative(root, full).split(sep).join('/'), full });
    }
  };
  walk(root);
  return out;
}

/**
 * Scan a build folder. Returns `{ scanned, hits }` where `hits` lists `{ file, line, column, kind }`.
 * @param {string} root
 */
export function scanBuildForLocalPaths(root) {
  const files = listTextFiles(root);
  const hits = [];
  for (const { rel, full } of files) {
    const text = readFileSync(full, 'utf8');
    for (const h of findLocalPaths(text, { code: CODE_EXTENSIONS.has(extname(rel).toLowerCase()) })) hits.push({ file: rel, ...h });
  }
  return { scanned: files.length, hits };
}

/** One line per file for a log: the count and the kinds, never the path. */
export function formatLocalPathReport(report, limit = 20) {
  if (report.hits.length === 0) return `local paths: none in ${report.scanned} text file(s)`;
  const byFile = new Map();
  for (const h of report.hits) {
    const e = byFile.get(h.file) ?? { n: 0, kinds: new Set(), first: h };
    e.n += 1;
    e.kinds.add(h.kind);
    byFile.set(h.file, e);
  }
  const lines = [`local paths: ${report.hits.length} in ${byFile.size} of ${report.scanned} text file(s) (the paths are not printed)`];
  for (const [file, e] of [...byFile].slice(0, limit)) lines.push(`  ${file}:${e.first.line}:${e.first.column} ${[...e.kinds].join('+')} x${e.n}`);
  if (byFile.size > limit) lines.push(`  ... and ${byFile.size - limit} more file(s)`);
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--dir');
  const dir = i >= 0 ? args[i + 1] : undefined;
  if (!dir) {
    console.error('usage: node tools/dist-local-paths.mjs --dir <build folder> [--json]');
    process.exit(2);
  }
  const report = scanBuildForLocalPaths(resolve(dir));
  if (args.includes('--json')) console.log(JSON.stringify({ scanned: report.scanned, hits: report.hits }, null, 1));
  else console.log(formatLocalPathReport(report));
  process.exit(report.hits.length === 0 ? 0 : 1);
}
