/**
 * **The wet floor, the nested render, the contact shadows and the stage look** (`src/engine/yrp3d/wetFloor.ts`, `wetFloorShader.ts`, `nested.ts`, `contact.ts`, `stageLook.ts`; the hidden 3D Bahamut chapter, FFX-2 only; brought over from the look lab's branch `exp-yrp-3d` without its ink). With three's
 * real classes (the `Reflector` included) and a **fake renderer** that records what it is asked (no GL here): the floor's place and blend; the shader's uniforms against its GLSL; what the floor renders from inside its draw (the
 * backdrop alone, the figures alone with no background) and that everything it touched is put back; the contact discs' falloff, size, position and visibility; what the stage look hides, layers and adds, and frees.
 */
import { Color, DataTexture, Group, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget, type WebGLRenderer } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { ContactShadows, discAlpha, discRadius, discTexture } from '../../../src/engine/yrp3d/contact.ts';
import { grainData } from '../../../src/engine/yrp3d/grain.ts';
import { PARTY_HEIGHT, BOSS_HEIGHT, RIGS, YRP_CAST } from '../../../src/engine/yrp3d/layout.ts';
import { LAYER, frameALights } from '../../../src/engine/yrp3d/look.ts';
import { frameSize, renderNested } from '../../../src/engine/yrp3d/nested.ts';
import { HIDDEN_DECK, YRP_PALETTE, applyStage, putOnLayer } from '../../../src/engine/yrp3d/stageLook.ts';
import { FLOOR_RENDER_ORDER, WetFloor, horizonHeight } from '../../../src/engine/yrp3d/wetFloor.ts';
import { CONTACT, FLOOR, FLOOR_FRAG, FLOOR_VERT } from '../../../src/engine/yrp3d/wetFloorShader.ts';

const grain = (): DataTexture => new DataTexture(grainData(8), 8, 8);

interface Call {
  layers: number;
  background: unknown;
  override: unknown;
  target: unknown;
  shadows: boolean;
  autoClear: boolean;
  clearAlpha: number;
  camera: unknown;
}

/** A renderer that records, for each nested `render`, the state while it ran. The pieces the Reflector asks for (xr, the depth state) are there too. */
function fakeRenderer(target: WebGLRenderTarget | null = null, size: [number, number] = [1920, 1080]) {
  let current: WebGLRenderTarget | null = target;
  let clearColour = 0x04060b;
  let clearAlpha = 1;
  const calls: Call[] = [];
  const r = {
    autoClear: false,
    shadowMap: { autoUpdate: true },
    xr: { enabled: false },
    state: { buffers: { depth: { setMask: () => undefined } }, viewport: () => undefined },
    getRenderTarget: () => current,
    setRenderTarget: (t: WebGLRenderTarget | null) => void (current = t),
    getDrawingBufferSize: (v: Vector2) => v.set(size[0], size[1]),
    getClearColor: (c: Color) => c.setHex(clearColour),
    getClearAlpha: () => clearAlpha,
    setClearColor: (c: number, a = 1) => {
      clearColour = c;
      clearAlpha = a;
    },
    clear: vi.fn(),
    render: vi.fn((scene: Scene, camera: PerspectiveCamera) => {
      calls.push({ layers: camera.layers.mask, background: scene.background, override: scene.overrideMaterial, target: current, shadows: r.shadowMap.autoUpdate, autoClear: r.autoClear, clearAlpha, camera });
    }),
  };
  return { r: r as unknown as WebGLRenderer, raw: r, calls, get target() { return current; }, get clearColour() { return clearColour; }, get clearAlpha() { return clearAlpha; } };
}

const cameraAt = (rig = RIGS['idle']!): PerspectiveCamera => {
  const cam = new PerspectiveCamera(rig.fov, 16 / 9, 0.1, 400);
  cam.position.set(...rig.position);
  cam.lookAt(...rig.lookAt);
  cam.updateMatrixWorld(true);
  return cam;
};

