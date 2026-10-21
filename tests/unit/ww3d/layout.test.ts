/**
 * **The Wind Waker chapter's layout and camera maths** (`src/engine/ww3d/layout.ts`, `camera.ts`; FFX-2 only), pinned without a browser: where the four figures stand, how big they are, the fit of a model to a figure, the
 * body and head turns, the file URLs, and the target shot against the look lab's measured framing of TARGET-C.
 */
import { describe, expect, it } from 'vitest';

import { RIGS, TARGET_FOV, TARGET_PITCH_DEG, TARGET_POSITION, boxOf, figureBoxes, horizonY, overlapOf, pitchOf, pitchedLook, project } from '../../../src/engine/ww3d/camera.ts';
import {
  BODY_OFF_DEG,
  BOSS_HEIGHT,
  BOSS_HOVER,
  BOSS_SPOT,
  CAST_SCALE,
  ENEMY_SLOTS,
  FACE_OFF_DEG,
  HEAD_TURN_MAX_DEG,
  MODEL_FILE,
  NATIVE_HEIGHT,
  PARTY_HEIGHT,
  PARTY_SLOTS,
  WORLD_HEIGHT,
  WW_BOSS_ID,
  WW_CAST,
  WW_PARTY_IDS,
  bodyYaw,
  castGlow,
  fitBox,
  headTurn,
  heightFactor,
  isWwId,
  looksLikeGlb,
  modelUrl,
  rad,
  swapUrl,
  wrapAngle,
  yawToward,
} from '../../../src/engine/ww3d/layout.ts';

const ASPECT = 16 / 9;

describe('the cast and the files', () => {
  it('is the three girls and Valefor, by chapter 24\'s combatant ids; the files are named for them', () => {
    expect([...WW_PARTY_IDS]).toEqual(['yuna', 'rikku', 'paine']);
    expect(WW_BOSS_ID).toBe('x2-valefor');
    expect(WW_CAST).toEqual(['yuna', 'rikku', 'paine', 'x2-valefor']);
    expect(MODEL_FILE).toEqual({ yuna: 'yuna', rikku: 'rikku', paine: 'paine', 'x2-valefor': 'valefor' });
    expect(WW_CAST.every(isWwId)).toBe(true);
    expect(isWwId('bahamut')).toBe(false);
  });

  it('builds the model and swap URLs under the page base, with or without a trailing slash', () => {
    expect(modelUrl('/', 'models-exp/windwaker', 'yuna')).toBe('/models-exp/windwaker/yuna.glb');
    expect(modelUrl('/play', 'models-exp/windwaker', 'x2-valefor')).toBe('/play/models-exp/windwaker/valefor.glb');
    expect(swapUrl('/', 'models-exp/windwaker/props', 'pistol')).toBe('/models-exp/windwaker/props/pistol.glb');
    expect(swapUrl('/x/', 'models-exp/windwaker/temple', 'wall')).toBe('/x/models-exp/windwaker/temple/wall.glb');
  });

  it('judges a body by its first four bytes: a dev server\'s index page is not a model', () => {
    const glb = new Uint8Array(12);
    glb.set([0x67, 0x6c, 0x54, 0x46]);
    expect(looksLikeGlb(glb)).toBe(true);
    expect(looksLikeGlb(glb.buffer)).toBe(true);
    expect(looksLikeGlb(new TextEncoder().encode('<!doctype html><html></html>'))).toBe(false);
    expect(looksLikeGlb(new Uint8Array(3))).toBe(false);
  });
});

