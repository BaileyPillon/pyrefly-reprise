/**
 * Rikku's Mix — the full result-ability catalog.
 * Source: `research/ffx-combat-core.md` §5.9 `[verified: 2 sources]`.
 *
 * P0 RESOLUTION-ORDER WARNING `[verified: 2 sources]`: The engine computes
 * signed HP/MP amounts from the PRE-ACTION target state, then removes
 * statuses, then applies the amounts. Therefore Super Elixir and Final
 * Elixir remove Zombie and STILL kill that character with reversed healing.
 * Panacea (no HP component) is the only safe cleanse.
 * — This is ENGINE BEHAVIOR, not a field set on any AbilityDef below. Flagging
 *   it here prominently so the engine agent implementing action resolution
 *   does not miss it.
 *
 * This file only assembles the catalog and defines the top-level `mix`
 * selector command. The ~41 resolved mix result abilities live in four
 * sibling files, split to stay under the project's ~380-line guideline:
 *   - `mixes/abilities-restoratives.ts` — HP/MP pool effects (9 abilities;
 *     Ultra Potion, Panacea, Ultra Cure, Mega/Final Phoenix, Elixir,
 *     Megalixir, Super/Final Elixir). Owns the P0 warning's affected mixes.
 *   - `mixes/abilities-wards.ts` — Nul-All and Mighty G families (8).
 *   - `mixes/abilities-boosts.ts` — Vitality/Mana/Freedom/9999/Drink/
 *     Overdrive-gain flag statuses (14).
 *   - `mixes/abilities-ordnance.ts` — the grenade and fire lines plus the
 *     two percent-current/deal-9999 nukes (12).
 * 9 + 8 + 14 + 12 = 43 result abilities (the brief's "~41" approximation).
 *
 * ID RULE: every result ability id is prefixed `mix-` (e.g. `mix-grenade`)
 * to avoid colliding with the item catalog owned by a different parallel
 * agent (the item `grenade` already exists). The one exception is the
 * top-level selector's own id, `mix`.
 *
 * Every result ability's `rank` is 6 even though the in-battle CTB preview
 * displays rank 5 for Mix — the decompile's actual recovery cost is rank 6
 * [ffx-combat-core §5.9].
 *
 * KNOWN GAP: research also references ice/thunder/water elemental
 * counterparts to the Fire-line families (Blaster/Flurry/Bolt/Waterfall,
 * Icefall/Rolling Thunder/Flash Flood, Winter Storm/Lightning Bolt/Tidal
 * Wave, Black Ice/Electroshock/Aqua Toxin, Krysta/Thunderblast/Dark Rain),
 * but only gives their damage SHAPE, not confirmed exact names or ids in
 * order. They are deliberately SKIPPED here rather than guessed — see the
 * report for this gap.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { RESTORATIVE_MIX_ABILITIES } from './abilities-restoratives.ts';
import { WARD_MIX_ABILITIES } from './abilities-wards.ts';
import { BOOST_MIX_ABILITIES } from './abilities-boosts.ts';
import { ORDNANCE_MIX_ABILITIES } from './abilities-ordnance.ts';

export { MIX_CLEANSE_STATUSES } from './abilities-restoratives.ts';

/**
 * The top-level Mix command. `minigame: 'rikku-mix'` opens the two-ingredient
 * picker [ffx-combat-core §5.9]; the chosen pair resolves to one of the
 * abilities above via `mixes/recipes.ts`, which the engine substitutes in
 * place of this record before executing.
 */
export const MIX_SELECTOR_ABILITY: AbilityDef = {
  id: 'mix',
  name: 'Mix',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 6,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'self',
  hits: 0,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canReflect: false,
  minigame: 'rikku-mix',
  extra: {
    consumesTwoItems: true,
    note: 'the resolved result ability id comes from recipes.ts given the two chosen ingredients',
  },
};

/**
 * The full mix catalog: the `mix` selector plus every resolved result
 * ability, keyed by id. Consumers that want just the results (e.g. to
 * validate `recipes.ts` targets) can filter out the `'mix'` key.
 */
export const ABILITIES: Record<string, AbilityDef> = {
  mix: MIX_SELECTOR_ABILITY,
  ...RESTORATIVE_MIX_ABILITIES,
  ...WARD_MIX_ABILITIES,
  ...BOOST_MIX_ABILITIES,
  ...ORDNANCE_MIX_ABILITIES,
};
