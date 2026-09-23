#!/usr/bin/env node
// Leblanc round 2 (FFX-2 only, Chapter 6 art): install the LoRA r2 + OpenPose picks as CANDIDATES.
//   node docs/concepts/chapters/leblanc/lora/leblanc/round2/install-r2.mjs
// Reads round2/picks.json ({ state: { tag, png, cutoutFrom?, scale?, notes, fixes[], repairs? } }), copies the
// four files it replaces (never an approved file: docs/target/approved-hashes.json has no Leblanc entry) to
// the backup's replaced/ folder first, writes sidecars in the shape PaintedArt reads ({width,height,baselineY}
// + `scale` + provenance, status CANDIDATE, method 'lora-r2+openpose', seed, step), and copies the installed
// files and every round-2 candidate to D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/leblanc/.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CAND = 'D:/Tools/pyrefly-lora/leblanc/poses';
const OUT = 'public/art/characters/leblanc';
const BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/leblanc';
const REPORT = 'docs/concepts/chapters/leblanc/lora/leblanc/round2/round2.md';
const picks = JSON.parse(readFileSync(join(HERE, 'picks.json'), 'utf8'));

mkdirSync(join(BK, 'replaced'), { recursive: true });
mkdirSync(join(BK, 'all-candidates'), { recursive: true });
for (const f of readdirSync(CAND).filter((n) => /\.r2\./.test(n))) {
  if (!existsSync(join(BK, 'all-candidates', f))) copyFileSync(join(CAND, f), join(BK, 'all-candidates', f));
}
for (const [state, p] of Object.entries(picks)) {
  for (const ext of ['png', 'json']) {
    const cur = join(OUT, `${state}.${ext}`);
    const bak = join(BK, 'replaced', `${state}.${ext}`);
    if (existsSync(cur) && !existsSync(bak)) copyFileSync(cur, bak);
  }
  const m = JSON.parse(readFileSync(join(CAND, `${p.tag}.json`), 'utf8'));
  if (m.black) throw new Error(`${p.tag} is a black frame`);
  if (!m.guard.ok && !p.guardOverride) throw new Error(`${p.tag} failed the cut-out guard: ${m.guard.reasons.join('; ')}`);
  const c = p.cutoutFrom ? JSON.parse(readFileSync(join(CAND, p.cutoutFrom), 'utf8')) : m.cutout;
  const sidecar = {
    width: c.width, height: c.height, baselineY: c.baselineY,
    ...(p.scale ? { scale: p.scale } : {}),
    seed: m.seed, prompt: m.positive, negative: m.negative,
    cropBox: c.cropBox, source: { width: c.sourceWidth, height: c.sourceHeight },
    model: m.model, steps: m.steps, cfg: m.cfg, sampler: m.sampler, scheduler: m.scheduler,
    pose: state, composition: m.composition, facing: 'left',
    canvas: { width: m.width, height: m.height },
    lora: { file: m.lora.file, step: m.lora.step, strength: m.lora.strength, trigger: 'leblancX2', dataset: 'docs/concepts/chapters/leblanc/lora/leblanc/dataset-r2.md' },
    step: m.lora.step,
    controlnet: m.controlnet,
    ref: m.ipadapter.images, refWeight: m.ipadapter.weight, refWeightType: m.ipadapter.type, refScaling: m.ipadapter.scaling,
    refStart: m.ipadapter.start, refEnd: m.ipadapter.end, ipadapter: m.ipadapter.file, refCombine: m.ipadapter.combine,
    cutout: c,
    ...(p.repairs ? { repairs: p.repairs } : {}),
    ...(p.guardOverride ? { guard: { ok: false, reasons: m.guard.reasons, override: p.guardOverride } } : {}),
    status: 'CANDIDATE',
    candidateOf: `${OUT}/${state}.png`,
    method: 'lora-r2+openpose',
    ...(p.repairs ? { methodNote: 'lora-r2+openpose, then masked repaints (repairs)' } : {}),
    recipe: 'docs/concepts/chapters/leblanc/lora/leblanc/poses/render.mjs --set r2',
    round: `LoRA round 2, 2026-09-23 (${REPORT})`,
    source_render: `${CAND}/${p.tag}.raw.png (backed up in ${BK}/all-candidates/)`,
    ...(p.scale ? { scaleNote: `sidecar scale ${p.scale}: the head measured in the running battle matches idle's within 5 percent (round2/ingame-after.json)` } : {}),
    judgeNotes: `LoRA round 2 (2026-09-23), FFX-2 only. Self-judged at 1:1 against idle; not independently judged. ${p.notes}. ` +
      'A CANDIDATE, not approved: it needs an independent judge and Bailey\'s verdict.',
    generatedAt: m.generatedAt,
    installedAt: new Date().toISOString(),
  };
  copyFileSync(join(CAND, p.png), join(OUT, `${state}.png`));
  writeFileSync(join(OUT, `${state}.json`), JSON.stringify(sidecar, null, 2) + '\n');
  copyFileSync(join(OUT, `${state}.png`), join(BK, `${state}.png`));
  copyFileSync(join(OUT, `${state}.json`), join(BK, `${state}.json`));
  console.log(state, '<-', p.png, `${c.width}x${c.height} baselineY=${c.baselineY}${p.scale ? ` scale=${p.scale}` : ''}`);
}
