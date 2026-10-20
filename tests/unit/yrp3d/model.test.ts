/**
 * **A model made toon and fitted to a figure, and where the models come from** (`src/engine/yrp3d/model.ts`, `capsule.ts`, `orb.ts`; the hidden 3D Bahamut chapter, FFX-2 only). What it pins, with three's real classes and
 * synthetic scenes (no file, no renderer):
 *
 * 1. **The fit**: whatever the file's size and origin, the figure stands `height` tall on y 0 with its footprint centred, turns about +Y, tips about its feet when it is down, and refits when the stage re-sizes it.
 * 2. **The layers and the extras**: Bahamut alone has the gathering orb; an idle clip plays and a walk clip alone does not.
 * 3. **The loader**: each figure from its own file (`<id>.glb`), a missing or broken file replaced by the neutral capsule (no other stand-in), a body that is not a binary glTF refused, every id always present.
 * 4. **The capsule**: a neutral figure per id with no name of any character in it, a nose that faces +Z, the head the highest point, a winged Bahamut.
 */
import { AnimationClip, Box3, BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, Object3D, Sprite, Vector3, VectorKeyframeTrack } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { CAPSULE_COLOUR, capsuleFigure } from '../../../src/engine/yrp3d/capsule.ts';
import { PARTY_HEIGHT, TOON, YRP_CAST, type YrpId } from '../../../src/engine/yrp3d/layout.ts';
import { YrpModel, fetchGlb, loadYrpModels, type LoaderIO } from '../../../src/engine/yrp3d/model.ts';
import { Orb, orbTexture } from '../../../src/engine/yrp3d/orb.ts';

/** A file's scene: a body 2 wide and 2.3 tall standing on y 0 off-centre, and an arm out to one side. Units of a file. */
function fileScene(): Group {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(1, 2.3, 0.6), new MeshStandardMaterial({ color: 0x8899aa }));
  body.position.set(3, 1.15, -2);
  const arm = new Mesh(new BoxGeometry(1.2, 0.2, 0.2), new MeshStandardMaterial({ color: 0x8899aa }));
  arm.position.set(4.1, 1.6, -2);
  g.add(body, arm);
  return g;
}

/** A figure with nothing to one side: a plain column 0.5 wide and deep and 2.3 tall, centred (so a body that is tipped over shows how it rests on the floor). */
function thinScene(): Group {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(0.5, 2.3, 0.5), new MeshStandardMaterial({ color: 0x8899aa }));
  body.position.y = 1.15;
  g.add(body);
  return g;
}

const boxOf = (o: Object3D): Box3 => {
  o.updateMatrixWorld(true);
  return new Box3().setFromObject(o);
};

