#!/usr/bin/env node
/**
 * Install an approved Art Room dialogue portrait or pause close-up into the experimental Leblanc chapter's art namespace (branch `exp-leblanc`; FFX-2 only).
 *
 *   node tools/exp-install-surfaces.mjs portrait --src <approved.png> --id yuna-x2 [--halo-peel 6] [--rim N] [--pockets tinted] [--trim bottom|top|center] [--dry-run]
 *   node tools/exp-install-surfaces.mjs pause    --src <approved.png> --plate yuna-ffx2 --focal 0.44,0.33 [--dry-run]
 *   node tools/exp-install-surfaces.mjs focal    --plate yuna-ffx2 --focal 0.5,0.27     move the focal point of an installed plate (no pixel is touched)
 *   node tools/exp-install-surfaces.mjs list                      what is installed
 *
 * The two surfaces the story and the pause screen draw besides the figures (`docs/handoff/exp-leblanc.md` section 14.4):
 *
 *   portrait  `public/art/portraits/exp-leblanc-<id>.png` (+ `.json`): the dialogue box, the story scenes, the turn cut-in and the results wedge read it for the
 *             speaker `<id>` (`yuna-x2`, `rikku-x2`, `paine`, `leblanc`, `logos`, `ormi`, `brother-x2`) when the scene's art namespace is `exp-leblanc`
 *             (`src/ui/common/portraitNamespace.ts`). An 832x1216 RGBA bust cut from the Art Room's flat-background 2:3 painting (`tools/exp-art/portrait.py`).
 *   pause     `public/art/pause/exp-leblanc-<plate>.png` (+ `.2x.webp`, `.json`): the pause screen's member plate (`yuna-ffx2`, `rikku-ffx2`, `paine`) and the
 *             CHAPTER tab's hero plate (`leblanc`), 1344x768 and its 2688x1536 master (`tools/exp-art/pause.py`); the sidecar carries the `focal` the screen frames
 *             the face by, given here (the old plate's, unless the new face stands elsewhere: `plates.ts`, `faceClear.ts`).
 *
 * Each install validates (the id or plate is a known surface, the image is in the Art Room's approved record and its sha256 the record's, the target is inside
 * the namespace), cuts and sizes the picture, writes it by a temporary file renamed over any earlier one (an earlier NEW file is kept in `<workspace>-replaced/`
 * first), records it in `docs/target/exp-leblanc/surfaces.json`, and regenerates the art manifest so the game lists the file. It never touches the release art tree,
 * never writes a hard-linked file in place, never deletes a file, and stops on the first problem. The face rows and plate framings the code reads are measured
 * by eye on the installed files (`face-crops.json`, `plates.ts`, `faceClear.ts`), not here.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { EXP_ART, NAMESPACE, REPO, nsId } from './exp-art-lib.mjs';
import { REPLACED_DIR, WORK_ROOT, approvedFor, run, writeJsonAtomic } from './exp-install.mjs';

export const SURFACES_JSON = join(REPO, 'docs', 'target', 'exp-leblanc', 'surfaces.json');
/** The plates the pause screen draws in the experiment, by their base ids (`plates.ts`: the member plates by `plateIdFor`, the CHAPTER tab's hero plate). */
export const PAUSE_PLATES = Object.freeze(['leblanc', 'yuna-ffx2', 'rikku-ffx2', 'paine']);
const ID = /^[a-z0-9][a-z0-9-]*$/;
const say = (m) => console.log(`[exp-install-surfaces] ${m}`);

export function readSurfaces() {
  try {
    return JSON.parse(readFileSync(SURFACES_JSON, 'utf8'));
  } catch {
    return { portraits: {}, pause: {} };
  }
}

const insideOrThrow = (child, parent) => {
  const c = resolve(child);
  const p = resolve(parent);
  if (c !== p && !c.startsWith(p + sep)) throw new Error(`${c} is outside ${p}: nothing outside the namespace is ever written`);
};

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) out._.push(a);
    else if (['--dry-run', '--allow-unapproved'].includes(a)) out[a.slice(2)] = true;
    else out[a.slice(2)] = argv[++i];
  }
  return out;
}

