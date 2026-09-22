#!/usr/bin/env node
/**
 * Masked inpainting for the living-portrait rig's expression/blink patches
 * (prototype v2, `docs/plans/pause-living-portraits-techniques.md` Part 1).
 *
 * ComfyUI native nodes only: `LoadImage` for the source, `LoadImageMask` for
 * a feathered box mask built by `tools/gen/inpaint-support.py`,
 * `VAEEncodeForInpaint`, `KSampler` at a low-to-medium denoise so the
 * surrounding pixels anchor identity, `VAEDecode`, `SaveImage`. Optionally
 * IP-Adapter against the same plate at a low weight, same nodes and defaults
 * `tools/gen/comfy.mjs` already uses for --ref.
 *
 * The source image is read-only: this tool never overwrites anything under
 * `public/art/`. A patch is always a *derived* file under this prototype's
 * own `art/patches/` tree.
 *
 * Usage:
 *   node tools/gen/inpaint.mjs \
 *     --image docs/concepts/pause-until-dawn/prototype-v2/art/keys/frontal.png \
 *     --box 248,345,517,125 --tags "eyes closed, closed eyes" \
 *     --denoise 0.5 --count 3 --seed 1001 \
 *     --out docs/concepts/pause-until-dawn/prototype-v2/art/patches/eyes/closed
 *
 * Writes `<out>.<n>.png` (the tight cropped patch, pad included),
 * `<out>.<n>.full.png` (the whole inpainted frame, for later re-crops),
 * `<out>.<n>.json` (provenance) for each of `--count` variants, plus
 * `<out>.mask.png` (the mask actually used) and `<out>.src.png` (the source
 * crop, same box/pad, for a same-size contact-sheet comparison).
 */

