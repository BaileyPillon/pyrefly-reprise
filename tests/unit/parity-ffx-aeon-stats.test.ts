/**
 * Parity tests for the FFX aeon stat kernel (`src/battle/ffx/kernel/aeon-stats.ts`): how an aeon's battle stats are built from Yuna's
 * stats, the battle count and the aeon's equipment, and the joint-action CTB of the Magus Sisters.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the aeon branch of the party stat
 * builder 0x7860f0 (with Yuna's raw stats 0x785b60), the joint-action CTB 0x7b1aa0, and the install's data tables `ply_rom`, `sum_assure` and
 * `a_ability`. Spec: `research/re-ffx-overdrive-steal-aeons.md` section 4. The party transitions around a summon and the end-of-battle
 * save are in `parity-ffx-aeon-party.test.ts`.
 *
 * Three kinds of check. The hand-worked blocks use the numbers of the game's start (every step is in the comments). The oracle
 * block runs the stat kernel against a second, independent reading of the same rules (plain arithmetic, none of the kernel's
 * helpers) on 400 generated situations. The last block replays the golden vectors (`tests/fixtures/parity/ffx/aeon_stats.json` and
 * `aeon_summon.json`): each is a run of the game's own machine code in an x86-32 emulator, so a kernel that disagrees with one of
 * them fails here.
 */

import { describe, expect, it } from 'vitest';
import {
  aeonRowOf,
  aeonStats,
  assureRecord,
  partyRawStats,
  summonCtb,
  tierOf,
  type AbilityEffect,
  type AeonStatsInput,
  type SummonSlot,
} from '../../src/battle/ffx/kernel/aeon-stats.ts';
import { expandVectorInput, loadFfxParityFixture } from './helpers/ffxParityFixture.ts';
import { REAL_AEON_ROWS, runAeonVector } from './helpers/ffxAeonAdapters.ts';

const VALEFOR_ROW = REAL_AEON_ROWS[0] as number[];
const REAL_ROWS = REAL_AEON_ROWS;
/** Yuna at the start of the game (save record 1): HP 475, MP 84, STR 5, DEF 5, MAG 20, MDEF 20, AGI 10, LUCK 17, EVA 30, ACC 3. */
const YUNA_START = partyRawStats({ hp: 475, mp: 84, stats: [5, 5, 20, 20, 10, 17, 30, 3] }, { hp: 0, mp: 0, stats: [0, 0, 0, 0, 0, 0, 0, 0] });
const NO_BONUS = { hp: 0, mp: 0, stats: [0, 0, 0, 0, 0, 0, 0, 0] };

function valefor(over: Partial<AeonStatsInput> = {}): ReturnType<typeof aeonStats> {
  return aeonStats({ slot: 8, yuna: YUNA_START, bonus: NO_BONUS, current: { hp: 0, mp: 0 }, row: aeonRowOf(VALEFOR_ROW), battles: 0, assure: null, abilities: [], ...over });
}

describe('Yuna\'s raw stats (0x785b60)', () => {
  it('the save record plus the Sphere Grid bonus: 50 HP and 5 MP per bonus unit, one byte per stat', () => {
    const y = partyRawStats({ hp: 475, mp: 84, stats: [5, 5, 20, 20, 10, 17, 30, 3] }, { hp: 4, mp: 10, stats: [1, 2, 3, 4, 5, 6, 7, 8] });
    expect(y.hp).toBe(675); // 475 + 4 * 50
    expect(y.mp).toBe(134); // 84 + 10 * 5
    expect(y.stats).toEqual([6, 7, 23, 24, 15, 23, 37, 11]); // each a sum of two bytes, not wrapped to a byte
    expect(partyRawStats({ hp: 0, mp: 0, stats: [255, 0, 0, 0, 0, 0, 0, 0] }, { hp: 0, mp: 0, stats: [255, 0, 0, 0, 0, 0, 0, 0] }).stats[0]).toBe(510);
  });
});

