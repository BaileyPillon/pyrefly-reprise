import './yojimbo-pay.css';
import { RawInputWatcher, wireClicks, type UiButton } from './rawInput.ts';
import { claimCancel, releaseCancel, releaseCancelAfterPress } from './cancelClaim.ts';
import { type PayState, allIn, digitsOf, double, gil, halve, movePlace, nudge, openPay, payNote, placeAtIndex } from './yojimboPayModel.ts';

/**
 * The amount panel of the player's Yojimbo — **THE HIDDEN LAST SUMMONING ONLY** (FFX only; AGENTS.md rule 14: Pay is an FFX aeon command).
 *
 * Yojimbo's menu is two rows, Pay and Dismiss (`battle/ffx/aeon-commands.ts`); Pay asks "how much?". This panel is that question: a payment from 0 to what the party holds, edited a digit at a time (left and right choose the
 * digit, up and down change it, Enter pays, Escape goes back to his menu), with the three shortcuts a touch screen needs (double, half, everything) and a button for each digit's two arrows. It mounts only when the HUD
 * is asked to open Pay (`./YojimboPay.ts`), which only the player's Yojimbo has, so no other fight's screen changes.
 *
 * **Provisional (rule 9).** No target for this panel was approved; it is the one new input the engine's Pay needs, built in the Ink and Gold chrome beside the command stack and shown to Bailey as a first sketch. Its model is pure
 * (`./yojimboPayModel.ts`).
 *
 * **Keyboard reachable**, wired through the same {@link RawInputWatcher} every overlay in `src/ui/ffx/` uses; Escape is this panel's back button while it is open (`./cancelClaim.ts`).
 */

/** What the panel resolves with: the payment, or `null` when the player backed out. */
export type PayAnswer = number | null;

