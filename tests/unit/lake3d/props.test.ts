/**
 * The lake's Meshy props (`src/engine/lake3d/props.ts`; FFX only): placements that keep clear of the fight, each prop file parsed once and cloned, each clone standing on the ground at its place, and a missing file leaving
 * its place empty.
 */
import { BoxGeometry, Box3, Group, Mesh, MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { LAKE_PROP_FILES } from '../../../src/data/ffx/lake-models.ts';
import type { LoaderIO, Parsed } from '../../../src/engine/lake3d/load.ts';
import { CLEAR, PLACEMENTS, loadProps, onTheFight } from '../../../src/engine/lake3d/props.ts';
import { shoreHeight } from '../../../src/engine/lake3d/shore.ts';

/** A prop like the real files': a box about the origin (the real ones are centred, so their lowest point is below 0). */
function fakeProp(): Parsed {
  const scene = new Group();
  scene.add(new Mesh(new BoxGeometry(1, 2, 1), new MeshStandardMaterial()));
  return { scene, animations: [] };
}
const io = (have: (url: string) => boolean, log: string[] = []): LoaderIO => ({
  fetchBytes: async (url) => (log.push(url), have(url) ? new ArrayBuffer(16) : null),
  parse: async () => fakeProp(),
  clone: async (s) => s.clone(true),
});

describe('the placements', () => {
  it('use only the five props the data file names', () => {
    for (const p of PLACEMENTS) expect(LAKE_PROP_FILES).toContain(p.prop);
    expect(new Set(PLACEMENTS.map((p) => p.prop)).size).toBe(5);
  });

  it('keep clear of the fight\'s ground (the party\'s middle and Wendigo\'s mark)', () => {
    for (const p of PLACEMENTS) expect(onTheFight(p.at[0], p.at[1]), `${p.prop} at ${p.at}`).toBe(false);
    expect(onTheFight(CLEAR[0].at[0], CLEAR[0].at[1])).toBe(true);
    expect(onTheFight(2.6, -5.8)).toBe(true);
  });

  it('put the temple far to the north, small crystals near the frame and the reeds out on the shore', () => {
    const temple = PLACEMENTS.find((p) => p.prop === 'temple')!;
    expect(temple.at[1]).toBeLessThan(-80);
    const near = PLACEMENTS.filter((p) => p.prop === 'crystals' && Math.hypot(p.at[0], p.at[1]) < 14);
    expect(near.length).toBeGreaterThanOrEqual(3);
    for (const r of PLACEMENTS.filter((p) => p.prop === 'reeds' && p.scale > 3.5)) expect(Math.hypot(r.at[0], r.at[1])).toBeGreaterThan(30);
  });
});

describe('loadProps', () => {
  it('reads each file once however many places use it, and stands every clone on the ground there with its lowest point on it', async () => {
    const urls: string[] = [];
    const props = await loadProps({ base: '/b/', io: io(() => true, urls) });
    expect(urls.sort()).toEqual(LAKE_PROP_FILES.map((p) => `/b/models-exp/lake/props/${p}.glb`).sort());
    expect(props.group.children).toHaveLength(PLACEMENTS.length);
    expect(props.used['crystals']).toBe(PLACEMENTS.filter((p) => p.prop === 'crystals').length);
    props.group.updateMatrixWorld(true);
    for (const [i, pl] of PLACEMENTS.entries()) {
      const holder = props.group.children[i]!;
      const box = new Box3().setFromObject(holder);
      expect(box.min.y, `${pl.prop} ${i}`).toBeCloseTo(shoreHeight(pl.at[0], pl.at[1]) - (pl.sink ?? 0) + (pl.lift ?? 0), 4);
    }
    props.dispose();
    expect(props.group.children).toHaveLength(0);
  });

  it('shares the geometry and material between clones (a static model)', async () => {
    const props = await loadProps({ base: '/', io: io(() => true) });
    const meshes = props.group.children.filter((c) => c.name === 'lake-prop-crystals').map((h) => h.getObjectByProperty('isMesh', true) as Mesh);
    expect(meshes.length).toBeGreaterThan(2);
    expect(new Set(meshes.map((m) => m.geometry)).size).toBe(1);
    expect(new Set(meshes.map((m) => m.material)).size).toBe(1);
    props.dispose();
  });

  it('leaves a missing file\'s places empty, and says so once', async () => {
    const said: string[] = [];
    const props = await loadProps({ base: '/', io: io((u) => !u.includes('temple')), warn: (m) => said.push(m) });
    expect(props.used['temple']).toBeUndefined();
    expect(props.group.children).toHaveLength(PLACEMENTS.length - 1);
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/temple/);
    props.dispose();
  });

  it('survives a file that cannot be parsed', async () => {
    const bad: LoaderIO = { ...io(() => true), parse: async () => { throw new Error('bad glTF'); } };
    const said: string[] = [];
    const props = await loadProps({ base: '/', io: bad, warn: (m) => said.push(m) });
    expect(props.group.children).toHaveLength(0);
    expect(said.length).toBe(5);
    props.dispose();
  });
});
