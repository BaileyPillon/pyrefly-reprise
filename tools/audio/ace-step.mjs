#!/usr/bin/env node
/**
 * Sketch B of the music audition (docs/plans/music-modern-sound.md §3, §6):
 * ACE-Step v1 3.5B through ComfyUI's CORE nodes, no custom node pack.
 *
 *   restyle  the CURRENT shipped render (public/audio/music/<cue>.mp3) goes in
 *            through LoadAudio -> VAEEncodeAudio and comes out of KSampler at a
 *            denoise below 1.0, so the score's notes and timing are the prior
 *            and only the sound is asked to move. Same length as the cue.
 *   t2m      text-to-music control at the cue's tempo and key (THEMES.md cue
 *            map), EmptyAceStepLatentAudio at the cue's duration: what the model
 *            does unconstrained.
 *   source   the 12-second excerpt of the shipped cue, same window, for A/B.
 *
 *   node tools/audio/ace-step.mjs --cue=battle-ffx --mode=restyle --denoise=0.40 --seeds=101,202,303
 *   node tools/audio/ace-step.mjs --cue=battle-ffx --mode=t2m --seeds=101
 *   node tools/audio/ace-step.mjs --cue=battle-ffx --mode=source
 *   node tools/audio/ace-step.mjs --cue=battle-ffx --mode=remeasure   (no GPU; after editing ace-measure.py)
 *     --out=<dir>     where the .ogg files go (default public/audio/candidates)
 *     --report=<f>    JSON report to merge results into (default <out>/B-report.json)
 *     --tag=<s>       extra file-name tag, e.g. d35 for a denoise sweep
 *
 * Every input name in the graph below was read from the live /object_info of
 * ComfyUI 0.35.0 on 2026-09-22 (CheckpointLoaderSimple.ckpt_name,
 * TextEncodeAceStepAudio.{clip,tags,lyrics,lyrics_strength},
 * EmptyAceStepLatentAudio.{seconds,batch_size}, LoadAudio.audio,
 * VAEEncodeAudio.{audio,vae}, KSampler.{...,denoise}, VAEDecodeAudio.{samples,vae},
 * SaveAudio.{audio,filename_prefix}, ModelSamplingSD3.shift,
 * LatentOperationTonemapReinhard.multiplier, LatentApplyOperationCFG.{model,operation},
 * ConditioningZeroOut.conditioning).
 *
 * Agents cannot hear (hard rule 13). Each output is measured by
 * tools/audio/ace-measure.py (onset-grid drift, onset F, chroma similarity,
 * spectral centroid) and ffmpeg ebur128 (integrated loudness, LRA); the best
 * seed is the one with the highest measured structure fidelity, never a claim
 * of having listened. Bailey judges by ear from docs/audio/audition.html.
 *
 * Game-aware (hard rule 14): the pipeline is BOTH; the style tags are per game
 * and come from THEMES.md "Harmonic language, by world" (FFX: orchestra,
 * natural minor; FFX-2: electric bass and kit, brass, electric piano).
 */

import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = `http://${process.env.COMFY_HOST || '127.0.0.1'}:${process.env.COMFY_PORT || 8188}`;
const FFMPEG = process.env.FFMPEG_PATH || 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe';
const PYTHON = process.env.ACE_PYTHON || 'D:/Tools/ComfyUI/python_embeded/python.exe';
const CKPT = 'ace_step_v1_3.5b.safetensors';
const TARGET_LUFS = -16; // the shipped master target (tools/audio/master.mjs)
const EXCERPT_S = 12;

/** Tempo and key from docs/audio/THEMES.md's cue map; excerpt starts at the manifest loopStart. */
export const CUES = {
  'battle-ffx': {
    game: 'ffx',
    bpm: 150,
    key: 'E minor',
    excerptStart: 6.4,
    tags:
      'cinematic orchestral film score, epic battle music, live symphony orchestra, large concert hall, ' +
      'driving string ostinato, french horns, trumpets and trombones, timpani, taiko, orchestral percussion, ' +
      'modern fantasy RPG soundtrack, dramatic, instrumental, no vocals, E minor, 150 bpm, 4/4',
  },
  'boss-ffx2-aeon': {
    game: 'ffx2',
    bpm: 160,
    key: 'Bb minor',
    excerptStart: 12,
    tags:
      'cinematic orchestral film score with modern hybrid pop production, live strings, brass stabs, ' +
      'electric bass, punchy drum kit, electric piano, synth pads, epic boss battle, ' +
      'modern fantasy RPG soundtrack, instrumental, no vocals, Bb minor, 160 bpm, 4/4',
  },
};

