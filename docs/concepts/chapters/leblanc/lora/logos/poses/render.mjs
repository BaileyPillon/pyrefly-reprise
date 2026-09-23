#!/usr/bin/env node
/**
 * Chapter 6 art (FFX-2 only): Logos's four battle states painted with the logos-x2
 * identity LoRA and an OpenPose skeleton per state. Every output is a CANDIDATE.
 *
 *   node render.mjs <attack|cast|hurt|ko|all> [--seeds 6] [--lora 0.8] [--cn 0.6] [--ref 0.3] [--tag r1] [--seed0 N] [--pose <stem of a *-pose.png>] [--extra "<pose tags>"] [--negextra "<tags>"]
 *
 * Graph (core ComfyUI nodes + the installed IP-Adapter node):
 *   CheckpointLoaderSimple (Animagine XL 4.0 Opt)
 *   -> LoraLoader logos-x2.safetensors (step 2000, sha256 2252538f...; model and clip)
 *   -> IPAdapterAdvanced: ImageBatch(refs/idle-square.png, refs/idle-head.png), concat,
 *      weight 0.3, ease in, 0.2..0.6, K+V (pilot 2 method F: a reference the adapter can see)
 *   -> KSampler 28 steps, cfg 6, euler_ancestral / normal
 *   conditioning through ControlNetApplyAdvanced (xinsir OpenPose SDXL, <state>-pose.png,
 *   strength --cn, 0..0.8).
 * Prompt: the LoRA's caption form (trigger, view, pose) + idle-truth costume words
 * (identity-idle.txt, read off the idle's pixels); no effect words (lintSpritePrompt must
 * strip nothing, or the run stops).
 *
 * One prompt at a time behind the shared ComfyUI queue; ComfyUI is never restarted.
 * Every render: renders/<tag>.raw.png (kept local), renders/<tag>.png (rembg cutout),
 * renders/<tag>.json (provenance + the cut-out guard's verdict).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITE_NEGATIVE, FACING_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout, lintSpritePrompt } from '../../../../../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../../../../../tools/gen/cutout-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const R = join(HERE, 'renders');
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const LORA = 'logos-x2.safetensors';
const LORA_STEP = 2000;
const LORA_SHA = '2252538fe454340915711c9cf019cfe2a5252f7ecff316507a72811637b5a8d9';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';

const IDENTITY = readFileSync(join(HERE, 'identity-idle.txt'), 'utf8').trim();
const NEG_COMMON =
  'hat, brim, hood, crest, helmet crest, fin, plume, feathers, horns, winged helmet, pauldrons, shoulder armor, ' +
  'shoulder pads, spikes, sword, katana, 1girl, long hair, single gun, one gun, cape, capelet, gold trim, yellow sash, ' +
  'chain, skirt, bare legs, thighs, grey background, blue background, gradient background, dark skin, tan';

export const STATES = {
  attack: {
    size: [832, 1216], seed0: 96101, composition: 'full',
    pose: 'full body, from side, profile, facing left, lunging, leaning forward, legs apart, one leg forward, aiming, arms forward, outstretched arms, holding gun, dual wielding, serious, v-shaped eyebrows, closed mouth',
    neg: 'arms down, arm behind back, smile, standing still',
  },
  cast: {
    size: [832, 1216], seed0: 96201, composition: 'full',
    pose: 'full body, from side, profile, facing left, standing, legs apart, arm up, holding gun, gun pointed up, revolver beside face, other hand holding gun, dual wielding, smirk, closed mouth',
    neg: 'gun to head, pointing gun at self, both arms down, aiming',
  },
  hurt: {
    size: [832, 1216], seed0: 96301, composition: 'full',
    pose: 'full body, from side, profile, facing left, leaning back, off balance, head back, wince, pained expression, clenched teeth, v-shaped eyebrows, arms spread, holding gun, dual wielding',
    neg: 'smile, smirk, calm, standing still, walking, looking at viewer, gun to head',
  },
  ko: {
    size: [1216, 832], seed0: 96401, composition: 'prone',
    pose: 'full body, from side, lying, on back, on ground, unconscious, closed eyes, arms at sides, gun on ground, dropped weapon, two guns, wearing helmet',
    neg: 'holding gun, standing, sitting, kneeling, no helmet, helmet removed, blood',
    dropIdentity: ['revolver'],
  },
};

export function prompts(state, extra = '', negExtra = '') {
  const s = STATES[state];
  const ident = IDENTITY.split(/,\s*/).filter((t) => !(s.dropIdentity || []).includes(t)).join(', ');
  const pose = extra ? `${s.pose}, ${extra}` : s.pose;
  const lint = lintSpritePrompt({ tags: ident, poseTags: pose, composition: s.composition === 'prone' ? 'prone' : 'full' });
  if (lint.stripped.length) throw new Error(`${state}: effect words in the prompt: ${JSON.stringify(lint.stripped)}`);
  const positive = `logosX2, 1boy, solo, ${pose}, ${ident}, simple background, (white background:1.2), ${STYLE_TAGS}, ${QUALITY_TAGS}`;
  const negative = [SPRITE_NEGATIVE, s.composition === 'prone' ? null : FACING_NEGATIVE, NEG_COMMON, s.neg, negExtra].filter(Boolean).join(', ');
  return { positive, negative };
}

function parse() {
  const a = { _: [] };
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) {
    if (v[i].startsWith('--')) a[v[i].slice(2)] = v[++i];
    else a._.push(v[i]);
  }
  return a;
}

