#!/usr/bin/env node
/**
 * Install an approved Art Room image into the experimental Leblanc chapter's art namespace (branch `exp-leblanc`; FFX-2 only).
 *
 *   node tools/exp-install.mjs install --src <approved image.png> --subject yuna-gunner --pose idle [options]
 *   node tools/exp-install.mjs backdrop --src <approved plate.png> [--dry-run]    the empty plate and its @2x (RealESRGAN, local)
 *   node tools/exp-install.mjs depth                      the plate's depth map (CPU) and the fx record that lists it
 *   node tools/exp-install.mjs head --subject S --pose P --head x0,y0,x1,y1    set the head box of an installed pose (the idle's is the reference)
 *   node tools/exp-install.mjs stance --subject S --pose P --x N [--note "..."]   set the stance of an installed pose by hand (the foot the idle stands on)
 *   node tools/exp-install.mjs table                      regenerate src/data/art/poseRegistrationExp.ts
 *   node tools/exp-install.mjs list                       what is installed, what is still a placeholder
 *
 * install options:
 *   --facing right|left|front  the way the painting faces (default: right for a girl, left for a fiend; the house contract)
 *   --head x0,y0,x1,y1         the head's box on THIS painting, hair top to chin and outer side to side, read by eye (a pose other than the idle
 *                              needs it for its registered `scale`; the idle's box is the reference every other pose is matched to)
 *   --feet-row N               the row of the soles when a thick weapon hangs lower than the boots (the registration's `feetRow`)
 *   --scale N                  the row's scale when no head can be matched (a lying KO matched by length: the idle's content height over the KO's content
 *                              length, over 0.978); `--scale-source length|hand` is recorded beside it
 *   --upright                  a standing pose wider than tall (a lunge): never laid down like a KO
 *   --no-tiers                 skip the @2x/@3x/@4x masters (a pose that already has them is refused: they would be the old painting's)
 *   --matte auto|keep|key|rembg  keep the image's own alpha, key a figure on one flat colour (the Art Room's idle sheets), or cut it with isnet-anime
 *                              (auto: keep when it has real alpha, key on a flat background, else isnet-anime)
 *   --pockets flat|tinted      key matte only: `tinted` also clears glow-tinted enclosed gaps (Leblanc's legs); the default clears only gaps of the background colour
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
import { buildExpFigureMetrics, buildExpRegistration, loadBaseTables, renderExpFigureMetrics, renderExpRegistration } from './exp-art-table.mjs';

export const INSTALLED_JSON = join(REPO, 'docs', 'target', 'exp-leblanc', 'installed.json');
export const TABLE_TS = join(REPO, 'src', 'data', 'art', 'poseRegistrationExp.ts');
/** The idle metrics of every figure in the namespace, for the surfaces outside the stage (the story scenes). */
export const METRICS_TS = join(REPO, 'src', 'data', 'art', 'expFigureMetrics.ts');
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
  // The figures' own sizes, read off the namespace's idle sidecars (a placeholder carries the base painting's numbers).
  const metrics = buildExpFigureMetrics(subjects, (subject) => readJson(join(EXP_ART, 'characters', nsId(subject), 'idle.json'), null));
  writeFileSync(METRICS_TS, renderExpFigureMetrics(metrics));
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
  // `approvedBy` absent or `human`: Bailey approved it by hand in the Art Room. `driver-delegated` (with `experiment: exp-leblanc`): Bailey's "You make the
  // selections for me as far as the experimental chapter goes" (2026-10-06), recorded by the driver. `auto-pose` (with `experiment: exp-leblanc`): the
  // Art Room's automatic pose rounds for the experiment (the "Anchor + veto sheet" choice, Bailey 2026-10-06; the driver's install list says which). Each
  // is valid for this experiment only, and the installed record keeps which it was.
  const delegated = ['driver-delegated', 'auto-pose'];
  if (rec && rec.approvedBy && rec.approvedBy !== 'human' && !(delegated.includes(rec.approvedBy) && rec.experiment === NAMESPACE)) {
    throw new Error(`${basename(src)}: approved by "${rec.approvedBy}" for experiment "${rec.experiment ?? '-'}"; only a hand approval, a driver delegation or an auto-pose for ${NAMESPACE} installs here`);
  }
  if (rec && rec.sha256 === hash) return { id, version: rec.version, title: rec.title, score: rec.score, approvedAt: rec.at, approvedBy: rec.approvedBy ?? 'human', sha256: hash, revisedPrompt: rec.revisedPrompt };
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
export function registrationRow({ pose, width, height, baselineY, contentBox, stance, head, idle, feetRow, upright, scale: given }) {
  const row = {};
  const prone = width > height * PRONE_ASPECT;
  if (pose !== 'idle' && head && idle?.head) {
    let scale = headSize(idle.head) / headSize(head);
    if (!prone) {
      const stature = ((contentBox[3] - contentBox[1]) * scale) / (idle.contentBox[3] - idle.contentBox[1]);
      if (stature < STATURE_GATE) scale = Math.ceil((STATURE_GATE * (idle.contentBox[3] - idle.contentBox[1]) * 1000) / (contentBox[3] - contentBox[1])) / 1000;
    }
    row.scale = Math.round((pose === 'ko' && prone ? scale / KO_PROJECTION : scale) * 1000) / 1000;
  }
  // An explicit scale (a lying KO matched by length, `--scale`) is the row's scale as given.
  if (pose !== 'idle' && typeof given === 'number' && given > 0) row.scale = Math.round(given * 1000) / 1000;
  // A KO lies down and rests by its own rule (PaintedRest.ts): measure.py gives it no stance, so its base rows are `{ scale }` alone.
  const lying = pose === 'ko' && prone && !upright;
  if (stance && !lying) row.stanceX = Math.round(stance.x * 10) / 10;
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

/**
 * Recompute every non-idle row of one subject from what its records hold (their head boxes, sizes, content boxes, and the stance, `feetRow` and
 * `upright` flags the row already carries), against the idle's CURRENT head box. Used when the idle's head box is set or changed after other poses
 * were installed (`head` subcommand). A pose with no head box of its own stays PROVISIONAL (no `scale`).
 */
export function recomputeRows(records) {
  const idle = records.idle;
  for (const [pose, r] of Object.entries(records)) {
    if (pose === 'idle') continue;
    if (r.scaleSource === 'length') continue; // matched by length, not by a head: nothing to recompute
    if (!r.head || !idle?.head) continue;
    const prev = r.row ?? {};
    r.row = registrationRow({
      pose,
      width: r.size[0],
      height: r.size[1],
      baselineY: r.baselineY,
      contentBox: r.contentBox,
      stance: prev.stanceX !== undefined ? { x: prev.stanceX } : undefined,
      head: r.head,
      idle,
      feetRow: prev.feetRow,
      upright: prev.upright,
    });
    r.provisional = null;
  }
  return records;
}

/** Set (or change) the head box of an installed pose, read by eye on THAT painting, and regenerate the table. No pixel is touched. */
export async function setHead(opts) {
  const { subject, pose } = opts;
  const head = (opts.head ?? '').split(',').map(Number);
  if (!subject || !pose || head.length !== 4 || head.some((n) => !Number.isFinite(n))) throw new Error('head needs --subject, --pose and --head x0,y0,x1,y1');
  const installed = readInstalled();
  const rec = installed[subject]?.[pose];
  if (!rec) throw new Error(`${subject}/${pose} is not installed (nothing to set a head box on)`);
  const [x0, y0, x1, y1] = head;
  if (x1 <= x0 || y1 <= y0 || x0 < 0 || y0 < 0 || x1 > rec.size[0] || y1 > rec.size[1]) throw new Error(`the head box ${head.join(',')} is not inside the painting (${rec.size.join('x')})`);
  rec.head = head;
  rec.headSource = 'hand';
  recomputeRows(installed[subject]);
  writeJsonAtomic(INSTALLED_JSON, installed);
  say(`${nsId(subject)}/${pose}: head box ${head.join(',')}${pose === 'idle' ? ' (the reference: every other pose of the subject is recomputed against it)' : ` -> row ${JSON.stringify(rec.row)}`}`);
  say(`table: ${await writeTable()} subjects -> ${TABLE_TS}`);
  return rec;
}

/**
 * Set the stance of an installed pose by hand, read off THAT painting, and regenerate the table. No pixel is touched.
 * The automatic stance is the middle of the LOWEST thick part of the silhouette (`ps_lib.stance_from_hem`), so a pose whose weight is on a different foot
 * than the idle's lands that foot where the idle's stands and the figure pops a body-width sideways. Name the foot the idle stands on in this pose.
 */
export async function setStance(opts) {
  const { subject, pose } = opts;
  const x = Number(opts.x);
  if (!subject || !pose || !Number.isFinite(x)) throw new Error('stance needs --subject, --pose and --x (the middle of the support, in the painting\'s own pixels)');
  const installed = readInstalled();
  const rec = installed[subject]?.[pose];
  if (!rec) throw new Error(`${subject}/${pose} is not installed (nothing to set a stance on)`);
  if (!(x > 0 && x < rec.size[0])) throw new Error(`the stance ${x} is not inside the painting (${rec.size[0]} px wide)`);
  if (rec.row?.stanceX === undefined) throw new Error(`${subject}/${pose} has no stance (a lying KO rests by its own rule)`);
  const before = rec.row.stanceX;
  rec.row = { ...rec.row, stanceX: Math.round(x * 10) / 10 };
  rec.stanceSource = 'hand';
  rec.stanceNote = opts.note ?? null;
  writeJsonAtomic(INSTALLED_JSON, installed);
  say(`${nsId(subject)}/${pose}: stance ${before} -> ${rec.row.stanceX} by hand${pose === 'idle' ? ' (the reference: every other pose slides to match it)' : ''}`);
  say(`table: ${await writeTable()} subjects -> ${TABLE_TS}`);
  return rec;
}

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
  const fig = run(join(REPO, 'tools', 'exp-art', 'figure.py'), ['--src', src, '--out', cut, '--matte', opts.matte ?? 'auto', ...(opts.pockets ? ['--pockets', opts.pockets] : []), ...(opts['feet-row'] ? ['--feet-row', opts['feet-row']] : [])], 'figure.py');

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
    source: { artRoomId: approved.id, version: approved.version ?? null, title: approved.title ?? null, score: approved.score ?? null, approvedAt: approved.approvedAt ?? null, approvedBy: approved.approvedBy ?? null, file: basename(src), sha256: approved.sha256, size: fig.source.size },
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
    artRoom: { id: approved.id, version: approved.version ?? null, file: basename(src), sha256: approved.sha256, score: approved.score ?? null, ...(approved.approvedBy ? { approvedBy: approved.approvedBy } : {}) },
    sha256: sha256(target),
    size: [fig.width, fig.height],
    baselineY: fig.baselineY,
    contentBox: fig.contentBox,
    facing,
    head,
    headSource: head ? 'hand' : 'none',
    tiers,
    row: registrationRow({ pose, width: fig.width, height: fig.height, baselineY: fig.baselineY, contentBox: fig.contentBox, stance: fig.stance, head, idle: pose === 'idle' ? null : installed[subject]?.idle, feetRow: opts['feet-row'] ? Number(opts['feet-row']) : undefined, upright: !!opts.upright, ...(opts.scale ? { scale: Number(opts.scale) } : {}) }),
    ...(opts.scale ? { scaleSource: opts['scale-source'] ?? 'hand' } : {}),
    provisional: !head && !opts.scale ? (pose === 'idle' ? 'no head box on the idle: the poses of this subject are drawn at the idle\'s pixel scale until `head` sets it' : 'no head box: the pose is drawn at the idle\'s pixel scale until --head is given') : null,
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

/**
 * The backdrop: the approved EMPTY plate becomes `backdrops/exp-leblanc-last-room.png` (2688 wide, the plate's own aspect) and its @2x (exactly twice that),
 * both from one local RealESRGAN enlargement (`tools/exp-art/plate.py`). The record is `docs/target/exp-leblanc/backdrop.json`; the depth map is its own step
 * (`depth`), because it runs on the CPU for a minute or two and the scene works without it.
 */
export const BACKDROP_JSON = join(REPO, 'docs', 'target', 'exp-leblanc', 'backdrop.json');

export async function installBackdrop(opts) {
  const { src } = opts;
  if (!src || !existsSync(src)) throw new Error('backdrop needs --src <approved plate.png>');
  const approved = approvedFor(src, { allowUnapproved: !!opts['allow-unapproved'] });
  const dir = join(EXP_ART, 'backdrops');
  const target = join(dir, `${SCENE_KEY}.png`);
  const target2 = join(dir, `${SCENE_KEY}@2x.png`);
  const sidecar = join(dir, `${SCENE_KEY}.json`);
  for (const f of [target, target2, sidecar]) insideOrThrow(f, dir);
  const before = readJson(BACKDROP_JSON, null);
  const plan = {
    scene: SCENE_KEY,
    replaces: before ? 'earlier new plate (copied to the replaced folder)' : `backdrops/${SCENE_KEY}.png (today a copy of ${BASE_SCENE_KEY}.png)`,
    from: basename(src),
    approved: approved.id ? { id: approved.id, score: approved.score, approvedBy: approved.approvedBy } : 'unapproved',
    files: [target, target2, sidecar],
    sizes: '2688 wide at the plate\'s own aspect, and @2x exactly twice that',
    depth: `public/fx/${SCENE_KEY}/depth.png (\`node tools/exp-install.mjs depth\`, after the plate is installed)`,
  };
  if (opts['dry-run']) {
    say(`dry run: ${JSON.stringify(plan)}`);
    return { dryRun: true, plan };
  }
  if (!existsSync(dir)) throw new Error(`${dir} does not exist: run \`node tools/exp-art.mjs seed\` first`);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const work = join(WORK_ROOT, `${SCENE_KEY}-${stamp}`);
  mkdirSync(work, { recursive: true });
  say(`plate: RealESRGAN x4, then the 1x and the @2x from it (${basename(src)} -> ${work})`);
  const made = run(join(REPO, 'tools', 'exp-art', 'plate.py'), ['--src', src, '--out-dir', work, '--name', SCENE_KEY, ...(opts.model ? ['--model', opts.model] : [])], 'plate.py');
  if (before) {
    const keep = join(REPLACED_DIR, 'backdrops', SCENE_KEY, stamp);
    mkdirSync(keep, { recursive: true });
    for (const f of [target, target2, sidecar]) if (existsSync(f)) copyFileSync(f, join(keep, basename(f)));
    say(`the plate this replaces is kept in ${keep}`);
  }
  for (const [name, final] of [[`${SCENE_KEY}.png`, target], [`${SCENE_KEY}@2x.png`, target2]]) {
    const tmp = `${final}.tmp-${process.pid}`;
    copyFileSync(join(work, name), tmp);
    renameSync(tmp, final); // a real copy in the namespace, never a hard-linked file written in place
  }
  const [w1, h1] = made.oneX;
  const installedAt = new Date().toISOString();
  writeJsonAtomic(sidecar, {
    width: w1,
    height: h1,
    expNamespace: NAMESPACE,
    pose: 'plate',
    composition: 'backdrop',
    game: 'ffx2',
    model: 'ChatGPT Images 2.5 (auto), via the Art Room',
    source: { artRoomId: approved.id, version: approved.version ?? null, title: approved.title ?? null, score: approved.score ?? null, approvedAt: approved.approvedAt ?? null, approvedBy: approved.approvedBy ?? null, file: basename(src), sha256: approved.sha256, size: made.source },
    ...(approved.revisedPrompt ? { prompt: approved.revisedPrompt } : {}),
    enlarged: { model: made.model, device: made.device, from: made.source, to: made.oneX },
    installedAt,
    installedBy: 'tools/exp-install.mjs',
  });
  const record = {
    artRoom: { id: approved.id, version: approved.version ?? null, file: basename(src), sha256: approved.sha256, score: approved.score ?? null, approvedBy: approved.approvedBy ?? null },
    scene: SCENE_KEY,
    size: made.oneX,
    size2x: [w1 * 2, h1 * 2],
    files: made.files,
    installedAt,
  };
  writeJsonAtomic(BACKDROP_JSON, record);
  const gen = spawnSync(process.execPath, [join(REPO, 'tools', 'gen', 'manifest.mjs'), '--quiet'], { encoding: 'utf8' });
  if (gen.status !== 0) throw new Error(`manifest.mjs failed: ${gen.stderr.slice(-600)}`);
  say(`installed ${SCENE_KEY} ${w1}x${h1} (+@2x ${w1 * 2}x${h1 * 2}); manifest regenerated; next: \`node tools/exp-install.mjs depth\``);
  return record;
}

/** The plate's depth map (Depth Anything V2 Small on the CPU, the local cache; `tools/fx/depth.py`) and the fx record that lists it (`tools/fx-assets.mjs record`). */
export function installDepth() {
  const env = { ...process.env, HF_HOME: process.env.HF_HOME ?? 'D:/Tools/pyrefly-scratch/eye-candy/hf', PYTHONIOENCODING: 'utf-8' };
  say(`depth map for ${SCENE_KEY} (CPU; a minute or two)`);
  const r = spawnSync(PYTHON, ['-s', join(REPO, 'tools', 'fx', 'depth.py'), SCENE_KEY], { encoding: 'utf8', env, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`depth.py failed (${r.status}): ${(r.stderr || r.stdout || '').slice(-1200)}`);
  say(r.stdout.trim().split(/\r?\n/).at(-1));
  const rec = spawnSync(process.execPath, [join(REPO, 'tools', 'fx-assets.mjs'), 'record'], { cwd: REPO, encoding: 'utf8' });
  if (rec.status !== 0) throw new Error(`fx-assets record failed: ${(rec.stderr || rec.stdout).slice(-600)}`);
  say(rec.stdout.trim().split(/\r?\n/).at(-1));
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
  else if (cmd === 'head') console.log(JSON.stringify(await setHead(a), null, 1));
  else if (cmd === 'stance') console.log(JSON.stringify(await setStance(a), null, 1));
  else if (cmd === 'depth') installDepth();
  else if (cmd === 'list') list();
  else {
    console.error('usage: node tools/exp-install.mjs install|backdrop|head|stance|depth|table|list   (see the header of this file)');
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