describe('a nested render', () => {
  it('draws the scene from the camera into the target with the layer, override and background it was told, and puts every piece of state back', () => {
    const f = fakeRenderer(null);
    const outer = new WebGLRenderTarget(64, 64);
    const inner = new WebGLRenderTarget(32, 32);
    f.r.setRenderTarget(outer);
    f.raw.autoClear = true;
    const scene = new Scene();
    const bg = new Color(0x224466);
    scene.background = bg;
    const override = new MeshBasicMaterial();
    scene.overrideMaterial = override;
    const camera = cameraAt();
    camera.layers.enable(4);
    const mask = camera.layers.mask;
    const own = new MeshBasicMaterial();
    renderNested(f.r, scene, camera, { target: inner, layer: LAYER.backdrop, override: own, keepBackground: false, clear: { colour: 0x000000, alpha: 0 } });
    expect(f.calls).toHaveLength(1);
    const c = f.calls[0]!;
    expect([c.layers, c.override, c.background, c.target, c.shadows, c.autoClear, c.clearAlpha]).toEqual([1 << LAYER.backdrop, own, null, inner, false, false, 0]);
    expect(f.raw.clear).toHaveBeenCalledWith(true, true, false);
    // all back
    expect(f.target).toBe(outer);
    expect([f.clearColour, f.clearAlpha]).toEqual([0x04060b, 1]);
    expect(f.raw.autoClear).toBe(true);
    expect(f.raw.shadowMap.autoUpdate).toBe(true);
    expect(scene.background).toBe(bg);
    expect(scene.overrideMaterial).toBe(override);
    expect(camera.layers.mask).toBe(mask);
    outer.dispose();
    inner.dispose();
  });

  it('keeps the background when asked (the backdrop pass paints on the flat colour) and uses each object\'s own material when there is no override', () => {
    const f = fakeRenderer(null);
    const t = new WebGLRenderTarget(8, 8);
    const scene = new Scene();
    scene.background = new Color(0x112233);
    scene.overrideMaterial = new MeshBasicMaterial();
    renderNested(f.r, scene, cameraAt(), { target: t, layer: LAYER.backdrop, keepBackground: true, clear: { colour: 0x000000, alpha: 1 } });
    expect(f.calls[0]!.background).not.toBeNull();
    expect(f.calls[0]!.override).toBeNull();
    t.dispose();
  });

  it('measures the frame as the current target, or the canvas when there is none', () => {
    const into = new Vector2();
    const t = new WebGLRenderTarget(800, 450);
    expect(frameSize(fakeRenderer(t).r, into)).toEqual({ width: 800, height: 450 });
    expect(frameSize(fakeRenderer(null, [1280, 720]).r, into)).toEqual({ width: 1280, height: 720 });
    expect(frameSize(fakeRenderer(null, [0, 0]).r, into)).toEqual({ width: 1, height: 1 });
    t.dispose();
  });
});

describe('the floor\'s numbers and shader', () => {
  it('is the lab\'s floor: 80 m square at z -5, solid in front of z -9.5 and gone behind -17, dark violet tiles of 3.4 m, a half-resolution backdrop for the streaks', () => {
    expect([FLOOR.size, FLOOR.centreZ, FLOOR.fadeNear, FLOOR.fadeFar, FLOOR.horizonZ]).toEqual([80, -5, -9.5, -17, -13.5]);
    expect([FLOOR.tileMetres, FLOOR.seamMetres, FLOOR.baseNear, FLOOR.baseFar]).toEqual([3.4, 0.05, 0x1c1f3e, 0x14162c]);
    expect([FLOOR.streak, FLOOR.figureReflection, FLOOR.backScale]).toEqual([2.1, 0.5, 0.5]);
    expect(FLOOR.fadeFar).toBeLessThan(FLOOR.fadeNear);
    expect(FLOOR.horizonZ).toBeGreaterThan(FLOOR.fadeFar); // the horizon is inside the fade, where the floor is meeting the painting
    expect([CONTACT.radius, CONTACT.opacity, CONTACT.colour, CONTACT.push]).toEqual([0.75, 0.5, 0x120a14, 0.12]);
  });

  it('declares exactly the uniforms the material carries (the Reflector\'s own colour, mirror and matrix included): a missing one throws at the first draw', () => {
    const floor = new WetFloor(grain());
    const m = floor.mesh.material as ShaderMaterial;
    const declare = (src: string): string[] => {
      const out: string[] = [];
      for (const d of src.matchAll(/uniform\s+\w+\s+([^;]+);/g)) for (const part of d[1]!.split(',')) out.push(part.replace(/\/\/.*$/, '').trim());
      return out;
    };
    const declared = new Set([...declare(FLOOR_FRAG), ...declare(FLOOR_VERT)]);
    const carried = new Set(Object.keys(m.uniforms));
    expect([...declared].filter((n) => !carried.has(n)), 'declared, not carried').toEqual([]);
    expect([...carried].filter((n) => !declared.has(n)), 'carried, never declared').toEqual([]);
    floor.dispose();
  });

  it('is the lab\'s shader: the lantern streaks mirrored about the horizon, the figures mirrored and smeared, the seams, the far fade; linear out, with the alpha the fade', () => {
    for (const piece of ['float a = smoothstep(uFadeFar, uFadeNear, vWP.z);', 'float dy = max(uYh - sUv.y, 0.0);', 'float sy = uYh + dy * uStretch;', 'texture2D(tBack,', 'texture2DProj(tDiffuse, pj)', 'col += fr * uFigRefl', 'col += streak * seam * uSeamGlow', 'gl_FragColor = vec4(col, a);']) expect(FLOOR_FRAG, piece).toContain(piece);
    expect(FLOOR_VERT).toContain('vProj = textureMatrix * vec4(position, 1.0);');
    for (const src of [FLOOR_FRAG, FLOOR_VERT]) {
      const count = (c: string): number => src.split(c).length - 1;
      expect(count('{')).toBe(count('}'));
      expect(count('(')).toBe(count(')'));
      expect(src.match(/void main\(\)/g)).toHaveLength(1);
    }
  });
});

