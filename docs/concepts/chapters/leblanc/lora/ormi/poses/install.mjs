#!/usr/bin/env node
/**
 * Install the picked Ormi LoRA pose renders as CANDIDATES (FFX-2 only, Chapter 6).
 *
 *   node docs/concepts/chapters/leblanc/lora/ormi/poses/install.mjs
 *
 * Reads picks.json (state -> render tag under D:/Tools/pyrefly-lora/ormi/poses/<state>/),
 * backs up the files it replaces and the picks (raw, cut-out, render sidecar) to
 * D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/ormi/, copies the
 * cut-out to public/art/characters/ormi/<state>.png and writes the sidecar the engine
 * reads ({width,height,baselineY} plus provenance). Nothing is approved: status stays
 * CANDIDATE and docs/target/approved-hashes.json is not touched. Idempotent per pick:
 * a state whose installed file already hashes like its pick is skipped.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const SRC = 'D:/Tools/pyrefly-lora/ormi/poses';
const ART = join(REPO, 'public/art/characters/ormi');
const BACKUP = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/ormi';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const picks = JSON.parse(readFileSync(join(HERE, 'picks.json'), 'utf8'));
const now = new Date().toISOString();
mkdirSync(join(BACKUP, 'replaced'), { recursive: true });
mkdirSync(join(BACKUP, 'picks'), { recursive: true });

for (const [state, pick] of Object.entries(picks.states)) {
  const dir = join(SRC, state);
  const png = join(dir, `${pick.tag}.png`);
  const raw = join(dir, `${pick.tag}.raw.png`);
  const meta = JSON.parse(readFileSync(join(dir, `${pick.tag}.json`), 'utf8'));
  const target = join(ART, `${state}.png`);
  if (existsSync(target) && sha(target) === sha(png)) { console.log(`[install] ${state}: already installed`); continue; }
  for (const ext of ['png', 'json']) {
    const f = join(ART, `${state}.${ext}`);
    const b = join(BACKUP, 'replaced', `${state}.${ext}`);
    if (existsSync(f) && !existsSync(b)) copyFileSync(f, b);
  }
  for (const f of [png, raw, join(dir, `${pick.tag}.json`)]) copyFileSync(f, join(BACKUP, 'picks', f.replace(/^.*[\\/]/, '')));
  copyFileSync(png, target);
  const c = meta.cutout;
  const sidecar = {
    width: c.width,
    height: c.height,
    baselineY: c.baselineY,
    seed: meta.seed,
    prompt: meta.positive,
    negative: meta.negative,
    cropBox: c.cropBox,
    source: { width: c.sourceWidth, height: c.sourceHeight },
    model: meta.model,
    steps: meta.steps,
    cfg: meta.cfg,
    sampler: meta.sampler,
    scheduler: meta.scheduler,
    pose: state,
    composition: state === 'ko' ? 'prone' : 'full',
    facing: 'right',
    facingObserved: true,
    canvas: { width: meta.width, height: meta.height },
    cutout: { ...c, guard: meta.guard },
    status: 'CANDIDATE',
    candidateOf: `public/art/characters/ormi/${state}.png`,
    candidateSource: `D:/Tools/pyrefly-lora/ormi/poses/${state}/${pick.tag}.png (backup: ${BACKUP}/picks/)`,
    method: 'lora+openpose',
    lora: meta.lora,
    loraStep: meta.lora.step,
    controlnet: meta.controlnet,
    ipadapter: meta.ipadapter,
    edits: pick.edits,
    repaint: meta.repaint,
    judge: pick.judge,
    round: 'docs/concepts/chapters/leblanc/lora/ormi/poses/poses.md',
    sha256: sha(png),
    installedAt: now,
  };
  writeFileSync(join(ART, `${state}.json`), JSON.stringify(sidecar, null, 2) + '\n');
  console.log(`[install] ${state}: ${pick.tag} -> ${target} (${sidecar.sha256.slice(0, 12)})`);
}
