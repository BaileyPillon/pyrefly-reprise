/**
 * Where a greyed row's reason goes when it has no room beside the row's name (FFX-2 only; the FFX menu has its own rows).
 *
 * A greyed command row prints why: "Itchy — spherechange first" after its name. The row is a fixed box, and since the RC7 text
 * fix (`ffx2-hud.css`, the desktop `.ffx2cmd__reason` rule) the REASON gives way to the name, so a short name ("Attack", "Item")
 * leaves room for "ITCHY — SP…" and a long one does not: "White Magic" is 188 px of a 283 px line at 1600x900, its group arrow
 * and the cursor take 70 more, and the reason was left 30 px beside it and 2 px under the cursor, so the row read as if it had no
 * reason at all (live check LV48-1, release 48). The sibling rows still showed theirs.
 *
 * The rule here: when less than {@link REASON_FLOOR} of the reason would show beside the name, the reason moves to its own line
 * under the name (`.ffx2cmd--reason-below` in `ffx2-hud.css`, the same device as a Change row's `GRANTS:` line and the phone
 * layout's stacked reason), where it has the whole width. A row whose reason shows well enough is laid out exactly as before.
 *
 * The decision is made on the layout the row has WITHOUT its cursor, so moving the highlight onto a row can never flip it.
 */

/** The class that puts a row's reason under its name. */
export const REASON_BELOW = 'ffx2cmd--reason-below';

/** The least share of a reason that must show beside the name before it is moved under it. The shortest sibling seen is 0.29 (Skill, cursor on it), White Magic is 0.08. */
export const REASON_FLOOR = 0.2;

/**
 * Whether a reason is too squeezed to read: `shown` is the width the reason has (its `clientWidth`), `natural` the width its whole
 * text needs (its `scrollWidth`), both in the same unit. Pure, so the threshold is testable without a layout engine (jsdom
 * measures every box as 0, and a row it cannot measure stays as it is).
 */
export function reasonStacks(shown: number, natural: number): boolean {
  return natural > 0 && shown < natural * REASON_FLOOR;
}

/**
 * Bring every greyed row of the command window up to date: stack the reason of the rows that cannot show it. Called after each
 * render (the window is rebuilt from a string on every cursor move). The phone layout stacks every reason already and is left alone.
 */
export function syncReasons(box: HTMLElement): void {
  if (document.documentElement.dataset['phoneBattle']) return;
  for (const row of box.querySelectorAll<HTMLElement>('.ig-cmd')) {
    const reason = row.querySelector<HTMLElement>('.ffx2cmd__reason');
    if (!reason) continue;
    // Measure the row inline, as the stylesheet lays it out, and without the highlight's cursor (so the answer does not depend on it).
    row.classList.remove(REASON_BELOW);
    const cursor = row.querySelector<SVGElement>('.ig-cmd__cursor');
    if (cursor) cursor.style.display = 'none';
    const stack = reasonStacks(reason.clientWidth, reason.scrollWidth);
    if (cursor) cursor.style.display = '';
    if (stack) row.classList.add(REASON_BELOW);
  }
}
