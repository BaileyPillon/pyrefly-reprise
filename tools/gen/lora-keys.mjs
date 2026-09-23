#!/usr/bin/env node
/**
 * Living-portrait v4 (FFX-2 only): paint the turned yaw keys with the yuna-x2
 * identity LoRA, so every key is the SAME painting as the approved plate
 * (orange/pink hair tips, the beaded tassel on screen-left, green = her right,
 * blue = her left, the plate's line) instead of a different Yuna.
 *
 * Graph (core ComfyUI nodes + the already-installed IP-Adapter node, nothing
 * new): CheckpointLoaderSimple (Animagine XL 4.0 Opt) -> LoraLoader (strength
 * ~0.8) -> IPAdapterAdvanced (the plate flattened on white, weight 0.3, ease
 * in, 0.2..0.6, K+V: recipe R2) -> KSampler; the positive/negative pass through
 * ControlNetApplyAdvanced with the xinsir OpenPose SDXL model and the
 * head-and-shoulders skeleton `tools/gen/rig-lora-pose.py` draws per yaw.
 * Hero-preset sampling: 30 steps, cfg 6, euler_ancestral / normal, 832x1216
 * (the plate's own canvas, so the head lands at the plate's framing).
 *
 * Prompt = trigger + view tags only; the LoRA carries the identity.
 *
 *   node tools/gen/lora-keys.mjs test   --loras none,pyrefly-lora-steps/yuna-x2-step00000500.safetensors,... [--seeds 2]
 *   node tools/gen/lora-keys.mjs render --yaws -85,-60,-40,-20,20,40,60,85 [--count 6] [--lora yuna-x2.safetensors]
 *                                       [--strength 0.8] [--cn 0.6] [--seed 7100]
 *
 * One prompt at a time behind the shared ComfyUI queue (the video render
 * owns the card when it runs). ComfyUI is never restarted from here.
 * Candidates: D:/Tools/pyrefly-lora/yuna-x2/cand/ (outside the repo); picks are copied
 * into docs/concepts/pause-until-dawn/prototype-v2/art/v4/keys/picked/.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage } from './comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const V4 = join(REPO, 'docs/concepts/pause-until-dawn/prototype-v2/art/v4/keys');
const PLATE = join(REPO, 'public/art/portraits/yuna-x2.png');
const CAND = process.env.LORA_CAND || 'D:/Tools/pyrefly-lora/yuna-x2/cand';
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const W = 832;
const H = 1216;

const FRAMING = 'portrait, close-up, upper body, light smile, closed mouth, simple background, white background';
/** View tags per |yaw| (the skeleton sets the direction; tags set the amount). */
const VIEW = {
  0: 'looking at viewer, straight-on',
  20: 'head turned slightly, looking to the side',
  40: 'three-quarter view, head turned, looking to the side',
  60: 'three-quarter view, from side, head turned away, looking to the side',
  85: 'profile, from side, looking to the side',
};
const NEGATIVE =
  `${BASE_NEGATIVE}, full body, wide shot, from afar, chibi, sketch, monochrome, ` +
  'from behind, back view, 3d, realistic';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parse() {
  const a = { _: [] };
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) {
    if (v[i].startsWith('--')) a[v[i].slice(2)] = v[i + 1] && !v[i + 1].startsWith('--') ? v[++i] : true;
    else a._.push(v[i]);
  }
  return a;
}

