/**
 * Unified input: keyboard, gamepad and pointer, reduced to a small set of
 * abstract buttons that every screen and menu speaks.
 *
 * The game never listens to raw events. Once per frame {@link Input.update} is
 * called, and screens receive the resulting {@link InputSnapshot}.
 */

export type Button =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm'
  | 'cancel'
  | 'triangle'
  | 'start'
  | 'select'
  | 'l1'
  | 'r1';

export const BUTTONS: readonly Button[] = [
  'up',
  'down',
  'left',
  'right',
  'confirm',
  'cancel',
  'triangle',
  'start',
  'select',
  'l1',
  'r1',
];

const DIRECTIONS: readonly Button[] = ['up', 'down', 'left', 'right'];

/** KeyboardEvent.code -> abstract button. */
const KEY_MAP: Record<string, Button> = {
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
  Tab: 'triangle',
  KeyQ: 'triangle',

  KeyE: 'start',
  KeyC: 'start',

  KeyM: 'select',
  KeyV: 'select',

  KeyR: 'r1',
  PageDown: 'r1',
  KeyF: 'l1',
  PageUp: 'l1',
};

/** Standard-gamepad button index -> abstract button. */
const PAD_MAP: Record<number, Button> = {
  0: 'confirm', // cross / A
  1: 'cancel', // circle / B
  3: 'triangle', // triangle / Y
  4: 'l1',
  5: 'r1',
  8: 'select', // select / back / share
  9: 'start',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
};

/** Shared empty list, so the blind `actions` getter allocates nothing. */
const EMPTY_ACTIONS: readonly string[] = [];

const AXIS_DEADZONE = 0.45;
const REPEAT_DELAY_MS = 360;
const REPEAT_INTERVAL_MS = 110;

/** Read-only view of this frame's input, handed to `Screen.handleInput`. */
export interface InputSnapshot {
  /** Held right now. */
  pressed(button: Button): boolean;
  /** Went down this frame (directions also fire on auto-repeat). */
  justPressed(button: Button): boolean;
  /** Came up this frame. */
  justReleased(button: Button): boolean;
  /** Consume a just-pressed edge so a parent screen does not also see it. */
  consume(button: Button): boolean;
  /** -1..1 analogue/dpad axes, dpad and WASD included. */
  readonly axis: { x: number; y: number };
  /** `data-action` values clicked/tapped this frame, in order. */
  readonly actions: readonly string[];
  /** True while any gamepad is connected. */
  readonly gamepadConnected: boolean;
  /** Most recent input device, for showing the right button prompts. */
  readonly lastDevice: 'keyboard' | 'gamepad' | 'pointer';
}

/** What a claimant asked for. See {@link Input.claimKeyboard}. */
interface KeyboardClaim {
  onKey: (e: KeyboardEvent) => void;
  /**
   * True when the claimant owns **input**, not only the raw keys: no abstract
   * button is latched for a key it swallows, and no screen behind it is told
   * about any button at all.
   */
  exclusive: boolean;
}

export interface ClaimOptions {
  /** See {@link KeyboardClaim.exclusive}. Defaults to `false`. */
  exclusive?: boolean;
}

interface ButtonState {
  down: boolean;
  downPrev: boolean;
  /** Timestamp (ms) at which the next auto-repeat edge is due. */
  nextRepeatAt: number;
  /** Extra edge injected by auto-repeat this frame. */
  repeated: boolean;
  consumed: boolean;
  /**
   * Set by a press, cleared at the end of the frame that reports it. Without it
   * a tap that goes down and up between two frames — synthetic keystrokes in
   * e2e, a very fast real tap — would be swallowed entirely.
   */
  latched: boolean;
}

export interface InputOptions {
  /** Element pointer clicks are listened on. Defaults to #ui, else document.body. */
  pointerRoot?: HTMLElement;
  /** Keyboard target. Defaults to window. */
  keyboardTarget?: EventTarget;
}

export class Input implements InputSnapshot {
  private readonly state = new Map<Button, ButtonState>();
  private readonly heldKeys = new Set<string>();
  private readonly pendingActions: string[] = [];
  private frameActions: string[] = [];
  private readonly pointerRoot: HTMLElement;
  private readonly keyboardTarget: EventTarget;

