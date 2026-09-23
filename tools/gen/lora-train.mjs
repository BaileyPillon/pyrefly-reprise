#!/usr/bin/env node
/**
 * Living-portrait v4 (FFX-2 only): train the yuna-x2 identity LoRA.
 *
 * The v3.3 turned keys were different paintings from the approved plate
 * (docs/concepts/pause-until-dawn/prototype-v2/shots/v3.3/CHECK.md). This tool
 * trains a LoRA on every approved painting of THIS Yuna so the keys painted by
 * `tools/gen/lora-keys.mjs` carry the plate's hair, tassel, eyes and line.
 *
 *   node tools/gen/lora-train.mjs gate            # wait for the shared GPU only
 *   node tools/gen/lora-train.mjs train [--steps 2000] [--dim 32] [--alpha 16] [--lr 1e-4] [--te]
 *
 * Dataset: `python -s tools/gen/rig-lora-data.py build` (sources read-only).
 * Trainer: kohya sd-scripts `sdxl_train_network.py` in D:/Tools/sd-scripts/.venv
 * on Animagine XL 4.0 Opt; LoRA saved every 500 steps under
 * D:/Tools/pyrefly-lora/yuna-x2/out (never committed).
 *
 * GPU RULE (the card is shared with a ComfyUI video render): before training,
 * poll ComfyUI /queue until it is empty AND nvidia-smi reports under 4 GB used
 * for 3 consecutive minutes. ComfyUI is never restarted. If the queue is empty
 * but ComfyUI still holds cached models above the bar, `/free` (unload models)
 * is requested once; that is ComfyUI's own API and leaves the server running.
 *
 * Logs: out/train.log (kohya stdout), out/vram.csv (nvidia-smi every 5 s),
 * out/run.json (wall time, peak VRAM, args).
 */

import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'D:/Tools/pyrefly-lora/yuna-x2';
const DATA = join(ROOT, 'dataset');
const OUT = join(ROOT, 'out');
const KOHYA = 'D:/Tools/sd-scripts/repo';
const PY = 'D:/Tools/sd-scripts/.venv/Scripts/python.exe';
const CKPT = 'D:/Tools/ComfyUI/ComfyUI/models/checkpoints/animagine-xl-4.0-opt.safetensors';
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const GATE_MB = 4096;
const GATE_MS = 3 * 60_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();

function args() {
  const a = { _: [] };
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) {
    if (v[i].startsWith('--')) {
      const k = v[i].slice(2);
      a[k] = v[i + 1] && !v[i + 1].startsWith('--') ? v[++i] : true;
    } else a._.push(v[i]);
  }
  return a;
}

export function vramUsedMB() {
  const out = execFileSync('nvidia-smi', ['--query-gpu=memory.used', '--format=csv,noheader,nounits']);
  return Number(String(out).trim().split(/\r?\n/)[0]);
}

async function queueEmpty() {
  try {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    return (q.queue_running?.length || 0) === 0 && (q.queue_pending?.length || 0) === 0;
  } catch {
    return true; // ComfyUI not running: nothing of its own to wait for
  }
}

/** Blocks until the shared card is free by the GPU RULE. */
export async function gpuGate({ log = console.log } = {}) {
  let since = null;
  let freed = false;
  let emptyAbove = null;
  let lastNote = 0;
  for (;;) {
    const empty = await queueEmpty();
    const mb = vramUsedMB();
    const now = Date.now();
    if (empty && mb < GATE_MB) {
      since ??= now;
      if (now - since >= GATE_MS) {
        log(`[gate] ${stamp()} free: queue empty and ${mb} MB used for 3 min`);
        return;
      }
    } else since = null;
    if (empty && mb >= GATE_MB) {
      emptyAbove ??= now;
      if (!freed && now - emptyAbove > 120_000) {
        log(`[gate] ${stamp()} queue empty but ${mb} MB held: asking ComfyUI to unload models (/free)`);
        try {
          await fetch(`${COMFY}/free`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ unload_models: true, free_memory: true }),
          });
        } catch { /* not running */ }
        freed = true;
      }
    } else emptyAbove = null;
    if (now - lastNote > 60_000) {
      log(`[gate] ${stamp()} queue ${empty ? 'empty' : 'busy'}, ${mb} MB used; waiting`);
      lastNote = now;
    }
    await sleep(10_000);
  }
}

