// @vitest-environment jsdom
/**
 * **The toon models on the battle's actors** (`src/engine/ww3d/skin.ts`; the hidden Wind Waker chapter, FFX-2 only), driven with real `PaintedActor`s (a no-op 2D context stands in for the canvas, as in
 * `exp-fayth-skin.test.ts`), the neutral capsule models and a rigged girl. What it pins:
 *
 * 1. **The private parts are still there**: `PaintedActor` keeps its figure switch, its plane meshes, its motion group and its uniform cells private and the skin reaches them (the house habit of `ffx-skin`), so a
 *    rename in `PaintedActor.ts` fails here instead of drawing nothing. An actor that lacks them is left painted.
 * 2. **Attaching**: the painted planes and the actor's blob go off for good, the interim yaw is zeroed, the model stands in the actor's motion group at the figure's yaw and its height, and a replaced actor takes the model afresh.
 * 3. **Following**: a flash, a cast glow, the hurt tint, stone, the fade and dissolve, a KO that tips the body and a revive that stands it, a re-sized figure, a hidden actor, REDUCE MOTION.
 * 4. **The beats**: an attack or cast starts the figure's clip; Valefor's three special moves start their stand-in effects against the right targets and her wings flap harder until the action closes.
 * 5. **The weapons**: aimed at Valefor's chest once a girl stands on her slot, and not while she is still walking on.
 */
import { Color, Group, PerspectiveCamera, Scene, Vector3, type Mesh } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { PaintedActor } from '../../../src/engine/PaintedActor.ts';
import { SWAY } from '../../../src/engine/ww3d/bossMotion.ts';
import { BOSS_RIM, GLOW_FILL, PULSE_LOW, RIM_SHAPE_BOSS, RIM_SHAPE_GIRL, spellRim } from '../../../src/engine/ww3d/glow.ts';
import { HitFx } from '../../../src/engine/ww3d/hitFx.ts';
import { MoveFx } from '../../../src/engine/ww3d/moveFx.ts';
import { hitPlan } from '../../../src/engine/ww3d/hitBurst.ts';
import { ORB, defaultTargets } from '../../../src/engine/ww3d/moves.ts';
import {
  BODY_OFF_DEG,
  BOSS_HEIGHT,
  BOSS_YAW_DEG,
  NATIVE_HEIGHT,
  PARTY_HEIGHT,
  PARTY_SLOTS,
  WORLD_HEIGHT,
  WW_BOSS_ID,
  WW_CAST,
  bodyYaw,
  heightFactor,
  rad,
  type WwId,
} from '../../../src/engine/ww3d/layout.ts';
import { TARGET_POSITION } from '../../../src/engine/ww3d/camera.ts';
import { CHEST_LOCAL, loadWwModels, type WwModel, type WwModels } from '../../../src/engine/ww3d/model.ts';
import { WwSkin, hidePaintedFigure, internalsOf } from '../../../src/engine/ww3d/skin.ts';
import { createToonUniforms } from '../../../src/engine/ww3d/toon.ts';
import { VALEFOR_ENERGY_BLAST_ID, VALEFOR_ENERGY_RAY_ID, VALEFOR_SONIC_WINGS_ID } from '../../../src/data/ffx2/enemies/valefor-abilities.ts';
import { fakeIo, girl, valefor } from '../helpers/wwFixtures.ts';

/** A 2D context that accepts every call (an actor paints a placeholder canvas; jsdom has no canvas). */
function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
  const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
  return new Proxy({} as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'canvas') return canvas;
      if (prop === 'getImageData') return (_x: number, _y: number, w: number, h: number) => pixels(w, h);
      if (prop === 'createImageData') return (w: number, h: number) => pixels(w, h);
      if (prop === 'measureText') return () => ({ width: 10 });
      return () => stub;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return noopContext(this) as never;
  });
});
afterAll(() => vi.restoreAllMocks());

/** The placeholder painting an actor shows before any art loads: a blank canvas. */
const blank = (): HTMLCanvasElement => document.createElement('canvas');

const STAGE_HEIGHT: Record<WwId, number> = { yuna: PARTY_HEIGHT, rikku: PARTY_HEIGHT, paine: PARTY_HEIGHT, 'x2-valefor': BOSS_HEIGHT };

interface Rig {
  scene: Scene;
  host: Group;
  models: WwModels;
  fx: MoveFx;
  hits: HitFx;
  skin: WwSkin;
  actors: Record<string, PaintedActor>;
}

const open: Rig[] = [];
afterEach(() => {
  for (const r of open.splice(0)) {
    r.skin.dispose();
    r.fx.dispose();
    r.hits.dispose();
    for (const a of Object.values(r.actors)) a.dispose();
  }
});

