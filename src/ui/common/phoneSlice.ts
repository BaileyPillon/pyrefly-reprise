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

/**
 * FOC23-01: how much of the field's height the FFX phone HUD's top band covers
 * (the turn strip, then the enemy-intent strip under it), 0..0.4, so the refit
 * (`FrameFit.fitRigToSlice`'s `top`) keeps a boss's head below it. Measured on
 * the live layout. The refit runs at the battle start, before the intent strip
 * has its first line, so an unmeasured strip is reserved at {@link INTENT_STRIP_PX}
 * under the rail (`phone-battle-parts.css` puts it 2 px under the rail, at most
 * 84 px tall).
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only** (Chapter I's Seymour Flux under
 * the strips); FFX-2's phone framing is Bailey's approved one and is untouched.
 */
/** The intent strip's height with its usual two lines at 390x844 (66 to 136 px in Chapter I; our measure). */
export const INTENT_STRIP_PX = 70;

export function phoneTopOf(doc: Document): number {
  // The battle start refits before the phone HUD marks <html> (`phoneBattle.ts`), so the query and the
  // FFX HUD's presence decide, as `phoneSliceOf` does.
  const view = doc.defaultView;
  const phone = doc.documentElement.dataset['phoneBattle'] === 'ffx' ||
    (!!view && typeof view.matchMedia === 'function' && view.matchMedia(PHONE_BATTLE_QUERY).matches);
  if (!phone || !doc.querySelector('.ffxhud') || doc.querySelector('.ffx2hud')) return 0;
  const game = doc.getElementById('game')?.getBoundingClientRect();
  if (!game || !(game.height > 0)) return 0;
  const measured = (sel: string): number | null => {
    let out: number | null = null;
    for (const el of doc.querySelectorAll<HTMLElement>(sel)) {
      if (el.hidden || el.closest('[hidden]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) out = Math.max(out ?? -Infinity, r.bottom);
    }
    return out;
  };
  // Before the mark the HUD still wears its desktop layout, so nothing is measured then.
  const laidOut = doc.documentElement.dataset['phoneBattle'] === 'ffx';
  // At the battle start the rail has no tiles yet and the strip no line, so each is held at least
  // at its usual size (the rail 10 + 54 px, the strip {@link INTENT_STRIP_PX}); a taller one counts.
  const rail = Math.max(game.top + 64, (laidOut ? measured('.ffxhud .ig-ctb') : null) ?? 0);
  const bottom = Math.max(rail + 2 + INTENT_STRIP_PX, (laidOut ? measured('.ffxhud .eint__panel') : null) ?? 0);
  return Math.min(0.4, Math.max(0, (bottom - game.top) / game.height));
}
