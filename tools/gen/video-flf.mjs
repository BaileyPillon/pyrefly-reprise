#!/usr/bin/env node
/**
 * Wan 2.1 FLF2V (first-and-last-frame) 720p 14B client for the living-portrait
 * video preview, round 2 (docs/concepts/pause-until-dawn/video-flf/README.md).
 *
 * Built to fix round 1's core defect (docs/concepts/pause-until-dawn/video-preview/
 * judge.md, status.json): every Wan 2.2 TI2V-5B clip drifted away from the plate by
 * its last frame (a camera push-in / re-framing at minimum, a lost eye colour and a
 * failed head turn at worst). WanFirstLastFrameToVideo takes BOTH a start_image and
 * an end_image, so frame 1 and the last frame are pinned to the plate BY
 * CONSTRUCTION, not by hoping the model returns there on its own.
 *
 * Graph (every input name read from this ComfyUI's /object_info, never guessed —
 * see docs/concepts/pause-until-dawn/video-flf/object-info/*.json for the raw
 * schemas this was built from):
 *   UNETLoader(wan2.1_flf2v_720p_14B_fp8_e4m3fn.safetensors, weight_dtype=fp8_e4m3fn)
 *     -> ModelSamplingSD3(shift)
 *   CLIPLoader(umt5_xxl_fp8_e4m3fn_scaled.safetensors, type=wan) -> CLIPTextEncode x2
 *   VAELoader(wan_2.1_vae.safetensors)
 *   CLIPVisionLoader(clip_vision_h.safetensors)
 *   LoadImage(staged plate) x2 (start_image, end_image -- the SAME file both times)
 *     -> CLIPVisionEncode x2 (crop=center)
 *   WanFirstLastFrameToVideo(positive, negative, vae, width, height, length,
 *     batch_size, clip_vision_start_image, clip_vision_end_image, start_image,
 *     end_image) -> (positive, negative, latent)
 *   KSampler(uni_pc, denoise=1) -> VAEDecode -> SaveImage (PNG sequence)
 * The committed deliverable is a VP9 WebM made from the PNG sequence by ffmpeg,
 * same as tools/gen/video.mjs's framesToWebm (imported, not duplicated).
 *
 * Shares helpers with the round-1 5B tool (tools/gen/video.mjs) by IMPORTING it,
 * not copying it, so the 5B path keeps working unmodified: preparePlate,
 * waitForServer, nodeSchema, framesToWebm, PLATE_PATH.
 *
 * Usage:
 *   node tools/gen/video-flf.mjs list
 *   node tools/gen/video-flf.mjs render idle-breathing --seed 1
 *   node tools/gen/video-flf.mjs render idle-breathing --seed 1 --width 1024 --height 576
 *   node tools/gen/video-flf.mjs render-all --seed 1
 *   node tools/gen/video-flf.mjs join-report <clip> <seed>
 *   node tools/gen/video-flf.mjs contact-sheet <clip> <seed>
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  existsSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import {
  PLATE_PATH,
  preparePlate,
  waitForServer,
  nodeSchema,
  framesToWebm,
} from './video.mjs';

const HERE = resolve(fileURLToPath(import.meta.url), '..');
const REPO_ROOT = resolve(HERE, '..', '..');

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

const HOST = process.env.COMFY_HOST || '127.0.0.1';
const PORT = Number(process.env.COMFY_PORT || 8188);
const BASE = `http://${HOST}:${PORT}`;

const COMFY_ROOT = process.env.COMFY_ROOT || 'D:/Tools/ComfyUI';
const COMFY_INPUT_DIR = process.env.COMFY_INPUT || join(COMFY_ROOT, 'ComfyUI', 'input');

/** Approved downloads only (checksums: D:/Tools/video-models/_dl/fetch-flf2v-2026-09-21.DONE.txt). */
export const UNET_NAME = process.env.WAN_FLF_UNET || 'wan2.1_flf2v_720p_14B_fp8_e4m3fn.safetensors';
export const UNET_WEIGHT_DTYPE = 'fp8_e4m3fn';
export const CLIP_NAME = process.env.WAN_FLF_CLIP || 'umt5_xxl_fp8_e4m3fn_scaled.safetensors';
export const VAE_NAME = process.env.WAN_FLF_VAE || 'wan_2.1_vae.safetensors';
export const CLIP_VISION_NAME = process.env.WAN_FLF_CLIP_VISION || 'clip_vision_h.safetensors';