/** The skin over the models of `files` (capsules for the rest), a scene with the host group, and a real actor per id as the stage names and adds them (at its slot, as `holdParty` leaves them). */
async function rig(ids: readonly WwId[] = WW_CAST, files: Parameters<typeof fakeIo>[0] = {}): Promise<Rig> {
  const models = await loadWwModels({ base: '/', dir: 'models-exp/windwaker', heights: WORLD_HEIGHT, context: { uniforms: createToonUniforms(), camera: TARGET_POSITION }, io: fakeIo(files) });
  const scene = new Scene();
  const host = new Group();
  scene.add(host);
  const actors: Record<string, PaintedActor> = {};
  for (const id of ids) {
    const a = new PaintedActor({ name: id, worldHeight: STAGE_HEIGHT[id], side: id === WW_BOSS_ID ? 'enemy' : 'party', placeholder: blank });
    const girlIndex = ['yuna', 'rikku', 'paine'].indexOf(id);
    if (girlIndex >= 0) a.position.set(PARTY_SLOTS[girlIndex]![0], 0, PARTY_SLOTS[girlIndex]![2]);
    else a.position.set(4, 0, -3.3);
    scene.add(a);
    actors[id] = a;
  }
  const fx = new MoveFx();
  scene.add(fx.group);
  const hits = new HitFx();
  scene.add(hits.group);
  const skin = new WwSkin({ host, models, fx, hits });
  const r = { scene, host, models, fx, hits, skin, actors };
  open.push(r);
  return r;
}

const modelOf = (r: Rig, id: WwId): WwModel => r.skin.get(id)!.model;
const run = (r: Rig, seconds: number, dt = 0.05): void => {
  for (let t = 0; t < seconds; t += dt) {
    for (const a of Object.values(r.actors)) a.update(dt);
    r.skin.update(dt);
    r.fx.update(dt);
    r.hits.update(dt);
  }
};
const yawOf = (m: WwModel): number => m.root.children[0]!.children[0]!.rotation.y;

describe('the private parts of a PaintedActor the skin reaches', () => {
  it('are there on a real actor: the figure switch, the two plane meshes, the motion group and the uniform cells it reads', () => {
    const actor = new PaintedActor({ name: 'yuna', placeholder: blank });
    const parts = internalsOf(actor)!;
    expect(parts).not.toBeNull();
    expect(typeof parts.showFigure).toBe('boolean');
    expect(parts.slots).toHaveLength(2);
    expect(parts.inner).toBeInstanceOf(Group);
    expect(actor.children).toContain(parts.inner);
    expect(parts.u.flashAmount.value).toBe(0);
    expect(parts.u.flashColor.value).toBeInstanceOf(Color);
    expect(parts.u.tint.value).toBeInstanceOf(Color);
    expect([parts.u.brightness.value, parts.u.desaturate.value]).toEqual([1, 0]);
    expect(actor.shadow).not.toBeNull(); // the contact blob the skin switches off
    actor.dispose();
  });

  it('are reported absent for an object that is not an actor, and the skin then leaves it painted', async () => {
    expect(internalsOf({} as PaintedActor)).toBeNull();
    expect(internalsOf({ inner: new Group(), slots: [], showFigure: true, u: {} } as unknown as PaintedActor)).toBeNull();
    expect(hidePaintedFigure({} as PaintedActor)).toBe(false);
    const r = await rig(['yuna']);
    const broken = r.actors['yuna'] as unknown as { u: unknown };
    broken.u = {};
    r.skin.update(0.02);
    expect(r.skin.get('yuna')).toBeNull();
    expect(r.skin.carrying).toEqual({});
  });
});

