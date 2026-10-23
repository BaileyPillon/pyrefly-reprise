/**
 * THE CRITICAL STANCE BREATHES (conference demo, lane "pro-look"; Bailey 2026-10-22, markers "Classic, calm, clear": L1-A and L4-A "Pulse on the row + breathing pose"; review m2, 2026-10-23): a figure drawn
 * in the critical stance (the game's own low-HP painting: FFX's slouch, FFX-2's kneel, `BattlePresenterArt`'s `critical` pose) takes a slow, deeper breath, 3 percent of its height over 2.4 s (the book's numbers;
 * the idle's own is 1.6 percent over 1.8 s). Only while the pro look's `markers` piece is on (the two demo chapters, off by default), and never under REDUCE MOTION / LOW EFFECTS (the game's own row or the OS:
 * `eyeCandy.reduceMotion`, which "holds them still"). Both games: the stance is each game's own, the breath is the same. Shapes and numbers [ours].
 */
import { eyeCandy } from '../../fx/EyeCandy.ts';
import { proPieceOn } from './ProSwitch.ts';

/** The book's breath: an amplitude (fraction of the figure's height, either side) and a speed (cycles per second: one per 2.4 s). */
export const CRITICAL_BREATH = { amplitude: 0.03, speed: 1 / 2.4 } as const;

/** The breath a figure in this pose takes under the pro markers, or null (any other pose, the piece off, REDUCE MOTION). */
export function proCriticalBreath(pose: string): typeof CRITICAL_BREATH | null {
  return pose === 'critical' && proPieceOn('markers') && !eyeCandy.reduceMotion ? CRITICAL_BREATH : null;
}
