/**
 * "What is this character's stat sheet actually worth, with their gear on?"
 * — the pure answer, for menus [ffx-combat-core §9].
 *
 * The subtlety this module exists to encode: **FFX equipment never awards
 * stat points.** §9 is explicit that Strength +10 % "does **not** raise the
 * Strength stat"; it is `dmg += dmg * 10 // 100` at step 8 of the damage
 * chain. So an "effective Strength" number is a lie — and a badly wrong one,
 * because the `strength` POWER term is cubic (`str^3 // 32 + 30`,
 * §2.2): 31 -> 34 would be roughly +31 % damage, not +10 %.
 *
 * Exactly two fields of a {@link StatBlock} really do move: `maxHp` and
 * `maxMp`, via the `hp-N` / `mp-N` families, and those are the only rows
 * whose `effective` differs from `base`. Everything else reports
 * `effective === base` plus the percentage and *where it lands*
 * ({@link StatBonusKind}) — which is what a prep menu needs in order to stop
 * claiming that equipment "isn't reflected yet".
 *
 * Pure: no engine state, no RNG, no mutation of the member passed in. Reads
 * the same auto-ability tables `src/battle/ffx/formulas.ts` reads at steps
 * 8/9, through `equipment.ts`, so the menu can never drift from the chain.
 */

import type { StatBlock } from '../common/types.ts';
import { bearerHasAuto, bonusPercentFor, type BonusFamily, type EquipmentBearer } from './equipment.ts';
import { idiv } from './math.ts';

/** A member build or a live combatant — anything with stats and (maybe) gear. */
export interface StatsBearer extends EquipmentBearer {
  stats: StatBlock;
}

/** The ten rows a stat sheet shows, in display order. */
export type EffectiveStatKey = 'maxHp' | 'maxMp' | 'str' | 'def' | 'mag' | 'mdef' | 'agi' | 'luck' | 'eva' | 'acc';

/**
 * How a row's `bonusPercent` reaches combat:
 * - `pool` — the stat itself changes (`maxHp`/`maxMp`, §9).
 * - `damage` — step 8, the wearer's outgoing damage of one type (§2.4).
 * - `mitigation` — step 9, incoming damage of one type (§2.4).
 * - `none` — no §9 auto-ability touches this stat at all.
 */
export type StatBonusKind = 'pool' | 'damage' | 'mitigation' | 'none';

export interface EffectiveStatRow {
  key: EffectiveStatKey;
  /** Menu label, e.g. `'Magic Def'`. */
  label: string;
  /** The Sphere Grid value, before any equipment. */
  base: number;
  /**
   * What the engine actually uses for this field. Equal to `base` for every
   * `damage`/`mitigation`/`none` row — see this file's header: only the two
   * pools are stat changes, the rest are damage-chain steps.
   *
   * For the two pools this is `StatBlock.maxHp`/`maxMp` as authored, **not**
   * a re-derivation: that field is the contract ("effective maximum HP after
   * HP+%"), it is what `PartyPrepScreen`'s field card and the battle HUD both
   * draw, and a menu that quietly recomputed it could disagree with them.
   * {@link effectivePool} is the §9 derivation those fields must satisfy, and
   * `tests/unit/ffx-effective-stats.test.ts` holds every shipped build to it.
   */
  effective: number;
  /** Best `+N%` the gear carries for this row, 0 when none. */
  bonusPercent: number;
  kind: StatBonusKind;
}

export interface EffectiveStats {
  rows: EffectiveStatRow[];
  byKey: Record<EffectiveStatKey, EffectiveStatRow>;
}

/** §9: pools clamp at 9 999 / 999, or 99 999 / 9 999 with the Break limit ability. */
const POOL_CAP = { hp: 9999, mp: 999 } as const;
const POOL_BREAK_CAP = { hp: 99999, mp: 9999 } as const;

