/**
 * The game's own command rows for the Experiment's actions (FFX-2 Chapter 5, Djose Temple; the hidden chapter "The Experiment"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` of the Steam HD build 25501027, rows 0x41da and 0x4121 to 0x4126, read field by field by the new-chapters reverse-engineering lane
 * (`research/re-ffx2-experiment.md` §6: the rows, §8: the cadence); numbers only, no game text and no game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`.
 *
 * - **0x41da, Attack**: the plain monster Attack every boss of the earlier chapters shares: physical, accuracy formula 2 (the attacker's own Accuracy, 95 on this body), can crit on a fixed 5.
 * - **0x4121 to 0x4124, Rocket Launcher**: four rows that differ in the power (4, then 3) and the hits (4, 6, 8, 10); physical, **never rolls to hit** (accuracy formula 0), can crit on a fixed 10 per hit,
 *   all enemies with a random target per hit (misc bit 0x4000), charge 60 and rest 100.
 * - **0x4125, Lifeslicer**: damage formula 7, power 16: 16/16 of the target's maximum HP; **no damage-type bit**, so Protect and Shell do not reduce it; never rolls; not reflectable; one enemy, and its
 *   target flags lack the "may target the dead" bit; charge 100 and rest 180.
 * - **0x4126, Annihilator**: damage formula 3 (magic that ignores Magic Defense), power 20; magical (Shell applies); never rolls; all enemies; weak Delay (misc bit 0x1000, 4,000 gauge units); charge 210, rest 100.
 *
 * Confidence: [verified: the game's own table, read field by field and pinned by `tests/unit/chapters/experiment-engine.test.ts` against `tests/fixtures/parity/ffx2/experiment_rows.json`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_EXPERIMENT: Readonly<Record<string, FFX2CommandRecord>> = {
  'x2-experiment-attack': { id: 0x41da, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 }, // Attack
  'x2-experiment-rocket-launcher-a': { id: 0x4121, category: 0, flagsTarget: 0x17, flagsMisc: 0x20004006, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 10, accuracy: 0, power: 4, hits: 4, shatter: 100, element: 0, killer: 0 }, // Rocket Launcher, Special 2
  'x2-experiment-rocket-launcher-b': { id: 0x4122, category: 0, flagsTarget: 0x17, flagsMisc: 0x20004006, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 10, accuracy: 0, power: 3, hits: 6, shatter: 100, element: 0, killer: 0 }, // Rocket Launcher, Special 3
  'x2-experiment-rocket-launcher-c': { id: 0x4123, category: 0, flagsTarget: 0x17, flagsMisc: 0x20004006, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 10, accuracy: 0, power: 3, hits: 8, shatter: 100, element: 0, killer: 0 }, // Rocket Launcher, Special 4
  'x2-experiment-rocket-launcher-d': { id: 0x4124, category: 0, flagsTarget: 0x17, flagsMisc: 0x20004006, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 10, accuracy: 0, power: 3, hits: 10, shatter: 100, element: 0, killer: 0 }, // Rocket Launcher, Special 5
  'x2-experiment-lifeslicer': { id: 0x4125, category: 0, flagsTarget: 0x13, flagsMisc: 0x20000006, flagsDamage: 0x0, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 100, element: 0, killer: 0 }, // Lifeslicer
  'x2-experiment-annihilator': { id: 0x4126, category: 0, flagsTarget: 0x17, flagsMisc: 0x20001006, flagsDamage: 0x2, damageClass: 1, formula: 3, critByte: 0, accuracy: 0, power: 20, hits: 1, shatter: 100, element: 0, killer: 0 }, // Annihilator
};