/** The earlier file a new install replaces is copied to the replaced folder first (`<kind>/<name>/<stamp>/`), so nothing the lane painted is ever lost. */
function keepReplaced(kind, name, files, stamp) {
  const keep = join(REPLACED_DIR, kind, name, stamp);
  mkdirSync(keep, { recursive: true });
  for (const f of files) if (existsSync(f)) copyFileSync(f, join(keep, basename(f)));
  say(`the files this replaces are kept in ${keep}`);
}

function replaceFile(from, to) {
  const tmp = `${to}.tmp-${process.pid}`;
  copyFileSync(from, tmp);
  renameSync(tmp, to);
}

function regenerateManifest() {
  const gen = spawnSync(process.execPath, [join(REPO, 'tools', 'gen', 'manifest.mjs'), '--quiet'], { encoding: 'utf8' });
  if (gen.status !== 0) throw new Error(`manifest.mjs failed: ${gen.stderr.slice(-600)}`);
  say('manifest regenerated');
}

/** Install one dialogue portrait. */
export async function installPortrait(opts) {
  const { src, id } = opts;
  if (!src || !id) throw new Error('portrait needs --src and --id');
  if (!existsSync(src)) throw new Error(`no such image: ${src}`);
  if (!ID.test(id) || id.startsWith(`${NAMESPACE}-`)) throw new Error(`"${id}" is not a base portrait id (lower-case letters, digits and hyphens, outside the namespace)`);
  const approved = approvedFor(src, { allowUnapproved: !!opts['allow-unapproved'] });
  const name = nsId(id);
  const folder = join(EXP_ART, 'portraits');
  const target = join(folder, `${name}.png`);
  const sidecar = join(folder, `${name}.json`);
  insideOrThrow(target, folder);
  if (!existsSync(folder)) throw new Error(`${folder} does not exist: run \`node tools/exp-art.mjs mirror\` first`);
  const surfaces = readSurfaces();
  const before = surfaces.portraits[id];
  const plan = { portrait: id, file: `portraits/${name}.png`, source: basename(src), approved: approved.id ? { id: approved.id, score: approved.score } : 'unapproved', replaces: before ? `earlier new art ${before.artRoom?.id ?? ''}` : 'nothing (a new file)' };
  if (opts['dry-run']) {
    say(`dry run: ${JSON.stringify(plan)}`);
    return { dryRun: true, plan };
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const work = join(WORK_ROOT, `portrait-${name}-${stamp}`);
  mkdirSync(work, { recursive: true });
  const cut = join(work, `${name}.png`);
  say(`cut and size ${basename(src)} -> ${cut}`);
  const pyArgs = ['--src', src, '--out', cut, '--halo-peel', String(opts['halo-peel'] ?? 6), '--trim', opts.trim ?? 'bottom'];
  if (opts.rim) pyArgs.push('--rim', String(opts.rim));
  if (opts.pockets) pyArgs.push('--pockets', opts.pockets);
  const fig = run(join(REPO, 'tools', 'exp-art', 'portrait.py'), pyArgs, 'portrait.py');
  if (before) keepReplaced('portraits', name, [target, sidecar], stamp);
  replaceFile(cut, target);
  writeJsonAtomic(sidecar, {
    width: fig.width,
    height: fig.height,
    baselineY: fig.height,
    facing: 'none',
    pose: 'portrait',
    composition: 'portrait',
    game: 'ffx2',
    expNamespace: NAMESPACE,
    model: 'ChatGPT Images 2.5 (auto), via the Art Room',
    source: { artRoomId: approved.id, version: approved.version ?? null, title: approved.title ?? null, score: approved.score ?? null, approvedAt: approved.approvedAt ?? null, approvedBy: approved.approvedBy ?? null, file: basename(src), sha256: approved.sha256, size: fig.source.size },
    ...(approved.revisedPrompt ? { prompt: approved.revisedPrompt } : {}),
    scaledTo: fig.scaledTo,
    trim: fig.trim,
    matte: fig.matte,
    installedAt: new Date().toISOString(),
    installedBy: 'tools/exp-install-surfaces.mjs',
  });
  surfaces.portraits[id] = {
    file: `portraits/${name}.png`,
    size: [fig.width, fig.height],
    artRoom: { id: approved.id, version: approved.version ?? null, score: approved.score ?? null, approvedBy: approved.approvedBy ?? null, sha256: approved.sha256 },
    source: { file: basename(src), size: fig.source.size },
    trim: fig.trim,
    matte: fig.matte,
    transparentShare: fig.transparentShare,
    outSha256: fig.outSha256,
    installedAt: new Date().toISOString(),
  };
  writeJsonAtomic(SURFACES_JSON, surfaces);
  regenerateManifest();
  say(`installed portraits/${name}.png ${fig.width}x${fig.height} (${basename(src)})`);
  return surfaces.portraits[id];
}

/** Install one pause plate: the 1x, its 2x master and the sidecar. */
export async function installPause(opts) {
  const { src, plate } = opts;
  if (!src || !plate) throw new Error('pause needs --src and --plate');
  if (!existsSync(src)) throw new Error(`no such image: ${src}`);
  if (!PAUSE_PLATES.includes(plate)) throw new Error(`"${plate}" is not a pause plate the experiment draws; they are ${PAUSE_PLATES.join(', ')}`);
  const focal = (opts.focal ?? '').split(',').map(Number);
  if (focal.length !== 2 || focal.some((n) => !Number.isFinite(n) || n < 0 || n > 1)) throw new Error('--focal is x,y as fractions of the plate (0 to 1)');
  const approved = approvedFor(src, { allowUnapproved: !!opts['allow-unapproved'] });
  const name = nsId(plate);
  const folder = join(EXP_ART, 'pause');
  const targets = ['png', '2x.webp', 'json'].map((ext) => join(folder, `${name}.${ext}`));
  for (const t of targets) insideOrThrow(t, folder);
  if (!existsSync(folder)) throw new Error(`${folder} does not exist: run \`node tools/exp-art.mjs mirror\` first`);
  const surfaces = readSurfaces();
  const before = surfaces.pause[plate];
  const plan = { plate, files: targets.map((t) => basename(t)), source: basename(src), approved: approved.id ? { id: approved.id, score: approved.score } : 'unapproved', focal, replaces: before ? `earlier new art ${before.artRoom?.id ?? ''}` : 'nothing (new files)' };
  if (opts['dry-run']) {
    say(`dry run: ${JSON.stringify(plan)}`);
    return { dryRun: true, plan };
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const work = join(WORK_ROOT, `pause-${name}-${stamp}`);
  mkdirSync(work, { recursive: true });
  say(`size ${basename(src)} -> the 1x and the 2x master in ${work} (RealESRGAN, local; a minute or two)`);
  const out = run(join(REPO, 'tools', 'exp-art', 'pause.py'), ['--src', src, '--out-dir', work, '--name', name], 'pause.py');
  if (before) keepReplaced('pause', name, targets, stamp);
  replaceFile(join(work, `${name}.png`), targets[0]);
  replaceFile(join(work, `${name}.2x.webp`), targets[1]);
  writeJsonAtomic(targets[2], {
    subject: plate,
    composition: 'hero',
    facing: 'none',
    canvas: { width: 1344, height: 768 },
    focal: { x: focal[0], y: focal[1] },
    master: { file: `${name}.2x.webp`, width: 2688, height: 1536, route: `${out.model} x4 -> lanczos`, webpQuality: out.webpQuality, note: 'PNG is this master downscaled to 1344x768; both are one image.' },
    game: 'ffx2',
    expNamespace: NAMESPACE,
    model: 'ChatGPT Images 2.5 (auto), via the Art Room',
    source: { artRoomId: approved.id, version: approved.version ?? null, title: approved.title ?? null, score: approved.score ?? null, approvedAt: approved.approvedAt ?? null, approvedBy: approved.approvedBy ?? null, file: basename(src), sha256: approved.sha256, size: out.source },
    ...(approved.revisedPrompt ? { prompt: approved.revisedPrompt } : {}),
    crop: out.crop,
    installedAt: new Date().toISOString(),
    installedBy: 'tools/exp-install-surfaces.mjs',
  });
  surfaces.pause[plate] = {
    files: targets.map((t) => `pause/${basename(t)}`),
    focal: { x: focal[0], y: focal[1] },
    artRoom: { id: approved.id, version: approved.version ?? null, score: approved.score ?? null, approvedBy: approved.approvedBy ?? null, sha256: approved.sha256 },
    source: { file: basename(src), size: out.source },
    crop: out.crop,
    sizes: Object.fromEntries(Object.entries(out.files).map(([k, v]) => [k, v.size])),
    installedAt: new Date().toISOString(),
  };
  writeJsonAtomic(SURFACES_JSON, surfaces);
  regenerateManifest();
  say(`installed pause/${name}.png (1344x768) and its 2x master (${basename(src)}), focal ${focal.join(',')}`);
  return surfaces.pause[plate];
}

/** Set the focal point of an installed pause plate, read by eye on THAT painting (the middle of its face box, `faceClear.FACE_BOXES`): the sidecar's `focal` and the record. No pixel is touched. */
export async function setFocal(opts) {
  const { plate } = opts;
  const focal = (opts.focal ?? '').split(',').map(Number);
  if (!plate || focal.length !== 2 || focal.some((n) => !Number.isFinite(n) || n < 0 || n > 1)) throw new Error('focal needs --plate and --focal x,y as fractions of the plate (0 to 1)');
  const surfaces = readSurfaces();
  const rec = surfaces.pause[plate];
  if (!rec) throw new Error(`pause/${nsId(plate)} is not installed`);
  const sidecar = join(EXP_ART, 'pause', `${nsId(plate)}.json`);
  insideOrThrow(sidecar, join(EXP_ART, 'pause'));
  const side = JSON.parse(readFileSync(sidecar, 'utf8'));
  const before = side.focal ?? null;
  side.focal = { x: focal[0], y: focal[1] };
  writeJsonAtomic(sidecar, side);
  rec.focal = { x: focal[0], y: focal[1] };
  writeJsonAtomic(SURFACES_JSON, surfaces);
  say(`pause/${nsId(plate)}: focal ${before ? `${before.x},${before.y}` : 'none'} -> ${focal.join(',')}`);
  return rec;
}

function list() {
  const s = readSurfaces();
  const rows = [];
  for (const [id, r] of Object.entries(s.portraits)) rows.push(`portraits/${nsId(id)}.png  ${r.size.join('x')}  ${r.artRoom.id} ${r.artRoom.approvedBy ?? 'human'}  transparent ${r.transparentShare}  ${statSize(join(EXP_ART, r.file))}`);
  for (const [plate, r] of Object.entries(s.pause)) rows.push(`pause/${nsId(plate)}.png (+2x.webp)  1344x768  ${r.artRoom.id} ${r.artRoom.approvedBy ?? 'human'}  focal ${r.focal.x},${r.focal.y}`);
  console.log(rows.length ? rows.join('\n') : 'nothing installed: every surface is still the base painting');
  console.log(`(${Object.keys(s.portraits).length} portraits, ${Object.keys(s.pause).length} pause plates)`);
}

function statSize(file) {
  try {
    return `${Math.round(statSync(file).size / 1024)} KB`;
  } catch {
    return 'MISSING';
  }
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const cmd = a._[0];
  if (cmd === 'portrait') console.log(JSON.stringify(await installPortrait(a), null, 1));
  else if (cmd === 'pause') console.log(JSON.stringify(await installPause(a), null, 1));
  else if (cmd === 'focal') console.log(JSON.stringify(await setFocal(a), null, 1));
  else if (cmd === 'list') list();
  else {
    console.error('usage: node tools/exp-install-surfaces.mjs portrait|pause|focal|list   (see the header of this file)');
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    await main();
  } catch (e) {
    console.error(`[exp-install-surfaces] ${e.message}`);
    process.exitCode = 1;
  }
}
