/**
 * **The lake's Meshy props** (the hidden Wendigo chapter's 3D stage; FFX only): four static models from the asset lane's first phase, placed round the lake. A **crystal cluster** (a blue crystal bunch on a snowy rock),
 * **the Macalania Temple's ice cathedral** (a landmark on the far shore, under the aurora, which the fight stands in front of), **ice slabs** and **frozen reeds** (spikes of ice on a snowy base). Each file is parsed once and
 * cloned per placement (a static model shares its geometry, material and textures with its clones); each stands on the ground there (the shore's height at its place, so the temple sits on its hill and the reeds on the
 * drifts) with its lowest point on it, scaled and turned by its row. The placements are staging, not game data, and keep clear of the fight's ground.
 *
 * A file that is not there leaves its place empty (the procedural crystals still stand) and says so once. Needs three.js (the glTF loader comes in through `./load.ts`'s IO); no DOM. Game case: FFX only.
 */

import { Box3, Group, Mesh, type Material, type Object3D, type Texture } from 'three';
import { LAKE_PROP_DIR, LAKE_PROP_FILES, type LakeProp } from '../../data/ffx/lake-models.ts';
import { defaultIO, type LoaderIO, type Parsed } from './load.ts';
import { shoreHeight } from './shore.ts';

/** One placement: the prop, where it stands (x, z), how big (a multiplier of the file's metres), which way it faces (radians about +Y), how far it is sunk into the ground and how far it is raised off it (metres). */
export interface PropPlacement {
  readonly prop: LakeProp;
  readonly at: readonly [number, number];
  readonly scale: number;
  readonly yaw: number;
  readonly sink?: number;
  readonly lift?: number;
}

/**
 * The snow banks along the ice's edge: drifts (a file 1.9 m wide and 0.3 m high) at 7 to 11 times, round the north and the sides at the ice's rim, so the disc of ice has a visible shore to stand against, and a great one
 * under the Temple (18 times: 34 m wide, 5.5 m high), so the cathedral stands on a hill, not on the haze.
 */
function banks(): PropPlacement[] {
  const out: PropPlacement[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (-105 + (i * 210) / 13) * (Math.PI / 180); // from the west of north, over the north, to the east
    const r = 47 + (i % 3) * 1.6;
    out.push({ prop: 'drift', at: [Math.sin(a) * r, -Math.cos(a) * r], scale: 7 + ((i * 5) % 5), yaw: i * 1.7, sink: 0.25 });
  }
  return out;
}

/** The fight's ground: the party's middle and Wendigo's mark, and how far round each nothing may stand. */
export const CLEAR = [
  { at: [0.9, -1.6], radius: 6.4 },
  { at: [2.6, -5.8], radius: 3.4 },
] as const;

/** Every placement. The temple is 20 m tall at its scale (the file is 1.85 m), 112 m north and a little left, so the aurora is behind and the brute in front. */
export const PLACEMENTS: readonly PropPlacement[] = [
  { prop: 'drift', at: [-22, -112], scale: 18, yaw: 0.9, sink: 1 },
  { prop: 'temple', at: [-22, -112], scale: 11, yaw: 0.25, lift: 4.2 },
  ...banks(),
  // crystal clusters: the frame's near edges, then further round the shore
  { prop: 'crystals', at: [-8.8, -3.6], scale: 2.5, yaw: 0.6 },
  { prop: 'crystals', at: [11.8, -9.4], scale: 3.2, yaw: 2.4 },
  { prop: 'crystals', at: [-5.6, -11.8], scale: 2.0, yaw: 4.0 },
  { prop: 'crystals', at: [8.2, 4.4], scale: 1.0, yaw: 1.1 },
  { prop: 'crystals', at: [-14.5, -16.5], scale: 4.0, yaw: 3.3 },
  { prop: 'crystals', at: [18.5, -19], scale: 4.6, yaw: 5.2 },
  { prop: 'crystals', at: [27, -4], scale: 3.2, yaw: 0.2 },
  { prop: 'crystals', at: [-27, -3], scale: 3.4, yaw: 2.0 },
  { prop: 'crystals', at: [3, -28], scale: 5.2, yaw: 4.4 },
  // ice slabs: low, at the edges of the picture and scattered over the ice
  { prop: 'slabs', at: [-5.4, 6.6], scale: 1.1, yaw: 0.3 },
  { prop: 'slabs', at: [6.2, 6.2], scale: 1.0, yaw: 2.2 },
  { prop: 'slabs', at: [-12, -8], scale: 1.7, yaw: 1.4 },
  { prop: 'slabs', at: [14.5, -3], scale: 1.5, yaw: 3.9 },
  { prop: 'slabs', at: [-1.5, -16.5], scale: 1.9, yaw: 5.0 },
  { prop: 'slabs', at: [20.5, -12.5], scale: 2.1, yaw: 0.9 },
  { prop: 'slabs', at: [9, -22], scale: 2.3, yaw: 2.8 },
  { prop: 'slabs', at: [-20, -14], scale: 2.0, yaw: 4.6 },
  // frozen reeds: spikes along the shore and a few on the ice
  { prop: 'reeds', at: [-16.5, -6.4], scale: 2.3, yaw: 0.8 },
  { prop: 'reeds', at: [16.8, -5.4], scale: 2.6, yaw: 3.0 },
  { prop: 'reeds', at: [-33, -14], scale: 4.2, yaw: 1.9 },
  { prop: 'reeds', at: [34, -16], scale: 4.5, yaw: 4.1 },
  { prop: 'reeds', at: [-12, -34], scale: 4.8, yaw: 2.6 },
  { prop: 'reeds', at: [14, -36], scale: 5.0, yaw: 0.3 },
  { prop: 'reeds', at: [-38, 8], scale: 3.8, yaw: 5.5 },
  { prop: 'reeds', at: [39, 6], scale: 4.0, yaw: 1.2 },
  { prop: 'reeds', at: [-24, 24], scale: 4.2, yaw: 3.7 },
  { prop: 'reeds', at: [26, 26], scale: 4.4, yaw: 0.5 },
];

