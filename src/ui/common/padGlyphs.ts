import './pad-glyphs.css';
import { padFamily } from '../../app/inputDevice.ts';
import { PAD_LABELS, padTokenOf, padWord, type PadFamily, type PadToken } from '../../app/padMap.ts';
import { escapeHtml } from './html.ts';

/**
 * Pad button glyphs and key/pad hint chips (release 61, the conference demo; **both games**, presentation plumbing).
 *
 * Bailey, 2026-10-21 (decision 169): visitors play with "A gamepad (Recommended)" and he wants "pad button hints" on every demo screen. The build's hints
 * said `Cross`, `Circle`, `L1` in plain words. These draw the button instead (A on a green disc, a rounded `LB`, the d-pad's cross) in the Ink & Gold
 * hand, and name it for the pad in the player's hands: `A B X Y LB RB` for an Xbox pad, `✕ ○ □ △ L1 R1` for a PlayStation one, `B A Y X L R` for a Switch one
 * (the bottom face button is the same standard index on all three; only its name differs). A `<kbd>` (not an `<i>`: screens style their own `i` icons, e.g. the title chip's play triangle). Nothing here is a retail glyph: discs and letters in CSS, three
 * small SVGs for the d-pad, Menu and View.
 *
 * ## Two ways in
 *
 * - **`keyHint(key, pad)`** is for a chip written once in markup: the inner HTML of a `<b>`, both the key (`G`) and the pad's button (`X`) in it. CSS shows one of
 *   them by `html[data-input]` (`app/inputDevice.ts`), so the chip switches the instant the player presses the other device, with no widget re-rendered.
 * - **`glyphize(text)`** is for the strings the build already has in its `gamepad:` columns (`Cross`, `Hold Cross`, `R-Stick`): it swaps each button word for its glyph
 *   and leaves the rest.
 */

/** The text on a glyph, per family, for the tokens whose face is a label. A token not listed draws an SVG (`SVG_FACES`) or a stick letter. */
const FACE_TOKENS: ReadonlySet<PadToken> = new Set<PadToken>(['cross', 'circle', 'square', 'triangle', 'l1', 'r1', 'l2', 'r2', 'l3', 'r3']);

/** The three small drawings, 20 x 14 / 20 x 20 boxes, `currentColor`. */
const SVG_FACES: Partial<Record<PadToken, string>> = {
  dpad: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M7.4 1.5h5.2v5.9h5.9v5.2h-5.9v5.9H7.4v-5.9H1.5V7.4h5.9z"/></svg>',
  'dpad-v':
    '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M7.4 1.5h5.2v17H7.4z"/><path fill="currentColor" opacity=".38" d="M1.5 7.4h5.9v5.2H1.5zM12.6 7.4h5.9v5.2h-5.9z"/></svg>',
  'dpad-h':
    '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M1.5 7.4h17v5.2h-17z"/><path fill="currentColor" opacity=".38" d="M7.4 1.5h5.2v5.9H7.4zM7.4 12.6h5.2v5.9H7.4z"/></svg>',
  // Menu / Options: three bars. View / Share: two overlapping sheets.
  start: '<svg viewBox="0 0 20 14" aria-hidden="true"><path fill="currentColor" d="M3 2h14v2H3zM3 6h14v2H3zM3 10h14v2H3z"/></svg>',
  select:
    '<svg viewBox="0 0 20 14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M6.5 3.2h9.6v7.4H6.5z"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M3.9 5.9V1.6h9.6"/></svg>',
};

/** `L` / `R` on the stick glyphs; their ring is drawn in CSS. */
const STICK_LETTER: Partial<Record<PadToken, string>> = { lstick: 'L', rstick: 'R' };

/** The face text of a token for one family (`''` for a drawn glyph). */
function faceText(token: PadToken, family: PadFamily): string {
  if (STICK_LETTER[token]) return STICK_LETTER[token]!;
  return FACE_TOKENS.has(token) ? PAD_LABELS[family][token] : '';
}

/**
 * One pad button as a glyph. The three families' labels travel in the element (`data-x`, `data-p`, `data-n`) and the stylesheet picks one by `html[data-pad]`, so a
 * PlayStation pad and an Xbox pad can share a page (a test, a screenshot) and a pad plugged in later relabels what is already on screen.
 */
export function padGlyph(token: PadToken): string {
  const svg = SVG_FACES[token] ?? '';
  const x = faceText(token, 'xbox');
  const p = faceText(token, 'playstation');
  const n = faceText(token, 'nintendo');
  const data = x || p || n ? ` data-x="${escapeHtml(x)}" data-p="${escapeHtml(p)}" data-n="${escapeHtml(n)}"` : '';
  return `<kbd class="pg" data-pg="${token}"${data} role="img" aria-label="${escapeHtml(padSpoken(token))}">${svg}</kbd>`;
}

/** The label a token prints right now, for text-only places (a subtitle, an `aria-label`): `A`, `✕`, `LB`, `R-Stick` by the pad in use. */
export function padLabel(token: PadToken): string {
  return PAD_LABELS[padFamily()][token];
}

/** The spoken name of a token for the pad in use (`Cross`, `A`, `Menu button`). */
export function padSpoken(token: PadToken): string {
  return padWord(token, padFamily());
}

/**
 * Swap the button words in `text` (the build's legacy `gamepad:` strings) for glyphs; everything else is escaped text. `Cross` becomes the A disc, `Hold Cross` keeps its `Hold`.
 * A word that is not a button (and `Left/Right`) stays as it was.
 */
export function glyphize(text: string): string {
  return text
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s*$/.test(part)) return part;
      const token = padTokenOf(part);
      return token ? padGlyph(token) : escapeHtml(part);
    })
    .join('');
}

/**
 * The inner HTML of a hint chip's `<b>`: the key and the pad's button, both in, one shown by `html[data-input]`.
 *
 * `pad` is a token or any of the build's legacy words (`'Cross'`, `'R-Stick'`, `'Hold Cross'`). `key` is plain text (`'G'`, `'Esc'`, `'▲ ▼'`).
 */
export function keyHint(key: string, pad: PadToken | string): string {
  return `<span class="kh-k">${escapeHtml(key)}</span><span class="kh-p">${glyphize(pad)}</span>`;
}

/** The accessible text of a chip written with {@link keyHint}: the key and the pad's button, so a screen reader reads whichever the player is using. */
export function keyHintLabel(key: string, pad: PadToken | string): string {
  const token = padTokenOf(pad);
  return token ? `${key} or ${padSpoken(token)}` : key;
}