describe('where they stand and how big they are', () => {
  it('has the party\'s three active slots in the lab\'s diagonal and four reserves off the frame to the left', () => {
    expect(PARTY_SLOTS).toHaveLength(7);
    expect(PARTY_SLOTS.slice(0, 3)).toEqual([[-0.34, 0, 0.89], [-0.05, 0, -0.16], [0.69, 0, -1.28]]);
    // the diagonal recedes to the right: Yuna nearest, Paine furthest; none behind another at the target camera
    expect(PARTY_SLOTS[0]![2]).toBeGreaterThan(PARTY_SLOTS[1]![2]);
    expect(PARTY_SLOTS[1]![2]).toBeGreaterThan(PARTY_SLOTS[2]![2]);
    expect(PARTY_SLOTS[0]![0]).toBeLessThan(PARTY_SLOTS[1]![0]);
    expect(PARTY_SLOTS[1]![0]).toBeLessThan(PARTY_SLOTS[2]![0]);
    // the reserves are on the floor, left of every active slot and off the frame at every rig (checked below)
    for (const r of PARTY_SLOTS.slice(3)) {
      expect(r[1]).toBe(0);
      expect(r[0]).toBeLessThan(-8);
    }
    expect(new Set(PARTY_SLOTS.map((s) => s.join(','))).size).toBe(7);
  });

  it('puts Valefor right and back of the party, on the ground (her hover is the model\'s), with the other slots as reserves', () => {
    expect(BOSS_SPOT).toEqual([4.0, 0, -3.3]);
    expect(ENEMY_SLOTS[0]).toBe(BOSS_SPOT);
    expect(BOSS_SPOT[0]).toBeGreaterThan(PARTY_SLOTS[2]![0]);
    expect(BOSS_SPOT[2]).toBeLessThan(PARTY_SLOTS[2]![2]);
    expect(BOSS_HOVER).toBe(0.9);
  });

  it('gives each figure the lab\'s world height: one cast scale for the girls, Valefor a little smaller against them', () => {
    expect(CAST_SCALE).toBe(1.25);
    expect(WORLD_HEIGHT.yuna).toBeCloseTo(1.5, 10);
    expect(WORLD_HEIGHT.rikku).toBeCloseTo(1.4375, 10);
    expect(WORLD_HEIGHT.paine).toBeCloseTo(1.5625, 10);
    expect(WORLD_HEIGHT[WW_BOSS_ID]).toBeCloseTo(NATIVE_HEIGHT[WW_BOSS_ID] * 1.25 * 0.95, 10);
    expect(PARTY_HEIGHT).toBe(WORLD_HEIGHT.yuna);
    expect(BOSS_HEIGHT).toBe(WORLD_HEIGHT[WW_BOSS_ID]);
    // "Wind Waker short": a girl is about three heads, so well under two metres, and the aeon is two to three times her height
    for (const id of WW_PARTY_IDS) expect(WORLD_HEIGHT[id]).toBeLessThan(1.7);
    expect(BOSS_HEIGHT / PARTY_HEIGHT).toBeGreaterThan(2);
    expect(BOSS_HEIGHT / PARTY_HEIGHT).toBeLessThan(3.2);
  });

  it('scales each figure from the stage\'s height by its share: Rikku shorter than Yuna, Paine taller, Valefor 1 against the boss height', () => {
    expect(heightFactor('yuna')).toBeCloseTo(1, 10);
    expect(heightFactor('rikku')).toBeLessThan(1);
    expect(heightFactor('paine')).toBeGreaterThan(1);
    expect(heightFactor(WW_BOSS_ID)).toBeCloseTo(1, 10);
    expect(PARTY_HEIGHT * heightFactor('paine')).toBeCloseTo(WORLD_HEIGHT.paine, 10);
  });
});

describe('fitting a model to a figure', () => {
  const box = { min: [-0.3, 0.1, -0.2] as const, max: [0.5, 1.3, 0.2] as const };

  it('scales the box\'s height to the figure\'s and puts the footprint\'s centre on the origin and the lowest point on the floor', () => {
    const f = fitBox(box, 1.5);
    expect(f.scale).toBeCloseTo(1.25, 10);
    expect(f.offset[0]).toBeCloseTo(-0.1 * 1.25, 10); // the footprint's centre x is 0.1
    expect(f.offset[1]).toBeCloseTo(-0.1 * 1.25, 10); // the lowest point is 0.1
    expect(f.offset[2]).toBeCloseTo(0, 10);
  });

  it('fits Valefor (even wings) about the centre of her footprint, uses an anchor when one is given, and the standing pose\'s lowest point when it is', () => {
    const wide = { min: [-3.28, 0, -1.34] as const, max: [3.341, 3.5, 0.687] as const }; // valefor-v2.glb
    const f = fitBox(wide, BOSS_HEIGHT);
    expect(f.scale).toBeCloseTo(BOSS_HEIGHT / 3.5, 10);
    expect(f.offset[0]).toBeCloseTo(-0.0305 * f.scale, 10);
    expect(f.offset[2]).toBeCloseTo(0.3265 * f.scale, 10);
    const anchored = fitBox(wide, BOSS_HEIGHT, { anchor: [0.1, -0.5] });
    expect(anchored.offset[0]).toBeCloseTo(-0.1 * f.scale, 10);
    expect(anchored.offset[2]).toBeCloseTo(0.5 * f.scale, 10);
    const crouch = fitBox(box, 1.5, { groundY: 0.25 });
    expect(crouch.offset[1]).toBeCloseTo(-0.25 * 1.25, 10);
  });

  it('fits a flat or empty file at scale 1 rather than dividing by zero, so a bad file shows as a bad model', () => {
    const flat = fitBox({ min: [0, 1, 0], max: [1, 1, 1] }, 1.5);
    expect(flat.scale).toBe(1);
    expect(Number.isFinite(flat.offset[1])).toBe(true);
  });
});

