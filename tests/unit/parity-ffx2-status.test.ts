/**
 * Parity tests for the FFX-2 status-infliction kernels (`src/battle/ffx2/kernel/status*.ts`).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); functions 0x00619230
 * (`status_roll_g1`), 0x00619700 (`status_roll_g2`) and the shatter roll inside 0x006172c0. Spec:
 * `research/re-ffx2-hit-status.md` section 4.
 *
 * Expected values: hand reasoning from the rules (a roll `r` is scripted as the raw draw `r`, since `r % 101 = r` for
 * 0..100), and the machine code itself: the harness' 13,269 (group 1) and 13,744 (group 2) vectors plus 12,000 +
 * 12,000 of a second emulation setup were checked on 2026-10-08. The last blocks re-run the harness files
 * `tests/fixtures/parity/ffx2/status_roll_g1.json` and `status_roll_g2.json` when they exist (skipped until then).
 */

import { describe, expect, it } from 'vitest';
import {
  IMMUNE_FLAG_DARKNESS,
  IMMUNE_FLAG_PETRIFY,
  IMMUNE_FLAG_SILENCE,
  IMMUNE_FLAG_SLEEP,
  Status1,
  Status2,
  initialStatusResult,
  rollCommandStatuses,
  rollGroup1,
  rollGroup2,
  rollShatter,
  statusLands,
  type StatusAttacker,
  type StatusCommand,
  type StatusOptions,
  type StatusResult,
  type StatusTarget,
} from '../../src/battle/ffx2/kernel/status.ts';
import { status1CaseFromVector, status2CaseFromVector, statusTraceLikeVector } from './helpers/ffx2KernelAdapters.ts';
import { loadFfx2ParityFixture, scriptedDraw } from './helpers/ffx2ParityFixture.ts';

const z = (): number[] => new Array<number>(24).fill(0);
const bytes = (entries: Record<number, number>): number[] => {
  const a = z();
  for (const [i, v] of Object.entries(entries)) a[Number(i)] = v;
  return a;
};
const attacker = (over: Partial<StatusAttacker> = {}): StatusAttacker => ({ id: 0, level: 10, weaponChance1: z(), weaponChance2: z(), weaponAmount2: z(), ...over });
const target = (over: Partial<StatusTarget> = {}): StatusTarget => ({
  id: 2, level: 10, status1: 0, resist1: z(), resist2: z(), protectMask: 0, actionState: 0, activeBytes: z(), layerB: z(), layerD: z(), ...over,
});
const command = (over: Partial<StatusCommand> = {}): StatusCommand => ({ chance1: z(), chance2: z(), amount2: z(), cleanse: false, usesWeapon: false, ...over });
const start = (over: Partial<StatusResult> = {}): StatusResult => ({ secondaryLayer: false, statusSet: 0, counters: z(), layerCSet: 0, layerCBytes: z(), flags: 0, ...over });
const script = (...values: number[]): { draw: (s: number) => number; streams: number[] } => {
  const streams: number[] = [];
  return { streams, draw: (s) => (streams.push(s), values[streams.length - 1] ?? 0) };
};
const g1 = (c: Partial<StatusCommand>, t: Partial<StatusTarget> = {}, r: Partial<StatusResult> = {}, rolls: number[] = [0], a: Partial<StatusAttacker> = {}, o: StatusOptions = {}) =>
  rollGroup1(attacker(a), target(t), command(c), start(r), script(...rolls).draw, o);
const g2 = (c: Partial<StatusCommand>, t: Partial<StatusTarget> = {}, r: Partial<StatusResult> = {}, rolls: number[] = [0], a: Partial<StatusAttacker> = {}, o: StatusOptions = {}) =>
  rollGroup2(attacker(a), target(t), command(c), start(r), script(...rolls).draw, o);

