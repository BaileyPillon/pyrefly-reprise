#!/usr/bin/env node
/**
 * The experimental Leblanc chapter's art workspace (branch `exp-leblanc`; FFX-2 only).
 *
 *   node tools/exp-art.mjs mirror            hard-link mirror of the release art into D:/pyrefly-art-exp (same volume, no extra bytes)
 *   node tools/exp-art.mjs seed              the namespace `exp-leblanc` as REAL COPIES of today's Chapter VI art (the placeholders)
 *   node tools/exp-art.mjs status [--json]   every namespaced pose: placeholder (still today's pixels) or installed (new art)
 *   node tools/exp-art.mjs verify            isolation proof: the release tree is untouched, the namespace shares no bytes with it
 *   node tools/exp-art.mjs link              point <repo>/public/art at the workspace (rmdir the old junction only, then mklink /J)
 *   node tools/exp-art.mjs snapshot          write tests/fixtures/exp-leblanc/ch6-art.json: Chapter VI's art as the RELEASE tree holds it (manifest rows + sha256)
 *
 * Why a mirror and not a copy: the art is 9.5 GB and D: is nearly full. A hard link is the same bytes under a second name, so the
 * workspace costs only directory entries. The price is one rule, which this file keeps: **never write a hard-linked file in place**
 * (a write through one name changes the release tree's file too). The generated index `manifest.json` is rewritten in place by
 * `node tools/gen/manifest.mjs` on every build, so it is a REAL copy in the mirror; everything in the namespace is a real copy;
 * a tool that replaces a mirrored file must write a new file and rename it over (`exp-install.mjs` does).
 *
 * `seed` copies only the 1x paintings and their sidecars (the chosen states the manifest lists), not the @2x/@3x/@4x masters: a
 * placeholder is replaced by new art, which brings its own tiers (`exp-install.mjs`), and the masters would be 3 GB of identical
 * bytes in the preview build. It never overwrites a file that is already in the namespace (installed art is safe).
 */
import { copyFileSync, constants, existsSync, linkSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { BASE_SCENE_KEY, EXP_ART, NAMESPACE, REAL_COPY_IN_MIRROR, RELEASE_ART, REPO, SCENE_KEY, chapterSubjects, nsId, readJson, statesOf } from './exp-art-lib.mjs';

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** Every file under `root`, as paths relative to it with forward slashes. */
function walk(root, rel = '') {
  const out = [];
  for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
    const here = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(root, here));
    else if (entry.isFile()) out.push(here);
  }
  return out;
}

const inNamespace = (rel) => rel.startsWith(`characters/${NAMESPACE}-`) || rel.startsWith(`backdrops/${SCENE_KEY}`);

/** Is `a` the same file as `b` (one inode on one device)? */
function sameInode(a, b) {
  if (!existsSync(a) || !existsSync(b)) return false;
  const sa = statSync(a, { bigint: true });
  const sb = statSync(b, { bigint: true });
  return sa.dev === sb.dev && sa.ino === sb.ino && sa.ino !== 0n;
}

export function mirror({ src = RELEASE_ART, dst = EXP_ART } = {}) {
  const from = resolve(src);
  const to = resolve(dst);
  if (to === from || to.startsWith(from + sep) || from.startsWith(to + sep)) throw new Error(`mirror: ${to} and ${from} must be separate trees`);
  mkdirSync(to, { recursive: true });
  const stats = { linked: 0, copied: 0, same: 0, kept: 0, bytesLinked: 0 };
  const made = new Set();
  for (const rel of walk(from)) {
    const a = join(from, rel);
    const b = join(to, rel);
    const dir = dirname(b);
    if (!made.has(dir)) {
      mkdirSync(dir, { recursive: true });
      made.add(dir);
    }
    if (existsSync(b)) {
      if (sameInode(a, b)) stats.same++;
      else stats.kept++; // a real copy already (manifest.json) or a diverged file: never touched
      continue;
    }
    if (REAL_COPY_IN_MIRROR.includes(rel)) {
      copyFileSync(a, b, constants.COPYFILE_EXCL);
      stats.copied++;
    } else {
      linkSync(a, b);
      stats.linked++;
      stats.bytesLinked += statSync(a).size;
    }
  }
  return stats;
}

/** Copy `a` to `b` as a new real file, never over an existing one. Returns 'copied' | 'exists' | 'missing'. */
function copyNew(a, b) {
  if (!existsSync(a)) return 'missing';
  if (existsSync(b)) return 'exists';
  mkdirSync(dirname(b), { recursive: true });
  copyFileSync(a, b, constants.COPYFILE_EXCL);
  return 'copied';
}

/** The sidecar of the placeholder backdrop says which painting it stands in for, so a reader of the file knows. */
function noteBackdropSidecar(path) {
  const j = readJson(path, null);
  if (!j || j.expNamespace) return;
  writeFileSync(path, `${JSON.stringify({ ...j, expNamespace: NAMESPACE, placeholderFor: `backdrops/${BASE_SCENE_KEY}.png` }, null, 2)}\n`);
}

