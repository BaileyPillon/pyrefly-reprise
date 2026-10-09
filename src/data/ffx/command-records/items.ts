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
  'potion': { id: 0x2000, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 1, rank: 2 }, // Potion
  'hi-potion': { id: 0x2001, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 1, rank: 2 }, // Hi Potion
  'x-potion': { id: 0x2002, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 1, rank: 2 }, // X Potion
  'mega-potion': { id: 0x2003, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 1, rank: 2 }, // Mega Potion
  'ether': { id: 0x2004, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 2, rank: 2 }, // Ether
  'turbo-ether': { id: 0x2005, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 2, rank: 2 }, // Turbo Ether
  'elixir': { id: 0x2008, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 3, rank: 2 }, // Elixir
  'megalixir': { id: 0x2009, type: 0, flagsMisc: 0x10007, flagsDamage: 0x50, damageClass: 3, rank: 2 }, // Megalixir
  'phoenix-down': { id: 0x2006, type: 0, flagsMisc: 0x810006, flagsDamage: 0x70, damageClass: 1, rank: 2, chances: [[0, 254]] }, // Phoenix Down
  'mega-phoenix': { id: 0x2007, type: 0, flagsMisc: 0x810006, flagsDamage: 0x70, damageClass: 1, rank: 2, chances: [[0, 254]] }, // Mega Phoenix
  'al-bhed-potion': { id: 0x2014, type: 0, flagsMisc: 0x10406, flagsDamage: 0x70, damageClass: 1, rank: 2, chances: [[2, 254], [3, 254], [13, 254]], durations: [[1, 254]] }, // Al Bhed Potion
  'healing-water': { id: 0x2015, type: 0, flagsMisc: 0x10406, flagsDamage: 0x50, damageClass: 1, rank: 2 }, // Healing Water
  'tetra-elemental': { id: 0x2016, type: 0, flagsMisc: 0x10406, flagsDamage: 0x50, damageClass: 1, rank: 2, chances: [[18, 254], [19, 254], [20, 254], [21, 254]], durations: [[6, 1], [7, 1], [8, 1], [9, 1]] }, // Tetra Elemental
  'antidote': { id: 0x200a, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0, rank: 2, chances: [[3, 254]] }, // Antidote
  'soft': { id: 0x200b, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0, rank: 2, chances: [[2, 254]] }, // Soft
  'eye-drops': { id: 0x200c, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0, rank: 2, chances: [[14, 254]], durations: [[2, 254]] }, // Eye Drops
  'echo-screen': { id: 0x200d, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0, rank: 2, chances: [[13, 254]], durations: [[1, 254]] }, // Echo Screen
  'holy-water': { id: 0x200e, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0, rank: 2, chances: [[1, 254]], extra: 0x400 }, // Holy Water
  'remedy': { id: 0x200f, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0, rank: 2, chances: [[1, 254], [2, 254], [3, 254], [8, 254], [9, 254], [12, 254], [13, 254], [14, 254], [24, 254]], durations: [[0, 254], [1, 254], [2, 254], [12, 254]] }, // Remedy
  'chocobo-feather': { id: 0x2036, type: 0, flagsMisc: 0x10406, flagsDamage: 0x50, damageClass: 4, rank: 2, chances: [[23, 254]], durations: [[11, 254]] }, // Chocobo Feather
  'chocobo-wing': { id: 0x2037, type: 0, flagsMisc: 0x10406, flagsDamage: 0x50, damageClass: 4, rank: 2, chances: [[23, 254]], durations: [[11, 254]] }, // Chocobo Wing
  'lunar-curtain': { id: 0x2038, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, chances: [[15, 254]], durations: [[3, 254]] }, // Lunar Curtain
  'light-curtain': { id: 0x2039, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, chances: [[16, 254]], durations: [[4, 254]] }, // Light Curtain
  'star-curtain': { id: 0x203a, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, chances: [[17, 254]], durations: [[5, 254]] }, // Star Curtain
  'healing-spring': { id: 0x203b, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, chances: [[22, 254]], durations: [[10, 10]] }, // Healing Spring
  'stamina-tablet': { id: 0x2040, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, buff: 0x1 }, // Stamina Tablet
  'mana-tablet': { id: 0x2041, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, buff: 0x2 }, // Mana Tablet
  'twin-stars': { id: 0x2042, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, buff: 0x4 }, // Twin Stars
  'stamina-tonic': { id: 0x2043, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, buff: 0x1 }, // Stamina Tonic
  'mana-tonic': { id: 0x2044, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, buff: 0x2 }, // Mana Tonic
  'three-stars': { id: 0x2045, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, buff: 0x4 }, // Three Stars
  'candle-of-life': { id: 0x2030, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, extra: 0x4000 }, // Candle of Life
  'power-distiller': { id: 0x2010, type: 0, flagsMisc: 0x10006, flagsDamage: 0x40, damageClass: 0, rank: 2, extra: 0x2 }, // Power Distiller
  'mana-distiller': { id: 0x2011, type: 0, flagsMisc: 0x10006, flagsDamage: 0x40, damageClass: 0, rank: 2, extra: 0x4 }, // Mana Distiller
  'speed-distiller': { id: 0x2012, type: 0, flagsMisc: 0x10006, flagsDamage: 0x40, damageClass: 0, rank: 2, extra: 0x8 }, // Speed Distiller
  'ability-distiller': { id: 0x2013, type: 0, flagsMisc: 0x10006, flagsDamage: 0x40, damageClass: 0, rank: 2, extra: 0x20 }, // Ability Distiller
  'grenade': { id: 0x2023, type: 0, flagsMisc: 0x10406, flagsDamage: 0x44, damageClass: 1, shatter: 50, rank: 2 }, // Grenade
  'frag-grenade': { id: 0x2024, type: 0, flagsMisc: 0x10406, flagsDamage: 0x44, damageClass: 1, shatter: 50, rank: 2, chances: [[6, 254]] }, // Frag Grenade
  'sleeping-powder': { id: 0x2025, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 30, rank: 2, chances: [[12, 254]], durations: [[0, 5]] }, // Sleeping Powder
  'dream-powder': { id: 0x2026, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 30, rank: 2, chances: [[12, 254]], durations: [[0, 8]] }, // Dream Powder
  'silence-grenade': { id: 0x2027, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 30, rank: 2, chances: [[13, 254]], durations: [[1, 8]] }, // Silence Grenade
  'smoke-bomb': { id: 0x2028, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 30, rank: 2, chances: [[14, 254]], durations: [[2, 8]] }, // Smoke Bomb
  'petrify-grenade': { id: 0x2031, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, chances: [[2, 254]] }, // Petrify Grenade
  'poison-fang': { id: 0x202d, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 60, rank: 2, chances: [[3, 254]] }, // Poison Fang
  'antarctic-wind': { id: 0x2017, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 30, rank: 2 }, // Antarctic Wind
  'bomb-fragment': { id: 0x201a, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 30, rank: 2 }, // Bomb Fragment
  'electro-marble': { id: 0x201d, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 30, rank: 2 }, // Electro Marble
  'fish-scale': { id: 0x2020, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 30, rank: 2 }, // Fish Scale
  'arctic-wind': { id: 0x2018, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 50, rank: 2 }, // Arctic Wind
  'bomb-core': { id: 0x201b, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 50, rank: 2 }, // Bomb Core
  'lightning-marble': { id: 0x201e, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 50, rank: 2 }, // Lightning Marble
  'dragon-scale': { id: 0x2021, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 50, rank: 2 }, // Dragon Scale
  'ice-gem': { id: 0x2019, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 1, shatter: 70, rank: 2 }, // Ice Gem
  'fire-gem': { id: 0x201c, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 1, shatter: 70, rank: 2 }, // Fire Gem
  'lightning-gem': { id: 0x201f, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 1, shatter: 70, rank: 2 }, // Lightning Gem
  'water-gem': { id: 0x2022, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 1, shatter: 70, rank: 2 }, // Water Gem
  'shadow-gem': { id: 0x2029, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 50, rank: 2 }, // Shadow Gem
  'shining-gem': { id: 0x202a, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 100, rank: 2 }, // Shining Gem
  'blessed-gem': { id: 0x202b, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 100, rank: 2 }, // Blessed Gem
  'supreme-gem': { id: 0x202c, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 1, shatter: 100, rank: 2 }, // Supreme Gem
  'purifying-salt': { id: 0x203f, type: 0, flagsMisc: 0x10406, flagsDamage: 0x60, damageClass: 1, shatter: 10, rank: 2, chances: [[15, 254], [16, 254], [17, 254], [18, 254], [19, 254], [20, 254], [21, 254], [22, 254], [23, 254]], durations: [[3, 254], [4, 254], [5, 254], [6, 254], [7, 254], [8, 254], [9, 254], [10, 254], [11, 254]] }, // Purifying Salt
  'silver-hourglass': { id: 0x202e, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 4, rank: 2, chances: [[24, 254]], durations: [[12, 254]] }, // Silver Hourglass
  'gold-hourglass': { id: 0x202f, type: 0, flagsMisc: 0x12406, flagsDamage: 0x40, damageClass: 1, shatter: 70, rank: 2, chances: [[24, 254]], durations: [[12, 254]] }, // Gold Hourglass
  'farplane-shadow': { id: 0x2032, type: 0, flagsMisc: 0x10406, flagsDamage: 0x40, damageClass: 0, rank: 2, chances: [[0, 100]] }, // Farplane Shadow
  'farplane-wind': { id: 0x2033, type: 0, flagsMisc: 0x18406, flagsDamage: 0x40, damageClass: 0, rank: 2, chances: [[0, 100]] }, // Farplane Wind
  'mana-spring': { id: 0x203c, type: 0, flagsMisc: 0x10506, flagsDamage: 0x40, damageClass: 2, shatter: 10, rank: 2 }, // Mana Spring
  'stamina-spring': { id: 0x203d, type: 0, flagsMisc: 0x10506, flagsDamage: 0x40, damageClass: 1, shatter: 10, rank: 2 }, // Stamina Spring
  'soul-spring': { id: 0x203e, type: 0, flagsMisc: 0x10506, flagsDamage: 0x40, damageClass: 3, shatter: 10, rank: 2 }, // Soul Spring
  'dark-matter': { id: 0x2035, type: 0, flagsMisc: 0x10406, flagsDamage: 0x80, damageClass: 1, shatter: 10, rank: 2 }, // Dark Matter
  'hp-sphere': { id: 0x2055, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0, rank: 2 }, // HP Sphere
  'return-sphere': { id: 0x2060, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0, rank: 2 }, // Return Sphere
  'mp-sphere': { id: 0x2056, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0, rank: 2 }, // MP Sphere
  'ability-sphere': { id: 0x2049, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0, rank: 2 }, // Ability Sphere
  'blk-magic-sphere': { id: 0x204f, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0, rank: 2 }, // Blk Magic Sphere
  'special-sphere': { id: 0x204c, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0, rank: 2 }, // Special Sphere
  'lv-3-key-sphere': { id: 0x2053, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0, rank: 2 }, // Lv. 3 Key Sphere
  'lv-4-key-sphere': { id: 0x2054, type: 0, flagsMisc: 0x0, flagsDamage: 0x0, damageClass: 0, rank: 2 }, // Lv. 4 Key Sphere
};
