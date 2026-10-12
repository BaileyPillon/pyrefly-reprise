/**
 * Parity tests for what an FFX Overdrive minigame's result does (`src/battle/ffx/kernel/overdrive-result.ts`; re-parity RC4 lane B).
 *
 * **Game case: FFX only** (FFX-2 has no Swordplay, Bushido or Fury). Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the
 * result entry and handler (VA 0x007b0470, 0x007afe00) and the per-target calculation whose first pass leaves the riders-landed count in
 * byte 0x16 (0x00789740); the private note `FFX-G01` sections 3, 4 and 8. Hand-worked blocks first, each number with its arithmetic in the
 * comment; then the vectors in `tests/fixtures/parity/ffx/overdrive_removal.json` (runs of the real handler over the real command table with the
 * RNG scripted, an independent model agreeing on each) and `bushido_rider.json` (probe observations of the real calculation on random and swept
 * targets, the rule mapped for the swept inputs only). Mutants must disagree with the vectors, so the replay is shown to be able to fail.
 */

import { describe, expect, it } from 'vitest';
import {
  type BushidoMove,
  type RiderTarget,
  OdCategory,
  REMOVAL_STREAM,
  removalPlan,
  removeHits,
  ridersLanding,
} from '../../src/battle/ffx/kernel/overdrive-result.ts';
import { loadFfxParityFixture } from './helpers/ffxParityFixture.ts';

/** A scripted stream: the raw values in order, each answered `value % modulus`; counts the calls. A lenient one answers 0 once it runs dry (for a mutant that draws too often). */
function script(values: readonly number[], lenient = false): { draw: (modulus: number) => number; used: () => number } {
  let used = 0;
  return {
    draw: (modulus) => {
      const v = values[used] ?? (lenient ? 0 : undefined);
      if (v === undefined) throw new Error(`drew ${used + 1} times; the script holds ${values.length}`);
      used += 1;
      return v % modulus;
    },
    used: () => used,
  };
}

describe('the hits a result removes (0x007afe00)', () => {
  it('Lulu\'s Fury removes the casts it was not given: 16 - casts, the casts at least 1', () => {
    expect(removalPlan(OdCategory.Fury, 8, 16, 16, true)).toEqual({ n: 8, random: true }); // 16 - 8
    expect(removalPlan(OdCategory.Fury, 15, 16, 16, true)).toEqual({ n: 1, random: true });
    expect(removalPlan(OdCategory.Fury, 0, 16, 16, true)).toEqual({ n: 15, random: true }); // grade 0 counts as 1 cast
    expect(removalPlan(OdCategory.Fury, 16, 16, 16, true)).toBeNull(); // all sixteen: nothing to remove
    expect(removalPlan(OdCategory.Fury, 17, 16, 16, true)).toBeNull(); // above the hit count: nothing, and no negative removal
    // Demi and Ultima Fury are not random-target: every target loses the difference
    expect(removalPlan(OdCategory.Fury, 4, 16, 16, false)).toEqual({ n: 12, random: false });
  });
  it('Slice and Dice and Tornado remove down to their Fail record only on a failed minigame', () => {
    expect(removalPlan(OdCategory.SliceAndDice, 0, 6, 3, true)).toEqual({ n: 3, random: true }); // 6 hits to the Fail row's 3, random target
    expect(removalPlan(OdCategory.SliceAndDice, 1, 6, 3, true)).toBeNull();
    expect(removalPlan(OdCategory.Tornado, 0, 2, 1, false)).toEqual({ n: 1, random: false }); // 2 hits to 1, every target
    expect(removalPlan(OdCategory.Tornado, 1, 2, 1, false)).toBeNull();
    for (const cat of [OdCategory.SpiralCut, OdCategory.ShootingStar, OdCategory.DragonFang, OdCategory.EnergyRain, OdCategory.BanishingBlade, OdCategory.BlitzAce]) {
      expect(removalPlan(cat, 0, 9, 4, true), `category ${cat.toString(16)}`).toBeNull();
    }
  });
  it('random removal takes one hit at a time from the targets holding the most, a draw each, also with one target', () => {
    // one target with 16 hits, 8 removed: 8 draws, each `% 1`
    const s = script(Array.from({ length: 8 }, (_, k) => 1000 + k));
    expect(removeHits([16], { n: 8, random: true }, s.draw)).toEqual([8]);
    expect(s.used()).toBe(8);
    // 3 and 3 hits, one removed: the two are tied, so `value % 2` picks: 4 -> first, 5 -> second
    expect(removeHits([3, 3], { n: 1, random: true }, script([4]).draw)).toEqual([2, 3]);
    expect(removeHits([3, 3], { n: 1, random: true }, script([5]).draw)).toEqual([3, 2]);
    // 5 and 2: only the first holds the most, so the draw is `% 1` whatever it is
    expect(removeHits([5, 2], { n: 1, random: true }, script([999]).draw)).toEqual([4, 2]);
    // after 5 -> 4, 4 and 4 are tied: the second removal is `% 2`
    expect(removeHits([5, 4], { n: 2, random: true }, script([0, 1]).draw)).toEqual([4, 3]); // 5->4 (tied 4,4), then 1 % 2 = the second one
  });
  it('makes no draw when there is nothing left to take', () => {
    const s = script([]);
    expect(removeHits([0, 0], { n: 3, random: true }, s.draw)).toEqual([0, 0]);
    expect(s.used()).toBe(0);
    // 2 hits, 5 removals: two draws take them, the other three find nothing and draw nothing
    const t = script([0, 0, 0, 0, 0]);
    expect(removeHits([2], { n: 5, random: true }, t.draw)).toEqual([0]);
    expect(t.used()).toBe(2);
  });
  it('non-random removal takes the same number from every target and floors at 0, with no draw', () => {
    const s = script([]);
    expect(removeHits([2, 1, 0], { n: 1, random: false }, s.draw)).toEqual([1, 0, 0]);
    expect(removeHits([16, 3], { n: 12, random: false }, s.draw)).toEqual([4, 0]);
    expect(s.used()).toBe(0);
  });
  it('names stream 16', () => {
    expect(REMOVAL_STREAM).toBe(16);
  });
});

