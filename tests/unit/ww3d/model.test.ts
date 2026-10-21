/**
 * **A model made toon and fitted to a figure** (`src/engine/ww3d/model.ts`, `capsule.ts`; FFX-2 only), pinned in Node with fake file IO: the contract a model file is made to (a skeleton with the names the chapter reads),
 * the fit (the world height, the anchor, the feet on the floor), the capsule that stands in for a missing or broken file, the weapons on the hands, the head turn, the clips, Valefor's flap, hover and fall.
 */
import { Box3, Vector3, type Mesh } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { CAPSULE_COLOUR, capsuleFigure } from '../../../src/engine/ww3d/capsule.ts';
import {
  BOSS_BOB,
  BOSS_HEIGHT,
  BOSS_HOVER,
  BOSS_YAW_DEG,
  PARTY_HEIGHT,
  TEMPLE_NAMES,
  WORLD_HEIGHT,
  WW_BOSS_ID,
  WW_CAST,
  rad,
  type V3,
  type WwId,
} from '../../../src/engine/ww3d/layout.ts';
import { loadWwModels, MOUTH_LOCAL, CHEST_LOCAL, WwModel, type ModelContext } from '../../../src/engine/ww3d/model.ts';
import { createToonUniforms } from '../../../src/engine/ww3d/toon.ts';
import { RATE_ACTIVE } from '../../../src/engine/ww3d/wing.ts';
import { fakeIo, girl, valefor, type File } from '../helpers/wwFixtures.ts';

const CAMERA: V3 = [1, 0.37, 3.2];
const ctx = (): ModelContext => ({ uniforms: createToonUniforms(), camera: CAMERA });
const heights = WORLD_HEIGHT;

describe('the stand-in for a missing file', () => {
  it('is a capsule for every figure, a girl 1.2 m and a 3-head figure, Valefor 3.5 m with wings, each in its own colour and facing +Z', () => {
    for (const id of WW_CAST) {
      const g = capsuleFigure(id);
      const size = new Box3().setFromObject(g).getSize(new Vector3());
      expect(g.name).toBe(`capsule-${id}`);
      if (id === WW_BOSS_ID) {
        expect(size.y).toBeGreaterThan(3.2);
        expect(size.x).toBeGreaterThan(4.5);
        expect(g.getObjectByName('wing-left')).toBeDefined();
      } else {
        expect(size.y).toBeGreaterThan(1.1);
        expect(size.y).toBeLessThan(1.4);
        // the head is the largest part of a short figure: wider than the body it sits on
        const head = new Box3().setFromObject(g.getObjectByName('head')!).getSize(new Vector3());
        const body = new Box3().setFromObject(g.getObjectByName('body')!).getSize(new Vector3());
        expect(head.x).toBeGreaterThan(body.x);
      }
      const nose = g.getObjectByName(id === WW_BOSS_ID ? 'beak' : 'nose')!;
      expect(nose.position.z).toBeGreaterThan(0.1); // the way it faces
    }
    expect(new Set(Object.values(CAPSULE_COLOUR)).size).toBe(4);
  });

  it('stands in for every figure when no file is there: four capsules, said once each in the log, and the models still fit their heights', async () => {
    const log: string[] = [];
    const models = await loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights, context: ctx(), io: fakeIo({}), log: (m) => log.push(m) });
    expect([...models.capsules].sort()).toEqual([...WW_CAST].sort());
    expect(log).toHaveLength(4);
    for (const id of WW_CAST) {
      const m = models.models.get(id)!;
      expect(m.source).toBe('capsule');
      expect(m.height).toBe(heights[id]);
      expect(m.animated).toBe(false);
      expect(m.weapons).toHaveLength(0);
      m.root.updateMatrixWorld(true);
      const box = new Box3().setFromObject(m.root);
      expect(box.max.y - box.min.y, id).toBeCloseTo(heights[id], 1);
      expect(box.min.y, `${id} stands on the floor, Valefor a hover above it`).toBeCloseTo(id === WW_BOSS_ID ? BOSS_HOVER : 0, 1);
    }
    models.dispose();
  });

  it('counts a file that will not parse as missing, and warns once', async () => {
    const warn: string[] = [];
    const models = await loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights, context: ctx(), io: fakeIo({}, ['yuna.glb']), warn: (m) => warn.push(m) });
    expect(models.capsules).toContain('yuna');
    expect(models.models.get('yuna')!.source).toBe('capsule');
    expect(warn).toHaveLength(1);
    expect(warn[0]).toMatch(/yuna\.glb did not parse/);
  });
});

