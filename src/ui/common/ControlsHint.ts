import './controls-hint.css';
import type { InputSnapshot } from '../../app/Input.ts';
import { escapeHtml } from './html.ts';

/** One hint entry, worded per input device so a gamepad player never sees "Enter". */
export interface ControlHintItem {
  label: string;
  keyboard: string;
  gamepad: string;
  /** Defaults to the keyboard wording. */
  pointer?: string;
  /**
   * The `data-action` a click on this entry fires, making the chip a button for
   * a mouse or touch player — `'confirm'`, `'cancel'`, or a screen's own action
   * name. The screen must handle it in `input.actions` like the key it names.
   * Omit for hints with no single target, such as "Left/Right choose".
   */
  action?: string;
}

export interface ControlsHintOptions {
  root: HTMLElement;
  items?: ControlHintItem[];
}

/** The small "Arrows navigate - Enter confirm" strip shared by the chapter-select/results/cutscene screens. */
export class ControlsHint {
  readonly el: HTMLElement;
  private items: ControlHintItem[];
  private lastDevice: InputSnapshot['lastDevice'] | null = null;
  private mounted = false;

  constructor(private readonly opts: ControlsHintOptions) {
    this.items = opts.items ?? [];
    this.el = document.createElement('div');
    this.el.className = 'chint';
    this.el.dataset['role'] = 'controls-hint';
    this.render('keyboard');
  }

  mount(): void {
    if (this.mounted) return;
    this.opts.root.appendChild(this.el);
    this.mounted = true;
  }

  unmount(): void {
    if (!this.mounted) return;
    this.el.remove();
    this.mounted = false;
  }

  setItems(items: ControlHintItem[]): void {
    this.items = items;
    this.lastDevice = null; // force a re-render even if the device hasn't changed
    this.render('keyboard');
  }

  /** Call once per frame (or from `handleInput`) so wording follows whichever device the player last touched. */
  handleInput(input: InputSnapshot): void {
    if (input.lastDevice === this.lastDevice) return;
    this.render(input.lastDevice);
  }

  private render(device: InputSnapshot['lastDevice']): void {
    this.lastDevice = device;
    const html = this.items
      .map((item) => {
        const keys = device === 'gamepad' ? item.gamepad : device === 'pointer' ? (item.pointer ?? item.keyboard) : item.keyboard;
        const click = item.action ? ` data-action="${escapeHtml(item.action)}" role="button" tabindex="0"` : '';
        return `<span class="chint__item"${click}><b>${escapeHtml(keys)}</b> ${escapeHtml(item.label)}</span>`;
      })
      .join('<span class="chint__sep">&middot;</span>');
    this.el.innerHTML = html;
  }
}

/**
 * The in-battle strategy guide's toggle, worded per device.
 *
 * Exported from here rather than written inline in
 * `src/ui/common/StrategyGuide.ts` so the panel's own chip and any screen that
 * prints a controls strip say the same thing. The gamepad wording names the
 * face button `src/app/Input.ts` leaves unmapped (standard-gamepad index 2,
 * Square on a DualShock / X on an Xbox pad), which is why the guide can claim
 * it without colliding with confirm, cancel or triangle.
 *
 * `action` makes the chip clickable for a mouse or touch player; a screen that
 * includes this item must handle `'guide:toggle'` in `input.actions`. The guide
 * panel's own chip listens for its own clicks directly and does not need it.
 */
/**
 * The pause menu's footer strip, at its top level.
 *
 * `F` and `Esc` are the two that name a single action, so they are also their
 * own buttons for a mouse player (`action`). The gamepad column names the
 * buttons `src/app/Input.ts` actually maps: `l1` is F on a keyboard and the
 * left shoulder on a pad, and `cancel` is Circle/B.
 */
