import type { RoomSpec } from './room.ts';
import { GAGAZET } from './gagazet.ts';
import { MACALANIA } from './macalania.ts';
import { BEVELLE } from './bevelle.ts';
import { DJOSE } from './djose.ts';

/** Option B's rooms, by scene key. A room not listed here gets nothing from option B. */
export const ROOMS: Readonly<Record<string, RoomSpec>> = {
  [GAGAZET.key]: GAGAZET,
  [MACALANIA.key]: MACALANIA,
  [BEVELLE.key]: BEVELLE,
  [DJOSE.key]: DJOSE,
};