export async function seed({ release = RELEASE_ART, exp = EXP_ART, fx = join(REPO, 'public', 'fx') } = {}) {
  const { girls, enemies } = await chapterSubjects(release);
  const report = { subjects: 0, files: 0, skipped: 0, missing: [], backdrop: [], fx: 'absent' };
  for (const base of [...girls, ...enemies]) {
    const states = statesOf(release, base);
    if (!states.length) report.missing.push(base);
    report.subjects++;
    for (const state of states) {
      for (const ext of ['png', 'json']) {
        const r = copyNew(join(release, 'characters', base, `${state}.${ext}`), join(exp, 'characters', nsId(base), `${state}.${ext}`));
        if (r === 'copied') report.files++;
        else if (r === 'exists') report.skipped++;
      }
    }
  }
  for (const name of [`${BASE_SCENE_KEY}.png`, `${BASE_SCENE_KEY}.json`, `${BASE_SCENE_KEY}@2x.png`]) {
    const dstName = name.replace(BASE_SCENE_KEY, SCENE_KEY);
    const dst = join(exp, 'backdrops', dstName);
    const r = copyNew(join(release, 'backdrops', name), dst);
    report.backdrop.push(`${dstName}: ${r}`);
    if (r === 'copied' && dstName.endsWith('.json')) noteBackdropSidecar(dst);
  }
  // The depth maps of the scene's far-backdrop plates (`engine/fx/b/ambient/plateRooms.ts`): local, never committed (public/fx is ignored).
  const fxFrom = join(fx, BASE_SCENE_KEY);
  if (existsSync(fxFrom)) {
    report.fx = 'copied';
    for (const f of readdirSync(fxFrom)) copyNew(join(fxFrom, f), join(fx, SCENE_KEY, f));
  }
  return report;
}

/** One row per namespaced pose: placeholder when its pixels are still today's Chapter VI painting. */
export function status({ release = RELEASE_ART, exp = EXP_ART } = {}) {
  const rows = [];
  const dir = join(exp, 'characters');
  for (const folder of readdirSync(dir).filter((n) => n.startsWith(`${NAMESPACE}-`)).sort()) {
    const base = folder.slice(NAMESPACE.length + 1);
    for (const f of readdirSync(join(dir, folder)).filter((n) => /^[A-Za-z0-9][A-Za-z0-9_-]*\.png$/.test(n)).sort()) {
      const state = f.replace(/\.png$/, '');
      const mine = join(dir, folder, f);
      const theirs = join(release, 'characters', base, f);
      const tiers = [2, 3, 4].filter((n) => existsSync(join(dir, folder, `${state}@${n}x.png`)));
      rows.push({ subject: base, pose: state, state: existsSync(theirs) && sha256(mine) === sha256(theirs) ? 'placeholder' : 'installed', tiers });
    }
  }
  return rows;
}

export function verify({ release = RELEASE_ART, exp = EXP_ART, link = join(REPO, 'public', 'art') } = {}) {
  const problems = [];
  const releaseFiles = walk(release);
  const leaked = releaseFiles.filter(inNamespace);
  if (leaked.length) problems.push(`the release tree holds ${leaked.length} namespace file(s), e.g. ${leaked[0]}`);
  let mirrored = 0;
  for (const rel of releaseFiles) {
    const b = join(exp, rel);
    if (REAL_COPY_IN_MIRROR.includes(rel)) {
      if (!existsSync(b)) problems.push(`mirror lacks ${rel}`);
      else if (statSync(b).nlink !== 1) problems.push(`${rel} is hard-linked in the mirror (a rebuild would rewrite the release file)`);
      continue;
    }
    if (!existsSync(b)) problems.push(`mirror lacks ${rel}`);
    else if (!sameInode(join(release, rel), b)) problems.push(`${rel} is not the release file any more (a copy, or replaced)`);
    else mirrored++;
    if (problems.length > 20) break;
  }
  let owned = 0;
  for (const rel of walk(exp).filter(inNamespace)) {
    owned++;
    if (statSync(join(exp, rel)).nlink !== 1) problems.push(`${rel} is hard-linked (the namespace must be real copies)`);
    if (problems.length > 20) break;
  }
  try {
    if (realpathSync(link).toLowerCase() !== realpathSync(exp).toLowerCase()) problems.push(`${link} points at ${realpathSync(link)}, not ${exp}`);
  } catch {
    problems.push(`${link} does not exist`);
  }
  return { ok: problems.length === 0, releaseFiles: releaseFiles.length, mirroredByHardLink: mirrored, namespaceFiles: owned, problems };
}

