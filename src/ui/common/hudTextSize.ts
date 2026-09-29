/**
 * TEXT SIZE's layout moves that CSS alone cannot make (OPTIONS accessibility A2,
 * D-285; target `docs/concepts/accessibility-2026-09-26/desk-hud-130.jpg`).
 *
 * The FFX desktop HUD grows each panel from its pinned corner
 * (`text-size.css`). A grown command list would then run up into the help slab
 * and the guide, so it shows fewer rows and scrolls with its existing ▲ ▼ marks:
 * four at 130 %, as the target frame draws, and five at 115 %. The upright phone
 * lays its list out in two columns of its own and keeps every row.
 *
 * Reads the attributes `app/applyComfort.ts` puts on `<html>` rather than the
 * save, so the HUD needs no store and a unit test can set the attribute.
 *
 * Game case: FFX only (the FFX command stack; FFX-2's menu is its own).
 */

/** The current TEXT SIZE as a fraction: 1, 1.15 or 1.3. 1 without a DOM. */
export function currentTextScale(root: HTMLElement | null = rootEl()): number {
  switch (root?.dataset['textSize']) {
    case '130':
      return 1.3;
    case '115':
      return 1.15;
    default:
      return 1;
  }
}

/** Rows the FFX desktop command list shows at the current TEXT SIZE, given its 100 % count. */
export function commandRowsCap(base: number, root: HTMLElement | null = rootEl()): number {
  if (!root || root.hasAttribute('data-phone-battle')) return base;
  const scale = currentTextScale(root);
  if (scale >= 1.3) return Math.min(base, 4);
  if (scale >= 1.15) return Math.min(base, 5);
  return base;
}

function rootEl(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.documentElement;
}

/**
 * A reserved grid slot as the grown panel fills it: `text-size.css` grows the FFX help
 * slab from its left top corner, so the advisor solver must keep that much clear.
 */
export function grownFromTopLeft<R extends { left: number; top: number; right: number; bottom: number }>(slot: R, root: HTMLElement | null = rootEl()): R {
  const s = root?.hasAttribute('data-phone-battle') ? 1 : currentTextScale(root);
  if (s === 1) return { ...slot };
  return { ...slot, right: slot.left + (slot.right - slot.left) * s, bottom: slot.top + (slot.bottom - slot.top) * s };
}
