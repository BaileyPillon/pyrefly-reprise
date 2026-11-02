/**
 * **The cleaned assets of 2026-10-21, loaded from disk** (`public/models-exp/windwaker/`: Valefor `valefor-v2`, Rikku `rikku-v3`, the three weapons in `props/`, the four temple pieces in `temple/`; the hidden Wind Waker
 * chapter, FFX-2 only). The files are local only (gitignored, never committed, never shipped), so every test here is skipped on a machine without them. Where they are, each file is read in Node, with no renderer: the glTF's
 * JSON for its size and convention, and three's own `GLTFLoader` (pictures stripped) for the chapter's own loaders to place:
 *
 * 1. **Each file is what the handoff says**: a weapon has its origin at the grip centre, its tip along +Z, +Y up, and its length (0.22 m the pistol, 0.28 the dagger, 0.85 the sword); a temple piece stands on y 0, centred
 *    in x and z, facing +Z, and is the size it was made (wall 3 x 3 tile, door 3.35 x 3.5, brazier 1.1 high, pillar 4 high); none is heavier than 14,000 triangles.
 * 2. **The swap paths pick them up**: `loadSwaps` finds all seven; the girls' weapons are the files, on the hand bones, the left hand's mirrored.
 * 3. **The temple is built from the kit**: the wall tiled round the chamber circle (25 tiles in 3 rows, sharing one geometry), one tile centred on the door, the door at the back with its back against the wall, the six
 *    pillars where the lab's pilasters stood (three modules each), and the braziers where the torches are, the flames on their tops.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Box3, Mesh, Texture, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { FileCache } from '../../../src/engine/ww3d/io.ts';
import { PROP_NAMES, TEMPLE_NAMES, WORLD_HEIGHT, type PropName, type TempleName } from '../../../src/engine/ww3d/layout.ts';
import { loadWwModels } from '../../../src/engine/ww3d/model.ts';
import { PROP_SPECS } from '../../../src/engine/ww3d/props.ts';
import { STAGE, buildStage } from '../../../src/engine/ww3d/stage.ts';
import { FLOOR_BRAZIER_SCALE, WALL_BRAZIER_SCALE, WALL_MODULE_HEIGHT, doorScale, pillarAzimuths, rowsOf } from '../../../src/engine/ww3d/stageParts.ts';
import type { StageTextures } from '../../../src/engine/ww3d/stageTextureSet.ts';
import { loadSwaps, swapNames } from '../../../src/engine/ww3d/swaps.ts';
import { createToonUniforms } from '../../../src/engine/ww3d/toon.ts';
import { TARGET_POSITION } from '../../../src/engine/ww3d/camera.ts';
import { WW_MODEL_DIR, WW_PROP_DIR, WW_TEMPLE_DIR } from '../../../src/data/windwaker-ids.ts';
import { boxOf, modelsDir, readGltf, realIo, trianglesOf } from '../helpers/wwRealFiles.ts';

const propFile = (n: PropName): string => join(modelsDir, 'props', `${n}.glb`);
const templeFile = (n: TempleName): string => join(modelsDir, 'temple', `${n}.glb`);
const haveAll = PROP_NAMES.every((n) => existsSync(propFile(n))) && TEMPLE_NAMES.every((n) => existsSync(templeFile(n)));

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

/** The azimuth, in degrees, of a point (0 the far wall, positive toward +x). */
const azimuthOf = (p: Vector3): number => (Math.atan2(p.x, -p.z) * 180) / Math.PI;
const radiusOf = (p: Vector3): number => Math.hypot(p.x, p.z);
const wrap360 = (d: number): number => ((d % 360) + 360) % 360;

