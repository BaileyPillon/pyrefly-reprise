/**
 * Sphere Grid items that ship as chapter/steal rewards but have no `ItemDef`
 * row — the five closed by `docs/plans/questions-for-bailey-2026-09-23.md`
 * Q3. Source: `research/ffx-combat-core.md`, "Research sweep addendum
 * (2026-09-23): the sphere items our boss rewards name" (around line 2304),
 * quoting the FF Wiki help text for each row via the MediaWiki API
 * (revision ids in the table below); the item *class* of each (Sphere Grid
 * consumable) agrees with the grid mechanics documented at §10.2.
 *
 * These are Sphere Grid consumables, not battle items: none of them has a
 * usable-in-battle effect, so `usableInBattle: false` on every row and each
 * `effect` is a no-op `AbilityDef` (required field, per `ItemDef.effect`;
 * there is no in-battle behaviour to model). `usableInMenu: false` follows
 * the same sourced fact (Sphere Grid items are spent from the grid screen,
 * not the item menu) but is this file's own inference — no source states
 * "not usable in menu" in those words. `price: 0` — no source has any of
 * the five in a shop (matches the convention in `cures-utility-1.ts` for
 * items with no priced source).
 *
 * | Row | Help text (FF Wiki, rev) |
 * |---|---|
 * | Ability Sphere | "Activates nodes on Sphere Grid." (4033565) |
 * | Blk Magic Sphere | "Activates nodes used by allies on Sphere Grid." (4033582) |
 * | Special Sphere | "Activates nodes used by allies on Sphere Grid." (4033579) |
 * | Lv. 3 Key Sphere | "Opens Locks on Sphere Grid." (4032267) |
 * | Lv. 4 Key Sphere | "Opens Locks on Sphere Grid." (4032268) |
 *
 * Ids match the raw reward ids already shipped in
 * `enemies/seymour-anima-macalania.ts` (G-10), `enemies/evrae.ts`,
 * `enemies/seymour-flux.ts` and `enemies/yunalesca.ts` — adding these rows
 * lets `steal.ts#itemName` and the Results screen show the real name instead
 * of falling back to the raw id. `special-sphere` has a row here (the brief
 * asked for all five) but no current chapter reward references it: the
 * addendum names it as a **rare** drop from Seymour at Macalania that our
 * `seymour-anima-macalania.ts` reward table does not yet model — that gap is
 * enemies/** data, owned by a different agent, not this file's to add.
 *
 * Rows land one at a time (one commit per item, per the task brief); the
 * proving test lives in `tests/unit/data-reward-items-resolve.test.ts`.
 */

import type { AbilityDef, ItemDef } from '../../../battle/common/types.ts';

/** Shared no-op effect: Sphere Grid items have no in-battle action. */
function sphereGridEffect(id: string, name: string): AbilityDef {
  return {
    id,
    name,
    game: 'ffx',
    category: 'item',
    mpCost: 0,
    rank: 2,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit'],
    animationKey: 'item-use',
    sfxKey: 'sfx-item-cure',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: {},
  };
}

/** Ability Sphere, Blk Magic Sphere, Special Sphere, Lv. 3/4 Key Sphere, keyed by id. */
export const ITEMS: Record<string, ItemDef> = {
  'ability-sphere': {
    id: 'ability-sphere',
    name: 'Ability Sphere',
    game: 'ffx',
    effect: sphereGridEffect('ability-sphere', 'Ability Sphere'),
    targeting: 'self',
    usableInBattle: false,
    usableInMenu: false,
    price: 0, // no source lists a shop price for any Sphere Grid item
    iconKey: 'icon-ability-sphere',
    description: 'Activates nodes on Sphere Grid.',
  },
  'blk-magic-sphere': {
    id: 'blk-magic-sphere',
    name: 'Blk Magic Sphere',
    game: 'ffx',
    effect: sphereGridEffect('blk-magic-sphere', 'Blk Magic Sphere'),
    targeting: 'self',
    usableInBattle: false,
    usableInMenu: false,
    price: 0, // no source lists a shop price for any Sphere Grid item
    iconKey: 'icon-blk-magic-sphere',
    description: 'Activates nodes used by allies on Sphere Grid.',
  },
  'special-sphere': {
    id: 'special-sphere',
    name: 'Special Sphere',
    game: 'ffx',
    effect: sphereGridEffect('special-sphere', 'Special Sphere'),
    targeting: 'self',
    usableInBattle: false,
    usableInMenu: false,
    price: 0, // no source lists a shop price for any Sphere Grid item
    iconKey: 'icon-special-sphere',
    description: 'Activates nodes used by allies on Sphere Grid.',
  },
  'lv-3-key-sphere': {
    id: 'lv-3-key-sphere',
    name: 'Lv. 3 Key Sphere',
    game: 'ffx',
    effect: sphereGridEffect('lv-3-key-sphere', 'Lv. 3 Key Sphere'),
    targeting: 'self',
    usableInBattle: false,
    usableInMenu: false,
    price: 0, // no source lists a shop price for any Sphere Grid item
    iconKey: 'icon-lv-3-key-sphere',
    description: 'Opens Locks on Sphere Grid.',
  },
  'lv-4-key-sphere': {
    id: 'lv-4-key-sphere',
    name: 'Lv. 4 Key Sphere',
    game: 'ffx',
    effect: sphereGridEffect('lv-4-key-sphere', 'Lv. 4 Key Sphere'),
    targeting: 'self',
    usableInBattle: false,
    usableInMenu: false,
    price: 0, // no source lists a shop price for any Sphere Grid item
    iconKey: 'icon-lv-4-key-sphere',
    description: 'Opens Locks on Sphere Grid.',
  },
};

export default ITEMS;
