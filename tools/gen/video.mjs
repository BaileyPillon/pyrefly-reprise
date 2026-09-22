#!/usr/bin/env node
/**
 * Wan 2.2 TI2V-5B image-to-video client for Pyrefly Reprise's living-portrait
 * video preview (docs/plans/pause-living-portraits-motion-spec.md).
 *
 * Node built-ins only (plus `ffmpeg` on PATH for the final WebM pass). Talks
 * to the same locally running ComfyUI as `tools/gen/comfy.mjs`: POST /prompt
 * with a workflow in "API format", poll /history/<id>, pull frames from
 * /view. The queue/poll/fetch helpers below are the same shape as
 * `comfy.mjs`'s (reused by inlining, not importing, so this file has no
 * dependency on the txt2img-only pieces of that module).
 *
 * Graph (read from /object_info on this ComfyUI, never guessed):
 *   UNETLoader(wan2.2_ti2v_5B_fp16.safetensors)
 *     -> ModelSamplingSD3(shift)
 *   CLIPLoader(umt5_xxl_fp8_e4m3fn_scaled.safetensors, type=wan)
 *     -> CLIPTextEncode positive / negative
 *   VAELoader(wan2.2_vae.safetensors)
 *   LoadImage(staged start frame) + VAELoader + size/length
 *     -> Wan22ImageToVideoLatent
 *   KSampler(uni_pc, denoise=1) -> VAEDecode
 *     -> SaveImage (PNG sequence, the frames the contact sheet reads)
 *     -> SaveAnimatedWEBP (a quick-look animated preview)
 * The committed deliverable is a VP9 WebM made from the PNG sequence by
 * `ffmpeg` afterwards (`framesToWebm`) — ComfyUI's own SaveVideo node has a
 * dynamic-combo `format` input that is awkward to fill blind in API format,
 * and the brief asks for the ffmpeg pass regardless.
 *
 * Usage:
 *   node tools/gen/video.mjs render idle-breathing --seed 1
 *   node tools/gen/video.mjs render idle-breathing --seed 1 --seed 2
 *   node tools/gen/video.mjs render-all                # every clip, both seeds
 *   node tools/gen/video.mjs list                       # print the clip set
 *   node tools/gen/video.mjs contact-sheet idle-breathing 1
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
  copyFileSync,
} from 'node:fs';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

const HOST = process.env.COMFY_HOST || '127.0.0.1';
const PORT = Number(process.env.COMFY_PORT || 8188);
const BASE = `http://${HOST}:${PORT}`;

const COMFY_ROOT = process.env.COMFY_ROOT || 'D:/Tools/ComfyUI';
const COMFY_INPUT_DIR = process.env.COMFY_INPUT || join(COMFY_ROOT, 'ComfyUI', 'input');
const COMFY_OUTPUT_DIR = process.env.COMFY_OUTPUT || join(COMFY_ROOT, 'output');

/** Approved downloads only (docs/handoff/NOW.md, Bailey 2026-09-21). */
export const UNET_NAME = process.env.WAN_UNET || 'wan2.2_ti2v_5B_fp16.safetensors';
export const CLIP_NAME = process.env.WAN_CLIP || 'umt5_xxl_fp8_e4m3fn_scaled.safetensors';
export const VAE_NAME = process.env.WAN_VAE || 'wan2.2_vae.safetensors';

/** Native Wan 2.2 TI2V-5B size: 1280x704 @ 24 fps, 121 frames = ~5.04 s. */
export const WIDTH = 1280;
export const HEIGHT = 704;
export const FPS = 24;
export const LENGTH = 121;

/**
 * The standard Wan negative prompt (Alibaba's own model-card text, reused
 * verbatim by ComfyUI's Wan templates). Left in the original Chinese —
 * translating it is not "the standard prompt" any more.
 */
export const WAN_NEGATIVE =
  '色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，' +
  '最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，' +
  '画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，' +
  '杂乱的背景，三条腿，背景人很多，倒着走';

/** Every clip must keep this true — no restyling, no camera move. */
const NO_RESTYLE_SUFFIX =
  ', the camera is locked, the background does not move, ' +
  'painted anime illustration style unchanged, three-quarter view unchanged, ' +
  'she returns to the exact starting pose and expression at the end of the clip';

export const OUT_ROOT = process.env.PYREFLY_VIDEO_OUT || 'D:/Tools/pyrefly-video';

