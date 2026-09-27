#!/usr/bin/env node
/**
 * The FF7 Guard Scorpion music SKETCH, rendered for Bailey's ear (rule 13):
 * the score (tools/audio/scores/2026-09-27/ff7-guard-scorpion.mjs) through the
 * house renderer, then restyled in Direction B exactly as
 * docs/audio/direction-b-2026-09-27.md did the shipped cues.
 *
 *   node tools/audio/modern/render-ff7-sketch.mjs [--no-gpu] [--house-only]
 *     --no-gpu      re-pick and re-finish from the cached takes only
 *     --house-only  stop after the house render (score iteration, no GPU)
 *
 * 1. HOUSE RENDER. The same preset resolver, seating, hall, master chain
 *    (-16 LUFS, -1 dBTP) and file layout as tools/audio/render.mjs: intro, loop
 *    body, 3 s of the loop head after loopEnd. Measured by measureAll (seam,
 *    spectral balance). Kept in WORK as the restyle's input and as a reference.
 * 2. DIRECTION B. tools/audio/ace-step.mjs buildGraph unchanged (ACE-Step v1
 *    3.5B, ComfyUI core nodes, euler / simple, 50 steps, cfg 5, shift 5, Reinhard
 *    1.0, lyrics "[inst]"), restyle of the house render by denoise. The pick rule
 *    is render-b-score.mjs's, written there before any take was measured: seeds
 *    101, 202, 303 at 0.40; among takes whose octave-folded tempo is within 3 %
 *    of the source's reading or the written bpm, the highest structureFidelity
 *    (tools/audio/ace-measure.py); a pick under 0.35 gets seeds 404, 505, 606;
 *    none keeping the tempo -> the same at 0.35; still none -> best 0.35, FLAGGED.
 *    No take is ever chosen by a listening claim.
 * 3. FINISH as render-b-score.mjs: shift by the median lag only with >= 3
 *    correlated windows and |lag| <= 60 ms; fit to the house length; the last
 *    beat before loopEnd crossfades (equal power) into the take just before
 *    loopStart and the run-on is rebuilt from the loop head; gain to -16 LUFS,
 *    the project limiter at -1.4 dBFS, MP3 libmp3lame -q:a 5, re-limited 0.3 dB
 *    lower while the decode overshoots -1.05 dBTP.
 * 4. OUT: public/audio/candidates/ff7-2026-09-27/ff7-guard-scorpion.mp3 +
 *    manifest.json (never shipped: tools/dist-filter.mjs), the 45 s clip and
 *    pack.md in D:/Tools/pyrefly-scratch/ff7-music-0927/, the report
 *    docs/audio/ff7-sketch-2026-09-27.json. Nothing is wired into the game.
 *
 * GPU: shared ComfyUI; each job waits until at most 2 jobs are ahead
 * (ACE_MAX_AHEAD=2, so never 3 pending); ComfyUI is never restarted. A take
 * that decodes silent or non-finite stops the run (the audio "all-black").
 *
 * Game case: FF7 only (the sketch); the pipeline is the shared Direction B one.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.ACE_MAX_AHEAD ??= '2';
const { buildGraph, generate, upload, loudness } = await import('../ace-step.mjs');
const { decodeStereo, writeWavS16, writeWavS16Mono, writeWavF32, shiftEarlier, fitLength } = await import('./pcm.mjs');
const { measurePair, alignmentLagMs } = await import('./texture.mjs');
const { FFMPEG } = await import('./loudness.mjs');
const { limit, masterToTarget } = await import('../master.mjs');
const { measureLufs, measureTruePeak, measureAll } = await import('../measure.mjs');
const { scoreFingerprint, secondsAtSample } = await import('../manifest-io.mjs');
const { renderTrack } = await import('../../../src/audio/render.ts');
const { effectiveJitterMs, performanceKey } = await import('../../../src/audio/score.ts');
const { Hall } = await import('../../../src/audio/dsp/hall.ts');
const presets = await import('../../../src/audio/voices/presets/index.ts');
const { voiceForPreset } = await import('../libs.mjs');
const score = await import('../scores/2026-09-27/ff7-guard-scorpion.mjs');

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const NAME = 'ff7-guard-scorpion';
const OUT = path.join(ROOT, 'public/audio/candidates/ff7-2026-09-27');
const SCRATCH = 'D:/Tools/pyrefly-scratch/ff7-music-0927';
const WORK = path.join(SCRATCH, 'work');
const REPORT = path.join(ROOT, 'docs/audio/ff7-sketch-2026-09-27.json');
const RATE = 44100;
const TARGET_LUFS = -16;
const LOOP_TAIL_SEC = 3;
const CLIP = { start: 0, seconds: 45 };
const SEEDS = [101, 202, 303];
const EXTRA_SEEDS = [404, 505, 606];
const DENOISE = 0.4;
const FALLBACK = 0.35;
const LOW_FIDELITY = 0.35;
const track = score.default;
const BPM = track.bpm;

/**
 * The words: Direction B's style core (b-score-cues.mjs), the instruments this
 * score actually has, its mood, key, bpm and meter. No game, composer or title.
 */
