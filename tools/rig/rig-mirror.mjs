/**
 * **A release art mirror that carries the rigs** (the rig program; both games, shared plumbing). The engine's handoff left it open: "A release takes rigs from a release art mirror
 * (`public/art/rigs/<subject>/` in the mirror, so `tools/gen/manifest.mjs` lists them)". This is how that mirror is made.
 *
 * A release builds from `public/art`, which in a release worktree is a junction to a MIRROR: a folder with the same files as the art that is live, every one a HARD LINK (12 GB of art,
 * a few thousand directory entries). A hard link shares its data with every other name of the file, so a write through ANY name reaches all of them: a tool that rewrote a file of
 * a mirror in place would change the live art. So the mirror a rig release needs is a NEW folder:
 *
 *   - every file of the source mirror is hard-linked into it, and none is ever opened for writing;
 *   - except `manifest.json` (the index of what the art holds: the deploy rewrites it, so it is a real file of its own, rebuilt here from the new tree so it lists the rigs and their tiers);
 *   - and `rigs/<subject>/` for each rig being added: REAL COPIES (`COPYFILE_EXCL`: a name that exists is an error, never an overwrite), each compared byte for byte with its source. A rig the
 *     source mirror already holds under that subject is not linked; the new copy takes its place in the new mirror and the source is untouched.
 *
 * Before it writes anything it checks: the source is an art folder (`characters/`), the target does not exist and is not inside the source, both are on the same volume (a hard link cannot
 * cross one), and every rig verifies as a shipping rig against the SOURCE mirror's paintings (`rig-ship.mjs#verifyShippableRig`: full-coverage stamp, costume unchanged, every painted pose keyed).
 * Afterwards it proves the result from the files (`verifyMirror`): the target holds exactly the source's files plus the rigs', every linked file is the source's inode, every rig file has
 * one link and the source's bytes, the manifest lists the rigs, and each rig verifies again in the new mirror.
 *
 * The CLI is `tools/art-mirror-add-rigs.mjs`. Nothing here deletes, and nothing here touches the source mirror or `public/`.
 */
import { copyFileSync, constants, existsSync, linkSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { buildManifest, writeManifest } from '../gen/manifest.mjs';
import { RIG_FILE } from './rig-format.mjs';
import { verifyShippableRig } from './rig-ship.mjs';
import { TIER_DIR, rigImageNames, writeTiers } from './rig-tiers.mjs';

const SUBJECT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Every file under `root` as a path relative to it (forward slashes), sorted; symbolic links are refused (a mirror holds none). */
export function listFiles(root) {
  const out = [];
  const go = (dir, rel) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isSymbolicLink()) throw new Error(`${join(dir, e.name)} is a symbolic link: a mirror holds none`);
      if (e.isDirectory()) go(join(dir, e.name), `${rel}${e.name}/`);
      else out.push(`${rel}${e.name}`);
    }
  };
  go(root, '');
  return out.sort();
}

const inside = (child, parent) => (resolve(child) + sep).startsWith(resolve(parent) + sep);
const sameBytes = (a, b) => { try { return readFileSync(a).equals(readFileSync(b)); } catch { return false; } };

/**
 * Check everything and say what would be written; writes nothing.
 * @param {{from: string, rigsRoot: string, to: string, subjects?: string[], makeTiers?: boolean}} o
 * @returns {Promise<{ok: boolean, problems: string[], subjects: string[], links: string[], copies: Array<{subject: string, files: string[], replaces: boolean}>}>}
 */
