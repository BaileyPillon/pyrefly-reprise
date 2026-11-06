/**
 * **Making a loaded model anime** (`src/engine/ww3d/celify.ts`; the hidden anime chapter, FFX-2 only), pinned in Node: a girl gets the cel material, her face mask, an outline hull on her skeleton whose width is zero in the
 * face; Valefor gets a plain hull that bends with her wings; the set it returns is driven by the Wind Waker chapter's own `driveToon` (the hit flash, the cast aura, the fade) and freed with `disposeToon`; and a `WwModel`
 * and `loadWwModels` handed the anime staging and shading stand the girls from `anime/<id>.glb` under the cel, shaded, turned and weaponed by this chapter's numbers while the default stays the Wind Waker chapter's.
 */
import { Box3, Color, Group, Mesh, ShaderLib, SkinnedMesh, Vector3, type BufferAttribute, type MeshBasicMaterial, type MeshToonMaterial } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { ANIME_CAMERA_POSITION, ANIME_PARTY_SLOTS, ANIME_STAGING, ANIME_WEAPON_SCALE, ANIME_WORLD_HEIGHT } from '../../../src/engine/ww3d/animeLayout.ts';
import { CEL_LOOKS, createCelUniforms } from '../../../src/engine/ww3d/cel.ts';
import { celify, createCelRig, type CelStyle } from '../../../src/engine/ww3d/celify.ts';
import { capsuleFigure } from '../../../src/engine/ww3d/capsule.ts';
import { WW_BOSS_ID, WW_CAST, WW_STAGING, bodyYaw, WORLD_HEIGHT } from '../../../src/engine/ww3d/layout.ts';
import { loadWwModels, WwModel } from '../../../src/engine/ww3d/model.ts';
import { createOutlineUniforms } from '../../../src/engine/ww3d/outline.ts';
import { createToonUniforms, type ShaderLike } from '../../../src/engine/ww3d/toon.ts';
import { disposeToon, driveToon } from '../../../src/engine/ww3d/toonify.ts';
import { createWingUniforms, patchWingVertex } from '../../../src/engine/ww3d/wing.ts';
import { fakeIo, valefor, type File } from '../helpers/wwFixtures.ts';
import { plainMesh, skinnedGirl } from '../helpers/animeFixtures.ts';

const style = (look: keyof typeof CEL_LOOKS = 'genshin', outline = true): CelStyle => ({ look: CEL_LOOKS[look], uniforms: createCelUniforms(CEL_LOOKS[look]), outline: outline ? createOutlineUniforms(CEL_LOOKS[look].outline) : null });
const channels = (opacity = 1): Parameters<typeof driveToon>[1] => ({ colour: new Color(0.5, 0.5, 0.5), emissive: new Color(1, 0, 0), amount: 0.4, opacity });

