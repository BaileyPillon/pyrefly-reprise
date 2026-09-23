#!/usr/bin/env node
// Leblanc LoRA poses install (FFX-2 only). Copies the four picks over the installed round-3
// CANDIDATES (never an approved file: docs/target/approved-hashes.json has no Leblanc entry) and
// writes sidecars in the shape PaintedArt reads ({width,height,baselineY} + provenance), status
// CANDIDATE with candidateOf / method 'lora+openpose' / seed / lora step. The replaced files were
// copied to the backup's replaced-2026-09-23/ first; the new ones are copied there too.
//   node docs/concepts/chapters/leblanc/lora/leblanc/poses/install.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CAND = 'D:/Tools/pyrefly-lora/leblanc/poses';
const OUT = 'public/art/characters/leblanc';
const BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/leblanc';
const JUDGE = 'docs/concepts/chapters/leblanc/lora/leblanc/poses/poses.md';
const PICKS = {
  attack: { tag: 'attack.v3.3', score: 6, notes: 'a fan strike: lunge to screen-left, weight forward, the black closed fan leading, v-brows; warm blonde bob, purple eyes, studded choker, red heart, crimson obi with knot and tassel, white halter dress and the purple robe off the shoulders match the idle. Worst: closed-toe lace-up boots (idle open-toe, 6); the robe flares into wing shapes with a fainter diamond pattern (7)' },
  cast: { tag: 'cast.v3.6', score: 6, notes: "fan arm raised with the fan open overhead, looking up; open-toe lace-up boots, crimson obi, heart, choker and robe match the idle. Worst: the open fan's lavender leaf is the LoRA's invention, unsourced by the idle, whose fan is only ever seen closed and black (6; hard rule 6, Bailey's call)" },
  hurt: { tag: 'hurt.v3.1', score: 6, notes: 'a recoil: head thrown back, eyes screwed shut, clenched teeth, hand on the stomach, fan arm flung back; the same robe, obi, dress, heart and black closed fan as the idle, an open-toe boot. Worst: the far leg is hidden behind the robe so only one boot shows (6); both eyes shut rather than one (7)' },
  ko: { tag: 'ko.v3.2', score: 6, notes: 'lying on her side, head to screen-left, both eyes closed, no smile, the black closed fan under the hand; costume as the idle. Worst: closed-toe boots (6) and a painted ground shadow the cutout kept under the body (6)' },
};

mkdirSync(join(BK, 'replaced-2026-09-23'), { recursive: true });
for (const [state, p] of Object.entries(PICKS)) {
  for (const ext of ['png', 'json']) {
    const cur = join(OUT, `${state}.${ext}`);
    const bak = join(BK, 'replaced-2026-09-23', `${state}.${ext}`);
    if (existsSync(cur) && !existsSync(bak)) copyFileSync(cur, bak);
  }
  const m = JSON.parse(readFileSync(join(CAND, `${p.tag}.json`), 'utf8'));
  if (!m.guard.ok || m.black) throw new Error(`${p.tag} failed the cut-out or black-frame guard`);
  const c = m.cutout;
  const sidecar = {
    width: c.width, height: c.height, baselineY: c.baselineY,
    seed: m.seed, prompt: m.positive, negative: m.negative,
    cropBox: c.cropBox, source: { width: c.sourceWidth, height: c.sourceHeight },
    model: m.model, steps: m.steps, cfg: m.cfg, sampler: m.sampler, scheduler: m.scheduler,
    pose: state, composition: m.composition, facing: 'left',
    canvas: { width: m.width, height: m.height },
    lora: { file: m.lora.file, step: m.lora.step, strength: m.lora.strength, trigger: 'leblancX2', dataset: 'docs/concepts/chapters/leblanc/lora/leblanc/dataset.md' },
    controlnet: m.controlnet,
    ref: m.ipadapter.images, refWeight: m.ipadapter.weight, refWeightType: m.ipadapter.type, refScaling: m.ipadapter.scaling,
    refStart: m.ipadapter.start, refEnd: m.ipadapter.end, ipadapter: m.ipadapter.file, refCombine: m.ipadapter.combine,
    cutout: c,
    status: 'CANDIDATE',
    candidateOf: `${OUT}/${state}.png`,
    method: 'lora+openpose',
    recipe: 'docs/concepts/chapters/leblanc/lora/leblanc/poses/render.mjs',
    round: `LoRA poses 2026-09-23 (${JUDGE})`,
    source_render: `${CAND}/${p.tag}.raw.png (backed up in ${BK}/all-candidates/)`,
    judgeNotes: `LoRA poses (2026-09-23), FFX-2 only. Self-judged at 1:1 against idle by the round-3 criteria, worst criterion ${p.score}/10: ${p.notes}. A CANDIDATE, not approved: it needs an independent judge and Bailey's verdict.`,
    generatedAt: m.generatedAt,
    installedAt: new Date().toISOString(),
  };
  copyFileSync(join(CAND, `${p.tag}.png`), join(OUT, `${state}.png`));
  writeFileSync(join(OUT, `${state}.json`), JSON.stringify(sidecar, null, 2) + '\n');
  copyFileSync(join(OUT, `${state}.png`), join(BK, `${state}.png`));
  copyFileSync(join(OUT, `${state}.json`), join(BK, `${state}.json`));
  console.log(state, '<-', p.tag, `${c.width}x${c.height} baselineY=${c.baselineY}`);
}
