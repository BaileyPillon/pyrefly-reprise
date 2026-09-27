/**
 * The player's reduce-motion choice for the battle's camera moves and entry
 * transitions (A-13 roll, A-2 battle entry; both games): the pause's setting,
 * or the OS preference, as the title screen reads it (`TitleScreen.ts`).
 * DOM-side, so the presenter asks through `MomentsPort.reduceMotion`.
 */

import { readSetting } from '../../../app/SaveData.ts';

export function prefersReducedMotion(view: (Window & typeof globalThis) | null = typeof window === 'undefined' ? null : window): boolean {
  let setting = false;
  try {
    setting = readSetting('reduceMotion') === true;
  } catch {
    /* no store: the OS preference decides */
  }
  if (setting) return true;
  try {
    return typeof view?.matchMedia === 'function' && view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