function graph({ state, seed, lora, cn, ref, refs, poseImg, positive, negative }) {
  const [w, h] = STATES[state].size;
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: LORA, strength_model: lora, strength_clip: lora } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['10', 1] } },
    30: { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } },
    31: { class_type: 'LoadImage', inputs: { image: poseImg, upload: 'image' } },
    32: {
      class_type: 'ControlNetApplyAdvanced',
      inputs: { positive: ['6', 0], negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: cn, start_percent: 0, end_percent: 0.8, vae: ['4', 2] },
    },
    20: { class_type: 'LoadImage', inputs: { image: refs[0], upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: refs[1], upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    23: {
      class_type: 'IPAdapterAdvanced',
      inputs: { model: ['10', 0], ipadapter: ['21', 0], image: ['25', 0], weight: ref, weight_type: 'ease in', combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0] },
    },
    5: { class_type: 'EmptyLatentImage', inputs: { width: w, height: h, batch_size: 1 } },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: ['32', 0], negative: ['32', 1], latent_image: ['5', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/logos-lora-${state}`, images: ['8', 0] } },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(workflow, outPath) {
  let noted = 0;
  for (;;) {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    if (!q.queue_running.length && !q.queue_pending.length) break;
    if (Date.now() - noted > 60_000) { console.error('[logos-poses] queue busy; waiting'); noted = Date.now(); }
    await sleep(4000);
  }
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-logos-lora-poses' }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body)}`);
  const id = body.prompt_id;
  const deadline = Date.now() + 20 * 60_000;
  for (;;) {
    const e = (await (await fetch(`${COMFY}/history/${id}`)).json())[id];
    if (e?.status?.status_str === 'error') throw new Error(`failed: ${JSON.stringify(e.status.messages).slice(0, 800)}`);
    const img = e && Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
    if (img) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      writeFileSync(outPath, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      return (Date.now() - t0) / 1000;
    }
    if (Date.now() > deadline) throw new Error(`timeout ${id}`);
    await sleep(1000);
  }
}

function frameStats(p) {
  const code = 'import sys,numpy as n;from PIL import Image;a=n.asarray(Image.open(sys.argv[1]).convert("RGB"));print(int(a.max()), round(float(a.std()),1))';
  const r = spawnSync(PY, ['-s', '-c', code, p], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim().split(' ').map(Number);
}

async function renderState(state, a) {
  const s = STATES[state];
  const n = Number(a.seeds || 6);
  const lora = Number(a.lora ?? 0.8);
  const cn = Number(a.cn ?? 0.6);
  const ref = Number(a.ref ?? 0.3);
  const { positive, negative } = prompts(state, a.extra || '', a.negextra || '');
  const refs = [stageImage(join(HERE, 'refs/idle-square.png')), stageImage(join(HERE, 'refs/idle-head.png'))];
  const poseName = a.pose || state;
  const poseImg = stageImage(join(HERE, `${poseName}-pose.png`));
  const seed0 = Number(a.seed0 || s.seed0);
  mkdirSync(R, { recursive: true });
  for (let i = 0; i < n; i++) {
    const seed = seed0 + i;
    const tag = `${state}.${seed}${a.tag ? `.${a.tag}` : ''}`;
    const raw = join(R, `${tag}.raw.png`);
    if (existsSync(join(R, `${tag}.json`))) continue;
    const secs = await run(graph({ state, seed, lora, cn, ref, refs, poseImg, positive, negative }), raw);
    const [mx, sd] = frameStats(raw);
    if (mx === 0) throw new Error(`${tag}: BLACK FRAME; check the queue, never restart ComfyUI from here`);
    let cut = null;
    let guard = null;
    try {
      cut = cutout(raw, join(R, `${tag}.png`), 16);
      guard = await checkCutoutFile(join(R, `${tag}.png`), { sourceWidth: s.size[0], sourceHeight: s.size[1], composition: s.composition });
    } catch (e) { console.error(`[logos-poses] ${tag}: cutout failed: ${e.message}`); }
    writeFileSync(join(R, `${tag}.json`), JSON.stringify({
      tag, state, seed, method: 'lora+openpose', positive, negative, model: CKPT,
      lora: { file: LORA, step: LORA_STEP, sha256: LORA_SHA, strength: lora },
      controlnet: { file: CONTROLNET, image: `docs/concepts/chapters/leblanc/lora/logos/poses/${poseName}-pose.png`, strength: cn, start: 0, end: 0.8 },
      ipadapter: { file: IPADAPTER, images: ['refs/idle-square.png', 'refs/idle-head.png'], weight: ref, type: 'ease in', start: 0.2, end: 0.6, combine: 'concat', scaling: 'K+V' },
      width: s.size[0], height: s.size[1], composition: s.composition, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      frame: { maxRgb: mx, std: sd }, cutout: cut, cutoutGuard: guard, seconds: Math.round(secs), generatedAt: new Date().toISOString(),
    }, null, 1) + '\n');
    console.log(`[logos-poses] ${tag} ${Math.round(secs)} s${guard && !guard.ok ? ` GUARD: ${guard.reasons.join('; ')}` : ''}`);
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const a = parse();
  const which = a._[0] === 'all' ? Object.keys(STATES) : a._;
  if (!which.length || which.some((s) => !STATES[s])) {
    console.log('usage: node render.mjs <attack|cast|hurt|ko|all> [--seeds 6] [--lora 0.8] [--cn 0.6] [--ref 0.3] [--tag t] [--seed0 N]');
    process.exit(1);
  }
  for (const s of which) await renderState(s, a);
}