/** Whether a place is on the fight's ground. */
export const onTheFight = (x: number, z: number): boolean => CLEAR.some((c) => Math.hypot(x - c.at[0], z - c.at[1]) < c.radius);

export interface Props {
  readonly group: Group;
  /** The props that were found and placed, by name, with how many of each. */
  readonly used: Readonly<Record<string, number>>;
  dispose(): void;
}

/** Free the geometry, materials and textures of a parsed scene. */
function freeScene(scene: Object3D): void {
  const maps = new Set<Texture>();
  scene.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const v of Object.values(m as Material & Record<string, unknown>)) if ((v as Texture | null)?.isTexture === true) maps.add(v as Texture);
      m.dispose();
    }
  });
  for (const t of maps) t.dispose();
}

export interface PropsOptions {
  readonly base: string;
  readonly io?: LoaderIO;
  readonly warn?: (message: string) => void;
  readonly placements?: readonly PropPlacement[];
}

/** Load the props and stand every placement on its ground. The group is added to the stage's group by the caller. */
export async function loadProps(opts: PropsOptions): Promise<Props> {
  const io = opts.io ?? defaultIO();
  const warn = opts.warn ?? ((): void => undefined);
  const placements = opts.placements ?? PLACEMENTS;
  const parsed = new Map<LakeProp, Parsed & { minY: number }>();
  await Promise.all(
    LAKE_PROP_FILES.filter((p) => placements.some((pl) => pl.prop === p)).map(async (p) => {
      try {
        const bytes = await io.fetchBytes(`${opts.base}${LAKE_PROP_DIR}${p}.glb`);
        if (!bytes) return void warn(`[lake3d] prop file missing: ${p}`);
        const got = await io.parse(bytes);
        got.scene.updateMatrixWorld(true);
        parsed.set(p, { ...got, minY: new Box3().setFromObject(got.scene).min.y });
      } catch (e) {
        warn(`[lake3d] prop file unreadable: ${p} (${String(e).slice(0, 80)})`);
      }
    }),
  );
  const group = new Group();
  group.name = 'lake-props';
  const used: Record<string, number> = {};
  for (const pl of placements) {
    const src = parsed.get(pl.prop);
    if (!src) continue;
    const holder = new Group();
    holder.name = `lake-prop-${pl.prop}`;
    const body = src.scene.clone(true);
    body.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.isMesh) mesh.frustumCulled = pl.prop === 'temple' ? false : true;
    });
    holder.add(body);
    holder.scale.setScalar(pl.scale);
    holder.rotation.y = pl.yaw;
    holder.position.set(pl.at[0], shoreHeight(pl.at[0], pl.at[1]) - src.minY * pl.scale - (pl.sink ?? 0) + (pl.lift ?? 0), pl.at[1]);
    group.add(holder);
    used[pl.prop] = (used[pl.prop] ?? 0) + 1;
  }
  return {
    group,
    used,
    dispose(): void {
      group.removeFromParent();
      group.clear();
      for (const p of parsed.values()) freeScene(p.scene);
      parsed.clear();
    },
  };
}