export const TAGS =
  'cinematic orchestral film score, live symphony orchestra, large concert hall, modern fantasy RPG soundtrack, ' +
  'expressive live performance, urgent industrial boss battle, driving synth bass ostinato, low strings, ' +
  'tense minor melody on violins and french horns, trumpets, brass stabs, snare drum, taiko, timpani, ' +
  'metallic industrial percussion, hollow square lead siren, instrumental, no vocals, F minor, 154 bpm, 4/4';
const FORBIDDEN = /final fantasy|\bff\s?7\b|\bvii\b|uematsu|square\s?enix|bombing|those who fight|midgar|mako|shinra|cloud|barret|scorpion/i;

const rel = (f) => path.relative(ROOT, f).replaceAll('\\', '/');
const ff = (args) => run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { maxBuffer: 64 << 20, windowsHide: true });

// --- 1. the house render ------------------------------------------------------------

function houseRender() {
  const cache = new Map();
  const voiceFor = (name, perform) => {
    const key = `${name}${performanceKey(perform)}`;
    if (cache.has(key)) return cache.get(key);
    if (!presets.hasPreset(name)) throw new Error(`Sketch names instrument "${name}", which has no sampled preset.`);
    const preset = presets.getPreset(name);
    const jitter = effectiveJitterMs(preset.timingJitterMs ?? 0, perform);
    const tuned = jitter === (preset.timingJitterMs ?? 0) ? preset : { ...preset, timingJitterMs: jitter };
    const voice = voiceForPreset(tuned, performanceKey(perform));
    cache.set(key, voice);
    return voice;
  };
  const spatialise = (channel) => {
    if (!presets.hasPreset(channel.instrument)) return undefined;
    const seat = presets.seatOf(presets.getPreset(channel.instrument).seat);
    return { pan: Math.max(-1, Math.min(1, seat.pan * 0.78 + (channel.pan ?? 0) * 0.35)), reverb: presets.sendOf(seat) };
  };
  const reverbRender = (bus, rate) =>
    new Hall(rate, { rt60: 2.2, hfDamping: 2.8, preDelay: 0.019, width: 0.95, earlyLevel: 0.55, lowCutHz: 95 }).render(bus);
  const r = renderTrack(track, RATE, {
    voiceFor, spatialise, reverbRender,
    master: (mix, rate) => masterToTarget(mix, rate, { targetLufs: -16, ceilingDbtp: -1 }),
  });
  const ls = r.loopStartSample;
  const le = r.loopEndSample;
  const tail = Math.min(Math.round(LOOP_TAIL_SEC * RATE), le - ls);
  const left = new Float32Array(le + tail);
  const right = new Float32Array(le + tail);
  left.set(r.left.subarray(0, le));
  right.set(r.right.subarray(0, le));
  left.set(r.left.subarray(ls, ls + tail), le);
  right.set(r.right.subarray(ls, ls + tail), le);
  const m = measureAll(left, right, RATE, ls, le);
  return { left, right, ls, le, notes: r.noteCount, measured: m };
}

// --- 2. Direction B takes -------------------------------------------------------------

