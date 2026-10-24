import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { BattleCamera } from '../../BattleCamera.ts';

/**
 * A ROOM'S DRESSING BUILT BEHIND THE PICKER AND ADOPTED BY THE BATTLE (r64-fixes, the conference demo, `?pack=demo`; both games: Chapter I FFX, Chapter IV FFX-2; on only with `?livingpre=on`, and then only where the fight prebuild is on).
 *
 * Option B "Living Paintings" dresses the room (the depth plates, the weather's fields, the haze, the lamps, the cast-shadow quads) when the battle binds it, and the programs of those materials link
 * on their first draw: `getProgramInfoLog` 47 to 93 ms, about four times, the 0.3 to 0.4 s and the 100 to 130 ms frames that the fight prebuild left over (`docs/handoff/fight-prebuild.md`, "What
 * remains" 1). The demo's warm builds a `Living` for the prebuilt scene the battle is going to take, behind the title and the picker, and draws its parts once; `bindLivingScene` then ADOPTS it when the
 * battle binds the same scene, camera, renderer and battle camera, and builds nothing of its own. A `Living` for anything else (another scene, a press that took a different scene) is disposed.
 *
 * One room at a time (a second park replaces the first). The `Figures` of a `Living` find the actors by walking the scene each frame, so the figures that are staged after the bind are found as they always were.
 */

/** The identity of what a parked room was built for: the battle adopts it only when its own bind is the same on every one. */
export interface ParkKey {
  key: string;
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer | undefined;
  battleCamera: BattleCamera;
}

/** What a parked room is, to the registry (the class is `LivingPaintings.Living`). */
export interface Parkable {
  dispose(): void;
  /** True once the room's build has finished at the tier now in force (and it has not been disposed). */
  whenBuilt(): Promise<boolean>;
  /** The drawables of the room (its group and its plate meshes), for the demo's one draw of their programs. */
  parts(): Object3D[];
}

/** Rooms are held per key: the fight the cursor rests on is not the only one the warm builds. */
const parked = new Map<string, { key: ParkKey; room: Parkable }>();

const sameKey = (a: ParkKey, b: ParkKey): boolean => a.key === b.key && a.scene === b.scene && a.camera === b.camera && a.renderer === b.renderer && a.battleCamera === b.battleCamera;

/** Hold `room` for the battle that will bind `key`. A room parked for the same scene key before is disposed. */
export function parkRoom(key: ParkKey, room: Parkable): void {
  parked.get(key.key)?.room.dispose();
  parked.set(key.key, { key, room });
}

/** The battle binds `key`: the room parked for exactly it, handed over (and no longer held here), else null; a room parked for the same scene key but anything else is disposed. */
export function takeParkedRoom<T extends Parkable>(key: ParkKey): T | null {
  const p = parked.get(key.key);
  if (!p) return null;
  parked.delete(key.key);
  if (sameKey(p.key, key)) return p.room as T;
  p.room.dispose();
  return null;
}

/** Dispose every room held (a page leaving, tests). */
export function dropParkedRooms(): void {
  for (const p of parked.values()) p.room.dispose();
  parked.clear();
}

/** How many rooms are held? (For the probe and the tests.) */
export function parkedRoomCount(): number {
  return parked.size;
}
