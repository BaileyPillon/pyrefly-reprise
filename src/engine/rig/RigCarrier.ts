/**
 * The private parts of a {@link PaintedActor} a rig needs (the house habit of `ffx3d/ffxSkin.ts`, pinned by `tests/unit/rig-carrier.test.ts` so a rename in
 * `PaintedActor.ts` fails a test instead of drawing nothing).
 *
 * A rigged figure IS a `PaintedActor` (`RigActor extends PaintedActor`) that loaded only its idle painting and draws no plane: the "carrier". The rig borrows
 * from it exactly five things, all read here:
 *   - `inner`: the group every procedural motion lands on (lunge, recoil, hop, shake, squash, breath, sway, lean, KO fall, yaw). Parts parent there, so they ride
 *     the stage's motion the way the plane does;
 *   - `slots` and `active`: the idle plane's mesh, whose size, place, mirror and tip the rig plane copies each frame, and whose `contactBand` and `texel` it shares;
 *   - `u`: the uniform cells (flash, tint, rim, bounce, dissolve, dim ...) the parts' materials share by reference;
 *   - `noteViewCamera`: how the camera's azimuth reaches the interim yaw, which the (never drawn) plane would have supplied on its way to the renderer;
 *   - `life`: the state a refused pose request is judged against (a body on the ground does not wince).
 */
import type { Camera, Group, Mesh, ShaderMaterial } from 'three';
import type { PaintedActor } from '../PaintedActor.ts';

export interface CarrierSlot {
  mesh: Mesh;
  material: ShaderMaterial;
  pose: string;
  /** The painting's pixel size (its sidecar): the rig checks its image has the same aspect. */
  meta: { width: number; height: number };
}

export interface CarrierInternals {
  inner: Group;
  slots: [CarrierSlot, CarrierSlot];
  active: number;
  /** The life layer (`ActorLife`), null when the actor was built with `life: false`. */
  life: { state: string } | null;
  u: Record<string, { value: unknown }>;
  noteViewCamera(camera: Camera): void;
}

export const carrierOf = (a: PaintedActor): CarrierInternals => a as unknown as CarrierInternals;

/** The slot whose mesh is the idle plane the rig is mapped onto (the one the actor shows; both hold the idle). */
export const idleSlot = (c: CarrierInternals): CarrierSlot => c.slots[c.active]!;
