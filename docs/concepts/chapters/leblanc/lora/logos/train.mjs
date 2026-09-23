#!/usr/bin/env node
/**
 * Chapter 6 (FFX-2 only): train the logos-x2 identity LoRA.
 *
 * Same kohya settings as the living-portrait run's driver (tools/gen/lora-train.mjs,
 * yuna-x2; not edited here, it is that run's uncommitted work), with a stricter
 * gate because three identity LoRAs (leblanc, ormi, logos) and the rig's LoRA
 * share one 16 GB card tonight:
 *
 *  GPU RULE: poll ComfyUI /queue until empty AND nvidia-smi under 4 GB used for
 *  3 consecutive minutes. Also wait while any sdxl_train_network / train_network
 *  python process is alive (another training) or another lock file is fresh in
 *  D:/Tools/pyrefly-lora/*.lock; then take gpu-train.lock by exclusive create
 *  (the convention in D:/Tools/pyrefly-lora/GPU-LOCK.md). ComfyUI is never restarted; its /free is asked
 *  once if the queue is empty but models are still held.
 *
 *   node train.mjs gate
 *   node train.mjs train [--steps 2000] [--dim 16] [--alpha 8] [--lr 1e-4]
 *
 * Dataset: build-dataset.py (D:/Tools/pyrefly-lora/logos/dataset/manifest.json).
 * Out: D:/Tools/pyrefly-lora/logos/out (every 500 steps; never committed),
 * out/train.log, out/vram.csv, out/run.json (wall time, peak VRAM, args).
 */

import { spawn, execFileSync } from 'node:child_process';
import { closeSync, createWriteStream, existsSync, mkdirSync, openSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync, writeSync } from 'node:fs';
import { join } from 'node:path';

const LORA_ROOT = 'D:/Tools/pyrefly-lora';
const NAME = 'logos-x2';
const ROOT = join(LORA_ROOT, 'logos');
const DATA = join(ROOT, 'dataset');
const OUT = join(ROOT, 'out');
const LOCK = join(LORA_ROOT, 'gpu-train.lock'); // the shared lock (D:/Tools/pyrefly-lora/GPU-LOCK.md)
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
    if (v[i].startsWith('--')) a[v[i].slice(2)] = v[i + 1] && !v[i + 1].startsWith('--') ? v[++i] : true;
    else a._.push(v[i]);
  }
  return a;
}

function vramUsedMB() {
  const out = execFileSync('nvidia-smi', ['--query-gpu=memory.used', '--format=csv,noheader,nounits']);
  return Number(String(out).trim().split(/\r?\n/)[0]);
}

async function queueEmpty() {
  try {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    return (q.queue_running?.length || 0) === 0 && (q.queue_pending?.length || 0) === 0;
  } catch {
    return true;
  }
}

/** Any other kohya training alive on this machine? */
function otherTrainer() {
  try {
    const out = execFileSync('powershell', [
      '-NoProfile', '-Command',
      "Get-CimInstance Win32_Process | Where-Object { $_.Name -like 'python*' -and $_.CommandLine -match 'train_network|train_db|flux_train' } | ForEach-Object { $_.ProcessId }",
    ], { encoding: 'utf8' });
    const pids = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    return pids.length ? `trainer process ${pids.join(',')}` : null;
  } catch {
    return null;
  }
}

/** The shared gpu-train.lock (or any other fresh *.lock) held by another training. */
function otherLock() {
  try {
    for (const f of readdirSync(LORA_ROOT)) {
      if (!f.endsWith('.lock')) continue;
      if (Date.now() - statSync(join(LORA_ROOT, f)).mtimeMs < 6 * 3600_000) return `lock ${f}`;
    }
  } catch { /* none */ }
  return null;
}

/** Exclusive create of the shared lock; false if another training got there first. */
function takeLock() {
  try {
    const fd = openSync(LOCK, 'wx');
    writeSync(fd, JSON.stringify({ owner: 'logos-x2 (pyrefly-leblanc-art-lora)', pid: process.pid, at: stamp() }));
    closeSync(fd);
    return true;
  } catch {
    return false;
  }
}

async function gpuGate({ log = console.log } = {}) {
  let since = null;
  let freed = false;
  let emptyAbove = null;
  let lastNote = 0;
  for (;;) {
    const empty = await queueEmpty();
    const mb = vramUsedMB();
    const busy = otherTrainer() || otherLock();
    const now = Date.now();
    if (empty && mb < GATE_MB && !busy) {
      since ??= now;
      if (now - since >= GATE_MS) {
        // Jitter, then one last look, so two gates that open together do not both start.
        await sleep(5000 + Math.floor(Math.random() * 25_000));
        const late = otherTrainer() || otherLock();
        const mb2 = vramUsedMB();
        if (!late && mb2 < GATE_MB && (await queueEmpty())) {
          log(`[gate] ${stamp()} free: queue empty, ${mb2} MB used for 3 min, no other trainer`);
          return;
        }
        since = null;
      }
    } else since = null;
    if (empty && mb >= GATE_MB && !busy) {
      emptyAbove ??= now;
      if (!freed && now - emptyAbove > 120_000) {
        log(`[gate] ${stamp()} queue empty but ${mb} MB held: asking ComfyUI to unload models (/free)`);
        try {
          await fetch(`${COMFY}/free`, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ unload_models: true, free_memory: true }),
          });
        } catch { /* not running */ }
        freed = true;
      }
    } else emptyAbove = null;
    if (now - lastNote > 60_000) {
      log(`[gate] ${stamp()} queue ${empty ? 'empty' : 'busy'}, ${mb} MB used${busy ? `, ${busy}` : ''}; waiting`);
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
  for (;;) {
    await gpuGate({ log });
    if (takeLock()) break;
    log(`[gate] ${stamp()} ${LOCK} taken by another training; back to waiting`);
  }
  const toml = join(ROOT, 'dataset.toml');
  writeFileSync(toml, datasetToml());
  const steps = Number(a.steps || 2000);
  const cli = [
    'sdxl_train_network.py',
    `--pretrained_model_name_or_path=${CKPT}`,
    `--dataset_config=${toml}`,
    `--output_dir=${OUT}`,
    `--output_name=${NAME}`,
    '--save_model_as=safetensors',
    '--network_module=networks.lora',
    `--network_dim=${a.dim || 16}`,
    `--network_alpha=${a.alpha || 8}`,
    `--learning_rate=${a.lr || '1e-4'}`,
    `--unet_lr=${a.lr || '1e-4'}`,
    '--network_train_unet_only',
    '--cache_text_encoder_outputs',
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
    '--seed=4343',
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
  try { unlinkSync(LOCK); } catch { /* gone */ }
  const wall = (Date.now() - t0) / 1000;
  const run = { finished: stamp(), exit: code, wallSeconds: wall, peakVramMB: peak, steps, args: cli };
  writeFileSync(join(OUT, 'run.json'), JSON.stringify(run, null, 1));
  log(`[train] ${stamp()} exit ${code}, wall ${(wall / 60).toFixed(1)} min, peak VRAM ${peak} MB (whole card)`);
  if (code !== 0) process.exit(code);
}

const a = args();
if (a._[0] === 'gate') await gpuGate();
else if (a._[0] === 'train') {
  if (!existsSync(join(DATA, 'manifest.json'))) throw new Error('build the dataset first: build-dataset.py build');
  await train(a);
} else console.log('usage: node train.mjs gate | train [--steps N --dim N --alpha N --lr X]');