describe('the landing rule', () => {
  it('255 always lands, then 255 resist never, then 254 always, else roll < c + 5 * (lvA - lvT) - r', () => {
    expect(statusLands(255, 255, 100, 1, 99)).toBe(true);
    expect(statusLands(254, 255, 0, 99, 1)).toBe(false);
    expect(statusLands(254, 254, 100, 1, 99)).toBe(true);
    // c 50, levels 10 vs 8, r 20: 50 + 5 * 2 - 20 = 40 -> roll 39 lands, roll 40 does not
    expect(statusLands(50, 20, 39, 10, 8)).toBe(true);
    expect(statusLands(50, 20, 40, 10, 8)).toBe(false);
    expect(statusLands(1, 0, 0, 10, 10)).toBe(true); // 1 + 0 - 0 = 1 > 0
    expect(statusLands(50, 0, 0, 1, 99)).toBe(false); // 50 - 490
  });

  it('the roll is % 101: a computed chance of 100 still fails on a roll of 100, 101 never fails', () => {
    expect(statusLands(100, 0, 99, 10, 10)).toBe(true);
    expect(statusLands(100, 0, 100, 10, 10)).toBe(false);
    expect(statusLands(101, 0, 100, 10, 10)).toBe(true);
    expect(statusLands(100, 0, 100, 10, 10, true)).toBe(true); // the debug switch
  });
});

describe('group 1: drawing', () => {
  it('draws once per status with a chance byte, in index order, from the attacker\'s purpose-2 stream', () => {
    const s = script(50, 99, 100);
    const out = rollGroup1(attacker(), target(), command({ chance1: bytes({ 3: 100, 5: 100, 9: 100 }) }), start(), s.draw);
    expect(s.streams).toEqual([52, 52, 52]); // party slot 0: 0x14 + 0x20
    expect(out.log.map((e) => [e.index, e.roll, e.landed])).toEqual([[3, 50, true], [5, 99, true], [9, 100, false]]);
    expect(out.result.statusSet).toBe((1 << 3) | (1 << 5));
    const monster = script(0);
    rollGroup1(attacker({ id: 15 }), target(), command({ chance1: bytes({ 5: 50 }) }), start(), monster.draw);
    expect(monster.streams).toEqual([60]); // monster slot 15: 0x0d + 15 + 0x20
  });

  it('draws even when the answer is fixed (chance 255 or 254, resist 255); a zero chance draws nothing', () => {
    const s = script();
    rollGroup1(attacker(), target({ resist1: bytes({ 1: 255 }) }), command({ chance1: bytes({ 0: 255, 1: 254, 2: 0 }) }), start(), s.draw);
    expect(s.streams).toEqual([52, 52]);
  });

  it('a cleanse makes no draw', () => {
    const s = script();
    rollGroup1(attacker(), target({ status1: 4 }), command({ cleanse: true, chance1: bytes({ 2: 255 }) }), start({ statusSet: 4 }), s.draw);
    expect(s.streams).toEqual([]);
  });

  it('the weapon byte raises the chance only when the command uses character properties', () => {
    const weapon = bytes({ 5: 200 });
    expect(g1({ chance1: bytes({ 5: 10 }), usesWeapon: true }, {}, {}, [150], { weaponChance1: weapon }).log[0]).toMatchObject({ chance: 200, landed: true });
    expect(g1({ chance1: bytes({ 5: 10 }), usesWeapon: false }, {}, {}, [150], { weaponChance1: weapon }).log[0]).toMatchObject({ chance: 10, landed: false });
    expect(g1({ chance1: bytes({ 5: 250 }), usesWeapon: true }, {}, {}, [0], { weaponChance1: weapon }).log[0]?.chance).toBe(250);
    expect(g1({ chance1: z(), usesWeapon: true }, {}, {}, [0], { weaponChance1: weapon }).log[0]).toMatchObject({ index: 5, chance: 200 });
  });
});

