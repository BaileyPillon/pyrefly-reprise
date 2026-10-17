/**
 * Kernel parity for FFX-2's script stat setter (re-parity RC9, lane X2-E; **FFX-2 only**): `kernel/stat-setter.ts`.
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), the setter at live `0x639400` and its group-mask builder `0x6117b0`; note
 * FFX2-G05 sections 3.1 to 3.4, 3.8 to 3.10, 4.1, 4.2 and 10. A vector in `tests/fixtures/parity/ffx2/stat_setter.json` is the answer of the REAL setter run in the harness
 * over a generated 31-character world with its callees logged: the number of slots it visited, the bytes it changed (the first 24) and the routines it asked for (the first
 * 8). 4,209 of the 207,552 vectors of the note's last run, for the 43 stat ids the 36 compiled boss packages write: three group specs each (the script's own character, a slot
 * number, a species word), 23 values each (0, 1, 2, 3, 7, 100, 101, 127, 128, 254, 255, 256, 257, 0x1234, 0xffff, 0x10000, 0x7fffffff, 0x80000000, 0xfffffffe, 0xffffffff
 * and three random), in one or four worlds (four for the ids whose answer depends on the world: hit points, the in-battle byte, the death pattern, the effect level and the
 * two invincible-motion bits). The worlds were regenerated from the job's seed (`D:\Tools\ffx-parity\rc9\x2-stat\regen.py`); the independent port of the note reproduces the
 * logged answer of every one of them, so the regenerated worlds are the harness's.
 *
 * The second half pins what the shipped scripts write (`stat_setter_usage.json`, the 891 compiled `setstat` / `setstat2` calls of the 36 boss packages): that the 46 ids are
 * the note's 46, which are ported and which are declined, and the three group specs the scripts use.
 *
 * Mutation-checked (scratch, `D:\Tools\ffx-parity\rc9\x2-stat\mutate.py`): each fault the handoff lists is caught here.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  APPLIED_STATUS_OFFSET,
  GROUP_OWN,
  HELPER_STAT_IDS,
  HP_OFFSET,
  NO_CASE_STAT_IDS,
  STAT_ROWS,
  StatId,
  chrMonster,
  groupSlots,
  setStat,
  storedValue,
  type StatResult,
  type StatWorld,
} from '../../src/battle/ffx2/kernel/stat-setter.ts';

interface Image {
  stat: number;
  world: number;
  /** Per slot: species word (Chr+0xe), in battle (+0x1784), gone (+0x1792), applied status low byte (+0x450), invincible-motion byte (+0x2ec), model object (+0x0). */
  reads: number[][];
  /** The bytes the id writes, before the call: `"slot:offset"` to the byte. */
  pre: Record<string, number>;
}
type Diff = [slot: number, offset: number, value: number];
type Call = [name: string, a: number, b: number];
type Vector = [image: number, value: number, spec: number, caller: number, count: number, diff: Diff[], calls: Call[]];
interface Fixture {
  images: Image[];
  vectors: Vector[];
}
interface Usage {
  packages: Record<string, Array<[worker: number, fn: number, spec: number, id: number, value: number | null]>>;
}
interface Masks {
  /** Per world, the monster slots 15 to 30: species word, in battle, gone. */
  worlds: number[][][];
  /** World, owner, spec, the slots the game's builder answered. */
  cases: Array<[world: number, caller: number, spec: number, slots: number[]]>;
}

const load = <T>(name: string): T => JSON.parse(readFileSync(fileURLToPath(new URL(`../fixtures/parity/ffx2/${name}.json`, import.meta.url)), 'utf8')) as T;
const fx = load<Fixture>('stat_setter');
const usage = load<Usage>('stat_setter_usage');
const masks = load<Masks>('stat_setter_masks');

