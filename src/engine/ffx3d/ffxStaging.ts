/**
 * **Where FFX stands the Evrae fight, and where its camera looks from, in our world** (the hidden Fayth chapter; FFX only; `docs/plans/fayth-3d.md`). The numbers are FFX's own, in FFX's own frame
 * (y down, see `./ffxWorld.ts`), and are mapped through that one transform, so the `ffx` skin (Bailey's own models), the painted skin at FFX's staging and the camera replay stand and look at the same points.
 *
 * ## Sources (record, not retail data)
 *
 * - **Stand points**: the formation `hiku15_00`'s first area record, read from the Steam HD copy by the camera-programs lane (`D:\Tools\ffx-parity\camera\programs\evrae\POSITIONS.json`): the party's three
 *   slots, Evrae at NEAR (its position 0) and at FAR (position 3). The PS2 capture of the same fight agrees (Evrae `(-140, -35, 80)`; the middle party slot `(-20, -35.86, 80)`, the extra 0.86 being the PS2
 *   walkmesh height). Which character stands in which slot is the formation's rule for fewer than three members and is **Open** there; here a character stands in the slot of its own place in the active party
 *   (Tidus, Wakka, Rikku: slots 0, 1, 2), which is how the engine already numbers them.
 * - **Default views**: the formation's default-view program (`hiku15_00.w3.f3`, SPEC 4 and `INDEX.json defaultViews`): the NEAR view and the FAR view, a hard cut by the airship's distance. The NEAR view's eye
 *   reproduces the PS2 capture to 0.01. They are the numbers of the script (`-258.47623`, not the four-decimal `-258.4762`).
 * - Phase 4's shot table (`src/data/ffx/camera/`) supersedes these two views when it lands; until then the scene publishes them as its `idle` rigs so the first pictures are FFX's own framing.
 *
 * Pure: `three` math only. Game case: FFX only.
 */

import { Vector3 } from 'three';
import { ffxPoint, ffxPointTuple, ffxRig, type FfxView, type Vec3, type WorldRig } from './ffxWorld.ts';

/** The party's three active slots, FFX frame. Slot 0 stands nearest the NEAR camera (z 120), slot 2 farthest (z 40). */
export const FFX_PARTY_SLOTS: readonly Vec3[] = [
  [-25, -35, 120],
  [-20, -35, 80],
  [-15.000015, -35, 40],
];

/** Evrae's two stand points, FFX frame: NEAR (position 0) and FAR (position 3). Cid stands on NEAR's too, as in Chapter VIII (he is never drawn). */
export const FFX_EVRAE_SPOTS = { near: [-140, -35, 80], far: [-850, -35, 80] } as const satisfies Record<string, Vec3>;

/** The NEAR default view: look-at, then the eye at `len` 342 on a yaw of -258.47623 and a pitch of -17.194778 degrees (above), the 1024 lens (26.38 degrees). */
export const FFX_NEAR_VIEW: FfxView = { ref: [-30.698517, -34.989685, 13.512146], thetaDeg: -258.47623, phiDeg: -17.194778, len: 342, scrDpt: 1024 };

/** The FAR default view: the camera on the other side of the ship, looking back along it. */
export const FFX_FAR_VIEW: FfxView = { ref: [87, -55, 55], thetaDeg: -105.99998, phiDeg: -6, len: 250, scrDpt: 1024 };

/**
 * **Which parts of the converted stage the battle draws, and which stand upside down in the file** (found by comparing renders with PS2 captures of the same view; no source states it). The converted stage
 * is the whole airship exterior of the field map `hiku15` (97 meshes: the ring, the tower and cage, the bridge, the wings, the deck). Placed as the converter places it (x10, no offset, in the walkmesh's frame),
 * the near default camera sits **inside** that superstructure and the party stands under a roof, while the real frame shows the party on a pale, smooth, domed hull with a flat plate beside them and a dark box
 * at the bottom-left corner, with open sky and cloud all around. What reproduces that frame, and why:
 *
 * - **The deck** is the pale panelled hull-top (`polySurfaceShape5_*`, the ice-shaded sheet) with its plate (`FBXASC048_Shape0_1`) and its dark ridge (`FBXASC048_Shape0_3`). Under the party it lies at the
 *   walkmesh's height with the **sign reversed** (to 0.3 FFX units at each of the three slots); the deck's own normals point down for the same reason. A mirror of the deck about y = 0 puts its surface on the
 *   party's feet and gives the dome, the plate and the box where the capture has them. So the deck is **mirrored in y** (`flipped`).
 * - **Everything above it is not drawn**: the ring, the tower, the cage, the bridge, the roof plates. Mirrored with the deck they would stand around the camera, and the capture shows none of them. The other
 *   meshes are hidden, not removed.
 * - **The sky bowl** (`FBXASC0490_*`: the cloud floor and the horizon band) is drawn as it is, riding the camera.
 *
 * The names are the converter's (glTF mesh names, one per primitive); a name that does not match draws nothing, so a re-converted file that renames them draws no stage rather than a wrong one. **Open**: the
 * lateral registration is verified only by the walkmesh's outline and by this one frame (a few world units of slack), and nothing says whether the real game mirrors these meshes or draws others instead.
 */
