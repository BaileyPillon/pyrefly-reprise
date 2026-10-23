/**
 * **Frame A's layout and camera maths** (`src/engine/yrp3d/layout.ts`; the hidden 3D Bahamut chapter, FFX-2 only), held without a renderer: where the four figures stand on the screen at 16:9 and at the window shapes either
 * side of it, that the painting's plane fills the frame behind them, how a model is fitted to a figure, where the model files are looked for, and the soft shading of the real-models branch (its light is `look.test.ts`'s).
 *
 * The target is Bailey's picked end-state frame A (the art room's picture, "classic, now in 3D"): Bahamut on the left with his wings over the left half, the trio in a loose diagonal on the right (Paine at the back,
 * Rikku in the middle, Yuna at the front), calm floor along the bottom. These tests are that picture's limits as numbers; they do not look at pixels (the browser pass does).
 */
import { describe, expect, it } from 'vitest';

import {
  AI_BOSS_FILES,
  BOSS_HEIGHT,
  BOSS_SPOT,
  BOSS_YAW,
  CLOSE_FOV,
  ENEMY_SLOTS,
  FRAME_A_BOXES,
  HALF_WIDTH,
  MIN_SHOT_SPAN,
  PARTY_HEIGHT,
  PARTY_SLOTS,
  PARTY_YAW,
  RIGS,
  SHADE,
  animsUrl,
  bossChoice,
  boxOf,
  castGlow,
  clipMapUrl,
  figureBoxes,
  figurePlans,
  fileUrl,
  fitBox,
  folderUrl,
  isYrpId,
  longLens,
  looksLikeGlb,
  modelUrl,
  overlapOf,
  planeMiss,
  project,
  shotSpan,
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
    for (const [name, rig] of Object.entries(RIGS)) {
      expect(rig.fov, name).toBeGreaterThanOrEqual(CLOSE_FOV);
      expect(rig.fov, name).toBeLessThan(60);
      expect(rig.position[1], name).toBeGreaterThan(0.5);
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

describe('the close shots: the D1 look\'s long lens, and nothing tighter than waist-up', () => {
  const CLOSE = ['party', 'enemy', 'bahamut', 'victory'] as const;
  const WIDE = ['intro', 'idle', 'action', 'overdrive'] as const;

  it('puts the four close shots (the pushes toward who is being looked at) on the long lens (22 degrees) and leaves the wide ones and frame A on theirs', () => {
    expect(CLOSE_FOV).toBe(22);
    for (const name of CLOSE) expect(RIGS[name]!.fov, name).toBe(CLOSE_FOV);
    expect(RIGS['idle']!.fov).toBe(32); // frame A unchanged
    expect(RIGS['idle']!.position).toEqual([2.2, 4.9, 10.4]);
    expect(RIGS['idle']!.lookAt).toEqual([0.6, 1.95, -0.8]);
    expect(RIGS['intro']!.fov).toBe(32);
    expect(RIGS['action']!.fov).toBe(36);
    expect(RIGS['overdrive']!.fov).toBe(50);
    for (const name of WIDE) expect(RIGS[name]!.fov, name).toBeGreaterThan(CLOSE_FOV);
  });

  it('shows no shot tighter than waist-up: every rig\'s span at its look-at point is at least 0.96 m (the waist to a hand above the head of a party figure)', () => {
    expect(MIN_SHOT_SPAN).toBeCloseTo(PARTY_HEIGHT * (1 - 0.56) + 0.12, 1);
    for (const [name, rig] of Object.entries(RIGS)) expect(shotSpan(rig), name).toBeGreaterThanOrEqual(MIN_SHOT_SPAN);
  });

  it('keeps each close shot\'s framing: the span at the look-at point is what the wider lens gave, to a percent, the look-at and the sway are kept, and the camera is further back along the same line of sight', () => {
    const was = {
      party: { position: [6.8, 3.2, 5.0], lookAt: [3.4, 1.2, -1.0], fov: 34, sway: 0.7 },
      enemy: { position: [1.0, 3.6, 7.6], lookAt: [-3.2, 2.6, -3.2], fov: 34, sway: 0.7 },
      bahamut: { position: [-0.8, 2.2, 7.2], lookAt: [-3.2, 1.9, -3.2], fov: 30, sway: 0.5 },
      victory: { position: [6.2, 3.0, 4.6], lookAt: [3.2, 1.3, -1.0], fov: 32, sway: 1.2 },
    } as const;
    for (const name of CLOSE) {
      const before = was[name];
      const now = RIGS[name]!;
      expect(shotSpan(now) / shotSpan({ position: before.position, lookAt: before.lookAt, fov: before.fov }), name).toBeCloseTo(1, 2);
      expect(now.lookAt, name).toEqual(before.lookAt);
      expect(now.sway, name).toBe(before.sway);
      // the same line of sight: the offset from the look-at point is the old one, scaled
      const k = (now.position[0] - before.lookAt[0]) / (before.position[0] - before.lookAt[0]);
      expect(k, name).toBeGreaterThan(1.2); // further back
      expect((now.position[1] - before.lookAt[1]) / (before.position[1] - before.lookAt[1]), name).toBeCloseTo(k, 1);
      expect((now.position[2] - before.lookAt[2]) / (before.position[2] - before.lookAt[2]), name).toBeCloseTo(k, 1);
    }
  });

  it('longLens is the same framing through another lens: the span at the look-at point is preserved, a longer lens backs the camera away and a shorter one brings it in, along the line of sight', () => {
    const rig = { position: [0, 2, 10] as const, lookAt: [0, 2, 0] as const, fov: 40, sway: 1 };
    const long = longLens(rig, 20);
    expect(long.fov).toBe(20);
    expect(long.sway).toBe(1);
    expect(long.position[0]).toBe(0);
    expect(long.position[1]).toBe(2);
    expect(long.position[2]).toBeGreaterThan(10); // further back
    expect(shotSpan(long) / shotSpan(rig)).toBeCloseTo(1, 2);
    const wide = longLens(rig, 60);
    expect(wide.position[2]).toBeLessThan(10);
    expect(shotSpan(wide) / shotSpan(rig)).toBeCloseTo(1, 2);
    expect(longLens(rig, 40).position).toEqual([0, 2, 10]); // the same lens: nowhere to go
    expect(longLens(rig).fov).toBe(CLOSE_FOV);
  });

  it('measures a span as twice the distance to the look-at point times the tangent of half the field of view', () => {
    expect(shotSpan({ position: [0, 0, 10], lookAt: [0, 0, 0], fov: 90 })).toBeCloseTo(20, 9);
    expect(shotSpan({ position: [0, 0, 5], lookAt: [0, 0, 0], fov: 90 })).toBeCloseTo(10, 9);
    expect(shotSpan({ position: [3, 4, 0], lookAt: [0, 0, 0], fov: 90 })).toBeCloseTo(10, 9);
  });

  it('keeps every close shot inside the room: the camera stays in front of the painting and no further back than the establishing shot', () => {
    for (const name of CLOSE) {
      expect(RIGS[name]!.position[2], name).toBeLessThan(RIGS['intro']!.position[2]);
      expect(RIGS[name]!.position[1], name).toBeGreaterThan(0.5);
    }
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

describe('the soft shading and the cast glow', () => {
  it('shades the real models with no specular gloss: a high roughness, no metal, no environment, and no ink or ramp (the toon look of the AI-model branch is gone)', () => {
    expect(SHADE.roughness).toBeGreaterThanOrEqual(0.75);
    expect(SHADE.roughness).toBeLessThanOrEqual(0.9);
    expect(SHADE.metalness).toBe(0);
    expect(SHADE.envMapIntensity).toBe(0);
    expect(SHADE.anisotropy).toBeGreaterThan(1);
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

describe('where the clips and the clip map are', () => {
  it('puts the clips of a figure beside its model as <id>-anims.glb and the map as clipmap.json, whichever folder', () => {
    expect(folderUrl('/', 'models-exp/yrp-hd')).toBe('/models-exp/yrp-hd/');
    expect(folderUrl('/x', 'models-exp/yrp')).toBe('/x/models-exp/yrp/');
    expect(animsUrl('/', 'models-exp/yrp', 'rikku')).toBe('/models-exp/yrp/rikku-anims.glb');
    expect(clipMapUrl('/pyrefly-reprise', 'models-exp/yrp-hd')).toBe('/pyrefly-reprise/models-exp/yrp-hd/clipmap.json');
  });
});

describe('which Bahamut and which files', () => {
  it('fights the AI-made Bahamut playing the game\'s clips by default (2026-10-22), the simple wing-and-breath motion only for ?bossrig=simple, and the game\'s own Bahamut for ?boss=real', () => {
    expect(bossChoice('')).toEqual({ boss: 'ai', rig: true });
    expect(bossChoice('?bossrig=clips')).toEqual({ boss: 'ai', rig: true }); // the old way to ask: the same as the default
    expect(bossChoice('?bossrig=simple')).toEqual({ boss: 'ai', rig: false });
    expect(bossChoice('?bossrig=SIMPLE')).toEqual({ boss: 'ai', rig: true }); // exact, as every query switch here
    expect(bossChoice('?boss=real')).toEqual({ boss: 'real', rig: false });
    expect(bossChoice('?boss=real&bossrig=clips')).toEqual({ boss: 'real', rig: false }); // the game's Bahamut has his own clips: nothing to move
    expect(bossChoice('?boss=ai&bossrig=nonsense')).toEqual({ boss: 'ai', rig: true });
    expect(bossChoice('?models=base&boss=nonsense')).toEqual({ boss: 'ai', rig: true });
    expect(bossChoice('?frame=a&bossrig=simple')).toEqual({ boss: 'ai', rig: false }); // the frame query is another switch
  });

  it('loads the real girls from <id>.glb and <id>-anims.glb in the diffuse look, whichever boss', () => {
    for (const choice of [bossChoice(''), bossChoice('?boss=real'), bossChoice('?bossrig=simple')]) {
      for (const id of YRP_PARTY_IDS) expect(figurePlans(id, choice)).toEqual([{ mesh: `${id}.glb`, anims: `${id}-anims.glb`, look: 'diffuse' }]);
    }
  });

  it('gives the AI boss the rigged file and its clips first and bahamut-ai.glb with no clips after it (both in the pbr look), only the plain mesh for ?bossrig=simple, and the game\'s Bahamut his own files in the diffuse look', () => {
    expect(figurePlans('bahamut', bossChoice(''))).toEqual([
      { mesh: AI_BOSS_FILES.rigged, anims: AI_BOSS_FILES.anims, look: 'pbr' },
      { mesh: AI_BOSS_FILES.mesh, anims: null, look: 'pbr' },
    ]);
    expect(figurePlans('bahamut', bossChoice('?bossrig=clips'))).toEqual(figurePlans('bahamut', bossChoice('')));
    expect(figurePlans('bahamut', bossChoice('?bossrig=simple'))).toEqual([{ mesh: AI_BOSS_FILES.mesh, anims: null, look: 'pbr' }]);
    expect(figurePlans('bahamut', bossChoice('?boss=real'))).toEqual([{ mesh: 'bahamut.glb', anims: 'bahamut-anims.glb', look: 'diffuse' }]);
    expect(AI_BOSS_FILES).toEqual({ mesh: 'bahamut-ai.glb', rigged: 'bahamut-ai-rigged.glb', anims: 'bahamut-ai-anims.glb' });
    expect(fileUrl('/', 'models-exp/yrp', AI_BOSS_FILES.mesh)).toBe('/models-exp/yrp/bahamut-ai.glb');
  });
});