/**
 * `maxHP = baseHP * (100+N) // 100`, clamped [ffx-combat-core §9].
 *
 * `//` is floor, so the truncation is deliberate and load-bearing: HP 1 375
 * with HP +5 % is 1 443, not 1 444. Uses the engine's own {@link idiv} rather
 * than a local `Math.floor` so there is one definition of `//` in the repo.
 */
export function effectivePool(member: StatsBearer, pool: 'hp' | 'mp'): number {
  const base = pool === 'hp' ? member.stats.hp : member.stats.mp;
  const pct = bonusPercentFor(member, pool);
  const raised = idiv(base * (100 + pct), 100);
  const breaks = bearerHasAuto(member, pool === 'hp' ? 'break-hp-limit' : 'break-mp-limit');
  return Math.min(raised, breaks ? POOL_BREAK_CAP[pool] : POOL_CAP[pool]);
}

/**
 * Rows, in the order a stat sheet lists them.
 *
 * `family` is the §9 auto-ability family that feeds the row; `null` for the
 * four stats no auto-ability in §9's table touches (Agility, Luck, Evasion,
 * Accuracy — gear moves turn order only through Haste, and hit rate only
 * through Darkness/Aim, never through a `+N%` on the stat).
 */
const ROWS: ReadonlyArray<{
  key: EffectiveStatKey;
  /** The `StatBlock` field holding this row's *effective* value. */
  stat: keyof StatBlock;
  /** The `StatBlock` field holding its pre-equipment value; same field when gear cannot move it. */
  baseStat: keyof StatBlock;
  label: string;
  family: BonusFamily | null;
  kind: StatBonusKind;
}> = [
  { key: 'maxHp', label: 'HP', stat: 'maxHp', baseStat: 'hp', family: 'hp', kind: 'pool' },
  { key: 'maxMp', label: 'MP', stat: 'maxMp', baseStat: 'mp', family: 'mp', kind: 'pool' },
  { key: 'str', label: 'Strength', stat: 'str', baseStat: 'str', family: 'strength', kind: 'damage' },
  { key: 'def', label: 'Defense', stat: 'def', baseStat: 'def', family: 'defense', kind: 'mitigation' },
  { key: 'mag', label: 'Magic', stat: 'mag', baseStat: 'mag', family: 'magic', kind: 'damage' },
  { key: 'mdef', label: 'Magic Def', stat: 'mdef', baseStat: 'mdef', family: 'magic-def', kind: 'mitigation' },
  { key: 'agi', label: 'Agility', stat: 'agi', baseStat: 'agi', family: null, kind: 'none' },
  { key: 'luck', label: 'Luck', stat: 'luck', baseStat: 'luck', family: null, kind: 'none' },
  { key: 'eva', label: 'Evasion', stat: 'eva', baseStat: 'eva', family: null, kind: 'none' },
  { key: 'acc', label: 'Accuracy', stat: 'acc', baseStat: 'acc', family: null, kind: 'none' },
];

/**
 * The full equipped stat sheet for one party member.
 *
 * ```ts
 * const { byKey } = effectiveStats(tidusGagazetBuild);
 * byKey.maxHp;  // { base: 2200, effective: 2420, bonusPercent: 10, kind: 'pool' }
 * byKey.str;    // { base: 31,   effective: 31,   bonusPercent: 10, kind: 'damage' }
 * ```
 *
 * A bearer with no `equipment` (an aeon, an enemy) simply reports every
 * `bonusPercent` as 0; its pools still read from `maxHp`/`maxMp`, which for
 * an un-equipped fighter already equal `hp`/`mp`.
 */
export function effectiveStats(member: StatsBearer): EffectiveStats {
  const rows = ROWS.map(({ key, label, stat, baseStat, family, kind }): EffectiveStatRow => ({
    key,
    label,
    base: member.stats[baseStat],
    effective: member.stats[stat],
    bonusPercent: family === null ? 0 : bonusPercentFor(member, family),
    kind,
  }));
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r])) as Record<EffectiveStatKey, EffectiveStatRow>;
  return { rows, byKey };
}
