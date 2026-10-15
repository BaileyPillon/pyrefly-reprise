/**
 * **The painted B's last two steps** (`src/engine/ffxcam/variant.ts`'s elevation limit, `plate.ts`, `plateFit.ts`; `tools/ffxcam-plate.mjs`; FFX only): keeping the camera's frame on the painting. What this file pins:
 *
 * 1. **The elevation clamp** holds the look direction's pitch between two numbers and nothing else: the look-at, the distance between eye and look-at, the azimuth, the roll and the lens are kept; a pose inside
 *    the band is the same object; it is continuous at the limit; a view straight up or down is kept.
 * 2. **The plate and the deck are the scene's**: the numbers in `plate.ts` equal the deck scene's own constants, and the rectangles it computes are where `layPainted` puts the meshes (checked on real three.js
 *    objects). The near default view's frame is wholly on the painting at 4:3, 16:9 and 21:9.
 * 3. **The limit is measured**: the constants are no higher than the pitch at which the frame's top edge leaves the plate, at 16:9 and 21:9, and no lower than where its bottom edge does; a frame at the limit is
 *    on the plate and one a degree past is not.
 * 4. **Fitting**: a frame already on the painting is the same object; one that is not is turned about its look-at, inside B's arc and nowhere else, to the nearest azimuth at which it is, with its height, its
 *    distance and its lens kept; a frame no azimuth can save gets the best one. The full filter is the three steps and is a fixed point of itself.
 *
 * Game case: FFX only.
 */
