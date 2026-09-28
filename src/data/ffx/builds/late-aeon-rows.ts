/**
 * Yuna's five story aeons in Chapters II (Zanarkand Dome, `zanarkand.ts`) and III (inside Sin,
 * `dreams-end.ts`; Chapter XII, `garden-of-pain.ts`, clones III's set). **Game case: FFX only**
 * [AGENTS.md rule 14]: summoned aeons exist only in FFX.
 *
 * Bailey, 2026-09-28 (answering "Chapters II and III aeon HP: move them to the same sourced table as
 * Gagazet, so the aeons don't get weaker later in the story" with "all your recommendations"). Under
 * D-243 arm a, Chapter I carries `research/ffx-combat-core.md` §6.4.3's Mt. Gagazet block (Valefor
 * 1,530 ... Bahamut 2,935), the formula run on §6.4.2's declared Yuna, while II and III carried
 * `research/ffx-yunalesca.md` §12's rows: §6.4.1's battle-count floor alone (the `x` branch;
 * `ffx-combat-core.md` §6.4 and conflict C17), Valefor 1,341 / 1,465 ... Bahamut 2,542 / 2,840. So all
 * five aeons were weaker at Zanarkand than at Gagazet. §6.4.3 prints the two later blocks of the same
 * model, and this file ships them:
 *
 * - Chapter II: "Yunalesca — Zanarkand Dome, N = 300 (tier 9)".
 * - Chapter III: "Braska's Final Aeon / Yu Yevon — inside Sin, N = 360 (tier 11)". §6.4.3: "These are
 *   also the stats for the **possessed aeons** the party must fight in the Yu Yevon gauntlet, which
 *   mirrors the player's own aeon block" (the engine copies the live roster, Luck forced to 1:
 *   `ffx-bfa-yu-yevon.md` §2.2, `enemies/braskas-final-aeon.ts`).
 *
 * Tag: `[estimate]` in §6.4.3's own sense (mechanically derived from `[verified: 3 sources]` constants
 * and the `[estimate]` §6.4.2 Yuna profiles), the same tag Chapter I's rows carry. Every stat of the
 * row moves, Luck included (§6.4: aeon Luck = Yuna's, 17 in §6.4.2; the floor rows had an unsourced 5).
 * Abilities, Overdrives and each chapter's gauge (`ffx-bfa-yu-yevon.md` §7.9.2 addendum) are unchanged.
 * No boss number is touched: these are the player's aeons (and, in III, their possessed mirrors).
 *
 * `LATE_AEON_ROWS = 'floor'` reaches the rows shipped until 2026-09-28, byte for byte, for measurement.
 */

import type { AeonBuild } from '../../../battle/common/types.ts';
import { type AeonStatRow, withRow } from './gagazet-aeon-arms.ts';

export type LateAeonRows = 'floor' | 'sourced';

/** The switch: `'sourced'` since Bailey's word of 2026-09-28; `'floor'` until then. */
export const LATE_AEON_ROWS: LateAeonRows = 'sourced';

/** §6.4.3, Yunalesca, Zanarkand Dome, N = 300 (tier 9): HP MP STR DEF MAG MDEF AGI EVA ACC LUCK. */
export const ZANARKAND_SOURCED_ROWS: Readonly<Record<string, AeonStatRow>> = {
  valefor: { hp: 1674, mp: 55, str: 41, def: 51, mag: 44, mdef: 50, agi: 21, eva: 28, acc: 35, luck: 17 },
  ifrit: { hp: 2275, mp: 52, str: 44, def: 67, mag: 42, mdef: 44, agi: 18, eva: 14, acc: 35, luck: 17 },
  ixion: { hp: 2251, mp: 58, str: 48, def: 58, mag: 41, mdef: 62, agi: 16, eva: 16, acc: 41, luck: 17 },
  shiva: { hp: 2004, mp: 64, str: 47, def: 37, mag: 49, mdef: 51, agi: 32, eva: 44, acc: 35, luck: 17 },
  bahamut: { hp: 3218, mp: 81, str: 57, def: 65, mag: 36, mdef: 61, agi: 21, eva: 29, acc: 35, luck: 17 },
};

