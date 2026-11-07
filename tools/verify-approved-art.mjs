/**
 * Lists the pinned paintings (`docs/target/approved-hashes.json`, `docs/target/judge-locked-hashes.json`) that `public/art` lacks or holds with another hash. Exit 0 when every pin is in place, 1 otherwise.
 *
 *   node tools/verify-approved-art.mjs            # the repo this file is in
 *   node tools/verify-approved-art.mjs --art=<an art mirror to check instead of the tree's public/art>
 *   node tools/verify-approved-art.mjs --root=<another tree, its own public/art>
 *
 * The deploy runs the same check before the build (`tools/approved-art-verify.mjs`). Game case: both (release plumbing).
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyApprovedArt } from './approved-art-verify.mjs';

const here = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootArg = process.argv.find((a) => a.startsWith('--root='));
const root = rootArg ? resolve(rootArg.slice('--root='.length)) : here;
const artArg = process.argv.find((a) => a.startsWith('--art='));
const artDir = artArg ? resolve(artArg.slice('--art='.length)) : undefined;
const r = verifyApprovedArt({ root, ...(artDir ? { artDir } : {}) });
console.log(JSON.stringify({ root, art: artDir ?? 'public/art', pins: r.pins, ok: r.ok, mismatched: r.bad.length, missing: r.missing.length }, null, 1));
for (const f of r.missing) console.log(`missing: ${f}`);
for (const f of r.bad) console.log(`different hash: ${f}`);
process.exit(r.bad.length || r.missing.length ? 1 : 0);
