/**
 * Which HUD boxes a floating FFX panel must keep off, by selector, and the one
 * helper that measures them. Moved out of `FFXBattleHud.ts` (house style: that
 * file is far over 400 lines and must not grow), with the list unchanged apart
 * from Yojimbo's gauge.
 *
 * Every entry names a **solid child**, never an `inset: 0` wrapper (`.sgd`,
 * `.mad`, `.eint`, `.ffx-zg`): listing a wrapper would fence off the whole
 * field. `ffx/DamageNumbers.ts` explains the same rule for the numerals.
 */

import { currentTextScale } from '../common/hudTextSize.ts';

/**
 * Yojimbo's Zanmato gauge (FFX, Chapter IX only; `ZanmatoGauge.ts`): the panel
 * under his name, and the one-shot banner while it is up. Both are opaque ink,
 * so the intent slab and the damage numerals dodge them like any other panel.
 * The banner goes up on the very hit that fills the gauge, which is exactly
 * when a numeral lands on Yojimbo; before these were listed that hit's numeral
 * printed across the banner's subtitle.
 */
export const ZANMATO_GAUGE_SELECTORS = ['.ffx-zg__panel', '.ffx-zg__banner'] as const;

/**
 * Seymour Omnis's disc strip and intent line (FFX, Chapter XII only;
 * `OmnisReadout.ts`): opaque ink like the Zanmato panel, so the same panels
 * dodge them. The colour-order tab hangs under the strip.
 */
export const OMNIS_READOUT_SELECTORS = ['.ffx-omr__strip', '.ffx-omr__note', '.ffx-omr__intent'] as const;

/**
 * The Sin HUD (FFX, Chapters XVII and XVIII only; `SinHud.ts`): the link 4 clock,
 * the Gaze pill and the Fins' plate. Each is a solid child of the `inset: 0`
 * wrapper `.ffx-sinhud`, which is never listed.
 */
export const SIN_HUD_SELECTORS = ['.ffx-sinclock', '.ffx-sinhud__gaze', '.ffx-sinfin'] as const;

/**
 * The one-chapter panels the move advisor's card treats as obstacles by
 * selector (`FFXBattleHud` asks the Zanmato gauge for its own boxes). Hidden
 * or zero-size boxes are skipped, so every other chapter is unchanged.
 */
export const ADVISOR_PANEL_SELECTORS = [...OMNIS_READOUT_SELECTORS, ...SIN_HUD_SELECTORS] as const;

/**
 * Status O3's cure-hint card while it is up (PR-0282, both games' plumbing; only the FFX HUD's
 * card could reach its slot): the move advisor's card treats it as an obstacle beside
 * {@link ADVISOR_PANEL_SELECTORS}, so the card never prints beneath it with the guide folded
 * (with the guide open it stands in the guide column's own slot, the column the advisor already
 * clears, beside the sheet). A hidden card matches nothing.
 */
export const STATUS_HINT_SELECTOR = '.sthint:not([hidden])';

/** Every one-chapter panel the floating FFX panels dodge (Chapter IX's gauge, Chapter XII's read-out, Sin's clock and Fin plate). */
export const CHAPTER_PANEL_SELECTORS = [...ZANMATO_GAUGE_SELECTORS, ...OMNIS_READOUT_SELECTORS, ...SIN_HUD_SELECTORS] as const;

/**
 * The HUD panels the intent slab may not cover.
 *
 * The CTB list first and above all — the slab's whole claim is "this is what
 * the actor at the top of that queue is about to do", and covering the queue
 * with the answer is self-defeating. The command stack and its help card are
 * here for the same reason the numerals dodge them, and `.ffx-sensor` joined
 * them after a Chapter 1 capture caught the slab printed across the
 * Mortiorchis's own scan card. The guide's rail and the advisor's chip joined
 * with the fix-3 round: both are opaque, both ship **on**, and at 1280x720 the
 * slab is wide enough to reach the guide's column.
 *
 * `.ig-banner` is deliberately absent, for the reason `ffx/DamageNumbers.ts`
 * gives about the telegraph: it is a transient band across the top of the
 * field, and dodging it would move the slab at exactly the moment the boss is
 * winding up and the player is reading it.
 */
