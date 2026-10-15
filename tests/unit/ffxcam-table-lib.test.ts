/**
 * **The shot table's builder** (`tools/ffxcam-table-lib.mjs`, `tools/ffxcam-table-routes.mjs`, and the target arithmetic of `tools/ffxcam-record-lib.mjs`; FFX only), on made-up paths: no local data. What this file pins:
 *
 * 1. **The fit is within the brief's tolerance and short**: a straight move is two keys, a hold then a jump is two, a trapezoid after a hold is the trapezoid and nothing else, a cosine blend is one segment, a
 *    curve that no family carries is split until it fits; the tolerance (0.5 units for the eye and the look-at, 0.3 degrees for the roll, the field of view and the view direction) holds at every step,
 *    and a close-up is held to the angle, not just the distance.
 * 2. **A fit plays back as a fit**: evaluated through `shotTrack`'s own `progress`, the keys land on the samples.
 * 3. **Routes**: branches merge and order, the cell for a slot prefers its own occupant, a dimension a route does not depend on collapses to `*` (and one it does depend on does not), identical routes share an id,
 *    a route that leaves the camera alone is dropped.
 * 4. **The recorder's targets**: the target codes an ability can have by its targeting, the ids they name, and a line-up with no one standing twice.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { CAPS, lineupFor, targetKinds, targetsOf } from '../../tools/ffxcam-record-lib.mjs';
import { TOLERANCE, errorOf, evalKeys, fitKeys, quantise, worstError, type Sample } from '../../tools/ffxcam-table-lib.mjs';
import { buildRows, cellsOf, collapse, isNoop, lookupOrder, mergeBranches, resolve } from '../../tools/ffxcam-table-routes.mjs';
import { cellOf } from '../../src/engine/ffxcam/tableRoutes.ts';
import { progress } from '../../src/engine/ffxcam/shotTrack.ts';

/** A sample: eye (x, -50, 100), look-at (0, -40, 0), no roll, the default lens. */
const at = (x: number, extra: Partial<Record<'ey' | 'rx' | 'roll' | 'lens', number>> = {}): Sample => [x, extra.ey ?? -50, 100, extra.rx ?? 0, -40, 0, extra.roll ?? 0, extra.lens ?? 1024];
const path = (n: number, f: (t: number) => Sample): Sample[] => Array.from({ length: n + 1 }, (_, t) => quantise(f(t)));

describe('fitKeys', () => {
  it('a straight move is two keys, and a hold then a straight move is three at most', () => {
    const line = path(60, (t) => at(t * 2));
    const keys = fitKeys(line);
    expect(keys.map((k) => k[0])).toEqual([0, 60]);
    expect(keys[1]![5]).toBe(1);
    const hold = path(100, (t) => at(t < 40 ? 0 : (t - 40) * 3));
    expect(fitKeys(hold).length).toBeLessThanOrEqual(3);
    expect(worstError(fitKeys(hold), hold).eye).toBeLessThanOrEqual(TOLERANCE.pos);
  });

  it('a hold and the jump after it are one segment: a cut', () => {
    const jump = path(50, (t) => at(t < 30 ? 0 : 80));
    const keys = fitKeys(jump);
    expect(keys.map((k) => [k[0], k[5]])).toEqual([[0, 0], [30, 0]]);
    expect(worstError(keys, jump).eye).toBe(0);
  });

  it('a cosine blend is one segment of that shape', () => {
    const cos = path(40, (t) => at(100 * ((1 - Math.cos((Math.PI * t) / 40)) / 2)));
    const keys = fitKeys(cos);
    expect(keys.length).toBe(2);
    expect(keys[1]![5]).toBe(2);
  });

  it('a trapezoid after a hold is the trapezoid, found at the right step however slowly it leaves its start', () => {
    const shape = [3, 20, 10, 20, 0] as const;
    const n = 50;
    const curve = path(80, (t) => at(t <= 15 ? 0 : 200 * progress(shape, Math.min(n, t - 15), n)));
    const keys = fitKeys(curve, ['20,10,20,0']);
    expect(keys.map((k) => k[0])).toEqual([0, 15, 65]);
    expect(keys[2]![5]).toEqual([3, 20, 10, 20, 0]);
    expect(worstError(keys, curve).eye).toBeLessThanOrEqual(TOLERANCE.pos);
  });

  it('a curve no family carries is split until every step is within the tolerance', () => {
    const wave = path(120, (t) => at(60 * Math.sin((2 * Math.PI * t) / 120)));
    const keys = fitKeys(wave);
    expect(keys.length).toBeGreaterThan(4);
    const w = worstError(keys, wave);
    expect(w.eye).toBeLessThanOrEqual(TOLERANCE.pos + 1e-9);
    expect(w.ref).toBeLessThanOrEqual(TOLERANCE.pos + 1e-9);
    expect(w.dir).toBeLessThanOrEqual(TOLERANCE.deg + 1e-9);
  });

  it('holds the roll and the lens to their own tolerances (0.3 degrees of roll, 0.3 degrees of field of view)', () => {
    const roll = path(30, (t) => at(0, { roll: t * 0.5 })); // 15 degrees over the move
    const keys = fitKeys(roll);
    expect(worstError(keys, roll).roll).toBeLessThanOrEqual(TOLERANCE.deg + 1e-9);
    const zoom = path(30, (t) => at(0, { lens: 1900 - t * 45 }));
    const kz = fitKeys(zoom);
    expect(worstError(kz, zoom).fov).toBeLessThanOrEqual(TOLERANCE.deg + 1e-9);
  });

  it('holds a close-up to the angle: half a unit is nothing at 300 units and a lot at 20', () => {
    // the eye 20 units from the look-at: a sideways error of 0.4 is over one degree of view direction
    const close = path(60, (t) => [10 * Math.sin(t / 10), -50, 100, 0, -50, 80, 0, 1024]);
    const keys = fitKeys(close);
    const w = worstError(keys, close);
    expect(w.dir).toBeLessThanOrEqual(TOLERANCE.deg + 1e-9);
    const far = path(60, (t) => [10 * Math.sin(t / 10), -50, 100, 0, -50, -300, 0, 1024]);
    expect(fitKeys(far).length).toBeLessThan(keys.length); // the same eye move, a distant look-at: fewer keys
  });

  it('a path that ends in a hold ends where the camera stops; a still path is one key', () => {
    const moved = path(70, (t) => at(Math.min(t, 40)));
    const keys = fitKeys(moved);
    expect(keys[keys.length - 1]![0]).toBe(40);
    expect(fitKeys(path(30, () => at(5))).length).toBe(1);
  });

  it('the keys land on the samples through the playback arithmetic (a one-step segment always fits)', () => {
    const odd = path(25, (t) => at((t * t) % 37));
    const keys = fitKeys(odd);
    for (let t = 0; t < odd.length; t++) {
      const e = errorOf(evalKeys(keys, t), odd[t]!);
      expect(e.eye, `step ${t}`).toBeLessThanOrEqual(TOLERANCE.pos + 1e-9);
    }
  });
});

