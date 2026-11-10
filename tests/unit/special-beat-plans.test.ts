/**
 * Test 3 of the FFX-2 Special look (step A; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2): the beat plans as data.
 *
 * The totals are the measured readings of the game's own frames (`research/re-ffx2-special-look-game-reading.md`): the middle from "she is alone" to the cut is 16 s (Yuna), 20 s (Rikku),
 * 17 s (Paine); the preamble before it is one constant per girl. Removal: set `PREAMBLE_MS.yuna` to 3000 (the first amendment's shared preamble) and the total, the HD-reading and
 * the one-row assertions fail.
 */

import { describe, expect, it } from 'vitest';
import {
  EFFECT_IDS,
  FADE_OTHERS_MS,
  MIDDLE_MS,
  ONE_ROW_MS,
  PREAMBLE_MS,
  REDUCE_MOTION_SCALE,
  entryKind,
  exitPlan,
  fallPlan,
  fullPlan,
  reducedPlan,
  scalePlan,
  shortPlan,
  type BeatPlan,
  type EffectId,
  type Girl,
  type PlanStep,
} from '../../src/engine/SpecialBeatPlans.ts';
import { PARTY_SWAP_MS } from '../../src/engine/SummonStaging.ts';
import { SPEED_SCALE } from '../../src/engine/BattlePresenterUtil.ts';

const GIRLS: readonly Girl[] = ['yuna', 'rikku', 'paine'];
const stepOf = (p: BeatPlan, id: string): PlanStep => {
  const s = p.steps.find((x) => x.id === id);
  if (!s) throw new Error(`${p.kind} ${p.girl}: no step ${id}`);
  return s;
};