describe('the riders a Bushido lands (byte 0x16)', () => {
  const plain: RiderTarget = { perm: 0, extra: 0, extraImmune: 0, delayImmune: 0, breaks: [0, 0, 0, 0] };
  const t = (over: Partial<RiderTarget> = {}): RiderTarget => ({ ...plain, ...over });
  it('Shooting Star: Eject lands unless the target is immune to it or already carries it', () => {
    expect(ridersLanding('shooting-star', t())).toBe(1);
    expect(ridersLanding('shooting-star', t({ extraImmune: 0x100 }))).toBe(0);
    expect(ridersLanding('shooting-star', t({ extra: 0x100 }))).toBe(0); // already carries Eject
    expect(ridersLanding('shooting-star', t({ extraImmune: 0xfeff, extra: 0xfeff }))).toBe(1); // every other bit does nothing
  });
  it('Dragon Fang: the weak Delay lands unless the delay byte is odd', () => {
    expect(ridersLanding('dragon-fang', t({ delayImmune: 0 }))).toBe(1);
    expect(ridersLanding('dragon-fang', t({ delayImmune: 2 }))).toBe(1); // even: not immune
    expect(ridersLanding('dragon-fang', t({ delayImmune: 1 }))).toBe(0);
    expect(ridersLanding('dragon-fang', t({ delayImmune: 255 }))).toBe(0);
  });
  it('Banishing Blade: one for each Break neither immune (255) nor already carried; one immune Break is not enough', () => {
    expect(ridersLanding('banishing-blade', t())).toBe(4);
    expect(ridersLanding('banishing-blade', t({ breaks: [255, 0, 0, 0] }))).toBe(3); // one immune: three still land
    expect(ridersLanding('banishing-blade', t({ breaks: [254, 254, 254, 254] }))).toBe(4); // 254 is not immune
    expect(ridersLanding('banishing-blade', t({ breaks: [255, 255, 255, 255] }))).toBe(0);
    expect(ridersLanding('banishing-blade', t({ perm: 0x10 }))).toBe(3); // carries Power Break
    expect(ridersLanding('banishing-blade', t({ perm: 0xf0 }))).toBe(0); // carries all four
    expect(ridersLanding('banishing-blade', t({ perm: 0x30, breaks: [0, 0, 255, 255] }))).toBe(0); // two carried, two immune: none new
    expect(ridersLanding('banishing-blade', t({ perm: 0x30, breaks: [0, 0, 255, 0] }))).toBe(1);
  });
  it('Tornado carries no rider', () => {
    expect(ridersLanding('tornado', t({ breaks: [0, 0, 0, 0] }))).toBe(0);
  });
});

