/**
 * The SFX bank.
 *
 * Every cue is a **design** — a list of layered materials in B minor (see
 * `./design.ts` and `./materials.ts`) — and a design renders two ways:
 *
 *   - offline, with the sampled instruments, into `public/audio/sfx/sprite.mp3`,
 *     which is what a player actually hears;
 *   - in the browser, with the synthesised voices, as the safety net for the
 *     moment before the sprite has decoded and for any browser that will not
 *     decode it.
 *
 * Both paths run the same arrangement through the same rules, so a cue cannot
 * drift between them: what changes is the timbre of each layer, which is the
 * one thing the pre-render exists to improve.
 *
 * The game still ships no third-party audio. The sprite is rendered from this
 * source with free-licensed sample libraries that never leave the build
 * machine — see `docs/audio/CREDITS.md`.
 */

import { makeStereo, type Stereo } from '../dsp/buffer.ts';
import { mixStereoInto } from '../dsp/buffer.ts';
import { panGains } from '../dsp/shaper.ts';
import { uiSfx } from './ui.ts';
import { battleSfx } from './battle.ts';
import { magicSfx } from './magic.ts';
import { weaponSfx } from './weapons.ts';
import { enemySfx } from './enemy.ts';
import { flowSfx } from './flow.ts';
import { spellSfx } from './spells.ts';
import { supportSfx } from './support.ts';
import { storySfx } from './story.ts';
import { renderDesign, synthNoteRenderer, type NoteRenderer, type SfxDesign } from './design.ts';
import type { SfxDef } from './kit.ts';
import { SFX_ALIASES } from './aliases.ts';

export type { SfxDef };
export type { SfxDesign, NoteRenderer };
export { SFX_ALIASES };
export { renderDesign, synthNoteRenderer };

/** Every file's designs, in registration order. A name must appear in exactly one file. */
export const SFX_DESIGN_GROUPS: Record<string, Record<string, SfxDesign>> = {
  ui: uiSfx,
  battle: battleSfx,
  magic: magicSfx,
  weapons: weaponSfx,
  enemy: enemySfx,
  flow: flowSfx,
  spells: spellSfx,
  support: supportSfx,
  story: storySfx,
};

/** Flattened design registry — what `tools/audio/render.mjs` walks. */
export const SFX_DESIGNS: Record<string, SfxDesign> = Object.assign(
  {},
  ...Object.values(SFX_DESIGN_GROUPS),
);

function defOf(design: SfxDesign): SfxDef {
  return {
    about: design.about,
    render: (sampleRate: number) => renderDesign(design, sampleRate),
  };
}

function groupDefs(designs: Record<string, SfxDesign>): Record<string, SfxDef> {
  const out: Record<string, SfxDef> = {};
  for (const [name, design] of Object.entries(designs)) out[name] = defOf(design);
  return out;
}

/** The same groups as playable cues, for the debug list and the runtime bank. */
export const SFX_GROUPS: Record<string, Record<string, SfxDef>> = Object.fromEntries(
  Object.entries(SFX_DESIGN_GROUPS).map(([group, designs]) => [group, groupDefs(designs)]),
);

export const SFX: Record<string, SfxDef> = Object.assign({}, ...Object.values(SFX_GROUPS));

export function sfxNames(): string[] {
  return Object.keys(SFX);
}

export function hasSfx(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(SFX, name);
}

/**
 * The real cue a key plays: the key itself when it is a cue, otherwise its
 * entry in {@link SFX_ALIASES} (the per-ability `sfxKey` names the battle data
 * was authored with). `undefined` when neither resolves.
 */
export function resolveSfx(name: string): string | undefined {
  if (hasSfx(name)) return name;
  const target = Object.prototype.hasOwnProperty.call(SFX_ALIASES, name) ? SFX_ALIASES[name] : undefined;
  return target !== undefined && hasSfx(target) ? target : undefined;
}

export function getSfx(name: string): SfxDef {
  const def = SFX[name];
  if (!def) throw new Error(`Unknown sfx "${name}". Known: ${sfxNames().join(', ')}`);
  return def;
}

export function getSfxDesign(name: string): SfxDesign {
  const design = SFX_DESIGNS[name];
  if (!design) throw new Error(`Unknown sfx design "${name}". Known: ${sfxNames().join(', ')}`);
  return design;
}

export function renderSfx(name: string, sampleRate: number): Stereo {
  return getSfx(name).render(sampleRate);
}

/**
 * Render a cue with a specific note renderer — how `tools/audio/render.mjs`
 * plays a design on recorded instruments instead of synthesised ones.
 */
export function renderSfxWith(name: string, sampleRate: number, note: NoteRenderer): Stereo {
  return renderDesign(getSfxDesign(name), sampleRate, note);
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