describe('a girl\'s file', () => {
  const load = async (extra: Record<string, File> = {}) =>
    loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights, context: ctx(), io: fakeIo({ 'yuna.glb': girl, 'valefor.glb': valefor, ...extra }) });

  it('is the figure\'s own model, fitted to its world height with its feet on the floor, centred, with a stance and the weapons on both hands', async () => {
    const models = await load();
    const yuna = models.models.get('yuna')!;
    expect(yuna.source).toBe('own');
    expect([...models.capsules].sort()).toEqual(['paine', 'rikku']);
    expect(yuna.animated).toBe(true);
    expect(yuna.playing).toBe('idle');
    expect(yuna.turnsHead).toBe(true);
    expect(yuna.weapons).toHaveLength(2);
    expect(yuna.swappedProps).toBe(0);
    // the body (without the weapons the box was taken before) stands 1.5 m, feet on y 0, centred on the origin
    const body = yuna.root.getObjectByName('Hips')!.parent!.children.find((c) => (c as Mesh).isMesh)!;
    const box = new Box3().setFromObject(body);
    expect(box.max.y - box.min.y).toBeCloseTo(PARTY_HEIGHT, 5);
    expect(box.min.y).toBeCloseTo(0, 5);
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0, 5);
    expect(yuna.stanceYaw).not.toBeNull();
    expect(yuna.stanceYaw!).toBeCloseTo(0, 5); // this made-up girl stands square to +Z
    models.dispose();
  });

  it('refits to another height and keeps its feet on the floor; resizing to the same height is a no-op', async () => {
    const models = await load();
    const yuna = models.models.get('yuna')!;
    yuna.fitTo(2);
    expect(yuna.height).toBe(2);
    yuna.root.updateMatrixWorld(true);
    const body = yuna.root.getObjectByName('Hips')!.parent!.children.find((c) => (c as Mesh).isMesh)!;
    const box = new Box3().setFromObject(body);
    expect(box.max.y - box.min.y).toBeCloseTo(2, 5);
    expect(box.min.y).toBeCloseTo(0, 5);
    yuna.fitTo(2);
    yuna.fitTo(-1);
    yuna.fitTo(0);
    expect(yuna.height).toBe(2);
    models.dispose();
  });

  it('turns the body to the lens by the stance and the slot, and plays a clip on the beat then returns to the stance', async () => {
    const models = await load();
    const yuna = models.models.get('yuna')!;
    const slot: V3 = [-0.34, 0, 0.89];
    const yaw = yuna.bodyYawAt(slot);
    expect(Math.abs(yaw)).toBeGreaterThan(0.5);
    yuna.setYaw(yaw);
    yuna.update(0.016);
    const yawGroup = yuna.root.children[0]!.children[0]!;
    expect(yawGroup.rotation.y).toBeCloseTo(yaw + 0, 2);
    yuna.noteOpen('attack', 0.3, 1);
    yuna.update(0.016);
    expect(yuna.playing).toBe('attack');
    for (let i = 0; i < 300; i++) yuna.update(0.016);
    expect(yuna.playing).toBe('idle');
    yuna.notePose('hurt', false, 1);
    expect(yuna.playing).toBe('hit');
    models.dispose();
  });

  it('turns the head toward the viewer every frame, after the clip', async () => {
    const models = await load();
    const yuna = models.models.get('yuna')!;
    yuna.setYaw(yuna.bodyYawAt([-0.34, 0, 0.89]));
    yuna.update(0.016);
    const head = yuna.root.getObjectByName('Head')!;
    const before = head.quaternion.clone();
    yuna.update(0.016);
    expect(head.quaternion.angleTo(before)).toBeLessThan(5e-3); // steady from frame to frame (the stance's own sway is all that moves)
    // the face is FACE_OFF_DEG off the direction to the lens: measured on the posed bones
    yuna.root.updateMatrixWorld(true);
    const p = head.getWorldPosition(new Vector3());
    const f = yuna.root.getObjectByName('headfront')!.getWorldPosition(new Vector3()).sub(p);
    const facing = Math.atan2(f.x, f.z);
    const toCam = Math.atan2(CAMERA[0] - p.x, CAMERA[2] - p.z);
    expect(facing - toCam).toBeCloseTo(rad(46), 1);
    models.dispose();
  });

  it('puts the weapons on the hand bones, aims them once at a target, and frees everything it made', async () => {
    const models = await load();
    const yuna = models.models.get('yuna')!;
    expect(yuna.weapons.map((w) => w.parent?.name)).toEqual(['LeftHand', 'RightHand']);
    yuna.aimWeapons(new Vector3(4, 2.2, -3.3));
    for (const w of yuna.weapons) expect(w.userData['aimed']).toBeDefined();
    models.dispose();
    expect(yuna.weapons.every((w) => w.parent === null)).toBe(true);
    expect(yuna.root.parent).toBeNull();
  });

  it('tips onto its back about its feet when it is down, lifted off the floor, and stands up again', async () => {
    const models = await load();
    const yuna = models.models.get('yuna')!;
    yuna.setLie(1, 1);
    const lie = yuna.root.children[0]!;
    expect(lie.rotation.z).toBeCloseTo(Math.PI / 2, 10);
    expect(lie.position.y).toBeGreaterThan(0);
    yuna.setLie(0, 1);
    expect(lie.rotation.z).toBe(0);
    expect(lie.position.y).toBe(0);
    expect(yuna.falls).toBe(false); // the files carry no knock-out clip
    models.dispose();
  });

  it('drives its colour, glow and opacity through the toon set, and hands back the opacity it was told', async () => {
    const models = await load();
    const yuna = models.models.get('yuna')!;
    const toon = yuna.materials[0]!.material;
    yuna.setChannels({ colour: new (toon.color.constructor as new (r: number, g: number, b: number) => import('three').Color)(0.5, 0.5, 0.5), emissive: toon.emissive.clone().setRGB(1, 0, 0), amount: 0.3, opacity: 0.5 });
    expect(toon.emissiveIntensity).toBe(0.3);
    expect(toon.transparent).toBe(true);
    expect(yuna.opacity).toBe(0.5);
    models.dispose();
  });
});