const fold = (est, bpm) => (est > 0 ? est * 2 ** Math.round(Math.log2(bpm / est)) : 0);
function keepsTempo(m, bpm) {
  const src = fold(m?.source?.tempoEst ?? 0, bpm);
  const cand = fold(m?.tempoEst ?? 0, bpm);
  if (cand <= 0) return false;
  return (src > 0 && Math.abs(cand - src) / src <= 0.03) || Math.abs(cand - bpm) / bpm <= 0.03;
}

async function take(uploaded, srcMono, denoise, seed, noGpu) {
  const stem = `ff7-${NAME}-d${Math.round(denoise * 100)}-s${seed}`;
  const raw = path.join(WORK, 'raw', `${stem}.flac`);
  let gpuSeconds = null;
  if (!existsSync(raw)) {
    if (noGpu) return null;
    const graph = buildGraph({ tags: TAGS, seed, denoise, latentFrom: { audio: uploaded }, prefix: `pyrefly-ace/ff7-sketch/${stem}` });
    process.stderr.write(`[ff7] ${stem}: queueing\n`);
    const r = await generate(graph);
    writeFileSync(raw, r.buf);
    gpuSeconds = Number(r.seconds.toFixed(1));
  }
  const dec = await decodeStereo(raw, { rate: RATE });
  const lufs = measureLufs(dec.left, dec.right, RATE);
  if (!Number.isFinite(lufs) || lufs < -60) {
    throw new Error(`${stem} decodes silent or non-finite (${lufs} LUFS): the GPU state may be bad. Stopped, not retried.`);
  }
  const mono = path.join(WORK, 'mono', `${stem}.wav`);
  if (!existsSync(mono)) await ff(['-i', raw, '-ac', '1', '-ar', String(RATE), '-c:a', 'pcm_s16le', mono]);
  const cache = path.join(WORK, 'measure', `${stem}.json`);
  const m = existsSync(cache) ? JSON.parse(readFileSync(cache, 'utf8')) : await measurePair(mono, srcMono, BPM);
  writeFileSync(cache, JSON.stringify(m));
  const tempoOk = keepsTempo(m, BPM);
  process.stderr.write(`[ff7] ${stem}: fidelity ${m.structureFidelity} tempo ${m.tempoEstFolded} (src ${m.source?.tempoEst}) ${tempoOk ? 'kept' : 'MOVED'}\n`);
  return { stem, raw, seed, denoise, gpuSeconds, tempoOk, measure: m };
}

const pick = (takes) => takes.filter((t) => t && t.tempoOk)
  .sort((a, b) => (b.measure.structureFidelity ?? 0) - (a.measure.structureFidelity ?? 0))[0] ?? null;

async function takes(uploaded, srcMono, noGpu) {
  const tried = [];
  let best = null;
  for (const dn of [DENOISE, FALLBACK]) {
    for (const s of SEEDS) tried.push(await take(uploaded, srcMono, dn, s, noGpu));
    best = pick(tried.filter((t) => t?.denoise === dn));
    if (best && (best.measure.structureFidelity ?? 0) < LOW_FIDELITY) {
      for (const s of EXTRA_SEEDS) tried.push(await take(uploaded, srcMono, dn, s, noGpu));
      best = pick(tried.filter((t) => t?.denoise === dn));
    }
    if (best) break;
  }
  let flagged = null;
  if (!best) {
    const pool = tried.filter((t) => t && t.denoise === FALLBACK)
      .sort((a, b) => (b.measure.structureFidelity ?? 0) - (a.measure.structureFidelity ?? 0));
    best = pool[0] ?? null;
    flagged = `no take kept the tempo within 3 % at ${DENOISE} or ${FALLBACK}; best ${FALLBACK} take used`;
  }
  return { tried: tried.filter(Boolean), best, flagged };
}

// --- 3. finish ------------------------------------------------------------------------------

