/**
 * Parity tests for the FFX counter chain (`src/battle/ffx/kernel/counter.ts`; re-parity RC9 lane FFX-G slice G-c, **FFX only**).
 *
 * Source: FFX.exe, Steam build 25501027: `pp_BtlCounterKind` (VA 0x0078c1d0), `pp_BtlIsHarmful` (0x0079e340) and `pp_BtlQueueCounter` (0x0078d8d0);
 * spec `research/re-ffx-targeting.md` section 7. The hand-worked cases are the note's worked example E10 and the rules in its sections 1 and 4.3; the
 * fixture blocks replay `tests/fixtures/parity/ffx/counter_kind.json`, `counter_harmful.json` and `counter_queue.json`, runs of the game's own machine code
 * (28,000, 20,000 and 14,000 vectors against an independent model, 0 mismatches; these files hold a stratified subset of each).
 */

import { describe, expect, it } from 'vitest';
import {
  AUTO_COUNTERATTACK,
  AUTO_EVADE_AND_COUNTER,
  AUTO_MAGIC_COUNTER,
  armsCounter,
  counterKind,
  isHarmful,
  queueCounter,
} from '../../src/battle/ffx/kernel/counter.ts';
import { canActSlot } from '../../src/battle/ffx/kernel/target-world.ts';
import { targetFixture } from './helpers/ffxTargetFixtures.ts';

type Pairs = ReadonlyArray<readonly [number, number]>;
const CMD = { single: 0x00, group: 0x04, all: 0x08, self: 0x0c } as const;
const base = { b1a: CMD.single, b20: 1, auto: 0, attackerKind: 0, attackerId: 1, targetId: 2, switchOn: 1 };

describe('counter kind (0x78c1d0): what a hit meets', () => {
  it('E10: physical gives Counterattack 1, Evade and Counter 2 (winning over Counterattack), Magic Counter 0; magical only meets Magic Counter; other kinds meet nothing', () => {
    const physical = (auto: number) => counterKind({ ...base, b20: 1, auto });
    expect([physical(0), physical(AUTO_COUNTERATTACK), physical(AUTO_EVADE_AND_COUNTER), physical(AUTO_MAGIC_COUNTER)]).toEqual([0, 1, 2, 0]);
    expect(physical(AUTO_COUNTERATTACK | AUTO_EVADE_AND_COUNTER)).toBe(2);
    const magical = (auto: number) => counterKind({ ...base, b20: 2, auto });
    expect([magical(0), magical(AUTO_COUNTERATTACK), magical(AUTO_EVADE_AND_COUNTER), magical(AUTO_MAGIC_COUNTER)]).toEqual([0, 0, 0, 1]);
    for (const kind of [0, 3]) expect(counterKind({ ...base, b20: kind, auto: 0x38 })).toBe(0);
  });

  it('a group, all-target or self command meets no counter; neither does an attacker that is itself in a reaction, itself, or a battle with the switch off', () => {
    const all = AUTO_COUNTERATTACK | AUTO_EVADE_AND_COUNTER | AUTO_MAGIC_COUNTER;
    for (const b1a of [CMD.group, CMD.all, CMD.self]) expect(counterKind({ ...base, b1a, auto: all })).toBe(0);
    expect(counterKind({ ...base, auto: all, attackerKind: 1 })).toBe(0);
    expect(counterKind({ ...base, auto: all, attackerKind: 255 })).toBe(0);
    expect(counterKind({ ...base, auto: all, attackerKind: 0 })).toBe(2);
    expect(counterKind({ ...base, auto: all, targetId: base.attackerId })).toBe(0);
    expect(counterKind({ ...base, auto: all, switchOn: 0 })).toBe(0);
  });

  it('the target type is bits 2 and 3 of Cmd+0x1a; the other bits (default aim, can target the dead, reach) do not matter', () => {
    expect(counterKind({ ...base, b1a: 0x02 | 0x40 | 0x80, auto: AUTO_COUNTERATTACK })).toBe(1);
    expect(counterKind({ ...base, b1a: 0x04, auto: AUTO_COUNTERATTACK })).toBe(0);
    expect(counterKind({ ...base, b1a: 0xfc, auto: AUTO_COUNTERATTACK })).toBe(0);
  });
});

