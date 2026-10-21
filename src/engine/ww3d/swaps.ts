/**
 * **Swappable props and temple pieces** (the hidden Wind Waker chapter; FFX-2 only). The chapter's weapons (`./props.ts`) and temple (`./stage.ts`) are procedural stand-ins; a better piece is dropped in as a file and used
 * in place of the stand-in of the same name, with no code change. The first real set arrived 2026-10-21 (Meshy models cleaned in Blender: static, standing, one mesh each, a 2048 px base-colour map):
 *
 * - `public/models-exp/windwaker/props/<pistol|dagger|sword>.glb`: **origin at the grip centre, tip along +Z, +Y up**, in metres for a girl of her native height (about 1.2 m), used at the model's own scale (1): the pistol
 *   0.22 m long, the dagger 0.28, the sword 0.85. They are made for one hand: Yuna's pistols and Rikku's daggers use the file as it is in the right hand and **mirrored** (`scale.x = -1`) in the left (`PropSpec.mirrorSwapped`).
 * - `public/models-exp/windwaker/temple/<wall|door|brazier|pillar>.glb`: each **stands on y 0, centred in x and z, its front toward +Z**, and is placed by its own measured size (`./stageParts.ts` has the placement):
 *   `wall` is a tile (3 x 3 m, 0.45 deep) tiled round the chamber circle in rows and replaces the wall, its cornice, its relief panels and the procedural pilasters; `door` (3.35 x 3.5, 0.81 deep) stands at the door's azimuth
 *   with its back on the wall; `brazier` (1.1 m high) replaces a floor torch's pedestal and bowl, and a wall bowl on its bracket; `pillar` (1 x 4 m) stands at the lab's pilaster azimuths, stacked in the wall's rows.
 *
 * A file that is missing, will not parse, or is not a binary glTF counts as no file: that name keeps its procedural piece. Nothing here is required, shipped or committed (`tools/dist-filter.mjs`, `.gitignore`).
 */

import type { Object3D } from 'three';
import { FileCache } from './io.ts';
import { PROP_NAMES, TEMPLE_NAMES, swapUrl, type PropName, type TempleName } from './layout.ts';

/** The files found. */
export interface Swaps {
  readonly props: Readonly<Partial<Record<PropName, Object3D>>>;
  readonly temple: Readonly<Partial<Record<TempleName, Object3D>>>;
}

/** No swaps at all: every prop and every temple piece is procedural. */
export const NO_SWAPS: Swaps = { props: {}, temple: {} };

/** The names that have a file, as `props/pistol`, `temple/wall`, for the log. */
export function swapNames(swaps: Swaps): string[] {
  return [...Object.keys(swaps.props).map((n) => `props/${n}`), ...Object.keys(swaps.temple).map((n) => `temple/${n}`)];
}

/** Look for every swappable piece, all at once; a name with no usable file is simply absent from the result. */
export async function loadSwaps(files: FileCache, base: string, propDir: string, templeDir: string): Promise<Swaps> {
  const props: Partial<Record<PropName, Object3D>> = {};
  const temple: Partial<Record<TempleName, Object3D>> = {};
  await Promise.all([
    ...PROP_NAMES.map(async (name) => {
      const parsed = await files.get(swapUrl(base, propDir, name));
      if (parsed) props[name] = parsed.scene;
    }),
    ...TEMPLE_NAMES.map(async (name) => {
      const parsed = await files.get(swapUrl(base, templeDir, name));
      if (parsed) temple[name] = parsed.scene;
    }),
  ]);
  return { props, temple };
}
