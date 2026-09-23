#!/usr/bin/env node
/**
 * Art method r3 pilot, P3/P4 (FFX-2 only, chapter 6 Leblanc): the seam-band-only repaint.
 * A pilot copy of tools/gen/lora-repaint.mjs (the shared tool is untouched), changed as
 * METHOD-CHECK step 2.5 asks: Animagine XL 4.0 Opt + leblanc-x2-r2 at 0.8, IP-Adapter plus
 * (vit-h) on the idle square-padded + the idle head crop at 0.3 (ease in, 0.2 to 0.6, K+V,
 * concat: round 2's settings), VAEEncode + SetLatentNoiseMask, low denoise, and words that
 * name only what the band shows. The init and mask are the crop seam.py prep wrote
 * (region plus 25 % margin, 1024 short side).
 *
 *   node docs/concepts/chapters/leblanc/r3-method/seam-repaint.mjs --dir p3 --region obi,choker
 *        [--denoise 0.25,0.35] [--seeds 4] [--seed 83000] [--gate 3] [--tag c]
 *
 * Writes <dir>/<region>.<tag><i>.png and .json under D:/Tools/pyrefly-lora/leblanc/r3/. One
 * prompt at a time behind an empty shared queue (the first prompt waits for the queue to be
 * empty for --gate minutes); ComfyUI is never restarted from here. Every prompt id and its
 * execution time from the history API is appended to gpu-ledger.json; the run stops at the
 * 60-minute pilot cap and on an all-black frame (hard rule 12).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_NEGATIVE, stageImage } from '../../../../../tools/gen/comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..');
const SCR = 'D:/Tools/pyrefly-lora/leblanc/r3';
const LEDGER = join(SCR, 'gpu-ledger.json');
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const LORA = 'leblanc-x2-r2.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const REFS = ['docs/concepts/chapters/leblanc/pilot2/refs/idle-square.png', 'docs/concepts/chapters/leblanc/pilot2/refs/idle-head.png'];
const CAP_MIN = 60;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Words that name only what each band shows (C2: colour words bind to the wrong noun, so none on the parts). */
export const WORDS = {
  obi: 'leblancX2, 1girl, close-up, midriff, white dress, obi, tassel, black lining, purple kimono, thigh, pale skin',
  choker: 'leblancX2, 1girl, close-up, neck, choker, pale skin, blonde hair, white dress, halterneck',
  hurt: 'leblancX2, 1girl, close-up, purple kimono, white dress, pale skin, blonde hair, bob cut',
  wince: 'leblancX2, 1girl, close-up, face, closed eyes, wince, pain, blonde hair, bob cut, pale skin',
};
const EXTRA_NEG = 'multiple views, 2girls, chibi, sketch, monochrome, 3d, realistic, gold obi, navy obi, two tassels, extra tassel, second tassel, text, watermark';

function parse() {
  const a = {};
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) if (v[i].startsWith('--')) a[v[i].slice(2)] = v[i + 1] && !v[i + 1].startsWith('--') ? v[++i] : true;
  return a;
}

export function ledgerMinutes() {
  if (!existsSync(LEDGER)) return 0;
  return JSON.parse(readFileSync(LEDGER, 'utf8')).reduce((s, e) => s + (e.execMs || 0), 0) / 60000;
}

function addLedger(e) {
  const all = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : [];
  all.push(e);
  writeFileSync(LEDGER, JSON.stringify(all, null, 1));
}

async function queueEmpty() {
  try {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    return !q.queue_running.length && !q.queue_pending.length;
  } catch {
    return false;
  }
}

/** P0: the queue empty for `minutes` consecutive minutes. */
async function gate(minutes) {
  let since = null;
  for (;;) {
    if (await queueEmpty()) {
      since ??= Date.now();
      if (Date.now() - since >= minutes * 60_000) return;
    } else since = null;
    await sleep(10_000);
  }
}

