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

export class RawInputWatcher {
  private attached = false;
  private rafId = 0;
  private readonly padHeld = new Set<UiButton>();
  private readonly repeatAt = new Map<UiButton, number>();

  constructor(private readonly onButton: (button: UiButton) => void) {}

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
    const button = KEY_MAP[e.code];
    if (!button) return;
    if (e.repeat && !DIRECTIONS.has(button)) return;
    if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
    this.onButton(button);
  };

  private readonly pollGamepad = (now: number): void => {
    if (!this.attached) return;
    this.rafId = requestAnimationFrame(this.pollGamepad);
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