/** The plate: Bailey's approved prototype-v1 character (2026-09-21). */
export const PLATE_PATH = join(REPO_ROOT, 'public/art/pause/yuna-ffx2.png');
export const PLATE_SIDECAR = join(REPO_ROOT, 'public/art/pause/yuna-ffx2.json');

// --------------------------------------------------------------------------
// The clip set — plain-English motion only, this exact character, no camera
// move, each one ending back at the starting pose so clips chain.
// --------------------------------------------------------------------------

export const CLIP_SET = {
  'idle-breathing': {
    prompt:
      "Yuna breathes gently, her chest rising and falling subtly, a slow single blink " +
      "partway through, a tiny natural drift of her head, otherwise she holds her pose " +
      "and expression, then settles back to the exact starting position.",
  },
  'idle-blinks': {
    prompt:
      "Yuna blinks twice fully, then does one half-blink where her eyelids only partly " +
      "close, otherwise she stays still holding her pose and expression, then returns " +
      "to the starting pose with her eyes open.",
  },
  'turn-left-and-back': {
    prompt:
      "Yuna turns her head to her own left by about sixty degrees while her shoulders " +
      "and body stay still, holds the turned pose briefly, then turns her head back to " +
      "face forward at the camera, ending in the exact starting pose.",
  },
  'turn-right-and-back': {
    prompt:
      "Yuna turns her head to her own right by about sixty degrees while her shoulders " +
      "and body stay still, holds the turned pose briefly, then turns her head back to " +
      "face forward at the camera, ending in the exact starting pose.",
  },
  'look-up-and-back': {
    prompt:
      "Yuna tilts her head upward slightly as if looking up, holds briefly, then lowers " +
      "her head back down to face the camera, ending in the exact starting pose.",
  },
  smile: {
    prompt:
      "A warm smile slowly grows across Yuna's face over about half a second, reaching " +
      "a gentle happy expression, she holds it briefly, then her expression relaxes " +
      "back to her neutral starting expression.",
  },
  determined: {
    prompt:
      "Yuna's eyebrows lower and her jaw sets firmly, her eyes narrow slightly into a " +
      "determined expression, she holds it briefly, then her face relaxes back to her " +
      "neutral starting expression.",
  },
  hurt: {
    prompt:
      "Yuna winces suddenly, one eye closing and her face tightening in discomfort, " +
      "she holds the wince briefly, then her expression relaxes back to her neutral " +
      "starting expression.",
  },
  'hair-breeze': {
    prompt:
      "A light breeze moves through Yuna's hair and her long braid, gently lifting and " +
      "swaying the loose strands, while her face and body stay still, then the breeze " +
      "settles and her hair returns to its starting position.",
  },
};

export function fullPrompt(name) {
  const clip = CLIP_SET[name];
  if (!clip) throw new Error(`Unknown clip "${name}". Known: ${Object.keys(CLIP_SET).join(', ')}`);
  return clip.prompt + NO_RESTYLE_SUFFIX;
}

// --------------------------------------------------------------------------
// ComfyUI API client (same pattern as tools/gen/comfy.mjs)
// --------------------------------------------------------------------------

const CLIENT_ID = createHash('sha256')
  .update(`pyrefly-video-${process.pid}-${Date.now()}`)
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

