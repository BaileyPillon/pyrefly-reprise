#!/usr/bin/env node
/**
 * Copy the experimental Leblanc chapter's art into a release tree (branch `exp-leblanc`; FFX-2 only).
 *
 *   node tools/exp-art-sync.mjs --target D:/pyrefly-r39-int/public/art --dry-run     say what would be copied; writes NOTHING (no hashing either: sizes only)
 *   node tools/exp-art-sync.mjs --target D:/pyrefly-r39-int/public/art               copy it
 *   node tools/exp-art-sync.mjs --target D:/pyrefly-r39-int/public/art --link        HARD-LINK it instead of copying it (add --dry-run to see the plan first)
 *   options: --source <art root>      the experiment's art workspace (default D:/pyrefly-art-exp, or $EXP_ART)
 *            --fx-source <fx root>    where the room's depth map is (default <repo>/public/fx)
 *            --fx-target <fx root>    where it goes (default the `fx` folder beside --target, i.e. <release>/public/fx)
 *            --link                   make each destination a second name for the workspace file's own bytes (a hard link) instead of a copy: no new disk space
 *                                     (D: is nearly full and the namespace is 1.32 GiB). Needs the source and the target on ONE volume; on two it refuses (exit 2)
 *            --list                   print every file of the plan;   --json   print the plan as JSON
 *
 * Why: the live build ships from a release tree whose `public/art` has no `exp-leblanc` namespace (Bailey, 2026-10-06: "put the experimental new
 * chapter in the live build but make it hidden", and "Ship it as is": today's paintings go live, hidden behind their word, `src/app/screens/frontend/leblancDoor.ts`).
 * The paintings are not in git (`public/art` never goes to main), so they have to be put in the release tree by a copy. This is that copy.
 *
 * What it copies, and nothing else (the same four prefixes `exp-art.mjs verify` calls the namespace):
 *   characters/exp-leblanc-*      every subject folder: the 1x paintings, their sidecars, the @2x/@3x/@4x masters
 *   backdrops/exp-leblanc-last-room*   the room's plate, its sidecar and its @2x master
 *   portraits/exp-leblanc-*       the dialogue portraits
 *   pause/exp-leblanc-*           the pause close-ups
 *   fx/exp-leblanc-last-room/*    the room's depth map (`depth.png`, `depth.json`; recorded in `tools/fx/fx-assets.json`, which the deploy checks)
 * Not copied: `manifest.json` (the release build's prebuild, `node tools/gen/manifest.mjs`, lists the namespace from the files it finds), anything outside the
 * namespace, and every file the workspace only mirrors from the release tree (those are the release tree's own).
 *
 * The rules it keeps (each is a test, `tests/unit/exp-art-sync.test.ts`):
 *   - NEVER overwrites or touches an existing file. A destination that exists is left as it is: the same size counts as already there, a different size is a
 *     CONFLICT (reported, left alone, exit 2, nothing copied until it is looked at).
 *   - Refuses any path outside the namespace, any path that leaves the target, and a target that is (or is inside, or holds) the source.
 *   - Each file is copied to a temporary name beside its destination, its sha256 is checked against the source's, and only then does it take its real name
 *     (a hard link that fails if the name exists, then the temporary name goes): a destination appears whole and verified, or not at all.
 *   - `--dry-run` writes nothing at all, not even a folder, and reads no file's contents.
 *   - `--link` keeps every rule above (an existing name is never replaced; nothing outside the namespace; a temporary name first, the real name only after the
 *     check) and adds three: the source and the target are on one volume (checked first for the art and for the depth map; a hard link cannot cross volumes, so on
 *     two the run is refused and nothing is written; a link the filesystem refuses later fails that one file); each link is the SAME FILE as its source (device and
 *     inode) with the same sha256 before it takes its name, so a silent copy fails too; and a failed file's temporary name is removed only if this run made it.
 *     A hard link shares bytes: a write in place through either name changes both (this tool never writes in place; `exp-art.mjs` states the same rule). Note that
 *     `node tools/exp-art.mjs verify` reads a namespace file with two names, and any namespace file in the release tree, as a fault: run it before a sync, not after.
 *
 * Exit: 0 done (or nothing to do), 1 a copy, a link or a checksum failed, 2 refused (bad target, conflict, missing source, `--link` across two volumes).
 * Game case: FFX-2 only (the namespace is the Leblanc experiment's); the tool is plumbing with one user.
 */