/** A world that answers only the reads the fixture holds: a read of any other field fails the test, so the kernel's read set is exactly the fixture's. */
function worldOf(image: Image): StatWorld {
  const field = (slot: number, index: number): number => {
    const r = image.reads[slot];
    if (r === undefined) throw new Error(`no slot ${slot}`);
    return r[index] as number;
  };
  return {
    u8(slot, offset) {
      switch (offset) {
        case 0x1784: return field(slot, 1);
        case 0x1792: return field(slot, 2);
        case APPLIED_STATUS_OFFSET: return field(slot, 3);
        case 0x2ec: return field(slot, 4);
        default: throw new Error(`the kernel read u8 Chr+0x${offset.toString(16)}, which the fixture does not hold`);
      }
    },
    u16(slot, offset) {
      if (offset === 0xe) return field(slot, 0);
      throw new Error(`the kernel read u16 Chr+0x${offset.toString(16)}, which the fixture does not hold`);
    },
    u32(slot, offset) {
      if (offset === 0) return field(slot, 5);
      throw new Error(`the kernel read u32 Chr+0x${offset.toString(16)}, which the fixture does not hold`);
    },
  };
}

/** The changed bytes of a result against the pre-image, in the order the harness lists them (ascending slot, then offset), cut at the harness's 24. */
function changedBytes(image: Image, result: StatResult): Diff[] {
  const out: Diff[] = [];
  for (const w of result.writes) {
    for (let k = 0; k < w.width; k += 1) {
      const offset = w.offset + k;
      const before = image.pre[`${w.slot}:${offset}`];
      if (before === undefined) throw new Error(`the kernel wrote slot ${w.slot} Chr+0x${offset.toString(16)}, which the fixture holds no pre-image for`);
      const after = Math.floor(w.value / 2 ** (8 * k)) & 0xff;
      if (after !== before) out.push([w.slot, offset, after]);
    }
  }
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return out.slice(0, 24);
}

const callsOf = (result: StatResult): Call[] => result.calls.map((c): Call => [c.name, c.a, c.b]).slice(0, 8);

