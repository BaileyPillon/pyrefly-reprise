/**
 * U4 (PR-0305, FFX-2 only; the FFX help path already re-runs): the command-help band follows BATTLE HELP and
 * the acting character's highlight, not only a highlight change.
 *
 * `FFX2BattleHud.setCommandHelp` ran only when the highlight moved. So after BATTLE HELP was turned off from the
 * pause the band stayed up (desktop) until the next highlight move, and the hidden band kept its last sentence in
 * the DOM, which the phone's foot line reads (`phoneHud.ts`): Rikku's and Paine's menus showed "Open the White
 * Magic menu." beside a row that is not White Magic. This holds the latest label and sentence and re-applies them
 * every frame and on every change: shown only while help is on and there is a sentence, and the hidden band's text
 * is empty, so nothing reads a stale line.
 */

import './command-window-header.css'; // U6: the window's sticky header (same window, same file's reader)

export class CommandHelp {
  private label = '';
  private text = '';
  private shown: boolean | null = null;

  /** `on`: the player's BATTLE HELP switch, read every frame. `place`: park the band (`commandHelpBand.ts`) when it appears. */
  constructor(private readonly el: HTMLElement, private readonly on: () => boolean, private readonly place: () => void) {}

  /** The highlighted row's own label and sentence (`CommandMenu`'s `onHelp`); `('', '')` when the menu closes. */
  set(label: string, text: string): void {
    this.label = label;
    this.text = text;
    this.sync();
  }

  /** Every frame, and from `set`. */
  sync(): void {
    const show = this.on() && this.text.length > 0;
    if (show !== this.shown) {
      this.shown = show;
      this.el.hidden = !show;
      if (show) this.place();
    }
    const label = show ? this.label : '';
    const text = show ? this.text : '';
    const l = this.el.querySelector<HTMLElement>('[data-role="label"]');
    const t = this.el.querySelector<HTMLElement>('[data-role="text"]');
    if (l && l.textContent !== label) l.textContent = label;
    if (t && t.textContent !== text) t.textContent = text;
  }
}
