/**
 * **Frame A's layout and camera maths** (`src/engine/yrp3d/layout.ts`; the hidden 3D Bahamut chapter, FFX-2 only), held without a renderer: where the four figures stand on the screen at 16:9 and at the window shapes either
 * side of it, that the painting's plane fills the frame behind them, how a model is fitted to a figure, where the model files are looked for and the toon ramp's shape.
 *
 * The target is Bailey's picked end-state frame A (the art room's picture, "classic, now in 3D"): Bahamut on the left with his wings over the left half, the trio in a loose diagonal on the right (Paine at the back,
 * Rikku in the middle, Yuna at the front), calm floor along the bottom. These tests are that picture's limits as numbers; they do not look at pixels (the browser pass does).
 */
import { describe, expect, it } from 'vitest';

import {
  BOSS_HEIGHT,
  BOSS_SPOT,
  BOSS_YAW,
  ENEMY_SLOTS,
  FRAME_A_BOXES,
  HALF_WIDTH,
  PARTY_HEIGHT,
  PARTY_SLOTS,
  PARTY_YAW,
  RIGS,
  TOON,
  boxOf,
  castGlow,
  figureBoxes,
  fitBox,
  isYrpId,
  looksLikeGlb,
  modelUrl,
  overlapOf,
  planeMiss,
  project,
  rampAt,
  yawFor,
  YRP_BOSS_ID,
  YRP_CAST,
  YRP_PARTY_IDS,
} from '../../../src/engine/yrp3d/layout.ts';

/** Chapter IV's painting plane as `scenes/bevelle-underground.ts` builds it: 78 wide with the wings 18 either side, 44.6 tall at z -50, centred at y -2.82. */
const PLANE = { z: -50, width: 78 + 2 * 18, height: 44.6, centreY: -2.82 };
const ASPECTS = [16 / 10, 16 / 9, 21 / 9] as const;
const idle = RIGS['idle']!;

describe('the cast', () => {
  it('is the three girls and Bahamut, by the combatant ids of Chapter IV (which are also the model file names)', () => {
    expect([...YRP_PARTY_IDS]).toEqual(['yuna', 'rikku', 'paine']);
    expect(YRP_BOSS_ID).toBe('bahamut');
    expect([...YRP_CAST]).toEqual(['yuna', 'rikku', 'paine', 'bahamut']);
    expect(['yuna', 'bahamut', 'tidus', ''].map(isYrpId)).toEqual([true, true, false, false]);
  });

  it('stands the party on seven slots (the three active, four reserve parked off the frame) and Bahamut on the chamber axis, clear of the torn hole', () => {
    expect(PARTY_SLOTS).toHaveLength(7);
    expect(ENEMY_SLOTS[0]).toEqual(BOSS_SPOT);
    const HOLE = { x: 2.4, z: -7.8, rx: 2.5, rz: 1.6 }; // scenes/bevelle-underground.ts
    for (const [x, , z] of [...PARTY_SLOTS.slice(0, 3), BOSS_SPOT]) {
      expect(((x! - HOLE.x) / HOLE.rx) ** 2 + ((z! - HOLE.z) / HOLE.rz) ** 2, `(${x}, ${z}) is on the hole`).toBeGreaterThan(1.3);
    }
    for (const slot of PARTY_SLOTS.slice(3)) {
      for (const [name, rig] of Object.entries(RIGS)) {
        const p = project(rig, 16 / 9, slot);
        expect(p.depth <= 0 || p.x > 1.02 || p.x < -0.02 || p.y > 1.02 || p.y < -0.02, `a reserve spot is in the ${name} frame`).toBe(true);
      }
    }
  });

  it('turns the party toward Bahamut (left, -x) and a little to the lens, and Bahamut toward the party (right, +x): a three-quarter turn, not a profile', () => {
    expect(yawFor('yuna')).toBe(PARTY_YAW);
    expect(yawFor('bahamut')).toBe(BOSS_YAW);
    const facing = (yaw: number): [number, number] => [Math.sin(yaw), Math.cos(yaw)]; // a model faces +Z at yaw 0
    const [px, pz] = facing(PARTY_YAW);
    const [bx, bz] = facing(BOSS_YAW);
    expect([px < -0.7, pz > 0.2]).toEqual([true, true]);
    expect([bx > 0.7, bz > 0.2]).toEqual([true, true]);
  });
});