describe('group 1: landing and immunity', () => {
  it('Poison at chance 100, equal levels, resist 0: roll 99 lands, roll 100 does not', () => {
    expect(g1({ chance1: bytes({ [Status1.Poison]: 100 }) }, {}, {}, [99]).result.statusSet).toBe(0x20);
    expect(g1({ chance1: bytes({ [Status1.Poison]: 100 }) }, {}, {}, [100]).result.statusSet).toBe(0);
  });

  it('resist 255 is immune: Petrify, Sleep, Silence and Darkness add a flag, others do not', () => {
    const out = g1({ chance1: bytes({ 1: 100, 2: 100, 3: 100, 4: 100, 5: 100 }) }, { resist1: bytes({ 1: 255, 2: 255, 3: 255, 4: 255, 5: 255 }) }, {}, [0, 0, 0, 0, 0]);
    expect(out.result.flags).toBe(IMMUNE_FLAG_PETRIFY | IMMUNE_FLAG_SLEEP | IMMUNE_FLAG_SILENCE | IMMUNE_FLAG_DARKNESS);
    expect(out.result.flags).toBe(0x4e00);
    expect(out.log.map((e) => e.immune)).toEqual([true, true, true, true, true]);
    expect(out.result.statusSet).toBe(0);
  });

  it('chance 255 beats resist 255 (lands, no immunity message); chance 254 against resist 255 is immune', () => {
    const lands = g1({ chance1: bytes({ [Status1.Silence]: 255 }) }, { resist1: bytes({ 3: 255 }) });
    expect(lands.result).toMatchObject({ statusSet: 8, flags: 0 });
    const blocked = g1({ chance1: bytes({ [Status1.Silence]: 254 }) }, { resist1: bytes({ 3: 255 }) });
    expect(blocked.result).toMatchObject({ statusSet: 0, flags: IMMUNE_FLAG_SILENCE });
  });

  it('a status the target already has, a petrified target and a petrified result set take nothing', () => {
    const poison = { chance1: bytes({ 5: 255 }) };
    expect(g1(poison, { status1: 0x20 }).log[0]).toMatchObject({ landed: true, applied: false });
    expect(g1(poison, { status1: 0x2 }).result.statusSet).toBe(0);
    expect(g1(poison, {}, { statusSet: 0x2 }).result.statusSet).toBe(0x2);
  });

  it('the scripted check-stop gate resists Petrify and Sleep only (and the draw is still made)', () => {
    const c = { chance1: bytes({ 1: 255, 2: 255, 5: 255 }) };
    const out = rollGroup1(attacker(), target(), command(c), start(), script(0, 0, 0).draw, { stopGate: true });
    expect(out.log.map((e) => [e.index, e.landed, e.immune])).toEqual([[1, false, true], [2, false, true], [5, true, false]]);
    expect(out.result.flags).toBe(IMMUNE_FLAG_PETRIFY | IMMUNE_FLAG_SLEEP);
  });

  it('the debug switches', () => {
    const c = { chance1: bytes({ 5: 1 }) };
    expect(g1(c, {}, {}, [100], {}, { debugForceLand: true }).result.statusSet).toBe(0x20);
    expect(g1({ chance1: bytes({ 5: 255 }) }, {}, {}, [0], {}, { debugForceFail: true }).result.statusSet).toBe(0);
  });
});

