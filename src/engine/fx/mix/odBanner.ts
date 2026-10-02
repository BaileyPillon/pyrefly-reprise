import { coverShare, type Box } from './geometry.ts';

/**
 * The MAX mix (D-316), OVERDRIVE SHOT's banner rule (FFX only; the judges' must-fix: "the letterboxed
 * 'OVERDRIVE / Spiral Cut' name banner covers Tidus' head and torso for about 1.5 s"). The moment's name
 * slab (`MomentOverlay`, `.pf-mom__slab--overdrive`) is hung at mid-height on the left, where the party
 * stands; while OVERDRIVE SHOT plays it takes the first height (mid, then high, low, higher, lower) at
 * which it covers no party member, decided once when it slams in and held until it slides out (it never
 * follows anything). With the part off it hangs where it always has.
 */

const SLAB = '.pf-mom__slab--overdrive';
const TOPS = [0.5, 0.22, 0.78, 0.14, 0.86];

/** The first slab height (fraction of the viewport) that covers no party box by more than 5 %. Pure. */
export function slabTop(slab: { w: number; h: number }, vh: number, party: readonly Box[]): number | null {
  for (const top of TOPS) {
    const cy = top * vh;
    const box: Box = { l: 0, r: slab.w, t: cy - slab.h / 2, b: cy + slab.h / 2 };
    if (party.every((b) => coverShare(b, box) <= 0.05)) return top;
  }
  return null;
}

export class OdBanner {
  private el: HTMLElement | null = null;
  moved = 0;
  lastTop: number | null = null;

  /** Every frame (FFX): `party` gives the party's screen boxes in viewport px. */
  update(on: boolean, party: () => Box[]): void {
    if (typeof document === 'undefined') return;
    const slab = on ? document.querySelector<HTMLElement>(`${SLAB}[data-on='1']`) : null;
    if (!slab) {
      // Put the height back once the slab has slid out (never during the slide).
      const el = this.el;
      if (el) window.setTimeout(() => {
        if (el.dataset['on'] !== '1') el.style.top = '';
      }, 450);
      this.el = null;
      return;
    }
    if (slab === this.el) return;
    this.el = slab;
    const r = slab.getBoundingClientRect();
    const top = slabTop({ w: r.width, h: r.height }, window.innerHeight, party());
    this.lastTop = top;
    if (top !== null && top !== 0.5) {
      slab.style.top = `${(top * 100).toFixed(0)}%`;
      this.moved++;
    }
  }

  dispose(): void {
    if (this.el) this.el.style.top = '';
    this.el = null;
  }
}
