/**
 * The game's own command records for the abilities of the engine's fallback table (`abilities-core.ts`,
 * `abilities-vegnagun.ts`, `abilities-shuyin.ts`), which the AI scripts of Bahamut, the Vegnagun chain and Shuyin submit
 * by these ids. Re-parity W3; FFX-2 only.
 *
 * The fallback table lives in the battle layer, so its records do too (the layering rule: `src/battle/**` imports no
 * `src/data/**`). Source: the Steam HD build's battle kernel tables, build 25501027 (monmagic.bin and command.bin rows,
 * each taken from the owning monster's own command list); numbers only. `research/re-ffx2-commands.md` section 3 has
 * the table of fallback id to row, and `tests/unit/data-ffx2-command-records.test.ts` pins every record here against
 * `tests/fixtures/parity/ffx2/command_rows.json`.
 */

import type { AbilityDef, AbilityId, FFX2CommandRecord } from '../common/types.ts';

export const FALLBACK_RECORDS: Readonly<Record<string, FFX2CommandRecord>> = {
  'demi': { id: 0x3082, category: 9, flagsTarget: 0x437, flagsMisc: 0x20208006, flagsDamage: 0x2, damageClass: 1, formula: 4, critByte: 0, accuracy: 0, power: 4, hits: 1, shatter: 0, element: 16, killer: 0 }, // Demi
  'leg-break': { id: 0x3084, category: 9, flagsTarget: 0x433, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 1: 80 } }, // Break
  'bulwark-bio': { id: 0x3085, category: 9, flagsTarget: 0x437, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 5: 100 } }, // Bio
  'bulwark-doom': { id: 0x3086, category: 9, flagsTarget: 0x433, flagsMisc: 0x20208006, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 14: 100 }, statusTime: { 14: 5 } }, // Doom
  'leg-berserk': { id: 0x3089, category: 0, flagsTarget: 0xd, flagsMisc: 0x20200006, flagsDamage: 0x0, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 7: 255 }, status2: { 7: 254 }, statusTime: { 7: 1 } }, // Berserk
  'cura': { id: 0x30b4, category: 2, flagsTarget: 0x4b1, flagsMisc: 0x20208087, flagsDamage: 0x12, damageClass: 1, formula: 6, critByte: 0, accuracy: 0, power: 31, hits: 1, shatter: 0, element: 0, killer: 0 }, // Cura
  'node-regen': { id: 0x30b6, category: 2, flagsTarget: 0x431, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 3: 254 }, statusTime: { 3: 50 } }, // Regen
  'dispel': { id: 0x30b8, category: 2, flagsTarget: 0x433, flagsMisc: 0x20208006, flagsDamage: 0x22, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 13: 254, 14: 254, 15: 254, 18: 254 }, status2: { 0: 254, 1: 254, 2: 254, 3: 254, 4: 254 }, statusTime: { 0: 127, 1: 127, 2: 127, 3: 127, 4: 127 } }, // Dispel
  'node-shell': { id: 0x30bb, category: 2, flagsTarget: 0x435, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 0: 254 }, statusTime: { 0: 110 } }, // Shell
  'node-protect': { id: 0x30bc, category: 2, flagsTarget: 0x435, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 1: 254 }, statusTime: { 1: 110 } }, // Protect
  'blind': { id: 0x3178, category: 9, flagsTarget: 0x433, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 4: 100 } }, // Blind
  'leg-absorb': { id: 0x4040, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000106, flagsDamage: 0x0, damageClass: 3, formula: 4, critByte: 0, accuracy: 0, power: 3, hits: 1, shatter: 0, element: 0, killer: 0 }, // Absorb
  'bahamut-curse': { id: 0x4046, category: 0, flagsTarget: 0x33, flagsMisc: 0x20008006, flagsDamage: 0x0, damageClass: 0, formula: 2, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 8: 254 } }, // Curse
  'full-life': { id: 0x4069, category: 0, flagsTarget: 0x71, flagsMisc: 0x61200006, flagsDamage: 0x30, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 0: 254, 2: 254, 3: 254, 4: 254, 5: 254, 6: 254, 7: 254 } }, // Full Life
  'leg-slow': { id: 0x406c, category: 0, flagsTarget: 0x433, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 4, formula: 4, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 5: 130 }, statusTime: { 5: 126 } }, // Slow
  'impulse': { id: 0x409b, category: 0, flagsTarget: 0x17, flagsMisc: 0x41200006, flagsDamage: 0x0, damageClass: 1, formula: 4, critByte: 0, accuracy: 0, power: 6, hits: 1, shatter: 0, element: 0, killer: 0 }, // Impulse
  'mega-flare': { id: 0x409c, category: 0, flagsTarget: 0x17, flagsMisc: 0x41200006, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 24, hits: 1, shatter: 0, element: 0, killer: 0 }, // Mega Flare OVERRIDE {"power":24}
  'spin-cut': { id: 0x4118, category: 0, flagsTarget: 0x13, flagsMisc: 0x41000006, flagsDamage: 0x1, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 24, hits: 1, shatter: 0, element: 0, killer: 0 }, // Spin Cut
  'run-and-slash': { id: 0x4119, category: 0, flagsTarget: 0x17, flagsMisc: 0x41004006, flagsDamage: 0x1, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 8, hits: 6, shatter: 0, element: 0, killer: 0 }, // Hit  Run
  'force-rain': { id: 0x411a, category: 0, flagsTarget: 0x17, flagsMisc: 0x41000006, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 20, hits: 1, shatter: 0, element: 0, killer: 0 }, // Force Rain
  'terror-of-zanarkand': { id: 0x411b, category: 0, flagsTarget: 0x13, flagsMisc: 0x41000006, flagsDamage: 0x0, damageClass: 1, formula: 1, critByte: 0, accuracy: 0, power: 10, hits: 9, shatter: 0, element: 0, killer: 0 }, // Terror of Zanarkand
  'noli-me-tangere': { id: 0x412f, category: 0, flagsTarget: 0x13, flagsMisc: 0x41000006, flagsDamage: 0x1, damageClass: 1, formula: 5, critByte: 0, accuracy: 0, power: 25, hits: 1, shatter: 0, element: 0, killer: 0 }, // Noli Me Tangere
  'tail-beam': { id: 0x4130, category: 0, flagsTarget: 0x13, flagsMisc: 0x41000002, flagsDamage: 0x0, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 5, hits: 1, shatter: 0, element: 0, killer: 0 }, // Tail Beam
  'vita-brevis': { id: 0x4131, category: 0, flagsTarget: 0x17, flagsMisc: 0x40002006, flagsDamage: 0x1, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 40, hits: 1, shatter: 0, element: 0, killer: 0 }, // Vita Brevis
  'missile': { id: 0x4132, category: 0, flagsTarget: 0x13, flagsMisc: 0x40200002, flagsDamage: 0x1, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 9, hits: 2, shatter: 0, element: 0, killer: 0 }, // Missile
  'dies-irae': { id: 0x4133, category: 0, flagsTarget: 0x17, flagsMisc: 0x40204006, flagsDamage: 0x1, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 4, hits: 9, shatter: 0, element: 0, killer: 0 }, // Dies Irae
  'hostile-activity-detected': { id: 0x4134, category: 0, flagsTarget: 0x13, flagsMisc: 0x40000006, flagsDamage: 0x22, damageClass: 3, formula: 7, critByte: 0, accuracy: 0, power: 3, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 0: 254, 1: 254, 2: 254, 3: 254, 4: 254 }, statusTime: { 0: 127, 1: 127, 2: 127, 3: 127, 4: 127 } }, // Hostile activity detected.
  'physical-attack-detected': { id: 0x4136, category: 0, flagsTarget: 0x17, flagsMisc: 0x40000006, flagsDamage: 0x21, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 5, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 7: 254, 9: 254 }, statusTime: { 7: 127, 9: 127 } }, // Physical attack detected.
  'magical-attack-detected': { id: 0x4137, category: 0, flagsTarget: 0x17, flagsMisc: 0x40000006, flagsDamage: 0x22, damageClass: 2, formula: 7, critByte: 0, accuracy: 0, power: 3, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 8: 254, 10: 254 }, statusTime: { 8: 127, 10: 127 } }, // Magical attack detected.
  'memento-mori': { id: 0x413a, category: 0, flagsTarget: 0x17, flagsMisc: 0x40000006, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 28, hits: 1, shatter: 0, element: 0, killer: 0 }, // Memento Mori
  'charge-core': { id: 0x413b, category: 0, flagsTarget: 0x5, flagsMisc: 0x40000006, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 0, shatter: 0, element: 0, killer: 0 }, // Charge Core
  'pallida-mors': { id: 0x413d, category: 0, flagsTarget: 0x13, flagsMisc: 0x41000006, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 26, hits: 1, shatter: 0, element: 0, killer: 0 }, // Pallida Mors
  'lacrimosa-r': { id: 0x413e, category: 0, flagsTarget: 0x13, flagsMisc: 0x40000006, flagsDamage: 0x1, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, killer: 0 }, // Lacrimosa
  'lacrimosa-l': { id: 0x413f, category: 0, flagsTarget: 0x13, flagsMisc: 0x40000006, flagsDamage: 0x1, damageClass: 2, formula: 0, critByte: 0, accuracy: 0, power: 2, hits: 1, shatter: 0, element: 0, killer: 0 }, // Lacrimosa
  'odi-et-amo': { id: 0x4140, category: 0, flagsTarget: 0x17, flagsMisc: 0x40004006, flagsDamage: 0x22, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 6, hits: 16, shatter: 0, element: 0, killer: 0, status1: { 11: 254, 12: 254, 13: 254 }, status2: { 0: 254, 1: 254, 2: 254, 3: 254, 4: 254, 7: 254, 8: 254, 9: 254, 10: 254 }, statusTime: { 0: 127, 1: 127, 2: 127, 3: 127, 4: 127, 7: 127, 8: 127, 9: 127, 10: 127 } }, // Odi et Amo
  'mors-certa': { id: 0x4141, category: 0, flagsTarget: 0x17, flagsMisc: 0x40000006, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 12, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 3: 80, 4: 80, 5: 80 } }, // Mors Certa
  'nemo-ante-mortem-beatus': { id: 0x4142, category: 0, flagsTarget: 0x17, flagsMisc: 0x40000006, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 30, hits: 1, shatter: 0, element: 0, killer: 0 }, // Nemo Ante Mortem Beatus
  'acta-est-fabula': { id: 0x4144, category: 0, flagsTarget: 0x55, flagsMisc: 0x61000006, flagsDamage: 0x30, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 0: 254 } }, // Acta Est Fabula
  'shuyin-attack': { id: 0x41da, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 }, // Attack
  'firaga': { id: 0x41f1, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 19, hits: 1, shatter: 20, element: 1, killer: 0 }, // Firaga
  'blizzaga': { id: 0x41f2, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 19, hits: 1, shatter: 20, element: 2, killer: 0 }, // Blizzaga
  'thundaga': { id: 0x41f3, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 19, hits: 1, shatter: 20, element: 4, killer: 0 }, // Thundaga
  'waterga': { id: 0x41f4, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 19, hits: 1, shatter: 20, element: 8, killer: 0 }, // Waterga
  'flare': { id: 0x41fa, category: 1, flagsTarget: 0x433, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 30, hits: 1, shatter: 100, element: 0, killer: 0 }, // Flare
};

/** The fallback abilities with their game records laid on (a copy; the source objects are untouched). */
export function withFallbackRecords(list: readonly AbilityDef[]): AbilityDef[] {
  return list.map((a) => {
    const record = FALLBACK_RECORDS[a.id as AbilityId];
    return record === undefined ? a : { ...a, ffx2Record: record };
  });
}
