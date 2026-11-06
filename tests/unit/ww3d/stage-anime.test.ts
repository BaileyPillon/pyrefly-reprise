/**
 * **The anime chapter's wet floor** (`src/engine/ww3d/stageAnime.ts`, `stage.ts`; FFX-2 only), pinned in Node with blank textures: the stage names its floor mesh, the stone replaces the sand's picture and nothing else
 * of the floor's material, the mirror lies over the floor as a translucent shader layer and draws **once per game frame** however many times the scene is rendered, a low-quality build and `?reflect=0` leave it out, and
 * disposing frees it. The Fresnel-like curve ({@link reflectionAlpha}) is pure. Nothing here needs a renderer: the mirror's `onBeforeRender` is called with a fake that counts the renders it makes.
 */
import { CircleGeometry, Mesh, PerspectiveCamera, Scene, ShaderMaterial, Texture, WebGLRenderTarget, type WebGLRenderer } from 'three';
import { describe, expect, it } from 'vitest';

import { STAGE, buildStage } from '../../../src/engine/ww3d/stage.ts';
import { ANIME_FLOOR, addAnimeFloor, reflectWanted, reflectionAlpha } from '../../../src/engine/ww3d/stageAnime.ts';
import type { StageTextures } from '../../../src/engine/ww3d/stageTextureSet.ts';
import { createToonUniforms } from '../../../src/engine/ww3d/toon.ts';

const blank: StageTextures = {
  cloud: () => new Texture(),
  flame: () => new Texture(),
  sky: () => new Texture(),
  leaf: () => new Texture(),
  shaft: () => new Texture(),
  waterfall: () => new Texture(),
  blockWall: () => new Texture(),
  panel: () => new Texture(),
  door: () => new Texture(),
  sand: () => new Texture(),
};

const stage = () => buildStage(createToonUniforms(), { textures: blank });

describe('reflectionAlpha', () => {
  it('rises toward a grazing view and never passes the strength', () => {
    expect(reflectionAlpha(1)).toBeCloseTo(0.3 * ANIME_FLOOR.strength, 9);
    expect(reflectionAlpha(0)).toBeCloseTo(ANIME_FLOOR.strength, 9);
    let last = -1;
    for (let c = 1; c >= 0; c -= 0.05) {
      const a = reflectionAlpha(c);
      expect(a).toBeGreaterThanOrEqual(last);
      expect(a).toBeLessThanOrEqual(ANIME_FLOOR.strength + 1e-9);
      last = a;
    }
  });

  it('clamps a cosine outside 0..1 and takes any strength', () => {
    expect(reflectionAlpha(-3)).toBe(reflectionAlpha(0));
    expect(reflectionAlpha(7)).toBe(reflectionAlpha(1));
    expect(reflectionAlpha(0, 0.2)).toBeCloseTo(0.2, 9);
  });

  it('is a floor seen from chest height: at a 10 degree grazing view two thirds of the strength shows', () => {
    // a view 10 degrees over the floor makes a 80 degree angle with the normal: cos = sin(10 deg)
    expect(reflectionAlpha(Math.sin((10 * Math.PI) / 180))).toBeGreaterThan(0.65 * ANIME_FLOOR.strength);
  });
});

describe('the stage names its floor', () => {
  it('has one mesh called ww-floor: the disc under the room, the first thing the stage builds', () => {
    const s = stage();
    const floor = s.group.getObjectByName('ww-floor') as Mesh;
    expect(floor).toBeDefined();
    expect(floor.geometry).toBeInstanceOf(CircleGeometry);
    expect((floor.geometry as CircleGeometry).parameters.radius).toBeCloseTo(STAGE.R + 0.5, 9);
    expect(floor.receiveShadow).toBe(true);
    expect(s.group.children[0]).toBe(floor);
    s.dispose();
  });
});

