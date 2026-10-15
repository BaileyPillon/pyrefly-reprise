/**
 * **Yuna's aeons from Yuna's own stats** (FFX only; the hidden Mirror Aeons chapter's preset, `./mirror-aeons.ts`): `research/ffx-combat-core.md` section 6.4's formula as one pure function, so the preset's ten
 * aeon rows are *derived* from the preset's Yuna and not typed. The formula is `[verified: 3 sources]` (the decompile's `calculate_aeon_stats`, the Fandom stat-growth page, the local extract) and is the kernel's own
 * (`battle/ffx/aeon-gear.ts`: the authored rows "equal the kernel's output for the declared Yuna profiles in all 300 numbers"); `tests/unit/chapters/mirror-aeons-aeon-stats.test.ts` runs it against the three
 * canonical blocks of `../aeons/index.ts` (`AEON_CANONICAL_STATS`, the declared Yuna profiles of section 6.4.2) and demands every one of their 270 numbers.
 *
 * ```
 * powerBase(s) = min(HP,9999)//100 + min(MP,999)//10 + STR + DEF + MAG + MDEF + AGI + EVA + ACC
 * tier         = clamp((battles - 30) // 30, 0, 19)
 * y = yuna[stat] * xPercent // 100 + int(powerBase(yuna) * yCoef)        // "from Yuna"
 * x = floor[stat][tier] * xPercent // 100 + int(powerBase(floor) * yCoef) // "from the battle count"
 * aeon[stat] = max(x, y) + trained[stat];   aeon[LUCK] = yuna[LUCK] + trained[LUCK]
 * ```
 *
 * **The clamps are the game's stat caps, not part of the formula** (`research/ffx-combat-core.md` section 10.1: every stat 255; an aeon wears Break HP Limit and Break MP Limit, `battle/ffx/aeon-gear.ts`, so
 * HP is capped at 99,999 and MP at 9,999). None of the three canonical blocks reaches a cap; an endgame Yuna does (a Sandy with Yuna at 255 would have 1,685 Strength unclamped).
 */

import type { StatBlock } from '../../../battle/common/types.ts';
import { AEON_STAT_COEFFICIENTS } from '../aeons/index.ts';

/** The nine stats the formula covers, in its order. */
export const AEON_STAT_KEYS = ['hp', 'mp', 'str', 'def', 'mag', 'mdef', 'agi', 'eva', 'acc'] as const;
export type AeonStatKey = (typeof AEON_STAT_KEYS)[number];

/** Yuna's ten stats as the formula reads them (HP and MP are her maxima). */
export type YunaStats = Readonly<Record<AeonStatKey | 'luck', number>>;

/** `ENCOUNTERS_YUNA_STATS` (section 6.4, `[verified: 2 sources]`): the story-progress floor, index = tier 0 to 19. Strength, Luck and Accuracy are flat (5, 17, 3). */
export const ENCOUNTERS_YUNA_FLOOR: Readonly<Record<AeonStatKey | 'luck', readonly number[]>> = {
  hp: [475, 475, 675, 875, 875, 1075, 1075, 1075, 1275, 1475, 1475, 1475, 1675, 1875, 1875, 1875, 2075, 2075, 2275, 2275],
  mp: [84, 104, 104, 104, 124, 144, 144, 164, 184, 184, 204, 204, 224, 224, 244, 244, 264, 264, 304, 304],
  str: Array(20).fill(5),
  def: [5, 5, 7, 7, 7, 7, 7, 7, 7, 11, 11, 11, 11, 11, 11, 15, 15, 15, 15, 15],
  mag: [20, 23, 26, 26, 29, 29, 32, 36, 40, 40, 44, 44, 48, 48, 52, 52, 56, 56, 60, 60],
  mdef: [20, 23, 23, 26, 29, 32, 36, 36, 36, 40, 40, 44, 48, 48, 52, 52, 52, 56, 56, 60],
  agi: [10, 10, 13, 13, 13, 16, 16, 20, 20, 24, 24, 28, 28, 32, 32, 36, 36, 36, 40, 40],
  luck: Array(20).fill(17),
  eva: [30, 32, 32, 32, 32, 36, 36, 36, 40, 40, 44, 44, 44, 48, 48, 52, 52, 56, 56, 60],
  acc: Array(20).fill(3),
};

/** The game's caps for an aeon (see the header): every stat 255, HP 99,999, MP 9,999. */
export const AEON_CAPS: Readonly<Record<AeonStatKey | 'luck', number>> = { hp: 99_999, mp: 9_999, str: 255, def: 255, mag: 255, mdef: 255, agi: 255, eva: 255, acc: 255, luck: 255 };

/** `powerBase`: the one number the "int(powerBase * yCoef)" term reads. */
export function powerBase(s: Readonly<Record<AeonStatKey, number>>): number {
  return Math.floor(Math.min(s.hp, 9_999) / 100) + Math.floor(Math.min(s.mp, 999) / 10) + s.str + s.def + s.mag + s.mdef + s.agi + s.eva + s.acc;
}

/** The story-progress tier of a battle count: `clamp((battles - 30) // 30, 0, 19)`. */
export function encounterTier(battles: number): number {
  return Math.min(19, Math.max(0, Math.floor((battles - 30) / 30)));
}

/** The floor row of a tier. */
export function floorRow(tier: number): YunaStats {
  const at = (k: AeonStatKey | 'luck'): number => ENCOUNTERS_YUNA_FLOOR[k][tier] as number;
  return { hp: at('hp'), mp: at('mp'), str: at('str'), def: at('def'), mag: at('mag'), mdef: at('mdef'), agi: at('agi'), eva: at('eva'), acc: at('acc'), luck: at('luck') };
}

/** `int(a * b)` for the section's fractions stored as evaluated expressions (`1 / 7`): a tiny epsilon keeps a float 332.99999999999994 from truncating one low. */
const truncProduct = (a: number, b: number): number => Math.trunc(a * b + 1e-9);

/**
 * One aeon's nine stats and Luck from Yuna's, at a battle count, without Aeon's Soul training (`trained` adds, per stat). `capped: false` returns the formula's raw output (the tests compare the
 * canonical blocks with it).
 */
export function aeonStatsFromYuna(aeonId: string, yuna: YunaStats, battles: number, opts: { trained?: Partial<YunaStats>; capped?: boolean } = {}): Omit<StatBlock, 'maxHp' | 'maxMp'> {
  const coefficients = AEON_STAT_COEFFICIENTS[aeonId];
  if (coefficients === undefined) throw new Error(`endgame-aeons: no stat coefficients for aeon '${aeonId}'`);
  const floor = floorRow(encounterTier(battles));
  const yunaPb = powerBase(yuna);
  const floorPb = powerBase(floor);
  const out: Record<string, number> = {};
  for (const key of AEON_STAT_KEYS) {
    const [xPercent, yCoef] = coefficients[key];
    const fromYuna = Math.floor((yuna[key] * xPercent) / 100) + truncProduct(yunaPb, yCoef);
    const fromFloor = Math.floor((floor[key] * xPercent) / 100) + truncProduct(floorPb, yCoef);
    out[key] = Math.max(fromYuna, fromFloor) + (opts.trained?.[key] ?? 0);
  }
  out.luck = yuna.luck + (opts.trained?.luck ?? 0);
  if (opts.capped !== false) for (const key of [...AEON_STAT_KEYS, 'luck'] as const) out[key] = Math.min(out[key] as number, AEON_CAPS[key]);
  return out as unknown as Omit<StatBlock, 'maxHp' | 'maxMp'>;
}
