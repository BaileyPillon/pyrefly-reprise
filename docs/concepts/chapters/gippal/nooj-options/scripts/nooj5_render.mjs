#!/usr/bin/env node
/**
 * Nooj shade attempt 5 (FFX-2 only, Den of Woe), METHOD-nooj-2.md. Candidates only; nothing is installed.
 *
 *   node nooj5_render.mjs <pose> <arm> <seed>[,<seed>...] [--cn 0.8] [--idleRef <png>] [--dry]
 *   pose: idle-lean | idle-upright | idle-glasses | cast;  arm: A (base) | B (A + regions) | C (B over the block-in, denoise 0.7)
 *
 * Graph (core nodes + the installed IP-Adapter node): Animagine XL 4.0 Opt -> IPAdapterAdvanced (the portrait
 * square-padded on white + a square head crop, batched, concat; the cast adds the chosen idle square-padded; 0.5,
 * ease in, 0.2..0.8, K+V, forced on) -> KSampler; positive = base prompt, plus for arms B and C three
 * ConditioningSetMask regions (far-shoulder fur mantle, near machina arm, near piston shin) combined with it; then
 * ControlNetApplyAdvanced (xinsir OpenPose SDXL) with the pose's skeleton from nooj5_prep.py.
 * Shared ComfyUI: never more than 3 prompts pending; never restarted; an all-black frame stops the run.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SPRITE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout } from 'file:///D:/Final%20Fantasy/tools/gen/comfy.mjs';
import { checkCutoutFile } from 'file:///D:/Final%20Fantasy/tools/gen/cutout-guard.mjs';
import { maxRgbOfPng, isBlackFrame } from 'file:///D:/Final%20Fantasy/tools/gen/black-frame.mjs';

const OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj5';
const PREP = 'D:/Tools/pyrefly-scratch/nooj5/prep';
const COMFY = 'http://127.0.0.1:8188';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const flag = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const IPA = { weight: Number(flag('ipa', 0.5)), type: 'ease in', start: 0.2, end: 0.8, scaling: 'K+V' };
const CN = Number(flag('cn', 0.8));
const DENOISE_C = Number(flag('denoise', 0.72));
const IDLE_REF = flag('idleRef', '');
const EXTRA = flag('extra', '');

/** Identity read off the picked portrait and bible 1.23.4, in the portrait's own tags; no sided words, no effect words. */
const IDENTITY = 'nooj \\(ff10-2\\), final fantasy x-2, male focus, (mature male:1.2), adult man, tall, broad shoulders, masculine angular face, sharp jawline, brown hair, hair rings, ' +
  'red hair ties, sidelocks, medium ponytail, rimless glasses, blue-tinted glasses, blue eyes, red high collar, crimson bodysuit, ' +
  'red and black belts, multiple belts, fur-trimmed sleeve, purple sleeve, grey fur, (mechanical arm:1.2), prosthetic arm, black glove, human ears, five fingers, silver cane, purple boots';
const POSE_TAGS = {
  'idle-lean': 'standing, leaning on cane, holding cane, hand on cane, cane on ground, legs apart, serious, closed mouth',
  'idle-upright': 'standing, holding cane, cane on ground, hand on own hip, legs apart, serious, closed mouth',
  'idle-glasses': 'standing, adjusting eyewear, hand on eyewear, holding cane, cane on ground, legs apart, calm, closed mouth',
  cast: 'outstretched arm, arm extended forward, pointing cane forward, holding cane, legs apart, serious, v-shaped eyebrows, closed mouth',
};
const REGIONS = {
  fur: '1boy, (grey fur:1.2), fur collar, fur-trimmed shoulder, purple sleeve',
  arm: '1boy, (mechanical arm:1.3), robot arm, prosthetic arm, thin metal arm, exposed joints, grey metal, mechanical hand',
  shin: '1boy, mechanical leg, metal leg, piston, exposed joints',
};
const NEG = `${SPRITE_NEGATIVE}, multiple views, 2boys, 1girl, chibi, sketch, monochrome, 3d, realistic, cropped, from behind, facing away, ` +
  '1girl, female, feminine, androgynous, cape, cloak, capelet, long coat, pointy ears, elf ears, claws, talons, hooves, high heels, bulky mechanical arm, gauntlet, pauldron, greaves, armored boots, plate armor, ' +
  'very long hair, knee-length ponytail, absurdly long hair, sword, gun, spear, blade, wings, cape, hood, hat, helmet, sunglasses, black glasses, ' +
  'blonde hair, red hair, orange hair, beard, breasts, magic circle, glowing, fire, flames, swirl, lightning, dark aura';

