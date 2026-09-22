#!/usr/bin/env node
// Leblanc round 3 install (FFX-2 only). Copies the three picks over the installed
// CANDIDATES (never an approved file: approved-hashes.json has no leblanc set) and
// writes sidecars in the shape PaintedArt reads ({width,height,baselineY} + provenance),
// marked status CANDIDATE with candidateOf / method / seed. The replaced files are
// copied to the backup first, then the new ones.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const R = 'docs/concepts/chapters/leblanc/sets/leblanc/round3/renders';
const OUT = 'public/art/characters/leblanc';
const BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-22-leblanc/leblanc';
const PICKS = {
  attack: { tag: 'attack.22101', score: 5, worst: 'robe pattern (checkerboard sleeve panel), heart drawn as an outlined tattoo; fan trails as a wind-up (6)' },
  hurt: { tag: 'hurt.b.22303.f3', score: 5, worst: 'robe hangs closed as a long skirt with strap buckles on the sleeve; fan pale wood; heart not visible in this turn' },
  cast: { tag: 'cast.b.22501', score: 5, worst: 'robe lining and shoulder drape pink/red where idle is white-edged' },
};
mkdirSync(join(BK, 'replaced-2026-09-22'), { recursive: true });
for (const [state, p] of Object.entries(PICKS)) {
  for (const ext of ['png', 'json']) {
    const cur = join(OUT, `${state}.${ext}`);
    const bak = join(BK, 'replaced-2026-09-22', `${state}.${ext}`);
    if (existsSync(cur) && !existsSync(bak)) copyFileSync(cur, bak);
  }
  const meta = JSON.parse(readFileSync(join(R, `${p.tag}.json`), 'utf8'));
  // repaints carry the base render's generation settings in the base sidecar
  const baseTag = p.tag.replace(/\.[a-z]\d$/, '');
  const base = JSON.parse(readFileSync(join(R, `${baseTag}.json`), 'utf8'));
  const c = meta.cutout;
  const sidecar = {
    width: c.width, height: c.height, baselineY: c.baselineY,
    seed: base.seed, prompt: base.positive, negative: base.negative,
    cropBox: c.cropBox, source: { width: c.sourceWidth, height: c.sourceHeight },
    model: base.model, steps: base.steps, cfg: base.cfg, sampler: base.sampler, scheduler: base.scheduler,
    pose: state, composition: 'full', facing: 'left',
    canvas: { width: base.width, height: base.height },
    ref: base.ref.images, refWeight: base.ref.weight, refWeightType: base.ref.type, refScaling: 'K+V',
    refStart: base.ref.start, refEnd: base.ref.end, ipadapter: base.ref.ipadapter, refCombine: 'concat',
    cutout: c,
    status: 'CANDIDATE',
    candidateOf: `${OUT}/${state}.png`,
    method: meta.tag === base.tag ? base.method : `${base.method}; then ${meta.method} (box ${meta.box}, denoise ${meta.denoise}, seed ${meta.seed})`,
    ...(meta.tag !== base.tag ? { repaint: { box: meta.box, denoise: meta.denoise, seed: meta.seed, positive: meta.positive, negative: meta.negative } } : {}),
    round: 'round3 (docs/concepts/chapters/leblanc/sets/leblanc/round3/judge.md)',
    source_render: `${R}/${p.tag}.png`,
    judgeNotes: `Round 3 (2026-09-22), FFX-2 only. Self-judged at 1:1 against idle, worst criterion: ${p.score}/10 (${p.worst}). Below the bar of 7: a CANDIDATE, not approved; it replaces a candidate that scores lower on the same criteria.`,
    generatedAt: meta.generatedAt,
    installedAt: new Date().toISOString(),
  };
  copyFileSync(join(R, `${p.tag}.png`), join(OUT, `${state}.png`));
  writeFileSync(join(OUT, `${state}.json`), JSON.stringify(sidecar, null, 2) + '\n');
  copyFileSync(join(OUT, `${state}.png`), join(BK, `${state}.png`));
  copyFileSync(join(OUT, `${state}.json`), join(BK, `${state}.json`));
  console.log(state, '<-', p.tag, `${c.width}x${c.height} baselineY=${c.baselineY}`);
}