describe('the full plan: the measured middle and the preamble', () => {
  it('has the middles 16000, 20000 and 17000 ms and the preambles 6000, 3000 and 3000 ms', () => {
    expect(MIDDLE_MS).toEqual({ yuna: 16000, rikku: 20000, paine: 17000 });
    expect(PREAMBLE_MS).toEqual({ yuna: 6000, rikku: 3000, paine: 3000 });
  });

  it('totals 22000 (Yuna), 23000 (Rikku) and 20000 (Paine) ms, inside the HD readings, and the cut is the end', () => {
    expect(GIRLS.map((g) => fullPlan(g).totalMs)).toEqual([22000, 23000, 20000]);
    const yuna = fullPlan('yuna').totalMs;
    expect(yuna).toBeGreaterThanOrEqual(22000);
    expect(yuna).toBeLessThanOrEqual(24000); // Yuna's HD reading 22 to 24 s
    expect(Math.abs(fullPlan('paine').totalMs - 19000)).toBeLessThanOrEqual(1500); // Paine about 19 s
    expect(fullPlan('rikku').totalMs).toBeGreaterThanOrEqual(23000);
    expect(fullPlan('rikku').totalMs).toBeLessThanOrEqual(24000); // Rikku 23 to 24 s
    for (const g of GIRLS) {
      expect(Math.abs(fullPlan(g).totalMs - 16000), `${g} is not within 1 s of 16`).toBeGreaterThan(1000); // not within 1 s of 16 [PRE 534]
      expect(fullPlan(g).totalMs).toBe(PREAMBLE_MS[g] + MIDDLE_MS[g]);
      expect(fullPlan(g).cutMs).toBe(fullPlan(g).totalMs);
    }
  });

  it('shows her row alone at 4000 (Yuna), 3000 (Rikku) and 3000 (Paine) ms', () => {
    expect(ONE_ROW_MS).toEqual({ yuna: 4000, rikku: 3000, paine: 3000 });
    for (const g of GIRLS) {
      const p = fullPlan(g);
      expect(p.oneRowMs).toBe(ONE_ROW_MS[g]);
      const one = stepOf(p, 'one-row');
      expect(one.atMs).toBe(ONE_ROW_MS[g]);
      expect(one.rows).toBe('one');
    }
  });

  it('keeps the three rows through the confirm, swaps to the parts and brings the chip back AT THE CUT, never at a flash', () => {
    for (const g of GIRLS) {
      const p = fullPlan(g);
      expect(stepOf(p, 'confirm')).toMatchObject({ atMs: 0, endMs: 600, rows: 'girls' });
      const cut = stepOf(p, 'cut');
      expect(cut).toMatchObject({ atMs: p.totalMs, rows: 'parts', chip: 'config', camera: 'wide' });
      for (const s of p.steps.filter((x) => x.flash === true)) {
        expect(s.rows, `${g} ${s.id}`).toBeUndefined();
        expect(s.chip, `${g} ${s.id}`).toBeUndefined();
      }
      // the parts appear once, on the cut, and the chip returns once, on the cut
      expect(p.steps.filter((s) => s.rows === 'parts').map((s) => s.id)).toEqual(['cut']);
      expect(p.steps.filter((s) => s.chip === 'config').map((s) => s.id)).toEqual(['cut']);
    }
  });

  it('sets the Wait chip at the start of the field, fades the others at 2000 ms for the summon\'s swap length, and plays the portrait first', () => {
    expect(FADE_OTHERS_MS).toBe(PARTY_SWAP_MS);
    for (const g of GIRLS) {
      const p = fullPlan(g);
      const field = stepOf(p, 'field');
      expect(field).toMatchObject({ atMs: 1300, endMs: ONE_ROW_MS[g], chip: 'wait', camera: 'wide' });
      expect(field.pieces).toEqual(['light-column']);
      expect(stepOf(p, 'fade-others')).toMatchObject({ atMs: 2000, endMs: 2000 + PARTY_SWAP_MS });
      expect(stepOf(p, 'portrait')).toMatchObject({ atMs: 600, endMs: 1300 });
    }
  });

  it("each girl's own steps follow the measured sub-beats", () => {
    const yuna = fullPlan('yuna');
    expect(['alone', 'bud', 'rise', 'burst', 'open', 'bloom', 'reveal'].map((id) => [stepOf(yuna, id).atMs, stepOf(yuna, id).endMs])).toEqual([
      [6000, 8000], [8000, 10000], [10000, 12000], [12000, 14000], [14000, 16000], [16000, 20000], [20000, 22000],
    ]);
    expect(stepOf(yuna, 'alone')).toMatchObject({ camera: 'low-close', flash: true });
    expect(stepOf(yuna, 'alone').pieces).toEqual(['silhouette', 'pink-ring']);
    expect(stepOf(yuna, 'bloom').pieces).toEqual(['Y2', 'Y3', 'petals']);
    const rikku = fullPlan('rikku');
    expect(['alone', 'shards', 'flash-1', 'pool', 'flash-2', 'reveal'].map((id) => [stepOf(rikku, id).atMs, stepOf(rikku, id).endMs])).toEqual([
      [3000, 5000], [5000, 9000], [9000, 10000], [10000, 15000], [15000, 16000], [21000, 23000],
    ]);
    expect(stepOf(rikku, 'alone').pieces).toEqual(['silhouette', 'R1', 'dim']);
    expect(rikku.steps.filter((s) => s.camera === 'rise').map((s) => [s.atMs, s.endMs])).toEqual([[16000, 18500], [18500, 21000]]); // assemble 16000-21000, R2 then R3
    expect(stepOf(rikku, 'reveal').camera).toBe('orbit');
    const paine = fullPlan('paine');
    expect(['alone', 'turn', 'swords', 'rise', 'wing-tips', 'feathers', 'armour-close', 'burst', 'reveal'].map((id) => [stepOf(paine, id).atMs, stepOf(paine, id).endMs])).toEqual([
      [3000, 4000], [4000, 5000], [5000, 7000], [7000, 14000], [14000, 15000], [15000, 17000], [17000, 18000], [18000, 19000], [19000, 20000],
    ]);
    expect(stepOf(paine, 'swords').pieces).toEqual(['P1', 'swords', 'disc-halo']);
    expect(stepOf(paine, 'reveal').camera).toBe('low-form');
  });

  it('lists its steps in time order', () => {
    for (const p of [...GIRLS.map(fullPlan), ...GIRLS.map(shortPlan), exitPlan(), fallPlan(false)]) {
      const at = p.steps.map((s) => s.atMs);
      expect(at, `${p.kind} ${p.girl}`).toEqual([...at].sort((a, b) => a - b));
      for (const s of p.steps) expect(s.endMs, `${p.kind} ${s.id}`).toBeGreaterThanOrEqual(s.atMs);
    }
  });
});

