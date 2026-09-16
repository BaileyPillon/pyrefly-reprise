import { artUrl } from '../../engine/PaintedArt.ts';

/**
 * Portrait chip helper shared by the CTB list, party status window, trigger
 * prompt and party-prep menus.
 *
 * Portraits live at `public/art/portraits/<portraitKey>.png`. Today only
 * `tidus` and `yuna` exist on disk — every other key (`auron`, `wakka`,
 * `lulu`, `kimahri`, `rikku`, and every boss key like `seymour-flux-body`,
 * `mortiorchis`, `yunalesca-1..3`, `braskas-final-aeon-1..2`, `yu-pagoda`,
 * `yu-yevon`) 404s. Rather than a broken-image icon, a missing portrait falls
 * back to an ink monogram chip so the HUD never looks broken while art lands
 * — the same treatment Ink & Gold's own Auron placeholder uses in
 * `Swordplay.dc.html` (`.mono`, a centred letter over an ink tile).
 */

export function portraitUrl(key: string): string {
  return artUrl(`art/portraits/${key}.png`);
}

/** First glyph to show in a fallback chip: the name's first letter, upper-cased. */
export function initialFor(name: string): string {
  const ch = name.trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

/**
 * Build the inner HTML for a portrait chip: an `<img>` that removes itself on
 * error, revealing an ink monogram glyph sitting behind it the whole time.
 * The surrounding tile's own border (paper/gold for party, blood for enemy)
 * already carries the side, so the fallback itself needs no per-side tint —
 * `bg` only distinguishes it from the tile's own background colour.
 */
export function portraitChipHtml(portraitKey: string | undefined, name: string, bg = tintFor('party')): string {
  const letter = initialFor(name);
  const fallback = `<span class="ffx-portrait-fallback" style="background:${bg}">${letter}</span>`;
  if (!portraitKey) return fallback;
  const img = `<img src="${portraitUrl(portraitKey)}" alt="" data-role="portrait-img" />`;
  return `${fallback}${img}`;
}

/**
 * Wire the `onerror` fallback for every portrait `<img>` inside `root`. Call
 * once after setting `innerHTML` containing {@link portraitChipHtml} output.
 * The fallback letter is already painted behind the image, so on error we
 * simply remove the (broken) image and the letter shows through.
 */
export function wirePortraitFallbacks(root: ParentNode): void {
  root.querySelectorAll<HTMLImageElement>('img[data-role="portrait-img"]').forEach((img) => {
    img.addEventListener(
      'error',
      () => {
        img.remove();
      },
      { once: true },
    );
  });
}

/**
 * Fallback-chip background, matching the ink shades `Swordplay.dc.html` and
 * `slabs.css` already use for a portrait-less tile (`.face { background:
 * #1a1526 }`, `.ig-ctb__tile--enemy { background: #2a0f12 }`) rather than
 * inventing new colours.
 */
export function tintFor(side: 'party' | 'enemy' | 'aeon'): string {
  if (side === 'enemy') return '#2a0f12';
  if (side === 'aeon') return '#132a26';
  return '#1a1526';
}
