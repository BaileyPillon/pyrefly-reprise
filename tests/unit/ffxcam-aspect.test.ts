/**
 * **The window's lens** (`screenFovDeg`, `src/engine/ffxcam/geometry.ts`; FFX only): FOC46-05, the hidden Fayth chapter's boss was out of frame on a phone.
 *
 * FFX framed its battles for a 4:3 television. Our sink kept FFX's **vertical** field of view and let the window widen the picture sideways (Hor+), which is right for anything as wide as 4:3 and wrong for a
 * window that is narrower: an upright tablet, and the slice an upright phone shows of its 16:9 render (`ui/common/phone-battle.css`: the canvas is 924 by 520 at 390 by 844 and the window shows 390 of it, 3:4),
 * saw a horizontal field of about 20 degrees where FFX's frame has 34.7, and the boss stood outside it. The rule now: a window as wide as 4:3 or wider keeps FFX's vertical field exactly as before; a narrower
 * one keeps FFX's 4:3 **horizontal** field, which makes the vertical one taller, up to a cap (the painted plate's own height).
 *
 * Pins: the rule itself (wider windows untouched to the bit, narrower ones keep the 4:3 horizontal field, continuous at 4:3, never narrower than the shot's own lens, capped at the plate's height, garbage in leaves
 * the lens alone); the sink draws it (a camera whose own aspect is the window's, and one whose aspect is the 16:9 render's behind a 3:4 window the scene reports); the sink follows a resize and does not rebuild the
 * projection for nothing; **the net, the plate fit and the audit read the camera the sink draws** (`viewOf` against the real three.js projection, box by box, in a 3:4 window, a 16:9 render behind a 3:4 window,
 * and the 4:3 and 16:9 windows of before); the net no longer calls a subject at the edge of FFX's 4:3 frame lost in a 3:4 window; the plate fit judges the widened frame.
 *
 * Game case: FFX only (the lens and the 4:3 frame are FFX's).
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { visibleFraction, viewOf, type Box } from '../../src/engine/ffxcam/framing.ts';
import { D2R, FFX_FRAME_ASPECT, MAX_SCREEN_VFOV_DEG, R2D, screenFovDeg, vfovDeg } from '../../src/engine/ffxcam/geometry.ts';
import { PLATE } from '../../src/engine/ffxcam/plate.ts';
import { coverageOf, paintedWorld } from '../../src/engine/ffxcam/plateFit.ts';
import { SafetyNet, type HomeView, type NetFrame } from '../../src/engine/ffxcam/safetyNet.ts';
import { ThreeCameraSink } from '../../src/engine/ffxcam/sink.ts';
import type { CameraPose } from '../../src/engine/ffxcam/solver.ts';
import { FFX_NEAR_VIEW } from '../../src/engine/ffx3d/ffxStaging.ts';
import { ffxEye, ffxWorldMatrix } from '../../src/engine/ffx3d/ffxWorld.ts';

/** The horizontal field of view, degrees, of a vertical one at an aspect. */
const hfov = (v: number, aspect: number): number => 2 * Math.atan(Math.tan((v * D2R) / 2) * aspect) * R2D;
const LENS = 1024;
const FOV = vfovDeg(LENS);
const A34 = 3 / 4;
const A169 = 16 / 9;