const SAMPLER = { steps: 50, cfg: 5, sampler_name: 'euler', scheduler: 'simple', shift: 5.0 };

function arg(name, fallback) {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(p, init) {
  const res = await fetch(`${BASE}${p}`, init);
  if (!res.ok) throw new Error(`ComfyUI ${init?.method || 'GET'} ${p} -> ${res.status}\n${await res.text()}`);
  return res;
}

/**
 * Wait for the server, then for the queue: a shared GPU, never jump a video job.
 * By default the queue must be empty. ACE_MAX_AHEAD=N lets one job join the
 * END of the FIFO once at most N jobs are ahead of it (ComfyUI runs them in
 * order, so nothing running or pending is interrupted); sketch C sets it when
 * another workflow keeps the queue busy with short image jobs.
 */
export async function waitForIdle() {
  const maxAhead = Number(process.env.ACE_MAX_AHEAD ?? 0);
  for (let i = 0; ; i++) {
    try {
      const q = await (await api('/queue')).json();
      const busy = q.queue_running.length + q.queue_pending.length;
      if (busy <= maxAhead) return;
      if (i % 12 === 0) process.stderr.write(`[ace] queue busy (${busy} job(s)); waiting\n`);
    } catch {
      if (i % 12 === 0) process.stderr.write(`[ace] ComfyUI not answering on ${BASE}; waiting\n`);
    }
    await sleep(10_000);
  }
}

async function ffmpeg(args) {
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-nostats', '-y', ...args], { maxBuffer: 64 << 20 });
  return stderr;
}

export async function upload(file) {
  const fd = new FormData();
  fd.append('image', new Blob([await readFile(file)]), path.basename(file));
  fd.append('subfolder', 'pyrefly-ace');
  fd.append('type', 'input');
  fd.append('overwrite', 'true');
  const json = await (await api('/upload/image', { method: 'POST', body: fd })).json();
  return json.subfolder ? `${json.subfolder}/${json.name}` : json.name;
}

/** The API-format graph. `latentFrom` is either { audio } (restyle) or { seconds } (t2m). */
export function buildGraph({ tags, seed, denoise, latentFrom, prefix, lyrics = '[inst]' }) {
  const g = {
    1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    2: {
      class_type: 'TextEncodeAceStepAudio',
      inputs: { clip: ['1', 1], tags, lyrics, lyrics_strength: 1.0 },
    },
    3: { class_type: 'ConditioningZeroOut', inputs: { conditioning: ['2', 0] } },
    4: { class_type: 'ModelSamplingSD3', inputs: { model: ['1', 0], shift: SAMPLER.shift } },
    5: { class_type: 'LatentOperationTonemapReinhard', inputs: { multiplier: 1.0 } },
    6: { class_type: 'LatentApplyOperationCFG', inputs: { model: ['4', 0], operation: ['5', 0] } },
    9: {
      class_type: 'KSampler',
      inputs: {
        model: ['6', 0],
        seed,
        steps: SAMPLER.steps,
        cfg: SAMPLER.cfg,
        sampler_name: SAMPLER.sampler_name,
        scheduler: SAMPLER.scheduler,
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['8', 0],
        denoise,
      },
    },
    10: { class_type: 'VAEDecodeAudio', inputs: { samples: ['9', 0], vae: ['1', 2] } },
    11: { class_type: 'SaveAudio', inputs: { audio: ['10', 0], filename_prefix: prefix } },
  };
  if (latentFrom.audio) {
    g[7] = { class_type: 'LoadAudio', inputs: { audio: latentFrom.audio } };
    g[8] = { class_type: 'VAEEncodeAudio', inputs: { audio: ['7', 0], vae: ['1', 2] } };
  } else {
    g[8] = { class_type: 'EmptyAceStepLatentAudio', inputs: { seconds: latentFrom.seconds, batch_size: 1 } };
  }
  return g;
}

export async function generate(graph) {
  await waitForIdle();
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: graph, client_id: 'pyrefly-ace-step' }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ComfyUI rejected the graph (${res.status}):\n${text}`);
  const id = JSON.parse(text).prompt_id;
  const t0 = Date.now();
  for (;;) {
    const hist = await (await api(`/history/${id}`)).json();
    const entry = hist[id];
    if (entry?.status?.status_str === 'error') throw new Error(`ACE-Step failed: ${JSON.stringify(entry.status.messages)}`);
    const out = entry && Object.values(entry.outputs || {}).flatMap((o) => o.audio || []);
    if (out?.length) {
      const f = out[0];
      const q = new URLSearchParams({ filename: f.filename, subfolder: f.subfolder || '', type: f.type || 'output' });
      const buf = Buffer.from(await (await api(`/view?${q}`)).arrayBuffer());
      return { buf, ext: path.extname(f.filename) || '.flac', seconds: (Date.now() - t0) / 1000 };
    }
    if (Date.now() - t0 > 3 * 3600_000) throw new Error(`timed out on prompt ${id}`);
    await sleep(2000);
  }
}

export async function loudness(file) {
  const err = await ffmpeg(['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const tail = err.slice(err.lastIndexOf('Summary:'));
  const num = (re) => Number((tail.match(re) || [])[1]);
  return { lufs: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/), truePeakDb: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}

/** Trim to `seconds`, gain to -16 LUFS, limit, encode Opus; and the 12 s excerpt. */
async function finish(rawFile, outFile, seconds, excerptStart) {
  const pre = await loudness(rawFile);
  const gain = Number.isFinite(pre.lufs) ? TARGET_LUFS - pre.lufs : 0;
  const chain = `volume=${gain.toFixed(2)}dB,alimiter=limit=0.85:level=false`;
  const common = ['-af', chain, '-ar', '48000', '-c:a', 'libopus', '-b:a', '112k'];
  await ffmpeg(['-i', rawFile, '-t', String(seconds), ...common, outFile]);
  const ex = outFile.replace(/\.ogg$/, '-x12.ogg');
  const fade = `afade=t=in:d=0.05,afade=t=out:st=${EXCERPT_S - 0.6}:d=0.6`;
  await ffmpeg(['-ss', String(excerptStart), '-t', String(EXCERPT_S), '-i', rawFile, '-af', `${chain},${fade}`,
    '-ar', '48000', '-c:a', 'libopus', '-b:a', '112k', ex]);
  return { excerpt: ex, gainDb: Number(gain.toFixed(2)) };
}

async function measure(file, sourceMono, bpm, work) {
  const mono = path.join(work, `${path.basename(file)}.mono.wav`);
  await ffmpeg(['-i', file, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', mono]);
  const argv = [path.join(ROOT, 'tools/audio/ace-measure.py'), '--cand', mono, '--bpm', String(bpm)];
  if (sourceMono) argv.push('--source', sourceMono);
  const { stdout } = await run(PYTHON, argv, { maxBuffer: 16 << 20 });
  return { ...JSON.parse(stdout), ...(await loudness(file)) };
}

async function mergeReport(file, key, entry) {
  const report = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : { generatedBy: 'tools/audio/ace-step.mjs', runs: {} };
  report.runs[key] = entry;
  await writeFile(file, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  const cueName = arg('cue');
  const cue = CUES[cueName];
  if (!cue) throw new Error(`--cue must be one of ${Object.keys(CUES).join(', ')}`);
  const mode = arg('mode', 'restyle');
  const outDir = path.resolve(ROOT, arg('out', 'public/audio/candidates'));
  const reportFile = path.resolve(outDir, arg('report', 'B-report.json'));
  const tag = arg('tag', '');
  const denoise = Number(arg('denoise', '0.45'));
  const seeds = arg('seeds', '101').split(',').map(Number);
  await mkdir(outDir, { recursive: true });
  const work = path.join(tmpdir(), 'pyrefly-ace');
  await mkdir(work, { recursive: true });

  const manifest = JSON.parse(await readFile(path.join(ROOT, 'public/audio/manifest.json'), 'utf8'));
  const shipped = manifest.music[cueName];
  const srcMp3 = path.join(ROOT, 'public/audio', shipped.file);
  const srcWav = path.join(work, `${cueName}-src.wav`);
  const srcMono = path.join(work, `${cueName}-src-mono.wav`);
  await ffmpeg(['-i', srcMp3, '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', srcWav]);
  await ffmpeg(['-i', srcMp3, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', srcMono]);
  const seconds = shipped.duration;

  if (mode === 'source') {
    const out = path.join(outDir, `B-${cueName}-source.ogg`);
    const { excerpt } = await finish(srcWav, out, seconds, cue.excerptStart);
    await rm(out); // the full source already ships; only the excerpt is new
    const m = await measure(excerpt, null, cue.bpm, work);
    await mergeReport(reportFile, `${cueName}:source-x12`, { cue: cueName, mode, excerpt: path.relative(ROOT, excerpt).replaceAll("\\", "/"), excerptMeasure: m, full: await measure(srcMp3, srcMono, cue.bpm, work) });
    return;
  }

  if (mode === 'remeasure') {
    // Re-run the measurements over every run of this cue already in the report
    // (after a change to ace-measure.py), without touching the GPU.
    const report = JSON.parse(await readFile(reportFile, 'utf8'));
    for (const [key, entry] of Object.entries(report.runs)) {
      if (entry.cue !== cueName || !entry.file || !entry.measure) continue;
      const file = path.resolve(ROOT, entry.file);
      if (!existsSync(file)) continue;
      entry.measure = await measure(file, entry.mode === 'restyle' ? srcMono : null, cue.bpm, work);
      process.stderr.write(`[ace] re-measured ${key}: fidelity ${entry.measure.structureFidelity ?? '-'}
`);
    }
    await writeFile(reportFile, `${JSON.stringify(report, null, 2)}
`);
    return;
  }

  const audioName = mode === 'restyle' ? await upload(srcWav) : null;
  for (const seed of seeds) {
    const stem = mode === 'restyle' ? `B-${cueName}-${seed}${tag ? `-${tag}` : ''}` : `B-${cueName}-t2m-${seed}${tag ? `-${tag}` : ''}`;
    const graph = buildGraph({
      tags: cue.tags,
      seed,
      denoise: mode === 'restyle' ? denoise : 1.0,
      latentFrom: mode === 'restyle' ? { audio: audioName } : { seconds },
      prefix: `pyrefly-ace/${stem}`,
    });
    process.stderr.write(`[ace] ${stem}: queueing (${mode}, denoise ${mode === 'restyle' ? denoise : 1})\n`);
    const { buf, ext, seconds: took } = await generate(graph);
    const raw = path.join(work, `${stem}${ext}`);
    await writeFile(raw, buf);
    const out = path.join(outDir, `${stem}.ogg`);
    const { excerpt, gainDb } = await finish(raw, out, seconds, cue.excerptStart);
    const m = await measure(out, mode === 'restyle' ? srcMono : null, cue.bpm, work);
    await mergeReport(reportFile, stem, {
      cue: cueName, game: cue.game, mode, seed, denoise: mode === 'restyle' ? denoise : 1.0,
      tags: cue.tags, lyrics: '[inst]', sampler: SAMPLER, ckpt: CKPT, renderSeconds: Number(took.toFixed(1)),
      file: path.relative(ROOT, out).replaceAll('\\', '/'), excerpt: path.relative(ROOT, excerpt).replaceAll('\\', '/'),
      gainDb, measure: m,
    });
    const { lagWindows, ...brief } = m;
    process.stderr.write(`[ace] ${stem}: ${took.toFixed(0)} s, ${JSON.stringify(brief)}\n`);
  }
}

// Run only as a CLI: sketch C (tools/audio/modern/render-c.mjs) imports the client.
const invoked = process.argv[1] ? path.resolve(process.argv[1]).toLowerCase() : '';
if (invoked === fileURLToPath(import.meta.url).toLowerCase()) main().catch((e) => {
  process.stderr.write(`${e.stack || e}\n`);
  process.exit(1);
});
