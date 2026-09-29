/**
 * **Advisor v4's switch, per game** (docs/handoff/advisor-v4.md).
 *
 * - `ADVISOR_V4_FFX`: the look-ahead runs in a Web Worker behind the FFX card. ON since 2026-09-29,
 *   at the `mini` budget on every device: every FFX chapter scored equal or better than v3 through
 *   the worker path, Chapter III's fork-tested lethal saves match v3's (0), and the menu's open
 *   latency did not grow (the handoff's "SWITCHED ON" section has the numbers).
 * - `ADVISOR_V4_FFX2`: off. FFX-2 stays on v3 until its own window (a girl's time on the top list)
 *   is measured in the browser (method check §6.6).
 *
 * Game case: FFX on, FFX-2 off (AGENTS.md rule 14: the window differs by game, CTB against ATB).
 */

import type { GameId } from '../../../battle/common/types.ts';

export const ADVISOR_V4_FFX = true;
export const ADVISOR_V4_FFX2 = false;

/**
 * A measurement override, read once per battle: `globalThis.__pyreflyAdvisorV4Force` set to
 * `true` or `false` by a timing script before the battle starts. Nothing in the game sets it.
 */
export function advisorV4On(game: GameId): boolean {
  const force = (globalThis as { __pyreflyAdvisorV4Force?: unknown }).__pyreflyAdvisorV4Force;
  if (game !== 'ffx') return game === 'ffx2' ? ADVISOR_V4_FFX2 && force !== false : false;
  if (force === true || force === false) return force;
  return ADVISOR_V4_FFX;
}
