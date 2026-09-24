import type { TargetRect } from './TargetCursor.ts';

/**
 * `TargetCursor.ts`'s pure pieces: the plate-dock geometry and the inline
 * SVG marks, on their own so the cursor file keeps only its behaviour.
 */

/** Which side of the figure the name plate hangs off. */
export type PlateDock = 'below' | 'above' | 'right' | 'left';

/** The plate's box for a dock side, matching the CSS transform for that side. */
export function plateBox(side: PlateDock, x: number, y: number, w: number, h: number): TargetRect {
  const gap = 6;
  if (side === 'below') return { x: x - w / 2, y: y + gap, w, h };
  if (side === 'above') return { x: x - w / 2, y: y - h - gap, w, h };
  if (side === 'right') return { x: x + gap, y: y - h / 2, w, h };
  return { x: x - w - gap, y: y - h / 2, w, h };
}

export function overlapArea(a: TargetRect, b: TargetRect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** A plate half off the frame is no more readable than one under a panel. */
export function offFrameArea(box: TargetRect): number {
  if (typeof window === 'undefined') return 0;
  const inside = overlapArea(box, { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });
  return box.w * box.h - inside;
}

export function px(v: number): string {
  return `${Math.round(v * 10) / 10}px`;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * FFX's pointing hand, redrawn in Ink & Gold: a paper glove with an ink
 * outline and a gold cuff, per the approved frames. An inline SVG rather than
 * an asset so it inherits `currentColor` and needs no load.
 */
export const HAND_SVG = `<svg viewBox="0 0 44 30" aria-hidden="true">
  <path class="ffx-hand__cuff" d="M1 7h9v16H1z"/>
  <path class="ffx-hand__palm" d="M10 9h13V4.5c0-1.6 1.2-2.8 2.7-2.8S28.4 2.9 28.4 4.5V13h3.3c5.6 0 10.3 1.7 10.3 2.9 0 1-2.2 1.9-4.6 2.6l-6.2 1.8c-1.7.5-2.6 1.4-3.3 2.6l-1.6 2.8c-.6 1-1.7 1.6-2.9 1.6H10z"/>
</svg>`;

/**
 * FFX-2's field reticle: a rotating six-petal flower, **not** a bracket and
 * **not** FFX's finger [visual-bible §4.7]. The rotation is CSS.
 */
export const FLOWER_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle class="ffx-flower__ring" cx="50" cy="50" r="38"/>
  ${[0, 60, 120, 180, 240, 300]
    .map(
      (a) =>
        `<ellipse class="ffx-flower__petal" cx="50" cy="12" rx="5.5" ry="9" transform="rotate(${a} 50 50)"/>`,
    )
    .join('')}
</svg>`;

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
