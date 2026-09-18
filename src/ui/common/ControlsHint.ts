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
