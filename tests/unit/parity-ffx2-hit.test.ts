/**
 * Parity tests for the FFX-2 hit / evade kernel (`src/battle/ffx2/kernel/hit.ts`, `hitFormulas.ts`, `hitPlan.ts`).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); function 0x00641500
 * (`pp_hit_determine`) and the random-target pick 0x00634e40. Spec: `research/re-ffx2-hit-status.md` section 2.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments;
 * - the independent Python restatement `D:\Tools\ffx-parity\kernel-check\ffx2-hit-status\hit_ref.py` (outside the repo)
 *   for the 64-bit and floating-point thresholds (formulas 3 to 7), run on 2026-10-08;
 * - the machine code itself: all 23,670 harness vectors of 0x00641500 and 3,000 vectors of the random-target spread
 *   were checked on 2026-10-08, and the last block re-runs the former from `tests/fixtures/parity/ffx2/hit_determine.json`
 *   when that file exists (skipped until then).
 */

import { describe, expect, it } from 'vitest';
import {
  HitResult,
  determineHits,
  pickRandomTarget,
  rollHit,
  type HitAction,
  type HitAttacker,
  type HitCommand,
  type HitTarget,
} from '../../src/battle/ffx2/kernel/hit.ts';
import { aidScale, bribeAccuracy, darknessBase, raceThreshold, resistThreshold, sexticThreshold } from '../../src/battle/ffx2/kernel/hitFormulas.ts';
import { hitCaseFromVector, hitExpectedOut, hitOutputLikeVector } from './helpers/ffx2KernelAdapters.ts';
import { loadFfx2ParityFixture, scriptedDraw } from './helpers/ffx2ParityFixture.ts';

const attacker = (over: Partial<HitAttacker> = {}): HitAttacker => ({ id: 0, level: 10, luck: 20, acc: 0, accStage: 0, luckStage: 0, darkness: false, ...over });
const command = (over: Partial<HitCommand> = {}): HitCommand => ({
  id: 0x3001, formula: 1, darknessApplies: false, accuracy: 80, power: 0, hits: 1, physicalOnly: true, randomTargets: false, ...over,
});
const action = (over: Partial<HitAction> = {}): HitAction => ({ repeatCount: 0, repeatLimit: 3, amount: 0, hitsOverride: 0, ...over });
const target = (over: Partial<HitTarget> = {}): HitTarget => ({
  id: 17, level: 10, luck: 15, eva: 30, evaStage: 0, luckStage: 0, asleep: false, petrified: false, stopped: false,
  evadesPhysical: false, inHitReaction: false, aided: false, maxHp: 1000, accumulated: 0, bribeImmune: false,
  resistEject: 0, resistDeath: 0, resistPetrify: 0, resistSextic: 0, ...over,
});
/** A draw() that returns `values` in order and records the streams asked for. */
const script = (...values: number[]): { draw: (s: number) => number; streams: number[] } => {
  const streams: number[] = [];
  return { streams, draw: (s) => (streams.push(s), values[streams.length - 1] ?? Number.NaN) };
};

