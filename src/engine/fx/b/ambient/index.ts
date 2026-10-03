import type { RoomSpec } from './room.ts';
import { GAGAZET } from './gagazet.ts';
import { MACALANIA } from './macalania.ts';
import { BEVELLE } from './bevelle.ts';
import { DJOSE } from './djose.ts';
import { DEN_OF_WOE, DREAMS_END, GARDEN_OF_PAIN, LEBLANC_LAST_ROOM, VIA_INFINITO, VIA_PURIFICO, ZANARKAND_DOME } from './plateRooms.ts';

/** Option B's rooms, by scene key. A room not listed here gets nothing from option B. */
export const ROOMS: Readonly<Record<string, RoomSpec>> = {
  [GAGAZET.key]: GAGAZET,
  [MACALANIA.key]: MACALANIA,
  [BEVELLE.key]: BEVELLE,
  [DJOSE.key]: DJOSE,
  // A-7: plates, drift and defocus only (`platesOnly`), for the far-backdrop rooms.
  [ZANARKAND_DOME.key]: ZANARKAND_DOME,
  [DREAMS_END.key]: DREAMS_END,
  [GARDEN_OF_PAIN.key]: GARDEN_OF_PAIN,
  [LEBLANC_LAST_ROOM.key]: LEBLANC_LAST_ROOM,
  [VIA_INFINITO.key]: VIA_INFINITO,
  [VIA_PURIFICO.key]: VIA_PURIFICO,
  [DEN_OF_WOE.key]: DEN_OF_WOE,
};