describe('quantise', () => {
  it('rounds positions and the roll to 0.01 and the lens to 0.1', () => {
    expect(quantise([1.234, -5.678, 9.999, 0.004, 0.005, 0.006, 3.14159, 1023.96])).toEqual([1.23, -5.68, 10, 0, 0.01, 0.01, 3.14, 1024]);
  });
});

describe('routes', () => {
  it('merges branches that name one shot and orders them by shot id', () => {
    expect(mergeBranches([['b', 2], ['a', 1], ['b', 3]])).toEqual([['a', 1], ['b', 5]]);
  });

  it('keeps one record per cell, preferring the slot\'s own occupant', () => {
    const cells = cellsOf([
      { actor: 'lulu', slot: 0, tgt: 'e', range: 'n', branches: [['a1', 96]] },
      { actor: 'tidus', slot: 0, tgt: 'e', range: 'n', branches: [['a2', 96]] },
      { actor: 'wakka', slot: 0, tgt: 'e', range: 'f', branches: [['a3', 96]] },
    ]);
    expect(cells.get('n0e')).toEqual([['a2', 96]]); // Tidus stands in slot 0
    expect(cells.get('f0e')).toEqual([['a3', 96]]); // the only record
  });

  it('collapses what a route does not depend on and keeps what it does', () => {
    const same = new Map<string, [string, number][]>();
    for (const r of ['n', 'f']) for (const s of ['0', '1', '2']) same.set(`${r}${s}e`, [['x', 96]]);
    expect(collapse(same)).toEqual({ '***': [['x', 96]] });
    const bySlot = new Map<string, [string, number][]>();
    for (const r of ['n', 'f']) for (const s of ['0', '1', '2']) bySlot.set(`${r}${s}e`, [[`s${s}`, 96]]);
    expect(collapse(bySlot)).toEqual({ '*0*': [['s0', 96]], '*1*': [['s1', 96]], '*2*': [['s2', 96]] });
    const byRange = new Map<string, [string, number][]>([['ne', [['a', 1]]], ['fe', [['b', 1]]]].map(([k, b]) => [`${(k as string)[0]}0${(k as string)[1]}`, b as [string, number][]]));
    expect(collapse(byRange)).toEqual({ 'f**': [['b', 1]], 'n**': [['a', 1]] });
  });

  it('never lets a collapsed cell shadow another: near cells that differ by slot beside far cells that are all the same stay apart, and every recorded cell finds its own branches', () => {
    const cells = new Map<string, [string, number][]>();
    for (const s of ['0', '1', '2']) {
      cells.set(`n${s}e`, [[`near${s}`, 96]]); // the near shots differ by slot
      cells.set(`f${s}e`, [['', 96]]); // the far ones are all "leave the camera"
    }
    const route = collapse(cells);
    expect(route['***']).toBeUndefined(); // collapsing the far cells over everything would sit behind '*0*' and lose to it
    for (const [k, b] of cells) expect(resolve(route, k[0]!, k[1]!, k.slice(2)), k).toEqual(b);
    expect(resolve(route, 'f', '1', 'e')).toEqual([['', 96]]);
    expect(resolve(route, 'n', '2', 'e')).toEqual([['near2', 96]]);
    expect(Object.keys(route).length).toBeLessThan(cells.size); // and it still collapsed what it could
  });

  it('every recorded cell finds its own branches in what a build makes of a route, and the director\'s lookup is the tool\'s (the same order)', () => {
    const records = ['n', 'f'].flatMap((range) => ['0', '1', '2'].flatMap((slot) => ['e', 's'].map((tgt) => ({ phase: 'launch' as const, row: 'x', actor: 'tidus', slot: Number(slot), tgt, range, branches: [[range === 'f' ? '' : `a${slot}${tgt}`, 96]] as [string, number][] }))));
    const { rows, routes } = buildRows(records);
    const cells = routes[rows['x']!.launch!]!;
    for (const r of records) expect(resolve(cells, r.range, String(r.slot), r.tgt), `${r.range}${r.slot}${r.tgt}`).toEqual(r.branches);
    // the director's own cell lookup agrees with the tool's, on every context, for a route with entries at every level
    const route = Object.fromEntries(lookupOrder('n', '1', 'a2').map((k, i) => [k, [[`c${i}`, 1]] as [string, number][]]));
    for (const range of ['n', 'f'] as const) for (const slot of ['0', '1', '2', 'm']) for (const tgt of ['e', 's', 'p', 'x', 'a0', 'a1', 'a2']) {
      expect(cellOf(route, range, slot, tgt), `${range}${slot}${tgt}`).toEqual(resolve(route, range, slot, tgt));
    }
  });

  it('shares a route between abilities whose cells are the same, drops one that does nothing, and names rows with a shot', () => {
    const rec = (row: string, phase: 'open' | 'launch', shot: string) => ({ phase, row, actor: 'tidus', slot: 0, tgt: 'e', range: 'n', branches: [[shot, 96]] as [string, number][] });
    const { rows, routes } = buildRows([rec('fire', 'open', 'a1'), rec('fira', 'open', 'a1'), rec('slow', 'open', 'a2'), rec('guard', 'open', ''), rec('fire', 'launch', 'a9')]);
    expect(Object.keys(rows).sort()).toEqual(['fira', 'fire', 'slow']); // Guard leaves the camera alone
    expect(rows['fire']!.open).toBe(rows['fira']!.open);
    expect(rows['slow']!.open).not.toBe(rows['fire']!.open);
    expect(rows['fire']!.launch).toBeDefined();
    expect(rows['fira']!.launch).toBeUndefined();
    expect(Object.keys(routes).length).toBe(3);
    expect(isNoop({ '***': [['', 1]] })).toBe(true);
    expect(isNoop({ '***': [['a', 1]] })).toBe(false);
  });
});

