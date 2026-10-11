/**
 * Parity tests for the FFX gear kernel (`src/battle/ffx/kernel/gear.ts`, over the game's auto-ability table in `kernel/gear-table.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the party stat builder at VA 0x007860f0 and the
 * battle-start gear loop at VA 0x0079c5f0. Spec: FFX-G03 sections 3.1, 4.1, 4.2 and 5.1. Every hand-worked number has its arithmetic beside it.
 * The last block replays `tests/fixtures/parity/ffx/gear_loop.json`: each vector is a run of the game's own machine code in an x86-32 emulator
 * (the real a_ability table behind the game's pointer; nothing replaced; neither function draws a random number). With
 * `PYREFLY_GEAR_BIG=<file>` the same replay runs over a larger set of the same layout (the 6,000-vector set of the RC4 gear lane).
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  GEAR_ROW_CRIT,
  GearEntry,
  damageBytes,
  gearEffects,
  maxHpFrom,
  maxMpFrom,
  raisedByPercent,
  recordOfWord,
  type GearItem,
  type GearResult,
} from '../../src/battle/ffx/kernel/gear.ts';
import { AUTO_ABILITY_RECORDS } from '../../src/battle/ffx/kernel/gear-table.ts';
import { autoAbilityWord } from '../../src/battle/ffx/adapt/gear-ids.ts';
import type { AutoAbilityId } from '../../src/battle/common/types.ts';
import { loadFfxParityFixture, type ParityFixture } from './helpers/ffxParityFixture.ts';

const word = (id: AutoAbilityId): number => autoAbilityWord(id);
const item = (...ids: AutoAbilityId[]): GearItem => ({ crit: 3, words: ids.map(word) });
const effects = (...items: GearItem[]): GearResult => gearEffects(items, AUTO_ABILITY_RECORDS);

describe('the percents of every worn ability are SUMMED (FFX-G03 section 4.1)', () => {
  it('Strength +10% and +5% on one piece make 15 on the physical-dealt entry, not the best tier 10', () => {
    const g = effects(item('strength-10', 'strength-5'));
    expect(g.sums[GearEntry.PhysDealt]).toBe(15); // 10 + 5
    expect(damageBytes(g.sums)).toEqual([15, 0, 0, 0]);
  });

  it('the families stay apart: Magic +10 / +5 is the magical-dealt entry, Defense the physical-taken, Magic Def the magical-taken', () => {
    const g = effects(item('magic-10', 'magic-5', 'defense-3'), item('defense-20', 'magic-def-10', 'magic-def-5'));
    expect(damageBytes(g.sums)).toEqual([0, 15, 23, 15]); // physical dealt 0, magical dealt 10+5, physical taken 3+20, magical taken 10+5
  });

  it('the same ability on two slots counts twice: two HP +10 give HP +20', () => {
    const g = effects(item('hp-10'), item('hp-10'));
    expect(g.sums[GearEntry.Hp]).toBe(20);
    expect(maxHpFrom(1000, g.sums[GearEntry.Hp] as number, g.wordB)).toBe(1200); // 1000 + trunc(1000 * 20 / 100)
  });

  it('a damage byte is the low byte of its sum: a sum of 300 reads as 44', () => {
    // Fifteen Strength +20 would not fit eight slots, so the sum is built on the entry directly: 300 & 0xff = 44.
    expect(damageBytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 300, 256, 255, 0])).toEqual([44, 0, 255, 0]);
  });

  it('maximum HP: base + trunc(base * sum / 100): HP 1,375 with +5% is 1,443, not 1,444', () => {
    expect(raisedByPercent(1375, 5)).toBe(1443); // 1375 * 5 = 6875; 6875 / 100 = 68.75 -> 68; 1375 + 68
    expect(maxHpFrom(1375, 5, 0)).toBe(1443);
  });

  it('a sum of 0 leaves the entry alone, a base of 0 stays 0', () => {
    expect(raisedByPercent(1234, 0)).toBe(1234);
    expect(raisedByPercent(0, 30)).toBe(0);
  });

  it('the caps: 9,999 / 999, and 99,999 / 9,999 with Break HP Limit (word B 0x0200) / Break MP Limit (0x0400)', () => {
    const plain = effects(item('hp-30', 'mp-30'));
    expect(maxHpFrom(9500, plain.sums[GearEntry.Hp] as number, plain.wordB)).toBe(9999); // 9500 + 2850 = 12350 -> 9999
    expect(maxMpFrom(950, plain.sums[GearEntry.Mp] as number, plain.wordB)).toBe(999); // 950 + 285 = 1235 -> 999
    const broken = effects(item('hp-30', 'mp-30', 'break-hp-limit', 'break-mp-limit'));
    expect(broken.wordB).toBe(0x600);
    expect(maxHpFrom(9500, broken.sums[GearEntry.Hp] as number, broken.wordB)).toBe(12350);
    expect(maxMpFrom(950, broken.sums[GearEntry.Mp] as number, broken.wordB)).toBe(1235);
    const hpOnly = effects(item('hp-30', 'mp-30', 'break-hp-limit'));
    expect(maxMpFrom(950, hpOnly.sums[GearEntry.Mp] as number, hpOnly.wordB)).toBe(999); // Break HP Limit does not lift MP
  });

  it('the product wraps to 32 bits and the quotient truncates toward zero (FFX-G03 section 7: the two single-vector probes)', () => {
    // 21,474,837 * 100 = 2,147,483,700 -> as a signed 32-bit number -2,147,483,596; / 100 truncates to -21,474,835; + 21,474,837 = 2
    expect(raisedByPercent(21_474_837, 100)).toBe(2); // flooring would give 1
    // 21,474,838 * 100 -> -2,147,483,496; / 100 truncates to -21,474,834; + 21,474,838 = 4
    expect(raisedByPercent(21_474_838, 100)).toBe(4); // flooring would give 3
    // 21,474,836 * 100 = 2,147,483,600 is still under 2^31 = 2,147,483,648: no wrap, 21,474,836 + 21,474,836
    expect(raisedByPercent(21_474_836, 100)).toBe(42_949_672);
    expect(maxHpFrom(21_474_836, 100, 0)).toBe(9999); // and the cap takes it
    expect(maxHpFrom(21_474_837, 100, 0)).toBe(2); // then the cap: 2 is under 9,999
  });
});

describe('equipment crit is the crit byte of each worn piece, added (FFX-G03 section 1)', () => {
  it('a weapon and an armour give 6, a weapon alone 3: the game carries 3 on every gear row', () => {
    expect(GEAR_ROW_CRIT).toBe(3);
    expect(effects({ crit: 3, words: [] }, { crit: 3, words: [] }).crit).toBe(6);
    expect(effects({ crit: 3, words: [] }).crit).toBe(3);
    expect(effects().crit).toBe(0);
  });

  it('is a byte: 200 + 100 wraps to 44', () => {
    expect(effects({ crit: 200, words: [] }, { crit: 100, words: [] }).crit).toBe(44);
  });
});

describe('the loop adds the resistance bytes and clamps them to 255 (FFX-G03 section 4.2)', () => {
  const resistOf = (g: GearResult, status: number): number => g.resist[status] as number;

  it('two Death Wards make 100; a Ward and a Proof make 255; three Proofs clamp at 255', () => {
    expect(resistOf(effects(item('death-ward'), item('death-ward')), 0)).toBe(100); // 50 + 50
    expect(resistOf(effects(item('death-ward', 'deathproof')), 0)).toBe(255); // 50 + 255 = 305 -> 255
    expect(resistOf(effects(item('deathproof', 'deathproof'), item('deathproof')), 0)).toBe(255);
  });

  it('a Ribbon (ten bytes at 255) and a Ward on one of them stay at 255', () => {
    const g = effects(item('ribbon', 'sleep-ward'));
    expect(resistOf(g, 12)).toBe(255); // Sleep: 255 + 50 -> 255
    expect(resistOf(g, 0)).toBe(0); // the Ribbon does not cover Death
    expect(g.immuneExtra).toBe(0x4000); // and its extra immunity is Doom
  });

  it('Curse Ward and Curseproof are the same thing: the extra-immunity bit for Curse, no resistance byte', () => {
    for (const id of ['curse-ward', 'curseproof'] as const) {
      const g = effects(item(id));
      expect(g.immuneExtra).toBe(0x0400);
      expect(g.resist.every((b) => b === 0)).toBe(true);
    }
  });

  it('inflict chances and durations clamp at 254: Touch + Strike = 150, two Strikes + a Touch = 250, three Strikes = 254', () => {
    expect(effects(item('poisontouch', 'poisonstrike')).chances[3]).toBe(150);
    expect(effects(item('poisonstrike', 'poisonstrike'), item('poisontouch')).chances[3]).toBe(250);
    expect(effects(item('poisonstrike', 'poisonstrike', 'poisonstrike')).chances[3]).toBe(254); // 300 clamped
    expect(effects(item('sleepstrike')).durations[0]).toBe(3);
    expect(effects(item('slowstrike')).durations[12]).toBe(254); // the record's byte is 255; the loop clamps a duration at 254 ("Slow's 255 lands as 254")
  });
});

describe('words, records and the SOS trio', () => {
  it('an empty slot is 0 or 0xff; a word without the high bit still names its record; an index past the table reads record 0', () => {
    expect(recordOfWord(AUTO_ABILITY_RECORDS, 0)).toBeUndefined();
    expect(recordOfWord(AUTO_ABILITY_RECORDS, 0xff)).toBeUndefined();
    expect(recordOfWord(AUTO_ABILITY_RECORDS, 99)).toBe(AUTO_ABILITY_RECORDS[99]); // 0x0063 names record 99 (Strength +5%)
    expect(recordOfWord(AUTO_ABILITY_RECORDS, 0x8000 | 500)).toBe(AUTO_ABILITY_RECORDS[0]); // past the 134 records: record 0
    expect(recordOfWord(AUTO_ABILITY_RECORDS, 0x1063)).toBe(AUTO_ABILITY_RECORDS[99]); // only the low 12 bits count
  });

  it('an Auto-Shell goes to the normal trio, an SOS Shell to the SOS trio with the flag set', () => {
    const auto = effects(item('auto-shell', 'auto-haste'));
    expect(auto.auto).toEqual([0, 0x0008 | 0x0800, 0]); // Shell is counter 3, Haste counter 11
    expect(auto.sos).toEqual([0, 0, 0]);
    expect(auto.sosFlag).toBe(0);
    const sos = effects(item('sos-shell', 'sos-nulblaze'));
    expect(sos.sos).toEqual([0, 0x0008 | 0x0080, 0]); // Shell is counter 3, Nul-Blaze counter 7
    expect(sos.auto).toEqual([0, 0, 0]);
    expect(sos.sosFlag).toBe(1);
  });

  it('words A, B and C and the element masks are OR-ed', () => {
    const g = effects(item('piercing', 'sensor', 'break-damage-limit', 'capture', 'firestrike', 'fire-eater', 'ice-ward'));
    expect([g.wordA, g.wordB, g.wordC]).toEqual([0x2001, 0x0800, 0x0004]);
    expect(g.elements).toEqual([1, 1, 0, 2, 0]); // strike fire; absorb fire; null none; resist ice; weak none
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the game's own machine code
// ---------------------------------------------------------------------------------------------

type Pairs = ReadonlyArray<readonly [number, number]>;

function dense(pairs: Pairs, length: number): number[] {
  const out = new Array<number>(length).fill(0);
  for (const [i, v] of pairs) out[i] = v;
  return out;
}

/** The vector's mismatches with the kernel, as `field: expected / got` strings (empty when it agrees). */
function mismatches(v: { in: Record<string, unknown>; out: Record<string, unknown> }): string[] {
  const i = v.in as { baseHp: number; baseMp: number; crits: number[]; words: number[] };
  const o = v.out as {
    maxHp: number; maxMp: number; pct: number[]; crit: number; elements: number[]; chances: Pairs; durations: Pairs; inflictExtra: number;
    auto: number[]; sos: number[]; sosFlag: number; resist: Pairs; immuneExtra: number; words: number[];
  };
  const g = effects(
    { crit: i.crits[0] as number, words: i.words.slice(0, 4) },
    { crit: i.crits[1] as number, words: i.words.slice(4) },
  );
  const bad: string[] = [];
  const check = (field: string, want: unknown, got: unknown): void => {
    if (JSON.stringify(want) !== JSON.stringify(got)) bad.push(`${field}: game ${JSON.stringify(want)}, kernel ${JSON.stringify(got)}`);
  };
  check('maxHp', o.maxHp, maxHpFrom(i.baseHp, g.sums[GearEntry.Hp] as number, g.wordB));
  check('maxMp', o.maxMp, maxMpFrom(i.baseMp, g.sums[GearEntry.Mp] as number, g.wordB));
  check('pct', o.pct, damageBytes(g.sums));
  check('crit', o.crit, g.crit);
  check('elements', o.elements, g.elements);
  check('chances', dense(o.chances, 25), g.chances);
  check('durations', dense(o.durations, 13), g.durations);
  check('inflictExtra', o.inflictExtra, g.inflictExtra);
  check('auto', o.auto, g.auto);
  check('sos', o.sos, g.sos);
  check('sosFlag', o.sosFlag, g.sosFlag);
  check('resist', dense(o.resist, 25), g.resist);
  check('immuneExtra', o.immuneExtra, g.immuneExtra);
  check('words', o.words, [g.wordA, g.wordB, g.wordC]);
  return bad;
}

