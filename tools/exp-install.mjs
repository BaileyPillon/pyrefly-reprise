#!/usr/bin/env node
/**
 * Install an approved Art Room image into the experimental Leblanc chapter's art namespace (branch `exp-leblanc`; FFX-2 only).
 *
 *   node tools/exp-install.mjs install --src <approved image.png> --subject yuna-gunner --pose idle [options]
 *   node tools/exp-install.mjs backdrop --src <approved plate.png> [--dry-run]
 *   node tools/exp-install.mjs table                      regenerate src/data/art/poseRegistrationExp.ts
 *   node tools/exp-install.mjs list                       what is installed, what is still a placeholder
 *
 * install options:
 *   --facing right|left|front  the way the painting faces (default: right for a girl, left for a fiend; the house contract)
 *   --head x0,y0,x1,y1         the head's box on THIS painting, hair top to chin and outer side to side, read by eye (a pose other than the idle
 *                              needs it for its registered `scale`; the idle's box is the reference every other pose is matched to)
 *   --feet-row N               the row of the soles when a thick weapon hangs lower than the boots (the registration's `feetRow`)
 *   --upright                  a standing pose wider than tall (a lunge): never laid down like a KO
 *   --no-tiers                 skip the @2x/@3x/@4x masters (a pose that already has them is refused: they would be the old painting's)
 *   --matte auto|keep|rembg    keep the image's own alpha, or cut it with isnet-anime (auto: keep when it has real alpha)
 *   --dry-run                  validate and say what would be written; write nothing
 *   --allow-unapproved         install an image that is not in the Art Room's approved record (tests only)
 *
 * One `install` does, in order (the spec is `docs/handoff/exp-leblanc.md`):
 *   1. validate: the subject is one the chapter draws (read from the game's data), the pose a pose name, the target inside the namespace
 *      (`<workspace>/characters/exp-leblanc-<subject>/`), the image in the Art Room's approved record (and its sha256 the record's);
 *   2. matte, clean and frame (`tools/exp-art/figure.py`): real alpha kept, an opaque image cut with rembg, the glow around the figure dropped,
 *      the edge de-haloed, a tight crop with the house 16 px margin; the feet line and the stance measured;
 *   3. write `<pose>.png` and its `<pose>.json` sidecar (the fields the engine reads: width, height, baselineY, facing; provenance beside them),
 *      each by a temporary file renamed over the old one; a painting that replaces earlier new art is copied to `<workspace>-replaced/` first;
 *   4. tiers (`tools/exp-art/tiers.py`, local RealESRGAN, then `tools/hires-install.mjs` installs @2x and @4x and derives @3x);
 *   5. registration: record the measured row in `docs/target/exp-leblanc/installed.json` and regenerate `src/data/art/poseRegistrationExp.ts`
 *      (CHK-026: one head size and one stance per figure; the poses still placeholders are rescaled to the new idle's pixel density);
 *   6. `node tools/gen/manifest.mjs`, so the game lists the new files.
 *
 * It never touches the release art tree, never writes a hard-linked file in place, never deletes a file, and stops on the first problem.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep, basename } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { BASE_SCENE_KEY, EXP_ART, NAMESPACE, RELEASE_ART, REPO, SCENE_KEY, chapterSubjects, nsId, readJson, statesOf } from './exp-art-lib.mjs';
import { buildExpRegistration, loadBaseTables, renderExpRegistration } from './exp-art-table.mjs';

export const INSTALLED_JSON = join(REPO, 'docs', 'target', 'exp-leblanc', 'installed.json');
export const TABLE_TS = join(REPO, 'src', 'data', 'art', 'poseRegistrationExp.ts');
/** The Art Room's approved record and folder: the only place an image may come from. */
export const ART_ROOM = process.env.EXP_ART_ROOM ?? 'D:/Tools/art-room/data';
/** The hires library the tiers go through (hires-install's own format), outside every art tree. */
export const TIER_LIB = process.env.EXP_TIER_LIB ?? 'D:/pyrefly-art-exp-lib';
export const REPLACED_DIR = process.env.EXP_REPLACED ?? 'D:/pyrefly-art-exp-replaced';
export const WORK_ROOT = process.env.EXP_WORK ?? 'D:/Tools/pyrefly-scratch/exp-install';
export const PYTHON = process.env.EXP_PYTHON ?? 'D:/Tools/ComfyUI/python_embeded/python.exe';

