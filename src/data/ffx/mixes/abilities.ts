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
 *
 * ACCURACY DECISION (2026-09-16, corrected in a second integration pass —
 * the first pass's `canMiss: true`, and its "known gap" on the ally-target
 * mixes, both reasoned from absence rather than evidence): does a Mix
 * result roll to-hit? `research/ffx-bfa-yu-yevon.md` §1.3 (lines 101, 107,
 * 108) decompiles three enemy Overdrives — `Other` damage type, `category:
 * 'overdrive'` — all flagged "always hits", regardless of their underlying
 * formula (Strength in all three observed cases; every Mix result is also
 * `damageType: 'other'`, `category: 'overdrive'`, per §5.9). Extending that
 * pattern to Mixes' other formulas (`fixed`/`percent-total`/
 * `percent-current`/`deal-9999`/`none`) is an analogy on the damage-type/
 * category axis rather than an exact formula match, so it is tagged
 * `[estimate]` here — one notch softer than the `[verified: 2 sources]` used
 * for Black Magic and the Strength-formula Overdrives that match the
 * decompiled rows exactly.
 *
 * This also resolves the first pass's "known gap" on the ALLY/PARTY-
 * targeting results (`abilities-restoratives.ts`, `abilities-wards.ts`,
 * `abilities-boosts.ts`): the only ally-targeted action the research
 * explicitly resolves, Pray (§7.5, "always hits"), is now consistent with
 * every other data point instead of contradicting it — ally-targeted
 * support and enemy-targeted ordnance both always hit; the earlier
 * uncertainty was an artefact of reasoning from a short discussed-actions
 * list, not a real split in the data. `canMiss: false` is set explicitly on
 * all 43 result abilities plus the `mix` selector, citing
 * `ffx-bfa-yu-yevon.md` §1.3 `[estimate]` (analogy, per above) throughout.
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
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — always hits; see file header.
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
