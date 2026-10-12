/**
 * Parity tests for the FFX equipment auto-status kernel (`src/battle/ffx/kernel/auto-status.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: apply (VA 0x0079b290), restore (0x0079b1a0), the SOS toggle
 * (0x007af260), the per-action sweep (0x007af4b0) and the weak level (0x0078bf00). Spec: FFX-G02 sections 3.3, 3.4 and 4. Every hand-worked number
 * has its arithmetic beside it. The last block replays `tests/fixtures/parity/ffx/auto_status.json`: each vector is a run of the game's own machine
 * code in an x86-32 emulator (nothing replaced but the presentation call the toggle makes, which is counted). With `PYREFLY_AUTO_BIG=<file>` the same
 * replay runs over a larger set of the same layout (the 4,000-per-function set of the RC4 gear lane).
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyAuto,
  freshAutoState,
  reapplyAuto,
  restoreAuto,
  sosSweep,
  sosToggle,
  weakLevel,
  type AutoChr,
} from '../../src/battle/ffx/kernel/auto-status.ts';
import { loadFfxParityFixture, type ParityFixture } from './helpers/ffxParityFixture.ts';

/** Counter indices of the thirteen temporal statuses. */
const C = { Sleep: 0, Silence: 1, Darkness: 2, Shell: 3, Protect: 4, Reflect: 5, NulTide: 6, NulBlaze: 7, NulShock: 8, NulFrost: 9, Regen: 10, Haste: 11, Slow: 12 } as const;
const bit = (n: number): number => 1 << n;

function chr(over: Partial<AutoChr> = {}): AutoChr {
  return {
    perm: 0,
    counters: new Array<number>(13).fill(0),
    extra: 0,
    bkPerm: 0,
    bkCounters: new Array<number>(13).fill(0),
    bkExtra: 0,
    live: [0, 0, 0],
    equip: [0, 0, 0],
    sos: [0, 0, 0],
    sosFlag: 0,
    weak: 0,
    applied: 0,
    regenTicks: 0,
    ...over,
  };
}

const withCounters = (set: Partial<Record<keyof typeof C, number>>): number[] => {
  const out = new Array<number>(13).fill(0);
  for (const [k, v] of Object.entries(set)) out[C[k as keyof typeof C]] = v as number;
  return out;
};

