/**
 * Golden vectors for the FFX-2 Confusion pick (exe 0x00649350, with the candidate filter 0x00649240 and the target functions 0x0063f920, 0x0063fc60 under it)
 * (`src/battle/ffx2/kernel/confusion-pick.ts`, `target-pick.ts`, `item-rows.ts`). **Game case: FFX-2 only.**
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69). A vector is the answer of the REAL game function: the emulator harness (Unicorn) ran the live
 * machine code over a random battle world (a chr slot, its two command lists, the party stock, the blocked bitfields, the field state of 31 slots, a command queue
 * with room) with the random generator hooked, and recorded every draw (stream and value) and the record that the pick queued. The independent model written from
 * the disassembly agreed with 20,000 such worlds with 0 mismatches (the exporter, `D:\Tools\ffx-parity\rc9\x2-confusion\export_fixture.py`, keeps 460 of them,
 * stratified by who picks, what is picked, how many draws, and which streams). The candidate list in each vector is model-derived; everything else is the game's.
 * Left out of the file: worlds where the pet preamble 0x00648e70 could fire and worlds whose queue is full (the engine's part).
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { confusionCandidates, confusionPick, pickRow, type Ffx2PickWorld } from '../../src/battle/ffx2/kernel/confusion-pick.ts';
import { aimTargets, validTargets, type Ffx2TargetSlot } from '../../src/battle/ffx2/kernel/target-pick.ts';
import { FFX2_ITEM_ROWS, itemRow } from '../../src/battle/ffx2/kernel/item-rows.ts';
import { FFX2_COMMAND_ROWS, menuRow } from '../../src/battle/ffx2/kernel/command-menu-rows.ts';

interface Vec {
  c: number;
  m: number[];
  s: number[];
  k: number[];
  t?: Record<string, number[]>;
  b?: Record<string, Record<string, number>>;
  d: number[];
  x: { cand: Array<[number, number]>; cmd: number; all: number; mask: number; draws: Array<[number, number]> };
}
interface Fixture {
  count: number;
  pool: number;
  pool_mismatches: number;
  vectors: Vec[];
}

const fixture = JSON.parse(readFileSync(new URL('../fixtures/parity/ffx2/confusion_pick.json', import.meta.url), 'utf8')) as Fixture;

const DEFAULT_SLOT = [1, 1, 0, 0, 0, 1, 0];

function slotsOf(v: Vec): Ffx2TargetSlot[] {
  const out: Ffx2TargetSlot[] = [];
  for (let i = 0; i < 31; i++) {
    const a = v.t?.[String(i)] ?? DEFAULT_SLOT;
    out.push({ loaded: a[0] === 1, inBattle: a[1] === 1, out: a[2] === 1, dead: a[3] === 1, hidden: a[4] as number, selectable: a[5] as number, status1: a[6] as number });
  }
  return out;
}

function pad(a: readonly number[], n: number): number[] {
  const out = a.slice();
  while (out.length < n) out.push(0xff);
  return out;
}

function worldOf(v: Vec): Ffx2PickWorld {
  const blocked = (id: number): boolean => {
    const category = (id & 0xffff) >> 12;
    const low = id & 0xfff;
    const word = String(low >> 4);
    const bit = 1 << (low & 15);
    if (category === 3) return (((v.b?.['87c']?.[word] ?? 0) | (v.b?.['910']?.[word] ?? 0)) & bit) !== 0;
    return (((v.b?.['9a8']?.[word] ?? 0) & bit) !== 0);
  };
  return { chr: v.c, main: pad(v.m, 16), shortcut: pad(v.s, 4), stock: pad(v.k, 68), blocked, slots: slotsOf(v) };
}

/** A draw callback that hands out the vector's values and logs the streams asked for. */
function scripted(values: readonly number[]): { draw: (stream: number) => number; log: Array<[number, number]> } {
  const log: Array<[number, number]> = [];
  return {
    log,
    draw: (stream: number): number => {
      const value = values[log.length];
      if (value === undefined) throw new Error(`the kernel drew ${log.length + 1} values (stream ${stream}) but the game drew ${values.length}`);
      log.push([stream, value]);
      return value;
    },
  };
}

describe('the Confusion pick against the game', () => {
  it('the fixture is what it says it is', () => {
    expect(fixture.pool).toBeGreaterThanOrEqual(20000);
    expect(fixture.pool_mismatches).toBe(0);
    expect(fixture.vectors.length).toBe(fixture.count);
    expect(fixture.count).toBeGreaterThan(400);
  });

  it('every vector: the candidates, the draws (which stream, in which order), the command, the all-targets byte and the queued mask', () => {
    let drawn = 0;
    for (const v of fixture.vectors) {
      const { draw, log } = scripted(v.d);
      const r = confusionPick(worldOf(v), draw);
      expect(r.candidates.map((c) => [c.id, c.sub])).toEqual(v.x.cand);
      expect(log).toEqual(v.x.draws);
      expect(r.command).toBe(v.x.cmd);
      expect(r.all ? 1 : 0).toBe(v.x.all);
      expect(r.mask).toBe(v.x.mask);
      drawn += log.length;
    }
    expect(drawn).toBeGreaterThan(500);
  });

  it('the fixture exercises each branch of the pick (so a vector that never reaches a rule cannot vouch for it)', () => {
    const tally = { none: 0, item: 0, attack: 0, other: 0, subPick: 0, allDraw: 0, allSet: 0, stream4: 0, stream5: 0, monster: 0, noMask: 0, blocked: 0, byte3: 0 };
    for (const v of fixture.vectors) {
      const x = v.x;
      if (x.cmd === 0xff) tally.none++;
      else if ((x.cmd >> 12) === 2) tally.item++;
      else if ([0x302c, 0x302d, 0x302e, 0x302f, 0x3030, 0x3031, 0x312f].includes(x.cmd)) tally.attack++;
      else tally.other++;
      if (x.cand.some(([, sub]) => sub >= 0)) tally.subPick++;
      if (x.all === 1) tally.allSet++;
      if (x.draws.some(([s]) => s === 4)) tally.stream4++;
      if (x.draws.some(([s]) => s === 5)) tally.stream5++;
      if (v.c >= 15) tally.monster++;
      if (x.cmd !== 0xff && x.mask === 0) tally.noMask++;
      if (v.b !== undefined) tally.blocked++;
      if (pickRow(x.cmd === 0xff ? 0x3000 : x.cmd).cursor & 0x80) tally.allDraw++;
      if (x.cmd !== 0xff && ((pickRow(x.cmd).cursor >> 2) & 3) === 3) tally.byte3++;
    }
    for (const [k, n] of Object.entries(tally)) expect(n, `branch ${k}`).toBeGreaterThan(0);
  });
});