async function finish(best, { frames, loopStart, loopEnd, outMp3, masterWav }) {
  const d = await decodeStereo(best.raw, { rate: RATE });
  const { lagMs: lagSeen, windows } = alignmentLagMs(best.measure);
  const lagMs = windows >= 3 && Math.abs(lagSeen) <= 60 ? lagSeen : 0;
  const lag = Math.round((lagMs / 1000) * RATE);
  const left = fitLength(shiftEarlier(d.left, lag), frames);
  const right = fitLength(shiftEarlier(d.right, lag), frames);
  const xfadeSec = Math.min(1.0, Math.max(0.3, 60 / BPM));
  const ls = Math.round(loopStart * RATE);
  const le = Math.round(loopEnd * RATE);
  const F = Math.round(xfadeSec * RATE);
  for (let i = 0; i < F; i++) {
    const u = (i + 0.5) / F;
    const a = Math.cos((u * Math.PI) / 2);
    const b = Math.sin((u * Math.PI) / 2);
    left[le - F + i] = left[le - F + i] * a + left[ls - F + i] * b;
    right[le - F + i] = right[le - F + i] * a + right[ls - F + i] * b;
  }
  for (let k = 0; le + k < frames; k++) {
    left[le + k] = left[ls + k];
    right[le + k] = right[ls + k];
  }
  const gainDb = Math.min(18, TARGET_LUFS - measureLufs(left, right, RATE));
  const g = 10 ** (gainDb / 20);
  for (let i = 0; i < frames; i++) { left[i] *= g; right[i] *= g; }
  let ceilingDb = -1.4;
  let tp = 0;
  let lufs = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    limit({ left, right }, RATE, 10 ** (ceilingDb / 20));
    writeWavF32(masterWav, left, right, RATE);
    await ff(['-i', masterWav, '-codec:a', 'libmp3lame', '-q:a', '5', '-ar', String(RATE), '-ac', '2', outMp3]);
    const dec = await decodeStereo(outMp3, { rate: RATE });
    tp = measureTruePeak(dec.left, dec.right);
    lufs = measureLufs(dec.left, dec.right, RATE);
    if (tp <= -1.05) break;
    ceilingDb -= 0.3;
  }
  return { lagMs, lagSeenMs: lagSeen, lagWindows: windows, xfadeSec, gainDb: Number(gainDb.toFixed(2)), ceilingDb: Number(ceilingDb.toFixed(2)), lufs: Number(lufs.toFixed(2)), truePeakDb: Number(tp.toFixed(2)) };
}

