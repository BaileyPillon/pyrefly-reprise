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
  /**
   * The text line pitch, in grid px, of the split units (`.sgd__split`: paragraphs and list items). Left
   * unset, the units report no `line-height` (jsdom's `normal`), which `StrategyGuide` reads as "cannot
   * be split", so only whole blocks are cut: the case every test but the line-boundary ones is about.
   */
  readonly lineHeight?: number;
  /** Per-unit box heights in grid px, by position in the document; `unitHeight` for any not listed. */
  readonly heights?: readonly number[];
  /** Height of whatever else sits in the panel above the body (the status hint card), read live. */
  readonly extraChrome?: () => number;
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
  const { scale, unitHeight, glyphSlack, bodyTop, chrome, round = false, lineHeight, heights = [], extraChrome = () => 0 } = options;
  const layout = (n: number): number => (round ? Math.round(n) : n);
  const panel = stage.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
  const body = stage.querySelector<HTMLElement>('.sgd__body')!;
  const units = Array.from(body.querySelectorAll<HTMLElement>('.sgd__u'));

  // A block taken out of the flow (`sgd__u--out`, display: none) has no height and pushes nothing, so every
  // box below is read live: a page that starts partway down the document is measured from its own top,
  // exactly as the browser lays it out.
  const gone = (el: HTMLElement): boolean => el.classList.contains('sgd__u--out');
  // A unit shown by lines (`style.height` in px) is exactly that tall; otherwise its own natural height.
  const heightOf = (el: HTMLElement): number => {
    if (gone(el)) return 0;
    const set = Number.parseFloat(el.style.height);
    if (Number.isFinite(set)) return set;
    return heights[units.indexOf(el)] ?? unitHeight;
  };
  if (lineHeight !== undefined) {
    for (const el of units) if (el.classList.contains('sgd__split')) el.style.lineHeight = `${lineHeight}px`;
  }
  const natural = (): number => units.reduce((sum, u) => sum + heightOf(u), 0);
  define(body, 'offsetTop', layout(bodyTop));
  Object.defineProperty(body, 'offsetHeight', { configurable: true, get: () => layout(natural()) });
  Object.defineProperty(body, 'scrollHeight', { configurable: true, get: () => layout(natural()) });
  Object.defineProperty(panel, 'offsetHeight', { configurable: true, get: () => layout(natural() + chrome + extraChrome()) });
  // `stageScale()` recovers the letterbox factor from the slab's authored
  // padding (a computed style, never scaled and never rounded) against the two
  // rects (screen px). jsdom reports inline styles as computed ones, so
  // splitting `chrome` across the two paddings is enough to drive it.
  panel.style.paddingTop = `${chrome / 2}px`;
  panel.style.paddingBottom = `${chrome / 2}px`;
  define(panel, 'getBoundingClientRect', () => rectAt((bodyTop - chrome / 2) * scale, (natural() + chrome + extraChrome()) * scale, scale));
  define(body, 'getBoundingClientRect', () => rectAt(bodyTop * scale, natural() * scale, scale));

  const bottoms: number[] = [];
  units.forEach((el, i) => {
    const topOf = (): number => bodyTop + units.slice(0, i).reduce((sum, u) => sum + heightOf(u), 0);
    bottoms.push((i + 1) * unitHeight);
    Object.defineProperty(el, 'offsetTop', { configurable: true, get: () => layout(topOf()) });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => layout(heightOf(el)) });
    define(el, 'getBoundingClientRect', () => rect(topOf() * scale, heightOf(el) * scale, scale));
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