import { constants, copyFileSync, createReadStream, existsSync, linkSync, lstatSync, mkdirSync, readdirSync, realpathSync, statSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { EXP_ART, NAMESPACE, REPO, SCENE_KEY } from './exp-art-lib.mjs';

/** An art file the namespace owns: its figures, its plate, its dialogue portraits and its pause plates (the rule of `exp-art.mjs`). */
export const isNamespacePath = (rel) =>
  rel.startsWith(`characters/${NAMESPACE}-`) || rel.startsWith(`backdrops/${SCENE_KEY}`) || rel.startsWith(`portraits/${NAMESPACE}-`) || rel.startsWith(`pause/${NAMESPACE}-`);

/** A depth-map file the namespace owns (`fx/<room>/...`, the room being the experiment's scene key). */
export const isFxNamespacePath = (rel) => rel.startsWith(`${SCENE_KEY}/`);

/** A relative path that stays inside its root: forward slashes, no `..`, no drive or leading slash. */
export function isCleanRelative(rel) {
  if (!rel || isAbsolute(rel) || rel.includes('\\') || /^[A-Za-z]:/.test(rel)) return false;
  return normalize(rel).split(sep).join('/') === rel && !rel.split('/').some((s) => s === '' || s === '..' || s === '.');
}

/** Every regular file under `root` as a path relative to it with forward slashes (a symlink is not followed and not listed). */
function walkFiles(root, rel = '') {
  const out = [];
  for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
    const here = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walkFiles(root, here));
    else if (entry.isFile()) out.push(here);
  }
  return out;
}

const real = (p) => realpathSync(resolve(p));
const inside = (child, parent) => child === parent || child.startsWith(parent.endsWith(sep) ? parent : parent + sep);

/** Which volume a folder is on (the device number of its real path): two folders can share a hard link only if this is equal. A test hands in its own to stand for a second volume. */
const deviceOfFolder = (p) => statSync(real(p), { bigint: true }).dev;

/** Is `a` the same file as `b` (one device, one inode)? A hard link is; a copy is not. */
function sameFile(a, b) {
  const sa = statSync(a, { bigint: true });
  const sb = statSync(b, { bigint: true });
  return sa.dev === sb.dev && sa.ino === sb.ino && sa.ino !== 0n;
}

/** The nearest existing ancestor of `p` (or `p`), as a real path: where a write would actually land. */
function realAncestor(p) {
  let cur = resolve(p);
  while (!existsSync(cur)) cur = dirname(cur);
  return realpathSync(cur);
}

const sha256File = (path) =>
  new Promise((ok, fail) => {
    const h = createHash('sha256');
    createReadStream(path).on('data', (d) => h.update(d)).on('error', fail).on('end', () => ok(h.digest('hex')));
  });

/**
 * What would be copied (or, with `link`, hard-linked), decided without reading any file's contents.
 * Returns `{ entries, totals, problems, link }`; `problems` non-empty means a refusal (the caller exits 2 and writes nothing).
 * With `link` the source and the target must be on one volume, art and depth map each; `deviceOf` (default: the folder's real device number) is a test seam.
 */