function datasetToml() {
  const m = JSON.parse(readFileSync(join(DATA, 'manifest.json'), 'utf8'));
  const subsets = Object.entries(m.repeats)
    .map(([s, r]) => `[[datasets.subsets]]\nimage_dir = '${join(DATA, s).replace(/\\/g, '/')}'\nnum_repeats = ${r}\n`)
    .join('\n');
  return (
    `[general]\nenable_bucket = true\ncaption_extension = '.txt'\nshuffle_caption = false\n\n` +
    `[[datasets]]\nresolution = 1024\nbatch_size = 1\nmin_bucket_reso = 512\nmax_bucket_reso = 2048\n` +
    `bucket_reso_steps = 64\n\n${subsets}`
  );
}

async function train(a) {
  mkdirSync(OUT, { recursive: true });
  const logFile = join(OUT, 'train.log');
  const log = (s) => {
    console.log(s);
    writeFileSync(logFile, s + '\n', { flag: 'a' });
  };
  await gpuGate({ log });
  const toml = join(ROOT, 'dataset.toml');
  writeFileSync(toml, datasetToml());
  const steps = Number(a.steps || 2000);
  const cli = [
    'sdxl_train_network.py',
    `--pretrained_model_name_or_path=${CKPT}`,
    `--dataset_config=${toml}`,
    `--output_dir=${OUT}`,
    '--output_name=yuna-x2',
    '--save_model_as=safetensors',
    '--network_module=networks.lora',
    `--network_dim=${a.dim || 32}`,
    `--network_alpha=${a.alpha || 16}`,
    `--learning_rate=${a.lr || '1e-4'}`,
    `--unet_lr=${a.lr || '1e-4'}`,
    ...(a.te ? ['--text_encoder_lr=1e-5'] : ['--network_train_unet_only', '--cache_text_encoder_outputs']),
    '--optimizer_type=AdamW8bit',
    '--lr_scheduler=cosine',
    '--lr_warmup_steps=100',
    `--max_train_steps=${steps}`,
    '--save_every_n_steps=500',
    '--train_batch_size=1',
    '--mixed_precision=bf16',
    '--save_precision=fp16',
    '--gradient_checkpointing',
    '--sdpa',
    '--no_half_vae',
    '--cache_latents',
    '--cache_latents_to_disk',
    '--min_snr_gamma=5',
    '--max_data_loader_n_workers=0',
    '--seed=4242',
  ];
  log(`[train] ${stamp()} ${PY} ${cli.join(' ')}`);
  const vram = createWriteStream(join(OUT, 'vram.csv'), { flags: 'a' });
  let peak = 0;
  const poll = setInterval(() => {
    try {
      const mb = vramUsedMB();
      peak = Math.max(peak, mb);
      vram.write(`${stamp()},${mb}\n`);
    } catch { /* ignore */ }
  }, 5000);
  const t0 = Date.now();
  const code = await new Promise((res) => {
    const p = spawn(PY, cli, { cwd: KOHYA, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    const f = createWriteStream(logFile, { flags: 'a' });
    p.stdout.pipe(f);
    p.stderr.pipe(f);
    p.on('close', res);
  });
  clearInterval(poll);
  vram.end();
  const wall = (Date.now() - t0) / 1000;
  const run = { finished: stamp(), exit: code, wallSeconds: wall, peakVramMB: peak, steps, args: cli };
  writeFileSync(join(OUT, 'run.json'), JSON.stringify(run, null, 1));
  log(`[train] ${stamp()} exit ${code}, wall ${(wall / 60).toFixed(1)} min, peak VRAM ${peak} MB (whole card)`);
  if (code !== 0) process.exit(code);
}

const a = args();
const cmd = a._[0];
if (cmd === 'gate') await gpuGate();
else if (cmd === 'train') {
  if (!existsSync(join(DATA, 'manifest.json'))) throw new Error('build the dataset first: tools/gen/rig-lora-data.py build');
  await train(a);
} else {
  console.log('usage: node tools/gen/lora-train.mjs gate | train [--steps N --dim N --alpha N --lr X --te]');
}