describe('formulas 1 and 2: the Luck / Evasion race', () => {
  it('hit% = LCK_a + base - LCK_t - EVA_t + 5 * (2 * (ACCst_a - EVAst_t) - LCKst_t + LCKst_a)', () => {
    const t = { base: 80, attackerLuck: 20, attackerAccStage: 0, attackerLuckStage: 0, targetLuck: 15, targetEva: 30, targetEvaStage: 0, targetLuckStage: 0 };
    expect(raceThreshold(t)).toBe(55); // 20 + 80 - 15 - 30
    // stages: 2 * (2 - (-1)) - 3 + 1 = 4; 5 * 4 = 20 -> 55 + 20
    expect(raceThreshold({ ...t, attackerAccStage: 2, targetEvaStage: -1, targetLuckStage: 3, attackerLuckStage: 1 })).toBe(75);
    // all extremes: 255 + 255 + 5 * (2 * (127 - (-128)) + 128 + 127) = 510 + 5 * 765
    expect(raceThreshold({ ...t, base: 255, attackerLuck: 255, targetLuck: 0, targetEva: 0, attackerAccStage: 127, targetEvaStage: -128, targetLuckStage: -128, attackerLuckStage: 127 })).toBe(4335);
  });

  it('Darkness divides the base by four (rounding down), and only for a command that allows it', () => {
    expect(darknessBase(80)).toBe(20);
    expect(darknessBase(83)).toBe(20);
    expect(darknessBase(3)).toBe(0);
    const dark = attacker({ darkness: true });
    const cmd = command({ darknessApplies: true });
    const tgt = target();
    // base 80 -> 20: 20 + 20 - 15 - 30 = -5
    expect(rollHit(dark, cmd, action(), tgt, script(0).draw).threshold).toBe(-5);
    expect(rollHit(dark, command(), action(), tgt, script(0).draw).threshold).toBe(55); // command not flagged
    expect(rollHit(attacker(), cmd, action(), tgt, script(0).draw).threshold).toBe(55); // attacker not blind
  });

  it('the aid scale applies only to player-side monsters and truncates toward zero', () => {
    expect(aidScale(55, 3)).toBe(55); // (3 + 1) * 55 / 4
    expect(aidScale(55, 5)).toBe(82); // 330 / 4 = 82.5
    expect(aidScale(55, 0)).toBe(13); // 55 / 4 = 13.75
    expect(aidScale(-5, 0)).toBe(-1); // -1.25 toward zero
    expect(aidScale(-5, 5)).toBe(-7); // -30 / 4 = -7.5 toward zero
    expect(aidScale(55, -1)).toBe(0); // (-1 + 1) * 55
    const out = rollHit(attacker(), command(), action(), target({ aided: true }), script(0).draw, { aidCount: 5 });
    expect(out.threshold).toBe(82);
  });

  it('rolls draw % 101 on the attacker hit stream; hit iff roll < threshold; the threshold is not clamped', () => {
    const a = attacker(); // party slot 0: stream 0x14 + 0x10 = 36
    const hit = (raw: number): ReturnType<typeof rollHit> => rollHit(a, command(), action(), target(), script(raw).draw);
    expect(hit(54)).toMatchObject({ result: HitResult.Hit, roll: 54, threshold: 55, stream: 36 });
    expect(hit(55)).toMatchObject({ result: HitResult.Miss, roll: 55 });
    expect(hit(101 * 7 + 54).roll).toBe(54); // % 101
    expect(hit(0x7fffffff).roll).toBe(33); // 2147483647 mod 101 = 33 (independent Python)
    // a monster attacker (slot 15) rolls on 15 + 0x0d + 0x10 = 44
    expect(rollHit(attacker({ id: 15 }), command(), action(), target(), script(0).draw).stream).toBe(44);
    // threshold exactly 100: a roll of 100 misses (one time in 101); threshold 101 or more always hits
    const base100 = command({ accuracy: 80 + 45 }); // 20 + 125 - 15 - 30 = 100
    expect(rollHit(a, base100, action(), target(), script(100).draw)).toMatchObject({ threshold: 100, result: HitResult.Miss });
    expect(rollHit(a, base100, action(), target(), script(99).draw).result).toBe(HitResult.Hit);
    const base101 = command({ accuracy: 80 + 46 });
    expect(rollHit(a, base101, action(), target(), script(100).draw)).toMatchObject({ threshold: 101, result: HitResult.Hit });
    // a negative threshold never hits
    expect(rollHit(a, command({ accuracy: 0 }), action(), target({ eva: 200 }), script(0).draw)).toMatchObject({ threshold: -195, result: HitResult.Miss });
  });

  it('formula 2 takes the attacker ACC instead of the command byte', () => {
    const out = rollHit(attacker({ acc: 80 }), command({ formula: 2, accuracy: 0 }), action(), target(), script(54).draw);
    expect(out).toMatchObject({ threshold: 55, result: HitResult.Hit });
  });
});

