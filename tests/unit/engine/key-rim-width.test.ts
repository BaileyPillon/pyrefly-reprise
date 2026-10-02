import { Color, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from 'three';
import { describe, expect, it } from 'vitest';
import { KeyRim, RIM_MAX_PX, texelsPerPixel } from '../../../src/engine/fx/a/KeyRim.ts';

/**
 * VP-1001-17 (both games, eye candy D): the key rim was a width in texels, so a low-density boss
 * (Vegnagun ~0.9 texel per screen pixel) drew a 5 px pale halo while the party drew ~1 px. The
 * width is now held to at most RIM_MAX_PX screen pixels; dense figures keep their width.
 */
function figure(texH: number, worldH: number, z: number): { mesh: Mesh; mat: ShaderMaterial } {
  const mat = new ShaderMaterial({
    uniforms: {
      rimColor: { value: new Color(0xbfe0ff) },
      rimStrength: { value: 0.5 },
      rimWidth: { value: 3.4 },
      texel: { value: new Vector2(1 / 512, 1 / texH) },
    },
  });
  const mesh = new Mesh(new PlaneGeometry(1, 1), mat);
  mesh.scale.set(worldH * 0.5, worldH, 1);
  mesh.position.set(0, 0, z);
  return { mesh, mat };
}

describe('key rim width in screen pixels', () => {
  const cam = new PerspectiveCamera(32, 16 / 9, 0.1, 200);
  cam.position.set(0, 0, 10);
  cam.updateMatrixWorld();
  const view = { camera: cam, heightPx: 900 };

  it('measures texels per screen pixel from the plane, the camera and the buffer', () => {
    const { mesh } = figure(1200, 1.8, 0);
    mesh.updateMatrixWorld();
    const pxPerUnit = 900 / (2 * Math.tan((16 * Math.PI) / 180) * 10);
    expect(texelsPerPixel(mesh, 1 / 1200, view)).toBeCloseTo(1200 / (1.8 * pxPerUnit), 5);
  });

  it('thins a low-density boss rim and leaves the dense party rim as it was', () => {
    const scene = new Scene();
    const party = figure(1200, 1.8, 0); // ~4 texels per px at this framing
    const boss = figure(800, 12, 0); // ~0.4 texels per px
    scene.add(party.mesh, boss.mesh);
    scene.updateMatrixWorld();
    const rim = new KeyRim();
    rim.apply(scene, new Color(0xffffff), 1.3, 1.35, view);
    const partyW = party.mat.uniforms['rimWidth']!.value as number;
    const bossW = boss.mat.uniforms['rimWidth']!.value as number;
    expect(partyW).toBeCloseTo(3.4 * 1.35, 5);
    const bossTpp = texelsPerPixel(boss.mesh, 1 / 800, view)!;
    expect(bossW * (1 / bossTpp)).toBeLessThanOrEqual(Math.max(RIM_MAX_PX, 0.75 / bossTpp) + 1e-6);
    expect(bossW).toBeLessThan(partyW);
    rim.restore();
    expect(boss.mat.uniforms['rimWidth']!.value).toBe(3.4);
  });

  it('keeps the old multiplier when no view is given', () => {
    const scene = new Scene();
    const boss = figure(800, 12, 0);
    scene.add(boss.mesh);
    new KeyRim().apply(scene, new Color(0xffffff), 1.3, 1.35);
    expect(boss.mat.uniforms['rimWidth']!.value).toBeCloseTo(3.4 * 1.35, 5);
  });
});