/** Native-ish size for this model; falls back to 1024x576 on OOM (brief's own rule). */
export const WIDTH = Number(process.env.WAN_FLF_WIDTH || 1280);
export const HEIGHT = Number(process.env.WAN_FLF_HEIGHT || 704);
export const FALLBACK_WIDTH = 1024;
export const FALLBACK_HEIGHT = 576;
/** 81 frames at the model's native 16 fps = ~5.06 s. */
export const LENGTH = 81;
export const FPS = 16;

export const WAN_NEGATIVE =
  '色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，' +
  '最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，' +
  '画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，' +
  '杂乱的背景，三条腿，背景人很多，倒着走';

/** Every prompt names ONLY motion of this exact painted character (brief's wording). */
const NO_RESTYLE_SUFFIX =
  ', the same painted anime illustration, unchanged style and colours, ' +
  'locked camera, background does not move, the character returns exactly ' +
  'to the starting pose';

export const OUT_ROOT = process.env.PYREFLY_VIDEO_FLF_OUT || 'D:/Tools/pyrefly-video/flf';

// --------------------------------------------------------------------------
// The clip set. Because start_image AND end_image are both the plate, every
// prompt's "returns to the starting pose" is enforced by the graph itself --
// the prompt only needs to describe the motion IN BETWEEN.
// Eye sides read directly off the plate (public/art/pause/yuna-ffx2.png,
// facing camera): her own RIGHT eye (screen-left) is GREEN, her own LEFT eye
// (screen-right) is BLUE.
// --------------------------------------------------------------------------

export const CLIP_SET = {
  'idle-breathing': {
    prompt:
      'Yuna breathes subtly, her chest rising and falling gently, one slow single ' +
      'blink partway through, a tiny natural drift of her head, otherwise still.',
  },
  'idle-blinks': {
    prompt:
      'Yuna blinks fully twice and then does one half-blink where her eyelids only ' +
      'partly close, otherwise she holds still.',
  },
  'smile-and-relax': {
    prompt:
      "A warm smile grows across Yuna's face over about half a second, she holds it " +
      'briefly, then her expression relaxes back toward her starting expression.',
  },
  'determined-and-relax': {
    prompt:
      "Yuna's eyebrows lower and her jaw sets firmly, her eyes narrow slightly into a " +
      'determined look, she holds it briefly, then her face relaxes.',
  },
  'hurt-and-relax': {
    prompt:
      'Yuna winces, one eye closing and her face tightening in discomfort, she holds ' +
      'the wince briefly, then her expression relaxes.',
  },
  'turn-left-and-back': {
    prompt:
      'Yuna turns her head about thirty degrees to her own left (her right eye, which ' +
      'is green, and her left eye, which is blue, both keep their colours the whole ' +
      'time), her shoulders and the background stay still, she holds the turned pose ' +
      'briefly, then turns her head back to face the camera.',
  },
  'turn-right-and-back': {
    prompt:
      'Yuna turns her head about thirty degrees to her own right (her right eye, which ' +
      'is green, and her left eye, which is blue, both keep their colours the whole ' +
      'time), her shoulders and the background stay still, she holds the turned pose ' +
      'briefly, then turns her head back to face the camera.',
  },
  'look-up-and-back': {
    prompt:
      'Yuna tilts her head upward slightly as if looking up, holds briefly, then ' +
      'lowers her head back down to face the camera.',
  },
  'hair-breeze': {
    prompt:
      'A light breeze lifts and sways Yuna\u2019s hair and her long braid gently, ' +
      'while her face stays still, then the breeze settles.',
  },
};

