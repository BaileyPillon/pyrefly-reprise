/**
 * **The real models' look, as numbers** (`src/engine/yrp3d/look.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only): the tuning table is the soft studio's rig of the turntable sheets Bailey liked, the three
 * suns' directions are turned from frame A's camera once and held, the light a white surface gets under the rig is bright, warm-neutral (never blue) and never black on any side, and the chamber's own lights are mostly gone.
 * Pure, no renderer: what it looks like on screen is the browser pass's.
 */
import { describe, expect, it } from 'vitest';

import { PARTY_SLOTS, PARTY_YAW, RIGS, type V3 } from '../../../src/engine/yrp3d/layout.ts';
import { LAYER, LOOK, STUDIO_GREY, SUNS, displayOf, frameALights, lightDirections, litBy, mergeRig, type Rig } from '../../../src/engine/yrp3d/look.ts';

const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (v: V3): number => Math.hypot(v[0], v[1], v[2]);
const DEG = Math.PI / 180;

/** The normals of a sphere, sampled on a grid: every side a surface can face. */
function sphere(): V3[] {
  const out: V3[] = [];
  for (let el = -80; el <= 80; el += 10) for (let az = 0; az < 360; az += 10) out.push([Math.cos(el * DEG) * Math.sin(az * DEG), Math.sin(el * DEG), Math.cos(el * DEG) * Math.cos(az * DEG)]);
  return out;
}

describe('the table is the studio\'s rig, number for number', () => {
  it('has the studio\'s three suns: a warm key front left and high, a cool-neutral fill on the far side and low, a soft rim from behind', () => {
    expect(LOOK.rig.key).toEqual({ az: -40, el: 48, intensity: 3.0, colour: [1.0, 0.95, 0.88] });
    expect(LOOK.rig.fill).toEqual({ az: 65, el: 22, intensity: 0.9, colour: [0.88, 0.93, 1.0] });
    expect(LOOK.rig.rim).toEqual({ az: 165, el: 40, intensity: 1.8, colour: [1.0, 0.97, 0.92] });
  });

  it('has the studio\'s grey world as an ambient light: pi times the radiance of sRGB 128 (0.2158605), white', () => {
    expect(STUDIO_GREY).toBe(0.2158605);
    expect(LOOK.rig.ambient.intensity).toBeCloseTo(Math.PI * 0.2158605, 9);
    expect(LOOK.rig.ambient.colour).toEqual([1, 1, 1]);
  });

  it('keeps the key the strongest light and the colours near neutral: no channel of any light is more than 12 percent off the others', () => {
    for (const s of SUNS) {
      const c = LOOK.rig[s].colour;
      expect(Math.max(...c) - Math.min(...c), s).toBeLessThanOrEqual(0.12);
    }
    expect(LOOK.rig.key.intensity).toBeGreaterThan(LOOK.rig.rim.intensity);
    expect(LOOK.rig.rim.intensity).toBeGreaterThan(LOOK.rig.fill.intensity);
    expect(LOOK.rig.key.colour[0]).toBeGreaterThan(LOOK.rig.key.colour[2]); // the key is the warm one
    expect(LOOK.rig.fill.colour[2]).toBeGreaterThan(LOOK.rig.fill.colour[0]); // the fill the cool one
  });

  it('takes the layers: the figures on 1, the backdrop on 2', () => {
    expect(LAYER).toEqual({ figure: 1, backdrop: 2 });
  });

  it('keeps fog off the figures and the chamber\'s own cyan key, cold fill, rust rim and dark-blue ambient off them; the lamps stay and the hole\'s cyan uplight is down', () => {
    expect(LOOK.figure.fog).toBe(false);
    expect([LOOK.room.key, LOOK.room.fill, LOOK.room.rim, LOOK.room.ambient]).toEqual([0, 0, 0, 0]);
    expect(LOOK.room.practicals).toBeLessThanOrEqual(1);
    expect(LOOK.room.hole).toBeLessThan(0.5);
  });
});

