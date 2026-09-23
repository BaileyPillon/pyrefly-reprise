#!/usr/bin/env node
/**
 * Install the round-2 Ormi picks as CANDIDATES (FFX-2 only, Chapter 6).
 *
 *   node docs/concepts/chapters/leblanc/lora/ormi/round2/install-r2.mjs
 *
 * Reads picks-r2.json (state -> {tag, seed, step, scale, edits, judge}; tag is a render
 * under D:/Tools/pyrefly-lora/ormi/r2/poses/<state>/). Backs up the installed files it
 * replaces (png + json) and the picks (raw, cut-out, sidecar) under
 * D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/ormi/{replaced,picks}/, copies
 * the cut-out to public/art/characters/ormi/<state>.png and writes the engine sidecar
 * ({width,height,baselineY} + `scale` from the in-game head check + provenance, method
 * 'lora-r2+openpose'). Nothing is approved: status CANDIDATE, approved-hashes untouched.
 * Re-running with a changed `scale` only rewrites the sidecar.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const SRC = 'D:/Tools/pyrefly-lora/ormi/r2/poses';
const ART = join(REPO, 'public/art/characters/ormi');
const BACKUP = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/ormi';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const picks = JSON.parse(readFileSync(join(HERE, 'picks-r2.json'), 'utf8'));
const now = new Date().toISOString();
mkdirSync(join(BACKUP, 'replaced'), { recursive: true });
mkdirSync(join(BACKUP, 'picks'), { recursive: true });

for (const [state, pick] of Object.entries(picks.states)) {
  const dir = join(SRC, state);
  const png = join(dir, `${pick.tag}.png`);
  const raw = join(dir, `${pick.tag}.raw.png`);
  const meta = JSON.parse(readFileSync(join(dir, `${pick.tag}.json`), 'utf8'));
  const target = join(ART, `${state}.png`);
  const same = existsSync(target) && sha(target) === sha(png);
  if (!same) {
    for (const ext of ['png', 'json']) {
      const f = join(ART, `${state}.${ext}`);
      const b = join(BACKUP, 'replaced', `${state}.${ext}`);
      if (existsSync(f) && !existsSync(b)) copyFileSync(f, b);
    }
    for (const f of [png, raw, join(dir, `${pick.tag}.json`)]) copyFileSync(f, join(BACKUP, 'picks', f.replace(/^.*[\\/]/, '')));
    copyFileSync(png, target);
  }
  const c = meta.cutout;
  const sidecar = {
    width: c.width,
    height: c.height,
    baselineY: c.baselineY,
    ...(pick.scale && pick.scale !== 1 ? { scale: pick.scale } : {}),
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
    ...(pick.judge?.score < 7 ? { note: 'best available, below bar' } : {}),
    candidateOf: `public/art/characters/ormi/${state}.png`,
    candidateSource: `D:/Tools/pyrefly-lora/ormi/r2/poses/${state}/${pick.tag}.png (backup: ${BACKUP}/picks/)`,
    method: 'lora-r2+openpose',
    lora: meta.lora,
    loraStep: pick.step,
    controlnet: meta.controlnet,
    ipadapter: meta.ipadapter,
    edits: pick.edits || [],
    repaint: meta.repaint,
    scaleCheck: pick.scaleCheck,
    judge: pick.judge,
    round: 'docs/concepts/chapters/leblanc/lora/ormi/round2/round2.md',
    sha256: sha(png),
    installedAt: now,
  };
  writeFileSync(join(ART, `${state}.json`), JSON.stringify(sidecar, null, 2) + '\n');
  console.log(`[install-r2] ${state}: ${pick.tag} ${same ? '(sidecar only)' : '->'} ${target} (${sidecar.sha256.slice(0, 12)}) scale ${pick.scale ?? 1}`);
}
