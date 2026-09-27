/**
 * The whole-side field label ("ALL ENEMIES" / "ALL ALLIES") steps off the HUD
 * panels it lands on (critic round 13 PR-0193; release 19 focused review
 * FOC19-05; CHK-008).
 *
 * `TargetCursor.groupLabelHtml` centres the label above the group's brackets,
 * and nothing moved it: in Chapter VI at 2560x1440 (Grenade) and in the Den at
 * 1600x900 (Pray) it printed under the enemy-move slab. Making the slab dodge
 * the label instead pushed the slab onto a fighter (the slab ranks fighters
 * below chrome), so the label is the one that moves: the smallest shift, up,
 * down, left or right, that clears every panel the plates already dock against
 * (`CommandMenu`'s `panels`: the HUD's panels plus the slab and its chip) and
 * stays inside the window. It is a `translate`, so the label's own transform
 * (centring and the house skew) is untouched. With no clear spot it stays put.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: FFX-2's cursor and panels.
 */

import type { TargetRect } from '../ffx/TargetCursor.ts';

/** Space kept between the label and a panel, viewport px. */
const GAP = 6;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function hits(a: Box, p: TargetRect): boolean {
  return a.left < p.x + p.w && a.right > p.x && a.top < p.y + p.h && a.bottom > p.y;
}

/**
 * The shift that clears `box` of every panel, nearest first, or `null` when
 * none fits inside `view`. `{ dx: 0, dy: 0 }` when it is already clear.
 */
export function clearShift(box: Box, panels: readonly TargetRect[], view: { width: number; height: number }): { dx: number; dy: number } | null {
  const clear = (dx: number, dy: number): boolean => {
    const b = { left: box.left + dx, top: box.top + dy, right: box.right + dx, bottom: box.bottom + dy };
    if (b.left < 0 || b.top < 0 || b.right > view.width || b.bottom > view.height) return false;
    return !panels.some((p) => hits(b, p));
  };
  if (clear(0, 0)) return { dx: 0, dy: 0 };
  const shifts: Array<{ dx: number; dy: number }> = [];
  for (const p of panels) {
    shifts.push({ dx: 0, dy: p.y - GAP - box.bottom }); // above it
    shifts.push({ dx: 0, dy: p.y + p.h + GAP - box.top }); // below it
    shifts.push({ dx: p.x - GAP - box.right, dy: 0 }); // left of it
    shifts.push({ dx: p.x + p.w + GAP - box.left, dy: 0 }); // right of it
  }
  shifts.sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
  return shifts.find((s) => clear(s.dx, s.dy)) ?? null;
}

/** Re-seat every whole-side label under `root` clear of `panels` (viewport px). */
export function clearGroupLabels(root: HTMLElement, panels: readonly TargetRect[]): void {
  const view = { width: window.innerWidth, height: window.innerHeight };
  for (const el of root.querySelectorAll<HTMLElement>('.ffx-target__all')) {
    const was = el.dataset['clearShift'] ?? '0 0';
    const [ox, oy] = was.split(' ').map(Number) as [number, number];
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    // Measure from where the label sits without our shift.
    const home = { left: r.left - ox, top: r.top - oy, right: r.right - ox, bottom: r.bottom - oy };
    const s = clearShift(home, panels, view) ?? { dx: 0, dy: 0 };
    const next = `${Math.round(s.dx)} ${Math.round(s.dy)}`;
    if (next === was) continue;
    el.dataset['clearShift'] = next;
    el.style.translate = next === '0 0' ? '' : `${Math.round(s.dx)}px ${Math.round(s.dy)}px`;
  }
}
