#!/usr/bin/env node
/**
 * Leblanc round 3, repair step (FFX-2 only). The pilot-2 judge's named next tool
 * when one costume part still drifts after the text fix: "a small masked repaint
 * of only the obi (or only the feet) at denoise about 0.45 ... and no face in the
 * mask" (docs/concepts/chapters/leblanc/pilot2/judge.md). Same graph as pilot 2's
 * D stage 2 (SetLatentNoiseMask + ImageCompositeMasked, so only the masked box can
 * change), pass-b words, both idle references at 0.4 over the whole window.
 *
 *   node docs/concepts/chapters/leblanc/sets/leblanc/round3/repaint-r3.mjs \
 *     <src tag> <x,y,w,h in RAW frame pixels> <denoise> "<what the box should paint>" <seed,...> [out suffix]
 *
 * Reads renders/<src tag>.raw.png; writes renders/<src tag>.<suffix><n>.{raw.png,png,json}.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  stageImage,
  cutout,
  waitForServer,
  escapeTags,
  joinTags,
  STYLE_TAGS,
  QUALITY_TAGS,
  SPRITE_NEGATIVE,
} from '../../../../../../../tools/gen/comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const R = join(HERE, 'renders');
const PILOT2 = join(ROOT, 'docs/concepts/chapters/leblanc/pilot2');
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const BASE = `http://${process.env.COMFY_HOST || '127.0.0.1'}:${process.env.COMFY_PORT || 8188}`;
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const IPA = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPV = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const IDENTITY = readFileSync(join(HERE, 'identity-b.txt'), 'utf8').trim();
const EMPHASIS = readFileSync(join(HERE, 'emphasis.txt'), 'utf8').trim();
const NEG =
  'gold obi, yellow sash, gold sash, lace, red lining, pink lining, magenta, floral print, tan, orange fan, gold fan, white fan, wooden fan, beige fan, closed-toe boots, multiple views, 2girls, tribal tattoo, kanji, argyle, quilted, plaid, belt, buckle';

const [srcTag, boxArg, denoiseArg, tags, seedsArg, suffix = 'p'] = process.argv.slice(2);
const denoise = Number(denoiseArg);
const seeds = String(seedsArg).split(',').map(Number);
const src = join(R, `${srcTag}.raw.png`);

function py(script, args) {
  const r = spawnSync(PY, ['-s', script, ...args], { encoding: 'utf8', cwd: ROOT });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return r.stdout.trim();
}
const CLIENT_ID = createHash('sha1').update(`r3p-${process.pid}-${Date.now()}`).digest('hex');
async function queue(g) {
  const res = await fetch(`${BASE}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: g, client_id: CLIENT_ID }) });
  const t = await res.text();
  if (!res.ok) throw new Error(`rejected ${res.status}: ${t}`);
  return JSON.parse(t).prompt_id;
}
async function result(id) {
  const deadline = Date.now() + 3 * 3600_000;
  for (;;) {
    const e = (await (await fetch(`${BASE}/history/${id}`)).json())[id];
    if (e?.status?.status_str === 'error') throw new Error(JSON.stringify(e.status.messages));
    if (e?.outputs && Object.keys(e.outputs).length) {
      for (const n of Object.values(e.outputs))
        for (const img of n.images || []) {
          const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
          return Buffer.from(await (await fetch(`${BASE}/view?${q}`)).arrayBuffer());
        }
    }
    if (Date.now() > deadline) throw new Error(`timeout ${id}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

await waitForServer(60_000);
const mask = join(R, `${srcTag}.${suffix}.mask.png`);
py(join(PILOT2, 'tools2.py'), ['boxmask', src, boxArg, mask]);
const positive = joinTags(escapeTags(IDENTITY), tags, EMPHASIS, 'simple background, white background', STYLE_TAGS, QUALITY_TAGS);
const negative = joinTags(SPRITE_NEGATIVE, NEG);
const srcName = stageImage(src);
const maskName = stageImage(mask);
const sq = stageImage(join(PILOT2, 'refs/idle-square.png'));
const head = stageImage(join(PILOT2, 'refs/idle-head.png'));
for (const [i, seed] of seeds.entries()) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoadImage', inputs: { image: srcName, upload: 'image' } },
    11: { class_type: 'LoadImageMask', inputs: { image: maskName, channel: 'red', upload: 'image' } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['4', 1] } },
    12: { class_type: 'VAEEncode', inputs: { pixels: ['10', 0], vae: ['4', 2] } },
    13: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['12', 0], mask: ['11', 0] } },
    20: { class_type: 'LoadImage', inputs: { image: sq, upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: head, upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPA } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPV } },
    23: {
      class_type: 'IPAdapterAdvanced',
      inputs: { model: ['4', 0], ipadapter: ['21', 0], image: ['25', 0], weight: 0.4, weight_type: 'linear', combine_embeds: 'concat', start_at: 0, end_at: 1, embeds_scaling: 'K+V', clip_vision: ['22', 0] },
    },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise, model: ['23', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['13', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    14: { class_type: 'ImageCompositeMasked', inputs: { destination: ['10', 0], source: ['8', 0], x: 0, y: 0, resize_source: false, mask: ['11', 0] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: 'pyrefly/leblanc_r3_repaint', images: ['14', 0] } },
  };
  const t0 = Date.now();
  const buf = await result(await queue(g));
  const tag = `${srcTag}.${suffix}${i + 1}`;
  const raw = join(R, `${tag}.raw.png`);
  writeFileSync(raw, buf);
  if (Number(py(join(PILOT2, 'tools2.py'), ['maxrgb', raw])) === 0) throw new Error(`${tag}: BLACK FRAME`);
  let cut = null;
  try {
    cut = cutout(raw, join(R, `${tag}.png`), 16);
  } catch (e) {
    process.stderr.write(`[r3p] ${tag}: cutout failed: ${e.message}\n`);
  }
  writeFileSync(
    join(R, `${tag}.json`),
    JSON.stringify({
      tag, method: 'F + masked repaint (pilot2 judge: next tool)', source: `renders/${srcTag}.raw.png`, box: boxArg, denoise, seed,
      maskFeather: 'tools2.py boxmask (Gaussian 10 px)', ref: { images: ['pilot2/refs/idle-square.png', 'pilot2/refs/idle-head.png'], weight: 0.4, window: [0, 1], type: 'linear' },
      positive, negative, model: CKPT, cutout: cut, seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString(),
    }, null, 2) + '\n',
  );
  process.stderr.write(`[r3p] ${tag} done\n`);
}
