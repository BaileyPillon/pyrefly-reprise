#!/usr/bin/env node
/**
 * ComfyUI generation client for Pyrefly Reprise art.
 *
 * Node built-ins only. Talks to a locally running ComfyUI (see
 * `docs/ART-PIPELINE.md`) over its HTTP API: POST /prompt with a workflow in
 * "API format", poll /history/<id>, pull the finished PNG from /view.
 *
 * Three presets:
 *   character  832x1216 portrait -> rembg cutout -> auto-crop -> .png + .json
 *   boss       1216x832 landscape (or --size 1024x1024), same cutout
 *   backdrop   1344x768 -> RealESRGAN 4x -> downscale 0.5 -> 2688x1536 .png
 *
 * Usage:
 *   node tools/gen/comfy.mjs character --name tidus \
 *     --tags "1boy, tidus, final fantasy x, ..." \
 *     --pose idle --poseTags "fighting stance, ..." \
 *     --out public/art/characters/tidus/idle.png [--batch 3]
 *
 *   node tools/gen/comfy.mjs backdrop --name gagazet \
 *     --tags "snowy mountain pass at night, ..." \
 *     --out public/art/backdrops/gagazet.png
 *
 * Reference consistency (v2): `--ref <png>` runs the prompt through IP-Adapter
 * with the given image as the identity anchor, so a new *pose* keeps the face,
 * hair and outfit of an already-approved sprite. `--img2img <png>` is the
 * blunter fallback (redraw the pixels at `--denoise`).
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, copyFileSync, readFileSync } from 'node:fs';
import { dirname, resolve, join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const HERE = dirname(fileURLToPath(import.meta.url));

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

const HOST = process.env.COMFY_HOST || '127.0.0.1';
const PORT = Number(process.env.COMFY_PORT || 8188);
const BASE = `http://${HOST}:${PORT}`;

const COMFY_ROOT = process.env.COMFY_ROOT || 'D:/Tools/ComfyUI';
const EMBEDDED_PYTHON = join(COMFY_ROOT, 'python_embeded', 'python.exe');

const CHECKPOINT = process.env.COMFY_CKPT || 'animagine-xl-4.0-opt.safetensors';
const UPSCALE_MODEL = process.env.COMFY_UPSCALER || 'RealESRGAN_x4plus.pth';

/**
 * ComfyUI's own `input/` folder. `LoadImage` can only see files that live
 * here, so `--ref` / `--img2img` copy (and flatten) the repo file into it
 * first. COMFY_ROOT is the portable bundle; the app itself is one level in.
 */
const COMFY_INPUT_DIR =
  process.env.COMFY_INPUT || join(COMFY_ROOT, 'ComfyUI', 'input');

/** IP-Adapter pair — see docs/ART-PIPELINE.md §1. Both live under models/. */
const IPADAPTER_MODEL =
  process.env.COMFY_IPADAPTER || 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIP_VISION_MODEL =
  process.env.COMFY_CLIPVISION || 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';

/**
 * How hard the reference pulls.
 *
 * 0.65 is the useful middle: identity, hair and costume carry over from the
 * idle, but the pose prompt still wins the argument about limbs. Above ~0.85
 * the adapter starts reproducing the reference *pose* too and `--poseTags`
 * stops mattering; below ~0.45 the costume drifts again and you may as well
 * not bother.
 */
export const REF_WEIGHT_DEFAULT = 0.65;

/**
 * When the reference starts pulling.
 *
 * Not at step zero. Composition is decided in the first fifth of the denoise,
 * and an adapter that is running then reproduces the reference's *pose* — on a
 * fixed seed, an "attacking, swinging sword" prompt came back as the idle's
 * planted stance with cropped legs, three times out of three, at every weight
 * from 0.45 up. Letting the prompt lay out the figure first and switching the
 * reference on at 0.25 keeps the pose the prompt asked for and still lands the
 * face, hair and costume. This flag, not `--refWeight`, is the one that makes
 * `--ref` usable.
 */
export const REF_START_DEFAULT = 0.25;

/**
 * When the reference lets go.
 *
 * The last 15% of the denoise runs unassisted. Left on to the very end the
 * adapter carries the reference's local *material* as well as its identity:
 * Tidus's idle handed later poses its iridescent blade and red-and-blue
 * shoulder plate as an all-over chrome gloss, and the cel-shading contract
 * went with it. Surface is settled late, so hand the last steps back to the
 * checkpoint and the style tags.
 */