describe('the floor in the scene', () => {
  it('lies flat at z -5, draws before the deck did, blends as a transparent plane and writes no depth, so the pools and the hole draw over it', () => {
    const floor = new WetFloor(grain());
    const m = floor.mesh.material as ShaderMaterial;
    expect([floor.mesh.rotation.x, floor.mesh.position.x, floor.mesh.position.y, floor.mesh.position.z]).toEqual([-Math.PI / 2, 0, 0, -5]);
    expect(floor.mesh.renderOrder).toBe(FLOOR_RENDER_ORDER);
    expect(FLOOR_RENDER_ORDER).toBe(-50);
    expect([m.transparent, m.depthWrite]).toEqual([true, false]);
    expect(floor.mesh.layers.isEnabled(LAYER.figure)).toBe(false);
    expect(floor.mesh.layers.isEnabled(LAYER.backdrop)).toBe(false);
    expect((m.uniforms['uBaseNear']!.value as Color).getHex()).toBe(0x1c1f3e);
    floor.dispose();
  });

  it('draws the backdrop alone and the figures alone from inside its own draw, takes the background off for the mirror, and leaves the renderer and the scene as it found them', () => {
    const floor = new WetFloor(grain());
    const outer = new WebGLRenderTarget(1600, 900);
    const f = fakeRenderer(outer);
    const scene = new Scene();
    const bg = new Color(0x224466);
    scene.background = bg;
    scene.add(floor.mesh);
    scene.updateMatrixWorld(true);
    const camera = cameraAt();
    const mask = camera.layers.mask;
    floor.mesh.onBeforeRender(f.r, scene, camera, floor.mesh.geometry, floor.mesh.material as ShaderMaterial, null as never);

    expect(f.calls).toHaveLength(2);
    const [back, mirror] = f.calls as [Call, Call];
    expect(back.layers).toBe(1 << LAYER.backdrop); // the painting alone
    expect(back.background).not.toBeNull(); // on its flat colour
    expect(back.camera).toBe(camera);
    expect(mirror.layers).toBe(1 << LAYER.figure); // the figures alone, from the mirrored camera
    expect(mirror.camera).not.toBe(camera);
    expect(mirror.background).toBeNull(); // a background colour would be reflected everywhere
    expect(floor.backdropFrames).toBe(1);
    expect(floor.backSize).toEqual({ width: 800, height: 450 }); // half the frame on a side

    expect(scene.background).toBe(bg);
    expect(camera.layers.mask).toBe(mask);
    expect(f.target).toBe(outer);
    expect(f.raw.shadowMap.autoUpdate).toBe(true);
    expect(floor.mesh.visible).toBe(true);
    floor.dispose();
    outer.dispose();
  });

  it('hands its shader the backdrop render, the frame\'s size and the horizon\'s height for this camera, and follows a resized frame', () => {
    const floor = new WetFloor(grain());
    const scene = new Scene();
    scene.add(floor.mesh);
    scene.updateMatrixWorld(true);
    const camera = cameraAt();
    const t = new WebGLRenderTarget(2560, 1440);
    floor.mesh.onBeforeRender(fakeRenderer(t).r, scene, camera, floor.mesh.geometry, floor.mesh.material as ShaderMaterial, null as never);
    const u = (floor.mesh.material as ShaderMaterial).uniforms;
    expect(u['tBack']!.value).not.toBeNull();
    expect((u['uRes']!.value as Vector2).toArray()).toEqual([2560, 1440]);
    expect(u['uYh']!.value).toBeCloseTo(horizonHeight(camera), 9);
    expect(floor.backSize).toEqual({ width: 1280, height: 720 });
    const small = new WebGLRenderTarget(640, 360);
    floor.mesh.onBeforeRender(fakeRenderer(small).r, scene, camera, floor.mesh.geometry, floor.mesh.material as ShaderMaterial, null as never);
    expect(floor.backSize).toEqual({ width: 320, height: 180 }); // resized, not remade
    t.dispose();
    small.dispose();
    floor.dispose();
  });

  it('puts the horizon where the floor meets the painting: above the middle of frame A\'s screen, and a different height from a different camera', () => {
    const h = horizonHeight(cameraAt(RIGS['idle']!));
    expect(h).toBeGreaterThan(0.5);
    expect(h).toBeLessThan(0.9);
    expect(horizonHeight(cameraAt(RIGS['overdrive']!))).not.toBeCloseTo(h, 2);
    expect(horizonHeight(cameraAt(), new Vector3())).toBeCloseTo(h, 12);
  });
});

