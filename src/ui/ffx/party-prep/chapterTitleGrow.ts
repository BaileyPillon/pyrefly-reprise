/**
 * The CHAPTER tab's card takes the lines its title wraps onto (release 80; both games: the prep card is shared).
 *
 * The card (`.prepchap`, `chapter-panel-tab.css`) is a fixed 120 grid px band, and its left column (eyebrow, title, subtitle, blurb, the three photos) is sized to fit it with a ONE-line title. A title that wraps to
 * two lines ("Belgemine's Challenge" at 1600 x 900) costs the column one more title line than the band has, and what gives is the bottom of the column: the photo row ran 30 screen px past the card's edge (the live
 * review of release 79, `10-sidequest-board`). CSS cannot see that a title wrapped, so this reads it: it measures the title's own box, works out how many lines it holds, and hands the band that many grid px as
 * the custom property `--prepchap-grow`, which the stylesheet adds to the 120 (capped, so the card can never reach the hint line under it). A one-line title writes nothing, so those chapters are untouched.
 *
 * The title's own box is measured in layout px (the stage is scaled by a transform, which `offsetHeight` ignores), and the extra is whole lines of the computed line height, so rounding in `offsetHeight` cannot
 * leak into the card. A `ResizeObserver` keeps it current when the title's box changes (the serif landing after first paint, the panel being shown after it was hidden).
 */

/** Grid px the stylesheet lets the card grow by at most: the card's bottom edge (66 + 120) plus this stays above the hint line (213.33); `tests/unit/chapters/prep-title-grow.test.ts` reads both numbers from the CSS. */
export const TITLE_GROW_CAP_PX = 21;

/** The custom property the card's height reads. */
export const TITLE_GROW_PROP = '--prepchap-grow';

/**
 * The height of the lines a title holds beyond its first, in the units of `lineH`.
 * @param boxH the title's box height (layout px; 0 while the panel is hidden)
 * @param lineH the title's computed line height
 */
export function titleExtraPx(boxH: number, lineH: number): number {
  if (!(boxH > 0) || !(lineH > 0)) return 0;
  const lines = Math.round(boxH / lineH);
  return lines > 1 ? (lines - 1) * lineH : 0;
}

/** The line height of an element in px: the computed value, or 1.2 of the font size when the browser answers `normal`. */
function lineHeightOf(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const lh = Number.parseFloat(cs.lineHeight);
  return Number.isFinite(lh) && lh > 0 ? lh : Number.parseFloat(cs.fontSize) * 1.2;
}

/**
 * Keep `band`'s `--prepchap-grow` equal to the extra lines of the `.cpanel__title` inside it. Returns the function that stops watching.
 * @param band the `.prepchap` element
 */
export function watchTitleGrow(band: HTMLElement): () => void {
  const title = band.querySelector<HTMLElement>('.cpanel__title');
  if (!title) return () => undefined;
  const apply = (): void => {
    const extra = titleExtraPx(title.offsetHeight, lineHeightOf(title));
    if (extra > 0) band.style.setProperty(TITLE_GROW_PROP, `${extra.toFixed(2)}px`);
    else band.style.removeProperty(TITLE_GROW_PROP);
  };
  apply();
  if (typeof ResizeObserver === 'undefined') return () => undefined;
  const observer = new ResizeObserver(apply);
  observer.observe(title);
  return () => observer.disconnect();
}
