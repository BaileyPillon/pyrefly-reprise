/**
 * Battle transitions and moment chrome.
 *
 * Two things, both full-screen, both Ink & Gold:
 *
 * - {@link playBattleSwirl} — the spinning wipe the game drops into a battle
 *   through, and the ivory diagonal it comes back out of on the way to the
 *   results panel ({@link playResultsWipe}).
 * - {@link createMomentOverlay} — the letterbox bars, name slab and heartbeat
 *   vignette a *moment* raises over the field. It implements `MomentsPort`, so
 *   `src/engine/BattleMoments.ts` drives it without importing any DOM.
 *
 * `src/app/screens/BattleScreenFlow.ts` plays the transitions; the battle
 * screen owns the overlay's lifetime.
 */

import './transitions.css';
import { playWipe } from '../../inkgold/wipe.ts';
import type { GameId } from '../../../battle/common/types.ts';

export type { SwirlOptions } from './swirl.ts';
export { playBattleSwirl, buildSwirl, resolveSwirlOptions, DEFAULT_SWIRL_MS } from './swirl.ts';
export { MomentOverlay, createMomentOverlay } from './MomentOverlay.ts';

/**
 * Battle -> results. The spec's diagonal ivory wipe, mirrored for FFX-2
 * chapters the same way every other slab in the system is
 * (`presentation-ink-and-gold.md`, "Not mocked yet": "wipes at -19deg").
 */
export function playResultsWipe(
  root: HTMLElement,
  game: GameId,
  onCover?: () => void,
): Promise<void> {
  return playWipe(root, {
    direction: game === 'ffx2' ? 'rtl' : 'ltr',
    ...(onCover ? { onCover } : {}),
  });
}
