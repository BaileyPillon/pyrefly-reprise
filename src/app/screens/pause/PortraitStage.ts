/**
 * The painting, and only the painting.
 *
 * One full-bleed painted close-up per party member, graded dark with the warm
 * ink-and-gold grade B Bailey picked on 21 Sep 2026 (*"B, yes, yes, yes"*).
 * **The masters are never edited** — the grade, the tint, the vignette and the
 * grain are CSS layers over an untouched `public/art/pause/<id>.2x.webp`
 * (AGENTS.md hard rule 8, and `docs/target/approved-hashes.json`).
 *
 * This module owns three things the layout must not have to know about:
 *
 * 1. **Which file.** The 1x plate goes on immediately so the painting starts
 *    decoding on the tick the menu opens; the 2x master and the sidecar's
 *    focal point are added when the manifest and the sidecar land. Same chain
 *    as `ui/common/chapterPanel.mountHeroArt`, per member instead of per
 *    chapter.
 * 2. **The move.** A slow push-in and a very slight drift, both of which stop
 *    dead under `Settings.reduceMotion` or `prefers-reduced-motion`.
 * 3. **The swap.** A slow cross-fade when the player changes member: the
 *    outgoing plate stays up at falling opacity while the incoming one rises,
 *    which is what the reference does and what frame (b) shows mid-fade.
 *
 * ## The living portrait
 *
 * Another agent is prototyping an animated, gaze-controllable portrait
 * (`docs/concepts/pause-until-dawn/prototype/`,
 * `docs/plans/pause-living-portraits.md`). {@link PortraitDriver} is the seam
 * it plugs into: {@link PortraitStage.attachDriver} hands it the live plate
 * element and every later call to {@link PortraitStage.setGaze},
 * {@link PortraitStage.blink} and {@link PortraitStage.setExpression} is
 * forwarded to it. With no driver attached those three are no-ops that
 * remember the last request, so the pause screen can call them today and the
 * swap costs no change to the layout, the CSS or this class's callers.
 */

import { artUrl } from '../../../engine/PaintedArt.ts';
import { loadArtManifest, pause2xUrlFor, pauseStemOf } from '../../../engine/ArtManifest.ts';
import { coverSourceWidth, pauseFocal } from '../../../ui/common/chapterPanel.ts';
import { framePlate, framingFor, type PlateFraming } from './plates.ts';
import type { Rect } from './faceClear.ts';
import { FaceFramer } from './faceFramer.ts';

/** The 1x plates the art fleet ships, and the width of their 2x masters. */
const PLATE_1X_WIDTH = 1344;
const PLATE_2X_WIDTH = 2688;

/** How long a member change takes. Slow on purpose; the reference lingers. */
export const CROSSFADE_MS = 520;

/** How long the glide lasts when a measured framing replaces an estimated one (`pause__plate--reframe`). */
const REFRAME_MS = 480;

/**
 * What a living-portrait implementation has to provide.
 *
 * Deliberately three verbs and nothing else: the prototype owns how a face is
 * rigged, and the pause screen owns where the face is. Anything that needed a
 * fourth verb would be asking the layout to know about the rig.
 */
export interface PortraitDriver {
  /** Attach to one plate element. Called again on every member change. */
  mount(plate: HTMLImageElement, plateId: string): void;
  /** Look at a point in the frame, each axis -1..1, (0, 0) straight ahead. */
  setGaze(x: number, y: number): void;
  /** One blink, now. */
  blink(): void;
  /** A named expression from the rig's own set. */
  setExpression(name: string): void;
  /** Stop and release everything. */
  dispose(): void;
}

export interface PortraitStageOptions {
  /** The element the plates are appended to (`.pause__art`). */
  root: HTMLElement;
  /** Freeze the push-in and the drift. */
  reduceMotion: boolean;
  /**
   * The chrome's boxes relative to `root`, or `null` when no member chrome is
   * up (PR-0079): the face is framed clear of whatever this returns.
   */
  chrome?: () => Rect[] | null;
}

