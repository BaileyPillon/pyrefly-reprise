import type { Object3D } from 'three';
import type { PlaybackSpeed } from '../engine/BattlePresenterPorts.ts';
import { SPEED_SCALE } from '../engine/BattlePresenterUtil.ts';

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
const PLAYBACK = 'openingPlayback';

/** What a hurried arrival asks of the presenter, live: how fast the fight plays now, and whether a command menu is up. */
export interface OpeningPlayback {
  speed: PlaybackSpeed;
  menu: boolean;
}

/**
 * `skip` collapses every wait to zero (`SPEED_SCALE.skip` is 0), so a hurried arrival's clock must finish in the first
 * frame: one real millisecond is worth more of the arrival's own than its whole timeline (5.8 s).
 */
export const SKIP_PACE = 1e6;

/**
 * Once a command menu is up nothing plays behind it: the arrival's clock runs at least this fast, so even a whole 5.8 s
 * timeline (twice this, with `HURRIED_ARRIVAL_SPEED`) is over in about 90 ms, a dissolve of a few frames, not a pop.
 */
export const MENU_PACE = 32;

/**
 * The battle screen: this battle's first opening runs hurried. `playback` reads the presenter live (a player can
 * fast-forward mid-arrival, and the first menu opens at no fixed time), so the scene's compressed arrival follows it
 * (FOC371-01 at fast and skip).
 */
export function markOpeningHurried(scene: Object3D, playback?: () => OpeningPlayback): void {
  scene.userData[KEY] = true;
  if (playback) scene.userData[PLAYBACK] = playback;
}

/**
 * A scene that stages a hurried arrival: how many times faster than its own compressed clock to run it right now, to
 * match the presenter. The opening obeys the playback speed (every wait times `SPEED_SCALE`, fast 0.32, skip 0), and the
 * first menu opens 0.6 to 1.7 s after the card at fast and 0.2 to 1.3 s after it at skip, while a compressed arrival that
 * stayed on the wall clock was still on screen after that menu at fast (1.1 to 1.4 s of night and tree) and still bringing
 * Yojimbo and Daigoro in at it at skip (r38-polish check, disclosure 1). So the clock runs at the reciprocal of the
 * presenter's factor: 1 at normal speed, 3.125 at fast, and at skip the arrival ends in one frame (the figures simply
 * there, as on 37.1). The gap to the menu varies too much for a speed alone to promise the arrival is over by then, so a
 * menu that is up takes the pace to at least {@link MENU_PACE}. 1 when the screen sent nothing. Only a hurried fight
 * asks: a full opening's clock is untouched.
 */
export function hurriedArrivalPace(scene: Object3D | null | undefined): number {
  const read: unknown = scene?.userData[PLAYBACK];
  const now = typeof read === 'function' ? (read as () => OpeningPlayback)() : null;
  const scale = SPEED_SCALE[now?.speed ?? 'normal'] ?? 1;
  const pace = scale > 0 ? 1 / scale : SKIP_PACE;
  return now?.menu === true ? Math.max(pace, MENU_PACE) : pace;
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
