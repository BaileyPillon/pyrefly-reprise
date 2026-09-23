/**
 * FFX data — top-level lookup tables for `BattleSetup`.
 *
 * Mirrors `src/data/ffx2/index.ts` exactly so both games wire up the same
 * way: the FFX engine (`src/battle/ffx/**`) and app-boot code pull every
 * `AbilityDef` and `ItemDef` this project ships for FFX, keyed by id, plus
 * the three chapters' `EnemyGroupDef`s, from this one module.
 *
 * **This file was the missing link that made every FFX boss fight run on
 * plain auto-attacks** (2026-09-16 fix): every table under `abilities/**`,
 * `aeons/**`, `overdrives/**`, `mixes/**`, `items/**` and the enemy-data
 * agent's `enemies/*-abilities.ts` modules was already written and
 * type-clean, but nothing merged them into the `ABILITIES`/`ITEMS` records
 * the app-boot `registerFFXAbilities()` call actually reads. See the
 * "Ability catalog" section below for the full merge and its one
 * cross-agent id-collision fix.
 *
 * Ownership: this file, `abilities/**`, `items/**`, `statuses/**`,
 * `characters/**`, `aeons/**`, `overdrives/**` and `mixes/**` belong to the
 * FFX player-data agent. `enemies/**` and `builds/**` belong to a different
 * data agent and are only imported here, never edited.
 */

import type { AbilityDef, AbilityId, EnemyGroupDef, ItemDef, ItemId } from '../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Player-side abilities — src/data/ffx/abilities/**
// ---------------------------------------------------------------------------

import { ABILITIES as WHITEMAGIC_CURE } from './abilities/whitemagic-cure.ts';
import { ABILITIES as WHITEMAGIC_REVIVAL } from './abilities/whitemagic-revival.ts';
import { ABILITIES as WHITEMAGIC_PROTECT } from './abilities/whitemagic-protect.ts';
import { ABILITIES as WHITEMAGIC_HASTE_SLOW } from './abilities/whitemagic-haste-slow.ts';
import { ABILITIES as BLACKMAGIC_ELEMENTAL } from './abilities/blackmagic-elemental.ts';
import { ABILITIES as BLACKMAGIC_ADVANCED } from './abilities/blackmagic-advanced.ts';
import { ABILITIES as SPECIAL_BUFFS } from './abilities/special-buffs.ts';
import { ABILITIES as SPECIAL_UTILITY } from './abilities/special-utility.ts';
import { ABILITIES as SPECIAL_RIKKU } from './abilities/special-rikku.ts';
import { ABILITIES as SKILL_STATUS_ATTACKS } from './abilities/skill-status-attacks.ts';
import { ABILITIES as SKILL_BREAKS_MISC } from './abilities/skill-breaks-misc.ts';
import { ABILITIES as OVERDRIVE_TIDUS } from './abilities/overdrive-tidus.ts';
import { ABILITIES as OVERDRIVE_AURON } from './abilities/overdrive-auron.ts';
import { ABILITIES as OVERDRIVE_WAKKA_1 } from './abilities/overdrive-wakka-1.ts';
import { ABILITIES as OVERDRIVE_WAKKA_2 } from './abilities/overdrive-wakka-2.ts';
import { ABILITIES as OVERDRIVE_LULU_1 } from './abilities/overdrive-lulu-1.ts';
import { ABILITIES as OVERDRIVE_LULU_2 } from './abilities/overdrive-lulu-2.ts';
import { ABILITIES as OVERDRIVE_KIMAHRI_1 } from './abilities/overdrive-kimahri-1.ts';
import { ABILITIES as OVERDRIVE_KIMAHRI_2 } from './abilities/overdrive-kimahri-2.ts';
import { ABILITIES as OVERDRIVE_YUNA } from './abilities/overdrive-yuna.ts';
import { ABILITIES as SPECIAL_MENU_MARKERS } from './abilities/special-menu-markers.ts';
// The Evrae chapter's two Trigger Command markers ('pull-back' / 'close-in').
// A separate file rather than rows inside `special-menu-markers.ts`, so that
// chapter's track owns every file it writes while the tree is shared.
import { ABILITIES as SPECIAL_ORDERS_EVRAE } from './abilities/special-orders-evrae.ts';

// ---------------------------------------------------------------------------
// Aeons — src/data/ffx/aeons/**
// ---------------------------------------------------------------------------

import { ABILITIES as AEON_ABILITIES_CORE } from './aeons/abilities-core.ts';
import { ABILITIES as AEON_ABILITIES_CORE_2 } from './aeons/abilities-core-2.ts';
import { ABILITIES as AEON_ABILITIES_OPTIONAL } from './aeons/abilities-optional.ts';
import { ABILITIES as AEON_ABILITIES_OPTIONAL_2 } from './aeons/abilities-optional-2.ts';
import { AEONS, AEON_STAT_COEFFICIENTS, AEON_CANONICAL_STATS } from './aeons/index.ts';
import type { AeonCatalogDef } from './aeons/index.ts';

