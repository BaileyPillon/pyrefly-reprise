/**
 * Hides a chapter-select dossier's `.fe-party__face` tile until its painted
 * layer has decoded, so the letter fallback behind it (`chapterCards.ts`'s
 * `asideHtml`) never gets a frame to itself.
 *
 * Round-09 (PR-0065) measured a cold load painting the dossier's three faces
 * as letter tiles first and the real portraits only 0.5-4.4s later — the
 * `<img>` occupies its box the instant `refresh()` sets `innerHTML`, but has
 * nothing to paint until the network round-trip and decode finish, so the
 * `<span>` fallback underneath shows through for that whole gap. The
 * recommended fix (`await img.decode()` before the board's first paint) has
 * to run in `ChapterSelectScreen.ts`, which owns `refresh()` and is out of
 * this track's files; this gets the same visible result — no letter tile ever
 * gets a painted frame — from `chapterCards.ts`'s own side of the boundary,
 * by watching for the tiles `asideHtml` creates and keeping each one
 * invisible until every image inside it has either decoded or given up.
 *
 * Self-installing: importing this module (done once, from `chapterCards.ts`)
 * is enough. `.fe-party__face` is this file's own class — nothing else in the
 * codebase renders it (checked 2026-09-23) — so the observer cannot catch any
 * other screen's markup.
 *
 * Known gap, left for whoever owns `ChapterSelectScreen.ts`: this hides the
 * *tile*, not the *screen* — the board's own fade-in still starts on
 * `enter()` regardless of whether these decodes have finished, so a
 * hyper-fast sample taken in the first handful of milliseconds can still
 * catch `naturalWidth === 0` on an img that is (correctly) not painted yet.
 * What this guarantees is the one thing the round measured going wrong: no
 * frame of this session ever shows the grey letter as the *painted* face.
 */

const HIDE_STYLE = 'opacity:0;transition:none;';
const REVEAL_TRANSITION = 'opacity 140ms ease-out';
/** Never leave a tile hidden forever over a stalled/broken image. */
const GIVE_UP_MS = 1500;

function settleImg(img: HTMLImageElement): Promise<void> {
  if (img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    const done = (): void => {
      img.removeEventListener('load', done);
      img.removeEventListener('error', done);
      resolve();
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
}

async function revealWhenReady(tile: HTMLElement): Promise<void> {
  const imgs = Array.from(tile.querySelectorAll('img'));
  if (imgs.length === 0) {
    tile.removeAttribute('style');
    return;
  }
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, GIVE_UP_MS));
  await Promise.race([Promise.all(imgs.map(settleImg)), timeout]);
  tile.style.transition = REVEAL_TRANSITION;
  tile.style.opacity = '1';
}

let installed = false;

/** Idempotent — safe to import from more than one module. */
export function installDossierFaceReveal(): void {
  if (installed || typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
  installed = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        const tiles = node.matches('.fe-party__face')
          ? [node]
          : Array.from(node.querySelectorAll('.fe-party__face'));
        for (const tile of tiles) {
          if (!(tile instanceof HTMLElement)) continue;
          tile.setAttribute('style', HIDE_STYLE);
          void revealWhenReady(tile);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