describe('forced outcomes (formulas 1 and 2)', () => {
  const roll100 = (): number => 100; // roll 100: never below any threshold below 101
  it('a sleeping, petrified or stopped target is always hit, and the draw is still made', () => {
    for (const state of [{ asleep: true }, { petrified: true }, { stopped: true }]) {
      const s = script(100);
      const out = rollHit(attacker(), command({ accuracy: 0 }), action(), target({ eva: 200, ...state }), s.draw);
      expect(out).toMatchObject({ result: HitResult.Hit, roll: 100, threshold: -195, forceHit: true });
      expect(s.streams).toEqual([36]);
    }
  });

  it('Evade & Counter makes a physical-only command miss, unless the target is asleep, petrified or stopped', () => {
    const base = { evadesPhysical: true };
    expect(rollHit(attacker(), command(), action(), target(base), () => 0)).toMatchObject({ result: HitResult.Miss, forceMiss: true });
    expect(rollHit(attacker(), command({ physicalOnly: false }), action(), target(base), () => 0).result).toBe(HitResult.Hit);
    expect(rollHit(attacker(), command(), action(), target({ ...base, asleep: true }), roll100)).toMatchObject({ result: HitResult.Hit, forceMiss: false });
  });

  it('a target in hit reaction is hit; an exhausted record (limit <= count) misses, and the miss wins', () => {
    expect(rollHit(attacker(), command({ accuracy: 0 }), action(), target({ eva: 200, inHitReaction: true }), roll100).result).toBe(HitResult.Hit);
    expect(rollHit(attacker(), command(), action({ repeatCount: 3, repeatLimit: 3 }), target(), () => 0)).toMatchObject({ result: HitResult.Miss, forceMiss: true });
    expect(rollHit(attacker(), command(), action({ repeatCount: 2, repeatLimit: 3 }), target(), () => 0).result).toBe(HitResult.Hit);
    expect(rollHit(attacker(), command(), action({ repeatCount: 4, repeatLimit: 3 }), target({ inHitReaction: true }), () => 0)).toMatchObject({ result: HitResult.Miss, forceHit: true, forceMiss: true });
  });

  it('formulas other than 1 and 2 skip the forced rules (no stop, evade or retry-cap logic)', () => {
    const out = rollHit(attacker(), command({ formula: 3 }), action({ repeatCount: 9 }), target({ evadesPhysical: true, asleep: true, resistEject: 255 }), () => 0);
    expect(out).toMatchObject({ result: HitResult.NoEffect, forceHit: false, forceMiss: false });
  });

  it('the debug switches: force-hit also skips the Evade & Counter rule; force-miss beats everything', () => {
    const evader = target({ evadesPhysical: true });
    expect(rollHit(attacker(), command(), action(), evader, () => 100, { debugForceHit: true })).toMatchObject({ result: HitResult.Hit, forceMiss: false });
    expect(rollHit(attacker(), command(), action(), target({ asleep: true }), () => 0, { debugForceMiss: true }).result).toBe(HitResult.Miss);
  });
});

describe('formula 0 never rolls', () => {
  it('always hits, makes no draw, and only the debug miss switch stops it', () => {
    const s = script();
    const out = rollHit(attacker(), command({ formula: 0 }), action({ repeatCount: 9 }), target({ evadesPhysical: true }), s.draw);
    expect(out).toMatchObject({ result: HitResult.Hit, roll: null, threshold: null, stream: null });
    expect(s.streams).toEqual([]);
    expect(rollHit(attacker(), command({ formula: 0 }), action(), target(), s.draw, { debugForceMiss: true }).result).toBe(HitResult.Miss);
  });
});

