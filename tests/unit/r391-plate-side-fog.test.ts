/**
 * Release 39.1, B11 (FFX only): where a painting's plane ends inside an ultrawide frame (Chapter II's Zanarkand dome at 2560x1080, about 15 percent a side),
 * its layers fade toward the scene's background colour so the plate dissolves into the band. Nothing at 16:9, where the edges are outside the frame.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Color, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, Texture, type WebGLRenderer } from 'three';
import { SIDE_FOG_CHUNK, SIDE_FOG_ONSET_NDC, SIDE_FOG_WIDTH_NDC, patchSideFog, patchSideFogIn, setSideFogGame, sideFogFor, sideFogOn } from '../../src/engine/PlateSideFog.ts';

afterEach(() => setSideFogGame(null));

/** A painting plane `width` wide, 59.8 units from a camera at z 9.8 looking down -z (the Zanarkand-like hang). */
function rig(aspect: number, width = 66, background: Color | null = new Color(0x1a1530)) {
  const mesh = new Mesh(new PlaneGeometry(width, 37), new MeshBasicMaterial({ map: new Texture() }));
  mesh.position.set(0, 0, -50);
  mesh.name = 'backdrop-painting';
  mesh.updateMatrixWorld(true);
  const camera = new PerspectiveCamera(32, aspect, 0.1, 500);
  camera.position.set(0, 0, 9.8);
  camera.lookAt(0, 0, -50);
  camera.updateMatrixWorld(true);
  const scene = new Scene();
  scene.background = background;
  const uniform = () => (mesh.userData['sideFog'] as { sf: { value: { toArray(): number[] } } }).sf.value.toArray();
  const render = () => mesh.onBeforeRender({} as WebGLRenderer, scene, camera, mesh.geometry, mesh.material, {} as never);
  return { mesh, camera, scene, uniform, render };
}

describe('the fade for a plane edge at a place on screen (pure)', () => {
  it('is 0 for an edge at or past the frame edge, 1 once it stands 0.04 inside, and widens as the plane narrows on screen', () => {
    expect(sideFogFor(-1.2, 1.2)).toMatchObject({ left: 0, right: 0 });
    expect(sideFogFor(-1, 1)).toMatchObject({ left: 0, right: 0 });
    expect(sideFogFor(-1 + SIDE_FOG_ONSET_NDC, 1 - SIDE_FOG_ONSET_NDC)).toMatchObject({ left: 1, right: 1 });
    expect(sideFogFor(-0.8, 1.5)).toMatchObject({ left: 1, right: 0 }); // only the left edge is inside
    expect(sideFogFor(-1.3, 0.6)).toMatchObject({ left: 0, right: 1 });
    const half = sideFogFor(-1 + SIDE_FOG_ONSET_NDC / 2, 2);
    expect(half.left).toBeCloseTo(0.5, 10);
    // the fade is SIDE_FOG_WIDTH_NDC of the frame whatever the plane's size on screen: a fraction of the plane's u
    expect(sideFogFor(-0.8, 0.8).widthU).toBeCloseTo(SIDE_FOG_WIDTH_NDC / 1.6, 10);
    expect(sideFogFor(-0.4, 0.4).widthU).toBeGreaterThan(sideFogFor(-0.8, 0.8).widthU);
    expect(sideFogFor(-0.001, 0.001).widthU).toBeLessThanOrEqual(0.5);
  });
});

