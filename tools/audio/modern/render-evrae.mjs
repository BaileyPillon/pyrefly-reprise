#!/usr/bin/env node
/**
 * Chapter VIII's two cues through the modern renderer (sketch A of
 * docs/plans/music-modern-sound.md), in a RECORDED-STYLE hall: the Voxengo
 * "Musikvereinsaal" impulse response instead of sketch A's synthesised one.
 *
 *   node tools/audio/modern/render-evrae.mjs [--only=boss-evrae] [--ir=Musikvereinsaal]
 *
 * GAME CASE (AGENTS.md rule 14): FFX only — `scene-fahrenheit` and
 * `boss-evrae` are Evrae on the Fahrenheit (research/ffx-evrae-airship.md).
 *
 * CPU only: sfizz + VSCO 2 CE / VCSL + the shipped SF2 voices, convolution in
 * Node. Nothing here touches ComfyUI. The IRs were downloaded with Bailey's
 * yes (docs/handoff/NOW.md, 2026-09-22 21:45, item 5) into
 * D:/Tools/audio-libs/ir/voxengo; their licence (license.txt there) allows
 * royalty-free use for any purpose. Only music convolved with them is
 * published, never the IR files themselves.
 *
 * Writes audition candidates only — `public/audio/candidates/modern-<cue>.mp3`
 * (MP3, so a phone plays it) and `docs/audio/evrae-modern-report.json`. The
 * shipped cue (`public/audio/music/<cue>.mp3`, the manifest) is not touched.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');

const { renderCue, encodeWavF32 } = await import('./render-a.mjs');
const { readWav, sfizzAvailable, SFIZZ } = await import('./sfizz.mjs');
const { matchEnergy, hallEnergy, estimateRt60 } = await import('./hall-ir.mjs');
const { measureDynamics, FFMPEG } = await import('./loudness.mjs');
const { Hall } = await import('../../../src/audio/dsp/hall.ts');

const flags = new Map(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.slice(2).split('=');
      return [k, v ?? 'true'];
    }),
);
const RATE = 44100;
const CUES = (flags.get('only') ?? 'scene-fahrenheit,boss-evrae').split(',').map((s) => s.trim()).filter(Boolean);
const IR_NAME = flags.get('ir') ?? 'Musikvereinsaal';
const IR_PATH = `D:/Tools/audio-libs/ir/voxengo/${IR_NAME}.wav`;
const OUT = join(ROOT, 'public/audio/candidates');
const WAVS = join(ROOT, 'build/audio-candidates');
/** render.mjs hallFor(): the energy the IR is matched to, so the dry/wet balance is the shipped one. */
const SHIPPED_HALL = { rt60: 2.2, hfDamping: 2.8, preDelay: 0.019, width: 0.95, earlyLevel: 0.55, lowCutHz: 95 };

/**
 * The IR as a reverb SEND: the file's direct-sound spike is removed (the dry
 * path already carries the direct sound; leaving it in would add a second dry
 * copy at send level) and the room from the first reflection on is kept, then
 * energy-matched to the shipped FDN hall.
 */
function loadIr() {
  const wav = readWav(IR_PATH);
  if (wav.rate !== RATE) throw new Error(`${IR_PATH}: ${wav.rate} Hz, expected ${RATE}`);
  let peak = 0;
  let at = 0;
  for (let i = 0; i < Math.min(wav.left.length, RATE / 10); i++) {
    const a = Math.max(Math.abs(wav.left[i]), Math.abs(wav.right[i]));
    if (a > peak) {
      peak = a;
      at = i;
    }
  }
  const cut = at + Math.round(0.0015 * RATE);
  const fade = Math.round(0.002 * RATE);
  const ir = [wav.left, wav.right].map((ch) => {
    const out = Float32Array.from(ch);
    for (let i = 0; i < out.length; i++) {
      if (i < cut) out[i] = 0;
      else if (i < cut + fade) out[i] *= (i - cut) / fade;
    }
    return out;
  });
  const scale = matchEnergy(ir, hallEnergy(Hall, RATE, SHIPPED_HALL));
  return { ir, directAtMs: (at / RATE) * 1000, cutAtMs: (cut / RATE) * 1000, scale, clipped: wav.clipped };
}

async function toMp3(wav, mp3) {
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '4', '-ar', String(RATE), '-ac', '2', mp3]);
}

async function main() {
  if (!sfizzAvailable()) throw new Error(`sfizz not found at ${SFIZZ}`);
  if (!existsSync(IR_PATH)) throw new Error(`IR not found: ${IR_PATH}`);
  mkdirSync(OUT, { recursive: true });
  mkdirSync(WAVS, { recursive: true });
  const { ir, directAtMs, cutAtMs, scale, clipped } = loadIr();
  const report = {
    renderer: 'modern (sketch A): sfizz + VSCO 2 CE / VCSL + shipped SF2 band voices, performance model, wide master',
    game: 'ffx',
    rendered: new Date().toISOString(),
    hall: {
      kind: 'Voxengo impulse response (Impulse Modeler)',
      file: IR_PATH,
      licence: 'Voxengo IR licence: royalty-free use for any purpose; the IR files are not redistributed',
      directSoundAtMs: Number(directAtMs.toFixed(2)),
      removedBeforeMs: Number(cutAtMs.toFixed(2)),
      rt60EstimateSec: Number(estimateRt60(ir, RATE).toFixed(2)),
      energyScaleToShippedHall: Number(scale.toFixed(4)),
      sourceClippedSamples: clipped,
    },
    cues: [],
  };
  for (const name of CUES) {
    console.log(`  rendering ${name} (modern, ${IR_NAME}) ...`);
    const cue = await renderCue(name, ir);
    const wav = join(WAVS, `modern-${name}.wav`);
    writeFileSync(wav, encodeWavF32(cue.left, cue.right, RATE));
    const mp3 = join(OUT, `modern-${name}.mp3`);
    await toMp3(wav, mp3);
    const shipped = join(ROOT, 'public/audio/music', `${name}.mp3`);
    const m = cue.measured;
    const entry = {
      name,
      file: `public/audio/candidates/modern-${name}.mp3`,
      renderSec: Number(cue.renderSec.toFixed(1)),
      seconds: Number((cue.left.length / RATE).toFixed(2)),
      loop: { startSec: cue.loopStart / RATE, endSec: cue.loopEnd / RATE },
      gates: { lufs: m.lufs, truePeakDb: m.truePeakDb, seamOk: m.seam.ok, spectrumOk: m.balance.ok, spectrumProblems: m.balance.problems },
      dynamics: { modernMp3: await measureDynamics(mp3), shippedMp3: existsSync(shipped) ? await measureDynamics(shipped) : null },
      stats: cue.stats,
    };
    report.cues.push(entry);
    console.log(
      `    ${name}: ${entry.renderSec} s, ${m.lufs.toFixed(1)} LUFS, ${m.truePeakDb.toFixed(2)} dBTP, ` +
        `seam ${m.seam.ok ? 'ok' : 'FAIL'}, spectrum ${m.balance.ok ? 'ok' : 'FAIL'}; ` +
        `LRA ${entry.dynamics.shippedMp3?.lra} -> ${entry.dynamics.modernMp3.lra}`,
    );
    rmSync(wav, { force: true });
  }
  writeFileSync(join(ROOT, 'docs/audio/evrae-modern-report.json'), JSON.stringify(report, null, 2) + '\n');
}

await main();
