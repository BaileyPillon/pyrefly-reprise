#!/usr/bin/env node
// Leblanc LoRA poses, the REDO after the independent judge (lora/leblanc/judge.md; FFX-2 only).
// Replaces the four installed CANDIDATES (never an approved file: docs/target/approved-hashes.json has no
// Leblanc entry) with the redo's picks and writes sidecars in the shape PaintedArt reads
// ({width,height,baselineY} + provenance), status CANDIDATE. The files it replaces (the v3 picks) are
// copied to the backup's replaced-redo-2026-09-23/ first. Report: poses/redo.md.
//   node docs/concepts/chapters/leblanc/lora/leblanc/poses/install-redo.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CAND = 'D:/Tools/pyrefly-lora/leblanc/poses';
const OUT = 'public/art/characters/leblanc';
const BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/leblanc';
const REPORT = 'docs/concepts/chapters/leblanc/lora/leblanc/poses/redo.md';
const BELOW = 'best available, below bar';

// tag = the sidecar the pick came from; png = the file installed; cutoutFrom = a re-cropped cut-out's
// box (shadow.py) when the alpha was cleaned after rembg
const PICKS = {
  attack: {
    tag: 'attack.v7.2', png: 'attack.v7.2.noshadow.png', cutoutFrom: 'attack.v7.2.noshadow.cutout.json',
    guardOverride: 'cutout-guard rejected the crop box as 99.6% x 97.9% of the 1024x1216 canvas, a rule for painted backdrops; ' +
      'here the lunge itself spans the canvas: every border pixel of the cut-out is transparent and the black backdrop is gone (checked at 1:1)',
    notes: 'a planted fan strike: profile to screen-left, the closed black fan thrust out at the party at arm\'s length, the far hand on the hip, ' +
      'a wide lunge with the front shin down to a planted front boot and the rear leg straight to a planted rear boot, v-brows. Both boots open-toe ' +
      'lace-ups as idle; no robe lobes. Worst: a solid dark patch where the hair meets the face on the near side (idle has only a thin shade); ' +
      'the boots are a deeper purple than idle\'s lavender',
    fixes: ['new skeleton v7 (near profile, planted feet, 1024 wide canvas; skeletons/v7/attack.png)', '"wings, cape, jumping, midair" in the negative',
      'painted ground shadow under the rear boot cleared from the alpha (shadow.py, bottom band only)'],
  },
  cast: {
    tag: 'cast.r2red', png: 'cast.r2red.png',
    notes: 'the v3.6 pose kept (fan arm up, the open fan overhead, looking up) with the judge\'s repairs: the solid black patch under the jaw ' +
      'repainted as the neck in shadow, a clean unnotched heart, studs on the choker, the near eye redrawn with an iris. The open leaf is ' +
      'recoloured from the unsourced lavender to research §10.1\'s red and silver, the black ribs and guards kept as idle. LEAF COLOUR IS ' +
      'BAILEY\'S CALL (hard rule 6): cast.r2black (a black leaf) is the same frame with the other option, in the backup. Worst: the studs are ' +
      'white strokes rather than idle\'s neat row; a thin dark line and a pale fleck stay under the jaw',
    fixes: ['masked repaints: choker 74023, heart 74012 (VAEEncodeForInpaint), near eye 74032', 'jaw.py --palette neck then repaint nsm76011 at 0.35',
      'leaf.py red (a pixel recolour inside the fan sector; no diffusion)'],
  },
  hurt: {
    tag: 'hurt.v4.5', png: 'hurt.v4.5.png',
    notes: 'a recoil: leaning back off balance, head tipped back, the near eye shut in a wince and the mouth turned down, the hand on the stomach, ' +
      'the black closed fan held out; BOTH legs down to two planted open-toe lace-up boots (the v3.1 pick had one). Costume as idle. Worst: a ' +
      'purple tassel hangs from the fan\'s end (idle\'s fan shows none); the figure is drawn a little smaller than idle (head about 170 px ' +
      'against 210) because of the low, leaning view',
    fixes: ['new skeleton v4 (the far leg in front of the robe hem; skeletons/v4/hurt.png)', 'OpenPose 0.75 to 0.9', '"one leg, missing leg" in the negative'],
  },
  ko: {
    tag: 'ko.r2', png: 'ko.r2.noshadow.png', cutoutFrom: 'ko.r2.noshadow.cutout.json',
    notes: 'the v3.2 pose kept (on her side, head to screen-left, eyes closed, no smile) with the judge\'s repairs: the fan guard recoloured ' +
      'from tan to idle\'s black, both boots repainted open-toe, the cheek smear and the orange mouth nick painted out, and the painted black ' +
      'ground shadow cleared from the cut-out\'s alpha. Worst: the repainted toes are rough at 2x (fine at 1:1); a few gaps show where the ' +
      'shadow met the robe\'s underside',
    fixes: ['guard.py (tan -> charcoal inside a polygon that stops short of the hand)', 'masked repaints: face 72002, boots 72022 then toes 73001, fan smoothing 73011',
      'shadow.py (thick near-black areas under the figure cleared from the alpha, interior robe darks kept)'],
  },
};