describe('a girl', () => {
  it('gets the cel material on every mesh (the colour map kept, the normal map let go), her face mask and a hull on her own skeleton', () => {
    const g = skinnedGirl();
    const map = g.material.map;
    const released = vi.spyOn(g.material.normalMap!, 'dispose');
    const set = celify(g.scene, style(), { id: 'yuna' });
    expect(set.entries).toHaveLength(1);
    const m = g.mesh.material as MeshToonMaterial;
    expect(m.userData['ww']).toBe('cel');
    expect(m.map).toBe(map);
    expect(released, 'the normal map is never read: its bitmap is closed').toHaveBeenCalled();
    expect(g.mesh.geometry.attributes['aFace']).toBeDefined();
    const aFace = Array.from((g.mesh.geometry.attributes['aFace'] as BufferAttribute).array);
    expect([aFace[0], aFace[2], aFace[3], aFace[4]], 'the face vertex is face; the hair, the crown and the body are not').toEqual([1, 0, 0, 0]);
    const hull = g.scene.getObjectByName('Mesh_0:outline') as SkinnedMesh;
    expect(hull).toBeInstanceOf(SkinnedMesh);
    expect(hull.skeleton).toBe(g.skeleton);
    const thick = Array.from((hull.geometry.attributes['aThick'] as BufferAttribute).array);
    expect(thick[0], 'no line across the face').toBeCloseTo(0, 6);
    expect(thick[2], 'full on the hair').toBe(1);
    expect(thick[4], 'full on the body').toBe(1);
    expect([g.mesh.castShadow, g.mesh.receiveShadow, g.mesh.frustumCulled]).toEqual([true, true, false]);
    expect(set.meshes).toEqual([g.mesh]);
  });

  it('with no outline, no hull; with ?outline=0 the face is still measured', () => {
    const g = skinnedGirl();
    celify(g.scene, style('gg', false), { id: 'yuna' });
    expect(g.scene.getObjectByName('Mesh_0:outline')).toBeUndefined();
    expect(g.mesh.geometry.attributes['aFace']).toBeDefined();
  });

  it('a figure given no id has no face (a weapon\'s skinned mesh would not either), but still every mesh gets the attribute the program reads', () => {
    const g = skinnedGirl();
    const set = celify(g.scene, style(), {});
    expect(set.entries).toHaveLength(1);
    expect(g.scene.getObjectByName('Mesh_0:outline'), 'a skinned mesh with no face has no hull').toBeUndefined();
    expect(Array.from((g.mesh.geometry.attributes['aFace'] as BufferAttribute).array)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('shares the look\'s uniforms between figures but gives each its own cast aura cell', () => {
    const s = style();
    const a = celify(skinnedGirl().scene, s, { id: 'yuna' });
    const b = celify(skinnedGirl().scene, s, { id: 'rikku' });
    const ua = a.entries[0]!.material.userData['uniforms'] as Record<string, unknown>;
    const ub = b.entries[0]!.material.userData['uniforms'] as Record<string, unknown>;
    expect(ua['uAT']).toBe(ub['uAT']);
    expect(ua['uARamp']).toBe(ub['uARamp']);
    expect(ua['uToonGlow']).toBe(a.glow);
    expect(ub['uToonGlow']).toBe(b.glow);
    expect(a.glow).not.toBe(b.glow);
    expect(a.glowShape).not.toBe(b.glowShape);
  });
});

describe('the set is driven and freed by the Wind Waker chapter\'s own functions', () => {
  it('`driveToon` sets the colour, the flash and the aura on a cel figure, and fades its hulls with it', () => {
    const g = skinnedGirl();
    const set = celify(g.scene, style(), { id: 'yuna' });
    const hull = g.scene.getObjectByName('Mesh_0:outline') as Mesh;
    driveToon(set, { ...channels(), rim: { colour: [1, 0.5, 0.2], strength: 0.7 } });
    const m = set.entries[0]!.material;
    expect(m.color.r).toBeCloseTo(set.entries[0]!.base.r * 0.5, 5);
    expect(m.emissive.r).toBe(1);
    expect(m.emissiveIntensity).toBe(0.4);
    expect(set.glow.value.toArray()).toEqual([1, 0.5, 0.2, 0.7]);
    expect((hull.material as MeshBasicMaterial).transparent, 'solid').toBe(false);
    driveToon(set, channels(0.5));
    expect((hull.material as MeshBasicMaterial).transparent, 'fading').toBe(true);
    expect((hull.material as MeshBasicMaterial).opacity).toBe(0.5);
    expect(m.transparent).toBe(true);
    driveToon(set, channels(1));
    expect((hull.material as MeshBasicMaterial).transparent).toBe(false);
    expect(set.glow.value.w, 'no rim given: the aura is off').toBe(0);
  });

  it('`disposeToon` takes the hulls off, frees their own geometry and the materials, and the skeleton once', () => {
    const g = skinnedGirl();
    const set = celify(g.scene, style(), { id: 'yuna' });
    const hull = g.scene.getObjectByName('Mesh_0:outline') as SkinnedMesh;
    const geo = vi.spyOn(hull.geometry, 'dispose');
    const mat = vi.spyOn(hull.material as MeshBasicMaterial, 'dispose');
    const own = vi.spyOn(set.entries[0]!.material, 'dispose');
    const bones = vi.spyOn(g.skeleton, 'dispose');
    disposeToon(set, false);
    expect(g.scene.getObjectByName('Mesh_0:outline')).toBeUndefined();
    expect([geo.mock.calls.length, mat.mock.calls.length, own.mock.calls.length]).toEqual([1, 1, 1]);
    expect(bones, 'the hull shares the skeleton: freed once').toHaveBeenCalledTimes(1);
  });
});

describe('Valefor and the weapons: a plain hull', () => {
  it('a static mesh gets the cel and a hull that bends with her wings: the wing patch runs on the hull, and its normal is bent too', () => {
    const root = new Group();
    const m = plainMesh();
    root.add(m);
    const wu = createWingUniforms();
    const onVertex = (shader: ShaderLike): void => void patchWingVertex(shader, wu, true);
    const set = celify(root, style(), { cacheKey: '-wing', onVertex, receive: false });
    expect((m.material as MeshToonMaterial).userData['ww']).toBe('cel');
    expect((m.material as MeshToonMaterial).customProgramCacheKey()).toBe('ww-cel-v1-wing');
    expect(m.receiveShadow).toBe(false);
    const hull = root.getObjectByName('Mesh_0:outline') as Mesh;
    expect(hull).toBeDefined();
    expect(hull).not.toBeInstanceOf(SkinnedMesh);
    const shader: ShaderLike = { vertexShader: ShaderLib['basic']!.vertexShader, fragmentShader: ShaderLib['basic']!.fragmentShader, uniforms: {} };
    (hull.material as MeshBasicMaterial).onBeforeCompile(shader as never, undefined as never);
    expect(shader.vertexShader).toContain('transformed = wfBend( position );');
    expect(shader.vertexShader).toContain('vec3 hullN = wfBendNormal( position, normal );');
    expect(Object.keys(shader.uniforms)).toEqual(expect.arrayContaining(['uOutline', 'uBoss', 'uWing']));
    expect(set.extras).toBeDefined();
  });

  it('a shadow depth material the model hands over is kept on the mesh (her cast shadow flaps with her wings)', () => {
    const root = new Group();
    const m = plainMesh();
    root.add(m);
    const depth = { isMaterial: true } as never;
    celify(root, style(), { depthMaterial: depth });
    expect(m.customDepthMaterial).toBe(depth);
  });
});

describe('the rig a scene hands its models', () => {
  it('is the look\'s uniforms and outline made once, the shading the models take, and a weapon style: this chapter\'s specs at 1.3', () => {
    const rig = createCelRig('gg');
    expect(rig.look).toBe('gg');
    expect(rig.style.look).toBe(CEL_LOOKS.gg);
    expect(rig.style.outline).not.toBeNull();
    expect(rig.shading.props?.swapScale).toBe(ANIME_WEAPON_SCALE);
    expect(rig.shading.props?.specs?.['yuna']).toHaveLength(2);
    expect(createCelRig('genshin', { outline: false }).style.outline).toBeNull();
    const spy = vi.spyOn(rig.style.uniforms.uARamp.value, 'dispose');
    rig.dispose();
    expect(spy).toHaveBeenCalled();
  });
});

describe('a model handed the anime staging and shading', () => {
  const ctx = (shading = createCelRig('genshin').shading, staging = ANIME_STAGING): ConstructorParameters<typeof WwModel>[5] => ({ uniforms: createToonUniforms(), camera: ANIME_CAMERA_POSITION, staging, shading });

  it('is made cel, not toon, and fitted to this chapter\'s height', () => {
    const g = skinnedGirl();
    const model = new WwModel('yuna', g.scene, g.animations, ANIME_WORLD_HEIGHT.yuna, 'own', ctx());
    expect(model.materials.every((e) => e.material.userData['ww'] === 'cel')).toBe(true);
    expect(model.height).toBe(1.6);
    expect(model.animated).toBe(true);
    expect(model.falls, 'the toon girls carry a knock-out clip: the fall is theirs, not a tip').toBe(true);
    const size = new Box3().setFromObject(model.root).getSize(new Vector3());
    expect(size.y).toBeCloseTo(1.6, 1);
    const plain = new WwModel('yuna', skinnedGirl().scene, skinnedGirl().animations, 1.5, 'own', { uniforms: createToonUniforms(), camera: ANIME_CAMERA_POSITION });
    expect(plain.materials.every((e) => e.material.userData['ww'] === 'toon'), 'the default shading is the Wind Waker toon').toBe(true);
  });

  it('turns her body by this chapter\'s 42 degrees and not the Wind Waker chapter\'s 62', () => {
    const g = skinnedGirl();
    const model = new WwModel('yuna', g.scene, g.animations, 1.6, 'own', ctx());
    const slot = ANIME_PARTY_SLOTS[0]!;
    const stance = model.stanceYaw ?? 0;
    expect(model.bodyYawAt(slot)).toBeCloseTo(bodyYaw(slot, ANIME_CAMERA_POSITION, stance, 42), 6);
    const ww = new WwModel('yuna', skinnedGirl().scene, skinnedGirl().animations, 1.5, 'own', { uniforms: createToonUniforms(), camera: ANIME_CAMERA_POSITION });
    expect(ww.bodyYawAt(slot)).toBeCloseTo(bodyYaw(slot, ANIME_CAMERA_POSITION, ww.stanceYaw ?? 0, WW_STAGING.bodyOffDeg), 6);
    expect(ww.bodyYawAt(slot)).not.toBeCloseTo(model.bodyYawAt(slot), 3);
  });

  it('holds a weapon from a file at 1.3 (mirrored in the left hand), made cel, and the procedural stand-in when there is none', () => {
    const swapped = new Group();
    swapped.add(plainMesh());
    const g = skinnedGirl();
    const model = new WwModel('yuna', g.scene, g.animations, 1.6, 'own', { ...ctx(), swaps: { pistol: swapped } });
    expect(model.weapons).toHaveLength(2);
    expect(model.swappedProps).toBe(2);
    expect(model.weapons.map((w) => w.scale.x).sort()).toEqual([-ANIME_WEAPON_SCALE, ANIME_WEAPON_SCALE]);
    expect(model.weapons[0]!.scale.y).toBe(ANIME_WEAPON_SCALE);
    let cel = 0;
    model.weapons[0]!.traverse((o) => {
      if ((o as Mesh).isMesh && ((o as Mesh).material as MeshToonMaterial).userData['ww'] === 'cel') cel++;
    });
    expect(cel, 'the weapon\'s own mesh is cel (its hull is a basic material)').toBeGreaterThan(0);
    const bare = new WwModel('yuna', skinnedGirl().scene, skinnedGirl().animations, 1.6, 'own', ctx());
    expect(bare.weapons).toHaveLength(2);
    expect(bare.swappedProps).toBe(0);
  });

  it('a capsule stands as the plain toon whatever shading the scene hands', () => {
    const model = new WwModel('yuna', capsuleFigure('yuna'), [], 1.6, 'capsule', ctx());
    expect(model.materials.every((e) => e.material.userData['ww'] === 'toon')).toBe(true);
    expect(model.weapons).toHaveLength(0);
  });

  it('Valefor hovers at this chapter\'s hover and is turned this chapter\'s yaw', () => {
    const v = valefor();
    const model = new WwModel(WW_BOSS_ID, v.scene, v.animations, ANIME_WORLD_HEIGHT[WW_BOSS_ID], 'own', ctx());
    expect(model.flap).not.toBeNull();
    model.update(0.01);
    const yaw = (model as unknown as { yawGroup: Group }).yawGroup.rotation.y;
    expect(yaw).toBeCloseTo((ANIME_STAGING.bossYawDeg * Math.PI) / 180, 2); // the fixed turn toward the party, plus her own slight sway
    const hover = (model as unknown as { hoverGroup: Group }).hoverGroup.position.y;
    expect(hover).toBeGreaterThan(ANIME_STAGING.bossHover - 0.3);
    expect(hover).toBeLessThan(ANIME_STAGING.bossHover + 0.3);
  });
});

describe('loading the cast with the anime staging', () => {
  const girlFile: File = () => skinnedGirl();
  const files = { 'anime/yuna.glb': girlFile, 'anime/rikku.glb': girlFile, 'anime/paine.glb': girlFile, 'valefor.glb': () => valefor() };

  it('finds the girls in anime/ and Valefor beside the Wind Waker chapter\'s own files, every one its own and cel', async () => {
    const loaded = await loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights: ANIME_WORLD_HEIGHT, io: fakeIo(files), context: { uniforms: createToonUniforms(), camera: ANIME_CAMERA_POSITION, staging: ANIME_STAGING, shading: createCelRig('blend').shading } });
    expect(loaded.capsules).toEqual([]);
    for (const id of WW_CAST) expect(loaded.models.get(id)?.source, id).toBe('own');
    expect(loaded.models.get('yuna')!.materials.every((e) => e.material.userData['ww'] === 'cel')).toBe(true);
    loaded.dispose();
  });

  it('with the default staging, the same files are not found (the girls are in anime/, not beside Valefor): capsules, and the log says so', async () => {
    const log = vi.fn();
    const loaded = await loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights: WORLD_HEIGHT, io: fakeIo(files), log, context: { uniforms: createToonUniforms(), camera: ANIME_CAMERA_POSITION } });
    expect([...loaded.capsules].sort()).toEqual(['paine', 'rikku', 'yuna']);
    expect(loaded.models.get(WW_BOSS_ID)?.source).toBe('own');
    expect(log).toHaveBeenCalledTimes(3);
    loaded.dispose();
  });
});