export class YojimboPayWidget {
  readonly el: HTMLElement;
  private state: PayState | null = null;
  private resolve: ((answer: PayAnswer) => void) | null = null;
  private readonly watcher = new RawInputWatcher((b) => this.onButton(b));
  private unwireClicks: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ig-cmd-stack ffx-ypay';
    this.el.hidden = true;
    this.el.dataset['testid'] = 'yojimbo-pay';
  }

  /** The panel is up and taking input. */
  get open(): boolean {
    return !this.el.hidden;
  }

  /** The payment as it stands now (for tests and the debug snapshot). */
  get amount(): number | null {
    return this.state?.amount ?? null;
  }

  /**
   * Ask for a payment: `purse` is what the party holds (`state.flags['yojimbo:gil']`), `suggested` where the digits open (the advisor's amount; 0 is allowed and means "pay nothing").
   * Resolves with the amount on Enter or a tap on PAY, and with `null` on Escape or BACK. A second call while open replaces the first.
   */
  ask(purse: number, suggested: number): Promise<PayAnswer> {
    this.dropPending();
    this.state = openPay(purse, suggested);
    this.el.hidden = false;
    this.render();
    this.watcher.attach();
    claimCancel(); // Escape is this panel's back button, not the pause menu's
    this.unwireClicks = wireClicks(this.el, (action) => this.onAction(action));
    return new Promise<PayAnswer>((resolve) => {
      this.resolve = resolve;
    });
  }

  /** The decision went away (an action is resolving, the fight ended): take the panel down without answering. */
  hide(): void {
    if (this.el.hidden) return;
    this.close();
    releaseCancel();
  }

  dispose(): void {
    this.watcher.detach();
    this.unwireClicks?.();
    this.unwireClicks = null;
  }

  private dropPending(): void {
    if (this.resolve) this.close();
  }

  private close(): void {
    this.watcher.detach();
    this.unwireClicks?.();
    this.unwireClicks = null;
    this.el.hidden = true;
    this.resolve = null;
    this.state = null;
  }

  private answer(value: PayAnswer): void {
    const resolve = this.resolve;
    this.close();
    if (value === null) releaseCancelAfterPress();
    else releaseCancel();
    resolve?.(value);
  }

  private onButton(b: UiButton): void {
    const s = this.state;
    if (!s) return;
    if (b === 'left' || b === 'right') this.set(movePlace(s, b));
    else if (b === 'up' || b === 'down') this.set(nudge(s, b === 'up' ? 1 : -1));
    else if (b === 'confirm') this.answer(s.amount);
    else if (b === 'cancel') this.answer(null);
    else if (b === 'l1') this.set(halve(s));
    else if (b === 'r1') this.set(double(s));
  }

  /** A tap or a click on a data-ui-action: `pay`, `back`, `all`, `half`, `double`, `up:<place>`, `down:<place>`, `at:<index>`. */
  private onAction(action: string): void {
    const s = this.state;
    if (!s) return;
    if (action === 'pay') return this.answer(s.amount);
    if (action === 'back') return this.answer(null);
    if (action === 'all') return this.set(allIn(s));
    if (action === 'half') return this.set(halve(s));
    if (action === 'double') return this.set(double(s));
    const [kind, arg] = action.split(':');
    const n = Number(arg);
    if (!Number.isInteger(n)) return;
    if (kind === 'up' || kind === 'down') this.set(nudge(s, kind === 'up' ? 1 : -1, n));
    else if (kind === 'at') this.set(placeAtIndex(s, n));
  }

  private set(next: PayState): void {
    this.state = next;
    this.render();
  }

  private render(): void {
    const s = this.state;
    if (!s) return;
    const digits = digitsOf(s);
    const cells = digits
      .map((d, i) => {
        const place = s.places - 1 - i;
        // a comma stands before the hundreds digit, the hundred-thousands digit and so on: 32,768 and 1,000,000
        const sep = i > 0 && place % 3 === 2 ? '<span class="ffx-ypay__sep" aria-hidden="true"><span class="ffx-ypay__step">&nbsp;</span><span class="ffx-ypay__comma">,</span><span class="ffx-ypay__step">&nbsp;</span></span>' : '';
        const cls = place === s.place ? 'ffx-ypay__cell ffx-ypay__cell--on' : 'ffx-ypay__cell';
        return (
          `${sep}<span class="${cls}">` +
          `<button type="button" class="ffx-ypay__step" data-ui-action="up:${place}" aria-label="more">▲</button>` +
          `<button type="button" class="ffx-ypay__digit" data-ui-action="at:${i}">${d}</button>` +
          `<button type="button" class="ffx-ypay__step" data-ui-action="down:${place}" aria-label="less">▼</button>` +
          '</span>'
        );
      })
      .join('');
    this.el.innerHTML =
      '<div class="ffx-ypay__title">PAY YOJIMBO</div>' +
      `<div class="ffx-ypay__digits" role="group" aria-label="payment">${cells}<span class="ffx-ypay__unit">gil</span></div>` +
      `<div class="ffx-ypay__purse">The party holds <b>${gil(s.purse)}</b> gil</div>` +
      `<div class="ffx-ypay__note">${payNote(s)}</div>` +
      '<div class="ffx-ypay__row">' +
      '<button type="button" class="ffx-ypay__btn" data-ui-action="half">HALF</button>' +
      '<button type="button" class="ffx-ypay__btn" data-ui-action="double">DOUBLE</button>' +
      '<button type="button" class="ffx-ypay__btn" data-ui-action="all">ALL</button>' +
      '</div>' +
      '<div class="ffx-ypay__row">' +
      '<button type="button" class="ffx-ypay__btn ffx-ypay__btn--back" data-ui-action="back">BACK</button>' +
      `<button type="button" class="ffx-ypay__btn ffx-ypay__btn--pay" data-ui-action="pay">PAY ${gil(s.amount)}</button>` +
      '</div>' +
      '<div class="ffx-ypay__keys">◀▶ digit · ▲▼ change · ENTER pay · ESC back</div>';
  }
}
