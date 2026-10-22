/**
 * **What a rig must be to ship, and the deploy's two checks of it** (the rig program; both games, shared plumbing). The driver's rules, 2026-10-17, binding:
 *   (a) A figure turns its rig on only with FULL COVERAGE: every pose the game paints it in has a gate-passing key. No per-pose fallback to paintings.
 *   (b) The deploy runs `rig-gate --verify` on every shipped rig. Any refusal stops the deploy, and `--owner-override` does not bypass it, the same as the pose gate.
 *
 * `verifyShippableRig` is that verification, for one rig folder in a release art folder (`<public>/art/rigs/<subject>/`), without rendering anything (the gate's full render ran when it
 * stamped the rig, and `gate.digest` ties the stamp to this content). It is what `node tools/rig-gate.mjs --rig <folder> --verify` runs. A rig ships only when ALL hold:
 *
 *   gate-*        the stamp is `ok`, by this gate's rules, and its digest is the rig's and its part PNGs' now (`verifyStamp`, `full`); it says `coverage: "full"`, lists its exempt poses, and carries
 *                 a silhouette for every key it passed
 *   subject       the folder is named for the subject the rig is for
 *   costume-*     the costume painting in the release art folder is the master the parts were cut from (sha256), so a repainted idle retires the rig
 *   coverage      every painted pose of the subject in the release art folder (`characters/<subject>/<pose>.png`, bare names, the manifest's rule) has a key, or was exempt when the gate ran: a pose
 *                 painted AFTER the gate ran is a pose the rig would draw as the nearest key, and the deploy refuses it
 *   tier-*        the 1x twins of every part PNG and rim mask exist and are exactly the half of their files (`rig-tiers.mjs`), so a phone budgets a quarter of the texture memory
 *   files         the folder holds rig.json, the files it names and `1x/` and nothing else: what is in the folder ships, and the digest covers only what the rig names
 *
 * `enforceShippedRigs` runs it for every folder of `<public>/art/rigs/` before the build (the deploy calls it right after the pose gate; neither `--skip-tests` nor `--owner-override`
 * reaches it); `enforceBuiltRigs` runs after the build and proves that what the build holds under `art/rigs/` is exactly the verified rigs, that each `rig.json` is byte for byte the verified one,
 * and that the art manifest lists them (the pixel identity of every derived file is `art-derive verify`'s: the rig's PNGs are art masters like any other).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { costumeParts } from './rig-format.mjs';
import { costumeSha, verifyStamp } from './rig-gate-lib.mjs';
import { TIER_DIR, rigShippedNames, textureSizes, verifyTiers } from './rig-tiers.mjs';

/** A painting's bare name: the manifest's rule for a chosen pose (`tools/gen/manifest.mjs` CHOSEN). */
const BARE_PNG = /^([A-Za-z0-9][A-Za-z0-9_-]*)\.png$/;

/** The poses the release art folder paints a subject in (bare-named PNGs of `characters/<subject>/`). */
export function paintedPosesOf(artDir, subject) {
  const dir = join(artDir, 'characters', subject);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).map((f) => BARE_PNG.exec(f)?.[1]).filter(Boolean).sort();
}

/** What a rig folder may hold: rig.json, the files it names, and the 1x folder with their twins. `extra` is everything else (a path relative to the folder). */
export function inventory(dir, raw) {
  const names = new Set(['rig.json', ...rigShippedNames(raw)]);
  const extra = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory()) {
      if (f.name !== TIER_DIR) extra.push(`${f.name}/`);
    } else if (!names.has(f.name)) extra.push(f.name);
  }
  return { names, extra };
}

/**
 * Verify one rig folder as a shipping rig (see the file header).
 * @param {{dir: string, artDir: string, subject?: string, allowPartial?: boolean, tiers?: boolean}} o `artDir` holds `characters/`; `subject` is the folder's name (default the last path segment); `allowPartial`
 *   accepts a stamp that says `coverage: "partial"` (the dev loop; the deploy never passes it); `tiers: false` skips the 1x proof (the mirror tool checks a rig BEFORE it writes the tier, and again after)
 * @returns {Promise<{ok: boolean, subject: string, problems: Array<{code: string, message: string}>, info: object}>}
 */
