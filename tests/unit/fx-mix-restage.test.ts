import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { Actor, Box, Fig, Pose } from '../../src/engine/fx/mix/geometry.ts';
import { parseStage, shiftFor, solveStage, STAGE_MAX, type StageEval } from '../../src/engine/fx/mix/restage.ts';
import { placeSensor } from '../../src/engine/fx/mix/sensorPlace.ts';

/**
 * The opt-restage prototype (FFX only; PR-0310, PR-0331; behind `?stage=`): the pure parts. The camera looks down -z, so
 * screen-right is +x and "toward the camera" is +z.
 */
const base: Pose = { pos: new Vector3(0, 2, 10), look: new Vector3(0, 2, 0), fov: 32 };
const party = { facing: 1 } as unknown as Actor;
const boss = { facing: -1 } as unknown as Actor;

describe('?stage= flags', () => {
  it('reads A, B, C, N and the goal; no flag is today', () => {
    expect(parseStage('')).toEqual({ move: null, sensor: false, goal: 'gap', max: 1.6 });
    expect(parseStage('?stage=b')).toEqual({ move: 'B', sensor: false, goal: 'gap', max: 1.6 });
    expect(parseStage('?stage=C,N&stagegoal=colossus')).toEqual({ move: 'C', sensor: true, goal: 'colossus', max: 1.6 });
    expect(parseStage('?stage=N')).toEqual({ move: null, sensor: true, goal: 'gap', max: 1.6 });
    expect(parseStage('?stage=Z')).toEqual({ move: null, sensor: false, goal: 'gap', max: 1.6 });
    expect(parseStage('?stage=B&stagemax=2.6').max).toBe(2.6);
    expect(parseStage('?stage=B&stagemax=9').max).toBe(1.6);
  });
});

describe('shiftFor', () => {
  it('A moves only the party, screen-left and toward the camera', () => {
    const m = shiftFor('A', 1, [party, boss], base);
    expect(m.has(boss)).toBe(false);
    const p = m.get(party)!;
    expect(p.dx).toBeCloseTo(-STAGE_MAX.party[0], 5);
    expect(p.dz).toBeCloseTo(STAGE_MAX.party[1], 5);
  });
  it('B moves only the boss, screen-right and away', () => {
    const m = shiftFor('B', 0.5, [party, boss], base);
    expect(m.has(party)).toBe(false);
    const b = m.get(boss)!;
    expect(b.dx).toBeCloseTo(STAGE_MAX.boss[0] * 0.5, 5);
    expect(b.dz).toBeCloseTo(-STAGE_MAX.boss[1] * 0.5, 5);
  });
  it('C moves both, half of each; t = 0 moves nothing', () => {
    const m = shiftFor('C', 1, [party, boss], base);
    expect(m.get(party)!.dx).toBeCloseTo(-STAGE_MAX.party[0] / 2, 5);
    expect(m.get(boss)!.dx).toBeCloseTo(STAGE_MAX.boss[0] / 2, 5);
    expect(shiftFor('C', 0, [party, boss], base).size).toBe(0);
  });
  it('means left and right in a scene that looks down +x too', () => {
    const turned: Pose = { pos: new Vector3(-10, 2, 0), look: new Vector3(0, 2, 0), fov: 32 };
    const p = shiftFor('A', 1, [party], turned).get(party)!;
    // looking down +x, screen-right is +z: "left" is -z, "toward the camera" is -x
    expect(p.dz).toBeCloseTo(-STAGE_MAX.party[0], 5);
    expect(p.dx).toBeCloseTo(-STAGE_MAX.party[1], 5);
  });
});

describe('solveStage', () => {
  const run = (gap: (t: number) => number, clean: (t: number) => boolean = () => true) => (t: number): { d: number; e: StageEval } => ({ d: t, e: { t, gap: gap(t), clean: clean(t), colossus: false } });
  it('takes the first size that clears and holds, plus margin', () => {
    const s = solveStage('gap', run((t) => (t < 0.2 ? -50 : 1)))!;
    expect(s.t).toBeCloseTo(0.4, 5); // 0.2 clears; two steps of margin
    expect(s.note).toContain('margin');
  });
  it('skips a knife-edge size the next size loses', () => {
    const s = solveStage('gap', run((t) => (Math.abs(t - 0.1) < 1e-6 || t >= 0.5 ? 1 : -20)))!;
    expect(s.t).toBeGreaterThanOrEqual(0.5);
  });
  it('falls back to the clean try with the best gap, never a cropped one', () => {
    const s = solveStage('gap', run((t) => -300 + 100 * t, (t) => t < 1))!;
    expect(s.d).toBeLessThan(1);
    expect(s.note).toContain('not met');
  });
  it('the colossus goal asks for the master', () => {
    const s = solveStage('colossus', (t) => ({ d: t, e: { t, gap: 1, clean: true, colossus: t >= 0.6 } }))!;
    expect(s.t).toBeGreaterThanOrEqual(0.6);
  });
});

describe('placeSensor (option N)', () => {
  const fig = (enemy: boolean): Fig => ({ feet: new Vector3(), h: 1, halfW: 0.5, enemy, id: enemy ? 'boss' : 'hero' });
  const home: Box = { l: 1000, r: 1250, t: 400, b: 600 };
  it('keeps the pinned place when nothing is under it', () => {
    const c = placeSensor([{ l: 100, r: 300, t: 300, b: 700 }], [fig(false)], [], 1600, 900, home)!;
    expect(c.l).toBeCloseTo(1000, -1);
    expect(c.t).toBeCloseTo(400, -1);
  });
  it('steps off a boss that stands under the pinned place', () => {
    const boxes: Box[] = [{ l: 900, r: 1300, t: 300, b: 650 }];
    const c = placeSensor(boxes, [fig(true)], [], 1600, 900, home)!;
    const covers = c.l < 1300 && c.r > 900 && c.t < 650 && c.b > 300;
    expect(covers).toBe(false);
  });
  it('is null when every spot is taken (the master is then held)', () => {
    const wall: Box = { l: 0, r: 1600, t: 0, b: 900 };
    expect(placeSensor([wall], [fig(true)], [], 1600, 900, home)).toBeNull();
  });
});
