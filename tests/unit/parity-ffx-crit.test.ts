/**
 * Parity tests for the FFX critical-hit kernel (`src/battle/ffx/kernel/crit.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, function
 * 0x00789690 (`pp_BtlCritCheck`). Spec: `research/re-ffx-rng-hit.md` section 5.
 *
 * Every expected number below is worked by hand from the decompile and the disassembly of that function;
 * the arithmetic is in the comments. The last block loads emulator golden vectors from
 * `tests/fixtures/parity/ffx/crit_check.json` when they exist (see `helpers/ffxParityFixture.ts`).
 *
 * chance = user luck stack - target LCK + target jinx stack + user LCK + bonus;  crit when `draw % 101 < chance`,
 * or the user has the always-critical buff; a crit doubles the damage and sets record flag 0x100.
 */

import { describe, expect, it } from 'vitest';
import {
  CHR_ALWAYS_CRIT,
  CMD_CAN_CRIT,
  CMD_CRIT_BONUS_FROM_EQUIPMENT,
  REC_CRIT_FLAG,
  critChanceOf,
  critCheck,
  type CritCheckInput,
} from '../../src/battle/ffx/kernel/crit.ts';
import { expandVectorInput, loadFfxParityFixture, scriptedDraw } from './helpers/ffxParityFixture.ts';

function make(over: {
  flagsDamage?: number;
  critBonus?: number;
  userLuck?: number;
  luckStack?: number;
  equipmentCrit?: number;
  buffFlags?: number;
  targetLuck?: number;
  jinx?: number;
  debugAlwaysCrit?: boolean;
}): CritCheckInput {
  return {
    cmd: { flagsDamage: over.flagsDamage ?? CMD_CAN_CRIT, critBonus: over.critBonus ?? 0 },
    user: {
      luck: over.userLuck ?? 0,
      luckStack: over.luckStack ?? 0,
      equipmentCrit: over.equipmentCrit ?? 0,
      buffFlags: over.buffFlags ?? 0,
    },
    target: { luck: over.targetLuck ?? 0, jinx: over.jinx ?? 0 },
    ...(over.debugAlwaysCrit === undefined ? {} : { debugAlwaysCrit: over.debugAlwaysCrit }),
  };
}

/** Run the check on `damage` with a raw draw value; also report how many times the kernel drew. */
function run(input: CritCheckInput, raw: number, damage = 1000): ReturnType<typeof critCheck> & { draws: number } {
  let draws = 0;
  const result = critCheck(input, damage, () => (draws++, raw));
  return { ...result, draws };
}

describe('FFX critical chance, worked by hand', () => {
  it('bonus byte from the command: 0 luck stack - 10 target LCK + 0 jinx + 18 user LCK + 3 bonus = 11', () => {
    const input = make({ userLuck: 18, targetLuck: 10, critBonus: 3 });
    expect(critChanceOf(input)).toBe(11);
    expect(run(input, 10)).toMatchObject({ crit: true, damage: 2000, recordFlags: REC_CRIT_FLAG, draws: 1 });
    expect(run(input, 11)).toMatchObject({ crit: false, damage: 1000, recordFlags: 0, draws: 1 });
  });

  it('equipment bonus (Cmd+0x20 bit 3 set) replaces the command byte: 0 - 10 + 0 + 18 + 20 = 28', () => {
    const input = make({
      flagsDamage: CMD_CAN_CRIT | CMD_CRIT_BONUS_FROM_EQUIPMENT,
      userLuck: 18,
      targetLuck: 10,
      critBonus: 99, // ignored
      equipmentCrit: 20,
    });
    expect(critChanceOf(input)).toBe(28);
    expect(run(input, 27).crit).toBe(true);
    expect(run(input, 28).crit).toBe(false);
  });

  it('without the equipment bit the equipment byte is ignored: 0 - 10 + 0 + 18 + 3 = 11, not 11 + 20', () => {
    expect(critChanceOf(make({ userLuck: 18, targetLuck: 10, critBonus: 3, equipmentCrit: 20 }))).toBe(11);
  });

  it('Luck and Jinx stacks add one point each: 5 - 10 + 3 + 18 + 3 = 19', () => {
    const input = make({ luckStack: 5, jinx: 3, userLuck: 18, targetLuck: 10, critBonus: 3 });
    expect(critChanceOf(input)).toBe(19);
    expect(run(input, 18).crit).toBe(true);
    expect(run(input, 19).crit).toBe(false);
  });

  it('target LCK is subtracted raw: a target LCK of 0 subtracts 0', () => {
    expect(critChanceOf(make({ userLuck: 18, targetLuck: 0, critBonus: 3 }))).toBe(21);
  });

  it('the chance is not clamped: negative below 0, above 100 beyond the roll range', () => {
    // 0 - 200 + 0 + 5 + 0 = -195: no roll can crit.
    const hopeless = make({ userLuck: 5, targetLuck: 200 });
    expect(critChanceOf(hopeless)).toBe(-195);
    expect(run(hopeless, 0).crit).toBe(false);
    // 5 + 0 - 0 + 255 + 255 = 515: every roll crits.
    const certain = make({ userLuck: 255, luckStack: 5, critBonus: 255 });
    expect(critChanceOf(certain)).toBe(515);
    expect(run(certain, 100).crit).toBe(true);
  });

  it('a chance of exactly 100 still fails on a roll of 100 (rolls run 0..100)', () => {
    const input = make({ userLuck: 100 });
    expect(critChanceOf(input)).toBe(100);
    expect(run(input, 99).crit).toBe(true);
    expect(run(input, 100).crit).toBe(false);
    expect(run(make({ userLuck: 101 }), 100).crit).toBe(true);
  });
});

