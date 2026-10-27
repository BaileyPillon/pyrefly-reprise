/**
 * MF-28 (lane "mf-l4-freezes", both games): the boss mask pass sees the scene's lights, so the light list three keeps for the scene's render state is the same in the mask pass as in the main pass and the lights'
 * version stops moving twice a frame (see `lightsOnLayer`). The helper puts lights on a layer and nothing else; the camera layer test is three's own.
 */
import { describe, expect, it } from 'vitest';
import { AmbientLight, DirectionalLight, Group, HemisphereLight, Layers, Mesh, PerspectiveCamera, PointLight, Scene } from 'three';
import { MASK_LAYER, lightsOnLayer } from '../../src/engine/look/pro/BossMask.ts';

describe('lightsOnLayer (MF-28)', () => {
  it('puts every light of the scene on the layer, in groups too, and leaves meshes and the lights default layer alone', () => {
    const scene = new Scene();
    const rig = new Group();
    const key = new DirectionalLight();
    const fill = new HemisphereLight();
    const ambient = new AmbientLight();
    const practical = new PointLight();
    rig.add(key, key.target, fill, ambient, practical);
    const mesh = new Mesh();
    scene.add(rig, mesh);
    expect(lightsOnLayer(scene, MASK_LAYER)).toBe(4);
    const mask = new Layers();
    mask.set(MASK_LAYER);
    for (const l of [key, fill, ambient, practical]) {
      expect(l.layers.test(mask)).toBe(true);
      expect(l.layers.test(new Layers())).toBe(true); // still on the default layer 0 the frame's camera draws
    }
    expect(mesh.layers.test(mask)).toBe(false);
    expect(key.target.layers.test(mask)).toBe(false);
  });

  it('a camera that sees only the mask layer now lists the same lights as the frame camera', () => {
    const scene = new Scene();
    const lights = [new DirectionalLight(), new HemisphereLight(), new AmbientLight()];
    scene.add(...lights);
    const frameCam = new PerspectiveCamera();
    const maskCam = new PerspectiveCamera();
    maskCam.layers.set(MASK_LAYER);
    const seen = (cam: PerspectiveCamera): number => lights.filter((l) => l.layers.test(cam.layers)).length;
    expect(seen(frameCam)).toBe(3);
    expect(seen(maskCam)).toBe(0); // before: the hash flipped between 3 lights and none
    lightsOnLayer(scene, MASK_LAYER);
    expect(seen(frameCam)).toBe(3);
    expect(seen(maskCam)).toBe(3);
  });
});