describe('attaching', () => {
  it('switches the painted planes and the blob off, zeroes the interim yaw, and stands each model in its actor\'s motion group at its yaw and its height', async () => {
    const r = await rig();
    r.skin.update(0.02);
    expect(Object.keys(r.skin.carrying).sort()).toEqual([...WW_CAST].sort());
    for (const id of WW_CAST) {
      const actor = r.actors[id]!;
      const parts = internalsOf(actor)!;
      expect(parts.showFigure, id).toBe(false);
      for (const slot of parts.slots) expect(slot.mesh.visible, id).toBe(false);
      expect(actor.shadow!.visible, id).toBe(false);
      expect(actor.interimYawDeg, id).toBe(0);
      const model = modelOf(r, id);
      expect(model.root.parent, id).toBe(parts.inner);
      expect(model.height, id).toBeCloseTo(STAGE_HEIGHT[id] * heightFactor(id), 10); // the girls keep the heights the models were made with
      expect(r.skin.carrying[id], id).toBe('capsule');
    }
    // the yaw: a girl's body is turned BODY_OFF_DEG off the direction to the lens from her slot, Valefor takes a fixed turn toward the party
    ['yuna', 'rikku', 'paine'].forEach((id, i) => expect(yawOf(modelOf(r, id as WwId)), id).toBeCloseTo(bodyYaw(PARTY_SLOTS[i]!, TARGET_POSITION, 0, BODY_OFF_DEG), 9));
    expect(Math.abs(yawOf(modelOf(r, WW_BOSS_ID)) - rad(BOSS_YAW_DEG))).toBeLessThanOrEqual(rad(SWAY.yawDeg * SWAY.activeGain) + 1e-9); // a fixed turn, and the sway's few degrees of drift on top
    expect(modelOf(r, 'rikku').height).toBeLessThan(modelOf(r, 'yuna').height);
    expect(modelOf(r, 'paine').height).toBeGreaterThan(modelOf(r, 'yuna').height);
  });

  it('keeps the painted planes off for good: a later frame, a fade and a pose change do not bring them back, nor the blob', async () => {
    const r = await rig(['yuna']);
    r.skin.update(0.02);
    const actor = r.actors['yuna']!;
    actor.setPose('attack');
    actor.setAlpha(0.7);
    run(r, 0.5);
    for (const slot of internalsOf(actor)!.slots) expect(slot.mesh.visible).toBe(false);
    expect(actor.shadow!.visible).toBe(false);
  });

  it('does nothing before the host is in a scene, and for an actor of the cast that is not on the field', async () => {
    const models = await loadWwModels({ base: '/', dir: 'x', heights: WORLD_HEIGHT, context: { uniforms: createToonUniforms(), camera: TARGET_POSITION }, io: fakeIo({}) });
    const skin = new WwSkin({ host: new Group(), models, fx: new MoveFx() }); // no parent
    expect(() => skin.update(0.016)).not.toThrow();
    expect(skin.carrying).toEqual({});
    const r = await rig(['yuna']);
    r.skin.update(0.02);
    expect(Object.keys(r.skin.carrying)).toEqual(['yuna']); // the other three are not on the field: not attached, not an error
    skin.dispose();
  });

  it('takes a replacement actor of the same id afresh (the stage replaces an actor when it re-stages one)', async () => {
    const r = await rig(['yuna']);
    r.skin.update(0.02);
    const first = r.actors['yuna']!;
    const model = modelOf(r, 'yuna');
    first.removeFromParent();
    const second = new PaintedActor({ name: 'yuna', worldHeight: PARTY_HEIGHT, side: 'party', placeholder: blank });
    r.scene.add(second);
    r.actors['second'] = second;
    r.skin.update(0.02);
    expect(r.skin.get('yuna')!.actor).toBe(second);
    expect(model.root.parent).toBe(internalsOf(second)!.inner);
    expect(internalsOf(second)!.showFigure).toBe(false);
  });
});

describe('the beats and the clips', () => {
  it('the beat listener starts the figure\'s clip and puts the strike on the blow, by combatant id, and ignores an id that is not carrying a model', async () => {
    const r = await rig(['yuna', WW_BOSS_ID], { 'yuna.glb': girl });
    r.skin.update(0.02);
    const model = modelOf(r, 'yuna');
    const noteOpen = vi.spyOn(model, 'noteOpen');
    const noteImpact = vi.spyOn(model, 'noteImpact');
    r.skin.listener.open!('yuna', 'attack', 0.3, { targetIds: ['x2-valefor'] });
    r.skin.listener.impact!('yuna');
    expect(noteOpen).toHaveBeenCalledWith('attack', 0.3, expect.any(Number));
    expect(noteImpact).toHaveBeenCalledTimes(1);
    expect(model.playing).toBe('attack');
    expect(() => r.skin.listener.open!('tidus', 'attack', 0.3, { targetIds: [] })).not.toThrow(); // no such figure
    expect(() => r.skin.listener.impact!('rikku')).not.toThrow(); // not on the field
  });

  it('tells each model its actor\'s pose every frame, and holds the clips while the body is down', async () => {
    const r = await rig(['paine']);
    r.skin.update(0.02);
    const model = modelOf(r, 'paine');
    const pose = vi.spyOn(model, 'notePose');
    const update = vi.spyOn(model, 'update');
    r.actors['paine']!.setPose('hurt');
    run(r, 0.1);
    expect(pose).toHaveBeenCalledWith('hurt', false, expect.any(Number));
    expect(update.mock.calls.at(-1)![1]).toBe(false);
    r.actors['paine']!.setPose('ko');
    run(r, 0.5);
    expect(pose.mock.calls.at(-1)![1]).toBe(true);
    expect(update.mock.calls.at(-1)![1]).toBe(true); // frozen while down
  });
});

