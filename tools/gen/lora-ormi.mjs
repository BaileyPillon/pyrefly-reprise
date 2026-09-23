#!/usr/bin/env node
/**
 * Chapter 6 art (FFX-2 only): the Ormi identity LoRA (`ormiX2`).
 *
 *   node tools/gen/lora-ormi.mjs upscale     # dataset crops through RealESRGAN x4 in ComfyUI (stage/crops -> stage/up)
 *   node tools/gen/lora-ormi.mjs gate        # wait for the shared GPU only (takes and releases the lock)
 *   node tools/gen/lora-ormi.mjs train [--steps 2000 --dim 16 --alpha 8 --lr 1e-4]
 *   node tools/gen/lora-ormi.mjs steptest [--loras none,ormi-steps/ormi-x2-step00000500.safetensors,...]
 *                                         [--seeds 9300,9301] [--strength 0.8] [--ref 0.3] [--tag steptest]
 *
 * Dataset: `python docs/concepts/chapters/leblanc/lora/ormi/dataset.py crops|finish`
 * (sources and sha256 in docs/concepts/chapters/leblanc/lora/ormi/dataset.md).
 * Trainer: kohya sd-scripts `sdxl_train_network.py` (D:/Tools/sd-scripts/.venv) on
 * Animagine XL 4.0 Opt, the settings that worked for the yuna-x2 run
 * (tools/gen/lora-train.mjs), saved every 500 steps to D:/Tools/pyrefly-lora/ormi/out.
 *
 * GPU RULE (the 16 GB card is shared with other LoRA trainings and ComfyUI):
 * before training, ComfyUI /queue must be empty AND nvidia-smi under 4 GB used
 * for 3 consecutive minutes; no other `train_network` process may be running;
 * and the lock file D:/Tools/pyrefly-lora/gpu-train.lock (exclusive create) must
 * be free. The lock is held for the whole training and deleted at the end.
 * ComfyUI is never restarted. Renders are queued one at a time behind an empty queue.
 */

import { spawn, execFileSync } from 'node:child_process';
import { closeSync, createWriteStream, existsSync, mkdirSync, openSync, readdirSync, readFileSync, unlinkSync, writeFileSync, writeSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage } from './comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const ROOT = 'D:/Tools/pyrefly-lora/ormi';
const DATA = join(ROOT, 'dataset');
const OUT = join(ROOT, 'out');
const CAND = join(ROOT, 'cand');
const LOCK = 'D:/Tools/pyrefly-lora/gpu-train.lock';
const KOHYA = 'D:/Tools/sd-scripts/repo';
const PY = 'D:/Tools/sd-scripts/.venv/Scripts/python.exe';
const CKPT_PATH = 'D:/Tools/ComfyUI/ComfyUI/models/checkpoints/animagine-xl-4.0-opt.safetensors';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const IDLE = join(REPO, 'public/art/characters/ormi/idle.png');
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

/** Other kohya trainings on this machine (any subject), by command line. */
function otherTrainers() {
  try {
    const ps = "Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -match 'train_network' } | ForEach-Object { $_.ProcessId }";
    const out = execFileSync('powershell', ['-NoProfile', '-Command', ps]);
    return String(out).split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

async function queueEmpty() {
  try {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    return (q.queue_running?.length || 0) === 0 && (q.queue_pending?.length || 0) === 0;
  } catch {
    return true;
  }
}

function takeLock() {
  try {
    const fd = openSync(LOCK, 'wx');
    writeSync(fd, JSON.stringify({ owner: 'ormi-x2 (tools/gen/lora-ormi.mjs)', pid: process.pid, at: stamp() }));
    closeSync(fd);
    return true;
  } catch {
    return false;
  }
}

function releaseLock() {
  try {
    if (JSON.parse(readFileSync(LOCK, 'utf8')).pid === process.pid) unlinkSync(LOCK);
  } catch { /* not ours or gone */ }
}

async function gpuGate(log) {
  let since = null;
  let lastNote = 0;
  let idleAbove = null;
  let lastFree = 0;
  for (;;) {
    const empty = await queueEmpty();
    const mb = vramUsedMB();
    const others = otherTrainers();
    const locked = existsSync(LOCK);
    const now = Date.now();
    if (empty && mb < GATE_MB && !others && !locked) {
      since ??= now;
      if (now - since >= GATE_MS) {
        if (!takeLock()) { since = null; continue; }
        if (otherTrainers() || !(await queueEmpty())) { releaseLock(); since = null; continue; }
        log(`[gate] ${stamp()} free: queue empty, ${mb} MB used for 3 min, no other trainer; lock taken`);
        return;
      }
    } else since = null;
    // Queue empty, nobody training, but ComfyUI still caching models above the bar: ask it to
    // unload (its own /free API; the server keeps running). At most once every 10 minutes.
    if (empty && mb >= GATE_MB && !others && !locked) {
      idleAbove ??= now;
      if (now - idleAbove > 120_000 && now - lastFree > 600_000) {
        log(`[gate] ${stamp()} queue empty but ${mb} MB held: asking ComfyUI to unload models (/free)`);
        try {
          await fetch(`${COMFY}/free`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ unload_models: true, free_memory: true }) });
        } catch { /* not running */ }
        lastFree = now;
      }
    } else idleAbove = null;
    if (now - lastNote > 60_000) {
      log(`[gate] ${stamp()} queue ${empty ? 'empty' : 'busy'}, ${mb} MB used, trainers ${others}, lock ${locked ? 'held' : 'free'}; waiting`);
      lastNote = now;
    }
    await sleep(10_000);
  }
}

