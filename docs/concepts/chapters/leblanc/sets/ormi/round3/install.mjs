#!/usr/bin/env node
/**
 * Install Ormi round 3's picks as CANDIDATES (FFX-2 only). Never approves:
 * nothing here touches docs/target/approved-hashes.json. The round-2 files
 * being replaced are copied to the backup first.
 *
 *   node docs/concepts/chapters/leblanc/sets/ormi/round3/install.mjs
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const OUT = join(ROOT, 'public/art/characters/ormi');
const BACKUP = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-22-leblanc/ormi';
const REL = 'docs/concepts/chapters/leblanc/sets/ormi/round3/renders';

export const PICKS = {
  attack: { tag: 'attack.940001.heart950002', base: 'attack.940001' },
  cast: { tag: 'cast.940105' },
  hurt: { tag: 'hurt.940204' },
  ko: { tag: 'ko.940302.heart950304', base: 'ko.940302' },
};

mkdirSync(join(BACKUP, 'replaced-round2'), { recursive: true });
for (const [state, pick] of Object.entries(PICKS)) {
  for (const ext of ['png', 'json']) {
    const cur = join(OUT, `${state}.${ext}`);
    const bak = join(BACKUP, 'replaced-round2', `${state}.${ext}`);
    if (existsSync(cur) && !existsSync(bak)) copyFileSync(cur, bak);
  }
  const R = join(HERE, 'renders');
  const base = JSON.parse(readFileSync(join(R, `${pick.base || pick.tag}.json`), 'utf8'));
  const final = JSON.parse(readFileSync(join(R, `${pick.tag}.json`), 'utf8'));
  const c = final.cutout;
  const sidecar = {
    width: c.width,
    height: c.height,
    baselineY: c.baselineY,
    seed: base.seed,
    prompt: base.positive,
    negative: base.negative,
    cropBox: c.cropBox,
    source: { width: c.sourceWidth, height: c.sourceHeight },
    model: base.model,
    steps: base.steps,
    cfg: base.cfg,
    sampler: base.sampler,
    scheduler: base.scheduler,
    pose: state,
    composition: state === 'ko' ? 'prone' : 'full',
    facing: 'left',
    emphasis: base.emphasis,
    canvas: base.canvas,
    ref: base.ref.images.map((p) => `docs/concepts/chapters/leblanc/sets/ormi/round3/${p}`),
    refWeight: base.ref.weight,
    refWeightType: base.ref.type,
    refScaling: 'K+V',
    refCombine: base.ref.combine,
    refStart: base.ref.start,
    refEnd: base.ref.end,
    ipadapter: base.ref.ipadapter,
    lint: { stripped: [] },
    cutout: c,
    status: 'CANDIDATE',
    candidateOf: `public/art/characters/ormi/${state}.png`,
    candidateSource: `${REL}/${pick.tag}.png`,
    method: pick.base
      ? `F (Leblanc pilot 2 winner) with Ormi's idle-truth words, then a masked shield-face repaint (seed ${final.seed}, denoise ${final.denoise}, ellipse ${JSON.stringify(final.mask.ellipse)}) for the Syndicate heart`
      : 'F (Leblanc pilot 2 winner) with Ormi\'s idle-truth words',
    ...(pick.base ? { repaint: { seed: final.seed, denoise: final.denoise, mask: final.mask, positive: final.positive, negative: final.negative } } : {}),
    round: 'docs/concepts/chapters/leblanc/sets/ormi/round3/judge.md',
    generatedAt: final.generatedAt,
    installedAt: new Date().toISOString(),
  };
  copyFileSync(join(R, `${pick.tag}.png`), join(OUT, `${state}.png`));
  writeFileSync(join(OUT, `${state}.json`), `${JSON.stringify(sidecar, null, 2)}\n`);
  process.stderr.write(`[ormi-r3 install] ${state} <- ${pick.tag} ${c.width}x${c.height} baselineY=${c.baselineY}\n`);
}
