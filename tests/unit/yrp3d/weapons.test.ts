/**
 * **The girls' real FFX-2 weapons** (`src/engine/yrp3d/weapons.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only), with made-up scenes (no file, no network). What it pins, from `yrp-weapons/weapons.json`
 * (the data read from the game's `job.bin` and `.chr` hand bones):
 *
 * 1. **The mapping**: Yuna `yuna-gunner-pistol.glb` in both hands on `SkeletonNode_39` (left) and `_67` (right); Rikku `rikku-thief-dagger.glb` on `_140` (left) and `_66` (right); Paine `paine-warrior-sword.glb` in the right
 *    hand on `_101`; Bahamut none.
 * 2. **The attach**: each weapon's scene root goes under its locator with the local rotation quaternion `[1, 0, 0, 0]`, translation 0 and scale 1, the same for either hand; one scene per hand; and when a locator is missing
 *    (Yuna's plain file has none) or there are too few scenes, nothing is attached and the figure keeps the procedural props.
 * 3. **Through the model**: the real weapons ride the locator (so they follow the clips), do not change the figure's fit, and replace the procedural props; without them the props stay.
 * 4. **Through the loader**: a weapon file is read from the first folder that has it, cloned once per hand, and the figure's source says `real`; a missing weapon file leaves the figure on its props, and Bahamut never asks.
 */
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D, Quaternion } from 'three';
import { describe, expect, it } from 'vitest';

import { YRP_MODEL_DIRS } from '../../../src/data/yrp-ids.ts';
import { PARTY_HEIGHT, fileUrl, type YrpId } from '../../../src/engine/yrp3d/layout.ts';
import { loadYrpModels, type LoaderIO, type Parsed } from '../../../src/engine/yrp3d/load.ts';
import { YrpModel } from '../../../src/engine/yrp3d/model.ts';
import { WEAPON_KITS, WEAPON_TO_LOCATOR, attachWeapons, missingLocators, weaponCount, weaponUrl } from '../../../src/engine/yrp3d/weapons.ts';

/** A figure 2.3 tall with a body and the named locator nodes under an arm node (the way the real skeletons hang them under the hand bones). */
function figure(locators: readonly string[]): Group {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(1, 2.3, 0.6), new MeshStandardMaterial({ color: 0x8899aa }));
  body.name = 'body';
  body.position.y = 1.15;
  const hand = new Object3D();
  hand.name = 'SkeletonNode_hand';
  hand.position.set(0.8, 1.2, 0);
  for (const name of locators) {
    const loc = new Object3D();
    loc.name = name;
    hand.add(loc);
  }
  g.add(body, hand);
  g.updateMatrixWorld(true);
  return g;
}

/** A weapon file's scene: a group with one long thin mesh. */
function weaponScene(): Group {
  const g = new Group();
  g.name = 'Scene';
  g.add(new Mesh(new BoxGeometry(0.1, 0.1, 1.2), new MeshStandardMaterial({ color: 0xcccccc })));
  return g;
}

const ALL = ['SkeletonNode_39', 'SkeletonNode_67', 'SkeletonNode_140', 'SkeletonNode_66', 'SkeletonNode_101'];

describe("the girls' weapon kits", () => {
  it('are the data of weapons.json: the files, the hands and the locator of each', () => {
    expect(WEAPON_KITS['yuna']).toEqual({ file: 'yuna-gunner-pistol.glb', hands: [{ side: 'left', locator: 'SkeletonNode_39' }, { side: 'right', locator: 'SkeletonNode_67' }] });
    expect(WEAPON_KITS['rikku']).toEqual({ file: 'rikku-thief-dagger.glb', hands: [{ side: 'left', locator: 'SkeletonNode_140' }, { side: 'right', locator: 'SkeletonNode_66' }] });
    expect(WEAPON_KITS['paine']).toEqual({ file: 'paine-warrior-sword.glb', hands: [{ side: 'right', locator: 'SkeletonNode_101' }] });
    expect(WEAPON_KITS['bahamut']).toBeUndefined();
  });

  it('count one scene per hand (Yuna and Rikku two, Paine one, Bahamut none) and name their file in a models folder', () => {
    expect((['yuna', 'rikku', 'paine', 'bahamut'] as YrpId[]).map(weaponCount)).toEqual([2, 2, 1, 0]);
    expect(weaponUrl('/', 'models-exp/yrp', 'yuna')).toBe('/models-exp/yrp/yuna-gunner-pistol.glb');
    expect(weaponUrl('/base/', 'models-exp/yrp-hd', 'paine')).toBe('/base/models-exp/yrp-hd/paine-warrior-sword.glb');
    expect(weaponUrl('/', 'models-exp/yrp', 'bahamut')).toBeNull();
    expect(fileUrl('/', 'models-exp/yrp', WEAPON_KITS['rikku']!.file)).toBe(weaponUrl('/', 'models-exp/yrp', 'rikku'));
  });

  it('are held in the order left, right for the pair, and the weapon-to-locator numbers are a half turn about X, no offset, scale 1', () => {
    expect(WEAPON_KITS['yuna']!.hands.map((h) => h.side)).toEqual(['left', 'right']);
    expect(WEAPON_KITS['rikku']!.hands.map((h) => h.side)).toEqual(['left', 'right']);
    expect(WEAPON_TO_LOCATOR).toEqual({ quaternion: [1, 0, 0, 0], translation: [0, 0, 0], scale: 1 });
  });
});

