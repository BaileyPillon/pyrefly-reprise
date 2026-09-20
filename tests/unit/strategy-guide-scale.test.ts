// @vitest-environment jsdom
/**
 * Round 04 PR-0009 (major, both games): the whole-line clamp from round 03 #36
 * does not hold once the HUD's letterbox stage is actually scaled.
 *
 * `StrategyGuide.measureLineBottoms()` reads `Range.getClientRects()` and
 * `bodyEl.getBoundingClientRect()`, which report **transformed screen
 * pixels** — `FFXBattleHud.layout()` / `LetterboxStage.createStage()` both
 * apply a uniform `scale(...)` CSS transform to an ancestor of `.sgd__body`
 * so the whole HUD fits the real viewport. `budget`, `available` and
 * `MORE_HEIGHT` in `layout()` are unscaled 640x360 stage-grid pixels, which a
 * CSS transform on an ancestor never touches. Feeding one straight into
 * `lastWholeLineBelow` against the other is a unit mismatch: at any scale
 * other than 1 (every real viewport except an exact 640x360 window), the
 * "last whole line" the search finds is not the true one, which is why round
 * 03 #36's own regression test (`strategy-guide-fold.test.ts`, scale 1) never
 * caught it.
 *
 * Case: both — `StrategyGuide` and its stylesheet carry no game branch other
 * than the accent colour (`sgd--ffx2`), same as round 03 #36.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';

/** Mirrors `strategy-guide-fold.test.ts`'s `boxed()` for the anchor elements. */
function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

describe('the whole-line clamp holds at a real letterbox scale (round 04 PR-0009)', () => {
  const originalGetClientRects = Range.prototype.getClientRects;
  afterEach(() => {
    Range.prototype.getClientRects = originalGetClientRects;
  });

  /**
   * Identical anchor pair to `strategy-guide-fold.test.ts`'s clamp case
   * (`available` = 175 grid px) and identical *grid-space* line bottoms
   * ([40, 90, 140, 172, 210], last whole line at 172), so a correct
   * measurement must land on the same 172 that test asserts at scale 1 —
   * only here every rect `Range.getClientRects()` and
   * `bodyEl.getBoundingClientRect()` return is pre-multiplied by 2.5, the
   * exact letterbox scale `FFXBattleHud.hudScale()` computes at 1600x900
   * (Bailey's own repro viewport, `min(1600/640, 900/360)`).
   */
  it('clamps to the last whole grid-space line, not the raw scaled screen-space number', () => {
    const SCALE = 2.5;
    const gridBottoms = [40, 90, 140, 172, 210];
    const scaledBottoms = gridBottoms.map((b) => b * SCALE);
    Range.prototype.getClientRects = function (this: Range) {
      return scaledBottoms.map((bottom) => ({ bottom }) as DOMRect) as unknown as DOMRectList;
    };

    const stage = document.createElement('div');
    document.body.appendChild(stage);
    const guide = new StrategyGuide({
      game: 'ffx',
      anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
    });
    guide.mount(stage);
    const bodyEl = stage.querySelector<HTMLElement>('.sgd__body')!;
    // A scaled ancestor changes what `getBoundingClientRect()` reports but
    // never `offsetHeight` (the box's own pre-transform layout height) — that
    // is the fact the fix has to use. Give `bodyEl` an unscaled height and a
    // `getBoundingClientRect()` that is exactly `SCALE` times it, the same
    // relationship a real transformed browser box has.
    Object.defineProperty(bodyEl, 'offsetHeight', { value: 210, configurable: true });
    Object.defineProperty(bodyEl, 'getBoundingClientRect', {
      value: () => ({ top: 0, height: 210 * SCALE }) as DOMRect,
      configurable: true,
    });

    guide.sync(makeFakeBattleState());
    guide.update(0.016);

    const panel = stage.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
    // Unclamped `available` is 175 grid px (240 - 5 - 60), exactly as the
    // scale-1 case in `strategy-guide-fold.test.ts`. The last whole
    // *grid-space* line is 172 — if the fix is missing, `measureLineBottoms`
    // hands `lastWholeLineBelow` the raw 2.5x-scaled numbers instead
    // (100, 225, 350, 430, 525), which is a different search over different
    // numbers and does not produce 172.
    expect(Number.parseFloat(panel.style.maxHeight)).toBeCloseTo(172, 1);

    guide.unmount();
  });
});
