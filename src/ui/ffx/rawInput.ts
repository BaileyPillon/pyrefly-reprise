/**
 * A tiny, self-contained keyboard+gamepad watcher for HUD widgets that are not
 * driven by a `Screen`'s per-frame `handleInput` (the presenter calls
 * `HudPort.chooseCommand()` / `openMinigame()` directly and awaits a promise,
 * outside App's screen-input cycle). Mirrors `src/app/Input.ts`'s key/button
 * mapping for the handful of abstract buttons menus need, without depending
 * on that module's unexported internals or its per-frame `update()` model.
 *
 * Every menu and minigame overlay in `src/ui/ffx/` uses this one watcher so
 * keyboard, gamepad and mouse all reach the same handler.
 */
export type UiButton = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'triangle' | 'l1' | 'r1';

const KEY_MAP: Record<string, UiButton> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  Space: 'confirm',
  KeyZ: 'confirm',
  Escape: 'cancel',
  KeyX: 'cancel',
  Backspace: 'cancel',
  ShiftLeft: 'triangle',
  ShiftRight: 'triangle',
  KeyQ: 'triangle',
  KeyF: 'l1',
  PageUp: 'l1',
  KeyR: 'r1',
  PageDown: 'r1',
};

const PAD_BUTTON_MAP: Record<number, UiButton> = {
  0: 'confirm',
  1: 'cancel',
  3: 'triangle',
  4: 'l1',
  5: 'r1',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
};

const AXIS_DEADZONE = 0.5;
const REPEAT_DELAY_MS = 320;
const REPEAT_INTERVAL_MS = 120;
const DIRECTIONS = new Set<UiButton>(['up', 'down', 'left', 'right']);

/**
 * Global mute for every watcher, set while the pause overlay is up.
 *
 * `app/Input.claimKeyboard()` already cuts the **keyboard** off in the capture
 * phase, but the gamepad is polled here from our own `requestAnimationFrame`
 * and nothing upstream can intercept that. Without this, a d-pad press behind
 * the pause menu moved a hidden command cursor and Cross resolved a command —
 * taking a real turn while the game was supposed to be frozen.
 *
 * Set by `app/screens/BattleScreen.ts`'s pause, alongside the presenter gate.
 */
let suspended = false;

/** Stop / resume every `RawInputWatcher` in the page. */
export function setRawInputSuspended(value: boolean): void {
  suspended = value;
}

/** Whether raw HUD input is currently muted. */
export function rawInputSuspended(): boolean {
  return suspended;
}

export interface RawInputWatcherOptions {
  /**
   * Keep reading input while every other watcher is muted.
   *
   * For the **overlay that the mute is protecting the game from**, and nothing
   * else. Auron's briefing can be replayed from the pause menu, where
   * {@link setRawInputSuspended} is on: without this its own dismiss watcher
   * would be muted too and a gamepad would have no way to take it down, because
   * the pause screen behind it is deaf while the briefing owns input.
   */
  ignoreSuspend?: boolean;
}

export class RawInputWatcher {
  private attached = false;
  private rafId = 0;
  private readonly padHeld = new Set<UiButton>();
  private readonly repeatAt = new Map<UiButton, number>();
  private readonly ignoreSuspend: boolean;

  constructor(
    private readonly onButton: (button: UiButton) => void,
    opts: RawInputWatcherOptions = {},
  ) {
    this.ignoreSuspend = opts.ignoreSuspend === true;
  }

  /** Is this watcher muted right now? */
  private get muted(): boolean {
    return suspended && !this.ignoreSuspend;
  }

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', this.onKeyDown);
    this.rafId = requestAnimationFrame(this.pollGamepad);
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    window.removeEventListener('keydown', this.onKeyDown);
    cancelAnimationFrame(this.rafId);
    this.padHeld.clear();
    this.repeatAt.clear();
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (this.muted) return;
    const button = KEY_MAP[e.code];
    if (!button) return;
    if (e.repeat && !DIRECTIONS.has(button)) return;
    if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
    this.onButton(button);
  };

  private readonly pollGamepad = (now: number): void => {
    if (!this.attached) return;
    this.rafId = requestAnimationFrame(this.pollGamepad);
    // Keep polling (so the loop is still alive on resume) but report nothing.
    // `padHeld` is deliberately left as it was: a button held across the pause
    // must not fire a fresh edge the moment the menu closes.
    if (this.muted) return;
    const pads = navigator.getGamepads?.() ?? [];
    const next = new Set<UiButton>();
    for (const pad of pads) {
      if (!pad) continue;
      for (const [indexStr, button] of Object.entries(PAD_BUTTON_MAP)) {
        if (pad.buttons[Number(indexStr)]?.pressed) next.add(button);
      }
      const x = pad.axes[0] ?? 0;
      const y = pad.axes[1] ?? 0;
      if (Math.abs(x) > AXIS_DEADZONE) next.add(x < 0 ? 'left' : 'right');
      if (Math.abs(y) > AXIS_DEADZONE) next.add(y < 0 ? 'up' : 'down');
    }

    for (const button of next) {
      const wasHeld = this.padHeld.has(button);
      if (!wasHeld) {
        this.onButton(button);
        this.repeatAt.set(button, now + REPEAT_DELAY_MS);
      } else if (DIRECTIONS.has(button)) {
        const due = this.repeatAt.get(button) ?? Infinity;
        if (now >= due) {
          this.onButton(button);
          this.repeatAt.set(button, now + REPEAT_INTERVAL_MS);
        }
      }
    }
    for (const button of this.padHeld) {
      if (!next.has(button)) this.repeatAt.delete(button);
    }
    this.padHeld.clear();
    for (const button of next) this.padHeld.add(button);
  };
}

/** Wires plain mouse/touch clicks on `[data-ui-action]` elements inside `root`. */
export function wireClicks(root: HTMLElement, onAction: (action: string, el: HTMLElement) => void): () => void {
  const handler = (e: MouseEvent): void => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-ui-action]');
    if (!el || !root.contains(el)) return;
    const action = el.dataset['uiAction'];
    if (action) onAction(action, el);
  };
  root.addEventListener('click', handler);
  return () => root.removeEventListener('click', handler);
}
