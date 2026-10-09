/**
 * FFX-2 stat builder, part 1: the numbers a girl's stats are made of.  Level from experience, the dressphere's growth
 * formulas, the Special dresspheres' grid term, the percent / flat / clamp stage, the pool rules of a dress change, and the
 * maximum-HP recompute that Double HP and the Break HP Limit ability reach.
 *
 * **Game case: FFX-2 only** (FFX has no levels-by-job, no dresspheres and no garment grids).  Source: FFX-2.exe, Steam
 * build 25501027 (SHA-256 6EA7F142...CD69), image base 0x400000.  Spec: `research/re-ffx2-dressphere.md` section 1.
 * Pure, deterministic, no DOM, no engine types (AGENTS.md rule 1).  Not wired into the engine: `dressphere-stats.ts` in
 * `src/battle/ffx2/` still interpolates between wiki anchors.
 *
 * Exe addresses (live build):
 * - 0x0060d6f0  CalculateStats: level + dressphere + the save record's bonus fields -> ten numbers
 * - 0x0060e2d0  the recompute of one save record (part 2 is in `dressphere-recalc.ts`)
 * - 0x00617120  MsCalcChrLevel: experience -> level 1..99 and the next threshold
 * - 0x00618e90  the bonus block builder (see `dressphere-abilities.ts`)
 * - 0x0060eca0  the save record's HP / MP follow the new maxima when the dressphere changed
 * - 0x0060b540 / 0x0060b580  the same ratio rule on the battle character (a dress change in battle)
 * - 0x00636560  maximum HP / MP of the battle character from the base maxima, Double HP / MP and the limit abilities
 * - 0x00619fc0  the three HP states (dead, in danger, fine) the SOS abilities test
 *
 * **Arithmetic.** All of it is 32-bit: a product that does not fit wraps, a division rounds toward zero (including a
 * negative percentage of a pool), and a clamp tests the low bound first (`clampInt`).
 */

import { clampInt, s32, sdiv } from './intops.ts';
import { FFX2_GIRL_JOB, FFX2_LEVEL_CURVE, jobGrowth, type Ffx2JobGrowth } from './dressphere-growth.ts';

// ---------------------------------------------------------------------------------------------------
// Which save record, which girl
// ---------------------------------------------------------------------------------------------------

/** Number of save records (the three girls, their children and the extra party members): ids 0 to 22. */
export const FFX2_SAVE_RECORDS = 23;

/**
 * The save record an id reads its level and curve from (exe 0x0060c250): the two "child" ids of each girl read the girl's record.
 * Ids 3 and 4 are Yuna's, 5 and 6 Rikku's, 7 and 8 Paine's.  Everything else is its own record.
 */
export function girlIndex(chr: number): number {
  const c = chr & 0xff;
  if (c === 3 || c === 4) return 0;
  if (c === 5 || c === 6) return 1;
  if (c === 7 || c === 8) return 2;
  return c;
}

/**
 * The dressphere a girl actually wears for the id stored in her record (exe 0x0061ddc0 and the `| 0x5000` of 0x0060c920).
 * A record of the three girls (0 to 2) and the child records of their Special pods (3 to 8, which use their parent's column)
 * go through the 34 x 3 table; for any other record the low 12 bits come back unchanged.  An index of 0x22 or more reads
 * past the table in the game (it is never stored), so it is not defined here.
 */
export function girlJob(chr: number, job: number): number {
  const g = girlIndex(chr);
  const row = FFX2_GIRL_JOB[job & 0xfff];
  if (g < 3 && row) return (row[g] as number) & 0xfff | 0x5000;
  return (job & 0xfff) | 0x5000;
}

/**
 * The three Special dresspheres (exe 0x0061dd70).  `anyStage` false: only the stage-1 ids 0x500f, 0x5012, 0x5015 (the
 * main unit); true: also the two pods of each (0x5010, 0x5011, 0x5013, 0x5014, 0x5016, 0x5017).
 */
