/**
 * The input and focus contract (release 68, lane ui-input; ChatGPT's point 6 of 2026-10-17, Codex's audit T-0002).
 *
 * The problem it settles: `Input.ts` read every key for the game and called `preventDefault()` on Tab, Space and the arrows,
 * so a menu, a tab or a button could never take focus the browser way, and a real Enter on a focused control did not
 * activate that control (it was the screen's Confirm: on party prep, START BATTLE, whichever control had focus).
 *
 * ## Who owns a key press (first match wins; `Input.onKeyDown` asks {@link FocusLedger.keyDown})
 *
 * 1. **A chord** (Ctrl, Meta, Alt) is the browser's, always (unchanged).
 * 2. **An exclusive claim** (the briefing, a first-use card, the title's info panel) is the claimant's (unchanged; it never reaches here).
 * 3. **Text entry** (an input, a textarea, a select, a contenteditable) owns EVERY key: the game latches nothing and prevents nothing.
 * 4. **Tab and Shift+Tab** belong to the browser on the screens that say so ({@link BROWSER_TAB_SCREENS}: title, chapter select,
 *    party prep) so focus walks the controls; everywhere else (the battle, the pause menu, whose Tab is the approved
 *    "next tab") Tab stays the game's, exactly as before.
 * 5. **Enter and Space on a focused control** activate THAT control, once, and the game's Confirm is not also pressed, when
 *    the control is an activator (a native button or link, or `role` button, tab, switch, checkbox, radio, menuitem, option, link),
 *    the focus got there by Tab (or from assistive technology: a focus nobody explains), and it is not the screen's cursor.
 *    A native control does it itself; for a `div role="button"` the bridge calls `click()`, which `Input.onClick` turns into the
 *    same `data-action` a mouse click would.
 * 6. **Anything else is the game's**, exactly as before: Enter and Space on the screen's cursor (the element marked `data-cursor`,
 *    whose activation IS the screen's Confirm), on a control the mouse focused, or on nothing; the arrows, WASD, Z, X, Q, E, F, R,
 *    Escape, the pad. A control the mouse focused is let go on the first game key (`blur`), so Enter does not both Confirm and
 *    re-press the button that was clicked a minute ago.
 *
 * ## Focus follows the cursor
 *
 * A game key (anything but a modifier, Enter, Space or the browser's Tab) pressed while a control holds Tab-focus hands the keys
 * back to the game. After the frame in which the screen answered it, focus moves to the screen's cursor (the last `[data-cursor]` in the
 * top screen) or, with none, is let go. So Enter after an arrow is the cursor's Confirm, never the control the player Tabbed to
 * ten seconds ago, and a screen reader hears the cursor move. A cursor is drawn by the game's own highlight, so its focus ring is off
 * and every other control gets the Ink & Gold ring (both in `ui/inkgold/focus.css`).
 *
 * Escape is always Cancel. Pointer clicks never move focus into the contract: a clicked control keeps the game's keys.
 *
 * Game case: both (shared UI; the board, prep and title serve FFX and FFX-2 alike).
 */

export type KeyOwner = 'game' | 'browser' | 'field' | 'control';

/** How focus reached an element: `tab` (the browser walked there), `pointer` (a click or tap), `game` (the game moved it), `other` (nobody explains it: assistive technology). */
export type FocusSource = 'tab' | 'pointer' | 'game' | 'other';

/** The screens (their `data-screen` name) whose Tab is the browser's; a root can say so itself with `data-tab-owner="browser" | "game"`. */
export const BROWSER_TAB_SCREENS: ReadonlySet<string> = new Set(['title', 'chapter-select', 'party-prep']);

const ACTIVATOR_ROLES: ReadonlySet<string> = new Set([
  'button',
  'tab',
  'switch',
  'checkbox',
  'radio',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'link',
]);

/** Inputs that are controls, not fields: Space and Enter press them, the arrows are not theirs. */
const BUTTON_INPUT_TYPES: ReadonlySet<string> = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'image']);

