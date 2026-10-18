/**
 * **The common core of every art install** (pose continuity, W1; both games): copy a set of paintings and their sidecars into a TARGET art folder, then
 * register them (`measure.py measure`, `measure.py table`) and run the pose gate. It is the one in-repo install path: about 17 throwaway scripts under
 * `D:/Tools/pyrefly-scratch` each took care of hard links, backups and the ten-field sidecar and none of them registered what they installed, which is how the
 * Dark Aeons shipped with no stance row (FOC501-01). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for this
 * please." The CLI is `tools/art-install.mjs`; the rule is AGENTS.md hard rule 16 and docs/ART-PIPELINE.md section 5.
 *
 * What it refuses, before it writes a byte (every refusal lists what it found):
 *   - a target folder whose files are hard links (`nlink` > 1): the approved masters and the live art are hard-linked into every mirror, and a write through a link
 *     changes all of them. Install into a folder that holds copies, or a new subject's own folder;
 *   - a destination that exists, unless `replace` AND a `backup` folder are given (the old file is MOVED there first; a file with more than one link is never moved);
 *   - a sidecar that carries a field the game does not read (`SIDECAR_FIELDS`), a path, a drive letter or a user name, or whose width and height are not the painting's;
 *   - a painting that does not decode as an image with an alpha channel; a pose name the game cannot ask for (`@` or `.` in it); a subject with no idle.
 * A `--replace` also moves the pose's hi-DPI masters (`<pose>@2x.png`, `@3x`, `@4x`, `@2x.json`) aside with the old 1x file: they are renders of the OLD painting, and a
 * hi-DPI player would see it at the new painting's registration (the gate refuses such a master too: `hires-differs`). `tools/hires-install.mjs` makes them again.
 * It writes each file under a temporary name beside its destination and renames it into place, then compares sha256 with the source. After the copy it registers
 * and gates (see {@link register}); a painting that fails the gate is installed but NOT shippable, and the exit code says so.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SIDECAR_FIELDS } from './art-sidecar-fields.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_PYTHON = process.env.ART_INSTALL_PYTHON ?? process.env.EXP_PYTHON ?? 'D:/Tools/ComfyUI/python_embeded/python.exe';
const SUBJECT = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const POSE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const sha256Bytes = (b) => createHash('sha256').update(b).digest('hex');

/** The files directly in `dir` that have more than one hard link. */
export function hardLinked(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const st = statSync(join(dir, name));
    if (st.isFile() && st.nlink > 1) out.push({ name, nlink: st.nlink });
  }
  return out;
}

/** Problems with a sidecar object (empty when it is fine). `size` is the painting's `{width, height}`. */
export function sidecarProblems(obj, where, size) {
  const out = [];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [`${where}: a sidecar is a JSON object`];
  const extra = Object.keys(obj).filter((k) => !SIDECAR_FIELDS.includes(k));
  if (extra.length) out.push(`${where}: the sidecar carries fields the game does not read (${extra.join(', ')}); the only fields are ${SIDECAR_FIELDS.join(', ')}`);
  // checked on the decoded values: a prompt carries the escaped-parenthesis syntax `\(ff10\)`, which is not a path
  const text = Object.values(obj).map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' | ');
  if (/[A-Za-z]:[\\/]|Administrator|Users[\\/]/.test(text) || /(^|\s)\\\\[A-Za-z0-9_.$-]+\\/.test(text)) out.push(`${where}: the sidecar text carries a path, a drive letter or a user name (the site is public)`);
  if (size) {
    if (obj.width !== undefined && obj.width !== size.width) out.push(`${where}: the sidecar says width ${obj.width}, the painting is ${size.width}`);
    if (obj.height !== undefined && obj.height !== size.height) out.push(`${where}: the sidecar says height ${obj.height}, the painting is ${size.height}`);
  }
  return out;
}

/** The hi-DPI masters and their sidecar beside a 1x painting (`<pose>@2x.png`, `@3x`, `@4x`, `@2x.json`) that exist. */
export function hiresBeside(dir, pose) {
  return ['@2x.png', '@3x.png', '@4x.png', '@2x.json'].map((tail) => join(dir, `${pose}${tail}`)).filter((p) => existsSync(p));
}

/** The pose names in a folder of paintings (`<pose>.png` with no `@` and no `.` in the stem). */
export function posesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)).filter((n) => !n.includes('@') && !n.includes('.')).sort();
}

/**
 * Check everything and say what would be written; writes nothing.
 * @param {{target: string, items: Array<{subject: string, from?: string|null, poses?: string[]}>, replace?: boolean, backup?: string|null}} o
 * @returns {Promise<{ok: boolean, problems: string[], writes: Array<{subject: string, pose: string, png: string, json: string, srcPng: string, srcJson: string, sha: string, replaces: string[]}>, registerOnly: string[]}>}
 */
