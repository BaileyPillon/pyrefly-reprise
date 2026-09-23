#!/usr/bin/env node
/**
 * Masked repaint of one Ormi pose render (FFX-2 only, Chapter 6): the follow-up the
 * round-3 judge named ("masked repaints, the tool that already worked here",
 * sets/ormi/round3/repaint-heart.mjs), for a defect the words and the pose control did
 * not fix. Everything outside the mask is composited back pixel for pixel
 * (ImageCompositeMasked); no IP-Adapter, no ControlNet.
 *
 *   node docs/concepts/chapters/leblanc/lora/ormi/poses/repaint.mjs <state> <tag> <name>
 *        --ellipse cx,cy,rx,ry[,angle] [--ellipse ...] --seeds a,b --denoise 1 --lora 0.5
 *        --positive "..." --negative "..." [--inpaint 1]
 *        [--poly x,y,x,y,... (repeatable)] [--whole 1] [--feather 3]
 *        [--ref a.png[,b.png] --refWeight 0.5 --refType linear --refStart 0 --refEnd 1]
 *        [--root D:/Tools/pyrefly-lora/ormi/r2/poses --loraFile ormi-x2-r2.safetensors --size WxH]  (round 2)
 *
 * Added 2026-09-23 (the independent judge's redo, judge.md): --poly adds polygon masks,
 * --whole 1 repaints the whole frame (low-denoise img2img, the ko style pass), --ref
 * applies IP-Adapter plus with the given images (batched, concat) as a costume or style
 * reference. Without these flags the graph is exactly the old one.
 *
 * <tag> is D:/Tools/pyrefly-lora/ormi/poses/<state>/<tag>.raw.png; ellipses are in raw
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
const opt = { ellipse: [], poly: [] };
for (let i = 3; i < argv.length; i += 2) {
  const k = argv[i].slice(2);
  if (k === 'ellipse') opt.ellipse.push(argv[i + 1].split(',').map(Number));
  else if (k === 'poly') opt.poly.push(argv[i + 1].split(',').map(Number));
  else opt[k] = argv[i + 1];
}
// Round 2 (2026-09-23): --root D:/Tools/pyrefly-lora/ormi/r2/poses --loraFile ormi-x2-r2.safetensors
// --size 1024x1024 repaint a round-2 render with the r2 LoRA; without them nothing changes.
const dir = join(opt.root || R.OUT, state);
const src = join(dir, `${tag}.raw.png`);
const seeds = String(opt.seeds || '970001').split(',').map(Number);
const denoise = Number(opt.denoise ?? 1);
const lora = Number(opt.lora ?? 0.5);
const inpaint = opt.inpaint === '1';
const positive = `${opt.positive}, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
const negative = `${BASE_NEGATIVE}, ${opt.negative || ''}`;
const mask = join(dir, `${tag}.${name}.mask.png`);
const whole = opt.whole === '1';
const feather = Number(opt.feather ?? 3);
const refs = opt.ref ? String(opt.ref).split(',') : [];
const refWeight = Number(opt.refWeight ?? 0.5);
const refType = opt.refType || 'linear';
const refStart = Number(opt.refStart ?? 0);
const refEnd = Number(opt.refEnd ?? 1);

const py = spawnSync('python', ['-c', `
from PIL import Image, ImageDraw, ImageFilter
import json, sys
import numpy as np
im = Image.open(sys.argv[1]); S = 4
m = np.zeros((im.height, im.width), np.uint8)
if sys.argv[5] == "1":
    m[:] = 255
for e in json.loads(sys.argv[3]):
    cx, cy, rx, ry = e[:4]; ang = e[4] if len(e) > 4 else 0
    layer = Image.new("L", (im.width * S, im.height * S), 0)
    ImageDraw.Draw(layer).ellipse([(cx-rx)*S, (cy-ry)*S, (cx+rx)*S, (cy+ry)*S], fill=255)
    layer = layer.rotate(ang, center=(cx*S, cy*S)).resize(im.size, Image.LANCZOS)
    m = np.maximum(m, np.array(layer))
for pts in json.loads(sys.argv[4]):
    layer = Image.new("L", (im.width * S, im.height * S), 0)
    ImageDraw.Draw(layer).polygon([(pts[i]*S, pts[i+1]*S) for i in range(0, len(pts), 2)], fill=255)
    m = np.maximum(m, np.array(layer.resize(im.size, Image.LANCZOS)))
mm = Image.fromarray(m)
f = float(sys.argv[6])
if f > 0: mm = mm.filter(ImageFilter.GaussianBlur(f))
Image.merge("RGB", (mm, mm, mm)).save(sys.argv[2])
`, src, mask, JSON.stringify(opt.ellipse), JSON.stringify(opt.poly), whole ? '1' : '0', String(feather)], { encoding: 'utf8' });
if (py.status !== 0) throw new Error(py.stderr);

const img = stageImage(src);
const msk = stageImage(mask);
const refStaged = refs.map((r) => stageImage(r));
for (const seed of seeds) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: opt.loraFile || 'ormi-x2.safetensors', strength_model: lora, strength_clip: lora } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['10', 1] } },
    11: { class_type: 'LoadImage', inputs: { image: img, upload: 'image' } },
    12: { class_type: 'LoadImage', inputs: { image: msk, upload: 'image' } },
    13: { class_type: 'ImageToMask', inputs: { image: ['12', 0], channel: 'red' } },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: inpaint ? 1 : denoise, model: refs.length ? ['23', 0] : ['10', 0], positive: ['6', 0], negative: ['7', 0], latent_image: inpaint ? ['14', 0] : ['15', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    16: { class_type: 'ImageCompositeMasked', inputs: { destination: ['11', 0], source: ['8', 0], x: 0, y: 0, resize_source: false, mask: ['13', 0] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/lora-ormi-repaint-${state}`, images: ['16', 0] } },
  };
  if (refs.length) {
    refStaged.forEach((r, i) => { g[40 + i] = { class_type: 'LoadImage', inputs: { image: r, upload: 'image' } }; });
    let img0 = ['40', 0];
    for (let i = 1; i < refStaged.length; i++) { g[50 + i] = { class_type: 'ImageBatch', inputs: { image1: img0, image2: [String(40 + i), 0] } }; img0 = [String(50 + i), 0]; }
    g[21] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: 'ip-adapter-plus_sdxl_vit-h.safetensors' } };
    g[22] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors' } };
    g[23] = { class_type: 'IPAdapterAdvanced', inputs: { model: ['10', 0], ipadapter: ['21', 0], image: img0, weight: refWeight, weight_type: refType, combine_embeds: 'concat', start_at: refStart, end_at: refEnd, embeds_scaling: 'K+V', clip_vision: ['22', 0] } };
  }
  if (inpaint) g[14] = { class_type: 'VAEEncodeForInpaint', inputs: { pixels: ['11', 0], vae: ['4', 2], mask: ['13', 0], grow_mask_by: 8 } };
  else {
    g[17] = { class_type: 'VAEEncode', inputs: { pixels: ['11', 0], vae: ['4', 2] } };
    g[15] = { class_type: 'SetLatentNoiseMask', inputs: { samples: ['17', 0], mask: ['13', 0] } };
  }
  const out = `${tag}.${name}${seed}`;
  const secs = await R.run(g, join(dir, `${out}.raw.png`));
  const s = opt.size ? { ...R.STATES[state], size: opt.size.split('x').map(Number) } : R.STATES[state];
  const cut = cutout(join(dir, `${out}.raw.png`), join(dir, `${out}.png`));
  const guard = await C.checkCutoutFile(join(dir, `${out}.png`), { sourceWidth: s.size[0], sourceHeight: s.size[1], composition: s.composition });
  const base = JSON.parse(readFileSync(join(dir, `${tag}.json`), 'utf8'));
  writeFileSync(join(dir, `${out}.json`), JSON.stringify({
    ...base, tag: out, cutout: cut, guard: { ok: guard.ok, reasons: guard.reasons },
    repaint: { from: `${tag}.raw.png`, name, seed, ellipses: opt.ellipse, polygons: opt.poly, whole, feather, ref: refs.length ? { images: refs, weight: refWeight, type: refType, start: refStart, end: refEnd } : null, inpaint, denoise: inpaint ? 1 : denoise, lora, positive, negative, seconds: secs },
  }, null, 1));
  console.log(`[ormi-repaint] ${out} ${secs.toFixed(1)} s guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}`);
}