describe('formulas 3, 4 and 5: the instant-effect chance (64-bit integer steps)', () => {
  it('q = (((((lvA^2 * power * power * 100) / lvT) / lvT) / (r+5)) / (r+5)), truncating at every step', () => {
    // 50^2 = 2500; * 100 * 100 * 100... shown step by step: 2500 * 100 = 250000; * 100 = 25000000; * 100 = 2500000000;
    // / 40 = 62500000; / 40 = 1562500; / 5 = 312500; / 5 = 62500
    expect(resistThreshold(50, 40, 100, 0, 0)).toBe(62500);
    expect(resistThreshold(50, 40, 100, 0, 127)).toBe(62627); // plus draw & 0x7f
    // 10^2 * 10 * 10 * 100 = 1000000; / 30 = 33333; / 30 = 1111; / 105 = 10; / 105 = 0
    expect(resistThreshold(10, 30, 10, 100, 127)).toBe(127);
    expect(resistThreshold(1, 1, 22, 200, 127)).toBe(128); // q = 1: can never beat the constant roll 128
    expect(resistThreshold(1, 1, 8, 50, 127)).toBe(129); // q = 2: lands only on a draw & 0x7f of 127
    expect(resistThreshold(1, 1, 232, 200, 1)).toBe(129); // q = 128
    expect(resistThreshold(1, 2, 239, 100, 0)).toBe(129); // q = 129: always lands
  });

  it('keeps only the low 32 bits of the quotient: a huge chance wraps negative and cannot land', () => {
    // 99^2 * 255 * 255 * 100 / 1 / 1 / 5 / 5 = 2549240100 = 2^32 - 1745727196
    expect(resistThreshold(99, 1, 255, 0, 127)).toBe(-1745727196 + 127);
  });

  it('clamps the target level to 1 and uses only the low byte of the power and resist', () => {
    expect(resistThreshold(10, 0, 10, 0, 0)).toBe(resistThreshold(10, 1, 10, 0, 0));
    expect(resistThreshold(10, -4, 10, 0, 0)).toBe(40000);
  });

  it('lands iff draw & 0x7f + q > 128; each formula reads its own resist byte; 255 is immune but still draws', () => {
    const cmd = (f: number): HitCommand => command({ formula: f, power: 8 });
    const a = attacker({ level: 1 });
    const t = target({ level: 1, resistEject: 50, resistDeath: 50, resistPetrify: 50 });
    for (const f of [3, 4, 5]) {
      expect(rollHit(a, cmd(f), action(), t, script(127).draw)).toMatchObject({ result: HitResult.Hit, roll: 128, threshold: 129, stream: 36 });
      expect(rollHit(a, cmd(f), action(), t, script(126).draw)).toMatchObject({ result: HitResult.Miss, threshold: 128 });
      expect(rollHit(a, cmd(f), action(), t, script(0x80 + 127).draw).threshold).toBe(129); // & 0x7f
    }
    const mixed = target({ level: 1, resistEject: 255, resistDeath: 50, resistPetrify: 255 });
    const s = script(0);
    expect(rollHit(a, cmd(3), action(), mixed, s.draw)).toMatchObject({ result: HitResult.NoEffect, immune: true });
    expect(s.streams).toEqual([36]); // the draw is made before the immunity is looked at
    expect(rollHit(a, cmd(4), action(), mixed, script(127).draw).result).toBe(HitResult.Hit);
    expect(rollHit(a, cmd(5), action(), mixed, script(127).draw).result).toBe(HitResult.NoEffect);
  });
});

describe('formula 6: the Bribe', () => {
  it('threshold = trunc(min(float32(float32(acc) * 256 / float32(maxHp) / 5 + base), 1e9)); base 128 for command 0x31da, else -64', () => {
    expect(bribeAccuracy(0x3001, 0, 2000, 1000)).toEqual({ accumulated: 2000, threshold: 38 }); // 2000 * 256 / 1000 / 5 = 102.4; - 64 = 38.4
    expect(bribeAccuracy(0x3001, 0, 1000, 3)).toEqual({ accumulated: 1000, threshold: 17002 }); // 17066.67 - 64, float32 17002.666
    expect(bribeAccuracy(0x31da, 0, 0, 100)).toEqual({ accumulated: 0, threshold: 128 });
    expect(bribeAccuracy(0x31da, 100, 400, 100)).toEqual({ accumulated: 500, threshold: 384 }); // 500 * 256 / 100 / 5 = 256; + 128
    expect(bribeAccuracy(0x3001, 0, 5000, 1000)).toEqual({ accumulated: 5000, threshold: 192 });
  });

  it('clamps the running total to 0..999999999 after a wrapping 32-bit add, and the threshold to 1e9', () => {
    expect(bribeAccuracy(0x3001, 0, 999999999, 1)).toEqual({ accumulated: 999999999, threshold: 1000000000 });
    expect(bribeAccuracy(0x3001, 2000000000, 2000000000, 100)).toEqual({ accumulated: 0, threshold: -64 }); // the sum wraps negative first
    expect(bribeAccuracy(0x3001, 5, -3, 10)).toEqual({ accumulated: 2, threshold: -53 });
    expect(bribeAccuracy(0x3001, 0, 1, 0)).toEqual({ accumulated: 1, threshold: -12 }); // max HP 0 reads as 1
  });

  it('rolls draw & 0xff, except command 0x31da which rolls 0 and draws nothing; no amount is a miss; Bribe-immune is no effect', () => {
    const cmd = command({ formula: 6 });
    const t = target({ maxHp: 1000 });
    const hit = rollHit(attacker(), cmd, action({ amount: 2000 }), t, script(0x100 + 37).draw);
    expect(hit).toMatchObject({ roll: 37, threshold: 38, result: HitResult.Hit, bribe: { accumulated: 2000, threshold: 38 } });
    expect(rollHit(attacker(), cmd, action({ amount: 2000 }), t, script(38).draw).result).toBe(HitResult.Miss);
    const free = script();
    expect(rollHit(attacker(), command({ formula: 6, id: 0x31da }), action(), t, free.draw)).toMatchObject({ roll: 0, threshold: 128, result: HitResult.Hit });
    expect(free.streams).toEqual([]);
    const none = script(0);
    expect(rollHit(attacker(), cmd, action({ amount: 0 }), t, none.draw)).toMatchObject({ forceMiss: true, result: HitResult.Miss });
    expect(none.streams).toEqual([36]); // still drew
    expect(rollHit(attacker(), cmd, action({ amount: 2000 }), target({ maxHp: 1000, bribeImmune: true }), script(0).draw).result).toBe(HitResult.NoEffect);
  });
});

