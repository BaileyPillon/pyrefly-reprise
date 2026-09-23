#!/usr/bin/env node
/**
 * Chapter 6 (FFX-2 only): pick the logos-x2 LoRA checkpoint.
 *
 * Renders the installed idle's pose at every saved step (and once with no LoRA,
 * the control) through ComfyUI, core nodes plus the installed IP-Adapter node:
 * CheckpointLoaderSimple (Animagine XL 4.0 Opt) -> LoraLoader (0.8) ->
 * IPAdapterAdvanced (the installed idle flattened on white, 0.3, ease in, 0.2..0.6,
 * K+V) -> KSampler (28 steps, cfg 6, euler_ancestral / normal, 832 x 1216); the
 * conditioning passes through ControlNetApplyAdvanced with the xinsir OpenPose
 * SDXL model and idle-pose.png (0.5, 0..0.8) so every step paints the same pose.
 * Prompt = trigger + view + pose only.
 *
 *   node pick.mjs [--steps 500,1000,1500,2000] [--seeds 3] [--strength 0.8] [--cn 0.5]
 *   node pick.mjs --steps 1000,1500,2000 --seeds 2 --cn 0 --tag flex --flex "<pose tags>"
 *
 * Step files are copied to models/loras/pyrefly-lora-steps/logos-x2-stepN.safetensors.
 * One prompt at a time behind the shared queue; ComfyUI is never restarted.
 * Out: D:/Tools/pyrefly-lora/logos/pick/<tag>.s<n>.png + .json
 */
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stageImage, STYLE_TAGS, QUALITY_TAGS, SPRITE_NEGATIVE, FACING_NEGATIVE } from '../../../../../../tools/gen/comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..');
const IDLE = join(REPO, 'public/art/characters/logos/idle.png');
const POSE = join(HERE, 'idle-pose.png');
const OUT_DIR = 'D:/Tools/pyrefly-lora/logos/out';
const PICK = 'D:/Tools/pyrefly-lora/logos/pick';
const LORAS = 'D:/Tools/ComfyUI/ComfyUI/models/loras';
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const W = 832;
const H = 1216;

const IDLE_POSE = 'from side, profile, standing, legs apart, arms down, holding gun, dual wielding, gun pointed down, facing left';
const promptFor = (pose) =>
  `logosX2, 1boy, solo, full body, ${pose}, simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
export const PROMPT = promptFor(IDLE_POSE);
export const NEGATIVE = `${SPRITE_NEGATIVE}, ${FACING_NEGATIVE}, 1girl, multiple boys`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parse() {
  const a = {};
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) if (v[i].startsWith('--')) a[v[i].slice(2)] = v[++i];
  return a;
}

function graph({ seed, lora, strength, cn, ref, pose, prefix, text = PROMPT }) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width: W, height: H, batch_size: 1 } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };
  let model = ['4', 0];
  let clip = ['4', 1];
  if (lora) {
    g[10] = { class_type: 'LoraLoader', inputs: { model, clip, lora_name: lora, strength_model: strength, strength_clip: strength } };
    model = ['10', 0];
    clip = ['10', 1];
  }
  g[6] = { class_type: 'CLIPTextEncode', inputs: { text, clip } };
  g[7] = { class_type: 'CLIPTextEncode', inputs: { text: NEGATIVE, clip } };
  let cond = [['6', 0], ['7', 0]];
  if (cn > 0) {
    g[30] = { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } };
    g[31] = { class_type: 'LoadImage', inputs: { image: pose, upload: 'image' } };
    g[32] = {
      class_type: 'ControlNetApplyAdvanced',
      inputs: { positive: ['6', 0], negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: cn, start_percent: 0, end_percent: 0.8, vae: ['4', 2] },
    };
    cond = [['32', 0], ['32', 1]];
  }
  g[20] = { class_type: 'LoadImage', inputs: { image: ref, upload: 'image' } };
  g[21] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } };
  g[22] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } };
  g[23] = {
    class_type: 'IPAdapterAdvanced',
    inputs: { model, ipadapter: ['21', 0], image: ['20', 0], weight: 0.3, weight_type: 'ease in', combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0] },
  };
  g[3] = {
    class_type: 'KSampler',
    inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: cond[0], negative: cond[1], latent_image: ['5', 0] },
  };
  return g;
}

async function run(workflow, outPath) {
  let noted = 0;
  for (;;) {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    if (!q.queue_running.length && !q.queue_pending.length) break;
    if (Date.now() - noted > 60_000) { console.error('[pick] queue busy; waiting'); noted = Date.now(); }
    await sleep(5000);
  }
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-logos-lora-pick' }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body)}`);
  const id = body.prompt_id;
  for (;;) {
    const e = (await (await fetch(`${COMFY}/history/${id}`)).json())[id];
    if (e?.status?.status_str === 'error') throw new Error(`failed: ${JSON.stringify(e.status.messages)}`);
    const img = e && Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
    if (img) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      writeFileSync(outPath, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      return (Date.now() - t0) / 1000;
    }
    await sleep(1000);
  }
}