describe('the weak level (0x78bf00)', () => {
  it('is 3 below 1 HP, then 2 under a quarter, 1 from a quarter to under a half, 0 from half up', () => {
    // max 1000: 4 * HP / 1000 truncated: 500 -> 2 (level 0), 499 -> 1 (level 1), 250 -> 1 (level 1), 249 -> 0 (level 2)
    expect([1000, 500, 499, 250, 249, 1, 0, -3].map((hp) => weakLevel(hp, 1000))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    // max 999: 4 * 500 / 999 = 2 (level 0); 4 * 499 / 999 = 1 (level 1)
    expect(weakLevel(500, 999)).toBe(0);
    expect(weakLevel(499, 999)).toBe(1);
  });

  it('1 and 2 mean "under half" for HP >= 1: 2 * HP < max', () => {
    for (const max of [1, 2, 3, 7, 100, 999, 1000, 9999]) {
      for (let hp = 1; hp <= Math.min(max + 2, 400); hp++) {
        expect(weakLevel(hp, max) === 1 || weakLevel(hp, max) === 2, `${hp}/${max}`).toBe(hp * 2 < max);
      }
    }
  });
});

describe('apply (0x79b290)', () => {
  it('puts the equipment counters at 255, saves what they were, and restarts the Regen clock and ends a Slow when a Haste appears', () => {
    // Auto-Regen (counter 10) and Auto-Haste (counter 11): the counter word is 1 << 10 | 1 << 11 = 0xC00.
    const before = chr({ equip: [0, 0xc00, 0], counters: withCounters({ Slow: 5, Shell: 2 }), regenTicks: 77 });
    const after = applyAuto(before);
    expect(after.counters).toEqual(withCounters({ Regen: 255, Haste: 255, Shell: 2, Slow: 0 })); // Slow 5 -> 0: Haste went from 0 to non-zero
    expect(after.regenTicks).toBe(0); // Regen went from 0 to non-zero
    expect(after.live).toEqual([0, 0xc00, 0]);
    expect(after.bkCounters).toEqual(new Array<number>(13).fill(0)); // Regen and Haste were 0
    expect(after.applied).toBe(0);
  });

  it('leaves a Slow of 255 alone, and a Haste or Regen that was already on keeps its Slow and its clock', () => {
    const slow255 = applyAuto(chr({ equip: [0, 1 << C.Haste, 0], counters: withCounters({ Slow: 255 }) }));
    expect(slow255.counters[C.Slow]).toBe(255);
    const hasted = applyAuto(chr({ equip: [0, bit(C.Haste) | bit(C.Regen), 0], counters: withCounters({ Haste: 4, Regen: 3, Slow: 9 }), regenTicks: 40 }));
    expect(hasted.counters).toEqual(withCounters({ Haste: 255, Regen: 255, Slow: 9 }));
    expect(hasted.regenTicks).toBe(40);
    expect(hasted.bkCounters[C.Haste]).toBe(4); // what it overwrote
    expect(hasted.bkCounters[C.Regen]).toBe(3);
  });

  it('adds the SOS words only while the weak level is 1 or 2, and remembers the level', () => {
    const sosShell = { equip: [0, 0, 0] as const, sos: [0, bit(C.Shell), 0] as const, sosFlag: 1 };
    for (const [weak, on] of [[0, false], [1, true], [2, true], [3, false]] as const) {
      const a = applyAuto(chr({ ...sosShell, weak }));
      expect(a.counters[C.Shell], `weak ${weak}`).toBe(on ? 255 : 0);
      expect(a.applied).toBe(weak);
      expect(a.live[1]).toBe(on ? bit(C.Shell) : 0);
    }
  });

  it('does not modify its input', () => {
    const c = chr({ equip: [0, 0xc00, 0], counters: withCounters({ Slow: 5 }) });
    const copy = JSON.stringify(c);
    applyAuto(c);
    expect(JSON.stringify(c)).toBe(copy);
  });
});

describe('restore (0x79b1a0) and restore-then-apply', () => {
  it('puts back the saved counters of the live bits and does not clear the live words', () => {
    // A temporary Shell of 3 turns, then SOS Shell lands on top at weak 1: the Shell is 255 and 3 is saved.
    const start = chr({ sos: [0, bit(C.Shell), 0], sosFlag: 1, weak: 1, counters: withCounters({ Shell: 3 }) });
    const on = applyAuto(start);
    expect(on.counters[C.Shell]).toBe(255);
    expect(on.bkCounters[C.Shell]).toBe(3);
    const off = restoreAuto(on);
    expect(off.counters[C.Shell]).toBe(3);
    expect(off.live).toEqual(on.live);
  });

  it('a restore followed by an apply at the SAME level is not a no-op: it restarts the Regen clock and ends a Slow of an Auto-Haste wearer (scenarios J1 and J2)', () => {
    const applied = applyAuto(chr({ equip: [0, bit(C.Regen) | bit(C.Haste), 0] }));
    const later = { ...applied, regenTicks: 77, counters: applied.counters.map((n, i) => (i === C.Slow ? 5 : n)) };
    const again = reapplyAuto(later);
    expect(again.regenTicks).toBe(0); // restore put Regen back to 0, the apply saw it go 0 -> 255
    expect(again.counters[C.Slow]).toBe(0); // and Haste 0 -> 255 cleared the Slow
    expect(again.counters[C.Regen]).toBe(255);
    expect(again.counters[C.Haste]).toBe(255);
    // Everything else the pair touches is as it was: the live words and the backups.
    expect(again.live).toEqual(applied.live);
    expect(again.bkCounters).toEqual(applied.bkCounters);
  });

  it('a Regen or Haste that was running before the equipment is not touched by the pair (its saved counter is not 0)', () => {
    const applied = applyAuto(chr({ equip: [0, bit(C.Regen) | bit(C.Haste), 0], counters: withCounters({ Regen: 6, Haste: 6, Slow: 0 }), regenTicks: 40 }));
    const later = { ...applied, regenTicks: 77, counters: applied.counters.map((n, i) => (i === C.Slow ? 5 : n)) };
    const again = reapplyAuto(later);
    expect(again.regenTicks).toBe(77);
    expect(again.counters[C.Slow]).toBe(5);
  });
});

describe('the toggle (0x7af260) and the sweep (0x7af4b0)', () => {
  const rikku = (weak: number, applied: number, flag = 1): AutoChr => chr({ sos: [0, bit(C.Shell), 0], sosFlag: flag, weak, applied });

  it('acts only for a character with the SOS flag whose weak level is not the level it was applied for', () => {
    expect(sosToggle(rikku(1, 0)).toggled).toBe(true);
    expect(sosToggle(rikku(0, 0)).toggled).toBe(false); // same level
    expect(sosToggle(rikku(1, 0, 0)).toggled).toBe(false); // no SOS flag
    expect(sosToggle(rikku(2, 1)).toggled).toBe(true); // 1 -> 2 toggles too: the pair runs again
  });

  it('switches the SOS Shell on when the level reaches 1 and off when it is back to 0', () => {
    const low = sosToggle(rikku(1, 0)).chr;
    expect(low.counters[C.Shell]).toBe(255);
    expect(low.applied).toBe(1);
    const healed = sosToggle({ ...low, weak: 0 }).chr;
    expect(healed.counters[C.Shell]).toBe(0);
    expect(healed.applied).toBe(0);
  });

  it('the sweep toggles each character on its own and counts them', () => {
    const r = sosSweep([rikku(1, 0), rikku(0, 0), rikku(2, 3), rikku(1, 0, 0)]);
    expect(r.toggled).toBe(2);
    expect(r.chrs.map((c) => c.counters[C.Shell])).toEqual([255, 0, 255, 0]);
  });

  it('a character that is down (level 3) loses the SOS set at the next sweep', () => {
    const down = sosSweep([{ ...sosToggle(rikku(1, 0)).chr, weak: 3 }]).chrs[0] as AutoChr;
    expect(down.counters[C.Shell]).toBe(0);
    expect(down.applied).toBe(3);
  });

  it('a fresh state has nothing live and nothing saved', () => {
    const s = freshAutoState([0, 1, 0], [0, 2, 0], 1);
    expect(s.live).toEqual([0, 0, 0]);
    expect(s.bkCounters).toEqual(new Array<number>(13).fill(0));
    expect(s.applied).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the game's own machine code
// ---------------------------------------------------------------------------------------------

type Vec = { id: number; class: string; in: Record<string, unknown>; out: unknown; ret?: number; refreshed?: number };

function replay(v: Vec): void {
  const why = `vector ${v.id} (${v.class})`;
  const input = v.in as unknown as AutoChr;
  switch (v.class) {
    case 'apply':
      expect(applyAuto(input), why).toEqual(v.out);
      break;
    case 'restore':
      expect(restoreAuto(input), why).toEqual(v.out);
      break;
    case 'toggle': {
      const r = sosToggle(input);
      expect(r.chr, why).toEqual(v.out);
      expect(r.toggled ? 1 : 0, `${why} return`).toBe(v.ret);
      expect(r.toggled ? 1 : 0, `${why} status-marker refresh`).toBe(v.refreshed);
      break;
    }
    case 'sweep': {
      const slots = Object.keys((v.in as { chrs: Record<string, AutoChr> }).chrs);
      const chrs = (v.in as { chrs: Record<string, AutoChr> }).chrs;
      const r = sosSweep(slots.map((s) => chrs[s] as AutoChr));
      slots.forEach((s, k) => expect(r.chrs[k], `${why} slot ${s}`).toEqual((v.out as { chrs: Record<string, AutoChr> }).chrs[s]));
      expect(r.toggled, `${why} return`).toBe(v.ret);
      expect(r.toggled, `${why} refreshes`).toBe(v.refreshed);
      break;
    }
    case 'weak': {
      const i = v.in as { hp: number; max: number };
      expect(weakLevel(i.hp, i.max), why).toBe(v.out);
      break;
    }
    default:
      throw new Error(`unknown vector class ${v.class}`);
  }
}

function replayAll(fx: ParityFixture): Record<string, number> {
  const seen: Record<string, number> = {};
  for (const v of fx.vectors as unknown as Vec[]) {
    replay(v);
    seen[v.class] = (seen[v.class] ?? 0) + 1;
  }
  return seen;
}

const fx = loadFfxParityFixture('auto_status');
describe.skipIf(fx === null)('golden vectors: apply, restore, toggle, sweep and the weak level (tests/fixtures/parity/ffx/auto_status.json)', () => {
  it('every vector matches: every status word, counter, backup, live word, level and Regen clock afterwards', () => {
    const seen = replayAll(fx as ParityFixture);
    for (const cls of ['apply', 'restore', 'toggle', 'sweep', 'weak']) expect(seen[cls] ?? 0, cls).toBeGreaterThan(10);
  });
});

const bigPath = process.env['PYREFLY_AUTO_BIG'];
describe.skipIf(bigPath === undefined || !existsSync(bigPath))('the larger proof set (PYREFLY_AUTO_BIG)', () => {
  it('every vector matches', () => {
    const seen = replayAll(JSON.parse(readFileSync(bigPath as string, 'utf8')) as ParityFixture);
    expect(seen['apply']).toBeGreaterThan(3000);
    expect(seen['restore']).toBeGreaterThan(3000);
    expect(seen['toggle']).toBeGreaterThan(3000);
    expect(seen['sweep']).toBeGreaterThan(100);
    expect(seen['weak']).toBeGreaterThan(1000);
  });
});
