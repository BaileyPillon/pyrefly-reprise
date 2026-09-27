/**
 * PR-0193, FFX half: the whole-side label ("ALL ENEMIES" / "ALL ALLIES") steps
 * off the enemy-intent card as well as the HUD's own panels.
 *
 * The move is FFX-2's `allLabelClear.ts` (the smallest shift that clears every
 * panel and stays in the window; it stays put when nothing fits), reused as is.
 * FFX's cursor panels (`FFXBattleHud.panelRects`) leave the intent card out on
 * purpose (the field's visibility sums), so the label adds it here. The type
 * floor is CSS (`ffx-hud.css`, 5.6 grid px on the letterbox, never under 14 px).
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only** (FFX-2 has its own wiring in
 * `plateRedock.ts`).
 */
import type { TargetRect } from './TargetCursor.ts';
import { clearGroupLabels } from '../ffx2/allLabelClear.ts';

/** The HUD panels plus every visible intent card under `root`, viewport px. */
export function groupLabelPanels(root: ParentNode, panels: readonly TargetRect[]): TargetRect[] {
  const out = panels.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h }));
  for (const el of root.querySelectorAll<HTMLElement>('.eint__panel')) {
    if (el.hidden || el.closest('[hidden]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  return out;
}

/** Re-seat the label under `cursorEl` clear of `panels` and the intent cards under `hudRoot`. */
export function fitGroupLabel(cursorEl: HTMLElement, hudRoot: ParentNode, panels: readonly TargetRect[]): void {
  if (!cursorEl.querySelector('.ffx-target__all')) return;
  clearGroupLabels(cursorEl, groupLabelPanels(hudRoot, panels));
}