function replayAll(fx: ParityFixture, label: string): number {
  let n = 0;
  for (const v of fx.vectors) {
    const bad = mismatches(v);
    expect(bad, `${label} vector ${v.id} (${v.class}), words ${JSON.stringify((v.in as { words: number[] }).words)}`).toEqual([]);
    n += 1;
  }
  return n;
}

const fx = loadFfxParityFixture('gear_loop');
describe.skipIf(fx === null)('golden vectors: the builder and the gear loop (tests/fixtures/parity/ffx/gear_loop.json)', () => {
  it('every vector matches: the maxima, the damage bytes, the crit, the elements, the chances, the durations, the resistances and every word', () => {
    expect(replayAll(fx as ParityFixture, 'fixture')).toBeGreaterThan(600);
  });

  it('the file holds each of the 134 records alone on the weapon and on the armour, and the stacked, wrapped and junk cases', () => {
    const classes = (fx as ParityFixture).vectors.reduce<Record<string, number>>((m, v) => ({ ...m, [v.class]: (m[v.class] ?? 0) + 1 }), {});
    expect(classes['single']).toBe(268);
    for (const cls of ['real', 'percent', 'resist', 'junk', 'auto']) expect(classes[cls] ?? 0, cls).toBeGreaterThan(20);
  });
});

const bigPath = process.env['PYREFLY_GEAR_BIG'];
describe.skipIf(bigPath === undefined || !existsSync(bigPath))('the larger proof set (PYREFLY_GEAR_BIG)', () => {
  it('every vector matches', () => {
    const big = JSON.parse(readFileSync(bigPath as string, 'utf8')) as ParityFixture;
    expect(replayAll(big, 'big set')).toBeGreaterThan(5000);
  });
});
