// @vitest-environment jsdom
/**
 * Round 04 PR-0009 (major, both games), second pass: the rail must cut in the
 * same place at every letterbox scale.
 *
 * `FFXBattleHud.layout()` / `LetterboxStage.createStage()` apply a uniform
 * `scale(...)` transform to an ancestor of `.sgd__body` so the 640x360 stage
 * fits the real viewport (2x at 1280x720, 2.5x at 1600x900, ~2.81x at
 * 2000x1012, 6x at 3840x2160). The first fix compared transformed screen
 * pixels against unscaled grid px. The second converted the screen pixels
 * back — and the verifier still measured the slab ending 3.3 to 3.7 grid px
 * past the last whole line at every viewport in both games, because the fix's
 * own jsdom test mocked exactly the `rect = scale x offsetHeight` relationship
 * it assumed and so could not fail.
 *
 * `critic/RUBRIC.md` §8 — stop repeating the approach. The cut reads
 * `offsetTop` / `offsetHeight` / `scrollHeight`, which a CSS transform never
 * touches, so the assertion here is not "the conversion is right" but "there
 * is nothing left to convert": the *same* layout at two very different scales
 * must produce byte-identical geometry. `tests/unit/helpers/guideLayoutStub.ts`
 * scales only the screen rects and leaves the layout numbers alone, which is
 * what makes that assertion able to fail.
 *
 * Case: both — `StrategyGuide` and its stylesheet carry no game branch other
 * than the accent colour (`sgd--ffx2`), same as round 03 #36.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';
import { stubGuideLayout } from './helpers/guideLayoutStub.ts';

/** Mirrors `strategy-guide-fold.test.ts`'s `boxed()` for the anchor elements. */
function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

interface Cut {
  /** `.sgd__body`'s clamped height, in stage-grid px. */
  readonly height: number;
  /** Which blocks survived the cut. */
  readonly shown: number;
  readonly moreShown: boolean;
}

function cutAt(scale: number): Cut {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const guide = new StrategyGuide({
    game: 'ffx',
    anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
  });
  guide.mount(stage);
  guide.sync(makeFakeBattleState());
  const stub = stubGuideLayout(stage, { scale, unitHeight: 20, glyphSlack: 2, bodyTop: 5, chrome: 11 });
  guide.update(0.016);

  const body = stage.querySelector<HTMLElement>('.sgd__body')!;
  const cut: Cut = {
    height: Number.parseFloat(body.style.height),
    shown: stub.units.filter((el) => !el.classList.contains('sgd__u--out')).length,
    moreShown: !stage.querySelector<HTMLElement>('[data-role="strategy-guide-more"]')!.hidden,
  };
  guide.unmount();
  stage.remove();
  return cut;
}

describe('the whole-block cut is the same at every letterbox scale (round 04 PR-0009)', () => {
  const originalGetClientRects = Range.prototype.getClientRects;
  afterEach(() => {
    Range.prototype.getClientRects = originalGetClientRects;
    document.body.innerHTML = '';
  });

  it('lands in exactly the same place at 1x, at Bailey’s 2.5x and at a 4K 6x', () => {
    const one = cutAt(1);
    const bailey = cutAt(2.5); // 1600x900, the viewport the defect was measured at
    const uhd = cutAt(6); // 3840x2160, the largest the acceptance matrix asks for

    expect(one.height).toBeGreaterThan(0);
    expect(bailey).toEqual(one);
    expect(uhd).toEqual(one);
  });

  /**
   * The residual the verifier measured on the second attempt: 0.62 grid px at
   * 1280x720, 1600x900 and 2000x1012 in FFX-2, systematically, which is 1.25,
   * 1.56 and 1.74 screen px and would be ~3.7 at 3840x2160 — past the critic's
   * 1 px bar. Chrome reports `offsetTop`/`offsetHeight` as whole pixels, so a
   * letterbox scale recovered as `rect.height / offsetHeight` is wrong in the
   * third decimal and the box lands most of a px below the type. `stageScale()`
   * divides two unrounded rects by an unrounded computed style instead.
   */
  it('puts the edge on the glyphs even when the browser rounds every layout box', () => {
    const stage = document.createElement('div');
    document.body.appendChild(stage);
    const guide = new StrategyGuide({
      game: 'ffx',
      anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
    });
    guide.mount(stage);
    guide.sync(makeFakeBattleState());
    // 20.4 px blocks: every `offsetTop` and `offsetHeight` rounds, the rects
    // do not. Budget is 153 (175 - 11 of slab chrome - 11 for the MORE row),
    // so the seventh block — box bottom 142 as the browser reports it, type
    // stopping at 7 x 20.4 - 2 = 140.8 — is the last one in.
    stubGuideLayout(stage, { scale: 2, unitHeight: 20.4, glyphSlack: 2, bodyTop: 5, chrome: 11, round: true });
    guide.update(0.016);

    const body = stage.querySelector<HTMLElement>('.sgd__body')!;
    expect(Number.parseFloat(body.style.height)).toBeCloseTo(140.8, 2);
    guide.unmount();
  });

  it('ends on the type, not on the empty leading under it', () => {
    // The stub gives every block 2 grid px of leading below its last glyph —
    // the half-leading of a 1.5 line-height plus a block's own bottom padding,
    // which is the residual the verifier measured as 3.3-3.7 grid px live.
    const cut = cutAt(2.5);
    // Blocks end at 20, 40, 60 ...; the type stops 2 px above each of those.
    expect((cut.height + 2) % 20).toBeCloseTo(0, 5);
    expect(cut.moreShown).toBe(true);
  });
});
