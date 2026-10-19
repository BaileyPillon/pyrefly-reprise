/**
 * What opens from the title's hint row: the CHANGELOG panel and, behind its switch, the BEHIND THE SCENES page.
 *
 * Bailey, 2026-10-08, option A of the measured mock-up: L (or a click or a tap on the entry) opens the changelog over the
 * dimmed title; Up, Down, PageUp and PageDown scroll it; Esc, Enter or the same letter closes it, and Enter inside it
 * never starts the game. While it is open it owns the keyboard EXCLUSIVELY (`Input.claimKeyboard`, the briefing's
 * pattern): the screen behind reads no key, no abstract button and no click action, so the press that closes it cannot
 * also begin the game. Pointer input reaches it through its own click handler, because `Input` hands a screen no action
 * while an exclusive claim is held (`data-info-act`, not `data-action`).
 *
 * BEHIND THE SCENES (T) is the same shell with a different body, and exists only while `BTS_LIVE` is true
 * (`changelog/behindTheScenes.ts`, off until Bailey approves the finished page). The page's code is reached from exactly
 * one place in this file, a dynamic `import()` inside `if (btsBuilt)`; `vite.config.ts` defines `__PYREFLY_BTS__` from the
 * same constant, so a build with the switch off sees a literal `false` there, drops the branch before it looks for chunks,
 * and ships neither the page, its words, its styles nor its pictures (`tests/unit/behind-the-scenes-off.test.ts` bundles
 * this file the way the build does and proves it).
 *
 * Not built, as in the mock-up: a gamepad button to open it. The pad is silent while the panel is open.
 *
 * Game case: both (the title is the front door of FFX and FFX-2 alike).
 */

import './title-info.css';
import type { App } from '../../App.ts';
import { BTS_LIVE } from '../../changelog/behindTheScenes.ts';
import type { BehindTheScenesPage } from '../../behindTheScenes/index.ts';
import { CHANGELOG_KEY, changelogPanelHtml } from './titleInfoHtml.ts';

export type InfoKind = 'changelog' | 'bts';

/** The page's code, as the dynamic import hands it back (a type only: nothing is imported by this line). */
type BehindTheScenesModule = typeof import('../../behindTheScenes/index.ts');

/** Set from `BTS_LIVE` by `vite.config.ts` for every build and dev server; absent under vitest, where the constant itself decides. */
declare const __PYREFLY_BTS__: boolean | undefined;
const btsBuilt: boolean = typeof __PYREFLY_BTS__ === 'undefined' ? BTS_LIVE : __PYREFLY_BTS__;

/** The game's own cancel keys (`Input.KEY_MAP`): Escape, X and Backspace. */
const CANCEL_KEYS: ReadonlySet<string> = new Set(['Escape', 'KeyX', 'Backspace']);
/** The game's own confirm keys: Enter, the numpad's Enter, Space and Z. Inside the panel they close it. */
const CONFIRM_KEYS: ReadonlySet<string> = new Set(['Enter', 'NumpadEnter', 'Space', 'KeyZ']);

/** One Up or Down press scrolls this many pixels (the measured mock-up's step). */
const SCROLL_STEP = 72;

export class TitleInfo {
  private readonly root: HTMLElement;
  private readonly app: App;
  private readonly reduceMotion: () => boolean;
  private readonly isBusy: () => boolean;
  private overlay: HTMLElement | null = null;
  private kind: InfoKind | null = null;
  private releaseKeyboard: (() => void) | null = null;
  private page: BehindTheScenesPage | null = null;
  private previousFocus: HTMLElement | null = null;
  /** The page's code is on its way (the first T). */
  private pending = false;
  private disposed = false;

  /**
   * @param reduceMotion the player's REDUCE MOTION choice, read when the page needs it
   * @param isBusy true while the title is already leaving (the wipe to the chapter board has begun): nothing opens then
   */
  constructor(root: HTMLElement, app: App, reduceMotion: () => boolean = () => false, isBusy: () => boolean = () => false) {
    this.root = root;
    this.app = app;
    this.reduceMotion = reduceMotion;
    this.isBusy = isBusy;
  }

