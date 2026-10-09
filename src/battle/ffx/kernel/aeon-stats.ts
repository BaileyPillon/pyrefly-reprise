/**
 * FFX aeon stat kernel: how an aeon's battle stats are built from Yuna's stats, the aeon's own bonuses, the number of
 * battles fought and its fixed equipment (`pp_BtlBuildPartyStats`, VA 0x007860f0, the branch for slots 8 to 0x11), and the
 * joint-action CTB of the Magus Sisters (`pp_BtlSummonCtb`, VA 0x007b1aa0, which the Delta Attack action starts).
 *
 * **Game case: FFX only** (FFX-2 has no aeons in this sense). Source: FFX.exe, Steam build 25501027, SHA-256
 * 0537B2A1...686D, with the data tables of the same install: `ply_rom` (the coefficient row of each aeon, bytes 0x18 to 0x29
 * of record 8 to 0x11), `sum_assure` (the minimum stats per battle-count tier, 20 tiers x 10 aeons) and `a_ability` (the
 * auto-ability records the equipment names). Spec: `research/re-ffx-overdrive-steal-aeons.md` section 4. Not wired into
 * the engine. Pure.
 *
 * The game keeps the result in the party save record (maximum HP and MP at +0x24 and +0x28, the eight stats at
 * +0x2f..+0x36) and rebuilds all ten aeons after every battle (`FUN_00785fc0`, which runs right after the AP settle) and
 * whenever Yuna's own stats change. At battle start `FUN_0079c5f0` copies those bytes into the battle character, adding the
 * character's equipment-bonus bytes (`Chr+0x5b0..0x5b7`, 0 unless something sets them).
 */

import { clamp } from './ap-award.ts';
import { delayForRank } from './ctb.ts';
import { mul, sdiv, udiv } from './int32.ts';

/** First aeon slot (Valefor) and the number of aeon slots (Valefor, Ifrit, Ramuh, Shiva, Bahamut, Anima, Yojimbo, then the three Magus Sisters). */
export const AEON_FIRST_SLOT = 8;
export const AEON_SLOT_COUNT = 10;
/** The battle counter is divided by this to give the tier. */
export const BATTLES_PER_TIER = 30;
/** The highest tier (reached after 600 battles). */
export const MAX_TIER = 20;

/** The eight stats in the order the game stores them. */
export const STAT_NAMES = ['str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc'] as const;

/** A party member's raw stats as `FUN_00785b60` builds them (HP and MP are unsigned 32-bit, the others sums of two bytes). */
export interface PartyRawStats {
  hp: number;
  mp: number;
  /** STR, DEF, MAG, MDEF, AGI, LUCK, EVA, ACC (each the sum of a save byte and a bonus byte, 0 to 510). */
  stats: number[];
}

/**
 * `FUN_00785b60(id)` for a party member below 8: the save record's HP (+4) and MP (+8) and the eight stat bytes (+0xc to
 * +0x13), plus the stat-bonus record (`bonusHp` x 50 HP, `bonusMp` x 5 MP and one byte per stat), which the Sphere Grid fills.
 */
export function partyRawStats(
  save: { hp: number; mp: number; stats: readonly number[] },
  bonus: { hp: number; mp: number; stats: readonly number[] },
): PartyRawStats {
  return {
    hp: (save.hp + Math.imul(bonus.hp, 0x32)) >>> 0,
    mp: (save.mp + Math.imul(bonus.mp, 5)) >>> 0,
    stats: save.stats.map((v, i) => (v & 0xff) + ((bonus.stats[i] ?? 0) & 0xff)),
  };
}

/** The 18 bytes of an aeon's `ply_rom` record from +0x18 to +0x29: the coefficients of the formulas below. */
export interface AeonRow {
  /** +0x18 and +0x19: HP = `hpPerSum * S + hpPerHp * YunaHP / 100`. */
  hpPerSum: number;
  hpPerHp: number;
  /** +0x1a and +0x1b: MP = `mpPerSum * S / 10 + mpPerMp * YunaMP / 100`. */
  mpPerSum: number;
  mpPerMp: number;
  /** +0x1c/+0x1d, +0x1e/+0x1f, +0x20/+0x21, +0x22/+0x23, +0x24/+0x25, +0x26/+0x27, +0x28/+0x29: per stat STR, DEF, MAG, MDEF, AGI, EVA, ACC: the divisor of S and the multiplier (per ten) of Yuna's own stat. A divisor of 0 faults in the game. */
  div: number[];
  mul: number[];
}

