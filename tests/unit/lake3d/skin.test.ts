// @vitest-environment jsdom
/**
 * **The Meshy models on the battle's actors** (`src/engine/lake3d/skin.ts`; the hidden Wendigo chapter, FFX only), driven with real `PaintedActor`s (a no-op 2D context stands in for the canvas, as in the Bahamut chapter's
 * skin test) and the neutral capsule models plus a rigged fake file for the clips. What it pins:
 *
 * 1. **The private parts are still there**: `PaintedActor` keeps its figure switch, its plane meshes, its motion group and its uniform cells private and the skin reaches them, so a rename in `PaintedActor.ts` fails here
 *    instead of drawing nothing; an actor that lacks them is left painted.
 * 2. **Attaching**: the painted planes go off for good, the interim yaw is zeroed, the model stands in the actor's motion group at the figure's yaw and height; the aeons (no model) stay painted.
 * 3. **Following**: a flash rides the emissive accent, the fade and the dissolve fade the model, a downed capsule is tipped and a model with a fall clip is not, the epilogue's sink drops the party and not the enemies, the
 *    Wendigo's arms go up and down on their moves' beats, a re-sized figure is refitted.
 */
import { AnimationClip, Color, Group, Mesh, MeshStandardMaterial, Object3D, Scene, VectorKeyframeTrack, BoxGeometry } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { LAKE_NATIVE_HEIGHT, type LakeId } from '../../../src/data/ffx/lake-models.ts';
import { PaintedActor } from '../../../src/engine/PaintedActor.ts';
import { loadLakeModels, type LoaderIO, type LakeModels } from '../../../src/engine/lake3d/load.ts';
import { ACCENT } from '../../../src/engine/lake3d/model.ts';
import { LakeSkin, TURN_TO_LENS, facingYaw, hidePaintedFigure, internalsOf, requestedPose } from '../../../src/engine/lake3d/skin.ts';

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

const blank = (): HTMLCanvasElement => document.createElement('canvas');
const NO_FILES: LoaderIO = { fetchBytes: async () => null, parse: async () => ({ scene: new Group(), animations: [] }), clone: async (s) => s.clone(true) };

/** Every file is a small scene with a body mesh and the clips a figure needs, so models carry rigs and play their own fall. */
const WITH_CLIPS: LoaderIO = {
  fetchBytes: async (url) => (url.endsWith('.glb') ? new TextEncoder().encode(url).buffer : null),
  parse: async (bytes) => {
    const url = new TextDecoder().decode(bytes);
    const scene = new Group();
    if (!url.includes('/weapons/')) {
      const body = new Object3D();
      body.name = 'Hips';
      scene.add(body);
      scene.add(new Mesh(new BoxGeometry(0.5, 1.75, 0.3).translate(0, 0.875, 0), new MeshStandardMaterial()));
    } else scene.add(new Mesh(new BoxGeometry(0.05, 1, 0.05), new MeshStandardMaterial()));
    const clip = (name: string): AnimationClip => new AnimationClip(name, 1, [new VectorKeyframeTrack('Hips.position', [0, 1], [0, 0, 0, 0, 0.1, 0])]);
    return { scene, animations: ['idle1', 'dmg1', 'dead_00', 'dead_01', 'dead_02', 'win_00', 'win_01', 'idle','hurt', 'ko', 'attack', 'arms_up', 'stance_block1', 'stance_block2'].map(clip) };
  },
  clone: async (s) => s.clone(true),
};

interface Rig {
  scene: Scene;
  host: Group;
  models: LakeModels;
  skin: LakeSkin;
  actors: Record<string, PaintedActor>;
}
const open: Rig[] = [];
afterEach(() => {
  for (const r of open.splice(0)) {
    r.skin.dispose();
    for (const a of Object.values(r.actors)) a.dispose();
  }
});

const FRONT: readonly LakeId[] = ['tidus', 'yuna', 'rikku', 'wendigo', 'lake-guardian-a', 'lake-guardian-b'];

async function rig(ids: readonly string[] = FRONT, io: LoaderIO = NO_FILES): Promise<Rig> {
  const models = await loadLakeModels({ base: '/', heights: {}, io, skip: ['wakka', 'auron', 'lulu', 'kimahri'] });
  const scene = new Scene();
  const host = new Group();
  scene.add(host);
  const actors: Record<string, PaintedActor> = {};
  for (const id of ids) {
    const a = new PaintedActor({ name: id, worldHeight: LAKE_NATIVE_HEIGHT[id as LakeId] ?? 1.7, side: ['wendigo', 'lake-guardian-a', 'lake-guardian-b'].includes(id) ? 'enemy' : 'party', placeholder: blank });
    scene.add(a);
    actors[id] = a;
  }
  const skin = new LakeSkin({ host, models });
  const r = { scene, host, models, skin, actors };
  open.push(r);
  return r;
}
const run = (r: Rig, seconds: number, dt = 0.05): void => {
  for (let t = 0; t < seconds; t += dt) {
    for (const a of Object.values(r.actors)) a.update(dt);
    r.skin.update(dt);
  }
};
const modelOf = (r: Rig, id: LakeId) => r.skin.get(id)!.model;