const SIZE = { cast: [1152, 1216] };
const sizeFor = (pose) => SIZE[pose] || [832, 1216];
const positive = (pose) => `1boy, solo, ${POSE_TAGS[pose]}, ${IDENTITY}${EXTRA ? ', ' + EXTRA : ''}, three-quarter view, looking at viewer, full body, feet visible, simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`;

function graph({ pose, arm, seed, refs, prefix, staged }) {
  const [width, height] = sizeFor(pose);
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive(pose), clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: NEG, clip: ['4', 1] } },
    30: { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } },
    31: { class_type: 'LoadImage', inputs: { image: staged.skel, upload: 'image' } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };
  // IP-Adapter refs, batched
  refs.forEach((r, i) => { g[200 + i] = { class_type: 'LoadImage', inputs: { image: r, upload: 'image' } }; });
  let batch = ['200', 0];
  for (let i = 1; i < refs.length; i++) { g[210 + i] = { class_type: 'ImageBatch', inputs: { image1: batch, image2: [String(200 + i), 0] } }; batch = [String(210 + i), 0]; }
  g[23] = { class_type: 'IPAdapterAdvanced', inputs: { model: ['4', 0], ipadapter: ['21', 0], image: batch, weight: IPA.weight, weight_type: IPA.type, combine_embeds: 'concat', start_at: IPA.start, end_at: IPA.end, embeds_scaling: IPA.scaling, clip_vision: ['22', 0] } };
  // regions
  let pos = ['6', 0];
  if (arm === 'B' || arm === 'C') {
    let n = 100;
    for (const [r, text] of Object.entries(REGIONS)) {
      g[n] = { class_type: 'CLIPTextEncode', inputs: { text, clip: ['4', 1] } };
      g[n + 1] = { class_type: 'LoadImageMask', inputs: { image: staged.masks[r], channel: 'red', upload: 'image' } };
      g[n + 2] = { class_type: 'ConditioningSetMask', inputs: { conditioning: [String(n), 0], mask: [String(n + 1), 0], strength: 1.0, set_cond_area: 'default' } };
      g[n + 3] = { class_type: 'ConditioningCombine', inputs: { conditioning_1: pos, conditioning_2: [String(n + 2), 0] } };
      pos = [String(n + 3), 0]; n += 10;
    }
  }
  g[32] = { class_type: 'ControlNetApplyAdvanced', inputs: { positive: pos, negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: CN, start_percent: 0, end_percent: 1, vae: ['4', 2] } };
  let latent; let denoise = 1;
  if (arm === 'C') {
    g[40] = { class_type: 'LoadImage', inputs: { image: staged.blockin, upload: 'image' } };
    g[41] = { class_type: 'VAEEncode', inputs: { pixels: ['40', 0], vae: ['4', 2] } };
    latent = ['41', 0]; denoise = DENOISE_C;
  } else {
    g[5] = { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } };
    latent = ['5', 0];
  }
  g[3] = { class_type: 'KSampler', inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise, model: ['23', 0], positive: ['32', 0], negative: ['32', 1], latent_image: latent } };
  return { g, denoise };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pending() {
  try { const q = await (await fetch(`${COMFY}/queue`)).json(); return q.queue_pending?.length || 0; } catch { return 99; }
}