describe('formula 7: the level^6 roll', () => {
  it('threshold = trunc(float32(a^6 / t^3 / (r+10)^2 / (r/20 + 1))) with a = lvA, t = max(lvT, 1), r = the resist byte', () => {
    expect(sexticThreshold(50, 25, 0)).toBe(10000); // 15625000000 / 15625 / 100 / 1
    expect(sexticThreshold(20, 40, 100)).toBe(0); // 64000000 / 64000 / 12100 / 6
    expect(sexticThreshold(29, 2, 100)).toBe(1024); // 594823321 / 8 / 12100 / 6 = 1024.17
    expect(sexticThreshold(57, 53, 5)).toBe(1023); // 34296447249 / 148877 / 225 / 1 = 1023.9
    expect(sexticThreshold(26, 7, 20)).toBe(500); // 308915776 / 343 / 900 / 2 = 500.3
    expect(sexticThreshold(3, 1, 10)).toBe(1);
    expect(sexticThreshold(-3, 1, 0)).toBe(7); // an even power: the sign of a level does not matter
  });

  it('a threshold of 2^31 or more converts to the integer-indefinite value and can never hit', () => {
    expect(sexticThreshold(99, 1, 0)).toBe(-2147483648); // 9.4e11 / 100
    expect(sexticThreshold(255, 1, 0)).toBe(-2147483648);
  });

  it('rolls draw & 0x3ff against it', () => {
    const t = target({ level: 53, resistSextic: 5 });
    const cmd = command({ formula: 7 });
    const a = attacker({ level: 57 });
    expect(rollHit(a, cmd, action(), t, script(1022).draw)).toMatchObject({ roll: 1022, threshold: 1023, result: HitResult.Hit });
    expect(rollHit(a, cmd, action(), t, script(1023 + 1024).draw)).toMatchObject({ roll: 1023, result: HitResult.Miss });
  });
});

describe('whole actions: ordering, counts and planned hits', () => {
  it('visits targets in ascending slot order, one draw each, and returns the union mask', () => {
    const s = script(0, 0, 0);
    const r = determineHits(attacker(), command(), action(), [target({ id: 17 }), target({ id: 2 }), target({ id: 9 })], s.draw);
    expect(r.targets.map((t) => t.id)).toEqual([2, 9, 17]);
    expect(s.streams).toEqual([36, 36, 36]);
    expect(r.mask).toBe((1 << 2) | (1 << 9) | (1 << 17));
    expect([r.hitCount, r.missCount, r.noEffectCount]).toEqual([3, 0, 0]);
  });

  it('counts hits, misses and no-effect results separately', () => {
    const cmd = command({ formula: 5, power: 8 });
    const a = attacker({ level: 1 });
    const t = (id: number, resist: number): HitTarget => target({ id, level: 1, resistPetrify: resist });
    const r = determineHits(a, cmd, action(), [t(1, 50), t(2, 255), t(3, 200)], script(127, 0, 127).draw);
    // slot 1: q = 2, 127 + 2 = 129 > 128 hit; slot 2 immune; slot 3: q = 0 (6400 / 205 / 205), 127 < 128 miss
    expect(r.targets.map((x) => x.result)).toEqual([HitResult.Hit, HitResult.NoEffect, HitResult.Miss]);
    expect([r.hitCount, r.missCount, r.noEffectCount]).toEqual([1, 1, 1]);
  });

  it('plans the command hits for every target (override above 0 wins), as bytes', () => {
    const two = [target({ id: 3 }), target({ id: 4 })];
    const plain = determineHits(attacker(), command({ hits: 4 }), action(), two, script(0, 0).draw);
    expect([plain.hitsPlanned, ...plain.perTargetHits]).toEqual([8, 4, 4]);
    const over = determineHits(attacker(), command({ hits: 4 }), action({ hitsOverride: 7 }), two, script(0, 0).draw);
    expect([over.hitsPlanned, ...over.perTargetHits]).toEqual([14, 7, 7]);
    const zero = determineHits(attacker(), command({ hits: 4 }), action({ hitsOverride: 0 }), two, script(0, 0).draw);
    expect(zero.hitsPlanned).toBe(8);
    const negative = determineHits(attacker(), command({ hits: 4 }), action({ hitsOverride: -3 }), two, script(0, 0).draw);
    expect(negative.hitsPlanned).toBe(8);
    const wide = determineHits(attacker(), command({ hits: 255 }), action(), two, script(0, 0).draw);
    expect([wide.hitsPlanned, ...wide.perTargetHits]).toEqual([254, 255, 255]); // 510 mod 256
    const huge = determineHits(attacker(), command(), action({ hitsOverride: 300 }), [target({ id: 5 })], script(0).draw);
    expect([huge.hitsPlanned, ...huge.perTargetHits]).toEqual([44, 44]); // 300 mod 256
  });

  it('rejects a duplicate or out-of-range slot', () => {
    expect(() => determineHits(attacker(), command(), action(), [target({ id: 4 }), target({ id: 4 })], () => 0)).toThrow(RangeError);
    expect(() => determineHits(attacker(), command(), action(), [target({ id: 31 })], () => 0)).toThrow(RangeError);
  });
});