async function main() {
  const a = parse();
  const steps = String(a.steps || '500,1000,1500,2000').split(',').map(Number);
  const seeds = Number(a.seeds || 3);
  const strength = Number(a.strength ?? 0.8);
  const cn = Number(a.cn ?? 0.5);
  mkdirSync(PICK, { recursive: true });
  mkdirSync(join(LORAS, 'pyrefly-lora-steps'), { recursive: true });
  const ref = stageImage(IDLE);
  const pose = stageImage(POSE);
  // --flex "<pose tags>" --tag name --cn 0: a pose the dataset never showed, prompt only,
  // to see which step still bends (the LoRA is trained on one painting's pose).
  const text = a.flex ? promptFor(a.flex) : PROMPT;
  const prefixTag = a.tag ? `${a.tag}-` : '';
  const tags = a.flex ? [] : ['none'];
  for (const s of steps) {
    const src = join(OUT_DIR, `logos-x2-step${String(s).padStart(8, '0')}.safetensors`);
    const alt = join(OUT_DIR, 'logos-x2.safetensors');
    const from = existsSync(src) ? src : alt;
    if (!existsSync(from)) throw new Error(`missing ${src}`);
    const dest = join(LORAS, 'pyrefly-lora-steps', `logos-x2-step${s}.safetensors`);
    // ComfyUI keeps a loaded LoRA open: an identical copy already in place is left alone.
    if (!existsSync(dest) || statSync(dest).size !== statSync(from).size) copyFileSync(from, dest);
    tags.push(String(s));
  }
  if (a.nocontrol) tags.shift();
  for (const t of tags) {
    for (let i = 0; i < seeds; i++) {
      const seed = 9400 + i;
      const lora = t === 'none' ? null : `pyrefly-lora-steps\\logos-x2-step${t}.safetensors`;
      const out = join(PICK, `${prefixTag}${t === 'none' ? 'none' : `step${t}`}.s${i + 1}`);
      if (existsSync(`${out}.png`)) continue;
      const secs = await run(graph({ seed, lora, strength, cn, ref, pose, text, prefix: 'pyrefly/logos-lora-pick' }), `${out}.png`);
      writeFileSync(`${out}.json`, JSON.stringify({
        seed, lora, strength: lora ? strength : 0, prompt: text, negative: NEGATIVE, model: CKPT,
        controlnet: cn > 0 && { file: CONTROLNET, image: 'docs/concepts/chapters/leblanc/lora/logos/idle-pose.png', strength: cn, end: 0.8 },
        ipadapter: { file: IPADAPTER, image: 'public/art/characters/logos/idle.png', weight: 0.3, type: 'ease in', start: 0.2, end: 0.6, scaling: 'K+V' },
        steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal', width: W, height: H, seconds: secs,
      }, null, 1));
      console.log(`[pick] ${out}.png ${secs.toFixed(1)} s`);
    }
  }
}

main().catch((e) => { console.error(`[pick] FAILED: ${e.message}`); process.exit(1); });
