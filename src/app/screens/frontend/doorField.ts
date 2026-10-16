/**
 * **The phone's way to type a door word** (release candidate r50-rc; shared plumbing, both games).
 *
 * The board's doors (`./chapterDoors.ts`) listen for physical key presses (`ChapterSelectScreen.onDoorKey`), and the one tap door, FF7's seven taps on the "Chapter select" label, cannot carry a word,
 * so on a phone no hidden chapter could be opened (Bailey tried the new ones on his phone). This is the way in that shows nothing until it is asked for:
 *
 * - **A long press** (600 ms, the finger or the mouse held still) **on the label**, the element whose taps feed FF7's door, puts up one small Ink & Gold text field over it and, when the press is let go,
 *   asks the device for its keyboard (a keyboard only opens from a user gesture on a phone: the release is the gesture). Nothing else changes on the board; before the press there is no field, no hint, no
 *   sound and no sign, and the label looks and answers taps exactly as before (`chapter-select-c.css`).
 * - **Every letter typed there feeds the doors' own matcher**: a fresh `BoardDoors` (the table `CHAPTER_DOORS`, so every word the board knows works and a word added to the table works here with no change), one
 *   letter at a time, in any case. The letters are timed as one run (a thumb hunting for a letter must not run out of the keyboard's 2 s gap, and a visible field needs no such guard), a letter removed or
 *   replaced (backspace, a suggestion that rewrote the word) starts the matcher over on what the field now says, and a word that is finished opens its chapter at once and closes the field. The input event is
 *   the source, not the key event: a phone's keyboard sends `Unidentified` keys and whole composed words, and the field must read what is in it.
 * - **Enter, a blur (the keyboard put away, a tap elsewhere) or Escape close it**; a wrong word opens nothing and the field is gone with its text: nothing is remembered, nothing is shown, nothing is written.
 *   A phone may still send mouse events after a long press is let go (a mousedown that takes the focus from the field, then a click): a blur in the next 700 ms is that, not the player, and the click puts the focus back.
 * - **While it is up it owns the keyboard** (`Input.claimKeyboard`, exclusive): a letter typed here is never a board button (the Z of "gagazet" is CONFIRM, the A of "angra" is left) and never reaches the
 *   door's own key listener, so the board's visit-long matcher and FF7's seven taps and pad sequence are not fed by it; without an `Input` (a unit test, a standalone registration) the field's own key handler
 *   stops the letters at the field.
 * - **It does not disturb the label's taps**: a short press is a tap as before, and the click that follows a long press is taken here (capture phase, before the tap listener) so it is never the seventh tap.
 *
 * Pure of the board: the screen hands in the label, the host the field is appended to, the keyboard and what to do when a door opens (`ChapterSelectScreen.openDoor`, which also keeps FF7's gate).
 * `tests/unit/phone-door-field.test.ts` drives the real board with real pointer, input and key events.
 */

import type { ChapterId } from '../../../data/encounters.ts';
import { BoardDoors } from './chapterDoors.ts';

/** How long a press on the label must last to be a long press, ms. */
export const HOLD_MS = 600;
/** How far the pointer may drift during the hold, px: more is a scroll or a drag, not a press. */
export const HOLD_SLOP_PX = 10;
/** After a long press is let go, a phone may still send its mouse events (a mousedown that takes the focus from the field, then a click): a blur this soon is not the player putting the keyboard away, ms. */
export const SETTLE_MS = 700;

/** The part of `app/Input.ts` the field needs: an exclusive claim on the keyboard. Optional, so a unit test or a standalone registration can run without it. */
export interface DoorKeyboard {
  claimKeyboard(onKey: (e: KeyboardEvent) => void, opts?: { exclusive?: boolean }): () => void;
}

export interface DoorFieldOptions {
  /** The screen's root: the field is appended to it and removed from it. */
  host: HTMLElement;
  /** The "Chapter select" label: long presses on it open the field. */
  label: HTMLElement;
  /** The game's input (`App.input`), when there is one. */
  keyboard?: Partial<DoorKeyboard> | null;
  /** A door's word was typed: the chapter it leads to. Answers whether it opened; a door behind a shut switch does not, and the field then stays as it was, so that word looks like any other. */
  onDoor: (id: ChapterId) => boolean;
  /** Long-press length, ms. Defaults to {@link HOLD_MS}. */
  holdMs?: number;
}

export class DoorField {
  private el: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private release: (() => void) | null = null;
  private timer = 0;
  private pressing = false;
  /** The hold in progress ran its full time: the field is up, the release asks for the keyboard, and the click after it is not a tap. */
  private fired = false;
  private suppressClick = false;
  /** Until when (`Date.now()`) a blur is the phone's own mouse events and not the player's. */
  private settleUntil = 0;
  private startX = 0;
  private startY = 0;
  private doors = new BoardDoors();
  private fed = '';
  private tick = 0;
  private readonly holdMs: number;

  constructor(private readonly opts: DoorFieldOptions) {
    this.holdMs = opts.holdMs ?? HOLD_MS;
    const label = opts.label;
    label.addEventListener('pointerdown', this.onDown);
    label.addEventListener('pointermove', this.onMove);
    label.addEventListener('pointerup', this.onUp);
    label.addEventListener('pointercancel', this.onCancel);
    label.addEventListener('contextmenu', this.onContext);
    label.addEventListener('click', this.onClick, true); // capture: ahead of the screen's tap listener, which is added to the same element after this one
  }

  /** True while the field is up. */
  get isOpen(): boolean {
    return this.el !== null;
  }

