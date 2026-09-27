/**
 * A-16: the title's first frame is never black (both games: the title is the
 * front door to both halves).
 *
 * On a cold visit the screen faded in over a plate that was still downloading
 * or decoding, so the first frames after "title" were the page's near-black
 * background. Three things answer it (presentation program A-16):
 *
 * 1. `index.html` preloads the plate with the same candidates the planes use,
 *    so the fetch starts before any script runs.
 * 2. The far plane carries a 32 px copy of the plate inline (below), drawn
 *    under the `<img>`, graded like it and softened, so the very first frame
 *    is the picture, only blurred.
 * 3. The planes and the two on the shore are held at opacity 0 until every one
 *    of them has **decoded** (`HTMLImageElement.decode()`), then fade in over
 *    the placeholder together, so no layer pops in late. A cap stops a stalled
 *    request from holding the reveal: past it the layers show as they are.
 *
 * The placeholder is this project's own key art (`public/art/title/keyart.png`,
 * hard rule 8 is about retail assets), 32 x 18, WebP, 340 characters.
 */

import './title-reveal.css';

/** `public/art/title/keyart.png` at 32 x 18 (mean luma 0.46 before the far plane's grade). */
export const TITLE_PLACEHOLDER =
  'data:image/webp;base64,UklGRvYAAABXRUJQVlA4IOoAAACwBQCdASogABIAPrVQn0qnJSKhsBgIAOAWiWQAnTKDLHQdz7y64zqQZAHBfwr8CldR6zXRtIAA/SLl4kCZpLbqgsOmKUXOx/fJNKZSQfexl9QGkHFa3tLG0v+3NSx6fG9KnOuqttEvdSWX14af4A6U20DFpOke4bLWu3p7CYMD1XVTWCImAMKoef43UYEvgxOXbETLkiuQyVotUcD6Nkq3yV1FMRQBZuv/zdmVwgAypTVawnq6J7FF77rtUY5MTsw/YFMaH06oqPJhQ1yCEldGclS7FqXROBdhNQrfrcic5GCvqynHLeWCAAA=';

/** Longest the reveal waits for decoding before it shows the layers anyway. */
export const TITLE_DECODE_CAP_MS = 2500;

/** The layers the reveal waits for: both planes and the two on the shore. */
export function titleLayers(root: ParentNode): HTMLImageElement[] {
  return Array.from(root.querySelectorAll<HTMLImageElement>('.fe-title__plane img, .fe-title__cast img'));
}

export interface TitleRevealOptions {
  capMs?: number;
  /** Injectable timer, for the unit test. */
  wait?: (ms: number) => Promise<void>;
}

/**
 * Put the placeholder under the far plane, hold the layers, and reveal them
 * once all have decoded or the cap passes. Resolves `'decoded'` or `'capped'`.
 * A layer whose image fails still counts as settled: its plane falls back to
 * the dusk gradient (`data-art="missing"`), which is not black either.
 */
export async function revealTitleWhenDecoded(root: HTMLElement, opts: TitleRevealOptions = {}): Promise<'decoded' | 'capped'> {
  root.style.setProperty('--fe-title-ph', `url("${TITLE_PLACEHOLDER}")`);
  root.classList.add('fe-title--decoding');
  const wait = opts.wait ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const settle = (img: HTMLImageElement): Promise<void> =>
    typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve();
  const outcome = await Promise.race([
    Promise.all(titleLayers(root).map(settle)).then(() => 'decoded' as const),
    wait(opts.capMs ?? TITLE_DECODE_CAP_MS).then(() => 'capped' as const),
  ]);
  root.classList.remove('fe-title--decoding');
  root.classList.add('fe-title--decoded');
  root.dataset['titleReveal'] = outcome;
  return outcome;
}