  /** Which panel is up, or null. */
  get openKind(): InfoKind | null {
    return this.kind;
  }

  /** Open one panel. Nothing happens while one is already up, or for BEHIND THE SCENES while its switch is off. */
  open(kind: InfoKind): void {
    if (this.overlay !== null || this.pending || this.disposed || this.isBusy()) return;
    if (kind === 'changelog') {
      this.show('changelog', changelogPanelHtml(), null);
    } else if (btsBuilt) {
      // The only reference to the page in this file: with the switch off, this block and the chunk behind it are gone.
      this.pending = true;
      void import('../../behindTheScenes/index.ts').then(
        (mod) => {
          this.pending = false;
          if (this.overlay === null && !this.disposed && !this.isBusy()) this.show('bts', mod.behindTheScenesHtml(), mod);
        },
        () => {
          // A chunk that cannot load leaves the title exactly as it was.
          this.pending = false;
        },
      );
    }
  }

  private show(kind: InfoKind, html: string, mod: BehindTheScenesModule | null): void {
    const overlay = document.createElement('div');
    overlay.className = `fe-info fe-info--${kind}`;
    overlay.dataset['infoKind'] = kind;
    overlay.innerHTML = html;
    this.kind = kind;
    this.overlay = overlay;
    const active = document.activeElement;
    this.previousFocus = active instanceof HTMLElement && this.root.contains(active) ? active : null;
    this.root.appendChild(overlay);
    overlay.addEventListener('click', this.onOverlayClick);
    this.page = mod ? mod.mountBehindTheScenes(overlay, { close: () => this.close(), reduceMotion: this.reduceMotion }) : null;
    this.releaseKeyboard = this.app.input?.claimKeyboard?.(this.onClaimedKey, { exclusive: true }) ?? null;
    this.scroller()?.focus({ preventScroll: true });
  }

  /** Close the panel that is up (no-op when none is), hand the keyboard back and give focus back to where it was. */
  close(): void {
    const overlay = this.overlay;
    if (overlay === null) return;
    overlay.removeEventListener('click', this.onOverlayClick);
    this.page?.dispose();
    this.page = null;
    overlay.remove();
    this.overlay = null;
    this.kind = null;
    this.releaseKeyboard?.();
    this.releaseKeyboard = null;
    const back = this.previousFocus;
    this.previousFocus = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
  }

  /** The screen is leaving: close whatever is up and leave nothing claimed. */
  dispose(): void {
    this.disposed = true;
    this.previousFocus = null;
    this.close();
  }

  snapshot(): Record<string, unknown> {
    return { open: this.kind, claimed: this.releaseKeyboard !== null };
  }

  private scroller(): HTMLElement | null {
    return this.overlay?.querySelector<HTMLElement>('[data-role="info-scroll"]') ?? null;
  }

  private readonly onOverlayClick = (e: Event): void => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-info-act]');
    if (el?.dataset['infoAct'] === 'close') this.close();
  };

  /** Every key while a panel is up (`Input` calls this from its capture-phase listener and swallows the event). */
  private readonly onClaimedKey = (e: KeyboardEvent): void => {
    const code = e.code;
    if (CANCEL_KEYS.has(code)) {
      e.preventDefault();
      this.close();
      return;
    }
    if (this.kind === 'changelog') {
      if (CONFIRM_KEYS.has(code) || code === CHANGELOG_KEY) {
        e.preventDefault();
        // A held key repeats: the first press closes, and the repeats that follow must not open it again or scroll.
        if (!e.repeat) this.close();
        return;
      }
      const s = this.scroller();
      if (!s) return;
      const page = Math.max(80, s.clientHeight - 60);
      if (code === 'ArrowUp' || code === 'KeyW') s.scrollBy({ top: -SCROLL_STEP });
      else if (code === 'ArrowDown' || code === 'KeyS') s.scrollBy({ top: SCROLL_STEP });
      else if (code === 'PageUp' || code === 'KeyF') s.scrollBy({ top: -page });
      else if (code === 'PageDown' || code === 'KeyR') s.scrollBy({ top: page });
      return;
    }
    this.page?.onKey(e);
  };
}
