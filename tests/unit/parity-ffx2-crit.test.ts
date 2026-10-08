/**
 * Parity tests for the FFX-2 critical-hit kernel (`src/battle/ffx2/kernel/crit.ts`).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); function 0x00617210
 * (`pp_dmg_crit`). Spec: `research/re-ffx2-hit-status.md` section 3.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments;
 * - the machine code itself: the 12,000 harness vectors of 0x00617210 and 6,000 vectors of a second emulation setup
 *   were checked on 2026-10-08; the last block re-runs the former from `tests/fixtures/parity/ffx2/dmg_crit.json` when
 *   that file exists (skipped until then).
 */

import { describe, expect, it } from 'vitest';
import { critChance, rollCritical, type CritInput } from '../../src/battle/ffx2/kernel/crit.ts';
import { critCaseFromVector } from './helpers/ffx2KernelAdapters.ts';
import { loadFfx2ParityFixture, scriptedDraw } from './helpers/ffx2ParityFixture.ts';

const input = (over: Partial<CritInput> = {}): CritInput => ({
  canCrit: true,
  fixedChance: false,
  critByte: 0,
  attackerSlot: 3,
  attackerLuck: 60,
  attackerLuckStage: 2,
  targetLuck: 25,
  targetLuckStage: 0,
  alwaysCritical: false,
  ...over,
});
const one = (raw: number): { draw: (s: number) => number; streams: number[] } => {
  const streams: number[] = [];
  return { streams, draw: (s) => (streams.push(s), raw) };
};

describe('the chance', () => {
  it('= LCK_attacker - LCK_target + 5 * (LCKstage_attacker - LCKstage_target)', () => {
    expect(critChance(input())).toBe(45); // (2 - 0) * 5 - 25 + 60
    expect(critChance(input({ attackerLuckStage: 0, targetLuckStage: 3 }))).toBe(20); // (0 - 3) * 5 - 25 + 60
    expect(critChance(input({ attackerLuck: 10, targetLuck: 50, attackerLuckStage: 0 }))).toBe(-40);
    expect(critChance(input({ attackerLuck: 255, targetLuck: 0, attackerLuckStage: 127, targetLuckStage: -128 }))).toBe(255 + 5 * 255);
  });

  it('reads the stage bytes as signed (255 is -1) and the Luck values as unsigned', () => {
    expect(critChance(input({ attackerLuckStage: 255, targetLuckStage: 0 }))).toBe(-5 - 25 + 60);
    expect(critChance(input({ attackerLuck: 256 + 7, targetLuck: 0, attackerLuckStage: 0 }))).toBe(7);
  });

  it('is the command row byte when the command has a fixed chance, whatever the Luck', () => {
    expect(critChance(input({ fixedChance: true, critByte: 33 }))).toBe(33);
    expect(critChance(input({ fixedChance: true, critByte: 255, attackerLuck: 0 }))).toBe(255);
  });
});

