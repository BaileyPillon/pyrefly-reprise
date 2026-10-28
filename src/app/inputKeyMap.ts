/**
 * The key and pad tables `Input` reads, moved out of `Input.ts` (release 68, lane ui-input) so that file could take the
 * focus contract (`focusContract.ts`) without growing past the size it already was. Nothing in them changed.
 *
 * The pad's button numbers, stick dead zone and repeat times live in `padMap.ts`.
 */

import type { Button } from './Input.ts';
import { PAD } from './padMap.ts';

/** KeyboardEvent.code -> abstract button. */
export const KEY_MAP: Record<string, Button> = {
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

/**
 * Standard-gamepad button index -> abstract button (the layout and who uses what: `padMap.ts`).
 * X (2), the triggers (6, 7) and the stick presses are not abstract buttons: the battle's optional panels poll
 * them themselves (`ui/common/StrategyGuide.ts`, `MoveAdvisor.ts`, `EnemyIntent.ts`), exactly as their keys are not here either.
 */
export const PAD_MAP: Record<number, Button> = {
  [PAD.A]: 'confirm', // cross / A
  [PAD.B]: 'cancel', // circle / B
  [PAD.Y]: 'triangle', // triangle / Y
  [PAD.LB]: 'l1',
  [PAD.RB]: 'r1',
  [PAD.BACK]: 'select', // select / back / share
  [PAD.START]: 'start',
  [PAD.UP]: 'up',
  [PAD.DOWN]: 'down',
  [PAD.LEFT]: 'left',
  [PAD.RIGHT]: 'right',
};

/** Keys that on their own say nothing about which device the player chose. */
export const MODIFIER_CODES: ReadonlySet<string> = new Set([
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
