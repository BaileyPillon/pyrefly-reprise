#!/usr/bin/env node
/**
 * Leblanc pilot 2 (FFX-2 only; docs/plans/leblanc-art-method-check.md).
 * Builds its graphs from tools/gen/comfy.mjs's exported builders and posts them
 * itself, so the shared tools stay untouched. Run from the repo root:
 *
 *   node docs/concepts/chapters/leblanc/pilot2/run-pilot2.mjs f  <hurt|attack>
 *   node docs/concepts/chapters/leblanc/pilot2/run-pilot2.mjs d1 <hurt|attack>
 *   node docs/concepts/chapters/leblanc/pilot2/run-pilot2.mjs e  <hurt|attack>
 *   node docs/concepts/chapters/leblanc/pilot2/run-pilot2.mjs d2 <hurt|attack> <n> <headBox x,y,w,h>
 *
 * Every render: raw frame at renders/<tag>.raw.png, rembg cutout at
 * renders/<tag>.png, provenance at renders/<tag>.json. Nothing goes under
 * public/art/; nothing here installs or approves anything.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  characterWorkflow,
  stageImage,
  cutout,
  waitForServer,
  lintSpritePrompt,
  escapeTags,
  joinTags,
  STYLE_TAGS,
  QUALITY_TAGS,
  SPRITE_NEGATIVE,
  FACING_NEGATIVE,
} from '../../../../../tools/gen/comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const R = join(HERE, 'renders');
const REFS = join(HERE, 'refs');
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const BASE = `http://${process.env.COMFY_HOST || '127.0.0.1'}:${process.env.COMFY_PORT || 8188}`;
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const IPA = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPV = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';

const IDENTITY = readFileSync(join(HERE, 'identity-idle.txt'), 'utf8').trim();
const EMPHASIS = readFileSync(join(HERE, 'emphasis.txt'), 'utf8').trim();

// Per-state framing (method check §3): the shared block minus `standing` and
// `(looking at viewer:1.2)`, which fight a recoil and a strike.
const FRAMING = '(from side:1.3), three-quarter view, body facing left, full body, feet visible, simple background, white background';

const STATES = {
  hurt: {
    poseTags:
      'leaning back, off balance, wince, closed eyes, pained expression, clenched teeth, v-shaped eyebrows, hand on own stomach, head tilt, arm at side, holding closed fan',
    emphasis: '(closed eyes:1.25), (pained expression:1.2), (leaning back:1.2)',
    negAdd:
      'smile, smirk, grin, wink, seductive smile, happy, dancing, looking at viewer, thighhighs, stockings, pantyhose, closed robe, long dress, red fan, pink fan',
    seeds: [22301, 22302, 22303, 22304],
  },
  attack: {
    poseTags:
      'lunging, leaning forward, one leg forward, arm extended forward, swinging, holding folding fan, serious, v-shaped eyebrows, looking ahead, closed mouth',
    emphasis: '(lunging:1.25), (leaning forward:1.2), (serious:1.15)',
    negAdd:
      'smile, smirk, grin, wink, seductive smile, happy, dancing, fan dance, thighhighs, stockings, pantyhose, closed robe, long dress, red fan, pink fan',
    seeds: [22101, 22102, 22103, 22104],
  },
};

function prompts(state) {
  const s = STATES[state];
  const lint = lintSpritePrompt({ tags: IDENTITY, poseTags: s.poseTags, composition: 'full' });
  if (lint.stripped.length) throw new Error(`lint stripped ${JSON.stringify(lint.stripped)}`);
  const positive = joinTags(
    escapeTags(IDENTITY),
    escapeTags(s.poseTags),
    s.emphasis,
    EMPHASIS,
    FRAMING,
    STYLE_TAGS,
    QUALITY_TAGS,
  );
  const negative = joinTags(SPRITE_NEGATIVE, FACING_NEGATIVE, s.negAdd);
  return { positive, negative };
}

// ---------------------------------------------------------------- client
const CLIENT_ID = createHash('sha1').update(`pilot2-${process.pid}-${Date.now()}`).digest('hex');
async function queue(workflow) {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`rejected ${res.status}: ${t}`);
  return JSON.parse(t).prompt_id;
}
async function result(id) {
  const deadline = Date.now() + 3 * 3600_000; // the shared queue may hold a long video job
  for (;;) {
    const h = await (await fetch(`${BASE}/history/${id}`)).json();
    const e = h[id];
    if (e?.status?.status_str === 'error') throw new Error(JSON.stringify(e.status.messages));
    if (e?.outputs && Object.keys(e.outputs).length) {
      for (const n of Object.values(e.outputs)) for (const img of n.images || []) {
        const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
        return Buffer.from(await (await fetch(`${BASE}/view?${q}`)).arrayBuffer());
      }
    }
    if (Date.now() > deadline) throw new Error(`timeout ${id}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}
function py(args) {
  const r = spawnSync(PY, ['-s', join(HERE, 'tools2.py'), ...args], { encoding: 'utf8', cwd: ROOT });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return r.stdout.trim();
}

async function render(tag, workflow, meta) {
  const t0 = Date.now();
  const id = await queue(workflow);
  const buf = await result(id);
  const raw = join(R, `${tag}.raw.png`);
  writeFileSync(raw, buf);
  const maxRgb = Number(py(['maxrgb', raw]));
  if (maxRgb === 0) throw new Error(`${tag}: BLACK FRAME — check the queue before any restart`);
  let cut = null;
  try {
    cut = cutout(raw, join(R, `${tag}.png`), 16);
  } catch (e) {
    process.stderr.write(`[pilot2] ${tag}: cutout failed: ${e.message}\n`);
  }
  writeFileSync(
    join(R, `${tag}.json`),
    JSON.stringify({ tag, ...meta, cutout: cut, model: CKPT, seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString() }, null, 2) + '\n',
  );
  process.stderr.write(`[pilot2] ${tag} done in ${Math.round((Date.now() - t0) / 1000)} s\n`);
}

function refBatch(g, names, { weight, start, end, type }) {
  g['20'] = { class_type: 'LoadImage', inputs: { image: names[0], upload: 'image' } };
  let img = ['20', 0];
  if (names[1]) {
    g['24'] = { class_type: 'LoadImage', inputs: { image: names[1], upload: 'image' } };
    g['25'] = { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } };
    img = ['25', 0];
  }
  g['21'] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPA } };
  g['22'] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPV } };
  g['23'] = {
    class_type: 'IPAdapterAdvanced',
    inputs: {
      model: ['4', 0], ipadapter: ['21', 0], image: img, weight, weight_type: type,
      combine_embeds: 'concat', start_at: start, end_at: end, embeds_scaling: 'K+V', clip_vision: ['22', 0],
    },
  };
  g['3'].inputs.model = ['23', 0];
}

const COMMON = { width: 832, height: 1216, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal' };

async function methodF(state) {
  const { positive, negative } = prompts(state);
  const sq = stageImage(join(REFS, 'idle-square.png'));
  const head = stageImage(join(REFS, 'idle-head.png'));
  const ref = { weight: 0.4, start: 0.2, end: 0.6, type: 'ease in' };
  for (const [i, seed] of STATES[state].seeds.entries()) {
    const g = characterWorkflow({ ...COMMON, positive, negative, seed, prefix: `pyrefly/pilot2_f_${state}` });
    refBatch(g, [sq, head], ref);
    await render(`f-${state}.${i + 1}`, g, { method: 'F', state, seed, positive, negative, ref: { images: ['refs/idle-square.png', 'refs/idle-head.png'], ...ref } });
  }
}

async function methodD1(state) {
  const { positive, negative } = prompts(state);
  // Method A's reference exactly: the tall idle cutout flattened on white (stageImage).
  const idle = stageImage(join(ROOT, 'public/art/characters/leblanc/idle.png'));
  const ref = { weight: 0.35, start: 0.2, end: 0.6, type: 'ease in' };
  for (const [i, seed] of STATES[state].seeds.entries()) {
    const g = characterWorkflow({ ...COMMON, positive, negative, seed, prefix: `pyrefly/pilot2_d1_${state}` });
    refBatch(g, [idle], ref);
    await render(`d1-${state}.${i + 1}`, g, { method: 'D stage 1', state, seed, positive, negative, ref: { images: ['public/art/characters/leblanc/idle.png (forced past the monochrome guard)'], ...ref } });
  }
}

async function methodE(state) {
  const { positive, negative } = prompts(state);
  const initPath = join(R, `e-${state}-init.png`);
  if (!existsSync(initPath)) throw new Error(`build the puppet first: tools2.py puppet ${state}`);
  const init = stageImage(initPath);
  const plan = [[0.6, 0], [0.6, 1], [0.7, 2], [0.7, 3]];
  for (const [i, [denoise, k]] of plan.entries()) {
    const seed = STATES[state].seeds[k];
    const g = characterWorkflow({ ...COMMON, positive, negative, seed, initImage: init, denoise, prefix: `pyrefly/pilot2_e_${state}` });
    await render(`e-${state}.${i + 1}`, g, { method: 'E', state, seed, denoise, init: `renders/e-${state}-init.png`, positive, negative });
  }
}

function repaintGraph({ src, mask, positive, negative, seed, denoise, refs, refWeight, prefix }) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoadImage', inputs: { image: src, upload: 'image' } },
    11: { class_type: 'LoadImageMask', inputs: { image: mask, channel: 'red', upload: 'image' } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['4', 1] } },
    12: { class_type: 'VAEEncode', inputs: { pixels: ['10', 0], vae: ['4', 2] } },
    13: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['12', 0], mask: ['11', 0] } },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['13', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    14: { class_type: 'ImageCompositeMasked', inputs: { destination: ['10', 0], source: ['8', 0], x: 0, y: 0, resize_source: false, mask: ['11', 0] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['14', 0] } },
  };
  // Window 0..1: at denoise 0.4 the sampler runs only the tail of the schedule,
  // so the usual end_at 0.6 would switch the adapter off almost at once.
  refBatch(g, refs, { weight: refWeight, start: 0, end: 1, type: 'linear' });
  return g;
}

async function methodD2(state, n, headBox) {
  const { positive, negative } = prompts(state);
  const stage1 = join(R, `d1-${state}.${n}.raw.png`);
  const figMask = join(R, `d2-${state}.${n}.figmask.png`);
  const headMask = join(R, `d2-${state}.${n}.headmask.png`);
  py(['figmask', stage1, figMask]);
  py(['boxmask', stage1, headBox, headMask]);
  const sq = stageImage(join(REFS, 'idle-square.png'));
  const head = stageImage(join(REFS, 'idle-head.png'));
  const seed = STATES[state].seeds[n - 1] + 500;
  // Pass (a): the whole silhouette at 0.4, both references at 0.55.
  const passA = repaintGraph({ src: stageImage(stage1), mask: stageImage(figMask), positive, negative, seed, denoise: 0.4, refs: [sq, head], refWeight: 0.55, prefix: `pyrefly/pilot2_d2a_${state}` });
  await render(`d2a-${state}.${n}`, passA, { method: 'D stage 2a (figure)', state, seed, denoise: 0.4, source: `renders/d1-${state}.${n}.raw.png`, mask: 'figure silhouette, dilated 12 px, feathered', refWeight: 0.55, refWindow: [0, 1], positive, negative });
  // Pass (b): the head box at 0.5, head reference only at 0.6.
  const a = join(R, `d2a-${state}.${n}.raw.png`);
  const passB = repaintGraph({ src: stageImage(a), mask: stageImage(headMask), positive, negative, seed: seed + 1, denoise: 0.5, refs: [head], refWeight: 0.6, prefix: `pyrefly/pilot2_d2b_${state}` });
  await render(`d2-${state}.${n}`, passB, { method: 'D stage 2b (head)', state, seed: seed + 1, denoise: 0.5, source: `renders/d2a-${state}.${n}.raw.png`, headBox, refWeight: 0.6, refWindow: [0, 1], positive, negative });
}

const [mode, state, ...rest] = process.argv.slice(2);
if (!STATES[state]) throw new Error('state must be hurt or attack');
mkdirSync(R, { recursive: true });
await waitForServer(60_000);
if (mode === 'f') await methodF(state);
else if (mode === 'd1') await methodD1(state);
else if (mode === 'e') await methodE(state);
else if (mode === 'd2') await methodD2(state, Number(rest[0]), rest[1]);
else if (mode === 'prompt') console.log(JSON.stringify(prompts(state), null, 2));
else throw new Error(`unknown mode ${mode}`);