describe('the short plan', () => {
  it('is about 3000 ms, has no chip step (the tag stays as it was), keeps the three girls until its cut, and has no one-row step', () => {
    for (const g of GIRLS) {
      const p = shortPlan(g);
      expect(p.kind).toBe('short');
      expect(p.totalMs).toBe(3000);
      expect(p.oneRowMs).toBeNull();
      expect(p.steps.some((s) => s.chip !== undefined), `${g} has a chip field`).toBe(false);
      expect(p.steps.some((s) => s.rows === 'one')).toBe(false);
      expect(p.steps.filter((s) => s.rows === 'parts').map((s) => s.id)).toEqual(['cut']);
      expect(stepOf(p, 'cut').atMs).toBe(p.cutMs);
      for (const s of p.steps.filter((x) => x.atMs < (p.cutMs as number) && x.rows !== undefined)) expect(s.rows).toBe('girls');
      expect(stepOf(p, 'portrait')).toMatchObject({ atMs: 600, endMs: 1000 });
      expect(stepOf(p, 'motif')).toMatchObject({ atMs: 1600, endMs: 2400, flash: true });
    }
    expect(stepOf(shortPlan('yuna'), 'motif').pieces).toEqual(['Y3']);
    expect(stepOf(shortPlan('rikku'), 'motif').pieces).toEqual(['R3']);
    expect(stepOf(shortPlan('paine'), 'motif').pieces).toEqual(['P3']);
  });
});

describe('the exit and the fall', () => {
  it('the exit is 4500 ms: the chip at Wait at 0, the parts held, the numbers at 500, the others back at 3500, the girls\' rows at 4000, the chip back and control at 4500', () => {
    const p = exitPlan();
    expect(p).toMatchObject({ kind: 'exit', totalMs: 4500, girl: null, oneRowMs: null, cutMs: null });
    expect(stepOf(p, 'hold')).toMatchObject({ atMs: 0, rows: 'parts', chip: 'wait' });
    expect(stepOf(p, 'numbers')).toMatchObject({ atMs: 500, endMs: 500 });
    expect(stepOf(p, 'whiten')).toMatchObject({ atMs: 500, endMs: 1500, flash: true });
    expect(stepOf(p, 'dissolve')).toMatchObject({ atMs: 1500, endMs: 2000 });
    expect(stepOf(p, 'girl-stands').atMs).toBe(2000);
    expect(stepOf(p, 'others-back')).toMatchObject({ atMs: 3500, endMs: 3500 + PARTY_SWAP_MS });
    expect(stepOf(p, 'girls')).toMatchObject({ atMs: 4000, rows: 'girls' });
    expect(stepOf(p, 'control')).toMatchObject({ atMs: 4500, chip: 'config' });
  });

  it('the fall is the same plan with a part standing and with every part down: 2000 lead-in, grey and squash to 4000, dissolve to 6000, the girl lying to 7500', () => {
    expect(fallPlan(true)).toEqual(fallPlan(false));
    const p = fallPlan(true);
    expect(p).toMatchObject({ kind: 'fall', totalMs: 7500, girl: null });
    expect(stepOf(p, 'lead-in')).toMatchObject({ atMs: 0, endMs: 2000 });
    expect(stepOf(p, 'tag-wait')).toMatchObject({ atMs: 2000, chip: 'wait' });
    expect(stepOf(p, 'numbers').atMs).toBe(2000);
    expect(stepOf(p, 'grey-squash')).toMatchObject({ atMs: 2000, endMs: 4000 });
    expect(stepOf(p, 'dissolve')).toMatchObject({ atMs: 4000, endMs: 6000 });
    expect(stepOf(p, 'girl-lies')).toMatchObject({ atMs: 6000, endMs: 7500 });
  });
});

const allPlans = (): BeatPlan[] => [...GIRLS.map(fullPlan), ...GIRLS.map(shortPlan), exitPlan(), fallPlan(true)];
const timesOf = (p: BeatPlan): number[] => [...p.steps.flatMap((s) => [s.atMs, s.endMs]), p.totalMs, ...(p.oneRowMs === null ? [] : [p.oneRowMs]), ...(p.cutMs === null ? [] : [p.cutMs])];

