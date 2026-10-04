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
export type UiButton = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'triangle' | 'square' | 'l1' | 'r1';

/** Where a press came from: the keyboard is evented, the pad is polled. */
export type PressSource = 'keyboard' | 'gamepad';

/** The three ways a player reaches the game, named as `app/Input.ts`'s `lastDevice` names them. */
export type PlayerDevice = 'keyboard' | 'gamepad' | 'pointer';

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
  // Square: Bushido's Shooting Star asks for it (PR-0308). K is free: no screen or global handler reads it.
  KeyK: 'square',
  KeyF: 'l1',
  PageUp: 'l1',
  KeyR: 'r1',
  PageDown: 'r1',
};

const PAD_BUTTON_MAP: Record<number, UiButton> = {
  0: 'confirm',
  1: 'cancel',
  2: 'square',
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

/**
 * Clicks a paused battle's own DOM must not hear. The pause menu is drawn over
 * the HUD but did not stop the mouse: on Evrae, two clicks (Orders, then "Pull
 * back") spent Tidus's turn under the pause (critic, 2026-09-23;
 * `tests/unit/pause-pointer-leak.test.ts`). Every HUD command handler listens
 * for `click`; `pointerdown` is left alone because photo mode, opened from the
 * pause, orbits the camera off `document.body`'s pointerdown.
 */
const POINTER_EVENTS = ['click', 'dblclick', 'auxclick', 'contextmenu'];
let releasePointer: (() => void) | null = null;

function swallow(e: Event): void {
  e.stopPropagation();
  e.preventDefault();
}

/**
 * Stop / resume every `RawInputWatcher` in the page, and, when `pointerRoot`
 * is given, the mouse on everything inside it (a capture listener on the root
 * runs before any HUD handler below it). Only that root: the pause menu, photo
 * mode and the briefing live outside the battle's own DOM and keep the mouse.
 */
export function setRawInputSuspended(value: boolean, pointerRoot?: HTMLElement): void {
  suspended = value;
  releasePointer?.();
  releasePointer = null;
  if (!value || !pointerRoot) return;
  for (const type of POINTER_EVENTS) pointerRoot.addEventListener(type, swallow, true);
  releasePointer = () => {
    for (const type of POINTER_EVENTS) pointerRoot.removeEventListener(type, swallow, true);
  };
}

/** Whether raw HUD input is currently muted. */
export function rawInputSuspended(): boolean {
  return suspended;
}

/**
 * The input the player used last, as this module's own watchers and one window listener saw it, so an
 * overlay that opens mid-turn (an Overdrive's minigame, PR-0361) can name the right controls on its
 * first frame instead of guessing: the player reached it with a key, a pad button or a finger a moment ago.
 *
 * A **trusted** key only: the phone HUD's Confirm and Back buttons dispatch synthetic `keydown`s
 * (`phoneBattleText.sendKey`), and those are a tap, not a key. A pointer press anywhere counts, and
 * records what it was (`pointerType`: `mouse`, `touch`, `pen`). Null until the player has pressed anything.
 */
export interface SeenDevice {
  device: PlayerDevice;
  /** `PointerEvent.pointerType` for `pointer`, otherwise `''`. */
  pointerKind: string;
}
let seenDevice: SeenDevice | null = null;
let pointerTracked = false;

function noteDevice(device: PlayerDevice, pointerKind = ''): void {
  seenDevice = { device, pointerKind };
}

/** The device the player last pressed with, or null before the first press. */
export function lastPlayerDevice(): SeenDevice | null {
  return seenDevice;
}

/** Forget it (a unit test, or a fresh page). */
export function forgetPlayerDevice(): void {
  seenDevice = null;
}

/** One capture listener for the whole page, added by the first watcher that attaches. */
function trackPointer(): void {
  if (pointerTracked || typeof window === 'undefined') return;
  pointerTracked = true;
  window.addEventListener('pointerdown', (e) => noteDevice('pointer', e.pointerType || 'mouse'), true);
}

/**
 * A pad press an overlay took down with it (PR-0362, FFX): the pad twin of a swallowed `keydown`.
 *
 * A key is evented, so an overlay's capture listener can stop the press before the menu behind it hears it
 * (`CoachMark.onConfirmCapture`). The pad is polled, and every watcher polls it for itself, in the order they
 * attached, so a capture listener has nothing to stop. Two things do the same job:
 *
 * - {@link reservePad}: while it stands, no watcher but `owner` hears that pad button. A coach line holds the
 *   pad's Cross for itself while it is up, whichever of the two watchers happens to poll first.
 * - {@link claimHeldPad}: the press that is down right now is nobody's any more until it is let go. The line
 *   came down on it, and the menu behind must not take the same press.
 */
let padReserve: { button: UiButton; owner: RawInputWatcher } | null = null;
const padClaims = new Set<UiButton>();

/** Reserve a pad button for `owner`. Returns the release (a no-op once another reserve has replaced it). */
export function reservePad(button: UiButton, owner: RawInputWatcher): () => void {
  const mine = { button, owner };
  padReserve = mine;
  return () => {
    if (padReserve === mine) padReserve = null;
  };
}

/** The pad button is down now: nobody hears this press, until it is released. A no-op when no pad holds it. */
export function claimHeldPad(button: UiButton): void {
  for (const pad of navigator.getGamepads?.() ?? []) {
    if (!pad) continue;
    for (const [indexStr, b] of Object.entries(PAD_BUTTON_MAP)) {
      if (b === button && pad.buttons[Number(indexStr)]?.pressed) {
        padClaims.add(button);
        return;
      }
    }
  }
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
  /**
   * Listen to the keyboard as well as the pad (default true). `false` is for a
   * menu that already owns its keys with its own `keydown` map and only needs
   * the pad fed to the same handler: FFX-2's command menu (PR-0219), whose key
   * set differs from {@link KEY_MAP} (no WASD) and must not change.
   */
  keyboard?: boolean;
}

export class RawInputWatcher {
  private attached = false;
  private rafId = 0;
  private readonly padHeld = new Set<UiButton>();
  private readonly repeatAt = new Map<UiButton, number>();
  private readonly ignoreSuspend: boolean;
  private readonly keyboard: boolean;

  constructor(
    /** `source` is where the press came from (PR-0361: an overlay words itself for the device in use). */
    private readonly onButton: (button: UiButton, source: PressSource) => void,
    opts: RawInputWatcherOptions = {},
  ) {
    this.ignoreSuspend = opts.ignoreSuspend === true;
    this.keyboard = opts.keyboard !== false;
  }

  /** Is this watcher muted right now? */
  private get muted(): boolean {
    return suspended && !this.ignoreSuspend;
  }

  /** Does this watcher hear `button` from the pad right now? (not while it is claimed, or reserved for another watcher) */
  private hearsPad(button: UiButton): boolean {
    if (padClaims.has(button)) return false;
    return !(padReserve && padReserve.button === button && padReserve.owner !== this);
  }

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    trackPointer();
    if (this.keyboard) window.addEventListener('keydown', this.onKeyDown);
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
    if (e.isTrusted) noteDevice('keyboard');
    this.onButton(button, 'keyboard');
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

    for (const button of padClaims) if (!next.has(button)) padClaims.delete(button); // let go: the claim ends with the press
    for (const button of next) {
      const wasHeld = this.padHeld.has(button);
      // A press this watcher may not hear is still marked held below, so it never fires late once the claim lifts.
      if (!this.hearsPad(button)) continue;
      if (!wasHeld) {
        noteDevice('gamepad');
        this.onButton(button, 'gamepad');
        this.repeatAt.set(button, now + REPEAT_DELAY_MS);
      } else if (DIRECTIONS.has(button)) {
        const due = this.repeatAt.get(button) ?? Infinity;
        if (now >= due) {
          this.onButton(button, 'gamepad');
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
