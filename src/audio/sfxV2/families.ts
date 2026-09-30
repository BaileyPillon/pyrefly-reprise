/**
 * The landing family an action's own data names, for the recorded set's hookup (D-302): whether its
 * blow lands as fire, as a Flare-type detonation, as an explosion, as a Curaga, and so on.
 *
 * **FFX (FFX only).** The ability, aeon and item rows already name a sound per action (`sfxKey`, 245
 * rows, e.g. `sfx-firaga-cast`, `sfx-item-explosion-small`, `sfx-mega-flare`); `../sfx/aliases.ts`
 * maps each onto a first-bank cue (`fire-3`, `explosion`, `breath-attack`). This table folds those
 * first-bank cues into the set's families, so the data's own naming picks the v2 cue.
 *
 * **FFX-2 (FFX-2 only).** The FFX-2 rows carry no `sfxKey`. What they have is the element, the damage
 * type and the `heals` flag, which `battleVoice.ts` reads directly; this module adds only the tiers
 * the rows name in their ids (White Magic's `curaga` and `full-cure` -> the Curaga bloom). Nothing
 * else is guessed: FFX-2's Mega Flare, for one, lands as the Flare-type detonation its magical,
 * non-elemental row describes, not as a breath the FFX-2 research never mentions.
 *
 * Pure data and lookups, no imports beyond the alias table.
 */

import { SFX_ALIASES } from '../sfx/aliases.ts';

/** First-bank cue -> the set's landing family. Anything unlisted lands by element and damage type. */
export const V1_FAMILIES: Readonly<Record<string, string>> = {
  fire: 'fire',
  'fire-2': 'fire',
  'fire-3': 'fire',
  ice: 'ice',
  'ice-2': 'ice',
  'ice-3': 'ice',
  thunder: 'lightning',
  lightning: 'lightning',
  'lightning-2': 'lightning',
  'lightning-3': 'lightning',
  water: 'water',
  'water-2': 'water',
  'water-3': 'water',
  holy: 'holy',
  'holy-2': 'holy',
  flare: 'flare',
  ultima: 'flare',
  meteor: 'flare',
  gravity: 'flare',
  'gravity-2': 'flare',
  explosion: 'explosion',
  'breath-attack': 'breath-attack',
  'laser-fire': 'laser-fire',
  cure: 'cure',
  'cure-2': 'cure',
  'cure-3': 'cure-3',
  elixir: 'cure-3',
  life: 'life',
  'full-life': 'life',
  'phoenix-down': 'phoenix-down',
};

/** FFX: the family an ability's or item effect's `sfxKey` names, if any. */
export function familyOfSfxKey(sfxKey: string | undefined): string | null {
  if (!sfxKey) return null;
  const cue = Object.prototype.hasOwnProperty.call(SFX_ALIASES, sfxKey) ? SFX_ALIASES[sfxKey]! : sfxKey;
  return V1_FAMILIES[cue] ?? null;
}

/** FFX-2 abilities by id whose landing the element and damage type alone would not tell. */
const FFX2_ID_FAMILIES: ReadonlyArray<[RegExp, string]> = [
  [/(^|-)(curaga|full-cure)$/, 'cure-3'],
];

export function familyOfFfx2Ability(id: string | undefined): string | null {
  if (!id) return null;
  for (const [re, family] of FFX2_ID_FAMILIES) if (re.test(id)) return family;
  return null;
}