export async function planInstall({ target, items, replace = false, backup = null }) {
  const problems = [];
  const writes = [];
  const registerOnly = [];
  const root = resolve(target);
  if (!existsSync(root) || !statSync(root).isDirectory()) problems.push(`the target art folder ${root} does not exist (give --target <the art folder>, the one that holds characters/)`);
  if (replace && !backup) problems.push('--replace needs --backup <folder>: the file it replaces is moved there first');
  if (!items.length) problems.push('nothing to install: give --subject and --from, or --plan');
  const seen = new Set();
  for (const it of items) {
    const where = it.subject ?? '(no subject)';
    if (typeof it.subject !== 'string' || !SUBJECT.test(it.subject)) { problems.push(`${where}: a subject is lowercase kebab (tidus, seymour-flux)`); continue; }
    if (seen.has(it.subject)) { problems.push(`${where}: listed twice`); continue; }
    seen.add(it.subject);
    const dest = join(root, 'characters', it.subject);
    if (!it.from) { // register only: the paintings are already there
      if (!existsSync(join(dest, 'idle.png'))) problems.push(`${where}: no characters/${it.subject}/idle.png in the target to register`);
      else registerOnly.push(it.subject);
      continue;
    }
    const from = resolve(it.from);
    if (!existsSync(from)) { problems.push(`${where}: the source folder ${from} does not exist`); continue; }
    if (resolve(from) === resolve(dest)) { problems.push(`${where}: the source is the destination`); continue; }
    const poses = it.poses?.length ? it.poses : posesIn(from);
    if (!poses.length) { problems.push(`${where}: no <pose>.png in ${from}`); continue; }
    if (!poses.includes('idle') && !existsSync(join(dest, 'idle.png'))) problems.push(`${where}: no idle.png in the set or in the target (every pose is read against the idle)`);
    const linked = hardLinked(dest);
    if (linked.length) problems.push(`${where}: ${linked.length} file(s) in ${dest} are hard links (${linked.slice(0, 4).map((l) => `${l.name} x${l.nlink}`).join(', ')}${linked.length > 4 ? ', ...' : ''}): a write there reaches every folder that shares them, the live art included. Install into a folder that holds copies, not links`);
    for (const pose of poses) {
      const w = `${where}/${pose}`;
      if (!POSE.test(pose)) { problems.push(`${w}: not a pose name the game can ask for (lowercase kebab, no @ and no .)`); continue; }
      const srcPng = join(from, `${pose}.png`);
      const srcJson = join(from, `${pose}.json`);
      if (!existsSync(srcPng)) { problems.push(`${w}: ${srcPng} does not exist`); continue; }
      if (!existsSync(srcJson)) { problems.push(`${w}: no sidecar ${pose}.json beside the painting (width, height, baselineY, facing ...)`); continue; }
      let meta;
      try { meta = await sharp(srcPng).metadata(); } catch (e) { problems.push(`${w}: the painting does not decode (${e instanceof Error ? e.message : String(e)})`); continue; }
      if (meta.format !== 'png' || !meta.hasAlpha) { problems.push(`${w}: a painting is a PNG with an alpha channel (a cutout)`); continue; }
      let side;
      try { side = JSON.parse(readFileSync(srcJson, 'utf8')); } catch { problems.push(`${w}: the sidecar is not valid JSON`); continue; }
      problems.push(...sidecarProblems(side, w, { width: meta.width, height: meta.height }));
      const png = join(dest, `${pose}.png`);
      const json = join(dest, `${pose}.json`);
      const replaces = [png, json].filter((p) => existsSync(p));
      if (replaces.length && !replace) problems.push(`${w}: ${replaces.map((p) => p.slice(root.length + 1)).join(' and ')} exists already (an installed painting is never overwritten; --replace --backup <folder> moves it aside first)`);
      // the hi-DPI masters of the painting being replaced are renders of the old one: they go aside with it
      const stale = hiresBeside(dest, pose);
      if (replaces.length && stale.length) replaces.push(...stale);
      writes.push({ subject: it.subject, pose, png, json, srcPng, srcJson, sha: sha256(srcPng), replaces });
    }
  }
  return { ok: problems.length === 0, problems, writes, registerOnly };
}

function moveAside(file, backupDir, subject) {
  const dir = join(backupDir, subject);
  mkdirSync(dir, { recursive: true });
  let to = join(dir, basename(file));
  if (existsSync(to)) to = join(dir, `${basename(file, extname(file))}.${Date.now().toString(36)}${extname(file)}`);
  try { renameSync(file, to); } catch { copyFileSync(file, to); if (sha256(file) !== sha256(to)) throw new Error(`the backup of ${file} does not match it`); unlinkSync(file); }
  return to;
}

function writeBeside(dest, bytes) {
  // a dotted temporary stem (the manifest scanner ignores it), then rename into place: no write ever goes through an existing file
  const tmp = join(dirname(dest), `${basename(dest, extname(dest))}.tmp-${process.pid}-${Date.now().toString(36)}${extname(dest)}`);
  writeFileSync(tmp, bytes, { flag: 'wx' });
  renameSync(tmp, dest);
}