describe('frame A at the default camera', () => {
  for (const aspect of ASPECTS) {
    it(`window ${aspect.toFixed(2)}: the row is on the right and above the calm floor, Bahamut on the left, Paine at the back and left, Yuna at the front and right`, () => {
      const b = figureBoxes(idle, aspect);
      if (aspect > 1.7 && aspect < 1.8) {
        for (const id of YRP_PARTY_IDS) {
          expect(b[id].left, `${id} left`).toBeGreaterThanOrEqual(FRAME_A_BOXES.party.left);
          expect(b[id].right, `${id} right`).toBeLessThanOrEqual(FRAME_A_BOXES.party.right);
          expect(b[id].top, `${id} top`).toBeGreaterThanOrEqual(FRAME_A_BOXES.party.top);
          expect(b[id].bottom, `${id} feet`).toBeLessThanOrEqual(FRAME_A_BOXES.party.bottom);
        }
        expect(b.bahamut.left).toBeGreaterThanOrEqual(FRAME_A_BOXES.bahamut.left);
        expect(b.bahamut.right).toBeLessThanOrEqual(FRAME_A_BOXES.bahamut.right);
        expect(b.bahamut.top).toBeGreaterThanOrEqual(FRAME_A_BOXES.bahamut.top);
        expect(b.bahamut.bottom).toBeLessThanOrEqual(FRAME_A_BOXES.bahamut.bottom);
      }
      // the order of the diagonal, in every window: left to right Paine, Rikku, Yuna; the back is higher on the screen
      expect(b.paine.left).toBeLessThan(b.rikku.left);
      expect(b.rikku.left).toBeLessThan(b.yuna.left);
      expect(b.paine.bottom).toBeLessThan(b.rikku.bottom);
      expect(b.rikku.bottom).toBeLessThan(b.yuna.bottom);
      // the boss is left of the whole row, and the row is right of the screen's middle
      expect((b.paine.left + b.yuna.right) / 2).toBeGreaterThan(0.55);
      expect(b.bahamut.left + b.bahamut.right).toBeLessThan(1);
    });
  }

  it('is a loose row, not a pile: no two girls overlap by more than a third, and Paine clears Bahamut', () => {
    const b = figureBoxes(idle, 16 / 9);
    expect(overlapOf(b.paine, b.rikku)).toBeLessThan(0.33);
    expect(overlapOf(b.rikku, b.yuna)).toBeLessThan(0.33);
    expect(overlapOf(b.paine, b.yuna)).toBeLessThan(0.2);
    expect(b.paine.left - b.bahamut.right).toBeGreaterThan(0.01); // his box is the widest he stands: the wings' tips and the first girl are apart
  });

  it('fills the left half with Bahamut: more than half the frame tall, more than 0.3 of the frame across the half, his top at the frame\'s', () => {
    const { bahamut } = figureBoxes(idle, 16 / 9);
    expect(bahamut.bottom - bahamut.top).toBeGreaterThan(0.5);
    expect(Math.min(bahamut.right, 0.5) - Math.max(bahamut.left, 0)).toBeGreaterThan(0.3);
    expect(bahamut.top).toBeLessThan(0.1);
  });

  it('keeps the bottom tenth of the frame calm for the HUD: no foot lands below 0.9 of the height at any window', () => {
    for (const aspect of ASPECTS) for (const id of YRP_CAST) expect(figureBoxes(idle, aspect)[id].bottom, `${id} at ${aspect}`).toBeLessThan(0.9);
  });

  it('puts the girls at about a quarter of the frame\'s height and Bahamut at well over twice that (a giant over three girls)', () => {
    const b = figureBoxes(idle, 16 / 9);
    for (const id of YRP_PARTY_IDS) expect(b[id].bottom - b[id].top, id).toBeGreaterThan(0.22);
    expect((b.bahamut.bottom - b.bahamut.top) / (b.yuna.bottom - b.yuna.top)).toBeGreaterThan(1.7);
    expect(BOSS_HEIGHT / PARTY_HEIGHT).toBeGreaterThan(2.2);
  });
});

