#!/usr/bin/env node
/**
 * "Modern sound, round 1" on docs/audio/audition.html: today's cue and sketches
 * A, B and C, same 12 seconds, each brought to -16 LUFS integrated, plus the
 * measurements table for the handoff.
 *
 *   node tools/audio/modern/round1.mjs            (after render-a.mjs and render-c.mjs)
 *
 * Sources (the full renders; nothing is re-rendered here):
 *   current  public/audio/music/<cue>.mp3                     what ships
 *   A        build/audio-candidates/A-<cue>.wav               sketch A's float WAV
 *   B        <tmp>/pyrefly-ace/B-<cue>-<seed>.flac            sketch B's best take, lossless
 *            (falls back to public/audio/candidates/B-<cue>-<seed>.ogg)
 *   C        build/audio-candidates/C-<cue>.wav               sketch C's float WAV
 *
 * Writes public/audio/candidates/C-round1-<cue>-<current|A|B|C>-x12.ogg (Vorbis
 * q6, every file the same codec so the codec is not a variable) and
 * docs/audio/round1-report.json. Agents cannot hear (hard rule 13): this file
 * measures and levels; Bailey listens.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const RATE = 44100;
const { limit } = await import('../master.mjs');
const { measureLufs, measureTruePeak } = await import('../measure.mjs');
const { measureDynamics, toOgg } = await import('./loudness.mjs');
const { decodeStereo, writeWavF32, writeWavS16Mono } = await import('./pcm.mjs');
const { measurePair } = await import('./texture.mjs');

const CUES = { 'battle-ffx': { bpm: 150, start: 19.2 }, 'boss-ffx2-aeon': { bpm: 160, start: 36 } };
const EXCERPT = 12;
const OUT = join(ROOT, 'public/audio/candidates');
const WORK = join(ROOT, 'build/audio-candidates/c-work');
const r2 = (v) => (Number.isFinite(v) ? Number(v.toFixed(2)) : null);

function sources(cue) {
  const bReport = JSON.parse(readFileSync(join(OUT, 'B-report.json'), 'utf8'));
  const bStem = bReport.best[cue].restyle;
  const bFlac = join(tmpdir(), 'pyrefly-ace', `${bStem}.flac`);
  return {
    current: { excerptFrom: join(ROOT, `public/audio/music/${cue}.mp3`), full: `public/audio/music/${cue}.mp3` },
    A: { excerptFrom: join(ROOT, `build/audio-candidates/A-${cue}.wav`), full: `public/audio/candidates/A-${cue}.ogg` },
    B: { excerptFrom: existsSync(bFlac) ? bFlac : join(OUT, `${bStem}.ogg`), full: `public/audio/candidates/${bStem}.ogg`, take: bStem, lossless: existsSync(bFlac) },
    C: { excerptFrom: join(ROOT, `build/audio-candidates/C-${cue}.wav`), full: `public/audio/candidates/C-${cue}.ogg` },
  };
}

function fades(buf, rate, inSec = 0.05, outSec = 0.6) {
  const n = buf.left.length;
  const fi = Math.round(inSec * rate);
  const fo = Math.round(outSec * rate);
  for (let i = 0; i < fi && i < n; i++) { const g = i / fi; buf.left[i] *= g; buf.right[i] *= g; }
  for (let i = 0; i < fo && i < n; i++) { const g = i / fo; buf.left[n - 1 - i] *= g; buf.right[n - 1 - i] *= g; }
}

async function excerpt(cue, which, src, start) {
  const seg = await decodeStereo(src.excerptFrom, { rate: RATE, start, duration: EXCERPT });
  const before = measureLufs(seg.left, seg.right, RATE);
  const gainDb = -16 - before;
  const g = Math.pow(10, gainDb / 20);
  for (let i = 0; i < seg.left.length; i++) { seg.left[i] *= g; seg.right[i] *= g; }
  const tpAfterGain = measureTruePeak(seg.left, seg.right);
  // Level-match first; limit only if the gain would push a peak past -1 dBTP
  // (so no file is clipped on decode). Reported per file.
  const limited = tpAfterGain > -1;
  if (limited) limit(seg, RATE, Math.pow(10, (-1 - 0.4) / 20));
  fades(seg, RATE);
  const wav = join(WORK, `C-round1-${cue}-${which}-x12.wav`);
  writeWavF32(wav, seg.left, seg.right, RATE);
  const file = `C-round1-${cue}-${which}-x12.ogg`;
  await toOgg(wav, join(OUT, file));
  const after = await measureDynamics(join(OUT, file));
  return { file: `public/audio/candidates/${file}`, from: src.excerptFrom.replaceAll('\\', '/').replace(`${ROOT.replaceAll('\\', '/')}/`, ''), startSec: start, lufsBefore: r2(before), gainDb: r2(gainDb), truePeakAfterGainDb: r2(tpAfterGain), limited, delivered: { lufs: after.lufs, truePeakDb: after.truePeakDb } };
}

async function monoOf(file, tag) {
  const d = await decodeStereo(file, { rate: RATE });
  const mono = join(WORK, `round1-${tag}.mono.wav`);
  writeWavS16Mono(mono, d.left, d.right, RATE);
  return mono;
}

async function main() {
  mkdirSync(WORK, { recursive: true });
  const report = { generated: new Date().toISOString(), excerptSeconds: EXCERPT, target: '-16 LUFS integrated per excerpt', cues: [] };
  for (const [cue, cfg] of Object.entries(CUES)) {
    const src = sources(cue);
    const entry = { name: cue, bpm: cfg.bpm, excerptStartSec: cfg.start, bTake: src.B.take, bLossless: src.B.lossless, excerpts: {}, full: {} };
    const curMono = await monoOf(join(ROOT, src.current.full), `${cue}-current`);
    for (const which of ['current', 'A', 'B', 'C']) {
      entry.excerpts[which] = await excerpt(cue, which, src[which], cfg.start);
      const fullPath = join(ROOT, src[which].full);
      const dyn = await measureDynamics(fullPath);
      let drift = null;
      if (which !== 'current') {
        const m = await measurePair(await monoOf(fullPath, `${cue}-${which}`), curMono, cfg.bpm);
        drift = { lagMedianAbsMs: m.lagMedianAbsMs, lagMaxAbsMs: m.lagMaxAbsMs, lagSlopeMsPerMin: m.lagSlopeMsPerMin, windowsCorrelated: m.windowsCorrelated, onsetF: m.onsetF, chromaSim: m.chromaSim, centroidHz: m.centroidHz, currentCentroidHz: m.source?.centroidHz };
      }
      entry.full[which] = { file: src[which].full, ...dyn, onsetVsCurrent: drift };
      console.log(`  ${cue} ${which}: excerpt gain ${entry.excerpts[which].gainDb} dB${entry.excerpts[which].limited ? ' (limited)' : ''}; full LRA ${dyn.lra}, crest ${dyn.crestDb}${drift ? `, lag ${drift.lagMedianAbsMs}/${drift.lagMaxAbsMs} ms` : ''}`);
    }
    report.cues.push(entry);
  }
  writeFileSync(join(ROOT, 'docs/audio/round1-report.json'), JSON.stringify(report, null, 2) + '\n');
}

await main();
