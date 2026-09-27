/**
 * The machinery every battle entry shares (A-2; both games): hold the frame
 * the player was looking at, swap the screens under it, then play the way it
 * leaves.
 *
 * 1. The outgoing frame is copied from the game canvas (the renderer keeps
 *    its drawing buffer, `Renderer.ts`) onto a full-screen 2D canvas. The DOM
 *    chrome (a dialogue box, the prep menu) is not in it, which is what the
 *    concept asked for: chrome never sits unbroken over breaking paint.
 * 2. The overlay covers the frame, so `onCover` swaps screens beneath it at
 *    once, and `whileCovered` (A-3's loading card) runs while the battle loads.
 * 3. `outro(t)` draws the leaving, `t` in 0..1 over `outMs`. A fresh Confirm
 *    press (not the key still held from the scene skip) jumps to the end.
 *
 * No `three`: the copy is a `drawImage` of the canvas element.
 */

import './transitions.css';

export interface EntryHooks {
  /** Swap screens under the held frame. May return a promise; the leaving waits for it. */
  onCover?: () => void | Promise<void>;
  /** Runs while the frame is held and the battle loads (A-3's loading card). */
  whileCovered?: (settled: Promise<unknown>) => Promise<void>;
  /** The canvas to copy the outgoing frame from; the document's first canvas by default. */
  source?: HTMLCanvasElement | null;
}

export interface EntryPlayer {
  /** Paint the held frame: before the swap, and each step of the leaving. `t` 0..1. */
  outro(ctx: CanvasRenderingContext2D, frame: CanvasImageSource, t: number, w: number, h: number): void;
  /** A beat played on the held frame before the leaving waits for the load (the crack, the blur). */
  intro?(ctx: CanvasRenderingContext2D, frame: CanvasImageSource, t: number, w: number, h: number): void;
  introMs: number;
  outMs: number;
  /** A class for the overlay element (per transition), for its CSS. */
  className: string;
}