export const REF_END_DEFAULT = 0.85;

/** img2img strength. 0.55 keeps the silhouette, repaints everything else. */
export const IMG2IMG_DENOISE_DEFAULT = 0.55;

/**
 * THE STYLE CONTRACT.
 *
 * Every character in the cast shares these two blocks verbatim so the roster
 * reads as one art department. Do not tweak them per character — if the style
 * needs to move, move it here and re-render everybody.
 *
 * Tag order follows the Animagine XL 4.0 model card:
 *   subject count, character name, series, rating, everything else, quality
 * Quality/score tags go LAST. (The card's score tags — `high score, great
 * score` — are what this model was trained on; the v3.1-era `very aesthetic`
 * block does nothing here.)
 *
 * Two tags were deliberately tried and dropped, both A/B'd on a fixed seed:
 *   - `clean lineart` pulls hard toward flat inked manga art — large dead
 *     black fills, desaturated everything. Wrong for a painted 2.5D look.
 *   - `painterly` renders beautifully but sprays loose paint-splatter around
 *     the figure, which rembg then keeps as opaque content: the cutout gains
 *     confetti and `baselineY` lands under a blob instead of the feet.
 */
export const STYLE_TAGS =
  'official art, cel shading, soft shading, vibrant colors, rim lighting, colorful, detailed';
export const QUALITY_TAGS = 'masterpiece, high score, great score, absurdres';

/**
 * Composition block that makes a full-body sprite cut out cleanly.
 *
 * v2 (2026-09-15): `straight-on` and `feet visible` were added after the
 * proof-of-concept round found that ~2 in 3 rejected variants were rejected
 * for *camera*, not costume — bird's-eye and dutch-tilt framings that no
 * amount of pose tagging cured. `standing on ground` became plain `standing`
 * because "ground" kept summoning a textured floor plane into what is
 * supposed to be a flat white cyclorama.
 *
 * This is part of the shared contract: changing it means re-rendering the
 * roster, not one character.
 */
export const CHARACTER_COMPOSITION =
  'straight-on, full body, standing, feet visible, simple background, white background';

/**
 * Framing for bosses. They are rarely bipeds standing politely on a floor —
 * they float, coil, or fill the frame — so `standing, feet visible` is wrong
 * and actively fights forms like Yu Yevon or Vegnagun. Select with
 * `--composition boss` (the `boss` preset does it for you).
 */
export const BOSS_COMPOSITION =
  'straight-on, full body, centered, imposing, simple background, white background';

/**
 * Framing for dialogue/menu portraits. Same style and quality blocks as the
 * sprites — only the framing changes, so a portrait still looks like it came
 * out of the same art department. Select it with `--composition portrait`.
 */
export const PORTRAIT_COMPOSITION =
  'portrait, close-up, upper body, looking at viewer, simple background, white background';

/**
 * Framing for downed/KO poses. `full` says "standing on ground", which
 * actively fights a lying-down pose — the sampler splits the difference and
 * gives you a crouch. Select with `--composition prone`.
 */
export const PRONE_COMPOSITION =
  'lying on ground, on side, eyes closed, full body, from side, simple background, white background';

const COMPOSITIONS = {
  full: CHARACTER_COMPOSITION,
  portrait: PORTRAIT_COMPOSITION,
  prone: PRONE_COMPOSITION,
  boss: BOSS_COMPOSITION,
};

export const BASE_NEGATIVE = [
  'lowres',
  'bad anatomy',
  'bad hands',
  'text',
  'error',
  'missing finger',
  'extra digits',
  'fewer digits',
  'cropped',
  'worst quality',
  'low quality',
  'low score',
  'bad score',
  'average score',
  'jpeg artifacts',
  'signature',
  'watermark',
  'username',
  'blurry',
  'artist name',
  'multiple views',
  'multiple girls',
  'multiple boys',
  '2girls',
  '2boys',
].join(', ');

/**
 * Sprite-only negatives, on top of the shared block.
 *
 * Anything opaque that is not the character is not just ugly — rembg keeps it,
 * so it becomes part of the cutout and drags `baselineY` out to the canvas
 * edge. `motion lines` and `action pose` in a pose prompt reliably spray a
 * coloured swirl around the figure on this checkpoint (the same failure that
 * got `painterly` struck from the style block), and the crop box comes back as
 * the whole 832x1216 frame. These four tags cost nothing and stop it.
 *
 * Deliberately NOT in `BASE_NEGATIVE`: backdrops inherit that, and
 * `chapter-select` is *supposed* to be an abstract coloured field.
 */
