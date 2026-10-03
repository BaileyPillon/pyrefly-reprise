import type { RoomSpec } from './room.ts';

/**
 * A-7 "Backdrops with a floor and a sky" for the rooms whose painting is a far backdrop: the depth plates, the
 * camera drift and the plate defocus (LIVING PAINTINGS), and nothing else. The plates are cut from each
 * painting's own pixels by its derived depth map (`public/fx/<scene>/depth.png`, `tools/fx/depth.py`), so
 * at rest the stack composites back to the approved PNG (`plateMaths.compositeAtRest`).
 *
 * What a room may float in its air is the pyrefly canon table's call (A-6), so these rooms carry no lamps, weather, haze,
 * cast shadows or sway (`platesOnly`). Thresholds are read off each room's depth map (`D:/Tools/pyrefly-scratch/2026-10-03/
 * r37-living-backdrops/cuts-sheet.jpg`); the plates stand 10, 22 and 34 units in front of the painting, so the nearest is at
 * least 12 units behind the fighters (Via Purifico, whose painting stands at -20 like Macalania's, takes Macalania's z, -16, -11.5, -6).
 *
 * Not here: the Farplane (V). `farplane-colossus.ts` grows and lifts the painting meshes (`COLOSSUS_BACKDROP`) during
 * the colossus links, and plates cut once at load would stay behind (seen at the drift extreme: the plate stack sits 230 px
 * off the painting). It needs the plates to follow that transform first.
 *
 * Game case: each room is its own game's (FFX rooms drift at the tuned periods, FFX-2 rooms at 0.8 of them).
 */
function platesRoom(key: string, game: 'ffx' | 'ffx2', distance: number, thresholds: number[], z?: number[]): RoomSpec {
  const blur = 3;
  const zs = z ?? [distance + 10, distance + 22, distance + 34].slice(0, thresholds.length);
  return {
    key,
    game,
    platesOnly: true,
    plates: { thresholds, z: zs, soft: 0.015, blur, width: 2048 },
    phonePlates: { thresholds: [thresholds[1]!], z: [zs[1]!], soft: 0.015, blur: 2, width: 1024 },
    lamps: {},
    fields: [],
    haze: [],
    shadow: { key: [0, 6, 0], length: 0, opacity: 0, color: 0 },
  };
}

/** Chapter II, Zanarkand Dome (FFX; painting at z -56). */
export const ZANARKAND_DOME = platesRoom('zanarkand-dome', 'ffx', -56, [0.14, 0.2, 0.32]);
/** Chapter III, Dream's End (FFX; z -50). */
export const DREAMS_END = platesRoom('dreams-end', 'ffx', -50, [0.03, 0.07, 0.12]);
/** Chapter XII, the Garden of Pain (FFX; z -50). */
export const GARDEN_OF_PAIN = platesRoom('garden-of-pain', 'ffx', -50, [0.05, 0.3, 0.68]);
/** Chapter VI, Leblanc's last room (FFX-2; z -47). */
export const LEBLANC_LAST_ROOM = platesRoom('leblanc-last-room', 'ffx2', -47, [0.1, 0.14, 0.26]);
/** Chapter XIII, the Via Infinito (FFX-2; z -50). */
export const VIA_INFINITO = platesRoom('via-infinito', 'ffx2', -50, [0.07, 0.14, 0.22]);
/** Chapter XIV, the Via Purifico (FFX; the painting stands at z -20 like Macalania's, so its plates take Macalania's z). */
export const VIA_PURIFICO = platesRoom('via-purifico', 'ffx', -20, [0.21, 0.32, 0.42], [-16, -11.5, -6]);
/** Chapter XV, the Den of Woe (FFX-2; z -48). */
export const DEN_OF_WOE = platesRoom('den-of-woe', 'ffx2', -48, [0.03, 0.23, 0.63]);