import { spawn, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  copyFileSync,
  writeFileSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import process from 'node:process';

import {
  BASE_NEGATIVE,
  STYLE_TAGS,
  QUALITY_TAGS,
  joinTags,
  escapeTags,
  waitForServer,
} from './comfy.mjs';
import { IDENTITY as PLATE_IDENTITY } from './yaw-keys.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const SUPPORT_PY = resolve(HERE, 'inpaint-support.py');

const HOST = process.env.COMFY_HOST || '127.0.0.1';
const PORT = Number(process.env.COMFY_PORT || 8188);
const BASE = `http://${HOST}:${PORT}`;

const COMFY_ROOT = process.env.COMFY_ROOT || 'D:/Tools/ComfyUI';
const EMBEDDED_PYTHON = join(COMFY_ROOT, 'python_embeded', 'python.exe');
const COMFY_INPUT_DIR = process.env.COMFY_INPUT || join(COMFY_ROOT, 'ComfyUI', 'input');

const CHECKPOINT = process.env.COMFY_CKPT || 'animagine-xl-4.0-opt.safetensors';
const IPADAPTER_MODEL = process.env.COMFY_IPADAPTER || 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIP_VISION_MODEL =
  process.env.COMFY_CLIPVISION || 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';

/**
 * A patch's own identity block: the plate's identity tags (imported from
 * `yaw-keys.mjs` so both tools describe the same character the same way),
 * `--tags` for the thing the mask should paint, then the shared style/quality
 * blocks. No facing/composition contract here — a patch is a small region of
 * an already-composed frame, not a new composition.
 */
function buildPatchPrompt(tags) {
  return joinTags(PLATE_IDENTITY, escapeTags(tags), STYLE_TAGS, QUALITY_TAGS);
}

/** Negatives banned from every patch: no new faces/eyes appearing elsewhere. */
const PATCH_NEGATIVE_EXTRA =
  'multiple faces, extra eyes, extra mouth, asymmetrical eyes, heterochromia error, ' +
  'closed eyes error, cross-eyed, lazy eye, disfigured, deformed';

function runPy(args) {
  const res = spawnSync(EMBEDDED_PYTHON, ['-s', SUPPORT_PY, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (res.status !== 0) {
    throw new Error(
      `inpaint-support.py ${args[0]} failed:\n${res.stderr || res.stdout}`,
    );
  }
  return (res.stdout || '').trim();
}

function imageDims(path) {
  const out = runPy(['dims', '--image', path]);
  return JSON.parse(out.split('\n').pop());
}

/** Copy a file into ComfyUI's input/ folder under a collision-proof name. */
function stageInput(path) {
  mkdirSync(COMFY_INPUT_DIR, { recursive: true });
  const buf = readFileSync(path);
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const name = `pyrefly_inpaint_${hash}_${basename(path)}`;
  const dest = join(COMFY_INPUT_DIR, name);
  if (!existsSync(dest)) copyFileSync(path, dest);
  return name;
}

// --------------------------------------------------------------------------
// ComfyUI HTTP client (minimal — comfy.mjs keeps the fuller one private)
// --------------------------------------------------------------------------

const CLIENT_ID = createHash('sha256')
  .update(`pyrefly-inpaint-${process.pid}-${Date.now()}`)
  .digest('hex')
  .slice(0, 32);

async function api(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ComfyUI ${init?.method || 'GET'} ${path} -> ${res.status}\n${body}`);
  }
  return res;
}

async function queuePrompt(workflow) {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ComfyUI rejected the workflow (${res.status}):\n${text}`);
  const json = JSON.parse(text);
  if (json.error) throw new Error(`ComfyUI error: ${JSON.stringify(json.error)}`);
  return json.prompt_id;
}

async function waitForResult(promptId, { timeoutMs = 600_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await api(`/history/${promptId}`);
    const hist = await res.json();
    const entry = hist[promptId];
    if (entry) {
      const status = entry.status || {};
      if (status.status_str === 'error') {
        throw new Error(`Generation failed: ${JSON.stringify(status.messages || status)}`);
      }
      if (entry.outputs && Object.keys(entry.outputs).length) return entry;
    }
    if (Date.now() > deadline) throw new Error(`Timed out waiting for prompt ${promptId}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

function imagesFrom(entry) {
  const out = [];
  for (const node of Object.values(entry.outputs || {})) {
    for (const img of node.images || []) out.push(img);
  }
  return out;
}

async function fetchImage({ filename, subfolder, type }) {
  const q = new URLSearchParams({ filename, subfolder: subfolder || '', type: type || 'output' });
  const res = await api(`/view?${q}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Largest RGB sample in a PNG on disk — a crude black-frame check. */
function maxRgbOfPngFile(pngPath) {
  if (!existsSync(EMBEDDED_PYTHON)) return null;
  const py = [
    'import sys',
    'import numpy as np',
    'from PIL import Image',
    'a = np.asarray(Image.open(sys.argv[1]).convert("RGB"))',
    'print(int(a.max()) if a.size else 0)',
  ].join('\n');
  const res = spawnSync(EMBEDDED_PYTHON, ['-s', '-c', py, pngPath], { encoding: 'utf8' });
  if (res.status !== 0) return null;
  const n = Number((res.stdout || '').trim());
  return Number.isFinite(n) ? n : null;
}

// --------------------------------------------------------------------------
// Workflow graph
// --------------------------------------------------------------------------

function inpaintWorkflow({
  sourceImage,
  maskImage,
  positive,
  negative,
  seed,
  steps,
  cfg,
  sampler,
  scheduler,
  denoise,
  growMask,
  refImage,
  refWeight,
  prefix,
  latent = false,
}) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CHECKPOINT } },
    10: { class_type: 'LoadImage', inputs: { image: sourceImage, upload: 'image' } },
    11: {
      class_type: 'LoadImageMask',
      inputs: { image: maskImage, channel: 'red', upload: 'image' },
    },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['4', 1] } },
    12: {
      class_type: 'VAEEncodeForInpaint',
      inputs: {
        pixels: ['10', 0],
        vae: ['4', 2],
        mask: ['11', 0],
        grow_mask_by: growMask,
      },
    },
    3: {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: sampler,
        scheduler,
        denoise,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['12', 0],
      },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };

  // --latent (additive, living-portrait v3): VAEEncodeForInpaint greys the
  // masked pixels out before encoding, which only works near denoise 1.0.
  // For a LOW-denoise refine of a pre-filled hidden region, encode the
  // pixels as they are and restrict the noise to the mask instead.
  if (latent) {
    g['12'] = { class_type: 'VAEEncode', inputs: { pixels: ['10', 0], vae: ['4', 2] } };
    g['13'] = { class_type: 'SetLatentNoiseMask', inputs: { samples: ['12', 0], mask: ['11', 0] } };
    g['3'].inputs.latent_image = ['13', 0];
  }

  if (refImage) {
    g['20'] = { class_type: 'LoadImage', inputs: { image: refImage, upload: 'image' } };
    g['21'] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER_MODEL } };
    g['22'] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIP_VISION_MODEL } };
    g['23'] = {
      class_type: 'IPAdapterAdvanced',
      inputs: {
        model: ['4', 0],
        ipadapter: ['21', 0],
        image: ['20', 0],
        weight: refWeight,
        weight_type: 'ease in',
        combine_embeds: 'concat',
        start_at: 0.1,
        end_at: 0.6,
        embeds_scaling: 'K+V',
        clip_vision: ['22', 0],
      },
    };
    g['3'].inputs.model = ['23', 0];
  }
  return g;
}

