/**
 * PR-0157, FFX half: the HUD's cards step back while an action plays.
 *
 * Method check `docs/plans/pr-0157-method-check.md` picked the fade over a
 * per-frame shift: one class on the HUD root between an action's start and
 * its end (B2's acting signal, `HudPort.setActing`), and CSS in `ffx-hud.css`
 * that takes the guide card, the advisor, the enemy-intent card, the turn
 * column and the enemy plate to low opacity. The command menu is already
 * suspended during an action. The party rows, the numerals, the help bar and
 * the banners stay: they are what an action is read by.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only.** FFX-2's half is A-15 (B6),
 * beside `FFX2BattleHud.ts`.
 */
import type { ActingSignal } from '../../engine/HudPort.ts';

export const ACTING_CLASS = 'ffxhud--acting';

export class ActingFade {
  constructor(private readonly root: HTMLElement) {}

  set(signal: ActingSignal): void {
    this.root.classList.toggle(ACTING_CLASS, signal.phase === 'action-start');
  }

  clear(): void {
    this.root.classList.remove(ACTING_CLASS);
  }
}