describe('attaching the weapons', () => {
  it('parents each scene under its locator with the quaternion [1, 0, 0, 0], translation 0 and scale 1, the same for either hand', () => {
    for (const id of ['yuna', 'rikku', 'paine'] as const) {
      const root = figure(ALL);
      const scenes = Array.from({ length: weaponCount(id) }, weaponScene);
      const got = attachWeapons(id, root, scenes);
      expect(got, id).not.toBeNull();
      WEAPON_KITS[id]!.hands.forEach((hand, i) => {
        const loc = root.getObjectByName(hand.locator)!;
        expect(scenes[i]!.parent, `${id} ${hand.side}`).toBe(loc);
        expect(scenes[i]!.quaternion.equals(new Quaternion(1, 0, 0, 0)), `${id} ${hand.side} rotation`).toBe(true);
        expect(scenes[i]!.position.toArray(), `${id} ${hand.side} translation`).toEqual([0, 0, 0]);
        expect(scenes[i]!.scale.toArray(), `${id} ${hand.side} scale`).toEqual([1, 1, 1]);
        expect(scenes[i]!.name).toBe(`weapon-${id}-${hand.side}`);
      });
      expect(got!.weapons.map((w) => w.side)).toEqual(WEAPON_KITS[id]!.hands.map((h) => h.side));
    }
  });

  it('puts the two pistols and the two daggers on different locators (a scene has one parent)', () => {
    const root = figure(ALL);
    const [l, r] = [weaponScene(), weaponScene()];
    attachWeapons('yuna', root, [l, r]);
    expect(l.parent!.name).toBe('SkeletonNode_39');
    expect(r.parent!.name).toBe('SkeletonNode_67');
    expect(l).not.toBe(r);
  });

  it('attaches nothing, and says so with null, when a locator is missing: Yuna\'s plain file has none of hers', () => {
    const root = figure(['SkeletonNode_140', 'SkeletonNode_66', 'SkeletonNode_101']); // the girls' other locators, none of Yuna's
    const scenes = [weaponScene(), weaponScene()];
    expect(missingLocators('yuna', root)).toEqual(['SkeletonNode_39', 'SkeletonNode_67']);
    expect(attachWeapons('yuna', root, scenes)).toBeNull();
    expect(scenes.every((s) => s.parent === null)).toBe(true);
    const half = figure(['SkeletonNode_39']); // one of two is not enough either
    expect(attachWeapons('yuna', half, [weaponScene(), weaponScene()])).toBeNull();
    expect(half.getObjectByName('SkeletonNode_39')!.children).toHaveLength(0);
  });

  it('attaches nothing with too few scenes, nothing for Bahamut, and takes the weapons off again on dispose', () => {
    const root = figure(ALL);
    expect(attachWeapons('rikku', root, [weaponScene()])).toBeNull();
    expect(attachWeapons('bahamut', root, [weaponScene()])).toBeNull();
    const scenes = [weaponScene()];
    const got = attachWeapons('paine', root, scenes)!;
    expect(scenes[0]!.parent).not.toBeNull();
    got.dispose();
    expect(scenes[0]!.parent).toBeNull();
  });
});

describe('the weapons through the model', () => {
  it('hang on the locator (so the clips carry them), leave the figure\'s fit alone, and replace the procedural props', () => {
    const plain = new YrpModel('paine', figure(ALL), [], PARTY_HEIGHT);
    const scenes = [weaponScene()];
    const armed = new YrpModel('paine', figure(ALL), [], PARTY_HEIGHT, 'own', { weapons: scenes });
    expect(armed.weaponKind).toBe('real');
    expect(scenes[0]!.parent!.name).toBe('SkeletonNode_101');
    expect(armed.height).toBeCloseTo(plain.height, 6);
    expect(armed.trueHeight).toBeCloseTo(plain.trueHeight, 6);
    let props = 0;
    armed.root.traverse((o) => o.name.startsWith('prop-') && props++);
    expect(props).toBe(0);
    armed.dispose();
    expect(scenes[0]!.parent).toBeNull();
  });

  it('keep the procedural props when the weapon scenes are not given or a locator is missing', () => {
    const none = new YrpModel('paine', figure(ALL), [], PARTY_HEIGHT);
    expect(none.weaponKind).not.toBe('real');
    const scenes = [weaponScene()];
    const noLocator = new YrpModel('paine', figure(['SkeletonNode_39']), [], PARTY_HEIGHT, 'own', { weapons: scenes });
    expect(noLocator.weaponKind).not.toBe('real');
    expect(scenes[0]!.parent).toBeNull();
    expect(new YrpModel('bahamut', figure(ALL), [], 5, 'own', { weapons: [weaponScene()] }).weaponKind).toBe('none');
  });
});

