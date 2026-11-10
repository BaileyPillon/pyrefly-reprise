/**
 * Test 16 of the FFX-2 Special look (step C1; game case: FFX-2 only in what is seen, the plumbing both games and inert): the ring and the anchor math of every figure-less part that
 * exists today are drawn exactly as before, whatever fields the Special look adds to `OnParentAnchor`.
 *
 * THE PIN (written in the step-0 commit, BEFORE `PartAnchors.ts` is edited, with the old code): `tests/fixtures/specials/anchor-ring-pin.json` records, for every anchor the scene tables publish
 * today (the Farplane's, the colossus' on both surfaces, the Garden of Pain's, the Spectral Keeper's: read from the scene modules, no number copied here), the ring mesh's geometry parameters,
 * its material, its placement after one frame and after a long run, its lit colour, its fade-out, and the pure anchor maths (`anchoredQuad`, `anchoredSpot`, `anchoredAim`, `anchoredHeight`,
 * the actor options) and the stage's figure request for it. A change to a ring that has none of the new fields fails here. The file is written by `toMatchFileSnapshot` on the first run only.
 */
import { describe, expect, it } from 'vitest';
import { Group, PerspectiveCamera, Vector3, type Mesh, type MeshBasicMaterial, type RingGeometry } from 'three';
import { anchorPoint, PartRings, type ParentPose, type PartAnchor, type PartAnchors } from '../../src/engine/PartAnchors.ts';
import { anchoredActorOptions, anchoredAim, anchoredHeight, anchoredQuad, anchoredRingRadius, anchoredSpot } from '../../src/engine/StageAnchors.ts';
import { figureSpec } from '../../src/engine/StageFigureRequest.ts';
import { colossusStaging } from '../../src/scenes/farplane-colossus.ts';
import { FARPLANE_PART_ANCHORS } from '../../src/scenes/farplane-parts.ts';
import { GARDEN_PART_ANCHORS } from '../../src/scenes/garden-of-pain.ts';
import { SPECTRAL_KEEPER_PART_ANCHORS } from '../../src/scenes/spectral-keeper.ts';

/** Every anchor table the scenes publish today, by name. */
const TABLES: Record<string, PartAnchors> = {
  farplane: FARPLANE_PART_ANCHORS,
  'colossus-desktop': colossusStaging(false).partAnchors,
  'colossus-phone': colossusStaging(true).partAnchors,
  'garden-of-pain': GARDEN_PART_ANCHORS,
  'spectral-keeper': SPECTRAL_KEEPER_PART_ANCHORS,
};

const round = (v: number): number => {
  const r = Math.round(v * 1e6) / 1e6;
  return r === 0 ? 0 : r;
};
const vec = (v: { x: number; y: number; z: number }): number[] => [round(v.x), round(v.y), round(v.z)];

/** The live plane of a parent 3 units tall and 2 wide, centred at (1, 0.5, -2), mirrored or not. */
function planeParent(mirrored: boolean): ParentPose {
  return {
    x: 1,
    y: 0.5,
    z: -2,
    height: 3,
    mirrored,
    toWorld: (u, t) => [1 + ((mirrored ? 1 - u : u) - 0.5) * 2, 0.5 + (1 - t) * 3, -2],
  };
}
const PROPORTIONAL: ParentPose = { x: 1, y: 0.5, z: -2, height: 3 };
const camera = new PerspectiveCamera();
camera.position.set(3, 2, 10);
camera.lookAt(0, 1, 0);

