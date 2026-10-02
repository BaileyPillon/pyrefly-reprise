/**
 * Option C6, the Overdrive and Special splash cut-in (eye-candy options round, 2026-09-29;
 * `?fx=c` only). After the letterbox and the name slab, an approved painting slides in on a
 * -12 degree Ink & Gold slab over crisp CSS speed lines centred on the actor, holds, and clears
 * for the payoff.
 *
 * - A DOM layer between the canvas and the HUD (the screen root's first child, z-index 0), so
 *   every HUD layer and the letterbox stay above it and nothing on it is blurred or filtered.
 * - The painting is shown at no more than its own pixel size (never upscaled) and never edited:
 *   the slab only crops it with a clip.
 * - First play in a battle: the full splash. Repeats: a 250 ms flash of the splash only (the
 *   research section 7 pacing, the PR-0061 repeat budget).
 * - Confirm or Esc skips it. Reduce motion: a static 200 ms fade, no slide and no lines.
 *
 * Re-offers the goal of the `overdrive-cinematic` concept declined on 19 Sep, by another method
 * (a beat, not the four-cut camera). Game case: FFX an ivory slab with gold rules and ink lines;
 * FFX-2 a pink slab with 8 px corners and four-point stars.
 */

import './overdrive-splash.css';

/**
 * Set on `<html>` for exactly the splash's lifetime. `overdrive-splash.css` keys the HUD panels that
 * would print through the band and its title on it (VP-1001-32, VP-1001-33, VP-1001-36; both games).
 */
export const SPLASH_LIVE_CLASS = 'fxc-splash-live';

export interface SplashPlay {
  /** The painting's URL, or null for the slab and lines only. */
  art: string | null;
  name: string;
  /** The actor's screen point in CSS px relative to the layer, for the speed lines' centre. */
  at: { x: number; y: number } | null;
  mode: 'full' | 'repeat' | 'calm';
  /** Low effects: the lines hold still. */
  staticLines: boolean;
  holdMs: number;
  /** The painting enters from this side (the party is on the left in both games). */
  from: 'left' | 'right';
}

export class OverdriveSplashLayer {
  readonly el: HTMLElement;
  private readonly lines: HTMLElement;
  private readonly art: HTMLImageElement;
  private readonly title: HTMLElement;
  private readonly cache = new Map<string, HTMLImageElement>();
  private finish: (() => void) | null = null;
  private timers: number[] = [];
  private readonly onKey = (e: KeyboardEvent): void => {
    if (!this.finish) return;
    if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ' || e.key === 'z' || e.key === 'x') this.stop();
  };

  constructor(root: HTMLElement, readonly game: 'ffx' | 'ffx2') {
    this.el = document.createElement('div');
    this.el.className = `fxc-splash fxc-splash--${game}`;
    this.el.setAttribute('aria-hidden', 'true');
    this.el.innerHTML =
      '<div class="fxc-splash__lines"></div><div class="fxc-splash__slab"><div class="fxc-splash__rule"></div>' +
      '<div class="fxc-splash__rule fxc-splash__rule--b"></div><div class="fxc-splash__stars"></div></div>' +
      '<img class="fxc-splash__art" alt="" draggable="false"><div class="fxc-splash__title"></div>';
    this.lines = this.el.querySelector('.fxc-splash__lines')!;
    this.art = this.el.querySelector('.fxc-splash__art')!;
    this.title = this.el.querySelector('.fxc-splash__title')!;
    if (game === 'ffx2') {
      const stars = this.el.querySelector('.fxc-splash__stars')!;
      for (let i = 0; i < 9; i++) {
        const s = document.createElement('i');
        s.style.left = `${6 + i * 11 + ((i * 37) % 7)}%`;
        s.style.top = `${i % 2 ? 8 + ((i * 13) % 20) : 70 + ((i * 17) % 22)}%`;
        s.style.setProperty('--s', `${10 + ((i * 29) % 14)}px`);
        s.style.animationDelay = `${i * 40}ms`;
        stars.appendChild(s);
      }
    }
    // First in the screen root at z-index 0: above the canvas, under every HUD layer that follows it.
    root.insertBefore(this.el, root.firstChild);
    this.art.addEventListener('error', () => (this.art.hidden = true));
    window.addEventListener('keydown', this.onKey, true);
  }

  /** Start loading a painting now, so the first splash does not wait on the network. */
  preload(url: string): void {
    if (this.cache.has(url)) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    this.cache.set(url, img);
  }

  get visible(): boolean {
    return this.finish !== null;
  }

  play(p: SplashPlay): Promise<void> {
    this.stop();
    const el = this.el;
    el.dataset['mode'] = p.mode;
    el.dataset['from'] = p.from;
    el.classList.toggle('fxc-splash--static', p.staticLines || p.mode === 'calm');
    const at = p.at ?? { x: el.clientWidth * 0.3, y: el.clientHeight * 0.55 };
    this.lines.style.setProperty('--cx', `${at.x.toFixed(0)}px`);
    this.lines.style.setProperty('--cy', `${at.y.toFixed(0)}px`);
    this.title.textContent = p.name.toUpperCase();
    if (p.art) {
      this.preload(p.art);
      this.art.src = p.art;
      const src = this.cache.get(p.art)!;
      const natW = src.naturalWidth || 1024;
      const natH = src.naturalHeight || 1024;
      // Never above the painting's own pixel size (no upscale), and inside the frame.
      const h = Math.min(natH, el.clientHeight * 0.92);
      this.art.style.height = `${h.toFixed(0)}px`;
      this.art.style.maxWidth = `${natW}px`;
      this.art.hidden = false;
    } else this.art.hidden = true;
    const total = p.mode === 'full' ? p.holdMs + 180 + 170 : p.mode === 'repeat' ? 250 : 200;
    el.classList.remove('is-in', 'is-out');
    void el.offsetWidth;
    el.classList.add('is-on', 'is-in');
    document.documentElement.classList.add(SPLASH_LIVE_CLASS);
    return new Promise<void>((resolve) => {
      this.finish = (): void => {
        this.finish = null;
        document.documentElement.classList.remove(SPLASH_LIVE_CLASS);
        for (const t of this.timers) clearTimeout(t);
        this.timers = [];
        el.classList.remove('is-on', 'is-in', 'is-out');
        resolve();
      };
      if (p.mode === 'full') this.timers.push(window.setTimeout(() => el.classList.add('is-out'), total - 170));
      this.timers.push(window.setTimeout(() => this.finish?.(), total));
    });
  }

  /** End the splash now (Confirm or Esc, the battle leaving, or the option switched off). */
  stop(): void {
    this.finish?.();
  }

  /** Captures only: hold the splash at its hold frame. */
  pinForCapture(on: boolean): void {
    this.el.classList.toggle('is-pinned', on);
    if (!this.finish) return;
    for (const t of this.timers) clearTimeout(t);
    this.timers = on ? [] : [window.setTimeout(() => this.finish?.(), 200)];
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('keydown', this.onKey, true);
    this.el.remove();
  }
}
