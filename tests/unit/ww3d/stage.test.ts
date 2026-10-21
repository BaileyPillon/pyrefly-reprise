/**
 * **The temple, the weapons and the swappable pieces** (`src/engine/ww3d/stage.ts`, `stageParts.ts`, `props.ts`, `swaps.ts`, `io.ts`; FFX-2 only), pinned in Node with blank textures and fake file IO: what the stage builds, that a file in the
 * props or temple folder replaces the stand-in of the same name and that a missing, broken or non-glTF file changes nothing, and how the weapons sit on the hand bones.
 */
import { Bone, Box3, BoxGeometry, DirectionalLight, Group, Mesh, MeshStandardMaterial, Object3D, Quaternion, Texture, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { FileCache, fetchGlb, type LoaderIO } from '../../../src/engine/ww3d/io.ts';
import { PROP_NAMES, TEMPLE_NAMES, swapUrl } from '../../../src/engine/ww3d/layout.ts';
import { PROP_SPECS, aimProps, attachProps, chooseProp, disposeProps, gripFrame, makeDagger, makePistol, makeSword } from '../../../src/engine/ww3d/props.ts';
import { STAGE, buildStage } from '../../../src/engine/ww3d/stage.ts';
import { polarPos } from '../../../src/engine/ww3d/stageParts.ts';
import type { StageTextures } from '../../../src/engine/ww3d/stageTextureSet.ts';
import { NO_SWAPS, loadSwaps, swapNames } from '../../../src/engine/ww3d/swaps.ts';
import { createToonUniforms } from '../../../src/engine/ww3d/toon.ts';

/** Blank textures: the structure of the stage can be built with no canvas. */
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

const GLB = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 12, 0, 0, 0]).buffer;

/** A glTF header followed by the url it was fetched from, so the fake parse knows which file it is (loads run concurrently). */
function withUrl(url: string): ArrayBuffer {
  const tail = new TextEncoder().encode(url);
  const out = new Uint8Array(12 + tail.length);
  out.set(new Uint8Array(GLB));
  out.set(tail, 12);
  return out.buffer;
}
const urlOf = (bytes: ArrayBuffer): string => new TextDecoder().decode(new Uint8Array(bytes, 12));

/** A piece of a given height standing on its origin. */
function piece(height: number, name = 'p'): Object3D {
  const g = new Group();
  g.name = name;
  const m = new Mesh(new BoxGeometry(1, height, 1), new MeshStandardMaterial({ color: 0x336699 }));
  m.position.y = height / 2;
  g.add(m);
  return g;
}

/** File IO over a table of urls: a url in `files` parses to its scene, one in `broken` fetches but does not parse, any other is not there. */
function fakeIO(files: Record<string, Object3D>, broken: string[] = []): LoaderIO & { fetched: string[] } {
  const fetched: string[] = [];
  return {
    fetched,
    async fetchBytes(url) {
      fetched.push(url);
      return url in files || broken.includes(url) ? withUrl(url) : null;
    },
    async parse() {
      throw new Error('overridden below');
    },
    async clone(scene) {
      return scene.clone(true);
    },
  };
}

function ioWith(files: Record<string, Object3D>, broken: string[] = []): LoaderIO & { fetched: string[] } {
  const io = fakeIO(files, broken);
  io.parse = async (bytes) => {
    const url = urlOf(bytes);
    if (broken.includes(url)) throw new Error('bad glTF');
    return { scene: files[url]!, animations: [] };
  };
  return io;
}