describe('the private parts of a PaintedActor the skin reaches', () => {
  it('are there on a real actor', () => {
    const actor = new PaintedActor({ name: 'tidus', placeholder: blank });
    const parts = internalsOf(actor)!;
    expect(parts).not.toBeNull();
    expect(typeof parts.showFigure).toBe('boolean');
    expect(parts.slots).toHaveLength(2);
    expect(parts.inner).toBeInstanceOf(Group);
    expect(parts.u.flashColor.value).toBeInstanceOf(Color);
    expect([parts.u.brightness.value, parts.u.desaturate.value]).toEqual([1, 0]);
    expect('requested' in actor).toBe(true);
    expect(requestedPose(actor)).toBe('');
    actor.dispose();
  });

  it('are reported absent for an object that is not an actor', () => {
    expect(internalsOf({} as PaintedActor)).toBeNull();
    expect(hidePaintedFigure({} as PaintedActor)).toBe(false);
  });
});

describe('facing', () => {
  it('turns the party toward +x and the enemies toward -x, each a little toward the lens', () => {
    expect(facingYaw('tidus')).toBeCloseTo(Math.PI / 2 - TURN_TO_LENS['party']!, 6);
    expect(facingYaw('wendigo')).toBeCloseTo(-Math.PI / 2 + TURN_TO_LENS['wendigo']!, 6);
    expect(facingYaw('lake-guardian-b')).toBeCloseTo(-Math.PI / 2 + TURN_TO_LENS['guardian']!, 6);
    expect(facingYaw('tidus')).toBeGreaterThan(0);
    expect(facingYaw('wendigo')).toBeLessThan(0);
  });
});

describe('attaching', () => {
  it('switches the painted planes off, zeroes the interim yaw, stands the model in the actor\'s motion group and takes a model only for the actors the stage has', async () => {
    const r = await rig(['tidus', 'wendigo', 'ixion']);
    run(r, 0.1);
    expect(Object.keys(r.skin.carrying).sort()).toEqual(['tidus', 'wendigo']);
    const parts = internalsOf(r.actors['tidus']!)!;
    expect(parts.showFigure).toBe(false);
    for (const s of parts.slots) expect(s.mesh.visible).toBe(false);
    expect(modelOf(r, 'tidus').root.parent).toBe(parts.inner);
    expect(internalsOf(r.actors['ixion']!)!.showFigure).toBe(true); // an aeon keeps its painting
    expect(r.skin.carrying['tidus']).toBe('capsule');
  });

  it('takes a replaced actor of the same id afresh', async () => {
    const r = await rig(['tidus']);
    run(r, 0.1);
    const first = modelOf(r, 'tidus');
    r.scene.remove(r.actors['tidus']!);
    const next = new PaintedActor({ name: 'tidus', worldHeight: 1.75, placeholder: blank });
    r.scene.add(next);
    r.actors['tidus2'] = next;
    run(r, 0.1);
    expect(r.skin.get('tidus')!.actor).toBe(next);
    expect(modelOf(r, 'tidus')).toBe(first);
    expect(first.root.parent).toBe(internalsOf(next)!.inner);
  });

  it('refits a re-sized figure', async () => {
    const r = await rig(['wendigo']);
    run(r, 0.1);
    const model = modelOf(r, 'wendigo');
    r.actors['wendigo']!.setWorldHeight(2.9);
    run(r, 0.1);
    expect(model.height).toBe(2.9);
  });
});

