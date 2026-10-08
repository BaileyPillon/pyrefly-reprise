/**
 * Parity tests for the FFX hit kernel (`src/battle/ffx/kernel/hit.ts`), second half: the results that need
 * no roll (Sleep, Petrify, "no effect"), the counter kind, the debug switches, byte reads, and the
 * emulator golden vectors. The formulas, Darkness and the roll itself are in `parity-ffx-hit.test.ts`.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, function
 * 0x0078a890 (`pp_BtlHitCheck`). Spec: `research/re-ffx-rng-hit.md` section 4. The expected values are
 * worked by hand from the decompile and the disassembly; see the comments.
 */

import { describe, expect, it } from 'vitest';
import { HIT, MISS, NO_EFFECT, hitCheck, hitPlan, type HitCheckInput } from '../../src/battle/ffx/kernel/hit.ts';
import { RngMode, rngStreamIndex } from '../../src/battle/ffx/kernel/rng.ts';
import { DARK, formulaFlags, makeHitInput as make, percentOf, runHit as run } from './helpers/ffxHitInput.ts';
import { expandVectorInput, loadFfxParityFixture, scriptedDraw } from './helpers/ffxParityFixture.ts';

describe('FFX hit check: results that need no roll', () => {
  const rolled = { flagsMisc: formulaFlags(3), acc: 10, eva: 255 }; // would be a poor chance (percent 25)

  it('a sleeping target (hit record Sleep counter > 0) is always hit, with no draw', () => {
    expect(run(make({ ...rolled, sleep: 1 }), 100)).toEqual({ result: HIT, draws: 0 });
    expect(run(make({ ...rolled, sleep: 255 }), 100)).toEqual({ result: HIT, draws: 0 });
  });

  it('a petrified target (hit record flag bit 2) is always hit, with no draw', () => {
    expect(run(make({ ...rolled, recStatus: 4 }), 100)).toEqual({ result: HIT, draws: 0 });
    expect(run(make({ ...rolled, recStatus: 0xff }), 100)).toEqual({ result: HIT, draws: 0 });
  });

  it('only bit 2 of the record flags and only the low byte of the Sleep counter count', () => {
    for (const recStatus of [0x01, 0x02, 0x08, 0x10, 0x20, 0x40, 0x80, 0x0400, 0xfffb]) {
      expect(run(make({ ...rolled, recStatus }), 100), `rec flags ${recStatus.toString(16)}`).toEqual({ result: MISS, draws: 1 });
    }
    expect(run(make({ ...rolled, sleep: 0x100 }), 100)).toEqual({ result: MISS, draws: 1 }); // low byte 0
  });

  it('the live status of the target is not what is tested: only the record snapshot is', () => {
    // target.status bit 2 (Petrify) set on the character itself, nothing in the record: still rolled.
    expect(run(make({ ...rolled, status: 4 }), 100)).toEqual({ result: MISS, draws: 1 });
  });

  it('flag bit 23 on a target that is neither dead nor Zombie is "no effect", with no draw', () => {
    const phoenix = { flagsMisc: 0x800000 }; // formula 0 + the no-effect bit
    expect(run(make({ ...phoenix, status: 0 }), 5)).toEqual({ result: NO_EFFECT, draws: 0 });
    expect(run(make({ ...phoenix, status: 4 }), 5)).toEqual({ result: NO_EFFECT, draws: 0 }); // petrified but not dead
    expect(run(make({ ...phoenix, status: 0xfffc }), 5)).toEqual({ result: NO_EFFECT, draws: 0 }); // bits 2+ only
    expect(run(make({ ...phoenix, status: 1 }), 5)).toEqual({ result: HIT, draws: 0 }); // dead: Phoenix Down works
    expect(run(make({ ...phoenix, status: 2 }), 5)).toEqual({ result: HIT, draws: 0 }); // Zombie
    expect(run(make({ ...phoenix, status: 3 }), 5)).toEqual({ result: HIT, draws: 0 });
  });

  it('"no effect" is decided before the accuracy formula and before the sleep shortcut', () => {
    const flagged = { flagsMisc: 0x800000 | formulaFlags(3), acc: 90, eva: 0 };
    expect(run(make({ ...flagged, status: 0, sleep: 3 }), 0)).toEqual({ result: NO_EFFECT, draws: 0 });
    expect(run(make({ ...flagged, status: 1 }), 0).draws).toBe(1); // dead target, formula 3: rolled as usual
  });
});

