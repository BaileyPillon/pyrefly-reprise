import type { Object3D } from 'three';

/**
 * "This battle opens hurried" (PR-0061), handed from the battle screen to the scene (PR-0341).
 *
 * A player who skips the pre-battle scene (held Confirm, Escape, the pause menu's Skip Scene) gets the opening
 * collapsed: the camera cuts to `intro` and straight on to `idle` inside one tick, the party is simply there, every
 * wait in `BattleMoments.battleStart` is zero, and the first command menu follows the 0.7 s card
 * (`ui/common/transitions/openingHurry.ts`). A scene that stages its own arrival cannot see any of that: it watches
 * for a rendered frame on its `intro` rig, and the hurried opening never renders one.
 *
 * The Cavern of the Stolen Fayth is the one scene that waits (Yojimbo and Daigoro are held off the field until the
 * opening shot, or 9 s). Release 37 added the hurried opening, so a returning player's first menu opened 4 s after
 * the figures were staged, with both of them still invisible and a blue night-sakura arriving mid-turn six seconds
 * later (round 20, PR-0341; measured 6 of 6 runs at 1600x900 and 2000x1012, 0 of 6 on release 36).
 *
 * The mark rides on the Three scene's `userData`, as a scene's mid-battle entrances do
 * (`engine/StageArrivals.ts`): the battle screen marks it once the scene is loaded, before anything is staged; the
 * scene takes it when it first sees the fight's figures. One fight's worth, then it is gone: a retry, a chained
 * link and a run with no scene are not hurried.
 */
const KEY = 'openingHurried';

/** The battle screen: this battle's first opening runs hurried. */
export function markOpeningHurried(scene: Object3D): void {
  scene.userData[KEY] = true;
}

/** A scene that stages its own arrival: was the opening about to be hurried? True once; the answer is used up. */
export function takeOpeningHurried(scene: Object3D | null | undefined): boolean {
  if (!scene || scene.userData[KEY] !== true) return false;
  scene.userData[KEY] = false;
  return true;
}