describe('golden vectors: the setter\'s count, changed bytes and asked routines (tests/fixtures/parity/ffx2/stat_setter.json)', () => {
  it('the fixture holds 4,209 vectors in 61 worlds, a third of them for each group spec', () => {
    expect(fx.images.length).toBe(61);
    expect(fx.vectors.length).toBe(4209);
    const kinds: Record<string, number> = { own: 0, slot: 0, species: 0 };
    for (const v of fx.vectors) kinds[v[2] === GROUP_OWN ? 'own' : v[2] < 31 ? 'slot' : 'species'] = (kinds[v[2] === GROUP_OWN ? 'own' : v[2] < 31 ? 'slot' : 'species'] ?? 0) + 1;
    expect(kinds).toEqual({ own: 1403, slot: 1403, species: 1403 });
  });

  it('replays every vector: the same count, the same changed bytes, the same routines', () => {
    let bad = 0;
    const first: string[] = [];
    for (const [index, v] of fx.vectors.entries()) {
      const [imageIndex, value, spec, caller, count, diff, calls] = v;
      const image = fx.images[imageIndex] as Image;
      const result = setStat(worldOf(image), caller, image.stat, spec, value);
      const ok = result.count === count && JSON.stringify(changedBytes(image, result)) === JSON.stringify(diff) && JSON.stringify(callsOf(result)) === JSON.stringify(calls);
      if (!ok) {
        bad += 1;
        if (first.length < 3) first.push(`vector ${index}: stat ${image.stat} value ${value} spec ${spec} caller ${caller}: count ${result.count} vs ${count}; bytes ${JSON.stringify(changedBytes(image, result))} vs ${JSON.stringify(diff)}; calls ${JSON.stringify(callsOf(result))} vs ${JSON.stringify(calls)}`);
      }
    }
    expect(first).toEqual([]);
    expect(bad).toBe(0);
  });

  it('reaches every branch: both Death-bit outcomes of a hit-point write, the model-object call, the Strength post-step, the status recompute, party slots left alone', () => {
    const seen = {
      revive: false, noRevive: false, efflvCall: false, efflvNoCall: false, strpost: false, recompute: false, speciesNone: false,
      partyPatternSkipped: false, monsterPatternWritten: false, bitSet: false, bitCleared: false, none198: false,
    };
    for (const v of fx.vectors) {
      const [imageIndex, value, spec, caller, count, diff, calls] = v;
      const stat = (fx.images[imageIndex] as Image).stat;
      const names = calls.map((c) => c[0]);
      if (stat === StatId.hp) {
        if (diff.some((d) => d[1] === APPLIED_STATUS_OFFSET)) seen.revive = true;
        else if (count > 0 && value !== 0) seen.noRevive = true;
      }
      if (stat === 222) {
        if (names.includes('EFFLV_MODEL')) seen.efflvCall = true;
        else if (count > 0) seen.efflvNoCall = true;
      }
      if (names.includes('STRPOST')) seen.strpost = true;
      if (names.includes('MSSETSTATUS')) seen.recompute = true;
      if (spec >= 0x1000 && spec < 0x2000 && count === 0) seen.speciesNone = true;
      if (stat === StatId.deathPattern && spec === GROUP_OWN) {
        if (caller < 15 && count === 1 && diff.length === 0) seen.partyPatternSkipped = true;
        if (caller >= 15 && caller <= 30 && diff.length > 0) seen.monsterPatternWritten = true;
      }
      if (stat === 333 || stat === 334) {
        if (diff.length > 0 && (value & 1) === 1) seen.bitSet = true;
        if (diff.length > 0 && (value & 1) === 0) seen.bitCleared = true;
      }
      if (stat === 198 && count > 0 && diff.length === 0) seen.none198 = true;
    }
    expect(seen).toEqual({
      revive: true, noRevive: true, efflvCall: true, efflvNoCall: true, strpost: true, recompute: true, speciesNone: true,
      partyPatternSkipped: true, monsterPatternWritten: true, bitSet: true, bitCleared: true, none198: true,
    });
  });

  it('covers all 43 ported ids, 61 worlds, and the one-world ids have their first world', () => {
    const ids = new Set(fx.images.map((i) => i.stat));
    expect([...ids].sort((a, b) => a - b)).toEqual([StatId.hp, ...STAT_ROWS.map((r) => r.id), 198, StatId.deathPattern].sort((a, b) => a - b));
    const worlds = (id: number): number[] => fx.images.filter((i) => i.stat === id).map((i) => i.world);
    for (const id of [StatId.hp, StatId.inBattle, StatId.deathPattern, 222, 333, 334]) expect(worlds(id), `stat ${id}`).toEqual([0, 1, 2, 3]);
    expect(worlds(StatId.dex)).toEqual([0]);
  });
});