describe('Valefor from Yuna at the start of the game', () => {
  // Yuna: HP 475, MP 84, STR 5, DEF 5, MAG 20, MDEF 20, AGI 10, LUCK 17, EVA 30, ACC 3.
  // S = HP/100 + MP/10 + ACC + EVA + AGI + MDEF + MAG + DEF + STR = 4 + 8 + 3 + 30 + 10 + 20 + 20 + 5 + 5 = 105 (Luck is not in it).
  it('every stat is S / divisor + multiplier * Yuna\'s stat / 10, HP and MP have their own forms', () => {
    const r = valefor();
    // HP  = 20 * 475 / 100 + 6 * 105 = 95 + 630 = 725.       MP = 4 * 84 / 100 + 2 * 105 / 10 = 3 + 21 = 24.
    // STR = 105 / 7 + 6 * 5 / 10 = 15 + 3 = 18.              DEF = 105 / 5 + 5 * 5 / 10 = 21 + 2 = 23.
    // MAG = 105 / 70 + 10 * 20 / 10 = 1 + 20 = 21.           MDEF = 105 / 30 + 10 * 20 / 10 = 3 + 20 = 23.
    // AGI = 105 / 20 + 5 * 10 / 10 = 5 + 5 = 10.             EVA = 105 / 24 + 5 * 30 / 10 = 4 + 15 = 19.
    // ACC = 105 / 20 + 20 * 3 / 10 = 5 + 6 = 11.             LUCK = Yuna's 17.
    expect(r.maxHp).toBe(725);
    expect(r.maxMp).toBe(24);
    expect(r.stats).toEqual([18, 23, 21, 23, 10, 17, 19, 11]); // STR DEF MAG MDEF AGI LUCK EVA ACC
  });

  it('the battle-count minimum starts at 30 battles: tier = floor(count / 30), at most 20', () => {
    expect([0, 29, 30, 59, 60, 599, 600, 629, 630, 100000, 0xffffffff].map(tierOf)).toEqual([0, 0, 1, 1, 2, 19, 20, 20, 20, 20, 20]);
    expect(assureRecord(8, 1)).toBe(0); // tier 1, Valefor: the first record
    expect(assureRecord(9, 1)).toBe(1);
    expect(assureRecord(8, 2)).toBe(10); // ten aeons per tier
    expect(assureRecord(0x11, 20)).toBe(199); // the last record of the 200
  });

  it('a weak Yuna is lifted to the tier minimum, a strong one is not; before 30 battles there is no minimum at all', () => {
    // Yuna with HP 0, MP 0, all stats 1 (EVA 0): S = 0 + 0 + 1 + 0 + 1 + 1 + 1 + 1 + 1 = 6; HP = 0 + 6 * 6 = 36.
    const weak = partyRawStats({ hp: 0, mp: 0, stats: [1, 1, 1, 1, 1, 1, 0, 1] }, NO_BONUS);
    const tier1 = { hp: 725, mp: 24, stats: [18, 23, 21, 23, 11, 19, 10] }; // Valefor tier 1: STR DEF MAG MDEF ACC EVA AGI
    expect(valefor({ yuna: weak }).maxHp).toBe(36);
    expect(valefor({ yuna: weak, battles: 29, assure: tier1 }).maxHp).toBe(36); // tier 0: the row is ignored
    const lifted = valefor({ yuna: weak, battles: 30, assure: tier1 });
    expect(lifted.maxHp).toBe(725); // max(36, 725)
    expect(lifted.stats).toEqual([18, 23, 21, 23, 10, 1, 19, 11]); // the minimums, except Luck, which is Yuna's 1
    expect(valefor({ battles: 30, assure: { ...tier1, hp: 100 } }).maxHp).toBe(725); // a stronger Yuna keeps hers
  });

  it('the aeon\'s own bonuses are added after the minimum, Luck is Yuna\'s Luck plus the Luck byte', () => {
    const r = valefor({ bonus: { hp: 1000, mp: 10, stats: [2, 0, 0, 0, 0, 5, 0, 0] } });
    expect(r.maxHp).toBe(1725); // 725 + 1000
    expect(r.maxMp).toBe(34);
    expect(r.stats[0]).toBe(20); // STR 18 + 2
    expect(r.stats[5]).toBe(22); // Luck 17 + 5
  });

  it('caps: HP 9999 and MP 999, or 99999 and 9999 with the Break HP and Break MP Limit words every aeon\'s armor carries; stats stay in 1..255 (EVA from 0)', () => {
    const rich = valefor({ bonus: { hp: 200_000, mp: 50_000, stats: [255, 255, 255, 255, 255, 255, 255, 255] } });
    expect([rich.maxHp, rich.maxMp]).toEqual([9999, 999]);
    expect(rich.stats).toEqual([255, 255, 255, 255, 255, 255, 255, 255]);
    const broken = valefor({ bonus: { hp: 200_000, mp: 50_000, stats: NO_BONUS.stats }, abilities: [{ pct: 0, mask: 0, wordA: 0, wordB: 0x600, wordC: 0 }] });
    expect([broken.maxHp, broken.maxMp]).toEqual([99_999, 9_999]);
    expect(broken.flags).toEqual([0, 0x600, 0]); // word B bit 9 is Break HP Limit, bit 10 Break MP Limit
    const low = valefor({ yuna: partyRawStats({ hp: 0, mp: 0, stats: [0, 0, 0, 0, 0, 0, 0, 0] }, NO_BONUS) });
    expect(low.stats[7]).toBeGreaterThanOrEqual(1); // Yuna's stats count as at least 1 (EVA as at least 0)
  });

  it('equipment percents: x + x * pct / 100 for each stat whose mask bit is set, sums over the abilities, damage-mod bits become bytes', () => {
    const hpUp: AbilityEffect = { pct: 10, mask: 0x100, wordA: 0, wordB: 0, wordC: 0 }; // bit 8 = HP
    const r = valefor({ abilities: [hpUp, hpUp] });
    expect(r.maxHp).toBe(870); // 725 + 725 * 20 / 100 = 725 + 145
    const strMag: AbilityEffect = { pct: 50, mask: 0x5, wordA: 0, wordB: 0, wordC: 0 }; // bits 0 and 2 = STR and MAG
    const s = valefor({ abilities: [strMag] });
    expect(s.stats[0]).toBe(27); // 18 + 18 * 50 / 100 = 18 + 9
    expect(s.stats[2]).toBe(31); // 21 + 21 * 50 / 100 = 21 + 10
    const dmg = valefor({ abilities: [{ pct: 5, mask: 0x400, wordA: 1, wordB: 2, wordC: 3 }, { pct: 0, mask: 0, wordA: 0x10, wordB: 0, wordC: 0x100 }] });
    expect(dmg.damageMods).toEqual([5, 0, 0, 0]);
    expect(dmg.flags).toEqual([0x11, 2, 0x103]); // the words are OR-ed over all abilities
  });

  it('the current HP and MP are clamped to the new maxima', () => {
    const r = valefor({ current: { hp: 5000, mp: 70 } });
    expect(r.current).toEqual({ hp: 725, mp: 24 });
    expect(valefor({ current: { hp: 100, mp: 5 } }).current).toEqual({ hp: 100, mp: 5 });
  });
});

