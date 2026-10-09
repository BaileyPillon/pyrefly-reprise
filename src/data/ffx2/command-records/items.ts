/**
 * The game's own command records for the FFX-2 **item** effects (item.bin rows, record ids 0x2000 + n), keyed by the
 * item's effect-ability id. Re-parity W3; FFX-2 only.
 *
 * Source: the Steam HD build's battle kernel tables, build 25501027 (item.bin, 68 rows), read field by field
 * (research/re-ffx2-commands.md §1); numbers only. The table of ability to row is §3 of that note.
 *
 * Confidence: [verified: the game's own tables, read field by field and pinned row for row by
 * tests/unit/data-ffx2-command-records.test.ts against tests/fixtures/parity/ffx2/command_rows.json].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_ITEMS: Readonly<Record<string, FFX2CommandRecord>> = {
  'x2-item-potion': { id: 0x2000, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x50, damageClass: 1, formula: 5, critByte: 0, accuracy: 0, power: 4, hits: 1, shatter: 0, element: 0, killer: 0 }, // Potion
  'x2-item-hi-potion': { id: 0x2001, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x50, damageClass: 1, formula: 5, critByte: 0, accuracy: 0, power: 20, hits: 1, shatter: 0, element: 0, killer: 0 }, // Hi Potion
  'x2-item-x-potion': { id: 0x2002, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x50, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, killer: 0 }, // X Potion
  'x2-item-mega-potion': { id: 0x2003, category: 4, flagsTarget: 0x35, flagsMisc: 0x20000007, flagsDamage: 0x50, damageClass: 1, formula: 5, critByte: 0, accuracy: 0, power: 40, hits: 1, shatter: 0, element: 0, killer: 0 }, // Mega Potion
  'x2-item-ether': { id: 0x2004, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x50, damageClass: 2, formula: 5, critByte: 0, accuracy: 0, power: 2, hits: 1, shatter: 0, element: 0, killer: 0 }, // Ether
  'x2-item-turbo-ether': { id: 0x2005, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x50, damageClass: 2, formula: 5, critByte: 0, accuracy: 0, power: 10, hits: 1, shatter: 0, element: 0, killer: 0 }, // Turbo Ether
  'x2-item-phoenix-down': { id: 0x2006, category: 4, flagsTarget: 0x71, flagsMisc: 0x20040007, flagsDamage: 0x70, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 4, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 0: 254 } }, // Phoenix Down
  'x2-item-mega-phoenix': { id: 0x2007, category: 4, flagsTarget: 0x75, flagsMisc: 0x20040007, flagsDamage: 0x70, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 4, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 0: 254 } }, // Mega Phoenix
  'x2-item-elixir': { id: 0x2008, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x50, damageClass: 3, formula: 7, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, killer: 0 }, // Elixir
  'x2-item-megalixir': { id: 0x2009, category: 4, flagsTarget: 0x35, flagsMisc: 0x20000007, flagsDamage: 0x50, damageClass: 3, formula: 7, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, killer: 0 }, // Megalixir
  'x2-item-antidote': { id: 0x200a, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x70, damageClass: 0, formula: 5, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 5: 254 } }, // Antidote
  'x2-item-soft': { id: 0x200b, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x70, damageClass: 0, formula: 5, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 1: 254 } }, // Soft
  'x2-item-eye-drops': { id: 0x200c, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x70, damageClass: 0, formula: 5, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 4: 254 } }, // Eye Drops
  'x2-item-echo-screen': { id: 0x200d, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x70, damageClass: 0, formula: 5, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 3: 254 } }, // Echo Screen
  'x2-item-holy-water': { id: 0x200e, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x70, damageClass: 0, formula: 5, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 8: 254, 16: 254, 17: 254 } }, // Holy Water
  'x2-item-remedy': { id: 0x200f, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000007, flagsDamage: 0x70, damageClass: 0, formula: 5, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 1: 254, 2: 254, 3: 254, 4: 254, 5: 254, 6: 254, 7: 254, 8: 254, 16: 254, 17: 254 }, status2: { 5: 254, 6: 254 }, statusTime: { 5: 127, 6: 127 } }, // Remedy
  'x2-item-grenade': { id: 0x2011, category: 4, flagsTarget: 0x37, flagsMisc: 0x20000006, flagsDamage: 0x41, damageClass: 1, formula: 8, critByte: 0, accuracy: 0, power: 4, hits: 1, shatter: 30, element: 0, killer: 0 }, // Grenade
  'x2-item-chocobo-feather': { id: 0x202f, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000006, flagsDamage: 0x50, damageClass: 4, formula: 4, critByte: 0, accuracy: 0, power: 8, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 4: 254 }, statusTime: { 4: 100 } }, // Chocobo Feather
  'x2-item-lunar-curtain': { id: 0x2031, category: 4, flagsTarget: 0x35, flagsMisc: 0x20000006, flagsDamage: 0x40, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 0: 254 }, statusTime: { 0: 100 } }, // Lunar Curtain
  'x2-item-light-curtain': { id: 0x2032, category: 4, flagsTarget: 0x35, flagsMisc: 0x20000006, flagsDamage: 0x40, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 1: 254 }, statusTime: { 1: 100 } }, // Light Curtain
  'x2-item-soul-spring': { id: 0x2037, category: 4, flagsTarget: 0x33, flagsMisc: 0x20000106, flagsDamage: 0x40, damageClass: 3, formula: 8, critByte: 0, accuracy: 0, power: 20, hits: 1, shatter: 0, element: 0, killer: 0 }, // Soul Spring
  'x2-item-stamina-tonic': { id: 0x203b, category: 4, flagsTarget: 0x35, flagsMisc: 0x20000006, flagsDamage: 0x40, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 11: 254 } }, // Stamina Tonic
  'x2-item-three-stars': { id: 0x203e, category: 4, flagsTarget: 0x35, flagsMisc: 0x20000006, flagsDamage: 0x40, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 13: 254 } }, // Three Stars
  'x2-item-hero-drink': { id: 0x203f, category: 4, flagsTarget: 0x31, flagsMisc: 0x20000006, flagsDamage: 0x40, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 17: 254 }, statusTime: { 17: 20 } }, // Hero Drink
};