export function planSync({ source = EXP_ART, target, fxSource = join(REPO, 'public', 'fx'), fxTarget, link = false, deviceOf = deviceOfFolder } = {}) {
  const problems = [];
  if (!target) return { entries: [], totals: emptyTotals(), problems: ['--target is required (the release tree\'s public/art)'], link };
  const roots = { art: { source, target }, fx: { source: fxSource, target: fxTarget ?? join(dirname(resolve(target)), 'fx') } };

  for (const [area, r] of Object.entries(roots)) {
    for (const [what, dir] of [['source', r.source], ['target', r.target]]) {
      if (!existsSync(dir) || !statSync(dir).isDirectory()) problems.push(`the ${area} ${what} is not a folder: ${dir}`);
    }
  }
  if (!problems.length) {
    if (basename(resolve(roots.art.target)) !== 'art') problems.push(`the target must be a release tree's public/art folder (its name is "art"): ${target}`);
    for (const [area, r] of Object.entries(roots)) {
      const s = real(r.source);
      const t = real(r.target);
      if (inside(s, t) || inside(t, s)) problems.push(`the ${area} target and source are the same folder, or one holds the other: ${s} / ${t}`);
    }
    if (link) {
      for (const [area, r] of Object.entries(roots)) {
        const s = deviceOf(r.source);
        const t = deviceOf(r.target);
        if (s !== t) problems.push(`--link needs the ${area} source and target on one volume (a hard link cannot cross volumes): ${r.source} is on device ${s}, ${r.target} on device ${t}; run without --link to copy`);
      }
    }
  }
  if (problems.length) return { entries: [], totals: emptyTotals(), problems, link };

  const entries = [];
  for (const [area, r] of Object.entries(roots)) {
    const keep = area === 'art' ? isNamespacePath : isFxNamespacePath;
    const realTarget = real(r.target);
    const files = walkFiles(r.source).filter(keep).sort();
    if (!files.length) problems.push(`no ${area} files of the namespace in ${r.source}`);
    for (const rel of files) {
      const src = join(r.source, rel);
      const dst = resolve(r.target, rel);
      if (!isCleanRelative(rel) || !keep(rel)) {
        problems.push(`refused (outside the namespace): ${area}/${rel}`);
        continue;
      }
      if (!inside(dst, resolve(r.target)) || !inside(realAncestor(dst), realTarget)) {
        problems.push(`refused (the destination leaves the target): ${area}/${rel}`);
        continue;
      }
      if (lstatSync(src).isSymbolicLink()) {
        problems.push(`refused (a symbolic link): ${area}/${rel}`);
        continue;
      }
      const size = statSync(src).size;
      let status = 'new';
      if (existsSync(dst)) status = statSync(dst).size === size ? 'present' : 'conflict';
      entries.push({ area, rel, src, dst, size, status });
    }
  }
  const conflicts = entries.filter((e) => e.status === 'conflict');
  for (const c of conflicts) problems.push(`conflict (exists with another size, left untouched): ${c.area}/${c.rel}`);
  return { entries, totals: totalsOf(entries), problems, link };
}

function emptyTotals() {
  return { files: 0, bytes: 0, new: { files: 0, bytes: 0 }, present: { files: 0, bytes: 0 }, conflict: { files: 0, bytes: 0 }, byArea: {} };
}

function totalsOf(entries) {
  const t = emptyTotals();
  for (const e of entries) {
    t.files++;
    t.bytes += e.size;
    t[e.status].files++;
    t[e.status].bytes += e.size;
    const key = `${e.area}/${e.rel.split('/')[0]}`;
    const a = (t.byArea[key] ??= { files: 0, bytes: 0, new: 0 });
    a.files++;
    a.bytes += e.size;
    if (e.status === 'new') a.new++;
  }
  return t;
}

/**
 * Copy every `new` entry of a plan: temp name, sha256 against the source, then the real name by a hard link that cannot replace anything.
 * With `plan.link` the temporary name is itself a hard link of the source (no bytes are copied): it must be the very same file (device and inode) with the
 * same sha256 before it takes its real name, and a link the filesystem refuses (another volume, no hard links) fails that file with the system's reason.
 * Never touches a `present` entry, never overwrites. Returns `{ copied, skipped, failed }` (`copied` holds the linked files in link mode).
 */
export async function applySync(plan, { onFile } = {}) {
  const link = plan.link === true;
  if (plan.problems.length) throw new Error(`refusing to ${link ? 'link' : 'copy'}: ${plan.problems[0]}`);
  const result = { copied: [], skipped: [], failed: [] };
  for (const e of plan.entries) {
    if (e.status !== 'new') {
      result.skipped.push(e);
      continue;
    }
    const tmp = `${e.dst}.exp-sync-${process.pid}.tmp`;
    let ours = false; // the temporary name exists and this run made it: only then may a failure remove it (a stranger's file of that name stays)
    try {
      mkdirSync(dirname(e.dst), { recursive: true });
      if (link) {
        linkSync(e.src, tmp); // atomic: a throw means no name was made (EEXIST: someone else's file is there and is left alone; EXDEV: another volume)
        ours = true;
        if (!sameFile(e.src, tmp)) {
          unlinkSync(tmp);
          result.failed.push({ ...e, reason: 'the link is not the same file as its source (the filesystem copied it instead of linking it); the new name was removed' });
          continue;
        }
      } else {
        ours = true;
        copyFileSync(e.src, tmp, constants.COPYFILE_EXCL);
      }
      const [want, got] = await Promise.all([sha256File(e.src), sha256File(tmp)]);
      if (want !== got) {
        unlinkSync(tmp);
        result.failed.push({ ...e, reason: `sha256 mismatch after the ${link ? 'link' : 'copy'} (${want.slice(0, 12)} against ${got.slice(0, 12)}); the new name was removed` });
        continue;
      }
      try {
        linkSync(tmp, e.dst); // fails with EEXIST if the name has appeared meanwhile: nothing is ever replaced
      } catch (err) {
        unlinkSync(tmp);
        if (err && err.code === 'EEXIST') {
          result.skipped.push({ ...e, status: 'present' });
          continue;
        }
        throw err;
      }
      unlinkSync(tmp);
      result.copied.push({ ...e, sha256: want });
      onFile?.(e, result);
    } catch (err) {
      try {
        if (ours && existsSync(tmp)) unlinkSync(tmp);
      } catch {
        /* the temporary name is ours; if it cannot go, the report below says which file failed */
      }
      result.failed.push({ ...e, reason: String(err?.message ?? err) });
    }
  }
  return result;
}

