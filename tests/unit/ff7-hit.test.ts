/**
 * FF7 hit, Lucky Hit / Evade and critical chance (core §3.1 to §3.3; gs §4's Hit% column).
 * Includes the draw-order pins (how many rolls each check takes). FF7 only.
 */

import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import type { Rng } from '../../src/battle/common/types.ts';
import {
  applyLuck,
  critLands,
  critPct,
  hitRandom,
  magicHitPct,
  physicalHitLands,
  physicalHitPct,
  rollCritical,
  rollMagicHit,
  rollPhysicalHit,
} from '../../src/battle/ff7/index.ts';

/** Counts draws on a real seeded stream. */
function counting(seed = 1): Rng & { draws: number } {
  const inner = new SeededRng(seed);
  const r = {
    draws: 0,
    next: () => { r.draws++; return inner.next(); },
    int: (a: number, b: number) => { r.draws++; return inner.int(a, b); },
    pick: <T>(xs: readonly T[]) => { r.draws++; return inner.pick(xs); },
    seed: (n: number) => inner.seed(n),
    get currentSeed() { return inner.currentSeed; },
  };
  return r;
}

const BOSS = { attackerDex: 60, attackerDfPct: 0, attackerLck: 1, attackerIsParty: false };

describe('FF7 physical hit (core §3.1)', () => {
  it('Random = [Rnd(0..65535) * 99 / 65535] + 1 spans 1..100', () => {
    expect(hitRandom(0)).toBe(1);
    expect(hitRandom(65535)).toBe(100);
    expect(hitRandom(65534)).toBe(99);
  });
  it('the boss on Cloud: Rifle 113, Scorpion Tail 108, Tail Laser 133 (gs §4)', () => {
    expect(physicalHitPct({ ...BOSS, atPct: 100, targetDfPct: 2 })).toBe(113);
    expect(physicalHitPct({ ...BOSS, atPct: 95, targetDfPct: 2 })).toBe(108);
    expect(physicalHitPct({ ...BOSS, atPct: 120, targetDfPct: 2 })).toBe(133);
  });
  it('Cloud Attack on the boss is Hit% 100: misses only on the top roll', () => {
    const hit = physicalHitPct({ attackerDex: 9, atPct: 96, attackerDfPct: 2, targetDfPct: 0 });
    expect(hit).toBe(100);
    expect(physicalHitLands(hit, 65534)).toBe(true);
    expect(physicalHitLands(hit, 65535)).toBe(false);
  });
  it('Hit% 1 never lands; 101 always does; Hit% floors at 1', () => {
    expect(physicalHitLands(1, 0)).toBe(false);
    expect(physicalHitLands(101, 65535)).toBe(true);
    expect(physicalHitPct({ attackerDex: 0, atPct: 0, attackerDfPct: 0, targetDfPct: 80 })).toBe(1);
  });
  it('Fury: Hit% - [Hit% * 3 / 10]', () => {
    expect(physicalHitPct({ attackerDex: 9, atPct: 96, attackerDfPct: 2, targetDfPct: 0, attackerFury: true })).toBe(70);
  });
  it('an automatic hit is 255 and takes no draw', () => {
    const rng = counting();
    const r = rollPhysicalHit({ ...BOSS, atPct: 100, targetDfPct: 2, targetLck: 15, targetIsParty: true, autoHit: true }, rng);
    expect(r).toEqual({ hit: true, hitPct: 255, lucky: null });
    expect(rng.draws).toBe(0);
  });
  it('otherwise exactly two draws: Lucky, then the hit roll', () => {
    const rng = counting(7);
    rollPhysicalHit({ ...BOSS, atPct: 100, targetDfPct: 2, targetLck: 15, targetIsParty: true }, rng);
    expect(rng.draws).toBe(2);
  });
});