  private _axis = { x: 0, y: 0 };
  private _gamepadConnected = false;
  private _lastDevice: 'keyboard' | 'gamepad' | 'pointer' = 'keyboard';
  private padDown = new Set<Button>();
  private attached = false;
  private now = 0;
  /** The current keyboard claimant. See {@link claimKeyboard}. */
  private keyboardClaim: KeyboardClaim | null = null;
  /**
   * Frames left to drop every edge, set when an exclusive claim is handed back.
   *
   * The press that dismissed an overlay belongs to the overlay. Without this,
   * whichever of the two gamepad poll loops happened to run first — this class's
   * `pollGamepads`, or the overlay's own `requestAnimationFrame` — decided
   * whether the screen behind also acted on it.
   */
  private swallowFrames = 0;

  constructor(opts: InputOptions = {}) {
    this.pointerRoot =
      opts.pointerRoot ?? (document.getElementById('ui') as HTMLElement | null) ?? document.body;
    this.keyboardTarget = opts.keyboardTarget ?? window;
    for (const b of BUTTONS) {
      this.state.set(b, {
        down: false,
        downPrev: false,
        nextRepeatAt: Infinity,
        repeated: false,
        consumed: false,
        latched: false,
      });
    }
  }

  // ------------------------------------------------------------------ wiring

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    // **Capture phase, deliberately.** Several HUD widgets listen for keys
    // straight off `window` themselves (`ui/ffx/rawInput.ts`'s
    // `RawInputWatcher`, `ui/ffx2/CommandMenu.ts`, the strategy guide's `G`)
    // because the presenter calls them outside the screen-input cycle. Listening
    // first is what lets {@link claimKeyboard} cut every one of them off while an
    // overlay owns the keyboard — see that method.
    this.keyboardTarget.addEventListener('keydown', this.onKeyDown as EventListener, true);
    this.keyboardTarget.addEventListener('keyup', this.onKeyUp as EventListener, true);
    window.addEventListener('blur', this.onBlur);
    this.pointerRoot.addEventListener('click', this.onClick as EventListener);
    window.addEventListener('gamepadconnected', this.onGamepadChange);
    window.addEventListener('gamepaddisconnected', this.onGamepadChange);
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    this.keyboardTarget.removeEventListener('keydown', this.onKeyDown as EventListener, true);
    this.keyboardTarget.removeEventListener('keyup', this.onKeyUp as EventListener, true);
    window.removeEventListener('blur', this.onBlur);
    this.pointerRoot.removeEventListener('click', this.onClick as EventListener);
    window.removeEventListener('gamepadconnected', this.onGamepadChange);
    window.removeEventListener('gamepaddisconnected', this.onGamepadChange);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    // An exclusive claim stops the event dead here, in the capture phase, so no
    // other `window` listener in the tree sees it — see {@link claimKeyboard}.
    // Chords are left alone so browser shortcuts (Ctrl+R, Cmd+Shift+I) still
    // work while a menu is up.
    const claim = this.keyboardClaim;
    const claimed = claim !== null && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (claim && claimed) {
      e.stopImmediatePropagation();
      claim.onKey(e);
    }

