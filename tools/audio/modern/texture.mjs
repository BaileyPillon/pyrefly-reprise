/**
 * Sketch C texture layers (docs/plans/music-modern-sound.md option C): ACE-Step,
 * through B's client (tools/audio/ace-step.mjs), restyles a STEM of sketch A's
 * own render into a choir pad or a low string bed; the result is aligned to A
 * by onset correlation, band-limited, loop-repaired and mixed under A.
 *
 * Game-aware (hard rule 14): the method is BOTH. Only the words differ, from
 * THEMES.md "Harmonic language, by world": FFX = orchestra and choir in Spira's
 * natural minor; FFX-2 = the same beds under a pop production (electric bass,
 * kit, electric piano). Neither cue's THEMES entry names a choir: the pad is a
 * test of the method for the cues that do (yu-yevon, yunalesca, vegnagun, the
 * endings), not an arrangement change, and nothing here ships.
 *
 * Agents cannot hear (hard rule 13): every choice below is made by measurement
 * (tools/audio/ace-measure.py against the stem it came from).
 */

import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { buildGraph, generate, upload } from '../ace-step.mjs';
import { decodeStereo, fitLength, shiftEarlier } from './pcm.mjs';

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const PYTHON = process.env.ACE_PYTHON || 'D:/Tools/ComfyUI/python_embeded/python.exe';

/** Wordless vowels so the choir sings no text (THEMES.md bans chanted text on Seymour's cues). */
const VOWELS = '[chorus]\naah aah aah aah\nooh ooh ooh ooh';

/**
 * The choir's words are swept too (after the denoise pick): short repeated
 * syllables may make the model re-articulate like a rhythm part, which a pad
 * should not do. Pick rule (pre-registered): among the variants that still
 * qualify, the one with the FEWEST onsets per second (the most sustained).
 */
export const CHOIR_LYRICS = {
  vowels: VOWELS,
  long: '[chorus]\naaaaaaaaah\nooooooooh',
  inst: '[inst]',
};
export const LYRICS_RULE =
  'among the lyric variants that still qualify at the chosen denoise, the fewest onsets per second ' +
  '(the most sustained); if none qualifies, the default (vowels)';

/**
 * Per cue: which of A's channels feed each layer (by score instrument), the
 * ACE-Step words, the band the layer is allowed to occupy, and its level
 * under A (dB relative to A's integrated loudness; the brief says -9 to -12).
 */
export const TEXTURES = {
  'battle-ffx': {
    game: 'ffx',
    bpm: 150,
    layers: {
      choir: {
        input: ['strings', 'brass', 'strings-low'],
        tags: 'wordless mixed choir, sustained aah and ooh vowels, choral pad, slow swells, legato, large cathedral hall, ' +
          'orchestral film score, fantasy RPG, no drums, no percussion, E minor, 150 bpm',
        lyrics: VOWELS,
        bandHz: [180, 7000],
        relDb: -10,
      },
      low: {
        input: ['strings-low', 'bass', 'bass-sub'],
        tags: 'sustained cellos and double basses, legato low strings, bowed, dark orchestral string bed, large concert hall, ' +
          'orchestral film score, no drums, no percussion, E minor, 150 bpm',
        lyrics: '[inst]',
        bandHz: [32, 320],
        relDb: -12,
      },
    },
  },
  'boss-ffx2-aeon': {
    game: 'ffx2',
    bpm: 160,
    layers: {
      choir: {
        input: ['brass', 'strings', 'epiano'],
        tags: 'airy wordless choir pad, sustained aah and ooh vowels, lush vocal pad, modern pop production, ' +
          'cinematic hybrid score, no drums, no percussion, Bb minor, 160 bpm',
        lyrics: VOWELS,
        bandHz: [180, 7000],
        relDb: -10,
      },
      low: {
        input: ['strings', 'bass'],
        tags: 'sustained cellos and double basses, legato low strings, bowed, dark string bed under electric bass, ' +
          'cinematic hybrid score, no drums, no percussion, Bb minor, 160 bpm',
        lyrics: '[inst]',
        bandHz: [32, 320],
        relDb: -12,
      },
    },
  },
};

/** The pre-registered pick rule for the restyle strength (written before the sweep ran). */
export const SWEEP = [0.35, 0.45, 0.55];
export const RULE =
  'highest denoise in {0.35, 0.45, 0.55} whose output keeps the stem harmony (chroma gain over the same-key ' +
  'baseline >= 0.30, the low end of sketch B\'s committed 0.40 takes) AND correlates with the stem onsets in at ' +
  'least half the 4-bar windows; if none qualifies, 0.35';