describe('addAnimeFloor', () => {
  it('swaps the floor\'s picture for the stone and keeps its material, its shadow and its place', () => {
    const s = stage();
    const floor = s.group.getObjectByName('ww-floor') as Mesh;
    const mat = floor.material;
    const stone = new Texture();
    const af = addAnimeFloor(s, { stone, reflect: false });
    expect(floor.material).toBe(mat);
    expect((mat as unknown as { map: Texture }).map).toBe(stone);
    expect(floor.receiveShadow).toBe(true);
    expect(af.mirror).toBeNull();
    af.dispose();
    s.dispose();
  });

  it('with no stone asked for (null) leaves the sand alone', () => {
    const s = stage();
    const floor = s.group.getObjectByName('ww-floor') as Mesh;
    const before = (floor.material as unknown as { map: Texture }).map;
    const af = addAnimeFloor(s, { stone: null, reflect: false });
    expect((floor.material as unknown as { map: Texture }).map).toBe(before);
    af.dispose();
    s.dispose();
  });

  it('lays a translucent shader mirror 1 cm over the floor, facing up, over a disc as wide as the floor', () => {
    const s = stage();
    const af = addAnimeFloor(s, { stone: null });
    const m = af.mirror!;
    expect(m).not.toBeNull();
    expect(m.parent).toBe(s.group);
    expect(m.name).toBe('ww-floor-mirror');
    expect(m.position.y).toBeCloseTo(ANIME_FLOOR.y, 9);
    expect(m.rotation.x).toBeCloseTo(-Math.PI / 2, 9);
    expect((m.geometry as CircleGeometry).parameters.radius).toBeCloseTo(STAGE.R + 0.5, 9);
    const mat = m.material as unknown as ShaderMaterial;
    expect(mat.transparent).toBe(true);
    expect(mat.depthWrite).toBe(false);
    expect(mat.uniforms['uMirror']!.value.x).toBeCloseTo(ANIME_FLOOR.strength, 9);
    expect(mat.fragmentShader).toContain('colorspace_fragment');
    expect(mat.fragmentShader).toContain('tonemapping_fragment');
    af.dispose();
    s.dispose();
  });

  it('a low-quality build and reflect false leave the mirror out, and the stone still goes down', () => {
    for (const o of [{ quality: 'low' as const }, { reflect: false }]) {
      const s = stage();
      const stone = new Texture();
      const af = addAnimeFloor(s, { stone, ...o });
      expect(af.mirror).toBeNull();
      expect(s.group.getObjectByName('ww-floor-mirror')).toBeUndefined();
      expect(((s.group.getObjectByName('ww-floor') as Mesh).material as unknown as { map: Texture }).map).toBe(stone);
      af.dispose();
      s.dispose();
    }
  });

  it('draws the scene from under the floor once per game frame, however many times the scene is rendered', () => {
    const s = stage();
    const af = addAnimeFloor(s, { stone: null });
    const m = af.mirror!;
    let renders = 0;
    const fake = {
      xr: { enabled: false },
      shadowMap: { autoUpdate: true },
      autoClear: true,
      state: { buffers: { depth: { setMask: () => undefined } }, viewport: () => undefined },
      getRenderTarget: () => null as WebGLRenderTarget | null,
      setRenderTarget: () => undefined,
      clear: () => undefined,
      render: () => {
        renders++;
      },
    } as unknown as WebGLRenderer;
    const cam = new PerspectiveCamera(49, 16 / 9, 0.1, 100);
    cam.position.set(1.5, 0.45, 3.8);
    cam.lookAt(1.5, 2, -4);
    cam.updateMatrixWorld(true);
    m.updateMatrixWorld(true);
    const scene = new Scene();
    const draw = (): void => (m.onBeforeRender as unknown as (r: WebGLRenderer, s: Scene, c: PerspectiveCamera) => void)(fake, scene, cam);
    af.update(1 / 60);
    draw();
    draw();
    draw();
    expect(renders, 'three renders of one frame, one mirror').toBe(1);
    af.update(1 / 60);
    draw();
    draw();
    expect(renders, 'the next frame draws it again, once').toBe(2);
    af.dispose();
    s.dispose();
  });

  it('keeps the ripple\'s clock', () => {
    const s = stage();
    const af = addAnimeFloor(s, { stone: null });
    af.update(0.5);
    af.update(0.25);
    expect((af.mirror!.material as unknown as ShaderMaterial).uniforms['uMirror']!.value.z).toBeCloseTo(0.75, 9);
    af.dispose();
    s.dispose();
  });

  it('dispose takes the mirror out of the stage', () => {
    const s = stage();
    const af = addAnimeFloor(s, { stone: null });
    expect(s.group.getObjectByName('ww-floor-mirror')).toBeDefined();
    af.dispose();
    expect(s.group.getObjectByName('ww-floor-mirror')).toBeUndefined();
    s.dispose();
  });

  it('a stage with no ww-floor is left alone', () => {
    const s = stage();
    s.group.getObjectByName('ww-floor')!.name = 'something-else';
    const af = addAnimeFloor(s);
    expect(af.mirror).toBeNull();
    af.dispose();
    s.dispose();
  });
});

describe('reflectWanted', () => {
  it('?reflect=0 leaves the mirror out; anything else draws it', () => {
    expect(reflectWanted('')).toBe(true);
    expect(reflectWanted('?look=gg')).toBe(true);
    expect(reflectWanted('?reflect=0')).toBe(false);
    expect(reflectWanted('?look=blend&reflect=1')).toBe(true);
  });
});
