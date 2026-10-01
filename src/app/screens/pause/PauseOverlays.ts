/**
 * The things that take the pause screen over: photo mode, Auron's briefing
 * replayed, and (D-305) the credits panel.
 *
 * Both were preserved verbatim through the Until Dawn remake
 * (`docs/concepts/pause-until-dawn/options.json` → `preservedFunctions`: *"F —
 * unchanged as a key"*, *"REPLAY BRIEFING — OPTIONS tab, right column"*), and
 * neither has anything to do with the new layout, so they live here instead of
 * inside the screen.
 *
 * Both games: shared plumbing, `critic/CHECKS.md` CHK-020.
 */

import type { App } from '../../App.ts';
import { audio } from '../../../audio/index.ts';
import type { Screen } from '../../Screen.ts';
import type { Briefing } from '../../../ui/coach/Briefing.ts';
import { makeBriefing } from '../raiseBriefing.ts';
import { PhotoMode } from '../../../ui/common/PhotoMode.ts';
import type { Button, InputSnapshot } from '../../Input.ts';
import { CREDITS_CLOSE_ACTION, CreditsPanel } from './creditsPanel.ts';

export interface PauseOverlayHost {
  app: App;
  /** The pause screen itself — the one screen root that is not hidden. */
  self: Screen;
  /** The chrome photo mode hides. */
  chrome: () => HTMLElement | null;
  /** The element photo mode's own hint mounts on. */
  root: () => HTMLElement | null;
  /** Show or hide the one line that survives `H`. */
  setBaselineVisible: (on: boolean) => void;
  /** Redraw after the briefing: "never show this again" flips a row. */
  refresh: () => void;
  /** The player backed out of the credits: put the cursor back on CREDITS. */
  creditsClosed?: () => void;
}

export class PauseOverlays {
  private readonly host: PauseOverlayHost;
  private photo: PhotoMode | null = null;
  private briefing: Briefing | null = null;
  private credits: CreditsPanel | null = null;
  /** Screen roots hidden for the duration of photo mode. */
  private hiddenUnder: HTMLElement[] = [];

  constructor(host: PauseOverlayHost) {
    this.host = host;
  }

  /** True while the briefing owns input outright and nothing else may read it. */
  get briefingUp(): boolean {
    return this.briefing !== null && !this.briefing.finished;
  }

  get photoUp(): boolean {
    return this.photo !== null;
  }

  photoSnapshot(): Record<string, unknown> | null {
    return this.photo?.snapshot() ?? null;
  }

  // -------------------------------------------------------------- photo mode

  enterPhoto(): void {
    const chrome = this.host.chrome();
    const root = this.host.root();
    if (this.photo || !chrome || !root) return;
    this.photo = new PhotoMode({
      camera: this.host.app.renderer.camera,
      chrome,
      root,
      onExit: () => this.exitPhoto(),
    });
    this.hideScreensBelow();
    this.host.setBaselineVisible(false);
    audio.playSfx('menu-page');
  }

  exitPhoto(): void {
    if (!this.photo) return;
    this.photo.dispose();
    this.photo = null;
    this.restoreScreensBelow();
    this.host.setBaselineVisible(true);
    audio.playSfx('cancel');
  }

  update(dt: number): void {
    const input = this.host.app.input;
    this.photo?.update(dt, {
      left: input.pressed('left'),
      right: input.pressed('right'),
      up: input.pressed('up'),
      down: input.pressed('down'),
      // Z is `confirm`, and photo mode has nothing to confirm, so in here that
      // whole button is the zoom. R1 doubles it for a pad.
      zoom: input.pressed('confirm') || input.pressed('r1'),
    });
  }

  /**
   * Hide the frozen screens' own DOM for the duration of photo mode.
   *
   * `PhotoMode` only hides the chrome it is handed. The battle HUD is not in
   * it: `BattleScreen` mounts the HUD, the damage numerals, the message bar
   * and the strategy guide into *its* screen root, a sibling `div`, and the
   * pause root only covers it by `z-index`. Take the pause chrome away and the
   * frozen HUD reappears on top of the turntable.
   */
  private hideScreensBelow(): void {
    for (const screen of this.host.app.screens) {
      if (screen === this.host.self) continue;
      const el = screen.root;
      if (!el || el.style.visibility === 'hidden') continue;
      el.style.visibility = 'hidden';
      this.hiddenUnder.push(el);
    }
  }

  private restoreScreensBelow(): void {
    for (const el of this.hiddenUnder) el.style.visibility = '';
    this.hiddenUnder = [];
  }

  // ---------------------------------------------------------------- briefing

  /**
   * Play Auron's briefing again, over the pause menu.
   *
   * It owns input outright while it is up — an exclusive claim on
   * `app/Input.ts` plus its own pad watcher — and the pause screen deliberately
   * forwards it nothing: forwarding is what made the replay unskippable in the
   * first build, when a confirm reached the menu a moment after the briefing
   * resolved and re-raised the still-selected row, forever.
   */
  async replayBriefing(): Promise<void> {
    if (this.briefingUp) return;
    // PR-0284 (both games): inside the pause layer, not under it. `.pause` is fixed at
    // z-index 999, the top of the codebase (`ui-pause-stack.test.ts`), and the briefing
    // on `#ui` at its own 90 played unseen beneath it while it held the keyboard.
    const briefing = makeBriefing(this.host.app, this.host.root() ?? undefined);
    this.briefing = briefing;
    try {
      await briefing.show();
    } finally {
      this.briefing = null;
      this.host.refresh();
    }
  }

  // ----------------------------------------------------------------- credits

  /** The credits panel (D-305, option O1): up from OPTIONS → ABOUT → CREDITS. */
  get creditsUp(): boolean {
    return this.credits !== null;
  }

  openCredits(): void {
    const root = this.host.root();
    if (this.credits || !root) return;
    this.credits = new CreditsPanel(root, () => this.host.app.save.settings.reduceMotion);
  }

  /**
   * @param back the player backed out (Esc / X / Backspace, the pad's cancel or
   * Start, the `Esc BACK` prompt): the cursor and the DOM focus return to the
   * CREDITS row. A tab change closes it without that.
   */
  closeCredits(back = true): void {
    if (!this.credits) return;
    this.credits.dispose();
    this.credits = null;
    if (!back) return;
    audio.playSfx('cancel');
    this.host.creditsClosed?.();
    this.host.root()?.querySelector<HTMLElement>('[data-row="credits"]')?.focus({ preventScroll: true });
  }

  /**
   * One frame of input while the panel is up. True when the panel took the
   * frame; false when it is not up, or when L1 / R1 closed it so the screen can
   * go on to change tab.
   */
  creditsInput(input: InputSnapshot, took: (b: Button) => boolean): boolean {
    if (!this.credits) return false;
    if (took('l1') || took('r1')) {
      this.closeCredits(false);
      return false;
    }
    if (input.actions.includes(CREDITS_CLOSE_ACTION) || input.justPressed('cancel') || took('start')) {
      this.closeCredits();
      return true;
    }
    if (input.justPressed('down')) this.credits.scroll(1);
    if (input.justPressed('up')) this.credits.scroll(-1);
    return true;
  }

  creditsSnapshot(): Record<string, unknown> | null {
    return this.credits?.snapshot() ?? null;
  }

  dispose(): void {
    this.credits?.dispose();
    this.credits = null;
    this.photo?.dispose();
    this.photo = null;
    // A briefing left up would outlive the screen that owns its input.
    this.briefing?.skip();
    this.briefing = null;
    this.restoreScreensBelow();
  }
}