export class PortraitStage {
  private readonly root: HTMLElement;
  private reduceMotion: boolean;
  private current: HTMLImageElement | null = null;
  private currentId: string | null = null;
  private outgoing: HTMLImageElement | null = null;
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;
  private driver: PortraitDriver | null = null;
  /** Focal points as the sidecars actually report them, once they land. */
  private readonly focals = new Map<string, { x: number; y: number }>();
  /** Remembered so a driver attached later starts from the right place. */
  private gaze: { x: number; y: number } = { x: 0, y: 0 };
  private expression = 'neutral';
  private disposed = false;
  /** Re-frames every plate when the window changes shape. */
  private resize: ResizeObserver | null = null;
  private readonly chrome: (() => Rect[] | null) | undefined;
  /** The face-cleared framing per plate and window size, kept across fixed tabs. */
  private readonly framer = new FaceFramer();

  constructor(opts: PortraitStageOptions) {
    this.root = opts.root;
    this.chrome = opts.chrome;
    this.reduceMotion = opts.reduceMotion;
    this.root.classList.toggle('pause__art--still', this.reduceMotion);
    if (typeof ResizeObserver === 'function') {
      this.resize = new ResizeObserver(() => this.layout());
      this.resize.observe(this.root);
    }
  }

  /**
   * Re-frame whatever is on screen.
   *
   * The framing is `plates.framePlate` — the same arithmetic that produced the
   * approved pictures — applied as an absolute box rather than as
   * `object-position`. `object-fit: cover` alone cannot do this: on a 16:9
   * window a 1.75 plate covers with almost no overflow, so there is nothing to
   * pan, and every face ends up dead centre whatever its sidecar says.
   */
  layout(): void {
    const rect = this.root.getBoundingClientRect();
    const w = rect.width || (typeof window === 'undefined' ? 0 : window.innerWidth);
    const h = rect.height || (typeof window === 'undefined' ? 0 : window.innerHeight);
    if (w < 1 || h < 1) return;
    for (const img of [this.current, this.outgoing]) {
      if (!img) continue;
      const id = img.dataset['plate'];
      if (!id || img.dataset['art'] === 'fallback' || img.dataset['art'] === 'missing') continue;
      this.place(img, id, w, h, img === this.current);
    }
  }

  private framingOf(plateId: string): PlateFraming {
    const live = this.focals.get(plateId);
    const base = framingFor(plateId);
    return live ? { ...base, x: live.x, y: live.y } : base;
  }

  /** The approved framing, then panned and scaled until the face clears the chrome. */
  private place(img: HTMLImageElement, id: string, w: number, h: number, live: boolean): void {
    const f = this.framingOf(id);
    const blocks = live && this.chrome ? this.chrome() : null;
    const { box, settled } = this.framer.frame(id, framePlate(f, w, h), f, w, h, blocks);
    if (settled && !this.reduceMotion) {
      img.classList.add('pause__plate--reframe');
      setTimeout(() => img.classList.remove('pause__plate--reframe'), REFRAME_MS + 60);
    }
    img.style.left = `${box.left.toFixed(1)}px`;
    img.style.top = `${box.top.toFixed(1)}px`;
    img.style.width = `${box.width.toFixed(1)}px`;
    img.style.height = `${box.height.toFixed(1)}px`;
  }

  /** The plate currently on screen, for tests and for the debug snapshot. */
  get plateId(): string | null {
    return this.currentId;
  }

  /** The live plate element, or null before the first {@link show}. */
  get plate(): HTMLImageElement | null {
    return this.current;
  }

  setReduceMotion(on: boolean): void {
    this.reduceMotion = on;
    this.root.classList.toggle('pause__art--still', on);
  }

