#!/usr/bin/env node
/**
 * Logos round 2 (FFX-2 only): masked repaints made directly on an installed CUTOUT
 * (the idle's hand; later the r2 poses' local defects). Every output is a CANDIDATE.
 *
 *   node fix2.mjs <key> [--seeds 6] [--only 98001,98002] [--force] [--lora 0.5]
 *
 * fixes-r2.json[key]: base (a cutout, repo-relative), lora {file, step, sha256, strength},
 * seed0, passes (fix-support.py pass format, coordinates in the cutout's own pixels).
 * Per candidate: the cutout flattened on white -> per pass: fix-support.py prep (prefill,
 * crop upscaled to 1024, feathered mask) -> ComfyUI: Animagine XL 4.0 Opt -> LoraLoader ->
 * IPAdapterAdvanced (the pass refs, concat, ease in 0.2..0.6, K+V) -> VAEEncode ->
 * SetLatentNoiseMask -> KSampler 28 / cfg 6 / euler_ancestral / the pass denoise ->
 * fix-support.py merge -> r2-support.py finish (the original RGBA outside the masks,
 * copied; alpha kept) and r2-support.py diff (the proof, must be 0 outside).
 * One prompt at a time behind the shared ComfyUI queue; ComfyUI is never restarted.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { BASE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, lintSpritePrompt } from '../../../../../../../tools/gen/comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..', '..', '..', '..', '..');
const R = join(HERE, 'renders');
const W = join(R, 'work');
const FIXES = join(HERE, 'fixes-r2.json');
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const NEG_COMMON = 'hat, brim, crest, fin, plume, feathers, horns, winged helmet, pauldrons, 1girl, long hair, gold trim, yellow sash, dark skin, tan';
export const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const py = (script, ...args) => {
  const r = spawnSync(PY, ['-s', script, ...args], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(`${script} ${args[0]} failed:\n${r.stderr}`);
  return JSON.parse(r.stdout.trim().split(/\r?\n/).pop());
};
const FS = join(HERE, '..', 'poses', 'fix-support.py');
const RS = join(HERE, 'r2-support.py');

function promptsFor(p) {
  const lint = lintSpritePrompt({ tags: p.tags, poseTags: '', composition: 'full' });
  if (lint.stripped.length) throw new Error(`effect words in the prompt: ${JSON.stringify(lint.stripped)}`);
  return {
    positive: `logosX2, 1boy, solo, ${p.tags}, ${STYLE_TAGS}, ${QUALITY_TAGS}`,
    negative: [BASE_NEGATIVE, NEG_COMMON, p.neg].filter(Boolean).join(', '),
  };
}

function graph({ seed, lora, loraFile, denoise, crop, mask, refs, refWeight, positive, negative, prefix }) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: loraFile, strength_model: lora, strength_clip: lora } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['10', 1] } },
    20: { class_type: 'LoadImage', inputs: { image: refs[0], upload: 'image' } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    40: { class_type: 'LoadImage', inputs: { image: crop, upload: 'image' } },
    41: { class_type: 'VAEEncode', inputs: { pixels: ['40', 0], vae: ['4', 2] } },
    42: { class_type: 'LoadImageMask', inputs: { image: mask, channel: 'red', upload: 'image' } },
    43: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['41', 0], mask: ['42', 0] } },
    3: { class_type: 'KSampler', inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise, model: ['23', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['43', 0] } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };
  let img = ['20', 0];
  if (refs[1]) {
    g[24] = { class_type: 'LoadImage', inputs: { image: refs[1], upload: 'image' } };
    g[25] = { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } };
    img = ['25', 0];
  }
  g[23] = { class_type: 'IPAdapterAdvanced', inputs: { model: ['10', 0], ipadapter: ['21', 0], image: img, weight: refWeight, weight_type: 'ease in', combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0] } };
  return g;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function runComfy(workflow, outPath, client = 'pyrefly-logos-r2') {
  let noted = 0;
  for (;;) {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    if (!q.queue_running.length && !q.queue_pending.length) break;
    if (Date.now() - noted > 60_000) { console.error(`[${client}] queue busy; waiting`); noted = Date.now(); }
    await sleep(4000);
  }
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: workflow, client_id: client }) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body).slice(0, 1500)}`);
  const id = body.prompt_id;
  const deadline = Date.now() + 30 * 60_000;
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

export function maxRgb(p) {
  const r = spawnSync(PY, ['-s', '-c', 'import sys,numpy as n;from PIL import Image;print(int(n.asarray(Image.open(sys.argv[1]).convert("RGB")).max()))', p], { encoding: 'utf8' });
  return Number(r.stdout.trim());
}

async function fixKey(key, a) {
  const s = JSON.parse(readFileSync(FIXES, 'utf8'))[key];
  const n = Number(a.seeds || 6);
  const only = a.only ? a.only.split(',').map(Number) : null;
  const orig = join(REPO, s.base);
  const origSha = sha(orig);
  const loraStrength = Number(a.lora ?? s.lora.strength);
  mkdirSync(W, { recursive: true });
  for (let k = 0; k < n; k++) {
    const seed = s.seed0 + k;
    if (only && !only.includes(seed)) continue;
    const tag = `${key}.${seed}.fix`;
    if (existsSync(join(R, `${tag}.json`)) && !a.force) continue;
    const wd = join(W, `${key}.${seed}`);
    mkdirSync(wd, { recursive: true });
    let base = join(wd, 'flat.png');
    py(RS, 'flat', orig, base);
    const passes = [];
    let secs = 0;
    for (let i = 0; i < s.passes.length; i++) {
      const p = s.passes[i];
      const pd = join(wd, `p${i}`);
      const info = py(FS, 'prep', FIXES, key, String(i), base, pd);
      if (info.pasted) base = join(pd, 'base.png');
      const denoise = p.denoise[k % p.denoise.length];
      const { positive, negative } = promptsFor(p);
      const out = join(pd, 'inpainted.png');
      const refs = p.refs.map((r) => stageImage(join(HERE, r)));
      secs += await runComfy(graph({ seed, lora: loraStrength, loraFile: s.lora.file, denoise,
        crop: stageImage(join(pd, 'crop.png')), mask: stageImage(join(pd, 'mask.png')), refs, refWeight: p.refWeight, positive, negative, prefix: `pyrefly/logos-r2-fix-${key}` }), out);
      if (maxRgb(out) === 0) throw new Error(`${tag}: BLACK FRAME; check the queue, never restart ComfyUI from here`);
      const merged = join(pd, 'merged.png');
      py(FS, 'merge', FIXES, key, String(i), base, out, merged);
      base = merged;
      passes.push({ name: p.name, crop: p.crop, size: info.size, mask: p.mask, feather: p.feather, prefill: p.prefill || [], denoise, refs: p.refs, refWeight: p.refWeight, positive, negative });
    }
    copyFileSync(base, join(R, `${tag}.flat.png`));
    py(RS, 'finish', FIXES, key, orig, join(R, `${tag}.flat.png`), join(R, `${tag}.png`));
    const proof = py(RS, 'diff', orig, join(R, `${tag}.png`), FIXES, key, join(R, `${tag}.diff.png`));
    if (proof.changedOutsideMask !== 0) throw new Error(`${tag}: ${proof.changedOutsideMask} pixels changed outside the mask`);
    if (sha(orig) !== origSha) throw new Error('the base changed during the run');
    writeFileSync(join(R, `${tag}.json`), JSON.stringify({
      tag, key, seed, method: 'masked repaint on the installed cutout (lora inpaint)', base: s.base, baseSha256: origSha, judge: s.judge,
      model: CKPT, lora: { ...s.lora, strength: loraStrength }, passes, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      proof, sha256: sha(join(R, `${tag}.png`)), seconds: Math.round(secs), generatedAt: new Date().toISOString(),
    }, null, 1) + '\n');
    console.log(`[logos-r2-fix] ${tag} ${Math.round(secs)} s, changed ${proof.changedPixels} px, outside the mask ${proof.changedOutsideMask}`);
  }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('round2/fix2.mjs')) {
  const a = { _: [] };
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) {
    if (v[i] === '--force') a.force = true;
    else if (v[i].startsWith('--')) a[v[i].slice(2)] = v[++i];
    else a._.push(v[i]);
  }
  const all = JSON.parse(readFileSync(FIXES, 'utf8'));
  if (!a._.length || a._.some((k) => !all[k])) { console.log('usage: node fix2.mjs <key> [--seeds 6] [--only N] [--force] [--lora 0.5]'); process.exit(1); }
  for (const k of a._) await fixKey(k, a);
}