export async function planMirror({ from, rigsRoot, to, subjects, makeTiers = false }) {
  const problems = [];
  const src = resolve(from);
  const dst = resolve(to);
  const plan = { ok: false, problems, subjects: [], links: [], copies: [] };
  if (!existsSync(join(src, 'characters'))) { problems.push(`${src} is not an art folder (no characters/ in it)`); return plan; }
  if (inside(dst, src) || inside(src, dst)) problems.push(`${dst} and ${src} are inside one another`);
  if (existsSync(dst)) problems.push(`${dst} exists: a mirror is made new, never filled in (choose a folder that is not there)`);
  if (/[\\/]public[\\/]art$/i.test(dst)) problems.push(`${dst} is a repository's public/art: a release mirror is a folder of its own, and public/art is a junction to it`);
  if (!existsSync(dirname(dst))) problems.push(`the folder ${dirname(dst)} does not exist`);
  else if (statSync(dirname(dst)).dev !== statSync(src).dev) problems.push(`${dst} is on another volume than ${src}: a hard link cannot cross one, and this tool never copies 12 GB to find out`);
  const root = resolve(rigsRoot);
  if (!existsSync(root)) { problems.push(`the rig root ${root} does not exist`); return plan; }
  const found = readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && existsSync(join(root, e.name, RIG_FILE))).map((e) => e.name).sort();
  const want = subjects?.length ? subjects : found;
  if (!want.length) problems.push(`no rig to add: ${root} holds no <subject>/rig.json`);
  for (const s of want) {
    if (!SUBJECT.test(s)) { problems.push(`${s}: a subject is lowercase kebab`); continue; }
    if (!found.includes(s)) { problems.push(`${s}: no ${RIG_FILE} in ${join(root, s)}`); continue; }
    const v = await verifyShippableRig({ dir: join(root, s), artDir: src, subject: s, tiers: !makeTiers });
    for (const p of v.problems) problems.push(`${s}  ${p.code}  ${p.message}`);
    const files = listFiles(join(root, s));
    plan.copies.push({ subject: s, files, replaces: existsSync(join(src, 'rigs', s)) });
  }
  plan.subjects = want;
  const replaced = new Set(plan.copies.filter((c) => c.replaces).map((c) => c.subject));
  plan.links = existsSync(src)
    ? listFiles(src).filter((f) => f !== 'manifest.json' && !(f.startsWith('rigs/') && replaced.has(f.split('/')[1])))
    : [];
  plan.ok = problems.length === 0;
  return plan;
}

/**
 * Make the mirror a {@link planMirror} approved. Hard-links every file of the source, copies the rigs, rebuilds the manifest, and returns what it made.
 * @returns {Promise<{linked: number, copied: number, tiered: number, manifest: {rigs: string[], rigTiers: object, changedKeys: string[]}}>}
 */
export async function buildMirror({ from, rigsRoot, to, plan, makeTiers = false, log = () => {} }) {
  const src = resolve(from);
  const dst = resolve(to);
  const root = resolve(rigsRoot);
  mkdirSync(dst, { recursive: false });
  let linked = 0;
  const made = new Set();
  const ensure = (dir) => { if (!made.has(dir)) { mkdirSync(dir, { recursive: true }); made.add(dir); } };
  for (const f of plan.links) {
    ensure(dirname(join(dst, f)));
    linkSync(join(src, f), join(dst, f));
    if (++linked % 1000 === 0) log(`  linked ${linked} of ${plan.links.length}`);
  }
  let copied = 0;
  let tiered = 0;
  for (const c of plan.copies) {
    for (const f of c.files) {
      const to2 = join(dst, 'rigs', c.subject, f);
      ensure(dirname(to2));
      copyFileSync(join(root, c.subject, f), to2, constants.COPYFILE_EXCL);
      if (!sameBytes(join(root, c.subject, f), to2)) throw new Error(`${c.subject}/${f}: the copy is not the source's bytes`);
      copied++;
    }
    if (makeTiers) tiered += (await writeTiers(join(dst, 'rigs', c.subject))).written.length;
  }
  // the manifest is a real file of this mirror's own, rebuilt from the new tree; what differs from the source's is reported
  const before = existsSync(join(src, 'manifest.json')) ? JSON.parse(readFileSync(join(src, 'manifest.json'), 'utf8')) : null;
  const wrote = writeManifest(dst);
  const now = wrote.manifest;
  const changedKeys = before ? [...new Set([...Object.keys(before), ...Object.keys(now)])].filter((k) => k !== 'generatedAt' && JSON.stringify(before[k]) !== JSON.stringify(now[k])).sort() : ['(no manifest in the source)'];
  return { linked, copied, tiered, manifest: { rigs: now.rigs ?? [], rigTiers: now.rigTiers ?? {}, changedKeys } };
}