describe('the pieces', () => {
  it('the row tables hold the 554 command rows and the 68 item rows, and every item row carries the Confusion bit and no sub-menu', () => {
    expect(FFX2_COMMAND_ROWS).toBe(554);
    expect(FFX2_ITEM_ROWS).toBe(68);
    for (let i = 0; i < FFX2_ITEM_ROWS; i++) {
      expect(itemRow(0x2000 + i).misc & 0x20000000).not.toBe(0);
      expect(pickRow(0x2000 + i).flags).toBe(0);
    }
    expect(() => itemRow(0x2044)).toThrow(RangeError);
    // 245 command rows carry the bit and the Item command (0x3000) is the only parent among them
    let withBit = 0;
    const parents: number[] = [];
    for (let i = 0; i < FFX2_COMMAND_ROWS; i++) {
      const r = menuRow(i);
      if ((r.misc & 0x20000000) === 0) continue;
      withBit++;
      if ((r.flags & 0xf8) !== 0) parents.push(0x3000 + i);
    }
    expect(withBit).toBe(245);
    expect(parents).toEqual([0x3000]);
  });

  it('a monster slot skips the first entry of its main list', () => {
    const slots = Array.from({ length: 31 }, () => ({ loaded: true, inBattle: true, out: false, dead: false, hidden: 0, selectable: 1, status1: 0 }));
    const base = { main: pad([0x302c, 0x302d], 16), shortcut: pad([], 4), stock: pad([], 68), blocked: () => false, slots };
    expect(confusionCandidates({ ...base, chr: 0 }).map((c) => c.id)).toEqual([0x302c, 0x302d]);
    expect(confusionCandidates({ ...base, chr: 15 }).map((c) => c.id)).toEqual([0x302d]);
  });

  it('the Item command is a candidate only with a usable item in the stock, and carries the count', () => {
    const slots = Array.from({ length: 31 }, () => ({ loaded: true, inBattle: true, out: false, dead: false, hidden: 0, selectable: 1, status1: 0 }));
    const w = (stock: number[]): Ffx2PickWorld => ({ chr: 0, main: pad([0x302c, 0x3000], 16), shortcut: pad([], 4), stock: pad(stock, 68), blocked: () => false, slots });
    expect(confusionCandidates(w([])).map((c) => [c.id, c.sub])).toEqual([[0x302c, -1]]);
    expect(confusionCandidates(w([0x2000, 0x2006, 0xff, 0x2001])).map((c) => [c.id, c.sub])).toEqual([[0x302c, -1], [0x3000, 3]]);
    // a blocked item (the chr's item bitfield) does not count
    const noPhoenix: Ffx2PickWorld = { ...w([0x2000, 0x2006]), blocked: (id) => id === 0x2006 };
    expect(confusionCandidates(noPhoenix).map((c) => [c.id, c.sub])).toEqual([[0x302c, -1], [0x3000, 1]]);
  });

  it('the valid-target set and the dispatcher: a single-target row with the team-split bit aims at anyone in the battle, one draw of stream 4 picks', () => {
    const slots: Ffx2TargetSlot[] = Array.from({ length: 31 }, (_, i) => ({ loaded: i < 5 || i === 15 || i === 16, inBattle: i < 5 || i === 15 || i === 16, out: false, dead: false, hidden: 0, selectable: 1, status1: 0 }));
    const attack = menuRow(0x302c & 0xfff).cursor; // 0x433: the team-split bit, single target, far
    const valid = validTargets(0, attack, slots);
    expect(valid).toBe(0b11111 | (1 << 15) | (1 << 16));
    const seen: Array<[number, number]> = [];
    const mask = aimTargets(0, attack, valid, false, (stream) => {
      seen.push([stream, 5]);
      return 5;
    });
    expect(seen).toEqual([[4, 5]]); // 7 candidates, 5 % 7 = 5: the sixth in ascending order is slot 15
    expect(mask).toBe(1 << 15);
    // the dead are out of a row that cannot target them, and in for one that can
    const withDead = slots.map((s, i) => (i === 3 ? { ...s, dead: true } : s));
    expect(validTargets(0, attack, withDead) & (1 << 3)).toBe(0);
    expect(validTargets(0, attack | 0x40, withDead) & (1 << 3)).not.toBe(0);
  });
});
