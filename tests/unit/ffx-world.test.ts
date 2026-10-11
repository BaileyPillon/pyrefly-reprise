/**
 * **The one transform from FFX battle coordinates to our world, and the Evrae fight's numbers through it** (`src/engine/ffx3d/ffxWorld.ts`, `ffxStaging.ts`; the hidden Fayth chapter's `ffx` skin and the
 * camera replay of phase 4; FFX only).
 *
 * The party's slots, Evrae's spots and the camera's eye and look-at are written in FFX's frame (right-handed, **y down**) and mapped by `world = FFX_UNIT * (x, -y, -z)`. What this file pins, every number
 * worked out by hand from `K = 1.75 / 18.15` (Tidus's 18.15 FFX units stand 1.75 world units, the painted Tidus):
 *
 * 1. **The scale and the rotation**: K, the matrix (a proper rotation scaled by K: determinant K cubed, positive: no mirror), `ffxPoint` against the matrix, the up vector (FFX's `(0, -1, 0)` is the world's
 *    `+Y`), and a point on the floor (`y = -35`) standing 3.37 up.
 * 2. **The fight's stand points**: the three party slots and Evrae's NEAR and FAR spots, to five decimals.
 * 3. **The camera**: the NEAR default view's eye in FFX's frame is the PS2 capture's `(-95.97, -136.09, 333.64)` to 0.01 (the polar rule is proven against it), and its world rig is the numbers below; the lens
 *    1024 is 26.38 degrees vertical, and 724 and 1824 are the 36.7 and 15.0 of the notes (624 is 42.075 by the formula; the notes' 41.8 is a slip).
 * 4. **Facing**: `yawToward` turns a model that faces +Z (the converted files) toward a point, whichever way the opponent stands.
 *
 * Game case: FFX only (the numbers are FFX's).
 */
