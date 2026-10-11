/**
 * FFX gear: what the two worn pieces make of a party character (the party stat builder `pp_MsSetSaveParam`, VA 0x007860f0, and the
 * battle-start gear loop `pp_BtlSetChrGear`, VA 0x0079c5f0).
 *
 * **Game case: FFX only** (FFX-2 builds its characters from dresspheres and the garment grid). Source: FFX.exe, Steam build 25501027,
 * SHA-256 0537B2A1...686D, proven in `FFX-G03` (the real functions run in an x86-32 emulator with every one of the 134 auto-ability records
 * alone and in pairs, with the real table and with edited ones: 41,498 vectors, 0 mismatches). Pure and deterministic (neither function draws
 * a random number). The table is the game's own `a_ability.bin`, as numbers, in `data/ffx/gear/auto-ability-records.ts`.
 *
 * What the two functions do with a piece of gear, in our words:
 *
 * - **Every ability slot of both pieces is read** (eight in all): a word of 0 or 0xff is an empty slot; any other word finds its record by its
 *   low 12 bits (`word & 0xfff`), and an index past the table reads record 0. The same ability on two slots counts twice.
 * - **Percents are summed, not "best of the family".** Each record adds its percent to every one of the 14 builder entries its mask names
 *   (bits 0 to 7 the eight stats, 8 HP, 9 MP, 10 physical dealt, 11 magical dealt, 12 physical taken, 13 magical taken). An entry with a non-zero
 *   sum is then raised by `trunc(entry * sum / 100)` of itself, in 32-bit signed arithmetic (the product wraps, the quotient truncates toward
 *   zero). The four damage bytes the party percent modifier reads (VA 0x007891e0) are the low byte of the four sums.
 * - **The caps:** maximum HP 0 to 9,999 (99,999 with Break HP Limit, word B 0x0200), maximum MP 0 to 999 (9,999 with Break MP Limit, 0x0400).
 * - **Equipment crit is the sum of the crit byte of each worn piece**, as a byte (every row of the game's gear tables carries 3, so a weapon
 *   and an armour give 6 and a weapon alone 3).
 * - **The loop's sums:** elements are OR-ed; the 25 inflict chances and the 13 durations are added and clamped to 254; the 25 resistance bytes are
 *   added and clamped to 255 (two Death Wards make 100, a Ward and a Proof 255); the extra-inflict and extra-immunity words, the three auto words
 *   and words A, B and C are OR-ed. A record flagged SOS sends its three auto words to the SOS trio and sets the SOS flag instead.
 */

import { REGULAR_STATUS_COUNT, TEMPORAL_STATUS_COUNT } from './status-types.ts';

/** The crit byte every gear row of the game carries (`weapon.bin`, `shop_arms.bin`, `buki_get.bin`: all 153, 427 and 86 rows). */
export const GEAR_ROW_CRIT = 3;

/** The builder's 14 entries, by mask bit. */
export const GearEntry = {
  Hp: 8,
  Mp: 9,
  PhysDealt: 10,
  MagDealt: 11,
  PhysTaken: 12,
  MagTaken: 13,
} as const;

export const BUILDER_ENTRY_COUNT = 14;

/** One auto-ability record of `a_ability.bin` as the two functions read it; a missing field is 0. */
export interface GearRecord {
  /** +0x10 bit 0: the three auto words below go to the SOS trio and the SOS flag is set. */
  sos?: true;
  /** +0x11 to +0x15: strike, absorb, null, resist, weak (1 fire, 2 ice, 4 thunder, 8 water, 0x10 holy). */
  elements?: readonly [number, number, number, number, number];
  /** +0x16 + status number: inflict chance bytes, as `[status number 0..24, byte]`. */
  chances?: ReadonlyArray<readonly [number, number]>;
  /** +0x2f + temporal slot: duration bytes, as `[slot 0..12, byte]`. */
  durations?: ReadonlyArray<readonly [number, number]>;
  /** +0x3c + status number: resistance bytes. */
  resist?: ReadonlyArray<readonly [number, number]>;
  /** +0x55 and +0x56. */
  percent?: number;
  mask?: number;
  /** +0x58, +0x5a, +0x5c: the permanent-status, counter and extra-status words the gear gives while worn. */
  autoPerm?: number;
  autoCounter?: number;
  autoExtra?: number;
  /** +0x5e and +0x60: extra statuses the gear inflicts, and the ones its wearer is immune to. */
  inflictExtra?: number;
  immuneExtra?: number;
  /** +0x62, +0x64, +0x66. */
  wordA?: number;
  wordB?: number;
  wordC?: number;
}

/** A worn piece: its crit byte and its four ability words (a weapon and an armour have four slots each in the game's record). */
export interface GearItem {
  crit: number;
  words: readonly number[];
}

/** What the two functions leave of the gear, for the numbers an engine reads. */
export interface GearResult {
  /** `Chr+0x5d8`. */
  crit: number;
  /** `Chr+0x5d9` to `0x5dd`: strike, absorb, null, resist, weak. */
  elements: [number, number, number, number, number];
  /** `Chr+0x5de` + status number, 25 bytes. */
  chances: number[];
  /** `Chr+0x5f7` + temporal slot, 13 bytes. */
  durations: number[];
  /** `Chr+0x604` and `Chr+0x65a`. */
  inflictExtra: number;
  immuneExtra: number;
  /** `Chr+0x641` + status number, 25 bytes. */
  resist: number[];
  /** The three normal auto words (`Chr+0x630`, `0x632`, `0x634`) and the three SOS words (`0x636`, `0x638`, `0x63a`), and `Chr+0x63c`. */
  auto: [number, number, number];
  sos: [number, number, number];
  sosFlag: number;
  /** Words A, B and C (`Save+0x4a` and `Chr+0x6bc`; `Save+0x4c` and `Chr+0x6be`; `Save+0x4e` and `Chr+0x6c0`). */
  wordA: number;
  wordB: number;
  wordC: number;
  /** The 14 percent sums of the builder, before any wrap. */
  sums: number[];
}

