/**
 * **Install a rig, gated** (the rig program; both games). The rig counterpart of `tools/art-install-lib.mjs`: copy a rig folder (rig.json and its part PNGs) from where the pipeline wrote it
 * into the rig root the game reads (`D:/pyrefly-art-rigs`, served at `/art/rigs/`), and only if the rig gate says ok. The CLI is `tools/art-install.mjs --rig <subject> ...`.
 *
 * What it refuses, before it writes a byte (every refusal lists what it found):
 *   - a rig root under `public/` (rigs never go into public/art), or one that does not exist;
 *   - a source with no rig.json, a rig whose `name` is not the subject, or one whose stamp is not ok for exactly this content (`verifyStamp`: run `node tools/rig-gate.mjs` first);
 *   - a rig the gate refuses NOW against the target art folder (`gateRig`, blends included): the costume must be the painting installed there;
 *   - a destination whose files are hard links (a write through a link reaches every folder that shares them), or one that exists, unless `replace` AND a `backup` folder are given
 *     (the old files are MOVED there first);
 *   - a part PNG the rig names that is not beside its rig.json.
 * It writes each file under a temporary name beside its destination, renames it into place and compares sha256, then runs the gate on the installed copy.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { gateRig, verifyStamp } from './rig-gate-lib.mjs';
import { partImages, readRigFile } from './rig-format.mjs';

const SUBJECT = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** The files directly in `dir` that have more than one hard link. */
function hardLinked(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => { const st = statSync(join(dir, n)); return st.isFile() && st.nlink > 1; }).map((n) => ({ name: n, nlink: statSync(join(dir, n)).nlink }));
}

/** The files a rig folder must hold: rig.json and every PNG and rim mask it names. */
export function rigFiles(raw) {
  return ['rig.json', ...new Set(partImages(raw).flatMap((p) => [p.png, p.rim]).filter(Boolean))];
}

/**
 * Check everything and say what would be written; writes nothing.
 * @param {{rigsRoot: string, artDir?: string, root?: string, inputs?: object, items: Array<{subject: string, from: string}>, replace?: boolean, backup?: string|null, requireCoverage?: boolean}} o
 *   `requireCoverage` is ON by default (the driver's rule, 2026-10-17: a figure turns its rig on only with a key for every pose it is painted in); `false` installs a rig still being fitted, and the deploy refuses it
 * @returns {Promise<{ok: boolean, problems: string[], writes: Array<{subject: string, from: string, dest: string, files: string[], replaces: string[]}>}>}
 */
export async function planRigInstall({ rigsRoot, artDir, root, inputs, items, replace = false, backup = null, requireCoverage = true }) {
  const problems = [];
  const writes = [];
  const rr = resolve(rigsRoot);
  if (!existsSync(rr) || !statSync(rr).isDirectory()) problems.push(`the rig root ${rr} does not exist (give --rigs-root <the folder that holds <subject>/rig.json>)`);
  if (root && (rr + sep).startsWith(resolve(root, 'public') + sep)) problems.push(`the rig root ${rr} is inside public/: rigs never go into public/art`);
  if (replace && !backup) problems.push('--replace needs --backup <folder>: the files it replaces are moved there first');
  if (!items.length) problems.push('nothing to install: give --rig <subject> and --rig-from <folder>');
  const seen = new Set();
  for (const it of items) {
    const where = it.subject;
    if (!SUBJECT.test(String(it.subject))) { problems.push(`${where}: a subject is lowercase kebab (kimahri, rikku-alchemist)`); continue; }
    if (seen.has(it.subject)) { problems.push(`${where}: listed twice`); continue; }
    seen.add(it.subject);
    const from = resolve(it.from, existsSync(join(it.from, 'rig.json')) ? '.' : it.subject);
    if (!existsSync(join(from, 'rig.json'))) { problems.push(`${where}: no rig.json in ${from}`); continue; }
    const { raw } = readRigFile(from);
    if (raw.name !== it.subject) { problems.push(`${where}: the rig in ${from} is for "${raw.name}"`); continue; }
    const files = rigFiles(raw);
    const missing = files.filter((f) => !existsSync(join(from, f)));
    if (missing.length) { problems.push(`${where}: ${missing.length} file(s) the rig names are missing beside its rig.json (${missing.slice(0, 4).join(', ')})`); continue; }
    const stamp = verifyStamp(from, { full: requireCoverage });
    if (!stamp.ok) problems.push(`${where}: the rig is not stamped ok (${stamp.code}: ${stamp.message})`);
    const g = await gateRig({ rig: from, root, artDir, inputs, blends: true, requireCoverage });
    if (g.status !== 'ok') problems.push(`${where}: the rig gate refuses it against ${g.rigDir ? 'the target art folder' : 'the art'}: ${g.failures.length} failure(s) (${[...new Set(g.failures.map((f) => f.code))].join(', ')}); first: ${g.failures[0]?.message ?? '-'}`);
    const dest = join(rr, it.subject);
    if (resolve(dest) !== resolve(from)) {
      const linked = hardLinked(dest);
      if (linked.length) problems.push(`${where}: ${linked.length} file(s) in ${dest} are hard links (${linked.slice(0, 4).map((l) => `${l.name} x${l.nlink}`).join(', ')}): a write there reaches every folder that shares them`);
      const replaces = existsSync(dest) ? readdirSync(dest).map((n) => join(dest, n)) : [];
      if (replaces.length && !replace) problems.push(`${where}: ${dest} holds a rig already (an installed rig is never overwritten; --replace --backup <folder> moves it aside first)`);
      writes.push({ subject: it.subject, from, dest, files, replaces });
    } else writes.push({ subject: it.subject, from, dest, files: [], replaces: [] }); // already in place: the gate above is the install's check
  }
  return { ok: problems.length === 0, problems, writes };
}

function moveAside(file, backupDir, subject) {
  const dir = join(backupDir, 'rigs', subject);
  mkdirSync(dir, { recursive: true });
  let to = join(dir, basename(file));
  if (existsSync(to)) to = join(dir, `${basename(file, extname(file))}.${Date.now().toString(36)}${extname(file)}`);
  try { renameSync(file, to); } catch { copyFileSync(file, to); if (sha256(file) !== sha256(to)) throw new Error(`the backup of ${file} does not match it`); unlinkSync(file); }
  return to;
}

/** Do the writes a {@link planRigInstall} found. @returns {Array<{subject: string, files: number, movedAside: number}>} */
export function applyRigInstall(plan, { backup = null } = {}) {
  const out = [];
  for (const w of plan.writes) {
    if (!w.files.length) { out.push({ subject: w.subject, files: 0, movedAside: 0 }); continue; }
    mkdirSync(w.dest, { recursive: true });
    const moved = w.replaces.filter((f) => existsSync(f)).map((f) => moveAside(f, resolve(backup), w.subject));
    for (const f of w.files) {
      const src = join(w.from, f);
      const dest = join(w.dest, f);
      const tmp = join(dirname(dest), `${basename(f, extname(f))}.tmp-${process.pid}-${Date.now().toString(36)}${extname(f)}`);
      writeFileSync(tmp, readFileSync(src), { flag: 'wx' });
      renameSync(tmp, dest);
      if (sha256(dest) !== sha256(src)) throw new Error(`${w.subject}/${f}: sha256 mismatch after the copy`);
    }
    out.push({ subject: w.subject, files: w.files.length, movedAside: moved.length });
  }
  return out;
}