export const SPRITE_NEGATIVE = `${BASE_NEGATIVE}, paint splatter, ink splash, colorful background, abstract background`;

export const BACKDROP_NEGATIVE = `${BASE_NEGATIVE}, 1girl, 1boy, character, people, person, human`;

/**
 * Per-shot negative additions, appended to the shared negative with `--negAdd`.
 *
 * Needed because some scene names collide with real English once CLIP
 * tokenizes them. "farplane" splits into "far" + "plane" and reliably summons
 * biplanes over the flower field — the fix is to drop the coined word from the
 * positive prompt and ban aircraft here.
 */
export function withNegAdd(base, extra) {
  return extra ? joinTags(base, escapeTags(extra)) : base;
}

// --------------------------------------------------------------------------
// Prompt helpers
// --------------------------------------------------------------------------

/**
 * Escape Danbooru tags that contain parentheses.
 *
 * `brotherhood (sword)` is a literal tag, but bare parens are *emphasis*
 * syntax to the CLIP text encoder — unescaped they silently reweight the
 * prompt instead of naming the weapon. Already-escaped parens are left alone.
 */
export function escapeTags(text) {
  if (text === undefined || text === null || text === true) return '';
  return String(text).replace(/\\?[()]/g, (m) => (m.startsWith('\\') ? m : `\\${m}`));
}

/** Join prompt fragments, dropping empties and collapsing comma runs. */
export function joinTags(...parts) {
  return parts
    .filter((p) => p && String(p).trim())
    .map((p) => String(p).trim().replace(/,\s*$/, ''))
    .join(', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(,\s*)+/g, ', ')
    .trim();
}

/** Deterministic per-character seed so re-runs reproduce the same cast. */
export function seedFromName(name) {
  const h = createHash('sha256').update(String(name)).digest();
  // Keep it under 2^31 — plenty of entropy, avoids any 64-bit JSON rounding.
  return h.readUInt32BE(0) % 2147483647;
}

export function buildCharacterPrompt({ tags, poseTags, composition = 'full' }) {
  const framing = COMPOSITIONS[composition];
  if (!framing) {
    throw new Error(
      `Unknown --composition "${composition}" (expected: ${Object.keys(COMPOSITIONS).join(', ')})`,
    );
  }
  return joinTags(escapeTags(tags), escapeTags(poseTags), framing, STYLE_TAGS, QUALITY_TAGS);
}

export function buildBackdropPrompt({ tags }) {
  return joinTags(
    'no humans, scenery',
    escapeTags(tags),
    'detailed background, painterly, cinematic lighting, wide shot',
    QUALITY_TAGS,
  );
}

// --------------------------------------------------------------------------
// Workflow graphs (ComfyUI "API format")
// --------------------------------------------------------------------------

function baseTxt2Img({
  positive,
  negative,
  width,
  height,
  seed,
  steps,
  cfg,
  sampler,
  scheduler,
  refImage,
  refWeight = REF_WEIGHT_DEFAULT,
  refWeightType = 'linear',
  refScaling = 'K+V',
  refStart = REF_START_DEFAULT,
  refEnd = REF_END_DEFAULT,
  initImage,
  denoise = 1,
}) {
  const g = {
    4: {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: CHECKPOINT },
    },
    5: {
      class_type: 'EmptyLatentImage',
      inputs: { width, height, batch_size: 1 },
    },
    6: {
      class_type: 'CLIPTextEncode',
      inputs: { text: positive, clip: ['4', 1] },
    },
    7: {
      class_type: 'CLIPTextEncode',
      inputs: { text: negative, clip: ['4', 1] },
    },
    3: {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: sampler,
        scheduler,
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
    },
    8: {
      class_type: 'VAEDecode',
      inputs: { samples: ['3', 0], vae: ['4', 2] },
    },
  };

  // --- reference identity (IP-Adapter) -------------------------------------
  // The adapter patches the MODEL, so it sits between the checkpoint and the
  // sampler. Everything else in the graph is untouched, which is why --ref
  // composes with --img2img, --composition and the batch loop.
  if (refImage) {
    g['20'] = {
      class_type: 'LoadImage',
      inputs: { image: refImage, upload: 'image' },
    };
    g['21'] = {
      class_type: 'IPAdapterModelLoader',
      inputs: { ipadapter_file: IPADAPTER_MODEL },
    };
    g['22'] = {
      class_type: 'CLIPVisionLoader',
      inputs: { clip_name: CLIP_VISION_MODEL },
    };
    g['23'] = {
      class_type: 'IPAdapterAdvanced',
      inputs: {
        model: ['4', 0],
        ipadapter: ['21', 0],
        image: ['20', 0],
        weight: refWeight,
        // 'linear' spreads the reference over the whole denoise. The tempting
        // 'style transfer' type carries palette but drops the costume, which
        // is exactly the thing we are here to keep.
        weight_type: refWeightType,
        combine_embeds: 'concat',
        start_at: refStart,
        end_at: refEnd,
        // 'K+V' rather than the node's 'V only' default: with V only, the
        // ip-adapter-PLUS model (16 tokens, much stronger than base) blew the
        // render out into glossy rainbow gradients on a fixed seed — saturated
        // highlights, chrome edges, the cel-shading contract gone. K+V spreads
        // the same reference across keys as well and lands back in style.
        embeds_scaling: refScaling,
        clip_vision: ['22', 0],
      },
    };
    g['3'].inputs.model = ['23', 0];
  }

  // --- img2img fallback ----------------------------------------------------
  if (initImage) {
    g['30'] = {
      class_type: 'LoadImage',
      inputs: { image: initImage, upload: 'image' },
    };
    // The init image is almost never the target bucket size (cutouts are
    // cropped to content), and VAEEncode will not resize for you.
    g['31'] = {
      class_type: 'ImageScale',
      inputs: { image: ['30', 0], upscale_method: 'lanczos', width, height, crop: 'center' },
    };
    g['32'] = {
      class_type: 'VAEEncode',
      inputs: { pixels: ['31', 0], vae: ['4', 2] },
    };
    g['3'].inputs.latent_image = ['32', 0];
    g['3'].inputs.denoise = denoise;
  }

  return g;
}