describe('the other rigs', () => {
  it('publish every name the presenter, the scripts and the moments ask for, plus the overdrive', () => {
    expect(Object.keys(RIGS).sort()).toEqual(['action', 'bahamut', 'enemy', 'idle', 'intro', 'overdrive', 'party', 'victory']);
    for (const rig of Object.values(RIGS)) {
      expect(rig.fov).toBeGreaterThan(25);
      expect(rig.fov).toBeLessThan(60);
      expect(rig.position[1]).toBeGreaterThan(0.5);
    }
  });

  it('the intro is the establishing shot: higher and further back than the idle, with the whole fight smaller in the frame', () => {
    const intro = RIGS['intro']!;
    expect(intro.position[1]).toBeGreaterThan(idle.position[1] + 2);
    expect(intro.position[2]).toBeGreaterThan(idle.position[2] + 5);
    const b = figureBoxes(intro, 16 / 9);
    const a = figureBoxes(idle, 16 / 9);
    expect(b.bahamut.bottom - b.bahamut.top).toBeLessThan(a.bahamut.bottom - a.bahamut.top);
    for (const id of YRP_CAST) expect(b[id].left).toBeGreaterThan(0);
  });

  it('the action rig is frame B\'s: lower, closer and wider than the idle, the girls and Bahamut both in the frame', () => {
    const action = RIGS['action']!;
    expect(action.position[1]).toBeLessThan(idle.position[1] - 1);
    expect(action.fov).toBeGreaterThan(idle.fov);
    const b = figureBoxes(action, 16 / 9);
    for (const id of YRP_CAST) {
      expect(b[id].right, id).toBeGreaterThan(0.1);
      expect(b[id].left, id).toBeLessThan(0.99);
    }
    expect(b.bahamut.left).toBeGreaterThan(-0.1);
  });

  it('the overdrive rig is frame C\'s: behind and above the trio (on their side, looking along their axis toward Bahamut), wide, the girls low in the frame in frame C\'s order and Bahamut above and between', () => {
    const od = RIGS['overdrive']!;
    expect(od.position[0]).toBeGreaterThan(PARTY_SLOTS[0]![0] + 3); // behind the party: further from Bahamut than the nearest girl
    expect(od.position[1]).toBeGreaterThan(PARTY_HEIGHT); // above their heads
    expect(od.lookAt[0]).toBeLessThan(0); // toward Bahamut
    expect(od.fov).toBeGreaterThanOrEqual(46);
    const b = figureBoxes(od, 16 / 9);
    // seen from behind along the axis, Yuna (z 0.2) is on the left and Paine (z -2.2) on the right
    expect(b.yuna.left).toBeLessThan(b.rikku.left);
    expect(b.rikku.left).toBeLessThan(b.paine.left);
    for (const id of YRP_PARTY_IDS) expect(b[id].top, id).toBeGreaterThan(0.5); // low in the frame
    expect(b.bahamut.top).toBeLessThan(0.3);
    expect((b.bahamut.left + b.bahamut.right) / 2).toBeGreaterThan(0.35);
    expect((b.bahamut.left + b.bahamut.right) / 2).toBeLessThan(0.65);
  });

  it('every rig has some of Bahamut in the frame (the enemy and Bahamut rigs are his close shots)', () => {
    for (const [name, rig] of Object.entries(RIGS)) {
      const b = figureBoxes(rig, 16 / 9).bahamut;
      expect(b.right, name).toBeGreaterThan(0.2);
      expect(b.left, name).toBeLessThan(0.95);
    }
    expect(idle.sway).toBeUndefined(); // the idle sways at the house default
  });
});

