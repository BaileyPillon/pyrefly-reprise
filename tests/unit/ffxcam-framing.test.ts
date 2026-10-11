/**
 * **What a pose sees** (`src/engine/ffxcam/framing.ts`): the in-frame arithmetic the tracking audit and the safety net share. Synthetic poses and boxes only, plus the three public constants of the
 * chapter's staging (the party's slots and the two default views, which are already in the repo) to pin what the audit found: the NEAR default view holds the party and the FAR one holds nobody.
 *
 * Pins: a box on the view axis is wholly in frame, one beside it, behind it or past the far side of the window is not; a box half out of the window reads about half; the window widens with the aspect
 * and the vertical framing holds; FFX's up is negative y; a roll turns the window; a box straddling the near plane is counted by the part in front of the eye; the union and centre helpers; a pose with no
 * direction sees nothing; the apparent height of a box falls with distance.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { LATTICE, SEEN_MIN, apparentHeight, centreOf, inFrame, pointInView, unionOf, viewOf, visibleFraction, type Box, type ViewPose } from '../../src/engine/ffxcam/framing.ts';
import { FFX_FAR_VIEW, FFX_NEAR_VIEW, FFX_PARTY_SLOTS } from '../../src/engine/ffx3d/ffxStaging.ts';
import { ffxEye, ffxVerticalFov } from '../../src/engine/ffx3d/ffxWorld.ts';

const FOV = 26.3812; // the 1024 lens
const A169 = 16 / 9;
/** A pose at (0, 0, -100) looking down +z at the origin; up is -y as in FFX. */
const along = (over: Partial<ViewPose> = {}): ViewPose => ({ eye: [0, 0, -100], ref: [0, 0, 0], roll: 0, fovDeg: FOV, ...over });
const box = (cx: number, cy: number, cz: number, w = 4, h = 4, d = 4): Box => ({ min: [cx - w / 2, cy - h / 2, cz - d / 2], max: [cx + w / 2, cy + h / 2, cz + d / 2] });
/** Half the window's width at distance `z` for a pose looking down +z. */
const halfWidth = (z: number, aspect = A169): number => z * Math.tan((FOV * Math.PI) / 360) * aspect;
const halfHeight = (z: number): number => z * Math.tan((FOV * Math.PI) / 360);

describe('a box against the window', () => {
  it('a box on the view axis is wholly in frame', () => {
    expect(visibleFraction(along(), box(0, 0, 0), A169)).toBe(1);
    expect(inFrame(along(), box(0, 0, 0), A169)).toBe(true);
  });

  it('a box well to one side, or above or below, is out of frame', () => {
    const w = halfWidth(100);
    expect(visibleFraction(along(), box(w * 3, 0, 0), A169)).toBe(0);
    expect(visibleFraction(along(), box(-w * 3, 0, 0), A169)).toBe(0);
    expect(visibleFraction(along(), box(0, halfHeight(100) * 4, 0), A169)).toBe(0);
    expect(visibleFraction(along(), box(0, -halfHeight(100) * 4, 0), A169)).toBe(0);
  });

  it('a box behind the eye is out of frame, whatever its side', () => {
    expect(visibleFraction(along(), box(0, 0, -300), A169)).toBe(0);
    expect(visibleFraction(along(), box(5, 0, -100.5, 2, 2, 0.5), A169)).toBe(0);
  });

  it('a box half out of the window reads about half, and the 30 percent line falls where it should', () => {
    const w = halfWidth(100);
    // Its centre on the window's edge: half of it inside.
    expect(visibleFraction(along(), box(w, 0, 0, 4, 4, 4), A169)).toBeCloseTo(0.5, 1);
    // Its centre 20 percent of its width outside the edge: 30 percent inside, on the line.
    const edge = visibleFraction(along(), box(w + 0.2 * 4, 0, 0, 4, 4, 4), A169, 20);
    expect(edge).toBeGreaterThan(0.27);
    expect(edge).toBeLessThan(0.33);
    expect(SEEN_MIN).toBe(0.3);
    expect(inFrame(along(), box(w + 0.45 * 4, 0, 0), A169)).toBe(false);
    expect(inFrame(along(), box(w - 0.1 * 4, 0, 0), A169)).toBe(true);
  });

  it('a box that straddles the near plane counts the part in front of the eye', () => {
    // A thin box 8 deep, centred on the eye and on the axis: the half in front of the eye is in view, the half behind is not.
    const f = visibleFraction(along(), box(0, 0, -100, 0.02, 0.02, 8), A169, 8);
    expect(f).toBeCloseTo(0.5, 5);
  });

  it('a pose with no direction (the eye on the look-at point) sees nothing', () => {
    expect(viewOf(along({ ref: [0, 0, -100] }), A169)).toBeNull();
    expect(visibleFraction(along({ ref: [0, 0, -100] }), box(0, 0, 0), A169)).toBe(0);
  });

  it('a degenerate (flat) box is read as a thin one, not as nothing', () => {
    expect(visibleFraction(along(), { min: [-2, -2, 0], max: [2, 2, 0] }, A169)).toBe(1);
  });
});