describe('a layer drives its own fade from the live camera', () => {
  it('is untouched at 16:9 (the plane is wider than the frame), pixel for pixel: strengths 0 on both sides', () => {
    setSideFogGame('ffx');
    const r = rig(16 / 9);
    patchSideFog(r.mesh);
    r.render();
    expect(r.uniform().slice(0, 2)).toEqual([0, 0]);
  });

  it('fades both edges at 21:9, where the plane ends inside the frame', () => {
    setSideFogGame('ffx');
    const r = rig(2560 / 1080);
    patchSideFog(r.mesh);
    r.render();
    const [l, rt, w] = r.uniform();
    expect(l).toBe(1);
    expect(rt).toBe(1);
    expect(w).toBeGreaterThan(0.05);
    expect(w).toBeLessThan(0.5);
  });

  it('is FFX only: FFX-2, FF7 and no game at all leave the plate alone', () => {
    for (const game of ['ffx2', 'ff7', null]) {
      setSideFogGame(game);
      expect(sideFogOn()).toBe(false);
      const r = rig(2560 / 1080);
      patchSideFog(r.mesh);
      r.render();
      expect(r.uniform().slice(0, 2), String(game)).toEqual([0, 0]);
    }
  });

  it('needs the scene background to fade toward: none, none', () => {
    setSideFogGame('ffx');
    const r = rig(2560 / 1080, 66, null);
    patchSideFog(r.mesh);
    r.render();
    expect(r.uniform().slice(0, 2)).toEqual([0, 0]);
  });

  it('follows the colour of the scene background', () => {
    setSideFogGame('ffx');
    const r = rig(2560 / 1080);
    patchSideFog(r.mesh);
    r.render();
    const state = r.mesh.userData['sideFog'] as { color: { value: Color } };
    expect(state.color.value.getHex()).toBe(new Color(0x1a1530).getHex());
  });
});

describe('the material patch', () => {
  it('adds the uniforms and the mix after the colour is read, keeps what was patched before it, and compiles to a program of its own', () => {
    const mat = new MeshBasicMaterial({ map: new Texture() });
    const before: string[] = [];
    mat.onBeforeCompile = (shader) => {
      before.push('prior');
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n/* prior patch */');
    };
    mat.customProgramCacheKey = () => 'prior-key';
    const mesh = new Mesh(new PlaneGeometry(10, 5), mat);
    patchSideFog(mesh);
    const shader = { uniforms: {} as Record<string, unknown>, fragmentShader: 'void main() {\n#include <map_fragment>\n#include <color_fragment>\n}' };
    mat.onBeforeCompile(shader as never, {} as WebGLRenderer);
    expect(before).toEqual(['prior']);
    expect(shader.fragmentShader).toContain('/* prior patch */');
    expect(shader.fragmentShader).toContain('uniform vec3 uSf;');
    expect(shader.fragmentShader).toContain('uniform vec3 uSfColor;');
    expect(shader.fragmentShader.split(SIDE_FOG_CHUNK).length).toBe(2); // the chunk once
    expect(shader.fragmentShader.indexOf('#include <color_fragment>')).toBeLessThan(shader.fragmentShader.indexOf('sfK'));
    expect(Object.keys(shader.uniforms).sort()).toEqual(['uSf', 'uSfColor']);
    expect(mat.customProgramCacheKey()).toBe('prior-key|sidefog');
  });

  it('is applied once to a layer, and only to a textured basic material', () => {
    const textured = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new Texture() }));
    patchSideFog(textured);
    const first = textured.onBeforeRender;
    patchSideFog(textured);
    expect(textured.onBeforeRender).toBe(first);
    const bare = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial());
    patchSideFog(bare);
    expect(bare.userData['sideFog']).toBeUndefined();
  });

  it('patches the painting plane, its parallax bands and the depth plates, and not the lamp overlays', () => {
    const root = new Group();
    const names = ['backdrop-painting', 'backdrop-layer-0', 'backdrop-layer-1', 'fx-b-plate-0', 'fx-b-plate-3', 'fx-b-plate-0-lamps', 'backdrop-wing-left', 'mist-0', 'bahamut'];
    for (const n of names) {
      const m = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new Texture() }));
      m.name = n;
      root.add(m);
    }
    patchSideFogIn(root);
    const patched = root.children.filter((c) => c.userData['sideFog']).map((c) => c.name);
    expect(patched).toEqual(['backdrop-painting', 'backdrop-layer-0', 'backdrop-layer-1', 'fx-b-plate-0', 'fx-b-plate-3']);
  });

  it('does nothing, and does not throw, on a root that is not a scene graph (a presenter test stands a plain object in)', () => {
    expect(() => patchSideFogIn({} as Group)).not.toThrow();
    expect(() => patchSideFogIn(null as unknown as Group)).not.toThrow();
  });
});