describe('the ten aeons from the real coefficient rows (ply_rom records 8 to 0x11)', () => {
  // Yuna at the start: S = 105 (see above), HP 475, MP 84. Every figure below is the row's bytes put into the same formulas by hand.
  const stats = (slot: number): ReturnType<typeof aeonStats> =>
    aeonStats({ slot, yuna: YUNA_START, bonus: NO_BONUS, current: { hp: 0, mp: 0 }, row: aeonRowOf(REAL_ROWS[slot - 8] as number[]), battles: 0, assure: null, abilities: [], });

  it('Bahamut (record 12): HP 100 * 475 / 100 + 7 * 105 = 1210, MP 5 * 84 / 100 + 3 * 105 / 10 = 4 + 31 = 35, and its own divisor for every stat', () => {
    // row 12 = [hp 7, 100, mp 3, 5, then (divisor, multiplier) for STR (7, 16), DEF (6, 20), MAG (250, 9), MDEF (12, 10), AGI (20, 5), EVA (20, 5), ACC (20, 20)]
    const r = stats(12);
    expect(r.maxHp).toBe(1210);
    expect(r.maxMp).toBe(35);
    // STR 105 / 7 + 16 * 5 / 10 = 15 + 8 = 23.     DEF 105 / 6 + 20 * 5 / 10 = 17 + 10 = 27.
    // MAG 105 / 250 + 9 * 20 / 10 = 0 + 18 = 18.   MDEF 105 / 12 + 10 * 20 / 10 = 8 + 20 = 28.
    // AGI 105 / 20 + 5 * 10 / 10 = 5 + 5 = 10.     EVA 105 / 20 + 5 * 30 / 10 = 5 + 15 = 20.     ACC 105 / 20 + 20 * 3 / 10 = 5 + 6 = 11.
    expect(r.stats).toEqual([23, 27, 18, 28, 10, 17, 20, 11]);
  });

  it('Yojimbo (record 14): no MP at all, both MP bytes are 0', () => {
    expect(stats(14).maxMp).toBe(0);
  });

  it('every aeon at the start of the game: HP and MP are the row\'s two terms each, with the division after each product', () => {
    for (let slot = 8; slot <= 0x11; slot++) {
      const row = REAL_ROWS[slot - 8] as number[];
      const r = stats(slot);
      expect(r.maxHp, `slot ${slot} HP`).toBe(Math.trunc(((row[1] as number) * 475) / 100) + (row[0] as number) * 105);
      expect(r.maxMp, `slot ${slot} MP`).toBe(Math.trunc(((row[3] as number) * 84) / 100) + Math.trunc(((row[2] as number) * 105) / 10));
    }
  });
});

