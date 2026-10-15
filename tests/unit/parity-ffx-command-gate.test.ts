/**
 * Parity tests for the FFX command gate and range kernels (`src/battle/ffx/kernel/command-gate.ts` and `command-range.ts`; re-parity RC7
 * lane L-CMD, **FFX only**).
 *
 * Source: FFX.exe, Steam build 25501027: the MP cost (VA 0x0078cf70), the usability gate (0x0078c690), the cost check at the start of a
 * sub-action (0x0078ab20) and the range and dead-target filter (0x00791fa0); spec `research/re-ffx-command-gate.md`. The hand-worked
 * cases state each rule in the file's own terms (they are the note's named cases, Appendix A); the last blocks replay
 * `command_gate.json` and `command_range.json`, runs of the game's own machine code against an independent model (29,569, 47,833,
 * 40,001 and 30,000 vectors, 0 mismatches; these files hold a stratified subset of each).
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  AutoA,
  BUFF_NO_MP_COST,
  EXTRA_CURSE,
  type GateChr,
  type GateRecord,
  SILENCE_GATED,
  costCheck,
  mpCost,
  usableCost,
} from '../../src/battle/ffx/kernel/command-gate.ts';
import { rangeFilter, startsAfter } from '../../src/battle/ffx/kernel/command-range.ts';

const NONE = { autoA: 0, zeroCost: 0, buffs: 0 };
const HALF = AutoA.HalfMp;
const ONE = AutoA.OneMp;
const BOOST = AutoA.MagicBooster;
const cost = (mp: number, type: number, autoA: number): number => mpCost({ mp, type }, { ...NONE, autoA });

describe('the MP cost (0x78cf70)', () => {
  it('Half MP rounds up; the Booster doubles Black and White Magic and takes the round-up away', () => {
    // Fire (4 MP, Black Magic): 4, Half 2, One 1, Booster 8, Booster+Half 4, Booster+One 2, Half+One 1, Half+One+Booster 2.
    expect([0, HALF, ONE, BOOST, BOOST | HALF, BOOST | ONE, HALF | ONE, HALF | ONE | BOOST].map((a) => cost(4, 1, a))).toEqual([4, 2, 1, 8, 4, 2, 1, 2]);
    // Esuna (5, White Magic): Half 3 (not 2), Booster 10, Booster+Half 5. Scan (1): Half 1 (not 0), Booster 2, Booster+Half 1.
    expect([cost(5, 2, HALF), cost(5, 2, BOOST), cost(5, 2, BOOST | HALF)]).toEqual([3, 10, 5]);
    expect([cost(1, 2, HALF), cost(1, 2, BOOST), cost(1, 2, BOOST | HALF)]).toEqual([1, 2, 1]);
    expect([cost(85, 2, HALF), cost(97, 2, HALF), cost(90, 1, BOOST)]).toEqual([43, 49, 180]); // Holy, Auto-Life, Ultima
  });

  it('One MP with the Booster costs 2 on a spell; the Booster does nothing to a Skill', () => {
    expect(cost(4, 1, ONE | BOOST)).toBe(2);
    expect(cost(10, 3, BOOST)).toBe(10); // Mug is a Skill (category 3)
    expect(cost(10, 3, HALF)).toBe(5);
    expect(cost(10, 3, ONE)).toBe(1);
  });

  it('a 0-MP spell stays 0 under every modifier; the zero-cost flag and Spellspring make any cost 0', () => {
    for (const a of [0, HALF, ONE, BOOST, HALF | ONE | BOOST]) expect(cost(0, 1, a)).toBe(0);
    expect(mpCost({ mp: 4, type: 1 }, { autoA: BOOST, zeroCost: 1, buffs: 0 })).toBe(0);
    expect(mpCost({ mp: 5, type: 2 }, { autoA: HALF, zeroCost: 0, buffs: BUFF_NO_MP_COST })).toBe(0);
  });
});

const REC = (over: Partial<GateRecord> = {}): GateRecord => ({ mp: 0, type: 0, flagsMisc: 0, odCost: 0, ...over });
const CHR = (over: Partial<GateChr> = {}): GateChr => ({ gauge: 100, gaugeMax: 100, extra: 0, silence: 0, mp: 50, autoA: 0, zeroCost: 0, buffs: 0, ...over });
const PLAY = { monster: false };
const FIRE = REC({ mp: 4, type: 1, flagsMisc: SILENCE_GATED });
const FURY = REC({ odCost: 100, type: 4 });

describe('the usability gate (0x78c690)', () => {
  it('Silence refuses a record that carries the flag and nothing else (Summon, Doublecast and Fury do not)', () => {
    expect(usableCost(FIRE, CHR(), PLAY)).toBe(4);
    expect(usableCost(FIRE, CHR({ silence: 1 }), PLAY)).toBe(-1);
    expect(usableCost(REC({ flagsMisc: 0x4000002 }), CHR({ silence: 3 }), PLAY)).toBe(0); // Summon's flag word
    expect(usableCost(FURY, CHR({ silence: 1 }), PLAY)).toBe(0);
    expect(usableCost(REC({ mp: 0, type: 1 }), CHR({ silence: 1 }), PLAY)).toBe(0); // Doublecast: category 1 without the bit
  });

  it('an Overdrive needs the gauge at least its maximum and no Curse; the free switch waives it', () => {
    expect(usableCost(FURY, CHR(), PLAY)).toBe(0);
    expect(usableCost(FURY, CHR({ gauge: 99 }), PLAY)).toBe(-1);
    expect(usableCost(FURY, CHR({ extra: EXTRA_CURSE }), PLAY)).toBe(-1);
    expect(usableCost(FURY, CHR({ extra: 0xfbff }), PLAY)).toBe(0);
    expect(usableCost(FURY, CHR({ gauge: 99 }), { ...PLAY, freeOd: true })).toBe(0);
    expect(usableCost(FURY, CHR({ gauge: 20, gaugeMax: 20 }), PLAY)).toBe(0); // an aeon's bar is 20 wide
    expect(usableCost(FURY, CHR({ gauge: 0, gaugeMax: 0 }), PLAY)).toBe(0); // no maximum: passes here, costCheck is what refuses
  });

  it('the MP gate: cost plus pending MP at most the MP; a monster pays nothing; a negative MP refuses even a free command', () => {
    expect(usableCost(FIRE, CHR({ mp: 3 }), PLAY)).toBe(-1);
    expect(usableCost(FIRE, CHR({ mp: 4 }), PLAY)).toBe(4);
    expect(usableCost(FIRE, CHR({ mp: 4 }), PLAY, 1)).toBe(-1);
    expect(usableCost(FIRE, CHR({ mp: 0 }), { monster: true })).toBe(0);
    expect(usableCost(FIRE, CHR({ mp: 0, silence: 1 }), { monster: true })).toBe(-1); // a Silenced monster is refused a flagged record
    expect(usableCost(FIRE, CHR({ mp: 0 }), { monster: false, freeMp: true }, 99)).toBe(0);
    expect(usableCost(FIRE, CHR({ mp: -1, buffs: BUFF_NO_MP_COST }), PLAY)).toBe(-1);
    expect(usableCost(FIRE, CHR({ mp: 2, autoA: HALF }), PLAY)).toBe(2);
    expect(usableCost(null, CHR(), PLAY)).toBe(-1);
  });
});

describe('the cost check at the start of a sub-action (0x78ab20)', () => {
  it('accepts a payable spell and records its cost; a refusal records nothing', () => {
    expect(costCheck(FIRE, CHR({ mp: 50 }), PLAY)).toEqual({ accepted: true, mp: 4, od: 0, odMarker: 0 });
    expect(costCheck(FIRE, CHR({ mp: 3 }), PLAY)).toEqual({ accepted: false, mp: 0, od: 0, odMarker: 0 });
    expect(costCheck(FIRE, CHR({ mp: 50, silence: 1 }), PLAY).accepted).toBe(false);
  });

  it('an Overdrive needs the gauge to hold its cost: 100, or 20 for an aeon; gauge 0 of maximum 0 is refused here', () => {
    expect(costCheck(FURY, CHR(), PLAY)).toEqual({ accepted: true, mp: 0, od: 100, odMarker: 1 });
    expect(costCheck(FURY, CHR({ gauge: 99 }), PLAY).accepted).toBe(false);
    expect(costCheck(FURY, CHR({ gauge: 99 }), { ...PLAY, freeOd: true })).toEqual({ accepted: true, mp: 0, od: 0, odMarker: 1 });
    expect(costCheck({ ...FURY, odCost: 20 }, CHR({ gauge: 20, gaugeMax: 20 }), PLAY).accepted).toBe(true);
    expect(costCheck(FURY, CHR({ gauge: 0, gaugeMax: 0 }), PLAY).accepted).toBe(false);
  });

  it('a Doublecast cast is checked against the MP it sees: 8 MP for Fira is accepted and recorded as 8 (not added to the first cast)', () => {
    expect(costCheck(REC({ mp: 8, type: 1, flagsMisc: SILENCE_GATED }), CHR({ mp: 50 }), PLAY).mp).toBe(8);
  });
});

describe('the range and dead-target filter (0x791fa0)', () => {
  const t = (far: number, dead = false, isUser = false) => ({ isUser, far, dead });

  it('drops what is out of reach and counts it, drops the dead unless the command may target them, and never replaces a dropped target', () => {
    // Attack (reach 0): a target one step away is out of reach, the user itself never is.
    expect(rangeFilter(0, false, [t(0), t(1), t(2, false, true)])).toEqual({ kept: [true, false, true], outOfReach: 1 });
    // A dead target is dropped; it is counted as out of reach first when it is also too far.
    expect(rangeFilter(3, false, [t(0, true), t(1, true), t(0)])).toEqual({ kept: [false, false, true], outOfReach: 0 });
    expect(rangeFilter(0, false, [t(1, true)])).toEqual({ kept: [false], outOfReach: 1 });
    // A command that may target the dead keeps the dead ones that are within reach.
    expect(rangeFilter(2, true, [t(1, true), t(3, true)])).toEqual({ kept: [true, false], outOfReach: 1 });
    // A negative distance byte is within any reach.
    expect(rangeFilter(0, false, [t(-1)])).toEqual({ kept: [true], outOfReach: 0 });
  });

  it('the sub-action starts when the mask was empty or somebody survived; a strict command needs a survivor', () => {
    expect(startsAfter(2, 0, false)).toBe(false);
    expect(startsAfter(2, 1, false)).toBe(true);
    expect(startsAfter(0, 0, false)).toBe(true);
    expect(startsAfter(0, 0, true)).toBe(false);
    expect(startsAfter(2, 1, true)).toBe(true);
  });
});

// ---- the game's own vectors ------------------------------------------------------------------------------------------------------------

interface Vec {
  id: number;
  class: string;
  in: Record<string, any>;
  out: Record<string, any>;
}
const load = (name: string): { vectors: Vec[] } => JSON.parse(readFileSync(new URL(`../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8')) as { vectors: Vec[] };
const gate = load('command_gate');
const range = load('command_range');
const only = (f: { vectors: Vec[] }, cls: string): Vec[] => f.vectors.filter((v) => v.class === cls);

describe('the game\'s own vectors', () => {
  it('mp_cost: the MP cost of 1,000 emulator runs', () => {
    const vs = only(gate, 'mp_cost');
    expect(vs.length).toBe(1000);
    for (const v of vs) expect(mpCost(v.in['rec'], v.in['chr']), `vector ${v.id}`).toBe(v.out['cost']);
  });

  it('usable: the usability gate on 1,000 crafted records', () => {
    const vs = only(gate, 'usable');
    expect(vs.length).toBe(1000);
    for (const v of vs) {
      const got = usableCost(v.in['rec'], v.in['chr'], { monster: v.in['monster'], freeMp: v.in['freeMp'], freeOd: v.in['freeOd'] }, v.in['pendingMp']);
      expect(got, `vector ${v.id}`).toBe(v.out['cost']);
    }
    // The set is not all one answer.
    const outs = new Set(vs.map((v) => (v.out['cost'] === -1 ? 'refused' : v.out['cost'] === 0 ? 'free' : 'paid')));
    expect([...outs].sort()).toEqual(['free', 'paid', 'refused']);
  });

  it('cost_check: the check at the start of 1,000 sub-actions on the real records', () => {
    const vs = only(gate, 'cost_check');
    expect(vs.length).toBe(1000);
    let accepted = 0;
    for (const v of vs) {
      const got = costCheck(v.in['rec'], v.in['chr'], { monster: v.in['monster'], freeOd: v.in['freeOd'] });
      expect(got.accepted, `vector ${v.id}`).toBe(v.out['accepted']);
      expect(got.odMarker, `vector ${v.id} marker`).toBe(v.out['odMarker']);
      if (got.accepted) {
        accepted += 1;
        expect(got.mp, `vector ${v.id} mp`).toBe(v.out['mp']);
        expect(got.od, `vector ${v.id} od`).toBe(v.out['od']);
      }
    }
    expect(accepted).toBeGreaterThan(100);
    expect(accepted).toBeLessThan(vs.length - 100);
  });

  it('range: the filter on 1,500 runs, with its kept mask, its out-of-reach count and the start decision', () => {
    const vs = only(range, 'range');
    expect(vs.length).toBe(1500);
    let dropped = 0;
    for (const v of vs) {
      const targets = (v.in['named'] as Array<{ slot: number; far: number; dead: number }>).map((n) => ({ isUser: n.slot === v.in['user'], far: n.far, dead: n.dead !== 0 }));
      const r = rangeFilter(v.in['reach'], v.in['allowsDead'], targets);
      const mask = (v.in['named'] as Array<{ slot: number }>).reduce((m, n, i) => (r.kept[i] ? (m | (1 << n.slot)) >>> 0 : m), 0);
      expect(mask, `vector ${v.id} kept`).toBe(v.out['kept']);
      expect(r.outOfReach, `vector ${v.id} far`).toBe(v.out['outOfReach']);
      const keptCount = r.kept.filter(Boolean).length;
      // The game starts when it returns non-zero and (the mask was empty or somebody survived).
      const gameStarts = v.out['ret'] !== 0 && (targets.length === 0 || v.out['kept'] !== 0);
      expect(startsAfter(targets.length, keptCount, v.in['strict']), `vector ${v.id} start`).toBe(gameStarts);
      if (targets.length > 0 && keptCount < targets.length) dropped += 1;
    }
    expect(dropped).toBeGreaterThan(300);
  });
});