describe('the contact shadows', () => {
  it('fall off from 1 at the centre to 0 at the edge and beyond, smoothly', () => {
    expect(discAlpha(0)).toBe(1);
    expect(discAlpha(1)).toBe(0);
    expect(discAlpha(2)).toBe(0);
    let last = 1;
    for (let d = 0; d <= 1; d += 0.05) {
      expect(discAlpha(d)).toBeLessThanOrEqual(last + 1e-12);
      last = discAlpha(d);
    }
    expect(discAlpha(0.5)).toBeCloseTo(Math.pow(0.5, 1.6), 9);
  });

  it('bake into a white texture with the falloff in alpha: opaque in the middle, clear at the corner', () => {
    const t = discTexture(32);
    const d = t.image.data as Uint8Array;
    const at = (x: number, y: number): number[] => Array.from(d.slice((y * 32 + x) * 4, (y * 32 + x) * 4 + 4));
    expect(at(16, 16).slice(0, 3)).toEqual([255, 255, 255]);
    expect(at(16, 16)[3]!).toBeGreaterThan(230);
    expect(at(0, 0)[3]).toBe(0);
    t.dispose();
  });

  it('are sized by the figure: 0.75 m per party height, and the boss\'s three times that', () => {
    expect(discRadius('yuna', PARTY_HEIGHT)).toBeCloseTo(0.75, 9);
    expect(discRadius('rikku', PARTY_HEIGHT * 2)).toBeCloseTo(1.5, 9);
    expect(discRadius('bahamut', BOSS_HEIGHT)).toBeCloseTo(((0.75 * BOSS_HEIGHT) / PARTY_HEIGHT) * 3.2, 9);
  });

  it('follow a figure: under its world position, pushed away from the key light, lifted a hair off the floor, flat, and shrunk to its radius', () => {
    const parent = new Group();
    const shadows = new ContactShadows(parent, YRP_CAST);
    const root = new Object3D();
    root.position.set(4.6, 0, 0.2);
    parent.add(root);
    parent.updateMatrixWorld(true);
    shadows.follow('yuna', root, PARTY_HEIGHT);
    const disc = shadows.get('yuna')!;
    const key = frameALights().dir.key;
    expect(disc.position.x).toBeCloseTo(4.6 - key[0] * 0.24, 9);
    expect(disc.position.z).toBeCloseTo(0.2 - key[2] * 0.24, 9);
    expect(disc.position.y).toBeCloseTo(0.012, 9);
    expect(disc.rotation.x).toBe(-Math.PI / 2);
    expect(disc.scale.x).toBeCloseTo(0.75, 9);
    expect(disc.visible).toBe(true);
    expect((disc.material as MeshBasicMaterial).opacity).toBeCloseTo(0.5, 9);
    // a lunge moves the figure, and the disc goes with it
    root.position.x = 2.0;
    parent.updateMatrixWorld(true);
    shadows.follow('yuna', root, PARTY_HEIGHT);
    expect(disc.position.x).toBeCloseTo(2.0 - key[0] * 0.24, 9);
    shadows.dispose();
  });

  it('fade with the figure and hide with it, and a figure that is not there is no error', () => {
    const parent = new Group();
    const shadows = new ContactShadows(parent, ['yuna']);
    const root = new Object3D();
    parent.add(root);
    shadows.follow('yuna', root, PARTY_HEIGHT, 0.5);
    expect((shadows.get('yuna')!.material as MeshBasicMaterial).opacity).toBeCloseTo(0.25, 9);
    shadows.follow('yuna', root, PARTY_HEIGHT, 0);
    expect(shadows.get('yuna')!.visible).toBe(false);
    root.visible = false;
    shadows.follow('yuna', root, PARTY_HEIGHT, 1);
    expect(shadows.get('yuna')!.visible).toBe(false);
    expect(() => shadows.follow('rikku', root, PARTY_HEIGHT)).not.toThrow();
    expect(shadows.get('rikku')).toBeUndefined();
    shadows.dispose();
    expect(parent.children).toEqual([root]); // the discs are gone; the figure's own root is not theirs to remove
  });
});

