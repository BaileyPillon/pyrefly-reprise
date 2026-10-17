/**
 * The Alchemist's Mix in the engine's terms (re-parity RC9, lane X2-G; **FFX-2 only**): which result a pair of items makes, as an ability of ours, and whether the party's stock can
 * make the pick. The rules are the kernel's (`../kernel/mix-recipe.ts`: the game's recipe function, `FFX-2.exe` 0x0075A470); this file is the join between the game's numbers and
 * our ids, and between a command and the item ledger (`./item-ledger.ts`).
 *
 * **How the engine takes the two items.** The way every minigame outcome travels (`docs/CONTRACTS.md`, "Minigame protocol"): on the command, as `extra`. A Mix command is
 * `{ kind: 'ability', id: 'x2-alchemist-mix', targets, extra: { kind: 'rikku-mix', mix: { ingredients: [first, second], resultAbilityId: null } } }`. The ingredients are in the
 * ORDER PICKED (the order changes the result for 496 of the 2,278 unordered pairs). `resultAbilityId` is ignored: the game's HUD resolves the result from the two items before it
 * queues anything, and so does the engine. The picker that will produce this command is step two of the lane (a screen, after the driver's mockup); an AI, a headless run and a test
 * supply it directly. A Mix without two items the engine can name (none, one, or an id outside the game's 68) is the bare Mix of before: nothing happens and nothing is spent.
 *
 * **What the game queues is the result row**, not the Mix stub (0x3058, a menu stub the HUD never queues): the cast is the result's (cost 80, ATB cost 0), the targets are the
 * result's, and both ingredients are reserved like any item, which is what `execute.ts` does with the plan this module makes ({@link mixPlanOf}).
 */

import type { AbilityDef, Command, ItemId } from '../../common/types.ts';
import type { AbilityRegistry } from '../internal.ts';
import { mixRecipe } from '../kernel/mix-recipe.ts';
import { ingredientsAvailable, itemAvailable } from './item-ledger.ts';

/** The Alchemist's Mix command (the game's row 0x3058). */
export const MIX_COMMAND_ID = 'x2-alchemist-mix';

/**
 * Our id of each of the game's 68 items, by table row (`0x2000 + index`). The catalog's own ids where it has the item; the others are named the same way. The names are the research
 * table's by position (`research/ffx2-combat-core.md` §3.11 Step 5), the checked note's own label [I]; the class and level of every row are the game's. Inside a group of rows that
 * share a class and a level (the four first-aid items 0x200A to 0x200D, the two smaller bombs 0x2013 and 0x2014, the four status grenades 0x2015 to 0x2018, the four Greens 0x2040 to
 * 0x2043) the order of the names is a guess that cannot move any result.
 */
export const MIX_ITEM_IDS: readonly string[] = [
  'x2-potion', 'x2-hi-potion', 'x2-x-potion', 'x2-mega-potion',  // 0x2000
  'x2-ether', 'x2-turbo-ether', 'x2-phoenix-down', 'x2-mega-phoenix',  // 0x2004
  'x2-elixir', 'x2-megalixir', 'x2-antidote', 'x2-soft',  // 0x2008
  'x2-eye-drops', 'x2-echo-screen', 'x2-holy-water', 'x2-remedy',  // 0x200c
  'x2-budget-grenade', 'x2-grenade', 'x2-l-bomb', 'x2-s-bomb',  // 0x2010
  'x2-m-bomb', 'x2-sleep-grenade', 'x2-silence-grenade', 'x2-dark-grenade',  // 0x2014
  'x2-petrify-grenade', 'x2-bomb-fragment', 'x2-bomb-core', 'x2-fire-gem',  // 0x2018
  'x2-antarctic-wind', 'x2-arctic-wind', 'x2-ice-gem', 'x2-electro-marble',  // 0x201c
  'x2-lightning-marble', 'x2-lightning-gem', 'x2-fish-scale', 'x2-dragon-scale',  // 0x2020
  'x2-water-gem', 'x2-shadow-gem', 'x2-shining-gem', 'x2-blessed-gem',  // 0x2024
  'x2-supreme-gem', 'x2-poison-fang', 'x2-silver-hourglass', 'x2-gold-hourglass',  // 0x2028
  'x2-candle-of-life', 'x2-farplane-shadow', 'x2-dark-matter', 'x2-chocobo-feather',  // 0x202c
  'x2-chocobo-wing', 'x2-lunar-curtain', 'x2-light-curtain', 'x2-star-curtain',  // 0x2030
  'x2-healing-spring', 'x2-mana-spring', 'x2-stamina-spring', 'x2-soul-spring',  // 0x2034
  'x2-dispel-tonic', 'x2-stamina-tablet', 'x2-mana-tablet', 'x2-stamina-tonic',  // 0x2038
  'x2-mana-tonic', 'x2-twin-stars', 'x2-three-stars', 'x2-hero-drink',  // 0x203c
  'x2-gysahl-greens', 'x2-sylkis-greens', 'x2-mimett-greens', 'x2-pahsana-greens',  // 0x2040
];