export function graph({ init, mask, refA, refB, seed, denoise, words, negative, strength = 0.8, refWeight = 0.3, prefix }) {
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: LORA, strength_model: strength, strength_clip: strength } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: words, clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['10', 1] } },
    20: { class_type: 'LoadImage', inputs: { image: refA, upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: refB, upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    23: {
      class_type: 'IPAdapterAdvanced',
      inputs: {
        model: ['10', 0], ipadapter: ['21', 0], image: ['25', 0], weight: refWeight, weight_type: 'ease in',
        combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0],
      },
    },
    40: { class_type: 'LoadImage', inputs: { image: init, upload: 'image' } },
    41: { class_type: 'VAEEncode', inputs: { pixels: ['40', 0], vae: ['4', 2] } },
    42: { class_type: 'LoadImage', inputs: { image: mask, upload: 'image' } },
    43: { class_type: 'ImageToMask', inputs: { image: ['42', 0], channel: 'red' } },
    44: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['41', 0], mask: ['43', 0] } },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 30, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise, model: ['23', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['44', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };
}

export async function run(workflow, outPath, note) {
  if (ledgerMinutes() >= CAP_MIN) throw new Error(`pilot GPU cap ${CAP_MIN} min reached (${ledgerMinutes().toFixed(1)}); stop and report`);
  let noted = 0;
  while (!(await queueEmpty())) {
    if (Date.now() - noted > 60_000) { console.error('[seam] queue busy; waiting'); noted = Date.now(); }
    await sleep(5000);
  }
  const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-r3-seam' }) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body).slice(0, 1500)}`);
  const id = body.prompt_id;
  for (;;) {
    const e = (await (await fetch(`${COMFY}/history/${id}`)).json())[id];
    if (e?.status?.status_str === 'error') throw new Error(`failed: ${JSON.stringify(e.status.messages).slice(0, 1500)}`);
    const img = e && Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
    if (img && e.status?.completed) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      writeFileSync(outPath, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      const msgs = Object.fromEntries((e.status.messages || []).map(([k, v]) => [k, v.timestamp]));
      const execMs = (msgs.execution_success ?? 0) - (msgs.execution_start ?? 0);
      addLedger({ id, out: outPath, execMs, note, at: new Date().toISOString() });
      return execMs / 1000;
    }
    await sleep(1000);
  }
}

async function main() {
  const a = parse();
  const dir = join(SCR, a.dir || 'p3');
  const regions = String(a.region || 'obi,choker').split(',');
  const denoise = String(a.denoise ?? '0.25,0.35').split(',').map(Number);
  const seeds = Number(a.seeds ?? 4);
  const seed0 = Number(a.seed ?? 83000);
  const tag = a.tag || 'c';
  const negative = `${BASE_NEGATIVE}, ${EXTRA_NEG}${a.neg ? `, ${a.neg}` : ''}`;
  mkdirSync(dir, { recursive: true });
  if (a.gate !== '0') {
    console.log(`[seam] P0 gate: waiting for the queue to be empty for ${a.gate ?? 3} min`);
    await gate(Number(a.gate ?? 3));
  }
  const refA = stageImage(join(REPO, REFS[0]));
  const refB = stageImage(join(REPO, REFS[1]));
  for (const region of regions) {
    const words = a.words || WORDS[a.wordset || region] || WORDS.hurt;
    const init = stageImage(join(dir, `${region}.init.png`));
    const mask = stageImage(join(dir, `${region}.mask.png`));
    for (let i = 0; i < seeds; i++) {
      const d = denoise[i % denoise.length];
      const seed = seed0 + i;
      const out = join(dir, `${region}.${tag}${i + 1}`);
      if (existsSync(`${out}.png`)) { console.log(`[seam] ${out}.png exists; skip`); continue; }
      const g = graph({ init, mask, refA, refB, seed, denoise: d, words, negative, prefix: 'pyrefly/r3-seam' });
      const secs = await run(g, `${out}.png`, `${region} ${tag}${i + 1} d${d} s${seed}`);
      writeFileSync(`${out}.json`, JSON.stringify({ region, init: `${region}.init.png`, mask: `${region}.mask.png`, seed, denoise: d, words, negative, lora: { file: LORA, strength: 0.8 },
        ipadapter: { file: IPADAPTER, weight: 0.3, type: 'ease in', start: 0.2, end: 0.6, scaling: 'K+V', combine: 'concat', images: REFS }, model: CKPT, steps: 30, cfg: 6,
        sampler: 'euler_ancestral', scheduler: 'normal', execSeconds: secs }, null, 1));
      console.log(`[seam] ${out}.png d${d} seed ${seed}: ${secs.toFixed(1)} s (ledger ${ledgerMinutes().toFixed(2)} min)`);
    }
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(`[seam] FAILED: ${e.message}`); process.exit(1); });
