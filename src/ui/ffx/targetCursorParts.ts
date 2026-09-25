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

/** A plate dock: the side it hangs off and its anchor point (the CSS transform does the rest). */
export interface Dock {
  side: PlateDock;
  x: number;
  y: number;
}

/**
 * Which side of the figure the plate hangs off, and its anchor point.
 *
 * Four candidates in order of preference: under the figure (the approved
 * frames' own placement), above it, then right, then left, scored by how much
 * of the plate would land on a HUD panel or off the frame. The first that
 * lands clear wins.
 *
 * When none does, the figure is standing under a panel, as Vegnagun's Left
 * Bulwark does under the FFX-2 command window at link 3 (D-044): every side
 * of its ring is inside the window, and the least-covered side printed
 * "Left Bulwark" over the CHANGE row, where it read as that row's own label.
 * So each side is also tried **pushed out past the panels it lands on** (above
 * lifts the plate to the panel's top edge, below drops it under the bottom, and
 * so on). The clear one that moves least wins, so the plate stays by the
 * figure it names; failing that, the least covered of all eight. Shared plumbing, both games: FFX takes the same path whenever a
 * target is boxed in. Only the comparison between sides has to be right, so
 * the plate box is an estimate.
 */
export function dockPlate(rect: TargetRect, w: number, h: number, panels: readonly TargetRect[]): Dock {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const near: Dock[] = [
    { side: 'below', x: cx, y: rect.y + rect.h },
    { side: 'above', x: cx, y: rect.y },
    { side: 'right', x: rect.x + rect.w, y: cy },
    { side: 'left', x: rect.x, y: cy },
  ];
  if (!panels.length) return near[0]!;
  const cover = (d: Dock): number =>
    panels.reduce((sum, p) => sum + overlapArea(plateBox(d.side, d.x, d.y, w, h), p), 0) +
    offFrameArea(plateBox(d.side, d.x, d.y, w, h));
  for (const d of near) if (cover(d) <= 1) return d;
  const pushed = near.map((d): Dock => {
    const hit = panels.filter((p) => overlapArea(plateBox(d.side, d.x, d.y, w, h), p) > 0);
    if (!hit.length) return d;
    if (d.side === 'below') return { ...d, y: Math.max(d.y, ...hit.map((p) => p.y + p.h)) };
    if (d.side === 'above') return { ...d, y: Math.min(d.y, ...hit.map((p) => p.y)) };
    if (d.side === 'right') return { ...d, x: Math.max(d.x, ...hit.map((p) => p.x + p.w)) };
    return { ...d, x: Math.min(d.x, ...hit.map((p) => p.x)) };
  });
  const moved = (d: Dock, i: number): number => Math.abs(d.x - near[i]!.x) + Math.abs(d.y - near[i]!.y);
  const shortest = pushed.map((d, i) => ({ d, m: moved(d, i) })).sort((a, b) => a.m - b.m);
  for (const { d } of shortest) if (cover(d) <= 1) return d;
  let best = near[0]!;
  for (const d of [...near, ...pushed]) if (cover(d) < cover(best)) best = d;
  return best;
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