async function train(a) {
  mkdirSync(OUT, { recursive: true });
  const logFile = join(OUT, 'train.log');
  const log = (s) => { console.log(s); writeFileSync(logFile, s + '\n', { flag: 'a' }); };
  const toml = join(ROOT, 'dataset.toml');
  writeFileSync(toml,
    `[general]\nenable_bucket = true\ncaption_extension = '.txt'\nshuffle_caption = false\n\n` +
    `[[datasets]]\nresolution = 1024\nbatch_size = 1\nmin_bucket_reso = 512\nmax_bucket_reso = 2048\nbucket_reso_steps = 64\n\n` +
    `[[datasets.subsets]]\nimage_dir = '${DATA}'\nnum_repeats = 1\n`);
  await gpuGate(log);
  const steps = Number(a.steps || 2000);
  const cli = [
    'sdxl_train_network.py',
    `--pretrained_model_name_or_path=${CKPT_PATH}`,
    `--dataset_config=${toml}`,
    `--output_dir=${OUT}`,
    '--output_name=ormi-x2',
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
    try { const mb = vramUsedMB(); peak = Math.max(peak, mb); vram.write(`${stamp()},${mb}\n`); } catch { /* ignore */ }
  }, 5000);
  const t0 = Date.now();
  let code;
  try {
    code = await new Promise((res) => {
      const p = spawn(PY, cli, { cwd: KOHYA, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
      const f = createWriteStream(logFile, { flags: 'a' });
      p.stdout.pipe(f);
      p.stderr.pipe(f);
      p.on('close', res);
    });
  } finally {
    clearInterval(poll);
    vram.end();
    releaseLock();
  }
  const wall = (Date.now() - t0) / 1000;
  writeFileSync(join(OUT, 'run.json'), JSON.stringify({ finished: stamp(), exit: code, wallSeconds: wall, peakVramMB: peak, steps, args: cli }, null, 1));
  log(`[train] ${stamp()} exit ${code}, wall ${(wall / 60).toFixed(1)} min, peak VRAM ${peak} MB (whole card)`);
  if (code !== 0) process.exit(code);
}

/** One prompt at a time: wait for an empty shared queue, then queue ours and fetch the first image. */
async function run(workflow, outPath) {
  let noted = 0;
  while (!(await queueEmpty())) {
    if (Date.now() - noted > 60_000) { console.error('[ormi] queue busy; waiting'); noted = Date.now(); }
    await sleep(5000);
  }
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-lora-ormi' }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body)}`);
  const id = body.prompt_id;
  for (;;) {
    const e = (await (await fetch(`${COMFY}/history/${id}`)).json())[id];
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

async function upscale() {
  const src = join(ROOT, 'stage/crops');
  const dst = join(ROOT, 'stage/up');
  mkdirSync(dst, { recursive: true });
  for (const f of readdirSync(src).filter((n) => n.endsWith('.png') && !n.startsWith('full'))) {
    const g = {
      1: { class_type: 'LoadImage', inputs: { image: stageImage(join(src, f)), upload: 'image' } },
      2: { class_type: 'UpscaleModelLoader', inputs: { model_name: 'RealESRGAN_x4plus.pth' } },
      3: { class_type: 'ImageUpscaleWithModel', inputs: { upscale_model: ['2', 0], image: ['1', 0] } },
      4: { class_type: 'SaveImage', inputs: { filename_prefix: 'pyrefly/lora-ormi-up', images: ['3', 0] } },
    };
    const s = await run(g, join(dst, f));
    console.log(`[ormi] up ${f} ${s.toFixed(1)} s`);
  }
}

// Step test: the idle pose; the idle square-padded (method check §2.2) as IP-Adapter reference at 0.3.
export const IDLE_PROMPT =
  'ormiX2, 1boy, solo, full body, from side, three-quarter view, standing, arms crossed, looking to the side, ' +
  'body facing right, white background, simple background';
export const NEGATIVE = `${BASE_NEGATIVE}, multiple views, 2boys, chibi, sketch, monochrome, 3d, realistic, from behind, cropped`;

function idleSquare() {
  const p = join(ROOT, 'stage/idle-square.png');
  if (!existsSync(p)) {
    const py = [
      'from PIL import Image', 'import sys',
      'im=Image.open(sys.argv[1]).convert("RGBA"); s=max(im.size)+64',
      'bg=Image.new("RGBA",(s,s),(255,255,255,255)); bg.alpha_composite(im,((s-im.width)//2,(s-im.height)//2))',
      'bg.convert("RGB").save(sys.argv[2])',
    ].join('\n');
    execFileSync('python', ['-c', py, IDLE, p]);
  }
  return p;
}

export function testGraph({ lora, strength, ref, refWeight, seed, prompt = IDLE_PROMPT }) {
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width: 832, height: 1216, batch_size: 1 } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: 'pyrefly/lora-ormi', images: ['8', 0] } },
  };
  let model = ['4', 0];
  let clip = ['4', 1];
  if (lora) {
    g[10] = { class_type: 'LoraLoader', inputs: { model, clip, lora_name: lora, strength_model: strength, strength_clip: strength } };
    model = ['10', 0];
    clip = ['10', 1];
  }
  g[6] = { class_type: 'CLIPTextEncode', inputs: { text: `${prompt}, ${STYLE_TAGS}, ${QUALITY_TAGS}`, clip } };
  g[7] = { class_type: 'CLIPTextEncode', inputs: { text: NEGATIVE, clip } };
  if (refWeight > 0) {
    g[20] = { class_type: 'LoadImage', inputs: { image: ref, upload: 'image' } };
    g[21] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } };
    g[22] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } };
    g[23] = {
      class_type: 'IPAdapterAdvanced',
      inputs: {
        model, ipadapter: ['21', 0], image: ['20', 0], weight: refWeight, weight_type: 'ease in',
        combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0],
      },
    };
    model = ['23', 0];
  }
  g[3] = {
    class_type: 'KSampler',
    inputs: {
      seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1,
      model, positive: ['6', 0], negative: ['7', 0], latent_image: ['5', 0],
    },
  };
  return g;
}