// ---------------------------------------------------------------------------
// Overdrive modes — src/data/ffx/overdrives/**
// ---------------------------------------------------------------------------

import { OVERDRIVE_MODES, TACTICIAN_STATUSES, VICTIM_SUFFERER_STATUSES } from './overdrives/modes.ts';
import type { OverdriveModeDef } from './overdrives/modes.ts';

// ---------------------------------------------------------------------------
// Rikku's Mix — src/data/ffx/mixes/**
// ---------------------------------------------------------------------------

import { ABILITIES as MIX_ABILITIES } from './mixes/abilities.ts';
import { MIX_RECIPES } from './mixes/recipes.ts';
import { MIX_CLEANSE_STATUSES } from './mixes/abilities-restoratives.ts';

// ---------------------------------------------------------------------------
// Items — src/data/ffx/items/** (each item's effect is an inline AbilityDef
// with category 'item', per docs/CONTRACT-CHANGES.md §7)
// ---------------------------------------------------------------------------

import { ITEMS as ITEMS_RESTORATIVES_1 } from './items/restoratives-1.ts';
import { ITEMS as ITEMS_RESTORATIVES_2 } from './items/restoratives-2.ts';
import { ITEMS as ITEMS_CURES_UTILITY_1 } from './items/cures-utility-1.ts';
import { ITEMS as ITEMS_CURES_UTILITY_2 } from './items/cures-utility-2.ts';
import { ITEMS as ITEMS_CURES_UTILITY_3 } from './items/cures-utility-3.ts';
import { ITEMS as ITEMS_OFFENSIVE_1A } from './items/offensive-1a.ts';
import { ITEMS as ITEMS_OFFENSIVE_1B } from './items/offensive-1b.ts';
import { ITEMS as ITEMS_OFFENSIVE_2A } from './items/offensive-2a.ts';
import { ITEMS as ITEMS_OFFENSIVE_2B } from './items/offensive-2b.ts';

// ---------------------------------------------------------------------------
// Statuses and characters — src/data/ffx/statuses/**, src/data/ffx/characters/**
// ---------------------------------------------------------------------------

import { FFX_STATUSES } from './statuses/index.ts';
import type { FFXStatusDef } from './statuses/index.ts';
import { CHARACTERS } from './characters/index.ts';
import type { FFXCharacterDef } from './characters/index.ts';

// ---------------------------------------------------------------------------
// Enemies and builds — owned by a different data agent. Imported, not edited.
// ---------------------------------------------------------------------------

import { SEYMOUR_FLUX_ABILITIES } from './enemies/seymour-flux-abilities.ts';
import { YUNALESCA_ABILITIES } from './enemies/yunalesca-abilities.ts';
import { BRASKAS_FINAL_AEON_ABILITIES } from './enemies/braskas-final-aeon-abilities.ts';
import { SEYMOUR_ANIMA_MACALANIA_ABILITIES } from './enemies/seymour-anima-macalania-abilities.ts';
import { EVRAE_ABILITIES } from './enemies/evrae-abilities.ts';
import { seymourFluxGroup } from './enemies/seymour-flux.ts';
import { yunalescaGroup } from './enemies/yunalesca.ts';
import { seymourAnimaMacalaniaGroup } from './enemies/seymour-anima-macalania.ts';
import { evraeGroup } from './enemies/evrae.ts';
import {
  braskasFinalAeonGroup,
  possessedAeonGroups,
  possessedAeonsGroup,
  yuYevonGroup,
} from './enemies/braskas-final-aeon.ts';
import { gagazetBuild } from './builds/gagazet.ts';
import { zanarkandBuild } from './builds/zanarkand.ts';
import { dreamsEndBuild } from './builds/dreams-end.ts';
import { macalaniaBuild } from './builds/macalania.ts';
import { fahrenheitBuild } from './builds/fahrenheit.ts';

// ---------------------------------------------------------------------------
// Ability catalog
// ---------------------------------------------------------------------------