export function isSpecialJob(job: number, anyStage: boolean): boolean {
  switch (job) {
    case 0x500f:
    case 0x5012:
    case 0x5015:
      return true;
    case 0x5010:
    case 0x5011:
    case 0x5013:
    case 0x5014:
    case 0x5016:
    case 0x5017:
      return anyStage;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------------------------------
// Level
// ---------------------------------------------------------------------------------------------------

/**
 * `MsCalcChrLevel` (exe 0x00617120) for the record's experience and the girl's curve row `[a, b]`.  The experience to leave
 * level L is `T(L) = ((a * (L + 1) + b) * L * L) / 10`.  The level is the first L (1 to 99) whose T the experience does not
 * reach (the comparison is signed).  The record's "next level" field receives the last T computed: 0 at level 99 (the loop
 * stops before computing one), or a T of 0 or less, which also stops the loop at that level.
 */
export function levelFromExp(exp: number, a: number, b: number): { level: number; nextExp: number } {
  const e = s32(exp);
  let level = 1;
  let next = 0;
  for (;;) {
    next = 0;
    if (level >= 99) break;
    next = sdiv(Math.imul(Math.imul(a * (level + 1) + b, level), level), 10);
    if (next <= 0) break;
    if (e < next) break;
    level += 1;
  }
  return { level, nextExp: next };
}

/**
 * The level of save record `chr` with experience `exp` (children read their parent's record and curve).  A record number of
 * 23 or more has no record: the game answers level 1 and writes nothing.
 */
export function saveLevel(chr: number, exp: number): { level: number; nextExp: number | undefined } {
  const idx = girlIndex(chr) & 0xff;
  const curve = FFX2_LEVEL_CURVE[idx];
  if (idx >= FFX2_SAVE_RECORDS || !curve) return { level: 1, nextExp: undefined };
  return levelFromExp(exp, curve[0], curve[1]);
}

// ---------------------------------------------------------------------------------------------------
// CalculateStats
// ---------------------------------------------------------------------------------------------------

/** The ten numbers, in the game's order: HP, MP, Strength, Defense, Magic, Magic Defense, Agility, Accuracy, Evasion, Luck. */
export type Ffx2StatTen = [number, number, number, number, number, number, number, number, number, number];

/** The save record's bonus fields: HP (u32 `+4`), MP (u32 `+8`) and eight bytes from `+0xc` (Strength, Defense, Magic, Magic Defense, Agility, Luck, Evasion, Accuracy). */
export interface Ffx2SaveBonus {
  readonly hp: number;
  readonly mp: number;
  readonly bytes: readonly number[];
}

/** One stat row `[a, d1, c, d2, d3]` at level `L`: `L/d1 - (L*L/16)/d2/d3 + a*L/10 + c`. */
function growthRow(level: number, r: readonly number[]): number {
  const q = sdiv(sdiv(sdiv(Math.imul(level, level), 16), r[3] as number), r[4] as number);
  return s32(s32(sdiv(level, r[1] as number) - q) + sdiv(Math.imul(r[0] as number, level), 10) + (r[2] as number));
}

/**
 * `CalculateStats` (exe 0x0060d6f0) for a party member.  `found` is the game's return value: 1 when the dressphere has a record.
 * The growth part is skipped (all ten stay 0) when any of the three HP bytes is 0; the save record's bonuses are then added
 * regardless.  With no record (`bonus` undefined) nothing is added.
 */
export function calculateStats(level: number, job: Ffx2JobGrowth | undefined, bonus?: Ffx2SaveBonus): { found: boolean; stats: Ffx2StatTen } {
  const s: Ffx2StatTen = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (job) {
    const [h0, h1, h2] = job.hp;
    if (h0 !== 0 && h1 !== 0 && h2 !== 0) {
      const l2 = Math.imul(level, level);
      s[0] = s32(s32(Math.imul(h0, level) - sdiv(Math.imul(l2, 10), h1)) + h2);
      const [m0, m1, m2] = job.mp;
      s[1] = s32(s32(sdiv(Math.imul(m0, level), 10) - sdiv(l2, m1)) + m2);
      // file order: str, vit, mag, spirit, dex, avoid, hit, luck  ->  slots 2, 3, 4, 5, 6, 8, 7, 9
      const slot = [2, 3, 4, 5, 6, 8, 7, 9] as const;
      job.stats.forEach((row, k) => {
        s[slot[k] as number] = growthRow(level, row);
      });
    }
  }
  if (bonus) {
    const b = bonus.bytes;
    s[0] = s32(s[0] + bonus.hp);
    s[1] = s32(s[1] + bonus.mp);
    s[2] = s32(s[2] + (b[0] as number));
    s[3] = s32(s[3] + (b[1] as number));
    s[4] = s32(s[4] + (b[2] as number));
    s[5] = s32(s[5] + (b[3] as number));
    s[6] = s32(s[6] + (b[4] as number));
    s[9] = s32(s[9] + (b[5] as number));
    s[8] = s32(s[8] + (b[6] as number));
    s[7] = s32(s[7] + (b[7] as number));
  }
  return { found: job !== undefined, stats: s };
}

/** `calculateStats` for a dressphere id (the record is looked up by the low 12 bits; 0x22 and above has none). */
export function calculateStatsFor(level: number, job: number, bonus?: Ffx2SaveBonus): { found: boolean; stats: Ffx2StatTen } {
  return calculateStats(level, jobGrowth(job), bonus);
}

// ---------------------------------------------------------------------------------------------------
// The percent / flat / clamp stage of a save record
// ---------------------------------------------------------------------------------------------------

/** The bonus block the equipment and abilities add into (30 ints, see `dressphere-abilities.ts`). */
export const BLOCK_HP_PERCENT = 0;
/** Block slot of the second-layer HP percent (only a player-side monster's dressphere fills it). */
export const BLOCK_HP_PERCENT_2 = 10;
/** First of the six Special-dressphere scale terms (HP, MP, Strength, Defense, Magic, Magic Defense). */
export const BLOCK_SCALE = 20;
/** Number of ints in the block. */
export const BLOCK_SIZE = 30;

/** What the stage produces: the record's maxima and its eight stat bytes. */
export interface Ffx2SaveStats {
  readonly maxHp: number;
  readonly maxMp: number;
  readonly str: number;
  readonly def: number;
  readonly mag: number;
  readonly mdef: number;
  readonly agi: number;
  readonly acc: number;
  readonly eva: number;
  readonly lck: number;
}

export interface Ffx2FinalInput {
  /** `calculateStats(...).stats`. */
  readonly base: Readonly<Ffx2StatTen>;
  /** The 30-int bonus block. */
  readonly block: readonly number[];
  /** `isSpecialJob(job, true)`. */
  readonly special: boolean;
  /** The record's first auto-ability word has Break HP Limit (bit 14). */
  readonly hpLimitBroken: boolean;
  /** ... Break MP Limit (bit 15). */
  readonly mpLimitBroken: boolean;
}

const hundred = (v: number, pct: number): number => sdiv(Math.imul(v, pct), 100);

/**
 * The tail of the record recompute (exe 0x0060e2d0, after the block is built).  Order:
 * 1. a Special dressphere multiplies each of the ten numbers by `(term + 25) / 25` (`term` = the grid's node count in the
 *    first six slots, 0 in the last four);
 * 2. HP and MP take two percent layers, one after the other (`v + v*p1/100`, then `v + v*p0/100`; a negative percent rounds
 *    toward zero too);
 * 3. the eight stats add the two flat slots of the block;
 * 4. maxima clamp to 1..9999 (99999 with Break HP Limit) and 1..999 (9999 with Break MP Limit); the stats to 1..255, Evasion to 0..255.
 */
export function finalStats(inp: Ffx2FinalInput): Ffx2SaveStats {
  const b = inp.block;
  const c = [...inp.base];
  if (inp.special) {
    for (let k = 0; k < 10; k++) c[k] = sdiv(Math.imul(s32((b[BLOCK_SCALE + k] ?? 0) + 25), c[k] as number), 25);
  }
  const hp1 = s32((c[0] as number) + hundred(c[0] as number, b[BLOCK_HP_PERCENT_2] ?? 0));
  const hp2 = s32(hp1 + hundred(hp1, b[BLOCK_HP_PERCENT] ?? 0));
  const mp1 = s32((c[1] as number) + hundred(c[1] as number, b[11] ?? 0));
  const mp2 = s32(mp1 + hundred(mp1, b[1] ?? 0));
  const flat = (k: number): number => s32((c[k] as number) + s32((b[10 + k] ?? 0) + (b[k] ?? 0)));
  return {
    maxHp: clampInt(hp2, 1, inp.hpLimitBroken ? 99999 : 9999),
    maxMp: clampInt(mp2, 1, inp.mpLimitBroken ? 9999 : 999),
    str: clampInt(flat(2), 1, 255),
    def: clampInt(flat(3), 1, 255),
    mag: clampInt(flat(4), 1, 255),
    mdef: clampInt(flat(5), 1, 255),
    agi: clampInt(flat(6), 1, 255),
    acc: clampInt(flat(7), 1, 255),
    eva: clampInt(flat(8), 0, 255),
    lck: clampInt(flat(9), 1, 255),
  };
}

// ---------------------------------------------------------------------------------------------------
// Pools that follow a change of maximum
// ---------------------------------------------------------------------------------------------------

/**
 * `HpScale` / `MpScale` (exe 0x0060b540, 0x0060b580, the same code twice): the new value of a pool when its maximum moves from
 * `oldMax` to `newMax` -- `(oldMax/2 + value*newMax) / oldMax` with `oldMax` raised to 1, so it rounds to the nearest whole
 * number -- except that a result below 1 for a pool that was above 0 gives the OLD value back (not 1).
 */
export function scalePool(value: number, newMax: number, oldMax: number): number {
  const om = oldMax < 1 ? 1 : oldMax;
  let r = sdiv(s32(sdiv(om, 2) + Math.imul(value, newMax)), om);
  if (r < 1 && value > 0) r = value;
  return r;
}

/**
 * The save record's own copy of the rule (exe 0x0060eca0), run when the stored dressphere differs from the one the stats were
 * just built for: both pools are scaled as `scalePool` does, and in every case clamped to 0..new maximum.  Without a change
 * they are only clamped.
 */
export function keepRatioSave(
  rec: { hp: number; mp: number; maxHp: number; maxMp: number },
  oldMaxHp: number,
  oldMaxMp: number,
  jobChanged: boolean,
): { hp: number; mp: number } {
  let hp = rec.hp;
  let mp = rec.mp;
  if (jobChanged) {
    hp = scalePool(rec.hp, rec.maxHp, oldMaxHp);
    mp = scalePool(rec.mp, rec.maxMp, oldMaxMp);
  }
  return { hp: clampInt(hp, 0, rec.maxHp), mp: clampInt(mp, 0, rec.maxMp) };
}

// ---------------------------------------------------------------------------------------------------
// Maximum HP / MP of the battle character
// ---------------------------------------------------------------------------------------------------

/** Bit 11 of the status word at `Chr+0x434`: Double HP (the status, 0x800). */
export const STATUS_HP_DOUBLE = 0x800;
/** Bit 12: Double MP (0x1000). */
export const STATUS_MP_DOUBLE = 0x1000;

export interface Ffx2PoolMaxInput {
  /** `Chr+0x38c` / `+0x390`: the maxima the record gave, before the status. */
  readonly baseMaxHp: number;
  readonly baseMaxMp: number;
  /** `Chr+0x434`. */
  readonly status1: number;
  /** `Chr+0x650` (Break HP Limit 0x4000, Break MP Limit 0x8000). */
  readonly word0: number;
  /** `Chr+0x3ad`: a monster flag that lifts both caps to 999,999,999. */
  readonly unlimited: boolean;
  readonly hp: number;
  readonly mp: number;
}

/**
 * The maximum-HP recompute (exe 0x00636560): `max = clamp(factor * base, 0, cap)` with factor 2 under Double HP (Double MP),
 * and the cap 9999 (999 for MP), raised to 99999 (9999) by the limit ability, or 999,999,999 when the monster flag is set.
 * HP and MP are then clamped into 0..max.
 */
export function poolMaxima(i: Ffx2PoolMaxInput): { maxHp: number; maxMp: number; hp: number; mp: number } {
  const hpCap = i.unlimited ? 999999999 : (i.word0 & 0x4000) !== 0 ? 99999 : 9999;
  const mpCap = i.unlimited ? 999999999 : (i.word0 & 0x8000) !== 0 ? 9999 : 999;
  const maxHp = clampInt(Math.imul((i.status1 & STATUS_HP_DOUBLE) !== 0 ? 2 : 1, i.baseMaxHp), 0, hpCap);
  const maxMp = clampInt(Math.imul((i.status1 & STATUS_MP_DOUBLE) !== 0 ? 2 : 1, i.baseMaxMp), 0, mpCap);
  return { maxHp, maxMp, hp: clampInt(i.hp, 0, maxHp), mp: clampInt(i.mp, 0, maxMp) };
}

/**
 * The HP state (exe 0x00619fc0): 2 when HP is below 1, 1 when `HP*3/max` rounds to 0 (HP below a third of the maximum), else 0.
 * With a maximum of 0 the second test reads 0 and the state follows HP alone.
 */
export function hpState(hp: number, maxHp: number): 0 | 1 | 2 {
  const third = maxHp !== 0 ? sdiv(Math.imul(hp, 3), maxHp) : 0;
  if (hp < 1) return 2;
  if (third < 1) return 1;
  return 0;
}