export const FFX_STAGE_PARTS = {
  flipped: [/^polySurfaceShape5_\d+$/, /^FBXASC048_Shape0_[13]$/],
  sky: [/^FBXASC0490_\dShape$/],
} as const;

/** How much brighter the sky bowl's material is drawn than its texture and vertex colour say: the stage's cloud floor is dark navy as the file stores it and the capture's is pale lavender (**an estimate**, Open: 6 turns the file's navy into the capture's slate; the capture's lavender cloud texture is not in the converted file). */
export const FFX_SKY_GAIN = 6;

/**
 * **Not FFX's**: a wide three-quarter view of the whole fight for the first pictures (the deck, the party and Evrae together, for scale), in FFX's frame and the polar rule so it reads like the others. It
 * is the scene's `overview` rig (`__pyrefly.shot('overview')`) and no part of FFX's camera.
 */
export const FFX_OVERVIEW_VIEW: FfxView = { ref: [-146, -30, 110], thetaDeg: -250, phiDeg: -22, len: 700, scrDpt: 724 };

/**
 * The four reserve spots (`SceneBuild.partySlots` holds seven): where a character not in the fight waits, off the deck behind the party, away from Evrae. FFX numbers, nothing of its own: they are never
 * stood on (only the first three are published as the party's slots), they exist so a switched-in character has somewhere to come from.
 */
const FFX_RESERVE_SPOTS: readonly Vec3[] = [
  [30, -35, 140],
  [45, -35, 100],
  [60, -35, 60],
  [75, -35, 20],
];

/** The rig names the scene publishes and the NEAR / FAR range director installs. */
export type FfxRangeName = 'near' | 'far';

/** What the scene hands the camera, the stage and the range director, all in the world. */
export interface FfxStaging {
  /** Seven party slots: the three active ones at FFX's slots, then the reserve spots. */
  readonly partySlots: Vector3[];
  /** Two enemy slots (Evrae, Cid): both at NEAR, as Chapter VIII's table stacks them. */
  readonly enemySlots: Vector3[];
  /** Evrae and Cid pinned on NEAR (`SceneStaging.enemySpots`), so the formation solver and the relax step leave them. */
  readonly enemySpots: { evrae: [number, number, number]; cid: [number, number, number] };
  /** Evrae's stand point per range, world. */
  readonly spots: Readonly<Record<FfxRangeName, [number, number, number]>>;
  /** FFX's two default views as world rigs: what `idle` (and `action`, `enemy`, `intro`, `party`, `victory`) is while that range holds. */
  readonly views: Readonly<Record<FfxRangeName, WorldRig>>;
  /** The wide view of the whole fight ({@link FFX_OVERVIEW_VIEW}): not FFX's. */
  readonly overview: WorldRig;
}

/** The staging of the fight in the world. Fresh objects each call: the caller may keep and mutate them. */
export function ffxFaythStaging(): FfxStaging {
  const near = ffxPointTuple(FFX_EVRAE_SPOTS.near);
  const far = ffxPointTuple(FFX_EVRAE_SPOTS.far);
  return {
    partySlots: [...FFX_PARTY_SLOTS, ...FFX_RESERVE_SPOTS].map((p) => ffxPoint(p)),
    enemySlots: [ffxPoint(FFX_EVRAE_SPOTS.near), ffxPoint(FFX_EVRAE_SPOTS.near)],
    enemySpots: { evrae: [...near], cid: [...near] },
    spots: { near, far },
    views: { near: ffxRig(FFX_NEAR_VIEW), far: ffxRig(FFX_FAR_VIEW) },
    overview: ffxRig(FFX_OVERVIEW_VIEW),
  };
}