async function main() {
  const [pose, arm, seedArg] = process.argv.slice(2);
  if (!POSE_TAGS[pose] || !['A', 'B', 'C'].includes(arm)) throw new Error('usage: <pose> <A|B|C> <seeds>');
  const seeds = seedArg.split(',').map(Number);
  const tag = flag('tag', '');
  const dir = join(OUT, pose, arm + (tag ? `-${tag}` : ''));
  const staged = {
    skel: stageImage(`${PREP}/skel-${pose}.png`),
    blockin: stageImage(`${PREP}/blockin-${pose}.png`),
    masks: Object.fromEntries(['fur', 'arm', 'shin'].map((r) => [r, stageImage(`${PREP}/mask-${pose}-${r}.png`)])),
  };
  const refFiles = [`${PREP}/ref-portrait-square.png`, `${PREP}/ref-portrait-head.png`, ...(IDLE_REF ? [IDLE_REF] : [])];
  const refs = refFiles.map((f) => stageImage(f));
  if (process.argv.includes('--dry')) { console.log(positive(pose), '\n-', NEG, staged, refs); return; }
  mkdirSync(dir, { recursive: true });
  const jobs = seeds.filter((s) => !existsSync(join(dir, `cand-${s}.json`))).map((seed) => ({ seed }));
  const inflight = []; let stop = false;
  while ((jobs.length || inflight.length) && !stop) {
    while (jobs.length && inflight.length < 3 && (await pending()) < 3) {
      const j = jobs.shift();
      const { g, denoise } = graph({ pose, arm, seed: j.seed, refs, staged, prefix: `pyrefly/nooj5/${pose}-${arm}` });
      const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: g, client_id: 'pyrefly-nooj5' }) });
      const body = await res.json();
      if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body).slice(0, 2000)}`);
      inflight.push({ ...j, denoise, id: body.prompt_id, t0: Date.now() });
      console.log(`[nooj5] queued ${pose}/${arm} seed ${j.seed}`);
    }
    await sleep(2500);
    for (const j of [...inflight]) {
      const e = (await (await fetch(`${COMFY}/history/${j.id}`)).json())[j.id];
      if (!e) continue;
      if (e.status?.status_str === 'error') { console.error(`[nooj5] FAILED ${JSON.stringify(e.status.messages).slice(0, 1500)}`); inflight.splice(inflight.indexOf(j), 1); continue; }
      const img = Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
      if (!img) continue;
      inflight.splice(inflight.indexOf(j), 1);
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      const raw = join(dir, `cand-${j.seed}.raw.png`); const cut = join(dir, `cand-${j.seed}.png`);
      writeFileSync(raw, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      const maxRgb = maxRgbOfPng(readFileSync(raw));
      const black = maxRgb != null && isBlackFrame(maxRgb);
      if (black) { writeFileSync(join(OUT, 'STOP-BLACK.txt'), `${new Date().toISOString()} ${pose}/${arm}#${j.seed} all-black (maxRgb ${maxRgb})\n`, { flag: 'a' }); stop = true; }
      const [w, h] = sizeFor(pose);
      let cutMeta = null; let guard = { ok: false, reasons: ['black frame'] };
      if (!black) { cutMeta = cutout(raw, cut); guard = await checkCutoutFile(cut, { sourceWidth: w, sourceHeight: h, composition: 'full' }); }
      const side = {
        game: 'ffx2', subject: 'nooj-shade', state: pose.startsWith('idle') ? 'idle' : 'cast', stance: pose, arm, seed: j.seed, status: 'CANDIDATE',
        method: 'docs/concepts/chapters/gippal/production/METHOD-nooj-2.md',
        controlnet: { file: CONTROLNET, strength: CN, start: 0, end: 1, skeleton: `nooj5_prep.py skel-${pose}.png` },
        ipadapter: { file: IPADAPTER, ...IPA, combine: 'concat', images: refFiles.map((f) => f.split('/').pop()), forced: true },
        regions: arm === 'A' ? null : Object.fromEntries(Object.entries(REGIONS).map(([r, t]) => [r, { text: t, mask: `mask-${pose}-${r}.png`, strength: 1.0 }])),
        img2img: arm === 'C' ? { image: `blockin-${pose}.png`, denoise: j.denoise } : null,
        positive: positive(pose), negative: NEG, model: CKPT, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
        width: w, height: h, facing: 'left', maxRgb, black, cutout: cutMeta, guard: { ok: guard.ok, reasons: guard.reasons },
        seconds: (Date.now() - j.t0) / 1000, generatedAt: new Date().toISOString(),
      };
      writeFileSync(join(dir, `cand-${j.seed}.json`), JSON.stringify(side, null, 1));
      console.log(`[nooj5] ${pose}/${arm} seed ${j.seed}: ${cutMeta ? `${cutMeta.width}x${cutMeta.height}` : '-'} guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}${black ? ' BLACK' : ''} ${Math.round(side.seconds)}s`);
    }
  }
  if (stop) { console.error('[nooj5] BLACK FRAME: stopped'); process.exit(3); }
}
await main();
