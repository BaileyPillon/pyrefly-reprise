/**
 * BATTLE TO RESULTS, A DISSOLVE (lane "pro-staging"; Bailey 2026-10-22: win "Victory freeze frame": "a held freeze frame on the last blow, then the results"; the options book's V1 "No cream wipe": "Nothing flat ever
 * covers the stage"). The results panel still replaces the battle screen (it is a screen of its own), but the diagonal ivory wipe that covered the stage with the PAUSE and ENEMY MOVE chips still on it is replaced
 * by a short soft dissolve over the held scene: a cover that fades in, the swap under it, and the panel fading up as the cover leaves. Under the staging's `ending` piece only; `playResultsWipe` is untouched.
 * Game case: both games; the cover is ivory-blue for FFX and pearl-lilac for FFX-2. REDUCE MOTION shortens it (the panel still changes under a cover, never a hard cut).
 */
import type { GameId } from '../../../battle/common/types.ts';

const IN_MS = 380;
const HOLD_MS = 90;
const OUT_MS = 520;

export function playResultsDissolve(root: HTMLElement, game: GameId, onCover?: () => void, reduce = false): Promise<void> {
  const doc = root.ownerDocument;
  const el = doc.createElement('div');
  el.setAttribute('data-role', 'results-dissolve');
  el.style.cssText = `position:absolute;inset:0;z-index:95;pointer-events:none;opacity:0;background:${
    game === 'ffx2' ? 'radial-gradient(ellipse at 50% 45%, #fbf1fb 0%, #f1dff2 100%)' : 'radial-gradient(ellipse at 50% 45%, #f7f9ff 0%, #dfe7fb 100%)'
  };`;
  root.appendChild(el);
  const k = reduce ? 0.4 : 1;
  return new Promise<void>((resolve) => {
    const finish = (): void => {
      el.remove();
      resolve();
    };
    try {
      const fadeIn = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: IN_MS * k, easing: 'ease-in', fill: 'forwards' });
      fadeIn.onfinish = () => {
        onCover?.();
        window.setTimeout(() => {
          try {
            const fadeOut = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: OUT_MS * k, easing: 'ease-out', fill: 'forwards' });
            fadeOut.onfinish = finish;
            fadeOut.oncancel = finish;
          } catch {
            finish();
          }
        }, HOLD_MS * k);
      };
      fadeIn.oncancel = () => {
        onCover?.();
        finish();
      };
    } catch {
      onCover?.(); // no animation API: the swap still happens
      finish();
    }
  });
}
