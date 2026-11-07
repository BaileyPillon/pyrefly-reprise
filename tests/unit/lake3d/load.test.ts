/**
 * Loading the lake's models (`src/engine/lake3d/load.ts`, `model.ts`, `weapons.ts`, `capsule.ts`; FFX only): with a fake file reader, no GPU and no files. A missing file is a neutral capsule, the weapons hang from the nodes
 * the table names (scaled out of the rig's centimetres), the eager ids load before the call returns and the bench after it, and disposing frees what was made.
 */
import { AnimationClip, BoxGeometry, Bone, Group, Mesh, MeshStandardMaterial, Object3D, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';
import { LAKE_CAST, LAKE_FILES, LAKE_NATIVE_HEIGHT, LAKE_SHIPPED_FILES, LAKE_WEAPONS, LAKE_WEAPON_FILES, type LakeId } from '../../../src/data/ffx/lake-models.ts';
import { EAGER, loadLakeModels, modelUrl, weaponUrl, type LoaderIO, type Parsed } from '../../../src/engine/lake3d/load.ts';
import { weaponNamesFor } from '../../../src/engine/lake3d/weapons.ts';

/** A mesh that says it is skinned (a clone keeps the flag, because it is the class's own). */
class FakeSkinned extends Mesh {
  readonly isSkinnedMesh = true;
  /** Each clone has a skeleton of its own, as the real clones do; `dispose` counts the frees. */
  readonly skeleton = { freed: 0, dispose(): void { this.freed++; } };
}

/** A body like the real files': an `Armature` scaled 0.01 (centimetres) with a Hips bone, the hands and the two hook nodes, and a box as tall as the figure. */
function fakeBody(id: string): Parsed {
  const height = LAKE_NATIVE_HEIGHT[id as LakeId] ?? 1.7;
  const scene = new Group();
  const armature = new Object3D();
  armature.name = 'Armature';
  armature.scale.setScalar(0.01);
  const hips = new Bone();
  hips.name = 'Hips';
  const right = new Bone();
  right.name = 'RightHand';
  const left = new Bone();
  left.name = 'LeftHand';
  const hookR = new Object3D();
  hookR.name = 'Hook_R';
  const hookL = new Object3D();
  hookL.name = 'Hook_L';
  right.add(hookR);
  left.add(hookL);
  hips.add(right, left);
  armature.add(hips);
  scene.add(armature);
  const body = new FakeSkinned(new BoxGeometry(0.5, height, 0.3).translate(0, height / 2, 0), new MeshStandardMaterial());
  scene.add(body);
  const clip = (name: string): AnimationClip => new AnimationClip(name, 1, [new VectorKeyframeTrack('Hips.position', [0, 1], [0, 0, 0, 0, 0.01, 0])]);
  const names = ['idle1', 'idle2', 'dmg1', 'dead_00', 'dead_01', 'dead_02', 'attack1_00', 'attack1_01', 'attack1_02', 'attack1_03', 'magic2_00', 'magic2_01', 'magic2_02', 'win_00', 'win_01', 'idle', 'attack', 'cast', 'hurt', 'ko'];
  return { scene, animations: names.map(clip) };
}

function fakeWeapon(): Parsed {
  const scene = new Group();
  scene.add(new Mesh(new BoxGeometry(0.05, 1, 0.05), new MeshStandardMaterial()));
  return { scene, animations: [] };
}

/** An IO whose "bytes" are the url, so `parse` can tell which file it was given; `have` says which urls exist. */
function fakeIO(have: (url: string) => boolean, log: string[] = []): LoaderIO {
  const dec = new TextDecoder();
  return {
    fetchBytes: async (url) => {
      log.push(url);
      return have(url) ? new TextEncoder().encode(url).buffer : null;
    },
    parse: async (bytes) => {
      const url = dec.decode(bytes);
      return url.includes('/weapons/') ? fakeWeapon() : fakeBody(url.split('/').pop()!.replace('.glb', ''));
    },
    clone: async (scene) => scene.clone(true),
  };
}

const BASE = '/';

describe('the model set', () => {
  it('names a file for every combatant and a weapon file for every weapon a row uses', () => {
    for (const id of LAKE_CAST) expect(LAKE_FILES[id], id).toMatch(/\.glb$/);
    for (const rows of Object.values(LAKE_WEAPONS)) for (const r of rows!) expect(LAKE_WEAPON_FILES, r.weapon).toContain(r.weapon);
    expect(LAKE_SHIPPED_FILES).toHaveLength(10 + 9 + 5);
    expect(new Set(LAKE_SHIPPED_FILES).size).toBe(LAKE_SHIPPED_FILES.length);
  });

  it('stands the Wendigo and the Guardian at the size table\'s multiples of Tidus', () => {
    expect(LAKE_NATIVE_HEIGHT.wendigo / LAKE_NATIVE_HEIGHT.tidus).toBeCloseTo(1.55, 2);
    expect(LAKE_NATIVE_HEIGHT['lake-guardian-a'] / LAKE_NATIVE_HEIGHT.tidus).toBeCloseTo(1.08, 2);
  });

  it('gives the left-hand claws a mirror and Rikku two hooks', () => {
    expect(LAKE_WEAPONS['lake-guardian-a']!.map((r) => r.mirrorX)).toEqual([false, true]);
    expect(LAKE_WEAPONS.rikku!.map((r) => r.node)).toEqual(['Hook_R', 'Hook_L']);
    expect(weaponNamesFor('auron').sort()).toEqual(['jug', 'katana']);
  });
});

describe('loadLakeModels', () => {
  it('stands every figure on a neutral capsule when no file is there, and says so once each', async () => {
    const said: string[] = [];
    const lake = await loadLakeModels({ base: BASE, heights: {}, io: fakeIO(() => false), warn: (m) => said.push(m) });
    await lake.background;
    expect(lake.models.size).toBe(10);
    expect(lake.capsules.sort()).toEqual([...LAKE_CAST].sort());
    for (const id of LAKE_CAST) expect(lake.sources.get(id)).toBe('capsule');
    expect(said.filter((m) => /capsule/.test(m))).toHaveLength(10);
    for (const m of lake.models.values()) {
      expect(m.animated).toBe(false);
      expect(m.height).toBeCloseTo(LAKE_NATIVE_HEIGHT[m.id], 1);
    }
    lake.dispose();
    expect(lake.models.size).toBe(0);
  });

  it('loads the front line and the enemies before it returns and the bench after', async () => {
    const lake = await loadLakeModels({ base: BASE, heights: {}, io: fakeIO(() => true) });
    expect([...lake.models.keys()].sort()).toEqual([...EAGER].sort());
    await lake.background;
    expect(lake.models.size).toBe(10);
    expect(lake.capsules).toEqual([]);
    lake.dispose();
  });

  it('reads the files by their urls under the base, the weapons first', async () => {
    const urls: string[] = [];
    const lake = await loadLakeModels({ base: '/x/', heights: {}, io: fakeIO(() => true, urls) });
    await lake.background;
    expect(urls).toContain(modelUrl('/x/', 'tidus'));
    expect(urls).toContain('/x/models-exp/lake/guardianb.glb');
    expect(urls).toContain(weaponUrl('/x/', 'brotherhood'));
    expect(urls.indexOf(weaponUrl('/x/', 'claw'))).toBeLessThan(urls.indexOf(modelUrl('/x/', 'tidus')));
    expect(new Set(urls).size).toBe(urls.length); // each file once, however many figures wear it
    lake.dispose();
  });

  it('hangs each weapon from the node its row names, in metres (the bone\'s centimetre scale divided out)', async () => {
    const lake = await loadLakeModels({ base: BASE, heights: {}, io: fakeIO(() => true) });
    await lake.background;
    const tidus = lake.models.get('tidus')!;
    expect(tidus.weaponCount).toBe(1);
    const pivot = tidus.root.getObjectByName('lake-weapon-brotherhood')!;
    expect(pivot.parent!.name).toBe('Hook_R');
    expect(pivot.scale.x).toBeCloseTo(100, 3); // 1 / 0.01
    expect(lake.models.get('rikku')!.weaponCount).toBe(2);
    expect(lake.models.get('auron')!.weaponCount).toBe(2);
    expect(lake.models.get('yuna')!.weaponCount).toBe(1);
    const claw = lake.models.get('lake-guardian-a')!.root.getObjectsByProperty('name', 'lake-weapon-gclaw');
    expect(claw).toHaveLength(2);
    expect(claw.map((c) => c.scale.x < 0)).toEqual([false, true]);
    lake.dispose();
  });

  it('gives each weapon materials of its own, so a tint on one figure never reaches another\'s', async () => {
    const lake = await loadLakeModels({ base: BASE, heights: {}, io: fakeIO(() => true) });
    await lake.background;
    const mats = (id: LakeId): Set<unknown> => {
      const out = new Set<unknown>();
      lake.models.get(id)!.root.traverse((o) => {
        if ((o as Mesh).isMesh) out.add((o as Mesh).material);
      });
      return out;
    };
    const a = mats('lake-guardian-a');
    const b = mats('lake-guardian-b');
    for (const m of a) expect(b.has(m)).toBe(false);
    lake.dispose();
  });

  it('measures each model\'s height off its body and fits it to the stage\'s height only when that is near', async () => {
    const lake = await loadLakeModels({ base: BASE, heights: { tidus: 1.8 }, io: fakeIO(() => true) });
    const tidus = lake.models.get('tidus')!;
    expect(tidus.nativeHeight).toBeCloseTo(1.75, 2);
    expect(tidus.height).toBe(1.8); // within a quarter of the native
    tidus.fitTo(5);
    expect(tidus.height).toBe(1.75); // far off: the native size
    tidus.fitTo(1.7);
    expect(tidus.height).toBe(1.7);
    lake.dispose();
  });

  it('gives the party the real kit\'s rig and the monsters the library\'s', async () => {
    const lake = await loadLakeModels({ base: BASE, heights: {}, io: fakeIO(() => true) });
    await lake.background;
    expect(lake.models.get('tidus')!.playing).toBe('idle');
    expect(lake.models.get('tidus')!.playingClip).toBe('idle1');
    expect(lake.models.get('wendigo')!.monsterRig).not.toBeNull();
    expect(lake.models.get('wendigo')!.playingClip).toBe('idle');
    expect(lake.models.get('tidus')!.monsterRig).toBeNull();
    lake.dispose();
  });

  it('plays the party\'s attack from the beat and settles back to the idle', async () => {
    const lake = await loadLakeModels({ base: BASE, heights: {}, io: fakeIO(() => true) });
    const tidus = lake.models.get('tidus')!;
    tidus.noteOpen('attack', 0.3, 1);
    expect(tidus.playing).toBe('attack');
    tidus.noteImpact();
    for (let i = 0; i < 120; i++) tidus.update(0.05);
    expect(tidus.playing).toBe('idle');
    lake.dispose();
  });

  it('frees the skeleton of every model (the bone texture of its first draw) when it is disposed, once, and each clone has its own', async () => {
    const lake = await loadLakeModels({ base: BASE, heights: {}, io: fakeIO(() => true) });
    await lake.background;
    const skeletons: Array<{ freed: number }> = [];
    for (const m of lake.models.values()) m.root.traverse((o) => { if (o instanceof FakeSkinned) skeletons.push(o.skeleton); });
    expect(skeletons).toHaveLength(10);
    expect(new Set(skeletons).size).toBe(10);
    lake.dispose();
    for (const sk of skeletons) expect(sk.freed).toBe(1);
  });

  it('does not load what it is told to skip, and survives a file that cannot be parsed', async () => {
    const said: string[] = [];
    const io = fakeIO(() => true);
    const broken: LoaderIO = { ...io, parse: async (bytes) => { if (new TextDecoder().decode(bytes).includes('yuna')) throw new Error('bad glTF'); return io.parse(bytes); } };
    const lake = await loadLakeModels({ base: BASE, heights: {}, io: broken, warn: (m) => said.push(m), skip: ['wakka', 'auron', 'lulu', 'kimahri'] });
    await lake.background;
    expect(lake.models.size).toBe(6);
    expect(lake.sources.get('yuna')).toBe('capsule');
    expect(said.some((m) => /yuna.*could not be read/.test(m))).toBe(true);
    lake.dispose();
  });
});
