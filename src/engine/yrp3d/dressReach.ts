/**
 * **Which dresspheres a girl can change into next** (the hidden 3D Bahamut chapter, FFX-2 only; `./dressLib.ts` warms them). The engine lets a girl spherechange only to a dressphere **one link away** on her Garment Grid
 * (`battle/ffx2/menu.ts`: `adjacentNodes` over the grid, with the dresspheres in the nodes `gridNodeContents` lays out from her build), so the models worth having ready are those neighbours, not all she owns. This asks the engine's
 * own functions, over the party's build, so the answer is the one the Change submenu will give: Yuna in White Mage on the Protection Halo (five nodes in a ring) can reach her two neighbours; after she has changed, her new
 * node's. Pure: no `three`, no DOM (it reads the battle engine's data only).
 */

import type { FFX2MemberBuild } from '../../battle/common/types.ts';
import { adjacentNodes, defaultGarmentGrids } from '../../battle/ffx2/garment-grids.ts';
import { gridNodeContents } from '../../battle/ffx2/setup.ts';
import type { GarmentGridDef, GarmentGridRegistry } from '../../battle/ffx2/internal.ts';
import type { Girl } from './dress.ts';

/** `(girl, dressphere worn now) -> the dresspheres she can change into from it`, from the party's build as the battle starts it. A girl the build lacks, or a dressphere not on her grid, reaches none. */
export function reachFor(members: readonly FFX2MemberBuild[], grids: GarmentGridRegistry = defaultGarmentGrids): (girl: Girl, current: string) => string[] {
  const laid = new Map<string, { grid: GarmentGridDef; contents: Array<string | null> }>();
  for (const m of members) {
    const grid = grids.get(m.garmentGrid.id);
    if (grid) laid.set(m.id, { grid, contents: gridNodeContents(m, grid.nodes) });
  }
  return (girl, current) => {
    const one = laid.get(girl);
    if (!one) return [];
    const at = one.contents.indexOf(current);
    if (at < 0) return [];
    return adjacentNodes(one.grid, at)
      .map((a) => one.contents[a.node])
      .filter((d): d is string => typeof d === 'string' && d !== current);
  };
}
