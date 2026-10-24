/**
 * The Echo's two sizes (r64 art lane, 2026-10-24; both games: the title and the booth cards are the front door of FFX and FFX-2 alike; Bailey's item 200g).
 *
 * `art/title/echo.png` is 1682 x 932. Past that many pixels of window the browser stretched it (the title is one painting at window size, and the
 * conference screen is 2560 x 1440), so the Echo has a 2x master like the Farplane key art has: `art/title/echo.2x.webp`, 3364 x 1864, the 1x painting
 * run 4x through RealESRGAN x4plus on the local ComfyUI and brought back to exactly 2x with Lanczos (the anime 6B model flattened the painted texture and
 * darkened the picture 12 percent, so it was not used), encoded as keyart.2x.webp is (lossy WebP, quality 95, effort 6, smart subsampling).
 * The art manifest lists it in `title2x`; a build or art tree without the file never gets a candidate for it (a 404 on the one image the screen is).
 *
 * The browser chooses, through `srcset` and `sizes`, exactly as for the Farplane plate: 1682w for a window up to 1682 device pixels of picture, the master
 * past that (a 1920 x 1080 screen at a pixel ratio of 1 already needs 1920, so it takes the master too; 2560 x 1440 certainly does).
 */

import { artManifest, title2xUrlFor } from '../../../engine/ArtManifest.ts';
import { logicalArtUrl } from '../../../engine/ArtShipped.ts';
import { artUrl } from '../../../engine/PaintedArt.ts';
import { escapeHtml } from '../../../ui/common/html.ts';
import { TITLE_ART_PLATES } from '../../saveFrontend.ts';

/** The 1x plate's pixel width (`art/title/echo.png`). */
export const ECHO_1X_WIDTH = 1682;
/** The master's pixel width (`art/title/echo.2x.webp`). */
export const ECHO_2X_WIDTH = 3364;
/** The picture's width over its height (1682 x 932), the number `sizes` uses to turn a window's height into the width a cover fit draws. */
export const ECHO_ASPECT = 1.805;

/**
 * `sizes` for the title's plane: it is `object-fit: cover` (a window up to 1.9:1) or contained (wider), drawn at scale 1 (TitleScreen), so the wider of the window and the
 * width the window's height asks for is the most it can draw. A hint only: too large loads the master a little early, never a wrong picture.
 */
export const ECHO_TITLE_SIZES = `max(100vw, ${ECHO_ASPECT} * 100vh)`;
/** `sizes` for the end card's picture (cover, contained from 1.9:1; it pushes in by about a tenth over its nine seconds, which the hint ignores). */
export const ECHO_END_SIZES = ECHO_TITLE_SIZES;
/** `sizes` for the attract card's picture: a box 85.31 percent of the window wide and 84 percent tall, the picture contained in it. */
export const ECHO_ATTRACT_SIZES = `min(85.31vw, ${(ECHO_ASPECT * 84).toFixed(1)}vh)`;

/** The master's URL as the page names it, or `null` when the manifest says it is not on disk (or has not been read, and `blind` is off). */
export function echoMasterUrl(blind: boolean): string | null {
  const url = artUrl(TITLE_ART_PLATES.echo);
  return title2xUrlFor(url) ?? (blind && artManifest() === null ? logicalArtUrl(url).replace(/\.png(?=$|[?#])/i, '.2x.webp') : null);
}

/** The `srcset` value both files go through. */
export function echoSrcset(master: string): string {
  return `${artUrl(TITLE_ART_PLATES.echo)} ${ECHO_1X_WIDTH}w, ${master} ${ECHO_2X_WIDTH}w`;
}

/**
 * The `srcset` and `sizes` attributes for an `<img>` of the Echo, or an empty string when there is no master to offer. `blind` offers the master before the manifest has
 * loaded (the title: `index.html` preloads it with the same candidates, A-16, and `upgradeTitlePlanes` takes the list back if the manifest then says it is not there);
 * the booth cards ask only once the manifest is in hand.
 */
export function echoSrcsetAttrs(sizes: string, blind: boolean): string {
  const master = echoMasterUrl(blind);
  return master === null ? '' : `srcset="${escapeHtml(echoSrcset(master))}" sizes="${escapeHtml(sizes)}"`;
}