describe('the file cache and the swaps', () => {
  const base = '/';

  it('knows no swaps when no folder exists: every prop and every piece is procedural, and every name was asked for', async () => {
    const io = ioWith({});
    const swaps = await loadSwaps(new FileCache(io), base, 'models-exp/windwaker/props', 'models-exp/windwaker/temple');
    expect(swaps).toEqual(NO_SWAPS);
    expect(swapNames(swaps)).toEqual([]);
    expect(io.fetched.sort()).toEqual([...PROP_NAMES.map((n) => swapUrl(base, 'models-exp/windwaker/props', n)), ...TEMPLE_NAMES.map((n) => swapUrl(base, 'models-exp/windwaker/temple', n))].sort());
  });

  it('finds the files that exist and only those; a file that will not parse is a file that is not there, said once', async () => {
    const pistol = piece(0.2, 'pistol');
    const wall = piece(10, 'wall');
    const files = { [swapUrl(base, 'models-exp/windwaker/props', 'pistol')]: pistol, [swapUrl(base, 'models-exp/windwaker/temple', 'wall')]: wall };
    const warnings: string[] = [];
    const io = ioWith(files, [swapUrl(base, 'models-exp/windwaker/props', 'sword')]);
    const swaps = await loadSwaps(new FileCache(io, (m) => warnings.push(m)), base, 'models-exp/windwaker/props', 'models-exp/windwaker/temple');
    expect(swaps.props.pistol).toBe(pistol);
    expect(swaps.props.dagger).toBeUndefined();
    expect(swaps.props.sword).toBeUndefined();
    expect(swaps.temple.wall).toBe(wall);
    expect(swapNames(swaps).sort()).toEqual(['props/pistol', 'temple/wall']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/sword\.glb did not parse: bad glTF/);
  });

  it('parses a url once however many ask, and judges a body by its first bytes (a dev server\'s index page is not a model)', async () => {
    const io = ioWith({ '/a.glb': piece(1) });
    const cache = new FileCache(io);
    const [x, y] = await Promise.all([cache.get('/a.glb'), cache.get('/a.glb')]);
    expect(x).toBe(y);
    expect(io.fetched.filter((u) => u === '/a.glb')).toHaveLength(1);
    const html = (async () => new Response('<!doctype html><html></html>', { status: 200 })) as unknown as typeof fetch;
    expect(await fetchGlb('/missing.glb', html)).toBeNull();
    expect(await fetchGlb('/missing.glb', (async () => new Response('', { status: 404 })) as unknown as typeof fetch)).toBeNull();
    expect(await fetchGlb('/x', (async () => { throw new Error('network'); }) as unknown as typeof fetch)).toBeNull();
    expect(await fetchGlb('/ok.glb', (async () => new Response(GLB, { status: 200 })) as unknown as typeof fetch)).not.toBeNull();
  });
});