/** Builds the row from the 18 bytes. */
export function aeonRowOf(bytes: readonly number[]): AeonRow {
  return {
    hpPerSum: bytes[0] as number,
    hpPerHp: bytes[1] as number,
    mpPerSum: bytes[2] as number,
    mpPerMp: bytes[3] as number,
    div: [4, 6, 8, 10, 12, 14, 16].map((i) => bytes[i] as number),
    mul: [5, 7, 9, 11, 13, 15, 17].map((i) => bytes[i] as number),
  };
}

/** A row of `sum_assure`: minimum HP, MP and the stats STR, DEF, MAG, MDEF, ACC, EVA, AGI (this order). */
export interface AssureRow {
  hp: number;
  mp: number;
  /** STR, DEF, MAG, MDEF, ACC, EVA, AGI. */
  stats: readonly number[];
}

/** The tier of a battle count: `floor(count / 30)` (unsigned), at most 20. 0 means no minimum applies. */
export function tierOf(battles: number): number {
  return Math.min(udiv(battles, BATTLES_PER_TIER), MAX_TIER);
}

/** The `sum_assure` record number of an aeon in a tier: `slot + (5 * tier - 9) * 2`, i.e. ten records per tier. */
export function assureRecord(slot: number, tier: number): number {
  return slot + (5 * tier - 9) * 2;
}

/** One auto-ability of the aeon's equipment, as its `a_ability` record gives it. */
export interface AbilityEffect {
  /** +0x55: the percent. */
  pct: number;
  /** +0x56 (u16): which of the 14 entries (bit k) it applies to: 0 to 7 the eight stats, 8 HP, 9 MP, 10 to 13 the four damage modifiers. */
  mask: number;
  /** +0x62, +0x64, +0x66 (u16): the three flag words OR-ed into the save record (+0x4a, +0x4c, +0x4e). Word 2 bit 9 is Break HP Limit, bit 10 Break MP Limit. */
  wordA: number;
  wordB: number;
  wordC: number;
}

export interface AeonStatsInput {
  /** The aeon's slot, 8 to 0x11. */
  slot: number;
  /** Yuna's raw stats (`partyRawStats` of slot 1). */
  yuna: PartyRawStats;
  /** The aeon's own save-record bonuses: HP (+4), MP (+8) and the eight stat bytes (+0xc to +0x13, STR..ACC order). */
  bonus: { hp: number; mp: number; stats: readonly number[] };
  /** The aeon's current HP and MP (+0x1c, +0x20), clamped to the new maxima. */
  current: { hp: number; mp: number };
  /** The `ply_rom` coefficient row of the aeon. */
  row: AeonRow;
  /** The battle counter (VA 0x011307a4). */
  battles: number;
  /** The `sum_assure` row of this aeon for `tierOf(battles)`; ignored (and not needed) at tier 0. */
  assure: AssureRow | null;
  /** The effects of the equipment abilities that exist, in the order the game reads them (weapon's four, then armor's four). */
  abilities: readonly AbilityEffect[];
}

export interface AeonStatsResult {
  maxHp: number;
  maxMp: number;
  /** STR, DEF, MAG, MDEF, AGI, LUCK, EVA, ACC. */
  stats: number[];
  current: { hp: number; mp: number };
  /** The three flag words written to +0x4a, +0x4c and +0x4e. */
  flags: [number, number, number];
  /** The four damage-modifier percent bytes written at VA 0x02311240 + 4 * slot. */
  damageMods: [number, number, number, number];
}