describe('random-target commands (flags_misc & 0x4000)', () => {
  const random = command({ randomTargets: true, hits: 4 });

  it('one candidate: no draw; none: no pick', () => {
    const s = script();
    expect(pickRandomTarget(1 << 6, s.draw)).toBe(6);
    expect(pickRandomTarget(0, s.draw)).toBeNull();
    expect(s.streams).toEqual([]);
  });

  it('two or more: one draw from fixed stream 5, the (draw % count)-th candidate in ascending order', () => {
    const mask = (1 << 2) | (1 << 9) | (1 << 17);
    expect(pickRandomTarget(mask, script(0).draw)).toBe(2);
    expect(pickRandomTarget(mask, script(1).draw)).toBe(9);
    expect(pickRandomTarget(mask, script(5).draw)).toBe(17); // 5 % 3 = 2
    const s = script(4);
    pickRandomTarget(mask, s.draw);
    expect(s.streams).toEqual([5]);
  });

  it('spreads the hits and turns every target that got none into a miss', () => {
    const targets = [target({ id: 2 }), target({ id: 9 }), target({ id: 17 })];
    // formula-1 draws first (36 x 3), then four picks on stream 5: 0, 1, 2, 4 -> slots 2, 9, 17, 9
    const s = script(0, 0, 0, 0, 1, 2, 4);
    const r = determineHits(attacker(), random, action(), targets, s.draw);
    expect(s.streams).toEqual([36, 36, 36, 5, 5, 5, 5]);
    expect(r.perTargetHits).toEqual([1, 2, 1]);
    expect(r.hitsPlanned).toBe(4);
    // one hit only: the other two targets are misses although they had been decided as hits
    const one = determineHits(attacker(), command({ randomTargets: true, hits: 1 }), action(), targets, script(0, 0, 0, 1).draw);
    expect(one.perTargetHits).toEqual([0, 1, 0]);
    expect(one.targets.map((t) => t.result)).toEqual([HitResult.Miss, HitResult.Hit, HitResult.Miss]);
    expect(one.hitCount).toBe(3); // the counters are not corrected
  });

  it('with one target there is nothing to pick: every hit goes to it and nothing is drawn after the roll', () => {
    const s = script(0);
    const r = determineHits(attacker(), random, action(), [target()], s.draw);
    expect(r.perTargetHits).toEqual([4]);
    expect(s.streams).toEqual([36]);
  });
});

describe('golden vectors: the emulated function (tests/fixtures/parity/ffx2/hit_determine.json)', () => {
  const fx = loadFfx2ParityFixture('hit_determine');
  (fx ? it : it.skip)('every vector: results, counts, planned hits, thresholds, draws and streams', () => {
    for (const v of fx!.vectors) {
      const c = hitCaseFromVector(fx!.defaults, v.in);
      const s = scriptedDraw(v.rngDraws);
      const got = determineHits(c.attacker, c.command, c.action, c.targets, s.draw, c.options);
      try {
        expect(hitOutputLikeVector(got, c.formula)).toEqual(hitExpectedOut(v.out));
        expect(s.calls()).toBe(v.rngDraws?.length ?? 0);
      } catch (e) {
        throw new Error(`vector ${v.id} (${v.class}): ${(e as Error).message}`);
      }
    }
  });
});
