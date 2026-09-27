/**
 * FFX's boss entry out of a cutscene (A-2, FFX only): no shatter, "a slight
 * blurring", and the fight staged on the background the scene was already
 * standing on (`research/ffx-vs-ffx2-presentation.md` §1.1, TV Tropes
 * *Fight Woosh*, single source; Bailey's 2026-09-19 pick: "a blur out of the
 * scene"). The held frame softens while the battle loads beneath it, then
 * dissolves into the arena. No `three`.
 */

import type { EntryPlayer } from './entryOverlay.ts';

/** The blur coming on over the held frame. */
export const BLUR_IN_MS = 320;
/** The softened frame dissolving into the battle. */
export const BLUR_OUT_MS = 460;
/** How soft it gets, in px at 1600 wide: slight, not a smear. */
export const BLUR_PX = 10;

export function blurPlayer(w: number, h: number): EntryPlayer {
  const px = BLUR_PX * Math.max(0.5, w / 1600);
  const draw = (ctx: CanvasRenderingContext2D, frame: CanvasImageSource, blur: number, alpha: number): void => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = alpha;
    ctx.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
    // Drawn a touch oversize so the blur never pulls a dark rim in at the edges.
    const m = blur * 2;
    ctx.drawImage(frame, -m, -m, w + m * 2, h + m * 2);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  };
  return {
    className: 'pf-entry--blur',
    introMs: BLUR_IN_MS,
    outMs: BLUR_OUT_MS,
    intro(ctx, frame, t) {
      draw(ctx, frame, px * t, 1);
    },
    outro(ctx, frame, t) {
      draw(ctx, frame, px, 1 - t);
    },
  };
}
