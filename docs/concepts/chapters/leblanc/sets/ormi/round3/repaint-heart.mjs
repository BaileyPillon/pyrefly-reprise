#!/usr/bin/env node
/**
 * Ormi round 3, last step (FFX-2 only): a small masked repaint of ONLY the
 * shield face, to put the Syndicate heart (research/ffx2-leblanc-syndicate.md
 * §10.1: "a large shield worn on his back, bearing the Syndicate heart logo")
 * on a method-F candidate whose shield came back without one. This is the
 * follow-up the Leblanc pilot 2 judge named for a drift the words did not fix
 * ("a small masked repaint of only the obi ... at denoise about 0.45 ... no
 * face in the mask"). The mask is an ellipse on the shield face, no face or
 * costume inside it; everything outside the mask is composited back
 * pixel-for-pixel (ImageCompositeMasked). No IP-Adapter.
 *
 *   node docs/concepts/chapters/leblanc/sets/ormi/round3/repaint-heart.mjs <tag> <cx,cy,rx,ry> <denoise> <seed> [angleDeg]
 *
 * <tag> is a renders/<tag>.raw.png; the ellipse is in raw-frame pixels.
 * Writes renders/<tag>.heart<seed>.raw.png / .png / .json and the mask.
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const G = await import(pathToFileURL(join(ROOT, 'tools/gen/comfy.mjs')).href);
const { stageImage, cutout, waitForServer, STYLE_TAGS, QUALITY_TAGS, BASE_NEGATIVE } = G;
const R = join(HERE, 'renders');
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const BASE = `http://${process.env.COMFY_HOST || '127.0.0.1'}:${process.env.COMFY_PORT || 8188}`;
const CKPT = 'animagine-xl-4.0-opt.safetensors';

const POSITIVE = [
  'round shield, studded rim, gold rim, (large red heart emblem:1.35), (heart symbol:1.2), heart, emblem painted on shield',
  STYLE_TAGS,
  QUALITY_TAGS,
].join(', ');
const NEGATIVE = `${BASE_NEGATIVE}, face, head, eyes, hand, person, text, letters, star, cross, skull, flower, sunburst, spokes`;

const [tag, box, denoiseArg, seedArg, angleArg] = process.argv.slice(2);
const [cx, cy, rx, ry] = box.split(',').map(Number);
const denoise = Number(denoiseArg);
const seed = Number(seedArg);
const angle = Number(angleArg || 0);
const src = join(R, `${tag}.raw.png`);
const mask = join(R, `${tag}.heart${seed}.mask.png`);

const py = spawnSync(PY, ['-s', '-c', `
from PIL import Image, ImageDraw, ImageFilter
im = Image.open(r"${src}")
m = Image.new("L", (im.width * 4, im.height * 4), 0)
d = ImageDraw.Draw(m)
d.ellipse([(${cx}-${rx})*4, (${cy}-${ry})*4, (${cx}+${rx})*4, (${cy}+${ry})*4], fill=255)
m = m.rotate(${angle}, center=(${cx}*4, ${cy}*4)).resize(im.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(4))
Image.merge("RGB", (m, m, m)).save(r"${mask}")
`], { encoding: 'utf8' });
if (py.status !== 0) throw new Error(py.stderr);

async function queue(workflow) {
  const res = await fetch(`${BASE}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: workflow }) });
  const t = await res.text();
  if (!res.ok) throw new Error(`rejected ${res.status}: ${t}`);
  return JSON.parse(t).prompt_id;
}
async function result(id) {
  for (;;) {
    const e = (await (await fetch(`${BASE}/history/${id}`)).json())[id];
    if (e?.status?.status_str === 'error') throw new Error(JSON.stringify(e.status.messages));
    for (const n of Object.values(e?.outputs || {})) {
      for (const img of n.images || []) {
        const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
        return Buffer.from(await (await fetch(`${BASE}/view?${q}`)).arrayBuffer());
      }
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
}

await waitForServer(60_000);
const g = {
  4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
  10: { class_type: 'LoadImage', inputs: { image: stageImage(src), upload: 'image' } },
  11: { class_type: 'LoadImageMask', inputs: { image: stageImage(mask), channel: 'red', upload: 'image' } },
  6: { class_type: 'CLIPTextEncode', inputs: { text: POSITIVE, clip: ['4', 1] } },
  7: { class_type: 'CLIPTextEncode', inputs: { text: NEGATIVE, clip: ['4', 1] } },
  12: { class_type: 'VAEEncode', inputs: { pixels: ['10', 0], vae: ['4', 2] } },
  13: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['12', 0], mask: ['11', 0] } },
  3: {
    class_type: 'KSampler',
    inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['13', 0] },
  },
  8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
  14: { class_type: 'ImageCompositeMasked', inputs: { destination: ['10', 0], source: ['8', 0], x: 0, y: 0, resize_source: false, mask: ['11', 0] } },
  9: { class_type: 'SaveImage', inputs: { filename_prefix: 'pyrefly/ormi_r3_heart', images: ['14', 0] } },
};
const t0 = Date.now();
const buf = await result(await queue(g));
const out = join(R, `${tag}.heart${seed}`);
writeFileSync(`${out}.raw.png`, buf);
const cut = cutout(`${out}.raw.png`, `${out}.png`, 16);
writeFileSync(`${out}.json`, JSON.stringify({
  tag: `${tag}.heart${seed}`, method: 'F + masked shield-face repaint', source: `renders/${tag}.raw.png`,
  mask: { ellipse: { cx, cy, rx, ry, angle }, feather: 4 }, denoise, seed, positive: POSITIVE, negative: NEGATIVE,
  model: CKPT, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal', cutout: cut,
  seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString(),
}, null, 2) + '\n');
process.stderr.write(`[ormi-r3 heart] ${tag}.heart${seed} done\n`);
