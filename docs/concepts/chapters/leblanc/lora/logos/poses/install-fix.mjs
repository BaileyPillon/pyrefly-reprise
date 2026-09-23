#!/usr/bin/env node
/**
 * Install one Logos local-fix candidate (fix.mjs) as a CANDIDATE (FFX-2 only). Never
 * approves anything: docs/target/approved-hashes.json is not touched.
 *
 *   node install-fix.mjs <state> <seed> --score N [--below] [--note "..."]
 *
 * 1. Backs up the installed public/art/characters/logos/<state>.png + .json (the LoRA pick
 *    this replaces) to D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/logos/
 *    replaced-lora-picks/ (once; an existing backup is never overwritten).
 * 2. Walks the fix chain (renders/<state>.<seed>.fix.json -> fixOf -> ... -> the LoRA +
 *    OpenPose render) and writes the sidecar in the installed format: the base render's
 *    prompt, ControlNet and IP-Adapter, plus every masked-repaint pass in order.
 * 3. Copies the chain's cutouts, patched frames and provenance to the backup's poses-fix/.
 * `--below` writes bar: 'best available, below bar' (the score is under the pass mark 7).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCutoutFile } from '../../../../../../../tools/gen/cutout-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const BACKUP = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/logos';
const REL = 'docs/concepts/chapters/leblanc/lora/logos/poses';
const R = join(HERE, 'renders');

const argv = process.argv.slice(2);
const [state, seed] = argv;
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
if (!state || !seed || !opt('score')) { console.log('usage: node install-fix.mjs <state> <seed> --score N [--below] [--note "..."]'); process.exit(1); }
const tag = `${state}.${seed}.fix`;
const top = JSON.parse(readFileSync(join(R, `${tag}.json`), 'utf8'));

// the chain, newest first, ending at the LoRA + OpenPose render
const chain = [top];
let cur = top;
while (cur.fixOf) {
  cur = JSON.parse(readFileSync(join(R, `${cur.fixOf}.json`), 'utf8'));
  chain.push(cur);
}
const base = chain[chain.length - 1];
const fixes = chain.slice(0, -1).reverse(); // oldest fix first
const installedFx = JSON.parse(readFileSync(join(REPO, 'public/art/characters/logos', `${state}.json`), 'utf8'));

const art = join(REPO, 'public/art/characters/logos');
mkdirSync(join(BACKUP, 'replaced-lora-picks'), { recursive: true });
mkdirSync(join(BACKUP, 'poses-fix'), { recursive: true });
for (const ext of ['png', 'json']) {
  const from = join(art, `${state}.${ext}`);
  const to = join(BACKUP, 'replaced-lora-picks', `${state}.${ext}`);
  if (existsSync(from) && !existsSync(to)) copyFileSync(from, to);
}
for (const c of fixes) {
  for (const f of [`${c.tag}.png`, `${c.tag}.raw.png`, `${c.tag}.json`]) {
    if (existsSync(join(R, f))) copyFileSync(join(R, f), join(BACKUP, 'poses-fix', f));
  }
}

const cut = top.cutout;
const guard = await checkCutoutFile(join(R, `${tag}.png`), { sourceWidth: base.width, sourceHeight: base.height, composition: base.composition });
if (!guard.ok) throw new Error(`${tag}: the cut-out guard failed it: ${guard.reasons.join('; ')}`);
const scale = installedFx.scale;
const score = Number(opt('score'));
const side = {
  width: cut.width,
  height: cut.height,
  baselineY: cut.baselineY,
  seed: base.seed,
  renderTag: tag,
  prompt: base.positive,
  negative: base.negative,
  cropBox: cut.cropBox,
  source: { width: base.width, height: base.height },
  model: base.model,
  steps: base.steps,
  cfg: base.cfg,
  sampler: base.sampler,
  scheduler: base.scheduler,
  pose: state,
  composition: base.composition,
  facing: 'left',
  canvas: { width: base.width, height: base.height },
  lora: base.lora,
  loraStep: base.lora.step,
  controlnet: base.controlnet,
  ipadapter: { ...base.ipadapter, images: base.ipadapter.images.map((p) => `${REL}/${p}`) },
  fixes: fixes.map((c) => ({
    tag: c.tag, seed: c.seed, judge: c.judge,
    passes: c.passes.map((p) => ({ name: p.name, crop: p.crop, mask: p.mask, minus: p.minus, prefill: p.prefill, paste: p.paste, denoise: p.denoise,
      alpha: p.alpha, refs: p.refs.map((r) => `${REL}/${r}`), refWeight: p.refWeight, positive: p.positive, negative: p.negative })),
  })),
  status: 'CANDIDATE',
  candidateOf: `${REL}/renders/${tag}.png`,
  method: 'lora+openpose, then masked repaint (lora inpaint)',
  selfScore: score,
  bar: score < 7 || argv.includes('--below') ? 'best available, below bar' : 'self-judged at the bar (7); independent judge owed',
  cutout: cut,
  cutoutGuard: { ok: guard.ok, reasons: guard.reasons },
  generatedAt: top.generatedAt,
  installedAt: new Date().toISOString(),
  ...(scale ? { scale, scaleNote: installedFx.scaleNote } : {}),
  ...(opt('note') ? { notes: opt('note') } : {}),
  replaced: `${BACKUP}/replaced-lora-picks/${state}.png`,
};
writeFileSync(join(art, `${state}.json`), JSON.stringify(side, null, 2) + '\n');
copyFileSync(join(R, `${tag}.png`), join(art, `${state}.png`));
console.log(`installed ${tag} -> public/art/characters/logos/${state}.png (CANDIDATE, ${side.bar}); chain ${chain.map((c) => c.tag).join(' <- ')}`);
