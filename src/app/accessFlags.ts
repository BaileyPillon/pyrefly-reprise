/**
 * The two ACCESSIBILITY settings, read live from the running save (PR-0032): REDUCE FLASHES and COLOUR VISION.
 *
 * `readSetting` falls back to the shipped default (both off) when no store exists (a HUD mounted in a unit
 * test, a browser with storage blocked), and these never throw, so a caller can ask on every frame or every
 * spawn. Same shape as `ui/common/transitions/reduceMotion.ts` for REDUCE MOTION, with no OS query: there is no
 * media feature for flashes, so the player's own row is the only source.
 *
 * Game case: both (shared plumbing).
 */

import { readSetting } from './SaveData.ts';
import { isColourVision, type ColourVision } from './saveAccess.ts';

/** REDUCE FLASHES: true only when the player turned it on. */
export function readReduceFlashes(): boolean {
  try {
    return readSetting('reduceFlashes') === true;
  } catch {
    return false;
  }
}

/** COLOUR VISION: the mode, `off` for anything unknown. */
export function readColourVision(): ColourVision {
  try {
    const v = readSetting('colourVision');
    return isColourVision(v) ? v : 'off';
  } catch {
    return 'off';
  }
}
