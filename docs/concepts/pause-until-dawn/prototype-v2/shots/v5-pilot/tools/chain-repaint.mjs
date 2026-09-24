#!/usr/bin/env node
/**
 * Living portrait v5 pilot (game case: both; the plate is Yuna X-2): the LoRA repaint of one propagated key's
 * holes (rig-chain.py propagate writes init.png + mask.png). ONE prompt per key: the graph of
 * tools/gen/lora-repaint.mjs (Animagine XL 4.0 Opt + yuna-x2 LoRA 0.8 + the plate through IP-Adapter 0.3,
 * SetLatentNoiseMask, core nodes) with the latent repeated twice (two seeds) and three samplers at denoise
 * 0.45 / 0.55 / 0.65: the method's 6 candidates in one queue entry.
 *
 * The ComfyUI queue is shared: it must have been EMPTY for 3 minutes before the prompt goes in; ComfyUI is never
 * restarted from here. Run from the repo root:
 *
 *   node docs/concepts/pause-until-dawn/prototype-v2/shots/v5-pilot/tools/chain-repaint.mjs
 *        --init <init.png> --mask <mask.png> --yaw 20 --seed 5500 --out <dir>/cand
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { BASE_NEGATIVE, stageImage } from '../../../../../../../tools/gen/comfy.mjs';
import { graph } from '../../../../../../../tools/gen/lora-keys.mjs';

const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const QUIET_MS = 180_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);

async function waitQuiet() {
  let since = null;
  for (;;) {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    const empty = !q.queue_running.length && !q.queue_pending.length;
    if (!empty) since = null;
    else if (since === null) since = Date.now();
    if (since !== null && Date.now() - since >= QUIET_MS) return;
    await sleep(2_000);
  }
}

async function main() {
  const init = arg('--init');
  const mask = arg('--mask');
  const out = arg('--out');
  const yaw = Number(arg('--yaw', '20'));
  const seed = Number(arg('--seed', '5500'));
  const denoise = [0.45, 0.55, 0.65];
  if (!init || !mask || !out) throw new Error('need --init --mask --out');
  mkdirSync(dirname(out), { recursive: true });
  const negative = `${BASE_NEGATIVE}, full body, chibi, sketch, monochrome, 3d, realistic, hair flower, flower, choker, necklace, braid, collar, brooch, headphones, headset`;
  const g = graph({ yaw, seed, lora: 'yuna-x2.safetensors', strength: 0.8, cn: 0, cnEnd: 1, refWeight: 0.3, pose: null,
    ref: stageImage('public/art/portraits/yuna-x2.png'), prefix: 'pyrefly/v5-pilot', init: stageImage(init), mask: stageImage(mask), denoise: denoise[0], negative });
  g[45] = { class_type: 'RepeatLatentBatch', inputs: { samples: ['44', 0], amount: 2 } };
  const ks = g[3];
  delete g[3]; delete g[8]; delete g[9];
  denoise.forEach((d, i) => {
    const n = 100 + i * 3;
    g[n] = { ...ks, inputs: { ...ks.inputs, denoise: d, latent_image: ['45', 0] } };
    g[n + 1] = { class_type: 'VAEDecode', inputs: { samples: [String(n), 0], vae: ['4', 2] } };
    g[n + 2] = { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/v5-pilot-d${Math.round(d * 100)}`, images: [String(n + 1), 0] } };
  });
  console.log('[v5] waiting for 3 quiet minutes on the shared queue');
  await waitQuiet();
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: g, client_id: 'pyrefly-v5-pilot' }) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body)}`);
  const id = body.prompt_id;
  let started = null;
  for (;;) {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    if (started === null && q.queue_running.some((r) => r[1] === id)) started = Date.now();
    const e = (await (await fetch(`${COMFY}/history/${id}`)).json())[id];
    if (e?.status?.status_str === 'error') throw new Error(`failed: ${JSON.stringify(e.status.messages)}`);
    if (e?.status?.completed) {
      const rows = [];
      for (const [node, o] of Object.entries(e.outputs || {})) {
        const d = denoise[(Number(node) - 102) / 3];
        (o.images || []).forEach((img, j) => rows.push({ d, j, img }));
      }
      const saved = [];
      for (const { d, j, img } of rows) {
        const q2 = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
        const p = `${out}.d${Math.round(d * 100)}.s${j + 1}.png`;
        writeFileSync(p, Buffer.from(await (await fetch(`${COMFY}/view?${q2}`)).arrayBuffer()));
        saved.push(p);
      }
      const gpuS = ((Date.now() - (started ?? t0)) / 1000).toFixed(1);
      writeFileSync(`${out}.json`, JSON.stringify({ init, mask, yaw, seed, denoise, batch: 2, gpuSeconds: Number(gpuS), wallSeconds: (Date.now() - t0) / 1000, saved }, null, 1));
      console.log(`[v5] ${saved.length} candidates, ~${gpuS} s on the GPU`);
      return;
    }
    await sleep(1000);
  }
}

main().catch((e) => { console.error(`[v5] FAILED: ${e.message}`); process.exit(1); });
