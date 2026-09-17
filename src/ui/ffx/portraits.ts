import { bodyHeadCropStyle } from '../common/portrait.ts';
import { artUrl } from '../../engine/PaintedArt.ts';

/**
 * Portrait chip helper shared by the CTB list, party status window, trigger
 * prompt and party-prep menus.
 *
 * Portraits live at `public/art/portraits/<portraitKey>.png`: the whole
 * party plus Seymour, Yunalesca and Jecht (see {@link PORTRAIT_ALIAS} for the
 * one id/file mismatch among them). Every other boss key 404s there; rather
 * than fall straight to a broken-image icon, {@link portraitChipHtml}'s
 * `bodyId` layer tries a **crop of that enemy's own idle painting**
 * (`characters/<bodyId>/idle.png`, via {@link bodyHeadCropStyle}) before
 * giving up to an ink monogram chip — the same treatment Ink & Gold's own
 * Auron placeholder uses in `Swordplay.dc.html` (`.mono`, a centred letter
 * over an ink tile), so the HUD never looks broken while art lands.
 */

export function portraitUrl(key: string): string {
  return artUrl(`art/portraits/${key}.png`);
}

/**
 * The handful of bosses whose fight `id` differs from their dedicated
 * `portraits/<id>.png` (shared with their cutscene/dialogue speaker
 * portrait): Seymour Flux fights as `seymour-flux` but his portrait is
 * `seymour.png`. Yunalesca and Jecht need no entry — Yunalesca's combat id
 * is `yunalesca` across all three forms, and Jecht never appears as a CTB
 * row.
 */
const PORTRAIT_ALIAS: Readonly<Record<string, string>> = {
  'seymour-flux': 'seymour',
};

/** The `portraits/<id>.png` key to try first for a combatant id, following {@link PORTRAIT_ALIAS}. */
export function resolvePortraitKey(id: string): string {
  return PORTRAIT_ALIAS[id] ?? id;
}

/** First glyph to show in a fallback chip: the name's first letter, upper-cased. */
export function initialFor(name: string): string {
  const ch = name.trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

/**
 * Build the inner HTML for a portrait chip, three layers deep (each one
 * removes itself on a 404, revealing the layer painted behind it):
 *
 * 1. an ink monogram glyph — always present, so the chip is never blank;
 * 2. if `bodyId` is given, a generic top-center crop of
 *    `characters/<bodyId>/idle.png` (an enemy's own idle painting), for a
 *    boss with no dedicated portrait file;
 * 3. `portraits/<portraitKey>.png`, the real thing, when it exists.
 *
 * The surrounding tile's own border (paper/gold for party, blood for enemy)
 * already carries the side, so the monogram itself needs no per-side tint —
 * `bg` only distinguishes it from the tile's own background colour. `bodyId`
 * is `undefined` by default, so existing callers (party rows, the trigger
 * prompt, the party-status window — none of which need a full-body idle
 * painting cropped to a face) keep today's exact two-layer output; pass it
 * explicitly (the CTB list does, for enemies) to add layer 2, since a boss's
 * fight id, its dedicated-portrait key ({@link resolvePortraitKey}) and its
 * sprite/idle-art id can all differ.
 */
export function portraitChipHtml(
  portraitKey: string | undefined,
  name: string,
  bg = tintFor('party'),
  bodyId?: string,
): string {
  const letter = initialFor(name);
  const fallback = `<span class="ffx-portrait-fallback" style="background:${bg}">${letter}</span>`;
  const body = bodyId
    ? `<img src="${artUrl(`art/characters/${bodyId}/idle.png`)}" alt="" data-role="portrait-img" data-body-id="${bodyId}" style="${bodyHeadCropStyle()}" />`
    : '';
  if (!portraitKey) return `${fallback}${body}`;
  const img = `<img src="${portraitUrl(portraitKey)}" alt="" data-role="portrait-img" />`;
  return `${fallback}${body}${img}`;
}

/** `characters/<id>/idle.json` width/height, once fetched — keyed by `id`, shared by every chip. */
const bodyAspectCache = new Map<string, number | null>();

/** Fetch and cache `characters/<id>/idle.json`'s aspect ratio; never throws. */
function loadBodyAspect(id: string): Promise<number | null> {
  const cached = bodyAspectCache.get(id);
  if (cached !== undefined) return Promise.resolve(cached);
  return fetch(artUrl(`art/characters/${id}/idle.json`))
    .then((res) => (res.ok ? (res.json() as Promise<{ width?: number; height?: number }>) : null))
    .then((meta) => (meta?.width && meta?.height ? meta.width / meta.height : null))
    .catch(() => null)
    .then((aspect) => {
      bodyAspectCache.set(id, aspect);
      return aspect;
    });
}

/**
 * Wire the `onerror` fallback for every portrait `<img>` inside `root`. Call
 * once after setting `innerHTML` containing {@link portraitChipHtml} output.
 * Each layer's fallback beneath it is already painted, so on error we simply
 * remove the (broken) image.
 *
 * Also kicks off the async half of the idle-painting fallback: a body-crop
 * `<img>` (tagged `data-body-id`) starts out at {@link bodyHeadCropStyle}'s
 * roster-wide guess, then tightens to that file's own aspect ratio once its
 * sidecar loads — the same "estimate now, correct in place" pattern
 * `PaintedArt.ts` uses for the 3D scene's painted planes. A no-op for a chip
 * whose dedicated portrait is already showing, since that `<img>` sits in
 * front and the fetch only matters once/if it errors out from under it.
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
  root.querySelectorAll<HTMLImageElement>('img[data-body-id]').forEach((img) => {
    const id = img.dataset['bodyId'];
    if (!id) return;
    void loadBodyAspect(id).then((aspect) => {
      if (aspect && img.isConnected) img.style.cssText = bodyHeadCropStyle(aspect);
    });
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
