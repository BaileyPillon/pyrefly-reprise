/**
 * The MAX mix (D-316), the twirl keys' hold on the spherechange flourish's white column (round 21, PR-0334; FFX-2 only: only
 * FFX-2 has a spherechange).
 *
 * `ui/ffx2/SpherechangeFlourish.ts` draws a CSS light column over the girl on the change's first frame (§4.5.4's "vertical
 * white light column"). The painted keys (`twirl.ts`) replace it, but they only show once they and the new outfit have loaded:
 * a few hundred ms on a network, and for that long the column stood at full white over her, a hard-edged slab in 7 of 7 changes
 * in four chapters. So the document wears `mix-twirl` from the change's first frame (synchronously, before anything is
 * awaited) while its keys are expected, and a rule hides the column; if the keys do not come, the column is given back and
 * replayed from its start, so it rises like today's instead of popping in at its peak.
 *
 * Presentation only, DOM only (no `three`); not under the presenter (hard rule 1 holds: nothing here is in `src/battle`).
 */

const STYLE_ID = 'mix-twirl-style';
const STYLE = '.mix-twirl .ffx2sf__column{opacity:0 !important}';

/** The class on the document that hides the flourish's white column while a change's keys are expected. */
export const HIDE_CLASS = 'mix-twirl';

/** The flourish's own length, ms (`SpherechangeFlourish.FLOURISH_MS`; its settle hides the column then). */
const FLOURISH_MS = 800;

/** Hide the column of every flourish now up and of any that opens while the class stays. */
export function hideColumn(): void {
  if (typeof document === 'undefined') return;
  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = STYLE;
    document.head.appendChild(st);
  }
  document.documentElement.classList.add(HIDE_CLASS);
}

/** Stop hiding the column (the keys have finished, or the change is over). */
export function showColumn(): void {
  if (typeof document !== 'undefined') document.documentElement.classList.remove(HIDE_CLASS);
}

/**
 * Give the column back because the keys are not coming: stop hiding it, and replay each column of `who`'s flourish from its start
 * over the time the flourish has left, so it ends with the flourish (its settle) instead of popping in at its peak. With under
 * 250 ms of the flourish left, or where animations cannot be read, it just ends as it is.
 */
export function giveBackColumn(who: string, flourishMs = FLOURISH_MS): void {
  if (typeof document === 'undefined') return;
  showColumn();
  for (const col of document.querySelectorAll<HTMLElement>('.ffx2sf[data-who] .ffx2sf__column')) {
    if (col.closest<HTMLElement>('.ffx2sf')?.dataset['who'] !== who) continue;
    const run = typeof col.getAnimations === 'function' ? col.getAnimations().find((x) => (x as CSSAnimation).animationName === 'ffx2sf-column') : undefined;
    const left = flourishMs - Number(run?.currentTime ?? 0);
    if (!run || !(left >= 250)) continue;
    col.style.setProperty('--sf-ms', `${Math.round(left)}ms`);
    col.style.animation = 'none';
    void col.offsetWidth; // a reflow between the two writes restarts the animation
    col.style.animation = '';
  }
}