describe('a blow lands: the burst', () => {
  /** The star's outline mesh of each burst, posed from `camera` the way the renderer does it in its own `onBeforeRender`. */
  const outlines = (r: Rig, camera: PerspectiveCamera): Mesh[] => {
    const found = r.hits.group.children.filter((c) => c.renderOrder === 20) as Mesh[];
    for (const m of found) (m.onBeforeRender as (a: unknown, b: unknown, c: PerspectiveCamera) => void)({}, {}, camera);
    return found;
  };
  const lens = (): PerspectiveCamera => {
    const cam = new PerspectiveCamera(49, 16 / 9, 0.1, 200);
    cam.position.set(1, 0.37, 3.2);
    cam.lookAt(1, 1.5, -3);
    cam.updateMatrixWorld(true);
    return cam;
  };

  it('starts a star and its smoke on the figure that took the blow, sized to her, and none on a figure that carries no model', async () => {
    const r = await rig(['yuna', 'rikku', WW_BOSS_ID]);
    r.skin.update(0.02);
    r.skin.listener.impact!('x2-valefor', { targetId: 'yuna', hitIndex: 0, heavy: false });
    expect(r.hits.active).toBe(1);
    const view = r.hits.bursts[0]!;
    expect(view.points).toBe(5);
    expect(view.radius).toBeCloseTo(hitPlan(PARTY_HEIGHT * heightFactor('yuna'), { heavy: false, hitIndex: 0 }).radius, 6);
    r.skin.listener.impact!('yuna', { targetId: 'paine', hitIndex: 0, heavy: false }); // Paine is not on the field here
    r.skin.listener.impact!('yuna', { targetId: 'nobody', hitIndex: 0, heavy: false });
    expect(r.hits.active).toBe(1);
    run(r, 1.5);
    expect(r.hits.active).toBe(0); // it ends by itself
  });

  it('puts the burst at a girl\'s chest (a share of her model, not her feet or her head) and on the middle of Valefor\'s body, where their models are', async () => {
    const r = await rig();
    r.skin.update(0.02);
    r.skin.listener.impact!('yuna', { targetId: 'rikku', hitIndex: 0, heavy: false });
    r.skin.listener.impact!('yuna', { targetId: WW_BOSS_ID, hitIndex: 0, heavy: false });
    expect(r.hits.active).toBe(2);
    const rikku = modelOf(r, 'rikku').worldPointOf([0, NATIVE_HEIGHT.rikku * 0.58, 0]);
    const boss = modelOf(r, WW_BOSS_ID).worldPointOf(CHEST_LOCAL);
    const [first, second] = outlines(r, lens());
    expect(first!.position.distanceTo(rikku)).toBeLessThan(1e-6);
    expect(second!.position.distanceTo(boss)).toBeLessThan(1e-6);
    expect(rikku.y).toBeGreaterThan(0.5);
    expect(rikku.y).toBeLessThan(WORLD_HEIGHT.rikku * 0.8);
    expect(boss.y).toBeGreaterThan(1.5);
  });

  it('draws a heavy blow with six points and five puffs, and a later hit of a multi-hit action with four and three', async () => {
    const r = await rig(['yuna', 'rikku', WW_BOSS_ID]);
    r.skin.update(0.02);
    r.skin.listener.impact!('x2-valefor', { targetId: 'yuna', hitIndex: 0, heavy: true });
    r.skin.listener.impact!('rikku', { targetId: WW_BOSS_ID, hitIndex: 2, heavy: false });
    const [heavy, later] = r.hits.bursts;
    expect([heavy!.points, heavy!.puffs]).toEqual([6, 5]);
    expect([later!.points, later!.puffs]).toEqual([4, 3]);
    expect(later!.radius).toBeGreaterThan(0);
  });

  it('still puts the strike on the striker\'s clip, and a blow with no striker (a counter, a status tick) still draws its burst', async () => {
    const r = await rig(['yuna', 'rikku']);
    r.skin.update(0.02);
    const noteImpact = vi.spyOn(modelOf(r, 'yuna'), 'noteImpact');
    r.skin.listener.impact!('yuna', { targetId: 'rikku', hitIndex: 0, heavy: false });
    expect(noteImpact).toHaveBeenCalledTimes(1);
    expect(r.hits.active).toBe(1);
    r.skin.listener.impact!(undefined, { targetId: 'yuna', hitIndex: 0, heavy: false });
    expect(noteImpact).toHaveBeenCalledTimes(1);
    expect(r.hits.active).toBe(2);
    r.skin.listener.impact!('yuna'); // a beat with no target says nothing to draw
    expect(r.hits.active).toBe(2);
  });

  it('draws nothing of its own for a skin made without a hit effect, and does not throw', async () => {
    const r = await rig(['yuna']);
    const bare = new WwSkin({ host: r.host, models: r.models, fx: r.fx });
    r.skin.update(0.02);
    expect(() => bare.listener.impact!('yuna', { targetId: 'yuna', hitIndex: 0, heavy: false })).not.toThrow();
    expect(r.hits.active).toBe(0);
  });
});