describe('the rule', () => {
  it('a window as wide as FFX\'s 4:3, or wider, keeps FFX\'s vertical field, to the bit (Hor+, as before)', () => {
    for (const lens of [1024, 724, 1824, 535]) {
      for (const aspect of [FFX_FRAME_ASPECT, 1.5, A169, 21 / 9, 32 / 9, 100, Number.POSITIVE_INFINITY]) expect(screenFovDeg(vfovDeg(lens), aspect)).toBe(vfovDeg(lens));
    }
  });

  it('a narrower window keeps FFX\'s 4:3 HORIZONTAL field, whatever its lens, while the cap does not bite', () => {
    for (const lens of [1024, 1824, 1400]) {
      for (const aspect of [1, 0.9, A34, 0.62]) {
        const f = vfovDeg(lens);
        const v = screenFovDeg(f, aspect);
        expect(v, `${lens} at ${aspect}`).toBeGreaterThan(f);
        expect(v).toBeLessThanOrEqual(MAX_SCREEN_VFOV_DEG);
        expect(hfov(v, aspect), `${lens} at ${aspect}`).toBeCloseTo(hfov(f, FFX_FRAME_ASPECT), 9);
      }
    }
    // the phone's slice and the upright tablet: 3:4 draws FFX's 26.38 degrees as 45.24 and keeps the 34.7 degrees across
    expect(screenFovDeg(FOV, A34)).toBeCloseTo(45.24, 2);
    expect(hfov(screenFovDeg(FOV, A34), A34)).toBeCloseTo(hfov(FOV, FFX_FRAME_ASPECT), 9);
    expect(hfov(FOV, FFX_FRAME_ASPECT)).toBeCloseTo(34.71, 2);
  });

  it('is continuous at 4:3, and the narrower the window the taller the field (never shorter)', () => {
    expect(screenFovDeg(FOV, FFX_FRAME_ASPECT - 1e-9)).toBeCloseTo(FOV, 6);
    let last = FOV;
    for (let aspect = FFX_FRAME_ASPECT; aspect > 0.2; aspect -= 0.02) {
      const v = screenFovDeg(FOV, aspect);
      expect(v).toBeGreaterThanOrEqual(last - 1e-12);
      last = v;
    }
  });

  it('never narrows a shot\'s own lens, and never goes past the cap unless the shot\'s own lens already does', () => {
    for (const f of [11, 15, FOV, 36.7, 48.4, 60, 75]) {
      for (const aspect of [1.2, 1, A34, 0.5, 0.3, 0.1]) {
        const v = screenFovDeg(f, aspect);
        expect(v).toBeGreaterThanOrEqual(f);
        expect(v).toBeLessThanOrEqual(Math.max(f, MAX_SCREEN_VFOV_DEG));
      }
    }
    expect(screenFovDeg(75, 0.5)).toBe(75);
  });

  it('a very tall window gets the cap, which is still more horizontal field than leaving the lens alone, and less than 4:3\'s', () => {
    expect(screenFovDeg(FOV, 0.3)).toBe(MAX_SCREEN_VFOV_DEG);
    expect(hfov(MAX_SCREEN_VFOV_DEG, 0.3)).toBeLessThan(hfov(FOV, FFX_FRAME_ASPECT));
    expect(hfov(MAX_SCREEN_VFOV_DEG, 0.3)).toBeGreaterThan(hfov(FOV, 0.3));
  });

  it('the cap is the painted plate\'s own height from the eye it is laid for: a taller frame shows the void above and below the painting at any pitch', () => {
    const plateDeg = 2 * Math.atan((PLATE.width * PLATE.scale) / PLATE.aspect / 2 / PLATE.distance) * R2D; // 92.6 units tall at 80 away
    expect(plateDeg).toBeCloseTo(60.1, 1);
    expect(MAX_SCREEN_VFOV_DEG).toBeLessThanOrEqual(plateDeg);
    expect(plateDeg - MAX_SCREEN_VFOV_DEG).toBeLessThan(1);
  });

  it('garbage in leaves the lens alone: no aspect, a negative one, NaN, and a lens that is not a number', () => {
    for (const aspect of [0, -1, Number.NaN]) expect(screenFovDeg(FOV, aspect)).toBe(FOV);
    expect(Number.isNaN(screenFovDeg(Number.NaN, A34))).toBe(true); // as before: the sink never made a number of it either
  });
});

// ------------------------------------------------------------------------------------------------------ the sink

const nearPose = (over: Partial<CameraPose> = {}): CameraPose => ({ eye: ffxEye(FFX_NEAR_VIEW), ref: [...FFX_NEAR_VIEW.ref], roll: 0, scrDpt: LENS, fovDeg: FOV, ...over });