describe('the weapons', () => {
  const u = createToonUniforms();

  it('picks the file\'s clone when there is one (toon, at scale 1) and the procedural prop when there is not', () => {
    const file = piece(0.2, 'pistol');
    const swapped = chooseProp('pistol', u, { pistol: file });
    expect(swapped.swapped).toBe(true);
    expect(swapped.object).not.toBe(file); // a clone: the file's scene is shared
    expect(swapped.object.name).toBe('prop:pistol');
    swapped.object.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) expect((m.material as unknown as { userData: { ww: string } }).userData.ww).toBe('toon');
    });
    for (const name of PROP_NAMES) {
      const plain = chooseProp(name, u, undefined);
      expect(plain.swapped).toBe(false);
      expect(plain.object.name).toBe(`prop:${name}`);
      expect(chooseProp(name, u, { sword: file, dagger: file, pistol: file, [name]: undefined }).swapped).toBe(false);
    }
    expect(makePistol(u).children.length).toBeGreaterThan(4);
    expect(makeDagger(u).children.length).toBeGreaterThan(2);
    expect(makeSword(u).getObjectByName('blade')).toBeDefined();
  });

  /** A skeleton with the two arms the grip frame reads, at rest: the forearm hangs along -y with the hand below it. */
  function arms(): Group {
    const root = new Group();
    const hips = new Bone();
    hips.name = 'Hips';
    root.add(hips);
    for (const [side, x] of [['Left', 0.3], ['Right', -0.3]] as const) {
      const shoulder = new Bone();
      shoulder.name = `${side}Shoulder`;
      shoulder.position.set(x, 1.0, 0);
      hips.add(shoulder);
      const fore = new Bone();
      fore.name = `${side}ForeArm`;
      fore.position.set(0, -0.3, 0);
      shoulder.add(fore);
      const hand = new Bone();
      hand.name = `${side}Hand`;
      hand.position.set(0, -0.3, 0);
      fore.add(hand);
    }
    root.updateMatrixWorld(true);
    return root;
  }

  it('has Yuna two pistols, Rikku two daggers and Paine one sword, on the hands the lab put them on', () => {
    expect(PROP_SPECS.yuna.map((s) => [s.hand, s.name])).toEqual([['LeftHand', 'pistol'], ['RightHand', 'pistol']]);
    expect(PROP_SPECS.rikku.map((s) => [s.hand, s.name])).toEqual([['LeftHand', 'dagger'], ['RightHand', 'dagger']]);
    expect(PROP_SPECS.paine.map((s) => [s.hand, s.name])).toEqual([['RightHand', 'sword']]);
  });

  it('parents the props to the hand bones with the grip frame: +Z along the forearm, so they follow every clip', () => {
    const model = arms();
    const f = gripFrame(model, 'RightHand')!;
    expect(f.hand.name).toBe('RightHand');
    const att = attachProps(model, 'yuna', u);
    expect(att.props).toHaveLength(2);
    expect(att.swapped).toBe(0);
    expect(att.props.map((p) => p.parent?.name)).toEqual(['LeftHand', 'RightHand']);
    model.updateMatrixWorld(true);
    for (const p of att.props) {
      const fwd = new Vector3(0, 0, 1).applyQuaternion(p.getWorldQuaternion(new Quaternion()));
      expect(fwd.y).toBeCloseTo(-1, 5); // along the forearm, pointing away from the body (down the arm at rest)
      expect(p.scale.x).toBeCloseTo(0.62, 6);
    }
    expect(gripFrame(model, 'MissingHand')).toBeNull();
    expect(attachProps(model, 'nobody', u).props).toHaveLength(0);
    expect(attachProps(new Group(), 'paine', u).props).toHaveLength(0); // a model without the bones holds nothing
    disposeProps(att);
    expect(att.props.every((p) => p.parent === null)).toBe(true);
  });

  it('uses a swapped file at scale 1 and counts it', () => {
    const model = arms();
    const att = attachProps(model, 'paine', u, { sword: piece(0.9, 'sword') });
    expect(att.swapped).toBe(1);
    expect(att.props[0]!.scale.x).toBe(1);
    expect(new Box3().setFromObject(att.props[0]!).getSize(new Vector3()).y).toBeGreaterThan(0.5);
  });

  it('aims a weapon toward the target at its elevation, bending no further from the forearm than the spec allows', () => {
    const model = arms();
    const att = attachProps(model, 'paine', u);
    const target = new Vector3(4, 2.2, -3.3);
    aimProps(model, att.props, target);
    model.updateMatrixWorld(true);
    const sword = att.props[0]!;
    const aimed = sword.userData['aimed'] as { angle: number; applied: number };
    expect(aimed.applied).toBeLessThanOrEqual(PROP_SPECS.paine[0]!.aim.turn + 1e-6);
    expect(aimed.applied).toBeLessThanOrEqual(aimed.angle + 1e-6);
    expect(aimed.applied).toBeGreaterThan(10); // it moved: at rest the forearm points down
    const fwd = new Vector3(0, 0, 1).applyQuaternion(sword.getWorldQuaternion(new Quaternion()));
    expect(fwd.y).toBeGreaterThan(-1 + 0.05);
  });
});

