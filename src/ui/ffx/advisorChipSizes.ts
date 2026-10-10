/**
 * The advisor's `N` chip, measured at both of the sizes it can take: with its longest label and as the key-only badge (FFX only; Chapters I and III while the guide is folded, `advisorFolded.ts`).
 *
 * The chip is the size of what it says: "N hide moves" (the card up), "N best move" (the card put away by the player), or the bare key while the tip is the card (`.mad--tip`,
 * `move-advisor-tip.css`). The folded guide's dock must be sized by what the chip **can** be, not by what it happens to be at the moment of the solve: sized by what it is, the dock
 * would be solved for the badge while the tip was up, find room, put the card up, grow the chip to its whole label, and be solved again for the label, find none, and put the tip up
 * again, a flicker with no end; and a press of `N` would move the dock for a word that is one letter shorter (`tests/unit/ui-ffx-advisor-chip-sizes.test.ts` pins both).
 *
 * So the sizes are read off a **copy** of the chip that is never seen (`visibility: hidden`, in the chip's own parent, so every rule that sizes the chip sizes the copy: the type floor, TEXT
 * SIZE, the skew), once for each of the two words and once with no word; the chip itself is not touched. They are kept until the letterbox, the key or the type size changes: a read per frame
 * would cost a layout per frame, and these are needed a few times in a fight. The sizes are in whole grid px, rounded up.
 */

export interface ChipSize {
  readonly width: number;
  readonly height: number;
}

export interface NChipSizes {
  /** The chip with its longer label. */
  readonly full: ChipSize | null;
  /** The chip as the key-only badge. */
  readonly badge: ChipSize | null;
}

/** The class on the advisor's root that makes the chip the badge. */
export const BADGE_CLASS = 'mad--tip';

/** The two words `MoveAdvisor.applyVisible` writes after the key (a unit test pins them against the real chip). */
export const CHIP_WORDS = ['hide moves', 'best move'] as const;

/** A box in the stage's own grid px, or null when it is not on the screen. */
type BoxOf = (el: HTMLElement) => { left: number; top: number; right: number; bottom: number } | null;

const sizeOf = (r: { left: number; top: number; right: number; bottom: number } | null): ChipSize | null =>
  r && r.right > r.left && r.bottom > r.top ? { width: Math.ceil(r.right - r.left), height: Math.ceil(r.bottom - r.top) } : null;

/** The cache and the reads. One per HUD. */
export class NChipMeter {
  private signature = '';
  private sizes: NChipSizes = { full: null, badge: null };

  /** `chip` is the toggle in the advisor; `box` reads a box in grid px (the HUD's `stageRect`); `scale` is the letterbox's. */
  measure(chip: HTMLElement | null, box: BoxOf, scale: number): NChipSizes {
    const host = chip?.parentElement;
    if (!chip || !host || !(scale > 0)) return { full: null, badge: null };
    const key = chip.querySelector('b')?.textContent ?? 'N';
    const signature = `${scale.toFixed(3)}|${key}|${getComputedStyle(chip).fontSize}`;
    if (signature === this.signature) return this.sizes;
    // A copy with the chip's tag and classes and none of its position or content: nothing that finds the chip by its role can find this, and it is gone before anything else runs.
    const copy = chip.cloneNode(false) as HTMLElement;
    copy.removeAttribute('data-role');
    copy.removeAttribute('style');
    copy.removeAttribute('title');
    copy.hidden = false;
    copy.setAttribute('aria-hidden', 'true');
    copy.tabIndex = -1;
    copy.style.visibility = 'hidden';
    copy.style.pointerEvents = 'none';
    const keyEl = document.createElement('b');
    keyEl.textContent = key;
    const word = document.createElement('span');
    word.style.display = 'inline-block'; // `.mad--tip .mad__toggle span` hides the word while the tip is up; the copy is read as the chip can be, not as it is
    copy.append(keyEl, word);
    host.appendChild(copy);
    let full: ChipSize | null = null;
    let badge: ChipSize | null = null;
    try {
      for (const w of CHIP_WORDS) {
        word.textContent = w;
        const s = sizeOf(box(copy));
        if (s && (!full || s.width > full.width)) full = s;
      }
      word.remove();
      badge = sizeOf(box(copy));
    } finally {
      copy.remove();
    }
    // A stage with no size yet answers nothing, and the answer is not kept: the next frame asks again.
    if (!full || !badge) return { full: null, badge: null };
    this.signature = signature;
    this.sizes = { full: { width: full.width, height: Math.max(full.height, badge.height) }, badge };
    return this.sizes;
  }
}