describe('the fit', () => {
  it('stands the figure on the floor at its height with its footprint centred, whatever the file\'s size and origin', () => {
    const model = new YrpModel('yuna', fileScene(), [], PARTY_HEIGHT);
    const box = boxOf(model.root);
    expect(box.max.y - box.min.y).toBeCloseTo(PARTY_HEIGHT, 5);
    expect(box.min.y).toBeCloseTo(0, 5);
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0, 5);
    expect((box.min.z + box.max.z) / 2).toBeCloseTo(0, 5);
    const big = new YrpModel('rikku', ((): Group => { const g = fileScene(); g.scale.setScalar(80); g.position.y = -50; return g; })(), [], PARTY_HEIGHT);
    const b2 = boxOf(big.root);
    expect(b2.max.y - b2.min.y).toBeCloseTo(PARTY_HEIGHT, 4);
    expect(b2.min.y).toBeCloseTo(0, 4);
  });

  it('turns about +Y: a model faces +Z at yaw 0, and a quarter turn faces +X', () => {
    const model = new YrpModel('paine', fileScene(), [], PARTY_HEIGHT);
    const arm = model.root.getObjectByProperty('isMesh', true)!; // any mesh: the arm's world x moves with the yaw
    const probe = new Mesh();
    arm.parent!.add(probe);
    probe.position.set(0, 0, 1);
    const front = (): Vector3 => {
      model.root.updateMatrixWorld(true);
      return probe.getWorldPosition(new Vector3()).sub(arm.parent!.getWorldPosition(new Vector3())).normalize();
    };
    model.setYaw(0);
    expect(front().z).toBeGreaterThan(0.99);
    model.setYaw(Math.PI / 2);
    expect(front().x).toBeGreaterThan(0.99);
  });

  it('tips onto its back about its feet when down, away from the way it faces, and rests a little off the floor; standing again undoes it', () => {
    const model = new YrpModel('yuna', thinScene(), [], PARTY_HEIGHT);
    model.setLie(1, -1); // faces -x: falls toward +x
    const down = boxOf(model.root);
    expect(down.max.y - down.min.y).toBeLessThan(PARTY_HEIGHT * 0.5); // lying: low and long
    expect(down.max.x).toBeGreaterThan(PARTY_HEIGHT * 0.8); // along +x
    expect(down.min.x).toBeLessThan(0.5);
    expect(down.min.y).toBeGreaterThan(-0.05); // not through the floor
    expect(down.min.y).toBeLessThan(0.3);
    expect(model.root.children[0]!.rotation.z).toBeCloseTo(-Math.PI / 2, 6); // faces -x: the fall is a quarter turn the other way about z
    model.setLie(1, 1);
    expect(boxOf(model.root).min.x).toBeLessThan(-PARTY_HEIGHT * 0.8); // faces +x: falls toward -x
    model.setLie(0, 1);
    const up = boxOf(model.root);
    expect(up.max.y - up.min.y).toBeCloseTo(PARTY_HEIGHT, 5);
  });

  it('refits when the stage re-sizes the figure: the height, and the ink\'s thickness in the file\'s units (the same in the world)', () => {
    const model = new YrpModel('bahamut', fileScene(), [], 5);
    const thick = (): number => ((model as unknown as { set: { hullMaterial: { userData: { uInk: { value: number } } } } }).set.hullMaterial.userData.uInk.value);
    const scale1 = 5 / 2.3;
    expect(thick()).toBeCloseTo(TOON.inkWorld / scale1, 6);
    model.fitTo(2.5);
    const box = boxOf(model.root);
    expect(box.max.y - box.min.y).toBeCloseTo(2.5, 5);
    expect(model.height).toBe(2.5);
    expect(thick()).toBeCloseTo(TOON.inkWorld / (2.5 / 2.3), 6);
    model.fitTo(-1); // a bad height is ignored
    model.fitTo(2.5);
    expect(model.height).toBe(2.5);
  });
});

describe('the layers and the extras', () => {
  it('gives Bahamut alone the gathering orb, hidden until it is asked for and swelling with the strength', () => {
    const girl = new YrpModel('yuna', fileScene(), [], PARTY_HEIGHT);
    expect(girl.root.getObjectByName('yrp-orb')).toBeUndefined();
    girl.setOrb(1); // a no-op, not an error
    const boss = new YrpModel('bahamut', fileScene(), [], 5);
    const orb = boss.root.getObjectByName('yrp-orb') as Sprite;
    expect(orb).toBeInstanceOf(Sprite);
    expect(orb.visible).toBe(false);
    boss.setOrb(0.3);
    const small = orb.scale.x;
    boss.setOrb(0.9);
    expect([orb.visible, orb.scale.x > small]).toEqual([true, true]);
    expect(orb.position.y).toBeCloseTo(5 * 0.62, 6); // the chest
    expect(orb.position.z).toBeGreaterThan(0); // in front of it
    boss.setOrb(0);
    expect(orb.visible).toBe(false);
    boss.fitTo(4);
    expect(orb.position.y).toBeCloseTo(4 * 0.62, 6);
  });

  it('plays an idle clip when the file has one (named like idle, breath or stand), and not a walk or a run on its own', () => {
    const track = (scene: Object3D) => new VectorKeyframeTrack(`${scene.children[0]!.name || 'body'}.position`, [0, 1], [0, 0, 0, 0, 0.05, 0]);
    const withClip = (name: string): YrpModel => {
      const scene = fileScene();
      scene.children[0]!.name = 'body';
      return new YrpModel('rikku', scene, [new AnimationClip(name, 1, [track(scene)])], PARTY_HEIGHT);
    };
    expect(withClip('Idle_Loop').animated).toBe(true);
    expect(withClip('Breathing').animated).toBe(true);
    expect(withClip('Walk').animated).toBe(false);
    expect(withClip('Run').animated).toBe(false);
    expect(new YrpModel('rikku', fileScene(), [], PARTY_HEIGHT).animated).toBe(false);
    expect(() => withClip('Idle').update(0.5)).not.toThrow();
  });

  it('drives its materials through setChannels and counts its hulls', () => {
    const model = new YrpModel('yuna', fileScene(), [], PARTY_HEIGHT);
    expect(model.meshCount).toBe(2);
    model.setChannels({ colour: new Color(1, 1, 1), emissive: new Color(1, 1, 1), amount: 0.5, opacity: 0.5 });
    const mesh = model.root.getObjectByProperty('isMesh', true) as Mesh;
    expect((mesh.material as MeshStandardMaterial).opacity).toBe(0.5);
    expect((mesh.material as MeshStandardMaterial).emissive.toArray()).toEqual([0.5, 0.5, 0.5]);
  });

  it('frees what it made: the orb, the hulls and the root', () => {
    const boss = new YrpModel('bahamut', fileScene(), [], 5);
    const holder = new Group();
    holder.add(boss.root);
    const orb = boss.root.getObjectByName('yrp-orb')!;
    boss.dispose();
    expect(boss.root.parent).toBeNull();
    expect(orb.parent).toBeNull();
  });
});

