/**
 * A fake layout for the strategy guide's reading sheet, so `StrategyGuide.scrollToStart()` and the scroll keys can
 * be driven in jsdom.
 *
 * jsdom has no layout engine: every `offsetTop` / `offsetHeight` / `clientHeight` / `scrollHeight` is 0, which the
 * guide reads (correctly) as "nothing is painted yet" and leaves the sheet alone. This lays the document's blocks
 * top to bottom in the scrolled content with a fixed height and a fixed gap between two blocks, the way the
 * stylesheet's margins do, and gives the sheet a viewport. It stubs layout numbers only: whether the sheet
 * scrolls at all is the stylesheet's business, which `strategy-guide-sheet.test.ts` reads from the CSS.
 *
 * jsdom stores what is written to `scrollTop`, and does not clamp it to the content; a test that cares about
 * the clamp reads `maxScroll`.
 */

export interface SheetStubOptions {
  /** Height of every unit (a paragraph, a list item, a header, a loot box), in layout px. */
  readonly unitHeight: number;
  /** The empty margin between one block and the next, in layout px: what the sheet leaves above a block it opens on. */
  readonly gap: number;
  /** The sheet's own padding above the first block, in layout px. */
  readonly padTop: number;
  /** What the sheet shows at once, in layout px. */
  readonly clientHeight: number;
}

export interface SheetStub {
  readonly panel: HTMLElement;
  /** Every top-level block of the document, in order, with the box it was given. */
  readonly blocks: Array<{ el: HTMLElement; top: number; height: number }>;
  /** `scrollHeight - clientHeight`: the furthest the sheet can scroll. */
  readonly maxScroll: number;
}

function define(el: object, key: string, value: unknown): void {
  Object.defineProperty(el, key, { value, configurable: true });
}

export function stubSheetLayout(stage: HTMLElement, o: SheetStubOptions): SheetStub {
  const panel = stage.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
  const body = panel.querySelector<HTMLElement>('.sgd__body')!;
  const blocks: SheetStub['blocks'] = [];
  let y = o.padTop;
  for (const el of Array.from(body.children) as HTMLElement[]) {
    // A list is a box of its items, one unit each; everything else is one unit.
    const items = Array.from(el.querySelectorAll<HTMLElement>(':scope > li'));
    const height = (items.length || 1) * o.unitHeight;
    define(el, 'offsetTop', y);
    define(el, 'offsetHeight', height);
    items.forEach((li, k) => {
      define(li, 'offsetTop', y + k * o.unitHeight);
      define(li, 'offsetHeight', o.unitHeight);
    });
    blocks.push({ el, top: y, height });
    y += height + o.gap;
  }
  const scrollHeight = y - o.gap + 6;
  define(panel, 'offsetHeight', o.clientHeight);
  define(panel, 'clientHeight', o.clientHeight);
  define(panel, 'scrollHeight', scrollHeight);
  return { panel, blocks, maxScroll: Math.max(0, scrollHeight - o.clientHeight) };
}
