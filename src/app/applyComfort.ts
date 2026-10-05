/**
 * Puts the comfort settings (OPTIONS accessibility A2, D-285) on `<html>`, where
 * the stylesheets and the HUDs read them:
 *
 * - `data-text-size="100" | "115" | "130"` and `--pyr-ts` (1, 1.15 or 1.3): the
 *   FFX battle HUD, the phone HUD and the dialogue card scale from these
 *   (`ui/common/text-size.css`, `ui/common/hudTextSize.ts`).
 * - `data-text-size-wide`: the same value, but only while {@link textSizeWideScope}
 *   is on. The FFX-2 HUD and the pause key their 130 % rules on it. D-220's Q4 is
 *   still open (an FFX-2 HUD frame and a pause frame at 130 % are owed to Bailey
 *   before those two scale), so it ships off; `?textsize=wide` turns it on for the
 *   capture that makes those frames.
 * - `data-reduce-motion` and `data-low-effects`, present while the flag is on: the
 *   CSS mirror of every `prefers-reduced-motion` block (`ui/common/comfort.css`).
 * - Not on `<html>`: eye-candy D's three looks switch its options A, B and C (`fxLooks.ts`), and the
 *   `eyeCandyFlags.ts` seam gets a fresh provider for the looks and the EYE CANDY page's nine parts
 *   (D-317, `fxParts.ts`): a look key answers the look, a part key the look AND the part.
 *
 * Called by `SaveStore` next to `audio.applySettings`, at construction and on
 * every settings write, so a saved 130 % is in force on the first frame without
 * the pause being opened (the round-03 blocker-5 lesson). A no-op with no DOM.
 *
 * Game case: both (shared plumbing).
 */

import '../ui/common/comfort.css';
import '../ui/common/text-size.css';
import '../ui/common/text-size-wide.css';
import { eyeCandy } from '../engine/fx/EyeCandy.ts';
import { eyeCandyOn, setEyeCandyProvider } from '../engine/fx/eyeCandyFlags.ts';
import { fxDebugHooks } from '../engine/fx/fxDebugHooks.ts';
import type { Settings } from './SaveData.ts';
import { fxLooksOf, type FxLookField } from './fxLooks.ts';
import { EYE_CANDY_KEYS, eyeCandyProviderFor, type FxPartField } from './fxParts.ts';
import { isTextSize } from './saveComfort.ts';

/**
 * The FFX-2 HUD and the pause at TEXT SIZE (D-220 Q4). Off until Bailey has seen
 * their 130 % frames; the CSS for both is built and measured behind it.
 */
export const TEXT_SIZE_WIDE_SCOPE = false;

/** True when the FFX-2 HUD and the pause follow TEXT SIZE too (the switch, or `?textsize=wide`). */
export function textSizeWideScope(): boolean {
  if (TEXT_SIZE_WIDE_SCOPE) return true;
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('textsize') === 'wide';
  } catch {
    return false;
  }
}

type ComfortFields = Pick<Settings, 'textSize' | 'reduceMotion' | 'lowEffects' | FxLookField | FxPartField>;

export function applyComfort(settings: Readonly<Partial<ComfortFields>>, root: HTMLElement | null = rootEl()): void {
  // Eye-candy D's three look rows (CINEMA LIGHT, LIVING PAINTINGS, BATTLE SPECTACLE), live and with or
  // without a DOM; a missing field reads as ON, and a URL `?fx=` wins for that page load (`EyeCandy.ts`).
  eyeCandy.applyLooks(fxLooksOf(settings));
  // D-317: what the MAX mix's looks and parts read (`eyeCandyFlags.ts`); REDUCE MOTION is applied where motion plays.
  setEyeCandyProvider(eyeCandyProviderFor(settings));
  fxDebugHooks['flags'] = { snapshot: () => Object.fromEntries(EYE_CANDY_KEYS.map((k) => [k, eyeCandyOn(k)])) };
  if (!root) return;
  const size = isTextSize(settings.textSize) ? settings.textSize : 1;
  const pct = String(Math.round(size * 100));
  root.dataset['textSize'] = pct;
  root.style.setProperty('--pyr-ts', String(size));
  if (textSizeWideScope()) root.dataset['textSizeWide'] = pct;
  else delete root.dataset['textSizeWide'];
  flag(root, 'reduceMotion', settings.reduceMotion === true);
  flag(root, 'lowEffects', settings.lowEffects === true);
}

function flag(root: HTMLElement, key: string, on: boolean): void {
  if (on) root.dataset[key] = '';
  else delete root.dataset[key];
}

function rootEl(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.documentElement;
}
