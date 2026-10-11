/**
 * **The camera solver** (`src/engine/ffxcam/solver.ts`, `stepper.ts`, `recipe.ts`): FFX's rig of two points, a roll and a lens, replayed. Pure numbers, synthetic positions (rule 8).
 *
 * Pins, each against a value worked out by hand rather than a recording:
 *
 * 1. the **polar rule** (`eye = ref + len * (cos phi cos theta, sin phi, cos phi sin theta)`, Y down, a negative pitch puts the eye above) and the **lens** (`2 * atan(240 / scrDpt)`);
 * 2. a **hard cut** (a `Set*` with no move armed is in place at once);
 * 3. the three blends: **linear**, **cosine** and **trapezoid** (a symmetric S curve, and the ease-out the victory camera uses), each evaluated n + 1 times and ending exactly on the destination;
 * 4. **polar versus Cartesian** moves (the same end points take different paths) and the **short way round** for yaw and roll;
 * 5. **camResetMove freezes in place**, and a `Set*` while a move is armed **re-aims** it; `camMove*` blends the roll and the lens, `refMove*` does not;
 * 6. **character-relative** recipes: the centroid raised by a fraction of the height, the offsets of the four kinds, two groups, a recipe that follows an actor that moves and keeps its last place
 *    when nobody is left.
 *
 * Game case: FFX only (the model is FFX's camera).
 */
import { describe, expect, it } from 'vitest';

import { vfovDeg } from '../../src/engine/ffxcam/geometry.ts';
import { EYE, REF, CameraSolver } from '../../src/engine/ffxcam/solver.ts';
import { armedRecord, nearestAngle, stepAxis, emptyMove } from '../../src/engine/ffxcam/stepper.ts';
import { D2R, TestHost, frame, near } from './helpers/ffxcamKit.ts';

const solverOf = (): { solver: CameraSolver; host: TestHost } => {
  const host = new TestHost();
  return { solver: new CameraSolver(host), host };
};

/** The eye's x after each of `n` steps (a move along x from 0). */
function xs(solver: CameraSolver, n: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    solver.step();
    out.push(solver.pose().eye[0]);
  }
  return out;
}

/** Arm `shape` on the eye with x going 0 -> 100. */
function moveAlongX(solver: CameraSolver, shape: Parameters<CameraSolver['armMove']>[1]): void {
  solver.setPos(EYE, 0, 0, 0);
  solver.armMove(EYE, shape);
  solver.setPos(EYE, 100, 0, 0);
}

describe('the polar rule and the lens', () => {
  it('puts the eye at ref + len * (cos phi cos theta, sin phi, cos phi sin theta), Y down', () => {
    const { solver } = solverOf();
    solver.setPos(REF, 10, -20, 30);
    solver.setPolar(EYE, -30, -15, 100);
    solver.step();
    const th = -30 * D2R;
    const ph = -15 * D2R;
    near(solver.pose().eye, [10 + 100 * Math.cos(ph) * Math.cos(th), -20 + 100 * Math.sin(ph), 30 + 100 * Math.cos(ph) * Math.sin(th)]);
    near(solver.pose().ref, [10, -20, 30]);
  });

  it('a negative pitch puts the eye above the look-at (Y points down), a positive one below', () => {
    const { solver } = solverOf();
    solver.setPos(REF, 0, 0, 0);
    solver.setPolar(EYE, 0, -20, 50);
    expect(solver.pose().eye[1]).toBeLessThan(0);
    solver.setPolar(EYE, 0, 20, 50);
    expect(solver.pose().eye[1]).toBeGreaterThan(0);
  });

  it('follows the look-at: the eye is polar about the look-at as it stands THIS step', () => {
    const { solver } = solverOf();
    solver.setPos(REF, 0, 0, 0);
    solver.setPolar(EYE, 90, 0, 10);
    solver.step();
    near(solver.pose().eye, [0, 0, 10]);
    solver.setPos(REF, 100, 0, 0);
    solver.step();
    near(solver.pose().eye, [100, 0, 10]);
  });

  it('the lens: the vertical field of view is 2 * atan(240 / scrDpt); the default lens is 1024', () => {
    const { solver } = solverOf();
    expect(solver.pose().scrDpt).toBe(1024);
    expect(solver.pose().fovDeg).toBeCloseTo((2 * Math.atan(240 / 1024) * 180) / Math.PI, 12);
    expect(solver.pose().fovDeg).toBeCloseTo(26.38, 2);
    solver.setScrDpt(724);
    solver.step();
    expect(solver.pose().fovDeg).toBeCloseTo(36.7, 1);
    expect(vfovDeg(1824)).toBeCloseTo(15.0, 1);
  });
});