describe('Valefor\'s file', () => {
  const load = () => loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights, context: ctx(), io: fakeIo({ 'valefor.glb': valefor }) });

  it('is one static mesh with the wing flap on every program, fitted so her body centre is the origin and she stands 4.16 m tall', async () => {
    const models = await load();
    const v = models.models.get(WW_BOSS_ID)!;
    expect(v.source).toBe('own');
    expect(v.animated).toBe(false);
    expect(v.flap).not.toBeNull();
    expect(v.weapons).toHaveLength(0);
    expect(v.height).toBeCloseTo(BOSS_HEIGHT, 10);
    const mesh = v.root.getObjectByProperty('isMesh', true) as Mesh;
    const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as { customProgramCacheKey(): string };
    expect(material.customProgramCacheKey()).toBe('ww-toon-v2-wing'); // the vertex patch is part of the program
    expect(mesh.customDepthMaterial).toBeDefined(); // her cast shadow flaps too
    expect(mesh.receiveShadow).toBe(false);
    expect(mesh.castShadow).toBe(true);
    // the centre of her footprint (x 0.03, z -0.33 in the file) is on the origin: the even wings make it the centre of her body
    v.root.updateMatrixWorld(true);
    expect(v.worldPointOf([0.03, 0, -0.33]).x).toBeCloseTo(0, 5);
    expect(v.worldPointOf([0.03, 0, -0.33]).z).toBeCloseTo(0, 5);
    // she faces the party: a fixed turn
    expect(v.root.children[0]!.children[0]!.rotation.y).toBeCloseTo(rad(BOSS_YAW_DEG), 10);
    // her mouth is high and in front, her chest below it
    const mouth = v.worldPointOf(MOUTH_LOCAL);
    const chest = v.worldPointOf(CHEST_LOCAL);
    expect(mouth.y).toBeGreaterThan(chest.y);
    models.dispose();
  });

  it('hovers a metre off the floor and bobs, flaps faster as her activity rises, and falls to the ground when she is down', async () => {
    const models = await load();
    const v = models.models.get(WW_BOSS_ID)!;
    const hover = v.root.children[0]!.children[0]!.children[0]!;
    v.update(0.0);
    expect(hover.position.y).toBeCloseTo(BOSS_HOVER, 5);
    const ys = new Set<number>();
    for (let i = 0; i < 100; i++) {
      v.update(0.1);
      ys.add(Math.round(hover.position.y * 1000));
    }
    expect(Math.max(...ys) / 1000).toBeLessThanOrEqual(BOSS_HOVER + BOSS_BOB.amplitude + 1e-3);
    expect(Math.min(...ys) / 1000).toBeGreaterThanOrEqual(BOSS_HOVER - BOSS_BOB.amplitude - 1e-3);
    expect(ys.size).toBeGreaterThan(10);
    // the flap
    const wu = v.flap!;
    const rest = wu.uWing.value.y;
    v.update(0.1);
    const dRest = (wu.uWing.value.y - rest + Math.PI * 2) % (Math.PI * 2);
    v.setActivity(1);
    const mid = wu.uWing.value.y;
    v.update(0.1);
    const dBusy = (wu.uWing.value.y - mid + Math.PI * 2) % (Math.PI * 2);
    expect(dBusy / dRest).toBeCloseTo(RATE_ACTIVE, 3);
    // down
    v.setLie(1, 1);
    v.update(0.1);
    expect(hover.position.y).toBe(0);
    models.dispose();
  });

  it('holds her bob when frozen (REDUCE MOTION) and refits at another height without moving her hover', async () => {
    const models = await load();
    const v = models.models.get(WW_BOSS_ID)!;
    v.update(1);
    const hover = v.root.children[0]!.children[0]!.children[0]!;
    const y = hover.position.y;
    v.update(5, true);
    expect(hover.position.y).toBeCloseTo(y, 10);
    v.fitTo(BOSS_HEIGHT / 2);
    v.update(0);
    expect(hover.position.y).toBeCloseTo(y / 2, 2); // a smaller aeon floats proportionally lower
    models.dispose();
  });
});

describe('the constructor on its own', () => {
  it('measures the bind pose before the weapons are attached, so a sword does not change the fit', () => {
    const { scene, animations } = girl();
    const m = new WwModel('paine', scene, animations, 1.5, 'own', ctx());
    const swordless = new Box3().setFromObject(m.root.getObjectByName('Hips')!.parent!.children.find((c) => (c as Mesh).isMesh)!);
    expect(swordless.max.y - swordless.min.y).toBeCloseTo(1.5, 5);
    expect(m.weapons).toHaveLength(1); // Paine's sword on the right hand
    m.dispose();
  });

  it('knows the temple pieces and prop names it may be swapped with only through the swaps module (this model takes none by default)', () => {
    expect(TEMPLE_NAMES).toEqual(['wall', 'door', 'brazier', 'pillar']);
    const warn = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const m = new WwModel('rikku', girl().scene, [], 1.4, 'own', ctx());
    expect(m.animated).toBe(false); // no clips: it stays procedural, a still model
    expect(m.weapons).toHaveLength(2);
    m.dispose();
    warn.mockRestore();
  });
});

describe('every id', () => {
  it('is a WwId the model file contract names', () => {
    const ids: WwId[] = [...WW_CAST];
    expect(ids).toHaveLength(4);
  });
});