describe('the painting behind the stage', () => {
  it('fills the frame at every window for the rigs that look toward it (every rig but the overdrive)', () => {
    for (const aspect of ASPECTS) {
      for (const [name, rig] of Object.entries(RIGS)) {
        if (name === 'overdrive') continue;
        expect(planeMiss(rig, aspect, PLANE), `${name} at ${aspect}`).toBeLessThanOrEqual(aspect > 2 ? 0.25 : 0.12); // an ultra-wide window sees further to the side of a close shot
      }
      expect(planeMiss(idle, aspect, PLANE), `idle at ${aspect}`).toBe(0);
    }
  });

  it('shows the dark of the room, not the plate, on part of the overdrive frame (it looks along the party\'s axis): at most a third of the frame\'s rays miss', () => {
    const miss = planeMiss(RIGS['overdrive']!, 16 / 9, PLANE);
    expect(miss).toBeGreaterThan(0);
    expect(miss).toBeLessThanOrEqual(0.34);
  });

  it('planeMiss is a real measure: a camera that looks away from the plane misses all of it', () => {
    expect(planeMiss({ position: [0, 3, 0], lookAt: [0, 20, 10], fov: 20 }, 16 / 9, PLANE)).toBe(1);
    expect(planeMiss({ position: [0, 40, 10], lookAt: [0, 0, -10], fov: 32 }, 16 / 9, PLANE)).toBeLessThan(1);
  });
});

describe('projection and boxes', () => {
  it('a point on the lookAt axis is the middle of the screen, in front of the lens; the right of the lens is the right of the screen', () => {
    const rig = { position: [0, 2, 10] as const, lookAt: [0, 2, 0] as const, fov: 40 };
    const p = project(rig, 2, [0, 2, 0]);
    expect([p.x, p.y, p.depth]).toEqual([0.5, 0.5, 10]);
    expect(project(rig, 2, [1, 2, 0]).x).toBeGreaterThan(0.5);
    expect(project(rig, 2, [0, 3, 0]).y).toBeLessThan(0.5);
    expect(project(rig, 3, [1, 2, 0]).x).toBeLessThan(project(rig, 2, [1, 2, 0]).x); // a wider window shrinks a point's share of the width
  });

  it('boxOf is the box of the four corners: taller figures reach higher, wider ones further', () => {
    const rig = { position: [0, 2, 10] as const, lookAt: [0, 2, 0] as const, fov: 40 };
    const a = boxOf(rig, 2, [0, 0, 0], 2, 0.5);
    const b = boxOf(rig, 2, [0, 0, 0], 3, 1);
    expect(b.top).toBeLessThan(a.top);
    expect(b.right - b.left).toBeGreaterThan(a.right - a.left);
    expect(a.bottom).toBeGreaterThan(0.5);
    expect(HALF_WIDTH.bahamut).toBeGreaterThan(HALF_WIDTH.yuna * 5);
  });

  it('overlapOf is 0 for boxes that do not meet and 1 for one inside the other', () => {
    const a = { left: 0, right: 0.2, top: 0, bottom: 0.2 };
    expect(overlapOf(a, { left: 0.3, right: 0.5, top: 0, bottom: 0.2 })).toBe(0);
    expect(overlapOf(a, { left: -0.1, right: 0.3, top: -0.1, bottom: 0.3 })).toBe(1);
  });
});