export function characterWorkflow(opts) {
  const g = baseTxt2Img(opts);
  g['9'] = {
    class_type: 'SaveImage',
    inputs: { filename_prefix: opts.prefix, images: ['8', 0] },
  };
  return g;
}

export function backdropWorkflow(opts) {
  const g = baseTxt2Img(opts);
  g['10'] = {
    class_type: 'UpscaleModelLoader',
    inputs: { model_name: UPSCALE_MODEL },
  };
  g['11'] = {
    class_type: 'ImageUpscaleWithModel',
    inputs: { upscale_model: ['10', 0], image: ['8', 0] },
  };
  // RealESRGAN is 4x; halve it back down for a clean 2x net result.
  g['12'] = {
    class_type: 'ImageScaleBy',
    inputs: { image: ['11', 0], upscale_method: 'lanczos', scale_by: 0.5 },
  };
  g['9'] = {
    class_type: 'SaveImage',
    inputs: { filename_prefix: opts.prefix, images: ['12', 0] },
  };
  return g;
}

// --------------------------------------------------------------------------
// HTTP client
// --------------------------------------------------------------------------

const CLIENT_ID = createHash('sha256')
  .update(`pyrefly-${process.pid}-${Date.now()}`)
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

async function queuePrompt(workflow) {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });
  const text = await res.text();
  if (!res.ok) {
    // ComfyUI reports graph validation problems here — surface them verbatim,
    // they name the offending node and input.
    throw new Error(`ComfyUI rejected the workflow (${res.status}):\n${text}`);
  }
  const json = JSON.parse(text);
  if (json.error) throw new Error(`ComfyUI error: ${JSON.stringify(json.error)}`);
  return json.prompt_id;
}