/** The keys that press a focused control. Z is Confirm in the game and nothing in the DOM. */
const ACTIVATION_CODES: ReadonlySet<string> = new Set(['Enter', 'NumpadEnter', 'Space']);

/** Keys that change nothing by themselves (a held Shift is the start of Shift+Tab, not a game press). */
const QUIET_CODES: ReadonlySet<string> = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
  'CapsLock',
  'NumLock',
  'ContextMenu',
]);

/** True for an element the keys are typed into. */
export function isTextEntry(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') return !BUTTON_INPUT_TYPES.has(((el as HTMLInputElement).type ?? 'text').toLowerCase());
  const editable = el.getAttribute('contenteditable');
  return editable !== null && editable !== 'false';
}

/** True for a native button, link or summary (the browser presses these itself on Enter and Space). */
export function isNativeActivator(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'BUTTON' || tag === 'SUMMARY') return true;
  if (tag === 'A') return el.hasAttribute('href');
  return tag === 'INPUT' && BUTTON_INPUT_TYPES.has(((el as HTMLInputElement).type ?? '').toLowerCase());
}

/** True for a control a key press can activate: native, or a role that says so. A disabled one is not. */
export function isActivator(el: Element | null): boolean {
  if (!el) return false;
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return false;
  if (isNativeActivator(el)) return true;
  return ACTIVATOR_ROLES.has((el.getAttribute('role') ?? '').toLowerCase());
}

/** The screen's cursor: its activation is the screen's own Confirm (`data-cursor`). */
export function isCursor(el: Element | null): boolean {
  return el?.hasAttribute('data-cursor') === true;
}

/** The screen on top: the last `[data-screen]` root (screens are appended in stack order, an overlay last). */
export function topScreenRoot(doc: Document): Element | null {
  const roots = doc.querySelectorAll('[data-screen]');
  return roots.length > 0 ? (roots[roots.length - 1] ?? null) : null;
}

/** Who owns Tab on the screen whose root this is. */
export function tabOwnerOf(root: Element | null): 'browser' | 'game' {
  const declared = root?.getAttribute('data-tab-owner');
  if (declared === 'browser' || declared === 'game') return declared;
  return root !== null && BROWSER_TAB_SCREENS.has(root.getAttribute('data-screen') ?? '') ? 'browser' : 'game';
}

/**
 * Tracks how focus got where it is, and decides who owns each key. One per `Input`.
 *
 * It holds no game state: a node environment (no `document`) makes every answer `'game'`, so the unit tests of the
 * screens that run without a DOM are unchanged.
 */
export class FocusLedger {
  /** What the input event that is happening right now says about a focus move that follows it. */
  private cause: FocusSource | null = null;
  private causeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly sources = new WeakMap<Element, FocusSource>();
  /** A game key arrived while a Tab-focused control held focus: after the frame, focus goes to the cursor. */
  private releaseFrom: Element | null = null;
  private bridging = false;
  private attached = false;

  constructor(
    private readonly doc: Document | null = typeof document !== 'undefined' ? document : null,
    private readonly win: EventTarget | null = typeof window !== 'undefined' ? window : null,
  ) {}

  attach(): void {
    if (this.attached || !this.doc) return;
    this.attached = true;
    this.doc.addEventListener('focusin', this.onFocusIn, true);
    for (const type of ['pointerdown', 'mousedown', 'touchstart']) this.win?.addEventListener(type, this.onPointer, true);
  }

  detach(): void {
    if (!this.attached || !this.doc) return;
    this.attached = false;
    this.doc.removeEventListener('focusin', this.onFocusIn, true);
    for (const type of ['pointerdown', 'mousedown', 'touchstart']) this.win?.removeEventListener(type, this.onPointer, true);
    if (this.causeTimer !== null) clearTimeout(this.causeTimer);
    this.causeTimer = null;
    this.cause = null;
  }

  /** True while the bridge's own `click()` is running, so `Input.onClick` does not take it for a mouse. */
  get bridged(): boolean {
    return this.bridging;
  }

