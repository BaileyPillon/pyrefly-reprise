/**
 * Light on the paintings, moved out of `LookRig.ts` unchanged (pro-look review m1, 2026-10-23: the rig had grown past the house size of 400 lines): the figures lit with their normal maps (hd2d and cinematic;
 * anime stays flat): a key from the room's light, a rim from behind, coloured lights for spells and the orb. Both games' plumbing.
 */
import type { Camera, Vector2 } from 'three';
import { relightParams, roomBold } from './LookBoldConfig.ts';
import type { LookName } from './LookConfig.ts';
import { lightColour } from './LookMaths.ts';
import { lin, type LookRoom } from './LookRoom.ts';
import { lookState } from './LookState.ts';
import { relightCells } from './relight/FigureRelight.ts';
import { keyDirection, rimDirection } from './relight/RelightConfig.ts';
import type { RelightLights } from './relight/RelightLights.ts';

/** What the relight reads from the rig: the room, the lights, the clock and the rig's tweak lookup (a live override, else the pro arena's own number). */
export interface RelightInput {
  room: LookRoom;
  lights: RelightLights;
  clock: number;
  tw: (path: string) => number | undefined;
}

/** Light on the paintings (see the module note): writes the relight cells and updates the lights. */
export function applyRelight(i: RelightInput, name: LookName, lightUv: Vector2, aspect: number, camera: Camera): void {
  const rl = relightParams(name, lookState.strength);
  const c = relightCells;
  if (!rl) {
    c.relightAny.value = 0;
    i.lights.remove();
    return;
  }
  const p = { ...rl, key: i.tw('relight.key') ?? rl.key, rim: i.tw('relight.rim') ?? rl.rim, point: i.tw('relight.point') ?? rl.point };
  const tw = lookState.tweaks;
  i.lights.install();
  const from: [number, number] = [0.5, 0.34];
  c.relightKeyDir.value.set(...keyDirection([lightUv.x, lightUv.y], from, aspect, p.keyZ));
  c.relightRimDir.value.set(...rimDirection([lightUv.x, lightUv.y], from, aspect, p.rimZ));
  c.relightKeyCol.value.set(...lin(lightColour(i.room.light.color)));
  const bRim = lookState.strength === 'bold' ? roomBold(i.room.key).rim : undefined; // bold: the room's key colour, saturated
  c.relightRimCol.value.set(...lin(bRim ?? lightColour(i.room.light.color, 0.12)));
  c.relightKey.value.set(p.key, p.keyTint, p.gainMin, p.gainMax);
  c.relightRimAmt.value = p.rim;
  c.relightAspect.value = aspect;
  c.relightAny.value = tw['relight.off'] ? 0 : 1;
  i.lights.update(i.clock, camera, p);
}