describe('group 1: what each status does to the set', () => {
  const sure = (i: number): Partial<StatusCommand> => ({ chance1: bytes({ [i]: 255 }) });
  it('Confusion and Berserk replace each other (and clear 0x20000)', () => {
    expect(g1(sure(Status1.Confusion), {}, { statusSet: 0x80 }).result.statusSet).toBe(0x40);
    expect(g1(sure(Status1.Berserk), {}, { statusSet: 0x40 }).result.statusSet).toBe(0x80);
    expect(g1(sure(Status1.Confusion), {}, { statusSet: 0x20080 }).result.statusSet).toBe(0x40);
    // a permanent Confusion/Berserk (0xc0) or 0x20000 source in the protect mask refuses both
    expect(g1(sure(Status1.Confusion), { protectMask: 0x80 }).result.statusSet).toBe(0);
    expect(g1(sure(Status1.Berserk), { protectMask: 0x20000 }).result.statusSet).toBe(0);
    expect(g1(sure(Status1.Poison), { protectMask: 0xc0 }).result.statusSet).toBe(0x20); // others unaffected
  });

  it('Curse needs no permanent Confusion/Berserk and no permanent Curse, and clears 0x20000', () => {
    expect(g1(sure(Status1.Curse), {}, { statusSet: 0x20000 }).result.statusSet).toBe(0x100);
    expect(g1(sure(Status1.Curse), { protectMask: 0x100 }).result.statusSet).toBe(0);
    expect(g1(sure(Status1.Curse), { protectMask: 0x40 }).result.statusSet).toBe(0);
  });

  it('status 17 (0x20000) clears Confusion, Berserk and Curse, under the same two refusals', () => {
    expect(g1(sure(17), {}, { statusSet: 0x1c0 | 0x20 }).result.statusSet).toBe(0x20 | 0x20000);
    expect(g1(sure(17), { protectMask: 0x100 }).result.statusSet).toBe(0);
    expect(g1(sure(17), { protectMask: 0x80 }).result.statusSet).toBe(0);
  });

  it('Death and the plain ailments just set their bit', () => {
    expect(g1(sure(Status1.Death)).result.statusSet).toBe(1);
    expect(g1(sure(Status1.Sleep), {}, { statusSet: 0x20 }).result.statusSet).toBe(0x24);
    expect(g1(sure(Status1.Defense)).result.statusSet).toBe(0x200);
  });

  it('Eject and Petrify are refused while the target is mid-action (any of bits 0, 1, 3...; bit 2 alone is fine)', () => {
    for (const i of [Status1.Eject, Status1.Petrify]) {
      expect(g1(sure(i), { actionState: 1 }).result.statusSet).toBe(0);
      expect(g1(sure(i), { actionState: 2 }).result.statusSet).toBe(0);
      expect(g1(sure(i), { actionState: 8 }).result.statusSet).toBe(0);
      expect(g1(sure(i), { actionState: 4 }).result.statusSet).not.toBe(0);
    }
    expect(g1(sure(Status1.Sleep), { actionState: 3 }).result.statusSet).toBe(4); // Sleep is not gated
  });

  it('Eject sets 0x400; Petrify on a party member sets just 0x2 and wipes the counters; on a monster it also ejects', () => {
    expect(g1(sure(Status1.Eject), {}, { statusSet: 0x20 }).result.statusSet).toBe(0x420);
    const stage = bytes({ 0: 9, 7: 3, 23: 255 });
    const party = g1(sure(Status1.Petrify), { id: 2 }, { statusSet: 0x20, counters: stage });
    expect(party.result.statusSet).toBe(0x2);
    expect(party.result.counters).toEqual(z());
    expect(g1(sure(Status1.Petrify), { id: 17 }, { statusSet: 0x20 }).result.statusSet).toBe(0x402);
    expect(g1(sure(Status1.Petrify), { status1: 0x400 }).result.statusSet).toBe(0); // already ejected
    expect(g1(sure(Status1.Petrify), {}, { statusSet: 0x400 }).result.statusSet).toBe(0x400);
  });

  it('a cleanse removes the bit the target has; a permanent source is cleared from the set but not reported', () => {
    const cure = { cleanse: true, chance1: bytes({ 2: 255 }) };
    const done = g1(cure, { status1: 4 }, { statusSet: 4 });
    expect(done.result.statusSet).toBe(0);
    expect(done.log[0]).toMatchObject({ removed: true, roll: null, landed: true });
    expect(g1(cure, { status1: 4, protectMask: 4 }, { statusSet: 4 }).log[0]).toMatchObject({ removed: false });
    expect(g1(cure, { status1: 4, protectMask: 4 }, { statusSet: 4 }).result.statusSet).toBe(0);
    expect(g1(cure, { status1: 0 }, { statusSet: 4 }).result.statusSet).toBe(4); // target lacks it: nothing
    expect(g1(cure, { status1: 6 }, { statusSet: 6 }).result.statusSet).toBe(6); // petrified: only Petrify can be cleansed
    expect(g1({ cleanse: true, chance1: bytes({ 1: 255 }) }, { status1: 6 }, { statusSet: 6 }).result.statusSet).toBe(4);
  });

  it('the secondary layer takes the bit with no other checks and gives it back on a cleanse', () => {
    const second = { secondaryLayer: true };
    expect(g1(sure(Status1.Petrify), { status1: 2, actionState: 9 }, { ...second, layerCSet: 0x10 }).result.layerCSet).toBe(0x12);
    expect(g1(sure(Status1.Petrify), {}, { ...second, layerCSet: 0x2 }).log[0]).toMatchObject({ applied: false });
    const cure = g1({ cleanse: true, chance1: bytes({ 4: 255 }) }, {}, { ...second, layerCSet: 0x10 });
    expect(cure.result.layerCSet).toBe(0);
    expect(cure.log[0]).toMatchObject({ removed: true });
    expect(g1(sure(Status1.Poison), {}, second).result.statusSet).toBe(0); // the main set is untouched
  });
});

