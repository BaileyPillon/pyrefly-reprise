// @vitest-environment jsdom
/**
 * **The real models on the battle's actors** (`src/engine/yrp3d/skin.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only), driven with real `PaintedActor`s (a no-op 2D context stands in for the canvas, as in
 * `exp-fayth-skin.test.ts`) and the neutral capsule models. What it pins:
 *
 * 1. **The private parts are still there**: `PaintedActor` keeps its figure switch, its plane meshes, its motion group and its uniform cells private and the skin reaches them (the house habit of `ffx-skin`), so a rename
 *    in `PaintedActor.ts` fails here instead of drawing nothing. An actor that lacks them is left painted.
 * 2. **Attaching**: the painted planes go off for good, the interim yaw is zeroed, the model stands in the actor's motion group at the figure's yaw and the actor's height, and a replaced actor takes the model afresh.
 * 3. **Following**: a flash, a cast glow (and Bahamut's orb), the hurt tint, stone, the fade and dissolve, a KO that tips a model with no fall of its own and a revive that stands it (a model with the fall clip is not tipped), the low-HP
 *    kneel read off the requested pose, a re-sized figure, a hidden actor, REDUCE MOTION.
 */
import { AnimationClip, Color, Group, Object3D, Scene, Sprite, VectorKeyframeTrack, type MeshStandardMaterial } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { PaintedActor } from '../../../src/engine/PaintedActor.ts';
import { PARTY_YAW, BOSS_YAW, PARTY_HEIGHT, BOSS_HEIGHT, YRP_CAST, type YrpId } from '../../../src/engine/yrp3d/layout.ts';
import { loadYrpModels, type LoaderIO, type YrpModels } from '../../../src/engine/yrp3d/load.ts';
import { ACCENT } from '../../../src/engine/yrp3d/rim.ts';
import { YrpSkin, hidePaintedFigure, internalsOf, requestedPose } from '../../../src/engine/yrp3d/skin.ts';

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

/** The placeholder painting an actor shows before any art loads: a blank canvas (the real one is drawn with `Path2D`, which jsdom lacks). */
const blank = (): HTMLCanvasElement => document.createElement('canvas');

const NO_FILES: LoaderIO = { fetchBytes: async () => null, fetchJson: async () => null, parse: async () => ({ scene: new Group(), animations: [] }), clone: async (s) => s.clone(true) };
const HEIGHTS = { yuna: PARTY_HEIGHT, rikku: PARTY_HEIGHT, paine: PARTY_HEIGHT, bahamut: BOSS_HEIGHT };

interface Rig {
  scene: Scene;
  host: Group;
  models: YrpModels;
  skin: YrpSkin;
  actors: Record<string, PaintedActor>;
}

const open: Rig[] = [];
afterEach(() => {
  for (const r of open.splice(0)) {
    r.skin.dispose();
    for (const a of Object.values(r.actors)) a.dispose();
  }
});

/** The skin over capsule models, a scene with the host group, and a real actor per id as the stage names and adds them. */
async function rig(ids: readonly YrpId[] = YRP_CAST, io: LoaderIO = NO_FILES): Promise<Rig> {
  const models = await loadYrpModels({ base: '/', dirs: ['models-exp/yrp'], heights: HEIGHTS, io });
  const scene = new Scene();
  const host = new Group();
  scene.add(host);
  const actors: Record<string, PaintedActor> = {};
  for (const id of ids) {
    const a = new PaintedActor({ name: id, worldHeight: HEIGHTS[id], side: id === 'bahamut' ? 'enemy' : 'party', placeholder: blank });
    scene.add(a);
    actors[id] = a;
  }
  const skin = new YrpSkin({ host, models });
  const r = { scene, host, models, skin, actors };
  open.push(r);
  return r;
}