async function generateOne(workflow) {
  const promptId = await queuePrompt(workflow);
  const entry = await waitForResult(promptId);
  const images = imagesFrom(entry);
  if (!images.length) throw new Error('ComfyUI returned no images');
  const buf = await fetchImage(images[0]);
  return buf;
}

// --------------------------------------------------------------------------
// CLI
// --------------------------------------------------------------------------

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) {
      a._.push(t);
      continue;
    }
    const k = t.slice(2);
    const n = argv[i + 1];
    if (n === undefined || n.startsWith('--')) a[k] = true;
    else {
      a[k] = n;
      i++;
    }
  }
  return a;
}

function required(args, name) {
  if (args[name] === undefined || args[name] === true) {
    throw new Error(`--${name} is required`);
  }
  return args[name];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args._[0] === 'help' || (!args.image && !args._.length)) {
    process.stdout.write(
      'Usage: node tools/gen/inpaint.mjs --image <src.png> --box x,y,w,h ' +
        '--tags "<what the mask should paint>" --out <path-prefix> ' +
        '[--mask <png>] [--denoise 0.45] [--count 1] [--seed N] [--feather 8] ' +
        '[--growMask 6] [--pad 24] [--negAdd "..."] [--ref <png>] [--refWeight 0.3]\n',
    );
    return;
  }

  const imagePath = resolve(REPO_ROOT, required(args, 'image'));
  const tags = required(args, 'tags');
  const outPrefix = resolve(REPO_ROOT, required(args, 'out'));
  const box = String(required(args, 'box')).split(',').map(Number);
  if (box.length !== 4 || box.some((n) => !Number.isFinite(n))) {
    throw new Error('--box must be "x,y,w,h"');
  }
  const feather = Number(args.feather === true ? 8 : args.feather ?? 8);
  const growMask = Number(args.growMask === true ? 6 : args.growMask ?? 6);
  const pad = Number(args.pad === true ? 24 : args.pad ?? 24);
  const denoise = Number(args.denoise === true ? 0.45 : args.denoise ?? 0.45);
  const steps = Number(args.steps === true ? 28 : args.steps ?? 28);
  const cfg = Number(args.cfg === true ? 6 : args.cfg ?? 6);
  const sampler = args.sampler === true ? 'euler_ancestral' : args.sampler || 'euler_ancestral';
  const scheduler = args.scheduler === true ? 'normal' : args.scheduler || 'normal';
  const count = Math.max(1, Number(args.count === true ? 1 : args.count ?? 1));
  const baseSeed = Number(args.seed === true ? 1000 : args.seed ?? 1000);
  const negAdd = args.negAdd === true ? '' : args.negAdd || '';
  const refPath = args.ref && args.ref !== true ? resolve(REPO_ROOT, String(args.ref)) : null;
  const refWeight = Number(args.refWeight === true ? 0.3 : args.refWeight ?? 0.3);
  const latent = args.latent === true || args.latent === 'true';

  await waitForServer(30_000);

  mkdirSync(dirname(outPrefix), { recursive: true });

  const dims = imageDims(imagePath);
  const maskPath = args.mask && args.mask !== true
    ? resolve(REPO_ROOT, String(args.mask))
    : `${outPrefix}.mask.png`;
  if (!(args.mask && args.mask !== true)) {
    runPy([
      'mask', '--size', String(dims.width), String(dims.height),
      '--box', ...box.map(String),
      '--feather', String(feather),
      '--out', maskPath,
    ]);
  }

  // The matching source crop, same box+pad, for a fair side-by-side.
  const srcCropPath = `${outPrefix}.src.png`;
  runPy(['crop', '--image', imagePath, '--box', ...box.map(String), '--pad', String(pad), '--out', srcCropPath]);

  const sourceImageName = stageInput(imagePath);
  const maskImageName = stageInput(maskPath);
  const refImageName = refPath ? stageInput(refPath) : null;

  const positive = buildPatchPrompt(tags);
  const negative = joinTags(BASE_NEGATIVE, PATCH_NEGATIVE_EXTRA, escapeTags(negAdd));

  const written = [];
  for (let i = 0; i < count; i++) {
    const seed = (baseSeed + i) % 2147483647;
    const workflow = inpaintWorkflow({
      sourceImage: sourceImageName,
      maskImage: maskImageName,
      positive,
      negative,
      seed,
      steps,
      cfg,
      sampler,
      scheduler,
      denoise,
      growMask,
      refImage: refImageName,
      refWeight,
      prefix: `pyrefly/inpaint_${basename(outPrefix)}`,
      latent,
    });
    process.stderr.write(
      `[inpaint] ${basename(outPrefix)} variant ${i + 1}/${count} seed=${seed} denoise=${denoise} box=${box.join(',')}\n`,
    );
    const buf = await generateOne(workflow);
    const fullPath = `${outPrefix}.${i + 1}.full.png`;
    writeFileSync(fullPath, buf);
    const maxRgb = maxRgbOfPngFile(fullPath);
    if (maxRgb !== null && maxRgb === 0) {
      process.stderr.write(`[inpaint] WARNING: variant ${i + 1} is a BLACK FRAME (maxRgb=0) — skipped.\n`);
      continue;
    }
    const cropPath = `${outPrefix}.${i + 1}.png`;
    runPy(['crop', '--image', fullPath, '--box', ...box.map(String), '--pad', String(pad), '--out', cropPath]);
    const sidecar = {
      source: imagePath.replace(REPO_ROOT + '\\', '').replace(REPO_ROOT + '/', '').replace(/\\/g, '/'),
      box, pad, feather, growMask, seed, denoise, steps, cfg, sampler, scheduler,
      ...(latent ? { encode: 'VAEEncode+SetLatentNoiseMask' } : {}),
      ...(args.mask && args.mask !== true ? { mask: String(args.mask) } : {}),
      prompt: positive, negative,
      model: CHECKPOINT,
      ...(refPath ? { ref: refPath.replace(REPO_ROOT + '\\', '').replace(REPO_ROOT + '/', '').replace(/\\/g, '/'), refWeight } : {}),
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(`${outPrefix}.${i + 1}.json`, `${JSON.stringify(sidecar, null, 2)}\n`);
    written.push(cropPath);
    process.stderr.write(`[inpaint]   -> ${cropPath}\n`);
  }

  if (!written.length) throw new Error(`All ${count} variant(s) failed for ${outPrefix}`);

  // A ready-to-view contact sheet: source crop first, then every candidate.
  const sheetPath = `${outPrefix}.sheet.png`;
  runPy([
    'sheet', '--images', srcCropPath, ...written,
    '--names', 'SOURCE', ...written.map((_, i) => `cand.${i + 1}`),
    '--out', sheetPath,
  ]);
  process.stderr.write(`[inpaint] sheet -> ${sheetPath}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((err) => {
    process.stderr.write(`\n[inpaint] ${err.message}\n`);
    process.exit(1);
  });
}
