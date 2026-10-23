#!/usr/bin/env node
/**
 * Install the boss re-cut (lane "boss-matte", 2026-10-23; Bahamut FFX-2 only, Seymour Flux FFX only) into an art folder, and refuse any folder that is not the art state it was cut from.
 *
 * The re-cut was made from the playtest art (`D:/pyrefly-art-motion`), and `docs/handoff/boss-matte-files.md` lists every file it replaced with the sha256 of the original and of the new file. The art on `main`
 * is NOT that state (it lacks most of the rig files), and a folder in a third state would silently take a re-cut file over a different original. So:
 *
 *   node tools/boss-matte-install.mjs --check   <art dir>                     classify every row, change nothing
 *   node tools/boss-matte-install.mjs --install <art dir> --from <mirror dir>  replace the files whose sha is the listed original (the old file is unlinked first, so a hard link is never written through);
 *                                                                              refuses to start while any row is a conflict or missing
 *
 * A row is `ready` (the file is the listed original), `done` (it is already the new one), `add` (a new file: the original column is `-` and the file is absent), `missing` (the original should be there and
 * is not: the art folder is older than the playtest art) or `conflict` (a third file). Versioning the originals in the private art repo (`BaileyPillon/pyrefly-art`) comes first and is the driver's.
 * Both games (shared plumbing); the files themselves are each game's own.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FILES_DOC = resolve(HERE, '../docs/handoff/boss-matte-files.md');

/** The rows of the files doc: `| \`path\` | \`old\` or - | \`new\` |`. Pure. */
export function parseFilesDoc(md) {
  const rows = [];
  for (const line of md.split('\n')) {
    const m = /^\|\s*`([^`]+)`\s*\|\s*(?:`([0-9a-f]{64})`|-)\s*\|\s*`([0-9a-f]{64})`\s*\|/.exec(line);
    if (m) rows.push({ file: m[1], old: m[2] ?? null, new: m[3] });
  }
  return rows;
}

/** Classify every row against an art folder; `shaOf(file)` returns the sha256 of the file in it or null. Pure. */
export function classify(rows, shaOf) {
  return rows.map((r) => {
    const have = shaOf(r.file);
    let state;
    if (have === null) state = r.old === null ? 'add' : 'missing';
    else if (have === r.new) state = 'done';
    else if (r.old !== null && have === r.old) state = 'ready';
    else state = 'conflict';
    return { ...r, have, state };
  });
}

export function summarize(classified) {
  const by = { ready: 0, done: 0, add: 0, missing: 0, conflict: 0 };
  for (const c of classified) by[c.state]++;
  return { ...by, total: classified.length, ok: by.missing === 0 && by.conflict === 0 };
}

const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const shaIn = (dir) => (file) => (existsSync(join(dir, file)) ? sha(join(dir, file)) : null);

/** Replace the `ready` and `add` files with the mirror's (each old file unlinked first). Returns what it wrote. */
export function install(classified, artDir, mirrorDir) {
  const written = [];
  for (const c of classified) {
    if (c.state !== 'ready' && c.state !== 'add') continue;
    const from = join(mirrorDir, c.file);
    if (!existsSync(from)) throw new Error(`the mirror has no ${c.file}`);
    const buf = readFileSync(from);
    if (createHash('sha256').update(buf).digest('hex') !== c.new) throw new Error(`${c.file} in the mirror is not the listed new file`);
    const dest = join(artDir, c.file);
    mkdirSync(dirname(dest), { recursive: true });
    if (existsSync(dest)) unlinkSync(dest);
    writeFileSync(dest, buf, { flag: 'wx' });
    written.push(c.file);
  }
  return written;
}

function main(argv) {
  const mode = argv.includes('--install') ? 'install' : argv.includes('--check') ? 'check' : null;
  const artDir = argv[argv.indexOf(mode === 'install' ? '--install' : '--check') + 1];
  const from = argv.includes('--from') ? argv[argv.indexOf('--from') + 1] : null;
  if (!mode || !artDir || (mode === 'install' && !from)) {
    console.error('usage: node tools/boss-matte-install.mjs --check <art dir> | --install <art dir> --from <mirror dir>');
    return 2;
  }
  const rows = parseFilesDoc(readFileSync(FILES_DOC, 'utf8'));
  if (rows.length === 0) throw new Error(`no rows in ${FILES_DOC}`);
  const classified = classify(rows, shaIn(artDir));
  const s = summarize(classified);
  console.log(`boss-matte-install: ${artDir}: ${s.total} files; ready ${s.ready}, done ${s.done}, add ${s.add}, missing ${s.missing}, conflict ${s.conflict}`);
  for (const c of classified.filter((x) => x.state === 'missing' || x.state === 'conflict').slice(0, 12)) console.log(`  ${c.state}: ${c.file}`);
  if (!s.ok) {
    console.log('boss-matte-install: this art folder is not the playtest art state the re-cut was made from (D:/pyrefly-art-motion): put that state in place first. Nothing was changed.');
    return 1;
  }
  if (mode === 'check') return 0;
  const written = install(classified, artDir, from);
  console.log(`boss-matte-install: wrote ${written.length} files`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