describe('the harmful test (0x79e340): a table test, not "does damage"', () => {
  const none: Pairs = [];
  const h = (over: Partial<Parameters<typeof isHarmful>[0]> = {}) => isHarmful({ b20: 1, damageClass: 0, chances: none, durations: none, extra: 0, ...over });

  it('any damage class is harmful, the restorative flag never is, even with a damage class and a status', () => {
    for (const damageClass of [1, 2, 4, 3, 7]) expect(h({ damageClass })).toBe(true);
    expect(h({ b20: 0x10, damageClass: 1, chances: [[0, 100]], extra: 0x4000 })).toBe(false);
    expect(h()).toBe(false);
  });

  it('any of the twelve permanent statuses with a non-zero chance is harmful, a zero chance is not', () => {
    for (let s = 0; s < 12; s++) expect(h({ chances: [[s, 1]] }), `status ${s}`).toBe(true);
    expect(h({ chances: [[3, 0]] })).toBe(false);
  });

  it('Sleep, Silence, Darkness and Slow are harmful only with a non-zero duration; Shell, Protect, Reflect, the Nuls, Regen and Haste never are', () => {
    for (const slot of [0, 1, 2, 12]) {
      expect(h({ chances: [[12 + slot, 100]], durations: [[slot, 3]] }), `slot ${slot}`).toBe(true);
      expect(h({ chances: [[12 + slot, 100]] }), `slot ${slot} without a duration`).toBe(false);
      expect(h({ chances: [[12 + slot, 100]], durations: [[slot, 0]] }), `slot ${slot} zero duration`).toBe(false);
    }
    for (const slot of [3, 4, 5, 6, 7, 8, 9, 10, 11]) expect(h({ chances: [[12 + slot, 255]], durations: [[slot, 255]] }), `slot ${slot}`).toBe(false);
  });

  it('the extra statuses Eject, Curse and Doom are harmful; the others (Scan, Auto-Life, Defend, Guard, Sentinel ...) are not', () => {
    expect([h({ extra: 0x100 }), h({ extra: 0x400 }), h({ extra: 0x4000 })]).toEqual([true, true, true]);
    expect(h({ extra: 0x1 | 0x2 | 0x40 | 0x80 | 0x200 | 0x800 | 0x1000 | 0x2000 })).toBe(false);
  });
});

describe('the holder\'s answer (0x78d8d0)', () => {
  it('a holder that can act queues its own default attack at the attacker: priority 0, kind 1, the attacker alone in the mask', () => {
    expect(queueCounter(true, 11, 2, 0x3000)).toEqual({ actor: 11, command: 0x3000, targetMask: 4, priority: 0, kind: 1 });
    expect(queueCounter(true, 3, 0x14, 0x30cb)).toEqual({ actor: 3, command: 0x30cb, targetMask: 1 << 20, priority: 0, kind: 1 });
    expect(queueCounter(false, 11, 2, 0x3000)).toBeUndefined();
  });

  it('arming: every outcome but "no effect", a non-zero kind and a harmful command', () => {
    expect(armsCounter(1, true, false)).toBe(true);
    expect(armsCounter(2, true, false)).toBe(true);
    expect(armsCounter(0, true, false)).toBe(false);
    expect(armsCounter(1, false, false)).toBe(false);
    expect(armsCounter(1, true, true)).toBe(false);
  });
});

interface KindIn {
  arm: number;
  switch: number;
  uid: number;
  tid: number;
  df1: number;
  auto6bc: number;
  armed: number;
  cmd: { b1a: number; b20: number; b23: number; extra54: number };
  chances: Pairs;
  durations: Pairs;
}

describe('replay of the game\'s own counter-kind vectors', () => {
  const fx = targetFixture('counter_kind');
  it(`${fx.vectors.length} vectors: the kind, and the armed byte afterwards (set only by the end-of-hit call, for a harmful command)`, () => {
    for (const v of fx.vectors) {
      const i = v.in as unknown as KindIn;
      const kind = counterKind({ b1a: i.cmd.b1a, b20: i.cmd.b20, auto: i.auto6bc, attackerKind: i.df1, attackerId: i.uid, targetId: i.tid, switchOn: i.switch });
      expect(kind, `vector ${v.id} kind`).toBe(v.out['kind']);
      const harmful = isHarmful({ b20: i.cmd.b20, damageClass: i.cmd.b23, chances: i.chances, durations: i.durations, extra: i.cmd.extra54 });
      const armed = i.armed !== 0 || (i.arm !== 0 && armsCounter(kind, harmful, false));
      expect(armed ? 1 : 0, `vector ${v.id} armed`).toBe(v.out['armed']);
    }
  });
});

describe('replay of the game\'s own harmful-test vectors', () => {
  const fx = targetFixture('counter_harmful');
  it(`${fx.vectors.length} vectors`, () => {
    for (const v of fx.vectors) {
      const i = v.in as unknown as Pick<KindIn, 'cmd' | 'chances' | 'durations'>;
      const harmful = isHarmful({ b20: i.cmd.b20, damageClass: i.cmd.b23, chances: i.chances, durations: i.durations, extra: i.cmd.extra54 });
      expect(harmful ? 1 : 0, `vector ${v.id}`).toBe(v.out['harmful']);
    }
  });
});

describe('replay of the game\'s own queue-the-counter vectors', () => {
  const fx = targetFixture('counter_queue');
  it(`${fx.vectors.length} vectors: queued or not, the record, and the armed byte cleared either way`, () => {
    for (const v of fx.vectors) {
      const i = v.in as unknown as { aid: number; cid: number; holder: Record<string, number> };
      const canAct = canActSlot(i.holder);
      const rec = queueCounter(canAct, i.cid, i.aid, i.holder['defAtk'] ?? 0);
      expect(rec !== undefined ? 1 : 0, `vector ${v.id} ret`).toBe(v.out['ret']);
      expect(v.out['armed'], `vector ${v.id} armed byte`).toBe(0);
      const expected = v.out['record'] as { actor: number; count: number; command: number; mask: number; args: number[] } | undefined;
      if (expected === undefined) continue;
      expect(rec, `vector ${v.id} record`).toEqual({ actor: expected.actor, command: expected.command, targetMask: expected.mask, priority: 0, kind: 1 });
      expect(expected.count).toBe(1);
      expect(expected.args.slice(0, 2)).toEqual([0, 1]);
    }
  });
});
