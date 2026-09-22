#!/usr/bin/env node
/**
 * Logos round 3 (FFX-2 only, Chateau Leblanc chapter art). Method F from
 * docs/concepts/chapters/leblanc/pilot2/judge.md: Animagine XL 4.0, 28 steps, cfg 6,
 * euler_ancestral/normal, pilot 2's FRAMING + STYLE_TAGS + QUALITY_TAGS + SPRITE_NEGATIVE +
 * FACING_NEGATIVE, IP-Adapter reference = a batch of a square whole-figure image and a square
 * head crop, concat, 0.4, ease in, 0.2 to 0.6. Only the words are Logos's own.
 *
 *   node docs/concepts/chapters/leblanc/sets/logos/round3/run-round3.mjs <state> [seed ...]
 *   node docs/concepts/chapters/leblanc/sets/logos/round3/run-round3.mjs prompt <state>
 *
 * idle is referenced off Bailey's picked concept (refs/concept-*.png, crest and plume painted
 * out); attack, cast, hurt and ko off the installed round-3 idle (refs/idle-*.png).
 * Per-state words live in states.json. Every render: renders/<state>.<seed>.raw.png (local),
 * .png (rembg cutout), .json (provenance). Nothing here installs or approves anything.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  characterWorkflow, stageImage, cutout, waitForServer, lintSpritePrompt, escapeTags, joinTags,
  compositionFor, STYLE_TAGS, QUALITY_TAGS, SPRITE_NEGATIVE, FACING_NEGATIVE,
} from '../../../../../../../tools/gen/comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const R = join(HERE, 'renders');
const REFS = join(HERE, 'refs');
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const BASE = `http://${process.env.COMFY_HOST || '127.0.0.1'}:${process.env.COMFY_PORT || 8188}`;
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const IPA = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPV = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';

// idle used identity.txt / emphasis.txt (written from the concept and the research); the other
// four use identity-anchor.txt / emphasis-anchor.txt, rewritten from the installed idle's pixels.
const words = (f) => readFileSync(join(HERE, f), 'utf8').trim();
const CFG = JSON.parse(readFileSync(join(HERE, 'states.json'), 'utf8'));
const STATES = CFG.states;

// Pilot 2's per-state framing (the sprite block minus `standing` and `(looking at viewer:1.2)`).
const FRAMING = '(from side:1.3), three-quarter view, body facing left, full body, feet visible, simple background, white background';
const PRONE_FRAMING = compositionFor('prone', 'left');

function prompts(state) {
  const s = STATES[state];
  // A state may drop identity tokens its pose contradicts (ko: the guns are on the floor).
  const drop = new Set(s.identityDrop || []);
  const IDENTITY = words(s.identity || 'identity.txt');
  const EMPHASIS = words(s.emphasisFile || 'emphasis.txt');
  const identity = IDENTITY.split(',').map((t) => t.trim()).filter((t) => t && !drop.has(t)).join(', ');
  const lint = lintSpritePrompt({ tags: identity, poseTags: s.poseTags, composition: s.prone ? 'prone' : 'full' });
  if (lint.stripped.length) throw new Error(`lint stripped ${JSON.stringify(lint.stripped)}`);
  const positive = joinTags(
    escapeTags(identity), escapeTags(s.poseTags), s.emphasis, EMPHASIS,
    s.prone ? PRONE_FRAMING : FRAMING, STYLE_TAGS, QUALITY_TAGS,
  );
  const negative = s.prone
    ? joinTags(SPRITE_NEGATIVE, CFG.negCommon, s.negAdd)
    : joinTags(SPRITE_NEGATIVE, FACING_NEGATIVE, CFG.negCommon, s.negAdd);
  return { positive, negative };
}

const CLIENT_ID = createHash('sha1').update(`logos-r3-${process.pid}-${Date.now()}`).digest('hex');
async function queue(workflow) {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
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
function frameStats(p) {
  const code = 'import sys,numpy as n;from PIL import Image;a=n.asarray(Image.open(sys.argv[1]).convert("RGB"));print(int(a.max()), round(float(a.std()),1))';
  const r = spawnSync(PY, ['-s', '-c', code, p], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim().split(' ').map(Number);
}

function refBatch(g, names, { weight, start, end, type }) {
  g['20'] = { class_type: 'LoadImage', inputs: { image: names[0], upload: 'image' } };
  g['24'] = { class_type: 'LoadImage', inputs: { image: names[1], upload: 'image' } };
  g['25'] = { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } };
  g['21'] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPA } };
  g['22'] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPV } };
  g['23'] = {
    class_type: 'IPAdapterAdvanced',
    inputs: {
      model: ['4', 0], ipadapter: ['21', 0], image: ['25', 0], weight, weight_type: type,
      combine_embeds: 'concat', start_at: start, end_at: end, embeds_scaling: 'K+V', clip_vision: ['22', 0],
    },
  };
  g['3'].inputs.model = ['23', 0];
}

const REF = { weight: 0.4, start: 0.2, end: 0.6, type: 'ease in' };

async function run(state, seeds) {
  const s = STATES[state];
  const { positive, negative } = prompts(state);
  const staged = s.refs.map((f) => stageImage(join(REFS, f)));
  for (const seed of seeds) {
    const t0 = Date.now();
    const g = characterWorkflow({
      width: s.size[0], height: s.size[1], steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      positive, negative, seed, prefix: `pyrefly/logos_r3_${state}`,
    });
    refBatch(g, staged, REF);
    const buf = await result(await queue(g));
    const tag = `${state}.${seed}`;
    const raw = join(R, `${tag}.raw.png`);
    writeFileSync(raw, buf);
    const [mx, sd] = frameStats(raw);
    if (mx === 0) throw new Error(`${tag}: BLACK FRAME, check the queue before any restart`);
    if (sd < 8) process.stderr.write(`[logos-r3] ${tag}: near-uniform frame (std ${sd}), check the emphasis syntax\n`);
    let cut = null;
    try { cut = cutout(raw, join(R, `${tag}.png`), 16); } catch (e) { process.stderr.write(`[logos-r3] ${tag}: cutout failed: ${e.message}\n`); }
    writeFileSync(join(R, `${tag}.json`), JSON.stringify({
      tag, method: 'F (pilot 2 winner), Logos words', state, seed, positive, negative,
      width: s.size[0], height: s.size[1], steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal', model: CKPT,
      ref: { images: s.refs.map((f) => `refs/${f}`), ...REF, combine: 'concat', scaling: 'K+V', ipadapter: IPA },
      cutout: cut, seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString(),
    }, null, 2) + '\n');
    process.stderr.write(`[logos-r3] ${tag} done in ${Math.round((Date.now() - t0) / 1000)} s\n`);
  }
}

// ------------------------------------------------------------ masked repaint
// Pilot 2 judge's "next tool" for a local drift: a small masked repaint of only the region that
// drifted (here the helmet top), VAEEncode + SetLatentNoiseMask + ImageCompositeMasked, with the
// same reference batch, never the face in the mask.
function boxMask(src, box, out) {
  const code = [
    'import sys', 'from PIL import Image, ImageDraw, ImageFilter',
    'w,h=Image.open(sys.argv[1]).size', 'x,y,bw,bh=[int(v) for v in sys.argv[2].split(",")]',
    'm=Image.new("L",(w,h),0)', 'ImageDraw.Draw(m).rectangle([x,y,x+bw,y+bh],fill=255)',
    'm.filter(ImageFilter.GaussianBlur(8)).convert("RGB").save(sys.argv[3])',
  ].join('\n');
  const r = spawnSync(PY, ['-s', '-c', code, src, box, out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
}

async function repaint(state, seed, box, denoise, extraTags, seeds) {
  const s = STATES[state];
  const base = prompts(state);
  const positive = joinTags(extraTags, base.positive);
  const negative = base.negative;
  const src = join(R, `${state}.${seed}.raw.png`);
  const mask = join(R, `${state}.${seed}.mask.png`);
  boxMask(src, box, mask);
  const staged = s.refs.map((f) => stageImage(join(REFS, f)));
  for (const [k, vs] of seeds.entries()) {
    const t0 = Date.now();
    const g = {
      4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
      10: { class_type: 'LoadImage', inputs: { image: stageImage(src), upload: 'image' } },
      11: { class_type: 'LoadImageMask', inputs: { image: stageImage(mask), channel: 'red', upload: 'image' } },
      6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['4', 1] } },
      7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['4', 1] } },
      12: { class_type: 'VAEEncode', inputs: { pixels: ['10', 0], vae: ['4', 2] } },
      13: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['12', 0], mask: ['11', 0] } },
      3: { class_type: 'KSampler', inputs: { seed: vs, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['13', 0] } },
      8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
      14: { class_type: 'ImageCompositeMasked', inputs: { destination: ['10', 0], source: ['8', 0], x: 0, y: 0, resize_source: false, mask: ['11', 0] } },
      9: { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/logos_r3_${state}_rp`, images: ['14', 0] } },
    };
    refBatch(g, staged, { weight: 0.4, start: 0, end: 1, type: 'linear' });
    const buf = await result(await queue(g));
    const tag = `${state}.${seed}r${vs % 1000}`;
    const raw = join(R, `${tag}.raw.png`);
    writeFileSync(raw, buf);
    const [mx] = frameStats(raw);
    if (mx === 0) throw new Error(`${tag}: BLACK FRAME, check the queue before any restart`);
    let cut = null;
    try { cut = cutout(raw, join(R, `${tag}.png`), 16); } catch (e) { process.stderr.write(`[logos-r3] ${tag}: cutout failed: ${e.message}\n`); }
    const parent = JSON.parse(readFileSync(join(R, `${state}.${seed}.json`), 'utf8'));
    writeFileSync(join(R, `${tag}.json`), JSON.stringify({
      ...parent, tag, method: 'F (pilot 2 winner), Logos words; then a masked repaint of one region',
      repaint: { source: `renders/${state}.${seed}.raw.png`, box, denoise, seed: vs, extraTags, positive, negative, refWindow: [0, 1], refType: 'linear', refWeight: 0.4 },
      cutout: cut, seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString(),
    }, null, 2) + '\n');
    process.stderr.write(`[logos-r3] ${tag} done in ${Math.round((Date.now() - t0) / 1000)} s\n`);
  }
}

const [a, b, ...rest] = process.argv.slice(2);
mkdirSync(R, { recursive: true });
if (a === 'prompt') { console.log(JSON.stringify(prompts(b), null, 2)); process.exit(0); }
if (a === 'repaint') {
  // repaint <state> <seed> <x,y,w,h> <denoise> "<extra tags>" <variant seed> ...
  const [seed, box, denoise, extra, ...vs] = rest;
  await waitForServer(60_000);
  await repaint(b, seed, box, Number(denoise), extra, vs.map(Number));
  process.exit(0);
}
if (!STATES[a]) throw new Error(`unknown state ${a}`);
const given = [b, ...rest].filter(Boolean).map(Number);
await waitForServer(60_000);
await run(a, given.length ? given : STATES[a].seeds);