import { Group, Mesh, PlaneGeometry, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { DECK as RANGE_DECK } from '../../src/scenes/evrae-airship-range.ts';
import { EVRAE_AIRSHIP_DECK_BACKDROP } from '../../src/scenes/evrae-airship-deck.ts';
import { layPainted, paintedParts } from '../../src/scenes/exp-fayth-stage.ts';
import { DECK, PLATE, deckRect, plateRect } from '../../src/engine/ffxcam/plate.ts';
import { ON_PAINTING, coverageOf, fitToPlate, paintedBFilter, paintedWorld } from '../../src/engine/ffxcam/plateFit.ts';
import type { CameraPose } from '../../src/engine/ffxcam/solver.ts';
import { FFXCAM_B_AZIMUTH_LIMIT_DEG, FFXCAM_B_PITCH_MAX_DEG, FFXCAM_B_PITCH_MIN_DEG, azimuthDeg, clampAzimuth, clampElevation, paintedBClamp, pitchDeg } from '../../src/engine/ffxcam/variant.ts';
import { FFX_NEAR_VIEW, ffxFaythStaging } from '../../src/engine/ffx3d/ffxStaging.ts';
import { ffxEye, ffxPointTuple } from '../../src/engine/ffx3d/ffxWorld.ts';
import type { SceneBuild } from '../../src/scenes/types.ts';

const D2R = Math.PI / 180;
const CENTRE = FFX_NEAR_VIEW.thetaDeg;
const wrap = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;
const near: CameraPose = { eye: ffxEye(FFX_NEAR_VIEW), ref: [...FFX_NEAR_VIEW.ref], roll: 0, scrDpt: 1024, fovDeg: 26.3812 };

/** A pose looking at `ref` from `len` away at azimuth `az` and pitch `pitch` (up positive), FFX's frame. */
function look(az: number, pitch: number, opts: { ref?: [number, number, number]; len?: number; roll?: number; lens?: number } = {}): CameraPose {
  const ref = opts.ref ?? [-30.7, -35, 13.5];
  const len = opts.len ?? 342;
  // the view direction points from the eye to the look-at; looking up (positive pitch) puts the eye below the look-at, and FFX's y points down
  const a = az * D2R;
  const p = pitch * D2R;
  const eye: [number, number, number] = [ref[0] + len * Math.cos(p) * Math.cos(a), ref[1] + len * Math.sin(p), ref[2] + len * Math.cos(p) * Math.sin(a)];
  const lens = opts.lens ?? 1024;
  return { eye, ref, roll: opts.roll ?? 0, scrDpt: lens, fovDeg: 2 * Math.atan(240 / lens) / D2R };
}

describe('the elevation clamp', () => {
  it('reads the pitch as the look direction above the horizon (FFX\'s up is negative y), and none for a view straight up or down', () => {
    expect(pitchDeg(near)).toBeCloseTo(-17.19, 1); // the near default looks down
    expect(pitchDeg(look(100, 10))).toBeCloseTo(10, 9);
    expect(pitchDeg(look(100, -40))).toBeCloseTo(-40, 9);
    expect(pitchDeg({ ...near, eye: [0, -100, 0], ref: [0, 0, 0] })).toBeNull();
  });

  it('leaves a pose inside the band as the same object, and holds one outside at the nearer limit', () => {
    const inside = look(100, -10);
    expect(clampElevation(inside, -24.5, -2.5)).toBe(inside);
    expect(pitchDeg(clampElevation(look(100, 30), -24.5, -2.5))).toBeCloseTo(-2.5, 9);
    expect(pitchDeg(clampElevation(look(100, -70), -24.5, -2.5))).toBeCloseTo(-24.5, 9);
  });

  it('keeps the look-at, the distance between eye and look-at, the azimuth, the roll and the lens', () => {
    const p = look(120, 35, { ref: [10, -20, 30], len: 280, roll: 0.2, lens: 860 });
    const c = clampElevation(p, -24.5, -2.5);
    expect(c.ref).toEqual(p.ref);
    expect(Math.hypot(c.eye[0] - c.ref[0], c.eye[1] - c.ref[1], c.eye[2] - c.ref[2])).toBeCloseTo(280, 9);
    expect(azimuthDeg(c)).toBeCloseTo(azimuthDeg(p)!, 9);
    expect([c.roll, c.scrDpt, c.fovDeg]).toEqual([p.roll, p.scrDpt, p.fovDeg]);
  });

  it('is continuous: a pose that crosses the limit slides along it and comes back', () => {
    let last: CameraPose | null = null;
    for (let pitch = -10; pitch <= 20; pitch += 0.5) {
      const c = clampElevation(look(100, pitch), -24.5, -2.5);
      if (last) expect(Math.hypot(c.eye[0] - last.eye[0], c.eye[1] - last.eye[1], c.eye[2] - last.eye[2])).toBeLessThan(10);
      last = c;
    }
  });

  it('the painted B\'s clamp is the azimuth clamp and then the elevation limit; the near default view is inside both', () => {
    const f = paintedBClamp(CENTRE);
    expect(f(near)).toBe(near);
    const wild = look(300, 40);
    const out = f(wild);
    expect(Math.abs(wrap(azimuthDeg(out)! - CENTRE))).toBeCloseTo(FFXCAM_B_AZIMUTH_LIMIT_DEG, 9);
    expect(pitchDeg(out)).toBeCloseTo(FFXCAM_B_PITCH_MAX_DEG, 9);
    expect(out).toEqual(clampElevation(clampAzimuth(wild, CENTRE, FFXCAM_B_AZIMUTH_LIMIT_DEG), FFXCAM_B_PITCH_MIN_DEG, FFXCAM_B_PITCH_MAX_DEG));
  });
});

describe('the plate and the deck', () => {
  it('are the deck scene\'s own numbers', () => {
    expect(PLATE.width).toBe(EVRAE_AIRSHIP_DECK_BACKDROP.width);
    expect(PLATE.roll).toBe(EVRAE_AIRSHIP_DECK_BACKDROP.roll);
    expect(DECK).toEqual({ edgeZ: RANGE_DECK.edgeZ, nearZ: RANGE_DECK.nearZ, halfWidth: RANGE_DECK.halfWidth });
    expect(PLATE.aspect).toBeCloseTo(2688 / 1536, 12); // the installed plate's pixels (public/art/backdrops/evrae-airship-deck.png)
  });

  it('are where the painted skin puts the meshes: the plate\'s corners and the deck\'s, on real three.js objects', () => {
    const staging = ffxFaythStaging();
    // a build with the two parts the skin finds by name, laid exactly as the scene lays them
    const group = new Group();
    const pivot = new Group();
    pivot.name = 'sky-roll';
    pivot.rotation.z = EVRAE_AIRSHIP_DECK_BACKDROP.roll;
    const plane = new Mesh(new PlaneGeometry(PLATE.width, PLATE.width / PLATE.aspect));
    pivot.add(plane); // the plate's centre is the pivot's origin
    const deck = new Group();
    deck.name = 'airship-deck';
    const floor = new Mesh(new PlaneGeometry(DECK.halfWidth * 2, DECK.nearZ - DECK.edgeZ));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, (DECK.nearZ + DECK.edgeZ) / 2);
    deck.add(floor);
    group.add(pivot, deck);
    layPainted(paintedParts({ group } as unknown as SceneBuild), staging, []);
    group.updateMatrixWorld(true);

    const world = paintedWorld();
    // the plate: each of its four corners in the world is the rectangle's centre plus or minus half an axis
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      const corner = new Vector3((sx * PLATE.width) / 2, (sy * PLATE.width) / PLATE.aspect / 2, 0).applyMatrix4(plane.matrixWorld);
      const want = world.plate.centre.map((c, i) => c + sx * world.plate.halfW * world.plate.u[i]! + sy * world.plate.halfH * world.plate.v[i]!);
      expect(corner.toArray().map((n) => +n.toFixed(6)), `plate corner ${sx},${sy}`).toEqual(want.map((n) => +n.toFixed(6)));
    }
    // the deck: the four corners of its floor
    const lo = world.deck.centre[0] - world.deck.halfW;
    const hi = world.deck.centre[0] + world.deck.halfW;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      const corner = new Vector3((sx * DECK.halfWidth), (sz * (DECK.nearZ - DECK.edgeZ)) / 2, 0).applyMatrix4(floor.matrixWorld);
      expect(corner.y).toBeCloseTo(world.deck.centre[1], 9);
      expect([lo, hi].some((x) => Math.abs(corner.x - x) < 1e-6), `deck corner x ${corner.x}`).toBe(true);
      expect(Math.abs(corner.z - world.deck.centre[2])).toBeCloseTo(world.deck.halfH, 6);
    }
  });

  it('cover the near default view\'s frame wholly at 4:3, 16:9 and 21:9: it is the camera the plate was placed for', () => {
    const world = paintedWorld();
    for (const aspect of [4 / 3, 16 / 9, 21 / 9]) expect(coverageOf(world, near, aspect).covered, `aspect ${aspect}`).toBe(1);
  });

  it('a camera looking at the void is wholly off them, and the shares add up', () => {
    const world = paintedWorld();
    const away = { eye: near.eye, ref: [near.eye[0] - 300, near.eye[1] - 400, near.eye[2] - 300] as const, roll: 0, fovDeg: 26 }; // up and away
    expect(coverageOf(world, away, 16 / 9).covered).toBe(0);
    const c = coverageOf(world, near, 16 / 9);
    expect(c.covered).toBeLessThanOrEqual(c.plate + c.deck + 1e-12);
    expect(c.covered).toBeGreaterThanOrEqual(Math.max(c.plate, c.deck));
  });
});