/** A Confirm press made after the leaving began: Enter, Space or Z, never a held key's repeat. */
function freshConfirm(win: Window): { pressed: Promise<void>; dispose(): void } {
  let resolve: () => void = () => {};
  const pressed = new Promise<void>((r) => (resolve = r));
  const onKey = (e: KeyboardEvent): void => {
    if (!e.repeat && (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z')) resolve();
  };
  win.addEventListener('keydown', onKey, true);
  return { pressed, dispose: () => win.removeEventListener('keydown', onKey, true) };
}

/** Copy the outgoing frame, or null when there is no readable canvas. */
export function captureFrame(doc: Document, source?: HTMLCanvasElement | null): HTMLCanvasElement | null {
  const from = source ?? doc.querySelector('canvas');
  const w = doc.defaultView?.innerWidth ?? 0;
  const h = doc.defaultView?.innerHeight ?? 0;
  if (!from || !(w > 0) || !(h > 0)) return null;
  const copy = doc.createElement('canvas');
  copy.width = w;
  copy.height = h;
  const ctx = copy.getContext('2d');
  if (!ctx) return null;
  try {
    ctx.fillStyle = '#05040a';
    ctx.fillRect(0, 0, w, h);
    const r = from.getBoundingClientRect();
    ctx.drawImage(from, r.left, r.top, r.width || w, r.height || h);
  } catch {
    return null;
  }
  paintDomPictures(doc, ctx, w, h);
  return copy;
}

/** Chrome the break leaves out: the dialogue box, the HUDs, the cards and menus. */
const CHROME = '.dbox, .ig-cmd-stack, .ffx2hud, .phud, .bstart, .pf-entry, .pf-swirl, [data-role="battle-start"]';

/**
 * A scene that is drawn in the DOM rather than the game canvas (the pre-battle
 * scenes: a painted backdrop and figure images) is painted too, best effort:
 * every visible full-bleed backdrop image and every visible picture, in
 * document order, leaving the chrome out. Text is not rasterised.
 */
function paintDomPictures(doc: Document, ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const win = doc.defaultView;
  if (!win) return;
  for (const el of doc.body.querySelectorAll<HTMLElement>('*')) {
    if (el.closest(CHROME)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 48 || r.height < 48 || r.right <= 0 || r.bottom <= 0 || r.left >= w || r.top >= h) continue;
    const cs = win.getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    try {
      if (el instanceof HTMLImageElement) {
        if (el.complete && el.naturalWidth > 0) {
          ctx.globalAlpha = Math.min(1, Number(cs.opacity) || 1);
          ctx.drawImage(el, r.left, r.top, r.width, r.height);
        }
      } else if (r.width * r.height >= w * h * 0.25) {
        const m = /url\(["']?([^"')]+)["']?\)/.exec(cs.backgroundImage);
        if (m) drawCover(doc, ctx, m[1]!, r, cs.backgroundSize);
      }
    } catch {
      /* a picture that cannot be drawn is left out */
    } finally {
      ctx.globalAlpha = 1;
    }
  }
}

/** Draw an already-loaded backdrop image the way `background-size` lays it out (cover, contain or stretch). */
function drawCover(doc: Document, ctx: CanvasRenderingContext2D, url: string, r: DOMRect, size: string): void {
  const img = doc.createElement('img');
  img.src = url;
  if (!img.complete || !(img.naturalWidth > 0)) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  let dw = r.width;
  let dh = r.height;
  if (size === 'cover' || size === 'contain') {
    const k = size === 'cover' ? Math.max(r.width / iw, r.height / ih) : Math.min(r.width / iw, r.height / ih);
    dw = iw * k;
    dh = ih * k;
  }
  ctx.drawImage(img, r.left + (r.width - dw) / 2, r.top + (r.height - dh) / 2, dw, dh);
}

const frameWait = (win: Window): Promise<number> =>
  new Promise((resolve) => (typeof win.requestAnimationFrame === 'function' ? win.requestAnimationFrame(resolve) : setTimeout(() => resolve(performance.now()), 16)));

/** Play `player` over `root`. Resolves when the overlay is gone. */
export async function playEntry(root: HTMLElement, player: EntryPlayer, hooks: EntryHooks): Promise<void> {
  const doc = root.ownerDocument;
  const win = doc.defaultView ?? window;
  const frame = captureFrame(doc, hooks.source);
  const el = doc.createElement('canvas');
  el.className = `pf-entry ${player.className}`;
  el.width = frame?.width ?? Math.max(1, win.innerWidth);
  el.height = frame?.height ?? Math.max(1, win.innerHeight);
  const ctx = el.getContext('2d');
  const image: CanvasImageSource = frame ?? el;
  const paint = (fn: EntryPlayer['outro'] | undefined, t: number): void => {
    if (!ctx || !fn) return;
    ctx.save();
    fn(ctx, image, t, el.width, el.height);
    ctx.restore();
  };
  paint(player.intro ?? player.outro, 0);
  root.appendChild(el);

  const settled = Promise.resolve().then(() => hooks.onCover?.());
  const loading = (hooks.whileCovered ? hooks.whileCovered(settled) : settled).catch(() => undefined);

  // The intro beat plays on the held frame while the battle loads.
  const t0 = performance.now();
  while (player.intro && performance.now() - t0 < player.introMs) {
    await frameWait(win);
    paint(player.intro, Math.min(1, (performance.now() - t0) / player.introMs));
  }
  if (player.intro) paint(player.intro, 1);
  await loading;

  const confirm = freshConfirm(win);
  let skipped = false;
  void confirm.pressed.then(() => (skipped = true));
  const t1 = performance.now();
  try {
    for (;;) {
      const t = skipped ? 1 : Math.min(1, (performance.now() - t1) / Math.max(1, player.outMs));
      paint(player.outro, t);
      if (t >= 1) break;
      await frameWait(win);
    }
  } finally {
    confirm.dispose();
    el.remove();
  }
}