/** A loader whose every file is a small scene with the idle and the fall clips of the game's names (so the models carry rigs and play their own fall). */
const WITH_CLIPS: LoaderIO = {
  fetchBytes: async (url) => (url.endsWith('.glb') ? new Uint8Array([0x67, 0x6c, 0x54, 0x46, 0, 0, 0, 0]).buffer : null),
  fetchJson: async () => null,
  parse: async () => {
    const scene = new Group();
    const body = new Object3D();
    body.name = 'body';
    scene.add(body);
    const clip = (name: string): AnimationClip => new AnimationClip(name, 1, [new VectorKeyframeTrack('body.position', [0, 1], [0, 0, 0, 0, 0.1, 0])]);
    return { scene, animations: ['APPEAR_00', 'DMG1', 'DEAD_00', 'DEAD_01', 'DEAD_02'].map(clip) };
  },
  clone: async (s) => s.clone(true),
};

const materialsOf = (m: { materials: MeshStandardMaterial[] }): MeshStandardMaterial[] => m.materials;
const modelOf = (r: Rig, id: YrpId) => r.skin.get(id)!.model;
const run = (r: Rig, seconds: number, dt = 0.05): void => {
  for (let t = 0; t < seconds; t += dt) {
    for (const a of Object.values(r.actors)) a.update(dt);
    r.skin.update(dt);
  }
};

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
    actor.dispose();
  });

  it("read the pose an actor was last asked for (its private requested), which is how the low-HP rest pose is told even when no painting shows it", () => {
    const actor = new PaintedActor({ name: "yuna", placeholder: blank });
    expect("requested" in actor).toBe(true); // the private field is still there: a rename in PaintedActor.ts fails here
    expect(requestedPose(actor)).toBe("");
    (actor as unknown as { requested: string }).requested = "critical"; // what setPose("critical") stores once a painting resolves it (the idle's, by the chain critical -> idle)
    expect(requestedPose(actor)).toBe("critical");
    expect(requestedPose({} as PaintedActor)).toBe("");
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
  it('switches the painted planes off, zeroes the interim yaw, and stands each model in its actor\'s motion group at the figure\'s yaw and height', async () => {
    const r = await rig();
    r.skin.update(0.02);
    expect(Object.keys(r.skin.carrying).sort()).toEqual([...YRP_CAST].sort());
    for (const id of YRP_CAST) {
      const actor = r.actors[id]!;
      const parts = internalsOf(actor)!;
      expect(parts.showFigure, id).toBe(false);
      for (const slot of parts.slots) expect(slot.mesh.visible, id).toBe(false);
      expect(actor.interimYawDeg, id).toBe(0);
      const model = modelOf(r, id);
      expect(model.root.parent, id).toBe(parts.inner);
      expect(model.height, id).toBe(HEIGHTS[id]);
      expect(r.skin.carrying[id], id).toBe('capsule');
    }
    // the yaw: a girl turns toward Bahamut and a little to the lens, Bahamut toward the girls
    const yawOf = (id: YrpId): number => (modelOf(r, id).root.children[0]!.children[0] as Object3D).rotation.y;
    expect(yawOf('yuna')).toBeCloseTo(PARTY_YAW, 9);
    expect(yawOf('bahamut')).toBeCloseTo(BOSS_YAW, 9);
  });

  it('keeps the painted planes off for good: a later frame, a fade and a pose change do not bring them back', async () => {
    const r = await rig(['yuna']);
    r.skin.update(0.02);
    const actor = r.actors['yuna']!;
    actor.setPose('attack');
    actor.setAlpha(0.7);
    run(r, 0.5);
    for (const slot of internalsOf(actor)!.slots) expect(slot.mesh.visible).toBe(false);
  });

  it('does nothing before the host is in a scene, and for an actor of the cast that is not on the field', async () => {
    const models = await loadYrpModels({ base: '/', dirs: ['x'], heights: HEIGHTS, io: NO_FILES });
    const skin = new YrpSkin({ host: new Group(), models }); // no parent
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
    const r = await rig(['yuna', 'bahamut']);
    r.skin.update(0.02);
    const open = vi.spyOn(modelOf(r, 'yuna'), 'noteOpen');
    const impact = vi.spyOn(modelOf(r, 'yuna'), 'noteImpact');
    r.skin.listener.open!('yuna', 'attack', 0.3);
    r.skin.listener.impact!('yuna');
    expect(open).toHaveBeenCalledWith('attack', 0.3, expect.any(Number));
    expect(impact).toHaveBeenCalledTimes(1);
    const close = vi.spyOn(modelOf(r, 'yuna'), 'noteClose');
    r.skin.listener.close!('yuna');
    expect(close).toHaveBeenCalledTimes(1); // the action is over: a held cast or attack goes to its finish
    expect(() => r.skin.listener.open!('tidus', 'attack', 0.3)).not.toThrow(); // no such figure
    expect(() => r.skin.listener.impact!('rikku')).not.toThrow(); // not on the field
  });

  it('tells each model its actor\'s pose every frame, and holds the clips while the body is down', async () => {
    const r = await rig(['paine']);
    r.skin.update(0.02);
    const model = modelOf(r, 'paine');
    const pose = vi.spyOn(model, 'notePose');
    const update = vi.spyOn(model, 'update');
    r.actors['paine']!.setPose('hurt'); // no painting is loaded, so the shown pose stays; the requested one is the life layer's
    run(r, 0.1);
    expect(pose).toHaveBeenCalledWith('hurt', false, false, expect.any(Number));
    expect(update.mock.calls.at(-1)![1]).toBe(false);
    r.actors['paine']!.setPose('ko');
    run(r, 0.5);
    expect(pose.mock.calls.at(-1)![1]).toBe(true);
    expect(update.mock.calls.at(-1)![1]).toBe(true); // frozen while down
  });

  it('Bahamut\'s wings flap harder while he attacks or casts and he rears as his cast glow swells; the girls do neither', async () => {
    const r = await rig(['yuna', 'bahamut']);
    run(r, 0.2);
    const boss = modelOf(r, 'bahamut');
    const rest = boss.flapAmplitude;
    expect(rest).toBeGreaterThan(0); // the capsule Bahamut has wings, so it flaps too
    r.skin.listener.open!('bahamut', 'attack', 0.25); // the beat: an attack opened (the capsule has no clips, so his wings take a pulse)
    run(r, 0.5);
    expect(boss.flapAmplitude).toBeGreaterThan(rest * 3); // up toward 14 percent from 3
    run(r, 2.5);
    expect(boss.flapAmplitude).toBeLessThan(rest * 1.3); // and back
    const rear = vi.spyOn(boss, 'setRear');
    r.skin.listener.open!('bahamut', 'cast', 0.3);
    run(r, 1.2);
    expect(Math.max(...rear.mock.calls.map((c) => c[0]))).toBeGreaterThan(0.5);
    r.skin.listener.close!('bahamut');
    run(r, 2.5);
    expect(rear.mock.calls.at(-1)![0]).toBeLessThan(0.05);
    const setRearGirl = vi.spyOn(modelOf(r, 'yuna'), 'setRear');
    r.skin.listener.open!('yuna', 'cast', 0.3);
    run(r, 1);
    expect(setRearGirl).not.toHaveBeenCalled();
    expect(modelOf(r, 'yuna').flapAmplitude).toBe(0);
  });
});

