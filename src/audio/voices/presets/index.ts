/**
 * The sampled-instrument preset registry.
 *
 * `tools/audio/render.mjs` reads this to decide what each score channel
 * actually plays when a cue is pre-rendered. Nothing here is used at runtime
 * in the browser — the game plays the finished MP3s, or falls back to the
 * synthesised voices in `../` if a cue is missing from the manifest.
 *
 * To add or change an instrument, edit one of the group files. To add a whole
 * new group, add its file to `PRESET_GROUPS` below. See docs/audio/PIPELINE.md.
 */

import type { PresetGroup, VoicePreset } from './types.ts';
import { keysPresets } from './keys.ts';
import { sustainedPresets } from './sustained.ts';
import { percussionPresets } from './percussion.ts';
import { bandPresets } from './band.ts';
import { electronicPresets } from './electronic.ts';
import { menusClairObscurPresets } from './menus-clair-obscur.ts';

export type { VoicePreset, PresetGroup };
export * from './types.ts';
export { SEATS, seatOf, sendOf, preDelayOf, DEFAULT_SEAT } from './seating.ts';
export type { Seat } from './seating.ts';

/** Every preset file, by group name. Mirrors the layout of `../`. */
export const PRESET_GROUPS: Record<string, PresetGroup> = {
  keys: keysPresets,
  sustained: sustainedPresets,
  percussion: percussionPresets,
  band: bandPresets,
  electronic: electronicPresets,
  'menus-clair-obscur': menusClairObscurPresets,
};

/** Flattened registry: instrument name -> preset. */
export const PRESETS: Record<string, VoicePreset> = Object.assign(
  {},
  ...Object.values(PRESET_GROUPS),
);

export function presetNames(): string[] {
  return Object.keys(PRESETS).sort();
}

export function hasPreset(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(PRESETS, name);
}

export function getPreset(name: string): VoicePreset {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`No sampled preset for "${name}". Known: ${presetNames().join(', ')}`);
  }
  return preset;
}

/** Which group a preset came from — used by the render report and the docs. */
export function groupOf(name: string): string | null {
  for (const [group, presets] of Object.entries(PRESET_GROUPS)) {
    if (Object.prototype.hasOwnProperty.call(presets, name)) return group;
  }
  return null;
}

/**
 * A preset's declared name must match its key, or an arranger who renames one
 * gets a silent mismatch between the score and the render report. Checked by
 * the unit tests rather than at import time so a typo fails loudly in CI.
 */
export function presetKeyMismatches(): string[] {
  const bad: string[] = [];
  for (const [key, preset] of Object.entries(PRESETS)) {
    if (preset.name !== key) bad.push(`${key} declares name "${preset.name}"`);
  }
  return bad;
}

/** Presets that are an honest approximation rather than the real instrument. */
export function presetCaveats(): Array<{ name: string; caveat: string }> {
  return Object.values(PRESETS)
    .filter((p): p is VoicePreset & { caveat: string } => typeof p.caveat === 'string')
    .map((p) => ({ name: p.name, caveat: p.caveat }));
}