export function fullPrompt(name) {
  const clip = CLIP_SET[name];
  if (!clip) throw new Error(`Unknown clip "${name}". Known: ${Object.keys(CLIP_SET).join(', ')}`);
  return clip.prompt + NO_RESTYLE_SUFFIX;
}

// --------------------------------------------------------------------------
// ComfyUI API client (same shape as tools/gen/video.mjs / comfy.mjs)
// --------------------------------------------------------------------------

const CLIENT_ID = createHash('sha256')
  .update(`pyrefly-video-flf-${process.pid}-${Date.now()}`)
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
  if (json.error) throw new Error(`ComfyUI error: ${JSON.stringify(json.error, null, 2)}`);
  return json.prompt_id;
}

async function waitForResult(promptId, { timeoutMs = 90 * 60_000, onTick } = {}) {
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
    if (onTick) onTick();
    if (Date.now() > deadline) throw new Error(`Timed out waiting for prompt ${promptId}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

function imagesFrom(entry, nodeId) {
  const node = (entry.outputs || {})[nodeId];
  return (node && node.images) || [];
}

async function fetchImage({ filename, subfolder, type }) {
  const q = new URLSearchParams({ filename, subfolder: subfolder || '', type: type || 'output' });
  const res = await api(`/view?${q}`);
  return Buffer.from(await res.arrayBuffer());
}

// --------------------------------------------------------------------------
// Graph
// --------------------------------------------------------------------------

export function buildFlfGraph({
  imageFilename,
  positive,
  negative = WAN_NEGATIVE,
  width = WIDTH,
  height = HEIGHT,
  length = LENGTH,
  steps = 20,
  cfg = 5,
  sampler = 'uni_pc',
  scheduler = 'simple',
  shift = 8,
  seed,
  filenamePrefix,
}) {
  if (seed === undefined || seed === null) throw new Error('buildFlfGraph needs a seed');
  return {
    unet: { class_type: 'UNETLoader', inputs: { unet_name: UNET_NAME, weight_dtype: UNET_WEIGHT_DTYPE } },
    clip: { class_type: 'CLIPLoader', inputs: { clip_name: CLIP_NAME, type: 'wan' } },
    vae: { class_type: 'VAELoader', inputs: { vae_name: VAE_NAME } },
    clip_vision: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIP_VISION_NAME } },
    model: { class_type: 'ModelSamplingSD3', inputs: { model: ['unet', 0], shift } },
    positive_text: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['clip', 0] } },
    negative_text: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['clip', 0] } },
    start_image: { class_type: 'LoadImage', inputs: { image: imageFilename } },
    end_image: { class_type: 'LoadImage', inputs: { image: imageFilename } },
    start_vision: {
      class_type: 'CLIPVisionEncode',
      inputs: { clip_vision: ['clip_vision', 0], image: ['start_image', 0], crop: 'center' },
    },
    end_vision: {
      class_type: 'CLIPVisionEncode',
      inputs: { clip_vision: ['clip_vision', 0], image: ['end_image', 0], crop: 'center' },
    },
    flf: {
      class_type: 'WanFirstLastFrameToVideo',
      inputs: {
        positive: ['positive_text', 0],
        negative: ['negative_text', 0],
        vae: ['vae', 0],
        width,
        height,
        length,
        batch_size: 1,
        clip_vision_start_image: ['start_vision', 0],
        clip_vision_end_image: ['end_vision', 0],
        start_image: ['start_image', 0],
        end_image: ['end_image', 0],
      },
    },
    sample: {
      class_type: 'KSampler',
      inputs: {
        model: ['model', 0],
        positive: ['flf', 0],
        negative: ['flf', 1],
        latent_image: ['flf', 2],
        seed,
        steps,
        cfg,
        sampler_name: sampler,
        scheduler,
        denoise: 1,
      },
    },
    decode: { class_type: 'VAEDecode', inputs: { samples: ['sample', 0], vae: ['vae', 0] } },
    save_frames: {
      class_type: 'SaveImage',
      inputs: { images: ['decode', 0], filename_prefix: filenamePrefix },
    },
  };
}

// --------------------------------------------------------------------------
// nvidia-smi snapshot (best-effort; never fatal if it fails)
// --------------------------------------------------------------------------

export function gpuSnapshot() {
  try {
    const res = spawnSync(
      'nvidia-smi',
      ['--query-gpu=memory.used,memory.total,utilization.gpu', '--format=csv,noheader'],
      { encoding: 'utf8' },
    );
    if (res.status === 0) return res.stdout.trim();
  } catch {
    /* not available */
  }
  return null;
}

// --------------------------------------------------------------------------
// Render one clip/seed
// --------------------------------------------------------------------------

export async function renderClip(name, seed, opts = {}) {
  await waitForServer();
  let width = opts.width || WIDTH;
  let height = opts.height || HEIGHT;
  const imageFilename = preparePlate(opts.plate || PLATE_PATH, { width, height });
  const prompt = opts.prompt || fullPrompt(name);
  const filenamePrefix = `pyrefly-video-flf/${name}/${seed}/frame`;
  const workflow = buildFlfGraph({ imageFilename, positive: prompt, seed, filenamePrefix, width, height, ...opts });

  const outDir = join(OUT_ROOT, name, String(seed));
  mkdirSync(outDir, { recursive: true });

  const gpuBefore = gpuSnapshot();
  const t0 = Date.now();
  const promptId = await queuePrompt(workflow);
  let lastTick = t0;
  const entry = await waitForResult(promptId, {
    timeoutMs: opts.timeoutMs || 90 * 60_000,
    onTick: () => {
      const now = Date.now();
      if (now - lastTick > 30_000) {
        lastTick = now;
        process.stderr.write(
          `[video-flf] ${name} seed=${seed} still rendering (${Math.round((now - t0) / 1000)}s) gpu=${gpuSnapshot()}\n`,
        );
      }
    },
  });
  const wallMs = Date.now() - t0;
  const gpuAfter = gpuSnapshot();

  const frames = imagesFrom(entry, 'save_frames');
  if (!frames.length) throw new Error(`${name} seed=${seed}: ComfyUI returned no frames`);
  let i = 0;
  for (const img of frames) {
    const buf = await fetchImage(img);
    const framePath = join(outDir, `frame_${String(++i).padStart(5, '0')}.png`);
    writeFileSync(framePath, buf);
  }

  const stagedPlatePath = join(COMFY_INPUT_DIR, imageFilename);

  writeFileSync(
    join(outDir, 'job.json'),
    JSON.stringify(
      {
        name,
        seed,
        prompt,
        negative: WAN_NEGATIVE,
        model: UNET_NAME,
        weightDtype: UNET_WEIGHT_DTYPE,
        width,
        height,
        length: opts.length || LENGTH,
        fps: FPS,
        steps: opts.steps || 20,
        cfg: opts.cfg || 5,
        sampler: opts.sampler || 'uni_pc',
        scheduler: opts.scheduler || 'simple',
        shift: opts.shift || 8,
        wallMs,
        wallSeconds: Math.round(wallMs / 1000),
        frameCount: frames.length,
        renderedAt: new Date().toISOString(),
        plate: PLATE_PATH,
        stagedPlate: stagedPlatePath,
        gpuBefore,
        gpuAfter,
      },
      null,
      2,
    ),
  );

  return { outDir, wallMs, frameCount: frames.length, stagedPlatePath, width, height };
}

// --------------------------------------------------------------------------
// Join report: numpy MAD of frame 1 and frame N against the staged plate,
// full-frame and a fixed face box. Delegates the actual pixel math to a
// small python helper (numpy + Pillow, both present on this machine).
// --------------------------------------------------------------------------

export function joinReport(outDir, stagedPlatePath, { faceBox } = {}) {
  const have = readdirSync(outDir).filter((f) => /^frame_\d{5}\.png$/.test(f)).sort();
  if (!have.length) throw new Error(`No frames in ${outDir}`);
  const frame1 = join(outDir, have[0]);
  const frameN = join(outDir, have[have.length - 1]);
  const scriptPath = join(HERE, 'join_report.py');
  const outJson = join(outDir, 'join-report.json');
  const args = [scriptPath, stagedPlatePath, frame1, frameN, outJson];
  if (faceBox) args.push(JSON.stringify(faceBox));
  const res = spawnSync('python', args, { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`join_report.py failed:\n${res.stderr || res.stdout}`);
  }
  return JSON.parse(readFileSync(outJson, 'utf8'));
}

// --------------------------------------------------------------------------
// Contact sheet: frames 1/20/40/60/81 at 640px + 1:1 eye crops at 1/40/81 +
// the join-report numbers burned into the sheet as text.
// --------------------------------------------------------------------------

export function buildContactSheet(outDir, { name, seed, join: joinNums } = {}) {
  const wantedFrames = [1, 20, 40, 60, 81];
  const have = readdirSync(outDir).filter((f) => /^frame_\d{5}\.png$/.test(f));
  const maxFrame = have.length;
  const clamped = wantedFrames.map((n) => Math.min(n, maxFrame));
  const framePaths = clamped.map((n) => join(outDir, `frame_${String(n).padStart(5, '0')}.png`));
  for (const p of framePaths) {
    if (!existsSync(p)) throw new Error(`Missing frame for contact sheet: ${p}`);
  }

  const sheetPath = join(outDir, 'contact-sheet.png');
  // Eye crop box: fractional (0.30, 0.15) to (0.70, 0.48) of the frame --
  // both eyes plus brow, independent of resolution (1280x704 or 1024x576).
  const eyeSources = [framePaths[0], framePaths[2], framePaths[4]]; // 1, 40, 81
  const inputs = [];
  const filterParts = [];
  framePaths.forEach((p, idx) => {
    inputs.push('-i', p);
    filterParts.push(`[${idx}:v]scale=640:-1[row1_${idx}]`);
  });
  eyeSources.forEach((p, idx) => {
    inputs.push('-i', p);
    filterParts.push(
      `[${framePaths.length + idx}:v]crop=iw*0.40:ih*0.33:iw*0.30:ih*0.15,scale=640:-1:flags=neighbor[eye_${idx}]`,
    );
  });
  const row1Width = 640 * framePaths.length;
  const row1 = framePaths.map((_, idx) => `[row1_${idx}]`).join('');
  filterParts.push(`${row1}hstack=inputs=${framePaths.length}[row1]`);
  const row2 = eyeSources.map((_, idx) => `[eye_${idx}]`).join('');
  filterParts.push(`${row2}hstack=inputs=${eyeSources.length},pad=${row1Width}:ih:0:0:color=black[row2pad]`);
  filterParts.push('[row1][row2pad]vstack=inputs=2[stacked]');

  const j = joinNums || {};
  const label =
    `join MAD full: f1=${fmt(j.frame1?.fullMAD)} fN=${fmt(j.frameN?.fullMAD)}  ` +
    `face: f1=${fmt(j.frame1?.faceMAD)} fN=${fmt(j.frameN?.faceMAD)}`;
  const escaped = label.replace(/:/g, '\\:').replace(/'/g, "\\'");
  filterParts.push(
    `[stacked]drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${escaped}':x=10:y=h-30:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.6[out]`,
  );
  const filter = filterParts.join(';');

  const res = spawnSync('ffmpeg', ['-y', ...inputs, '-filter_complex', filter, '-map', '[out]', sheetPath], {
    encoding: 'utf8',
  });
  if (res.status !== 0 || !existsSync(sheetPath)) {
    throw new Error(`ffmpeg failed to build the contact sheet:\n${res.stderr || res.stdout}`);
  }
  return sheetPath;
}

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(1) : 'n/a';
}

