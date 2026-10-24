/**
 * THE THANKS CARD (release 62, the conference demo; Bailey, 2026-10-22 ~00:00 EDT, decision 173h: "A short 'Thanks for playing' card with the QR (Recommended)", then back to the picker; both games, demo
 * mode only; Chapter I is FFX, Chapter IV is FFX-2).
 *
 * After a win, once the visitor has read the results panel and pressed CONFIRM, one short card stands before the picker: "Thanks for playing", the booth's QR code (the same code `demoQr.ts` makes for the
 * title and the picker, larger), "Echoes of Spira, an unofficial fan tribute. Play it at echoesofspira.com". It ends on any button, key or click (after a short guard so the press that left the results
 * panel, or a mashing hand, cannot skip it unseen) or by itself after {@link THANKS_MS}, and the flow goes on to the picker as it always did.
 *
 * It is an ordinary flow screen (`done` resolves once), shown by `GameFlow` only when a factory is registered for it (`ui/common/registerFlowScreens.ts`), so a test harness that registers none sees
 * exactly the flow it saw before. The accent follows the game as every screen's does: gold for FFX, pyre pink for FFX-2 (`.ig--ffx2`). The hold-reset (`demoReset.ts`) works over it as over everything.
 * Outside demo mode nothing builds it.
 *
 * THE END CARD (lane "booth", Bailey 2026-10-22, decision 188b "Mixed read": the end card in the Echo painting look; both games): with the booth screens on (`boothSwitch.ts`, `?booth=new` or `?pack=demo`) this
 * same screen is drawn as the Echo end card instead of the cream plate (`boothCards.ts`): the painting held with a slow push, "Thanks for playing" and the picked frame's own words left, the QR and the address
 * right. Same flow, same ending (a press after the guard, a click, or {@link THANKS_MS}), same `done`; only the picture differs. The booth loop's own end card (`?card=end`) is `BoothCardScreen.ts`.
 */

import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { BUTTONS } from '../Input.ts';
import { demoModeOn } from '../demoMode.ts';
import { getChapter } from '../../data/encounters.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import { keyHint } from '../../ui/common/padGlyphs.ts';
import { isDemoFight } from './demoFlow.ts';
import { boothHost, boothQrSvg } from './demoQr.ts';
import { boothNewOn } from './boothSwitch.ts';
import { mountEndCard } from './boothCards.ts';
import './demo.css';

/** How long the card stands when nobody presses anything, ms. */
export const THANKS_MS = 8000;
/** The first moments in which a press does not end it, ms: the card is seen, and the press that left the results panel is not read twice. */
export const THANKS_GUARD_MS = 700;

/** The words on the card, as Bailey set them. */
export const THANKS_TITLE = 'Thanks for playing';
export const THANKS_LINE = 'Echoes of Spira, an unofficial fan tribute.';
export const THANKS_ASK = 'Play it at';

/** Does a win of `chapterId` end with the thanks card? Demo mode, one of the two demo fights. */
export function demoThanksDue(chapterId: string): boolean {
  return demoModeOn() && isDemoFight(chapterId);
}

export interface DemoThanksOptions {
  chapterId: string;
  /** Milliseconds before it ends by itself (tests). */
  holdMs?: number;
  guardMs?: number;
}

export class DemoThanksScreen extends Screen {
  readonly name = 'demo-thanks';

  /** Resolves once the card is over (a press, the timer, or the screen leaving). */
  readonly done: Promise<void>;
  private resolveDone!: () => void;
  private elapsedMs = 0;
  private over = false;
  private bar: HTMLElement | null = null;
  private readonly holdMs: number;
  private readonly guardMs: number;

  constructor(private readonly opts: DemoThanksOptions) {
    super();
    this.holdMs = opts.holdMs ?? THANKS_MS;
    this.guardMs = opts.guardMs ?? THANKS_GUARD_MS;
    this.done = new Promise<void>((resolve) => {
      this.resolveDone = resolve;
    });
  }

  override enter(): void {
    installInkGoldStyles();
    const ffx2 = getChapter(this.opts.chapterId)?.game === 'ffx2';
    const root = this.root;
    root.classList.add('demo-thanks', 'ig');
    if (ffx2) root.classList.add('ig--ffx2');
    root.dataset['role'] = 'demo-thanks';
    root.dataset['action'] = 'thanks:end'; // a click or a tap anywhere on the card ends it
    root.style.setProperty('--fe-k', 'max(0.5px, min(100vw / 1440, 100vh / 810))'); // the front end's grid unit (`frontend.css`), for a screen that sits outside a `.fe` one
    if (boothNewOn()) {
      // The Echo end card (decision 188b): the painting is the card; no timer bar and no hint (the card ends on a press or by itself, as it always did).
      root.classList.add('demo-thanks--booth');
      mountEndCard(root, { afterFight: true });
      void this.app.fade('clear', 300);
      return;
    }
    root.innerHTML = `
      <div class="demo-thanks__card">
        <div class="demo-thanks__main">
          <div class="demo-thanks__eyebrow"><i></i>Echoes of Spira</div>
          <h1 class="demo-thanks__title">${THANKS_TITLE}</h1>
          <div class="demo-thanks__rule"></div>
          <p class="demo-thanks__line">${THANKS_LINE}</p>
          <p class="demo-thanks__ask">${THANKS_ASK} <b>${boothHost()}</b></p>
        </div>
        <div class="demo-thanks__qr" role="img" aria-label="QR code. Scan it to play Echoes of Spira on your phone at ${boothHost()}.">
          <div class="demo-thanks__code">${boothQrSvg()}</div>
          <div class="demo-thanks__cap">Scan to play</div>
        </div>
      </div>
      <div class="demo-thanks__foot">
        <div class="demo-thanks__bar"><i></i></div>
        <div class="demo-thanks__hint"><b>${keyHint('Enter', 'Cross')}</b> continue</div>
      </div>`;
    this.bar = root.querySelector('.demo-thanks__bar > i');
    void this.app.fade('clear', 300);
  }

  override exit(): void {
    this.finish();
  }

  override update(dt: number): void {
    if (this.over) return;
    this.elapsedMs += dt * 1000;
    this.bar?.style.setProperty('transform', `scaleX(${Math.max(0, 1 - this.elapsedMs / this.holdMs)})`);
    if (this.elapsedMs >= this.holdMs) this.finish();
  }

  override handleInput(input: InputSnapshot): void {
    if (this.over || this.elapsedMs < this.guardMs) {
      if (this.elapsedMs < this.guardMs) for (const b of BUTTONS) input.consume(b); // the press that brought us here is not the card's
      return;
    }
    if (input.actions.length > 0 || BUTTONS.some((b) => input.justPressed(b))) {
      for (const b of BUTTONS) input.consume(b);
      this.finish();
    }
  }

  override trigger(name: string): boolean {
    if (name !== 'thanks:end') return false;
    this.finish();
    return true;
  }

  override snapshot(): Record<string, unknown> {
    return { chapterId: this.opts.chapterId, over: this.over, elapsedMs: Math.round(this.elapsedMs) };
  }

  private finish(): void {
    if (this.over) return;
    this.over = true;
    this.resolveDone();
  }
}