/** The engine's own thresholds the registration obeys (tools/posescale/measure.py). */
const STATURE_GATE = 0.6;
const KO_PROJECTION = 0.978;
const PRONE_ASPECT = 1.15;
const POSE_NAME = /^[a-z0-9][a-z0-9-]*$/;

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const say = (m) => console.log(`[exp-install] ${m}`);

export function readInstalled() {
  return readJson(INSTALLED_JSON, {}) ?? {};
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 1)}\n`);
  renameSync(tmp, path);
}

/** Regenerate the TypeScript table from the installed record and the base tables. Returns the number of subjects written. */
export async function writeTable() {
  const { girls, enemies } = await chapterSubjects();
  const subjects = [...girls, ...enemies];
  const table = buildExpRegistration(await loadBaseTables(), subjects, readInstalled(), {
    readSidecar: (subject, pose) => readJson(join(RELEASE_ART, 'characters', subject, `${pose}.json`), null),
    statesOf: (subject) => statesOf(RELEASE_ART, subject),
  });
  mkdirSync(dirname(TABLE_TS), { recursive: true });
  writeFileSync(TABLE_TS, renderExpRegistration(table));
  return Object.keys(table).length;
}

/** The Art Room's approved record: `{ id: record }`. */
export function approvedRecords() {
  const out = {};
  const file = join(ART_ROOM, 'approved.jsonl');
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (r?.id) out[r.id] = r;
    } catch {
      /* a torn line */
    }
  }
  return out;
}

/** `p_3712fb7d-yuna-gunner-idle-finish-b-v3.png` -> the approved record it is, or throws with the reason. */
export function approvedFor(src, { allowUnapproved = false } = {}) {
  const id = /^(p_[0-9a-f]{8})/.exec(basename(src))?.[1];
  const rec = id ? approvedRecords()[id] : undefined;
  const hash = sha256(src);
  if (rec && rec.sha256 === hash) return { id, version: rec.version, title: rec.title, score: rec.score, approvedAt: rec.at, sha256: hash, revisedPrompt: rec.revisedPrompt };
  if (allowUnapproved) return { id: id ?? null, unapproved: true, sha256: hash };
  throw new Error(
    rec
      ? `${basename(src)}: its sha256 is not the one the Art Room approved (${rec.sha256}); only ONLY-Bailey-approved pixels are installed`
      : `${basename(src)}: not in the Art Room's approved record (${join(ART_ROOM, 'approved.jsonl')}); only approved images are installed (--allow-unapproved is for tests)`,
  );
}

function run(script, args, label) {
  const r = spawnSync(PYTHON, ['-s', script, ...args], { encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  if (r.status !== 0) throw new Error(`${label} failed (${r.status}): ${(r.stderr || r.stdout || '').slice(-1500)}`);
  const last = r.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
  try {
    return JSON.parse(last);
  } catch {
    throw new Error(`${label}: no JSON on the last line of its output: ${r.stdout.slice(-400)}`);
  }
}

const headSize = (h) => Math.sqrt(Math.max(1, h[2] - h[0]) * Math.max(1, h[3] - h[1]));

/**
 * The registration row of a freshly installed pose (tools/posescale/measure.py's rules): the idle is the reference (stance only); another pose
 * carries the scale that brings its head to the idle's (`scale`, gated to the D-298 stature floor), its stance, and the flags.
 */
export function registrationRow({ pose, width, height, baselineY, contentBox, stance, head, idle, feetRow, upright }) {
  const row = {};
  if (pose !== 'idle' && head && idle?.head) {
    let scale = headSize(idle.head) / headSize(head);
    const prone = width > height * PRONE_ASPECT;
    if (!prone) {
      const stature = ((contentBox[3] - contentBox[1]) * scale) / (idle.contentBox[3] - idle.contentBox[1]);
      if (stature < STATURE_GATE) scale = Math.ceil((STATURE_GATE * (idle.contentBox[3] - idle.contentBox[1]) * 1000) / (contentBox[3] - contentBox[1])) / 1000;
    }
    row.scale = Math.round((pose === 'ko' && prone ? scale / KO_PROJECTION : scale) * 1000) / 1000;
  }
  if (stance) row.stanceX = Math.round(stance.x * 10) / 10;
  if (feetRow !== undefined) row.feetRow = feetRow;
  if (upright) row.upright = true;
  return row;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) out._.push(a);
    else if (['--no-tiers', '--dry-run', '--allow-unapproved', '--upright'].includes(a)) out[a.slice(2)] = true;
    else out[a.slice(2)] = argv[++i];
  }
  return out;
}

