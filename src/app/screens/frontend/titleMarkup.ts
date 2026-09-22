/**
 * The title card's markup, split out so `TitleScreen.ts` stays about behaviour
 * and stays under the 400-line house limit.
 *
 * Every rect, colour and word here comes from the approved end state
 * `docs/concepts/polish/showpiece-frontend/after.png`; the base look is the
 * approved tile `docs/screenshots/mockups/A-title.jpg`, which this keeps.
 *
 * The painting is `public/art/title/keyart.png` — **the plate `after.png`
 * itself was composited from**, this project's own render, installed from
 * `docs/concepts/polish/showpiece-frontend/_src/title-keyart.2.png` on
 * 2026-09-21. The first build of this screen reached for
 * `backdrops/title.png` instead, on a brief that said "only art already in
 * `public/art`"; that brief was wrong for this one case, because the key art
 * is the approved picture. Hard rule 8 is about *retail* assets and this is
 * ours.
 */

import { artUrl } from '../../../engine/PaintedArt.ts';
import { loadArtManifest, title2xUrlFor } from '../../../engine/ArtManifest.ts';
import { escapeHtml } from '../../../ui/common/html.ts';

/**
 * Where the two on the shore stand, in fractions of the frame.
 *
 * Read straight off `after.html`'s 1440x810 stage rather than guessed:
 * Tidus `left:948 top:494 height:208`, Yuna `left:1068 top:512 height:194`.
 * The first build rounded these and set the pair about 2 % of the frame wider
 * apart than the approved picture has them.
 */
const CAST = [
  { id: 'tidus', left: 948 / 1440, bottom: 1 - (494 + 208) / 810, height: 208 / 810 },
  { id: 'yuna', left: 1068 / 1440, bottom: 1 - (512 + 194) / 810, height: 194 / 810 },
] as const;

/**
 * How much of a figure's height its reflection in the shallows is given.
 *
 * `after.html` gives a 208px figure a 126px reflection; this is that ratio.
 * It is handed to CSS as `--fe-refl` on the reflection's own box rather than
 * baked into the stylesheet, because the stylesheet has to divide by it to
 * size the flipped image and two copies of one number drift apart.
 */
const REFLECTION = 0.606;

/** The plate the whole screen is. Both planes are this one file. */
export const TITLE_PLATE = 'art/title/keyart.png';

/** The 1x plate's pixel width, for the `srcset` the master is offered through. */
const PLATE_1X_WIDTH = 1344;
/** The master's pixel width — `public/art/title/keyart.2x.webp`. */
const PLATE_2X_WIDTH = 2688;

function pct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function figureHtml(id: string, left: number, bottom: number, height: number): string {
  const src = artUrl(`art/characters/${id}/idle.png`);
  const style = `left:${pct(left)};bottom:${pct(bottom)};height:${pct(height)}`;
  // The reflection hangs straight down from the figure's feet: its box starts
  // where the figure ends, and the flipped image inside it is the *whole*
  // figure, clipped to this band. (The first build sized the image to the band
  // instead, and `scaleY(-1)` about `top center` then threw all of it above
  // the box — which is why no reflection was visible at all.)
  const reflStyle =
    `left:${pct(left)};bottom:${pct(bottom - height * REFLECTION)};` +
    `height:${pct(height * REFLECTION)};--fe-refl:${REFLECTION}`;
  return (
    `<div class="fe-figure fe-figure--refl" style="${reflStyle}">` +
    `<img class="fe-sil" src="${src}" alt="" draggable="false" onerror="this.remove()"></div>` +
    `<div class="fe-figure" style="${style}">` +
    `<img class="fe-sil" src="${src}" alt="" draggable="false" onerror="this.remove()"></div>`
  );
}

/** Every figure on the shore, reflections first so they sit behind. */
export function castHtml(): string {
  return CAST.map((c) => figureHtml(c.id, c.left, c.bottom, c.height)).join('');
}

export interface TitleMarkupOptions {
  /** The `B` briefing chip, when onboarding is live. */
  readonly briefingChip: boolean;
}

/**
 * The whole title card. The two `<img>` planes are the **same painting**: the
 * near one is masked to the shore band in CSS, which is the concept's
 * luminance cut expressed without shipping a second file.
 *
 * A plane whose painting fails to load marks itself `data-art="missing"`; the
 * stylesheet then paints the dusk gradient the screen shipped with, so a build
 * served without `public/art` still has a title screen.
 */