import { Matrix4, Object3D, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { FFX_EVRAE_SPOTS, FFX_NEAR_VIEW, FFX_FAR_VIEW, FFX_PARTY_SLOTS, FFX_STAGE_PARTS, ffxFaythStaging } from '../../src/engine/ffx3d/ffxStaging.ts';
import {
  FFX_TIDUS_HEIGHT,
  FFX_UNIT,
  WORLD_TIDUS_HEIGHT,
  ffxDirection,
  ffxEye,
  ffxLength,
  ffxPoint,
  ffxPointTuple,
  ffxRig,
  ffxVerticalFov,
  ffxWorldMatrix,
  yawToward,
  type Vec3,
} from '../../src/engine/ffx3d/ffxWorld.ts';

const K = 1.75 / 18.15; // 0.0964187327...
const near = (got: readonly number[], want: readonly number[], digits = 5): void => {
  expect(got).toHaveLength(want.length);
  want.forEach((w, i) => expect(got[i], `component ${i}`).toBeCloseTo(w, digits));
};

describe('the transform', () => {
  it('scales by Tidus: 18.15 FFX units are 1.75 world units, so a unit is 0.09642 and the model of the notes (18.1467) stands 1.7497', () => {
    expect(FFX_TIDUS_HEIGHT).toBe(18.15);
    expect(WORLD_TIDUS_HEIGHT).toBe(1.75);
    expect(FFX_UNIT).toBeCloseTo(K, 15);
    expect(FFX_UNIT).toBeCloseTo(0.0964187, 7);
    expect(1 / FFX_UNIT).toBeCloseTo(10.3714286, 6);
    expect(18.1467 * FFX_UNIT).toBeCloseTo(1.7497, 4);
    expect(ffxLength(18.15)).toBeCloseTo(1.75, 12);
  });

  it('is the half turn about X (x, -y, -z) times K: a proper rotation, never a mirror', () => {
    const m = ffxWorldMatrix();
    expect(m.elements).toEqual([K, 0, 0, 0, 0, -K, 0, 0, 0, 0, -K, 0, 0, 0, 0, 1]); // column-major: diag(K, -K, -K)
    expect(m.determinant()).toBeCloseTo(K * K * K, 15); // positive: the axes keep their handedness
    const out = new Matrix4();
    expect(ffxWorldMatrix(out)).toBe(out); // fills the matrix it is given
  });

  it('ffxPoint is the matrix, written out: the same answer for any point', () => {
    const m = ffxWorldMatrix();
    for (const p of [[0, 0, 0], [1, 2, 3], [-25, -35, 120], [87, -55, 55], [-850, -35, 80], [12.5, 400, -77]] as Vec3[]) {
      const viaMatrix = new Vector3(...p).applyMatrix4(m);
      near(ffxPoint(p).toArray(), viaMatrix.toArray(), 12);
      near(ffxPointTuple(p), viaMatrix.toArray(), 12);
    }
  });

  it('turns FFX\'s up (negative y) into the world\'s +Y and puts a point on the floor (y = -35) 3.37 units up', () => {
    near(ffxDirection([0, -1, 0]).toArray(), [0, 1, 0], 15); // a direction takes the rotation and no scale
    near(ffxDirection([1, 2, 3]).toArray(), [1, -2, -3], 15);
    expect(ffxPoint([0, -35, 0]).y).toBeCloseTo(35 * K, 12);
    expect(ffxPoint([0, -35, 0]).y).toBeCloseTo(3.37466, 5);
  });
});

describe('the Evrae fight\'s stand points', () => {
  it('maps the three party slots (FFX frame -> world), to five decimals', () => {
    // by hand: (-25 K, 35 K, -120 K), (-20 K, 35 K, -80 K), (-15.000015 K, 35 K, -40 K), K = 0.09641873278
    near(ffxPointTuple(FFX_PARTY_SLOTS[0]!), [-2.41047, 3.37466, -11.57025]);
    near(ffxPointTuple(FFX_PARTY_SLOTS[1]!), [-1.92837, 3.37466, -7.7135]);
    near(ffxPointTuple(FFX_PARTY_SLOTS[2]!), [-1.44628, 3.37466, -3.85675]);
    expect(FFX_PARTY_SLOTS).toEqual([[-25, -35, 120], [-20, -35, 80], [-15.000015, -35, 40]]);
  });

  it('maps Evrae\'s NEAR and FAR spots', () => {
    expect(FFX_EVRAE_SPOTS).toEqual({ near: [-140, -35, 80], far: [-850, -35, 80] });
    near(ffxPointTuple(FFX_EVRAE_SPOTS.near), [-13.49862, 3.37466, -7.7135]); // -140 K, 35 K, -80 K
    near(ffxPointTuple(FFX_EVRAE_SPOTS.far), [-81.95592, 3.37466, -7.7135]); // -850 K
  });

  it('hands the scene seven party slots (three at FFX\'s, four reserve), Evrae pinned on NEAR, and a rig per range', () => {
    const s = ffxFaythStaging();
    expect(s.partySlots).toHaveLength(7);
    near(s.partySlots[0]!.toArray(), [-2.41047, 3.37466, -11.57025]);
    expect(s.enemySlots).toHaveLength(2);
    near(s.enemySpots.evrae, [-13.49862, 3.37466, -7.7135]);
    near(s.enemySpots.cid, s.enemySpots.evrae);
    near(s.spots.far, [-81.95592, 3.37466, -7.7135]);
    // fresh objects every call: one scene's edit is not another's
    const again = ffxFaythStaging();
    expect(again.partySlots[0]).not.toBe(s.partySlots[0]);
    expect(again.enemySpots).not.toBe(s.enemySpots);
  });
});

describe('the camera', () => {
  it('puts the NEAR default eye at the PS2 capture\'s (-95.97, -136.09, 333.64) to 0.01, above the look-at (negative y is up)', () => {
    const eye = ffxEye(FFX_NEAR_VIEW);
    near(eye, [-95.9677, -136.0921, 333.6406], 3); // the script's constants through the polar rule
    expect(Math.abs(eye[0] - -95.97)).toBeLessThan(0.01);
    expect(Math.abs(eye[1] - -136.09)).toBeLessThan(0.01);
    expect(Math.abs(eye[2] - 333.64)).toBeLessThan(0.01);
    expect(eye[1]).toBeLessThan(FFX_NEAR_VIEW.ref[1]); // above
    // the eye is `len` from the look-at
    expect(Math.hypot(eye[0] - FFX_NEAR_VIEW.ref[0], eye[1] - FFX_NEAR_VIEW.ref[1], eye[2] - FFX_NEAR_VIEW.ref[2])).toBeCloseTo(342, 9);
  });

  it('maps the NEAR view to the world rig: eye (-9.25309, 13.12182, -32.16921) looking at (-2.95991, 3.37366, -1.30282), 26.38 degrees vertical, no sway', () => {
    const rig = ffxRig(FFX_NEAR_VIEW);
    near(rig.position, [-9.25309, 13.12182, -32.16921]);
    near(rig.lookAt, [-2.95991, 3.37366, -1.30282]);
    expect(rig.fov).toBeCloseTo(26.3812, 4);
    expect(rig.sway).toBe(0);
    // through the matrix: the same
    const viaMatrix = new Vector3(...ffxEye(FFX_NEAR_VIEW)).applyMatrix4(ffxWorldMatrix());
    near(rig.position, viaMatrix.toArray(), 12);
    // the party is in front of the camera, and the camera is above the floor it looks at
    expect(rig.position[1]).toBeGreaterThan(rig.lookAt[1]);
  });

  it('maps the FAR view: eye (1.78068, 7.82266, 17.74095) looking at (8.38843, 5.30303, -5.30303)', () => {
    const rig = ffxRig(FFX_FAR_VIEW);
    near(ffxEye(FFX_FAR_VIEW), [18.468237, -81.132116, -183.998975], 4);
    near(rig.position, [1.78068, 7.82266, 17.74095]);
    near(rig.lookAt, [8.38843, 5.30303, -5.30303]);
    expect(rig.fov).toBeCloseTo(26.3812, 4);
  });

  it('keeps the lens vertical: 1024 is 26.38 degrees, 724 is 36.7, 1824 is 15.0 (and 624 is 42.075: 2 atan(240 / 624), by hand)', () => {
    expect(ffxVerticalFov(1024)).toBeCloseTo(26.3812, 4);
    expect(ffxVerticalFov(724)).toBeCloseTo(36.7, 1);
    expect(ffxVerticalFov(624)).toBeCloseTo(42.075, 3);
    expect(ffxVerticalFov(1824)).toBeCloseTo(15.0, 1);
  });
});

describe('facing', () => {
  /** Where a model that faces +Z looks after `rotation.y = yaw`, in x and z. */
  const facing = (yaw: number): [number, number] => {
    const o = new Object3D();
    o.rotation.y = yaw;
    o.updateMatrixWorld(true);
    const d = new Vector3();
    o.getWorldDirection(d); // +Z of the object in the world
    return [d.x, d.z];
  };

  it('turns the party toward Evrae (-x) and Evrae toward the party (+x)', () => {
    const slot1 = FFX_PARTY_SLOTS[1]!;
    const toEvrae = yawToward(slot1, FFX_EVRAE_SPOTS.near);
    expect(toEvrae).toBeCloseTo(-Math.PI / 2, 12); // the same z: straight along -x
    near(facing(toEvrae), [-1, 0], 12);
    const toParty = yawToward(FFX_EVRAE_SPOTS.near, slot1);
    expect(toParty).toBeCloseTo(Math.PI / 2, 12);
    near(facing(toParty), [1, 0], 12);
  });

  it('follows the opponent\'s z: slot 0 (z 120) turns a little toward Evrae\'s side, slot 2 (z 40) the other way; FFX z is world -z', () => {
    const [x0, z0] = facing(yawToward(FFX_PARTY_SLOTS[0]!, FFX_EVRAE_SPOTS.near));
    const [x2, z2] = facing(yawToward(FFX_PARTY_SLOTS[2]!, FFX_EVRAE_SPOTS.near));
    expect(x0).toBeLessThan(0);
    expect(x2).toBeLessThan(0);
    expect(z0).toBeGreaterThan(0); // Evrae (z 80) is nearer the camera-far side than slot 0 (z 120): world +z
    expect(z2).toBeLessThan(0);
    // by hand: slot 0 -> Evrae is (-115, ., -40) in FFX, (-115, +40) in x and z of the world: atan2(-115, 40)
    expect(yawToward(FFX_PARTY_SLOTS[0]!, FFX_EVRAE_SPOTS.near)).toBeCloseTo(Math.atan2(-115, 40), 12);
  });

  it('is 0 toward the same point, or one straight above it', () => {
    expect(yawToward([1, -35, 2], [1, -35, 2])).toBe(0);
    expect(yawToward([1, -35, 2], [1, -90, 2])).toBe(0);
  });
});

describe('the stage the battle draws', () => {
  const draws = (name: string): 'flipped' | 'sky' | 'hidden' =>
    FFX_STAGE_PARTS.flipped.some((re) => re.test(name)) ? 'flipped' : FFX_STAGE_PARTS.sky.some((re) => re.test(name)) ? 'sky' : 'hidden';

  it('names the deck\'s meshes (mirrored in y) and the sky\'s, and nothing else', () => {
    for (let i = 1; i <= 7; i++) expect(draws(`polySurfaceShape5_${i}`)).toBe('flipped');
    expect(draws('FBXASC048_Shape0_1')).toBe('flipped');
    expect(draws('FBXASC048_Shape0_3')).toBe('flipped');
    expect(draws('FBXASC0490_0Shape')).toBe('sky');
    expect(draws('FBXASC0490_1Shape')).toBe('sky');
    // everything else the converted stage holds is left out: the flares, the superstructure, the ring, the hull, the walls
    for (const name of ['FBXASC048_Shape0_2', 'FBXASC048_Shape0_10', 'FBXASC050_0Shape_4', 'FBXASC050_0Shape_8', 'FBXASC054_0Shape_5', 'polySurfaceShape3_1', 'polySurfaceShape6', 'polySurfaceShape5', 'polySurfaceShape5_x', 'pCylinderShape1', 'FBXASC04901_0Shape']) {
      expect(draws(name), name).toBe('hidden');
    }
  });
});
