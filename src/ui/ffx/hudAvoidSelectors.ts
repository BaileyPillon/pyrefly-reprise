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
  // The reticles. Round 02 #14's repro at 1000x562 had *both* of them
  // entirely inside the slab. Listing their boxes moves the slab and
  // changes nothing about how a reticle is drawn or aimed, which is issue
  // #08/#13's track, not this one.
  '.ig-reticle',
  ...ZANMATO_GAUGE_SELECTORS,
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
