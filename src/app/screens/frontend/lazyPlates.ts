/**
 * The board's rail strips, loaded in the idle lane and put up only once decoded
 * (r29, PR-0221 / PR-0240; R14-VIS-02 the phone board strips).
 *
 * Every rail card paints its boss on its scene (D-183), and the only files for
 * that are the full 4-6 MB backdrop and the boss idle: sixteen cards are about
 * 90 MB. As plain `src` markup they all started the moment the board opened
 * and shared the pipe with everything the chosen chapter needed next, so the
 * first battle took 25 to 33 s to load on a 25 Mbit/s link, and a half-arrived
 * PNG painted as a half-painted strip. Now a card's images carry
 * `data-lazy-src` (`chapterPlates.ts`), and this puts each one up through
 * `imageWarm` in the `idle` lane, the cards nearest the cursor first: an idle
 * load never competes with a screen's own art, and a strip appears whole.
 *
 * With no image pipeline (jsdom), or when a warm fails for any reason other
 * than the manifest saying the file is absent, the element gets its `src` as
 * before and its own `onerror` does the rest.
 *
 * Game case: both (the one shared board).
 */

import { manifestKnowsAssetNow } from '../../../engine/ArtManifest.ts';
import { demoteWarm, warmImage } from '../../imageWarm.ts';
import { preloadAsked } from '../battlePreload.ts';

/** The attribute a deferred strip image carries instead of `src`. */
export const LAZY_SRC = 'data-lazy-src';

/** The card index an image belongs to (`data-action="fe-card-N"`), or -1. */
function cardIndexOf(img: Element): number {
  const card = img.closest('[data-action^="fe-card-"], [data-card]');
  const m = /fe-card-(\d+)/.exec(card?.getAttribute('data-action') ?? '');
  return m ? Number(m[1]) : -1;
}

function put(img: HTMLImageElement, url: string): void {
  img.removeAttribute(LAZY_SRC);
  img.setAttribute('src', url);
}

/**
 * The selected card's big plate, its dossier's faces and the wash behind the board: loaded at
 * `urgent`, put up decoded, and demoted to `idle` the moment the cursor moves
 * on, so arrowing across the board no longer leaves a 5 MB download running
 * for every card it passed (r29 measurement: seven passed cards, 35 MB, still
 * arriving when the chosen chapter's battle loaded). Returns the function the
 * board calls on every refresh.
 */
export function heroPlates(): (parts: readonly ParentNode[], wash: HTMLElement | null, washUrl: string | null) => void {
  let shown: string[] = [];
  return (parts, wash, washUrl) => {
    const imgs = parts.flatMap((p) => [...p.querySelectorAll<HTMLImageElement>(`img[${LAZY_SRC}]`)]);
    const urls = imgs.map((i) => i.getAttribute(LAZY_SRC) ?? '').filter(Boolean);
    const next = washUrl ? [washUrl, ...urls] : urls;
    // Leaving the board (no parts): what the chosen chapter's preload has asked for stays urgent.
    demoteWarm(shown.filter((u) => !next.includes(u) && (parts.length > 0 || !preloadAsked(u))));
    shown = next;
    const noPipeline = typeof Image === 'undefined' || typeof Image.prototype.decode !== 'function';
    const current = (): boolean => shown === next;
    if (wash) {
      if (!washUrl || noPipeline) wash.style.backgroundImage = washUrl ? `url(${washUrl})` : 'none';
      else {
        // The old wash stays until the new one is decoded.
        void warmImage(washUrl, 'urgent').then((ok) => {
          if (current() && (ok || manifestKnowsAssetNow(washUrl) !== false)) wash.style.backgroundImage = `url(${washUrl})`;
        });
      }
    }
    for (const img of imgs) {
      const url = img.getAttribute(LAZY_SRC) ?? '';
      if (noPipeline) {
        put(img, url);
        continue;
      }
      void warmImage(url, 'urgent').then((ok) => {
        if (!img.isConnected || !img.hasAttribute(LAZY_SRC)) return;
        if (ok || manifestKnowsAssetNow(url) !== false) put(img, url);
        else img.remove();
      });
    }
  };
}

/** Markup with every `<img src>` deferred (`data-lazy-src`), for {@link heroPlates} to put up. */
export function deferSrcs(html: string): string {
  return html.replace(/(<img\b[^>]*?)\ssrc="/g, `$1 ${LAZY_SRC}="`);
}

/**
 * Load every deferred strip image under `root`, nearest `selected` first.
 * Returns the URLs in the order they were queued (for the tests).
 */
export function mountLazyPlates(root: ParentNode, selected: number): string[] {
  const imgs = [...root.querySelectorAll<HTMLImageElement>(`img[${LAZY_SRC}]`)];
  const far = (img: HTMLImageElement): number => {
    const i = cardIndexOf(img);
    return i < 0 ? Number.MAX_SAFE_INTEGER : Math.abs(i - selected);
  };
  imgs.sort((a, b) => far(a) - far(b));
  const noPipeline = typeof Image === 'undefined' || typeof Image.prototype.decode !== 'function';
  const order: string[] = [];
  for (const img of imgs) {
    const url = img.getAttribute(LAZY_SRC) ?? '';
    if (!url) continue;
    order.push(url);
    if (noPipeline) {
      put(img, url);
      continue;
    }
    void warmImage(url, 'idle').then((ok) => {
      if (!img.hasAttribute(LAZY_SRC)) return;
      if (ok || manifestKnowsAssetNow(url) !== false) put(img, url);
      else img.remove();
    });
  }
  return order;
}
