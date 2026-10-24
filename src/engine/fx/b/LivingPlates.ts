import type { Group, WebGLRenderer } from 'three';
import { artUrl } from '../../PaintedArt.ts';
import { eyeCandy, type FxTier } from '../EyeCandy.ts';
import { precutPlates, type PlateBuildOptions, type PlateLayout } from './DepthPlates.ts';
import { ROOMS } from './ambient/index.ts';
import { roomPlays } from './ambient/room.ts';
import type { RoomSpec } from './ambient/room.ts';
import { prebuildGate } from '../../PrebuildGate.ts'; // lane "prebuild": the plates are composed from the painting plane's own texture
import type { LivingBind } from './LivingPaintings.ts';

/**
 * The plates of Option B "Living Paintings", asked for (moved out of `LivingPaintings.ts` unchanged in r64-fixes so that file stays under 400 lines, rule 7): what a room's plates are built from, and the
 * demo's CPU half of that build made ahead.
 */

/** What a room's plates are built from at a tier: the depth map's address, the layout and the options. One function for the build and for the demo's warm, so the cut made ahead is the cut the build asks for. */
export function platesRequest(room: RoomSpec, tier: FxTier, renderer: WebGLRenderer | null | undefined): { url: string; layout: PlateLayout; opts: PlateBuildOptions } {
  return { url: artUrl(`fx/${room.key}/depth.png`), layout: tier === 'full' ? room.plates : room.phonePlates, opts: { renderer: renderer ?? null, native: tier === 'full', shareMaster: prebuildGate() } };
}

/**
 * Release 62 (PR-0481, the conference demo): do the CPU half of this room's plate build NOW, behind the picker, and keep it for the battle's own build (`DepthPlates.precutPlates`). It asks for exactly what
 * `Living.build` will ask for, under the same conditions (the room is one option B dresses, option B is on, this tier plays it), and does nothing otherwise. Binds nothing and touches no singleton: the
 * scene it is given is the one the battle will take. True when a cut is held for the build.
 */
export async function warmLivingPlates(a: Pick<LivingBind, 'key' | 'scene' | 'renderer'>): Promise<boolean> {
  const room = ROOMS[a.key];
  if (!room || !roomPlays(room, eyeCandy.enabled('b'), eyeCandy.tier)) return false;
  const group = a.scene.getObjectByName('backdrop') as Group | undefined;
  if (!group) return false;
  const { url, layout, opts } = platesRequest(room, eyeCandy.tier, a.renderer);
  return precutPlates(group, url, layout, opts);
}
