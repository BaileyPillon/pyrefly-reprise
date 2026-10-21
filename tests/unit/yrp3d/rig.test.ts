/**
 * **The figures' lights and the dimmed room** (`src/engine/yrp3d/rig.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only): the studio's three suns and its grey world built as three.js lights from the tuning
 * table, standing along the directions fixed from frame A, on the figure layer as well as the default one (the floor's mirror draws that layer alone); and Chapter IV's own lights scaled by `LOOK.room`, the practicals and the
 * hole's uplight every frame after the scene's own flicker, the chamber's key no longer casting a shadow map. Real three.js lights, no renderer.
 */
import { AmbientLight, Color, DirectionalLight, Group, HemisphereLight, LinearSRGBColorSpace, PointLight, Vector3, type Light } from 'three';
import { describe, expect, it } from 'vitest';

import { LAYER, LOOK, SUNS, frameALights, mergeRig } from '../../../src/engine/yrp3d/look.ts';
import { dimRoom, figureLights, setRig, type RoomLights } from '../../../src/engine/yrp3d/rig.ts';

const byName = (lights: readonly Light[], name: string): Light => lights.find((l) => l.name === name)!;

describe('the figures\' lights', () => {
  it('are three directional suns and an ambient light, named for the table, none casting a shadow', () => {
    const lights = figureLights();
    expect(lights.map((l) => l.name).sort()).toEqual(['yrp-ambient', 'yrp-fill', 'yrp-key', 'yrp-rim']);
    for (const s of SUNS) {
      const sun = byName(lights, `yrp-${s}`) as DirectionalLight;
      expect(sun).toBeInstanceOf(DirectionalLight);
      expect(sun.castShadow).toBe(false);
      expect(sun.intensity).toBe(LOOK.rig[s].intensity);
    }
    const ambient = byName(lights, 'yrp-ambient') as AmbientLight;
    expect(ambient).toBeInstanceOf(AmbientLight);
    expect(ambient.intensity).toBeCloseTo(Math.PI * 0.2158605, 9);
    expect(lights.some((l) => l instanceof HemisphereLight)).toBe(false); // the old hemisphere fill is gone
  });

  it('carry the table\'s colours as linear light (the studio\'s are linear), not as sRGB hex', () => {
    const key = byName(figureLights(), 'yrp-key') as DirectionalLight;
    const want = new Color().setRGB(1.0, 0.95, 0.88, LinearSRGBColorSpace);
    expect([key.color.r, key.color.g, key.color.b].map((x) => +x.toFixed(6))).toEqual([want.r, want.g, want.b].map((x) => +x.toFixed(6)));
  });

  it('stand along the world-space directions fixed from frame A: the vector from each sun\'s target to the sun is the direction', () => {
    const dir = frameALights().dir;
    for (const s of SUNS) {
      const sun = byName(figureLights(), `yrp-${s}`) as DirectionalLight;
      const toward = new Vector3().subVectors(sun.position, sun.target.position).normalize();
      expect(toward.x, s).toBeCloseTo(dir[s][0], 9);
      expect(toward.y, s).toBeCloseTo(dir[s][1], 9);
      expect(toward.z, s).toBeCloseTo(dir[s][2], 9);
    }
  });

  it('are on the figure layer as well as the default one, so the floor\'s mirror (which draws that layer alone) lights the figures it reflects', () => {
    for (const l of figureLights()) {
      expect(l.layers.isEnabled(0), l.name).toBe(true);
      expect(l.layers.isEnabled(LAYER.figure), l.name).toBe(true);
      expect(l.layers.isEnabled(LAYER.backdrop), l.name).toBe(false);
    }
  });

  it('are retuned live in place: a patch moves a sun, recolours it and rescales it, and leaves lights of other names alone', () => {
    const lights = figureLights();
    const other = new DirectionalLight(0xff0000, 7);
    other.name = 'chamber-key';
    const before = (byName(lights, 'yrp-key') as DirectionalLight).position.clone();
    setRig([...lights, other], mergeRig(LOOK.rig, { key: { az: 0, intensity: 2.2, colour: [1, 1, 1] }, ambient: { intensity: 1 } }));
    const key = byName(lights, 'yrp-key') as DirectionalLight;
    expect(key.intensity).toBe(2.2);
    expect(key.position.distanceTo(before)).toBeGreaterThan(1); // az 0: a different place
    expect(key.color.g).toBeCloseTo(1, 6);
    expect(byName(lights, 'yrp-ambient').intensity).toBe(1);
    expect(other.intensity).toBe(7);
    expect(other.color.getHex()).toBe(0xff0000);
  });
});

