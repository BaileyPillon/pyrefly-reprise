/**
 * The 53 FFX-2 Mix results as abilities of ours (re-parity RC9, lane X2-G; **FFX-2 only**). One per result row of `../command-records/mix.ts`, in our ids (`x2-mix-<name>`);
 * the Alchemist's Mix (`x2-alchemist-mix`) turns the two items it is given into one of these (`src/battle/ffx2/kernel/mix-recipe.ts`, `adapt/mix.ts`). Numbers from the rows,
 * names by position from the research table (`research/ffx2-combat-core.md` §3.11 Step 4, [I]); [verified: the game's own table for every number, §4.4 of the note FFX2-G06].
 *
 * **Presentation: no new art** (addendum Q16 as D-767 did for FFX). A result borrows the nearest effect family the spell layer already draws, by the rules it applies to any ability
 * (`src/engine/spellfx/SpellFxRegistry.ts#resolveSpellFx`): an element draws its own element (fire, ice, thunder, water, holy), a healing result the Cure motes, everything else
 * (the grenade line, the Gravity line, the walls and drinks) the tinted bloom a Grenade already draws. `extra.fxFamily` names the family so a test can pin it; nothing else
 * reads it. Gravity has no element effect in the layer and draws the bloom: a look for it is the driver's step two, with the picker.
 *
 * The fields mirror the row so the engine's own derivation agrees with it where it reads them (`damageType` stays `other`, as the Grenade item's does, so the grenade line
 * is not drawn as a slash; the kernels read the row's flags, which say physical for the grenade line). The charge and recovery values are the row's own cast cost (80) and
 * ATB cost (0). Never listed on a ladder, so no menu offers one: a Mix is the only way to make one.
 */

import type { AbilityDef, ElementId, StatusApplication, StatusId, Targeting } from '../../../battle/common/types.ts';

interface MixSpec {
  power: number;
  formula: AbilityDef['formula'];
  element: ElementId[];
  targeting: Targeting;
  hits: number;
  statusEffects?: StatusApplication[];
  removesStatuses?: StatusId[];
  flags: AbilityDef['flags'];
  shatterChance?: number;
  /** The existing spell effect this result is drawn with. */
  fx: 'fire' | 'ice' | 'thunder' | 'water' | 'holy' | 'cure' | 'bloom';
}

function mix(id: string, name: string, spec: MixSpec): AbilityDef {
  return {
    id,
    name,
    game: 'ffx2',
    category: 'item',
    mpCost: 0,
    chargeTicks: 80, // the row's cast cost (Cmd+0x24); the record's costCast is what the engine reads
    recoveryTicks: 0, // the row's ATB cost (Cmd+0x22)
    power: spec.power,
    formula: spec.formula,
    damageType: 'other',
    element: spec.element.length > 0 ? spec.element : ['none'],
    targeting: spec.targeting,
    hits: spec.hits,
    statusEffects: spec.statusEffects ?? [],
    removesStatuses: spec.removesStatuses ?? [],
    flags: spec.flags,
    ...(spec.shatterChance !== undefined ? { shatterChance: spec.shatterChance } : {}),
    messageTemplate: '{user} mixes {ability}',
    extra: { mixResult: true, fxFamily: spec.fx },
  };
}