describe('the measured limit', () => {
  /** The frame at the near default's eye, its azimuth, looking at `pitch` (the tool's own set-up). */
  const atNearEye = (pitch: number): CameraPose => {
    const eye = ffxEye(FFX_NEAR_VIEW);
    const ref = FFX_NEAR_VIEW.ref;
    const az = Math.atan2(ref[2] - eye[2], ref[0] - eye[0]);
    const len = FFX_NEAR_VIEW.len;
    const p = pitch * D2R;
    return { eye, ref: [eye[0] + len * Math.cos(p) * Math.cos(az), eye[1] - len * Math.sin(p), eye[2] + len * Math.cos(p) * Math.sin(az)], roll: 0, scrDpt: 1024, fovDeg: 26.3812 };
  };

  it('the upper limit is below where the frame\'s top edge leaves the plate (at 16:9 and 21:9), the lower above where its bottom edge does', () => {
    const world = paintedWorld();
    for (const aspect of [16 / 9, 21 / 9]) {
      expect(coverageOf(world, atNearEye(FFXCAM_B_PITCH_MAX_DEG), aspect).plate, `at the upper limit, ${aspect}`).toBe(1);
      expect(coverageOf(world, atNearEye(FFXCAM_B_PITCH_MAX_DEG + 3), aspect).plate, `3 degrees past it, ${aspect}`).toBeLessThan(1);
      expect(coverageOf(world, atNearEye(FFXCAM_B_PITCH_MIN_DEG), aspect).plate, `at the lower limit, ${aspect}`).toBe(1);
      expect(coverageOf(world, atNearEye(FFXCAM_B_PITCH_MIN_DEG - 3), aspect).plate, `3 degrees below it, ${aspect}`).toBeLessThan(1);
    }
    expect(FFXCAM_B_PITCH_MAX_DEG).toBeLessThan(0);
    expect(FFXCAM_B_PITCH_MIN_DEG).toBeLessThan(FFXCAM_B_PITCH_MAX_DEG);
    expect(pitchDeg(near)!).toBeGreaterThan(FFXCAM_B_PITCH_MIN_DEG); // the near default view is inside the band
    expect(pitchDeg(near)!).toBeLessThan(FFXCAM_B_PITCH_MAX_DEG);
  });
});