/**
 * The aeon branch of `pp_BtlBuildPartyStats`, in the game's order.
 *  1. Yuna's HP and MP are clamped to 0..9999 and 0..999, her STR, DEF, MAG, MDEF, AGI, LUCK and ACC to 1..255 and her EVA to 0..255.
 *  2. `S` = HP/100 + MP/10 + ACC + EVA + AGI + MDEF + MAG + DEF + STR of those clamped values (Luck is not in it; the
 *     divisions truncate).
 *  3. HP = `hpPerHp * HP / 100 + hpPerSum * S`; MP = `mpPerMp * MP / 100 + mpPerSum * S / 10`; each stat X (not Luck) =
 *     `S / div + mul * X / 10`.
 *  4. From the second tier on (30 battles) each of HP, MP, STR, DEF, MAG, MDEF, ACC, EVA and AGI is at least the
 *     `sum_assure` value of the aeon's tier.
 *  5. The aeon's own bonuses are added (Luck is Yuna's Luck plus the Luck byte), then the equipment abilities' percents
 *     (`x + x * pct / 100` per entry whose mask bit is set), then the caps: HP 9999 (99999 with Break HP Limit), MP 999 (9999
 *     with Break MP Limit), each stat to 1..255 (EVA 0..255), and the current HP and MP to the new maxima.
 */
export function aeonStats(inp: AeonStatsInput): AeonStatsResult {
  const y = inp.yuna;
  const hp0 = clamp(y.hp | 0, 0, 9999);
  const mp0 = clamp(y.mp | 0, 0, 999);
  const [str0, def0, mag0, mdef0, agi0, luck0, eva0, acc0] = [
    clamp(y.stats[0] as number, 1, 255),
    clamp(y.stats[1] as number, 1, 255),
    clamp(y.stats[2] as number, 1, 255),
    clamp(y.stats[3] as number, 1, 255),
    clamp(y.stats[4] as number, 1, 255),
    clamp(y.stats[5] as number, 1, 255),
    clamp(y.stats[6] as number, 0, 255),
    clamp(y.stats[7] as number, 1, 255),
  ] as const;
  const sum = (sdiv(hp0, 100) + sdiv(mp0, 10) + acc0 + eva0 + agi0 + mdef0 + mag0 + def0 + str0) | 0;
  const r = inp.row;

  let hp = (sdiv(mul(r.hpPerHp, hp0), 100) + mul(r.hpPerSum, sum)) | 0;
  let mp = (sdiv(mul(r.mpPerMp, mp0), 100) + sdiv(mul(r.mpPerSum, sum), 10)) | 0;
  const own = [str0, def0, mag0, mdef0, agi0, eva0, acc0];
  // order of the formula table: STR, DEF, MAG, MDEF, AGI, EVA, ACC
  const comp = own.map((x, k) => (sdiv(sum, r.div[k] as number) + sdiv(mul(r.mul[k] as number, x), 10)) | 0);
  let [str, def, mag, mdef, agi, eva, acc] = comp as [number, number, number, number, number, number, number];

  const tier = tierOf(inp.battles);
  if (tier >= 1 && inp.assure !== null) {
    const a = inp.assure;
    hp = Math.max(hp, a.hp);
    mp = Math.max(mp, a.mp);
    str = Math.max(str, a.stats[0] as number);
    def = Math.max(def, a.stats[1] as number);
    mag = Math.max(mag, a.stats[2] as number);
    mdef = Math.max(mdef, a.stats[3] as number);
    acc = Math.max(acc, a.stats[4] as number);
    eva = Math.max(eva, a.stats[5] as number);
    agi = Math.max(agi, a.stats[6] as number);
  }

  // 14 entries: STR, DEF, MAG, MDEF, AGI, LUCK, EVA, ACC, HP, MP, then four that stay 0
  const b = inp.bonus;
  const entries: number[] = [
    (str + (b.stats[0] as number)) | 0,
    (def + (b.stats[1] as number)) | 0,
    (mag + (b.stats[2] as number)) | 0,
    (mdef + (b.stats[3] as number)) | 0,
    (agi + (b.stats[4] as number)) | 0,
    ((b.stats[5] as number) + luck0) | 0,
    (eva + (b.stats[6] as number)) | 0,
    (acc + (b.stats[7] as number)) | 0,
    (hp + b.hp) | 0,
    (mp + b.mp) | 0,
    0,
    0,
    0,
    0,
  ];

  const pct = new Array<number>(14).fill(0);
  let wordA = 0;
  let wordB = 0;
  let wordC = 0;
  for (const ab of inp.abilities) {
    wordA |= ab.wordA;
    wordB |= ab.wordB;
    wordC |= ab.wordC;
    for (let k = 0; k < 14; k++) if (((ab.mask >> k) & 1) !== 0) pct[k] = ((pct[k] as number) + ab.pct) | 0;
  }
  for (let k = 0; k < 14; k++) {
    const p = pct[k] as number;
    if (p !== 0) entries[k] = (sdiv(mul(entries[k] as number, p), 100) + (entries[k] as number)) | 0;
  }

  const maxHp = clamp(entries[8] as number, 0, ((wordB & 0x200) !== 0 ? 90000 : 0) + 9999);
  const maxMp = clamp(entries[9] as number, 0, ((wordB & 0x400) !== 0 ? 9000 : 0) + 999);
  const stats = [
    clamp(entries[0] as number, 1, 255),
    clamp(entries[1] as number, 1, 255),
    clamp(entries[2] as number, 1, 255),
    clamp(entries[3] as number, 1, 255),
    clamp(entries[4] as number, 1, 255),
    clamp(entries[5] as number, 1, 255),
    clamp(entries[6] as number, 0, 255),
    clamp(entries[7] as number, 1, 255),
  ];
  return {
    maxHp,
    maxMp,
    stats,
    current: { hp: clamp(inp.current.hp | 0, 0, maxHp), mp: clamp(inp.current.mp | 0, 0, maxMp) },
    flags: [wordA & 0xffff, wordB & 0xffff, wordC & 0xffff],
    damageMods: [(pct[10] as number) & 0xff, (pct[11] as number) & 0xff, (pct[12] as number) & 0xff, (pct[13] as number) & 0xff],
  };
}