    const button = KEY_MAP[e.code];
    if (!button) return;
    // Tab and the arrows would otherwise scroll or move focus out of the game.
    if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    // An exclusive claimant consumed this key outright. Stopping the DOM event
    // is not enough: latching the abstract button here is what used to let the
    // screen behind an overlay act on the very press that dismissed it, one
    // frame later.
    if (claimed && claim?.exclusive) return;
    if (e.repeat) return;
    this.heldKeys.add(e.code);
    this._lastDevice = 'keyboard';
    this.press(button);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    if (this.keyboardClaim && !e.ctrlKey && !e.metaKey && !e.altKey) e.stopImmediatePropagation();
    const button = KEY_MAP[e.code];
    if (!button) return;
    this.heldKeys.delete(e.code);
    // Another key bound to the same button may still be held.
    const stillHeld = Object.entries(KEY_MAP).some(
      ([code, b]) => b === button && this.heldKeys.has(code),
    );
    if (!stillHeld && !this.padDown.has(button)) this.release(button);
  };

  private readonly onBlur = (): void => {
    this.heldKeys.clear();
    this.padDown.clear();
    for (const b of BUTTONS) this.release(b);
  };

  private readonly onClick = (e: Event): void => {
    const target = e.target as HTMLElement | null;
    const el = target?.closest?.('[data-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset['action'];
    if (!action) return;
    this._lastDevice = 'pointer';
    this.pendingActions.push(action);
  };

  private readonly onGamepadChange = (): void => {
    this._gamepadConnected = this.readPads().length > 0;
  };

  // ------------------------------------------------------------------- state

  private press(button: Button): void {
    const s = this.state.get(button)!;
    if (!s.down) {
      s.down = true;
      s.nextRepeatAt = this.now + REPEAT_DELAY_MS;
      s.latched = true;
    }
  }

  private release(button: Button): void {
    const s = this.state.get(button)!;
    s.down = false;
    s.nextRepeatAt = Infinity;
  }

  private readPads(): Gamepad[] {
    const pads = navigator.getGamepads?.() ?? [];
    return Array.from(pads).filter((p): p is Gamepad => p !== null && p.connected);
  }

  private pollGamepads(): void {
    const pads = this.readPads();
    this._gamepadConnected = pads.length > 0;
    const next = new Set<Button>();
    let ax = 0;
    let ay = 0;

    for (const pad of pads) {
      for (const [indexStr, button] of Object.entries(PAD_MAP)) {
        if (pad.buttons[Number(indexStr)]?.pressed) next.add(button);
      }
      const x = pad.axes[0] ?? 0;
      const y = pad.axes[1] ?? 0;
      if (Math.abs(x) > AXIS_DEADZONE) {
        next.add(x < 0 ? 'left' : 'right');
        ax = x;
      }
      if (Math.abs(y) > AXIS_DEADZONE) {
        next.add(y < 0 ? 'up' : 'down');
        ay = -y;
      }
    }

    if (next.size > 0 && this.padDown.size === 0) this._lastDevice = 'gamepad';

    for (const b of next) if (!this.padDown.has(b)) this.press(b);
    for (const b of this.padDown) {
      if (next.has(b)) continue;
      const keyHeld = Object.entries(KEY_MAP).some(
        ([code, mapped]) => mapped === b && this.heldKeys.has(code),
      );
      if (!keyHeld) this.release(b);
    }
    this.padDown = next;

    if (ax !== 0 || ay !== 0) this._axis = { x: ax, y: ay };
  }

  /** Advance one frame. Call before dispatching to the active screen. */
  update(nowMs: number = performance.now()): InputSnapshot {
    this.now = nowMs;
    this.pollGamepads();

    for (const b of BUTTONS) {
      const s = this.state.get(b)!;
      s.repeated = false;
      s.consumed = false;
      if (s.down && s.downPrev && DIRECTIONS.includes(b) && nowMs >= s.nextRepeatAt) {
        s.repeated = true;
        s.nextRepeatAt = nowMs + REPEAT_INTERVAL_MS;
      }
    }

    // Keyboard axis, only when the pad is not driving it.
    if (this.padDown.size === 0) {
      this._axis = {
        x: (this.pressed('right') ? 1 : 0) - (this.pressed('left') ? 1 : 0),
        y: (this.pressed('up') ? 1 : 0) - (this.pressed('down') ? 1 : 0),
      };
    }

    this.frameActions = this.pendingActions.splice(0, this.pendingActions.length);
    if (this.swallowFrames > 0) {
      this.swallowFrames -= 1;
      this.absorbEdges();
    }
    return this;
  }

  /**
   * Drop every edge that is pending right now.
   *
   * Rolling `downPrev` forward by hand is the part that matters: a button still
   * held when an overlay hands input back must not read as a fresh press, and
   * must still produce one the next time it is genuinely pressed.
   */
  private absorbEdges(): void {
    for (const b of BUTTONS) {
      const s = this.state.get(b)!;
      s.downPrev = s.down;
      s.latched = false;
      s.repeated = false;
      s.consumed = true;
    }
    this.pendingActions.length = 0;
    this.frameActions = [];
  }

  /** Call at the very end of the frame to roll edges forward. */
  endFrame(): void {
    for (const b of BUTTONS) {
      const s = this.state.get(b)!;
      s.downPrev = s.down;
      s.latched = false;
    }
  }

  // --------------------------------------------------------------- snapshot

  /**
   * True while an exclusive overlay owns input, so every screen behind it is
   * told there is none. The overlay reads the keyboard through its claim and
   * the pad through its own watcher; nobody else reads anything.
   */
  private get blind(): boolean {
    return this.keyboardClaim?.exclusive === true;
  }

  pressed(button: Button): boolean {
    if (this.blind) return false;
    return this.state.get(button)?.down ?? false;
  }

  justPressed(button: Button): boolean {
    if (this.blind) return false;
    const s = this.state.get(button);
    if (!s || s.consumed) return false;
    return (s.down && !s.downPrev) || s.repeated || s.latched;
  }

  justReleased(button: Button): boolean {
    if (this.blind) return false;
    const s = this.state.get(button);
    if (!s) return false;
    return !s.down && s.downPrev;
  }

  consume(button: Button): boolean {
    const was = this.justPressed(button);
    const s = this.state.get(button);
    if (s && was) s.consumed = true;
    return was;
  }

  get axis(): { x: number; y: number } {
    return this.blind ? { x: 0, y: 0 } : this._axis;
  }

  get actions(): readonly string[] {
    return this.blind ? EMPTY_ACTIONS : this.frameActions;
  }

  get gamepadConnected(): boolean {
    return this._gamepadConnected;
  }

  get lastDevice(): 'keyboard' | 'gamepad' | 'pointer' {
    return this._lastDevice;
  }

  // ------------------------------------------------------- exclusive claims

  /**
   * Take the keyboard away from every other `window` listener until the
   * returned function is called.
   *
   * The battle HUDs do not route input through this class: the presenter calls
   * `HudPort.chooseCommand()` and awaits a promise, outside App's per-frame
   * screen-input cycle, so the FFX command menu (`ui/ffx/rawInput.ts`) and the
   * FFX-2 one (`ui/ffx2/CommandMenu.ts`) each listen on `window` for as long as
   * they are open. That used to make a pause menu over a live command menu
   * impossible: both would read the same arrow keys, and Enter would resolve a
   * command — taking a real turn — from behind the pause screen.
   *
   * A claim closes that. `Input`'s own listener runs in the **capture** phase,
   * so it is first; while claimed it calls `stopImmediatePropagation()` and the
   * event never reaches the menu at all. `Input` itself still records the press
   * (we are inside its handler), so the claimant keeps playing normally, and
   * `onKey` hands it the raw event for keys that are not in the abstract map —
   * the pause screen's `H`, for one.
   *
   * Claims nest: releasing restores whatever claim was in force before, and
   * releasing twice is a no-op.
   *
   * ## `exclusive`
   *
   * The pause menu wants the keys *and* its own abstract buttons, so that is
   * the default. A **modal overlay** — Auron's briefing — wants the opposite:
   * it is the only thing on screen, and the press that takes it down must not
   * also be acted on by whatever is behind it. `exclusive` gives it that: the
   * key latches no button, screens behind read no input at all, and the frame
   * after the claim is handed back drops every edge, so it makes no difference
   * whether this class or the overlay's own watcher polled the pad first.
   */
  claimKeyboard(onKey: (e: KeyboardEvent) => void = () => {}, opts: ClaimOptions = {}): () => void {
    const previous = this.keyboardClaim;
    const claim: KeyboardClaim = { onKey, exclusive: opts.exclusive === true };
    this.keyboardClaim = claim;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (this.keyboardClaim === claim) this.keyboardClaim = previous;
      if (claim.exclusive) {
        this.absorbEdges();
        this.swallowFrames = 1;
      }
    };
  }

  /** True while some overlay owns the keyboard exclusively. */
  get keyboardClaimed(): boolean {
    return this.keyboardClaim !== null;
  }

  /** Testing / debug hook: synthesise a button press for one frame. */
  injectPress(button: Button): void {
    this.press(button);
  }

  /** Testing / debug hook: synthesise a `data-action` click. */
  injectAction(action: string): void {
    this.pendingActions.push(action);
  }
}