describe('fitToPlate', () => {
  const world = paintedWorld();
  const aspect = 16 / 9;

  it('returns a frame that is already on the painting as the same object', () => {
    expect(fitToPlate(world, near, aspect, CENTRE, 35)).toBe(near);
  });

  it('turns a frame that reaches past the plate\'s side to the nearest azimuth in the arc at which it does not, keeping its height, distance and lens', () => {
    // a wide lens at the arc's edge: half the frame is off the plate's side
    const edge = look(wrap(CENTRE + 35), -14, { lens: 534 });
    expect(coverageOf(world, edge, aspect).covered).toBeLessThan(ON_PAINTING);
    const fitted = fitToPlate(world, edge, aspect, CENTRE, 35);
    expect(fitted).not.toBe(edge);
    expect(coverageOf(world, fitted, aspect).covered).toBeGreaterThanOrEqual(ON_PAINTING);
    expect(Math.abs(wrap(azimuthDeg(fitted)! - CENTRE))).toBeLessThanOrEqual(35 + 1e-9);
    expect(Math.abs(wrap(azimuthDeg(fitted)! - CENTRE))).toBeLessThan(35); // nearer the centre than it was
    expect(fitted.eye[1]).toBe(edge.eye[1]);
    expect(Math.hypot(fitted.eye[0] - fitted.ref[0], fitted.eye[2] - fitted.ref[2])).toBeCloseTo(Math.hypot(edge.eye[0] - edge.ref[0], edge.eye[2] - edge.ref[2]), 9);
    expect([fitted.ref, fitted.scrDpt, fitted.roll]).toEqual([edge.ref, edge.scrDpt, edge.roll]);
  });

  it('gives a frame no azimuth can save the best one it has, still inside the arc', () => {
    const doomed = look(wrap(CENTRE + 20), 40, { lens: 1900, ref: [-30, -300, 10] }); // far above the plate
    const fitted = fitToPlate(world, doomed, aspect, CENTRE, 35);
    expect(coverageOf(world, fitted, aspect).covered).toBeGreaterThanOrEqual(coverageOf(world, doomed, aspect).covered);
    expect(Math.abs(wrap(azimuthDeg(fitted)! - CENTRE))).toBeLessThanOrEqual(35 + 1e-9);
  });
});

describe('the painted B\'s whole filter', () => {
  it('is the three steps, leaves the near default alone, and a pose it has filtered is a fixed point of it', () => {
    const f = paintedBFilter(CENTRE, () => 16 / 9);
    expect(f(near)).toBe(near);
    const wild = look(250, 38, { lens: 534 });
    const once = f(wild);
    expect(pitchDeg(once)!).toBeLessThanOrEqual(FFXCAM_B_PITCH_MAX_DEG + 1e-9);
    expect(Math.abs(wrap(azimuthDeg(once)! - CENTRE))).toBeLessThanOrEqual(FFXCAM_B_AZIMUTH_LIMIT_DEG + 1e-9);
    const again = f(once);
    expect(again.eye.map((n) => +n.toFixed(6))).toEqual(once.eye.map((n) => +n.toFixed(6)));
  });

  it('remembers its last answer for the same pose and window (a pose shown on many frames is measured once), and reads the window each time', () => {
    let aspect = 16 / 9;
    const f = paintedBFilter(CENTRE, () => aspect);
    const wild = look(250, 38, { lens: 534 });
    const a = f(wild);
    expect(f(wild)).toBe(a);
    aspect = 21 / 9; // a wider window needs more of the plate
    const b = f(wild);
    expect(b).not.toBe(a);
    expect(coverageOf(paintedWorld(), b, 21 / 9).covered).toBeGreaterThanOrEqual(coverageOf(paintedWorld(), a, 21 / 9).covered);
  });

  it('plate geometry is built once and from the scene\'s staging', () => {
    expect(paintedWorld()).toBe(paintedWorld());
    const cam = ffxPointTuple(ffxEye(FFX_NEAR_VIEW));
    const look0 = ffxPointTuple(FFX_NEAR_VIEW.ref);
    expect(paintedWorld().plate).toEqual(plateRect(cam, look0));
    expect(paintedWorld().deck).toEqual(deckRect(ffxFaythStaging().partySlots.slice(0, 3).map((v) => [v.x, v.y, v.z] as const)));
  });
});