/** An independent reading of the aeon branch, with plain arithmetic and none of the kernel's helpers. */
function oracleAeon(
  yuna: { hp: number; mp: number; stats: number[] },
  row: number[],
  battles: number,
  assure: { hp: number; mp: number; stats: number[] } | null,
  bonus: { hp: number; mp: number; stats: number[] },
  abilities: AbilityEffect[],
  cur: { hp: number; mp: number },
): { maxHp: number; maxMp: number; stats: number[]; cur: [number, number]; flags: number[]; pct: number[] } {
  const clampTo = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);
  const t = (a: number, b: number): number => Math.trunc(a / b);
  const hp0 = clampTo(yuna.hp, 0, 9999);
  const mp0 = clampTo(yuna.mp, 0, 999);
  const y = yuna.stats.map((v, i) => clampTo(v, i === 6 ? 0 : 1, 255)); // STR DEF MAG MDEF AGI LUCK EVA ACC
  const S = t(hp0, 100) + t(mp0, 10) + (y[7] as number) + (y[6] as number) + (y[4] as number) + (y[3] as number) + (y[2] as number) + (y[1] as number) + (y[0] as number);
  let hp = t((row[1] as number) * hp0, 100) + (row[0] as number) * S;
  let mp = t((row[3] as number) * mp0, 100) + t((row[2] as number) * S, 10);
  // formula table order: STR, DEF, MAG, MDEF, AGI, EVA, ACC with Yuna's y indices 0 1 2 3 4 6 7
  const idx = [0, 1, 2, 3, 4, 6, 7];
  const v = idx.map((yi, k) => t(S, row[4 + 2 * k] as number) + t((row[5 + 2 * k] as number) * (y[yi] as number), 10));
  let [str, def, mag, mdef, agi, eva, acc] = v as [number, number, number, number, number, number, number];
  const tier = Math.min(t(battles, 30), 20);
  if (tier >= 1 && assure !== null) {
    hp = Math.max(hp, assure.hp);
    mp = Math.max(mp, assure.mp);
    str = Math.max(str, assure.stats[0] as number);
    def = Math.max(def, assure.stats[1] as number);
    mag = Math.max(mag, assure.stats[2] as number);
    mdef = Math.max(mdef, assure.stats[3] as number);
    acc = Math.max(acc, assure.stats[4] as number);
    eva = Math.max(eva, assure.stats[5] as number);
    agi = Math.max(agi, assure.stats[6] as number);
  }
  // 14 entries in the order STR DEF MAG MDEF AGI LUCK EVA ACC HP MP and four damage modifiers
  const e = [
    str + (bonus.stats[0] as number), def + (bonus.stats[1] as number), mag + (bonus.stats[2] as number), mdef + (bonus.stats[3] as number),
    agi + (bonus.stats[4] as number), (y[5] as number) + (bonus.stats[5] as number), eva + (bonus.stats[6] as number), acc + (bonus.stats[7] as number),
    hp + bonus.hp, mp + bonus.mp, 0, 0, 0, 0,
  ];
  const pct = new Array<number>(14).fill(0);
  let wA = 0;
  let wB = 0;
  let wC = 0;
  for (const a of abilities) {
    wA |= a.wordA;
    wB |= a.wordB;
    wC |= a.wordC;
    for (let k = 0; k < 14; k++) if (a.mask & (1 << k)) pct[k] = (pct[k] as number) + a.pct;
  }
  for (let k = 0; k < 14; k++) if (pct[k] !== 0) e[k] = (e[k] as number) + t((e[k] as number) * (pct[k] as number), 100);
  const maxHp = clampTo(e[8] as number, 0, wB & 0x200 ? 99999 : 9999);
  const maxMp = clampTo(e[9] as number, 0, wB & 0x400 ? 9999 : 999);
  return {
    maxHp,
    maxMp,
    stats: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => clampTo(e[k] as number, k === 6 ? 0 : 1, 255)),
    cur: [clampTo(cur.hp, 0, maxHp), clampTo(cur.mp, 0, maxMp)],
    flags: [wA & 0xffff, wB & 0xffff, wC & 0xffff],
    pct: [10, 11, 12, 13].map((k) => (pct[k] as number) & 0xff),
  };
}