/** Do the writes a {@link planInstall} found. @returns {Array<{subject: string, pose: string, sha: string, bytes: number, movedAside: string[]}>} */
export function applyInstall(plan, { backup = null } = {}) {
  const out = [];
  for (const w of plan.writes) {
    mkdirSync(dirname(w.png), { recursive: true });
    const movedAside = w.replaces.map((p) => moveAside(p, resolve(backup), w.subject));
    const bytes = readFileSync(w.srcPng);
    writeBeside(w.png, bytes);
    writeBeside(w.json, readFileSync(w.srcJson));
    if (sha256(w.png) !== w.sha || sha256Bytes(bytes) !== w.sha) throw new Error(`${w.subject}/${w.pose}: sha256 mismatch after the copy`);
    out.push({ subject: w.subject, pose: w.pose, sha: w.sha, bytes: bytes.length, movedAside });
  }
  return out;
}

/** The default way to run a command: inherit the console, return the status. */
export function runCommand(cmd, args, { cwd, env } = {}) {
  const r = spawnSync(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' });
  return { status: r.status ?? 1, error: r.error?.message ?? null };
}

/** The subjects `tools/posescale/subjects.json` has no entry for: `measure.py` reads a missing entry as "no face box", which registers a figure without a head. */
export function subjectsWithoutAnnotation(subjects, root = ROOT) {
  let known = {};
  try { known = JSON.parse(readFileSync(join(root, 'tools', 'posescale', 'subjects.json'), 'utf8')); } catch { return []; }
  return subjects.filter((s) => !Object.prototype.hasOwnProperty.call(known, s));
}

/**
 * Run the pose gate on subjects an installer other than `art-install.mjs` has just written (`hires-install.mjs`, `gui-art-install.mjs`): those tools place paintings
 * and do not register them, so without this the gate would first speak at the deploy. Returns the gate's exit status (0 passes).
 * @param {{art: string, subjects: string[], root?: string, run?: typeof runCommand, log?: (line: string) => void}} o
 */
export function poseGateAfter({ art, subjects, root = ROOT, run = runCommand, log = console.log }) {
  if (!subjects.length) return 0;
  log(`pose gate: node tools/pose-gate.mjs --check --art ${resolve(art)} --subjects ${subjects.length} subject(s)`);
  const r = run(process.execPath, [join(root, 'tools', 'pose-gate.mjs'), '--check', '--art', resolve(art), '--root', root, '--subjects', subjects.join(',')], { cwd: root });
  if (r.status !== 0) log('pose gate: REFUSES what was just installed. The paintings are in place but NOT shippable: register them with node tools/art-install.mjs --register, or repaint.');
  return r.status;
}

/**
 * Register the subjects and gate them: `measure.py measure <subjects> --write` (reads PYREFLY_ART_DIR, writes docs/target/pose-measure.json), `measure.py table`
 * (writes src/data/art/poseRegistration*.ts from the records and the waiver ledger), then `node tools/pose-gate.mjs --check` on the target for those subjects.
 * @returns {{ok: boolean, step: 'measure'|'table'|'gate'|null, calls: Array<{cmd: string, args: string[]}>}}
 */
export function register({ subjects, target, root = ROOT, python = DEFAULT_PYTHON, run = runCommand, log = console.log }) {
  const art = resolve(target);
  const unknown = subjectsWithoutAnnotation(subjects, root);
  if (unknown.length) {
    log(`art-install: ${unknown.join(', ')} ${unknown.length > 1 ? 'are' : 'is'} not in tools/posescale/subjects.json. Add ${unknown.length > 1 ? 'each' : 'it'} there first: a figure with a face needs \`face\` (the idle's face box, read off the idle sheet), a creature, hull or part with none needs \`"game": "foe", "rowFromBaseline": true\`. Registering it without either would write stance-only rows and no head box, and the head lock would have nothing to hold. Then run again with --register.`);
    return { ok: false, step: 'annotation', calls: [] };
  }
  const steps = [
    ['measure', python, ['-s', 'tools/posescale/measure.py', 'measure', ...subjects, '--write']],
    ['table', python, ['-s', 'tools/posescale/measure.py', 'table']],
    ['gate', process.execPath, [join(root, 'tools', 'pose-gate.mjs'), '--check', '--art', art, '--root', root, '--subjects', subjects.join(',')]],
  ];
  const calls = [];
  for (const [step, cmd, args] of steps) {
    log(`art-install: ${step}: ${cmd === python ? 'python' : 'node'} ${args.join(' ')}`);
    calls.push({ cmd, args });
    const r = run(cmd, args, { cwd: root, env: { PYREFLY_ART_DIR: art } });
    if (r.status !== 0) return { ok: false, step, calls };
  }
  return { ok: true, step: null, calls };
}