// ------------------------------------------------------------------------------------------------ the game's own vectors
const removal = loadFfxParityFixture('overdrive_removal');

function runRemoval(i: Record<string, unknown>, tweak?: (plan: ReturnType<typeof removalPlan>) => ReturnType<typeof removalPlan>) {
  const lenient = tweak !== undefined;
  const pending = (i['pending'] as number[][]).map((p) => p[1] as number);
  const chars = (i['pending'] as number[][]).map((p) => p[0] as number);
  let plan = removalPlan(i['cat'] as number, i['grade'] as number, i['menuHits'] as number, i['replHits'] as number, i['replRandom'] === 1);
  if (tweak) plan = tweak(plan);
  const s = script(i['draws'] as number[], lenient);
  const after = plan === null ? pending : removeHits(pending, plan, s.draw);
  let mask = 0;
  after.forEach((c, k) => {
    if (c > 0) mask |= 1 << (chars[k] as number);
  });
  return { after: chars.map((c, k) => [c, after[k] as number]), mask: mask >>> 0, used: s.used() };
}

describe.skipIf(removal === null)('the result handler\'s machine code, replayed (tests/fixtures/parity/ffx/overdrive_removal.json)', () => {
  const vs = (removal?.vectors ?? []).filter((v) => v.in['cat'] !== OdCategory.BlitzAce); // Blitz Ace's Fail cancels every hit: the next lane (B4)

  it('every vector: the hits left on each target, the target mask and the draws taken', () => {
    expect(vs.length).toBeGreaterThan(1000);
    const seen = { drew: 0, fury: 0, sliceAndDice: 0, tornado: 0, noop: 0 };
    for (const v of vs) {
      const got = runRemoval(v.in);
      expect(got.after, `vector ${v.id} hits`).toEqual(v.out['pending']);
      expect(got.mask, `vector ${v.id} mask`).toBe((v.out['mask'] as number) >>> 0);
      expect(got.used, `vector ${v.id} draws`).toBe(v.out['drawsUsed']);
      expect(v.out['streams'] as number[], `vector ${v.id} stream`).toEqual((v.out['streams'] as number[]).length === 0 ? [] : [REMOVAL_STREAM]);
      if (got.used > 0) seen.drew++;
      if (v.in['cat'] === OdCategory.Fury) seen.fury++;
      if (v.in['cat'] === OdCategory.SliceAndDice && v.in['grade'] === 0) seen.sliceAndDice++;
      if (v.in['cat'] === OdCategory.Tornado && v.in['grade'] === 0) seen.tornado++;
      if (removalPlan(v.in['cat'] as number, v.in['grade'] as number, v.in['menuHits'] as number, v.in['replHits'] as number, v.in['replRandom'] === 1) === null) seen.noop++;
    }
    expect(seen.drew).toBeGreaterThan(300);
    expect(seen.fury).toBeGreaterThan(300);
    expect(seen.sliceAndDice).toBeGreaterThan(20);
    expect(seen.tornado).toBeGreaterThan(20);
    expect(seen.noop).toBeGreaterThan(300);
  });

  it('mutants are caught: each deliberately wrong rule disagrees with the game on many vectors', () => {
    const wrong = (tweak: (plan: ReturnType<typeof removalPlan>) => ReturnType<typeof removalPlan>): number =>
      vs.filter((v) => JSON.stringify(runRemoval(v.in, tweak).after) !== JSON.stringify(v.out['pending']) || runRemoval(v.in, tweak).used !== v.out['drawsUsed']).length;
    expect(wrong((p) => (p ? { ...p, n: p.n - 1 } : p))).toBeGreaterThan(100); // one hit too few removed
    expect(wrong((p) => (p ? { ...p, random: !p.random } : p))).toBeGreaterThan(100); // random and fixed swapped
    expect(wrong((p) => (p ? { ...p, n: p.n + 1 } : p))).toBeGreaterThan(100); // one too many
    expect(wrong(() => null)).toBeGreaterThan(300); // nothing removed
  });
});

