#!/usr/bin/env node
/**
 * Ormi pose renders with the ormiX2 LoRA (FFX-2 only, Chapter 6 art).
 *
 *   node docs/concepts/chapters/leblanc/lora/ormi/poses/render.mjs <state> [--seeds a,b,..] [--lora 0.8] [--cn 0.6] [--ref 0.3] [--tag t]
 *
 * Recipe (brief of 2026-09-23): LoraLoader ormi-x2 (step 1500), IP-Adapter plus with
 * the installed idle square-padded + a head crop as a batch (method F,
 * pilot2/judge.md; concat, ease in, 0.2 to 0.6, K+V), ControlNet OpenPose (xinsir
 * SDXL) on skel-<state>.png from skeletons.py (end 0.8), idle-truth Danbooru words
 * (sets/ormi/round3/identity-idle.txt with the character tags swapped for the
 * trigger), no effect words. Raw frames, cut-outs and sidecars go to
 * D:/Tools/pyrefly-lora/ormi/poses/<state>/ (outside the repo). The cut-out is the
 * pipeline's rembg (comfy.mjs cutout) and the cut-out guard (cutout-guard.mjs).
 * One prompt at a time, only behind an empty shared ComfyUI queue.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const G = await import(pathToFileURL(join(REPO, 'tools/gen/comfy.mjs')).href);
const C = await import(pathToFileURL(join(REPO, 'tools/gen/cutout-guard.mjs')).href);
const { stageImage, cutout, STYLE_TAGS, QUALITY_TAGS, SPRITE_NEGATIVE, FACING_NEGATIVE } = G;

const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
export const OUT = 'D:/Tools/pyrefly-lora/ormi/poses';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const LORA = 'ormi-x2.safetensors';
const LORA_STEP = 1500;
const IPA = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPV = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IDLE = join(REPO, 'public/art/characters/ormi/idle.png');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// idle-truth words (round3/identity-idle.txt), character tags -> the LoRA trigger
const IDENTITY = readFileSync(join(REPO, 'docs/concepts/chapters/leblanc/sets/ormi/round3/identity-idle.txt'), 'utf8')
  .trim().replace('1boy, ormi (ff10-2), final fantasy x-2, safe, solo', 'ormiX2, 1boy, solo, safe');
// Shield words cut back (batch p5): with the LoRA's own shield plus 'round shield, huge
// shield, red shield' and '(one round shield)' in the prompt, most frames drew two to
// four shields. The LoRA carries the shield; the words keep only the heart.
export const IDENTITY_LIGHT = IDENTITY.replace(', round shield, huge shield, red shield, gold rim, studded rim, heart emblem', ', round shield, gold rim, studded rim');
export const EMPHASIS_LIGHT = '(bald:1.2), (fat man:1.2), (purple armor:1.15), (purple hakama:1.2), (long hakama:1.15), (red heart emblem on shield:1.2)';
const EMPHASIS = '(bald:1.2), (fat man:1.2), (purple armor:1.15), (purple hakama:1.2), (long hakama:1.15), (one round shield:1.15), (red heart emblem on shield:1.25)';
const FACING = '(from side:1.3), three-quarter view, body facing right';
const FULL = 'full body, feet visible, (white background:1.3), (simple background:1.2)';
const NEG_SUBJECT = 'face paint, facial tattoo, forehead tattoo, multiple shields, two shields, dual wielding, kite shield, heater shield, pointed shield, square shield, ' +
  'muscular, muscular male, abs, tall, slim, thin, sword, katana, blade, spear, bare chest, topless male, long hair, spiked hair, helmet, feathers, ' +
  'shorts, leggings, tights, pants, trousers, orange clothes, rainbow, multicolored clothes, gradient background, (navel:1.3), (midriff:1.3), (two shields:1.3), ' +
  'heart on chest, heart on clothes, chibi, sketch, monochrome, 3d, realistic';

export const STATES = {
  attack: {
    size: [832, 1216], seed0: 960001, composition: 'full',
    pose: 'shield bash, lunging, leaning forward, one leg forward, holding shield, shield in front, arms forward, pushing, clenched teeth, v-shaped eyebrows, angry, looking ahead, (lunging:1.2), (shield bash:1.2)',
    negAdd: 'arms crossed, standing still, shield on back, arm behind back, smile',
  },
  cast: {
    size: [832, 1216], seed0: 960101, composition: 'full',
    pose: 'legs apart, arm up, raised fist, clenched hand, fist raised overhead, shouting, open mouth, clenched teeth, v-shaped eyebrows, angry, shield on back, looking ahead, (arm up:1.2), (raised fist:1.15)',
    negAdd: 'arms crossed, holding shield, smile, sitting',
  },
  hurt: {
    size: [832, 1216], seed0: 960201, composition: 'full',
    pose: 'recoiling, leaning back, off balance, stumbling, wince, closed eyes, pained expression, clenched teeth, hand on own stomach, arm out, shield on back, (leaning back:1.2), (pained expression:1.25), (wince:1.2)',
    negAdd: 'arms crossed, standing still, holding shield, smile, looking at viewer, open eyes',
  },
  ko: {
    size: [1216, 832], seed0: 960301, composition: 'prone',
    pose: 'lying, on back, unconscious, defeated, closed eyes, arms at sides, shield on ground, (lying on back:1.2), (closed eyes:1.25), (unconscious:1.15), head to the right, feet to the left',
    negAdd: 'open eyes, one eye closed, wink, smile, standing, sitting, kneeling, looking at viewer, floor, platform, (circle:1.2), ring, frame, border',
  },
};

export function prompts(state, extra = {}) {
  const s = { ...STATES[state], ...extra };
  const frame = s.composition === 'prone'
    ? 'lying on ground, full body, from side, (white background:1.3), (simple background:1.2)'
    : `${FACING}, ${FULL}`;
  const positive = `${s.identity || IDENTITY}, ${s.pose}, ${s.emphasis || EMPHASIS}, ${frame}, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
  const negative = [SPRITE_NEGATIVE, s.composition === 'prone' ? '' : FACING_NEGATIVE, NEG_SUBJECT, s.negAdd].filter(Boolean).join(', ');
  return { positive, negative };
}

function refs() {
  const dir = join(OUT, 'refs');
  mkdirSync(dir, { recursive: true });
  const sq = join(dir, 'idle-square.png');
  const head = join(dir, 'idle-head.png');
  if (!existsSync(sq) || !existsSync(head)) {
    // same crops as sets/ormi/round3/make-refs.py: square pad on white; head, topknot and collar
    const py = [
      'from PIL import Image', 'import sys',
      'im=Image.open(sys.argv[1]).convert("RGBA"); flat=Image.new("RGB",im.size,(255,255,255)); flat.paste(im,mask=im.split()[-1])',
      's=max(im.size); sq=Image.new("RGB",(s,s),(255,255,255)); sq.paste(flat,((s-im.width)//2,(s-im.height)//2))',
      'sq.resize((1024,1024),Image.LANCZOS).save(sys.argv[2])',
      'flat.crop((140,0,480,340)).resize((1024,1024),Image.LANCZOS).save(sys.argv[3])',
    ].join('\n');
    const r = spawnSync('python', ['-c', py, IDLE, sq, head], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr);
  }
  return [sq, head];
}

export function graph({ state, seed, lora, cn, ref, sq, head, skel, positive, negative }) {
  const s = STATES[state];
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: LORA, strength_model: lora, strength_clip: lora } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['10', 1] } },
    30: { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } },
    31: { class_type: 'LoadImage', inputs: { image: skel, upload: 'image' } },
    32: {
      class_type: 'ControlNetApplyAdvanced',
      inputs: { positive: ['6', 0], negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: cn, start_percent: 0, end_percent: 0.8, vae: ['4', 2] },
    },
    20: { class_type: 'LoadImage', inputs: { image: sq ?? head, upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: head, upload: 'image' } },
    // sq null = head crop only (attack batch p6: the idle's back-mounted shield in the
    // square reference kept a second shield on his back while he held one in front)
    25: sq ? { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } } : { class_type: 'ImageScale', inputs: { image: ['24', 0], upscale_method: 'lanczos', width: 1024, height: 1024, crop: 'disabled' } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPA } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPV } },
    23: {
      class_type: 'IPAdapterAdvanced',
      inputs: { model: ['10', 0], ipadapter: ['21', 0], image: ['25', 0], weight: ref, weight_type: 'ease in', combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0] },
    },
    5: { class_type: 'EmptyLatentImage', inputs: { width: s.size[0], height: s.size[1], batch_size: 1 } },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: ['32', 0], negative: ['32', 1], latent_image: ['5', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/lora-ormi-poses-${state}`, images: ['8', 0] } },
  };
}

async function queueEmpty() {
  const q = await (await fetch(`${COMFY}/queue`)).json();
  return !q.queue_running.length && !q.queue_pending.length;
}

export async function run(workflow, outPath) {
  let noted = 0;
  while (!(await queueEmpty())) {
    if (Date.now() - noted > 60_000) { console.error('[ormi-poses] shared queue busy; waiting'); noted = Date.now(); }
    await sleep(5000);
  }
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-lora-ormi-poses' }) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body)}`);
  const id = body.prompt_id;
  for (;;) {
    const e = (await (await fetch(`${COMFY}/history/${id}`)).json())[id];
    if (e?.status?.status_str === 'error') throw new Error(`failed: ${JSON.stringify(e.status.messages).slice(0, 2000)}`);
    const img = e && Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
    if (img) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      writeFileSync(outPath, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      return (Date.now() - t0) / 1000;
    }
    await sleep(1000);
  }
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

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const a = parse();
  const state = a._[0];
  if (!STATES[state]) throw new Error(`state? ${Object.keys(STATES).join(' | ')}`);
  const s = STATES[state];
  const seeds = a.seeds ? a.seeds.split(',').map(Number) : Array.from({ length: 6 }, (_, i) => s.seed0 + i);
  const lora = Number(a.lora ?? 0.8);
  const cn = Number(a.cn ?? 0.6);
  const ref = Number(a.ref ?? 0.3);
  const extra = {};
  if (a.pose) extra.pose = a.pose;
  if (a.negAdd) extra.negAdd = a.negAdd;
  if (a.emphasis) extra.emphasis = a.emphasis;
  if (a.lightShield) extra.emphasis = a.emphasis || EMPHASIS_LIGHT;
  if (a.lightShield) extra.identity = IDENTITY_LIGHT;
  const [sqPath, headPath] = refs();
  const sq = a.refs === 'head' ? null : stageImage(sqPath);
  const head = stageImage(headPath);
  const skelFile = a.skel || `skel-${state}.png`;
  const skel = stageImage(join(HERE, skelFile));
  const dir = join(OUT, state);
  mkdirSync(dir, { recursive: true });
  const { positive, negative } = prompts(state, extra);
  for (const seed of seeds) {
    const tag = a.tag ? `${state}.${a.tag}.${seed}` : `${state}.${seed}`;
    const raw = join(dir, `${tag}.raw.png`);
    const png = join(dir, `${tag}.png`);
    if (existsSync(join(dir, `${tag}.json`))) continue;
    const secs = await run(graph({ state, seed, lora, cn, ref, sq, head, skel, positive, negative }), raw);
    const cut = cutout(raw, png);
    const guard = await C.checkCutoutFile(png, { sourceWidth: s.size[0], sourceHeight: s.size[1], composition: s.composition });
    writeFileSync(join(dir, `${tag}.json`), JSON.stringify({
      state, seed, tag, seconds: secs, positive, negative, model: CKPT, width: s.size[0], height: s.size[1],
      steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      lora: { file: LORA, step: LORA_STEP, strength: lora },
      controlnet: { file: CONTROLNET, image: `docs/concepts/chapters/leblanc/lora/ormi/poses/${skelFile}`, strength: cn, start: 0, end: 0.8 },
      ipadapter: { file: IPA, weight: ref, type: 'ease in', start: 0.2, end: 0.6, scaling: 'K+V', combine: 'concat', images: sq ? ['public/art/characters/ormi/idle.png square-padded on white', 'public/art/characters/ormi/idle.png head crop 140,0,480,340'] : ['public/art/characters/ormi/idle.png head crop 140,0,480,340 (head only)'] },
      cutout: cut, guard: { ok: guard.ok, reasons: guard.reasons },
    }, null, 1));
    console.log(`[ormi-poses] ${tag} ${secs.toFixed(1)} s guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}`);
  }
}