async function steptest(a) {
  const loras = String(a.loras || 'none').split(',');
  const seeds = String(a.seeds || '9300,9301').split(',').map(Number);
  const strength = Number(a.strength ?? 0.8);
  const refWeight = Number(a.ref ?? 0.3);
  const ref = stageImage(idleSquare());
  const prompt = a.prompt || IDLE_PROMPT;
  const dir = join(CAND, a.tag || 'steptest');
  mkdirSync(dir, { recursive: true });
  for (const l of loras) {
    const tag = l === 'none' ? 'none' : l.replace(/^.*[\\/]/, '').replace(/\.safetensors$/, '');
    for (const seed of seeds) {
      const out = join(dir, `${tag}.${seed}`);
      if (existsSync(`${out}.png`)) continue;
      const opts = { lora: l === 'none' ? null : l, strength: l === 'none' ? 0 : strength, ref, refWeight, seed, prompt };
      const s = await run(testGraph(opts), `${out}.png`);
      writeFileSync(`${out}.json`, JSON.stringify({
        ...opts, negative: NEGATIVE, model: CKPT,
        ipadapter: { file: IPADAPTER, weight: refWeight, type: 'ease in', start: 0.2, end: 0.6, scaling: 'K+V', image: 'public/art/characters/ormi/idle.png (square-padded on white)' },
        steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal', width: 832, height: 1216, seconds: s,
      }, null, 1));
      console.log(`[ormi] ${out}.png ${s.toFixed(1)} s`);
    }
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const a = args();
  const cmd = a._[0];
  if (cmd === 'upscale') await upscale();
  else if (cmd === 'gate') { await gpuGate(console.log); releaseLock(); }
  else if (cmd === 'train') {
    if (!existsSync(join(DATA, 'manifest.json'))) throw new Error('build the dataset first (dataset.py finish)');
    await train(a);
  } else if (cmd === 'steptest') await steptest(a);
  else console.log('usage: node tools/gen/lora-ormi.mjs upscale | gate | train [--steps N --dim N --alpha N --lr X] | steptest [--loras a,b --seeds 1,2]');
}
