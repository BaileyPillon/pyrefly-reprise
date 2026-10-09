/**
 * The game's own party Attack commands, one record per weapon family (re-parity W3; FFX-2 only).
 *
 * The engine has one generic `attack` ability for every girl; the game has a separate Attack command per family of
 * dresspheres (command.bin rows 0x302c to 0x3031 and 0x312f). They share one rule (accuracy formula 2: the user's own
 * Accuracy stat, physical, can crit on the Luck gap, power 16) and differ in the Thief's two hits of power 8, the guns'
 * range flag and the shatter byte. `research/re-ffx2-commands.md` section 4 lists which dressphere is which row; the
 * pairing is the dressphere's own Attack command (`job +0x0c`, `research/re-ffx2-dressphere.md` section 1.3): 0x302c
 * for the ranged dresspheres and the casters, 0x302d for the melee ones, the Mascot and the Songstress, 0x302e Thief,
 * 0x302f Trainer, 0x3030, 0x312f and 0x3031 for the three Specials. The seven rows differ in nothing the hit, critical
 * and damage kernels read except the Thief's two hits of power 8 (and Machina Maw's shatter byte).
 *
 * Source: command.bin of the Steam HD build 25501027, numbers only; pinned against
 * `tests/fixtures/parity/ffx2/command_rows.json` by `tests/unit/data-ffx2-command-records.test.ts`.
 */

import type { FFX2CommandRecord } from '../../common/types.ts';

/** 0x302c: Attack */
const ROW_302C: FFX2CommandRecord = { id: 0x302c, category: 0, flagsTarget: 0x433, flagsMisc: 0x20010052, flagsDamage: 0x5, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 50, element: 0, killer: 0 };

/** 0x302d: Attack */
const ROW_302D: FFX2CommandRecord = { id: 0x302d, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0x5, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 50, element: 0, killer: 0 };

/** 0x302e: Attack */
const ROW_302E: FFX2CommandRecord = { id: 0x302e, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0x5, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 8, hits: 2, shatter: 50, element: 0, killer: 0 };

/** 0x302f: Attack */
const ROW_302F: FFX2CommandRecord = { id: 0x302f, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0x5, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 50, element: 0, killer: 0 };

/** 0x3030: Attack */
const ROW_3030: FFX2CommandRecord = { id: 0x3030, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0x5, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 50, element: 0, killer: 0 };

/** 0x3031: Attack */
const ROW_3031: FFX2CommandRecord = { id: 0x3031, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0x5, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 50, element: 0, killer: 0 };

/** 0x312f: Attack */
const ROW_312F: FFX2CommandRecord = { id: 0x312f, category: 0, flagsTarget: 0x33, flagsMisc: 0x10012, flagsDamage: 0x5, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 100, element: 0, killer: 0 };

/** The Attack record by the dressphere the girl wears. A dressphere not listed uses the sword family's. */
const BY_DRESSPHERE: Readonly<Record<string, FFX2CommandRecord>> = {
  gunner: ROW_302C,
  'gun-mage': ROW_302C,
  alchemist: ROW_302C,
  'lady-luck': ROW_302C,
  'black-mage': ROW_302C,
  'white-mage': ROW_302C,
  psychic: ROW_302C,
  thief: ROW_302E,
  trainer: ROW_302F,
  'floral-fallal': ROW_3030,
  'full-throttle': ROW_3031,
  'machina-maw': ROW_312F,
};

/** The record the generic Attack of a girl wearing `dressphere` resolves on. */
export function partyAttackRecord(dressphere: string | undefined): FFX2CommandRecord {
  return (dressphere !== undefined ? BY_DRESSPHERE[dressphere] : undefined) ?? ROW_302D;
}
