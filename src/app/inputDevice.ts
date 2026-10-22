import { padFamilyOf, type PadFamily } from './padMap.ts';

/**
 * Which kind of input the player used last, as one value the whole page can read (release 61, the conference demo; **both games**, input plumbing).
 *
 * Every key hint in the build ("G GUIDE", "ESC BACK", "ENTER BEGINS THE BATTLE") has a pad twin ("X GUIDE", "B BACK", "A BEGINS THE BATTLE"). Until now
 * each widget decided for itself which to print, mostly by asking whether a pad was merely PLUGGED IN, so a player who picked up a pad and then touched a key
 * still read the pad's names. This store answers it once: the hint follows the last thing the player pressed, and switches the moment they press the other.
 *
 * It does two things:
 *
 * - **`html[data-input]`** is `keyboard`, `gamepad` or `pointer`, and **`html[data-pad]`** is `xbox`, `playstation` or `nintendo`. The glyph styles
 *   (`ui/common/pad-glyphs.css`) key off those two attributes, so a hint written once as `keyHint('G', 'square')` shows the key or the pad's button with no
 *   code running on a press and no widget re-rendered.
 * - **`padActive()`** and **`onInputDevice()`** are the same fact for code that words a sentence ("PRESS A IN THE GOLD ZONE") rather than a chip.
 *
 * Who writes it: `app/Input.ts` (every frame it polls the pad and every key), `ui/ffx/rawInput.ts` (the HUD's own watchers) and a `pointerdown` listener. A pointer does not
 * change which hints read as keys: a mouse sits beside a keyboard, and the build has always worded the mouse's chips with the keys.
 *
 * Starting value: the keyboard, or the pad when {@link installInputDevice} is told this is a booth (`?demo=1`: a pad is what the visitor holds; the first
 * thing they press on the keyboard puts it right). The browser hides a pad from the page until a button is pressed, so "a pad is connected" cannot say it.
 */

export type InputDevice = 'keyboard' | 'gamepad' | 'pointer';

let device: InputDevice = 'keyboard';
let family: PadFamily = 'xbox';
const listeners = new Set<(device: InputDevice, family: PadFamily) => void>();

function root(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.documentElement;
}

function publish(): void {
  const el = root();
  if (el) {
    el.dataset['input'] = device;
    el.dataset['pad'] = family;
  }
}

/** The input the player used last. */
export function inputDevice(): InputDevice {
  return device;
}

/** True while the last thing the player pressed was a pad button or a stick. */
export function padActive(): boolean {
  return device === 'gamepad';
}

/** Whose button names the pad in the player's hands uses (`xbox` until a pad says otherwise). */
export function padFamily(): PadFamily {
  return family;
}

/**
 * Record an input. `padId` is `Gamepad.id` of the pad that was pressed, so the glyphs are the right family. Cheap to call every frame: it publishes and
 * notifies only when something changed.
 */
export function noteInputDevice(next: InputDevice, padId?: string | null): void {
  const nextFamily = next === 'gamepad' && padId !== undefined ? padFamilyOf(padId) : family;
  if (next === device && nextFamily === family) return;
  device = next;
  family = nextFamily;
  publish();
  for (const fn of [...listeners]) fn(device, family);
}

/** Be told when the device or the pad family changes. Returns the unsubscribe. */
export function onInputDevice(fn: (device: InputDevice, family: PadFamily) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let installed = false;

/**
 * Wire the page-level half: the attributes on `<html>` from the first frame, and a `pointerdown` listener that records the pointer (a pointer is not a pad, so the
 * hints go back to keys). `assumePad` starts a booth on the pad's words. Safe to call twice.
 */
export function installInputDevice(opts: { assumePad?: boolean } = {}): void {
  if (opts.assumePad && !installed) device = 'gamepad';
  publish();
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('pointerdown', () => noteInputDevice('pointer'), true);
  window.addEventListener(
    'gamepadconnected',
    (e) => {
      // A pad appearing is not a press; only its family is learned, so the glyphs are right the instant the first press arrives.
      const id = (e as GamepadEvent).gamepad?.id;
      if (id) {
        family = padFamilyOf(id);
        publish();
      }
    },
    true,
  );
}

/** Tests: back to the keyboard and an Xbox pad, listeners dropped. */
export function resetInputDeviceForTests(): void {
  device = 'keyboard';
  family = 'xbox';
  listeners.clear();
  installed = false;
  publish();
}