describe('Valefor\'s moves', () => {
  const info = (abilityId: string, ids: string[]) => ({ abilityId, targetIds: ids });

  it('opens an Energy Ray with a beam to each girl it is aimed at, measured from her mouth, and a Blast with an orb at her chest, and Sonic Wings with a gust to the one girl', async () => {
    const r = await rig();
    r.skin.update(0.02);
    r.skin.listener.open!(WW_BOSS_ID, 'cast', 0.6, info(VALEFOR_ENERGY_RAY_ID, ['yuna', 'rikku', 'paine']));
    expect(r.fx.kinds).toEqual(['ray']);
    expect(r.fx.group.children).toHaveLength(1 + 2 * 3); // the muzzle orb, and a sleeve and a core for each girl's beam
    r.skin.listener.open!(WW_BOSS_ID, 'overdrive', 1.5, info(VALEFOR_ENERGY_BLAST_ID, ['yuna', 'rikku', 'paine']));
    expect(r.fx.kinds).toEqual(['ray', 'blast']);
    r.skin.listener.open!(WW_BOSS_ID, 'cast', 0.6, info(VALEFOR_SONIC_WINGS_ID, ['yuna']));
    expect(r.fx.kinds).toEqual(['ray', 'blast', 'wings']);
    run(r, 4);
    expect(r.fx.active).toBe(0); // they run their course and are freed
  });

  it("aims the party-wide moves at the party when the open beat names nobody (a real fight opens the Ray and the Blast with targetIds [])", async () => {
    const r = await rig();
    r.skin.update(0.02);
    expect(defaultTargets('ray')).toEqual(['yuna', 'rikku', 'paine']);
    expect(defaultTargets('blast')).toEqual(['yuna', 'rikku', 'paine']);
    expect(defaultTargets('wings')).toEqual(['yuna']);
    r.skin.listener.open!(WW_BOSS_ID, 'cast', 0.3, info(VALEFOR_ENERGY_RAY_ID, []));
    expect(r.fx.kinds).toEqual(['ray']);
    expect(r.fx.group.children, 'a beam (sleeve and core) to each of the three girls, and the muzzle').toHaveLength(1 + 2 * 3);
    r.skin.listener.open!(WW_BOSS_ID, 'overdrive', 1.5, info(VALEFOR_ENERGY_BLAST_ID, []));
    const orb = r.fx.group.children[7]!; // the Blast's orb: after the Ray's seven
    const chest = r.skin.get(WW_BOSS_ID)!.model.worldPointOf(CHEST_LOCAL);
    expect(orb.position.distanceTo(chest), 'hung out in front of her chest toward the girls, not on it').toBeCloseTo(ORB.ahead, 3);
    r.skin.listener.open!(WW_BOSS_ID, 'cast', 0.6, info(VALEFOR_SONIC_WINGS_ID, []));
    expect(r.fx.kinds).toEqual(['ray', 'blast', 'wings']);
    expect(r.fx.group.children).toHaveLength(7 + 2 + 3); // three trails for the one girl
  });

  it('aims the beam at the girls\' chests where they stand, not at the floor and not at the boss', async () => {
    const r = await rig();
    r.skin.update(0.02);
    r.skin.listener.open!(WW_BOSS_ID, 'cast', 0.5, info(VALEFOR_ENERGY_RAY_ID, ['yuna']));
    const beam = r.fx.group.children[1] as import('three').Mesh;
    const yuna = r.actors['yuna']!;
    const chestY = yuna.position.y + yuna.height * 0.55;
    const end = beam.position.clone().add(new Vector3(0, 1, 0).applyQuaternion(beam.quaternion).multiplyScalar(beam.scale.y / 2));
    expect(end.x).toBeCloseTo(yuna.position.x, 3);
    expect(end.y).toBeCloseTo(chestY, 3);
    expect(end.z).toBeCloseTo(yuna.position.z, 3);
  });

  it('starts nothing for the plain attack or for a move aimed at nobody that is on the field, and nothing for a girl\'s action', async () => {
    const r = await rig(['x2-valefor', 'yuna']);
    r.skin.update(0.02);
    r.skin.listener.open!(WW_BOSS_ID, 'attack', 0.3, { abilityId: 'x2-valefor-attack', targetIds: ['yuna'] });
    r.skin.listener.open!(WW_BOSS_ID, 'cast', 0.3, info(VALEFOR_ENERGY_RAY_ID, ['nobody']));
    r.skin.listener.open!('yuna', 'cast', 0.3, info(VALEFOR_ENERGY_RAY_ID, ['x2-valefor']));
    expect(r.fx.active).toBe(0);
    r.skin.listener.open!(WW_BOSS_ID, 'overdrive', 1.5, info(VALEFOR_ENERGY_BLAST_ID, [])); // the Blast needs no target to charge
    expect(r.fx.kinds).toEqual(['blast']);
  });

  it('flaps her wings faster and wider from the opening of any action to its close, and the girls have no flap', async () => {
    const r = await rig(['yuna', WW_BOSS_ID]);
    run(r, 0.3);
    const boss = modelOf(r, WW_BOSS_ID);
    expect(boss.flap).toBeNull(); // the capsule has no flap shader; the rate is checked on a real file below
    expect(modelOf(r, 'yuna').flap).toBeNull();
  });

  it('flaps a real Valefor file harder while an action is open and settles after it closes', async () => {
    const r = await rig(['yuna', WW_BOSS_ID], { 'valefor.glb': valefor });
    run(r, 0.3);
    const wu = modelOf(r, WW_BOSS_ID).flap!;
    const rest = wu.uWing.value.x;
    r.skin.listener.open!(WW_BOSS_ID, 'attack', 0.3, { abilityId: 'x2-valefor-attack', targetIds: ['yuna'] });
    run(r, 0.6);
    expect(wu.uWing.value.x).toBeGreaterThan(rest * 1.2);
    r.skin.listener.close!(WW_BOSS_ID);
    run(r, 2.5);
    expect(wu.uWing.value.x).toBeLessThan(rest * 1.05);
  });
});

