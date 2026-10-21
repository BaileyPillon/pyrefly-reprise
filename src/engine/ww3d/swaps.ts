/**
 * **Swappable props and temple pieces** (the hidden Wind Waker chapter; FFX-2 only). The chapter's weapons (`./props.ts`) and temple (`./stage.ts`) are procedural stand-ins; a better piece is dropped in as a file and used
 * in place of the stand-in of the same name, with no code change:
 *
 * - `public/models-exp/windwaker/props/<pistol|dagger|sword>.glb`: origin at the grip, +Z along the blade or barrel, +Y up, authored in metres for a girl of her native height (about 1.2 m), used at scale 1;
 * - `public/models-exp/windwaker/temple/<wall|door|brazier|pillar>.glb`: `wall` is the whole round wall (origin at the arena's centre, inner radius 12 m, 10.5 m high, feet on y 0) and replaces the wall, its cornice, its
 *   relief panels and the procedural pilasters (a `pillar` file is still placed); `door` has its origin on the floor in front of the door with its front toward +Z, about 4.6 m wide and 6.9 m high, and replaces the door frame, leaf and step; `brazier` has its origin on the
 *   floor, about 1.7 m high with the bowl at the top, and replaces a floor torch's pedestal and bowl (the flame stays on top); `pillar` has its origin on the floor at its centre, 10.5 m high, and replaces each pilaster.
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