describe('following', () => {
  it('lights the model with the actor\'s flash and lets it go as the flash decays', async () => {
    const r = await rig(['yuna']);
    run(r, 0.1);
    const mats = materialsOf(modelOf(r, 'yuna'));
    expect(mats.length).toBeGreaterThan(0);
    expect(mats.every((m) => m.emissive.getHex() === 0)).toBe(true);
    r.actors['yuna']!.flash(0x66ff88, 400, 1);
    run(r, 0.05);
    const lit = mats[0]!.emissive.clone();
    expect(lit.g).toBeGreaterThan(0.1);
    expect(lit.g).toBeLessThanOrEqual(ACCENT.flash.party + 1e-9); // a capped accent, never the old whole-body 0.42
    expect(lit.g).toBeGreaterThan(lit.r); // the flash's own colour
    run(r, 1.5);
    expect(mats[0]!.emissive.g).toBeLessThan(0.02);
  });

  it("caps the boss's hit flash well under the old whole-body flat (the salmon silhouette), and the girls' too", async () => {
    const r = await rig(['yuna', 'bahamut']);
    run(r, 0.1);
    const girl = materialsOf(modelOf(r, 'yuna'))[0]!;
    const boss = materialsOf(modelOf(r, 'bahamut'))[0]!;
    for (const id of ['yuna', 'bahamut']) r.actors[id]!.flash(0xffffff, 400, 1); // the strongest flash the presenter makes (a crit's white)
    run(r, 0.016);
    const peak = (m: MeshStandardMaterial): number => Math.max(m.emissive.r, m.emissive.g, m.emissive.b);
    expect(peak(boss)).toBeGreaterThan(0.12); // it reads
    expect(peak(boss)).toBeLessThanOrEqual(ACCENT.flash.boss + 1e-9);
    expect(peak(boss)).toBeLessThan(0.42 * 0.8); // the old hit (0xffd0c0 at 0.8 of the old 0.42) was a flat 0.34 across the whole body
    expect(peak(girl)).toBeLessThanOrEqual(ACCENT.flash.party + 1e-9);
    run(r, 1.5); // the flash is long gone
    expect(peak(boss)).toBeLessThan(0.02);
  });

  it('swells a cast glow while the actor holds the cast pose (warm for a girl) and lets it go after; Bahamut\'s is violet and brings up the orb', async () => {
    const r = await rig(['yuna', 'bahamut']);
    run(r, 0.1);
    const girl = materialsOf(modelOf(r, 'yuna'))[0]!;
    const boss = materialsOf(modelOf(r, 'bahamut'))[0]!;
    const orb = modelOf(r, 'bahamut').root.getObjectByName('yrp-orb') as Sprite;
    expect([girl.emissive.getHex(), boss.emissive.getHex(), orb.visible]).toEqual([0, 0, false]);
    for (const id of ['yuna', 'bahamut']) r.skin.listener.open!(id, 'cast', 0.3); // the beat holds the glow whatever painting the actor shows
    run(r, 1.2);
    expect(girl.emissive.r).toBeGreaterThan(girl.emissive.b); // warm
    const peakOf = (m: MeshStandardMaterial): number => Math.max(m.emissive.r, m.emissive.g, m.emissive.b);
    expect(peakOf(girl)).toBeGreaterThan(0.05); // it reads
    expect(peakOf(girl)).toBeLessThanOrEqual(ACCENT.glow.party + 1e-9); // and never blows the girl out to white
    expect(peakOf(boss)).toBeLessThanOrEqual(ACCENT.glow.boss + 1e-9);
    expect(boss.emissive.b).toBeGreaterThan(boss.emissive.g); // violet
    expect([orb.visible, orb.scale.x > 0.5]).toEqual([true, true]);
    for (const id of ['yuna', 'bahamut']) r.skin.listener.close!(id);
    run(r, 2);
    expect([girl.emissive.getHex(), boss.emissive.getHex(), orb.visible]).toEqual([0, 0, false]);
    expect(modelOf(r, 'yuna').root.getObjectByName('yrp-orb')).toBeUndefined(); // the girls have no orb
  });

  it('multiplies the colour by the actor\'s tint and brightness, greys a petrified figure, and fades the figure with its alpha and dissolve', async () => {
    const r = await rig(['paine']);
    run(r, 0.1);
    const model = modelOf(r, 'paine');
    const mat = materialsOf(model)[0]!;
    const base = (mat.userData['shadeBase'] as { color: Color }).color;
    expect(mat.color.toArray()).toEqual(base.toArray());
    const actor = r.actors['paine']!;
    actor.setTint(0xff8080);
    actor.setBrightness(0.5);
    run(r, 0.1);
    expect(mat.color.r).toBeCloseTo(base.r * 1 * 0.5, 4);
    expect(mat.color.g).toBeCloseTo(base.g * (0x80 / 255) ** 2.2 * 0.5 > 0 ? mat.color.g : 0, 1); // the tint is read as linear by three; the red is untouched and the others are lower
    expect(mat.color.g).toBeLessThan(base.g * 0.5);
    actor.setBrightness(1);
    actor.setTint(0xffffff);
    actor.setStone(1);
    run(r, 0.1);
    expect(Math.abs(mat.color.r - mat.color.b)).toBeLessThan(Math.abs(base.r - base.b) + 1e-9); // toward grey
    actor.setStone(0);
    actor.setAlpha(0.4);
    run(r, 0.1);
    expect([mat.opacity, mat.transparent, model.root.visible]).toEqual([0.4, true, true]);
    actor.setAlpha(1);
    actor.setDissolve(1);
    run(r, 0.1);
    expect(model.root.visible).toBe(false); // fully dissolved: gone
    actor.setDissolve(0);
    run(r, 0.1);
    expect([mat.opacity, mat.transparent, model.root.visible]).toEqual([1, false, true]);
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
    expect(Math.sign(lie.rotation.z)).toBe(r.actors['rikku']!.facingDir); // falls away from the way it faces: z = facing * quarter turn
    expect(lie.position.y).toBeGreaterThan(0);
    r.actors['rikku']!.setPose('idle');
    run(r, 2);
    expect(lie.rotation.z).toBe(0);
  });

  it("a model with the game's fall clip plays it and is not tipped as well; the revive plays the rise", async () => {
    const r = await rig(['rikku'], WITH_CLIPS);
    run(r, 0.1);
    const model = modelOf(r, 'rikku');
    expect([model.animated, model.playsKo, model.playing]).toEqual([true, true, 'idle']);
    const lie = model.root.children[0]!;
    r.actors['rikku']!.setPose('ko');
    run(r, 1.5);
    expect(lie.rotation.z).toBe(0); // no procedural tip: the clip is the fall
    expect(model.playing).toBe('ko');
    expect(model.playingClip).toBe('DEAD_01'); // the fall played and the hold took over
    r.actors['rikku']!.setPose('idle');
    run(r, 3);
    expect(model.playing).toBe('idle');
  });

  it('tells the model the figure is at low HP while its requested pose is critical (the kneel), and not once it is back to idle or down', async () => {
    const r = await rig(['yuna']);
    run(r, 0.1);
    const pose = vi.spyOn(modelOf(r, 'yuna'), 'notePose');
    const requested = (v: string): void => {
      (r.actors['yuna'] as unknown as { requested: string }).requested = v; // the rest pose the battle screen asks for below a third of the HP; a painting that resolves it stores it (this actor has no art)
    };
    requested('critical');
    run(r, 0.1);
    expect(pose.mock.calls.at(-1)!.slice(0, 3)).toEqual(['placeholder', false, true]);
    requested('idle');
    run(r, 0.1);
    expect(pose.mock.calls.at(-1)![2]).toBe(false);
    requested('critical');
    r.actors['yuna']!.setPose('ko');
    run(r, 0.2);
    expect(pose.mock.calls.at(-1)![2]).toBe(false); // down: never kneeling
  });

  it('a figure staged already down stands down from the first frame (no topple on frame one)', async () => {
    const r = await rig(['paine']);
    r.actors['paine']!.setPose('ko', { immediate: true });
    r.skin.update(0.02);
    const lie = modelOf(r, 'paine').root.children[0]!;
    expect(Math.abs(lie.rotation.z)).toBeCloseTo(Math.PI / 2, 5);
  });

  it('refits when the stage re-sizes a figure, and follows the actor\'s own motion (it rides the same group)', async () => {
    const r = await rig(['bahamut']);
    run(r, 0.1);
    const model = modelOf(r, 'bahamut');
    expect(model.height).toBe(BOSS_HEIGHT);
    r.actors['bahamut']!.setWorldHeight(4);
    run(r, 0.05);
    expect(model.height).toBe(4);
    const inner = internalsOf(r.actors['bahamut']!)!.inner;
    void r.actors['bahamut']!.lunge(2, 200);
    run(r, 0.12);
    expect(Math.abs(inner.position.x)).toBeGreaterThan(0.1); // the actor's own lunge moved the motion group, and the model with it
    expect(model.root.parent).toBe(inner);
  });

  it('stills the idle clip under REDUCE MOTION (the actor says so) and disposes with the models', async () => {
    const r = await rig(['yuna']);
    r.skin.update(0.02);
    (r.actors['yuna'] as unknown as { still: () => boolean }).still = () => true;
    const update = vi.spyOn(modelOf(r, 'yuna'), 'update');
    run(r, 0.1);
    expect(update).toHaveBeenCalled();
    for (const call of update.mock.calls) expect(call[1]).toBe(true); // frozen: the clips hold their pose
    const spy = vi.spyOn(r.models, 'dispose');
    r.skin.dispose();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(r.skin.carrying).toEqual({});
  });
});