describe('fitting a model to a figure', () => {
  it('scales the box\'s height to the figure\'s and puts its feet-centre on the origin, whatever the file\'s units and origin', () => {
    for (const box of [
      { min: [-0.85, 0, -0.44] as const, max: [0.85, 2.3, 0.29] as const }, // metres, feet on y 0
      { min: [-90, -10, -40] as const, max: [110, 170, 20] as const }, // centimetres, origin mid-body
    ]) {
      const f = fitBox(box, PARTY_HEIGHT);
      expect(f.scale * (box.max[1] - box.min[1])).toBeCloseTo(PARTY_HEIGHT, 9);
      expect(f.offset[1] + f.scale * box.min[1]).toBeCloseTo(0, 9); // the lowest point is the floor
      expect(f.offset[0] + (f.scale * (box.min[0] + box.max[0])) / 2).toBeCloseTo(0, 9); // the footprint's centre is the origin
      expect(f.offset[2] + (f.scale * (box.min[2] + box.max[2])) / 2).toBeCloseTo(0, 9);
      expect(f.widthOverHeight).toBeCloseTo(Math.max(box.max[0] - box.min[0], box.max[2] - box.min[2]) / (box.max[1] - box.min[1]), 9);
    }
  });

  it('a box with no height (an empty or flat file) is fitted at scale 1, not divided by zero', () => {
    const f = fitBox({ min: [0, 1, 0], max: [1, 1, 1] }, 1.9);
    expect(f.scale).toBe(1);
    expect(Number.isFinite(f.offset[0] + f.offset[1] + f.offset[2])).toBe(true);
  });
});

describe('where the model files are', () => {
  it('loads each figure from <base><dir>/<id>.glb, with or without the base\'s trailing slash, and from nowhere else', () => {
    expect(modelUrl('/', 'models-exp/yrp', 'yuna')).toBe('/models-exp/yrp/yuna.glb');
    expect(modelUrl('/pyrefly-reprise', 'models-exp/yrp', 'bahamut')).toBe('/pyrefly-reprise/models-exp/yrp/bahamut.glb');
    expect(YRP_CAST.map((id) => modelUrl('/', 'models-exp/yrp', id))).toEqual(['/models-exp/yrp/yuna.glb', '/models-exp/yrp/rikku.glb', '/models-exp/yrp/paine.glb', '/models-exp/yrp/bahamut.glb']);
  });

  it('judges a body by its first four bytes: "glTF" is a model, the dev server\'s index page is not', () => {
    const glb = new Uint8Array(20);
    glb.set([0x67, 0x6c, 0x54, 0x46], 0);
    expect(looksLikeGlb(glb)).toBe(true);
    expect(looksLikeGlb(glb.buffer)).toBe(true);
    expect(looksLikeGlb(new TextEncoder().encode('<!doctype html><html></html>'))).toBe(false);
    expect(looksLikeGlb(new Uint8Array(0))).toBe(false);
    expect(looksLikeGlb(glb.subarray(0, 8))).toBe(false); // shorter than a header
  });
});

describe('the toon ramp and the cast glow', () => {
  it('steps through three plateaus, rises monotonely, and blends each step over a brush\'s width, not a hard edge', () => {
    expect(TOON.bands).toHaveLength(3);
    const samples = Array.from({ length: 101 }, (_, i) => rampAt(i / 100));
    for (let i = 1; i < samples.length; i++) expect(samples[i]!, `at ${i}`).toBeGreaterThanOrEqual(samples[i - 1]! - 1e-12);
    expect(samples[0]).toBeCloseTo(TOON.bands[0]!, 6);
    expect(samples[100]).toBeCloseTo(TOON.bands[2]!, 6);
    expect(rampAt(0.5)).toBeCloseTo(TOON.bands[1]!, 2); // the middle plateau
    expect(new Set(samples.map((v) => Math.round(v * 100))).size).toBeGreaterThan(6); // soft: values between the plateaus exist
    expect(rampAt(0.33)).toBeLessThan(rampAt(0.35)); // and it passes through an edge
    const hard = { bands: TOON.bands, edges: TOON.edges, softness: 0 };
    expect(new Set(Array.from({ length: 101 }, (_, i) => rampAt(i / 100, hard))).size).toBe(3); // softness 0 is a cel: exactly the three
  });

  it('swells the cast glow from 0.35 to a steady breathing, and never leaves 0..0.76', () => {
    expect(castGlow(0)).toBeCloseTo(0.35, 6);
    for (let t = 0; t < 20; t += 0.05) {
      expect(castGlow(t)).toBeGreaterThanOrEqual(0);
      expect(castGlow(t)).toBeLessThanOrEqual(0.76);
    }
    expect(castGlow(3)).toBeGreaterThan(0.34);
  });
});
