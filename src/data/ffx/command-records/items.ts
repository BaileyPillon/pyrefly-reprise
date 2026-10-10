/**
 * The game's own command records for the FFX **item** effects (record ids 0x2000 + n, the item table), keyed by
 * the item's effect-ability id. Re-parity W1; FFX only.
 *
 * Source: the game's battle kernel tables, FFX Steam HD build 25501027 (item.bin, 112 records), read field by field
 * (research/re-ffx-commands.md section 1); numbers only, no game code. The five fields are the ones the damage,
 * hit and critical kernels read that an ability's own fields do not carry (see `FFXCommandRecord`).
 */

import type { FFXCommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_ITEMS: Readonly<Record<string, FFXCommandRecord>> = {
  'potion': { id: 0x2000, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 1 }, // Potion
  'hi-potion': { id: 0x2001, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 1 }, // Hi Potion
  'x-potion': { id: 0x2002, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 1 }, // X Potion
  'mega-potion': { id: 0x2003, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 1 }, // Mega Potion
  'ether': { id: 0x2004, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 2 }, // Ether
  'turbo-ether': { id: 0x2005, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 2 }, // Turbo Ether
  'elixir': { id: 0x2008, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 3 }, // Elixir
  'megalixir': { id: 0x2009, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 3 }, // Megalixir
  'phoenix-down': { id: 0x2006, type: 0, flagsMisc: 0x810006, flagsDamage: 0x70, damageClass: 1 }, // Phoenix Down
  'mega-phoenix': { id: 0x2007, type: 0, flagsMisc: 0x810006, flagsDamage: 0x70, damageClass: 1 }, // Mega Phoenix
  'al-bhed-potion': { id: 0x2014, type: 0, flagsMisc: 0x10406, flagsDamage: 0x70, damageClass: 1 }, // Al Bhed Potion
  'healing-water': { id: 0x2015, type: 0, flagsMisc: 0x10406, flagsDamage: 0x50, damageClass: 1 }, // Healing Water
  'tetra-elemental': { id: 0x2016, type: 0, flagsMisc: 0x10406, flagsDamage: 0x50, damageClass: 1 }, // Tetra Elemental
  'antidote': { id: 0x200a, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0 }, // Antidote
  'soft': { id: 0x200b, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0 }, // Soft
  'eye-drops': { id: 0x200c, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0 }, // Eye Drops
  'echo-screen': { id: 0x200d, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0 }, // Echo Screen
  'holy-water': { id: 0x200e, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0 }, // Holy Water
  'remedy': { id: 0x200f, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0 }, // Remedy
  'chocobo-feather': { id: 0x2036, type: 0, flagsMisc: 0x10406, flagsDamage: 0x50, damageClass: 4 }, // Chocobo Feather
  'chocobo-wing': { id: 0x2037, type: 0, flagsMisc: 0x10406, flagsDamage: 0x50, damageClass: 4 }, // Chocobo Wing
  'lunar-curtain': { id: 0x2038, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Lunar Curtain
  'light-curtain': { id: 0x2039, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Light Curtain
  'star-curtain': { id: 0x203a, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Star Curtain
  'healing-spring': { id: 0x203b, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Healing Spring
  'stamina-tablet': { id: 0x2040, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Stamina Tablet
  'mana-tablet': { id: 0x2041, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Mana Tablet
  'twin-stars': { id: 0x2042, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Twin Stars
  'stamina-tonic': { id: 0x2043, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Stamina Tonic
  'mana-tonic': { id: 0x2044, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Mana Tonic
  'three-stars': { id: 0x2045, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Three Stars
  'candle-of-life': { id: 0x2030, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Candle of Life
  'power-distiller': { id: 0x2010, type: 0, flagsMisc: 0x10006, flagsDamage: 0x40, damageClass: 0 }, // Power Distiller
  'mana-distiller': { id: 0x2011, type: 0, flagsMisc: 0x10006, flagsDamage: 0x40, damageClass: 0 }, // Mana Distiller
  'speed-distiller': { id: 0x2012, type: 0, flagsMisc: 0x10006, flagsDamage: 0x40, damageClass: 0 }, // Speed Distiller
  'ability-distiller': { id: 0x2013, type: 0, flagsMisc: 0x10006, flagsDamage: 0x40, damageClass: 0 }, // Ability Distiller
  'grenade': { id: 0x2023, type: 0, flagsMisc: 0x10406, flagsDamage: 0x44, damageClass: 1 }, // Grenade
  'frag-grenade': { id: 0x2024, type: 0, flagsMisc: 0x10406, flagsDamage: 0x44, damageClass: 1 }, // Frag Grenade
  'sleeping-powder': { id: 0x2025, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Sleeping Powder
  'dream-powder': { id: 0x2026, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Dream Powder
  'silence-grenade': { id: 0x2027, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Silence Grenade
  'smoke-bomb': { id: 0x2028, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Smoke Bomb
  'petrify-grenade': { id: 0x2031, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Petrify Grenade
  'poison-fang': { id: 0x202d, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Poison Fang
  'antarctic-wind': { id: 0x2017, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Antarctic Wind
  'bomb-fragment': { id: 0x201a, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Bomb Fragment
  'electro-marble': { id: 0x201d, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Electro Marble
  'fish-scale': { id: 0x2020, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Fish Scale
  'arctic-wind': { id: 0x2018, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Arctic Wind
  'bomb-core': { id: 0x201b, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Bomb Core
  'lightning-marble': { id: 0x201e, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Lightning Marble
  'dragon-scale': { id: 0x2021, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Dragon Scale
  'ice-gem': { id: 0x2019, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 1 }, // Ice Gem
  'fire-gem': { id: 0x201c, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 1 }, // Fire Gem
  'lightning-gem': { id: 0x201f, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 1 }, // Lightning Gem
  'water-gem': { id: 0x2022, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 1 }, // Water Gem
  'shadow-gem': { id: 0x2029, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Shadow Gem
  'shining-gem': { id: 0x202a, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Shining Gem
  'blessed-gem': { id: 0x202b, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Blessed Gem
  'supreme-gem': { id: 0x202c, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1 }, // Supreme Gem
  'purifying-salt': { id: 0x203f, type: 0, flagsMisc: 0x10406, flagsDamage: 0x60, damageClass: 1 }, // Purifying Salt
  'silver-hourglass': { id: 0x202e, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 4 }, // Silver Hourglass
  'gold-hourglass': { id: 0x202f, type: 0, flagsMisc: 0x12406, flagsDamage: 0x40, damageClass: 1 }, // Gold Hourglass
  'farplane-shadow': { id: 0x2032, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0 }, // Farplane Shadow
  'farplane-wind': { id: 0x2033, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 0 }, // Farplane Wind
  'mana-spring': { id: 0x203c, type: 0, flagsMisc: 0x10506, flagsDamage: 0x40, damageClass: 2 }, // Mana Spring
  'stamina-spring': { id: 0x203d, type: 0, flagsMisc: 0x10506, flagsDamage: 0x40, damageClass: 1 }, // Stamina Spring
  'soul-spring': { id: 0x203e, type: 0, flagsMisc: 0x10506, flagsDamage: 0x40, damageClass: 3 }, // Soul Spring
  'dark-matter': { id: 0x2035, type: 0, flagsMisc: 0x10406, flagsDamage: 0x80, damageClass: 1 }, // Dark Matter
  'hp-sphere': { id: 0x2055, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0 }, // HP Sphere
  'return-sphere': { id: 0x2060, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0 }, // Return Sphere
  'mp-sphere': { id: 0x2056, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0 }, // MP Sphere
  'ability-sphere': { id: 0x2049, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0 }, // Ability Sphere
  'blk-magic-sphere': { id: 0x204f, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0 }, // Blk Magic Sphere
  'special-sphere': { id: 0x204c, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0 }, // Special Sphere
  'lv-1-key-sphere': { id: 0x2051, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0 }, // Lv. 1 Key Sphere (the id 81 the Gui note names)
  'lv-3-key-sphere': { id: 0x2053, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0 }, // Lv. 3 Key Sphere
  'lv-4-key-sphere': { id: 0x2054, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0 }, // Lv. 4 Key Sphere
};