/**
 * Every non-item, non-enemy `AbilityDef` this project ships for FFX: every
 * player White/Black Magic spell, Special/Skill command, character
 * Overdrive, aeon action, and Rikku Mix result — merged from the 25 sibling
 * modules above, keyed by id.
 *
 * ID COLLISION FIX (integration pass, 2026-09-16): two ids collided against
 * the enemy-data agent's boss-only abilities, each with genuinely different
 * mechanics from the player spell of the same name:
 *   - `'osmose'` — Lulu's player-castable Black Magic spell (rank 2, MP 0,
 *     `magic` formula DmgCon 10) vs. `enemies/yunalesca-abilities.ts`'s
 *     enemy-only Osmose (used only against an aeon, flat 100% of max MP,
 *     `percent-total` formula, category `'enemy'`), which is also reused
 *     verbatim by `enemies/braskas-final-aeon-abilities.ts`. The player
 *     spell was renamed `osmose-spell` in `abilities/blackmagic-advanced.ts`
 *     — see that file for the full note.
 *   - `'full-life'` — Yuna's player-castable White Magic revive spell vs.
 *     `enemies/seymour-flux-abilities.ts`'s enemy-only Full-Life (targets a
 *     random Zombie-afflicted ally: kills a living Zombie outright or fully
 *     revives a KO'd one, category `'enemy'`). The player spell was renamed
 *     `full-life-spell` in `abilities/whitemagic-revival.ts` — see that file
 *     for the full note.
 * Both enemy files are owned by a different agent and were left untouched;
 * only this project's own player-side ids were changed. `tests/unit/
 * data-ffx-index.test.ts` asserts there are no further collisions and that
 * every id referenced by an `EnemyDef.abilityIds` or an
 * `FFXMemberBuild.learnedAbilityIds` resolves here.
 *
 * Note: `enemies/yunalesca-abilities.ts`'s `osmose` and
 * `enemies/braskas-final-aeon-abilities.ts`'s re-export of that same
 * `osmose` binding both appear in `YUNALESCA_ABILITIES` and
 * `BRASKAS_FINAL_AEON_ABILITIES` below — that is the SAME object reused
 * across two boss files (Yu Pagoda reuses Yunalesca's Osmose verbatim), not
 * a conflicting duplicate, so merging both records here is safe.
 */
export const ABILITIES: Record<AbilityId, AbilityDef> = {
  ...WHITEMAGIC_CURE,
  ...WHITEMAGIC_REVIVAL,
  ...WHITEMAGIC_PROTECT,
  ...WHITEMAGIC_HASTE_SLOW,
  ...BLACKMAGIC_ELEMENTAL,
  ...BLACKMAGIC_ADVANCED,
  ...SPECIAL_BUFFS,
  ...SPECIAL_UTILITY,
  ...SPECIAL_RIKKU,
  ...SKILL_STATUS_ATTACKS,
  ...SKILL_BREAKS_MISC,
  ...OVERDRIVE_TIDUS,
  ...OVERDRIVE_AURON,
  ...OVERDRIVE_WAKKA_1,
  ...OVERDRIVE_WAKKA_2,
  ...OVERDRIVE_LULU_1,
  ...OVERDRIVE_LULU_2,
  ...OVERDRIVE_KIMAHRI_1,
  ...OVERDRIVE_KIMAHRI_2,
  ...OVERDRIVE_YUNA,
  ...SPECIAL_MENU_MARKERS,
  ...SPECIAL_ORDERS_EVRAE,
  ...AEON_ABILITIES_CORE,
  ...AEON_ABILITIES_CORE_2,
  ...AEON_ABILITIES_OPTIONAL,
  ...AEON_ABILITIES_OPTIONAL_2,
  ...MIX_ABILITIES,
  // Item-effect abilities (category 'item') and the three bosses' own
  // movesets are merged in further down, once ITEMS exists.
};

/** Every `ItemDef` this project ships for FFX, keyed by id. */
export const ITEMS: Record<ItemId, ItemDef> = {
  ...ITEMS_RESTORATIVES_1,
  ...ITEMS_RESTORATIVES_2,
  ...ITEMS_CURES_UTILITY_1,
  ...ITEMS_CURES_UTILITY_2,
  ...ITEMS_CURES_UTILITY_3,
  ...ITEMS_OFFENSIVE_1A,
  ...ITEMS_OFFENSIVE_1B,
  ...ITEMS_OFFENSIVE_2A,
  ...ITEMS_OFFENSIVE_2B,
};

/**
 * Every item's own effect ability (inlined on `ItemDef.effect` rather than
 * looked up elsewhere, per `docs/CONTRACT-CHANGES.md` §7), extracted so it
 * is reachable from `ABILITIES`/`ALL_ABILITIES` too — a `Command` of kind
 * `'item'` still resolves its ability data through the same table an
 * `'ability'`/`'overdrive'` command does.
 */
const ITEM_EFFECT_ABILITIES: readonly AbilityDef[] = Object.values(ITEMS)
  .map((item) => item.effect)
  .filter((effect): effect is AbilityDef => typeof effect === 'object' && effect !== null);

