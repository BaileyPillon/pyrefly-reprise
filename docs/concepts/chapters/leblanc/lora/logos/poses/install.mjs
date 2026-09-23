#!/usr/bin/env node
/**
 * Install one Logos LoRA + OpenPose render as a CANDIDATE (FFX-2 only). Never approves
 * anything: docs/target/approved-hashes.json is not touched.
 *
 *   node install.mjs <state> <seed> [--scale 0.9] [--note "why this one"]
 *
 * 1. Backs up the installed public/art/characters/logos/<state>.png + .json (the file this
 *    replaces) to D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/logos/replaced/
 *    (once; an existing backup is never overwritten).
 * 2. Copies renders/<state>.<seed>.png to public/art/characters/logos/<state>.png and writes
 *    the sidecar in the installed format plus status CANDIDATE, candidateOf, method
 *    'lora+openpose', seed and the LoRA step.
 * 3. Copies the render (cutout, raw, provenance) to the backup's poses/ folder.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const BACKUP = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/logos';
const REL = 'docs/concepts/chapters/leblanc/lora/logos/poses';

const argv = process.argv.slice(2);
const [state, seed] = argv;
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
if (!state || !seed) { console.log('usage: node install.mjs <state> <seed> [--scale x] [--note "..."]'); process.exit(1); }
const tag = `${state}.${seed}`;
const meta = JSON.parse(readFileSync(join(HERE, 'renders', `${tag}.json`), 'utf8'));
const cut = meta.cutout;
if (!cut) throw new Error(`${tag}: no cutout recorded`);
if (meta.cutoutGuard && meta.cutoutGuard.ok === false) throw new Error(`${tag}: the cut-out guard failed it: ${meta.cutoutGuard.reasons.join('; ')}`);

const art = join(REPO, 'public/art/characters/logos');
mkdirSync(join(BACKUP, 'replaced'), { recursive: true });
mkdirSync(join(BACKUP, 'poses'), { recursive: true });
for (const ext of ['png', 'json']) {
  const from = join(art, `${state}.${ext}`);
  const to = join(BACKUP, 'replaced', `${state}.${ext}`);
  if (existsSync(from) && !existsSync(to)) copyFileSync(from, to);
}
for (const f of [`${tag}.png`, `${tag}.raw.png`, `${tag}.json`]) {
  if (existsSync(join(HERE, 'renders', f))) copyFileSync(join(HERE, 'renders', f), join(BACKUP, 'poses', f));
}

copyFileSync(join(HERE, 'renders', `${tag}.png`), join(art, `${state}.png`));
const scale = opt('scale') ? Number(opt('scale')) : undefined;
const side = {
  width: cut.width,
  height: cut.height,
  baselineY: cut.baselineY,
  seed: parseInt(seed, 10),
  renderTag: tag,
  prompt: meta.positive,
  negative: meta.negative,
  cropBox: cut.cropBox,
  source: { width: meta.width, height: meta.height },
  model: meta.model,
  steps: meta.steps,
  cfg: meta.cfg,
  sampler: meta.sampler,
  scheduler: meta.scheduler,
  pose: state,
  composition: meta.composition,
  facing: 'left',
  canvas: { width: meta.width, height: meta.height },
  lora: meta.lora,
  loraStep: meta.lora.step,
  controlnet: meta.controlnet,
  ipadapter: { ...meta.ipadapter, images: meta.ipadapter.images.map((p) => `${REL}/${p}`) },
  status: 'CANDIDATE',
  candidateOf: `${REL}/renders/${tag}.png`,
  method: 'lora+openpose',
  cutout: cut,
  cutoutGuard: meta.cutoutGuard ? { ok: meta.cutoutGuard.ok, reasons: meta.cutoutGuard.reasons } : null,
  generatedAt: meta.generatedAt,
  installedAt: new Date().toISOString(),
  ...(scale ? { scale, scaleNote: opt('scaleNote') || `Hand override (PaintedArt.ts PoseMeta.scale): head measured at 1:1 against idle's ~145 px, 2026-09-23.` } : {}),
  ...(opt('note') ? { notes: opt('note') } : {}),
  replaced: `${BACKUP}/replaced/${state}.png`,
};
writeFileSync(join(art, `${state}.json`), JSON.stringify(side, null, 2) + '\n');
console.log(`installed ${tag} -> public/art/characters/logos/${state}.png (CANDIDATE)`);
