/**
 * THE BOOTH'S CARD AS A PAGE OF ITS OWN (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b; both games: the front door is shared). `?card=end` opens the Echo END card and `?card=attract` the Echo
 * ATTRACT card instead of the title, with nothing else on the screen: the card the booth loop returns to after the trailer, a card for a second monitor, and the address a capture tool opens.
 *
 * Any button, key or click (after a short guard, so the press that opened the page is not read twice) goes on to the title, where a visitor starts a fight. Nothing is written to the save. The cards are the same
 * pictures the demo shows after a won fight and after 60 s idle (`boothCards.ts`); here they stand until someone presses.
 */
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { BUTTONS } from '../Input.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import type { BoothCard } from './boothSwitch.ts';
import { mountAttractCard, mountEndCard } from './boothCards.ts';

/** The first moments in which a press does not leave the card, ms. */
export const CARD_GUARD_MS = 700;

export class BoothCardScreen extends Screen {
  readonly name: string;
  private elapsedMs = 0;
  private leaving = false;

  constructor(readonly kind: BoothCard) {
    super();
    this.name = kind === 'end' ? 'booth-end' : 'booth-attract';
  }

  override enter(): void {
    installInkGoldStyles();
    const root = this.root;
    root.classList.add('booth-screen');
    root.dataset['role'] = this.name;
    root.dataset['action'] = 'card:next'; // a click or a tap anywhere on the card goes on
    if (this.kind === 'end') mountEndCard(root);
    else mountAttractCard(root);
    void this.app.fade('clear', 300);
  }

  override update(dt: number): void {
    this.elapsedMs += dt * 1000;
  }

  override handleInput(input: InputSnapshot): void {
    if (this.leaving) return;
    if (this.elapsedMs < CARD_GUARD_MS) {
      for (const b of BUTTONS) input.consume(b); // the press that opened the page is not the card's
      return;
    }
    if (input.actions.length > 0 || BUTTONS.some((b) => input.justPressed(b))) {
      for (const b of BUTTONS) input.consume(b);
      void this.next();
    }
  }

  override trigger(name: string): boolean {
    if (name !== 'card:next') return false;
    if (this.elapsedMs >= CARD_GUARD_MS) void this.next();
    return true;
  }

  override snapshot(): Record<string, unknown> {
    return { kind: this.kind, leaving: this.leaving, elapsedMs: Math.round(this.elapsedMs) };
  }

  private async next(): Promise<void> {
    if (this.leaving) return;
    this.leaving = true;
    await this.app.goto('title');
  }
}