describe('the stat kernel against an independent reading of the rules (generated situations)', () => {
  // A seeded generator so the situations are the same on every run.
  let state = 0x9e3779b9;
  const rnd = (n: number): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 0x100000000) * n);
  };
  const pick = <T>(xs: readonly T[]): T => xs[rnd(xs.length)] as T;

  it('400 situations: real and random coefficient rows, every tier, bonuses, equipment percents and caps give the same eleven numbers', () => {
    for (let i = 0; i < 400; i++) {
      const slot = 8 + rnd(10);
      const row = rnd(3) === 0 ? Array.from({ length: 18 }, (_, k) => ([4, 6, 8, 10, 12, 14, 16].includes(k) ? 1 + rnd(255) : rnd(256))) : (REAL_ROWS[slot - 8] as number[]);
      const yunaSave = { hp: pick([0, 475, 3000, 9999, rnd(20000)]), mp: pick([0, 84, 400, 999, rnd(2000)]), stats: Array.from({ length: 8 }, () => pick([0, 1, 5, 20, 60, 128, 255, rnd(256)])) };
      const yunaBonus = { hp: pick([0, 3, rnd(120)]), mp: pick([0, 9, rnd(200)]), stats: Array.from({ length: 8 }, () => pick([0, 0, 3, rnd(100)])) };
      const yuna = partyRawStats(yunaSave, yunaBonus);
      const battles = pick([0, 1, 29, 30, 31, 89, 90, 599, 600, 601, 1000, rnd(900)]);
      const assure = battles >= 30 ? { hp: pick([0, 725, 2000, rnd(65536)]), mp: pick([0, 24, rnd(65536)]), stats: Array.from({ length: 7 }, () => rnd(256)) } : null;
      const bonus = { hp: pick([0, 0, 100, 5000, rnd(100000)]), mp: pick([0, 0, 50, rnd(2000)]), stats: Array.from({ length: 8 }, () => pick([0, 0, 1, 20, rnd(256)])) };
      const abilities: AbilityEffect[] = Array.from({ length: rnd(5) }, () => ({
        pct: pick([0, 5, 10, 25, 50, 100, rnd(256)]),
        mask: pick([0, 0x1, 0x100, 0x200, 0x3ff, 0x3c00, rnd(1 << 14)]),
        wordA: pick([0, 1, 0x2000, rnd(1 << 16)]),
        wordB: pick([0, 0x200, 0x400, 0x600, 0xe00, rnd(1 << 16)]),
        wordC: pick([0, rnd(1 << 16)]),
      }));
      const cur = { hp: pick([0, 1, 700, 99999, rnd(20000)]), mp: pick([0, 5, 9999, rnd(2000)]) };
      const got = aeonStats({ slot, yuna, bonus, current: cur, row: aeonRowOf(row), battles, assure, abilities });
      const want = oracleAeon({ hp: yuna.hp, mp: yuna.mp, stats: yuna.stats }, row, battles, assure, bonus, abilities, cur);
      expect(
        { maxHp: got.maxHp, maxMp: got.maxMp, stats: got.stats, cur: [got.current.hp, got.current.mp], flags: got.flags, pct: got.damageMods },
        `situation ${i}`,
      ).toEqual(want);
    }
  });
});