describe('the sink draws the window with it', () => {
  it('a camera whose own aspect is the window\'s (an upright tablet, 3:4): its horizontal field is FFX\'s 4:3 one', () => {
    const c = new PerspectiveCamera(50, A34, 0.1, 1000);
    new ThreeCameraSink(c, ffxWorldMatrix()).apply(nearPose());
    expect(c.fov).toBeCloseTo(screenFovDeg(FOV, A34), 12);
    expect(2 * Math.atan(1 / c.projectionMatrix.elements[0]!) * R2D).toBeCloseTo(hfov(FOV, FFX_FRAME_ASPECT), 9); // the projection's own x scale, not our arithmetic
  });

  it('a 16:9 render behind a 3:4 window (an upright phone\'s slice of its 924 by 520 canvas): the window\'s horizontal field is FFX\'s 4:3 one', () => {
    const c = new PerspectiveCamera(50, A169, 0.1, 1000);
    new ThreeCameraSink(c, ffxWorldMatrix(), { windowAspect: () => A34 }).apply(nearPose());
    expect(c.fov).toBeCloseTo(screenFovDeg(FOV, A34), 12);
    const canvasHalf = 1 / c.projectionMatrix.elements[0]!; // the whole canvas
    const windowHalf = canvasHalf * (A34 / A169); // the 390 px of 924 the window shows, centred
    expect(2 * Math.atan(windowHalf) * R2D).toBeCloseTo(hfov(FOV, FFX_FRAME_ASPECT), 9);
    expect(c.aspect).toBe(A169); // the renderer's: the sink does not touch it
  });

  it('leaves 4:3, 16:9 and 21:9 windows exactly as they were (the vertical field is the pose\'s)', () => {
    for (const aspect of [FFX_FRAME_ASPECT, A169, 21 / 9]) {
      const c = new PerspectiveCamera(50, aspect, 0.1, 1000);
      new ThreeCameraSink(c, ffxWorldMatrix()).apply(nearPose());
      expect(c.fov).toBe(FOV);
    }
  });

  it('follows the window: a resize, or a new window shape, changes the lens at the next apply and the projection is rebuilt only then', () => {
    const c = new PerspectiveCamera(50, A169, 0.1, 1000);
    let shape = A169;
    const sink = new ThreeCameraSink(c, ffxWorldMatrix(), { windowAspect: () => shape });
    sink.apply(nearPose());
    expect(c.fov).toBe(FOV);
    shape = A34; // the phone layout arrives (the HUD marks the page): the same canvas, a narrower window
    sink.apply(nearPose());
    expect(c.fov).toBeCloseTo(screenFovDeg(FOV, A34), 12);
    c.projectionMatrix.elements[5] = 123; // a marker a rebuild would overwrite
    sink.apply(nearPose());
    expect(c.projectionMatrix.elements[5]).toBe(123); // the same window and lens: not rebuilt
    shape = 0.9;
    sink.apply(nearPose());
    expect(c.fov).toBeCloseTo(screenFovDeg(FOV, 0.9), 12);
    expect(c.projectionMatrix.elements[5]).not.toBe(123);
    // with no window aspect given the camera's own is used, read at every apply
    const own = new PerspectiveCamera(50, A169, 0.1, 1000);
    const bare = new ThreeCameraSink(own, ffxWorldMatrix());
    bare.apply(nearPose());
    expect(own.fov).toBe(FOV);
    own.aspect = A34;
    own.updateProjectionMatrix();
    bare.apply(nearPose());
    expect(own.fov).toBeCloseTo(screenFovDeg(FOV, A34), 12);
  });
});

// -------------------------------------------------------------- the net, the plate fit and the audit read that camera

/** A tiny seeded generator: the boxes are the same on every run. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** The share of `box` (FFX frame) inside the three.js camera's frustum **and** the window's slice of the canvas (|x| <= `slice`), by the same lattice `visibleFraction` uses, through the camera's own matrices. */
function throughCamera(c: PerspectiveCamera, box: Box, slice: number, n = 6): number {
  c.updateMatrixWorld();
  const world = ffxWorldMatrix();
  const p = new Vector3();
  const e = c.matrixWorldInverse.elements;
  const m = c.projectionMatrix.elements;
  let inside = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++) {
        p.set(box.min[0] + ((box.max[0] - box.min[0]) * (i + 0.5)) / n, box.min[1] + ((box.max[1] - box.min[1]) * (j + 0.5)) / n, box.min[2] + ((box.max[2] - box.min[2]) * (k + 0.5)) / n).applyMatrix4(world);
        const vx = e[0]! * p.x + e[4]! * p.y + e[8]! * p.z + e[12]!;
        const vy = e[1]! * p.x + e[5]! * p.y + e[9]! * p.z + e[13]!;
        const vz = e[2]! * p.x + e[6]! * p.y + e[10]! * p.z + e[14]!;
        const cx = m[0]! * vx + m[4]! * vy + m[8]! * vz + m[12]!;
        const cy = m[1]! * vx + m[5]! * vy + m[9]! * vz + m[13]!;
        const cw = m[3]! * vx + m[7]! * vy + m[11]! * vz + m[15]!;
        if (cw > 1e-6 && Math.abs(cx) <= cw * slice && Math.abs(cy) <= cw) inside++;
      }
  return inside / (n * n * n);
}