/**
 * Prove a mirror made by {@link buildMirror}, from the files.
 * @returns {Promise<{ok: boolean, problems: string[], files: number, linked: number, copied: number}>}
 */
export async function verifyMirror({ from, rigsRoot, to, plan }) {
  const src = resolve(from);
  const dst = resolve(to);
  const root = resolve(rigsRoot);
  const problems = [];
  const have = listFiles(dst);
  // a rig's folder is what the plan copied, plus its 1x twins (copied with it, or written into the new copy by --make-tiers): one for every image the rig names
  const tiers = plan.copies.flatMap((c) => {
    const file = join(dst, 'rigs', c.subject, RIG_FILE);
    return existsSync(file) ? rigImageNames(JSON.parse(readFileSync(file, 'utf8'))).map((n) => `rigs/${c.subject}/${TIER_DIR}/${n}`) : [];
  });
  const want = new Set(['manifest.json', ...plan.links, ...plan.copies.flatMap((c) => c.files.map((f) => `rigs/${c.subject}/${f}`)), ...tiers]);
  const gone = have.filter((f) => !want.has(f));
  const missing = [...want].filter((f) => !have.includes(f));
  if (gone.length) problems.push(`${gone.length} file(s) in the mirror that it should not hold, e.g. ${gone.slice(0, 3).join(', ')}`);
  if (missing.length) problems.push(`${missing.length} file(s) missing from the mirror, e.g. ${missing.slice(0, 3).join(', ')}`);
  for (const f of plan.links) {
    const [a, b] = [statSync(join(src, f)), statSync(join(dst, f))];
    if (a.ino !== b.ino || a.dev !== b.dev) problems.push(`${f}: not a hard link of the source's file`);
    else if (b.nlink < 2) problems.push(`${f}: has one link`);
  }
  let copied = 0;
  for (const c of plan.copies) {
    for (const f of c.files) {
      const p = join(dst, 'rigs', c.subject, f);
      if (!existsSync(p)) continue;
      copied++;
      if (statSync(p).nlink !== 1) problems.push(`rigs/${c.subject}/${f}: is not a real copy (${statSync(p).nlink} links)`);
      const s = join(root, c.subject, f);
      if (existsSync(s) && !sameBytes(s, p) && !f.startsWith('1x/')) problems.push(`rigs/${c.subject}/${f}: is not the source's bytes`);
    }
  }
  if (statSync(join(dst, 'manifest.json')).nlink !== 1) problems.push('manifest.json: is not a file of its own (the deploy rewrites it)');
  const manifest = buildManifest(dst).manifest;
  const onDisk = JSON.parse(readFileSync(join(dst, 'manifest.json'), 'utf8'));
  if (JSON.stringify({ ...onDisk, generatedAt: 0 }) !== JSON.stringify({ ...manifest, generatedAt: 0 })) problems.push('manifest.json: is not what the tree in the mirror builds');
  for (const c of plan.copies) {
    if (!(onDisk.rigs ?? []).includes(c.subject)) problems.push(`manifest.json does not list the rig ${c.subject}`);
    else if (!(onDisk.rigTiers?.[c.subject] ?? []).includes(1)) problems.push(`manifest.json does not list the 1x tier of ${c.subject}`);
  }
  for (const c of plan.copies) {
    const v = await verifyShippableRig({ dir: join(dst, 'rigs', c.subject), artDir: dst, subject: c.subject });
    for (const p of v.problems) problems.push(`${c.subject}  ${p.code}  ${p.message}`);
  }
  return { ok: problems.length === 0, problems, files: have.length, linked: plan.links.length, copied };
}