mkdirSync(join(BK, 'replaced-redo-2026-09-23'), { recursive: true });
mkdirSync(join(BK, 'all-candidates'), { recursive: true });
for (const [state, p] of Object.entries(PICKS)) {
  for (const ext of ['png', 'json']) {
    const cur = join(OUT, `${state}.${ext}`);
    const bak = join(BK, 'replaced-redo-2026-09-23', `${state}.${ext}`);
    if (existsSync(cur) && !existsSync(bak)) copyFileSync(cur, bak);
  }
  const m = JSON.parse(readFileSync(join(CAND, `${p.tag}.json`), 'utf8'));
  if (m.black) throw new Error(`${p.tag} is a black frame`);
  if (!m.guard.ok && !p.guardOverride) throw new Error(`${p.tag} failed the cut-out guard: ${m.guard.reasons.join('; ')}`);
  const c = p.cutoutFrom ? JSON.parse(readFileSync(join(CAND, p.cutoutFrom), 'utf8')) : m.cutout;
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
    ...(m.merge ? { repairs: m.merge } : {}),
    ...(p.guardOverride ? { guard: { ok: false, reasons: m.guard.reasons, override: p.guardOverride } } : {}),
    status: 'CANDIDATE',
    quality: BELOW,
    candidateOf: `${OUT}/${state}.png`,
    method: m.merge ? 'lora+openpose, masked repaint and pixel repairs' : 'lora+openpose',
    recipe: 'docs/concepts/chapters/leblanc/lora/leblanc/poses/render.mjs',
    round: `LoRA poses REDO 2026-09-23 (${REPORT})`,
    source_render: `${CAND}/${p.tag}.raw.png (backed up in ${BK}/all-candidates/)`,
    redoFixes: p.fixes,
    judgeNotes: `LoRA poses redo (2026-09-23), FFX-2 only, after the independent judge (lora/leblanc/judge.md). ${BELOW}: self-judged at 1:1 ` +
      `against idle; not independently judged. ${p.notes}. A CANDIDATE, not approved: it needs an independent judge and Bailey's verdict.`,
    generatedAt: m.generatedAt,
    installedAt: new Date().toISOString(),
  };
  copyFileSync(join(CAND, p.png), join(OUT, `${state}.png`));
  writeFileSync(join(OUT, `${state}.json`), JSON.stringify(sidecar, null, 2) + '\n');
  copyFileSync(join(OUT, `${state}.png`), join(BK, `${state}.png`));
  copyFileSync(join(OUT, `${state}.json`), join(BK, `${state}.json`));
  console.log(state, '<-', p.png, `${c.width}x${c.height} baselineY=${c.baselineY}`);
}
