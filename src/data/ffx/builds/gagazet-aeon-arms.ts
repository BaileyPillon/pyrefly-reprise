/**
 * PR-0179's arms: which stat rows Yuna's five story aeons carry in the Mt. Gagazet preset and in
 * the chapters that inherit it. **Game case: FFX only** [AGENTS.md rule 14]: summoned aeons exist
 * only in FFX (FFX-2 has none).
 *
 * The rows shipped until D-243 (`gagazet-kit.ts` GAGAZET_SHIPPED_AEONS) are an invented ~0.55x of a later table (Valefor 738, Ifrit 988,
 * Ixion 983, Shiva 878, Bahamut 1,398 HP). The method check (`docs/plans/pr-0179-method-check.md`)
 * builds each sourced answer as an **OFF** value of one switch, benches Chapters I, IX, X and XIV per
 * arm, and asks Bailey once (plan §8 Q3). No boss number is touched: these are the player's aeons.
 *
 * - `'shipped'` (the default until 2026-09-27): the rows shipped before D-243, byte for byte.
 * - `'a'`: `research/ffx-combat-core.md` §6.4.3, the Mt. Gagazet block (N = 250, tier 7; `[estimate]`,
 *   mechanically derived from `[verified: 3 sources]` constants), in `gagazet.ts`; Chapter X's
 *   Bahamut (`highbridge.ts`) and Chapter XIV's (`via-purifico.ts`) inherit it.
 * - `'b'`: the §6.4.3 rows in `gagazet.ts` only; X and XIV keep D-186's shipped Bahamut.
 * - `'c'`: as (b), and Chapter XIV's five aeons take `research/ffx-isaaru-bevelle.md` §5.1 P3's HP,
 *   "the weakest the aeons can be" at 180 to 209 battles (Valefor 1,127 ... Bahamut 2,139).
 *
 * Only the stat rows move: every aeon keeps its abilities, Overdrives and gauge.
 */

import type { AeonBuild } from '../../../battle/common/types.ts';

export type AeonArm = 'shipped' | 'a' | 'b' | 'c';

/**
 * The switch. **Arm `'a'`** since Bailey's word of 2026-09-27 (D-243, plan §8 Q3: "I'll go with all of your
 * recommendations"); it was `'shipped'` until then.
 */
export const GAGAZET_AEON_ARM: AeonArm = 'a';

/** One §6.4.3 row: HP MP STR DEF MAG MDEF AGI EVA ACC LUCK (also read by `late-aeon-rows.ts`). */
export type AeonStatRow = Pick<AeonBuild['stats'], 'hp' | 'mp' | 'str' | 'def' | 'mag' | 'mdef' | 'agi' | 'eva' | 'acc' | 'luck'>;
type Row = AeonStatRow;

/** §6.4.3, Seymour Flux, Mt. Gagazet, N = 250 (tier 7): HP MP STR DEF MAG MDEF AGI EVA ACC LUCK. */
export const GAGAZET_SOURCED_ROWS: Readonly<Record<string, Row>> = {
  valefor: { hp: 1530, mp: 51, str: 38, def: 47, mag: 39, mdef: 45, agi: 18, eva: 25, acc: 32, luck: 17 },
  ifrit: { hp: 2075, mp: 49, str: 41, def: 63, mag: 39, mdef: 41, agi: 16, eva: 12, acc: 32, luck: 17 },
  ixion: { hp: 2055, mp: 54, str: 44, def: 54, mag: 38, mdef: 56, agi: 14, eva: 13, acc: 37, luck: 17 },
  shiva: { hp: 1830, mp: 59, str: 43, def: 34, mag: 44, mdef: 47, agi: 27, eva: 39, acc: 32, luck: 17 },
  bahamut: { hp: 2935, mp: 74, str: 53, def: 60, mag: 33, mdef: 56, agi: 18, eva: 26, acc: 32, luck: 17 },
};

/** `ffx-isaaru-bevelle.md` §5.1 P3, the story floor at 180 to 209 battles: HP only. */
export const ISAARU_P3_FLOOR_HP: Readonly<Record<string, number>> = {
  valefor: 1127, ifrit: 1512, ixion: 1503, shiva: 1342, bahamut: 2139,
};

/** The aeon with every stat of `row` (HP and MP full). Only the stat row moves. */
export function withRow(a: AeonBuild, row: Row): AeonBuild {
  return {
    ...a,
    stats: { ...a.stats, ...row, maxHp: row.hp, maxMp: row.mp },
    hp: row.hp,
    mp: row.mp,
  };
}

function withHp(a: AeonBuild, hp: number): AeonBuild {
  return { ...a, stats: { ...a.stats, hp, maxHp: hp }, hp };
}

/** Chapters I and IX (`gagazet.ts`, `yojimbo-cavern.ts`): arms a, b and c all carry the §6.4.3 rows. */
export function armGagazetAeons(aeons: AeonBuild[], arm: AeonArm): AeonBuild[] {
  if (arm === 'shipped') return aeons;
  return aeons.map((a) => (GAGAZET_SOURCED_ROWS[a.id] ? withRow(a, GAGAZET_SOURCED_ROWS[a.id]!) : a));
}

/** Chapter X (`highbridge.ts`, whose Bahamut is the Gagazet preset's): only arm a moves it. */
export function armHighbridgeAeons(aeons: AeonBuild[], arm: AeonArm): AeonBuild[] {
  if (arm !== 'a') return aeons;
  return aeons.map((a) => (a.id === 'bahamut' ? withRow(a, GAGAZET_SOURCED_ROWS['bahamut']!) : a));
}

/**
 * Chapter XIV (`via-purifico.ts`, which inherits Chapter X's set). Arm a arrives through
 * {@link armHighbridgeAeons}; arm c puts the P3 floor's HP on all five; b leaves D-186's rows.
 */
export function armViaPurificoAeons(aeons: AeonBuild[], arm: AeonArm): AeonBuild[] {
  if (arm !== 'c') return aeons;
  return aeons.map((a) => (ISAARU_P3_FLOOR_HP[a.id] !== undefined ? withHp(a, ISAARU_P3_FLOOR_HP[a.id]!) : a));
}