/** Our id of each of the 53 result rows by the game's command id; `../../../data/ffx2/abilities/mix-results.ts` defines the abilities and a test pins both lists to one another. */
export const MIX_RESULT_IDS: Readonly<Record<number, string>> = {
  0x3183: 'x2-mix-pineapple', // Pineapple
  0x3184: 'x2-mix-potato-masher', // Potato Masher
  0x3185: 'x2-mix-cluster-bomb', // Cluster Bomb
  0x3186: 'x2-mix-sunburst', // Sunburst
  0x3187: 'x2-mix-blaster-mine', // Blaster Mine
  0x3188: 'x2-mix-hazardous-shell', // Hazardous Shell
  0x3189: 'x2-mix-heat-blaster', // Heat Blaster
  0x318a: 'x2-mix-firestorm', // Firestorm
  0x318b: 'x2-mix-burning-soul', // Burning Soul
  0x318c: 'x2-mix-brimstone', // Brimstone
  0x318d: 'x2-mix-abaddon-flame', // Abaddon Flame
  0x318e: 'x2-mix-snow-flurry', // Snow Flurry
  0x318f: 'x2-mix-icefall', // Icefall
  0x3190: 'x2-mix-winter-storm', // Winter Storm
  0x3191: 'x2-mix-black-ice', // Black Ice
  0x3192: 'x2-mix-krysta', // Krysta
  0x3193: 'x2-mix-thunderbolt', // Thunderbolt
  0x3194: 'x2-mix-rolling-thunder', // Rolling Thunder
  0x3195: 'x2-mix-lightning-bolt', // Lightning Bolt
  0x3196: 'x2-mix-electroshock', // Electroshock
  0x3197: 'x2-mix-thunderblast', // Thunderblast
  0x3198: 'x2-mix-waterfall', // Waterfall
  0x3199: 'x2-mix-flash-flood', // Flash Flood
  0x319a: 'x2-mix-tidal-wave', // Tidal Wave
  0x319b: 'x2-mix-aqua-toxin', // Aqua Toxin
  0x319c: 'x2-mix-dark-rain', // Dark Rain
  0x319d: 'x2-mix-nega-burst', // Nega Burst
  0x319e: 'x2-mix-black-hole', // Black Hole
  0x319f: 'x2-mix-tallboy', // Tallboy
  0x31a0: 'x2-mix-grand-slam', // Grand Slam
  0x31a1: 'x2-mix-archangel', // Archangel
  0x31a2: 'x2-mix-white-hole', // White Hole
  0x31a3: 'x2-mix-remedy', // Remedy
  0x31a4: 'x2-mix-panacea', // Panacea
  0x31a5: 'x2-mix-ultra-cure', // Ultra Cure
  0x31a6: 'x2-mix-mega-phoenix', // Mega Phoenix
  0x31a7: 'x2-mix-final-phoenix', // Final Phoenix
  0x31a8: 'x2-mix-fantasy-phoenix', // Fantasy Phoenix
  0x31a9: 'x2-mix-hi-potion', // Hi-Potion
  0x31aa: 'x2-mix-mega-potion', // Mega-Potion
  0x31ab: 'x2-mix-ultra-potion', // Ultra Potion
  0x31ac: 'x2-mix-final-elixir', // Final Elixir
  0x31ae: 'x2-mix-chocobo-wing', // Chocobo Wing
  0x31af: 'x2-mix-soul-spring', // Soul Spring
  0x31b0: 'x2-mix-soul-sea', // Soul Sea
  0x31b1: 'x2-mix-wall', // Wall
  0x31b2: 'x2-mix-hi-wall', // Hi-Wall
  0x31b3: 'x2-mix-final-wall', // Final Wall
  0x31b4: 'x2-mix-mega-vitality', // Mega Vitality
  0x31b5: 'x2-mix-mega-cocktail', // Mega Cocktail
  0x31b6: 'x2-mix-mega-mana', // Mega Mana
  0x31b7: 'x2-mix-hero-drink', // Hero Drink
  0x31b8: 'x2-mix-miracle-drink', // Miracle Drink
};