describe('the recorder\'s targets', () => {
  it('names the kinds of target by an ability\'s targeting, for a party member in a slot and for a monster', () => {
    expect(targetKinds('party', 'single-enemy', 1)).toEqual(['e']);
    expect(targetKinds('party', 'all-enemies', 0)).toEqual(['e']);
    expect(targetKinds('party', 'self', 2)).toEqual(['s']);
    expect(targetKinds('party', 'single-ally', 1)).toEqual(['s', 'a0', 'a2']);
    expect(targetKinds('party', 'all-allies', 0)).toEqual(['p']);
    expect(targetKinds('party', 'single-any', 0)).toEqual(['e', 's', 'a1', 'a2']);
    expect(targetKinds('monster', 'single-enemy', 'm')).toEqual(['a0', 'a1', 'a2']);
    expect(targetKinds('monster', 'all-enemies', 'm')).toEqual(['p']);
    expect(targetKinds('monster', 'self', 'm')).toEqual(['s']);
    expect(targetKinds('monster', 'single-ally', 'm')).toEqual(['e']);
  });

  it('turns a code into the ids it names, and a line-up never has one character twice', () => {
    const lineup = ['tidus', 'wakka', 'rikku'];
    expect(targetsOf('e', 'tidus', lineup)).toEqual(['evrae']);
    expect(targetsOf('s', 'wakka', lineup)).toEqual(['wakka']);
    expect(targetsOf('a2', 'tidus', lineup)).toEqual(['rikku']);
    expect(targetsOf('p', 'tidus', lineup)).toEqual(lineup);
    expect(targetsOf('x', 'tidus', lineup)).toEqual([...lineup, 'evrae']);
    expect(lineupFor('lulu', 1)).toEqual(['tidus', 'lulu', 'rikku']);
    expect(lineupFor('tidus', 2)).toEqual(['rikku', 'wakka', 'tidus']); // a displaced active takes the actor's place
    expect(lineupFor('evrae', 'm')).toEqual(['tidus', 'wakka', 'rikku']);
    expect(CAPS.defeat).toBeGreaterThanOrEqual(501); // the longest shot of the fight
  });
});
