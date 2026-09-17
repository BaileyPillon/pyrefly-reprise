/**
 * Accessory stat effects [ffx2-combat-core §5.4; ffx2-vegnagun-shuyin §6.7].
 *
 * `setup.ts` has always documented a girl's stat block as
 * `level + dressphere + garment grid + accessories`, and every build file
 * annotates what it equips ("max HP +100%", "Str +30"). Only the first three
 * terms were ever computed: the two `accessories` ids were copied onto the unit
 * and then read by nothing, so **every accessory in the game did nothing**.
 *
 * That silently invalidated the researched loadouts. The Chapter 5 case that
 * exposed it: `ffx2-vegnagun-shuyin.md` §7.2 makes the Tail fight's whole
 * survival condition "keep everyone **above 1,323 HP** so Noli Me Tangere can't
 * wipe" — Noli Me Tangere is a flat 1,250 constant of `damageType: 'other'`, so
 * neither Shell, Protect, Def nor MDef touches it and §7.2 says outright that
 * "raw max HP is the only defence" in that battle. The §6.3/§6.7 typical
 * loadout answers it with a **Crystal Bangle (max HP +100%)** on all three
 * girls. With accessories inert, a Lv 46 White Mage stands at 1,244 max HP and
 * is killed outright by the first Noli Me Tangere of the chain, from full, with
 * no play available to prevent it. With the bangle read she stands at 2,488 and
 * the encounter plays as researched.
 *
 * This table is the engine's cited **baseline**, in the same spirit as
 * `dressphere-stats.ts` and the fallback Grids in `garment-grids.ts`: the data
 * layer may supersede it later with a full `AccessoryDef` registry. Only the
 * ids the shipped builds equip, plus the rest of §5.4's statistic accessories,
 * are transcribed; anything unknown contributes nothing rather than throwing.
 *
 * **Stats only.** The status half of a few accessories — Ribbon's blanket
 * immunity, Adamantite's constant Protect + Shell, the "-proof" riders — is not
 * modelled here; those are statuses, not stats, and no shipped build depends on
 * one. Percentage pools multiply the dressphere's own max HP / max MP, which is
 * how the source states them ("max HP +100%").
 */

import type { StatBlock } from '../common/types.ts';

/** One accessory's contribution: flat stat adds and/or pool multipliers. */
export interface AccessoryEffect {
  /** Flat adds, applied after the Garment Grid's equip bonus. */
  stats?: Partial<StatBlock>;
  /** `max HP +N%` as a multiplier on the dressphere pool: 1.0 = +100%. */
  hpPercent?: number;
  /** `max MP +N%`, same shape. */
  mpPercent?: number;
}

/**
 * §5.4 "Statistic accessories", plus the two §6.7 late-game specials the
 * Chapter 5 research names. `[verified: 2 sources]` in both sections.
 */
const ACCESSORIES: Readonly<Record<string, AccessoryEffect>> = {
  // --- flat single-stat -----------------------------------------------------
  amulet: { stats: { mag: 10 } },
  wristband: { stats: { str: 10 } },
  'mythril-gloves': { stats: { def: 20 } },
  'defense-veil': { stats: { mdef: 20 } },
  'power-wrist': { stats: { str: 20 } },
  'tarot-card': { stats: { mag: 20 } },
  'diamond-gloves': { stats: { def: 40 } },
  'mystery-veil': { stats: { mdef: 40 } },
  'hyper-wrist': { stats: { str: 30 } },
  talisman: { stats: { mag: 30 } },
  'oath-veil': { stats: { mdef: 60 } },
  'crystal-gloves': { stats: { def: 60 } },
  'power-gloves': { stats: { str: 40 } },
  'pixie-dust': { stats: { mag: 40 } },
  'kaiser-knuckles': { stats: { str: 50 } },
  'crystal-ball': { stats: { mag: 50 } },
  "rabite's-foot": { stats: { luck: 100 } },

  // --- flat pairs -----------------------------------------------------------
  gauntlets: { stats: { str: 5, def: 5 } },
  tiara: { stats: { mag: 5, mdef: 5 } },
  'muscle-belt': { stats: { str: 10, def: 10 } },
  circlet: { stats: { mag: 10, mdef: 10 } },
  'black-belt': { stats: { str: 20, def: 20 } },
  'hypno-crown': { stats: { mag: 20, mdef: 20 } },
  'champion-belt': { stats: { str: 40, def: 40 } },
  'regal-crown': { stats: { mag: 40, mdef: 40 } },
  'favorite-outfit': { stats: { eva: 10, luck: 10 } },
  'gris-gris-bag': { stats: { def: 4, mdef: 4 } },

  // --- pools ----------------------------------------------------------------
  'iron-bangle': { hpPercent: 0.2 },
  'titanium-bangle': { hpPercent: 0.4 },
  'mythril-bangle': { hpPercent: 0.6 },
  'crystal-bangle': { hpPercent: 1.0 },
  'silver-bracer': { mpPercent: 0.4 },
  'gold-bracer': { mpPercent: 0.6 },
  'rune-bracer': { mpPercent: 1.0 },

  // §6.7: "Constant Protect + Shell, HP +100%, Def +120, MDef +120, Agi -30".
  // The constant Protect/Shell half is a status and is not modelled here.
  adamantite: { hpPercent: 1.0, stats: { def: 120, mdef: 120, agi: -30 } },
  // Ribbon is pure status immunity — no stat line at all. Listed so that it
  // reads as "known and deliberately empty" rather than "missing".
  ribbon: {},
};

/** One accessory's effect, or `undefined` when the table does not carry it. */
export function accessoryEffect(id: string): AccessoryEffect | undefined {
  return ACCESSORIES[id];
}

/**
 * Layer a girl's equipped accessories onto a stat block.
 *
 * Percentages multiply `base` — the dressphere's own pool — so two bangles add
 * rather than compound, matching the source's flat "+N%" wording. `hp`/`mp`
 * track their maxima only while they were already full (a fresh girl); a girl
 * carried in wounded from the previous link of a chain keeps her live HP.
 */
export function withAccessories(base: StatBlock, accessories: readonly string[]): StatBlock {
  if (accessories.length === 0) return base;
  const out: StatBlock = { ...base };
  let hpPercent = 0;
  let mpPercent = 0;

  for (const id of accessories) {
    const effect = accessoryEffect(id);
    if (!effect) continue;
    hpPercent += effect.hpPercent ?? 0;
    mpPercent += effect.mpPercent ?? 0;
    for (const [key, value] of Object.entries(effect.stats ?? {}) as Array<[keyof StatBlock, number]>) {
      out[key] = Math.max(0, (out[key] ?? 0) + value);
    }
  }

  const wasFullHp = out.hp >= out.maxHp;
  const wasFullMp = out.mp >= out.maxMp;
  out.maxHp = Math.floor(base.maxHp * (1 + hpPercent)) + (out.maxHp - base.maxHp);
  out.maxMp = Math.floor(base.maxMp * (1 + mpPercent)) + (out.maxMp - base.maxMp);
  if (wasFullHp) out.hp = out.maxHp;
  if (wasFullMp) out.mp = out.maxMp;
  return out;
}