export const PAUSE_HINTS: ControlHintItem[] = [
  { keyboard: '▲ ▼', gamepad: 'D-pad', label: 'navigate' },
  { keyboard: 'Enter', gamepad: 'Cross', label: 'select', action: 'confirm' },
  { keyboard: 'F', gamepad: 'L1', label: 'photo mode', action: 'pause:photo' },
  { keyboard: 'Esc', gamepad: 'Circle', label: 'back', action: 'cancel' },
];

/**
 * The same strip once the cursor is inside a panel (OPTIONS, PARTY, MUSIC).
 *
 * Differs from {@link PAUSE_HINTS} in the two places the controls genuinely
 * differ — Left/Right now adjust a setting, and Esc now means "back to the
 * menu" rather than "close the pause" — and is otherwise identical, so the
 * strip does not appear to reshuffle when focus moves.
 */
export const PAUSE_PANEL_HINTS: ControlHintItem[] = [
  { keyboard: '▲ ▼', gamepad: 'D-pad', label: 'navigate' },
  { keyboard: '◀ ▶', gamepad: 'D-pad', label: 'adjust' },
  { keyboard: 'Enter', gamepad: 'Cross', label: 'select', action: 'confirm' },
  { keyboard: 'Esc', gamepad: 'Circle', label: 'menu', action: 'cancel' },
];

export const GUIDE_HINT_ITEM: ControlHintItem = {
  label: 'guide',
  keyboard: 'G',
  gamepad: 'Square',
  pointer: 'Guide',
  action: 'guide:toggle',
};

/**
 * The in-battle move advisor's toggle, worded per device.
 *
 * Here beside {@link GUIDE_HINT_ITEM} and for the same reason: the card's own
 * chip and any controls strip that lists it must say the same thing. `N` is the
 * one letter no existing binding claims, and the gamepad column names standard
 * button 7 — the right trigger, which `src/app/Input.ts`'s `PAD_MAP` leaves
 * free and which the guide's button 2 does not collide with.
 *
 * `action` makes the chip clickable for a mouse or touch player; a screen that
 * includes this item must handle `'advisor:toggle'` in `input.actions`. The
 * card's own chip listens for its own clicks and does not need it.
 */
export const ADVISOR_HINT_ITEM: ControlHintItem = {
  label: 'best move',
  keyboard: 'N',
  gamepad: 'R2',
  pointer: 'Best move',
  action: 'advisor:toggle',
};

/**
 * The enemy-intent slab's toggle, worded per device.
 *
 * `E` is the key — the letter of the word a player will guess — and it is the
 * one binding in this file that is **not** free. `src/app/Input.ts` maps `E`
 * (with `C` and the pad's Start) to the abstract `start` button, and
 * `BattleScreen.handleInput` opens the pause menu on `start`.
 *
 * That collision is resolved where it belongs, at the battle screen: the slab's
 * own `keydown` listener records the press and `EnemyIntent.consumeIntentKeyPress`
 * lets `BattleScreen` take the `start` edge for it, so one tap of `E` hides the
 * slab and does not also open the pause. `P`, `C`, `Esc`, the pad's Start button
 * and the PAUSE chip all still open it. The panel listens for the raw `keydown`
 * itself, exactly as the strategy guide listens for `G`, rather than adding a
 * battle-only special case to a contract file thirty agents import.
 *
 * The gamepad column names standard-gamepad button **3** (Triangle on a
 * DualShock, Y on an Xbox pad). `PAD_MAP` binds it to the abstract `triangle`,
 * which no battle screen reads — the demo scene is its only consumer — and
 * button 2 is already the strategy guide's, so the two optional panels sit on
 * the two face buttons a fight leaves idle and neither collides with confirm
 * or cancel.
 *
 * `action` makes the chip clickable for a mouse or touch player; a screen that
 * prints this item must handle `'intent:toggle'`. The slab's own chip listens
 * for its own clicks and does not need it.
 */
export const INTENT_HINT_ITEM: ControlHintItem = {
  label: 'enemy move',
  keyboard: 'E',
  gamepad: 'Triangle',
  pointer: 'Enemy',
  action: 'intent:toggle',
};