/** `public/art` -> the workspace. Removes only the junction itself (`rmdir`, which cannot delete a folder with files), then makes the new one. */
export function link({ exp = EXP_ART, at = join(REPO, 'public', 'art') } = {}) {
  let isLink = false;
  try {
    isLink = lstatSync(at).isSymbolicLink();
  } catch {
    /* absent */
  }
  if (existsSync(at) && !isLink) {
    const current = realpathSync(at);
    if (current.toLowerCase() === resolve(exp).toLowerCase()) return 'already points at the workspace';
    throw new Error(`${at} is not a link (a real folder): refusing to touch it`);
  }
  if (existsSync(at) && realpathSync(at).toLowerCase() === resolve(exp).toLowerCase()) return 'already points at the workspace';
  const nat = (p) => p.replace(/\//g, '\\');
  if (existsSync(at)) {
    const rm = spawnSync('cmd', ['/c', 'rmdir', nat(at)], { encoding: 'utf8' });
    if (rm.status !== 0) throw new Error(`rmdir ${at} failed: ${rm.stderr || rm.stdout}`);
  }
  const mk = spawnSync('cmd', ['/c', 'mklink', '/J', nat(at), nat(exp)], { encoding: 'utf8' });
  if (mk.status !== 0) throw new Error(`mklink failed: ${mk.stderr || mk.stdout}`);
  return `linked ${at} -> ${exp}`;
}

/**
 * Chapter VI's art as the release tree holds it: for every base subject the chapter draws and for its backdrop, the manifest row and the
 * sha256 of each chosen painting and sidecar. `tests/unit/exp-leblanc.test.ts` compares it with what `public/art` serves, which proves the
 * workspace leaves Chapter VI's manifest entries and files exactly as they are.
 */
export async function snapshot({ release = RELEASE_ART, out = join(REPO, 'tests', 'fixtures', 'exp-leblanc', 'ch6-art.json') } = {}) {
  const { girls, enemies } = await chapterSubjects(release);
  const manifest = readJson(join(release, 'manifest.json'), { subjects: {}, backdropTiers: {} });
  const subjects = {};
  for (const base of [...girls, ...enemies]) {
    const row = manifest.subjects[base];
    const files = {};
    for (const state of row.states) {
      for (const ext of ['png', 'json']) {
        const p = join(release, 'characters', base, `${state}.${ext}`);
        if (existsSync(p)) files[`${state}.${ext}`] = sha256(p);
      }
    }
    subjects[base] = { manifest: row, files };
  }
  const backdropFiles = {};
  for (const name of [`${BASE_SCENE_KEY}.png`, `${BASE_SCENE_KEY}.json`, `${BASE_SCENE_KEY}@2x.png`]) backdropFiles[name] = sha256(join(release, 'backdrops', name));
  const doc = {
    about: "Chapter VI's art as the release tree holds it (tools/exp-art.mjs snapshot). The experimental Leblanc chapter's workspace must serve exactly this for Chapter VI.",
    girls,
    enemies,
    subjects,
    backdrop: { key: BASE_SCENE_KEY, listed: manifest.backdrops.includes(BASE_SCENE_KEY), tiers: manifest.backdropTiers?.[BASE_SCENE_KEY] ?? [], files: backdropFiles },
  };
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(doc, null, 1)}
`);
  return { out, subjects: Object.keys(subjects).length, files: Object.values(subjects).reduce((n, s) => n + Object.keys(s.files).length, 0) };
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const json = rest.includes('--json');
  if (cmd === 'mirror') console.log(JSON.stringify(mirror(), null, 1));
  else if (cmd === 'seed') console.log(JSON.stringify(await seed(), null, 1));
  else if (cmd === 'status') {
    const rows = status();
    if (json) console.log(JSON.stringify(rows, null, 1));
    else {
      const by = new Map();
      for (const r of rows) {
        const e = by.get(r.subject) ?? { placeholder: 0, installed: 0, installedPoses: [] };
        e[r.state]++;
        if (r.state === 'installed') e.installedPoses.push(`${r.pose}${r.tiers.length ? `(@${r.tiers.join('/@')}x)` : ''}`);
        by.set(r.subject, e);
      }
      for (const [s, e] of by) console.log(`${s.padEnd(22)} placeholder ${String(e.placeholder).padStart(2)}  installed ${String(e.installed).padStart(2)} ${e.installedPoses.join(' ')}`);
      console.log(`${rows.filter((r) => r.state === 'installed').length} installed, ${rows.filter((r) => r.state === 'placeholder').length} placeholder`);
    }
  } else if (cmd === 'verify') {
    const r = verify();
    console.log(JSON.stringify(r, null, 1));
    process.exitCode = r.ok ? 0 : 1;
  } else if (cmd === 'link') console.log(link());
  else if (cmd === 'snapshot') console.log(JSON.stringify(await snapshot(), null, 1));
  else {
    console.error('usage: node tools/exp-art.mjs mirror | seed | status [--json] | verify | link | snapshot');
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) await main();