export async function verifyShippableRig({ dir, artDir, subject, allowPartial = false, tiers = true }) {
  const folder = subject ?? dir.replace(/[\\/]+$/, '').split(/[\\/]/).pop();
  const problems = [];
  const bad = (code, message) => problems.push({ code, message });
  const info = { keys: [], exempt: [], tiers: null };
  const stamp = verifyStamp(dir, { full: !allowPartial });
  if (!stamp.ok) {
    bad(stamp.code ?? 'gate-not-ok', stamp.message ?? 'the stamp does not verify');
    if (!stamp.raw) return { ok: false, subject: folder, problems, info };
  }
  const { raw } = stamp;
  if (raw.name !== folder) bad('subject', `the folder is ${folder} and the rig is for "${raw.name}"`);
  const g = raw.gate ?? {};
  info.keys = Object.keys(raw.keys ?? {});
  info.exempt = g.exempt ?? [];
  // the costume painting is the master the parts were cut from
  const cp = costumeParts(raw.costume?.painting);
  if (!cp) bad('costume-name', `costume.painting ${JSON.stringify(raw.costume?.painting)} is not a characters/<subject>/<pose> path`);
  else {
    const file = join(artDir, 'characters', raw.name, `${cp.pose}.png`);
    if (!existsSync(file)) bad('costume-missing', `characters/${raw.name}/${cp.pose}.png is not in the release art folder`);
    else {
      const sha = costumeSha(raw.costume, raw.scale, artDir, raw.name, cp.pose);
      if (!sha.ok) bad('costume-stale', `${sha.why}: a repainted costume needs its rig cut again`);
    }
  }
  // every painted pose has a key, or was exempt when the gate ran
  const exempt = new Set(g.exempt ?? []);
  const keys = new Set(info.keys);
  const unkeyed = paintedPosesOf(artDir, raw.name).filter((p) => !keys.has(p) && !exempt.has(p));
  if (unkeyed.length) bad('coverage', `the release art folder paints ${raw.name} in ${unkeyed.join(', ')}, which have no key and were not exempt when the gate ran: a figure turns its rig on only with a key for every pose it is painted in (run node tools/rig-gate.mjs again, and add the keys)`);
  // the sizes the stamp says the files have are the sizes they have (the engine budgets memory from them)
  if (g.textures) {
    const now = textureSizes(raw, dir);
    const off = Object.keys(now).filter((n) => JSON.stringify(now[n]) !== JSON.stringify(g.textures[n]));
    if (off.length) bad('textures', `the stamp's texture sizes are not the files' for ${off.join(', ')}: a texture changed after the gate ran (run node tools/rig-gate.mjs again)`);
  }
  // the 1x twins
  if (tiers) {
    const t = await verifyTiers(dir);
    info.tiers = { checked: t.checked, texels: t.texels, bytes: t.bytes };
    for (const p of t.problems) bad('tier', p);
  }
  // nothing else in the folder
  const inv = inventory(dir, raw);
  for (const e of inv.extra) bad('files', `${e} is in the rig folder and the rig does not name it: it would ship unvetted`);
  return { ok: problems.length === 0, subject: folder, problems, info };
}

/** The rig folders of `<publicDir>/art/rigs/`: `{ subject, dir }` per directory, plus `stray` for anything that is not a directory. */
export function listRigFolders(publicDir) {
  const root = join(publicDir, 'art', 'rigs');
  if (!existsSync(root)) return { root, folders: [], stray: [] };
  const entries = readdirSync(root, { withFileTypes: true });
  return {
    root,
    folders: entries.filter((e) => e.isDirectory()).map((e) => ({ subject: e.name, dir: join(root, e.name) })).sort((a, b) => (a.subject < b.subject ? -1 : 1)),
    stray: entries.filter((e) => !e.isDirectory()).map((e) => e.name).sort(),
  };
}

/** What the deploy says when a rig is refused. `--owner-override` and `--skip-tests` do not cover it. */
export const rigRefusal = (n, stage) => `the rig gate refuses this deploy (${stage}): ${n} problem(s). A rig ships only with a full-coverage stamp from tools/rig-gate.mjs that still verifies, its costume painting unchanged and its 1x tier proved; --owner-override and --skip-tests do not cover it. Run: node tools/rig-gate.mjs --rig <folder> --verify`;

/**
 * The deploy's first rig check: every folder of `<publicDir>/art/rigs/` must verify as a shipping rig. `fail` ends the deploy (it throws or exits). A build with no rigs says so and passes.
 * @returns {Promise<Array<{subject: string, dir: string, keys: string[]}>>} the verified rigs
 */