export const INTENT_AVOID_SELECTORS = [
  '.ig-ctb',
  '.ig-cmd-stack',
  '.ffx-cmd-info',
  '.ig-stat-list',
  '.ffx-sensor',
  '.mad__card',
  '.mad__toggle',
  '.sgd__panel',
  '.sgd__toggle',
  '.sgd__slot > .sthint', // the cure-hint card in the guide column's slot (R38)
  // The reticles. Round 02 #14's repro at 1000x562 had *both* of them
  // entirely inside the slab. Listing their boxes moves the slab and
  // changes nothing about how a reticle is drawn or aimed, which is issue
  // #08/#13's track, not this one.
  '.ig-reticle',
  ...CHAPTER_PANEL_SELECTORS,
] as const;

export interface ViewportRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * The viewport box of every laid-out element under `root` matching one of
 * `selectors`. Size alone decides "laid out": a zero-size box covers `[hidden]`
 * (which `tokens.css` forces to `display: none`) and a hidden *ancestor* too,
 * so the `el.hidden || el.offsetParent === null` gate `ffx/DamageNumbers.ts`
 * also applies would be redundant here.
 */
export function rectsOf(root: ParentNode, selectors: readonly string[]): ViewportRect[] {
  const out: ViewportRect[] = [];
  for (const selector of selectors) {
    for (const el of root.querySelectorAll<HTMLElement>(selector)) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      out.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
  }
  return out;
}

/** TEXT SIZE is 115 / 130 % on the desktop HUD: the only case the chip rules below apply to (100 % is untouched; the phone lays out in flow). */
function textSizeGrown(hud: HTMLElement): boolean {
  const root = hud.ownerDocument.documentElement;
  return !root.dataset['phoneBattle'] && currentTextScale(root) > 1;
}

/**
 * The two key chips the advisor card must keep off (PR-0266; desktop only, the upright
 * phone lays its chips out in flow): the guide's `G` chip inside the HUD, and the battle
 * screen's `PAUSE` chip, which lives outside the HUD in the screen root. Neither was in
 * the solver's input, so at TEXT SIZE 115 / 130 % (chips and card both grown) the card's
 * `N HIDE MOVES` chip sat on `PAUSE` or on `G`, and at 130 % the card covered `G`.
 */
export function chipObstacleEls(hud: HTMLElement): HTMLElement[] {
  const doc = hud.ownerDocument;
  if (!textSizeGrown(hud)) return [];
  return [...hud.querySelectorAll<HTMLElement>('.sgd__toggle'), ...doc.querySelectorAll<HTMLElement>('.battle-pause-chip')];
}

/**
 * The key chips along the top of the stage that the advisor's one-row tip must keep off at **every** text size (`advisorTip.ts`; the designed card never meets them at 100 percent, which is
 * why `chipObstacleEls` above asks for them only when TEXT SIZE has grown them): the guide's `G` chip and its scroll chip inside the HUD, and the screen's `PAUSE` chip. A hidden one measures zero
 * and is skipped by the caller.
 */
export function topChipEls(hud: HTMLElement): HTMLElement[] {
  const doc = hud.ownerDocument;
  return [...hud.querySelectorAll<HTMLElement>('.sgd__toggle, .sgd__keys'), ...doc.querySelectorAll<HTMLElement>('.battle-pause-chip')];
}

/** Room the advisor's own chip needs above its card, grid px: its measured height plus the gap; 0 when it is not up, at 100 % or on the phone. */
export function chipReserveOf(chipRect: { top: number; bottom: number } | null, gap: number, hud: HTMLElement): number {
  return chipRect && textSizeGrown(hud) ? chipRect.bottom - chipRect.top + gap : 0;
}
