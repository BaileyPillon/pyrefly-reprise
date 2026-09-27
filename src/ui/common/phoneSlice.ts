/**
 * How much of the battle render an upright phone shows (A-12; both games).
 *
 * Under the phone battle HUD (`phoneBattle.ts`, `PHONE_BATTLE_QUERY`) the
 * field draws the 16:9 render at its own height and shows a window-wide slice
 * of it (`phone-battle.css`, `phoneFraming.ts`). The presenter's moments ask
 * for that share so the camera can stand back until a fight fits one slice
 * (`FrameFit.fitRigToSlice`, option A of PR-0201). `null` off the phone.
 */

import { PHONE_BATTLE_QUERY } from './phoneBattle.ts';

export function phoneSliceOf(doc: Document): number | null {
  const view = doc.defaultView;
  if (!view || typeof view.matchMedia !== 'function' || !view.matchMedia(PHONE_BATTLE_QUERY).matches) return null;
  const game = doc.getElementById('game');
  const width = game?.getBoundingClientRect().width ?? 0;
  const shown = Math.min(width, view.innerWidth);
  if (!(width > 0) || shown >= width - 1) return null;
  return shown / width;
}