describe('the window: aspect, FFX up, roll', () => {
  it('a wider window sees more sideways and the same height', () => {
    const x = halfWidth(100, 4 / 3) * 1.15; // outside a 4:3 window, inside 16:9
    expect(visibleFraction(along(), box(x, 0, 0, 1, 1, 1), 4 / 3)).toBe(0);
    expect(visibleFraction(along(), box(x, 0, 0, 1, 1, 1), A169)).toBe(1);
    const y = halfHeight(100) * 1.2; // outside at either aspect
    expect(visibleFraction(along(), box(0, y, 0, 1, 1, 1), 4 / 3)).toBe(0);
    expect(visibleFraction(along(), box(0, y, 0, 1, 1, 1), 4)).toBe(0);
  });

  it('FFX\'s up is negative y: a point above the axis (y < 0) is up on screen', () => {
    const view = viewOf(along(), A169)!;
    expect(view.up[1]).toBeCloseTo(-1, 9);
    expect(view.up[0]).toBeCloseTo(0, 9);
    // looking down +z with up = -y, right = forward x up = +x
    expect(view.right[0]).toBeCloseTo(1, 9);
  });

  it('the vertical field of view is the lens: a point just inside and just outside the half height', () => {
    const view = viewOf(along(), A169)!;
    expect(pointInView(view, [0, -halfHeight(100) * 0.98, 0])).toBe(true);
    expect(pointInView(view, [0, -halfHeight(100) * 1.02, 0])).toBe(false);
    expect(pointInView(view, [halfWidth(100) * 0.98, 0, 0])).toBe(true);
    expect(pointInView(view, [halfWidth(100) * 1.02, 0, 0])).toBe(false);
  });

  it('a quarter turn of roll swaps the window\'s two sides: a box beside the view at roll 0 is above it at roll 90 degrees', () => {
    const wide = halfWidth(100) * 0.8; // inside the horizontal half-width, far outside the vertical one
    const b = box(wide, 0, 0, 1, 1, 1);
    expect(visibleFraction(along(), b, A169)).toBe(1);
    expect(visibleFraction(along({ roll: Math.PI / 2 }), b, A169)).toBe(0); // now it would be up there, past the shorter half-height
    const high = box(0, -halfHeight(100) * 0.8, 0, 1, 1, 1);
    expect(visibleFraction(along({ roll: Math.PI / 2 }), high, A169)).toBe(1);
  });

  it('looking straight down still has a view', () => {
    const v = viewOf({ eye: [0, -100, 0], ref: [0, 0, 0], roll: 0, fovDeg: FOV }, A169);
    expect(v).not.toBeNull();
    expect(Math.abs(v!.forward[1])).toBeCloseTo(1, 9);
    expect(visibleFraction({ eye: [0, -100, 0], ref: [0, 0, 0], roll: 0, fovDeg: FOV }, box(0, 0, 0), A169)).toBe(1);
  });
});

describe('apparent size and the helpers', () => {
  it('a box takes half the height at twice the distance', () => {
    const near = apparentHeight(along({ eye: [0, 0, -100] }), box(0, 0, 0, 2, 4, 2), A169);
    const far = apparentHeight(along({ eye: [0, 0, -200] }), box(0, 0, 0, 2, 4, 2), A169);
    expect(near).toBeGreaterThan(0);
    expect(far / near).toBeCloseTo(0.5, 1);
    expect(apparentHeight(along(), box(0, 0, -300), A169)).toBe(0);
  });

  it('centreOf and unionOf', () => {
    expect(centreOf({ min: [0, -2, 4], max: [2, 2, 8] })).toEqual([1, 0, 6]);
    expect(unionOf([])).toBeNull();
    const u = unionOf([box(0, 0, 0, 2, 2, 2), box(10, -5, 3, 2, 2, 2)])!;
    expect(u.min).toEqual([-1, -6, -1]);
    expect(u.max).toEqual([11, 1, 4]);
  });

  it('the lattice is the documented size', () => {
    expect(LATTICE).toBe(6);
  });
});

// ------------------------------------------------------------------ the finding the audit pinned (public constants only)

/** A party member's box at a slot: feet at the slot's y, 18 units tall and 8 wide (Tidus's size, in FFX units; Y is down, so up is minus). */
const partyBox = (slot: readonly [number, number, number]): Box => ({ min: [slot[0] - 4, slot[1] - 18, slot[2] - 4], max: [slot[0] + 4, slot[1], slot[2] + 4] });
const viewPose = (v: typeof FFX_NEAR_VIEW): ViewPose => ({ eye: ffxEye(v), ref: v.ref, roll: 0, fovDeg: ffxVerticalFov(v.scrDpt) });

describe('the two default views against the party at its slots (what the audit found)', () => {
  it('the NEAR default view holds all three party slots, at 16:9 and at 4:3', () => {
    for (const aspect of [A169, 4 / 3]) for (const slot of FFX_PARTY_SLOTS) expect(visibleFraction(viewPose(FFX_NEAR_VIEW), partyBox(slot), aspect)).toBeGreaterThanOrEqual(SEEN_MIN);
  });

  it('the FAR default view, as the script states it, holds none of them at 4:3 and at most the edge of the line at 16:9', () => {
    for (const slot of FFX_PARTY_SLOTS) expect(visibleFraction(viewPose(FFX_FAR_VIEW), partyBox(slot), 4 / 3)).toBe(0);
    for (const slot of FFX_PARTY_SLOTS) expect(visibleFraction(viewPose(FFX_FAR_VIEW), partyBox(slot), A169)).toBeLessThan(SEEN_MIN);
  });
});
