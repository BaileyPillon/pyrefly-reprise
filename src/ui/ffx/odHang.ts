/**
 * r381-ui-floor (FFX only): measure how far the party list's Overdrive bar and label really hang past the list's right edge,
 * so the aim nudge (`hud-floor.css`) is clamped by the room that is left instead of by a hang assumed once.
 *
 * Why. While an enemy is aimed at, the party list dims and slides right (`ffx-hud.css`, the approved "yields while aiming"
 * frame). Each row's content (face, name, HP, MP, the bar) is wider than its 198 px box once the type holds the 14 px floor
 * (the HP and MP denominators grow to 8.8 grid px at 1024x768), and the bar is the last flex item (`margin-left: auto`), so
 * it sits wherever the content ends: past the row's right edge by an amount that depends on the party's digits. The third
 * attempt capped the slide by a hang fixed at 9.25 grid px, which is true of Chapters I and II (short numbers) and false in
 * Chapter III (`6492/6492`: 14.3 px for the label, 16.2 for the bar), where the "D" ran past a 1024 px window at every TEXT
 * SIZE (independent check, 2026-10-04, blocker B1; the third failure of the class, method check section 5).
 *
 * The method (`docs/plans/r37-ui-floor-method-check.md`, section 4): measure the room, in stage grid px, and bound the
 * run-time offset by it. The measurement here is the hang, in the list's own px (grid px before TEXT SIZE scales the list);
 * the bound is `hud-floor.css`'s `min(6%, 21.1px / text-scale - hang)`. The hang is a difference of two rects that share the
 * list's transform (the slide, the TEXT SIZE scale), so it does not depend on how far the slide has got when it is read.
 *
 * Game case: FFX only. FFX-2's party list is left-anchored, takes no aim nudge and has no Overdrive bar (it reuses the bar as
 * the ATB gauge on the other side); the phone's party card is a flow layout without the nudge.
 */

/** The custom property `hud-floor.css` reads; the widest hang of any row's OD bar or label, in list px. */
export const OD_HANG_PROP = '--ffx-od-hang';

/** The published value is rounded up to this step, so a rounded reading never errs towards the window's edge. */
const STEP = 0.05;

/**
 * The hang, in list px, of the right-most of `rights` (screen px) past `listRight` (screen px), where `unit` is screen px per
 * list px (the stage scale times the TEXT SIZE scale). 0 when nothing reaches past the list; null when there is nothing to
 * measure or the scale is unusable.
 */
export function odHangOf(listRight: number, rights: readonly number[], unit: number): number | null {
  if (!(unit > 0) || !Number.isFinite(listRight)) return null;
  const finite = rights.filter((r) => Number.isFinite(r));
  if (!finite.length) return null;
  return Math.max(0, Math.max(...finite) - listRight) / unit;
}

/** The nudge `hud-floor.css` applies for a given hang: the approved 6 % of the list, held by the room left (grid px of list px; never negative). */
export function aimNudge(hang: number, textScale: number, listWidth: number, roomGrid = 21.1): number {
  return Math.min(0.06 * listWidth, Math.max(0, roomGrid / textScale - hang));
}

/**
 * Measure the widest hang (bar or label, every row) and publish it on the list as {@link OD_HANG_PROP}. Call it before the
 * list takes the aim class and then every frame it is aimed (the rows re-render as HP changes); it writes only when the
 * value moved. `hudScale` is the stage scale (`FFXBattleHud.hudScale`, screen px per grid px).
 */
export function publishOdHang(list: HTMLElement, hudScale: number): void {
  if (list.ownerDocument.documentElement.dataset['phoneBattle']) return;
  const box = list.getBoundingClientRect();
  if (box.width <= 0 || !(hudScale > 0)) return;
  // The TEXT SIZE scale (`text-size.css`, the individual `scale` property) multiplies the stage's; 'none' at 100 %.
  const textScale = parseFloat(getComputedStyle(list).scale) || 1;
  const rights: number[] = [];
  for (const od of list.querySelectorAll<HTMLElement>('.ffx-stat__od')) {
    const bar = od.getBoundingClientRect();
    if (bar.width <= 0) continue;
    rights.push(bar.right);
    const label = od.querySelector('em');
    if (label) rights.push(label.getBoundingClientRect().right);
  }
  const hang = odHangOf(box.right, rights, hudScale * textScale);
  if (hang === null) {
    list.style.removeProperty(OD_HANG_PROP);
    return;
  }
  const value = `${(Math.ceil(hang / STEP) * STEP).toFixed(2)}px`;
  if (list.style.getPropertyValue(OD_HANG_PROP) !== value) list.style.setProperty(OD_HANG_PROP, value);
}
