// Scratch: masked repaint (SetLatentNoiseMask) with a full-frame mask image. ComfyUI native nodes only.
// node inpaint_mask.mjs <image> <mask> <denoise> <seed> <out.png> <positive> <negative>
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
const BASE = 'http://127.0.0.1:8188';
const IN = 'D:/Tools/ComfyUI/ComfyUI/input';
const [img, mask, denoise, seed, out, pos, neg] = process.argv.slice(2);
const stage = (p) => { const h = createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 10); const n = `pyrefly_ch7plate_${h}_${basename(p)}`; copyFileSync(p, `${IN}/${n}`); return n; };
const g = {
  1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'animagine-xl-4.0-opt.safetensors' } },
  2: { class_type: 'LoadImage', inputs: { image: stage(img) } },
  3: { class_type: 'LoadImageMask', inputs: { image: stage(mask), channel: 'red' } },
  4: { class_type: 'VAEEncode', inputs: { pixels: ['2', 0], vae: ['1', 2] } },
  5: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['4', 0], mask: ['3', 0] } },
  6: { class_type: 'CLIPTextEncode', inputs: { text: pos, clip: ['1', 1] } },
  7: { class_type: 'CLIPTextEncode', inputs: { text: neg, clip: ['1', 1] } },
  8: { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['5', 0], seed: Number(seed), steps: 30, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: Number(denoise) } },
  9: { class_type: 'VAEDecode', inputs: { samples: ['8', 0], vae: ['1', 2] } },
  10: { class_type: 'SaveImage', inputs: { images: ['9', 0], filename_prefix: 'pyrefly/ch7plate' } },
};
const q = async () => { const j = await (await fetch(`${BASE}/queue`)).json(); return j.queue_pending.length; };
while ((await q()) >= 3) await new Promise((r) => setTimeout(r, 10000));
const r = await fetch(`${BASE}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: g }) });
const { prompt_id: id, error } = await r.json(); if (error) throw new Error(JSON.stringify(error));
const t0 = Date.now();
for (;;) {
  const h = (await (await fetch(`${BASE}/history/${id}`)).json())[id];
  if (h?.status?.status_str === 'error') throw new Error(JSON.stringify(h.status));
  const im = h && Object.values(h.outputs || {}).flatMap((o) => o.images || [])[0];
  if (im) { const b = Buffer.from(await (await fetch(`${BASE}/view?${new URLSearchParams({ filename: im.filename, subfolder: im.subfolder, type: im.type })}`)).arrayBuffer()); writeFileSync(out, b); break; }
  if (Date.now() - t0 > 900000) throw new Error('timeout'); await new Promise((r) => setTimeout(r, 1000));
}
writeFileSync(out.replace(/\.png$/, '.json'), JSON.stringify({ img, mask, denoise: Number(denoise), seed: Number(seed), positive: pos, negative: neg, model: 'animagine-xl-4.0-opt.safetensors', steps: 30, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal', seconds: (Date.now() - t0) / 1000 }, null, 1));
console.log(out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