/** The 45 s clip from the lossless master, levelled to -16 LUFS like pack-b.mjs. */
async function clip(masterWav, out) {
  const measure = async (file, extra = []) => {
    const { stderr } = await run(FFMPEG, ['-hide_banner', '-nostats', ...extra, '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { maxBuffer: 64 << 20, windowsHide: true });
    const tail = stderr.slice(stderr.lastIndexOf('Summary:'));
    const num = (re) => Number((tail.match(re) || [])[1]);
    return { lufs: num(/I:\s+(-?[\d.]+) LUFS/), tp: num(/Peak:\s+(-?[\d.]+) dBFS/) };
  };
  const cut = ['-ss', String(CLIP.start), '-t', String(CLIP.seconds)];
  let gain = -16 - (await measure(masterWav, cut)).lufs;
  let post;
  for (let pass = 0; pass < 3; pass++) {
    const af = `volume=${gain.toFixed(2)}dB,alimiter=limit=0.84:level=false,afade=t=in:d=0.05,afade=t=out:st=${CLIP.seconds - 1}:d=1`;
    await ff([...cut, '-i', masterWav, '-af', af, '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '192k', out]);
    post = await measure(out);
    if (Math.abs(post.lufs + 16) <= 0.15) break;
    gain += -16 - post.lufs;
  }
  return { file: out, start: CLIP.start, seconds: CLIP.seconds, lufs: post.lufs, truePeakDb: post.tp };
}

// --- main -------------------------------------------------------------------------------------

async function main() {
  const noGpu = process.argv.includes('--no-gpu');
  if (FORBIDDEN.test(TAGS)) throw new Error(`The restyle words name a game, place, person or title: ${TAGS}`);
  for (const d of ['raw', 'mono', 'measure', 'src', 'master']) mkdirSync(path.join(WORK, d), { recursive: true });
  mkdirSync(OUT, { recursive: true });

  const house = houseRender();
  const frames = house.left.length;
  const loopStart = secondsAtSample(house.ls, RATE);
  const loopEnd = secondsAtSample(house.le, RATE);
  const srcWav = path.join(WORK, 'src', `${NAME}.wav`);
  const srcMono = path.join(WORK, 'src', `${NAME}-mono.wav`);
  const houseF32 = path.join(WORK, 'src', `${NAME}-house.wav`);
  writeWavS16(srcWav, house.left, house.right, RATE);
  writeWavS16Mono(srcMono, house.left, house.right, RATE);
  writeWavF32(houseF32, house.left, house.right, RATE);
  const houseMp3 = path.join(SCRATCH, `${NAME}-house-render.mp3`);
  await ff(['-i', houseF32, '-codec:a', 'libmp3lame', '-q:a', '5', '-ar', String(RATE), '-ac', '2', houseMp3]);
  const hm = house.measured;
  process.stderr.write(`[ff7] house render: ${(frames / RATE).toFixed(2)} s, ${house.notes} notes, ${hm.lufs.toFixed(2)} LUFS, ` +
    `${hm.truePeakDb.toFixed(2)} dBTP, seam ${hm.seam.ok ? 'ok' : 'FAIL'}, spectrum ${hm.balance.ok ? 'ok' : 'FAIL'}\n`);

  if (process.argv.includes('--house-only')) return;
  const uploaded = noGpu ? null : await upload(srcWav);
  const t = await takes(uploaded, srcMono, noGpu);
  if (!t.best) throw new Error('no takes rendered');
  const outMp3 = path.join(OUT, `${NAME}.mp3`);
  const masterWav = path.join(WORK, 'master', `${NAME}.wav`);
  const fin = await finish(t.best, { frames, loopStart, loopEnd, outMp3, masterWav });
  const dyn = await loudness(outMp3);
  const manifest = {
    version: 1,
    sampleRate: RATE,
    music: {
      [NAME]: {
        file: `${NAME}.mp3`, loopStart, loopEnd, duration: Number((frames / RATE).toFixed(4)),
        bytes: statSync(outMp3).size, lufs: fin.lufs, truePeakDb: fin.truePeakDb, score: scoreFingerprint(track),
      },
    },
  };
  writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const c = await clip(masterWav, path.join(SCRATCH, `${NAME}-sketch.mp3`));

  const { lagWindows, ...pickMeasure } = t.best.measure;
  const report = {
    generatedBy: 'tools/audio/modern/render-ff7-sketch.mjs',
    game: 'FF7 only (hidden experimental Guard Scorpion encounter); not wired',
    score: 'tools/audio/scores/2026-09-27/ff7-guard-scorpion.mjs',
    bpm: BPM, key: 'F minor (Phrygian flat second)', meter: '4/4', bars: track.length / 4,
    tags: TAGS,
    method: { ckpt: 'ace_step_v1_3.5b.safetensors', seeds: SEEDS, extraSeeds: EXTRA_SEEDS, denoise: DENOISE, fallback: FALLBACK, lyrics: '[inst]', sampler: 'euler/simple, 50 steps, cfg 5, shift 5, Reinhard 1.0' },
    house: {
      file: houseMp3, seconds: Number((frames / RATE).toFixed(3)), notes: house.notes, loopStart, loopEnd,
      lufs: Number(hm.lufs.toFixed(2)), truePeakDb: Number(hm.truePeakDb.toFixed(2)), seamOk: hm.seam.ok,
      spectrumOk: hm.balance.ok, tilt: Number((hm.balance.tilt ?? 0).toFixed(2)),
    },
    pick: t.best.stem, flagged: t.flagged, pickMeasure,
    finish: fin, lra: dyn.lra,
    candidate: { file: rel(outMp3), manifest: rel(path.join(OUT, 'manifest.json')), ...manifest.music[NAME] },
    clip: c,
    takes: t.tried.map((x) => { const { lagWindows: _, ...m } = x.measure; return { stem: x.stem, seed: x.seed, denoise: x.denoise, gpuSeconds: x.gpuSeconds, tempoKept: x.tempoOk, measure: m }; }),
  };
  writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  process.stderr.write(`[ff7] pick ${t.best.stem} -> ${rel(outMp3)} ${fin.lufs} LUFS ${fin.truePeakDb} dBTP${t.flagged ? ' FLAGGED' : ''}; clip ${c.lufs} LUFS\n`);
}

main().catch((e) => {
  process.stderr.write(`${e.stack || e}\n`);
  process.exit(1);
});