describe('following', () => {
  it('rides a flash on the emissive accent, never a flat tint of the body', async () => {
    const r = await rig(['tidus'], WITH_CLIPS);
    run(r, 0.1);
    const parts = internalsOf(r.actors['tidus']!)!;
    parts.u.flashAmount.value = 1;
    parts.u.flashColor.value.setRGB(1, 0.2, 0.2);
    run(r, 0.1);
    const mats: MeshStandardMaterial[] = [];
    modelOf(r, 'tidus').root.traverse((o) => {
      if ((o as Mesh).isMesh) mats.push((o as Mesh).material as MeshStandardMaterial);
    });
    expect(mats.length).toBeGreaterThan(0);
    for (const m of mats) {
      expect(m.emissiveIntensity).toBeCloseTo(ACCENT.flash.party, 6);
      expect(m.emissive.r).toBeCloseTo(1, 6);
      expect(m.color.r).toBeCloseTo(1, 6); // the body's own colour is untouched
    }
    parts.u.flashAmount.value = 0;
    run(r, 0.1);
    for (const m of mats) expect(m.emissiveIntensity).toBe(0);
  });

  it('fades the model with the actor\'s alpha and hides it at zero', async () => {
    const r = await rig(['lake-guardian-a'], WITH_CLIPS);
    run(r, 0.1);
    const model = modelOf(r, 'lake-guardian-a');
    r.actors['lake-guardian-a']!.setAlpha(0.5);
    run(r, 0.1);
    expect(model.opacity).toBeCloseTo(0.5, 6);
    expect(model.root.visible).toBe(true);
    r.actors['lake-guardian-a']!.setAlpha(0);
    run(r, 0.1);
    expect(model.root.visible).toBe(false);
  });

  it('tips a downed capsule onto its back and does not tip a model that plays its own fall', async () => {
    const capsule = await rig(['tidus']);
    run(capsule, 0.1);
    capsule.actors['tidus']!.setPose('ko');
    run(capsule, 1.5);
    const tipped = (capsule.skin.get('tidus')!.model.root.children[0] as Group).rotation.z;
    expect(Math.abs(tipped)).toBeGreaterThan(1);
    const clips = await rig(['tidus'], WITH_CLIPS);
    run(clips, 0.1);
    clips.actors['tidus']!.setPose('ko');
    run(clips, 1.5);
    expect(modelOf(clips, 'tidus').playsKo).toBe(true);
    expect((clips.skin.get('tidus')!.model.root.children[0] as Group).rotation.z).toBe(0);
  });

  it('drops the party through the broken ice and leaves the enemies where they stand', async () => {
    const r = await rig(['tidus', 'wendigo']);
    run(r, 0.1);
    r.skin.sinkOf = (id) => (id === 'tidus' ? { down: 1.2, tilt: 0.2 } : { down: 0, tilt: 0 });
    run(r, 0.1);
    const sink = (id: LakeId): number => ((modelOf(r, id).root.children[0] as Group).children[0] as Group).children[0]!.position.y;
    expect(sink('tidus')).toBeCloseTo(-1.2, 6);
    expect(sink('wendigo')).toBeCloseTo(0, 6);
  });
});

describe('the win', () => {
  it('has the standing party take their victory poses once the last foe has fallen, and not the enemies, nor a fallen member', async () => {
    const r = await rig(['tidus', 'yuna', 'wendigo'], WITH_CLIPS);
    run(r, 0.1);
    expect(modelOf(r, 'tidus').playing).toBe('idle');
    r.skin.celebrating = true;
    r.actors['yuna']!.setPose('ko');
    run(r, 0.5);
    expect(modelOf(r, 'tidus').playing).toBe('victory'); // it has left the idle for the pose
    expect(modelOf(r, 'tidus').playingClip).toMatch(/^win_0[01]$/);
    expect(modelOf(r, 'wendigo').playing).not.toBe('victory');
    expect(modelOf(r, 'yuna').playing).toBe('ko'); // she stays down
  });
});

describe('the beats', () => {
  it('raise and lower the Wendigo\'s arms on their moves, and nobody else\'s', async () => {
    const r = await rig(['wendigo', 'lake-guardian-a'], WITH_CLIPS);
    run(r, 0.1);
    const w = modelOf(r, 'wendigo');
    r.skin.listener.open?.('wendigo', 'cast', 0.26, 'wendigo-raise-arms');
    expect(w.monsterRig!.armsUp).toBe(true);
    expect(w.playingClip).toBe('arms_up');
    r.skin.listener.open?.('lake-guardian-a', 'cast', 0.26, 'wendigo-raise-arms');
    expect(modelOf(r, 'lake-guardian-a').monsterRig!.armsUp).toBe(false);
    r.skin.listener.open?.('wendigo', 'cast', 0.26, 'wendigo-lower-arms');
    expect(w.monsterRig!.armsUp).toBe(false);
  });

  it('start a blow\'s clip on the figure that strikes and tell the director the wind-up it needs', async () => {
    const r = await rig(['wendigo', 'tidus'], WITH_CLIPS);
    run(r, 0.1);
    expect(r.skin.listener.windup?.('wendigo', 'attack', 0.26, 'wendigo-punch')).toBeGreaterThanOrEqual(0);
    r.skin.listener.open?.('wendigo', 'attack', 0.5, 'wendigo-punch');
    expect(modelOf(r, 'wendigo').playingClip).toBe('attack');
    expect(r.skin.listener.windup?.('nobody', 'attack', 0.26, undefined)).toBe(0);
  });
});
