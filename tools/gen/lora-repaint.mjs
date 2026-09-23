#!/usr/bin/env node
/**
 * Living-portrait v4.1 (FFX-2 only): a masked repaint of one region of a rig
 * key with the plate's identity LoRA (yuna-x2), for the fixes the v4 check
 * asked for: the mirrored far clip on +60 / +85 painted over as hair, a
 * closed eye per key for the rolling lids, a seam. Same graph as
 * `lora-keys.mjs warp` (Animagine XL 4.0 Opt + LoRA 0.8 + the plate through
 * IP-Adapter at 0.3, SetLatentNoiseMask, core nodes only), no ControlNet: the
 * key around the mask already fixes the pose.
 *
 *   node tools/gen/lora-repaint.mjs --init <rgba or rgb png> --mask <L png, white = repaint>
 *        --yaw 60 --denoise 0.9 [--count 4] [--seed 5100] [--tags "brown hair"] [--neg "hairclip"]
 *        --out D:/Tools/pyrefly-lora/yuna-x2/rig-v41/<name>
 *
 * Writes <out>.c<i>.png (the whole 832x1216 frame) and <out>.c<i>.json. One
 * prompt at a time behind the shared ComfyUI queue; ComfyUI is never
 * restarted from here. Candidates stay outside the repo.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { BASE_NEGATIVE, stageImage } from './comfy.mjs';
import { graph, prompt } from './lora-keys.mjs';

const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parse() {
  const a = {};
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) if (v[i].startsWith('--')) a[v[i].slice(2)] = v[i + 1] && !v[i + 1].startsWith('--') ? v[++i] : true;
  return a;
}

async function run(workflow, outPath) {
  let noted = 0;
  for (;;) {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    if (!q.queue_running.length && !q.queue_pending.length) break;
    if (Date.now() - noted > 60_000) {
      console.error(`[repaint] queue busy (${q.queue_running.length} running, ${q.queue_pending.length} pending); waiting`);
      noted = Date.now();
    }
    await sleep(5000);
  }
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-lora-repaint' }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body)}`);
  const id = body.prompt_id;
  for (;;) {
    const hist = await (await fetch(`${COMFY}/history/${id}`)).json();
    const e = hist[id];
    if (e?.status?.status_str === 'error') throw new Error(`failed: ${JSON.stringify(e.status.messages)}`);
    const img = e && Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
    if (img) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      writeFileSync(outPath, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      return (Date.now() - t0) / 1000;
    }
    await sleep(1000);
  }
}

async function main() {
  const a = parse();
  if (!a.init || !a.mask || !a.out) {
    console.log('usage: lora-repaint.mjs --init <png> --mask <png> --yaw 60 --denoise 0.9 [--count 4] [--seed N] [--tags ..] [--neg ..] --out <prefix>');
    process.exit(2);
  }
  const yaw = Number(a.yaw ?? 0);
  const count = Number(a.count ?? 4);
  const seed0 = Number(a.seed ?? 5100);
  const denoise = String(a.denoise ?? '0.9').split(',').map(Number);
  const negative = `${BASE_NEGATIVE}, full body, chibi, sketch, monochrome, 3d, realistic, hair flower, flower, choker, necklace, braid, collar, brooch, headphones, headset${a.neg ? `, ${a.neg}` : ''}`;
  mkdirSync(dirname(a.out), { recursive: true });
  const init = stageImage(a.init);
  const mask = stageImage(a.mask);
  const ref = stageImage('public/art/portraits/yuna-x2.png');
  for (let i = 0; i < count; i++) {
    const d = denoise[i % denoise.length];
    const g = graph({ yaw, seed: seed0 + i, lora: a.lora || 'yuna-x2.safetensors', strength: Number(a.strength ?? 0.8), cn: 0, cnEnd: 1,
      refWeight: Number(a.ref ?? 0.3), pose: null, ref, prefix: 'pyrefly/lora-repaint', init, mask, denoise: d, negative });
    if (a.tags) g[6].inputs.text = `${prompt(yaw)}, ${a.tags}`;
    const out = `${a.out}.c${i + 1}`;
    const secs = await run(g, `${out}.png`);
    writeFileSync(`${out}.json`, JSON.stringify({ init: a.init, mask: a.mask, yaw, seed: seed0 + i, denoise: d, tags: a.tags ?? '', negative, prompt: g[6].inputs.text, seconds: secs }, null, 1));
    console.log(`[repaint] ${out}.png  ${secs.toFixed(1)} s`);
  }
}

main().catch((e) => {
  console.error(`[repaint] FAILED: ${e.message}`);
  process.exit(1);
});