describe('the roll', () => {
  it('draws r % 100 from the attacker\'s purpose-0 stream; critical iff roll < chance', () => {
    const s = one(44);
    expect(rollCritical(input(), 1234, s.draw)).toMatchObject({ critical: true, damage: 2468, chance: 45, roll: 44, stream: 23 });
    expect(s.streams).toEqual([23]); // party slot 3: 3 + 0x14
    expect(rollCritical(input(), 1234, one(45).draw)).toMatchObject({ critical: false, damage: 1234, roll: 45 });
    expect(rollCritical(input(), 1234, one(144).draw).roll).toBe(44); // 144 % 100
    expect(rollCritical(input(), 1234, one(0x7fffffff).draw).roll).toBe(47); // 2147483647 mod 100 (independent Python)
  });

  it('a monster attacker rolls on its slot + 0x0d', () => {
    expect(rollCritical(input({ attackerSlot: 20 }), 5, one(0).draw).stream).toBe(33);
    expect(rollCritical(input({ attackerSlot: 15 }), 5, one(0).draw).stream).toBe(28);
  });

  it('a chance of 0 or less never hits, a chance of 100 or more always does (no clamp, and the roll tops out at 99)', () => {
    const none = input({ attackerLuck: 10, targetLuck: 50, attackerLuckStage: 0 }); // -40
    expect(rollCritical(none, 10, one(0).draw).critical).toBe(false);
    expect(rollCritical(input({ attackerLuck: 25, targetLuck: 25, attackerLuckStage: 0 }), 10, one(0).draw).critical).toBe(false); // chance 0
    expect(rollCritical(input({ attackerLuck: 26, targetLuck: 25, attackerLuckStage: 0 }), 10, one(0).draw).critical).toBe(true); // chance 1
    const sure = input({ attackerLuck: 200, targetLuck: 0 }); // 210
    expect(rollCritical(sure, 10, one(99).draw).critical).toBe(true);
    expect(rollCritical(input({ fixedChance: true, critByte: 100 }), 10, one(99).draw).critical).toBe(true);
    expect(rollCritical(input({ fixedChance: true, critByte: 99 }), 10, one(99).draw).critical).toBe(false);
  });

  it('Always Critical forces it whatever the roll, and the draw is still made', () => {
    const s = one(99);
    const none = input({ attackerLuck: 10, targetLuck: 50, attackerLuckStage: 0, alwaysCritical: true });
    expect(rollCritical(none, 7, s.draw)).toMatchObject({ critical: true, damage: 14, chance: -40, roll: 99 });
    expect(s.streams).toHaveLength(1);
  });

  it('the debug switch forces a critical hit (the anchor map said it blocks them)', () => {
    const none = input({ attackerLuck: 10, targetLuck: 50, attackerLuckStage: 0 });
    expect(rollCritical(none, 7, one(99).draw, { debugForceCrit: true }).critical).toBe(true);
    expect(rollCritical(none, 7, one(99).draw, { debugForceCrit: false }).critical).toBe(false);
  });

  it('a command that cannot crit returns the damage unchanged and draws nothing', () => {
    const s = one(0);
    expect(rollCritical(input({ canCrit: false, alwaysCritical: true }), 99, s.draw, { debugForceCrit: true })).toEqual({
      critical: false,
      damage: 99,
      chance: null,
      roll: null,
      stream: null,
    });
    expect(s.streams).toEqual([]);
  });

  it('doubles the damage in 32 bits: 0x40000000 wraps to -2^31, 0x7fffffff to -2, a negative value stays negative', () => {
    const sure = input({ attackerLuck: 200, targetLuck: 0 });
    expect(rollCritical(sure, 0x40000000, one(0).draw).damage).toBe(-2147483648);
    expect(rollCritical(sure, 0x7fffffff, one(0).draw).damage).toBe(-2);
    expect(rollCritical(sure, -5000, one(0).draw).damage).toBe(-10000);
    expect(rollCritical(sure, 0, one(0).draw).damage).toBe(0);
  });
});

describe('golden vectors: the emulated function (tests/fixtures/parity/ffx2/dmg_crit.json)', () => {
  const fx = loadFfx2ParityFixture('dmg_crit');
  (fx ? it : it.skip)('every vector: return value, result flags, chance, roll, draws and stream', () => {
    for (const v of fx!.vectors) {
      const c = critCaseFromVector(fx!.defaults, v.in);
      const s = scriptedDraw(v.rngDraws);
      const out = rollCritical(c.input, c.damage, s.draw, { debugForceCrit: c.debugForceCrit });
      try {
        expect(out.damage).toBe(v.out['ret']);
        expect((c.flagsIn | (out.critical ? 0x100 : 0)) >>> 0).toBe((v.out['flags'] as number) >>> 0);
        expect(out.chance === null ? [] : [{ chance: out.chance, roll: out.roll }]).toEqual(v.out['trace']);
        expect(s.calls()).toBe(v.rngDraws?.length ?? 0);
      } catch (e) {
        throw new Error(`vector ${v.id} (${v.class}): ${(e as Error).message}`);
      }
    }
  });
});