describe('FF7 Lucky Hit / Lucky Evade (core §3.1)', () => {
  const vsCloud = { attackerLck: 1, targetLck: 15, attackerIsParty: false, targetIsParty: true };
  it('Cloud Lucky-Evades the boss 3% of the time ([15/4] = 3), Barret 4%', () => {
    expect(applyLuck(113, 2, vsCloud)).toEqual({ hitPct: 0, lucky: 'evade' });
    expect(applyLuck(113, 3, vsCloud)).toEqual({ hitPct: 113, lucky: null });
    expect(applyLuck(113, 3, { ...vsCloud, targetLck: 17 })).toEqual({ hitPct: 0, lucky: 'evade' });
    expect(applyLuck(113, 4, { ...vsCloud, targetLck: 17 })).toEqual({ hitPct: 113, lucky: null });
  });
  it('the boss never Lucky-Hits ([1/4] = 0)', () => {
    expect(applyLuck(113, 0, vsCloud).lucky).toBe('evade');
    expect(applyLuck(113, 0, { ...vsCloud, targetLck: 0 }).lucky).toBe(null);
  });
  it('enemies never Lucky-Evade: a party attacker only Lucky-Hits', () => {
    const cloudOnBoss = { attackerLck: 15, targetLck: 99, attackerIsParty: true, targetIsParty: false };
    expect(applyLuck(100, 2, cloudOnBoss)).toEqual({ hitPct: 255, lucky: 'hit' });
    expect(applyLuck(100, 3, cloudOnBoss)).toEqual({ hitPct: 100, lucky: null });
  });
});

describe('FF7 magical hit (core §3.2)', () => {
  it("Cloud's Bolt on the Lv 12 boss: 100 + 7 - 6 - 1 = 100, so it always hits", () => {
    expect(magicHitPct({ matPct: 100, attackerLevel: 7, targetLevel: 12 })).toBe(100);
    for (let seed = 1; seed <= 200; seed++) {
      const r = rollMagicHit({ matPct: 100, attackerLevel: 7, targetLevel: 12, targetMdPct: 0 }, new SeededRng(seed));
      expect(r.hit).toBe(true);
    }
  });
  it('MAt% 255 (Cure) is automatic and takes no draw', () => {
    const rng = counting();
    expect(rollMagicHit({ matPct: 255, attackerLevel: 6, targetLevel: 7, targetMdPct: 0 }, rng)).toEqual({ hit: true, hitPct: 255 });
    expect(rng.draws).toBe(0);
  });
  it('otherwise two draws (MD%, then hit), even when MD% misses', () => {
    const rng = counting(3);
    rollMagicHit({ matPct: 100, attackerLevel: 7, targetLevel: 12, targetMdPct: 0 }, rng);
    expect(rng.draws).toBe(2);
    const rng2 = counting(3);
    expect(rollMagicHit({ matPct: 100, attackerLevel: 7, targetLevel: 12, targetMdPct: 100 }, rng2).hit).toBe(false);
    expect(rng2.draws).toBe(2);
  });
  it('Fury: MAt% - [MAt% * 3 / 10] before the level terms', () => {
    expect(magicHitPct({ matPct: 100, attackerLevel: 7, targetLevel: 12, attackerFury: true })).toBe(70);
  });
});

describe('FF7 critical (core §3.3)', () => {
  it('Cloud 2%, Barret 2% on the Lv 12 boss; the boss 1% on Cloud and Barret', () => {
    expect(critPct(15, 7, 12)).toBe(2);
    expect(critPct(17, 6, 12)).toBe(2);
    expect(critPct(1, 12, 7)).toBe(1);
    expect(critPct(1, 12, 6)).toBe(1);
  });
  it('critical if Random <= Crit%: the Crit% 2 boundary sits at roll 1323', () => {
    expect(critLands(2, 1323)).toBe(true);
    expect(critLands(2, 1324)).toBe(false);
    expect(critLands(0, 0)).toBe(false);
  });
  it('one draw per critical roll', () => {
    const rng = counting(9);
    rollCritical(2, rng);
    expect(rng.draws).toBe(1);
  });
});