describe('following', () => {
  it('lights the model with the actor\'s flash and lets it go as the flash decays', async () => {
    const r = await rig(['yuna']);
    run(r, 0.1);
    const toon = modelOf(r, 'yuna').materials[0]!.material;
    expect(toon.emissiveIntensity).toBeCloseTo(0, 6); // no glow at rest
    r.actors['yuna']!.flash(0x66ff88, 400, 1);
    run(r, 0.05);
    expect(toon.emissiveIntensity).toBeGreaterThan(0.3);
    expect(toon.emissive.g).toBeGreaterThan(toon.emissive.r); // the flash's own colour
    run(r, 1.5);
    expect(toon.emissiveIntensity).toBeLessThan(0.02);
  });

  it("lights a thin rim aura while the actor holds the cast pose (the spell's colour for a girl, a warm gold for Valefor), with only a faint fill under it, and lets it go after", async () => {
    const r = await rig(['yuna', WW_BOSS_ID]);
    run(r, 0.1);
    const girl = modelOf(r, 'yuna');
    const boss = modelOf(r, WW_BOSS_ID);
    const girlMat = girl.materials[0]!.material;
    const bossMat = boss.materials[0]!.material;
    expect([girl.aura.w, boss.aura.w]).toEqual([0, 0]);
    r.skin.listener.open!('yuna', 'cast', 0.3, { abilityId: 'protect', targetIds: [] }); // the beat holds the aura whatever painting the actor shows
    r.skin.listener.open!(WW_BOSS_ID, 'cast', 0.3, { targetIds: [] });
    run(r, 1.2);
    expect(girl.aura.w).toBeGreaterThan(0.5 * PULSE_LOW); // the rim is lit (its strength breathes from the pulse's low to 1)
    expect([girl.aura.x, girl.aura.y, girl.aura.z]).toEqual([...spellRim('protect')]); // the spell's colour: Protect is a gold
    expect(boss.aura.w).toBeGreaterThan(0.5 * PULSE_LOW);
    expect([boss.aura.x, boss.aura.y, boss.aura.z]).toEqual([...BOSS_RIM]);
    expect(boss.auraShape.toArray()).toEqual([...RIM_SHAPE_BOSS]); // Valefor's steps are thinner than a girl's
    expect(girl.auraShape.toArray()).toEqual([...RIM_SHAPE_GIRL]);
    // the fill under it is faint: phase 2's was 0.5 and the girls went cream
    expect(girlMat.emissiveIntensity).toBeLessThanOrEqual(GLOW_FILL + 1e-9);
    expect(bossMat.emissiveIntensity).toBeLessThanOrEqual(GLOW_FILL + 1e-9);
    expect(girlMat.emissive.r).toBeGreaterThan(girlMat.emissive.b); // warm
    for (const id of ['yuna', WW_BOSS_ID]) r.skin.listener.close!(id);
    run(r, 2);
    expect(girl.aura.w).toBe(0);
    expect(girlMat.emissiveIntensity).toBeLessThan(0.01);
  });

  it("lets a girl's aura go after a cast's length when her beat never closes, lights afresh on the next cast, and does not cap Valefor's charge", async () => {
    const r = await rig(['yuna', WW_BOSS_ID]);
    run(r, 0.1);
    const girl = modelOf(r, 'yuna');
    const boss = modelOf(r, WW_BOSS_ID);
    for (const id of ['yuna', WW_BOSS_ID]) r.skin.listener.open!(id, 'cast', 0.3, { targetIds: [] }); // and no close: the ATB left the beat open (phase 2: the cream Yuna)
    run(r, 1.2);
    expect(girl.aura.w).toBeGreaterThan(0.2);
    run(r, 4);
    expect(girl.aura.w).toBe(0); // a cast's length, then the aura is gone
    expect(boss.aura.w).toBeGreaterThan(0.2); // her charge is as long as her action
    r.skin.listener.open!('yuna', 'cast', 0.3, { abilityId: 'fire', targetIds: [] }); // the next cast, with the pose still held
    run(r, 1.2);
    expect(girl.aura.w).toBeGreaterThan(0.2);
    expect(girl.aura.x).toBeCloseTo(spellRim('fire')[0], 6);
  });

  it('multiplies the colour by the actor\'s tint and brightness, greys a petrified figure, and fades the figure with its alpha and dissolve', async () => {
    const r = await rig(['paine']);
    run(r, 0.1);
    const model = modelOf(r, 'paine');
    const entry = model.materials[0]!;
    const base = entry.base;
    expect(entry.material.color.toArray()).toEqual(base.toArray());
    const actor = r.actors['paine']!;
    actor.setTint(0xff8080);
    actor.setBrightness(0.5);
    run(r, 0.1);
    expect(entry.material.color.r).toBeCloseTo(base.r * 0.5, 4);
    expect(entry.material.color.g).toBeLessThan(base.g * 0.5);
    actor.setBrightness(1);
    actor.setTint(0xffffff);
    actor.setStone(1);
    run(r, 0.1);
    expect(Math.abs(entry.material.color.r - entry.material.color.b)).toBeLessThan(Math.abs(base.r - base.b) + 1e-9); // toward grey
    actor.setStone(0);
    actor.setAlpha(0.4);
    run(r, 0.1);
    expect([entry.material.opacity, entry.material.transparent, model.root.visible]).toEqual([0.4, true, true]);
    actor.setAlpha(1);
    actor.setDissolve(1);
    run(r, 0.1);
    expect(model.root.visible).toBe(false); // fully dissolved: gone
    actor.setDissolve(0);
    run(r, 0.1);
    expect([entry.material.opacity, entry.material.transparent, model.root.visible]).toEqual([1, false, true]);
    actor.visible = false;
    run(r, 0.1);
    expect(model.root.visible).toBe(false);
  });

  it('tips a downed figure onto its back (a KO) and stands it up on a revive', async () => {
    const r = await rig(['rikku']);
    run(r, 0.1);
    const lie = modelOf(r, 'rikku').root.children[0]!;
    expect(lie.rotation.z).toBe(0);
    r.actors['rikku']!.setPose('ko');
    run(r, 1.5);
    expect(Math.abs(lie.rotation.z)).toBeGreaterThan(Math.PI / 2 - 0.05);
    expect(Math.sign(lie.rotation.z)).toBe(r.actors['rikku']!.facingDir);
    expect(lie.position.y).toBeGreaterThan(0);
    r.actors['rikku']!.setPose('idle');
    run(r, 2);
    expect(lie.rotation.z).toBe(0);
  });

  it('a figure staged already down stands down from the first frame (no topple on frame one)', async () => {
    const r = await rig(['paine']);
    r.actors['paine']!.setPose('ko', { immediate: true });
    r.skin.update(0.02);
    const lie = modelOf(r, 'paine').root.children[0]!;
    expect(Math.abs(lie.rotation.z)).toBeCloseTo(Math.PI / 2, 5);
  });

  it('lets Valefor fall to the floor when she is down (her flap and bob go on), and holds a girl still', async () => {
    const r = await rig(['yuna', WW_BOSS_ID]);
    run(r, 0.1);
    const boss = modelOf(r, WW_BOSS_ID);
    const update = vi.spyOn(boss, 'update');
    r.actors[WW_BOSS_ID]!.setPose('ko');
    run(r, 1.5);
    expect(update.mock.calls.at(-1)![1]).toBe(false); // not frozen: she falls by her own hover
    expect(boss.root.children[0]!.children[0]!.children[0]!.position.y).toBe(0);
    const girlUpdate = vi.spyOn(modelOf(r, 'yuna'), 'update');
    r.actors['yuna']!.setPose('ko');
    run(r, 0.5);
    expect(girlUpdate.mock.calls.at(-1)![1]).toBe(true);
  });

  it('refits when the stage re-sizes a figure, and follows the actor\'s own motion (it rides the same group)', async () => {
    const r = await rig([WW_BOSS_ID]);
    run(r, 0.1);
    const model = modelOf(r, WW_BOSS_ID);
    expect(model.height).toBeCloseTo(BOSS_HEIGHT, 10);
    r.actors[WW_BOSS_ID]!.setWorldHeight(4);
    run(r, 0.05);
    expect(model.height).toBe(4);
    const inner = internalsOf(r.actors[WW_BOSS_ID]!)!.inner;
    void r.actors[WW_BOSS_ID]!.lunge(2, 200);
    run(r, 0.12);
    expect(Math.abs(inner.position.x)).toBeGreaterThan(0.1);
    expect(model.root.parent).toBe(inner);
  });

  it('stills the idle clip under REDUCE MOTION (the actor says so) and disposes with the models', async () => {
    const r = await rig(['yuna']);
    r.skin.update(0.02);
    (r.actors['yuna'] as unknown as { still: () => boolean }).still = () => true;
    const update = vi.spyOn(modelOf(r, 'yuna'), 'update');
    run(r, 0.1);
    expect(update).toHaveBeenCalled();
    for (const call of update.mock.calls) expect(call[1]).toBe(true);
    const spy = vi.spyOn(r.models, 'dispose');
    r.skin.dispose();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(r.skin.carrying).toEqual({});
  });
});