describe('group 2: timed statuses and stat stages', () => {
  const sure = (i: number, amount: number): Partial<StatusCommand> => ({ chance2: bytes({ [i]: 255 }), amount2: bytes({ [i]: amount & 0xff }) });

  it('a timed status adds its amount to the counter (0 to 125) unless it is already in effect', () => {
    expect(g2(sure(Status2.Shell, 40)).result.counters[0]).toBe(40);
    expect(g2(sure(Status2.Shell, 50), {}, { counters: bytes({ 0: 100 }) }).result.counters[0]).toBe(125);
    expect(g2(sure(Status2.Regen, -30), {}, { counters: bytes({ 3: 10 }) }).result.counters[3]).toBe(0);
    const held = g2(sure(Status2.Shell, 40), { activeBytes: bytes({ 0: 5 }) });
    expect(held.result.counters[0]).toBe(0);
    expect(held.log[0]).toMatchObject({ landed: true, applied: false, attempted: true });
  });

  it('Haste clears Slow and Stop, Slow clears Haste and Stop, Stop clears Haste and Slow (the amount adds to its own counter)', () => {
    const base = { counters: bytes({ 4: 3, 5: 7, 6: 9 }) };
    expect(g2(sure(Status2.Haste, 20), {}, base).result.counters.slice(4, 7)).toEqual([23, 0, 0]);
    expect(g2(sure(Status2.Slow, 20), {}, base).result.counters.slice(4, 7)).toEqual([0, 27, 0]);
    expect(g2(sure(Status2.Stop, 20), {}, base).result.counters.slice(4, 7)).toEqual([0, 0, 29]);
  });

  it('a permanent Haste, Slow or Stop source (layers B and D) refuses all three; a failed Haste or Slow zeroes the ATB delta', () => {
    for (const layer of ['layerB', 'layerD'] as const) {
      for (const slot of [4, 5, 6]) {
        const out = g2(sure(Status2.Haste, 20), { [layer]: bytes({ [slot]: 1 }) });
        expect(out.result.counters[4]).toBe(0);
        expect(out.zeroAtbDelta).toBe(true);
      }
    }
    expect(g2(sure(Status2.Stop, 20), { layerB: bytes({ 4: 1 }) }).zeroAtbDelta).toBe(false); // a failed Stop does not
    expect(g2(sure(Status2.Shell, 20), { layerB: bytes({ 4: 1 }) }).result.counters[0]).toBe(20); // other timed statuses ignore it
  });

  it('Stop is also refused while the target is mid-action; a roll that fails zeroes the ATB delta only for Haste and Slow', () => {
    expect(g2(sure(Status2.Stop, 20), { actionState: 1 }).result.counters[6]).toBe(0);
    expect(g2(sure(Status2.Shell, 20), { actionState: 1 }).result.counters[0]).toBe(20);
    const failing = (i: number) => g2({ chance2: bytes({ [i]: 50 }), amount2: bytes({ [i]: 20 }) }, {}, {}, [100]);
    expect([failing(4).zeroAtbDelta, failing(5).zeroAtbDelta, failing(0).zeroAtbDelta, failing(6).zeroAtbDelta]).toEqual([true, true, false, false]);
  });

  it('a stat stage adds its step, clamped to -10..+10; an unchanged stage is "attempted"; a step down counts as removed', () => {
    const str = Status2.StatStrength;
    expect(g2(sure(str, 2), {}, { counters: bytes({ 7: 9 }) }).result.counters[7]).toBe(10);
    const capped = g2(sure(str, 2), {}, { counters: bytes({ 7: 10 }) });
    expect(capped.log[0]).toMatchObject({ applied: false, removed: false, attempted: true });
    const down = g2(sure(str, -3));
    expect(down.result.counters[7]).toBe(0xfd); // -3 as a byte
    expect(down.log[0]).toMatchObject({ removed: true, applied: false });
    expect(g2(sure(str, -3), {}, { counters: bytes({ 7: 0xf8 }) }).result.counters[7]).toBe(0xf6); // -8 - 3 = -11 -> -10
    expect(g2(sure(str, 2)).log[0]).toMatchObject({ applied: true });
  });

  it('Doom is a timed status', () => {
    expect(g2(sure(Status2.Doom, 6)).result.counters[14]).toBe(6);
  });

  it('a cleanse of a timed status subtracts the amount (counter 1..126, no permanent source); of a stage it zeroes it', () => {
    const cure = (i: number, amount: number): Partial<StatusCommand> => ({ cleanse: true, ...sure(i, amount) });
    expect(g2(cure(0, 10), {}, { counters: bytes({ 0: 30 }) }).result.counters[0]).toBe(20);
    expect(g2(cure(0, 50), {}, { counters: bytes({ 0: 30 }) }).result.counters[0]).toBe(0);
    expect(g2(cure(0, 10), {}, { counters: bytes({ 0: 30 }) }).log[0]).toMatchObject({ removed: true, roll: null });
    expect(g2(cure(0, 10)).log[0]).toMatchObject({ attempted: true }); // counter 0
    expect(g2(cure(0, 10), {}, { counters: bytes({ 0: 127 }) }).result.counters[0]).toBe(127); // 126 > 125: refused
    expect(g2(cure(0, 10), {}, { counters: bytes({ 0: 126 }) }).result.counters[0]).toBe(116);
    expect(g2(cure(0, 10), { layerB: bytes({ 0: 1 }) }, { counters: bytes({ 0: 30 }) }).result.counters[0]).toBe(30);
    expect(g2(cure(7, 0), {}, { counters: bytes({ 7: 0xfd }) }).result.counters[7]).toBe(0);
    expect(g2(cure(7, 0)).log[0]).toMatchObject({ attempted: true });
  });

  it('nothing is added to a petrified target or result set; resist 255 reads as immune', () => {
    expect(g2(sure(0, 40), { status1: 2 }).result.counters[0]).toBe(0);
    expect(g2(sure(0, 40), {}, { statusSet: 2 }).result.counters[0]).toBe(0);
    const imm = g2({ chance2: bytes({ 0: 100 }), amount2: bytes({ 0: 40 }) }, { resist2: bytes({ 0: 255 }) }, {}, [0]);
    expect(imm.log[0]).toMatchObject({ landed: false, immune: true, attempted: true });
  });

  it('the secondary layer stores the amount byte if empty, gives it back on a cleanse', () => {
    const second = { secondaryLayer: true };
    expect(g2(sure(0, 40), {}, second).result.layerCBytes[0]).toBe(40);
    expect(g2(sure(0, 40), {}, { ...second, layerCBytes: bytes({ 0: 9 }) }).result.layerCBytes[0]).toBe(9);
    expect(g2({ cleanse: true, ...sure(0, 40) }, {}, { ...second, layerCBytes: bytes({ 0: 9 }) }).result.layerCBytes[0]).toBe(0);
    expect(g2(sure(0, 40), {}, second).result.counters[0]).toBe(0);
  });

  it('the weapon amount replaces the row amount when it is larger in magnitude; the check-stop gate resists Stop only', () => {
    const w = { usesWeapon: true };
    expect(g2({ ...sure(7, 2), ...w }, {}, {}, [0], { weaponAmount2: bytes({ 7: 0xf8 }) }).result.counters[7]).toBe(0xf8); // -8 beats +2
    expect(g2({ ...sure(7, 5), ...w }, {}, {}, [0], { weaponAmount2: bytes({ 7: 3 }) }).result.counters[7]).toBe(5);
    expect(g2({ chance2: bytes({ 5: 255 }), ...w }, {}, {}, [0], { weaponChance2: bytes({ 5: 255 }), weaponAmount2: bytes({ 5: 9 }) }).result.counters[5]).toBe(9);
    const gate = rollGroup2(attacker(), target(), command({ chance2: bytes({ 0: 255, 6: 255 }), amount2: bytes({ 0: 5, 6: 5 }) }), start(), script(0, 0).draw, { stopGate: true });
    expect(gate.result.counters[0]).toBe(5);
    expect(gate.result.counters[6]).toBe(0);
  });

  it('draws once per status with a chance byte, in index order, on the purpose-2 stream; a cleanse draws nothing', () => {
    const s = script(0, 0);
    rollGroup2(attacker({ id: 15 }), target(), command({ chance2: bytes({ 2: 255, 9: 10 }) }), start(), s.draw);
    expect(s.streams).toEqual([60, 60]);
  });
});