describe('the body and the head turn', () => {
  it('wraps angles and reads the yaw of a direction on the floor (0 faces +Z)', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 10);
    expect(Math.abs(wrapAngle(-3 * Math.PI))).toBeCloseTo(Math.PI, 10);
    expect(wrapAngle(0.5 + 2 * Math.PI)).toBeCloseTo(0.5, 10);
    expect(yawToward([0, 0, 0], [0, 0, 5])).toBeCloseTo(0, 10);
    expect(yawToward([0, 0, 0], [5, 0, 0])).toBeCloseTo(Math.PI / 2, 10);
    expect(yawToward([0, 0, 0], [0, 9, -5])).toBeCloseTo(Math.PI, 10);
  });

  it('turns a girl\'s body BODY_OFF degrees off the direction to the lens, toward the right, whatever the stance twist is', () => {
    expect(BODY_OFF_DEG).toBe(62);
    const slot = PARTY_SLOTS[0]!;
    for (const stance of [0, 0.4, -0.9]) {
      const y = bodyYaw(slot, TARGET_POSITION, stance);
      // the body points at yaw `y + stance`: it is BODY_OFF past the direction to the camera
      expect(wrapAngle(y + stance - yawToward(slot, TARGET_POSITION))).toBeCloseTo(rad(62), 10);
    }
  });

  it('turns the head so the face is FACE_OFF off the camera, never more than the limit from the clip, and not at all when it already is', () => {
    expect(FACE_OFF_DEG).toBe(46);
    const head: [number, number, number] = [0, 1.2, 0];
    const toCam = yawToward(head, TARGET_POSITION);
    expect(headTurn(head, TARGET_POSITION, toCam + rad(46))).toBeCloseTo(0, 10);
    expect(headTurn(head, TARGET_POSITION, toCam + rad(26))).toBeCloseTo(rad(20), 10);
    expect(headTurn(head, TARGET_POSITION, toCam + rad(170))).toBeCloseTo(-rad(HEAD_TURN_MAX_DEG), 10);
    expect(headTurn(head, TARGET_POSITION, toCam - rad(100))).toBeCloseTo(rad(HEAD_TURN_MAX_DEG), 10);
  });

  it('swells the cast glow from nothing and breathes between about 0.35 and 0.75', () => {
    expect(castGlow(0)).toBeCloseTo(0.35, 10);
    for (let t = 1; t < 10; t += 0.1) {
      expect(castGlow(t)).toBeGreaterThan(0.3);
      expect(castGlow(t)).toBeLessThan(0.8);
    }
  });
});