const rider = loadFfxParityFixture('bushido_rider');

describe.skipIf(rider === null)('the first pass\'s rider count, replayed (tests/fixtures/parity/ffx/bushido_rider.json)', () => {
  const of = (cls: string) => (rider?.vectors ?? []).filter((v) => v.class === cls);
  const targetOf = (i: Record<string, unknown>): RiderTarget => ({
    perm: i['perm'] as number, extra: i['extra'] as number, extraImmune: i['extraImmune'] as number, delayImmune: i['delayImmune'] as number, breaks: i['breaks'] as number[],
  });
  const got = (i: Record<string, unknown>, impl: (m: BushidoMove, t: RiderTarget) => number = ridersLanding): number => impl(i['move'] as BushidoMove, targetOf(i));

  it('every non-Petrified target agrees with the game, except the six Dragon Fang targets the note lists as unmapped', () => {
    const vs = of('rider');
    expect(vs.length).toBeGreaterThan(1000);
    const misses = vs.filter((v) => got(v.in) !== (v.out['b16'] as number));
    // the six random Dragon Fang targets of the probe that give 0 where the rule gives 1 (FFX-G01 section 4.3): all carry permanent-status bits
    expect(misses.every((v) => v.in['move'] === 'dragon-fang' && (v.in['perm'] as number) !== 0), 'misses are Dragon Fang targets with permanent-status bits').toBe(true);
    expect(misses.length).toBeLessThanOrEqual(6);
    for (const move of ['shooting-star', 'banishing-blade', 'tornado'] as const) {
      expect(vs.filter((v) => v.in['move'] === move).length, move).toBeGreaterThan(100);
    }
    // each branch of each rule is exercised: both answers for the first two, every count 0 to 4 for Banishing Blade
    const values = (move: string): Set<number> => new Set(vs.filter((v) => v.in['move'] === move).map((v) => v.out['b16'] as number));
    expect([...values('shooting-star')].sort()).toEqual([0, 1]);
    expect([...values('dragon-fang')].sort()).toEqual([0, 1]); // 2 only ever shows on a Petrified target
    expect([...values('banishing-blade')].sort()).toEqual([0, 1, 2, 3, 4]);
    expect([...values('tornado')]).toEqual([0]);
  });
  it('a Petrified target does not follow the rules (unmapped, FFX-G01 open question 6): the kernel is not claimed there', () => {
    const vs = of('riderPetrified');
    expect(vs.length).toBeGreaterThan(100);
    expect(vs.filter((v) => got(v.in) !== (v.out['b16'] as number)).length).toBeGreaterThan(0);
  });
  it('mutants are caught', () => {
    const vs = of('rider');
    const wrong = (impl: (m: BushidoMove, t: RiderTarget) => number): number => vs.filter((v) => got(v.in, impl) !== (v.out['b16'] as number)).length;
    // one immune Break is enough for the Immune row: wrong
    expect(wrong((m, t) => (m === 'banishing-blade' ? (t.breaks.some((b) => b === 255) ? 0 : 4) : ridersLanding(m, t)))).toBeGreaterThan(50);
    // a Break already carried still counts as landing: wrong
    expect(wrong((m, t) => (m === 'banishing-blade' ? ridersLanding(m, { ...t, perm: 0 }) : ridersLanding(m, t)))).toBeGreaterThan(20);
    // Eject already carried still lands: wrong
    expect(wrong((m, t) => ridersLanding(m, { ...t, extra: 0 }))).toBeGreaterThan(20);
    // a delay byte equal to 255 only is immune: wrong
    expect(wrong((m, t) => (m === 'dragon-fang' ? (t.delayImmune === 255 ? 0 : 1) : ridersLanding(m, t)))).toBeGreaterThan(10);
  });
});