describe('FFX hit check: counter kind and debug switches', () => {
  const input = make({ flagsMisc: formulaFlags(3), acc: 255, eva: 0, userLuck: 50 }); // percent 150

  it('counter kind 2 (Evade & Counter) forces a miss after the draw, however good the chance', () => {
    expect(run(input, 0)).toEqual({ result: HIT, draws: 1 });
    expect(run({ ...input, counterKind: 2 }, 0)).toEqual({ result: MISS, draws: 1 });
    expect(run({ ...input, counterKind: 1 }, 0)).toEqual({ result: HIT, draws: 1 });
    expect(run({ ...input, counterKind: 0 }, 0)).toEqual({ result: HIT, draws: 1 });
  });

  it('counter kind 2 does not stop the no-roll results', () => {
    expect(run(make({ flagsMisc: 0, counterKind: 2 }), 0)).toEqual({ result: HIT, draws: 0 }); // formula 0
    expect(run({ ...make({ flagsMisc: formulaFlags(3), sleep: 1 }), counterKind: 2 }, 0)).toEqual({ result: HIT, draws: 0 });
  });

  it('debugAlwaysHit turns a rolled miss into a hit (the draw still happens)', () => {
    const bad = make({ flagsMisc: formulaFlags(2), accuracy: 10, eva: 90, debugAlwaysHit: true });
    expect(run(bad, 50)).toEqual({ result: HIT, draws: 1 });
    expect(run({ ...input, counterKind: 2, debugAlwaysHit: true }, 0)).toEqual({ result: HIT, draws: 1 });
  });

  it('debugNeverHit misses every rolled check without drawing, but not formula 0 or the sleeping/petrified', () => {
    expect(run({ ...input, debugNeverHit: true }, 0)).toEqual({ result: MISS, draws: 0 });
    expect(run(make({ flagsMisc: 0, debugNeverHit: true }), 0)).toEqual({ result: HIT, draws: 0 });
    expect(run(make({ flagsMisc: formulaFlags(3), sleep: 2, debugNeverHit: true }), 0)).toEqual({ result: HIT, draws: 0 });
    expect(run(make({ flagsMisc: 0x800000, debugNeverHit: true }), 0)).toEqual({ result: NO_EFFECT, draws: 0 });
  });
});

describe('FFX hit check: stats are read as bytes (MOVZX), as in the game', () => {
  it('masks every stat to 0..255', () => {
    const wide = make({ flagsMisc: formulaFlags(2, DARK), accuracy: 256 + 90, eva: 256 + 40, userLuck: 256 + 5, targetLuck: 256 + 3, darkness: 256 });
    // accuracy 90, EVA 40, user LCK 5, target LCK 3, Darkness counter 256 -> 0 (not blind): 90 - 40 + 5 - 3 = 52.
    expect(percentOf(wide)).toBe(52);
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the emulator harness: `tests/fixtures/parity/ffx/hit_check.json` (schema
// ffx-parity-vectors/1; function 0x0078a890 run as real machine code with the RNG scripted). The block is
// skipped until that file has been copied in. Vector shape, as the harness documents it:
//   in   { user: { id, luck, acc, aeonFlags, darkness, aim, luckStack },
//          target: { luck, eva, statusLo, reflex, jinx }, cmd: { misc, accuracy }, rec: { sleep, flags },
//          counterKind, globals: { debugNeverHit, debugAlwaysHit } }      (sparse, laid over `defaults`)
//   rngDraws [{ stream, value }]    one entry when the function draws, none otherwise
//   out  { ret, trace: [{ roll, threshold }] }    ret 0 hit / 1 miss / 2 no effect; trace only when it rolled
// `toKernelInput` is the one place that maps those names onto `HitCheckInput`; change it if the spec's names move.
// ---------------------------------------------------------------------------------------------
interface HarnessHitInput {
  user: { id: number; luck: number; acc: number; aeonFlags: number; darkness: number; aim: number; luckStack: number };
  target: { luck: number; eva: number; statusLo: number; reflex: number; jinx: number };
  cmd: { misc: number; accuracy: number };
  rec: { sleep: number; flags: number };
  counterKind: number;
  globals: { debugNeverHit: number; debugAlwaysHit: number };
}

function toKernelInput(h: HarnessHitInput): HitCheckInput {
  return {
    cmd: { flagsMisc: h.cmd.misc, accuracy: h.cmd.accuracy },
    user: { acc: h.user.acc, luck: h.user.luck, darkness: h.user.darkness, aim: h.user.aim, luckStack: h.user.luckStack },
    target: { status: h.target.statusLo, eva: h.target.eva, luck: h.target.luck, reflex: h.target.reflex, jinx: h.target.jinx },
    rec: { sleep: h.rec.sleep, status: h.rec.flags },
    counterKind: h.counterKind,
    debugAlwaysHit: h.globals.debugAlwaysHit !== 0,
    debugNeverHit: h.globals.debugNeverHit !== 0,
  };
}

const golden = loadFfxParityFixture('hit_check');
describe.skipIf(golden === null)('golden vectors from the emulator harness (tests/fixtures/parity/ffx/hit_check.json)', () => {
  it('every vector matches pp_BtlHitCheck: result, draws, stream, roll and threshold', () => {
    for (const v of golden?.vectors ?? []) {
      const full = expandVectorInput(golden?.defaults ?? {}, v.in) as unknown as HarnessHitInput;
      const input = toKernelInput(full);
      const label = `vector ${v.id} (${v.class})`;
      const script = scriptedDraw(v.rngDraws);
      expect(hitCheck(input, script.draw), label).toBe(Number(v.out['ret']));
      expect(script.calls(), `${label} draws`).toBe(v.rngDraws?.length ?? 0);
      const trace = (v.out['trace'] as Array<{ roll: number; threshold: number }> | undefined) ?? [];
      const plan = hitPlan(input);
      expect(plan.rolls, `${label} rolls`).toBe(trace.length > 0);
      const first = v.rngDraws?.[0];
      if (plan.rolls && trace[0] !== undefined && first !== undefined) {
        expect(plan.percent, `${label} threshold`).toBe(trace[0].threshold);
        expect(first.value % 101, `${label} roll`).toBe(trace[0].roll);
        expect(first.stream, `${label} stream`).toBe(rngStreamIndex(full.user.id, RngMode.Hit, (full.user.aeonFlags & 4) !== 0));
      }
    }
  });
});