describe('a whole command, and the shatter roll', () => {
  it('runs group 1 then group 2 on the same stream; group 2 starts from group 1\'s result', () => {
    const s = script(0, 0);
    const out = rollCommandStatuses(
      attacker(), target(),
      command({ chance1: bytes({ 3: 100 }), chance2: bytes({ 4: 255 }), amount2: bytes({ 4: 12 }) }),
      start({ flags: 0x100 }), s.draw,
    );
    expect(s.streams).toEqual([52, 52]);
    expect(out.log.map((e) => [e.group, e.index])).toEqual([[1, 3], [2, 4]]);
    expect(out.result).toMatchObject({ statusSet: 8, flags: 0x100 });
    expect(out.result.counters[4]).toBe(12);
  });

  it('builds the starting result from the target (or empty when flags_misc & 0x800 is set)', () => {
    const t = { appliedSet: 0x24, counters: bytes({ 1: 5 }), secondarySet: 0x10, secondaryBytes: bytes({ 2: 7 }) };
    expect(initialStatusResult(t, false, true, 0x100)).toMatchObject({ secondaryLayer: true, statusSet: 0x24, layerCSet: 0x10, flags: 0x100 });
    expect(initialStatusResult(t, true, false)).toEqual(start());
  });

  it('shatter: a petrified target draws once (purpose 2) and breaks when draw % 101 < the row byte', () => {
    const s = script(40);
    expect(rollShatter(true, 41, 0, s.draw)).toEqual({ drew: true, roll: 40, shattered: true });
    expect(s.streams).toEqual([52]);
    expect(rollShatter(true, 40, 0, script(40).draw).shattered).toBe(false);
    const none = script(0);
    expect(rollShatter(false, 255, 0, none.draw)).toEqual({ drew: false, roll: null, shattered: false });
    expect(none.streams).toEqual([]);
  });
});