async function waitForResult(promptId, { timeoutMs = 900_000 } = {}) {
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

// --------------------------------------------------------------------------
// rembg post-processing (runs in ComfyUI's embedded python)
// --------------------------------------------------------------------------

const REMBG_SCRIPT = resolve(HERE, 'rembg.py');

/**
 * Cut the background out, auto-crop to the alpha content with a margin, and
 * report the crop box plus the feet baseline.
 */
export function cutout(inPath, outPath, margin = 16) {
  if (!existsSync(EMBEDDED_PYTHON)) {
    throw new Error(`Embedded python not found at ${EMBEDDED_PYTHON} (set COMFY_ROOT)`);
  }
  const res = spawnSync(
    EMBEDDED_PYTHON,
    ['-s', REMBG_SCRIPT, '--in', inPath, '--out', outPath, '--margin', String(margin)],
    {
      encoding: 'utf8',
      env: { ...process.env, U2NET_HOME: join(COMFY_ROOT, 'rembg-models') },
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (res.status !== 0) {
    throw new Error(`rembg failed (${res.status}):\n${res.stderr || res.stdout}`);
  }
  const line = res.stdout.trim().split(/\r?\n/).pop();
  return JSON.parse(line);
}

// --------------------------------------------------------------------------
// Reference images
// --------------------------------------------------------------------------

/**
 * Make a repo image visible to `LoadImage` and safe to encode.
 *
 * Two things have to happen:
 *
 * 1. **Copy it into ComfyUI's `input/`.** `LoadImage` takes a *filename*
 *    relative to that folder, not a path; it cannot reach into the repo.
 * 2. **Flatten the alpha onto white.** Our sprites are rembg cutouts, and
 *    `LoadImage` hands the RGB channels to CLIP-Vision while routing alpha
 *    off to a MASK output nobody connected. The RGB under a transparent
 *    pixel is undefined — in practice rembg leaves dark fringe there — so an
 *    un-flattened cutout gives the adapter a character floating in a black
 *    void, and the black leaks into the render. White also matches the
 *    `white background` the composition block asks for.
 *
 * The staged name carries a content hash so two runs with different
 * references never collide, and a re-run with the same reference is free.
 */
export function stageImage(srcPath) {
  const abs = resolve(process.cwd(), srcPath);
  if (!existsSync(abs)) throw new Error(`Reference image not found: ${abs}`);
  mkdirSync(COMFY_INPUT_DIR, { recursive: true });

  const digest = createHash('sha256').update(readFileSync(abs)).digest('hex').slice(0, 12);
  const stem = basename(abs, extname(abs)).replace(/[^a-z0-9_-]+/gi, '-');
  const staged = `pyrefly-ref-${stem}-${digest}.png`;
  const target = join(COMFY_INPUT_DIR, staged);
  if (existsSync(target)) return staged;

  if (existsSync(EMBEDDED_PYTHON)) {
    const py = [
      'from PIL import Image',
      'import sys',
      'im = Image.open(sys.argv[1])',
      'if im.mode in ("RGBA", "LA") or "transparency" in im.info:',
      '    im = im.convert("RGBA")',
      '    bg = Image.new("RGB", im.size, (255, 255, 255))',
      '    bg.paste(im, mask=im.split()[-1])',
      '    im = bg',
      'else:',
      '    im = im.convert("RGB")',
      'im.save(sys.argv[2])',
    ].join('\n');
    const res = spawnSync(EMBEDDED_PYTHON, ['-s', '-c', py, abs, target], { encoding: 'utf8' });
    if (res.status === 0) return staged;
    process.stderr.write(
      `[gen] flatten failed, copying reference verbatim: ${res.stderr || res.stdout}\n`,
    );
  }
  copyFileSync(abs, target);
  return staged;
}

/** `--size 1024x1024` -> {width, height}. Returns null when absent. */
export function parseSize(raw) {
  if (raw === undefined || raw === true) return null;
  const m = /^\s*(\d{2,5})\s*[x*×]\s*(\d{2,5})\s*$/i.exec(String(raw));
  if (!m) throw new Error(`--size expects WxH (e.g. 1216x832), got "${raw}"`);
  const width = Number(m[1]);
  const height = Number(m[2]);
  // SDXL's VAE strides by 8; anything else silently rounds and shifts framing.
  if (width % 8 || height % 8) {
    throw new Error(`--size ${width}x${height}: both dimensions must be multiples of 8`);
  }
  return { width, height };
}

/**
 * Resolve --ref / --img2img / --size / --denoise once, for every preset.
 * Returns the graph-level knobs plus what to record in the sidecar.
 */
function referenceOptions(args, { defaultWidth, defaultHeight }) {
  const size = parseSize(args.size);
  const refPath = args.ref && args.ref !== true ? String(args.ref) : null;
  const initPath = args.img2img && args.img2img !== true ? String(args.img2img) : null;
  const refWeight = num(args, 'refWeight', REF_WEIGHT_DEFAULT);
  const refWeightType =
    args.refWeightType === true ? 'linear' : args.refWeightType || 'linear';
  const refScaling = args.refScaling === true ? 'K+V' : args.refScaling || 'K+V';
  const refStart = num(args, 'refStart', REF_START_DEFAULT);
  const refEnd = num(args, 'refEnd', REF_END_DEFAULT);
  const denoise = num(args, 'denoise', IMG2IMG_DENOISE_DEFAULT);

  return {
    width: num(args, 'width', size ? size.width : defaultWidth),
    height: num(args, 'height', size ? size.height : defaultHeight),
    refImage: refPath ? stageImage(refPath) : undefined,
    refWeight,
    refWeightType,
    refScaling,
    refStart,
    refEnd,
    initImage: initPath ? stageImage(initPath) : undefined,
    denoise: initPath ? denoise : 1,
    provenance: {
      ...(refPath
        ? {
            ref: refPath,
            refWeight,
            refWeightType,
            refScaling,
            refStart,
            refEnd,
            ipadapter: IPADAPTER_MODEL,
          }
        : {}),
      ...(initPath ? { img2img: initPath, denoise } : {}),
    },
  };
}

// --------------------------------------------------------------------------
// Presets
// --------------------------------------------------------------------------

async function generateOne({ workflow, outPath, postProcess, margin }) {
  const started = Date.now();
  const promptId = await queuePrompt(workflow);
  const entry = await waitForResult(promptId);
  const images = imagesFrom(entry);
  if (!images.length) throw new Error(`No images came back for prompt ${promptId}`);
  const buf = await fetchImage(images[0]);
  const elapsed = (Date.now() - started) / 1000;

  mkdirSync(dirname(outPath), { recursive: true });

  if (!postProcess) {
    writeFileSync(outPath, buf);
    return { outPath, seconds: elapsed, meta: null };
  }

  // Land the raw render next to the final file so a bad cutout is debuggable.
  const rawPath = outPath.replace(/\.png$/i, '.raw.png');
  writeFileSync(rawPath, buf);
  const meta = cutout(rawPath, outPath, margin);
  return { outPath, rawPath, seconds: elapsed, meta };
}

function outFor(outPath, index, batch) {
  if (batch <= 1) return outPath;
  return outPath.replace(/\.png$/i, `.${index + 1}.png`);
}

/**
 * Shared implementation of the `character` and `boss` presets. They differ
 * only in default framing and default canvas — same style contract, same
 * cutout, same sidecar, so they stay one code path on purpose.
 */
async function runSprite(args, { defaultComposition, defaultWidth, defaultHeight, label }) {
  const name = required(args, 'name');
  const tags = required(args, 'tags');
  const pose = args.pose === true ? 'idle' : args.pose || 'idle';
  const poseTags = args.poseTags === true ? '' : args.poseTags || '';
  const outPath = resolve(process.cwd(), required(args, 'out'));
  const batch = Math.max(1, num(args, 'batch', 1));
  const steps = num(args, 'steps', 28);
  const cfg = num(args, 'cfg', 6);
  const sampler = args.sampler === true ? 'euler_ancestral' : args.sampler || 'euler_ancestral';
  const scheduler = args.scheduler === true ? 'normal' : args.scheduler || 'normal';
  const margin = num(args, 'margin', 16);
  const composition =
    args.composition === true ? defaultComposition : args.composition || defaultComposition;
  const baseSeed = num(args, 'seed', seedFromName(`${name}:${pose}`));

  const positive = buildCharacterPrompt({ tags, poseTags, composition });
  const negative = withNegAdd(SPRITE_NEGATIVE, args.negAdd);
  const ref = referenceOptions(args, { defaultWidth, defaultHeight });
  const results = [];

  for (let i = 0; i < batch; i++) {
    const seed = (baseSeed + i) % 2147483647;
    const target = outFor(outPath, i, batch);
    const workflow = characterWorkflow({
      positive,
      negative,
      width: ref.width,
      height: ref.height,
      seed,
      steps,
      cfg,
      sampler,
      scheduler,
      refImage: ref.refImage,
      refWeight: ref.refWeight,
      refWeightType: ref.refWeightType,
      refScaling: ref.refScaling,
      refStart: ref.refStart,
      refEnd: ref.refEnd,
      initImage: ref.initImage,
      denoise: ref.denoise,
      prefix: `pyrefly/${name}_${pose}`,
    });
    process.stderr.write(
      `[gen] ${label} ${name}/${pose} variant ${i + 1}/${batch} seed=${seed}` +
        `${ref.refImage ? ` ref@${ref.refWeight}` : ''}` +
        `${ref.initImage ? ` img2img@${ref.denoise}` : ''}\n`,
    );
    const r = await generateOne({ workflow, outPath: target, postProcess: true, margin });
    const sidecar = {
      width: r.meta.width,
      height: r.meta.height,
      baselineY: r.meta.baselineY,
      seed,
      prompt: positive,
      negative,
      cropBox: r.meta.cropBox,
      source: { width: r.meta.sourceWidth, height: r.meta.sourceHeight },
      model: CHECKPOINT,
      steps,
      cfg,
      sampler,
      scheduler,
      pose,
      composition,
      canvas: { width: ref.width, height: ref.height },
      ...ref.provenance,
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(target.replace(/\.png$/i, '.json'), `${JSON.stringify(sidecar, null, 2)}\n`);
    results.push({ ...r, seed, sidecar: target.replace(/\.png$/i, '.json') });
    process.stderr.write(
      `[gen]   -> ${target} ${r.meta.width}x${r.meta.height} baselineY=${r.meta.baselineY} (${r.seconds.toFixed(1)}s)\n`,
    );
  }
  return results;
}

async function runCharacter(args) {
  return runSprite(args, {
    defaultComposition: 'full',
    defaultWidth: 832,
    defaultHeight: 1216,
    label: 'char',
  });
}

/**
 * Boss preset. Defaults to the 3:2 landscape bucket because most of the
 * roster is wider than tall (Mortiorchis, Vegnagun's leg, Ixion); the tall
 * ones — Anima, Yunalesca 3 — want `--size 832x1216`, and the square
 * `--size 1024x1024` suits the floaters. `--negAdd` is here because boss
 * prompts collide with English far more than party ones do ("flux", "core",
 * "pagoda" all summon the wrong noun).
 */
async function runBoss(args) {
  return runSprite(args, {
    defaultComposition: 'boss',
    defaultWidth: 1216,
    defaultHeight: 832,
    label: 'boss',
  });
}

async function runBackdrop(args) {
  const name = required(args, 'name');
  const tags = required(args, 'tags');
  const outPath = resolve(process.cwd(), required(args, 'out'));
  const batch = Math.max(1, num(args, 'batch', 1));
  const steps = num(args, 'steps', 30);
  const cfg = num(args, 'cfg', 6);
  const sampler = args.sampler === true ? 'euler_ancestral' : args.sampler || 'euler_ancestral';
  const scheduler = args.scheduler === true ? 'normal' : args.scheduler || 'normal';
  const baseSeed = num(args, 'seed', seedFromName(`backdrop:${name}`));

  const positive = buildBackdropPrompt({ tags });
  const negative = withNegAdd(BACKDROP_NEGATIVE, args.negAdd);
  const ref = referenceOptions(args, { defaultWidth: 1344, defaultHeight: 768 });
  const results = [];

  for (let i = 0; i < batch; i++) {
    const seed = (baseSeed + i) % 2147483647;
    const target = outFor(outPath, i, batch);
    const workflow = backdropWorkflow({
      positive,
      negative,
      width: ref.width,
      height: ref.height,
      seed,
      steps,
      cfg,
      sampler,
      scheduler,
      refImage: ref.refImage,
      refWeight: ref.refWeight,
      refWeightType: ref.refWeightType,
      refScaling: ref.refScaling,
      refStart: ref.refStart,
      refEnd: ref.refEnd,
      initImage: ref.initImage,
      denoise: ref.denoise,
      prefix: `pyrefly/backdrop_${name}`,
    });
    process.stderr.write(`[gen] backdrop/${name} variant ${i + 1}/${batch} seed=${seed}\n`);
    const r = await generateOne({ workflow, outPath: target, postProcess: false });
    writeFileSync(
      target.replace(/\.png$/i, '.json'),
      `${JSON.stringify(
        {
          seed,
          prompt: positive,
          negative,
          model: CHECKPOINT,
          upscaler: UPSCALE_MODEL,
          steps,
          cfg,
          sampler,
          scheduler,
          canvas: { width: ref.width, height: ref.height },
          ...ref.provenance,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    results.push({ ...r, seed });
    process.stderr.write(`[gen]   -> ${target} (${r.seconds.toFixed(1)}s)\n`);
  }
  return results;
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
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else {
        args[key] = next;
        i++;
      }
    } else args._.push(a);
  }
  return args;
}

function required(args, key) {
  if (!args[key] || args[key] === true) {
    throw new Error(`Missing required --${key}`);
  }
  return String(args[key]);
}

/**
 * Numeric flag with a default.
 *
 * `parseArgs` gives `true` for a flag typed without a value (`--steps` at the
 * end of the line). `Number(true)` is 1, which would silently render a
 * one-step image, so treat a valueless flag as "not given" and shout about a
 * non-numeric one.
 */
function num(args, key, fallback) {
  const raw = args[key];
  if (raw === undefined || raw === true) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`--${key} expects a number, got "${raw}"`);
  return n;
}

const USAGE = `
pyrefly art generator (ComfyUI ${BASE})

  node tools/gen/comfy.mjs character --name <id> --tags "<danbooru tags>" \\
      [--pose <pose>] [--poseTags "<tags>"] --out <path.png>
      [--batch N] [--seed N] [--steps 28] [--cfg 6] [--margin 16]
      [--composition full|portrait|prone|boss] [--negAdd "<extra negatives>"]
      [--ref <png>] [--refWeight ${REF_WEIGHT_DEFAULT}] [--refStart ${REF_START_DEFAULT}] [--refEnd ${REF_END_DEFAULT}]
      [--refWeightType linear] [--refScaling K+V]
      [--img2img <png>] [--denoise ${IMG2IMG_DENOISE_DEFAULT}]
      [--size WxH] [--width N] [--height N]

  node tools/gen/comfy.mjs boss --name <id> --tags "<danbooru tags>" --out <path.png>
      same flags; defaults to 1216x832 landscape and --composition boss
      (use --size 1024x1024 for floaters, --size 832x1216 for tall forms)

  node tools/gen/comfy.mjs backdrop --name <id> --tags "<scene tags>" --out <path.png>
      [--batch N] [--seed N] [--steps 30] [--cfg 6] [--negAdd "<extra negatives>"]
      [--size WxH] [--ref <png>] [--img2img <png>] [--denoise ${IMG2IMG_DENOISE_DEFAULT}]

Reference consistency:
  --ref <png>       IP-Adapter identity anchor. Point it at an approved idle
                    and the new pose keeps that face, hair and costume while
                    --poseTags changes what the body is doing.
  --refStart ${REF_START_DEFAULT}   When the reference switches on, as a fraction of the
                    denoise. NOT zero: an adapter running from step 0
                    reproduces the reference's pose and ignores --poseTags.
                    This flag, not --refWeight, is what makes --ref usable.
  --img2img <png>   Blunter fallback: start from the pixels of <png> and
                    redraw them at --denoise (default ${IMG2IMG_DENOISE_DEFAULT}). Keeps the
                    silhouette; use when --ref is not enough (odd forms).

Env: COMFY_HOST, COMFY_PORT, COMFY_ROOT, COMFY_INPUT, COMFY_CKPT,
     COMFY_UPSCALER, COMFY_IPADAPTER, COMFY_CLIPVISION
`.trim();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || args.help) {
    console.log(USAGE);
    // Asking for help is a success; being invoked with no command is not.
    process.exit(args.help ? 0 : 1);
  }

  await waitForServer(60_000);

  let results;
  if (cmd === 'character') results = await runCharacter(args);
  else if (cmd === 'boss') results = await runBoss(args);
  else if (cmd === 'backdrop') results = await runBackdrop(args);
  else {
    console.error(`Unknown command "${cmd}"\n\n${USAGE}`);
    process.exit(1);
  }

  const total = results.reduce((s, r) => s + r.seconds, 0);
  console.log(
    JSON.stringify(
      {
        ok: true,
        count: results.length,
        secondsPerImage: Number((total / results.length).toFixed(1)),
        files: results.map((r) => r.outPath),
      },
      null,
      2,
    ),
  );
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(`\n[gen] FAILED: ${err.message}`);
    process.exit(1);
  });
}
