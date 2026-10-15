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
 * | `white-lore` | White Lore | Shade of Gippal (Chapter XV) | `ffx2-gippal-den-of-woe.md` §3.1; effect `ffx2-bahamut.md` §accessories |
 * | `natures-lore` | Nature's Lore | Shade of Baralai (Chapter XV) | `ffx2-gippal-den-of-woe.md` §3.2; effect `ffx2-combat-core.md` Instinct |
 * | `arcane-lore` | Arcane Lore | Shade of Nooj (Chapter XV) | `ffx2-gippal-den-of-woe.md` §3.2; effect `ffx2-combat-core.md` Arcana |
 * | `soul-of-thamasa` | Soul of Thamasa | Ixion's drop (Djose, Chapter XVI) | `ffx2-ixion-djose.md` §3.1, verified: 6 sources; effect wiki, single source |
 * | `sprint-shoes` | Sprint Shoes | Ixion (both slots) | `ffx2-ixion-djose.md` §3.1, verified: 4 sources; effect wiki, single source |
 * | `power-wrist` | Power Wrist | Yojimbo (both slots; the hidden Tourist Trap, 2026-10-14) | `ffx2-combat-core.md` §5.4, verified: 2 sources; the steal is `monster.bin` row 170 |
 * | `moon-bracer` | Moon Bracer | Valefor's drop (Besaid, the hidden Valefor chapter) | `ffx2-fallen-aeons.md` §7.1, verified: 2 sources; effect `ffx2-combat-core.md` §5.4 (no stats, Auto-Shell) |
 * | `ribbon` | Ribbon | Angra Mainyu's drop (both slots; the hidden Angra Mainyu chapter, 2026-10-14) | `monster.bin` row 268 + wiki + Jegged, verified: 3 sources; effect `ffx2-combat-core.md` §3, verified: 2 sources; no price |
 * | `x2-healing-spring` | Healing Spring | Valefor (both slots) | `ffx2-fallen-aeons.md` §7.1, verified: 2 sources; a recovery item (`ffx2-combat-core.md` §5.5, Regen), held-only here: its effect is not wired |
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
  'x2-mute-shock', 'snow-ring', 'potpourri', 'x2-chaos-shock', 'x2-fury-shock', 'soul-of-thamasa', 'sprint-shoes', 'moon-bracer', 'ribbon',
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
  // Chapter XV's steals (FFX-2 only). ffx2-combat-core §5.4 prices every Lore at "50,000 gil each to buy";
  // the effects: White Lore Mag +12 (ffx2-bahamut accessories table), Arcane Lore Mag +12 and Nature's Lore
  // Str +12 (ffx2-combat-core, Arcana and Instinct, verified: 2 sources), each granting that skillset's command.
  held('white-lore', 'White Lore', 50000, 'Accessory. White Mage abilities in any dressphere; Mag +12.'),
  held('natures-lore', "Nature's Lore", 50000, 'Accessory. Instinct in any dressphere; Str +12.'),
  held('arcane-lore', 'Arcane Lore', 50000, 'Accessory. Arcana in any dressphere; Mag +12.'),
  // Ixion at Djose (FFX-2 only): the effects are the wiki's accessory table (ffx2-ixion-djose §3.1, single source).
  held('soul-of-thamasa', 'Soul of Thamasa', 'unsourced', 'Accessory. Spells 150 % stronger, MP cost doubled; Mag +15.'),
  held('sprint-shoes', 'Sprint Shoes', 'unsourced', 'Accessory. Act first; Haste; Agi +10.'),
  // Yojimbo's steal in the hidden Tourist Trap (FFX-2 only, 2026-10-14; common and rare slot, monster.bin row 170): ffx2-combat-core §5.4 "Power Wrist | STR +20 | 1500 / 6000 (sell / buy)"
  // `[verified: 2 sources]`; the price is the buy price, as in every row here, and the same Str +20 the accessory table already carries (`battle/ffx2/accessories.ts`).
  held('power-wrist', 'Power Wrist', 6000, 'Accessory. Str +20.'),
  // Valefor at Besaid (FFX-2 only, the hidden chapter): Moon Bracer, no stats, Auto-Shell (ffx2-combat-core §5.4); no price in the research.
  held('moon-bracer', 'Moon Bracer', 'unsourced', 'Accessory. Auto-Shell.'),
  // Angra Mainyu's drop in the hidden chapter (FFX-2 only; monster.bin row 268, common and rare slot, chance byte 255; `research/re-ffx2-angra-mainyu.md` §4.1, wiki, Jegged `[verified: 3 sources]`): the Ribbon. The effect is
  // `research/ffx2-combat-core.md` §3 (immune to Petrification, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Pointless, Itchy, Slow and Stop; `[verified: 2 sources]`), which the engine already wears (`battle/ffx2/kit.ts`); no shop price.
  held('ribbon', 'Ribbon', 'unsourced', 'Accessory. Guards against Petrification, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Pointless, Itchy, Slow and Stop.'),
  // Healing Spring is a recovery item (ffx2-combat-core §5.5: Regen on the target party, ~3 % max HP a tick, not sold, sells for 150); the research names no effect row of ours, so it is held-only until one is built.
  held('x2-healing-spring', 'Healing Spring', 0, 'Recovery item (Regen); its effect is not wired yet.'),
];

export default heldItems;
