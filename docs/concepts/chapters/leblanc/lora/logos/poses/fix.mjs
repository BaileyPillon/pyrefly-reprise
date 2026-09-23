#!/usr/bin/env node
/**
 * Chapter 6 art (FFX-2 only): the Logos LAST-ATTEMPT redo as LOCAL masked repaints of the
 * installed picks, not full-figure re-rolls (the independent judge, ../judge.md "Redo":
 * a whole-body render re-rolls every region that already passes). Every output is a
 * CANDIDATE; nothing is approved.
 *
 *   node fix.mjs <attack|cast|hurt|ko|all> [--seeds 6] [--lora 0.85] [--only 97101,97102]
 *
 * Per state, fixes.json names the pick (renders/<pick>.raw.png, the SDXL frame before
 * rembg) and one or more passes. Per pass and candidate seed:
 *   fix-support.py prep  -> optional paste of the idle's own emblem, then the pass's crop
 *                           upscaled to 1024 on the long side + its feathered mask
 *   ComfyUI (core nodes + the installed IP-Adapter node):
 *     CheckpointLoaderSimple (Animagine XL 4.0 Opt) -> LoraLoader logos-x2 (step 2000)
 *     -> IPAdapterAdvanced on the pass's idle crop (concat, ease in, 0.2..0.6, K+V)
 *     -> VAEEncode(crop) -> SetLatentNoiseMask(mask) -> KSampler (28 steps, cfg 6,
 *        euler_ancestral, the pass's denoise for that candidate) -> VAEDecode
 *   fix-support.py merge -> the repaint blended back through the same mask
 * then fix-support.py finish -> the installed cutout's own pixels and alpha outside the
 * masks, the repaint inside, cropped to content + 16 px.
 *
 * One prompt at a time behind the shared ComfyUI queue; ComfyUI is never restarted.
 * Writes renders/<state>.<seed>.fix.png + .json (provenance), renders/<state>.<seed>.fix.raw.png
 * (patched frame, local) and renders/fix-work/<state>.<seed>/ (crops, masks; local).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, lintSpritePrompt } from '../../../../../../../tools/gen/comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const R = join(HERE, 'renders');
const W = join(R, 'fix-work');
const FIXES = join(HERE, 'fixes.json');
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const LORA = 'logos-x2.safetensors';
const LORA_STEP = 2000;
const LORA_SHA = '2252538fe454340915711c9cf019cfe2a5252f7ecff316507a72811637b5a8d9';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const NEG_COMMON = 'hat, brim, crest, fin, plume, feathers, horns, winged helmet, pauldrons, 1girl, long hair, gold trim, yellow sash, dark skin, tan';

const py = (...args) => {
  const r = spawnSync(PY, ['-s', join(HERE, 'fix-support.py'), ...args], { encoding: 'utf8', maxBuffer: 64 << 20, env: { ...process.env, U2NET_HOME: 'D:/Tools/ComfyUI/rembg-models' } });
  if (r.status !== 0) throw new Error(`fix-support ${args[0]} failed:\n${r.stderr}`);
  return JSON.parse(r.stdout.trim().split(/\r?\n/).pop());
};

function promptsFor(p) {
  const lint = lintSpritePrompt({ tags: p.tags, poseTags: '', composition: 'full' });
  if (lint.stripped.length) throw new Error(`effect words in the prompt: ${JSON.stringify(lint.stripped)}`);
  return {
    positive: `logosX2, 1boy, solo, ${p.tags}, ${STYLE_TAGS}, ${QUALITY_TAGS}`,
    negative: [BASE_NEGATIVE, NEG_COMMON, p.neg].filter(Boolean).join(', '),
  };
}

function graph({ seed, lora, denoise, crop, mask, refs, refWeight, positive, negative, prefix }) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: LORA, strength_model: lora, strength_clip: lora } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['10', 1] } },
    20: { class_type: 'LoadImage', inputs: { image: refs[0], upload: 'image' } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    40: { class_type: 'LoadImage', inputs: { image: crop, upload: 'image' } },
    41: { class_type: 'VAEEncode', inputs: { pixels: ['40', 0], vae: ['4', 2] } },
    42: { class_type: 'LoadImageMask', inputs: { image: mask, channel: 'red', upload: 'image' } },
    43: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['41', 0], mask: ['42', 0] } },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise, model: ['23', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['43', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };
  let img = ['20', 0];
  if (refs[1]) {
    g[24] = { class_type: 'LoadImage', inputs: { image: refs[1], upload: 'image' } };
    g[25] = { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } };
    img = ['25', 0];
  }
  g[23] = {
    class_type: 'IPAdapterAdvanced',
    inputs: { model: ['10', 0], ipadapter: ['21', 0], image: img, weight: refWeight, weight_type: 'ease in', combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0] },
  };
  return g;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(workflow, outPath) {
  let noted = 0;
  for (;;) {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    if (!q.queue_running.length && !q.queue_pending.length) break;
    if (Date.now() - noted > 60_000) { console.error('[logos-fix] queue busy; waiting'); noted = Date.now(); }
    await sleep(4000);
  }
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-logos-fix' }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body).slice(0, 1500)}`);
  const id = body.prompt_id;
  const deadline = Date.now() + 20 * 60_000;
  for (;;) {
    const e = (await (await fetch(`${COMFY}/history/${id}`)).json())[id];
    if (e?.status?.status_str === 'error') throw new Error(`failed: ${JSON.stringify(e.status.messages).slice(0, 800)}`);
    const img = e && Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
    if (img) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      writeFileSync(outPath, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      return (Date.now() - t0) / 1000;
    }
    if (Date.now() > deadline) throw new Error(`timeout ${id}`);
    await sleep(1000);
  }
}

function maxRgb(p) {
  const r = spawnSync(PY, ['-s', '-c', 'import sys,numpy as n;from PIL import Image;print(int(n.asarray(Image.open(sys.argv[1]).convert("RGB")).max()))', p], { encoding: 'utf8' });
  return Number(r.stdout.trim());
}

async function fixState(state, a) {
  const all = JSON.parse(readFileSync(FIXES, 'utf8'));
  const s = all[state];
  const n = Number(a.seeds || 6);
  const lora = Number(a.lora ?? 0.85);
  const only = a.only ? a.only.split(',').map(Number) : null;
  const installed = JSON.parse(readFileSync(join(R, `${s.pick}.json`), 'utf8'));
  const cropBox = installed.cutout.cropBox.join(',');
  for (let k = 0; k < n; k++) {
    const seed = s.seed0 + k;
    if (only && !only.includes(seed)) continue;
    const tag = `${s.state || state}.${seed}.fix`;
    if (existsSync(join(R, `${tag}.json`)) && a.refinish) {
      // alpha only: re-run finish on the saved patched frame (no render), e.g. after a
      // change to a pass's alpha settings in fixes.json
      const meta = JSON.parse(readFileSync(join(R, `${tag}.json`), 'utf8'));
      meta.cutout = py('finish', FIXES, state, join(R, `${tag}.raw.png`), join(R, `${s.pick}.png`), cropBox, join(R, `${tag}.png`));
      meta.passes = meta.passes.map((p, i) => ({ ...p, alpha: s.passes[i].alpha || 'keep', whiteKey: !!s.passes[i].whiteKey }));
      meta.refinishedAt = new Date().toISOString();
      writeFileSync(join(R, `${tag}.json`), JSON.stringify(meta, null, 1) + '\n');
      console.log(`[logos-fix] ${tag} refinished`);
      continue;
    }
    if (existsSync(join(R, `${tag}.json`)) && !a.force) continue;
    const wd = join(W, `${state}.${seed}`);
    mkdirSync(wd, { recursive: true });
    let base = join(R, `${s.pick}.raw.png`);
    const passes = [];
    let secs = 0;
    for (let i = 0; i < s.passes.length; i++) {
      const p = s.passes[i];
      const pd = join(wd, `p${i}`);
      const info = py('prep', FIXES, state, String(i), base, pd);
      if (info.pasted) base = join(pd, 'base.png');
      const denoise = p.denoise[k % p.denoise.length];
      const { positive, negative } = promptsFor(p);
      const out = join(pd, 'inpainted.png');
      if (denoise > 0) {
        const refs = p.refs.map((r) => stageImage(join(HERE, r)));
        secs += await run(graph({
          seed, lora, denoise, crop: stageImage(join(pd, 'crop.png')), mask: stageImage(join(pd, 'mask.png')),
          refs, refWeight: p.refWeight, positive, negative, prefix: `pyrefly/logos-fix-${state}`,
        }), out);
        if (maxRgb(out) === 0) throw new Error(`${tag}: BLACK FRAME; check the queue, never restart ComfyUI from here`);
      } else copyFileSync(join(pd, 'crop.png'), out);
      const merged = join(pd, 'merged.png');
      py('merge', FIXES, state, String(i), base, out, merged);
      base = merged;
      passes.push({ name: p.name, crop: p.crop, size: info.size, mask: p.mask, minus: p.minus || [], feather: p.feather, alpha: p.alpha || 'keep',
        paste: p.paste || null, denoise, refs: p.refs, refWeight: p.refWeight, positive, negative });
    }
    copyFileSync(base, join(R, `${tag}.raw.png`));
    const cut = py('finish', FIXES, state, join(R, `${tag}.raw.png`), join(R, `${s.pick}.png`), cropBox, join(R, `${tag}.png`));
    writeFileSync(join(R, `${tag}.json`), JSON.stringify({
      tag, state: s.state || state, fixKey: state, seed, method: 'lora+openpose, then masked repaint (lora inpaint)', fixOf: s.pick, judge: s.judge,
      model: CKPT, lora: { file: LORA, step: LORA_STEP, sha256: LORA_SHA, strength: lora },
      passes, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      width: installed.width, height: installed.height, composition: installed.composition,
      cutout: cut, cutoutGuard: installed.cutoutGuard, base: { tag: s.pick, positive: installed.positive, negative: installed.negative, controlnet: installed.controlnet, ipadapter: installed.ipadapter },
      seconds: Math.round(secs), generatedAt: new Date().toISOString(),
    }, null, 1) + '\n');
    console.log(`[logos-fix] ${tag} ${Math.round(secs)} s`);
  }
}

function parse() {
  const a = { _: [] };
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) {
    if (v[i] === '--force') a.force = true;
    else if (v[i] === '--refinish') a.refinish = true;
    else if (v[i].startsWith('--')) a[v[i].slice(2)] = v[++i];
    else a._.push(v[i]);
  }
  return a;
}

const a = parse();
const all = JSON.parse(readFileSync(FIXES, 'utf8'));
const which = a._[0] === 'all' ? Object.keys(all) : a._;
if (!which.length || which.some((s) => !all[s])) {
  console.log('usage: node fix.mjs <attack|cast|hurt|ko|all> [--seeds 6] [--lora 0.85] [--only 97101] [--force]');
  process.exit(1);
}
for (const s of which) await fixState(s, a);