const mib = (n) => `${(n / 1048576).toFixed(1)} MiB`;
const gib = (n) => `${(n / 1073741824).toFixed(2)} GiB`;

function report(plan, { list }) {
  const t = plan.totals;
  const verb = plan.link ? 'link' : 'copy';
  const lines = [];
  for (const [key, a] of Object.entries(t.byArea).sort()) lines.push(`  ${key.padEnd(34)} ${String(a.files).padStart(4)} files ${mib(a.bytes).padStart(11)}  (${a.new} to ${verb})`);
  lines.push(`  ${'total'.padEnd(34)} ${String(t.files).padStart(4)} files ${mib(t.bytes).padStart(11)} = ${gib(t.bytes)}`);
  lines.push(`  to ${verb} ${t.new.files} files, ${mib(t.new.bytes)} (${gib(t.new.bytes)}); already there ${t.present.files}; conflicts ${t.conflict.files}`);
  if (plan.link) lines.push('  hard links: the release tree\'s names share the workspace files\' bytes, so no new disk space is used (a write in place through either name changes both)');
  if (list) for (const e of plan.entries) lines.push(`    ${e.status.padEnd(8)} ${e.area}/${e.rel} ${e.size}`);
  return lines.join('\n');
}

function argOf(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = { source: argOf(argv, '--source') ?? EXP_ART, target: argOf(argv, '--target'), fxSource: argOf(argv, '--fx-source'), fxTarget: argOf(argv, '--fx-target') };
  for (const k of Object.keys(opts)) if (opts[k] === undefined) delete opts[k];
  const link = argv.includes('--link');
  const plan = planSync({ ...opts, link });
  if (argv.includes('--json')) console.log(JSON.stringify({ link, totals: plan.totals, problems: plan.problems, entries: plan.entries.map(({ src, dst, ...rest }) => rest) }, null, 1));
  else {
    console.log(`exp-art-sync${link ? ' --link (hard links: no bytes are copied)' : ''}${argv.includes('--dry-run') ? ' (dry run: nothing is written)' : ''}\n  from ${opts.source}\n  into ${opts.target ?? '(no --target)'}`);
    if (plan.entries.length) console.log(report(plan, { list: argv.includes('--list') }));
    for (const p of plan.problems) console.log(`  PROBLEM: ${p}`);
  }
  if (plan.problems.length) {
    process.exitCode = 2;
    return;
  }
  if (argv.includes('--dry-run')) {
    if (!argv.includes('--json')) console.log('  dry run only. The release build\'s prebuild (`node tools/gen/manifest.mjs`) lists the namespace once the files are there; manifest.json is not copied.');
    return;
  }
  const did = link ? 'linked' : 'copied';
  console.log(`${link ? 'linking' : 'copying'} ${plan.totals.new.files} files (${gib(plan.totals.new.bytes)}${link ? ', as hard links: no new disk space' : ''}); every file is checked against its sha256${link ? ' and must be the very same file as its source' : ''} and no existing file is touched ...`);
  const result = await applySync(plan, { onFile: (e, r) => r.copied.length % 100 === 0 && console.log(`  ${r.copied.length} ${did}`) });
  console.log(`done: ${result.copied.length} ${did} and verified, ${result.skipped.length} already there, ${result.failed.length} failed`);
  for (const f of result.failed) console.log(`  FAILED ${f.area}/${f.rel}: ${f.reason}`);
  if (result.failed.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) await main();