describe("the Magus Sisters' joint-action CTB (0x7b1aa0, 'summon CTB' in the game)", () => {
  const slot = (over: Partial<SummonSlot> = {}): SummonSlot => ({
    ctb: 30,
    agi: 10,
    haste: 0,
    slow: 0,
    targetMask: 0,
    flag451: 0,
    flag5c0: 0,
    mpUsed: 0,
    odUsed: 0,
    rank: 0,
    ...over,
  });

  it("the acting sister's counter becomes 0; the other members of the list take over the costs and pay the recovery of the rank", () => {
    // The game runs this when Cindy (15) starts Delta Attack for all three Magus Sisters (15, 16, 17). Agility 10 has tick speed 14
    // (see the CTB note): a rank-3 recovery is 14 * 3 = 42; hasted halves it (21), slowed doubles it (84).
    const chrs = new Map<number, SummonSlot>([
      [15, slot({ rank: 3, targetMask: 0x7, mpUsed: 4, odUsed: 20, flag451: 1, flag5c0: 1 })],
      [16, slot()],
      [17, slot({ haste: 1 })],
    ]);
    summonCtb([15, 16, 17, 0xff, 0xff, 0xff, 0xff], 15, chrs);
    expect(chrs.get(15)?.ctb).toBe(0);
    expect(chrs.get(16)?.ctb).toBe(42);
    expect(chrs.get(17)?.ctb).toBe(21);
    expect(chrs.get(16)).toMatchObject({ targetMask: 7, mpUsed: 4, odUsed: 20, flag451: 1, flag5c0: 1 });
    // a list with nobody else in it: only the actor's own counter changes (a lone summoned aeon never goes through this function)
    const one = new Map<number, SummonSlot>([[8, slot({ rank: 3, ctb: 77 })]]);
    summonCtb([8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff], 8, one);
    expect(one.get(8)?.ctb).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the game's own machine code
// ---------------------------------------------------------------------------------------------

for (const name of ['aeon_stats', 'aeon_summon']) {
  const fx = loadFfxParityFixture(name);
  describe.skipIf(fx === null)(`golden vectors: ${name} (tests/fixtures/parity/ffx/${name}.json)`, () => {
    it('every vector matches the game: maxima, the eight stats, the clamped current values, the flag words and the damage-mod bytes (or the summon counters)', () => {
      let n = 0;
      for (const v of fx?.vectors ?? []) {
        expect(runAeonVector(expandVectorInput(fx?.defaults ?? {}, v.in)), `vector ${v.id} (${v.class}) ${JSON.stringify(v.in)}`).toEqual(v.out);
        n++;
      }
      expect(n).toBeGreaterThan(250);
    });
  });
}