const ITEM_NUMBER: ReadonlyMap<string, number> = new Map(MIX_ITEM_IDS.map((id, row) => [id, 0x2000 + row]));

/** The game's number (`0x2000 + row`) of one of our item ids, or undefined for an id that is not one of the 68. */
export function mixItemNumber(itemId: string): number | undefined {
  return ITEM_NUMBER.get(itemId);
}

/** What a Mix command makes: the two ingredients in the order picked, the result row, and the result as an ability of ours. */
export interface MixPlan {
  ingredients: readonly [ItemId, ItemId];
  /** The game's result row, 0x3183 to 0x31B8. */
  command: number;
  ability: AbilityDef;
}

/**
 * The plan of a Mix command, or undefined when it is not one: any other command, a Mix with no `rikku-mix` outcome or without two ingredients the table names, or a result the
 * registry does not hold (the bare Mix of before then runs). Pure: draws nothing.
 */
export function mixPlanOf(abilities: AbilityRegistry, command: Command): MixPlan | undefined {
  if (command.kind !== 'ability' || command.id !== MIX_COMMAND_ID) return undefined;
  const extra = command.extra;
  if (extra === undefined || extra.kind !== 'rikku-mix') return undefined;
  const picks = extra.mix?.ingredients;
  if (!Array.isArray(picks) || picks.length < 2) return undefined;
  const [first, second] = picks as [unknown, unknown];
  if (typeof first !== 'string' || typeof second !== 'string') return undefined;
  const a = mixItemNumber(first);
  const b = mixItemNumber(second);
  if (a === undefined || b === undefined) return undefined;
  const result = mixRecipe(a, b);
  const id = MIX_RESULT_IDS[result];
  const ability = id === undefined ? undefined : abilities.get(id);
  return ability === undefined ? undefined : { ingredients: [first, second], command: result, ability };
}

/**
 * What a picker shows after the second pick (the game's HUD writes the result row into the top of its menu and opens that row's own target selection): the result row and our id for
 * picking `first` and then `second`, or undefined for an id that is not one of the game's 68 items. Pure; the order matters.
 */
export function mixPreview(first: ItemId, second: ItemId): { command: number; abilityId: string } | undefined {
  const a = mixItemNumber(first);
  const b = mixItemNumber(second);
  if (a === undefined || b === undefined) return undefined;
  const command = mixRecipe(a, b);
  const abilityId = MIX_RESULT_IDS[command];
  return abilityId === undefined ? undefined : { command, abilityId };
}

/**
 * True when the command needs stock the party no longer has: an item the reserved stock cannot give, or a Mix whose ingredients it cannot (the same item twice needs two). The menus
 * read the reserved stock and grey such a pick out; this is the net for a menu built before another girl's pick, which `submit` refuses with the turn unspent.
 */
export function stockShort(flags: Readonly<Record<string, unknown>>, abilities: AbilityRegistry, command: Command): boolean {
  const plan = mixPlanOf(abilities, command);
  if (plan !== undefined) return !ingredientsAvailable(flags, plan.ingredients);
  return command.kind === 'item' && !itemAvailable(flags, command.id);
}
