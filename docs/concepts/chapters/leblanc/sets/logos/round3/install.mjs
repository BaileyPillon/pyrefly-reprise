#!/usr/bin/env node
/**
 * Install one Logos round-3 render as a CANDIDATE (FFX-2 only). Never approves anything:
 * docs/target/approved-hashes.json is not touched.
 *
 *   node docs/concepts/chapters/leblanc/sets/logos/round3/install.mjs <state> <seed>
 *
 * Copies renders/<state>.<seed>.png to public/art/characters/logos/<state>.png and writes the
 * sidecar in the installed format (width, height, baselineY, cropBox, prompt, ...), plus
 * status CANDIDATE, candidateOf, method and seed.
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const [state, seed] = process.argv.slice(2);
const tag = `${state}.${seed}`;
const meta = JSON.parse(readFileSync(join(HERE, 'renders', `${tag}.json`), 'utf8'));
const cut = meta.cutout;
if (!cut) throw new Error(`${tag}: no cutout recorded`);
const out = join(ROOT, 'public/art/characters/logos');
copyFileSync(join(HERE, 'renders', `${tag}.png`), join(out, `${state}.png`));
const rel = (p) => `docs/concepts/chapters/leblanc/sets/logos/round3/${p}`;
const side = {
  width: cut.width,
  height: cut.height,
  baselineY: cut.baselineY,
  seed: parseInt(seed, 10),
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
  composition: state === 'ko' ? 'prone' : 'full',
  facing: 'left',
  canvas: { width: meta.width, height: meta.height },
  ref: meta.ref.images.map(rel),
  refWeight: meta.ref.weight,
  refWeightType: meta.ref.type,
  refScaling: meta.ref.scaling,
  refStart: meta.ref.start,
  refEnd: meta.ref.end,
  refCombine: meta.ref.combine,
  ipadapter: meta.ref.ipadapter,
  status: 'CANDIDATE',
  candidateOf: rel(`renders/${tag}.png`),
  method: 'F (docs/concepts/chapters/leblanc/pilot2/judge.md winner), Logos Danbooru words; round 3',
  ...(meta.repaint ? { repaint: { ...meta.repaint, source: rel(meta.repaint.source), cleanedBeforeRepaint: meta.repaint.source.includes("c.raw") ? "crest pixels filled (above the dome: white; inside the dome: the dome grey) before the repaint, see round3.md" : undefined } } : {}),
  cutout: cut,
  generatedAt: meta.generatedAt,
  installedAt: new Date().toISOString(),
};
writeFileSync(join(out, `${state}.json`), JSON.stringify(side, null, 2) + '\n');
console.log(`installed ${tag} -> public/art/characters/logos/${state}.png (CANDIDATE)`);
