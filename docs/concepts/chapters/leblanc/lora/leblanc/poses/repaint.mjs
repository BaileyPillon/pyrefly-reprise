#!/usr/bin/env node
/**
 * Masked repaint of one Leblanc pose render (FFX-2 only, Chapter 6): the follow-up the
 * round-3 judge named ("masked repaints, the tool that already worked here",
 * sets/ormi/round3/repaint-heart.mjs), for a defect the words and the pose control did
 * not fix. Everything outside the mask is composited back pixel for pixel
 * (ImageCompositeMasked); no IP-Adapter, no ControlNet.
 *
 *   node docs/concepts/chapters/leblanc/lora/leblanc/poses/repaint.mjs <state> <tag> <name>
 *        --ellipse cx,cy,rx,ry[,angle] [--ellipse ...] --seeds a,b --denoise 1 --lora 0.5
 *        --positive "..." --negative "..." [--inpaint 1]
 *
 * <tag> is D:/Tools/pyrefly-lora/leblanc/poses/<tag>.raw.png; ellipses are in raw
 * pixels. --inpaint 1 uses VAEEncodeForInpaint (fills the hole from scratch, denoise 1);
 * otherwise VAEEncode + SetLatentNoiseMask at --denoise. Writes <tag>.<name><seed>.raw.png,
 * the cut-out, the mask and a sidecar beside the source.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const G = await import(pathToFileURL(join(REPO, 'tools/gen/comfy.mjs')).href);
const C = await import(pathToFileURL(join(REPO, 'tools/gen/cutout-guard.mjs')).href);
const R = await import(pathToFileURL(join(HERE, 'render.mjs')).href);
const { stageImage, cutout, STYLE_TAGS, QUALITY_TAGS, BASE_NEGATIVE } = G;
const CKPT = 'animagine-xl-4.0-opt.safetensors';

const argv = process.argv.slice(2);
const [state, tag, name] = argv;
const opt = { ellipse: [] };
for (let i = 3; i < argv.length; i += 2) {
  const k = argv[i].slice(2);
  if (k === 'ellipse') opt.ellipse.push(argv[i + 1].split(',').map(Number));
  else opt[k] = argv[i + 1];
}
const dir = R.OUT;
const src = join(dir, `${tag}.raw.png`);
const seeds = String(opt.seeds || '970001').split(',').map(Number);
const denoise = Number(opt.denoise ?? 1);
const lora = Number(opt.lora ?? 0.5);
const inpaint = opt.inpaint === '1';
const positive = `leblancX2, ${opt.positive}, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
const negative = `${BASE_NEGATIVE}, ${opt.negative || ''}`;
const mask = join(dir, `${tag}.${name}.mask.png`);

const py = spawnSync('python', ['-c', `
from PIL import Image, ImageDraw, ImageFilter
import json, sys
im = Image.open(sys.argv[1]); S = 4
m = Image.new("L", im.size, 0)
for e in json.loads(sys.argv[3]):
    cx, cy, rx, ry = e[:4]; ang = e[4] if len(e) > 4 else 0
    layer = Image.new("L", (im.width * S, im.height * S), 0)
    ImageDraw.Draw(layer).ellipse([(cx-rx)*S, (cy-ry)*S, (cx+rx)*S, (cy+ry)*S], fill=255)
    layer = layer.rotate(ang, center=(cx*S, cy*S)).resize(im.size, Image.LANCZOS)
    m = Image.fromarray(__import__("numpy").maximum(__import__("numpy").array(m), __import__("numpy").array(layer)))
m = m.filter(ImageFilter.GaussianBlur(3))
Image.merge("RGB", (m, m, m)).save(sys.argv[2])
`, src, mask, JSON.stringify(opt.ellipse)], { encoding: 'utf8' });
if (py.status !== 0) throw new Error(py.stderr);

const img = stageImage(src);
const msk = stageImage(mask);
for (const seed of seeds) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: 'leblanc-x2.safetensors', strength_model: lora, strength_clip: lora } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['10', 1] } },
    11: { class_type: 'LoadImage', inputs: { image: img, upload: 'image' } },
    12: { class_type: 'LoadImage', inputs: { image: msk, upload: 'image' } },
    13: { class_type: 'ImageToMask', inputs: { image: ['12', 0], channel: 'red' } },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: inpaint ? 1 : denoise, model: ['10', 0], positive: ['6', 0], negative: ['7', 0], latent_image: inpaint ? ['14', 0] : ['15', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    16: { class_type: 'ImageCompositeMasked', inputs: { destination: ['11', 0], source: ['8', 0], x: 0, y: 0, resize_source: false, mask: ['13', 0] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/lora-leblanc-repaint-${state}`, images: ['16', 0] } },
  };
  if (inpaint) g[14] = { class_type: 'VAEEncodeForInpaint', inputs: { pixels: ['11', 0], vae: ['4', 2], mask: ['13', 0], grow_mask_by: 8 } };
  else {
    g[17] = { class_type: 'VAEEncode', inputs: { pixels: ['11', 0], vae: ['4', 2] } };
    g[15] = { class_type: 'SetLatentNoiseMask', inputs: { samples: ['17', 0], mask: ['13', 0] } };
  }
  const out = `${tag}.${name}${seed}`;
  const secs = await R.run(g, join(dir, `${out}.raw.png`));
  const s = R.STATES[state];
  const cut = cutout(join(dir, `${out}.raw.png`), join(dir, `${out}.png`));
  const guard = await C.checkCutoutFile(join(dir, `${out}.png`), { sourceWidth: s.size[0], sourceHeight: s.size[1], composition: s.composition });
  const base = JSON.parse(readFileSync(join(dir, `${tag}.json`), 'utf8'));
  writeFileSync(join(dir, `${out}.json`), JSON.stringify({
    ...base, tag: out, cutout: cut, guard: { ok: guard.ok, reasons: guard.reasons },
    repaint: { from: `${tag}.raw.png`, name, seed, ellipses: opt.ellipse, feather: 3, inpaint, denoise: inpaint ? 1 : denoise, lora, positive, negative, seconds: secs },
  }, null, 1));
  console.log(`[leblanc-repaint] ${out} ${secs.toFixed(1)} s guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}`);
}