describe.skipIf(!haveAll)('each file is what the handoff says', () => {
  const WEAPONS: Record<PropName, number> = { pistol: 0.22, dagger: 0.28, sword: 0.85 };

  for (const name of PROP_NAMES) {
    it(`${name}: ${WEAPONS[name]} m long, the tip along +Z, the origin at the grip, +Y up, a single mesh under 14,000 triangles`, () => {
      const g = readGltf(propFile(name));
      const box = boxOf(g);
      const size = box.max.map((m, i) => m - box.min[i]!);
      expect(size[2], `${name} length`).toBeCloseTo(WEAPONS[name], 2);
      expect(size[2]!, 'the long axis is z').toBeGreaterThan(Math.max(size[0]!, size[1]!));
      expect(box.min[2]!, 'the grip is behind the origin').toBeLessThan(0);
      expect(box.max[2]!, 'the tip is ahead of it').toBeGreaterThan(0.18);
      expect(box.max[2]! / size[2]!, 'the origin is in the back third of the weapon (the grip), the tip is the long side').toBeGreaterThan(0.7);
      expect(box.max[1]! + Math.abs(box.min[1]!), 'it has height for a sight or an edge').toBeGreaterThan(0.03);
      expect(g.meshes).toHaveLength(1);
      expect(trianglesOf(g)).toBeLessThan(14_000);
      expect(g.materials?.[0]?.pbrMetallicRoughness?.baseColorTexture).toBeDefined();
    });
  }

  const KIT: Record<TempleName, { x: number; y: number; z: number }> = {
    wall: { x: 3.0, y: 3.009, z: 0.451 },
    door: { x: 3.353, y: 3.5, z: 0.814 },
    brazier: { x: 1.066, y: 1.1, z: 1.064 },
    pillar: { x: 1.016, y: 4.0, z: 1.015 },
  };
  for (const name of TEMPLE_NAMES) {
    it(`${name}: ${KIT[name].x} x ${KIT[name].y} m, standing on y 0, centred in x and z, one mesh under 14,000 triangles`, () => {
      const g = readGltf(templeFile(name));
      const box = boxOf(g);
      expect(box.max[0]! - box.min[0]!).toBeCloseTo(KIT[name].x, 2);
      expect(box.max[1]! - box.min[1]!).toBeCloseTo(KIT[name].y, 2);
      expect(box.max[2]! - box.min[2]!).toBeCloseTo(KIT[name].z, 2);
      expect(box.min[1]!, 'standing on the floor').toBeCloseTo(0, 2);
      expect((box.min[0]! + box.max[0]!) / 2, 'centred in x').toBeCloseTo(0, 2);
      expect((box.min[2]! + box.max[2]!) / 2, 'centred in z').toBeCloseTo(0, 2);
      expect(g.meshes).toHaveLength(1);
      expect(trianglesOf(g)).toBeLessThan(14_000);
    });
  }
});

describe.skipIf(!haveAll)('the swap paths pick the files up', () => {
  it('finds all seven where the chapter looks, and nothing else', async () => {
    const swaps = await loadSwaps(new FileCache(realIo()), '/', WW_PROP_DIR, WW_TEMPLE_DIR);
    expect(swapNames(swaps).sort()).toEqual([...PROP_NAMES.map((n) => `props/${n}`), ...TEMPLE_NAMES.map((n) => `temple/${n}`)].sort());
    for (const n of PROP_NAMES) expect(swaps.props[n], n).toBeDefined();
    for (const n of TEMPLE_NAMES) expect(swaps.temple[n], n).toBeDefined();
  }, 60_000);

  it('puts the files on the girls\' hand bones: two mirrored-left pistols, two mirrored-left daggers, one sword, all at the model\'s own scale', async () => {
    const files = new FileCache(realIo());
    const swaps = await loadSwaps(files, '/', WW_PROP_DIR, WW_TEMPLE_DIR);
    const models = await loadWwModels({ base: '/', dir: WW_MODEL_DIR, heights: WORLD_HEIGHT, context: { uniforms: createToonUniforms(), swaps: swaps.props, camera: TARGET_POSITION }, files, io: realIo() });
    expect(models.capsules).toEqual([]);
    const expected = { yuna: 'pistol', rikku: 'dagger', paine: 'sword' } as const;
    for (const id of ['yuna', 'rikku', 'paine'] as const) {
      const m = models.models.get(id)!;
      const specs = PROP_SPECS[id];
      expect(m.swappedProps, `${id}: every weapon is a file`).toBe(specs.length);
      expect(m.weapons.map((w) => w.parent?.name)).toEqual(specs.map((s) => s.hand));
      m.root.updateMatrixWorld(true);
      m.weapons.forEach((w, i) => {
        expect(w.name).toBe(`prop:${expected[id]}`);
        const mirrored = specs[i]!.mirrorSwapped;
        expect(w.scale.toArray(), `${id} ${specs[i]!.hand}`).toEqual([mirrored ? -1 : 1, 1, 1]);
        expect(w.matrixWorld.determinant() < 0, `${id} ${specs[i]!.hand} is drawn mirrored`).toBe(mirrored);
        // the file's size in the world is the fit's scale of it: the pistol is 0.22 m in a 1.2 m girl, so 0.275 in Yuna's 1.5
        const fit = WORLD_HEIGHT[id] / (id === 'yuna' ? 1.2 : id === 'rikku' ? 1.15 : 1.25);
        expect(Math.abs(w.getWorldScale(new Vector3()).y), `${id} scale`).toBeCloseTo(fit, 1);
      });
    }
    expect(models.models.get('yuna')!.weapons.map((w) => w.scale.x)).toEqual([-1, 1]); // the left hand's pistol is the mirror of the right's
    expect(models.models.get('paine')!.weapons.map((w) => w.scale.x)).toEqual([1]);
    // aimed at the boss they still point away from the girl, mirrored or not
    const yuna = models.models.get('yuna')!;
    yuna.update(0.016);
    yuna.aimWeapons(new Vector3(4, 2.2, -3.3));
    for (const w of yuna.weapons) expect((w.userData['aimed'] as { applied: number }).applied).toBeGreaterThan(0);
    models.dispose();
  }, 120_000);
});