/** What `PartRings` does with one anchor, step by step. */
function ringRecord(id: string, anchor: PartAnchor): unknown {
  const root = new Group();
  const rings = new PartRings(root);
  rings.add(id, anchor);
  const mesh = root.children[0] as Mesh | undefined;
  if (!mesh) return { drawn: false };
  const mat = mesh.material as MeshBasicMaterial;
  const geo = mesh.geometry as RingGeometry;
  const look = (): unknown => ({
    visible: mesh.visible,
    opacity: round(mat.opacity),
    colour: mat.color.getHex(),
    at: vec(mesh.position),
    scale: vec(mesh.scale),
    quaternion: [round(mesh.quaternion.x), round(mesh.quaternion.y), round(mesh.quaternion.z), round(mesh.quaternion.w)],
  });
  const born = {
    name: mesh.name,
    renderOrder: mesh.renderOrder,
    rotationX: round(mesh.rotation.x),
    geometry: { type: geo.type, ...Object.fromEntries(Object.entries(geo.parameters).map(([k, v]) => [k, round(v as number)])) },
    material: { colour: mat.color.getHex(), opacity: mat.opacity, transparent: mat.transparent, depthWrite: mat.depthWrite, depthTest: mat.depthTest, side: mat.side, blending: mat.blending },
  };
  const run = (parent: ParentPose, frames: number): unknown => {
    for (let i = 0; i < frames; i++) rings.update(0.1, () => parent, camera);
    return look();
  };
  const first = run(PROPORTIONAL, 1);
  const settled = run(PROPORTIONAL, 40);
  const onPlane = run(planeParent(false), 40);
  const mirrored = run(planeParent(true), 40);
  const floorRing = anchor.mode === 'overhead' ? anchor.floorRing : undefined;
  let lit: unknown = null;
  if (floorRing?.litFlag) {
    rings.sync(id, { combatants: {}, flags: { [floorRing.litFlag]: true } } as never);
    lit = run(PROPORTIONAL, 40);
    rings.sync(id, { combatants: {}, flags: {} } as never);
    lit = [lit, run(PROPORTIONAL, 40)];
  }
  rings.setAlive(id, false);
  const down = run(PROPORTIONAL, 60);
  rings.dispose();
  return { born, first, settled, onPlane, mirrored, lit, down, removed: root.children.length };
}

/** The pure anchor maths for one anchor, on both kinds of parent. */
function mathRecord(anchor: PartAnchor): unknown {
  const out: Record<string, unknown> = { radius: round(anchoredRingRadius(anchor)), height: round(anchoredHeight(anchor)), options: anchoredActorOptions(anchor) };
  for (const [name, parent] of [['proportional', PROPORTIONAL], ['plane', planeParent(false)], ['mirrored', planeParent(true)]] as const) {
    const quad = anchoredQuad(anchor, parent, [new Vector3(), new Vector3(), new Vector3(), new Vector3()]).map(vec);
    const aim = (which: 'head' | 'chest' | 'feet'): number[] => vec(anchoredAim(anchor, parent, which, new Vector3()));
    out[name] = {
      ring: anchorPoint(anchor, parent, 'ring').map(round),
      chest: anchorPoint(anchor, parent, 'chest').map(round),
      quad,
      spot: anchoredSpot(anchor, parent, anchoredHeight(anchor)).map(round),
      aim: { head: aim('head'), chest: aim('chest'), feet: aim('feet') },
    };
  }
  return out;
}

/** The stage's figure request for a figure-less part: the options and the string that decides whether a parked figure answers it. */
function requestRecord(id: string, anchors: PartAnchors): unknown {
  const env = { slots: { partAnchors: anchors } as unknown as Parameters<typeof figureSpec>[0]['slots'], rim: undefined, rigs: undefined, groundLuma: 0.3, game: 'ffx2' as const };
  const c = { id, side: 'enemy', slot: 0, alive: true, spriteKey: id, flags: {} } as unknown as Parameters<typeof figureSpec>[1];
  const spec = figureSpec(env, c, { artId: 'vegnagun-body', poses: { idle: '/art/characters/vegnagun-body/idle.png' } });
  const opts = spec.request.opts as { turnRing?: unknown; worldHeight?: number; shadow?: unknown; hover?: unknown };
  return { turnRing: opts.turnRing, worldHeight: opts.worldHeight, shadow: opts.shadow, hover: opts.hover, anchored: spec.anchor !== undefined, fingerprint: spec.fingerprint };
}

describe('the rings and the anchor maths of every anchor that exists today (the pin, written before the edit)', () => {
  it('there are anchors to pin', () => {
    expect(Object.keys(TABLES).length).toBe(5);
    for (const [name, table] of Object.entries(TABLES)) expect(Object.keys(table).length, name).toBeGreaterThan(0);
  });

  it('matches the snapshot taken with the unedited PartAnchors.ts and StageAnchors.ts', async () => {
    const lines: string[] = [];
    for (const [name, table] of Object.entries(TABLES)) {
      for (const [id, anchor] of Object.entries(table)) {
        lines.push(`${name}/${id} ${JSON.stringify({ anchor, ring: ringRecord(id, anchor), math: mathRecord(anchor), request: requestRecord(id, table) })}`);
      }
    }
    await expect(lines.join('\n') + '\n').toMatchFileSnapshot('../fixtures/specials/anchor-ring-pin.txt');
  });
});
