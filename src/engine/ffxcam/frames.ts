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
 * - **`height`** and **`width`** are the game's own `camHeight` and `camWidth` when the camera folder has them (`./extents.ts`: **Proven**, read from the `.chr` params block the engine's getters read): a recipe's look-at is raised by a fraction of the height and its eye stands a multiple of the width away, so with the game's numbers a shot frames a figure as the game's does. Without them
 *   (an older folder) they are measured on our own figures, the actor's height (the model's for the `ffx` skin, the painting's for the painted one) and the horizontal extent of its model or plane: **a fit**, and
 *   a wrong one for Evrae's height (more than twice the game's) and the party's widths (up to three times). The fixed-point shots (the default views, the attacks, Poison Breath, Photon Spray, the airship scenes) do not use them.
 *
 * Game case: FFX only.
 */

import { worldLengthToFfx, worldPointToFfx } from '../ffx3d/ffxWorld.ts';
import type { CharExtent } from './extents.ts';
import type { Box } from './framing.ts';
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
  /** The figure's body in the world (the scene's live measure, `../ffx3d/modelBox.ts`); null or absent: it is framed by its position, height and width. */
  box?(): { readonly min: readonly [number, number, number]; readonly max: readonly [number, number, number] } | null;
  /** False when the figure is not drawn (faded out in a range shift, hidden); absent means drawn. */
  readonly shown?: boolean;
}

/** One actor's frame in FFX's units and axes; `extent` is the game's own camHeight and camWidth for it, when known (else the figure's measured size stands in). */
export function frameOf(actor: CameraActor, extent?: CharExtent): ActorFrame {
  return {
    pos: worldPointToFfx([actor.position.x, actor.position.y, actor.position.z]),
    heading: actor.facingDir === -1 ? Math.PI : 0,
    height: extent ? extent.height : worldLengthToFfx(actor.height),
    width: extent ? extent.width : worldLengthToFfx(actor.width),
  };
}

/** The figure's box in FFX's frame (Y down): its live body when the scene can say where it is, else a column over its position as wide as its width and as tall as its height. For the tracking net. */
export function boxOf(actor: CameraActor): Box {
  const live = actor.box?.();
  const p = actor.position;
  const half = actor.width / 2;
  const w = live ?? { min: [p.x - half, p.y, p.z - half] as const, max: [p.x + half, p.y + actor.height, p.z + half] as const };
  const a = worldPointToFfx([w.min[0], w.min[1], w.min[2]]);
  const b = worldPointToFfx([w.max[0], w.max[1], w.max[2]]);
  return { min: [a[0], b[1], b[2]], max: [b[0], a[1], a[2]] }; // the transform flips y and z, so the box's min and max swap on those axes
}

/** The host's live frame source: a character number to its actor's frame (through the roster), undefined for a character with no actor on the field. Read on every query, so a moving actor is followed. */
export function frameSource(roster: readonly RosterEntry[], actorOf: (id: string) => CameraActor | undefined, extentOf?: (chr: number) => CharExtent | undefined): (chr: number) => ActorFrame | undefined {
  const idOf = new Map(roster.map((e) => [e.chr, e.id] as const));
  return (chr) => {
    const id = idOf.get(chr);
    const actor = id === undefined ? undefined : actorOf(id);
    return actor ? frameOf(actor, extentOf?.(chr)) : undefined;
  };
}