const insideOrThrow = (child, parent) => {
  const c = resolve(child);
  const p = resolve(parent);
  if (c !== p && !c.startsWith(p + sep)) throw new Error(`${c} is outside ${p}: nothing outside the namespace is ever written`);
};

/** Install one painting. Returns the record written to `installed.json`. */
export async function install(opts) {
  const { src, subject, pose } = opts;
  if (!src || !subject || !pose) throw new Error('install needs --src, --subject and --pose');
  if (!existsSync(src)) throw new Error(`no such image: ${src}`);
  if (!POSE_NAME.test(pose)) throw new Error(`"${pose}" is not a pose name (lower-case letters, digits and hyphens)`);
  const { girls, enemies } = await chapterSubjects();
  const kind = girls.includes(subject) ? 'party' : enemies.includes(subject) ? 'enemy' : null;
  if (!kind) throw new Error(`"${subject}" is not a subject the chapter draws; the girls are ${girls.join(', ')} and the fiends ${enemies.join(', ')}`);
  const facing = opts.facing ?? (kind === 'party' ? 'right' : 'left');
  if (!['right', 'left', 'front'].includes(facing)) throw new Error(`--facing is right, left or front, not "${facing}"`);
  const folder = join(EXP_ART, 'characters', nsId(subject));
  insideOrThrow(folder, join(EXP_ART, 'characters'));
  if (!existsSync(folder)) throw new Error(`${folder} does not exist: run \`node tools/exp-art.mjs seed\` first`);
  const approved = approvedFor(src, { allowUnapproved: !!opts['allow-unapproved'] });
  const target = join(folder, `${pose}.png`);
  const sidecar = join(folder, `${pose}.json`);
  const installed = readInstalled();
  const before = installed[subject]?.[pose];
  const tiersWanted = !opts['no-tiers'];
  const staleTiers = [2, 3, 4].filter((n) => existsSync(join(folder, `${pose}@${n}x.png`)));
  if (before && staleTiers.length && !tiersWanted) throw new Error(`${pose} already has @${staleTiers.join('/@')}x masters of the painting it replaces: install with tiers (they are overwritten) or move them aside`);
  if (!before && staleTiers.length) throw new Error(`${folder} holds @${staleTiers.join('/@')}x masters of a ${pose} nobody installed: refusing to guess what they are`);
  const head = opts.head ? opts.head.split(',').map(Number) : null;
  if (head && (head.length !== 4 || head.some((n) => !Number.isFinite(n)))) throw new Error('--head is x0,y0,x1,y1');
  const idle = pose === 'idle' ? null : installed[subject]?.idle;
  if (pose !== 'idle' && !idle) say(`note: ${subject} has no new idle yet, so this ${pose} is registered against today's idle (a placeholder); install the idle first for a registered scale`);
  const plan = { subject: nsId(subject), pose, kind, facing, source: basename(src), approved: approved.id ? { id: approved.id, score: approved.score } : 'unapproved', target, tiers: tiersWanted ? [2, 3, 4] : [], replaces: before ? 'earlier new art (copied to the replaced folder)' : 'the placeholder (today\'s Chapter VI painting)' };
  if (opts['dry-run']) {
    say(`dry run: ${JSON.stringify(plan)}`);
    return { dryRun: true, plan };
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const work = join(WORK_ROOT, `${nsId(subject)}-${pose}-${stamp}`);
  mkdirSync(work, { recursive: true });
  const cut = join(work, `${pose}.png`);
  say(`matte, clean and frame ${basename(src)} -> ${cut}`);
  const fig = run(join(REPO, 'tools', 'exp-art', 'figure.py'), ['--src', src, '--out', cut, '--matte', opts.matte ?? 'auto', ...(opts['feet-row'] ? ['--feet-row', opts['feet-row']] : [])], 'figure.py');

  // The painting, and the sidecar the engine reads; a painting that replaces earlier new art is kept first.
  if (before) {
    const keep = join(REPLACED_DIR, nsId(subject), pose, stamp);
    mkdirSync(keep, { recursive: true });
    for (const f of [`${pose}.png`, `${pose}.json`]) if (existsSync(join(folder, f))) copyFileSync(join(folder, f), join(keep, f));
    say(`the painting this replaces is kept in ${keep}`);
  }
  const png = `${target}.tmp-${process.pid}`;
  copyFileSync(cut, png);
  renameSync(png, target);
  const side = {
    width: fig.width,
    height: fig.height,
    baselineY: fig.baselineY,
    facing,
    pose,
    composition: 'full',
    game: 'ffx2',
    expNamespace: NAMESPACE,
    model: 'ChatGPT Images 2.5 (auto), via the Art Room',
    source: { artRoomId: approved.id, version: approved.version ?? null, title: approved.title ?? null, score: approved.score ?? null, approvedAt: approved.approvedAt ?? null, file: basename(src), sha256: approved.sha256, size: fig.source.size },
    ...(approved.revisedPrompt ? { prompt: approved.revisedPrompt } : {}),
    matte: fig.matte,
    margins: fig.margins,
    ...(fig.feetRow !== undefined ? { feetRow: fig.feetRow } : {}),
    installedAt: new Date().toISOString(),
    installedBy: 'tools/exp-install.mjs',
  };
  writeJsonAtomic(sidecar, side);

  let tiers = [];
  if (tiersWanted) {
    say('tiers: RealESRGAN x4, the 2x from it, then hires-install (3x derived)');
    const libDir = join(TIER_LIB, 'characters', nsId(subject));
    mkdirSync(libDir, { recursive: true });
    const t = run(join(REPO, 'tools', 'exp-art', 'tiers.py'), ['--src', target, '--out-dir', libDir, '--name', pose], 'tiers.py');
    const lib = readJson(join(TIER_LIB, 'manifest.json'), { version: 1, created: new Date().toISOString(), assets: {} });
    const id = `characters/${nsId(subject)}/${pose}`;
    lib.assets[id] = {
      id,
      src: `public/art/${id}.png`,
      status: 'ok',
      flags: [],
      class: 'exp-leblanc',
      scale: 4,
      source_sha256: sha256(target),
      outputs: [4, 2].map((s) => {
        const name = `${pose}@${s}x.png`;
        const f = t.files[name];
        return { path: `characters/${nsId(subject)}/${name}`, scale: s, bytes_png: statSync(join(libDir, name)).size, size: f.size };
      }),
    };
    writeJsonAtomic(join(TIER_LIB, 'manifest.json'), lib);
    const hi = spawnSync(process.execPath, [join(REPO, 'tools', 'hires-install.mjs'), '--lib', TIER_LIB, '--art', EXP_ART, '--only', id, '--copy', '--apply'], { encoding: 'utf8' });
    if (hi.status !== 0) throw new Error(`hires-install failed: ${(hi.stderr || hi.stdout).slice(-1200)}`);
    say(hi.stdout.trim().split(/\r?\n/).slice(0, 3).join(' | '));
    tiers = [2, 3, 4].filter((n) => existsSync(join(folder, `${pose}@${n}x.png`)));
    if (tiers.length !== 3) throw new Error(`expected @2x, @3x and @4x of ${pose}, found @${tiers.join('/@')}x (hires-install said: ${hi.stdout.slice(-400)})`);
  }

  const rec = {
    artRoom: { id: approved.id, version: approved.version ?? null, file: basename(src), sha256: approved.sha256, score: approved.score ?? null },
    sha256: sha256(target),
    size: [fig.width, fig.height],
    baselineY: fig.baselineY,
    contentBox: fig.contentBox,
    facing,
    head,
    headSource: head ? 'hand' : 'none',
    tiers,
    row: registrationRow({ pose, width: fig.width, height: fig.height, baselineY: fig.baselineY, contentBox: fig.contentBox, stance: fig.stance, head, idle: pose === 'idle' ? null : installed[subject]?.idle, feetRow: opts['feet-row'] ? Number(opts['feet-row']) : undefined, upright: !!opts.upright }),
    provisional: pose !== 'idle' && !head ? 'no head box: the pose is drawn at the idle\'s pixel scale until --head is given' : null,
    installedAt: side.installedAt,
  };
  const next = { ...installed, [subject]: { ...(installed[subject] ?? {}), [pose]: rec } };
  writeJsonAtomic(INSTALLED_JSON, next);
  say(`registered ${nsId(subject)}/${pose}: ${JSON.stringify(rec.row)}${rec.provisional ? ` (${rec.provisional})` : ''}`);
  say(`table: ${await writeTable()} subjects -> ${TABLE_TS}`);
  const gen = spawnSync(process.execPath, [join(REPO, 'tools', 'gen', 'manifest.mjs'), '--quiet'], { encoding: 'utf8' });
  if (gen.status !== 0) throw new Error(`manifest.mjs failed: ${gen.stderr.slice(-600)}`);
  say('manifest regenerated');
  return { subject: nsId(subject), pose, files: { png: target, json: sidecar }, tiers, row: rec.row, figure: fig };
}

/** The backdrop: the approved plate becomes `backdrops/exp-leblanc-last-room.png` (2688x1536) and its @2x (5376x3072), enlarged by the same local RealESRGAN. */
export async function installBackdrop(opts) {
  const { src } = opts;
  if (!src || !existsSync(src)) throw new Error('backdrop needs --src <approved plate.png>');
  const approved = approvedFor(src, { allowUnapproved: !!opts['allow-unapproved'] });
  const plan = { scene: SCENE_KEY, replaces: `backdrops/${SCENE_KEY}.png (today a copy of ${BASE_SCENE_KEY}.png)`, from: basename(src), approved: approved.id ?? 'unapproved', sizes: ['2688x1536', '5376x3072 (@2x)'], depth: `public/fx/${SCENE_KEY}/depth.png (tools/fx/depth.py ${SCENE_KEY}, after the plate is installed)` };
  if (opts['dry-run']) {
    say(`dry run: ${JSON.stringify(plan)}`);
    return { dryRun: true, plan };
  }
  throw new Error('backdrop install is specified (docs/handoff/exp-leblanc.md section 5) but not run until Bailey approves an EMPTY plate: the approved mockups carry figures, which a plate must not');
}

function list() {
  const installed = readInstalled();
  const rows = [];
  for (const [subject, poses] of Object.entries(installed)) for (const [pose, r] of Object.entries(poses)) rows.push(`${nsId(subject)}/${pose}  ${r.size.join('x')}  tiers @${r.tiers.join('/@')}x  ${JSON.stringify(r.row)}  ${r.artRoom.id}${r.provisional ? '  PROVISIONAL' : ''}`);
  console.log(rows.length ? rows.join('\n') : 'nothing installed: every figure is still the placeholder (today\'s Chapter VI painting)');
  console.log(`(${rows.length} installed)  \`node tools/exp-art.mjs status\` lists the placeholders`);
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const cmd = a._[0];
  if (cmd === 'table') console.log(`wrote ${TABLE_TS}: ${await writeTable()} subjects`);
  else if (cmd === 'install') console.log(JSON.stringify(await install(a), null, 1));
  else if (cmd === 'backdrop') console.log(JSON.stringify(await installBackdrop(a), null, 1));
  else if (cmd === 'list') list();
  else {
    console.error('usage: node tools/exp-install.mjs install|backdrop|table|list   (see the header of this file)');
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    await main();
  } catch (e) {
    console.error(`[exp-install] ${e.message}`);
    process.exitCode = 1;
  }
}
void readdirSync;