describe('a hard cut', () => {
  it('a Set* with no move armed is in place at once, and stays through the step', () => {
    const { solver } = solverOf();
    solver.setPos(REF, 1, 2, 3);
    solver.setPos(EYE, 4, 5, 6);
    solver.setRoll(15);
    solver.setScrDpt(500);
    near(solver.pose().ref, [1, 2, 3]);
    near(solver.pose().eye, [4, 5, 6]);
    expect(solver.pose().roll).toBeCloseTo(15 * D2R, 12);
    expect(solver.pose().scrDpt).toBe(500);
    solver.step();
    near(solver.pose().ref, [1, 2, 3]);
    near(solver.pose().eye, [4, 5, 6]);
    expect(solver.busy(EYE)).toBe(false);
  });
});

describe('the blends', () => {
  it('linear: start + (dest - start) * t / n for t = 0..n, then the destination: n + 1 evaluations', () => {
    const { solver } = solverOf();
    moveAlongX(solver, { kind: 1, n: 10, polar: false });
    near([solver.pose().eye[0]], [0]); // armed: the picture has not moved yet
    const seen = xs(solver, 13);
    near(seen.slice(0, 11), [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    near(seen.slice(11), [100, 100]);
  });

  it('linear: the move is armed through step n and clear after it (a camWait goes on one step later)', () => {
    const { solver } = solverOf();
    moveAlongX(solver, { kind: 1, n: 10, polar: false });
    expect(solver.busy(EYE)).toBe(true);
    for (let k = 0; k < 10; k++) {
      solver.step();
      expect(solver.busy(EYE), `after step ${k}`).toBe(true);
    }
    solver.step(); // the 11th evaluation (t = n) lands on the destination and clears the record
    expect(solver.busy(EYE)).toBe(false);
    near([solver.pose().eye[0]], [100]);
  });

  it('cosine: (1 - cos(pi t / n)) / 2 of the way: slow at both ends, half way at the middle, exactly there at the end', () => {
    const { solver } = solverOf();
    moveAlongX(solver, { kind: 3, n: 10, polar: false });
    const seen = xs(solver, 11);
    for (let t = 0; t <= 10; t++) expect(seen[t]).toBeCloseTo((100 * (1 - Math.cos((Math.PI * t) / 10))) / 2, 9);
    expect(seen[5]).toBeCloseTo(50, 9);
    expect(seen[1] as number).toBeLessThan(10); // eases in
    expect((seen[10] as number) - (seen[9] as number)).toBeLessThan(10); // and out
    expect(seen[10]).toBeCloseTo(100, 12);
  });

  it('trapezoid (a, b, c, 0): a symmetric S curve of a + b + c steps: ramp, hold, ramp, exactly on the destination', () => {
    const { solver } = solverOf();
    moveAlongX(solver, { kind: 2, a: 10, b: 5, c: 10, d: 0, polar: false });
    const seen = xs(solver, 26);
    expect(seen[0]).toBeCloseTo(0, 12);
    expect(seen[25]).toBeCloseTo(100, 9);
    for (let t = 0; t <= 25; t++) expect((seen[t] as number) + (seen[25 - t] as number), `symmetry at ${t}`).toBeCloseTo(100, 9);
    const speed = (t: number): number => (seen[t + 1] as number) - (seen[t] as number);
    for (let t = 0; t < 9; t++) expect(speed(t + 1)).toBeGreaterThan(speed(t)); // the ramp up
    for (let t = 10; t < 14; t++) expect(speed(t + 1)).toBeCloseTo(speed(t), 9); // the hold
    for (let t = 15; t < 24; t++) expect(speed(t + 1)).toBeLessThan(speed(t)); // the ramp down
    for (let t = 0; t < 25; t++) expect(speed(t)).toBeGreaterThanOrEqual(0); // never backwards
  });

  it('trapezoid (0, 0, c, d): the ease-out the victory camera uses, starting at (dest - start) / d per step and ending at rest', () => {
    const { solver } = solverOf();
    moveAlongX(solver, { kind: 2, a: 0, b: 0, c: 70, d: 35, polar: false });
    const seen = xs(solver, 71);
    expect((seen[1] as number) - (seen[0] as number)).toBeCloseTo(100 / 35, 1);
    expect((seen[70] as number) - (seen[69] as number)).toBeLessThan(0.1);
    expect(seen[70]).toBeCloseTo(100, 9);
    for (let t = 0; t < 70; t++) expect(seen[t + 1] as number).toBeGreaterThanOrEqual(seen[t] as number);
  });

  it('the stepper clears a record after n + 1 evaluations and returns the destination for an empty one', () => {
    const rec = armedRecord({ kind: 1, n: 2, polar: false });
    expect([0, 1, 2].map(() => stepAxis(false, 10, 0, rec))).toEqual([0, 5, 10]);
    expect(rec.n).toBe(0);
    expect(stepAxis(false, 10, 0, emptyMove())).toBe(10);
    expect(armedRecord({ kind: 1, n: 0, polar: false }).n).toBe(0); // an armed move of no steps moves nothing
    expect(armedRecord({ kind: 2, a: 0, b: 0, c: 0, d: 0, polar: false }).n).toBe(0);
  });

  it('a short way round for angles: nearestAngle maps the target to within half a turn of the start', () => {
    expect(nearestAngle(-170 * D2R, 170 * D2R)).toBeCloseTo(-190 * D2R, 12);
    expect(nearestAngle(170 * D2R, -170 * D2R)).toBeCloseTo(190 * D2R, 12);
    expect(nearestAngle(0, 90 * D2R)).toBeCloseTo(90 * D2R, 12);
  });
});

describe('polar versus Cartesian moves, and the short way round', () => {
  /** The eye on a circle of radius 100 about the origin, yaw 0 -> 90 degrees, halfway through a 10-step move. */
  function halfway(polar: boolean): readonly number[] {
    const { solver } = solverOf();
    solver.setPos(REF, 0, 0, 0);
    solver.setPolar(EYE, 0, 0, 100);
    solver.armMove(EYE, { kind: 1, n: 10, polar });
    solver.setPolar(EYE, 90, 0, 100);
    for (let k = 0; k < 6; k++) solver.step(); // t = 5
    return solver.pose().eye;
  }

  it('a Cartesian move is a straight line between the two eye positions, even when both are given as polar', () => {
    near(halfway(false), [50, 0, 50], 1e-9); // the chord's midpoint: 70.7 from the look-at, not 100
  });

  it('a polar move is an arc about the look-at: yaw, pitch and length interpolated', () => {
    const r = 100;
    near(halfway(true), [r * Math.cos(45 * D2R), 0, r * Math.sin(45 * D2R)], 1e-9);
  });

  it('a polar move takes the short way: -170 to +170 degrees sweeps 20, through 180, not 340 through 0', () => {
    const { solver } = solverOf();
    solver.setPos(REF, 0, 0, 0);
    solver.setPolar(EYE, -170, 0, 100);
    solver.armMove(EYE, { kind: 1, n: 10, polar: true });
    solver.setPolar(EYE, 170, 0, 100);
    for (let k = 0; k < 6; k++) solver.step();
    near(solver.pose().eye, [-100, 0, 0], 1e-9); // yaw 180: behind the look-at on the -x side; the long way would be at +100
    for (let k = 0; k < 5; k++) solver.step();
    near(solver.pose().eye, [100 * Math.cos(170 * D2R), 0, 100 * Math.sin(170 * D2R)], 1e-9);
  });

  it('a polar move also interpolates the length', () => {
    const { solver } = solverOf();
    solver.setPos(REF, 0, 0, 0);
    solver.setPolar(EYE, 0, 0, 100);
    solver.armMove(EYE, { kind: 1, n: 10, polar: true });
    solver.setPolar(EYE, 0, 0, 300);
    for (let k = 0; k < 6; k++) solver.step();
    near(solver.pose().eye, [200, 0, 0], 1e-9);
  });

  it('the roll takes the short way round as well: 170 to -170 degrees passes through 180', () => {
    const { solver } = solverOf();
    solver.setRoll(170);
    solver.armMove(EYE, { kind: 1, n: 10, polar: false });
    solver.setRoll(-170);
    for (let k = 0; k < 6; k++) solver.step();
    expect(Math.abs(solver.pose().roll)).toBeCloseTo(Math.PI, 9);
  });
});

describe('resetting, re-aiming, and what a move arms', () => {
  it('camResetMove freezes the point where it is: it does not jump to the destination', () => {
    const { solver } = solverOf();
    moveAlongX(solver, { kind: 1, n: 10, polar: false });
    xs(solver, 4); // t = 0..3: x = 30
    solver.resetMove(EYE);
    expect(solver.busy(EYE)).toBe(false);
    near(xs(solver, 5), [30, 30, 30, 30, 30]);
  });

  it('resetMove on the eye also freezes the roll and the lens; on the look-at it leaves them to run', () => {
    const { solver } = solverOf();
    solver.setScrDpt(1000);
    solver.armMove(EYE, { kind: 1, n: 10, polar: false });
    solver.setScrDpt(500);
    for (let k = 0; k < 5; k++) solver.step(); // t = 4: 1000 - 200
    solver.resetMove(REF);
    expect(solver.busy(EYE)).toBe(true); // still running
    solver.resetMove(EYE);
    expect(solver.busy(EYE)).toBe(false);
    const frozen = solver.pose().scrDpt;
    solver.step();
    expect(solver.pose().scrDpt).toBe(frozen);
    expect(frozen).toBeCloseTo(800, 9);
  });

  it('a Set* while a move is armed re-aims it: the next step is start + (new dest - start) * t / n', () => {
    const { solver } = solverOf();
    moveAlongX(solver, { kind: 1, n: 10, polar: false }); // 0 -> 100
    near(xs(solver, 4), [0, 10, 20, 30]);
    solver.setPos(EYE, 200, 0, 0); // t = 4 of 10 now heads for 200: 80
    near(xs(solver, 2), [80, 100]);
  });

  it('camMove arms the roll and the lens too (a zoom is blended by the camMove that precedes the new lens); refMove arms only the look-at', () => {
    const { solver } = solverOf();
    solver.setScrDpt(1000);
    solver.armMove(EYE, { kind: 1, n: 10, polar: false });
    solver.setScrDpt(500);
    for (let k = 0; k < 6; k++) solver.step(); // t = 5
    expect(solver.pose().scrDpt).toBeCloseTo(750, 9);

    const other = solverOf().solver;
    other.setScrDpt(1000);
    other.armMove(REF, { kind: 1, n: 10, polar: false });
    other.setScrDpt(500);
    other.step();
    expect(other.pose().scrDpt).toBe(500); // a hard cut: the look-at's move does not carry the lens
  });

  it('camWait and refWait poll: the eye is busy while its roll or lens still moves, the look-at only for its own axes', () => {
    const { solver } = solverOf();
    solver.armMove(REF, { kind: 1, n: 3, polar: false });
    expect(solver.busy(REF)).toBe(true);
    expect(solver.busy(EYE)).toBe(false);
    solver.armMove(EYE, { kind: 1, n: 3, polar: false });
    expect(solver.busy(EYE)).toBe(true);
  });
});

describe('character-relative framing', () => {
  /** A world: chr 20 (a big monster) and chr 0 (a small party member), selectors -3 the targets, -2 the acting one. */
  function world(): { solver: CameraSolver; host: TestHost } {
    const { solver, host } = solverOf();
    host.frames.set(20, frame(-140, -35, 80, { height: 200, width: 120, heading: 0 }));
    host.frames.set(0, frame(0, -35, 0, { height: 60, width: 30, heading: Math.PI / 2 }));
    host.groups.set(-3, [20]);
    host.groups.set(-2, [0]);
    return { solver, host };
  }

  it('refSetBtl: the targets\' centroid raised by hfac times their height (Y down, so it subtracts)', () => {
    const { solver } = world();
    solver.setRecipe(REF, 0, -3, -1, 100, 0, 0, 0);
    solver.step();
    near(solver.pose().ref, [-140, -35 - 200, 80]);
    solver.setRecipe(REF, 0, -3, -1, 50, 0, 0, 0);
    near(solver.pose().ref, [-140, -35 - 100, 80]);
  });

  it('kind 1 adds a polar offset of rfac * width at theta0 + heading; kind 2 uses rfac * 10 + width', () => {
    const { solver } = world();
    solver.setRecipe(EYE, 1, -3, -1, 0, 90, 0, 100); // yaw 90 + heading 0: along +z; radius 1.0 * 120
    solver.step();
    near(solver.pose().eye, [-140, -35, 80 + 120], 1e-9);
    solver.setRecipe(EYE, 2, -3, -1, 0, 90, 0, 100); // radius 1.0 * 10 + 120
    solver.step();
    near(solver.pose().eye, [-140, -35, 80 + 130], 1e-9);
  });

  it('the heading is the actor\'s: a party member facing +z (pi / 2) turns a yaw of 0 into +z', () => {
    const { solver } = world();
    solver.setRecipe(EYE, 1, -2, -1, 0, 0, 0, 100); // yaw 0 + heading pi/2; radius 1.0 * 30
    solver.step();
    near(solver.pose().eye, [0, -35, 30], 1e-9);
  });

  it('kinds 3 and 4 are polar: the same triple is a yaw, pitch and length about the OTHER point', () => {
    const { solver } = world();
    solver.setPos(REF, 1000, 0, 0);
    solver.setRecipe(EYE, 4, -3, -1, 0, 90, 0, 100); // (pi/2, 0, 1.0 * 10 + 120) about the look-at
    solver.step();
    near(solver.pose().eye, [1000, 0, 130], 1e-9);
    solver.setRecipe(EYE, 3, -3, -1, 0, 90, 0, 100); // radius 1.0 * 120
    solver.step();
    near(solver.pose().eye, [1000, 0, 120], 1e-9);
  });

  it('two different groups: the point is their mean, and the heading is the direction from the first to the second', () => {
    const { solver, host } = world();
    host.frames.set(20, frame(0, 0, 100, { height: 200, width: 30 }));
    host.frames.set(0, frame(0, 0, 0, { height: 60, width: 30 }));
    solver.setRecipe(REF, 1, -2, -3, 0, 90, 0, 100);
    solver.step();
    // mean (0, 0, 50); the second group is +z of the first (heading pi/2); yaw 90 + 90 = 180: -x by the mean width 30
    near(solver.pose().ref, [-30, 0, 50], 1e-9);
  });

  it('is re-solved every step: it follows an actor that moves', () => {
    const { solver, host } = world();
    solver.setRecipe(REF, 0, -3, -1, 0, 0, 0, 0);
    solver.step();
    near(solver.pose().ref, [-140, -35, 80]);
    host.frames.set(20, frame(-100, -35, 40, { height: 200, width: 120 }));
    solver.step();
    near(solver.pose().ref, [-100, -35, 40]);
  });

  it('keeps its last place when nobody is on the field', () => {
    const { solver, host } = world();
    solver.setRecipe(REF, 0, -3, -1, 0, 0, 0, 0);
    solver.step();
    host.frames.delete(20);
    solver.step();
    solver.step();
    near(solver.pose().ref, [-140, -35, 80]);
  });

  it('a move towards a recipe drifts with the actors: the destination is re-solved while the move runs', () => {
    const { solver, host } = world();
    host.frames.set(20, frame(100, 0, 0, { height: 0, width: 0 }));
    solver.setPos(REF, 0, 0, 0);
    solver.armMove(REF, { kind: 1, n: 10, polar: false });
    solver.setRecipe(REF, 0, -3, -1, 0, 0, 0, 0);
    for (let k = 0; k < 6; k++) solver.step(); // t = 5: half way to x = 100
    near(solver.pose().ref, [50, 0, 0], 1e-9);
    host.frames.set(20, frame(200, 0, 0, { height: 0, width: 0 })); // the actor ran off
    solver.step(); // t = 6 of 10 towards the NEW position
    near(solver.pose().ref, [120, 0, 0], 1e-9);
  });
});