export function titleMarkup(opts: TitleMarkupOptions): string {
  const painting = artUrl(TITLE_PLATE);
  // When the manifest is already in hand — the usual case, since it is
  // prefetched at bundle init and the title mounts after the app has booted —
  // the candidate list goes in with the element. Emitting `src` alone and
  // upgrading afterwards makes the browser start the 1x plate and then abort
  // it, which is a wasted megabyte and a red line in the network panel.
  const candidates = titleSrcsetNow();
  const plane = (mod: string): string =>
    `<div class="fe-title__plane fe-title__plane--${mod}">` +
    `<img src="${painting}" ${candidates} alt="" draggable="false" ` +
    `onerror="this.closest('.fe-title__plane')?.setAttribute('data-art','missing')"></div>`;

  const briefing = opts.briefingChip
    ? `<span data-action="title:briefing" role="button" tabindex="0"><b>B</b> Briefing</span>`
    : '';

  // FE-002 (round 07, focused review of 8f48237): on touch only the chip
  // advanced, the rest of the plate was inert, and the chip read "Press
  // Enter" whatever the input. `Input.onClick` resolves any click through
  // `closest('[data-action]')`, so putting the attribute on the whole plate
  // — rather than only the chip — makes a tap anywhere reach chapter-select,
  // exactly like the chip already does; the chip keeps its own attribute so
  // it still works (and still reads first) once it is the closest match.
  // The two labels are a pure-CSS swap on `pointer: coarse`
  // (`.fe-title__chip-label--key` / `--tap` in frontend.css), so a keyboard
  // or mouse player is never told to tap and a touch player is never told
  // to press a key that is not there.
  return `
    <div class="fe-title__tap" data-action="confirm">
    ${plane('far')}
    <div class="fe-title__bloom"></div>
    ${plane('near')}
    <div class="fe-title__cast">${castHtml()}</div>
    <div class="fe-title__grade"></div>
    <div class="fe-title__motes"></div>

    <div class="fe-title__slab">
      <div class="fe-title__grain"></div>
      <div class="fe-title__eyebrow">An unofficial fan tribute</div>
      <div class="fe-title__name">Pyrefly</div>
      <div class="fe-title__name">Reprise</div>
      <div class="fe-title__rule"></div>
      <span class="fe-title__chip" data-action="confirm" role="button" tabindex="0"><i></i
        ><span class="fe-title__chip-label fe-title__chip-label--key">Press Enter</span
        ><span class="fe-title__chip-label fe-title__chip-label--tap">Tap to begin</span></span>
    </div>

    <div class="fe-title__verr"></div>
    <div class="fe-title__strap">Final Fantasy X and X-2</div>

    <div class="fe-hint">
      <span class="fe-hint__key"><b>Arrows / WASD</b> move</span><span class="fe-hint__key"><b>Enter</b> confirm</span><span class="fe-hint__key"><b>Esc</b> cancel</span><span class="fe-hint__tap"><b>Tap</b> begin</span>${briefing}
    </div>
    </div>
  `;
}

/**
 * Offer the 2688px master to both planes, once the manifest says it is there.
 *
 * The title is one painting at window size, so past about 1400 CSS px the 1x
 * plate is being upscaled — the `fix3-pause` finding, on the screen it shows
 * up on first. `sizes` is the *cover* width, not `100vw`: a plane is
 * `object-fit: cover` and held at up to 1.11 scale, so a tall window needs far
 * more image than its own width.
 *
 * Nothing here is required. No manifest, or a manifest with no master listed,
 * leaves the 1x plate exactly as it is rather than risking a 404 on the one
 * image the screen is.
 */
/** `srcset`/`sizes` attributes for the markup, or `''` when we cannot say yet. */
function titleSrcsetNow(): string {
  const url = artUrl(TITLE_PLATE);
  const retina = title2xUrlFor(url);
  if (!retina) return '';
  return (
    `srcset="${escapeHtml(`${url} ${PLATE_1X_WIDTH}w, ${retina} ${PLATE_2X_WIDTH}w`)}" ` +
    `sizes="${escapeHtml(titlePlateSizes())}"`
  );
}

export function upgradeTitlePlanes(root: ParentNode): Promise<void> {
  const url = artUrl(TITLE_PLATE);
  const imgs = Array.from(root.querySelectorAll('.fe-title__plane img'));
  return loadArtManifest().then(() => {
    const retina = title2xUrlFor(url);
    if (!retina) return;
    for (const img of imgs) {
      if (!(img instanceof HTMLImageElement) || img.getAttribute('src') !== url) continue;
      img.sizes = titlePlateSizes();
      img.srcset = `${url} ${PLATE_1X_WIDTH}w, ${retina} ${PLATE_2X_WIDTH}w`;
    }
  });
}

/**
 * The `sizes` hint for a full-bleed cover plane: the wider of the window and
 * the width a window this tall crops out of a 1.75:1 painting, times the
 * largest plane scale (1.11).
 */
export function titlePlateSizes(): string {
  return `calc(1.11 * max(100vw, ${(PLATE_2X_WIDTH / 1536).toFixed(3)} * 100vh))`;
}
