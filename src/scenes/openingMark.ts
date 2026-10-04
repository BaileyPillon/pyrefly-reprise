import type { Object3D } from 'three';

/**
 * "This battle opens hurried" (PR-0061), handed from the battle screen to the scene (PR-0341), and "the opening begins
 * now" (FOC371-01).
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
 * Release 37.1 cured that by never playing the arrival on a hurried opening, which also took away the approved
 * night-sakura moment from every player who skips the scene (focused review of f4244e1f, FOC371-01: Bailey's recorded
 * words on the chamber tile say it plays at the start of the fight). So a hurried opening has a second mark: the
 * battle screen raises it the moment the card is gone and the (collapsed) opening begins, which is the moment a full
 * opening would have put the camera on its `intro` rig, and the scene starts a compressed arrival from it.
 *
 * The marks ride on the Three scene's `userData`, as a scene's mid-battle entrances do (`engine/StageArrivals.ts`): the
 * battle screen marks it once the scene is loaded, before anything is staged (hurried) and when the card is gone
 * (begun); the scene takes each when it first sees the fight's figures and on every frame while it waits. One fight's
 * worth, then they are gone: a retry, a chained link and a run with no scene are not hurried.
 */
const KEY = 'openingHurried';
const BEGUN = 'openingBegun';

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

/** The battle screen: the card is gone and the opening begins now (a hurried one collapses inside a tick). */
export function markOpeningBegun(scene: Object3D): void {
  scene.userData[BEGUN] = true;
}

/** A scene that stages its own arrival: has the opening begun? True once; the answer is used up. */
export function takeOpeningBegun(scene: Object3D | null | undefined): boolean {
  if (!scene || scene.userData[BEGUN] !== true) return false;
  scene.userData[BEGUN] = false;
  return true;
}