  /** How focus reached `el`, or null if it was never seen to arrive. */
  sourceOf(el: Element | null): FocusSource | null {
    return el ? (this.sources.get(el) ?? null) : null;
  }

  private setCause(cause: FocusSource): void {
    this.cause = cause;
    if (this.causeTimer !== null) clearTimeout(this.causeTimer);
    // The browser moves focus after the event's listeners return and before the next task: a zero timer is the end of "this input caused it".
    this.causeTimer = setTimeout(() => {
      this.cause = null;
      this.causeTimer = null;
    }, 0);
    (this.causeTimer as { unref?: () => void }).unref?.();
  }

  private readonly onPointer = (): void => this.setCause('pointer');

  private readonly onFocusIn = (e: Event): void => {
    const el = e.target;
    if (!(el instanceof Element)) return;
    // A move with no input behind it (assistive technology, or the game restoring focus) keeps what the element was before: a control the mouse had focused stays the mouse's.
    this.sources.set(el, this.cause ?? this.sources.get(el) ?? 'other');
  };

  /** Move focus as the game: the new focus is the game's, not a Tab's. */
  private focusAsGame(el: HTMLElement): void {
    const was = this.cause;
    this.cause = 'game';
    try {
      el.focus({ preventScroll: true });
    } finally {
      this.cause = was;
    }
  }

  /**
   * Decide who owns this key press and do what that owner does before the game sees it.
   * `'game'`: carry on as before (latch the button). Anything else: `Input` latches nothing.
   */
  keyDown(e: KeyboardEvent): KeyOwner {
    const doc = this.doc;
    if (!doc) return 'game';
    const active = doc.activeElement;
    const code = e.code;

    if (isTextEntry(active)) return 'field';

    if (code === 'Tab') {
      if (tabOwnerOf(topScreenRoot(doc)) !== 'browser') return 'game';
      this.setCause('tab');
      return 'browser';
    }

    const activation = ACTIVATION_CODES.has(code);
    const el = active !== null && active !== doc.body && isActivator(active) ? active : null;
    const source: FocusSource = el ? (this.sources.get(el) ?? 'other') : 'other';
    if (el && activation && !isCursor(el) && (source === 'tab' || source === 'other')) {
      // The control's own key. A native control presses itself; anything else is pressed here, once.
      if (!isNativeActivator(el)) {
        e.preventDefault();
        if (!e.repeat) this.press(el as HTMLElement);
      }
      return 'control';
    }

    if (el && activation) e.preventDefault(); // the game's Confirm: not also the browser's click on the same control
    else if (el && !QUIET_CODES.has(code)) {
      // Any other game key hands the keys back: a clicked control lets go at once; a Tab-focused one follows the cursor after the frame.
      if (source === 'pointer') (el as HTMLElement).blur();
      else this.releaseFrom = el;
    }
    return 'game';
  }

  /** The bridge: what a mouse click on `el` would do, from the keyboard. */
  private press(el: HTMLElement): void {
    this.bridging = true;
    try {
      el.click();
    } finally {
      this.bridging = false;
    }
  }

  /** Call once at the end of every frame (`Input.endFrame`): the focus follows the cursor after a game key. */
  afterFrame(): void {
    const from = this.releaseFrom;
    if (!from) return;
    this.releaseFrom = null;
    const doc = this.doc;
    if (!doc) return;
    const active = doc.activeElement;
    // The screen put focus somewhere itself while it answered the key (the pause pages focus their selected row): that is the cursor's, leave it.
    if (active !== null && active !== doc.body && active !== from) return;
    // The last cursor in the screen: a screen with a tab strip and rows under it (the pause menu) marks both, and the one nearest the content is the one in play.
    const cursors = topScreenRoot(doc)?.querySelectorAll<HTMLElement>('[data-cursor]');
    const cursor = cursors && cursors.length > 0 ? (cursors[cursors.length - 1] ?? null) : null;
    if (cursor && cursor !== active) this.focusAsGame(cursor);
    else if (!cursor && active instanceof HTMLElement && active !== doc.body && !isTextEntry(active)) active.blur();
  }
}
