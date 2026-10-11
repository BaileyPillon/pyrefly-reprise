/**
 * **Actor frames for the camera**: what the replayed programs read of a live character (`./host.ts`'s `ActorFrame`), made from the battle's actors. The programs speak FFX's units and axes
 * (`../ffx3d/ffxWorld.ts`), the scene's actors stand in the world, so a frame is the actor's world position mapped back through the inverse of the one transform, with the actor's facing, height and width.
 *
 * What each number is, and how sure it is (`SPEC.md` 4.6; the camera lane marks all four **Open** as game data):
 *
 * - **`pos`** is the actor's own position (its stand point: the feet of a party member, the chosen origin of Evrae's model), which the presenter moves with the lunge, the hop and the recoil, so a shot
 *   that follows a character follows the figure. The recipes raise it by a fraction of the height (`hfac`, most often 50 to 140 percent), which reads right with the feet as the base. Not a sampled value.
 * - **`heading`** is the way the body faces, radians in FFX's (x, z) plane (forward = (cos h, 0, sin h)): the party faces Evrae along -x (`pi`), Evrae faces the party along +x (0), as the scene stands them
 *   (`SceneStaging.sideFacing`); the presenter never turns a body.
 * - **`height`** and **`width`** are the figure's extents in FFX units: the actor's height (the model's, for the `ffx` skin; the painting's for the painted skin) and the horizontal extent of its model or
 *   of its painted plane. FFX's own are the model's extents times the actor's scale floats (`camHeight`, `camWidth`); ours are measured on our own figures, so a shot that is sized by them (a spell's radius
 *   is a multiple of the target's width) differs a little from FFX's. The fixed-point shots (the default views, the attacks, Poison Breath, Photon Spray, the airship scenes) do not use them.
 *
 * Game case: FFX only.
 */

import { worldLengthToFfx, worldPointToFfx } from '../ffx3d/ffxWorld.ts';
import type { ActorFrame } from './host.ts';
import type { RosterEntry } from './formation.ts';

/** What the camera reads of a battle actor, in world units (a `PaintedActor`, or a test's stand-in). */
export interface CameraActor {
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  /** Which way the body faces along x: -1 toward -x (the party), 1 toward +x (Evrae). */
  readonly facingDir: 1 | -1;
  /** How tall it stands and how wide it spreads, world units. */
  readonly height: number;
  readonly width: number;
}

/** One actor's frame in FFX's units and axes. */
export function frameOf(actor: CameraActor): ActorFrame {
  return {
    pos: worldPointToFfx([actor.position.x, actor.position.y, actor.position.z]),
    heading: actor.facingDir === -1 ? Math.PI : 0,
    height: worldLengthToFfx(actor.height),
    width: worldLengthToFfx(actor.width),
  };
}

/** The host's live frame source: a character number to its actor's frame (through the roster), undefined for a character with no actor on the field. Read on every query, so a moving actor is followed. */
export function frameSource(roster: readonly RosterEntry[], actorOf: (id: string) => CameraActor | undefined): (chr: number) => ActorFrame | undefined {
  const idOf = new Map(roster.map((e) => [e.chr, e.id] as const));
  return (chr) => {
    const id = idOf.get(chr);
    const actor = id === undefined ? undefined : actorOf(id);
    return actor ? frameOf(actor) : undefined;
  };
}