describe('golden vectors: the group-mask builder (tests/fixtures/parity/ffx2/stat_setter_masks.json)', () => {
  /** The world the builder test gives the kernel: monster slots 15 to 30 only (the only slots the three specs read); anything else fails the test. */
  const maskWorld = (index: number): StatWorld => {
    const slots = masks.worlds[index] as number[][];
    const at = (slot: number): number[] => {
      const r = slots[slot - 15];
      if (r === undefined) throw new Error(`the kernel read slot ${slot}`);
      return r;
    };
    return {
      u8: (slot, offset) => (offset === 0x1784 ? (at(slot)[1] as number) : offset === 0x1792 ? (at(slot)[2] as number) : (() => { throw new Error(`u8 ${offset.toString(16)}`); })()),
      u16: (slot, offset) => (offset === 0xe ? (at(slot)[0] as number) : (() => { throw new Error(`u16 ${offset.toString(16)}`); })()),
      u32: () => { throw new Error('u32'); },
    };
  };

  it('the kernel names the same slots as the game builder (0x6117b0) in all 3,120 calls: own with owners 0 to 255, slot numbers and the edge values, species words 0x1000 to 0x1045 and 0x1fff', () => {
    expect(masks.cases.length).toBe(3120);
    let bad = 0;
    for (const [world, caller, spec, slots] of masks.cases) if (JSON.stringify(groupSlots(maskWorld(world), caller, spec)) !== JSON.stringify(slots)) bad += 1;
    expect(bad).toBe(0);
  });

  it('reaches the species branch: groups of several slots, empty groups, a member left out for being out of the battle or gone, own with an owner of 31 and up', () => {
    let several = 0;
    let leftOut = 0;
    let none = 0;
    let ownOut = 0;
    for (const [world, caller, spec, slots] of masks.cases) {
      if (spec === GROUP_OWN && slots.length === 0) ownOut += caller >= 31 ? 1 : 0;
      if (spec >= 0x1000 && spec < 0x2000) {
        if (slots.length > 1) several += 1;
        if (slots.length === 0) none += 1;
        const rows = masks.worlds[world] as number[][];
        const sameWord = rows.flatMap((r, i) => (r[0] === spec ? [i + 15] : []));
        if (sameWord.some((slot) => !slots.includes(slot))) leftOut += 1;
      }
    }
    expect(several).toBeGreaterThan(10);
    expect(none).toBeGreaterThan(100);
    expect(leftOut).toBeGreaterThan(5);
    expect(ownOut).toBeGreaterThan(20);
  });
});

describe('the value forms (FFX2-G05 3.3)', () => {
  it('clamp 1..255, signed: 0, a negative number and 0xffffffff all store 1; 256 and up store 255', () => {
    for (const [value, stored] of [[0, 1], [1, 1], [2, 2], [100, 100], [254, 254], [255, 255], [256, 255], [257, 255], [0x1234, 255], [0x7fffffff, 255], [0x80000000, 1], [0xfffffffe, 1], [0xffffffff, 1]] as const) {
      expect(storedValue('clamp1', value), `value ${value}`).toBe(stored);
    }
  });

  it('low 8 bits, low 16 bits, bit 0 and the raw 32 bits', () => {
    expect(storedValue('lo8', 0x1234)).toBe(0x34);
    expect(storedValue('lo8', 256)).toBe(0);
    expect(storedValue('lo16', 0x12345)).toBe(0x2345);
    expect(storedValue('lo16', 0xffff)).toBe(0xffff);
    expect(storedValue('bit0', 2)).toBe(0);
    expect(storedValue('bit0', 255)).toBe(1);
    expect(storedValue('raw32', 0xffffffff)).toBe(0xffffffff);
    expect(storedValue('raw32', 0x1_0000_0001)).toBe(1);
  });

  it('every row names a distinct id and a width the byte offsets of its form fit', () => {
    expect(new Set(STAT_ROWS.map((r) => r.id)).size).toBe(STAT_ROWS.length);
    for (const r of STAT_ROWS) {
      if (r.form === 'raw32') expect(r.width, r.name).toBe(4);
      if (r.form === 'lo16') expect(r.width, r.name).toBe(2);
      if (r.form === 'lo8' || r.form === 'bit0' || r.form === 'clamp1' || r.form === 'bitof') expect(r.width, r.name).toBe(1);
      expect(r.id).toBeGreaterThan(0);
    }
  });
});