describe('the stage look', () => {
  function chamber(): { group: Group; backdrop: Group; deck: Mesh; reflections: Mesh } {
    const group = new Group();
    const deck = new Mesh();
    deck.name = 'machina-deck';
    const reflections = new Mesh();
    reflections.name = 'deck-reflections';
    const backdrop = new Group();
    backdrop.add(new Mesh(), new Mesh());
    group.add(deck, reflections, backdrop);
    return { group, backdrop, deck, reflections };
  }

  it('hides Chapter IV\'s deck and its reflection sheet, puts the backdrop on its layer, and adds the floor and a disc per figure', () => {
    const { group, backdrop, deck, reflections } = chamber();
    const stage = applyStage(group, backdrop, YRP_CAST);
    expect([deck.visible, reflections.visible]).toEqual([false, false]);
    expect(HIDDEN_DECK).toEqual(['machina-deck', 'deck-reflections']);
    backdrop.traverse((o) => expect(o.layers.isEnabled(LAYER.backdrop)).toBe(true));
    expect(group.children).toContain(stage.floor.mesh);
    for (const id of YRP_CAST) expect(group.getObjectByName(`yrp-contact-${id}`)).toBeDefined();
    expect(stage.palette).toEqual(YRP_PALETTE);
    expect(stage.palette).not.toBe(YRP_PALETTE); // a copy: the renderer may patch it
    stage.dispose();
    expect([deck.visible, reflections.visible]).toEqual([true, true]); // the deck comes back with the scene's end
    expect(group.getObjectByName('yrp-wet-floor')).toBeUndefined();
  });

  it('survives a chamber with no deck to hide, and puts a layer on every object under a root', () => {
    const group = new Group();
    const backdrop = new Group();
    const stage = applyStage(group, backdrop, ['yuna']);
    stage.dispose();
    const root = new Group();
    const child = new Object3D();
    root.add(child);
    putOnLayer(root, 5);
    expect([root.layers.isEnabled(5), child.layers.isEnabled(5), child.layers.isEnabled(0)]).toEqual([true, true, true]);
  });

  it('grades neutrally and encodes: gamma 2.2, nothing lifted, tinted, tilted or bloomed much, the figure mask in full', () => {
    expect(YRP_PALETTE.gamma).toEqual([2.2, 2.2, 2.2]);
    expect([YRP_PALETTE.lift, YRP_PALETTE.gain, YRP_PALETTE.saturation, YRP_PALETTE.shadowTintAmount, YRP_PALETTE.tiltMaxBlur, YRP_PALETTE.figureBloomMask]).toEqual([[0, 0, 0], [1, 1, 1], 1, 0, 0, 1]);
    expect(YRP_PALETTE.bloomStrength!).toBeLessThan(0.3);
    expect(YRP_PALETTE.vignette!).toBeLessThan(0.2);
  });
});
