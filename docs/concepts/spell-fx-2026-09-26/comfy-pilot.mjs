// B1 option A pilot: one original painted effect per element on pure black
// (black drops out under additive blending, so no cutout is needed). Posts a
// plain txt2img graph to the shared ComfyUI; never restarts it. An all-black
// result stops the run (AGENTS.md rule 12).
//   node docs/concepts/spell-fx-2026-09-26/comfy-pilot.mjs [key ...]
import { writeFileSync, mkdirSync } from 'node:fs';
import { SCRATCH } from './lib.mjs';

const HOST = 'http://127.0.0.1:8188';
const OUT = SCRATCH + 'pilot/';
mkdirSync(OUT, { recursive: true });

const STYLE = 'no humans, magic effect, visual effect, painterly, ink wash, gouache, bold brush strokes, glowing, centered, black background, simple background, masterpiece, best quality';
const NEG = 'person, girl, boy, face, character, text, watermark, signature, logo, frame, border, photo, 3d render, lowres, blurry, jpeg artifacts, landscape, scenery, ground, floor, sky, white background, grey background';

const JOBS = {
  fire: 'fire, pillar of flames rising, swirling orange and red fire, embers, sparks, heat',
  ice: 'ice, cluster of sharp blue ice crystals erupting upward, frost shards, cold mist, pale cyan',
  thunder: 'lightning, single thick lightning bolt striking downward, yellow and white electricity, branching arcs',
  water: 'water, splash, ring of water rising, droplets, deep blue and aqua, swirling wave',
  holy: 'holy light, beam of white and gold light from above, radiant rays, feathers of light, halo rings',
  cure: 'healing light, soft green and white sparkles rising, glowing motes, gentle spiral of light, leaves of light',
  slash: 'sword slash, single curved white slash arc, crescent trail, gold ink stroke, speed lines',
  spiral: 'spinning blue energy vortex, spiral of water and light, rising whirlwind, blue and white',
  megaflare: 'huge sphere of blue white energy, violet sparks, plasma beam, shockwave ring, blinding core',
};

const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(JOBS);

function graph(positive, seed) {
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'animagine-xl-4.0-opt.safetensors' } },
    5: { class_type: 'EmptyLatentImage', inputs: { width: 1024, height: 1024, batch_size: 1 } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: `${positive}, ${STYLE}`, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: NEG, clip: ['4', 1] } },
    3: { class_type: 'KSampler', inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['5', 0] } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: 'pyrefly-spellfx/pilot', images: ['8', 0] } },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const key of keys) {
  for (const seed of [11, 22]) {
    const t0 = Date.now();
    const res = await fetch(HOST + '/prompt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: graph(JOBS[key], seed) }) });
    const { prompt_id } = await res.json();
    let img;
    for (let i = 0; i < 600 && !img; i++) {
      await sleep(1000);
      const h = await (await fetch(`${HOST}/history/${prompt_id}`)).json();
      const out = h[prompt_id]?.outputs?.['9']?.images?.[0];
      if (out) img = out;
    }
    if (!img) throw new Error('timeout ' + key);
    const buf = Buffer.from(await (await fetch(`${HOST}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder)}&type=output`)).arrayBuffer());
    const path = `${OUT}${key}-${seed}.png`;
    writeFileSync(path, buf);
    console.log(key, seed, ((Date.now() - t0) / 1000).toFixed(1) + 's', buf.length);
  }
}