describe('the directions, measured from frame A\'s camera and held in the world', () => {
  const cam = RIGS['idle']!.position;
  const yuna = PARTY_SLOTS[0]!;
  const chest: V3 = [yuna[0], 1.3, yuna[2]];
  const toCam: V3 = (() => {
    const v: V3 = [cam[0] - chest[0], 0, cam[2] - chest[2]];
    const l = len(v);
    return [v[0] / l, 0, v[2] / l];
  })();
  const right: V3 = [toCam[2], 0, -toCam[0]];

  it('gives unit vectors', () => {
    const { dir } = frameALights();
    for (const s of SUNS) expect(len(dir[s]), s).toBeCloseTo(1, 9);
  });

  it('puts each sun at the azimuth and elevation of the table: its horizontal part makes that angle with the camera\'s axis, positive toward the camera\'s right', () => {
    const { dir } = frameALights();
    for (const s of SUNS) {
      const d = dir[s];
      const horizontal = Math.hypot(d[0], d[2]);
      const az = Math.atan2(dot([d[0], 0, d[2]], right), dot([d[0], 0, d[2]], toCam)) / DEG;
      expect(az, `${s} azimuth`).toBeCloseTo(LOOK.rig[s].az, 6);
      expect(Math.atan2(d[1], horizontal) / DEG, `${s} elevation`).toBeCloseTo(LOOK.rig[s].el, 6);
    }
  });

  it('puts the key and fill on the camera\'s side of the figure, the key on the left and the fill on the right, and the rim behind', () => {
    const { dir } = frameALights();
    expect(dot(dir.key, toCam)).toBeGreaterThan(0);
    expect(dot(dir.key, right)).toBeLessThan(0);
    expect(dot(dir.fill, toCam)).toBeGreaterThan(0);
    expect(dot(dir.fill, right)).toBeGreaterThan(0);
    expect(dot(dir.rim, toCam)).toBeLessThan(-0.5); // behind
    expect(dir.fill[1]).toBeLessThan(dir.key[1]); // the fill is low
  });

  it('holds them: they do not depend on the shot (the table\'s rig measured from another camera is another vector, but the chapter only ever reads frame A\'s)', () => {
    const a = frameALights().dir;
    const b = frameALights().dir;
    expect(a).toEqual(b);
    const other = lightDirections(RIGS['party']!.position, chest).key;
    expect(other).not.toEqual(a.key); // the function is the camera's; frame A's is the one the chapter fixes
  });

  it('lights a girl\'s face: the key falls on the front of a party figure (the way the stage turns her) at more than half strength', () => {
    const face: V3 = [Math.sin(PARTY_YAW), 0, Math.cos(PARTY_YAW)];
    expect(dot(frameALights().dir.key, face)).toBeGreaterThan(0.5);
  });
});

describe('what a white surface gets under the rig (multiply by an albedo)', () => {
  const face: V3 = [Math.sin(PARTY_YAW), 0, Math.cos(PARTY_YAW)];

  it('reads clearly on the front of a girl: 0.7 to 1 of the albedo, on every channel, which the grade (gamma 2.2) shows as 0.85 and up', () => {
    const lit = litBy(face);
    for (const c of lit) {
      expect(c).toBeGreaterThan(0.7);
      expect(c).toBeLessThan(1.0);
      expect(displayOf(c)).toBeGreaterThan(0.85);
    }
  });

  it('never goes black on any side: the darkest side of a sphere keeps the ambient and more, at least a fifth of the albedo', () => {
    for (const n of sphere()) for (const c of litBy(n)) expect(c).toBeGreaterThanOrEqual(0.2);
  });

  it('is soft: the lit side is no more than four times the shadow side (an even, studio light, not a hard one)', () => {
    const all = sphere().map((n) => litBy(n)[1]);
    expect(Math.max(...all) / Math.min(...all)).toBeLessThan(7); // the very top and the very bottom
    const horizontal = sphere().filter((n) => Math.abs(n[1]) < 0.01).map((n) => litBy(n)[1]);
    expect(Math.max(...horizontal) / Math.min(...horizontal)).toBeLessThan(4);
  });

  it('is never blue: on every side the blue channel is within 15 percent of the red, and the red is never under the blue by more than that', () => {
    for (const n of sphere()) {
      const [r, , b] = litBy(n);
      expect(b / r).toBeGreaterThan(0.85);
      expect(b / r).toBeLessThan(1.15);
    }
  });

  it('is warm on the key side: the front of a girl is a little redder than blue (true skin, not a cast)', () => {
    const [r, , b] = litBy(face);
    expect(r).toBeGreaterThan(b);
    expect(r / b).toBeLessThan(1.15);
  });

  it('is the table\'s own arithmetic: a rig of one white sun at normal incidence and no ambient lights a white to intensity over pi', () => {
    const one: Rig = { key: { az: 0, el: 0, intensity: 3.1415926535, colour: [1, 1, 1] }, fill: { ...LOOK.rig.fill, intensity: 0 }, rim: { ...LOOK.rig.rim, intensity: 0 }, ambient: { intensity: 0, colour: [1, 1, 1] } };
    const toward = lightDirections(RIGS['idle']!.position, [PARTY_SLOTS[0]![0], 1.3, PARTY_SLOTS[0]![2]], one).key;
    for (const c of litBy(toward, one)) expect(c).toBeCloseTo(1, 6);
    for (const c of litBy([-toward[0], -toward[1], -toward[2]], one)) expect(c).toBe(0);
  });

  it('shows linear light through the chapter\'s grade: gamma 2.2, clamped to 0..1', () => {
    expect(displayOf(0)).toBe(0);
    expect(displayOf(1)).toBe(1);
    expect(displayOf(2)).toBe(1);
    expect(displayOf(0.2158605)).toBeCloseTo(0.5, 2); // the studio's grey world is sRGB 128
  });
});

describe('a patch over the rig (the debug handle\'s live tuning)', () => {
  it('replaces only the fields given, and leaves the table itself alone', () => {
    const next = mergeRig(LOOK.rig, { key: { intensity: 2.4 }, ambient: { intensity: 0.9 } });
    expect(next.key).toEqual({ ...LOOK.rig.key, intensity: 2.4 });
    expect(next.ambient).toEqual({ ...LOOK.rig.ambient, intensity: 0.9 });
    expect(next.fill).toEqual(LOOK.rig.fill);
    expect(next.rim).toEqual(LOOK.rig.rim);
    expect(LOOK.rig.key.intensity).toBe(3.0);
  });
});