/** What the summon CTB reads and writes of one character. */
export interface SummonSlot {
  /** `Chr+0x65c`: the CTB counter. */
  ctb: number;
  /** `Chr+0x5ac`, `Chr+0x613`, `Chr+0x614`: Agility, Haste and Slow counters. */
  agi: number;
  haste: number;
  slow: number;
  /** `Chr+0xdc0` (u32): the action's target mask. */
  targetMask: number;
  /** `Chr+0x451`, `Chr+0x5c0`: two action flag bytes. */
  flag451: number;
  flag5c0: number;
  /** `Chr+0x6cc`, `Chr+0x6cd`: the MP and Overdrive cost bytes. */
  mpUsed: number;
  odUsed: number;
  /** `Chr+0xde8`: the rank of the action. */
  rank: number;
}

/**
 * `pp_BtlSummonCtb(id, chr)` (0x007b1aa0): the acting character's CTB becomes 0 (it acts next); every OTHER member of the active
 * party list (`party`, 7 ids, 0xff = empty) takes over the action's target mask, the two flag bytes and the MP and Overdrive cost
 * bytes, and its CTB becomes the recovery of the action's rank for that member (`delayForRank`, with its own Agility, Haste and
 * Slow). The game's name for it is misleading: its only caller is the per-character command state machine (VA 0x00788480) for a
 * special-action kind 8, and the only action that carries kind 8 is the one command 0x3129 queues, Cindy performing Delta Attack
 * (0x30ea) for all three Magus Sisters. A single summoned aeon never goes through it: its counter becomes 0 in `swapMember`
 * (`./aeon-party.ts`). With one aeon the list holds only itself, so only the Magus Sisters have others.
 */
export function summonCtb(party: readonly number[], id: number, chrs: Map<number, SummonSlot>): void {
  const src = chrs.get(id) as SummonSlot;
  src.ctb = 0;
  for (const slot of party) {
    if (slot !== 0xff && slot !== id) {
      const c = chrs.get(slot) as SummonSlot;
      c.targetMask = src.targetMask >>> 0;
      c.flag451 = src.flag451;
      c.flag5c0 = src.flag5c0;
      c.mpUsed = src.mpUsed;
      c.odUsed = src.odUsed;
      c.ctb = delayForRank(c.agi, src.rank, c.haste, c.slow);
    }
  }
}