describe('FFX critical check: the draw', () => {
  const input = make({ userLuck: 18, targetLuck: 10, critBonus: 3 }); // chance 11

  it('rolls draw % 101: 101 * 9 + 10 crits, 101 * 9 + 11 does not', () => {
    expect(run(input, 909 + 10).crit).toBe(true);
    expect(run(input, 909 + 11).crit).toBe(false);
    expect(run(input, 101).crit).toBe(true); // roll 0
    expect(run(input, 0x7fffffff).crit).toBe(false); // 2147483647 % 101 = 33
  });

  it('masks the raw draw to 31 bits', () => {
    expect(run(input, 0x80000000 + 10).crit).toBe(true);
    expect(run(input, 0x80000000 + 11).crit).toBe(false);
  });

  it('draws once for every command that can crit, whatever the chance', () => {
    expect(run(input, 50).draws).toBe(1);
    expect(run(make({ userLuck: 255, critBonus: 255 }), 50).draws).toBe(1); // chance far above 100
    expect(run(make({ userLuck: 0, targetLuck: 255 }), 50).draws).toBe(1); // chance far below 0
    expect(run(make({ buffFlags: CHR_ALWAYS_CRIT }), 50).draws).toBe(1); // always-crit buff
  });

  it('does not draw, and changes nothing, when the command cannot crit (Cmd+0x20 bit 2 clear)', () => {
    for (const flagsDamage of [0x00, 0x08, 0x01, 0x02, 0xf3, 0x0b]) {
      const result = run(make({ flagsDamage, userLuck: 255, buffFlags: CHR_ALWAYS_CRIT, critBonus: 255 }), 0);
      expect(result, `flags_damage ${flagsDamage.toString(16)}`).toEqual({ damage: 1000, crit: false, recordFlags: 0, draws: 0 });
    }
    expect(critChanceOf(make({ flagsDamage: 0 }))).toBeNull();
  });
});

describe('FFX critical check: always-critical buff, debug switch, and the doubled damage', () => {
  it('the always-critical buff (Chr+0x640 bit 4) crits even on a hopeless chance, after drawing', () => {
    const input = make({ userLuck: 0, targetLuck: 255, buffFlags: CHR_ALWAYS_CRIT });
    expect(run(input, 100)).toMatchObject({ crit: true, damage: 2000, recordFlags: REC_CRIT_FLAG, draws: 1 });
  });

  it('other bits of the buff byte do not force a crit', () => {
    expect(run(make({ userLuck: 0, targetLuck: 255, buffFlags: 0xef }), 100).crit).toBe(false);
  });

  it('debugAlwaysCrit makes every checked hit critical, still after the draw', () => {
    const input = make({ userLuck: 0, targetLuck: 255, debugAlwaysCrit: true });
    expect(run(input, 100)).toMatchObject({ crit: true, damage: 2000, draws: 1 });
    // ... but a command that cannot crit is not checked at all.
    expect(run(make({ flagsDamage: 0, debugAlwaysCrit: true }), 100)).toMatchObject({ crit: false, draws: 0 });
  });

  it('doubles the damage with 32-bit wraparound (ADD EAX, EAX)', () => {
    const certain = make({ userLuck: 255, critBonus: 255 });
    expect(run(certain, 0, 1234).damage).toBe(2468);
    expect(run(certain, 0, 0).damage).toBe(0);
    expect(run(certain, 0, 9999).damage).toBe(19998);
    expect(run(certain, 0, 0x40000000).damage).toBe(-0x80000000); // 2^31 wraps to the int32 minimum
    expect(run(certain, 0, -5).damage).toBe(-10);
  });

  it('a miss on the roll returns the damage untouched with no record flag', () => {
    const input = make({ userLuck: 1 });
    expect(run(input, 50, 777)).toEqual({ damage: 777, crit: false, recordFlags: 0, draws: 1 });
  });
});

// ---------------------------------------------------------------------------------------------
// TODO(harness): golden vectors for 0x00789690. The emulator harness has no FFX spec for the crit check yet.
// When `tests/fixtures/parity/ffx/crit_check.json` appears this block runs. Expected vector shape:
//   in  { cmd: { flagsDamage, critBonus }, user: { luck, luckStack, equipmentCrit, buffFlags },
//         target: { luck, jinx }, damage, debugAlwaysCrit? }       (kernel names, see crit.ts)
//   rngDraws  [{ stream, value }]  (one entry when the function draws, none otherwise; stream = the
//                                   USER's mode 0 stream, 20 + chr for a party member)
//   out { damage, recordFlags }    (damage after the check; recordFlags = 0x100 on a crit else 0)
// Adjust the field names below if the spec names them differently. Until then the block is skipped.
// ---------------------------------------------------------------------------------------------
const golden = loadFfxParityFixture('crit_check');
describe.skipIf(golden === null)('golden vectors from the emulator harness (tests/fixtures/parity/ffx/crit_check.json)', () => {
  it('every vector matches pp_BtlCritCheck: damage, record flag and number of draws', () => {
    for (const v of golden?.vectors ?? []) {
      const full = expandVectorInput(golden?.defaults ?? {}, v.in);
      const script = scriptedDraw(v.rngDraws);
      const result = critCheck(full as unknown as CritCheckInput, Number(full['damage']), script.draw);
      expect(result.damage, `vector ${v.id} (${v.class}) damage`).toBe(Number(v.out['damage']));
      expect(result.recordFlags, `vector ${v.id} (${v.class}) flags`).toBe(Number(v.out['recordFlags']));
      expect(script.calls(), `vector ${v.id} (${v.class}) draws`).toBe(v.rngDraws?.length ?? 0);
    }
  });
});
