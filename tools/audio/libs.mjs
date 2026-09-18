/**
 * Where the sample libraries live, and how a preset becomes a voice.
 *
 * The libraries are big (Salamander alone is 1.2 GB) and they are NOT in the
 * repo — see docs/audio/CREDITS.md for what to download and from where.
 * Nothing under D:/Tools/audio-libs ever ships; only the rendered MP3s do.
 *
 * Fonts load lazily and stay cached for the life of the process, so rendering
 * all 21 cues reads each library once.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { loadSoundFont, findPreset, regionsOf } from './sf2.mjs';
import { makeSampledVoice } from './sampler.mjs';

export const LIB_ROOT = process.env.PYREFLY_AUDIO_LIBS ?? 'D:/Tools/audio-libs';

/**
 * Each library, with every filename it is known to unpack as. Upstream renames
 * these between releases, so we look for any of them rather than pinning one.
 */
export const LIBRARIES = {
  salamander: {
    title: 'Salamander Grand Piano V3',
    licence: 'CC-BY 3.0',
    attribution: 'Alexander Holm',
    source: 'https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html',
    dir: 'salamander',
    files: ['SalamanderGrandPiano-V3+20200602.sf2', 'SalamanderGrandPiano.sf2'],
  },
  sonatina: {
    title: 'Sonatina Symphonic Orchestra (SF2 conversion)',
    licence: 'CC Sampling Plus 1.0',
    attribution: 'Mattias Westlund; SF2 conversion by "Symphony2"',
    source: 'https://ftp.osuosl.org/pub/musescore/soundfont/',
    dir: 'sonatina',
    files: ['Sonatina_Symphonic_Orchestra.sf2'],
  },
  fluidr3: {
    title: 'FluidR3 GM/GM2',
    licence: 'MIT',
    attribution: 'Frank Wen',
    source: 'https://ftp.osuosl.org/pub/musescore/soundfont/fluid-soundfont.tar.gz',
    dir: 'fluidr3',
    files: ['FluidR3 GM2-2.SF2', 'FluidR3_GM.sf2', 'FluidR3 GM.sf2'],
  },
};

const fontCache = new Map();
const regionCache = new Map();

export function libPath(lib) {
  const spec = LIBRARIES[lib];
  if (!spec) throw new Error(`Unknown sample library "${lib}"`);
  for (const file of spec.files) {
    const full = join(LIB_ROOT, spec.dir, file);
    if (existsSync(full)) return full;
  }
  return null;
}

/** Which libraries are actually present on this machine. */
export function availableLibs() {
  return Object.keys(LIBRARIES).filter((lib) => libPath(lib) !== null);
}

export function missingLibs() {
  return Object.keys(LIBRARIES).filter((lib) => libPath(lib) === null);
}

export function loadLib(lib) {
  const cached = fontCache.get(lib);
  if (cached) return cached;
  const path = libPath(lib);
  if (!path) {
    throw new Error(
      `Sample library "${lib}" not found under ${LIB_ROOT}. ` +
        `Expected one of: ${LIBRARIES[lib].files.join(', ')}. See docs/audio/CREDITS.md.`,
    );
  }
  const font = loadSoundFont(path);
  fontCache.set(lib, font);
  return font;
}

/** Resolve one preset layer to `{ source, font, regions, index }`. */
function resolveLayer(source, index) {
  const font = loadLib(source.lib);
  const key = `${source.lib}|${source.bank ?? ''}|${source.program ?? ''}|${source.name ?? ''}`;
  let regions = regionCache.get(key);
  if (!regions) {
    const sfPreset = findPreset(font, {
      bank: source.bank,
      program: source.program,
      name: source.name,
    });
    if (!sfPreset) {
      throw new Error(
        `No preset in "${source.lib}" for ${JSON.stringify({
          bank: source.bank,
          program: source.program,
          name: source.name,
        })}`,
      );
    }
    regions = regionsOf(font, sfPreset);
    if (regions.length === 0) {
      throw new Error(`Preset "${sfPreset.name}" in "${source.lib}" has no playable regions`);
    }
    regionCache.set(key, regions);
  }
  return { source, font, regions, index };
}

const voiceCache = new Map();

/**
 * Build the sampled `Voice` for one preset. Cached: rendering 21 cues asks
 * for `strings` a few hundred times and each build walks the whole region list.
 */
export function voiceForPreset(preset) {
  const cached = voiceCache.get(preset.name);
  if (cached) return cached;
  const layers = preset.layers.map((source, index) => resolveLayer(source, index));
  const voice = makeSampledVoice({ preset, layers });
  voiceCache.set(preset.name, voice);
  return voice;
}

/** Drop every cached font and voice — used between big renders to free RAM. */
export function releaseLibs() {
  fontCache.clear();
  regionCache.clear();
  voiceCache.clear();
}
