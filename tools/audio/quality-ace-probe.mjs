#!/usr/bin/env node
/**
 * ACE-Step probes for the music-quality track (fb-0929, Bailey's friend: "Music quality sounds
 * kinda bad"). Agents cannot hear (AGENTS.md rule 13): every output is measured by
 * tools/audio/quality-measure.py, never judged by ear.
 *
 *   node tools/audio/quality-ace-probe.mjs --in=<wav> --out=<dir> --stem=<name> --mode=roundtrip
 *   node tools/audio/quality-ace-probe.mjs --in=<wav> --out=<dir> --stem=<name> --mode=restyle \
 *        --tags="..." --denoise=0.40 --seed=202 [--steps=50] [--cfg=5]
 *
 *   roundtrip  LoadAudio -> VAEEncodeAudio -> VAEDecodeAudio, no sampling at all: what ACE-Step's
 *              audio codec alone does to a clean input (the floor of any setting of the model)
 *   restyle    the Direction B graph (tools/audio/ace-step.mjs buildGraph: ace_step_v1_3.5b,
 *              euler / simple, cfg 5, shift 5, Reinhard tonemap), with tags, denoise, seed, steps
 *              and cfg as given
 *
 * The raw FLAC from ComfyUI is written to <out>/<stem>.flac. Shares ComfyUI's queue politely
 * (ace-step.mjs waitForIdle). Game case: BOTH (shared audio plumbing; the tags are per game).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { buildGraph, generate, upload } from './ace-step.mjs';

function arg(name, fallback) {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const input = arg('in');
const outDir = arg('out');
const stem = arg('stem');
const mode = arg('mode', 'restyle');
if (!input || !outDir || !stem) throw new Error('--in, --out and --stem are required');

await mkdir(outDir, { recursive: true });
const audio = await upload(input);
let graph;
if (mode === 'roundtrip') {
  graph = {
    1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'ace_step_v1_3.5b.safetensors' } },
    7: { class_type: 'LoadAudio', inputs: { audio } },
    8: { class_type: 'VAEEncodeAudio', inputs: { audio: ['7', 0], vae: ['1', 2] } },
    10: { class_type: 'VAEDecodeAudio', inputs: { samples: ['8', 0], vae: ['1', 2] } },
    11: { class_type: 'SaveAudio', inputs: { audio: ['10', 0], filename_prefix: `pyrefly-ace/fb0929-${stem}` } },
  };
} else {
  graph = buildGraph({
    tags: arg('tags'),
    seed: Number(arg('seed', '202')),
    denoise: Number(arg('denoise', '0.40')),
    latentFrom: { audio },
    prefix: `pyrefly-ace/fb0929-${stem}`,
  });
  graph[9].inputs.steps = Number(arg('steps', String(graph[9].inputs.steps)));
  graph[9].inputs.cfg = Number(arg('cfg', String(graph[9].inputs.cfg)));
}
const { buf, ext, seconds } = await generate(graph);
const file = path.join(outDir, `${stem}${ext}`);
await writeFile(file, buf);
process.stdout.write(`${JSON.stringify({ stem, mode, file, gpuSeconds: Math.round(seconds) })}\n`);