/** A stand-in for Chapter IV's group with its lights by the names the factory gave them, and the scene's own rig. */
function chamber(): { group: Group; lights: RoomLights; practicals: PointLight[]; hole: PointLight } {
  const group = new Group();
  const key = new DirectionalLight(0x6ed2ee, 2.15);
  key.castShadow = true;
  const fill = new HemisphereLight(0xaabbdd, 0x223344, 0.95);
  const rim = new DirectionalLight(0xff9a52, 0.85);
  const ambient = new AmbientLight(0x101830, 0.46);
  const practicals = [5.5, 6.0, 4.0, 3.0].map((i) => {
    const p = new PointLight(0xe0742e, i, 26, 2);
    p.name = 'practical-rust';
    return p;
  });
  const hole = new PointLight(0x6ed2ee, 6.2, 26, 2);
  hole.name = 'hole-uplight';
  const flash = new PointLight(0x8affd0, 3.2, 11, 2);
  flash.name = 'practical';
  group.add(key, fill, rim, ambient, flash, hole, ...practicals);
  return { group, lights: { key, fill, rim, ambient }, practicals, hole };
}

describe('the dimmed room', () => {
  it('takes the chamber\'s key, fill, rim and ambient to the table\'s share at once, and stops the key casting a shadow map (the deck that received it is hidden)', () => {
    const { group, lights } = chamber();
    dimRoom(group, lights, { key: 0, fill: 0, rim: 0, ambient: 0, practicals: 1, hole: 1 });
    expect([lights.key.intensity, lights.fill.intensity, lights.rim.intensity, lights.ambient.intensity]).toEqual([0, 0, 0, 0]);
    expect(lights.key.castShadow).toBe(false);
    const half = chamber();
    dimRoom(half.group, half.lights, { key: 0.5, fill: 0.25, rim: 1, ambient: 0.1, practicals: 1, hole: 1 });
    expect(half.lights.key.intensity).toBeCloseTo(1.075, 9);
    expect(half.lights.fill.intensity).toBeCloseTo(0.2375, 9);
    expect(half.lights.rim.intensity).toBeCloseTo(0.85, 9);
    expect(half.lights.ambient.intensity).toBeCloseTo(0.046, 9);
  });

  it('scales the rust practicals and the hole\'s uplight after each frame\'s own flicker, never twice and never the flash point light', () => {
    const { group, lights, practicals, hole } = chamber();
    const dim = dimRoom(group, lights, { key: 0, fill: 0, rim: 0, ambient: 0, practicals: 0.5, hole: 0.25 });
    // the scene sets its flicker each frame (here: the same values), then the stage applies the shares
    const frame = (): void => {
      practicals.forEach((p, i) => (p.intensity = [5.5, 6.0, 4.0, 3.0][i]!));
      hole.intensity = 6.2;
      dim.apply();
    };
    frame();
    expect(practicals.map((p) => p.intensity)).toEqual([2.75, 3.0, 2.0, 1.5]);
    expect(hole.intensity).toBeCloseTo(1.55, 9);
    frame();
    expect(practicals.map((p) => p.intensity)).toEqual([2.75, 3.0, 2.0, 1.5]); // the scene reset them: no compounding
    const flash = group.children.find((c) => c.name === 'practical') as PointLight;
    expect(flash.intensity).toBe(3.2); // the hit and cast flash is gameplay feedback: untouched
  });

  it('with the shares at 1 leaves every point light alone, and gives the chamber\'s four lights back on restore', () => {
    const { group, lights, practicals, hole } = chamber();
    const dim = dimRoom(group, lights, { key: 0, fill: 0, rim: 0, ambient: 0, practicals: 1, hole: 1 });
    dim.apply();
    expect(practicals.map((p) => p.intensity)).toEqual([5.5, 6.0, 4.0, 3.0]);
    expect(hole.intensity).toBe(6.2);
    dim.restore();
    expect([lights.key.intensity, lights.fill.intensity, lights.rim.intensity, lights.ambient.intensity]).toEqual([2.15, 0.95, 0.85, 0.46]);
    expect(lights.key.castShadow).toBe(true);
  });

  it('uses the table by default, and survives a chamber with no lamps or hole', () => {
    const { lights } = chamber();
    const dim = dimRoom(new Group(), lights);
    expect(lights.key.intensity).toBeCloseTo(2.15 * LOOK.room.key, 9);
    expect(() => dim.apply()).not.toThrow();
  });
});
