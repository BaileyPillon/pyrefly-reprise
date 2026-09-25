/**
 * FFX-2 steal rewards that are accessories: held in the bag, never used from a menu.
 *
 * Until these rows existed six steal ids resolved to no `ItemDef`, so Steal's
 * banner (`battle/ffx2/steal.ts#itemName`) and the Results screen
 * (`ui/common/resultsMath.ts`) printed the raw id: "Rikku stole x2-mute-shock!"
 * against Bahamut. Each row carries the name its research file prints, and the
 * ids are the ones the enemy records already ship, so no enemy file changes.
 *
 * | Id | Name | Stolen from | Source |
 * |---|---|---|---|
 * | `x2-mute-shock` | Mute Shock | Bahamut (both slots) | `ffx2-bahamut.md` §1.6, verified: 2 sources |
 * | `snow-ring` | Snow Ring | Shiva (both slots) | `ffx2-fallen-aeons.md` §3.1, SinirothX + wiki |
 * | `potpourri` | Potpourri | Sandy | `ffx2-fallen-aeons.md` §3.2, SinirothX + wiki |
 * | `white-cape` | White Cape | Cindy | `ffx2-fallen-aeons.md` §3.2; effect `ffx2-combat-core.md` §5.4 |
 * | `x2-chaos-shock` | Chaos Shock | Mindy | `ffx2-fallen-aeons.md` §3.2, SinirothX + wiki |
 * | `x2-fury-shock` | Fury Shock | Anima | `ffx2-fallen-aeons.md` §3.3, SinirothX + wiki + FFExodus |
 *
 * What is **not** sourced, and so not written: an effect or description for
 * Snow Ring, Potpourri, Chaos Shock and Fury Shock (the research names them and
 * nothing more), and a shop price for any of them but White Cape. Those rows
 * carry `price: 0` because the field is required, and are listed in
 * {@link UNSOURCED_PRICE_IDS}: their 0 means "unsourced", not "never sold"
 * (`ItemDef.price`, CONTRACT-CHANGES 2026-09-25). None is equipped by a shipped build, so the accessory stat table
 * (`battle/ffx2/accessories.ts`) is not extended either.
 *
 * `ItemDef.effect` is always an ability id in FFX-2 (CONTRACT-CHANGES decision
 * 7), so every row points at one shared no-op, {@link HELD_ITEM_EFFECT_ID}, and
 * `usableInBattle` / `usableInMenu` are false: no Item row is ever built for them.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import type { AbilityDef, ItemDef } from '../../../battle/common/types.ts';

/** The shared effect of an item that is only ever held. */
export const HELD_ITEM_EFFECT_ID = 'x2-item-held-only';

/** No-op: an accessory has no in-battle action. Registered so the effect id resolves. */
export const heldItemEffect: AbilityDef = {
  id: HELD_ITEM_EFFECT_ID,
  name: 'Held item',
  game: 'ffx2',
  category: 'item',
  mpCost: 0,
  chargeTicks: 0,
  recoveryTicks: 0,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'self',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  messageTemplate: '{user} holds {ability}',
};

/** Held rows whose shop price the research does not give; each carries `price: 0`. */
export const UNSOURCED_PRICE_IDS: ReadonlySet<string> = new Set([
  'x2-mute-shock', 'snow-ring', 'potpourri', 'x2-chaos-shock', 'x2-fury-shock',
]);

function held(id: string, name: string, price: number | 'unsourced', description?: string): ItemDef {
  const row: ItemDef = {
    id,
    name,
    game: 'ffx2',
    effect: HELD_ITEM_EFFECT_ID,
    targeting: 'self',
    usableInBattle: false,
    usableInMenu: false,
    price: price === 'unsourced' ? 0 : price,
  };
  if (description !== undefined) row.description = description;
  return row;
}

export const heldItems: ItemDef[] = [
  // ffx2-bahamut §1.6: "Accessory: adds Silence to attacks, user can cast Silence; Strength −5, Magic +3".
  held('x2-mute-shock', 'Mute Shock', 'unsourced', 'Accessory. Adds Silence to attacks; the wearer can cast Silence; Str -5, Mag +3.'),
  held('snow-ring', 'Snow Ring', 'unsourced'),
  held('potpourri', 'Potpourri', 'unsourced'),
  // ffx2-combat-core §5.4 "DEF +4, MDEF +4, Silenceproof"; ffx2-leblanc-syndicate §7.5 "3,000 gil".
  held('white-cape', 'White Cape', 3000, 'Accessory. Guards against Silence; Def +4, MDef +4.'),
  held('x2-chaos-shock', 'Chaos Shock', 'unsourced'),
  held('x2-fury-shock', 'Fury Shock', 'unsourced'),
];

export default heldItems;