describe('the temple', () => {
  const u = createToonUniforms();
  const meshesOf = (g: Object3D): number => {
    let n = 0;
    g.traverse((o) => {
      if ((o as Mesh).isMesh) n++;
    });
    return n;
  };

  it('builds the chamber from procedural parts: a floor that takes the sun\'s shadow, the wall, five flames, the roof, the hidden occluder, the sky and the clouds', () => {
    const built = buildStage(u, { textures: blank });
    expect(built.used.size).toBe(0);
    expect(built.flames).toHaveLength(5);
    expect(built.clouds).toHaveLength(12);
    expect(built.group.getObjectByName('sun-occluder')).toBe(built.occluder);
    expect((built.occluder.material as { colorWrite: boolean }).colorWrite).toBe(false);
    expect(built.occluder.castShadow).toBe(true);
    const receivers: Mesh[] = [];
    built.group.traverse((o) => {
      if ((o as Mesh).isMesh && (o as Mesh).receiveShadow) receivers.push(o as Mesh);
    });
    expect(receivers).toHaveLength(1); // only the floor receives the sun's shadow: TARGET-C's wall is lit
    expect(built.group.children.filter((c) => c.name === 'ww-sun')).toHaveLength(1);
    built.dispose();
  });

  it('lights it with one warm sun, a 4096 px shadow over a frustum that covers the arena (2048 on a weak GPU), and a soft fill', () => {
    const high = buildStage(u, { textures: blank });
    expect(high.sun).toBeInstanceOf(DirectionalLight);
    expect(high.sun.castShadow).toBe(true);
    expect(high.sun.shadow.mapSize.x).toBe(STAGE.shadow.size.high);
    expect(STAGE.shadow.size.high).toBe(4096);
    expect(high.sun.shadow.camera.right).toBeGreaterThanOrEqual(STAGE.R + 2); // the whole arena floor is inside
    expect(high.sun.intensity).toBe(0.8);
    expect(high.fill.intensity).toBeCloseTo(0.42, 10);
    const low = buildStage(u, { textures: blank, quality: 'low' });
    expect(low.sun.shadow.mapSize.x).toBe(2048);
    high.dispose();
    low.dispose();
  });

  it('puts the door behind Paine and Valefor, and the parts by azimuth: 0 the far wall, positive toward the right of the frame', () => {
    const p = polarPos(90, 12, 3);
    expect(p.x).toBeCloseTo(12, 10);
    expect(p.z).toBeCloseTo(0, 10);
    expect(polarPos(0, 12, 0).z).toBeCloseTo(-12, 10);
    expect(polarPos(-90, 12, 0).x).toBeCloseTo(-12, 10);
    expect(STAGE.doorAz).toBeGreaterThan(0);
  });

  it('uses a swapped pillar, door, brazier and wall in place of the stand-ins, scaled and turned to the centre, and says which', () => {
    const procedural = buildStage(u, { textures: blank });
    const everything = {
      wall: piece(5, 'wall'),
      door: piece(6.9, 'door'),
      brazier: piece(1.7, 'brazier'),
      pillar: piece(4, 'pillar'),
    };
    const swapped = buildStage(u, { textures: blank, swaps: everything });
    expect([...swapped.used].sort()).toEqual(['brazier', 'door', 'pillar', 'wall']);
    expect(meshesOf(swapped.group)).toBeLessThan(meshesOf(procedural.group));
    // a swapped wall replaces the wall and its cornice, its relief panels and its procedural pilasters; the swapped pillar is still placed
    const pieces = swapped.group.children.filter((c) => c.name.startsWith('temple:'));
    expect(pieces.filter((c) => c.name === 'temple:wall')).toHaveLength(1);
    expect(pieces.filter((c) => c.name === 'temple:pillar')).toHaveLength(6);
    expect(pieces.filter((c) => c.name === 'temple:brazier')).toHaveLength(3); // one per floor torch
    expect(pieces.filter((c) => c.name === 'temple:door')).toHaveLength(1);
    // the wall file is scaled to the stage's height, standing on the floor
    const wall = pieces.find((c) => c.name === 'temple:wall')!;
    expect(new Box3().setFromObject(wall).getSize(new Vector3()).y).toBeCloseTo(STAGE.H, 5);
    // a floor torch's flame sits on top of the brazier file
    expect(swapped.flames[0]!.base.y).toBeCloseTo(1.7 + 0.1, 5);
    expect(procedural.flames[0]!.base.y).toBe(2.15);
    procedural.dispose();
    swapped.dispose();
  });

  it('swaps one piece at a time and leaves the rest procedural: a pillar alone replaces the six pilasters and their caps, not the door', () => {
    const procedural = buildStage(u, { textures: blank });
    const onlyPillar = buildStage(u, { textures: blank, swaps: { pillar: piece(3, 'pillar') } });
    expect([...onlyPillar.used]).toEqual(['pillar']);
    expect(onlyPillar.group.children.filter((c) => c.name === 'temple:pillar')).toHaveLength(6);
    expect(meshesOf(onlyPillar.group)).toBeLessThan(meshesOf(procedural.group));
    const onlyDoor = buildStage(u, { textures: blank, swaps: { door: piece(7) } });
    expect([...onlyDoor.used]).toEqual(['door']);
    procedural.dispose();
    onlyPillar.dispose();
    onlyDoor.dispose();
  });

  it('moves the flames, the clouds and the waterfalls with time and leaves the geometry alone', () => {
    const built = buildStage(u, { textures: blank });
    const f0 = built.flames[0]!.sprite.scale.y;
    const c0 = built.clouds[0]!.sprite.position.clone();
    built.update(1.37);
    expect(built.flames[0]!.sprite.scale.y).not.toBe(f0);
    expect(built.clouds[0]!.sprite.position.distanceTo(c0)).toBeGreaterThan(0);
    built.dispose();
  });
});
