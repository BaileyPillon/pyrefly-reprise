/**
 * A fake layout for the strategy guide's rail, so `StrategyGuide.refit()` can
 * be driven in jsdom.
 *
 * jsdom has no layout engine: every `offsetTop`/`offsetHeight`/`scrollHeight`
 * is 0, which the guide reads (correctly) as "nothing is painted yet" and
 * leaves the panel alone. Stubbing the boxes is what lets the whole-block cut
 * be asserted at all.
 *
 * ## Why the stub carries a `scale`
 *
 * Round 04 PR-0009's second attempt shipped with a jsdom test that mocked
 * exactly the `rect = scale x offsetHeight` relationship the fix assumed, so
 * it could not fail. This stub is built the other way round: the **layout**
 * numbers (`offsetTop`, `offsetHeight`, `scrollHeight`) are the same at every
 * scale, because a CSS transform never touches them, and only the *screen*
 * rects (`getBoundingClientRect`, `Range.getClientRects`) are multiplied. A
 * fit that reads anything a transform can move therefore produces a different
 * answer at `scale: 1` and `scale: 2.5`, which
 * `strategy-guide-scale.test.ts` asserts it does not.
 *
 * Replaces `Range.prototype.getClientRects` process-wide; every caller
 * restores it in an `afterEach`.
 */

export interface GuideLayoutStubOptions {
  /** The letterbox scale the *screen* rects are reported at. Layout is never scaled. */
  readonly scale: number;
  /** Every block's own box height, in stage-grid px. */
  readonly unitHeight: number;
  /** Empty leading between a block's last glyph and its box bottom, in grid px. */
  readonly glyphSlack: number;
  /** `.sgd__body`'s own offset inside the rail (the slab's top padding). */
  readonly bodyTop: number;
  /** The slab's padding and borders — what `refit()` recovers as `chrome`. */
  readonly chrome: number;
  /**
   * Report `offsetTop` / `offsetHeight` as whole pixels while the rects keep
   * the true fractional geometry, exactly as Chrome does.
   *
   * This is what made the second attempt at PR-0009 land 0.62 grid px below
   * the last line in FFX-2 at every viewport: it recovered the letterbox scale
   * as `rect.height / offsetHeight`, and a rounded denominator gives 1.9836
   * where the real factor is 2.
   */
  readonly round?: boolean;
}

export interface GuideLayoutStub {
  /** Every block of text in the body, in reading order. */
  readonly units: HTMLElement[];
  /** Each block's box bottom, relative to the body's own top. */
  readonly bottoms: number[];
  readonly options: GuideLayoutStubOptions;
}

function define(el: object, key: string, value: unknown): void {
  Object.defineProperty(el, key, { value, configurable: true });
}

export function stubGuideLayout(stage: HTMLElement, options: GuideLayoutStubOptions): GuideLayoutStub {
  const { scale, unitHeight, glyphSlack, bodyTop, chrome, round = false } = options;
  const layout = (n: number): number => (round ? Math.round(n) : n);
  const panel = stage.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
  const body = stage.querySelector<HTMLElement>('.sgd__body')!;
  const units = Array.from(body.querySelectorAll<HTMLElement>('.sgd__u'));

  const natural = units.length * unitHeight;
  define(body, 'offsetTop', layout(bodyTop));
  define(body, 'offsetHeight', layout(natural));
  define(body, 'scrollHeight', layout(natural));
  define(panel, 'offsetHeight', layout(natural + chrome));
  // `stageScale()` recovers the letterbox factor from the slab's authored
  // padding (a computed style, never scaled and never rounded) against the two
  // rects (screen px). jsdom reports inline styles as computed ones, so
  // splitting `chrome` across the two paddings is enough to drive it.
  panel.style.paddingTop = `${chrome / 2}px`;
  panel.style.paddingBottom = `${chrome / 2}px`;
  define(panel, 'getBoundingClientRect', () => rectAt((bodyTop - chrome / 2) * scale, (natural + chrome) * scale, scale));
  define(body, 'getBoundingClientRect', () => rectAt(bodyTop * scale, natural * scale, scale));

  const bottoms: number[] = [];
  units.forEach((el, i) => {
    const top = bodyTop + i * unitHeight;
    bottoms.push((i + 1) * unitHeight);
    define(el, 'offsetTop', layout(top));
    define(el, 'offsetHeight', layout(unitHeight));
    define(el, 'getBoundingClientRect', () => rect(top * scale, unitHeight * scale, scale));
  });

  Range.prototype.getClientRects = function (this: Range) {
    const node: Node = this.commonAncestorContainer;
    const host = node.nodeType === 1 ? (node as Element) : node.parentElement;
    const unit = host?.closest('.sgd__u') as HTMLElement | null;
    if (!unit) return [] as unknown as DOMRectList;
    const box = unit.getBoundingClientRect();
    const bottom = box.bottom - glyphSlack * scale;
    return [rectAt(bottom - 4 * scale, 4 * scale, scale)] as unknown as DOMRectList;
  };

  return { units, bottoms, options };
}

function rect(top: number, height: number, scale: number): DOMRect {
  return rectAt(top, height, scale);
}

function rectAt(top: number, height: number, scale: number): DOMRect {
  const width = 100 * scale;
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: width,
    width,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}