export async function enforceShippedRigs({ publicDir, log = console.log, fail }) {
  const { root, folders, stray } = listRigFolders(publicDir);
  const lines = [];
  for (const s of stray) lines.push(`art/rigs/${s}: a file in the rig root, not a rig folder`);
  const ok = [];
  for (const f of folders) {
    if (!existsSync(join(f.dir, 'rig.json'))) { lines.push(`art/rigs/${f.subject}: no rig.json (a folder that is not a rig would ship unvetted)`); continue; }
    const v = await verifyShippableRig({ dir: f.dir, artDir: join(publicDir, 'art'), subject: f.subject });
    if (v.ok) ok.push({ subject: f.subject, dir: f.dir, keys: v.info.keys });
    else for (const p of v.problems) lines.push(`${f.subject}  ${p.code}  ${p.message}`);
  }
  log(folders.length || stray.length ? `rig gate: ${folders.length} rig(s) in ${root}, ${ok.length} verified (${ok.map((r) => `${r.subject}: ${r.keys.length} keys`).join('; ') || 'none'}), ${lines.length} problem(s)` : 'rig gate: no rigs ship in this build (art/rigs is not there)');
  if (lines.length) {
    for (const l of lines.slice(0, 25)) log(`  ${l}`);
    if (lines.length > 25) log(`  ... and ${lines.length - 25} more (node tools/rig-gate.mjs --rig <folder> --verify lists them)`);
    fail(rigRefusal(lines.length, 'before the build, on public/art/rigs'));
  }
  return ok;
}

const walk = (root) => {
  const out = [];
  const go = (d, rel) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) go(join(d, e.name), `${rel}${e.name}/`);
      else out.push(`${rel}${e.name}`);
    }
  };
  if (existsSync(root)) go(root, '');
  return out.sort();
};

/**
 * The deploy's second rig check, on the build: `<dist>/art/rigs/` holds the rigs `enforceShippedRigs` verified and nothing else; each `rig.json` is byte for byte the verified one (the build's
 * redaction of art JSON must not have touched it, or its digest would no longer match); every other file is a verified file or its derived WebP; and `art/manifest.json` lists exactly those rigs,
 * with their tiers. Anything else in the build under `art/rigs/` is a file nobody vetted.
 * @param {{dist: string, publicDir: string, verified: Array<{subject: string}>, log?: Function, fail: Function}} o
 */
export function enforceBuiltRigs({ dist, publicDir, verified, log = console.log, fail }) {
  const problems = [];
  const root = join(dist, 'art', 'rigs');
  const built = existsSync(root) ? readdirSync(root, { withFileTypes: true }) : [];
  const want = new Set(verified.map((v) => v.subject));
  for (const e of built) if (!e.isDirectory() || !want.has(e.name)) problems.push(`art/rigs/${e.name}: ${e.isDirectory() ? 'a rig folder the gate did not verify' : 'a file in the rig root'} ships in the build`);
  let files = 0;
  for (const subject of want) {
    const out = join(root, subject);
    const src = join(publicDir, 'art', 'rigs', subject);
    if (!existsSync(out)) { problems.push(`art/rigs/${subject}: verified, and the build does not hold it`); continue; }
    if (!readFileSync(join(out, 'rig.json')).equals(readFileSync(join(src, 'rig.json')))) problems.push(`art/rigs/${subject}/rig.json: the build's file is not the verified one (the build changed a rig.json: its stamp no longer matches)`);
    const have = new Set(walk(src));
    for (const f of walk(out)) {
      files++;
      const master = have.has(f) ? f : f.endsWith('.webp') && have.has(`${f.slice(0, -5)}.png`) ? `${f.slice(0, -5)}.png` : null;
      if (!master) problems.push(`art/rigs/${subject}/${f}: ships in the build and is not a verified file of the rig`);
    }
    for (const f of have) {
      const shipped = existsSync(join(out, f)) || (f.endsWith('.png') && existsSync(join(out, `${f.slice(0, -4)}.webp`)));
      if (!shipped) problems.push(`art/rigs/${subject}/${f}: a verified file the build does not hold`);
    }
  }
  const manifestFile = join(dist, 'art', 'manifest.json');
  const listed = existsSync(manifestFile) ? (JSON.parse(readFileSync(manifestFile, 'utf8')).rigs ?? []) : [];
  if ([...listed].sort().join() !== [...want].sort().join()) problems.push(`art/manifest.json lists the rigs [${listed.join(', ')}], the verified ones are [${[...want].join(', ')}]`);
  else if (existsSync(manifestFile)) {
    const tiers = JSON.parse(readFileSync(manifestFile, 'utf8')).rigTiers ?? {};
    for (const s of want) if (!Array.isArray(tiers[s]) || !tiers[s].includes(1) || !tiers[s].includes(2)) problems.push(`art/manifest.json does not list both tiers for ${s} (rigTiers.${s} = ${JSON.stringify(tiers[s])})`);
  }
  log(`rig gate (the build): ${want.size} rig(s), ${files} file(s) shipped under art/rigs, ${problems.length} problem(s)`);
  if (problems.length) {
    for (const p of problems.slice(0, 25)) log(`  ${p}`);
    fail(rigRefusal(problems.length, 'on the built art list'));
  }
  return { rigs: [...want], files };
}

