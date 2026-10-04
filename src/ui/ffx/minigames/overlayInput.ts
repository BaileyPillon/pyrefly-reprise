import { isCoarsePointer } from '../../common/ControlsHint.ts';
import { lastPlayerDevice, type PlayerDevice, type UiButton } from '../rawInput.ts';

/**
 * How an FFX Overdrive overlay words itself for the input the player is using
 * (PR-0360 and PR-0361, release 39; **FFX only**: Auron's Bushido and Tidus's Swordplay exist only in FFX).
 *
 * Round 21 found two defects on the same two overlays. On a phone nothing answered them: the overlays
 * read input only through `RawInputWatcher` (keyboard and pad), so every tap and click resolved the
 * Fail row at timer expiry (PR-0360). And the Bushido chips named PlayStation glyphs only, so a
 * keyboard player never learned that Circle is Esc or that release 38's Square is K (PR-0361).
 * `ffx2/TriggerHappy.ts` solved the same pair for FFX-2 in release 37; this is its device logic and
 * its wording for FFX, kept in this folder so FFX-2 is untouched:
 *
 * | Input    | Route                                                           | Chip shows (Bushido)   | Words (Swordplay)            |
 * |----------|-----------------------------------------------------------------|------------------------|------------------------------|
 * | keyboard | `keydown` through `RawInputWatcher` (`rawInput.KEY_MAP`)        | the key, then the glyph | `PRESS ENTER IN THE GOLD ZONE` |
 * | gamepad  | the pad poll in `RawInputWatcher` (`PAD_BUTTON_MAP`)            | the PlayStation glyph  | `PRESS CROSS ...`            |
 * | mouse    | `pointerdown` on the slab                                       | the key, then the glyph | `CLICK IN THE GOLD ZONE`     |
 * | touch    | `pointerdown` on the slab                                       | the glyph, as a big target | `TAP IN THE GOLD ZONE`   |
 *
 * A mouse player has a keyboard under the other hand, so a mouse names the keys as well as accepting
 * the click; a finger has neither, so a touch screen shows only the symbols it taps.
 *
 * Which row applies follows the input the player used last: the HUD's own watchers record it
 * (`rawInput.lastPlayerDevice`, so the first frame is right: the player reached the overlay with it a
 * moment ago), and before any press the best guess is TriggerHappy's: a touch screen, else a connected
 * pad, else the keyboard. Then every press on the overlay updates it.
 */

/** The device the overlay words itself for, and what kind of pointer when it is the pointer. */
export interface DeviceState {
  device: PlayerDevice;
  /** `PointerEvent.pointerType` (`mouse`, `touch`, `pen`) when the device is the pointer, else the last one seen. */
  pointerKind: string;
}

function padConnected(): boolean {
  try {
    return Array.from(navigator.getGamepads?.() ?? []).some((p) => p !== null && p.connected);
  } catch {
    return false;
  }
}

/** The input to word the overlay for before it has had a press of its own. */
export function guessDevice(): DeviceState {
  const seen = lastPlayerDevice();
  if (seen) return { device: seen.device, pointerKind: seen.pointerKind || 'mouse' };
  if (isCoarsePointer()) return { device: 'pointer', pointerKind: 'touch' };
  return { device: padConnected() ? 'gamepad' : 'keyboard', pointerKind: 'mouse' };
}

/** Follows the input in use and says when the words must change. */
export class DeviceTracker {
  private state: DeviceState = guessDevice();

  constructor(private readonly onChange: (state: DeviceState) => void = () => undefined) {}

  get current(): DeviceState {
    return this.state;
  }

  /** A press arrived from `device`; a pointer press says which pointer (`pointerType`). */
  note(device: PlayerDevice, pointerKind?: string): void {
    const kind = device === 'pointer' ? pointerKind || this.state.pointerKind || 'mouse' : this.state.pointerKind;
    if (device === this.state.device && kind === this.state.pointerKind) return;
    this.state = { device, pointerKind: kind };
    this.onChange(this.state);
  }
}