/** Every boss-only `AbilityDef` across the three FFX chapters (enemy-data agent's modules). */
const ALL_BOSS_ABILITIES: readonly AbilityDef[] = [
  ...Object.values(SEYMOUR_FLUX_ABILITIES),
  ...Object.values(YUNALESCA_ABILITIES),
  ...Object.values(BRASKAS_FINAL_AEON_ABILITIES),
  ...Object.values(SEYMOUR_ANIMA_MACALANIA_ABILITIES),
  ...Object.values(EVRAE_ABILITIES),
];

// Fold item-effect and boss abilities into the merged ABILITIES record.
// `Object.assign` mutates the already-exported `const` object in place —
// legal for `const` (the binding is immutable, not the object) and it keeps
// `ABILITIES` a single live reference for every earlier import elsewhere in
// this module.
Object.assign(
  ABILITIES,
  Object.fromEntries(ITEM_EFFECT_ABILITIES.map((a) => [a.id, a])),
  Object.fromEntries(ALL_BOSS_ABILITIES.map((a) => [a.id, a])),
);

/**
 * Every `AbilityDef` this project ships for FFX (player spells/skills/
 * Overdrives/aeon actions/Mix results, item effects, and boss abilities),
 * as a flat list. Mirrors `ffx2/index.ts`'s `ALL_ABILITIES` shape exactly.
 */
export const ALL_ABILITIES: readonly AbilityDef[] = Object.values(ABILITIES);

// ---------------------------------------------------------------------------
// Aliases matching the FFX engine / app-boot wiring names
// (`registerFFXAbilities(Object.values(ABILITIES))`), mirroring the
// `FFX2_ABILITIES` / `FFX2_ITEMS` aliases in `ffx2/index.ts`.
// ---------------------------------------------------------------------------

export const FFX_ABILITIES: Record<AbilityId, AbilityDef> = ABILITIES;
export const FFX_ITEMS: Record<ItemId, ItemDef> = ITEMS;

// ---------------------------------------------------------------------------
// Enemy formations, keyed by id (chained BFA -> possessed aeons -> Yu Yevon
// encounter included as separate entries so any group in the chain can be
// looked up directly by its own `EnemyGroupDef.id`/`nextGroupId`).
// ---------------------------------------------------------------------------

export const ENEMY_GROUPS_BY_ID: Record<string, EnemyGroupDef> = {
  [seymourFluxGroup.id]: seymourFluxGroup,
  [yunalescaGroup.id]: yunalescaGroup,
  [braskasFinalAeonGroup.id]: braskasFinalAeonGroup,
  [yuYevonGroup.id]: yuYevonGroup,
  ...Object.fromEntries(possessedAeonGroups.map((g) => [g.id, g])),
  // **Not yet a playable chapter.** `seymour-anima-macalania` has no scene, no
  // story script, no art and no music, so it is deliberately absent from
  // `src/data/encounters.ts` and `chapter-meta.ts` and the chapter-select grid
  // keeps showing it as Coming. This entry is the dev-only registry hook: it
  // is what the unit and strategy suites and the `window.__pyrefly` debug API
  // look the formation up by, so the engine and data tracks can be verified
  // before the presentation tracks exist.
  [seymourAnimaMacalaniaGroup.id]: seymourAnimaMacalaniaGroup,
  // Chapter 8 (`evrae-airship`, src/data/chapter-evrae-airship.ts) is now
  // registered but LOCKED as Coming on chapter select until Bailey approves
  // its art [docs/handoff/chapter-evrae.md]. The unit and strategy suites
  // still look the formation up here by id.
  [evraeGroup.id]: evraeGroup,
};

/** Convenience alias for the first group of the possessed-aeon gauntlet. */
export { possessedAeonsGroup };

// ---------------------------------------------------------------------------
// Re-exports of the domain-specific catalogs this data agent also owns.
// ---------------------------------------------------------------------------

export {
  AEONS,
  AEON_STAT_COEFFICIENTS,
  AEON_CANONICAL_STATS,
  OVERDRIVE_MODES,
  TACTICIAN_STATUSES,
  VICTIM_SUFFERER_STATUSES,
  MIX_RECIPES,
  MIX_CLEANSE_STATUSES,
  FFX_STATUSES,
  CHARACTERS,
  gagazetBuild,
  zanarkandBuild,
  dreamsEndBuild,
  // Dev-only, like the formations above: neither chapter is registered yet.
  macalaniaBuild,
  fahrenheitBuild,
};

export type { AeonCatalogDef, OverdriveModeDef, FFXStatusDef, FFXCharacterDef };

export default {
  ABILITIES,
  ITEMS,
  FFX_ABILITIES,
  FFX_ITEMS,
  ENEMY_GROUPS_BY_ID,
  AEONS,
  OVERDRIVE_MODES,
  CHARACTERS,
  FFX_STATUSES,
};