/** The record a word names: `undefined` for an empty slot (0 or 0xff); an index past the table reads record 0. */
export function recordOfWord(table: readonly GearRecord[], word: number): GearRecord | undefined {
  if (word === 0 || word === 0xff) return undefined;
  const index = word & 0xfff;
  return table[index] ?? table[0];
}

function clamp(v: number, hi: number): number {
  return v < 0 ? 0 : v > hi ? hi : v;
}

/** `pp_Clamp` as the exe writes it for a signed value: raise to `lo` first, then lower to `hi`. */
export function clampSigned(v: number, lo: number, hi: number): number {
  let x = v | 0;
  if (x < lo) x = lo;
  if (hi < x) x = hi;
  return x;
}

/**
 * What the gear loop and the builder leave of the worn gear. `table` is the game's records indexed by record number.
 * The input is not modified.
 */
export function gearEffects(items: readonly GearItem[], table: readonly GearRecord[]): GearResult {
  const out: GearResult = {
    crit: 0,
    elements: [0, 0, 0, 0, 0],
    chances: new Array<number>(REGULAR_STATUS_COUNT).fill(0),
    durations: new Array<number>(TEMPORAL_STATUS_COUNT).fill(0),
    inflictExtra: 0,
    immuneExtra: 0,
    resist: new Array<number>(REGULAR_STATUS_COUNT).fill(0),
    auto: [0, 0, 0],
    sos: [0, 0, 0],
    sosFlag: 0,
    wordA: 0,
    wordB: 0,
    wordC: 0,
    sums: new Array<number>(BUILDER_ENTRY_COUNT).fill(0),
  };
  for (const item of items) {
    out.crit = (out.crit + item.crit) & 0xff;
    for (const word of item.words) {
      const rec = recordOfWord(table, word);
      if (rec === undefined) continue;
      if (rec.elements !== undefined) for (let k = 0; k < 5; k++) out.elements[k] = (out.elements[k] as number) | (rec.elements[k] as number);
      for (const [status, byte] of rec.chances ?? []) out.chances[status] = clamp((out.chances[status] as number) + byte, 254);
      for (const [slot, byte] of rec.durations ?? []) out.durations[slot] = clamp((out.durations[slot] as number) + byte, 254);
      out.inflictExtra |= rec.inflictExtra ?? 0;
      const trio = rec.sos === true ? out.sos : out.auto;
      if (rec.sos === true) out.sosFlag = 1;
      trio[0] |= rec.autoPerm ?? 0;
      trio[1] |= rec.autoCounter ?? 0;
      trio[2] |= rec.autoExtra ?? 0;
      for (const [status, byte] of rec.resist ?? []) out.resist[status] = clamp((out.resist[status] as number) + byte, 255);
      out.immuneExtra |= rec.immuneExtra ?? 0;
      out.wordA |= rec.wordA ?? 0;
      out.wordB |= rec.wordB ?? 0;
      out.wordC |= rec.wordC ?? 0;
      const percent = rec.percent ?? 0;
      const mask = rec.mask ?? 0;
      for (let bit = 0; bit < BUILDER_ENTRY_COUNT; bit++) if ((mask >> bit) & 1) out.sums[bit] = (out.sums[bit] as number) + percent;
    }
  }
  return out;
}

/**
 * A builder entry raised by its percent sum: `entry + trunc(entry * sum / 100)`, the product and the sum in 32-bit signed arithmetic. A sum of 0
 * leaves the entry alone (the builder skips it). Truncation, not flooring: a product that wraps negative divides toward zero.
 */
export function raisedByPercent(entry: number, sum: number): number {
  const base = entry | 0;
  if (sum === 0) return base;
  const product = Math.imul(base, sum);
  return (Math.trunc(product / 100) + base) | 0;
}

/** The builder's maximum HP: the raised entry, 0 to 9,999 (99,999 with Break HP Limit, word B 0x0200). */
export function maxHpFrom(base: number, sum: number, wordB: number): number {
  return clampSigned(raisedByPercent(base, sum), 0, (wordB & 0x200) !== 0 ? 99_999 : 9_999);
}

/** The builder's maximum MP: the raised entry, 0 to 999 (9,999 with Break MP Limit, word B 0x0400). */
export function maxMpFrom(base: number, sum: number, wordB: number): number {
  return clampSigned(raisedByPercent(base, sum), 0, (wordB & 0x400) !== 0 ? 9_999 : 999);
}

/** The four damage bytes (`0x02311240` + 4 * slot): the low byte of the sums of entries 10 to 13, in the order physical dealt, magical dealt, physical taken, magical taken. */
export function damageBytes(sums: readonly number[]): [number, number, number, number] {
  return [
    (sums[GearEntry.PhysDealt] as number) & 0xff,
    (sums[GearEntry.MagDealt] as number) & 0xff,
    (sums[GearEntry.PhysTaken] as number) & 0xff,
    (sums[GearEntry.MagTaken] as number) & 0xff,
  ];
}