describe('the orb', () => {
  it('is a white core in a violet halo with a faint ring, premultiplied, and transparent at the edge', () => {
    const t = orbTexture();
    const d = t.image.data as Uint8Array;
    const at = (x: number, y: number): number[] => Array.from(d.slice((y * 64 + x) * 4, (y * 64 + x) * 4 + 4));
    const [r, g, b, a] = at(32, 32);
    expect([r! > 230, g! > 200, b, a! > 230]).toEqual([true, true, 255, true]); // the core
    expect(at(0, 0)[3]).toBe(0); // the corner
    expect(at(8, 32)[2]!).toBeGreaterThan(at(8, 32)[0]!); // the halo leans violet: more blue than red
    new Orb().dispose();
  });
});

// --------------------------------------------------------------------------- the loader

const GLB = new Uint8Array(32).fill(0);
GLB.set([0x67, 0x6c, 0x54, 0x46], 0);

/** An IO whose files are `have` (by id), parsed into the synthetic scene; `broken` ids are bytes that parse with an error (marked by a byte of their body). */
function io(have: readonly YrpId[], broken: readonly YrpId[] = []): { io: LoaderIO; fetched: string[]; parsed: number } {
  const state = { fetched: [] as string[], parsed: 0 };
  const loader: LoaderIO = {
    async fetchBytes(url) {
      state.fetched.push(url);
      const id = /\/(\w+)\.glb$/.exec(url)?.[1];
      if (broken.includes(id as YrpId)) return new Uint8Array([...GLB.slice(0, 8), 7, ...GLB.slice(9)]).buffer;
      return have.includes(id as YrpId) ? new Uint8Array(GLB).buffer : null;
    },
    async parse(bytes) {
      state.parsed++;
      if (new Uint8Array(bytes)[8] === 7) throw new Error('bad file');
      return { scene: fileScene(), animations: [] };
    },
    async clone(scene) {
      return scene.clone(true);
    },
  };
  return { io: loader, get fetched() { return state.fetched; }, get parsed() { return state.parsed; } };
}

const HEIGHTS = { yuna: 1.9, rikku: 1.9, paine: 1.9, bahamut: 5 } as const;
const opts = (loader: LoaderIO, warn?: (m: string) => void) => ({ base: '/', dir: 'models-exp/yrp', heights: HEIGHTS, io: loader, ...(warn ? { warn } : {}) });

