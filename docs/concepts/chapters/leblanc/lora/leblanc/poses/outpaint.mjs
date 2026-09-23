#!/usr/bin/env node
/**
 * Outpaint one Leblanc pose frame past a canvas edge (FFX-2 only, Chapter 6). The redo's attack pick
 * (attack.v6.3) drives the closed fan out to screen-left and the frame cuts the fan off at x 0. This pads
 * the raw frame on one side (core ImagePadForOutpaint, feathered), inpaints only the new strip plus a
 * feathered overlap (VAEEncodeForInpaint, denoise 1, the same LoRA and words as the render), and
 * composites the original pixels back outside the pad's feathered mask (ImageCompositeMasked).
 *
 *   node docs/concepts/chapters/leblanc/lora/leblanc/poses/outpaint.mjs <state> <tag> <name> --left 192
 *        [--seeds a,b] [--lora 0.8] [--feather 48] [--positive "extra words"] [--negative "extra words"]
 *
 * Writes <tag>.<name><seed>.raw.png (the wider canvas), its cut-out and a sidecar beside the source.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const G = await import(pathToFileURL(join(REPO, 'tools/gen/comfy.mjs')).href);
const C = await import(pathToFileURL(join(REPO, 'tools/gen/cutout-guard.mjs')).href);
const R = await import(pathToFileURL(join(HERE, 'render.mjs')).href);
const { stageImage, cutout } = G;
const CKPT = 'animagine-xl-4.0-opt.safetensors';

const argv = process.argv.slice(2);
const [state, tag, name] = argv;
const opt = {};
for (let i = 3; i < argv.length; i += 2) opt[argv[i].slice(2)] = argv[i + 1];
const left = Number(opt.left || 0), right = Number(opt.right || 0);
const seeds = String(opt.seeds || '975001').split(',').map(Number);
const lora = Number(opt.lora ?? 0.8);
const feather = Number(opt.feather ?? 48);
const base = JSON.parse(readFileSync(join(R.OUT, `${tag}.json`), 'utf8'));
const set = base.set || '';
const positive = `${R.promptFor(state, set)}${opt.positive ? `, ${opt.positive}` : ''}`;
const negative = `${R.negativeFor(state, set)}${opt.negative ? `, ${opt.negative}` : ''}`;
const src = join(R.OUT, `${tag}.raw.png`);
const img = stageImage(src);

for (const seed of seeds) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: 'leblanc-x2.safetensors', strength_model: lora, strength_clip: lora } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['10', 1] } },
    11: { class_type: 'LoadImage', inputs: { image: img, upload: 'image' } },
    12: { class_type: 'ImagePadForOutpaint', inputs: { image: ['11', 0], left, top: 0, right, bottom: 0, feathering: feather } },
    14: { class_type: 'VAEEncodeForInpaint', inputs: { pixels: ['12', 0], vae: ['4', 2], mask: ['12', 1], grow_mask_by: 16 } },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['10', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['14', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    // keep the original pixels outside the pad's feathered mask (the first `feather` px of the original
    // at the seam are repainted so the fan joins across it; everything further in stays as rendered)
    16: { class_type: 'ImageCompositeMasked', inputs: { destination: ['12', 0], source: ['8', 0], x: 0, y: 0, resize_source: false, mask: ['12', 1] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/lora-leblanc-outpaint-${state}`, images: ['16', 0] } },
  };
  const out = `${tag}.${name}${seed}`;
  const secs = await R.run(g, join(R.OUT, `${out}.raw.png`));
  const cut = cutout(join(R.OUT, `${out}.raw.png`), join(R.OUT, `${out}.png`));
  const w = base.width + left + right, h = base.height;
  const guard = await C.checkCutoutFile(join(R.OUT, `${out}.png`), { sourceWidth: w, sourceHeight: h, composition: R.STATES[state].composition });
  writeFileSync(join(R.OUT, `${out}.json`), JSON.stringify({
    ...base, tag: out, width: w, height: h, cutout: cut, guard: { ok: guard.ok, reasons: guard.reasons },
    outpaint: { from: `${tag}.raw.png`, name, seed, left, right, feathering: feather, growMask: 16, lora, positive, negative, seconds: secs },
  }, null, 1));
  console.log(`[leblanc-outpaint] ${out} ${secs.toFixed(1)} s ${cut.width}x${cut.height} guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}`);
}
