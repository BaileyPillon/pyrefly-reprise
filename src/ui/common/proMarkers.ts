/**
 * THE MARKERS, the pure half (conference demo, lane "pro-look"; Bailey 2026-10-22, markers "Classic, calm, clear": a big FFX gold glove and an FFX-2 ring with the target name beside it, a pulse on the low-HP party
 * row, a grey wash and a KO mark; options book `target-lowhp-ko`, T1 A, T4 A, L1 A, L4 A, K1 A, K4 A). Pure (no DOM, no `three`): `TargetCursor.ts`, the two party-row builders and `ProFieldMarks.ts` use it;
 * `pro-markers.css` styles. The HUD's panels are not restyled here (the HUD is redesigned in its own lane): these are the marks that sit on the field and on a row.
 *
 * Off by default: `proPieceOn('markers')` (`engine/look/pro/ProSwitch.ts`) is false everywhere but the two demo chapters under `?look=pro` / `?pack=demo`.
 *
 * Game case (rule 14): the target marker is each game's own: Chapter I's is FFX's pointing glove (docked on the figure's left, FFX only), Chapter IV's is FFX-2's six-petal flower ring (FFX-2 only: the two chromes
 * are never mixed, `research/visual-bible.md` section 4.2 and 4.7). The low-HP pulse and the KO marks are both games, each in its own chrome (gold on navy, pink on plum) and each at its own game's low-HP line:
 * FFX's HUD already calls 12.5 percent of max HP and under "danger" (the orange numerals), FFX-2's HUD calls under a third "critical" (`ffx2/PartyRows.hpClass`, section 4.9). The KO fall's floor impact is
 * the real one (`real-motion/final/motion-from-game.json`: Tidus's fall reaches the floor at 1000 ms, Rikku's at 1600 ms); the shapes, sizes and colours are [ours].
 */
import { proPieceOn } from '../../engine/look/pro/ProSwitch.ts';

/** Are the pro markers drawing now (the pro look's `markers` piece: on in the two demo chapters, off elsewhere and by default)? */
export function proMarkersOn(): boolean {
  return proPieceOn('markers');
}

/** The box of a screen rectangle: left, top, width, height in CSS px. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The FFX glove's size: about five times today's 44 px at 1440p, growing with the window (`clamp(110, 9 percent of the width, 280)`), the 44:30 shape of the drawing. [ours] */
export function proHandSize(viewW: number): { w: number; h: number } {
  const w = Math.min(280, Math.max(110, viewW * 0.09));
  return { w, h: (w * 30) / 44 };
}

/** FFX-2's ring for a target's silhouette: a quarter of the figure's height across, on the torso (46 percent down), never under 26 px of radius nor over a third of the shorter screen edge. [ours] */
export function proRing(rect: Box, viewMin: number): { cx: number; cy: number; r: number } {
  const r = Math.min(Math.max(rect.h * 0.125, 26), viewMin * 0.17);
  return { cx: rect.x + rect.w / 2, cy: rect.y + rect.h * 0.46, r };
}

/** The ring's frame: the short corner brackets stand a quarter of a radius outside it. */
export function proRingBox(ring: { cx: number; cy: number; r: number }): Box {
  const e = ring.r * 1.28;
  return { x: ring.cx - e, y: ring.cy - e, w: e * 2, h: e * 2 };
}

/** A member's HP is at the low line of its game: FFX at 12.5 percent of max and under (its HUD's own "danger"), FFX-2 under a third (its HUD's own "critical"); alive only. */
export function isLowRow(game: 'ffx' | 'ffx2', hp: number, maxHp: number): boolean {
  if (!(hp > 0) || !(maxHp > 0)) return false;
  const f = hp / maxHp;
  return game === 'ffx' ? f <= 0.125 : f < 0.33;
}

export type RowMark = 'low' | 'ko' | null;

/** What a party row wears under the pro markers (`null` = nothing). */
export function rowMark(game: 'ffx' | 'ffx2', hp: number, maxHp: number, alive: boolean): RowMark {
  if (!alive || hp <= 0) return 'ko';
  return isLowRow(game, hp, maxHp) ? 'low' : null;
}

/** The class a row takes for its mark (with the leading space the row builders' class lists want, or ''). */
export function rowMarkClass(mark: RowMark): string {
  return mark === 'low' ? ' ig-stat--pro-low' : mark === 'ko' ? ' ig-stat--pro-ko' : '';
}

/** The small mark inside the row's face tile: a warning triangle for low HP (so the state is not colour alone), a KO pill for a fallen member. */
export function rowMarkHtml(mark: RowMark): string {
  if (mark === 'low') return '<i class="pro-mark pro-mark--low" aria-hidden="true"></i>';
  if (mark === 'ko') return '<i class="pro-mark pro-mark--ko" aria-hidden="true">KO</i>';
  return '';
}

/** When a fallen member's body reaches the floor, ms after it fell: the real clips' floor impacts (FFX Tidus 1000, FFX-2 Rikku 1600). */
export const KO_FLOOR_MS: Readonly<Record<'ffx' | 'ffx2', number>> = { ffx: 1000, ffx2: 1600 };

/**
 * The field's KO marks at `sinceMs` after a member fell: the grey wash settles on the floor round the body from the floor impact (over 450 ms, to 0.9), the KO mark pops over it 120 ms later (a 1.4x
 * pop that settles in 160 ms). Both stay for as long as the member is down. [ours]
 */
export function koPlan(game: 'ffx' | 'ffx2', sinceMs: number): { wash: number; mark: number; markScale: number } {
  const at = KO_FLOOR_MS[game];
  const wash = Math.min(1, Math.max(0, (sinceMs - at) / 450)) * 0.9;
  const m = sinceMs - (at + 120);
  const mark = m <= 0 ? 0 : Math.min(1, m / 120);
  const markScale = m <= 0 ? 0 : m >= 160 ? 1 : 1 + 0.4 * (1 - m / 160);
  return { wash, mark, markScale };
}