describe('the weapons', () => {
  it('are aimed at Valefor\'s chest once a girl stands on her slot in her stance, once, and not while she is still walking on', async () => {
    const r = await rig(['yuna'], { 'yuna.glb': girl });
    const actor = r.actors['yuna']!;
    actor.position.set(-8, 0, 0.89); // still walking on from the reserve slots
    run(r, 0.3);
    const weapons = modelOf(r, 'yuna').weapons;
    expect(weapons).toHaveLength(2);
    for (const w of weapons) expect(w.userData['aimed'], 'not yet').toBeUndefined();
    actor.position.set(PARTY_SLOTS[0]![0], 0, PARTY_SLOTS[0]![2]);
    run(r, 0.3);
    for (const w of weapons) {
      const aimed = w.userData['aimed'] as { angle: number; applied: number };
      expect(aimed, 'aimed').toBeDefined();
      expect(aimed.applied).toBeGreaterThan(0);
    }
    const first = weapons.map((w) => w.userData['aimed']);
    actor.position.set(PARTY_SLOTS[0]![0] + 0.1, 0, PARTY_SLOTS[0]![2]);
    run(r, 0.3);
    expect(weapons.map((w) => w.userData['aimed'])).toEqual(first); // once
  });

  it("pin the HUD's head point to the top of the girl's real head once she stands in her stance, and a clip's movement never moves it", async () => {
    const r = await rig(['yuna'], { 'yuna.glb': girl });
    const actor = r.actors['yuna']!;
    actor.position.set(-8, 0, 0.89); // still walking on: the actor's own 0.92 of its height
    r.skin.update(0.02); // binds the model
    const model = modelOf(r, 'yuna');
    run(r, 0.3);
    const own = actor.headPoint(new Vector3());
    expect(own.y - actor.position.y, 'under the top of her head').toBeLessThan(actor.height);
    actor.position.set(PARTY_SLOTS[0]![0], 0, PARTY_SLOTS[0]![2]);
    run(r, 0.3);
    const top = model.headTopWorld(new Vector3())!;
    const pinned = actor.headPoint(new Vector3());
    // the top of the head: the head bone plus the fixture's hair above it (1.2 m file, bone at 1.05: 0.15 m, scaled to the girl)
    const k = model.height / 1.2;
    expect(pinned.y - actor.position.y).toBeCloseTo(top.y - actor.position.y, 5);
    expect(pinned.y - actor.position.y, 'the top of the whole figure, its hair included').toBeCloseTo(model.height, 3);
    expect(model.headTopWorld(new Vector3())!.y).toBeCloseTo(actor.position.y + (1.05 + 0.15) * k, 3);
    // an attack clip bends the spine and moves the head bone; the pinned point does not move with it, and it follows the actor
    r.skin.listener.open!('yuna', 'attack', 0.8, { targetIds: [] });
    run(r, 1.0);
    expect(model.playing).toBe('attack');
    const during = actor.headPoint(new Vector3());
    expect(during.toArray().map((v) => Number(v.toFixed(6)))).toEqual(pinned.toArray().map((v) => Number(v.toFixed(6))));
    actor.position.x += 0.5;
    expect(actor.headPoint(new Vector3()).x).toBeCloseTo(pinned.x + 0.5, 6);
  });

  it('are not waited for by a model that holds none (a capsule, Valefor)', async () => {
    const r = await rig();
    run(r, 0.2);
    for (const id of WW_CAST) expect(modelOf(r, id).weapons).toHaveLength(0);
  });
});