describe.skipIf(!haveAll)('the temple is built from the kit', () => {
  const build = async () => {
    const swaps = await loadSwaps(new FileCache(realIo()), '/', WW_PROP_DIR, WW_TEMPLE_DIR);
    return buildStage(createToonUniforms(), { swaps: swaps.temple, textures: blank });
  };
  const piecesOf = (stage: Awaited<ReturnType<typeof build>>, name: TempleName) => stage.group.children.filter((c) => c.name === `temple:${name}`);
  const { R, H } = STAGE;
  const n = 25;
  const apothem = R * Math.cos(Math.PI / n);

  it('uses all four pieces, none of the procedural stand-ins for them, and says so', async () => {
    const stage = await build();
    expect([...stage.used].sort()).toEqual(['brazier', 'door', 'pillar', 'wall']);
    expect(stage.group.getObjectByName('sun-occluder')).toBeDefined();
    stage.dispose();
  }, 120_000);

  it('tiles the wall round the chamber circle: 25 tiles in 3 rows, a regular polygon whose corners are on the circle, one tile centred on the door, all facing the axis', async () => {
    const stage = await build();
    const tiles = piecesOf(stage, 'wall');
    const rows = rowsOf(H);
    expect(WALL_MODULE_HEIGHT).toBe(4);
    expect(rows).toBe(3);
    expect(tiles).toHaveLength(n * rows);
    const rowH = H / rows;
    const centreRadius = apothem + 0.451 / 2;
    for (const t of tiles) {
      expect(radiusOf(t.position), 'every tile at one radius').toBeCloseTo(centreRadius, 3);
      expect(t.position.y % rowH < 1e-6 || rowH - (t.position.y % rowH) < 1e-6, 'a row base').toBe(true);
      const front = new Vector3(0, 0, 1).applyQuaternion(t.quaternion);
      const inward = new Vector3(-t.position.x, 0, -t.position.z).normalize();
      expect(front.dot(inward), 'the front faces the axis').toBeCloseTo(1, 6);
      // 3 m wide stretched a hair so the ring closes, 3.009 m high stretched to the row's 3.5 m
      expect(t.scale.x).toBeCloseTo((2 * R * Math.sin(Math.PI / n)) / 3.0, 4);
      expect(t.scale.y).toBeCloseTo(rowH / 3.009, 3);
      expect(t.scale.z).toBe(1);
    }
    // one tile is centred on the door's azimuth; the tiles of one row are 14.4 degrees apart
    const base = tiles.filter((t) => t.position.y === 0).map((t) => wrap360(azimuthOf(t.position))).sort((a, b) => a - b);
    expect(base).toHaveLength(n);
    expect(base.some((a) => Math.abs(a - STAGE.doorAz) < 1e-6)).toBe(true);
    for (let i = 1; i < base.length; i++) expect(base[i]! - base[i - 1]!).toBeCloseTo(360 / n, 6);
    // the three rows stack to the wall's height
    const top = Math.max(...tiles.map((t) => new Box3().setFromObject(t).max.y));
    expect(top).toBeCloseTo(H, 2);
    // 75 draw calls on one geometry and one material per mesh, and each tile keeps its frustum culling
    const meshes = tiles.map((t) => t.getObjectByProperty('isMesh', true) as Mesh);
    expect(new Set(meshes.map((m) => m.geometry)).size).toBe(1);
    expect(new Set(meshes.map((m) => m.material)).size).toBe(1);
    expect(meshes.every((m) => m.frustumCulled)).toBe(true);
    expect(meshes[0]!.castShadow, 'the wall is lit, not a shadow caster').toBe(false);
    stage.dispose();
  }, 120_000);

  it('puts the door at the back (the lab\'s azimuth, the far wall, the right of the frame) with its back against the wall\'s inner face, facing the axis', async () => {
    const stage = await build();
    const [door] = piecesOf(stage, 'door');
    expect(piecesOf(stage, 'door')).toHaveLength(1);
    expect(azimuthOf(door!.position)).toBeCloseTo(STAGE.doorAz, 6);
    expect(door!.position.z, 'at the back: -z is away from the camera').toBeLessThan(-8);
    expect(door!.position.x, 'toward the right of the frame').toBeGreaterThan(0);
    const k = doorScale(H, 3.5);
    expect(door!.scale.x).toBeCloseTo(k, 6);
    expect(door!.scale.y).toBeCloseTo(k, 6);
    expect(3.5 * k / H, "the door's top sits at about 0.45 to 0.5 of the wall's height, as in TARGET-C").toBeGreaterThan(0.45);
    expect(3.5 * k / H).toBeLessThan(0.5);
    expect(radiusOf(door!.position)).toBeCloseTo(apothem - (0.814 * k) / 2, 2); // its (scaled) depth ends on the wall
    expect(door!.position.y).toBe(0);
    expect(new Vector3(0, 0, 1).applyQuaternion(door!.quaternion).dot(new Vector3(-door!.position.x, 0, -door!.position.z).normalize())).toBeCloseTo(1, 6);
    stage.dispose();
  }, 120_000);

  it('stands the six pillars where the lab\'s pilasters stood, three modules high each, scaled evenly to the row, against the wall', async () => {
    const stage = await build();
    const pillars = piecesOf(stage, 'pillar');
    expect(pillars).toHaveLength(6 * 3);
    const labAzimuths = pillarAzimuths((3.353 * doorScale(H, 3.5)) / 2, apothem); // the lab's six, the two beside the door moved out of the scaled door's way
    expect(labAzimuths.filter((a, i) => a !== [-52, -33, -13, 11, 35, 54][i])).toHaveLength(2);
    const rowH = H / 3;
    const k = rowH / 4;
    for (const az of labAzimuths) {
      const column = pillars.filter((p) => Math.abs(azimuthOf(p.position) - az) < 0.01); // (the door's measured width is a hair more than the 3.353 typed here)
      expect(column.map((p) => p.position.y).sort((a, b) => a - b), `pillar at ${az}`).toEqual([0, rowH, 2 * rowH].map((y) => expect.closeTo(y, 6)));
      for (const p of column) {
        expect(p.scale.x).toBeCloseTo(k, 6);
        expect(p.scale.y).toBeCloseTo(k, 6);
        expect(radiusOf(p.position)).toBeCloseTo(apothem - (1.015 * k) / 2, 3);
      }
    }
    stage.dispose();
  }, 120_000);

  it('puts a brazier where each torch is: three on the floor at the lab\'s azimuths, two on the wall brackets, a flame sprite on each top', async () => {
    const stage = await build();
    const braziers = piecesOf(stage, 'brazier');
    expect(braziers).toHaveLength(5);
    expect(stage.flames).toHaveLength(5);
    const floor = braziers.filter((b) => Math.abs(b.scale.x - FLOOR_BRAZIER_SCALE) < 1e-9);
    const wall = braziers.filter((b) => Math.abs(b.scale.x - FLOOR_BRAZIER_SCALE) >= 1e-9);
    expect(floor).toHaveLength(3);
    expect(wall).toHaveLength(2);
    expect(floor.map((b) => Math.round(azimuthOf(b.position))).sort((a, b) => a - b)).toEqual([-62, 19, 41]);
    for (const b of floor) {
      expect(b.position.y).toBe(0);
      expect(radiusOf(b.position)).toBeCloseTo(R - 1.9, 6);
    }
    for (const b of wall) expect(b.scale.x).toBeCloseTo(WALL_BRAZIER_SCALE, 6);
    expect(FLOOR_BRAZIER_SCALE, 'the braziers read small beside TARGET-C: about 1.3 times').toBeCloseTo(1.3, 9);
    // the flames rest just above each top: a floor brazier is 1.1 m times its scale, a wall one smaller on its bracket
    const flameYs = stage.flames.map((f) => f.base.y).sort((a, b) => a - b);
    const topOf = (b: (typeof braziers)[number]): number => b.position.y + 1.1 * b.scale.y;
    const expectedYs = braziers.map((b) => topOf(b) + 0.1).sort((a, b) => a - b);
    flameYs.forEach((y, i) => expect(y).toBeCloseTo(expectedYs[i]!, 6));
    stage.dispose();
  }, 120_000);
});
