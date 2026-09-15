/**
 * The SFX bank: every cue is synthesised from the DSP kit at startup, so the
 * game ships no audio files and nothing here can be mistaken for retail audio.
 */

import { makeStereo, type Stereo } from '../dsp/buffer.ts';
import { mixStereoInto } from '../dsp/buffer.ts';
import { panGains } from '../dsp/shaper.ts';
import { uiSfx } from './ui.ts';
import { battleSfx } from './battle.ts';
import { magicSfx } from './magic.ts';
import type { SfxDef } from './kit.ts';

export type { SfxDef };

export const SFX: Record<string, SfxDef> = {
  ...uiSfx,
  ...battleSfx,
  ...magicSfx,
};

export function sfxNames(): string[] {
  return Object.keys(SFX);
}

export function hasSfx(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(SFX, name);
}

export function getSfx(name: string): SfxDef {
  const def = SFX[name];
  if (!def) throw new Error(`Unknown sfx "${name}". Known: ${sfxNames().join(', ')}`);
  return def;
}

export function renderSfx(name: string, sampleRate: number): Stereo {
  return getSfx(name).render(sampleRate);
}

export function renderSfxBank(sampleRate: number): Record<string, Stereo> {
  const bank: Record<string, Stereo> = {};
  for (const name of sfxNames()) bank[name] = renderSfx(name, sampleRate);
  return bank;
}

interface MontageCue {
  name: string;
  at: number;
  pan?: number;
  gain?: number;
}

/** The demo reel rendered by `tools/render-track.mjs sfx-demo`. */
export const MONTAGE: MontageCue[] = [
  { name: 'cursor-move', at: 0.0 },
  { name: 'confirm', at: 0.1 },
  { name: 'menu-open', at: 0.28, pan: -0.2 },
  { name: 'sword-slash-1', at: 0.5 },
  { name: 'hit-1', at: 0.68 },
  { name: 'sword-slash-2', at: 0.85 },
  { name: 'critical', at: 1.02 },
  { name: 'fire', at: 1.35, pan: -0.25 },
  { name: 'thunder', at: 1.65, pan: 0.2 },
  { name: 'cure', at: 1.95, pan: -0.15 },
  { name: 'ice', at: 2.15, pan: 0.25 },
  { name: 'overdrive-full', at: 2.35 },
  { name: 'pyrefly', at: 2.55, pan: 0.1 },
];

/** Render the montage into a fixed-length buffer with a short fade at the end. */
export function renderMontage(sampleRate: number, seconds = 3): Stereo {
  const total = Math.ceil(seconds * sampleRate);
  const out = makeStereo(total);
  for (const cue of MONTAGE) {
    const buf = renderSfx(cue.name, sampleRate);
    const g = panGains(cue.pan ?? 0);
    const gain = (cue.gain ?? 0.85) * 1.41;
    mixStereoInto(out, buf, Math.round(cue.at * sampleRate), gain * g.left, gain * g.right);
  }
  const fade = Math.round(0.18 * sampleRate);
  for (let i = 0; i < fade; i++) {
    const k = 1 - (i + 1) / fade;
    const idx = total - fade + i;
    out.left[idx] = out.left[idx]! * k;
    out.right[idx] = out.right[idx]! * k;
  }
  return out;
}