export const mixResultAbilities: AbilityDef[] = [
  // 0x3183: all-enemies, fixed 3; effect: bloom
  mix('x2-mix-pineapple', 'Pineapple', {
    power: 3, formula: 'fixed', element: [], targeting: 'all-enemies', hits: 1,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x3184: all-enemies, fixed 14; effect: bloom
  mix('x2-mix-potato-masher', 'Potato Masher', {
    power: 14, formula: 'fixed', element: [], targeting: 'all-enemies', hits: 1,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x3185: all-enemies, fixed 30; effect: bloom
  mix('x2-mix-cluster-bomb', 'Cluster Bomb', {
    power: 30, formula: 'fixed', element: [], targeting: 'all-enemies', hits: 1,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x3186: all-enemies, fixed 110; effect: bloom
  mix('x2-mix-sunburst', 'Sunburst', {
    power: 110, formula: 'fixed', element: [], targeting: 'all-enemies', hits: 1,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x3187: all-enemies, fixed 4; effect: bloom
  mix('x2-mix-blaster-mine', 'Blaster Mine', {
    power: 4, formula: 'fixed', element: [], targeting: 'all-enemies', hits: 1,
    statusEffects: [{ status: 'poison', chance: 80, duration: 255 }, { status: 'confuse', chance: 80, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x3188: all-enemies, fixed 20; effect: bloom
  mix('x2-mix-hazardous-shell', 'Hazardous Shell', {
    power: 20, formula: 'fixed', element: [], targeting: 'all-enemies', hits: 1,
    statusEffects: [{ status: 'poison', chance: 80, duration: 255 }, { status: 'confuse', chance: 80, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x3189: random-enemy, fixed 2 x 3, fire; effect: fire
  mix('x2-mix-heat-blaster', 'Heat Blaster', {
    power: 2, formula: 'fixed', element: ['fire'], targeting: 'random-enemy', hits: 3,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'fire',
  }),
  // 0x318a: random-enemy, fixed 4 x 3, fire; effect: fire
  mix('x2-mix-firestorm', 'Firestorm', {
    power: 4, formula: 'fixed', element: ['fire'], targeting: 'random-enemy', hits: 3,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'fire',
  }),
  // 0x318b: random-enemy, fixed 8 x 4, fire; effect: fire
  mix('x2-mix-burning-soul', 'Burning Soul', {
    power: 8, formula: 'fixed', element: ['fire'], targeting: 'random-enemy', hits: 4,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'fire',
  }),
  // 0x318c: random-enemy, fixed 3 x 3, fire; effect: fire
  mix('x2-mix-brimstone', 'Brimstone', {
    power: 3, formula: 'fixed', element: ['fire'], targeting: 'random-enemy', hits: 3,
    statusEffects: [{ status: 'darkness', chance: 100, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'fire',
  }),
  // 0x318d: random-enemy, fixed 6 x 3, fire; effect: fire
  mix('x2-mix-abaddon-flame', 'Abaddon Flame', {
    power: 6, formula: 'fixed', element: ['fire'], targeting: 'random-enemy', hits: 3,
    statusEffects: [{ status: 'darkness', chance: 100, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'fire',
  }),
  // 0x318e: random-enemy, fixed 2 x 3, ice; effect: ice
  mix('x2-mix-snow-flurry', 'Snow Flurry', {
    power: 2, formula: 'fixed', element: ['ice'], targeting: 'random-enemy', hits: 3,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'ice',
  }),
  // 0x318f: random-enemy, fixed 4 x 3, ice; effect: ice
  mix('x2-mix-icefall', 'Icefall', {
    power: 4, formula: 'fixed', element: ['ice'], targeting: 'random-enemy', hits: 3,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'ice',
  }),
  // 0x3190: random-enemy, fixed 8 x 4, ice; effect: ice
  mix('x2-mix-winter-storm', 'Winter Storm', {
    power: 8, formula: 'fixed', element: ['ice'], targeting: 'random-enemy', hits: 4,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'ice',
  }),
  // 0x3191: random-enemy, fixed 3 x 3, ice; effect: ice
  mix('x2-mix-black-ice', 'Black Ice', {
    power: 3, formula: 'fixed', element: ['ice'], targeting: 'random-enemy', hits: 3,
    statusEffects: [{ status: 'sleep', chance: 100, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'ice',
  }),
  // 0x3192: random-enemy, fixed 6 x 3, ice; effect: ice
  mix('x2-mix-krysta', 'Krysta', {
    power: 6, formula: 'fixed', element: ['ice'], targeting: 'random-enemy', hits: 3,
    statusEffects: [{ status: 'sleep', chance: 100, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'ice',
  }),
  // 0x3193: random-enemy, fixed 2 x 3, lightning; effect: thunder
  mix('x2-mix-thunderbolt', 'Thunderbolt', {
    power: 2, formula: 'fixed', element: ['lightning'], targeting: 'random-enemy', hits: 3,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'thunder',
  }),
  // 0x3194: random-enemy, fixed 4 x 3, lightning; effect: thunder
  mix('x2-mix-rolling-thunder', 'Rolling Thunder', {
    power: 4, formula: 'fixed', element: ['lightning'], targeting: 'random-enemy', hits: 3,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'thunder',
  }),
  // 0x3195: random-enemy, fixed 8 x 4, lightning; effect: thunder
  mix('x2-mix-lightning-bolt', 'Lightning Bolt', {
    power: 8, formula: 'fixed', element: ['lightning'], targeting: 'random-enemy', hits: 4,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'thunder',
  }),
  // 0x3196: random-enemy, fixed 3 x 3, lightning; effect: thunder
  mix('x2-mix-electroshock', 'Electroshock', {
    power: 3, formula: 'fixed', element: ['lightning'], targeting: 'random-enemy', hits: 3,
    statusEffects: [{ status: 'petrify', chance: 80, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'thunder',
  }),
  // 0x3197: random-enemy, fixed 6 x 3, lightning; effect: thunder
  mix('x2-mix-thunderblast', 'Thunderblast', {
    power: 6, formula: 'fixed', element: ['lightning'], targeting: 'random-enemy', hits: 3,
    statusEffects: [{ status: 'petrify', chance: 80, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'thunder',
  }),
  // 0x3198: random-enemy, fixed 2 x 3, water; effect: water
  mix('x2-mix-waterfall', 'Waterfall', {
    power: 2, formula: 'fixed', element: ['water'], targeting: 'random-enemy', hits: 3,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'water',
  }),
  // 0x3199: random-enemy, fixed 4 x 3, water; effect: water
  mix('x2-mix-flash-flood', 'Flash Flood', {
    power: 4, formula: 'fixed', element: ['water'], targeting: 'random-enemy', hits: 3,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'water',
  }),
  // 0x319a: random-enemy, fixed 8 x 4, water; effect: water
  mix('x2-mix-tidal-wave', 'Tidal Wave', {
    power: 8, formula: 'fixed', element: ['water'], targeting: 'random-enemy', hits: 4,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'water',
  }),
  // 0x319b: random-enemy, fixed 3 x 3, water; effect: water
  mix('x2-mix-aqua-toxin', 'Aqua Toxin', {
    power: 3, formula: 'fixed', element: ['water'], targeting: 'random-enemy', hits: 3,
    statusEffects: [{ status: 'silence', chance: 100, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'water',
  }),
  // 0x319c: random-enemy, fixed 6 x 3, water; effect: water
  mix('x2-mix-dark-rain', 'Dark Rain', {
    power: 6, formula: 'fixed', element: ['water'], targeting: 'random-enemy', hits: 3,
    statusEffects: [{ status: 'silence', chance: 100, duration: 255 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'water',
  }),
  // 0x319d: all-enemies, percent-current 8, gravity; effect: bloom
  mix('x2-mix-nega-burst', 'Nega Burst', {
    power: 8, formula: 'percent-current', element: ['gravity'], targeting: 'all-enemies', hits: 1,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x319e: all-enemies, percent-current 12, gravity; effect: bloom
  mix('x2-mix-black-hole', 'Black Hole', {
    power: 12, formula: 'percent-current', element: ['gravity'], targeting: 'all-enemies', hits: 1,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x319f: all-enemies, percent-current 8, gravity; effect: bloom
  mix('x2-mix-tallboy', 'Tallboy', {
    power: 8, formula: 'percent-current', element: ['gravity'], targeting: 'all-enemies', hits: 1,
    statusEffects: [{ status: 'def-down', chance: 254, duration: 0, stacks: 3 }, { status: 'mdef-down', chance: 254, duration: 0, stacks: 3 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x31a0: all-enemies, percent-current 12, gravity; effect: bloom
  mix('x2-mix-grand-slam', 'Grand Slam', {
    power: 12, formula: 'percent-current', element: ['gravity'], targeting: 'all-enemies', hits: 1,
    statusEffects: [{ status: 'def-down', chance: 254, duration: 0, stacks: 5 }, { status: 'mdef-down', chance: 254, duration: 0, stacks: 5 }],
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'bloom',
  }),
  // 0x31a1: single-enemy, fixed 1 x 8, holy; effect: holy
  mix('x2-mix-archangel', 'Archangel', {
    power: 1, formula: 'fixed', element: ['holy'], targeting: 'single-enemy', hits: 8,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'holy',
  }),
  // 0x31a2: single-enemy, fixed 12 x 8, holy; effect: holy
  mix('x2-mix-white-hole', 'White Hole', {
    power: 12, formula: 'fixed', element: ['holy'], targeting: 'single-enemy', hits: 8,
    flags: ['never-break-damage-limit', 'shatter'], shatterChance: 100, fx: 'holy',
  }),
  // 0x31a3: single-ally, no damage; effect: bloom
  mix('x2-mix-remedy', 'Remedy', {
    power: 0, formula: 'none', element: [], targeting: 'single-ally', hits: 1,
    removesStatuses: ['petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'pointless', 'itchy', 'slow', 'stop'],
    flags: ['removes-statuses', 'never-break-damage-limit'], fx: 'bloom',
  }),
  // 0x31a4: all-allies, no damage; effect: bloom
  mix('x2-mix-panacea', 'Panacea', {
    power: 0, formula: 'none', element: [], targeting: 'all-allies', hits: 1,
    removesStatuses: ['petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'pointless', 'itchy', 'slow', 'stop'],
    flags: ['removes-statuses', 'never-break-damage-limit'], fx: 'bloom',
  }),
  // 0x31a5: all-allies, percent-total 8; effect: cure
  mix('x2-mix-ultra-cure', 'Ultra Cure', {
    power: 8, formula: 'percent-total', element: [], targeting: 'all-allies', hits: 1,
    removesStatuses: ['petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'pointless', 'itchy', 'slow', 'stop'],
    flags: ['heals', 'removes-statuses', 'never-break-damage-limit'], fx: 'cure',
  }),
  // 0x31a6: all-allies, percent-total 4; effect: cure
  mix('x2-mix-mega-phoenix', 'Mega Phoenix', {
    power: 4, formula: 'percent-total', element: [], targeting: 'all-allies', hits: 1,
    removesStatuses: ['ko'],
    flags: ['heals', 'removes-statuses', 'never-break-damage-limit', 'can-target-dead', 'misses-if-target-alive'], fx: 'cure',
  }),
  // 0x31a7: all-allies, percent-total 16; effect: cure
  mix('x2-mix-final-phoenix', 'Final Phoenix', {
    power: 16, formula: 'percent-total', element: [], targeting: 'all-allies', hits: 1,
    removesStatuses: ['ko'],
    flags: ['heals', 'removes-statuses', 'never-break-damage-limit', 'can-target-dead', 'misses-if-target-alive'], fx: 'cure',
  }),
  // 0x31a8: all-allies, percent-total 16; effect: cure
  mix('x2-mix-fantasy-phoenix', 'Fantasy Phoenix', {
    power: 16, formula: 'percent-total', element: [], targeting: 'all-allies', hits: 1,
    removesStatuses: ['ko'],
    flags: ['heals', 'removes-statuses', 'never-break-damage-limit', 'can-target-dead'], fx: 'cure',
  }),
  // 0x31a9: single-ally, fixed-no-variance 20; effect: cure
  mix('x2-mix-hi-potion', 'Hi-Potion', {
    power: 20, formula: 'fixed-no-variance', element: [], targeting: 'single-ally', hits: 1,
    flags: ['heals'], fx: 'cure',
  }),
  // 0x31aa: all-allies, fixed-no-variance 40; effect: cure
  mix('x2-mix-mega-potion', 'Mega-Potion', {
    power: 40, formula: 'fixed-no-variance', element: [], targeting: 'all-allies', hits: 1,
    flags: ['heals'], fx: 'cure',
  }),
  // 0x31ab: all-allies, percent-total 16; effect: cure
  mix('x2-mix-ultra-potion', 'Ultra Potion', {
    power: 16, formula: 'percent-total', element: [], targeting: 'all-allies', hits: 1,
    flags: ['heals'], fx: 'cure',
  }),
  // 0x31ac: all-allies, percent-total 16; effect: cure
  mix('x2-mix-final-elixir', 'Final Elixir', {
    power: 16, formula: 'percent-total', element: [], targeting: 'all-allies', hits: 1,
    removesStatuses: ['petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'pointless', 'itchy', 'slow', 'stop'],
    flags: ['heals', 'removes-statuses', 'never-break-damage-limit'], fx: 'cure',
  }),
  // 0x31ae: all-allies, no damage; effect: bloom
  mix('x2-mix-chocobo-wing', 'Chocobo Wing', {
    power: 0, formula: 'none', element: [], targeting: 'all-allies', hits: 1,
    statusEffects: [{ status: 'haste', chance: 254, duration: 120 }],
    flags: [], fx: 'bloom',
  }),
  // 0x31af: single-enemy, percent-total 3; effect: bloom
  mix('x2-mix-soul-spring', 'Soul Spring', {
    power: 3, formula: 'percent-total', element: [], targeting: 'single-enemy', hits: 1,
    flags: ['drains'], fx: 'bloom',
  }),
  // 0x31b0: single-enemy, percent-total 6; effect: bloom
  mix('x2-mix-soul-sea', 'Soul Sea', {
    power: 6, formula: 'percent-total', element: [], targeting: 'single-enemy', hits: 1,
    flags: ['drains'], fx: 'bloom',
  }),
  // 0x31b1: all-allies, no damage; effect: bloom
  mix('x2-mix-wall', 'Wall', {
    power: 0, formula: 'none', element: [], targeting: 'all-allies', hits: 1,
    statusEffects: [{ status: 'shell', chance: 254, duration: 100 }, { status: 'protect', chance: 254, duration: 100 }],
    flags: [], fx: 'bloom',
  }),
  // 0x31b2: all-allies, no damage; effect: bloom
  mix('x2-mix-hi-wall', 'Hi-Wall', {
    power: 0, formula: 'none', element: [], targeting: 'all-allies', hits: 1,
    statusEffects: [{ status: 'shell', chance: 254, duration: 100 }, { status: 'protect', chance: 254, duration: 100 }, { status: 'reflect', chance: 254, duration: 100 }],
    flags: [], fx: 'bloom',
  }),
  // 0x31b3: all-allies, no damage; effect: bloom
  mix('x2-mix-final-wall', 'Final Wall', {
    power: 0, formula: 'none', element: [], targeting: 'all-allies', hits: 1,
    statusEffects: [{ status: 'shell', chance: 254, duration: 100 }, { status: 'protect', chance: 254, duration: 100 }, { status: 'reflect', chance: 254, duration: 100 }, { status: 'haste', chance: 254, duration: 100 }],
    flags: [], fx: 'bloom',
  }),
  // 0x31b4: all-allies, percent-current 16; effect: cure
  mix('x2-mix-mega-vitality', 'Mega Vitality', {
    power: 16, formula: 'percent-current', element: [], targeting: 'all-allies', hits: 1,
    statusEffects: [{ status: 'max-hp-x2', chance: 254, duration: 0 }],
    flags: ['heals'], fx: 'cure',
  }),
  // 0x31b5: all-allies, percent-current 16; effect: cure
  mix('x2-mix-mega-cocktail', 'Mega Cocktail', {
    power: 16, formula: 'percent-current', element: [], targeting: 'all-allies', hits: 1,
    statusEffects: [{ status: 'max-hp-x2', chance: 254, duration: 0 }, { status: 'max-mp-x2', chance: 254, duration: 0 }],
    flags: ['heals'], fx: 'cure',
  }),
  // 0x31b6: all-allies, percent-current 16; effect: cure
  mix('x2-mix-mega-mana', 'Mega Mana', {
    power: 16, formula: 'percent-current', element: [], targeting: 'all-allies', hits: 1,
    statusEffects: [{ status: 'max-mp-x2', chance: 254, duration: 0 }],
    flags: ['heals'], fx: 'cure',
  }),
  // 0x31b7: single-ally, no damage; effect: bloom
  mix('x2-mix-hero-drink', 'Hero Drink', {
    power: 0, formula: 'none', element: [], targeting: 'single-ally', hits: 1,
    statusEffects: [{ status: 'invincible', chance: 254, duration: 15 }],
    flags: [], fx: 'bloom',
  }),
  // 0x31b8: all-allies, no damage; effect: bloom
  mix('x2-mix-miracle-drink', 'Miracle Drink', {
    power: 0, formula: 'none', element: [], targeting: 'all-allies', hits: 1,
    statusEffects: [{ status: 'invincible', chance: 254, duration: 15 }],
    flags: [], fx: 'bloom',
  }),
];

export default mixResultAbilities;