export function chromaGain(m) {
  if (m?.chromaSim == null || m?.chromaBaselineTwoBarsApart == null) return null;
  return (m.chromaSim - m.chromaBaselineTwoBarsApart) / Math.max(1e-6, 1 - m.chromaBaselineTwoBarsApart);
}

function windowsShare(m) {
  const [a, b] = String(m?.windowsCorrelated ?? '0/1').split('/').map(Number);
  return b ? a / b : 0;
}

export function qualifies(m) {
  const g = chromaGain(m);
  return g !== null && g >= 0.3 && windowsShare(m) >= 0.5;
}

export function pickDenoise(results) {
  const ok = results.filter((r) => qualifies(r.measure)).map((r) => r.denoise);
  return ok.length ? Math.max(...ok) : Math.min(...results.map((r) => r.denoise));
}

/** ace-measure.py, candidate against a source (both 44.1 kHz mono s16 WAV). */
export async function measurePair(candMono, srcMono, bpm) {
  const argv = [join(ROOT, 'tools/audio/ace-measure.py'), '--cand', candMono, '--bpm', String(bpm)];
  if (srcMono) argv.push('--source', srcMono);
  const { stdout } = await run(PYTHON, argv, { maxBuffer: 16 << 20, windowsHide: true });
  return JSON.parse(stdout);
}

/**
 * The alignment: median lag (ms) of the windows that correlate (>= 0.2).
 * Positive = the generated layer is late against the stem. 0 when nothing
 * correlates (then the layer is left where the model put it).
 */
export function alignmentLagMs(m) {
  const good = (m?.lagWindows ?? []).filter((w) => w.corr >= 0.2).map((w) => w.lagMs).sort((a, b) => a - b);
  if (!good.length) return { lagMs: 0, windows: 0 };
  return { lagMs: good[Math.floor(good.length / 2)], windows: good.length };
}

/** One ACE-Step render of an uploaded stem. Returns the raw file and the GPU time. */
export async function renderTexture({ cue, layerName, layer, uploaded, denoise, seed, workDir, variant = null, lyrics = null }) {
  const stem = `C-${cue}-${layerName}${variant ? `-${variant}` : ''}-d${Math.round(denoise * 100)}-s${seed}`;
  const graph = buildGraph({
    tags: layer.tags,
    lyrics: lyrics ?? layer.lyrics,
    seed,
    denoise,
    latentFrom: { audio: uploaded },
    prefix: `pyrefly-ace/${stem}`,
  });
  process.stderr.write(`[C] ${stem}: queueing\n`);
  const { buf, ext, seconds } = await generate(graph);
  const raw = join(workDir, `${stem}${ext}`);
  writeFileSync(raw, buf);
  return { stem, raw, gpuSeconds: Number(seconds.toFixed(1)) };
}

export { upload };

/**
 * Decode, band-limit, align, fit to A's length, and repair the loop so the
 * layer wraps at loopEnd -> loopStart the way A does:
 *   - the last `xfadeSec` before loopEnd crossfade (equal power) into the
 *     layer's own audio just before loopStart, so the wrap lands on the same
 *     sample the loop restarts from;
 *   - the run-on after loopEnd is rebuilt as a copy of the loop head, which is
 *     what A's file layout has there.
 */
export async function prepareLayer({ raw, bandHz, lagMs, length, loopStart, loopEnd, rate, xfadeSec = 0.3 }) {
  const filter = `highpass=f=${bandHz[0]}:poles=2,highpass=f=${bandHz[0]}:poles=2,lowpass=f=${bandHz[1]}:poles=2,lowpass=f=${bandHz[1]}:poles=2`;
  const d = await decodeStereo(raw, { rate, filter });
  const lag = Math.round((lagMs / 1000) * rate);
  let left = fitLength(shiftEarlier(d.left, lag), length);
  let right = fitLength(shiftEarlier(d.right, lag), length);
  const F = Math.round(xfadeSec * rate);
  if (loopStart >= F && loopEnd > F) {
    for (let i = 0; i < F; i++) {
      const t = (i + 0.5) / F;
      const a = Math.cos((t * Math.PI) / 2);
      const b = Math.sin((t * Math.PI) / 2);
      const at = loopEnd - F + i;
      const from = loopStart - F + i;
      left[at] = left[at] * a + left[from] * b;
      right[at] = right[at] * a + right[from] * b;
    }
    for (let k = 0; loopEnd + k < length; k++) {
      left[loopEnd + k] = left[loopStart + k];
      right[loopEnd + k] = right[loopStart + k];
    }
  }
  return { left, right };
}