describe('the group specs the scripts use (FFX2-G05 3.2)', () => {
  /** 31 characters, each in the battle and not gone, species 0x1122 on slots 16 and 20 and 0x1123 on slot 18; slot 21 is gone and slot 22 is out of the battle (both species 0x1122). */
  const world = (): StatWorld => {
    const species = (slot: number): number => (slot === 16 || slot === 20 || slot === 21 || slot === 22 ? 0x1122 : slot === 18 ? 0x1123 : 0);
    return {
      u8: (slot, offset) => (offset === 0x1784 ? (slot === 22 ? 0 : 1) : offset === 0x1792 ? (slot === 21 ? 1 : 0) : 0),
      u16: (slot, offset) => (offset === 0xe ? species(slot) : 0),
      u32: () => 0,
    };
  };

  it('chr_own is the owner when it is below 31, else nobody', () => {
    expect(groupSlots(world(), 17, GROUP_OWN)).toEqual([17]);
    expect(groupSlots(world(), 30, GROUP_OWN)).toEqual([30]);
    expect(groupSlots(world(), 0, GROUP_OWN)).toEqual([0]);
    expect(groupSlots(world(), 31, GROUP_OWN)).toEqual([]);
    expect(groupSlots(world(), 0xff, GROUP_OWN)).toEqual([]);
  });

  it('a slot number is that slot, whatever its state; the low byte decides, so 0x100 and 0x2000 are slot 0; 31 and up is nobody', () => {
    expect(groupSlots(world(), 15, 16)).toEqual([16]);
    expect(groupSlots(world(), 15, 22)).toEqual([22]); // out of the battle, still named
    expect(groupSlots(world(), 15, 0x2000)).toEqual([0]);
    expect(groupSlots(world(), 15, 0x100)).toEqual([0]);
    expect(groupSlots(world(), 15, 0x105)).toEqual([5]);
    expect(groupSlots(world(), 15, 0x80000000)).toEqual([0]);
    expect(groupSlots(world(), 15, 31)).toEqual([]);
    expect(groupSlots(world(), 15, 0x11f)).toEqual([]);
  });

  it('a species word is every monster slot in the battle, not gone, with that word, in ascending order', () => {
    expect(groupSlots(world(), 15, 0x1122)).toEqual([16, 20]);
    expect(groupSlots(world(), 15, 0x1123)).toEqual([18]);
    expect(groupSlots(world(), 15, 0x1124)).toEqual([]);
    expect(groupSlots(world(), 15, 4386)).toEqual([16, 20]); // the Head's word, as the Redoubts' death entries write it
  });

  it('the named group specs the scripts do not use throw, whichever they are', () => {
    for (const spec of [-1, -2, -5, -14, -15, -19, -23, -29, -31]) expect(() => groupSlots(world(), 15, spec >>> 0), `spec ${spec}`).toThrow(/not one the shipped scripts use/);
  });

  it('chrMonster is the scene\'s n-th monster: slot 15 for chr_mon1, 16 and 17 for the two Bulwarks of the Body', () => {
    expect([chrMonster(1), chrMonster(2), chrMonster(3)]).toEqual([15, 16, 17]);
  });
});

describe('the ids the shipped scripts write (stat_setter_usage.json: the 891 compiled calls of the 36 boss packages)', () => {
  const ids = new Set<number>();
  for (const calls of Object.values(usage.packages)) for (const [, , , id] of calls) ids.add(id);

  it('are the note\'s 46: 42 plain stores, hit points and the death pattern as hand cases, id 198 with no case, and three helpers declined', () => {
    expect(usage.packages).not.toHaveProperty('m000');
    expect(Object.keys(usage.packages).length).toBe(36);
    expect(Object.values(usage.packages).reduce((n, calls) => n + calls.length, 0)).toBe(891);
    expect(ids.size).toBe(46);
    const ported = new Set<number>([StatId.hp, StatId.deathPattern, ...STAT_ROWS.map((r) => r.id), ...NO_CASE_STAT_IDS]);
    expect([...ids].filter((id) => !ported.has(id)).sort((a, b) => a - b)).toEqual([...HELPER_STAT_IDS]);
    expect([...ported].filter((id) => !ids.has(id))).toEqual([]);
  });

  it('are written through three group specs only: the script\'s own character, a monster slot (15, 16, 17) and the Head\'s species word', () => {
    const specs = new Map<number, number>();
    for (const calls of Object.values(usage.packages)) for (const [, , spec] of calls) specs.set(spec, (specs.get(spec) ?? 0) + 1);
    expect([...specs].sort((a, b) => a[0] - b[0])).toEqual([[-13, 880], [15, 3], [16, 4], [17, 2], [4386, 2]]);
  });

  it('a helper and an id outside the list are declined with an error, not guessed', () => {
    const world: StatWorld = { u8: () => 0, u16: () => 0, u32: () => 0 };
    for (const id of HELPER_STAT_IDS) expect(() => setStat(world, 15, id, GROUP_OWN, 1), `stat ${id}`).toThrow(/helper/);
    for (const id of [2, 3, 4, 5, 10, 55, 91, 240, 999]) expect(() => setStat(world, 15, id, GROUP_OWN, 1), `stat ${id}`).toThrow(/not one the shipped scripts write/);
  });

  it('id 198 has no case: no store, no routine, and the slot is still counted', () => {
    const world: StatWorld = { u8: () => 0, u16: () => 0, u32: () => 0 };
    expect(setStat(world, 15, 198, GROUP_OWN, 1)).toEqual({ count: 1, writes: [], calls: [] });
  });
});