describe('the net, the plate fit and the audit read the camera the sink draws', () => {
  // [the window's shape, the render's aspect]: a 3:4 tablet, a 16:9 render behind a 3:4 window (the phone), a 0.9 window on a 16:9 render, and the 4:3 and 16:9 windows of before
  const SHAPES: ReadonlyArray<readonly [number, number]> = [
    [A34, A34],
    [A34, A169],
    [0.9, A169],
    [FFX_FRAME_ASPECT, FFX_FRAME_ASPECT],
    [A169, A169],
  ];

  it('viewOf says what a three.js camera set by the sink shows, box by box: the share of each box in the window agrees with the projection to the last digit', () => {
    const rand = lcg(7);
    const near = nearPose();
    for (const [window, canvas] of SHAPES) {
      const c = new PerspectiveCamera(50, canvas, 0.1, 1000);
      new ThreeCameraSink(c, ffxWorldMatrix(), { windowAspect: () => window }).apply(near);
      let seen = 0;
      for (let b = 0; b < 120; b++) {
        // boxes in and around the party's end of the deck, from nothing to wholly in frame
        const cx = near.ref[0] + (rand() - 0.5) * 420;
        const cy = near.ref[1] + (rand() - 0.5) * 160;
        const cz = near.ref[2] + (rand() - 0.2) * 260;
        const w = 8 + rand() * 60;
        const box: Box = { min: [cx - w / 2, cy - w, cz - w / 2], max: [cx + w / 2, cy, cz + w / 2] };
        const ours = visibleFraction(near, box, window);
        const theirs = throughCamera(c, box, window / canvas);
        expect(ours, `window ${window} on ${canvas}, box ${b}`).toBeCloseTo(theirs, 9);
        if (ours > 0 && ours < 1) seen++;
      }
      expect(seen, `window ${window} on ${canvas}: some boxes straddle its edge`).toBeGreaterThan(5);
    }
  });

  it('the same lens as the sink: viewOf\'s half-field at 3:4 is FFX\'s 4:3 one, not the old narrow one', () => {
    const v = viewOf(nearPose(), A34)!;
    expect(v.tanX).toBeCloseTo(Math.tan((hfov(FOV, FFX_FRAME_ASPECT) * D2R) / 2), 12);
    expect(v.tanY).toBeCloseTo(Math.tan((screenFovDeg(FOV, A34) * D2R) / 2), 12);
    expect(viewOf(nearPose(), A169)!.tanY).toBeCloseTo(Math.tan((FOV * D2R) / 2), 12); // wider windows: as before
  });

  it('the net does not call a subject at the edge of FFX\'s 4:3 frame lost in a 3:4 window (it did, at the old 20 degrees), and still does when it is past it', () => {
    const home: HomeView = { ref: [0, 0, 0], thetaDeg: -90, phiDeg: -10, len: 300, scrDpt: LENS };
    const pose: CameraPose = { eye: [0, 0, -300], ref: [0, 0, 0], roll: 0, scrDpt: LENS, fovDeg: FOV };
    const subject = (tangent: number): Box => ({ min: [tangent * 300 - 1, -2, -1], max: [tangent * 300 + 1, 0, 1] }); // a thin post at this tangent of the view axis, 300 away
    const frame = (steps: number, box: Box): NetFrame => ({ steps, raw: pose, aspect: A34, watch: [box], hold: [box], home, key: 'a' });
    const tanOld = Math.tan((FOV * D2R) / 2) * A34; // 0.176: where the 3:4 window ended before
    const tan43 = Math.tan((hfov(FOV, FFX_FRAME_ASPECT) * D2R) / 2); // 0.3125: where FFX's frame ends
    expect(tanOld).toBeLessThan(0.2);
    expect(tan43).toBeCloseTo(0.3125, 3);
    const inside = new SafetyNet();
    for (let s = 1; s <= 40; s++) expect(inside.process(frame(s, subject(0.26)))).toBe(pose); // past the old edge, inside FFX's: the shot is left alone
    expect(inside.engagements).toBe(0);
    const outside = new SafetyNet();
    for (let s = 1; s <= 40; s++) outside.process(frame(s, subject(tan43 * 1.4)));
    expect(outside.engagements).toBe(1); // past FFX's frame too: lost, and the net acts
  });

  it('the plate fit measures the widened frame: wholly on the painting at the near default view in a 3:4 window, off it for a lower eye that the narrow lens never reached', () => {
    const world = paintedWorld();
    const at = (phiDeg: number): CameraPose => nearPose({ eye: ffxEye({ ...FFX_NEAR_VIEW, phiDeg }) });
    expect(coverageOf(world, at(FFX_NEAR_VIEW.phiDeg), A34).covered).toBeGreaterThanOrEqual(0.995);
    // at 4:3 the vertical field is FFX's 26.38 degrees and an eye at pitch -28 is still on the plate; at 3:4 it is 45.24 and the frame reaches below it
    expect(coverageOf(world, at(-28), FFX_FRAME_ASPECT).covered).toBeGreaterThanOrEqual(0.995);
    expect(coverageOf(world, at(-28), A34).covered).toBeLessThan(0.95);
  });
});
