/**
 * The title card's markup, split out so `TitleScreen.ts` stays about behaviour
 * and stays under the 400-line house limit.
 *
 * Every rect, colour and word here comes from the approved end state
 * `docs/concepts/polish/showpiece-frontend/after.png`; the base look is the
 * approved tile `docs/screenshots/mockups/A-title.jpg`, which this keeps.
 */

import { artUrl } from '../../../engine/PaintedArt.ts';

/** Where the two on the shore stand, in fractions of the frame (after.png). */
const CAST = [
  { id: 'tidus', left: 0.648, bottom: 0.134, height: 0.25 },
  { id: 'yuna', left: 0.762, bottom: 0.132, height: 0.233 },
] as const;

/** How much of a figure's height its reflection in the shallows is given. */
const REFLECTION = 0.62;

function pct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function figureHtml(id: string, left: number, bottom: number, height: number): string {
  const src = artUrl(`art/characters/${id}/idle.png`);
  const style = `left:${pct(left)};bottom:${pct(bottom)};height:${pct(height)}`;
  // The reflection hangs straight down from the figure's feet.
  const reflStyle =
    `left:${pct(left)};bottom:${pct(bottom - height * REFLECTION)};height:${pct(height * REFLECTION)}`;
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
 * The whole title card. The two `<img>` planes are the **same approved
 * painting**: the near one is clipped to its bottom band in CSS, which is the
 * concept's luminance cut expressed without generating a second file.
 */
export function titleMarkup(opts: TitleMarkupOptions): string {
  const painting = artUrl('art/backdrops/title.png');
  const plane = (mod: string): string =>
    `<div class="fe-title__plane fe-title__plane--${mod}">` +
    `<img src="${painting}" alt="" draggable="false" onerror="this.style.display='none'"></div>`;

  const briefing = opts.briefingChip
    ? `<span data-action="title:briefing" role="button" tabindex="0"><b>B</b> Briefing</span>`
    : '';

  return `
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
      <span class="fe-title__chip" data-action="confirm" role="button" tabindex="0"><i></i>Press Enter</span>
    </div>

    <div class="fe-title__verr"></div>
    <div class="fe-title__strap">Final Fantasy X and X-2</div>

    <div class="fe-hint">
      <span><b>Arrows / WASD</b> move</span><span><b>Enter</b> confirm</span><span><b>Esc</b> cancel</span>${briefing}
    </div>
  `;
}
