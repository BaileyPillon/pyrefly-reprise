/**
 * The strategy guide's page-fitting arithmetic, split out of `StrategyGuide.ts`: which whole blocks fit a
 * rail ({@link fitWholeUnits}) and how a paragraph is shown by lines ({@link showLines}). The panel decides
 * *when* to fit (every frame the rail's height may have changed, held until it does); these decide *how*.
 * Nothing here reads the battle, the document or the advisor.
 */

/**
 * One block of text in the body, measured in the stage's own **layout** units.
 *
 * Both numbers come from `offsetTop`/`offsetHeight` arithmetic, which a CSS `transform` on an ancestor
 * never touches — that is the whole point. Round 04 PR-0009 was twice fixed by converting *screen*
 * measurements into grid units and twice stayed broken; the fit decision below reads nothing a
 * transform can move.
 */
export interface GuideFitUnit {
  /** The block's own box bottom, relative to `.sgd__body`'s top edge. */
  readonly bottom: number;
  /**
   * The bottom of this block's lowest **glyph**, same origin — always at or above {@link bottom},
   * because a line box carries half-leading and a block can carry padding under its last line. Ending
   * the body here rather than at `bottom` is what makes the slab's edge land on the type instead of a
   * few px of empty leading below it.
   */
  readonly glyphBottom: number;
  /** A head that introduces what follows (`sgd__kn`), which must never be the last thing shown. */
  readonly heading?: boolean;
}

export interface GuideFit {
  /** How many leading blocks stay; every later one is hidden outright. */
  readonly shown: number;
  /** The body's exact height: the last shown block's glyph bottom. */
  readonly height: number;
  /** At least one block had to go, so the MORE row is earned. */
  readonly clipped: boolean;
}

/**
 * Keep the leading run of blocks that fits `limit` **entirely**, and end the box on the last one's
 * glyphs.
 *
 * Round 03 #36 and round 04 PR-0009: "…the CTB margin the Holy / Water rhythm need[s to beat] the
 * mount's Full-". Every previous answer clamped a continuous height and hoped the boundary landed
 * between two lines. This one cannot slice, because the only heights it can return are block
 * boundaries: whatever `limit` is, the box ends where a block ended.
 *
 * Pure and exported so the rule is unit-testable without a layout engine — the class's only job is to
 * read the two numbers per block off the DOM.
 */
export function fitWholeUnits(units: readonly GuideFitUnit[], limit: number): GuideFit {
  if (units.length === 0) return { shown: 0, height: Math.max(0, limit), clipped: false };
  let shown = 0;
  for (const unit of units) {
    if (unit.bottom > limit + 0.5) break;
    shown++;
  }
  // Not even the first block fits: show it anyway and let the rail run a couple of px long. The page
  // has to show something, and an empty slab with a MORE chip under it would be the worse defect.
  if (shown === 0) return { shown: 1, height: units[0]!.glyphBottom, clipped: units.length > 1 };
  // Never end on an orphan head whose body was all cut away.
  while (shown > 1 && shown < units.length && units[shown - 1]!.heading) shown--;
  const last = units[shown - 1]!;
  return { shown, height: Math.min(last.glyphBottom, last.bottom), clipped: shown < units.length };
}

/**
 * The line pitch of a split unit's text in layout px (the computed `line-height`, which no ancestor
 * transform scales), or 0 when it cannot be read: jsdom, or `line-height: normal`. A unit with no pitch
 * is never split.
 */
export function linePitch(el: HTMLElement): number {
  try {
    const pitch = Number.parseFloat(getComputedStyle(el).lineHeight);
    return Number.isFinite(pitch) && pitch > 0 ? pitch : 0;
  } catch {
    return 0;
  }
}

/**
 * Show lines `from` to `from + count` of a split unit: its box is exactly `count` line pitches tall and its
 * text is shifted up by `from` pitches, so the cut at either end falls on a line boundary.
 */
export function showLines(el: HTMLElement, from: number, count: number, pitch: number): void {
  el.classList.add('sgd__part');
  el.classList.toggle('sgd__cont', from > 0);
  el.style.height = `${(count * pitch).toFixed(3)}px`;
  const text = el.firstElementChild as HTMLElement | null;
  if (text) text.style.marginTop = from > 0 ? `${(-from * pitch).toFixed(3)}px` : '';
}

/** Undo {@link showLines}: the unit is whole again. */
export function resetLines(el: HTMLElement): void {
  if (!el.classList.contains('sgd__part')) return;
  el.classList.remove('sgd__part', 'sgd__cont');
  el.style.height = '';
  const text = el.firstElementChild as HTMLElement | null;
  if (text) text.style.marginTop = '';
}