describe('the loader', () => {
  it('loads each figure from <base><dir>/<id>.glb, its own file and nothing else, and every id has a model', async () => {
    const t = io(YRP_CAST);
    const models = await loadYrpModels(opts(t.io));
    expect([...t.fetched].sort()).toEqual(YRP_CAST.map((id) => `/models-exp/yrp/${id}.glb`).sort());
    expect([...models.models.keys()].sort()).toEqual([...YRP_CAST].sort());
    expect(models.capsules).toEqual([]);
    for (const id of YRP_CAST) expect([models.models.get(id)!.source, models.models.get(id)!.height]).toEqual(['own', HEIGHTS[id]]);
    models.dispose();
  });

  it('stands the neutral capsule in any slot whose file is missing, and says which', async () => {
    const t = io(['yuna', 'rikku', 'paine']);
    const models = await loadYrpModels(opts(t.io));
    expect(models.capsules).toEqual(['bahamut']);
    expect(models.models.get('bahamut')!.source).toBe('capsule');
    expect(models.models.get('yuna')!.source).toBe('own');
    expect(models.models.get('bahamut')!.height).toBe(5);
    models.dispose();
  });

  it('with no file at all, every slot is a capsule (the chapter still plays in frame A)', async () => {
    const models = await loadYrpModels(opts(io([]).io));
    expect([...models.capsules].sort()).toEqual([...YRP_CAST].sort());
    for (const m of models.models.values()) expect(m.source).toBe('capsule');
    models.dispose();
  });

  it('a file that will not parse is a capsule and a line in the log, never a failed load', async () => {
    const warn = vi.fn();
    const models = await loadYrpModels(opts(io(['rikku', 'paine', 'bahamut'], ['yuna']).io, warn));
    expect(models.capsules).toEqual(['yuna']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toMatch(/yuna\.glb did not parse: bad file/);
    expect(models.models.size).toBe(4);
    models.dispose();
  });

  it('dispose empties the set and frees the figures', async () => {
    const models = await loadYrpModels(opts(io(YRP_CAST).io));
    const roots = [...models.models.values()].map((m) => m.root);
    const holder = new Group();
    roots.forEach((r) => holder.add(r));
    models.dispose();
    expect(models.models.size).toBe(0);
    for (const r of roots) expect(r.parent).toBeNull();
  });
});

describe('fetchGlb', () => {
  const answer = (body: BodyInit | null, status = 200) => (async () => new Response(body, { status })) as unknown as typeof fetch;

  it('returns the bytes of a binary glTF and nothing else: a missing file, an index page answered with 200, an empty body and a failed fetch are all null', async () => {
    expect(await fetchGlb('/x.glb', answer(GLB))).toBeInstanceOf(ArrayBuffer);
    expect(await fetchGlb('/x.glb', answer(null, 404))).toBeNull();
    expect(await fetchGlb('/x.glb', answer('<!doctype html><html><body>index</body></html>'))).toBeNull();
    expect(await fetchGlb('/x.glb', answer(''))).toBeNull();
    expect(await fetchGlb('/x.glb', (async () => { throw new Error('offline'); }) as unknown as typeof fetch)).toBeNull();
  });
});

describe('the neutral capsule', () => {
  it('is a figure of meshes per id, in a colour of its own, built in code with nothing of any character in its names', () => {
    const colours = new Set<number>();
    for (const id of YRP_CAST) {
      const g = capsuleFigure(id);
      let meshes = 0;
      g.traverse((o) => (o as Mesh).isMesh && meshes++);
      expect(meshes, id).toBeGreaterThanOrEqual(3);
      expect(g.name).toBe(`capsule-${id}`);
      colours.add(CAPSULE_COLOUR[id]);
      expect(g.getObjectByName('body'), id).toBeDefined();
      expect(g.getObjectByName('head'), id).toBeDefined();
    }
    expect(colours.size).toBe(4);
  });

  it('stands on y 0 with the head the highest point and the nose toward +Z (a model faces +Z at yaw 0)', () => {
    for (const id of YRP_CAST) {
      const g = capsuleFigure(id);
      const all = boxOf(g);
      const head = boxOf(g.getObjectByName('head')!);
      expect(all.min.y, id).toBeCloseTo(0, 1);
      expect(head.max.y, id).toBeCloseTo(all.max.y, 6);
    }
    const girl = capsuleFigure('yuna');
    expect(boxOf(girl.getObjectByName('nose')!).getCenter(new Vector3()).z).toBeGreaterThan(0);
    expect(boxOf(capsuleFigure('bahamut').getObjectByName('snout')!).getCenter(new Vector3()).z).toBeGreaterThan(0);
  });

  it('makes Bahamut a winged giant: two wings spread wider than the body is tall, a tail behind him, wider than any girl', () => {
    const boss = capsuleFigure('bahamut');
    const span = boxOf(boss);
    expect(span.max.x - span.min.x).toBeGreaterThan(1.5);
    expect(boss.getObjectByName('wing-left')).toBeDefined();
    expect(boss.getObjectByName('wing-right')).toBeDefined();
    expect(boxOf(boss.getObjectByName('tail')!).getCenter(new Vector3()).z).toBeLessThan(0); // behind
    const girl = boxOf(capsuleFigure('yuna'));
    expect(span.max.x - span.min.x).toBeGreaterThan((girl.max.x - girl.min.x) * 4);
    const left = boxOf(boss.getObjectByName('wing-left')!).getCenter(new Vector3());
    const right = boxOf(boss.getObjectByName('wing-right')!).getCenter(new Vector3());
    expect([left.x < 0, right.x > 0]).toEqual([true, true]);
  });
});

describe('a rigid winged model (Bahamut): the wing flap and the rear', () => {
  /** A wings-out stand: a body 1.4 wide and the wingspan 10.96, 7 tall, centred, feet on 0. */
  function wingedScene(): Group {
    const g = new Group();
    const body = new Mesh(new BoxGeometry(1.4, 7, 1.4), new MeshStandardMaterial({ color: 0x6a3fa8 }));
    body.position.y = 3.5;
    const wings = new Mesh(new BoxGeometry(10.96, 0.3, 3), new MeshStandardMaterial({ color: 0xb05a2a }));
    wings.position.y = 5.5;
    g.add(body, wings);
    return g;
  }
  const cellsOf = (m: YrpModel) => (m as unknown as { flap: { cells: { uFlapTime: { value: number }; uFlapAmp: { value: number } }; halfSpan: number } }).flap;

  it('fits him by HEIGHT (so the wingspan comes out about 1.57 times it), whatever the file\'s units: 7 tall and 10.96 wide stands 5 tall and 7.8 across', () => {
    const boss = new YrpModel('bahamut', wingedScene(), [], 5);
    const box = boxOf(boss.root);
    expect(box.max.y - box.min.y).toBeCloseTo(5, 4);
    expect(box.max.x - box.min.x).toBeCloseTo((10.96 * 5) / 7, 3);
    expect(boss.widthOverHeight).toBeCloseTo(10.96 / 7, 3);
  });

  it('flaps only a rigid winged model: Bahamut\'s, with no idle clip; the girls and a rigged Bahamut do not', () => {
    expect(cellsOf(new YrpModel('bahamut', wingedScene(), [], 5))).toBeTruthy();
    expect(cellsOf(new YrpModel('yuna', wingedScene(), [], 1.9))).toBeNull();
    expect(new YrpModel('yuna', wingedScene(), [], 1.9).flapAmplitude).toBe(0);
    const track = new VectorKeyframeTrack('x.position', [0, 1], [0, 0, 0, 0, 0, 0]);
    expect(cellsOf(new YrpModel('bahamut', wingedScene(), [new AnimationClip('Idle', 1, [track])], 5))).toBeNull(); // rigged: the clips move the wings
  });

  it('beats the wings subtly at rest (3 percent of the half-span) and harder and faster when he acts (14 percent), and the clock stops when frozen', () => {
    const boss = new YrpModel('bahamut', wingedScene(), [], 5);
    const half = cellsOf(boss).halfSpan;
    expect(half).toBeCloseTo(5.48, 6);
    expect(boss.flapAmplitude).toBeCloseTo(0.03 * half, 9);
    boss.update(0.5);
    const restClock = cellsOf(boss).cells.uFlapTime.value;
    expect(restClock).toBeCloseTo(0.5 * 1.6, 9);
    expect(cellsOf(boss).cells.uFlapAmp.value).toBeCloseTo(0.03 * half, 9);
    boss.setActivity(1);
    expect(boss.flapAmplitude).toBeCloseTo(0.14 * half, 9);
    boss.update(0.5);
    expect(cellsOf(boss).cells.uFlapTime.value - restClock).toBeCloseTo(0.5 * (1.6 + 3.4), 9); // faster
    expect(cellsOf(boss).cells.uFlapAmp.value).toBeCloseTo(0.14 * half, 9);
    const held = cellsOf(boss).cells.uFlapTime.value;
    boss.update(1, true);
    expect(cellsOf(boss).cells.uFlapTime.value).toBe(held); // frozen (REDUCE MOTION, a body that is down)
    boss.setActivity(9);
    expect(boss.flapAmplitude).toBeCloseTo(0.14 * half, 9); // clamped to 0..1
    boss.setActivity(-2);
    expect(boss.flapAmplitude).toBeCloseTo(0.03 * half, 9);
  });

  it('rears back about his feet (the top toward the back) and swells a little, with the orb going with the chest; standing again undoes it', () => {
    const boss = new YrpModel('bahamut', wingedScene(), [], 5);
    const before = boxOf(boss.root);
    const orb = boss.root.getObjectByName('yrp-orb')!;
    boss.setOrb(1);
    orb.updateMatrixWorld(true);
    const orbRest = orb.getWorldPosition(new Vector3());
    boss.setRear(1);
    const after = boxOf(boss.root);
    expect(after.min.z).toBeLessThan(before.min.z - 0.3); // the top leans back (-z at yaw 0)
    expect(after.max.y).toBeLessThan(before.max.y * 1.12); // a tilt and a small swell, not a rise
    orb.updateMatrixWorld(true);
    expect(orb.getWorldPosition(new Vector3()).z).toBeLessThan(orbRest.z - 0.2); // the orb rears with the chest
    boss.setRear(0);
    const again = boxOf(boss.root);
    expect(again.min.z).toBeCloseTo(before.min.z, 6);
    boss.setRear(5); // clamped
    expect(boxOf(boss.root).min.z).toBeCloseTo(after.min.z, 6);
  });
});