describe('the target shot (TARGET-C) as the look lab framed it', () => {
  const idle = RIGS['idle']!;
  const boxes = figureBoxes(idle, ASPECT, BOSS_HOVER);

  it('is a low camera at (1.0, 0.37, 3.2), pitched 15.6 degrees, a 49 degree lens, the horizon at about 0.80 of the frame', () => {
    expect(TARGET_POSITION).toEqual([1.0, 0.37, 3.2]);
    expect(idle.position).toEqual(TARGET_POSITION);
    expect(idle.fov).toBe(TARGET_FOV);
    expect(TARGET_FOV).toBe(49);
    expect(pitchOf(idle)).toBeCloseTo(TARGET_PITCH_DEG, 5);
    expect(horizonY(idle)).toBeGreaterThan(0.77);
    expect(horizonY(idle)).toBeLessThan(0.84);
    expect(pitchedLook([1, 0.37, 3.2], 0)).toEqual([1, 0.37, -6.8]);
  });

  it('puts the girls where the lab measured them against TARGET-C (x within 0.06, the head within 0.08, the feet within 0.06)', () => {
    // the lab's table (look-lab/PROGRESS.md, run 3): left, right, top, bottom as fractions of the frame, in the combat stance
    const lab = { yuna: [0.02, 0.29, 0.35, 1.0], rikku: [0.25, 0.4, 0.47, 0.94], paine: [0.42, 0.52, 0.54, 0.9] } as const;
    for (const id of WW_PARTY_IDS) {
      const b = boxes[id];
      const [l, r, t, bt] = lab[id];
      expect(b.left, `${id} left`).toBeGreaterThan(l - 0.06);
      expect(b.left, `${id} left`).toBeLessThan(l + 0.06);
      expect(b.right, `${id} right`).toBeGreaterThan(r - 0.06);
      expect(b.right, `${id} right`).toBeLessThan(r + 0.06);
      expect(b.top, `${id} top`).toBeGreaterThan(t - 0.08);
      expect(b.top, `${id} top`).toBeLessThan(t + 0.08);
      expect(b.bottom, `${id} bottom`).toBeGreaterThan(bt - 0.06);
      expect(b.bottom, `${id} bottom`).toBeLessThan(bt + 0.06);
    }
  });

  it('fills the right half with Valefor, her body whole and above the HUD, with the girls on the left and none hidden behind another', () => {
    const v = boxes[WW_BOSS_ID];
    expect(v.left).toBeGreaterThan(0.35);
    expect(v.right).toBeGreaterThan(0.95); // her wings reach past the frame's edge, as TARGET-C's
    expect(v.top).toBeGreaterThanOrEqual(0);
    expect(v.bottom).toBeLessThan(0.8); // the bottom fifth is the HUD's
    for (const id of WW_PARTY_IDS) expect(boxes[id].right, id).toBeLessThan(v.left + 0.12);
    // TARGET-C overlaps them a little too (Yuna's arm in front of Rikku): the staggered diagonal keeps it under a third of the smaller figure
    expect(overlapOf(boxes.yuna, boxes.rikku)).toBeLessThan(0.3);
    expect(overlapOf(boxes.rikku, boxes.paine)).toBeLessThan(0.3);
  });

  it('keeps the girls\' feet at or above the bottom of the frame at every rig that shows them, and the reserves off it', () => {
    for (const [name, rig] of Object.entries(RIGS)) {
      for (const [i, slot] of PARTY_SLOTS.entries()) {
        const p = project(rig, ASPECT, slot);
        if (i >= 3) expect(p.x < -0.05 || p.x > 1.05 || p.depth <= 0, `${name}: reserve ${i} is off the frame (x ${p.x.toFixed(2)})`).toBe(true);
      }
    }
    const girls = (r: (typeof RIGS)[string]) => WW_PARTY_IDS.map((_id, k) => boxOf(r, ASPECT, PARTY_SLOTS[k]!, PARTY_HEIGHT, 0.34));
    for (const name of ['idle', 'action', 'party', 'victory', 'intro']) for (const b of girls(RIGS[name]!)) expect(b.bottom, name).toBeLessThan(1.12);
  });

  it('publishes the rigs the presenter asks for by name, each with a lens and a place that looks somewhere else', () => {
    for (const name of ['intro', 'idle', 'action', 'party', 'enemy', 'victory', 'reveal']) {
      const r = RIGS[name]!;
      expect(r, name).toBeDefined();
      expect(r.fov, name).toBeGreaterThan(20);
      expect(r.fov, name).toBeLessThan(60);
      expect(r.position.join(), name).not.toBe(r.lookAt.join());
    }
    // the sway the presenter adds is small, and the idle (the shot the HUD is laid out on) has none
    expect(idle.sway).toBeUndefined();
  });

  it('shows all of Valefor at the wide opening shot, and the girls whole at the party and victory shots', () => {
    const intro = figureBoxes(RIGS['intro']!, ASPECT, BOSS_HOVER);
    expect(intro[WW_BOSS_ID].left).toBeGreaterThan(0);
    expect(intro[WW_BOSS_ID].right).toBeLessThan(1);
    expect(intro[WW_BOSS_ID].top).toBeGreaterThan(0);
    for (const name of ['party', 'victory']) {
      const b = figureBoxes(RIGS[name]!, ASPECT, BOSS_HOVER);
      for (const id of WW_PARTY_IDS) {
        expect(b[id].left, `${name} ${id}`).toBeGreaterThan(0);
        expect(b[id].right, `${name} ${id}`).toBeLessThan(1);
        expect(b[id].top, `${name} ${id}`).toBeGreaterThan(0);
      }
    }
  });
});