describe('golden vectors: the emulated functions (tests/fixtures/parity/ffx2/status_roll_g1.json and status_roll_g2.json)', () => {
  const fx1 = loadFfx2ParityFixture('status_roll_g1');
  (fx1 ? it : it.skip)('group 1: every vector', () => {
    for (const v of fx1!.vectors) {
      const c = status1CaseFromVector(fx1!.defaults, v.in);
      const s = scriptedDraw(v.rngDraws);
      const out = rollGroup1(c.attacker, c.target, c.command, c.start, s.draw, c.options);
      const o = v.out as Record<string, unknown>;
      try {
        expect(out.result.flags >>> 0).toBe((o['ret'] as number) >>> 0);
        expect(out.result.statusSet >>> 0).toBe((o['status34'] as number) >>> 0);
        expect(out.result.layerCSet >>> 0).toBe((o['cleanse50'] as number) >>> 0);
        expect(out.result.counters).toEqual((o['stage38'] as number[]).flatMap((x) => [x & 0xff, (x >>> 8) & 0xff, (x >>> 16) & 0xff, (x >>> 24) & 0xff]));
        expect(statusTraceLikeVector(out.log, c.attacker.level, c.target.level)).toEqual(o['trace']);
        expect(s.calls()).toBe(v.rngDraws?.length ?? 0);
      } catch (e) {
        throw new Error(`vector ${v.id} (${v.class}): ${(e as Error).message}`);
      }
    }
  });

  const fx2 = loadFfx2ParityFixture('status_roll_g2');
  (fx2 ? it : it.skip)('group 2: every vector', () => {
    for (const v of fx2!.vectors) {
      const c = status2CaseFromVector(fx2!.defaults, v.in);
      const s = scriptedDraw(v.rngDraws);
      const out = rollGroup2(c.attacker, c.target, c.command, c.start, s.draw, c.options);
      const o = v.out as Record<string, unknown>;
      const s8 = (x: number): number => (x << 24) >> 24;
      try {
        expect(out.result.flags >>> 0).toBe((o['ret'] as number) >>> 0);
        expect(out.result.counters.map(s8)).toEqual((o['stages'] as number[]).map(s8));
        expect(out.result.layerCBytes.map((x) => x & 0xff)).toEqual((o['second'] as number[]).map((x) => x & 0xff));
        expect(out.zeroAtbDelta ? [c.damage[0], c.damage[1], 0] : c.damage).toEqual(o['damage']);
        expect(statusTraceLikeVector(out.log, c.attacker.level, c.target.level)).toEqual(o['trace']);
        expect(s.calls()).toBe(v.rngDraws?.length ?? 0);
      } catch (e) {
        throw new Error(`vector ${v.id} (${v.class}): ${(e as Error).message}`);
      }
    }
  });
});