  /**
   * Put a member's close-up up, cross-fading from whatever was there.
   *
   * Re-showing the plate already up does nothing, so re-rendering the screen
   * (a setting changed, a row moved) never restarts the push-in.
   */
  show(plateId: string, fallbackId?: string): void {
    if (this.disposed || plateId === this.currentId) return;
    const previous = this.current;

    const img = document.createElement('img');
    img.className = 'pause__plate';
    img.alt = '';
    img.decoding = 'async';
    img.dataset['plate'] = plateId;
    if (previous) img.classList.add('pause__plate--entering');
    this.root.appendChild(img);
    this.mountPlate(img, plateId, fallbackId);

    this.current = img;
    this.currentId = plateId;
    this.layout();
    this.driver?.mount(img, plateId);

    if (!previous) return;

    // The outgoing member stays up at falling opacity: that is what a
    // cross-fade looks like on the frame where it is half done.
    this.outgoing?.remove();
    this.outgoing = previous;
    previous.classList.add('pause__plate--leaving');
    // Two frames, not one: the entering class has to be painted before it is
    // removed or the browser has nothing to transition from.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => img.classList.remove('pause__plate--entering'));
    });
    if (this.fadeTimer !== null) clearTimeout(this.fadeTimer);
    this.fadeTimer = setTimeout(() => {
      previous.remove();
      if (this.outgoing === previous) this.outgoing = null;
      this.fadeTimer = null;
    }, CROSSFADE_MS);
  }

  // ------------------------------------------------------------ the seam

  /** Hand the living-portrait prototype the plate that is up. */
  attachDriver(driver: PortraitDriver): void {
    this.driver?.dispose();
    this.driver = driver;
    if (this.current && this.currentId) driver.mount(this.current, this.currentId);
    driver.setExpression(this.expression);
    driver.setGaze(this.gaze.x, this.gaze.y);
  }

  detachDriver(): void {
    this.driver?.dispose();
    this.driver = null;
  }

  /** Look at a point in the frame, each axis -1..1. No-op with no driver. */
  setGaze(x: number, y: number): void {
    this.gaze = { x, y };
    this.driver?.setGaze(x, y);
  }

  /** One blink. No-op with no driver. */
  blink(): void {
    this.driver?.blink();
  }

  /** A named expression from the rig's set. No-op with no driver. */
  setExpression(name: string): void {
    this.expression = name;
    this.driver?.setExpression(name);
  }

  /** What the driver would be starting from, for the prototype's own tests. */
  snapshot(): Record<string, unknown> {
    return {
      plate: this.currentId,
      gaze: { ...this.gaze },
      expression: this.expression,
      driver: this.driver !== null,
      reduceMotion: this.reduceMotion,
    };
  }

  dispose(): void {
    this.disposed = true;
    this.resize?.disconnect();
    this.resize = null;
    if (this.fadeTimer !== null) clearTimeout(this.fadeTimer);
    this.fadeTimer = null;
    this.detachDriver();
    this.outgoing?.remove();
    this.outgoing = null;
    this.current?.remove();
    this.current = null;
    this.currentId = null;
  }

  // ----------------------------------------------------------------- art

  /**
   * `src` first and unconditionally; the master and the focal point when they
   * can be known.
   *
   * A plate that 404s falls back to the shipped CTB portrait rather than
   * leaving a broken-image glyph — the same chain `mountHeroArt` walks, and
   * the reason three all-black FFX-2 portraits never left an empty frame.
   */
  private mountPlate(img: HTMLImageElement, plateId: string, fallbackId?: string): void {
    const url = artUrl(`art/pause/${plateId}.png`);
    const fallback = artUrl(`art/portraits/${fallbackId ?? plateId}.png`);
    img.addEventListener(
      'error',
      () => {
        if (img.getAttribute('src') === fallback) {
          img.dataset['art'] = 'missing';
          return;
        }
        img.removeAttribute('srcset');
        img.dataset['art'] = 'fallback';
        img.src = fallback;
      },
      { once: false },
    );
    img.addEventListener('load', () => {
      img.dataset['loaded'] = 'true';
    });
    img.dataset['art'] = 'plate';
    img.src = url;

    if (pauseStemOf(url) === null) return;
    const stillHere = (): boolean => img.getAttribute('src') === url;

    void loadArtManifest().then(() => {
      const retina = pause2xUrlFor(url);
      if (!retina || !stillHere()) return;
      // `sizes` before `srcset`: selection runs off whatever `sizes` says the
      // moment the candidate list arrives.
      this.applySizes(img);
      img.srcset = `${url} ${PLATE_1X_WIDTH}w, ${retina} ${PLATE_2X_WIDTH}w`;
    });

    // The sidecar is the authority; `plates.ts` carries a copy so the first
    // painted frame is already framed, and this corrects it if they ever drift.
    void pauseFocal(url).then((focal) => {
      if (!stillHere()) return;
      this.focals.set(plateId, { x: focal.x, y: focal.y });
      this.layout();
    });
  }

  private applySizes(img: HTMLImageElement): void {
    if (typeof window === 'undefined') return;
    const rect = img.getBoundingClientRect();
    const px =
      coverSourceWidth(rect.width, rect.height) || coverSourceWidth(window.innerWidth, window.innerHeight);
    if (px > 0) img.sizes = `${px}px`;
  }
}
