/**
 * FFX's AIMING MARKER: the game's own cone, in the Ink & Gold finish (Bailey, 2026-11-06 13:10 ET: "the hand finger icon when targeting now looks weird to me and not very final fantasy like please fix";
 * his pick on 2026-11-07 ~09:50 ET: "B: cone in Ink and Gold", card `cursor-ffx-B`). Replaces the pointing glove (the 44 x 30 `HAND_SVG` and the big `PRO_HAND_SVG`) as the FFX marker; the glove stays one
 * address word away (`?marker=hand`, {@link markerStyle}), so it can come back.
 *
 * Game case (rule 14): FFX ONLY. The retail FFX marks a target with a small white cone that has a red collar, tip toward the figure (the driver's Steam captures `t1x.jpg`, `t2x.jpg`, `e15.jpg`;
 * `research/observed-ffx-steam-2026-09-26.md` section 2.1, "a red target cursor"); there is no glove in the retail game, so the glove was never FFX's own. FFX-2's marker is the six-petal ring and is untouched
 * (`TargetCursor.ts` never reaches this file for `chrome === 'ffx2'`). The shape is the retail cone's; the ivory body, the gold rim, the gold collar with a red jewel and the warm glow are ours, from the Ink & Gold
 * look Bailey picked on 2026-09-19 [ours]. The size is ours too: a cone 6.2 percent of the window wide (about 100 px at 1600), never under 64 px nor over 168.
 *
 * It keeps every hook the glove had (`.ffx-target__hand`, the plate that docks off it, `handClear.ts`, the bob that REDUCE MOTION and LOW EFFECTS stop); `.ffx-target__hand--cone` is the only new class.
 * One inline SVG, so it needs no load; each gradient id is used once because only the aimed figure carries a marker.
 */
import './target-cone.css';
import { queryWord } from '../../engine/motion/DemoGate.ts';
import type { TargetRect } from './TargetCursor.ts';
import { handBox, overlapArea } from './targetCursorParts.ts';

const INK = '#0b0a12';

/** The marker FFX wears: the cone (the default) or, with `?marker=hand`, the glove that was there before 2026-11-07. */
export type MarkerStyle = 'cone' | 'hand';

/** `?marker=hand` from a search string (pure): `hand` puts the glove back; anything else (or nothing) is the cone. */
export function markerStyleFromSearch(search: string | undefined): MarkerStyle {
  return queryWord(search, 'marker') === 'hand' ? 'hand' : 'cone';
}

let style: MarkerStyle | null = null;

/** The marker as the page asked for it (read once), or as a test or the console set it. */
export function markerStyle(): MarkerStyle {
  if (style === null) style = markerStyleFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return style;
}

/** Tests and `__pyrefly.marker(...)`: force the style (`null` reads the address again). Takes effect at the cursor's next draw. */
export function setMarkerStyle(value: MarkerStyle | null): void {
  style = value;
}

/** The cone's drawing is 128 x 70 (`CONE_SVG`): the collar on the left, the tip on the right, a 1.83:1 shape. */
export const CONE_VIEW = { w: 128, h: 70 } as const;

/** The cone's size at a window width: 6.2 percent of it, 64 px at the least and 168 px at the most, in the shape of the drawing. [ours] */
export function coneSize(viewW: number): { w: number; h: number } {
  const w = Math.min(168, Math.max(64, viewW * 0.062));
  return { w, h: (w * CONE_VIEW.h) / CONE_VIEW.w };
}

/**
 * Does the cone dock on the figure's RIGHT (tip pointing left) instead of its left? Only when its left box would sit mostly (30 percent or more of its area) under a HUD panel the cursor's layer is clipped behind (the command
 * stack, `bracketClip.ts`: the leftmost ally stands against the command list, and a cone docked there is hidden behind the rows, as the glove was) and the right box is under less of them. With no panels (a unit fixture, the phone) it never flips.
 * [ours] The real game's cone points at its target from either side.
 */
export function coneFlips(rect: TargetRect, gap: number, size: { w: number; h: number }, panels: readonly TargetRect[]): boolean {
  if (!panels.length) return false;
  const covered = (b: TargetRect): number => panels.reduce((sum, p) => sum + overlapArea(b, p), 0) / (b.w * b.h);
  const left = covered(handBox(rect, gap, size, 'left'));
  const right = covered(handBox(rect, gap, size, 'right'));
  return left >= 0.3 && right < left;
}

/** How far the cone's bob carries it towards the figure, px. A custom property so the pro look's glove rule (`pro-markers.css`, 16 px) and ours read one number. */
export const CONE_BOB = 8;

/** The cone, tip right (it docks on the figure's left, as the glove did). */
export const CONE_SVG = `<svg viewBox="0 0 128 70" aria-hidden="true" class="ffx-cone">
  <defs>
    <linearGradient id="ffxConeIvory" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbea"/><stop offset="0.6" stop-color="#eee3bf"/><stop offset="1" stop-color="#b9a874"/></linearGradient>
    <linearGradient id="ffxConeGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe58a"/><stop offset="0.5" stop-color="#e9b62b"/><stop offset="1" stop-color="#a87510"/></linearGradient>
    <radialGradient id="ffxConeJewel" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#ff9a8f"/><stop offset="0.6" stop-color="#d4202c"/><stop offset="1" stop-color="#7d0c15"/></radialGradient>
  </defs>
  <g stroke-linejoin="round" stroke-linecap="round">
    <path d="M122 35 L34 7 Q48 35 34 63 Z" fill="url(#ffxConeIvory)" stroke="${INK}" stroke-width="2.8"/>
    <path d="M122 35 L34 7 Q48 35 34 63 Z" fill="none" stroke="url(#ffxConeGold)" stroke-width="1.6" transform="translate(0.4 0)"/>
    <path d="M108 34 L50 15" stroke="rgba(255,255,255,0.95)" stroke-width="2.2" fill="none"/>
    <ellipse cx="26" cy="35" rx="17" ry="30" fill="url(#ffxConeGold)" stroke="${INK}" stroke-width="2.8"/>
    <ellipse cx="26" cy="35" rx="11" ry="21" fill="none" stroke="rgba(11,10,18,0.55)" stroke-width="1.4"/>
    <ellipse cx="27" cy="35" rx="6.5" ry="11" fill="url(#ffxConeJewel)" stroke="${INK}" stroke-width="1.8"/>
    <ellipse cx="25" cy="29" rx="2" ry="3.2" fill="rgba(255,255,255,0.75)"/>
  </g>
</svg>`;
