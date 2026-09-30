#!/usr/bin/env node
/**
 * N1 "newer model" sketch for the music-quality track (music-model-test, 2026-09-30; Bailey:
 * "yes, all your recommendations", which included testing a newer AI music model before
 * deciding O2/O3). ACE-Step 1.5 turbo, from the OFFICIAL ACE-Step/Ace-Step1.5 files (MIT), through
 * ComfyUI 0.35's core nodes. Nothing ships; the output is an audition sketch.
 *
 *   node tools/audio/quality-n1-ace15.mjs --cue=boss-seymour --in=<45 s render wav> --out=<dir>
 *        [--seed=101] [--denoise=0.6] [--cover=1] [--steps=8] [--stem=name]
 *
 * The graph (every input name read from the live /object_info on 2026-09-30):
 *   UNETLoader(acestep_v1.5_turbo) -> ModelSamplingAuraFlow(shift 3) -> KSampler(euler/simple, 8 steps,
 *   cfg 1, as ComfyUI's own ACE 1.5 template) ; DualCLIPLoader(Qwen3-Embedding-0.6B, 5Hz-lm-1.7B, ace)
 *   -> TextEncodeAceStepAudio1.5(tags, "[Instrumental]", bpm, 45 s, 4/4, key, NO LM audio codes)
 *   -> [ReferenceTimbreAudio(latent of our render) when --cover=1: the model tokenises OUR render
 *   into its 5 Hz structure hints, so the melody, harmony and timing come from our score]
 *   ; latent_image = VAEEncodeAudio(our render), denoised from --denoise. Negative = zeroed text.
 * Conditioning is only ever our own sampled render and our own words; never any retail audio.
 * The per-cue words, key and tempo are Direction B's (docs/audio/direction-b-2026-09-27.json), so the
 * only change against the shipped take is the model. Agents cannot hear (rule 13): outputs are
 * measured with quality-measure.py / quality-codec-pair.py / ace-measure.py, never judged by ear.
 * Game case: BOTH (one pipeline; the words are per game: FFX orchestra + organ, FFX-2 hybrid pop).
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, upload } from './ace-step.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (n, d) => process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;

// ComfyUI on Windows lists files in model subfolders with a backslash, and validates names against that list.
const SUB = ['pyrefly-ace15', ''].join(String.fromCharCode(92));
export const FILES = {
  unet: `${SUB}acestep_v1.5_turbo_official.safetensors`,
  te1: `${SUB}qwen3_embedding_0.6b_official_rekeyed.safetensors`,
  te2: `${SUB}acestep_5hz_lm_1.7b_official_rekeyed.safetensors`,
  vae: `${SUB}ace15_vae_official_rekeyed.safetensors`,
};

export function buildGraph({ tags, bpm, key, seconds, seed, denoise, cover, steps, audio, prefix }) {
  const g = {
    1: { class_type: 'UNETLoader', inputs: { unet_name: FILES.unet, weight_dtype: 'default' } },
    2: { class_type: 'DualCLIPLoader', inputs: { clip_name1: FILES.te1, clip_name2: FILES.te2, type: 'ace' } },
    3: { class_type: 'VAELoader', inputs: { vae_name: FILES.vae } },
    4: { class_type: 'ModelSamplingAuraFlow', inputs: { model: ['1', 0], shift: 3 } },
    5: {
      class_type: 'TextEncodeAceStepAudio1.5',
      inputs: {
        clip: ['2', 0], tags, lyrics: '[Instrumental]', seed, bpm, duration: seconds, timesignature: '4',
        language: 'en', keyscale: key, generate_audio_codes: false, cfg_scale: 2.0, temperature: 0.85,
        top_p: 0.9, top_k: 0, min_p: 0,
      },
    },
    7: { class_type: 'LoadAudio', inputs: { audio } },
    8: { class_type: 'VAEEncodeAudio', inputs: { audio: ['7', 0], vae: ['3', 0] } },
    9: { class_type: 'ConditioningZeroOut', inputs: { conditioning: ['5', 0] } },
    11: {
      class_type: 'KSampler',
      inputs: {
        model: ['4', 0], seed, steps, cfg: 1, sampler_name: 'euler', scheduler: 'simple',
        positive: cover ? ['6', 0] : ['5', 0], negative: ['9', 0], latent_image: ['8', 0], denoise,
      },
    },
    12: { class_type: 'VAEDecodeAudio', inputs: { samples: ['11', 0], vae: ['3', 0] } },
    13: { class_type: 'SaveAudio', inputs: { audio: ['12', 0], filename_prefix: prefix } },
  };
  if (cover) g[6] = { class_type: 'ReferenceTimbreAudio', inputs: { conditioning: ['5', 0], latent: ['8', 0] } };
  return g;
}

async function main() {
  const cue = arg('cue');
  const input = arg('in');
  const outDir = arg('out');
  if (!cue || !input || !outDir) throw new Error('--cue, --in and --out are required');
  const report = JSON.parse(await readFile(path.join(ROOT, 'docs/audio/direction-b-2026-09-27.json'), 'utf8'));
  const c = report.cues[cue];
  if (!c) throw new Error(`${cue}: not in direction-b-2026-09-27.json`);
  const seed = Number(arg('seed', '101'));
  const denoise = Number(arg('denoise', '0.6'));
  const cover = arg('cover', '1') === '1';
  const steps = Number(arg('steps', '8'));
  const stem = arg('stem', `${cue}-n1-${cover ? 'cover' : 'plain'}-d${Math.round(denoise * 100)}-s${seed}`);
  await mkdir(outDir, { recursive: true });
  const audio = await upload(input);
  const graph = buildGraph({
    tags: c.tags, bpm: c.bpm, key: c.key, seconds: 45, seed, denoise, cover, steps, audio,
    prefix: `pyrefly-ace15/${stem}`,
  });
  const { buf, ext, seconds } = await generate(graph);
  const file = path.join(outDir, `${stem}${ext}`);
  await writeFile(file, buf);
  process.stdout.write(`${JSON.stringify({ cue, stem, file, seed, denoise, cover, steps, gpuSeconds: Math.round(seconds) })}\n`);
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]).toLowerCase() : '';
if (invoked === fileURLToPath(import.meta.url).toLowerCase()) await main();