/** §6.4.3, Braska's Final Aeon / Yu Yevon, inside Sin, N = 360 (tier 11): the same columns. */
export const INSIDE_SIN_SOURCED_ROWS: Readonly<Record<string, AeonStatRow>> = {
  valefor: { hp: 1886, mp: 62, str: 45, def: 58, mag: 49, mdef: 56, agi: 24, eva: 30, acc: 38, luck: 17 },
  ifrit: { hp: 2585, mp: 59, str: 49, def: 77, mag: 48, mdef: 50, agi: 21, eva: 16, acc: 38, luck: 17 },
  ixion: { hp: 2551, mp: 66, str: 53, def: 66, mag: 47, mdef: 70, agi: 18, eva: 17, acc: 44, luck: 17 },
  shiva: { hp: 2266, mp: 72, str: 52, def: 41, mag: 54, mdef: 58, agi: 37, eva: 48, acc: 38, luck: 17 },
  bahamut: { hp: 3657, mp: 91, str: 63, def: 73, mag: 42, mdef: 68, agi: 24, eva: 32, acc: 38, luck: 17 },
};

/** The floor rows' aeon: `ffx-yunalesca.md` §12's columns, Luck 5 (`[estimate]`, not published). */
function floorAeon(
  id: AeonBuild['id'],
  name: string,
  [hp, mp, str, def, mag, mdef, agi, eva, acc]: readonly number[],
  abilityIds: string[],
  overdriveIds: string[],
  overdriveGauge: number,
): AeonBuild {
  return {
    id,
    name,
    spriteKey: id,
    stats: { hp: hp!, mp: mp!, str: str!, def: def!, mag: mag!, mdef: mdef!, agi: agi!, luck: 5, eva: eva!, acc: acc!, maxHp: hp!, maxMp: mp! },
    hp: hp!,
    mp: mp!,
    overdriveGauge,
    abilityIds: [...abilityIds, 'shield', 'boost'],
    overdriveIds,
  };
}

/**
 * Chapter II's aeons as shipped until 2026-09-28: §12's N = 270-299 band; the gauges are the §7.9.2
 * addendum's (the party has just spent aeons on the Spectral Keeper and the Dome fiends).
 */
export function zanarkandFloorAeons(): AeonBuild[] {
  return [
    floorAeon('valefor', 'Valefor', [1341, 43, 28, 39, 42, 42, 19, 27, 15], ['sonic-wings'], ['energy-ray'], 60),
    floorAeon('ifrit', 'Ifrit', [1797, 41, 29, 47, 41, 37, 17, 14, 15], ['meteor-strike'], ['hellfire'], 40),
    floorAeon('ixion', 'Ixion', [1787, 45, 30, 43, 40, 52, 15, 15, 16], ['aerospark'], ['thors-hammer'], 40),
    floorAeon('shiva', 'Shiva', [1596, 48, 28, 27, 46, 43, 27, 44, 15], ['heavenly-strike'], ['diamond-dust'], 55),
    floorAeon('bahamut', 'Bahamut', [2542, 63, 33, 44, 36, 51, 19, 29, 15], ['impulse'], ['mega-flare'], 30),
  ];
}

/** Chapter III's aeons as shipped until 2026-09-28: §12's N = 300-329 band, one bracket up from II. */
export function dreamsEndFloorAeons(): AeonBuild[] {
  return [
    floorAeon('valefor', 'Valefor', [1465, 46, 30, 44, 42, 46, 21, 28, 15], ['sonic-wings'], ['energy-ray'], 60),
    floorAeon('ifrit', 'Ifrit', [2007, 44, 31, 57, 41, 41, 18, 14, 15], ['meteor-strike'], ['hellfire'], 55),
    floorAeon('ixion', 'Ixion', [1981, 48, 32, 50, 41, 58, 16, 16, 16], ['aerospark'], ['thors-hammer'], 50),
    floorAeon('shiva', 'Shiva', [1760, 51, 30, 31, 46, 47, 32, 44, 15], ['heavenly-strike'], ['diamond-dust'], 55),
    floorAeon('bahamut', 'Bahamut', [2840, 67, 35, 54, 36, 56, 21, 29, 15], ['impulse'], ['mega-flare'], 70),
  ];
}

/** `'sourced'`: each aeon takes its §6.4.3 row (every stat, HP and MP full); `'floor'`: unchanged. */
export function armLateAeons(
  aeons: AeonBuild[],
  rows: Readonly<Record<string, AeonStatRow>>,
  arm: LateAeonRows,
): AeonBuild[] {
  if (arm === 'floor') return aeons;
  return aeons.map((a) => (rows[a.id] ? withRow(a, rows[a.id]!) : a));
}