export function prompt(yaw) {
  const view = VIEW[Math.abs(yaw)] ?? VIEW[40];
  return `yunaX2, 1girl, solo, ${view}, ${FRAMING}, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
}

export function graph({ yaw, seed, lora, strength, cn, cnEnd, refWeight, pose, ref, prefix }) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width: W, height: H, batch_size: 1 } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };
  let model = ['4', 0];
  let clip = ['4', 1];
  if (lora) {
    g[10] = {
      class_type: 'LoraLoader',
      inputs: { model, clip, lora_name: lora, strength_model: strength, strength_clip: strength },
    };
    model = ['10', 0];
    clip = ['10', 1];
  }
  g[6] = { class_type: 'CLIPTextEncode', inputs: { text: prompt(yaw), clip } };
  g[7] = { class_type: 'CLIPTextEncode', inputs: { text: NEGATIVE, clip } };
  let pos = ['6', 0];
  let neg = ['7', 0];
  if (pose && cn > 0) {
    g[30] = { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } };
    g[31] = { class_type: 'LoadImage', inputs: { image: pose, upload: 'image' } };
    g[32] = {
      class_type: 'ControlNetApplyAdvanced',
      inputs: {
        positive: pos, negative: neg, control_net: ['30', 0], image: ['31', 0],
        strength: cn, start_percent: 0, end_percent: cnEnd, vae: ['4', 2],
      },
    };
    pos = ['32', 0];
    neg = ['32', 1];
  }
  if (ref && refWeight > 0) {
    g[20] = { class_type: 'LoadImage', inputs: { image: ref, upload: 'image' } };
    g[21] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } };
    g[22] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } };
    g[23] = {
      class_type: 'IPAdapterAdvanced',
      inputs: {
        model, ipadapter: ['21', 0], image: ['20', 0], weight: refWeight, weight_type: 'ease in',
        combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0],
      },
    };
    model = ['23', 0];
  }
  g[3] = {
    class_type: 'KSampler',
    inputs: {
      seed, steps: 30, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1,
      model, positive: pos, negative: neg, latent_image: ['5', 0],
    },
  };
  return g;
}

/** One prompt at a time: wait until the shared queue is empty, then queue ours. */
async function run(workflow, outPath) {
  let noted = 0;
  for (;;) {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    if (!q.queue_running.length && !q.queue_pending.length) break;
    if (Date.now() - noted > 60_000) {
      console.error(`[keys] queue busy (${q.queue_running.length} running, ${q.queue_pending.length} pending); waiting`);
      noted = Date.now();
    }
    await sleep(5000);
  }
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-lora-keys' }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body)}`);
  const id = body.prompt_id;
  for (;;) {
    const hist = await (await fetch(`${COMFY}/history/${id}`)).json();
    const e = hist[id];
    if (e?.status?.status_str === 'error') throw new Error(`failed: ${JSON.stringify(e.status.messages)}`);
    const img = e && Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
    if (img) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      const buf = Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer());
      writeFileSync(outPath, buf);
      return (Date.now() - t0) / 1000;
    }
    await sleep(1000);
  }
}

const poseFile = (yaw) => join(V4, 'pose', yaw === 0 ? 'yaw0.png' : `yaw${yaw > 0 ? '+' : ''}${yaw}.png`);

async function job({ yaw, seed, lora, strength, cn, cnEnd, refWeight, out }) {
  const opts = {
    yaw, seed, lora, strength, cn, cnEnd, refWeight,
    pose: stageImage(poseFile(yaw)), ref: stageImage(PLATE), prefix: 'pyrefly/lora-keys',
  };
  const secs = await run(graph(opts), `${out}.png`);
  const side = { ...opts, prompt: prompt(yaw), negative: NEGATIVE, model: CKPT, controlnet: CONTROLNET,
    ipadapter: { file: IPADAPTER, weight: refWeight, type: 'ease in', start: 0.2, end: 0.6, scaling: 'K+V', image: 'public/art/portraits/yuna-x2.png' },
    steps: 30, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal', width: W, height: H, seconds: secs };
  writeFileSync(`${out}.json`, JSON.stringify(side, null, 1));
  console.log(`[keys] ${out}.png  ${secs.toFixed(1)} s`);
}

async function main() {
  const a = parse();
  const strength = Number(a.strength ?? 0.8);
  const cn = Number(a.cn ?? 0.6);
  const cnEnd = Number(a.cnEnd ?? 0.8);
  const refWeight = Number(a.ref ?? 0.3);
  if (a._[0] === 'test') {
    const loras = String(a.loras || 'none').split(',');
    const seeds = Number(a.seeds || 2);
    const yaw = Number(a.yaw ?? 0);
    const dir = join(CAND, a.tag || 'steptest');
    mkdirSync(dir, { recursive: true });
    for (const l of loras) {
      const tag = l === 'none' ? 'none' : l.replace(/^.*[\\/]/, '').replace(/\.safetensors$/, '');
      for (let s = 0; s < seeds; s++) {
        await job({ yaw, seed: 9100 + s, lora: l === 'none' ? null : l, strength: l === 'none' ? 0 : strength,
          cn, cnEnd, refWeight, out: join(dir, `${tag}.s${s + 1}`) });
      }
    }
  } else if (a._[0] === 'render') {
    const yaws = String(a.yaws || '-85,-60,-40,-20,20,40,60,85').split(',').map(Number);
    const count = Number(a.count || 6);
    const lora = a.lora || 'yuna-x2.safetensors';
    const base = Number(a.seed || 7100);
    const tag = a.tag || 'r1';
    for (const yaw of yaws) {
      const dir = join(CAND, tag, `yaw${yaw > 0 ? '+' : ''}${yaw}`);
      mkdirSync(dir, { recursive: true });
      for (let i = 0; i < count; i++) {
        await job({ yaw, seed: base + (yaw + 100) * 10 + i, lora, strength, cn, cnEnd, refWeight, out: join(dir, `c${i + 1}`) });
      }
    }
  } else {
    console.log('usage: lora-keys.mjs test --loras a,b | render --yaws ... [--count 6]');
  }
}

main().catch((e) => {
  console.error(`[keys] FAILED: ${e.message}`);
  process.exit(1);
});