  /** Put the field up (a long press does; a test or a caller may). Its keyboard is asked for on the release of the press, or by a tap on the field. */
  open(): void {
    if (this.el) return;
    const el = document.createElement('div');
    el.className = 'fe-doorfield';
    const input = document.createElement('input');
    input.className = 'fe-doorfield__input';
    input.type = 'text';
    input.setAttribute('inputmode', 'text');
    input.setAttribute('enterkeyhint', 'done');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('aria-label', 'Word');
    input.setAttribute('data-lpignore', 'true'); // password managers: not a login
    input.setAttribute('data-1p-ignore', 'true');
    input.maxLength = 32;
    el.appendChild(input);
    this.opts.host.appendChild(el);
    this.el = el;
    this.input = input;
    this.doors = new BoardDoors();
    this.fed = '';
    this.tick = 0;
    input.addEventListener('input', this.onInput);
    input.addEventListener('blur', this.onBlur);
    input.addEventListener('keydown', this.onFieldKey);
    const keyboard = this.opts.keyboard;
    if (keyboard && typeof keyboard.claimKeyboard === 'function') this.release = keyboard.claimKeyboard(this.onKey, { exclusive: true });
  }

  /** Put the field away with its text: nothing of it is kept. */
  close(): void {
    const { el, input } = this;
    if (!el) return;
    this.el = null;
    this.input = null;
    input?.removeEventListener('input', this.onInput);
    input?.removeEventListener('blur', this.onBlur);
    input?.removeEventListener('keydown', this.onFieldKey);
    input?.blur();
    el.remove();
    const release = this.release;
    this.release = null;
    release?.();
    this.doors = new BoardDoors();
    this.fed = '';
    this.tick = 0;
  }

  /** The screen is leaving: the field, the listeners and the timers go. */
  dispose(): void {
    this.cancelHold();
    this.suppressClick = false;
    this.close();
    const label = this.opts.label;
    label.removeEventListener('pointerdown', this.onDown);
    label.removeEventListener('pointermove', this.onMove);
    label.removeEventListener('pointerup', this.onUp);
    label.removeEventListener('pointercancel', this.onCancel);
    label.removeEventListener('contextmenu', this.onContext);
    label.removeEventListener('click', this.onClick, true);
  }

  // ---------------------------------------------------------------- the press

  private readonly onDown = (e: PointerEvent): void => {
    if (e.button > 0) return; // a mouse's other buttons
    this.suppressClick = false; // a new press: the click of the last long press, if it was coming, has come
    this.pressing = true;
    this.fired = false;
    this.startX = e.clientX;
    this.startY = e.clientY;
    try { this.opts.label.setPointerCapture?.(e.pointerId); } catch { /* not every engine lets a synthetic pointer be captured */ }
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(this.fire, this.holdMs);
  };

  private readonly fire = (): void => {
    this.timer = 0;
    if (!this.pressing) return;
    this.fired = true;
    this.suppressClick = true;
    this.open();
  };

  private readonly onMove = (e: PointerEvent): void => {
    if (this.pressing && !this.fired && Math.hypot(e.clientX - this.startX, e.clientY - this.startY) > HOLD_SLOP_PX) this.cancelHold();
  };

  private readonly onUp = (): void => {
    const was = this.fired;
    this.cancelHold();
    if (!was) return;
    this.settleUntil = Date.now() + SETTLE_MS;
    this.input?.focus(); // the release is the user gesture a phone wants before it shows a keyboard
  };

  /** A drag or a scroll took the press: before the field was up there is nothing to do; after, the field stays, unfocused (a tap on it asks for the keyboard). */
  private readonly onCancel = (): void => {
    this.cancelHold();
  };

  private cancelHold(): void {
    window.clearTimeout(this.timer);
    this.timer = 0;
    this.pressing = false;
    this.fired = false;
  }

  /** The click a long press may leave (most phones leave none) is not a tap: it is taken here, ahead of the tap listener. */
  private readonly onClick = (e: Event): void => {
    if (!this.suppressClick) return;
    this.suppressClick = false;
    e.stopImmediatePropagation();
    e.preventDefault();
    this.input?.focus(); // the mousedown before it took the focus from the field (the blur was let go): the click is a gesture too, so the keyboard stays
  };

  /** Android's long press opens a context menu on the label: not while a press on it is being held. */
  private readonly onContext = (e: Event): void => {
    if (this.pressing || this.fired) e.preventDefault();
  };

  // --------------------------------------------------------------- the field

  private readonly onInput = (): void => {
    const text = (this.input?.value ?? '').toLowerCase();
    if (!text.startsWith(this.fed)) { this.doors = new BoardDoors(); this.fed = ''; this.tick = 0; } // a letter removed or rewritten: match again from what the field says
    const fresh = text.slice(this.fed.length);
    this.fed = text;
    for (const ch of fresh) {
      const fed = this.doors.feedKey(ch, this.tick++);
      const id = fed.now ?? fed.next;
      if (id) {
        if (this.opts.onDoor(id)) this.close(); // opened: the field goes with the board's turn; shut: nothing changed, as for a wrong word
        return;
      }
    }
  };

  private readonly onBlur = (): void => {
    if (Date.now() < this.settleUntil) return; // the phone's mouse events after the release, not the player: the click puts the focus back
    this.close();
  };

  /** The claim's key handler (the game's `Input`, capture phase, before anything else sees the key): Enter and Escape put the field away. */
  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Enter' && e.key !== 'Escape') return;
    e.preventDefault();
    this.close();
  };

  /** Without an `Input`: the letters typed in the field stop at the field, and Enter and Escape close it. */
  private readonly onFieldKey = (e: KeyboardEvent): void => {
    e.stopPropagation();
    this.onKey(e);
  };
}
