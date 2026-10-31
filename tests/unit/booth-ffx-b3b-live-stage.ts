/**
 * WHERE THE LIVE GAME STANDS THE PARTY (release 71, branch `booth-ffx-b3b`, review m1; FFX only). The lane first read its focus, its camera and its look evidence at the scenes' own party slots; the live game moves the party on top of them
 * (CHAPTER FRAMING, `fx/mix/stageTable.ts`, on by default for FFX on a desktop: Chapter XII's row stands Tidus, Yuna and Auron 1.5 to 2 units back and apart, Chapter III's moves the party right, Chapter XIV has no row). This reads the move through the real
 * `standFor` and `sideShift` from the scene's resting (`idle`) rig, for one combatant id, so a test needs no hand-copied number. Helper only: no test of its own.
 */
import { Vector3 } from 'three';
import { sideShift, standFor } from '../../src/engine/fx/mix/stageTable.ts';
import type { CameraRig } from '../../src/engine/BattleCamera.ts';

export type V3 = [number, number, number];

const asVector = (p: CameraRig['position']): Vector3 => (Array.isArray(p) ? new Vector3(p[0], p[1], p[2]) : (p as Vector3).clone());

/** The feet of a party member the live game stands where the scene's slot is, moved by the chapter's CHAPTER FRAMING row (the fight is found by one of its foes' combatant ids, as the framing finds it); the slot itself where the chapter has no row. */
export function liveFeet(foe: string, rig: CameraRig, slot: readonly [number, number, number], member: string): V3 {
  const row = standFor('ffx', [foe], false);
  if (!row) return [slot[0], slot[1], slot[2]];
  const side = sideShift(row.slots, { pos: asVector(rig.position), look: asVector(rig.lookAt), fov: rig.fov ?? 32 }, row.boss);
  const s = side.partyBy?.find((p) => p.id.test(member))?.shift ?? side.party;
  return [slot[0] + s.dx, slot[1], slot[2] + s.dz];
}