describe('scaling', () => {
  it('fast is 0.32 of normal: every time of every plan is the rounded 0.32', () => {
    expect(SPEED_SCALE.fast).toBe(0.32);
    for (const p of allPlans()) {
      const fast = scalePlan(p, SPEED_SCALE.fast);
      expect(timesOf(fast), `${p.kind} ${p.girl}`).toEqual(timesOf(p).map((t) => Math.round(t * 0.32)));
      expect(fast.steps.map((s) => s.id)).toEqual(p.steps.map((s) => s.id));
    }
  });

  it('skip (0) collapses every plan to zero, and no portrait is played at skip speed', () => {
    expect(SPEED_SCALE.skip).toBe(0);
    for (const p of allPlans()) {
      const skip = scalePlan(p, SPEED_SCALE.skip);
      expect(timesOf(skip).every((t) => t === 0), `${p.kind} ${p.girl}`).toBe(true);
    }
    for (const g of GIRLS) expect(stepOf(scalePlan(fullPlan(g), 0), 'portrait').endMs).toBe(0);
  });

  it('is pure: the plan it was given is left as it was', () => {
    const p = fullPlan('yuna');
    const before = JSON.stringify(p);
    scalePlan(p, 0.32);
    reducedPlan(p);
    expect(JSON.stringify(p)).toBe(before);
    expect(JSON.stringify(fullPlan('yuna'))).toBe(before);
  });

  it('reduce motion keeps a quarter of the time and no camera, no pieces and no flash; the rows and chip steps keep their order', () => {
    expect(REDUCE_MOTION_SCALE).toBe(0.25);
    for (const p of allPlans()) {
      const r = reducedPlan(p);
      expect(r.totalMs).toBe(Math.round(p.totalMs * 0.25));
      for (const s of r.steps) {
        expect(s.camera, `${p.kind} ${s.id}`).toBeUndefined();
        expect(s.pieces, `${p.kind} ${s.id}`).toBeUndefined();
        expect(s.flash, `${p.kind} ${s.id}`).toBeUndefined();
      }
      const order = (x: BeatPlan): string[] => x.steps.filter((s) => s.rows !== undefined || s.chip !== undefined).map((s) => `${s.id}:${s.rows ?? ''}:${s.chip ?? ''}`);
      expect(order(r)).toEqual(order(p));
    }
  });
});

describe('the effect ids', () => {
  it('every piece a plan names is in EFFECT_IDS, and every id of EFFECT_IDS is used by some plan', () => {
    const used = new Set<EffectId>();
    for (const p of allPlans()) for (const s of p.steps) for (const id of s.pieces ?? []) used.add(id);
    for (const id of used) expect(EFFECT_IDS as readonly string[]).toContain(id);
    expect([...EFFECT_IDS].filter((id) => !used.has(id))).toEqual([]);
    expect(new Set(EFFECT_IDS).size).toBe(EFFECT_IDS.length);
    expect(EFFECT_IDS).toHaveLength(21);
  });
});

describe('entryKind', () => {
  const seen = (ids: string[]) => ({ has: (id: string) => ids.includes(id) });

  it('is full with no port and for an id not seen, and short for an id that was', () => {
    expect(entryKind(undefined, 'yuna', 'floral-fallal')).toBe('full');
    expect(entryKind(null, 'yuna', 'floral-fallal')).toBe('full');
    expect(entryKind(seen([]), 'yuna', 'floral-fallal')).toBe('full');
    expect(entryKind(seen(['special-yuna-floral-fallal']), 'yuna', 'floral-fallal')).toBe('short');
    expect(entryKind(seen(['special-yuna-floral-fallal']), 'rikku', 'machina-maw')).toBe('full'); // per girl
  });

  it("'short-always' is short whatever the port says; 'per-save' (the default) is the two cases above", () => {
    expect(entryKind(undefined, 'paine', 'full-throttle', 'short-always')).toBe('short');
    expect(entryKind(seen([]), 'paine', 'full-throttle', 'short-always')).toBe('short');
    expect(entryKind(seen([]), 'paine', 'full-throttle', 'per-save')).toBe('full');
    expect(entryKind(seen(['special-paine-full-throttle']), 'paine', 'full-throttle', 'per-save')).toBe('short');
  });
});