export async function waitForServer(timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(`${BASE}/system_stats`);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`ComfyUI did not answer on ${BASE} in time`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

/** Reads /object_info for one node and returns it, or throws if it is missing —
 * never guess an input name, per AGENTS.md "prove it by running the engine". */
export async function nodeSchema(className) {
  const res = await api(`/object_info/${className}`);
  const json = await res.json();
  if (!json[className]) throw new Error(`ComfyUI has no node "${className}" (no custom nodes may be installed)`);
  return json[className];
}

async function queuePrompt(workflow) {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ComfyUI rejected the workflow (${res.status}):\n${text}`);
  }
  const json = JSON.parse(text);
  if (json.error) throw new Error(`ComfyUI error: ${JSON.stringify(json.error)}`);
  return json.prompt_id;
}

async function waitForResult(promptId, { timeoutMs = 45 * 60_000, onTick } = {}) {
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
    await new Promise((r) => setTimeout(r, 2000));
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
// Start-image staging: fit the 1344x768 plate into Wan's native 1280x704.
//
// 1344x768 is aspect 1.750; the native frame is 1280x704 = aspect 1.818
// (proportionally wider/shorter). Scaling to fit width (1280) makes the
// height 731px — 27px (3.7%) taller than 704, so we CENTER-CROP that excess
// off the top and bottom rather than letterbox. The sidecar's focal point
// (yuna-ffx2.json: focal.y = 0.33, well inside the frame, headroom above)
// means a symmetric ~13px-per-edge crop cannot touch the head. Recorded here
// rather than guessed per-run.
// --------------------------------------------------------------------------

export function preparePlate(srcPath = PLATE_PATH, { width = WIDTH, height = HEIGHT } = {}) {
  if (!existsSync(srcPath)) throw new Error(`Plate not found: ${srcPath}`);
  const digest = createHash('sha256').update(readFileSync(srcPath)).digest('hex').slice(0, 12);
  mkdirSync(COMFY_INPUT_DIR, { recursive: true });
  const staged = `pyrefly-video-plate-${digest}-${width}x${height}.png`;
  const target = join(COMFY_INPUT_DIR, staged);
  if (existsSync(target)) return staged;

  // scale to fill width, center-crop height (see note above)
  const filter = `scale=${width}:-1:flags=lanczos,crop=${width}:${height}`;
  const res = spawnSync('ffmpeg', ['-y', '-i', srcPath, '-vf', filter, target], {
    encoding: 'utf8',
  });
  if (res.status !== 0 || !existsSync(target)) {
    throw new Error(`ffmpeg failed to prepare the plate:\n${res.stderr || res.stdout}`);
  }
  return staged;
}

// --------------------------------------------------------------------------
// Graph
// --------------------------------------------------------------------------

export function buildGraph({
  imageFilename,
  positive,
  negative = WAN_NEGATIVE,
  width = WIDTH,
  height = HEIGHT,
  length = LENGTH,
  fps = FPS,
  steps = 24,
  cfg = 5,
  sampler = 'uni_pc',
  scheduler = 'simple',
  shift = 8,
  seed,
  filenamePrefix,
}) {
  if (seed === undefined || seed === null) throw new Error('buildGraph needs a seed');
  return {
    unet: { class_type: 'UNETLoader', inputs: { unet_name: UNET_NAME, weight_dtype: 'default' } },
    clip: { class_type: 'CLIPLoader', inputs: { clip_name: CLIP_NAME, type: 'wan' } },
    vae: { class_type: 'VAELoader', inputs: { vae_name: VAE_NAME } },
    model: { class_type: 'ModelSamplingSD3', inputs: { model: ['unet', 0], shift } },
    positive: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['clip', 0] } },
    negative: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['clip', 0] } },
    start_image: { class_type: 'LoadImage', inputs: { image: imageFilename } },
    latent: {
      class_type: 'Wan22ImageToVideoLatent',
      inputs: { vae: ['vae', 0], width, height, length, batch_size: 1, start_image: ['start_image', 0] },
    },
    sample: {
      class_type: 'KSampler',
      inputs: {
        model: ['model', 0],
        positive: ['positive', 0],
        negative: ['negative', 0],
        latent_image: ['latent', 0],
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
    save_webp: {
      class_type: 'SaveAnimatedWEBP',
      inputs: {
        images: ['decode', 0],
        filename_prefix: filenamePrefix,
        fps,
        lossless: false,
        quality: 85,
        method: 'default',
      },
    },
  };
}

// --------------------------------------------------------------------------
// Render one clip/seed, download its frames, convert to WebM
// --------------------------------------------------------------------------

export async function renderClip(name, seed, opts = {}) {
  await waitForServer();
  const imageFilename = preparePlate(opts.plate || PLATE_PATH);
  const prompt = opts.prompt || fullPrompt(name);
  const filenamePrefix = `pyrefly-video/${name}/${seed}/frame`;
  const workflow = buildGraph({ imageFilename, positive: prompt, seed, filenamePrefix, ...opts });

  const outDir = join(OUT_ROOT, name, String(seed));
  mkdirSync(outDir, { recursive: true });

  const t0 = Date.now();
  const promptId = await queuePrompt(workflow);
  let lastTick = t0;
  const entry = await waitForResult(promptId, {
    timeoutMs: opts.timeoutMs || 45 * 60_000,
    onTick: () => {
      const now = Date.now();
      if (now - lastTick > 30_000) {
        lastTick = now;
        process.stderr.write(`[video] ${name} seed=${seed} still rendering (${Math.round((now - t0) / 1000)}s)\n`);
      }
    },
  });
  const wallMs = Date.now() - t0;

  const frames = imagesFrom(entry, 'save_frames');
  if (!frames.length) throw new Error(`${name} seed=${seed}: ComfyUI returned no frames`);
  let i = 0;
  for (const img of frames) {
    const buf = await fetchImage(img);
    const framePath = join(outDir, `frame_${String(++i).padStart(5, '0')}.png`);
    writeFileSync(framePath, buf);
  }
  const webp = imagesFrom(entry, 'save_webp')[0];
  if (webp) {
    const buf = await fetchImage(webp);
    writeFileSync(join(outDir, 'preview.webp'), buf);
  }

  writeFileSync(
    join(outDir, 'job.json'),
    JSON.stringify(
      {
        name,
        seed,
        prompt,
        negative: WAN_NEGATIVE,
        width: opts.width || WIDTH,
        height: opts.height || HEIGHT,
        length: opts.length || LENGTH,
        fps: opts.fps || FPS,
        steps: opts.steps || 24,
        cfg: opts.cfg || 5,
        sampler: opts.sampler || 'uni_pc',
        scheduler: opts.scheduler || 'simple',
        shift: opts.shift || 8,
        wallMs,
        frameCount: frames.length,
        renderedAt: new Date().toISOString(),
        plate: PLATE_PATH,
        plateFit: 'scale-to-width-1280, center-crop height to 704 (see preparePlate)',
      },
      null,
      2,
    ),
  );

  return { outDir, wallMs, frameCount: frames.length };
}

// --------------------------------------------------------------------------
// ffmpeg: PNG sequence -> VP9 WebM, sized under a byte budget
// --------------------------------------------------------------------------

export function framesToWebm(outDir, { fps = FPS, maxBytes = 3 * 1024 * 1024 } = {}) {
  const pattern = join(outDir, 'frame_%05d.png');
  const target = join(outDir, 'clip.webm');
  // -b:v 0 + -crf N is VP9's constant-quality mode; start tight and relax the
  // quality only as far as needed to fit the budget (never the reverse).
  const crfLadder = [30, 34, 38, 42, 46];
  let lastErr;
  for (const crf of crfLadder) {
    const res = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-framerate', String(fps),
        '-i', pattern,
        '-c:v', 'libvpx-vp9',
        '-b:v', '0',
        '-crf', String(crf),
        '-pix_fmt', 'yuv420p',
        '-row-mt', '1',
        target,
      ],
      { encoding: 'utf8' },
    );
    if (res.status !== 0) {
      lastErr = res.stderr || res.stdout;
      continue;
    }
    const size = statSync(target).size;
    if (size <= maxBytes) return { path: target, size, crf };
    lastErr = `crf=${crf} produced ${size} bytes (over ${maxBytes})`;
  }
  throw new Error(`Could not fit ${outDir} under ${maxBytes} bytes: ${lastErr}`);
}

// --------------------------------------------------------------------------
// Contact sheet: frames 1/30/60/90/121 + 1:1 eye crops at frame 1 and 60
// --------------------------------------------------------------------------

export function buildContactSheet(outDir, { name, seed } = {}) {
  const frameNums = [1, 30, 60, 90, 121];
  const have = readdirSync(outDir).filter((f) => /^frame_\d{5}\.png$/.test(f));
  const maxFrame = have.length;
  const clamped = frameNums.map((n) => Math.min(n, maxFrame));
  const framePaths = clamped.map((n) => join(outDir, `frame_${String(n).padStart(5, '0')}.png`));
  for (const p of framePaths) {
    if (!existsSync(p)) throw new Error(`Missing frame for contact sheet: ${p}`);
  }

  const sheetPath = join(outDir, 'contact-sheet.png');
  // Row 1: five frames at 640px wide. Row 2: 1:1 eye crops of frame 1 and
  // frame 60, cropped from a fixed upper-band of the 1280x704 frame (the
  // face sits in the top ~55% given focal.y = 0.33) then scaled up 2x so a
  // small identity drift is visible.
  const eyeCropFilter = 'crop=520:220:380:120,scale=1040:440:flags=neighbor';
  const inputs = [];
  const filterParts = [];
  framePaths.forEach((p, idx) => {
    inputs.push('-i', p);
    filterParts.push(`[${idx}:v]scale=640:-1[row1_${idx}]`);
  });
  const eyeSources = [framePaths[0], framePaths[2]]; // frame 1 and frame 60
  eyeSources.forEach((p, idx) => {
    inputs.push('-i', p);
    filterParts.push(`[${framePaths.length + idx}:v]${eyeCropFilter}[eye_${idx}]`);
  });
  const row1Width = 640 * framePaths.length;
  const row1 = framePaths.map((_, idx) => `[row1_${idx}]`).join('');
  filterParts.push(`${row1}hstack=inputs=${framePaths.length}[row1]`);
  filterParts.push(`[eye_0][eye_1]hstack=inputs=2,pad=${row1Width}:ih:0:0:color=black[row2pad]`);
  filterParts.push('[row1][row2pad]vstack=inputs=2[out]');
  const filter = filterParts.join(';');

  const res = spawnSync('ffmpeg', ['-y', ...inputs, '-filter_complex', filter, '-map', '[out]', sheetPath], {
    encoding: 'utf8',
  });
  if (res.status !== 0 || !existsSync(sheetPath)) {
    throw new Error(`ffmpeg failed to build the contact sheet:\n${res.stderr || res.stdout}`);
  }
  return sheetPath;
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
        if (args[key] === undefined) args[key] = next;
        else if (Array.isArray(args[key])) args[key].push(next);
        else args[key] = [args[key], next];
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
    const seeds = (Array.isArray(args.seed) ? args.seed : [args.seed || '1']).map(Number);
    for (const seed of seeds) {
      console.log(`[video] rendering ${name} seed=${seed}...`);
      const { outDir, wallMs, frameCount } = await renderClip(name, seed);
      console.log(`[video] ${name} seed=${seed}: ${frameCount} frames in ${(wallMs / 1000).toFixed(1)}s -> ${outDir}`);
      const webm = framesToWebm(outDir);
      console.log(`[video] webm: ${webm.path} (${(webm.size / 1024).toFixed(0)} KiB, crf=${webm.crf})`);
      const sheet = buildContactSheet(outDir, { name, seed });
      console.log(`[video] contact sheet: ${sheet}`);
    }
    return;
  }

  if (cmd === 'render-all') {
    const seeds = (Array.isArray(args.seed) ? args.seed : args.seed ? [args.seed] : ['1', '2']).map(Number);
    const log = [];
    for (const name of Object.keys(CLIP_SET)) {
      for (const seed of seeds) {
        console.log(`[video] rendering ${name} seed=${seed}...`);
        const { outDir, wallMs, frameCount } = await renderClip(name, seed);
        const webm = framesToWebm(outDir);
        const sheet = buildContactSheet(outDir, { name, seed });
        log.push({ name, seed, wallMs, frameCount, webm: webm.path, size: webm.size, sheet });
        console.log(`[video] ${name} seed=${seed}: ${(wallMs / 1000).toFixed(1)}s, webm ${(webm.size / 1024).toFixed(0)} KiB`);
      }
    }
    mkdirSync(OUT_ROOT, { recursive: true });
    writeFileSync(join(OUT_ROOT, 'render-all-log.json'), JSON.stringify(log, null, 2));
    return;
  }

  if (cmd === 'contact-sheet') {
    const [name, seed] = args._;
    const outDir = join(OUT_ROOT, name, String(seed));
    const sheet = buildContactSheet(outDir, { name, seed: Number(seed) });
    console.log(sheet);
    return;
  }

  if (cmd === 'webm') {
    const [name, seed] = args._;
    const outDir = join(OUT_ROOT, name, String(seed));
    const webm = framesToWebm(outDir);
    console.log(JSON.stringify(webm));
    return;
  }

  if (cmd === 'plate') {
    const staged = preparePlate();
    console.log(join(COMFY_INPUT_DIR, staged));
    return;
  }

  console.error(
    'Usage:\n' +
      '  node tools/gen/video.mjs list\n' +
      '  node tools/gen/video.mjs render <clip> [--seed N ...]\n' +
      '  node tools/gen/video.mjs render-all [--seed N ...]\n' +
      '  node tools/gen/video.mjs contact-sheet <clip> <seed>\n' +
      '  node tools/gen/video.mjs webm <clip> <seed>\n' +
      '  node tools/gen/video.mjs plate\n',
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
