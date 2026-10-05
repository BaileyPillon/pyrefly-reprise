import { chooseSlabWidth, type SlabSize, type SlabSolveInput } from './intentBoard.ts';
import type { SlabWidth } from './intentPlacement.ts';

/**
 * The shape of the enemy-intent slab (judgment call K of critic round 21; FFX-2 only, at TEXT SIZE 115 / 130 %).
 *
 * At 100 % the slab is 150 grid px wide and the board always has a band for it. Grown, the enemy list and the command stack leave
 * a gap narrower than that in a crowded fight (Chapter VI at 130 %: 121 grid px between them), and the solver's only free-of-chrome
 * spot was across the three enemies it was talking about, and across the aimed one. `.eint__panel--narrow` wraps the same words
 * into 116 grid px (`text-size-wide.css`), which fits the gap; it is a third taller, so it is not worn unless it is clearly the
 * cleaner shape on the board in front of it (`intentPlacement.pickSlabWidth`; Chapter IV at 130 % has a free spot for the wide
 * slab and keeps it).
 *
 * Both shapes' real sizes are measured, not estimated: the panel's current size is read as it stands, the other shape's once per
 * content, scale and height cap (the class goes on, the box is read, the class goes back: one layout, then nothing until the
 * slab's text or the window changes). With two true sizes the choice is a function of the board alone, so it settles in one frame
 * and does not flip between two.
 */
export const INTENT_NARROW_CLASS = 'eint__panel--narrow';

export class IntentWidth {
  private key = '';
  private sizes: { wide: SlabSize | null; narrow: SlabSize | null } = { wide: null, narrow: null };

  /**
   * Choose the slab's shape for this frame and put it on `panel`. The caller reads the panel's box again afterwards: the class
   * may have changed it. `key` names what the slab's size depends on besides its shape (its text, the stage scale, the body's
   * height cap); a new key forgets the other shape's size.
   */
  apply(panel: HTMLElement, key: string, input: Omit<SlabSolveInput, 'box'>): SlabWidth {
    const current: SlabWidth = panel.classList.contains(INTENT_NARROW_CLASS) ? 'narrow' : 'wide';
    const here = sizeOf(panel);
    if (!here) return current;
    if (key !== this.key) {
      this.key = key;
      this.sizes = { wide: null, narrow: null };
    }
    this.sizes[current] = here;
    const other: SlabWidth = current === 'wide' ? 'narrow' : 'wide';
    if (!this.sizes[other]) this.sizes[other] = this.measureAs(panel, other);
    const { wide, narrow } = this.sizes;
    if (!wide || !narrow) return current;
    const want = chooseSlabWidth({ ...input, box: here }, { wide, narrow }, current);
    if (want !== current) panel.classList.toggle(INTENT_NARROW_CLASS, want === 'narrow');
    return want;
  }

  /** Back to the slab's own width: the text is at 100 %, the window is a phone, or the slab is not up. */
  reset(panel: HTMLElement | null): void {
    if (panel?.classList.contains(INTENT_NARROW_CLASS)) panel.classList.remove(INTENT_NARROW_CLASS);
    if (this.key !== '') {
      this.key = '';
      this.sizes = { wide: null, narrow: null };
    }
  }

  /** The panel's size in `shape`, whichever it wears now: the class goes on or off, the box is read, the class goes back. */
  private measureAs(panel: HTMLElement, shape: SlabWidth): SlabSize | null {
    const had = panel.classList.contains(INTENT_NARROW_CLASS);
    panel.classList.toggle(INTENT_NARROW_CLASS, shape === 'narrow');
    const size = sizeOf(panel);
    panel.classList.toggle(INTENT_NARROW_CLASS, had);
    return size;
  }
}

function sizeOf(el: HTMLElement): SlabSize | null {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { width: r.width, height: r.height } : null;
}