describe('the weapons through the loader', () => {
  const HD = YRP_MODEL_DIRS.hd;
  const BASE = YRP_MODEL_DIRS.base;
  const url = (dir: string, file: string): string => fileUrl('/', dir, file);

  /** An IO over `files` (url -> a scene maker): the bytes say "glTF" and an index, `parse` builds the scene the index names. */
  function io(files: Record<string, () => Group>): { io: LoaderIO; fetched: string[] } {
    const makers: Array<() => Group> = [];
    const fetched: string[] = [];
    const out: LoaderIO = {
      async fetchBytes(u) {
        fetched.push(u);
        const make = files[u];
        if (!make) return null;
        makers.push(make);
        const b = new Uint8Array(32);
        b.set([0x67, 0x6c, 0x54, 0x46], 0);
        b[8] = makers.length - 1;
        return b.buffer;
      },
      async fetchJson() {
        return null;
      },
      async parse(bytes): Promise<Parsed> {
        return { scene: makers[new Uint8Array(bytes)[8]!]!(), animations: [] };
      },
      async clone(scene) {
        return scene.clone(true);
      },
    };
    return { io: out, fetched };
  }

  const HEIGHTS = { yuna: 1.9, rikku: 1.9, paine: 1.9, bahamut: 5 };

  it('reads a weapon file from the first folder that has it, clones it once per hand, and says `real` for a figure that has its locators', async () => {
    const t = io({
      [url(HD, 'yuna.glb')]: () => figure(['SkeletonNode_39', 'SkeletonNode_67']),
      [url(BASE, 'yuna-gunner-pistol.glb')]: weaponScene,
      [url(HD, 'rikku.glb')]: () => figure(['SkeletonNode_140', 'SkeletonNode_66']),
      [url(HD, 'rikku-thief-dagger.glb')]: weaponScene,
      [url(HD, 'paine.glb')]: () => figure(['SkeletonNode_101']),
    });
    const models = await loadYrpModels({ base: '/', dirs: [HD, BASE], heights: HEIGHTS, io: t.io });
    expect(models.sources['yuna']).toMatchObject({ weapons: 'real' });
    expect(models.sources['rikku']).toMatchObject({ weapons: 'real' });
    expect(models.sources['paine']!.weapons).not.toBe('real'); // no weapon file for Paine on disk: her procedural props (or nothing, on this made-up skeleton)
    expect(models.sources['bahamut']!.weapons).toBeUndefined();
    const yuna = models.models.get('yuna')!;
    const weapons: Object3D[] = [];
    yuna.root.traverse((o) => o.name.startsWith('weapon-yuna-') && weapons.push(o));
    expect(weapons.map((w) => [w.name, w.parent!.name])).toEqual([
      ['weapon-yuna-left', 'SkeletonNode_39'],
      ['weapon-yuna-right', 'SkeletonNode_67'],
    ]);
    expect(t.fetched).toContain(url(HD, 'yuna-gunner-pistol.glb')); // looked for in the HD folder first
    expect(t.fetched).toContain(url(BASE, 'yuna-gunner-pistol.glb'));
    expect(t.fetched.some((u) => u.includes('bahamut') && u.includes('gunner'))).toBe(false);
    models.dispose();
  });

  it('leaves a girl on her procedural props when her weapon file is missing, and when her skeleton has none of the locators', async () => {
    const t = io({
      [url(HD, 'yuna.glb')]: () => figure([]), // Yuna's plain file: no locators
      [url(HD, 'yuna-gunner-pistol.glb')]: weaponScene,
      [url(HD, 'rikku.glb')]: () => figure(['SkeletonNode_140', 'SkeletonNode_66']), // locators, but no dagger file
      [url(HD, 'paine.glb')]: () => figure(['SkeletonNode_101']),
    });
    const models = await loadYrpModels({ base: '/', dirs: [HD, BASE], heights: HEIGHTS, io: t.io });
    for (const id of ['yuna', 'rikku', 'paine'] as const) expect(models.sources[id]!.weapons, id).not.toBe('real');
    let weapons = 0;
    for (const m of models.models.values()) m.root.traverse((o) => o.name.startsWith('weapon-') && weapons++);
    expect(weapons).toBe(0);
    models.dispose();
  });
});
