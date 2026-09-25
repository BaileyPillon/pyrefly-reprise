import type { TargetRect } from '../ffx/TargetCursor.ts';

/**
 * Keeps the field cursor's name plate docked clear of HUD panels that move
 * while the player aims. FFX-2 only: the FFX command stack does not move under
 * an open target view, and FFX's cursor is wired by its own HUD.
 *
 * `CommandMenu` hands the cursor its panels once, when the target view opens,
 * and every later plate (each arrow step) docks against that snapshot. At
 * Vegnagun's link 3 (D-044, the Body on option C's spot) the enemy-intent slab
 * settles under the Body only after the target plates and the move advisor have
 * made their own moves, so plates docked against the opening snapshot printed
 * the Bulwarks' names across the slab's header. This re-reads the panels each
 * frame while aiming and re-docks when one has moved by more than
 * {@link STEP} px; a re-dock rebuilds the reticle, so a sub-step sway of the
 * camera must not restart its flash every frame.
 *
 * The loop ends by itself once the cursor's element leaves the page, which is
 * how `CommandMenu` disposes of it.
 */
const STEP = 6;

interface Dockable {
  readonly el: HTMLElement;
  setPanels(panels: readonly TargetRect[]): void;
  reposition(): void;
}

function moved(a: readonly TargetRect[], b: readonly TargetRect[]): boolean {
  if (a.length !== b.length) return true;
  return a.some((p, i) => {
    const q = b[i]!;
    return Math.abs(p.x - q.x) > STEP || Math.abs(p.y - q.y) > STEP || Math.abs(p.w - q.w) > STEP || Math.abs(p.h - q.h) > STEP;
  });
}

export function keepPlateDocked(
  cursor: Dockable,
  panels: (() => readonly TargetRect[]) | undefined,
  aiming: () => boolean,
): void {
  if (!panels || typeof requestAnimationFrame !== 'function') return;
  let applied: readonly TargetRect[] | null = null;
  const tick = (): void => {
    if (!cursor.el.isConnected) return;
    requestAnimationFrame(tick);
    if (!aiming()) {
      applied = null;
      return;
    }
    const next = panels().map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h }));
    if (applied && !moved(applied, next)) return;
    applied = next;
    cursor.setPanels(next);
    cursor.reposition();
  };
  requestAnimationFrame(tick);
}