/** Whether the overlay prints key names: a keyboard, or a mouse (which sits beside one). */
export function namesKeys(d: DeviceState): boolean {
  return d.device === 'keyboard' || (d.device === 'pointer' && d.pointerKind === 'mouse');
}

/** The PlayStation symbols the sequence guides name (GameFAQs, `research/ffx-overdrive-input-rules-2026-09-30.md`). */
export const PAD_GLYPH: Readonly<Record<UiButton, string>> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  confirm: '✕',
  cancel: '○',
  triangle: '△',
  square: '□',
  l1: 'L1',
  r1: 'R1',
};

/**
 * The key a keyboard player is told to press for each abstract button: one of the keys
 * `rawInput.KEY_MAP` reads as that button (`tests/unit/ffx-overlay-input.test.ts` pins every row
 * against the real watcher). Arrows show their arrow; WASD, Space, Z, X, Backspace, Shift, PageUp
 * and PageDown also work and are not printed.
 */
export const KEY_CAP: Readonly<Record<UiButton, string>> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  confirm: 'Enter',
  cancel: 'Esc',
  triangle: 'Q',
  square: 'K',
  l1: 'F',
  r1: 'R',
};

/** What a screen reader says for a chip: the button's name, and the key when the chip names keys. */
const BUTTON_NAME: Readonly<Record<UiButton, string>> = {
  up: 'Up',
  down: 'Down',
  left: 'Left',
  right: 'Right',
  confirm: 'Cross',
  cancel: 'Circle',
  triangle: 'Triangle',
  square: 'Square',
  l1: 'L1',
  r1: 'R1',
};

/** One Bushido chip's face: the big label, the small one under or after it (may be empty), and its accessible name. */
export interface ChipFace {
  main: string;
  sub: string;
  aria: string;
}

/**
 * The face of the chip for `token`, a `UiButton` name. A token the table does not know (a sequence from
 * loose params) keeps the old fallback, its first two letters, on every device.
 */
export function chipFace(token: string, d: DeviceState): ChipFace {
  if (!(token in PAD_GLYPH)) {
    const letters = token.slice(0, 2).toUpperCase();
    return { main: letters, sub: '', aria: token };
  }
  const button = token as UiButton;
  const glyph = PAD_GLYPH[button];
  const name = BUTTON_NAME[button];
  if (!namesKeys(d)) return { main: glyph, sub: '', aria: name };
  const cap = KEY_CAP[button];
  const isArrow = cap === glyph; // the arrow key is the arrow: nothing to add
  return { main: cap, sub: isArrow ? '' : glyph, aria: isArrow ? name : `${name}, key ${cap}` };
}

/** The word for the control a press is made with, as `TriggerHappy.keyWord` has it: KEY, CLICK, TAP, button. */
export function pressWord(d: DeviceState): string {
  if (d.device === 'gamepad') return 'cross';
  if (d.device === 'pointer') return d.pointerKind === 'mouse' ? 'click' : 'tap';
  return 'enter';
}

/** Bushido's subtitle line after `BUSHIDO ·`: the chips are the answer on every device, the verb follows the device. */
export function sequenceInstruction(d: DeviceState): string {
  return d.device === 'pointer' ? `${pressWord(d)} the sequence` : 'enter the sequence';
}

/** Swordplay's subtitle line after `SWORDPLAY ·`: the control that stops the marker. */
export function zoneInstruction(d: DeviceState): string {
  return d.device === 'pointer' ? `${pressWord(d)} in the gold zone` : `press ${pressWord(d)} in the gold zone`;
}

/**
 * Marks the overlay as one that answers a finger or a click (`ffx-mg--tap`): the slab takes pointer
 * events (its HUD layer does not) and the touch sizes apply (`overdrive-minigames.css`). `whole` is for
 * an overlay where a press anywhere on the slab is the answer (Swordplay); Bushido's answer is a chip.
 */
export function markTappable(el: HTMLElement, whole = false): void {
  el.classList.add('ffx-mg--tap');
  if (whole) el.classList.add('ffx-mg--tap-slab');
}
