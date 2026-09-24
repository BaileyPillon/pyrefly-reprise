#!/usr/bin/env node
/**
 * Seymour Natus hero cast (FFX only): masked repaint of one prepared crop. Animagine XL 4.0 Opt, no LoRA,
 * IP-Adapter plus (vit-h) on the subject's own idle (square-padded) plus a detail crop, VAEEncode +
 * SetLatentNoiseMask, low to mid denoise. The model only ever sees the crop; the caller composites
 * its output back inside the mask, so every pixel outside the mask stays the idle's (MAD 0).
 *
 *   node repaint.mjs --job <dir>/<name> --words "..." --denoise 0.5,0.6 --seeds 4 --seed 910000
 *        --refs a.png,b.png [--neg "..."] [--tag r] [--ipw 0.35]
 * Reads <job>.init.png and <job>.mask.png; writes <job>.<tag><i>.png/.json.
 * Queue rule for this run: submit only while fewer than 3 prompts are pending; one prompt at a time;
 * never restart ComfyUI. An all-black output stops the run (hard rule 12). Every prompt's execution
 * time is appended to the ledger; the run stops at the 60 GPU-minute cap.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { BASE_NEGATIVE, stageImage } from '../../../../../../tools/gen/comfy.mjs';

const COMFY = 'http://127.0.0.1:8188';
const LEDGER = 'D:/Tools/pyrefly-scratch/natus-cast/gpu-ledger.json';
const CAP_MIN = 20;
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const PY = 'D:/Tools/sd-scripts/.venv/Scripts/python.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const a = {};
{
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) if (v[i].startsWith('--')) a[v[i].slice(2)] = v[i + 1] && !v[i + 1].startsWith('--') ? v[++i] : true;
}

const ledger = () => (existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : []);
const minutes = () => ledger().reduce((s, e) => s + (e.execMs || 0), 0) / 60000;

async function pendingOk() {
  try {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    return q.queue_pending.length < 3;
  } catch {
    return false;
  }
}

function graph({ init, mask, refs, seed, denoise, words, negative, refWeight }) {
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: words, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['4', 1] } },
    20: { class_type: 'LoadImage', inputs: { image: refs[0], upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: refs[1] ?? refs[0], upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: 'ip-adapter-plus_sdxl_vit-h.safetensors' } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors' } },
    23: {
      class_type: 'IPAdapterAdvanced',
      inputs: {
        model: ['4', 0], ipadapter: ['21', 0], image: ['25', 0], weight: refWeight, weight_type: 'ease in',
        combine_embeds: 'concat', start_at: 0.2, end_at: 0.7, embeds_scaling: 'K+V', clip_vision: ['22', 0],
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
    9: { class_type: 'SaveImage', inputs: { filename_prefix: 'pyrefly/natus-cast', images: ['8', 0] } },
  };
}

async function run(workflow, outPath, note) {
  if (minutes() >= CAP_MIN) throw new Error(`GPU cap ${CAP_MIN} min reached (${minutes().toFixed(1)})`);
  let t = 0;
  while (!(await pendingOk())) {
    if (Date.now() - t > 60000) { console.error('[repaint] 3+ pending; waiting'); t = Date.now(); }
    await sleep(5000);
  }
  const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-natus-cast' }) });
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
      const all = ledger();
      all.push({ id, out: outPath, execMs, note, at: new Date().toISOString() });
      writeFileSync(LEDGER, JSON.stringify(all, null, 1));
      const mean = Number(execFileSync(PY, ['-c', 'import sys;from PIL import Image;import numpy as np;print(np.array(Image.open(sys.argv[1]).convert("RGB")).mean())', outPath]).toString().trim());
      if (mean < 3) throw new Error(`ALL-BLACK render ${outPath} (mean ${mean}): stop and report (rule 12)`);
      return execMs / 1000;
    }
    await sleep(1000);
  }
}

const job = resolve(a.job);
const refs = String(a.refs).split(',').map((p) => stageImage(resolve(p)));
const init = stageImage(`${job}.init.png`);
const mask = stageImage(`${job}.mask.png`);
const denoise = String(a.denoise ?? '0.5').split(',').map(Number);
const seeds = Number(a.seeds ?? 4);
const seed0 = Number(a.seed ?? 910000);
const tag = a.tag || 'r';
const negative = `${BASE_NEGATIVE}, ${a.neg ?? ''}`;
const refWeight = Number(a.ipw ?? 0.35);
for (let i = 0; i < seeds; i++) {
  const out = `${job}.${tag}${i + 1}.png`;
  if (existsSync(out)) { console.log(`skip ${out}`); continue; }
  const d = denoise[i % denoise.length];
  const seed = seed0 + i;
  const secs = await run(graph({ init, mask, refs, seed, denoise: d, words: a.words, negative, refWeight }), out, `${job} ${tag}${i + 1} d${d} s${seed}`);
  writeFileSync(out.replace(/\.png$/, '.json'), JSON.stringify({
    init: `${job}.init.png`, mask: `${job}.mask.png`, seed, denoise: d, words: a.words, negative, model: CKPT,
    ipadapter: { file: 'ip-adapter-plus_sdxl_vit-h.safetensors', weight: refWeight, type: 'ease in', start: 0.2, end: 0.7, refs: String(a.refs).split(',') },
    steps: 30, cfg: 6, sampler: 'euler_ancestral', execSeconds: secs,
  }, null, 1));
  console.log(`[repaint] ${out} d${d} s${seed} ${secs.toFixed(1)} s (ledger ${minutes().toFixed(2)} min)`);
}