// --------------------------------------------------------------------------
// CLI
// --------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (cmd === 'list') {
    for (const name of Object.keys(CLIP_SET)) {
      console.log(name);
      console.log('  ' + fullPrompt(name));
    }
    return;
  }

  if (cmd === 'render') {
    const name = args._[0];
    const seed = Number(args.seed || 1);
    const width = args.width ? Number(args.width) : WIDTH;
    const height = args.height ? Number(args.height) : HEIGHT;
    console.log(`[video-flf] rendering ${name} seed=${seed} ${width}x${height}...`);
    console.log(`[video-flf] gpu before: ${gpuSnapshot()}`);
    const { outDir, wallMs, frameCount, stagedPlatePath } = await renderClip(name, seed, { width, height });
    console.log(`[video-flf] ${name} seed=${seed}: ${frameCount} frames in ${(wallMs / 1000).toFixed(1)}s -> ${outDir}`);
    console.log(`[video-flf] gpu after: ${gpuSnapshot()}`);
    const webm = framesToWebm(outDir, { fps: FPS });
    console.log(`[video-flf] webm: ${webm.path} (${(webm.size / 1024).toFixed(0)} KiB, crf=${webm.crf})`);
    const jr = joinReport(outDir, stagedPlatePath);
    console.log(`[video-flf] join report: ${JSON.stringify(jr)}`);
    const sheet = buildContactSheet(outDir, { name, seed, join: jr });
    console.log(`[video-flf] contact sheet: ${sheet}`);
    return;
  }

  if (cmd === 'render-all') {
    const seed = Number(args.seed || 1);
    const width = args.width ? Number(args.width) : WIDTH;
    const height = args.height ? Number(args.height) : HEIGHT;
    const log = [];
    for (const name of Object.keys(CLIP_SET)) {
      console.log(`[video-flf] rendering ${name} seed=${seed}...`);
      const { outDir, wallMs, frameCount, stagedPlatePath } = await renderClip(name, seed, { width, height });
      const webm = framesToWebm(outDir, { fps: FPS });
      const jr = joinReport(outDir, stagedPlatePath);
      const sheet = buildContactSheet(outDir, { name, seed, join: jr });
      log.push({ name, seed, wallMs, frameCount, webm: webm.path, size: webm.size, sheet, join: jr });
      console.log(`[video-flf] ${name} seed=${seed}: ${(wallMs / 1000).toFixed(1)}s, join=${JSON.stringify(jr)}`);
    }
    mkdirSync(OUT_ROOT, { recursive: true });
    writeFileSync(join(OUT_ROOT, 'render-all-log.json'), JSON.stringify(log, null, 2));
    return;
  }

  if (cmd === 'join-report') {
    const [name, seed] = args._;
    const outDir = join(OUT_ROOT, name, String(seed));
    const jobPath = join(outDir, 'job.json');
    const job = JSON.parse(readFileSync(jobPath, 'utf8'));
    const jr = joinReport(outDir, job.stagedPlate);
    console.log(JSON.stringify(jr, null, 2));
    return;
  }

  if (cmd === 'contact-sheet') {
    const [name, seed] = args._;
    const outDir = join(OUT_ROOT, name, String(seed));
    let jr;
    try {
      jr = JSON.parse(readFileSync(join(outDir, 'join-report.json'), 'utf8'));
    } catch {
      jr = null;
    }
    const sheet = buildContactSheet(outDir, { name, seed: Number(seed), join: jr });
    console.log(sheet);
    return;
  }

  console.error(
    'Usage:\n' +
      '  node tools/gen/video-flf.mjs list\n' +
      '  node tools/gen/video-flf.mjs render <clip> [--seed N] [--width W --height H]\n' +
      '  node tools/gen/video-flf.mjs render-all [--seed N]\n' +
      '  node tools/gen/video-flf.mjs join-report <clip> <seed>\n' +
      '  node tools/gen/video-flf.mjs contact-sheet <clip> <seed>\n',
  );
  process.exitCode = 1;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch((err) => {
    console.error(err.stack || err.message || err);
    process.exitCode = 1;
  });
}