describe('the hit-point write (FFX2-G05 3.6): stored raw, no clamp, no KO routine; a revival only when the Death bit is set and the value is at least 1', () => {
  const dead = (applied: number): StatWorld => ({ u8: (_slot, offset) => (offset === APPLIED_STATUS_OFFSET ? applied : 0), u16: () => 0, u32: () => 0 });

  it('a living character at 0 hit points: stored, alive, no revival, only the low-HP check and the HP-state refresh', () => {
    const r = setStat(dead(0), 15, StatId.hp, chrMonster(2), 0);
    expect(r.count).toBe(1);
    expect(r.writes).toEqual([{ slot: 16, offset: HP_OFFSET, width: 4, value: 0 }]);
    expect(r.calls.map((c) => c.name)).toEqual(['SOS', 'HPSTATE']);
  });

  it('1 on a character with the Death bit clears the bit and recomputes the statuses first', () => {
    const r = setStat(dead(0x03), 15, StatId.hp, GROUP_OWN, 1);
    expect(r.writes).toEqual([{ slot: 15, offset: HP_OFFSET, width: 4, value: 1 }, { slot: 15, offset: APPLIED_STATUS_OFFSET, width: 1, value: 0x02 }]);
    expect(r.calls.map((c) => c.name)).toEqual(['AUTOCOPY', 'MSSETSTATUS', 'STATUSEFFECTCHECK', 'HPSTATE', 'SOS', 'HPSTATE']);
  });

  it('0 and a negative value never revive, and 0xffffffff is stored raw (the character holds -1)', () => {
    for (const value of [0, 0x80000000, 0xffffffff]) {
      const r = setStat(dead(0x01), 15, StatId.hp, GROUP_OWN, value);
      expect(r.writes, `value ${value}`).toEqual([{ slot: 15, offset: HP_OFFSET, width: 4, value }]);
    }
  });

  it('99,999 is stored above any maximum', () => {
    expect(setStat(dead(0), 15, StatId.hp, GROUP_OWN, 99999).writes[0]).toEqual({ slot: 15, offset: HP_OFFSET, width: 4, value: 99999 });
  });
});

describe('the death pattern (FFX2-G05 3.10): monsters only, two bytes, the live one and the one a revive restores', () => {
  const world: StatWorld = { u8: () => 0, u16: () => 0, u32: () => 0 };

  it('writes both bytes on a monster slot', () => {
    expect(setStat(world, 16, StatId.deathPattern, GROUP_OWN, 4).writes).toEqual([
      { slot: 16, offset: 0x2d8, width: 1, value: 4 },
      { slot: 16, offset: 0x2da, width: 1, value: 4 },
    ]);
  });

  it('leaves a party slot alone but still counts it', () => {
    expect(setStat(world, 2, StatId.deathPattern, GROUP_OWN, 4)).toEqual({ count: 1, writes: [], calls: [] });
  });

  it('keeps the low 8 bits', () => {
    expect(setStat(world, 20, StatId.deathPattern, GROUP_OWN, 0x1ff).writes[0]?.value).toBe(0xff);
  });
});
